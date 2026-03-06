/**
 * escrow.js — SUNTREX Escrow System (Fastify)
 *
 * Funds are held after payment and released only when buyer confirms delivery.
 *
 * Actions:
 *   POST /escrow/hold       — Mark order escrow as held (called by webhook)
 *   POST /escrow/release     — Buyer confirms receipt → Transfer to seller
 *   POST /escrow/dispute     — Buyer reports a problem → Block transfer
 *   POST /escrow/auto-release — CRON: auto-release after 7 days with no dispute
 */

const { getSupabaseAdmin } = require("../lib/supabase");
const { getStripeClient } = require("../lib/stripe");

const AUTO_RELEASE_DAYS = 7;

async function getAuthUser(request, supabase) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function routes(fastify) {
  // --- HOLD (internal, called after payment_intent.succeeded) ---
  fastify.post("/escrow/hold", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId } = request.body || {};
    if (!orderId) return reply.code(400).send({ success: false, error: "orderId is required" });

    const { data: order, error: fetchErr } = await supabase
      .from("Order")
      .select("id, buyerId, sellerId, status")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) return reply.code(404).send({ success: false, error: "Order not found" });

    const { error: updateErr } = await supabase
      .from("Order")
      .update({
        escrowStatus: "held",
        escrowHeldAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("[escrow] Hold failed:", updateErr.message);
      return reply.code(500).send({ success: false, error: "Failed to hold escrow" });
    }

    console.log(`[escrow] Order ${orderId} escrow HELD`);
    return reply.send({ success: true, escrowStatus: "held" });
  });

  // --- RELEASE (buyer confirms receipt → transfer to seller) ---
  fastify.post("/escrow/release", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const stripe = getStripeClient();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId } = request.body || {};
    if (!orderId) return reply.code(400).send({ success: false, error: "orderId is required" });

    const { data: order, error: fetchErr } = await supabase
      .from("Order")
      .select("id, buyerId, sellerId, status, escrowStatus, stripePaymentIntentId, totalHT, commissionRate, commissionAmount, currency")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) return reply.code(404).send({ success: false, error: "Order not found" });

    // Only the buyer can release
    if (order.buyerId !== user.id) {
      return reply.code(403).send({ success: false, error: "Only the buyer can release escrow" });
    }

    if (order.escrowStatus === "released") {
      return reply.code(400).send({ success: false, error: "Escrow already released" });
    }

    if (order.escrowStatus === "disputed") {
      return reply.code(400).send({ success: false, error: "Cannot release — order is disputed" });
    }

    // Fetch seller's Stripe account
    const { data: sellerCompany } = await supabase
      .from("Company")
      .select("stripe_account_id")
      .eq("owner_id", order.sellerId)
      .single();

    if (!sellerCompany?.stripe_account_id) {
      return reply.code(400).send({ success: false, error: "Seller has no Stripe account" });
    }

    // Create Stripe Transfer to seller
    const transferAmount = Math.round((order.totalHT - order.commissionAmount) * 100);
    try {
      const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: (order.currency || "eur").toLowerCase(),
        destination: sellerCompany.stripe_account_id,
        metadata: { order_id: orderId, platform: "suntrex" },
        description: `SUNTREX — Order ${orderId} escrow release`,
      });

      await supabase
        .from("Order")
        .update({
          escrowStatus: "released",
          escrowReleasedAt: new Date().toISOString(),
          stripeTransferId: transfer.id,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", orderId);

      console.log(`[escrow] Order ${orderId} escrow RELEASED — transfer ${transfer.id}`);
      return reply.send({ success: true, escrowStatus: "released", transferId: transfer.id });
    } catch (err) {
      console.error("[escrow] Transfer failed:", err.message);
      return reply.code(500).send({ success: false, error: "Transfer failed: " + err.message });
    }
  });

  // --- DISPUTE (buyer reports a problem) ---
  fastify.post("/escrow/dispute", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId, reason } = request.body || {};
    if (!orderId) return reply.code(400).send({ success: false, error: "orderId is required" });

    const { data: order, error: fetchErr } = await supabase
      .from("Order")
      .select("id, buyerId, sellerId, escrowStatus")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) return reply.code(404).send({ success: false, error: "Order not found" });
    if (order.buyerId !== user.id) {
      return reply.code(403).send({ success: false, error: "Only the buyer can dispute" });
    }
    if (order.escrowStatus === "released") {
      return reply.code(400).send({ success: false, error: "Cannot dispute — funds already released" });
    }

    await supabase
      .from("Order")
      .update({
        escrowStatus: "disputed",
        status: "DISPUTED",
        disputeOpenedAt: new Date().toISOString(),
        notes: reason || "Buyer reported a problem",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.log(`[escrow] Order ${orderId} DISPUTED by buyer`);
    return reply.send({ success: true, escrowStatus: "disputed" });
  });

  // --- AUTO-RELEASE (CRON — releases all held orders older than 7 days) ---
  fastify.post("/escrow/auto-release", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const stripe = getStripeClient();

    // Simple API key auth for cron jobs
    const cronKey = request.headers["x-cron-key"];
    if (cronKey !== process.env.CRON_SECRET && !await getAuthUser(request, supabase)) {
      return reply.code(401).send({ success: false, error: "Unauthorized" });
    }

    const cutoff = new Date(Date.now() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error } = await supabase
      .from("Order")
      .select("id, sellerId, totalHT, commissionAmount, currency, stripePaymentIntentId")
      .eq("escrowStatus", "held")
      .lt("escrowHeldAt", cutoff);

    if (error || !orders?.length) {
      return reply.send({ success: true, released: 0, message: "No orders to auto-release" });
    }

    let released = 0;
    for (const order of orders) {
      const { data: sellerCompany } = await supabase
        .from("Company")
        .select("stripe_account_id")
        .eq("owner_id", order.sellerId)
        .single();

      if (!sellerCompany?.stripe_account_id) continue;

      const transferAmount = Math.round((order.totalHT - order.commissionAmount) * 100);
      try {
        const transfer = await stripe.transfers.create({
          amount: transferAmount,
          currency: (order.currency || "eur").toLowerCase(),
          destination: sellerCompany.stripe_account_id,
          metadata: { order_id: order.id, platform: "suntrex", auto_release: "true" },
        });

        await supabase
          .from("Order")
          .update({
            escrowStatus: "released",
            escrowReleasedAt: new Date().toISOString(),
            stripeTransferId: transfer.id,
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq("id", order.id);

        released++;
        console.log(`[escrow] Auto-released order ${order.id}`);
      } catch (err) {
        console.error(`[escrow] Auto-release failed for ${order.id}:`, err.message);
      }
    }

    return reply.send({ success: true, released, total: orders.length });
  });
}

module.exports = routes;
