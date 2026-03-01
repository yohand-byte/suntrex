// netlify/functions/blog-ai-generate.js
// AI Article Generation for SUNTREX Blog
// Uses Anthropic Claude API server-side (API key never exposed)
// URL: /.netlify/functions/blog-ai-generate

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORIES = {
  market: "Marché & Tendances",
  tech: "Technologie",
  guides: "Guides Pratiques",
  brand: "Marques & Produits",
  regulation: "Réglementation",
  suntrex: "SUNTREX News",
};

exports.handler = async (event) => {
  // Only POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { topic, category, userId } = JSON.parse(event.body);

    if (!topic || !category) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing topic or category" }) };
    }

    // TODO: Verify user is admin via Supabase auth
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    // if (!user || user.role !== 'admin') return 403;

    const categoryLabel = CATEGORIES[category] || category;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Tu es le rédacteur en chef du blog SUNTREX, marketplace B2B européenne d'équipements photovoltaïques. Génère un article de blog professionnel.

Contexte SUNTREX:
- Marketplace B2B PV européenne avec 638+ produits
- Marques: Huawei, Deye, Jinko, Trina, LONGi, Canadian Solar, BYD, Enphase, SMA, SolarEdge, Risen, Sungrow, Growatt, GoodWe
- Commissions 5% sous les concurrents (sun.store, SolarTraders)
- Service SUNTREX DELIVERY avec vérification colis
- Cible: installateurs et distributeurs solaires en Europe
- Marché: 406 GW installés en UE, capacité mondiale 3 TW début 2026

Sujet: "${topic}"
Catégorie: ${categoryLabel}

IMPORTANT: Réponds UNIQUEMENT avec du JSON valide, sans aucun texte avant ou après, sans backticks markdown.

{
  "title": "titre accrocheur, orienté installateurs/distributeurs PV",
  "slug": "slug-url-seo-optimise-en-minuscules",
  "excerpt": "résumé percutant, 2 phrases max, 160 caractères max",
  "content": "article complet 500-800 mots. Utilise des sections avec **Titre Section** en gras. Inclus des données réelles du marché PV européen 2026. Termine par un appel à l'action vers SUNTREX.",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "seo_title": "titre SEO optimisé (60 chars max) | SUNTREX Blog",
  "seo_description": "meta description 155 caractères max, inclure le mot-clé principal",
  "read_time": 7
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Claude API error:", response.status, errText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "AI generation failed", details: response.status, reason: errText.includes("credit balance") ? "insufficient_credits" : "api_error" }),
      };
    }

    const data = await response.json();
    const text = data.content?.map((b) => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw:", text.slice(0, 500));
      return {
        statusCode: 422,
        headers,
        body: JSON.stringify({ error: "Failed to parse AI response", raw: text.slice(0, 200) }),
      };
    }

    // Build article object
    const article = {
      slug: parsed.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80),
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      category,
      author_name: "SUNTREX AI",
      author_avatar: "🤖",
      tags: parsed.tags || [],
      hero_gradient: `linear-gradient(135deg, #1a1a18 0%, #E8700A 100%)`,
      featured: false,
      published: false, // Draft by default — admin must review and publish
      read_time: parsed.read_time || 5,
      seo_title: parsed.seo_title,
      seo_description: parsed.seo_description,
      ai_generated: true,
      ai_model: "claude-3-5-sonnet-20241022",
      ai_prompt: topic,
    };

    // Save to Supabase as draft
    const { data: saved, error: dbError } = await supabase
      .from("blog_articles")
      .insert(article)
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      // Return article anyway even if DB save fails
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ article, saved: false, error: dbError.message }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ article: saved, saved: true }),
    };
  } catch (err) {
    console.error("Blog AI generate error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
