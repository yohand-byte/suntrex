// blog-rss.js — RSS Feed endpoint for SUNTREX Blog (Fastify)

const { getSupabaseAdmin } = require("../lib/supabase");

const CATEGORIES = {
  market: "Marché & Tendances",
  tech: "Technologie",
  guides: "Guides Pratiques",
  brand: "Marques & Produits",
  regulation: "Réglementation",
  suntrex: "SUNTREX News",
};

const escapeXml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

async function routes(fastify) {
  fastify.get("/blog-rss", async (request, reply) => {
    try {
      const supabase = getSupabaseAdmin();

      // Fetch published articles, ordered by date
      const { data: articles, error } = await supabase
        .from("blog_articles")
        .select("slug, title, excerpt, category, author_name, tags, published_at, updated_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const items = (articles || [])
        .map(
          (a) => `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>https://suntrex.eu/blog/${a.slug}</link>
      <guid isPermaLink="true">https://suntrex.eu/blog/${a.slug}</guid>
      <description><![CDATA[${a.excerpt}]]></description>
      <pubDate>${new Date(a.published_at || a.updated_at).toUTCString()}</pubDate>
      <category>${escapeXml(CATEGORIES[a.category] || a.category)}</category>
      <dc:creator>${escapeXml(a.author_name)}</dc:creator>
      ${(a.tags || []).map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`
        )
        .join("\n");

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>SUNTREX Blog — Intelligence Marché Solaire</title>
    <link>https://suntrex.eu/blog</link>
    <atom:link href="https://suntrex.eu/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Analyses de marché, comparatifs produits et guides techniques pour les professionnels du photovoltaïque en Europe.</description>
    <language>fr-FR</language>
    <managingEditor>blog@suntrex.eu (SUNTREX Blog)</managingEditor>
    <webMaster>tech@suntrex.eu (SUNTREX Tech)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>https://suntrex.eu/logo-512.png</url>
      <title>SUNTREX Blog</title>
      <link>https://suntrex.eu/blog</link>
      <width>144</width>
      <height>144</height>
    </image>
    <copyright>© ${new Date().getFullYear()} SUNTREX. Tous droits réservés.</copyright>
${items}
  </channel>
</rss>`;

      return reply
        .code(200)
        .header("Content-Type", "application/rss+xml; charset=utf-8")
        .header("Cache-Control", "public, max-age=3600, s-maxage=3600")
        .send(rss);
    } catch (err) {
      console.error("RSS generation error:", err);
      return reply.code(500).send({ error: "Failed to generate RSS feed" });
    }
  });
}

module.exports = routes;
