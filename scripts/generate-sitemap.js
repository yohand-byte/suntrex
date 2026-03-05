/**
 * SUNTREX — Dynamic Sitemap Generator
 *
 * Run: node scripts/generate-sitemap.js
 * Output: public/sitemap.xml
 *
 * Reads product IDs from src/products.js to generate /product/:id URLs.
 * Called during build or manually before deploy.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const BASE_URL = "https://suntrex.eu";
const TODAY = new Date().toISOString().split("T")[0];

// ── Extract product IDs from products.js ──────────────────────

function extractProductIds() {
  const src = readFileSync(resolve(ROOT, "src/products.js"), "utf-8");
  const ids = [];
  const regex = /id:\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(src)) !== null) {
    ids.push(match[1]);
  }
  return [...new Set(ids)];
}

// ── Static routes ─────────────────────────────────────────────

const STATIC_ROUTES = [
  { path: "/",                priority: "1.0", changefreq: "daily"   },
  { path: "/catalog",         priority: "0.9", changefreq: "daily"   },
  { path: "/catalog/inverters",   priority: "0.8", changefreq: "weekly" },
  { path: "/catalog/panels",      priority: "0.8", changefreq: "weekly" },
  { path: "/catalog/batteries",   priority: "0.8", changefreq: "weekly" },
  { path: "/catalog/mounting",    priority: "0.8", changefreq: "weekly" },
  { path: "/catalog/electrical",  priority: "0.8", changefreq: "weekly" },
  { path: "/catalog/emobility",   priority: "0.8", changefreq: "weekly" },
  { path: "/blog",            priority: "0.7", changefreq: "weekly"  },
  { path: "/faq",             priority: "0.6", changefreq: "monthly" },
];

// ── Build XML ─────────────────────────────────────────────────

function buildSitemap() {
  const productIds = extractProductIds();

  const urls = [
    ...STATIC_ROUTES,
    ...productIds.map(id => ({
      path: `/product/${id}`,
      priority: "0.7",
      changefreq: "weekly",
    })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => [
      "  <url>",
      `    <loc>${BASE_URL}${u.path}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      `    <changefreq>${u.changefreq}</changefreq>`,
      `    <priority>${u.priority}</priority>`,
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");

  return { xml, count: urls.length };
}

// ── Main ──────────────────────────────────────────────────────

const { xml, count } = buildSitemap();
const outPath = resolve(ROOT, "public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`✅ Sitemap generated: ${count} URLs → public/sitemap.xml`);
