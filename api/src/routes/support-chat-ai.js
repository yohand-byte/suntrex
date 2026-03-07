// SUNTREX — AI Support Chat (Fastify)
// Endpoint: POST /api/support-chat-ai

const PRODUCT_CATALOG = `SUNTREX CATALOGUE — 541 références / 15+ marques
Les PRIX sont masqués (réservés aux membres vérifiés).
Pour voir les prix → inscription gratuite sur suntrex.eu

━━━ HUAWEI (52 réf. | 36 en stock) ━━━
  HUA/BAT-BACK-1PH — Huawei Batterie Back-up box 1 phase à placer en amont du coffret AC (02406294) [1u]
  HUA/BAT-BACK-3PH — Huawei Batterie Back-up box 3 phases à placer en amont du coffret AC (02406150) [1u]
  HUA/BAT-DC-LUNA2000-C0 — Huawei Batterie Luna module/controleur de puissance DC/DC (ref LUNA2000-5KW-C0) - 01074646 [49u]
  HUA/BAT-LUNA2000-5-E0 — Huawei Batterie Luna 2000-5-E0 module de stockage 5 kW utile - Tension nominale 360V (3 ba [76u]
  HUA/DTSU666-H 100A(Three Phase) — DTSU666-H 100A(Three Phase) [10u]
  HUA/EMMA-A02 — Gestionnaire d'énergie intelligent EMMA-A02 Huawei (Ref : EMMA-A02) [4u]
  HUA/OND-15KTL-M5 — Onduleur triphasé Huawei - 15 KTL M5 (16,5 KW tri - 2MPPT) - Garantie 10 ans [rupture]
  HUA/OND-20KTL-M5 — Onduleur triphasé Huawei - 20 KTL M5 (22 KW tri - 2MPPT) - Garantie 10 ans [rupture]
  HUA/OND-30KTL-M3 — Onduleur triphasé Huawei - 30 KTL M3 (30 KW tri - 4MPPT) - Garantie 5 ans extensible [5u]
  HUA/OND-50KTL-M3 — Onduleur triphasé Huawei Sun 2000 - 50 KTL-M3 (50 KW Tri - 4 MPPT) [rupture]
  HUA/P1300-LONG — Huawei optimiseur de puissance P1300 – Smart PV Optimizer – Pose paysage - Garantie 25 ans [100u]
  HUA/P1300-SHORT — Huawei optimiseur de puissance P1300 – Smart PV Optimizer – Pose paysage - Garantie 25 ans [rupture]
  HUA/P450 — Optimiseur Huawei P450-P2 (Tension de 10 à 80V - Courant entrée max 14,5A) [1u]
  HUA/P600 — Huawei optimiseur de puissance P600 (Tension de 10 à 80V - Courant entrée max 14,5A) [10u]
  HUA/SCharger-22KT-S0 — SCharger-22KT-S0 [10u]
  HUA/SCharger-7KS-S0 — SCharger-7KS-S0 [10u]
  HUA/SMART-MONO — HUAWEI – DDSU666-H (MonoPhasé – Smart Power Sensor Mono (tores inclus) 100A) [13u]
  HUA/SMART-TRI — Huawei Smart Power Sensor (compteur d'énergie) Triphasé PS-T (DTSU666-H) 250A/50mA [15u]
  HUA/SMLOG-3000A-01EU — Huawei SmartLogger 3000A01EU, Solar Smart Monitor & Data Logger with 4G [2u]
  HUA/SUN2000-100KTL-M2 — HUAWEI - Onduleur SUN2000-100KTL-M2 (AFCI) - Onduleur triphasé 100kw 10MPPT [1u]
  HUA/SUN2000-10K-LC0 — Onduleur hybride monophasé Huawei SUN2000-10K-LC0 (10000 VA - 3 MPPT) antenne intégrée [9u]
  HUA/SUN2000-10K-MAP0 — SUN2000-10K-MAP0 [10u]
  HUA/SUN2000-10KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-10KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-12K-MAP0 — SUN2000-12K-MAP0 [7u]
  HUA/SUN2000-12K-MB0 — SUN2000-12K-MB0 [10u]
  HUA/SUN2000-15K-MB0 — SUN2000-15K-MB0 [10u]
  HUA/SUN2000-17K-MB0 — SUN2000-17K-MB0 [10u]
  HUA/SUN2000-20K-MB0 — SUN2000-20K-MB0 [9u]
  HUA/SUN2000-25K-MB0 — SUN2000-25K-MB0 [10u]
  HUA/SUN2000-2KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-2KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-3,6KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-3,6KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-3KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-3KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-3KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-3KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-4,6KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-4,6KTL-L1 - 2 MPPT [rupture]
  HUA/SUN2000-4KTL-L1 — Onduleur hybride monophasé Huawei - SUN2000-4KTL-L1 - 2MPPT [rupture]
  HUA/SUN2000-4KTL-M1 — Onduleur hybride triphasé 4kw Huawei - SUN2000-4-KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-5K-MAP0 — SUN2000-5K-MAP0 [10u]
  HUA/SUN2000-5KTL-L1 — Onduleur hybride monophasé Huawei - 5 KTL-L1 (Mono-2 MPPT) [rupture]
  HUA/SUN2000-5KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-5KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-6K-MAP0 — SUN2000-6K-MAP0 [10u]
  HUA/SUN2000-6KTL-L1 — Onduleur hybride monophasé Huawei - 6 KTL-L1 (Mono-2 MPPT) [3u]
  HUA/SUN2000-6KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-6KTL-M1 - 2 MPPT [rupture]
  HUA/SUN2000-8K-LC0 — Onduleur hybride monophasé Huawei SUN2000-8K-LC0 (8800 VA - 3 MPPT) antenne intégrée [10u]
  HUA/SUN2000-8K-MAP0 — SUN2000-8K-MAP0 [10u]
  HUA/SUN2000-8KTL-M1 — Onduleur hybride triphasé Huawei - SUN2000-8KTL-M1 - 2 MPPT [rupture]
  HUA/Smart dongle SdongleB-06-EU — Smart dongle SdongleB-06-EU [10u]
  HUA/SmartGuard-63A-S0 — SmartGuard-63A-S0 [5u]
  HUA/SmartGuard-63A-T0 — SmartGuard-63A-T0 [5u]
  HUA/SmartPS-100A-S0 — SmartPS-100A-S0 [10u]
  HUA/SmartPS-250A-T0 — SmartPS-250A-T0 Three-phase intelligent sensor [10u]
  HUA/WLAN-FE — Huawei Smart Dongle Wifi + Ethernet - WLAN-FE (Model: SDongleA-05) [36u]
  HUASmartPS-80AI-T0 — SmartPS-80AI-T0 [10u]

━━━ DEYE (38 réf. | 18 en stock) ━━━
  DEY/3U-Hrack — Armoire rack 13 unités pour batteries haute tension Deye BOS-G et BMS [1u]
  DEY/BOS-GM5.1 — Batterie Deye BOS-GM5.1 LiFePO4 - Unité de base de 5.12 kWh [26u]
  DEY/HVB750V/100A-EU — Module de contrôle BMS DEYE HVB750V/100A-EU pour batteries BOS-G, HV [3u]
  DEY/SE-G5.1Pro-B — Batterie DEYE SE-G5.1 Pro-B LiFePO4 - Unité de base de 5.12 kWh [7u]
  DEY/SUN-5K-SG03LP1-EU — Onduleur Hybride Monophasé 5Kw-6Kw Deye - 2 MPTT [7u]
  DEY/SUN-6K-SG03LP1-EU — Onduleur Hybride Monophasé 6Kw Deye - 2 MPTT [34u]
  DEY/SUN-8K-SG01LP1-EU — Onduleur Hybride Monophasé 8Kw Deye - 2 MPTT (2+2) [8u]
  DEY/SUN-8K-SG04LP3-EU — Onduleur Hybride Triphasé 8Kw bas voltage Deye - 2/1+1 MPTT [8u]
  DEY/SUN-SMART-CT01 — SUN-SMART-CT01 [100u]
  DEY/SUN-SMART-TX01 — SUN-SMART-TX01 [30u]
  DEY/SUN-XL02-A — DEYE optimiseur de puissance SUN-XL02-A (Tension de 10 à 80V) [37u]
  + 27 autres réf. (voir catalogue complet)

━━━ AUTRES MARQUES (résumé) ━━━
  Enphase: 24 réf. (19 en stock)
  HOYMILES: 48 réf. (26 en stock)
  ESDEC: 164 réf. (18 en stock)
  K2 SYSTEMS: 53 réf. (2 en stock)
  PYTES: 25 réf. (11 en stock)
  + AP Systems, SolarEdge, JORISOLAR, UZ ENERGY, Solar Speed, VaySunic, SOLARPLAST, SUNPOWER, GSE, RECOM SILLIA, DUALSUN, SUNRISE, ES Elitec, STÄUBLI, JA Solar, RENUSOL, Easy Solar Box, Heschen`;

