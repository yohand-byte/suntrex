/**
 * stripe-webhook.js — SUNTREX Stripe Webhook Handler (Fastify)
 *
 * Handles all Stripe events relevant to SUNTREX.
 * Signature verification is MANDATORY — raw body required.
 *
 * Events handled:
 *   payment_intent.succeeded     -> Mark order PAID, notify buyer + seller
 *   payment_intent.payment_failed -> Mark order FAILED, notify buyer
 *   charge.dispute.created       -> Mark order DISPUTED, alert admin
 *   charge.dispute.closed        -> Resolve dispute, update order
 *   charge.refunded              -> Mark order REFUNDED or PARTIAL
 *   account.updated              -> Sync seller KYC status (charges/payouts enabled)
 *   transfer.created             -> Log seller payout
 */

const { getSupabaseAdmin } = require("../lib/supabase");
const { getStripeClient } = require("../lib/stripe");

async function routes(fastify) {
  // Need raw body for Stripe signature verification
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    function (req, body, done) {
      done(null, body);
    }
  );

  fastify.post("/stripe-webhook", async (request, reply) => {
    let stripe;
    let supabase;
    try {
      stripe = getStripeClient();
      supabase = getSupabaseAdmin();
    } catch (err) {
      console.error("[webhook] Init error:", err.message);
      return reply.code(500).send("Stripe webhook is not configured");
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[webhook] Missing STRIPE_WEBHOOK_SECRET");
      return reply.code(500).send("Webhook secret not configured");
    }

    const requireHttps = process.env.REQUIRE_WEBHOOK_HTTPS === "true" || process.env.NODE_ENV === "production";
    const forwardedProto = String(request.headers["x-forwarded-proto"] || "");
    if (requireHttps && forwardedProto) {
      const protoValues = forwardedProto.split(",").map((p) => p.trim().toLowerCase());
      if (!protoValues.includes("https")) {
        console.error("[webhook] Rejected non-HTTPS webhook request");
        return reply.code(400).send("Webhook Error: HTTPS is required");
      }
    }

    // -- Signature verification (MANDATORY) --
    const sig = String(request.headers["stripe-signature"] || "");
    if (!sig) {
      return reply.code(400).send("Webhook Error: Missing stripe-signature header");
    }

    const rawBody = request.body; // Buffer from addContentTypeParser

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody, // raw body — NOT parsed JSON
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err.message);
      return reply.code(400).send(`Webhook Error: ${err.message}`);
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
          console.log(`[webhook] Unhandled event type: ${stripeEvent.type}`);
      }
    } catch (err) {
      console.error(`[webhook] Handler error for ${stripeEvent.type}:`, err.message);
    }

    return reply.code(200).send({ received: true });
  });
}

/* payment_intent.succeeded */
async function handlePaymentSucceeded(supabase, paymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) {
    console.warn("[webhook] payment_intent.succeeded — no order_id in metadata");
    return;
  }

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

/* payment_intent.payment_failed */
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

/* charge.dispute.created */
async function handleDisputeCreated(supabase, dispute) {
  const chargeId = dispute.charge;

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

/* charge.dispute.closed */
async function handleDisputeClosed(supabase, dispute) {
  const chargeId = dispute.charge;

  const { data: order } = await supabase
    .from("Order")
    .select("id, buyer_id, seller_id")
    .eq("charge_id", chargeId)
    .single();

  if (!order) return;

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

/* charge.refunded */
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

/* account.updated — KYC GATE */
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

  console.log(`[webhook] Company ${companyId} KYC status -> ${kyc_status}`);
}

/* transfer.created */
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

/* Helper: create Notification row */
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
    message: msg.fr,
    message_en: msg.en,
    payload: JSON.stringify(payload),
    read: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[webhook] Failed to create notification:", error.message);
  }
}

/* Helper: derive KYC status from Stripe account object */
function deriveKycStatus(account) {
  if (account.charges_enabled && account.payouts_enabled) return "approved";
  if (account.requirements?.disabled_reason) return "rejected";
  if (account.details_submitted) return "in_review";
  return "pending";
}

module.exports = routes;
