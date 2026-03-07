// SUNTREX — Gemini AI endpoints (Vertex AI)
// POST /api/ai/chat — General AI chat
// POST /api/ai/translate — AI translation
// POST /api/ai/product-description — Product description generation

const { callGemini, MODEL } = require('../lib/gemini');

const SYSTEM_PROMPT = `Tu es l'assistant IA de SUNTREX, marketplace B2B européenne d'équipements photovoltaïques. Tu aides les professionnels du solaire (installateurs, distributeurs) à trouver les bons produits, comparer les prix et comprendre les spécifications techniques. Sois concis, professionnel et utile. Réponds dans la langue de l'utilisateur.`;

async function geminiRoutes(fastify) {
  // General AI chat
  fastify.post('/ai/chat', async (req, reply) => {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({ error: 'Missing messages array' });
    }

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const { text } = await callGemini({
      contents,
      systemInstruction: SYSTEM_PROMPT,
    });

    return {
      reply: text || "Désolé, je n'ai pas pu générer de réponse.",
      model: 'gemini-2.0-flash',
      provider: 'vertex-ai',
    };
  });

  // Translation
  fastify.post('/ai/translate', async (req, reply) => {
    const { text, targetLang } = req.body || {};
    if (!text || !targetLang) {
      return reply.code(400).send({ error: 'Missing text or targetLang' });
    }

    const { text: translated } = await callGemini({
      contents: [{ role: 'user', parts: [{ text: `Translate the following text to ${targetLang}. Return ONLY the translation, nothing else:\n\n${text}` }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    });

    return { translated: translated || text, targetLang, model: 'gemini-2.0-flash' };
  });

  // Product description generation
  fastify.post('/ai/product-description', async (req, reply) => {
    const { product, lang = 'fr' } = req.body || {};
    if (!product) {
      return reply.code(400).send({ error: 'Missing product' });
    }

    const { text: description } = await callGemini({
      contents: [{ role: 'user', parts: [{ text: `Generate a professional B2B product description in ${lang} for this solar equipment:\nName: ${product.name}\nBrand: ${product.brand}\nCategory: ${product.category}\nSpecs: ${JSON.stringify(product.specs || {})}\n\nWrite 2-3 sentences focused on key selling points for solar professionals. Be concise and technical.` }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
    });

    return { description: description || '', lang, model: 'gemini-2.0-flash' };
  });
}

module.exports = geminiRoutes;
