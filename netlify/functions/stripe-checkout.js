/**
 * stripe-checkout.js — SUNTREX PaymentIntent Creation
 *
 * Actions:
 *   create-payment-intent → Create a Stripe PaymentIntent for an order
 *                           Amounts are ALWAYS read server-side from Supabase.
 *                           Client can only supply: listingId, quantity, deliveryMode.
 *
 * Security:
 *   - Requires valid Supabase Bearer token
 *   - Price fetched server-side — never trust client-supplied amounts
 *   - Idempotency key on every PaymentIntent creation
 *   - Validates seller KYC (charges_enabled) before allowing payment
 *   - SCA/3DS handled automatically by Stripe PaymentIntents
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
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return supabaseAdmin;
}

const SUNTREX_COMMISSION_RATE = 0.05; // 5% platform fee
const SUPPORTED_CURRENCIES = ["eur", "gbp", "chf", "pln"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const ok = (data) => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify({ success: true, ...data }),
});

const fail = (statusCode, message) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({ success: false, error: message }),
});

async function getAuthUser(event, supabase) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS };
  }

  if (event.httpMethod !== "POST") {
    return fail(405, "Method not allowed");
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error("[stripe-checkout] Init error:", err.message);
    return fail(500, "Stripe checkout is not configured");
  }

  const user = await getAuthUser(event, supabase);
  if (!user) return fail(401, "Unauthorized");

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return fail(400, "Invalid JSON");
  }

  const { action } = body;

  try {
    switch (action) {
      case "create-payment-intent":
        return await handleCreatePaymentIntent(supabase, user, body);
      default:
        return fail(400, `Unknown action: ${action}`);
    }
  } catch (err) {
    console.error("[stripe-checkout] Unhandled error:", err.message);
    return fail(500, "Internal server error");
  }
};

/* ══════════════════════════════════════════════════
   ACTION: create-payment-intent
   ══════════════════════════════════════════════════ */
async function handleCreatePaymentIntent(supabase, user, body) {
  const stripe = getStripeClient();

  const { listingId, quantity = 1, currency = "eur", deliveryMode = "standard" } = body;

  if (!listingId) return fail(400, "listingId is required");
  if (quantity < 1 || quantity > 10000) return fail(400, "Invalid quantity");

  const normalizedCurrency = currency.toLowerCase();
  if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
    return fail(400, `Unsupported currency. Use: ${SUPPORTED_CURRENCIES.join(", ")}`);
  }

  // ── 1. Fetch listing price SERVER-SIDE (never trust client) ──
  const { data: listing, error: listingErr } = await supabase
    .from("Listing")
    .select("id, product_name, price, currency, seller_company_id, is_active")
    .eq("id", listingId)
    .single();

  if (listingErr || !listing) return fail(404, "Listing not found");
  if (!listing.is_active) return fail(400, "This listing is no longer available");

  // ── 2. Fetch seller's Stripe account + KYC gate ──
  const { data: sellerCompany, error: sellerErr } = await supabase
    .from("Company")
    .select("id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, owner_id")
    .eq("id", listing.seller_company_id)
    .single();

  if (sellerErr || !sellerCompany) return fail(404, "Seller not found");

  if (!sellerCompany.stripe_account_id) {
    return fail(400, "Seller has not completed Stripe onboarding");
  }

  let chargesEnabled = Boolean(sellerCompany.stripe_charges_enabled);
  let payoutsEnabled = Boolean(sellerCompany.stripe_payouts_enabled);

  // KYC GATE — rely on Stripe account truth if local status is stale.
  if (!chargesEnabled || !payoutsEnabled) {
    const liveAccount = await stripe.accounts.retrieve(sellerCompany.stripe_account_id);
    chargesEnabled = Boolean(liveAccount.charges_enabled);
    payoutsEnabled = Boolean(liveAccount.payouts_enabled);

    if (chargesEnabled !== sellerCompany.stripe_charges_enabled || payoutsEnabled !== sellerCompany.stripe_payouts_enabled) {
      const { error: syncErr } = await supabase
        .from("Company")
        .update({
          stripe_charges_enabled: chargesEnabled,
          stripe_payouts_enabled: payoutsEnabled,
        })
        .eq("id", sellerCompany.id);
      if (syncErr) {
        console.warn("[stripe-checkout] Unable to sync seller KYC flags:", syncErr.message);
      }
    }
  }

  if (!chargesEnabled || !payoutsEnabled) {
    return fail(403, "Seller account is pending KYC verification. Payment cannot proceed.");
  }

  // ── 3. Prevent self-purchase ──
  if (sellerCompany.owner_id === user.id) {
    return fail(400, "You cannot purchase your own listing");
  }

  // ── 4. Fetch buyer's company ──
  const { data: buyerCompany } = await supabase
    .from("Company")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  // ── 5. Compute amounts in cents (platform currency = EUR) ──
  const unitPriceCents = Math.round(listing.price * 100);
  const totalCents = unitPriceCents * quantity;
  const commissionCents = Math.round(totalCents * SUNTREX_COMMISSION_RATE);

  // ── 6. Create Order row BEFORE PaymentIntent (for idempotency key) ──
  const { data: order, error: orderErr } = await supabase
    .from("Order")
    .insert({
      buyer_id: user.id,
      buyer_company_id: buyerCompany?.id || null,
      seller_id: sellerCompany.owner_id,
      seller_company_id: sellerCompany.id,
      status: "pending_payment",
      currency: normalizedCurrency,
      delivery_mode: deliveryMode,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[stripe-checkout] Failed to create Order:", orderErr);
    return fail(500, "Failed to create order");
  }

  // Insert order item
  await supabase.from("OrderItem").insert({
    order_id: order.id,
    listing_id: listingId,
    quantity,
    unit_price: listing.price,
    total_price: listing.price * quantity,
    currency: normalizedCurrency,
  });

  // ── 7. Create PaymentIntent with idempotency key ──
  const idempotencyKey = `order_${order.id}_payment_v1`;

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: totalCents,
      currency: normalizedCurrency,
      payment_method_types: ["card"],
      application_fee_amount: commissionCents,
      transfer_data: {
        destination: sellerCompany.stripe_account_id,
      },
      metadata: {
        order_id: order.id,
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerCompany.owner_id,
        quantity: String(quantity),
        platform: "suntrex",
        delivery_mode: deliveryMode,
      },
      description: `SUNTREX — ${listing.product_name} x${quantity}`,
      // SCA/3DS handled automatically by Stripe for EU cards
      automatic_payment_methods: undefined, // explicit card only for B2B
    },
    { idempotencyKey }
  );

  // ── 8. Save PaymentIntent ID on Order ──
  await supabase
    .from("Order")
    .update({ payment_intent_id: paymentIntent.id })
    .eq("id", order.id);

  return ok({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    order_id: order.id,
    amount: totalCents,
    commission: commissionCents,
    currency: normalizedCurrency,
  });
}
