/**
 * stripe-webhook.js — SUNTREX Stripe Webhook Handler
 *
 * Handles all Stripe events relevant to SUNTREX.
 * Signature verification is MANDATORY — raw body required.
 *
 * Events handled:
 *   payment_intent.succeeded     → Mark order PAID, notify buyer + seller
 *   payment_intent.payment_failed → Mark order FAILED, notify buyer
 *   charge.dispute.created       → Mark order DISPUTED, alert admin
 *   charge.dispute.closed        → Resolve dispute, update order
 *   charge.refunded              → Mark order REFUNDED or PARTIAL
 *   account.updated              → Sync seller KYC status (charges/payouts enabled)
 *   transfer.created             → Log seller payout
 */

const { createClient } = require("@supabase/supabase-js");

let stripeClient = null;
let supabaseAdmin = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  stripeClient = require("stripe")(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
  return stripeClient;
}

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // bypasses RLS — server-only
  );
  return supabaseAdmin;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let stripe;
  let supabase;
  try {
    stripe = getStripeClient();
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("[webhook] Init error:", err.message);
    return { statusCode: 500, body: "Stripe webhook is not configured" };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] Missing STRIPE_WEBHOOK_SECRET");
    return { statusCode: 500, body: "Webhook secret not configured" };
  }

  // ── Signature verification (MANDATORY) ──
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  if (!sig) {
    return { statusCode: 400, body: "Webhook Error: Missing stripe-signature header" };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody, // raw body — NOT parsed JSON
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log(`[webhook] Received event: ${stripeEvent.type} | id: ${stripeEvent.id}`);

  try {
    switch (stripeEvent.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(supabase, stripeEvent.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(supabase, stripeEvent.data.object);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(supabase, stripeEvent.data.object);
        break;

      case "charge.dispute.closed":
        await handleDisputeClosed(supabase, stripeEvent.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(supabase, stripeEvent.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(supabase, stripeEvent.data.object);
        break;

      case "transfer.created":
        await handleTransferCreated(supabase, stripeEvent.data.object);
        break;

      default:
        // Unhandled events are acknowledged (200) but not processed
        console.log(`[webhook] Unhandled event type: ${stripeEvent.type}`);
    }
  } catch (err) {
    // Log but still return 200 — Stripe will not retry on 200
    // For critical failures we use internal alerting (Phase 2: Sentry)
    console.error(`[webhook] Handler error for ${stripeEvent.type}:`, err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

/* ══════════════════════════════════════════════════
   payment_intent.succeeded
   → Update Order status to "paid"
   → Log transaction audit row
   → Notify buyer + seller
   ══════════════════════════════════════════════════ */
async function handlePaymentSucceeded(supabase, paymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) {
    console.warn("[webhook] payment_intent.succeeded — no order_id in metadata");
    return;
  }

  // Update order
  const { error: orderErr } = await supabase
    .from("Order")
    .update({
      status: "paid",
      payment_intent_id: paymentIntent.id,
      charge_id: paymentIntent.latest_charge,
      amount: paymentIntent.amount,
      fee: paymentIntent.application_fee_amount,
      currency: paymentIntent.currency,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (orderErr) {
    console.error("[webhook] Failed to update Order to paid:", orderErr);
    throw orderErr;
  }

  // Fetch buyer_id + seller_id for notifications
  const { data: order } = await supabase
    .from("Order")
    .select("buyer_id, seller_id")
    .eq("id", orderId)
    .single();

  if (order) {
    await Promise.all([
      createNotification(supabase, order.buyer_id, "payment_confirmed", {
        order_id: orderId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
      createNotification(supabase, order.seller_id, "new_order_paid", {
        order_id: orderId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }),
    ]);
  }

  console.log(`[webhook] Order ${orderId} marked as PAID`);
}

/* ══════════════════════════════════════════════════
   payment_intent.payment_failed
   → Update Order status to "failed"
   → Notify buyer
   ══════════════════════════════════════════════════ */
async function handlePaymentFailed(supabase, paymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) return;

  const failureReason =
    paymentIntent.last_payment_error?.message || "Payment failed";

  await supabase
    .from("Order")
    .update({
      status: "failed",
      payment_intent_id: paymentIntent.id,
      failure_reason: failureReason,
    })
    .eq("id", orderId);

  // Notify buyer
  const { data: order } = await supabase
    .from("Order")
    .select("buyer_id")
    .eq("id", orderId)
    .single();

  if (order?.buyer_id) {
    await createNotification(supabase, order.buyer_id, "payment_failed", {
      order_id: orderId,
      reason: failureReason,
    });
  }

  console.log(`[webhook] Order ${orderId} marked as FAILED`);
}

/* ══════════════════════════════════════════════════
   charge.dispute.created
   → Update Order status to "disputed"
   → Notify admin (via Notification with user_id = null or admin flag)
   ══════════════════════════════════════════════════ */
async function handleDisputeCreated(supabase, dispute) {
  const chargeId = dispute.charge;

  // Find order by charge_id
  const { data: order } = await supabase
    .from("Order")
    .select("id, buyer_id, seller_id")
    .eq("charge_id", chargeId)
    .single();

  if (!order) {
    console.warn("[webhook] dispute.created — no order found for charge:", chargeId);
    return;
  }

  await supabase
    .from("Order")
    .update({
      status: "disputed",
      dispute_id: dispute.id,
      dispute_reason: dispute.reason,
      dispute_amount: dispute.amount,
    })
    .eq("id", order.id);

  // Notify buyer and seller
  await Promise.all([
    createNotification(supabase, order.buyer_id, "dispute_opened", {
      order_id: order.id,
      dispute_reason: dispute.reason,
    }),
    createNotification(supabase, order.seller_id, "dispute_opened", {
      order_id: order.id,
      dispute_reason: dispute.reason,
    }),
  ]);

  console.log(`[webhook] Order ${order.id} marked as DISPUTED`);
}

/* ══════════════════════════════════════════════════
   charge.dispute.closed
   → Update Order status based on dispute outcome
   ══════════════════════════════════════════════════ */
async function handleDisputeClosed(supabase, dispute) {
  const chargeId = dispute.charge;

  const { data: order } = await supabase
    .from("Order")
    .select("id, buyer_id, seller_id")
    .eq("charge_id", chargeId)
    .single();

  if (!order) return;

  // "won" = seller won the dispute → funds back to seller
  // "lost" = buyer won → refund issued
  const newStatus =
    dispute.status === "won" ? "paid" :
    dispute.status === "lost" ? "refunded" :
    "disputed";

  await supabase
    .from("Order")
    .update({
      status: newStatus,
      dispute_status: dispute.status,
    })
    .eq("id", order.id);

  console.log(`[webhook] Dispute closed for order ${order.id}: ${dispute.status}`);
}

/* ══════════════════════════════════════════════════
   charge.refunded
   → Detect full vs partial refund
   → Update Order status accordingly
   ══════════════════════════════════════════════════ */
async function handleChargeRefunded(supabase, charge) {
  const { data: order } = await supabase
    .from("Order")
    .select("id, buyer_id, amount")
    .eq("charge_id", charge.id)
    .single();

  if (!order) return;

  const isFullRefund = charge.amount_refunded >= charge.amount;
  const newStatus = isFullRefund ? "refunded" : "partial_refund";

  await supabase
    .from("Order")
    .update({
      status: newStatus,
      refunded_amount: charge.amount_refunded,
    })
    .eq("id", order.id);

  await createNotification(supabase, order.buyer_id, "refund_issued", {
    order_id: order.id,
    refunded_amount: charge.amount_refunded,
    full_refund: isFullRefund,
  });

  console.log(`[webhook] Order ${order.id} ${newStatus} (${charge.amount_refunded} cents)`);
}

/* ══════════════════════════════════════════════════
   account.updated — KYC GATE (core of this branch)
   → Sync seller KYC status from Stripe to Supabase
   → If charges_enabled + payouts_enabled → "approved"
   → Allow/block listing creation based on status
   ══════════════════════════════════════════════════ */
async function handleAccountUpdated(supabase, account) {
  const companyId = account.metadata?.suntrex_company_id;

  if (!companyId) {
    console.warn("[webhook] account.updated — no suntrex_company_id in metadata");
    return;
  }

  const kyc_status = deriveKycStatus(account);

  const { error } = await supabase
    .from("Company")
    .update({
      kyc_status,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_details_submitted: account.details_submitted,
      kyc_updated_at: new Date().toISOString(),
    })
    .eq("id", companyId);

  if (error) {
    console.warn("[webhook] KYC status sync failed, retrying without kyc_status:", error.message);
    const { error: fallbackErr } = await supabase
      .from("Company")
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted,
        kyc_updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);
    if (fallbackErr) {
      console.error("[webhook] Failed to update Company KYC flags:", fallbackErr.message);
      throw fallbackErr;
    }
  }

  // Notify seller when approved
  if (kyc_status === "approved") {
    const { data: company } = await supabase
      .from("Company")
      .select("owner_id")
      .eq("id", companyId)
      .single();

    if (company?.owner_id) {
      await createNotification(supabase, company.owner_id, "kyc_approved", {
        company_id: companyId,
      });
    }
  }

  console.log(`[webhook] Company ${companyId} KYC status → ${kyc_status}`);
}

/* ══════════════════════════════════════════════════
   transfer.created
   → Log seller payout in Order
   ══════════════════════════════════════════════════ */
async function handleTransferCreated(supabase, transfer) {
  const orderId = transfer.metadata?.order_id;
  if (!orderId) return;

  await supabase
    .from("Order")
    .update({
      transfer_id: transfer.id,
      transfer_amount: transfer.amount,
      transfer_created_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  console.log(`[webhook] Transfer ${transfer.id} logged for order ${orderId}`);
}

/* ── Helper: create Notification row ── */
async function createNotification(supabase, userId, type, payload = {}) {
  if (!userId) return;

  const MESSAGES = {
    payment_confirmed: { fr: "Votre paiement a été confirmé.", en: "Your payment has been confirmed." },
    new_order_paid: { fr: "Nouvelle commande payée reçue.", en: "New paid order received." },
    payment_failed: { fr: "Votre paiement a échoué.", en: "Your payment failed." },
    dispute_opened: { fr: "Un litige a été ouvert sur votre commande.", en: "A dispute has been opened on your order." },
    refund_issued: { fr: "Un remboursement a été émis.", en: "A refund has been issued." },
    kyc_approved: { fr: "Votre compte vendeur a été approuvé. Vous pouvez maintenant publier des offres.", en: "Your seller account has been approved. You can now publish listings." },
  };

  const msg = MESSAGES[type] || { fr: type, en: type };

  const { error } = await supabase.from("Notification").insert({
    user_id: userId,
    type,
    message: msg.fr, // stored in FR, translated on client
    message_en: msg.en,
    payload: JSON.stringify(payload),
    read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[webhook] Failed to create notification:", error.message);
  }
}

/* ── Helper: derive KYC status from Stripe account object ── */
function deriveKycStatus(account) {
  if (account.charges_enabled && account.payouts_enabled) return "approved";
  if (account.requirements?.disabled_reason) return "rejected";
  if (account.details_submitted) return "in_review";
  return "pending";
}
