/**
 * stripe-connect.js — SUNTREX Seller KYC Onboarding (Fastify)
 *
 * Actions:
 *   create-account        -> Create Stripe Connect Express account for a seller
 *   create-onboarding-link -> Get Account Link URL to complete KYC
 *   check-status          -> Return charges_enabled / payouts_enabled / details_submitted
 *   refresh-link          -> Regenerate an expired Account Link
 *
 * All actions require a valid Supabase Bearer token (authenticated seller).
 */

const { getSupabaseAdmin } = require("../lib/supabase");
const { getStripeClient } = require("../lib/stripe");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://suntrex.eu";

async function resolveCompanyForUser(supabase, user) {
  // Legacy schema: Company.owner_id + snake_case Stripe fields
  const legacy = await supabase
    .from("Company")
    .select("id, name, country, vat_number, stripe_account_id, kyc_status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!legacy.error && legacy.data) {
    return {
      schema: "legacy",
      id: legacy.data.id,
      name: legacy.data.name,
      country: legacy.data.country,
      vatNumber: legacy.data.vat_number || "",
      stripeAccountId: legacy.data.stripe_account_id || null,
      kycStatus: legacy.data.kyc_status || null,
    };
  }

  // Current schema: User.email -> User.companyId -> Company.id + camelCase fields
  const userRow = await supabase
    .from("User")
    .select("id, companyId, email, role")
    .eq("email", user.email)
    .maybeSingle();

  if (userRow.error || !userRow.data?.companyId) {
    return null;
  }

  const company = await supabase
    .from("Company")
    .select("id, name, country, vatNumber, stripeAccountId, kybStatus, stripeOnboardingDone")
    .eq("id", userRow.data.companyId)
    .maybeSingle();

  if (company.error || !company.data) {
    return null;
  }

  return {
    schema: "camel",
    id: company.data.id,
    name: company.data.name,
    country: company.data.country,
    vatNumber: company.data.vatNumber || "",
    stripeAccountId: company.data.stripeAccountId || null,
    kycStatus: company.data.kybStatus || null,
  };
}

async function updateCompanyAfterAccountCreate(supabase, companyRef, stripeAccountId) {
  if (companyRef.schema === "legacy") {
    const { error } = await supabase
      .from("Company")
      .update({
        stripe_account_id: stripeAccountId,
      })
      .eq("id", companyRef.id);
    return error;
  }

  const { error } = await supabase
    .from("Company")
    .update({
      stripeAccountId: stripeAccountId,
      stripeOnboardingDone: false,
    })
    .eq("id", companyRef.id);
  return error;
}

async function syncKycStatusToCompany(supabase, companyRef, kycStatus) {
  if (companyRef.schema === "legacy") {
    const { error } = await supabase
      .from("Company")
      .update({ kyc_status: kycStatus })
      .eq("id", companyRef.id);
    return error;
  }

  const kybStatus =
    kycStatus === "approved" ? "APPROVED"
      : kycStatus === "rejected" ? "REJECTED"
      : "PENDING";

  const { error } = await supabase
    .from("Company")
    .update({
      kybStatus,
      stripeOnboardingDone: kycStatus === "approved",
    })
    .eq("id", companyRef.id);
  return error;
}

async function getAuthUser(request, supabase) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function routes(fastify) {
  fastify.post("/stripe-connect", async (request, reply) => {
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch (err) {
      console.error("[stripe-connect] Init error:", err.message);
      return reply.code(500).send({ success: false, error: "Stripe connect is not configured" });
    }

    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const body = request.body || {};
    const { action } = body;

    try {
      switch (action) {
        case "create-account":
          return await handleCreateAccount(supabase, user, reply);
        case "create-onboarding-link":
          return await handleCreateOnboardingLink(supabase, user, reply);
        case "check-status":
          return await handleCheckStatus(supabase, user, reply);
        case "refresh-link":
          return await handleRefreshLink(supabase, user, reply);
        default:
          return reply.code(400).send({ success: false, error: `Unknown action: ${action}` });
      }
    } catch (err) {
      console.error("[stripe-connect] Unhandled error:", err.message);
      return reply.code(500).send({ success: false, error: "Internal server error" });
    }
  });
}

async function handleCreateAccount(supabase, user, reply) {
  const stripe = getStripeClient();

  const company = await resolveCompanyForUser(supabase, user);
  if (!company) {
    return reply.code(404).send({ success: false, error: "Company not found. Complete company registration first." });
  }

  if (company.stripeAccountId) {
    return reply.code(200).send({
      success: true,
      stripe_account_id: company.stripeAccountId,
      already_exists: true,
    });
  }

  const STRIPE_COUNTRY_MAP = {
    FR: "FR", DE: "DE", BE: "BE", NL: "NL", IT: "IT",
    ES: "ES", CH: "CH", AT: "AT", PL: "PL", PT: "PT",
    LU: "LU", GB: "GB",
  };
  const stripeCountry = STRIPE_COUNTRY_MAP[company.country] || "FR";

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
      mcc: "5999",
    },
    metadata: {
      suntrex_company_id: company.id,
      suntrex_user_id: user.id,
      vat_number: company.vatNumber || "",
    },
    settings: {
      payouts: {
        schedule: { interval: "weekly", weekly_anchor: "monday" },
      },
    },
  });

  const updateErr = await updateCompanyAfterAccountCreate(supabase, company, account.id);

  if (updateErr) {
    console.error("[stripe-connect] Failed to save stripe_account_id:", updateErr);
  }

  return reply.code(200).send({ success: true, stripe_account_id: account.id, already_exists: false });
}

async function handleCreateOnboardingLink(supabase, user, reply) {
  const stripe = getStripeClient();

  const company = await resolveCompanyForUser(supabase, user);
  if (!company?.stripeAccountId) {
    return reply.code(400).send({ success: false, error: "No Stripe account found. Call create-account first." });
  }

  const accountLink = await stripe.accountLinks.create({
    account: company.stripeAccountId,
    refresh_url: `${FRONTEND_URL}/dashboard/seller/kyc?refresh=true`,
    return_url: `${FRONTEND_URL}/dashboard/seller/kyc?success=true`,
    type: "account_onboarding",
    collection_options: {
      fields: "eventually_due",
    },
  });

  return reply.code(200).send({ success: true, url: accountLink.url, expires_at: accountLink.expires_at });
}

async function handleCheckStatus(supabase, user, reply) {
  const stripe = getStripeClient();

  const company = await resolveCompanyForUser(supabase, user);
  if (!company) {
    return reply.code(404).send({ success: false, error: "Company not found" });
  }

  if (!company.stripeAccountId) {
    return reply.code(200).send({
      success: true,
      kyc_status: "not_started",
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    });
  }

  const account = await stripe.accounts.retrieve(company.stripeAccountId);

  const kyc_status = deriveKycStatus(account);

  if (kyc_status !== company.kycStatus) {
    const syncErr = await syncKycStatusToCompany(supabase, company, kyc_status);
    if (syncErr) {
      console.warn("[stripe-connect] Unable to sync kyc_status:", syncErr.message);
    }
  }

  return reply.code(200).send({
    success: true,
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

async function handleRefreshLink(supabase, user, reply) {
  return handleCreateOnboardingLink(supabase, user, reply);
}

function deriveKycStatus(account) {
  if (account.charges_enabled && account.payouts_enabled) return "approved";
  if (account.requirements?.disabled_reason) return "rejected";
  if (account.details_submitted) return "in_review";
  return "pending";
}

module.exports = routes;
