// netlify/functions/blog-ai-generate.js
// AI Article Generation for SUNTREX Blog
// Uses Mistral AI API server-side (API key never exposed)
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

const CATEGORY_IMAGES = {
  market: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80",
  tech: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=900&q=80",
  guides: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=900&q=80",
  brand: "https://images.unsplash.com/photo-1592833159117-ac62bc51e9be?w=900&q=80",
  regulation: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80",
  suntrex: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80",
};

const CATEGORY_OVERLAYS = {
  market: "linear-gradient(135deg, rgba(26,58,92,0.82) 0%, rgba(232,145,10,0.65) 100%)",
  tech: "linear-gradient(135deg, rgba(10,22,40,0.82) 0%, rgba(232,112,10,0.7) 100%)",
  guides: "linear-gradient(135deg, rgba(26,90,166,0.82) 0%, rgba(197,135,15,0.7) 100%)",
  brand: "linear-gradient(135deg, rgba(228,0,43,0.75) 0%, rgba(0,104,183,0.75) 100%)",
  regulation: "linear-gradient(135deg, rgba(0,38,84,0.82) 0%, rgba(206,17,38,0.65) 100%)",
  suntrex: "linear-gradient(135deg, rgba(232,112,10,0.8) 0%, rgba(45,143,62,0.75) 100%)",
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
    const { topic, category } = JSON.parse(event.body);

    if (!topic || !category) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing topic or category" }) };
    }

    const categoryLabel = CATEGORIES[category] || category;

    // Call Mistral AI API
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `Tu es le rédacteur en chef du blog SUNTREX, marketplace B2B d'équipements photovoltaïques en Europe. Tu écris des articles professionnels, factuels, orientés installateurs et distributeurs solaires. Ton ton est expert mais accessible. Tu utilises des données réelles du marché PV européen 2026 (406 GW cumulés UE, modules N-type TOPCon 70%+ des livraisons, stockage à 70$/kWh). Tu termines toujours par un CTA vers SUNTREX. Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks.`,
          },
          {
            role: "user",
            content: `Écris un article de blog sur "${topic}" pour la catégorie "${categoryLabel}". Retourne UNIQUEMENT ce JSON: {"title":"titre accrocheur 60 chars max","slug":"url-friendly-slug","excerpt":"résumé 2 phrases 155 chars pour SEO","content":"article 500-700 mots avec sections **Titre Section** et données marché réelles, CTA SUNTREX à la fin","tags":["tag1","tag2","tag3","tag4"],"seo_title":"titre SEO 60 chars | SUNTREX Blog","seo_description":"meta description 155 chars","read_time":7}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Mistral API error:", response.status, errText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "AI generation failed", details: response.status }),
      };
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Mistral may return content as a structured object instead of a string
    let contentStr = parsed.content;
    if (typeof contentStr === "object" && contentStr !== null) {
      contentStr = Object.values(contentStr).join("\n\n");
    }

    // Assign category-based hero image and overlay
    const image = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.market;
    const overlay = CATEGORY_OVERLAYS[category] || CATEGORY_OVERLAYS.market;

    // Build article object
    const article = {
      slug: parsed.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80),
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: contentStr,
      category,
      author_name: "SUNTREX AI",
      author_avatar: "🤖",
      tags: parsed.tags || [],
      image,
      overlay,
      hero_gradient: overlay,
      featured: false,
      published: false, // Draft by default — admin must review and publish
      read_time: parsed.read_time || 5,
      seo_title: parsed.seo_title,
      seo_description: parsed.seo_description,
      ai_generated: true,
      ai_model: "mistral-large-latest",
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
