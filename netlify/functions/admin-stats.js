/**
 * admin-stats.js — SUNTREX Admin Dashboard Data
 *
 * Server-side function using service_role key to fetch platform-wide stats.
 * Bypasses RLS to aggregate across all users.
 *
 * Auth: Bearer token + admin email check (ADMIN_EMAILS env var).
 *
 * Actions:
 *   overview      → KPIs, status breakdown
 *   transactions  → 20 recent with buyer/seller info
 *   sellers       → All sellers with companies + revenue
 *   monthly       → Revenue grouped by month (12 months)
 *   all           → Everything in one call
 */

const { createClient } = require("@supabase/supabase-js");

let supabaseAdmin = null;

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

const COMMISSION_RATE = 0.0475; // 4.75% platform fee

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

// Admin email check — no admin role in DB enum yet
function isAdmin(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  // Fallback: if no ADMIN_EMAILS configured, allow any authenticated user (dev mode)
  if (adminEmails.length === 0) return true;
  return adminEmails.includes((email || "").toLowerCase());
}

async function getAuthUser(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Country code → flag emoji
function countryFlag(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

// ── Fetchers ────────────────────────────────────────────────────

async function fetchOverview(supabase) {
  const [usersRes, sellersRes, buyersRes, txRes, kycPendingRes, disputedRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["seller", "both"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["buyer", "both"]),
    supabase.from("transactions").select("id, total_amount, subtotal_amount, status, created_at"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("kyc_status", "pending_review"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("status", "disputed"),
  ]);

  const txList = txRes.data || [];
  const revenue = txList.reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0);
  const commission = txList.reduce((sum, tx) => sum + Number(tx.subtotal_amount || 0) * COMMISSION_RATE, 0);

  // Status breakdown
  const byStatus = {};
  txList.forEach(tx => {
    byStatus[tx.status] = (byStatus[tx.status] || 0) + 1;
  });

  // Deliveries approximation from statuses
  const shipped = (byStatus.shipped || 0) + (byStatus.in_transit || 0);
  const delivered = byStatus.delivered || 0;
  const completed = byStatus.completed || 0;

  return {
    revenue: Math.round(revenue),
    commission: Math.round(commission * 100) / 100,
    orders: txList.length,
    avgOrder: txList.length > 0 ? Math.round(revenue / txList.length) : 0,
    activeUsers: usersRes.count || 0,
    sellers: sellersRes.count || 0,
    buyers: buyersRes.count || 0,
    pendingKyc: kycPendingRes.count || 0,
    disputes: disputedRes.count || 0,
    deliveries: {
      total: shipped + delivered + completed,
      inTransit: shipped,
      delivered: delivered + completed,
      issue: byStatus.disputed || 0,
    },
    byStatus,
  };
}

async function fetchTransactions(supabase) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, total_amount, subtotal_amount, status, created_at, buyer:profiles!transactions_buyer_id_fkey(company_name, country_code), seller:profiles!transactions_seller_id_fkey(company_name, country_code), transaction_items(product_name, qty)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error("Failed to fetch transactions: " + error.message);

  return (data || []).map((tx, i) => {
    const subtotal = Number(tx.subtotal_amount || tx.total_amount || 0);
    const total = Number(tx.total_amount || 0);
    const items = tx.transaction_items || [];
    const product = items.map(it => it.product_name + (it.qty > 1 ? " ×" + it.qty : "")).join(", ") || "-";
    const qty = items.reduce((s, it) => s + (it.qty || 0), 0);

    return {
      id: "ST-" + (3000 - i),
      realId: tx.id,
      buyer: tx.buyer?.company_name || "-",
      seller: tx.seller?.company_name || "-",
      buyerFlag: countryFlag(tx.buyer?.country_code),
      sellerFlag: countryFlag(tx.seller?.country_code),
      flag: countryFlag(tx.buyer?.country_code),
      product,
      qty,
      total: Math.round(total),
      commission: Math.round(subtotal * COMMISSION_RATE * 100) / 100,
      status: tx.status,
      date: tx.created_at?.slice(0, 10) || "",
    };
  });
}

async function fetchSellers(supabase) {
  // Get sellers with their companies
  const { data: sellers, error: sellersErr } = await supabase
    .from("profiles")
    .select("id, company_name, country_code, kyc_status, rating, rating_count, created_at, companies(legal_name, vat_verified)")
    .in("role", ["seller", "both"])
    .order("created_at", { ascending: true });

  if (sellersErr) throw new Error("Failed to fetch sellers: " + sellersErr.message);

  // Get listings count per seller
  const { data: listingsData } = await supabase
    .from("listings")
    .select("seller_id, id");

  // Get transaction revenue per seller
  const { data: txData } = await supabase
    .from("transactions")
    .select("seller_id, subtotal_amount, total_amount");

  // Aggregate listings per seller
  const listingsCount = {};
  (listingsData || []).forEach(l => {
    listingsCount[l.seller_id] = (listingsCount[l.seller_id] || 0) + 1;
  });

  // Aggregate revenue per seller
  const sellerRevenue = {};
  const sellerTxCount = {};
  (txData || []).forEach(tx => {
    const rev = Number(tx.total_amount || 0);
    sellerRevenue[tx.seller_id] = (sellerRevenue[tx.seller_id] || 0) + rev;
    sellerTxCount[tx.seller_id] = (sellerTxCount[tx.seller_id] || 0) + 1;
  });

  return (sellers || []).map(s => {
    const rev = sellerRevenue[s.id] || 0;
    const com = Math.round(rev * COMMISSION_RATE * 100) / 100;
    const products = listingsCount[s.id] || 0;
    const company = s.companies?.[0] || s.companies || {};
    const kycStatus = company.vat_verified ? "verified" : (s.kyc_status === "pending_review" ? "pending" : s.kyc_status);

    // Tier based on revenue
    let tier = "none";
    if (rev >= 80000) tier = "platinum";
    else if (rev >= 40000) tier = "gold";
    else if (rev >= 15000) tier = "silver";
    else if (rev > 0) tier = "bronze";

    return {
      id: s.id,
      name: company.legal_name || s.company_name || "-",
      country: s.country_code || "FR",
      flag: countryFlag(s.country_code),
      products,
      revenue: Math.round(rev),
      commission: com,
      kyc: kycStatus,
      tier,
      rating: Number(s.rating) || 0,
      joined: s.created_at?.slice(0, 10) || "",
    };
  });
}

async function fetchMonthly(supabase) {
  // Get all transactions for last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data, error } = await supabase
    .from("transactions")
    .select("total_amount, created_at")
    .gte("created_at", twelveMonthsAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error("Failed to fetch monthly: " + error.message);

  // Group by month
  const monthly = {};
  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

  (data || []).forEach(tx => {
    const d = new Date(tx.created_at);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const label = monthLabels[d.getMonth()] + " " + d.getFullYear();
    if (!monthly[key]) monthly[key] = { key, label, value: 0 };
    monthly[key].value += Number(tx.total_amount || 0);
  });

  // Fill missing months
  const result = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const label = monthLabels[d.getMonth()] + " " + d.getFullYear();
    result.push({
      label,
      value: Math.round(monthly[key]?.value || 0),
    });
  }

  return result;
}

// ── Handler ─────────────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS };
  }
  if (event.httpMethod !== "POST") {
    return fail(405, "Method not allowed");
  }

  try {
    const user = await getAuthUser(event);
    if (!user) return fail(401, "Unauthorized");
    if (!isAdmin(user.email)) return fail(403, "Forbidden — not an admin");

    const supabase = getSupabaseAdmin();
    const { action } = JSON.parse(event.body || "{}");

    switch (action) {
      case "overview":
        return ok({ data: await fetchOverview(supabase) });

      case "transactions":
        return ok({ data: await fetchTransactions(supabase) });

      case "sellers":
        return ok({ data: await fetchSellers(supabase) });

      case "monthly":
        return ok({ data: await fetchMonthly(supabase) });

      case "all": {
        const [overview, transactions, sellers, monthly] = await Promise.all([
          fetchOverview(supabase),
          fetchTransactions(supabase),
          fetchSellers(supabase),
          fetchMonthly(supabase),
        ]);
        return ok({ data: { kpi: overview, transactions, sellers, monthlyRevenue: monthly } });
      }

      default:
        return fail(400, "Unknown action: " + action);
    }
  } catch (err) {
    console.error("[admin-stats]", err);
    return fail(500, "Internal server error");
  }
};
