// ═══════════════════════════════════════════════════════════════
// SUNTREX — AI Support Chat (Vercel Serverless Function)
// Endpoint: POST /api/support-chat-ai
// ═══════════════════════════════════════════════════════════════

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
- If unsure, say so and offer to connect with a specialist
- Include relevant product categories when discussing products: Solar Panels, Inverters, Batteries, Mounting Systems, Electrical/Cables, E-Mobility

Response format:
- Keep responses under 200 words
- Use bullet points for lists
- Bold important terms with **term**`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { conversation_id, message, context = {} } = req.body;

    if (!message || !conversation_id) {
      return res.status(400).json({ error: 'Missing message or conversation_id' });
    }

    // Build conversation history
    const previousMessages = (context.previousMessages || []).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));
    previousMessages.push({ role: 'user', content: message });

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: previousMessages,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Anthropic API error:', response.status, errData);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const aiText = data.content?.[0]?.text || "Désolé, je n'ai pas pu générer une réponse.";

    // Detect handoff needs
    const handoffKeywords = ['litige', 'dispute', 'remboursement', 'refund', 'avocat', 'lawyer', 'plainte', 'complaint', 'urgent'];
    const needsHandoff = handoffKeywords.some((kw) => message.toLowerCase().includes(kw) || aiText.toLowerCase().includes(kw));

    // Save AI response to Supabase (server-side)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !conversation_id.startsWith('demo-')) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/SupportMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            conversation_id,
            sender_type: 'ai',
            content: aiText,
            metadata: { model: 'claude-sonnet-4-20250514', handoff: needsHandoff },
          }),
        });
      } catch (dbErr) {
        console.error('Failed to save AI message to Supabase:', dbErr);
      }
    }

    return res.status(200).json({
      messages: [
        {
          id: 'ai-' + Date.now(),
          text: aiText,
          handoff: needsHandoff,
        },
      ],
    });
  } catch (err) {
    console.error('Support chat AI error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
