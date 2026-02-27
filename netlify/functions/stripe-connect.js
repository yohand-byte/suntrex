/**
 * stripe-connect.js — SUNTREX Seller KYC Onboarding
 *
 * Actions:
 *   create-account        → Create Stripe Connect Express account for a seller
 *   create-onboarding-link → Get Account Link URL to complete KYC
 *   check-status          → Return charges_enabled / payouts_enabled / details_submitted
 *   refresh-link          → Regenerate an expired Account Link
 *
 * All actions require a valid Supabase Bearer token (authenticated seller).
 * The seller must have role "seller" or "buyer" upgrading to seller.
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
    process.env.SUPABASE_SERVICE_ROLE_KEY // server-side only — bypasses RLS
  );
  return supabaseAdmin;
}

const FRONTEND_URL = process.env.FRONTEND_URL || "https://suntrex.eu";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

/* ── Helpers ── */
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

/* ── Auth: verify Supabase JWT ── */
async function getAuthUser(event, supabase) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/* ── Main handler ── */
exports.handler = async (event) => {
  // Preflight
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
    console.error("[stripe-connect] Init error:", err.message);
    return fail(500, "Stripe connect is not configured");
  }

  // Authenticate
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
      case "create-account":
        return await handleCreateAccount(supabase, user);
      case "create-onboarding-link":
        return await handleCreateOnboardingLink(supabase, user);
      case "check-status":
        return await handleCheckStatus(supabase, user);
      case "refresh-link":
        return await handleRefreshLink(supabase, user);
      default:
        return fail(400, `Unknown action: ${action}`);
    }
  } catch (err) {
    console.error("[stripe-connect] Unhandled error:", err.message);
    return fail(500, "Internal server error");
  }
};

/* ══════════════════════════════════════════════════
   ACTION: create-account
   Creates a Stripe Express account for the seller.
   Stores stripe_account_id in Company table.
   ══════════════════════════════════════════════════ */
async function handleCreateAccount(supabase, user) {
  const stripe = getStripeClient();

  // Fetch company
  const { data: company, error: companyErr } = await supabase
    .from("Company")
    .select("id, name, country, vat_number, stripe_account_id, kyc_status")
    .eq("owner_id", user.id)
    .single();

  if (companyErr || !company) {
    return fail(404, "Company not found. Complete company registration first.");
  }

  // Already has a Stripe account
  if (company.stripe_account_id) {
    return ok({
      stripe_account_id: company.stripe_account_id,
      already_exists: true,
    });
  }

  // Map Supabase country code to Stripe-supported country
  const STRIPE_COUNTRY_MAP = {
    FR: "FR", DE: "DE", BE: "BE", NL: "NL", IT: "IT",
    ES: "ES", CH: "CH", AT: "AT", PL: "PL", PT: "PT",
    LU: "LU", GB: "GB",
  };
  const stripeCountry = STRIPE_COUNTRY_MAP[company.country] || "FR";

  // Create Stripe Express account
  const account = await stripe.accounts.create({
    type: "express",
    country: stripeCountry,
    email: user.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "company",
    business_profile: {
      name: company.name,
      url: `${FRONTEND_URL}/seller/${company.id}`,
      mcc: "5999", // Misc. retail
    },
    metadata: {
      suntrex_company_id: company.id,
      suntrex_user_id: user.id,
      vat_number: company.vat_number || "",
    },
    settings: {
      payouts: {
        schedule: { interval: "weekly", weekly_anchor: "monday" },
      },
    },
  });

  // Persist stripe_account_id in Company
  const { error: updateErr } = await supabase
    .from("Company")
    .update({
      stripe_account_id: account.id,
    })
    .eq("id", company.id);

  if (updateErr) {
    console.error("[stripe-connect] Failed to save stripe_account_id:", updateErr);
    // Don't fail the request — Stripe account was created, log for reconciliation
  }

  return ok({ stripe_account_id: account.id, already_exists: false });
}

/* ══════════════════════════════════════════════════
   ACTION: create-onboarding-link
   Generates a Stripe Account Link for KYC onboarding.
   Returns the URL to redirect the seller.
   ══════════════════════════════════════════════════ */
async function handleCreateOnboardingLink(supabase, user) {
  const stripe = getStripeClient();

  const { data: company, error } = await supabase
    .from("Company")
    .select("id, stripe_account_id")
    .eq("owner_id", user.id)
    .single();

  if (error || !company?.stripe_account_id) {
    return fail(400, "No Stripe account found. Call create-account first.");
  }

  const accountLink = await stripe.accountLinks.create({
    account: company.stripe_account_id,
    refresh_url: `${FRONTEND_URL}/dashboard/seller/kyc?refresh=true`,
    return_url: `${FRONTEND_URL}/dashboard/seller/kyc?success=true`,
    type: "account_onboarding",
    collection_options: {
      fields: "eventually_due",
    },
  });

  return ok({ url: accountLink.url, expires_at: accountLink.expires_at });
}

/* ══════════════════════════════════════════════════
   ACTION: check-status
   Returns KYC/capability status from Stripe.
   Also updates Company.kyc_status in Supabase.
   ══════════════════════════════════════════════════ */
async function handleCheckStatus(supabase, user) {
  const stripe = getStripeClient();

  const { data: company, error } = await supabase
    .from("Company")
    .select("id, stripe_account_id, kyc_status")
    .eq("owner_id", user.id)
    .single();

  if (error || !company) {
    return fail(404, "Company not found");
  }

  if (!company.stripe_account_id) {
    return ok({
      kyc_status: "not_started",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    });
  }

  // Fetch live status from Stripe (source of truth)
  const account = await stripe.accounts.retrieve(company.stripe_account_id);

  const kyc_status = deriveKycStatus(account);

  // Sync status back to Supabase
  if (kyc_status !== company.kyc_status) {
    const { error: syncErr } = await supabase
      .from("Company")
      .update({ kyc_status })
      .eq("id", company.id);
    if (syncErr) {
      console.warn("[stripe-connect] Unable to sync kyc_status:", syncErr.message);
    }
  }

  return ok({
    kyc_status,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements: {
      currently_due: account.requirements?.currently_due || [],
      eventually_due: account.requirements?.eventually_due || [],
      errors: account.requirements?.errors || [],
      disabled_reason: account.requirements?.disabled_reason || null,
    },
  });
}

/* ══════════════════════════════════════════════════
   ACTION: refresh-link
   Re-generates an Account Link when the previous
   one expired (Stripe links expire after ~5 min).
   ══════════════════════════════════════════════════ */
async function handleRefreshLink(supabase, user) {
  // Delegates to handleCreateOnboardingLink — same logic
  return handleCreateOnboardingLink(supabase, user);
}

/* ── Helper: derive KYC status from Stripe account ── */
function deriveKycStatus(account) {
  if (account.charges_enabled && account.payouts_enabled) return "approved";
  if (account.requirements?.disabled_reason) return "rejected";
  if (account.details_submitted) return "in_review";
  return "pending";
}
