// api/blog-ai-generate.js
// Vercel Serverless Function — AI Article Generation for SUNTREX Blog
// Uses Mistral AI API server-side (API key never exposed)

import { createClient } from "@supabase/supabase-js";

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

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { topic, category } = req.body;

    if (!topic || !category) {
      return res.status(400).json({ error: "Missing topic or category" });
    }

    const categoryLabel = CATEGORIES[category] || category;

    // Call Mistral AI API
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
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
      return res.status(502).json({ error: "AI generation failed", details: response.status });
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    // Mistral may return content as a structured object instead of a string
    let contentStr = parsed.content;
    if (typeof contentStr === "object" && contentStr !== null) {
      contentStr = Object.values(contentStr).join("\n\n");
    }

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
      hero_gradient: "linear-gradient(135deg, #1a1a18 0%, #E8700A 100%)",
      featured: false,
      published: false,
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
      return res.status(200).json({ article, saved: false, error: dbError.message });
    }

    return res.status(200).json({ article: saved, saved: true });
  } catch (err) {
    console.error("Blog AI generate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