const SYSTEM_PROMPT = `You are SUNTREX Support, the AI assistant for SUNTREX — a B2B European marketplace for photovoltaic (solar) equipment and energy storage systems.

Your role:
- Help solar installers, distributors, and professionals with their questions
- Answer questions about orders, shipping, products, payments, and technical specs
- Be knowledgeable about solar panels, inverters, batteries, mounting systems, cables
- Key brands: Huawei, Deye, Enphase, SMA, Canadian Solar, Jinko, Trina, BYD, LONGi, SolarEdge, JA Solar, Sungrow, Growatt, GoodWe
- Markets: France, Germany, Benelux, Italy, Spain

Rules:
- Respond in the same language as the user (default: French)
- Be professional, helpful, and concise
- For complex issues (disputes, returns, technical problems), suggest handoff to a human agent
- Never share internal pricing, margins, or business data
- Never process payments or share financial details
- **NEVER reveal prices, costs, or margins. If asked about a price, ALWAYS respond: "Inscrivez-vous gratuitement sur SUNTREX pour voir les prix professionnels." / "Sign up for free on SUNTREX to see professional prices."**
- If unsure, say so and offer to connect with a specialist
- Include relevant product categories when discussing products: Solar Panels, Inverters, Batteries, Mounting Systems, Electrical/Cables, E-Mobility

Product catalog capabilities:
- You can search products by SKU (e.g. "HUA/SUN2000-10K-LC0") or by name/description
- You know real-time stock status: [Xu] = X units in stock, [rupture] = out of stock
- When a product is out of stock, suggest similar alternatives from the same brand or category
- When listing products, include SKU, name, and stock status
- NEVER mention or invent prices — prices are gated and reserved for verified members

Response format:
- Keep responses under 200 words
- Use bullet points for lists
- Bold important terms with **term**

--- SUNTREX PRODUCT CATALOG ---
${PRODUCT_CATALOG}`;

