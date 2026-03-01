// netlify/functions/blog-sitemap.js
// Sitemap XML for SUNTREX Blog — SEO
// URL: /.netlify/functions/blog-sitemap or /api/blog-sitemap

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
  };

  try {
    const { data: articles, error } = await supabase
      .from("blog_articles")
      .select("slug, updated_at, published_at, category")
      .eq("published", true)
      .order("published_at", { ascending: false });

    if (error) throw error;

    const BASE_URL = "https://suntrex.eu";

    // Static pages
    const staticPages = [
      { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
      { loc: `${BASE_URL}/blog`, priority: "0.9", changefreq: "daily" },
      { loc: `${BASE_URL}/catalog`, priority: "0.9", changefreq: "daily" },
      { loc: `${BASE_URL}/register`, priority: "0.8", changefreq: "monthly" },
      { loc: `${BASE_URL}/about`, priority: "0.6", changefreq: "monthly" },
    ];

    // Category pages
    const categories = ["market", "tech", "guides", "brand", "regulation", "suntrex"];
    const categoryPages = categories.map((cat) => ({
      loc: `${BASE_URL}/blog/category/${cat}`,
      priority: "0.7",
      changefreq: "weekly",
    }));

    // Article pages
    const articlePages = (articles || []).map((a) => ({
      loc: `${BASE_URL}/blog/${a.slug}`,
      lastmod: new Date(a.updated_at || a.published_at).toISOString().split("T")[0],
      priority: "0.8",
      changefreq: "monthly",
    }));

    const allPages = [...staticPages, ...categoryPages, ...articlePages];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return { statusCode: 200, headers, body: sitemap };
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to generate sitemap" }),
    };
  }
};
