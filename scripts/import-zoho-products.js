#!/usr/bin/env node
// scripts/import-zoho-products.js
// Imports Zoho enriched product data into SUNTREX catalog format.
// Run: node scripts/import-zoho-products.js
// Output: src/data/zoho-products.json + copies images to public/products/zoho/

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { dirname, extname, join, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ZOHO_JSON = "/Users/yohanaboujdid/suntrex-product-enrichment/output/zoho_artifact_data.json";
const OUTPUT_JSON = join(ROOT, "src/data/zoho-products.json");
const PUBLIC_IMAGES = join(ROOT, "public/products/zoho");

// ─── Existing Huawei SKUs to exclude ────────────────────────────────────────
const EXISTING_SKUS = new Set([
  "SUN2000-100KTL-M2","SUN2000-30KTL-M3","SUN2000-6KTL-L1","SUN2000-8K-LC0",
  "SUN2000-10K-LC0","SUN2000-5K-MAP0","SUN2000-6K-MAP0","SUN2000-8K-MAP0",
  "SUN2000-10K-MAP0","SUN2000-12K-MAP0","SUN2000-12K-MB0","SUN2000-15K-MB0",
  "SUN2000-17K-MB0","SUN2000-20K-MB0","SUN2000-25K-MB0","LUNA2000-5KW-C0",
  "LUNA2000-5-E0","MERC-1300-P","SDongleA-05","SDongleB-06-EU",
  "SCharger-7KS-S0","SCharger-22KT-S0","SmartPS-80AI-T0","DTSU666-H250A/50mA",
  "SmartPS-250A-T0","SmartPS-100A-S0","DDSU666-H","DTSU666-H-100A",
  "SmartGuard-63A-S0","SmartGuard-63A-T0","EMMA-A02",
]);

// ─── Category mapping ────────────────────────────────────────────────────────
function mapCategory(canonical, rawCatName) {
  const s = (rawCatName || "").trim();
  if (s === "SYSTÈMES DE MONTAGE" || s === "Toitures inclinées" || s === "Toiture terrasse")
    return "mounting";
  if (s === "E-MOBILITY") return "ev-chargers";
  const c = (canonical || "").toLowerCase();
  if (c === "inverters") return "inverters";
  if (c === "energy storage") return "batteries";
  if (c === "solar panels") return "panels";
  if (c === "cables") return "cables";
  return "accessories";
}

// ─── Subcategory/type mapping ────────────────────────────────────────────────
function mapSubcategoryAndType(rawCatName) {
  const s = (rawCatName || "").trim();
  if (s === "ONDULEURS" || s === "ONDULEURS HUAWEI")
    return { subcategory: "string-inverter", type: "Commercial" };
  if (s === "ONDULEURS DEYE")
    return { subcategory: "hybrid-inverter", type: "Hybrid" };
  if (s.includes("Micro-onduleurs") || s === "MICRO-ONDULEURS" ||
      s.includes("VaySunic") || s.includes("APsystems - Micro"))
    return { subcategory: "micro-inverter", type: "Micro" };
  if (s === "ENPHASE - Micro-onduleurs")
    return { subcategory: "micro-inverter", type: "Micro" };
  if (s === "HOYMILES - Micro-onduleurs")
    return { subcategory: "micro-inverter", type: "Micro" };
  if (s === "SOLUTIONS DE STOCKAGE")
    return { subcategory: "battery-system", type: "Storage" };
  if (s === "GESTION D'ÉNERGIE")
    return { subcategory: "energy-management", type: "Smart" };
  if (s === "MODULES SOLAIRES")
    return { subcategory: "solar-module", type: "Monocrystalline" };
  if (s === "SYSTÈMES DE MONTAGE")
    return { subcategory: "mounting-system", type: "Mounting" };
  if (s === "Toitures inclinées")
    return { subcategory: "pitched-roof", type: "Mounting" };
  if (s === "Toiture terrasse")
    return { subcategory: "flat-roof", type: "Mounting" };
  if (s.startsWith("COFFRETS"))
    return { subcategory: "electrical-cabinet", type: "Protection" };
  if (s === "E-MOBILITY")
    return { subcategory: "ev-charger", type: "EV" };
  if (s === "APSystems - Accessoires")
    return { subcategory: "micro-inverter-accessory", type: "Accessory" };
  return { subcategory: "general", type: "Other" };
}

// ─── Name cleaning ────────────────────────────────────────────────────────────
function cleanName(raw) {
  return (raw || "")
    .replace(/^["\s]+/, "")
    .replace(/["\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Power/kW extraction ─────────────────────────────────────────────────────
function extractPowerKw(name) {
  const kwMatch = name.match(/(\d+(?:[.,]\d+)?)\s*[kK][wW]/);
  if (kwMatch) return parseFloat(kwMatch[1].replace(",", "."));
  const wMatch = name.match(/(\d+)\s*[Ww](?!\w)/);
  if (wMatch) {
    const w = parseInt(wMatch[1]);
    if (w >= 100) return Math.round((w / 1000) * 100) / 100;
  }
  return null;
}

function extractPowerLabel(name) {
  const kw = extractPowerKw(name);
  if (kw === null) return null;
  return kw >= 1 ? `${kw} kW` : `${Math.round(kw * 1000)} W`;
}

// ─── Phase extraction ─────────────────────────────────────────────────────────
function extractPhases(name) {
  const n = name.toLowerCase();
  if (n.includes("3ph") || n.includes("triphas") || n.includes("3-phase") ||
      n.includes("tri ") || n.includes("3 phase")) return 3;
  if (n.includes("1ph") || n.includes("monoph") || n.includes("1-phase") ||
      n.includes("single phase")) return 1;
  return 0;
}

// ─── MPPT extraction ──────────────────────────────────────────────────────────
function extractMppt(name) {
  const m = name.match(/(\d+)\s*MPPT/i);
  return m ? parseInt(m[1]) : 0;
}

// ─── kWh extraction ───────────────────────────────────────────────────────────
function extractKwh(name) {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*kWh/i);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

// ─── Weight extraction ────────────────────────────────────────────────────────
function extractWeight(item) {
  const specs = item.specs || {};
  if (specs.weight_with_unit?.raw) {
    const m = specs.weight_with_unit.raw.match(/([\d.,]+)/);
    if (m) return parseFloat(m[1].replace(",", "."));
  }
  if (specs["cf_poids_net_en_kg_unformatted"]) {
    return parseFloat(specs["cf_poids_net_en_kg_unformatted"]);
  }
  if (specs["cf_poids_net_en_kg"]?.raw) {
    const m = String(specs["cf_poids_net_en_kg"].raw).match(/([\d.,]+)/);
    if (m) return parseFloat(m[1].replace(",", "."));
  }
  return null;
}

// ─── Image copy & path ────────────────────────────────────────────────────────
function processImage(item) {
  const imgs = item.images || [];
  const primary = imgs.find((i) => i.downloaded_path && i.type === "primary") ||
                  imgs.find((i) => i.downloaded_path);
  if (!primary || !existsSync(primary.downloaded_path)) return null;

  const imgDir = basename(dirname(primary.downloaded_path));
  const ext = extname(primary.downloaded_path).toLowerCase() || ".jpg";
  const destDir = join(PUBLIC_IMAGES, imgDir);
  const destFile = join(destDir, `main${ext}`);
  const publicPath = `/products/zoho/${imgDir}/main${ext}`;

  if (!existsSync(destFile)) {
    mkdirSync(destDir, { recursive: true });
    copyFileSync(primary.downloaded_path, destFile);
  }
  return publicPath;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log("Reading Zoho data...");
const raw = JSON.parse(readFileSync(ZOHO_JSON, "utf8"));

const filtered = raw.filter((item) => {
  const specs = item.specs || {};
  const itemType = specs.item_type?.raw || "";
  const productType = specs.product_type?.raw || "";
  if (!["inventory", "sales_and_purchases"].includes(itemType)) return false;
  if (productType !== "goods") return false;
  if (EXISTING_SKUS.has(item.sku)) return false;
  return true;
});

console.log(`Filtered: ${filtered.length} products from ${raw.length} total`);

mkdirSync(PUBLIC_IMAGES, { recursive: true });
mkdirSync(join(ROOT, "src/data"), { recursive: true });

let copied = 0;
const products = filtered.map((item) => {
  const rawCatName = item.specs?.category_name?.raw || "";
  const category = mapCategory(item.category_canonical, rawCatName);
  const { subcategory, type } = mapSubcategoryAndType(rawCatName);
  const name = cleanName(item.name);
  const sku = item.sku || "";
  const rate = item.raw_zoho?.rate || 0;
  const price = Math.round(rate * 1.30 * 100) / 100;
  const stockRaw = item.raw_zoho?.stock_on_hand || 0;
  const stock = Math.max(0, Math.round(stockRaw));
  const powerKw = extractPowerKw(name);
  const imagePath = processImage(item);
  if (imagePath) copied++;

  return {
    id: `zoho-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    sku,
    name,
    brand: item.brand || "",
    category,
    subcategory,
    type,
    power: extractPowerLabel(name),
    powerKw,
    phases: extractPhases(name),
    mppt: extractMppt(name),
    price,
    weight: extractWeight(item),
    warranty: null,
    efficiency: null,
    protection: null,
    certifications: [],
    description: item.description?.text || null,
    features: [],
    image: imagePath,
    datasheet: null,
    dimensions: item.specs?.dimensions_with_unit?.raw || null,
    capacityKwh: extractKwh(name),
    stock,
    minOrder: 1,
    seller: "QUALIWATT",
  };
});

const valid = products.filter((p) => p.price > 0);
console.log(`Valid products (price > 0): ${valid.length}`);
console.log(`Images copied: ${copied}`);

writeFileSync(OUTPUT_JSON, JSON.stringify(valid, null, 2), "utf8");
console.log(`✅ Written: ${OUTPUT_JSON}`);

const cats = {};
valid.forEach((p) => { cats[p.category] = (cats[p.category] || 0) + 1; });
console.log("Category breakdown:", cats);
const brands = {};
valid.forEach((p) => { if (p.brand) brands[p.brand] = (brands[p.brand] || 0) + 1; });
const topBrands = Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log("Top brands:", topBrands.map(([b, c]) => `${b}(${c})`).join(", "));