const { callGemini } = require("../lib/gemini");

async function routes(fastify) {
  fastify.post("/support-chat-ai", async (request, reply) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      const { conversation_id, message, context = {} } = request.body || {};

      if (!message || !conversation_id) {
        return reply.code(400).send({ error: "Missing message or conversation_id" });
      }

      // Build conversation history for Gemini
      const contents = [
        ...(context.previousMessages || []).map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      // Call Gemini via Vertex AI
      const { text: aiText } = await callGemini({
        contents,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { maxOutputTokens: 512 },
      });

      const finalText = aiText || "Désolé, je n'ai pas pu générer une réponse.";

      // Detect if handoff is needed
      const handoffKeywords = ["litige", "dispute", "remboursement", "refund", "avocat", "lawyer", "plainte", "complaint", "urgent"];
      const needsHandoff = handoffKeywords.some((kw) => message.toLowerCase().includes(kw) || finalText.toLowerCase().includes(kw));

      // Save AI response to Supabase (server-side with service_role)
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !conversation_id.startsWith("demo-")) {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/SupportMessage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              conversation_id,
              sender_type: "ai",
              content: finalText,
              metadata: { model: "gemini-2.0-flash", provider: "vertex-ai", handoff: needsHandoff },
            }),
          });
        } catch (dbErr) {
          console.error("Failed to save AI message to Supabase:", dbErr);
        }
      }

      return reply.code(200).send({
        messages: [
          {
            id: "ai-" + Date.now(),
            text: finalText,
            handoff: needsHandoff,
          },
        ],
      });
    } catch (err) {
      console.error("Support chat AI error:", err);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });
}

module.exports = routes;
