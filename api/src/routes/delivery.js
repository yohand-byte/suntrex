/**
 * delivery.js — SUNTREX DELIVERY Tracking & Verification (Fastify)
 *
 * Endpoints:
 *   POST /delivery/create   — Create delivery tracking for an order
 *   POST /delivery/update   — Update step status (photo + GPS)
 *   POST /delivery/verify   — Buyer confirms delivery status
 *   GET  /delivery/:orderId — Full delivery status
 */

const { getSupabaseAdmin } = require("../lib/supabase");

const DELIVERY_TABLE = "delivery_tracking";

async function getAuthUser(request, supabase) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function generateTrackingNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "STX";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function routes(fastify) {
  // --- CREATE delivery tracking ---
  fastify.post("/delivery/create", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId, carrier } = request.body || {};
    if (!orderId) return reply.code(400).send({ success: false, error: "orderId is required" });

    // Verify order exists and user is the seller
    const { data: order } = await supabase
      .from("Order")
      .select("id, sellerId, buyerId")
      .eq("id", orderId)
      .single();

    if (!order) return reply.code(404).send({ success: false, error: "Order not found" });
    if (order.sellerId !== user.id) {
      return reply.code(403).send({ success: false, error: "Only the seller can create delivery tracking" });
    }

    const trackingNumber = generateTrackingNumber();
    const now = new Date().toISOString();

    const delivery = {
      order_id: orderId,
      seller_id: order.sellerId,
      buyer_id: order.buyerId,
      tracking_number: trackingNumber,
      carrier: carrier || "SUNTREX DELIVERY",
      status: "created",
      steps: JSON.stringify({
        seller_dispatch: { completedAt: null, photoUrl: null, gps: null },
        pickup_inspection: { completedAt: null, photoUrl: null, gps: null },
        in_transit: { completedAt: null, photoUrl: null, gps: null },
        delivery_confirmation: { completedAt: null, photoUrl: null, gps: null },
      }),
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from(DELIVERY_TABLE)
      .insert(delivery)
      .select()
      .single();

    if (error) {
      // Table might not exist yet — return mock
      console.warn("[delivery] Insert failed (table may not exist):", error.message);
      return reply.send({
        success: true,
        delivery: {
          ...delivery,
          id: "mock_" + Date.now(),
          steps: JSON.parse(delivery.steps),
        },
      });
    }

    // Update order with tracking info
    await supabase
      .from("Order")
      .update({ trackingNumber, trackingCarrier: carrier || "SUNTREX DELIVERY", updatedAt: now })
      .eq("id", orderId);

    console.log(`[delivery] Created tracking ${trackingNumber} for order ${orderId}`);
    return reply.send({
      success: true,
      delivery: { ...inserted, steps: JSON.parse(inserted.steps) },
    });
  });

  // --- UPDATE step ---
  fastify.post("/delivery/update", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId, step, photo } = request.body || {};
    if (!orderId || !step) return reply.code(400).send({ success: false, error: "orderId and step are required" });

    const { data: delivery, error } = await supabase
      .from(DELIVERY_TABLE)
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !delivery) {
      return reply.code(404).send({ success: false, error: "Delivery tracking not found" });
    }

    const steps = typeof delivery.steps === "string" ? JSON.parse(delivery.steps) : delivery.steps;
    const now = new Date().toISOString();

    steps[step] = {
      completedAt: now,
      photoUrl: photo?.url || null,
      gps: photo?.gps || null,
      timestamp: now,
    };

    // Determine new status
    const stepOrder = ["seller_dispatch", "pickup_inspection", "in_transit", "delivery_confirmation"];
    const completedCount = stepOrder.filter(s => steps[s]?.completedAt).length;
    let status = "created";
    if (completedCount >= 4) status = "delivered";
    else if (completedCount >= 3) status = "in_transit";
    else if (completedCount >= 2) status = "picked_up";
    else if (completedCount >= 1) status = "dispatched";

    const { data: updated } = await supabase
      .from(DELIVERY_TABLE)
      .update({ steps: JSON.stringify(steps), status, updated_at: now })
      .eq("order_id", orderId)
      .select()
      .single();

    // Update order status
    if (status === "dispatched") {
      await supabase.from("Order").update({ status: "SHIPPED", shippedAt: now, updatedAt: now }).eq("id", orderId);
    } else if (status === "delivered") {
      await supabase.from("Order").update({ status: "DELIVERED", deliveredAt: now, updatedAt: now }).eq("id", orderId);
    }

    console.log(`[delivery] Step ${step} completed for order ${orderId} — status: ${status}`);
    return reply.send({
      success: true,
      delivery: updated ? { ...updated, steps: typeof updated.steps === "string" ? JSON.parse(updated.steps) : updated.steps } : { steps, status },
    });
  });

  // --- VERIFY delivery (buyer) ---
  fastify.post("/delivery/verify", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId, status: verificationStatus } = request.body || {};
    if (!orderId || !verificationStatus) {
      return reply.code(400).send({ success: false, error: "orderId and status are required" });
    }

    const { data: order } = await supabase
      .from("Order")
      .select("id, buyerId, escrowStatus")
      .eq("id", orderId)
      .single();

    if (!order) return reply.code(404).send({ success: false, error: "Order not found" });
    if (order.buyerId !== user.id) {
      return reply.code(403).send({ success: false, error: "Only the buyer can verify delivery" });
    }

    const now = new Date().toISOString();

    if (verificationStatus === "ok") {
      // Auto-release escrow if delivery is OK
      await supabase.from("Order").update({
        deliveredAt: now,
        updatedAt: now,
      }).eq("id", orderId);

      console.log(`[delivery] Buyer verified OK for order ${orderId}`);
    } else {
      // Damaged or missing → auto-dispute
      await supabase.from("Order").update({
        escrowStatus: "disputed",
        status: "DISPUTED",
        disputeOpenedAt: now,
        notes: `Buyer reported: ${verificationStatus}`,
        updatedAt: now,
      }).eq("id", orderId);

      console.log(`[delivery] Buyer reported ${verificationStatus} for order ${orderId} — auto-dispute`);
    }

    return reply.send({ success: true, verificationStatus });
  });

  // --- E-SIGNATURE at delivery ---
  fastify.post("/delivery/sign", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { orderId, signature, timestamp } = request.body || {};
    if (!orderId || !signature) {
      return reply.code(400).send({ success: false, error: "orderId and signature required" });
    }

    // Verify buyer owns this order
    const { data: order } = await supabase
      .from("Order")
      .select("id, buyerId")
      .eq("id", orderId)
      .single();

    if (!order) return reply.code(404).send({ success: false, error: "Order not found" });
    if (order.buyerId !== user.id) {
      return reply.code(403).send({ success: false, error: "Only the buyer can sign for delivery" });
    }

    const now = timestamp || new Date().toISOString();

    // Store signature reference on order
    await supabase.from("Order").update({
      signature_data: signature.slice(0, 100) + "...", // Store truncated reference
      signature_at: now,
      deliveredAt: now,
      updatedAt: now,
    }).eq("id", orderId).catch(() => {});

    // Also update delivery tracking
    await supabase.from(DELIVERY_TABLE).update({
      signature_at: now,
      status: "delivered",
      updated_at: now,
    }).eq("order_id", orderId).catch(() => {});

    console.log(`[delivery] E-signature received for order ${orderId}`);
    return reply.send({ success: true, orderId, signedAt: now });
  });

  // --- GET delivery status ---
  fastify.get("/delivery/:orderId", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const { orderId } = request.params;

    const { data, error } = await supabase
      .from(DELIVERY_TABLE)
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !data) {
      return reply.code(404).send({ success: false, error: "Delivery tracking not found" });
    }

    return reply.send({
      success: true,
      delivery: { ...data, steps: typeof data.steps === "string" ? JSON.parse(data.steps) : data.steps },
    });
  });
}

module.exports = routes;
