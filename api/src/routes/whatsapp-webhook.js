/**
 * whatsapp-webhook.js — SUNTREX WhatsApp Business Integration (Fastify)
 *
 * Endpoints:
 *   GET  /whatsapp/webhook  — Meta verification challenge
 *   POST /whatsapp/webhook  — Receive incoming WhatsApp messages
 *   POST /whatsapp/send     — Send a WhatsApp message (admin/system)
 */

const { getSupabaseAdmin } = require("../lib/supabase");

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "suntrex_whatsapp_verify_2026";
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function getAuthUser(request, supabase) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function routes(fastify) {
  // --- Meta Webhook Verification (GET) ---
  fastify.get("/whatsapp/webhook", async (request, reply) => {
    const mode = request.query["hub.mode"];
    const token = request.query["hub.verify_token"];
    const challenge = request.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[whatsapp] Webhook verified");
      return reply.code(200).send(challenge);
    }
    return reply.code(403).send("Verification failed");
  });

  // --- Receive Messages (POST) ---
  fastify.post("/whatsapp/webhook", async (request, reply) => {
    const body = request.body;
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return reply.code(200).send("OK");
    }

    const supabase = getSupabaseAdmin();
    const change = body.entry[0].changes[0].value;
    const messages = change.messages || [];
    const contacts = change.contacts || [];

    for (const msg of messages) {
      const from = msg.from; // phone number
      const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || from;
      const text = msg.text?.body || msg.caption || "[media]";
      const timestamp = new Date(parseInt(msg.timestamp) * 1000).toISOString();

      // Find or create conversation
      let { data: conv } = await supabase
        .from("SupportConversation")
        .select("id")
        .eq("channel", "whatsapp")
        .eq("channel_id", from)
        .eq("status", "open")
        .single();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("SupportConversation")
          .insert({
            channel: "whatsapp",
            channel_id: from,
            contact_name: contactName,
            status: "open",
            created_at: timestamp,
          })
          .select("id")
          .single();
        conv = newConv;
      }

      if (conv) {
        await supabase.from("SupportMessage").insert({
          conversation_id: conv.id,
          sender_type: "customer",
          sender_name: contactName,
          content: text,
          channel: "whatsapp",
          created_at: timestamp,
        });
      }

      console.log(`[whatsapp] Message from ${from}: ${text.slice(0, 100)}`);
    }

    return reply.code(200).send("OK");
  });

  // --- Send Message (POST, auth required) ---
  fastify.post("/whatsapp/send", async (request, reply) => {
    const supabase = getSupabaseAdmin();
    const user = await getAuthUser(request, supabase);
    if (!user) return reply.code(401).send({ success: false, error: "Unauthorized" });

    const { to, message } = request.body || {};
    if (!to || !message) {
      return reply.code(400).send({ success: false, error: "to and message are required" });
    }

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.warn("[whatsapp] WhatsApp API not configured — message not sent");
      return reply.send({ success: true, simulated: true, message: "WhatsApp not configured, message logged" });
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );
      const data = await res.json();
      console.log(`[whatsapp] Sent to ${to}:`, data);
      return reply.send({ success: true, data });
    } catch (err) {
      console.error("[whatsapp] Send failed:", err.message);
      return reply.code(500).send({ success: false, error: err.message });
    }
  });
}

module.exports = routes;
