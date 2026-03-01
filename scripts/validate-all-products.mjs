#!/usr/bin/env node
/**
 * validate-all-products.mjs — Validate all products in the catalog
 * Checks: valid IDs, existing images, required fields, no csv-* IDs
 *
 * Usage: node scripts/validate-all-products.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ZOHO_PATH = path.join(ROOT, "src", "data", "zoho-products.json");
const PRODUCTS_PATH = path.join(ROOT, "src", "products.js");
const PUBLIC = path.join(ROOT, "public");

// Load zoho products
const zohoProducts = JSON.parse(fs.readFileSync(ZOHO_PATH, "utf8"));

// Load products.js by extracting the PRODUCTS array (hw-* products)
const productsSource = fs.readFileSync(PRODUCTS_PATH, "utf8");
// Extract hw-* product IDs from the source
const hwIds = [...productsSource.matchAll(/id:\s*"(hw-[^"]+)"/g)].map(m => m[1]);

const errors = { critical: [], warning: [], info: [] };

function checkImage(imgPath) {
  if (!imgPath) return false;
  const fullPath = path.join(PUBLIC, imgPath);
  return fs.existsSync(fullPath);
}

console.log("=== SUNTREX Product Validation ===\n");
console.log(`Zoho products: ${zohoProducts.length}`);
console.log(`HW products (from source): ${hwIds.length}`);
console.log(`Total: ${zohoProducts.length + hwIds.length}\n`);

// Validate zoho products
let missingImage = 0;
let missingFields = 0;
let badIds = 0;
let missingDatasheet = 0;
let hasDatasheet = 0;

zohoProducts.forEach((p, i) => {
  // Check ID
  if (!p.id) {
    errors.critical.push(`Product #${i}: missing ID (name: ${p.name})`);
    badIds++;
  } else if (p.id.startsWith("csv-")) {
    errors.critical.push(`Product ${p.id}: uses csv-* ID pattern (must use zoho-* or hw-*)`);
    badIds++;
  }

  // Check required fields
  const required = ["name", "brand", "category"];
  required.forEach(field => {
    if (!p[field]) {
      errors.warning.push(`Product ${p.id || `#${i}`}: missing ${field}`);
      missingFields++;
    }
  });

  // Check price
  if (!p.price || p.price <= 0) {
    errors.warning.push(`Product ${p.id || `#${i}`}: invalid price (${p.price})`);
  }

  // Check image
  if (!p.image) {
    errors.info.push(`Product ${p.id}: no image path set`);
    missingImage++;
  } else if (!checkImage(p.image)) {
    errors.warning.push(`Product ${p.id}: image file not found (${p.image})`);
    missingImage++;
  }

  // Check datasheet
  if (p.datasheet) {
    hasDatasheet++;
  } else {
    missingDatasheet++;
  }
});

// Check for duplicate IDs
const allIds = zohoProducts.map(p => p.id).filter(Boolean);
const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
if (dupes.length > 0) {
  const uniqueDupes = [...new Set(dupes)];
  uniqueDupes.forEach(id => {
    errors.critical.push(`Duplicate ID: ${id} (appears ${allIds.filter(x => x === id).length} times)`);
  });
}

// Summary
console.log("--- Results ---\n");

if (errors.critical.length > 0) {
  console.log(`CRITICAL ERRORS (${errors.critical.length}):`);
  errors.critical.forEach(e => console.log(`  x ${e}`));
  console.log();
}

if (errors.warning.length > 0) {
  console.log(`WARNINGS (${errors.warning.length}):`);
  errors.warning.slice(0, 20).forEach(e => console.log(`  ! ${e}`));
  if (errors.warning.length > 20) console.log(`  ... and ${errors.warning.length - 20} more`);
  console.log();
}

console.log("--- Summary ---\n");
console.log(`Total products validated: ${zohoProducts.length + hwIds.length}`);
console.log(`Bad IDs: ${badIds}`);
console.log(`Missing/broken images: ${missingImage}`);
console.log(`Missing required fields: ${missingFields}`);
console.log(`With datasheet: ${hasDatasheet}`);
console.log(`Without datasheet: ${missingDatasheet}`);
console.log(`Duplicate IDs: ${dupes.length}`);
console.log();

if (errors.critical.length > 0) {
  console.log(`RESULT: FAIL -- ${errors.critical.length} critical errors`);
  process.exit(1);
} else {
  console.log("RESULT: PASS -- 0 critical errors");
  process.exit(0);
}
