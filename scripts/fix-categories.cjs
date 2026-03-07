#!/usr/bin/env node
/**
 * fix-categories.cjs
 * Re-assign product categories so they match the navigation structure:
 *   panels, inverters, batteries, mounting, optimizers, electrical, ev-chargers, accessories
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "public", "data", "products.json");
const products = JSON.parse(fs.readFileSync(FILE, "utf8"));

// EV charger patterns
const EV_RE = /wallbox|ev.?charg|borne.*(recharge|charge)|pulsar|cooper.*(charger|ev)|chargeur.*voiture|station.*(charge|recharge)|IQ\s*EV/i;

// Electrical patterns (coffrets, cables, connectors, fuses, breakers, surge protectors, junction boxes, wiring)
const ELECTRICAL_RE = /coffret|câble|cable|connecteur|connector|disjoncteur|parafoudre|fusible|sectionneur|interrupteur|bouchon.*string|boîte.*jonction|junction|AC.?box|DC.?box|borne.*(?:m[0-9]|distribution)|busbar|wiring|presse.?étoupe|gaine|embout|plug.*play|rallonge|bouchon|dérivation|terre.*vert|rigide.*R2V|solaire.*certif|TUV.*mm|communication.*câble|firmware.*câble|console.*câble|debug/i;

let changed = 0;

for (const p of products) {
  const oldCat = p.category;
  const name = p.name || "";
  const type = p.type || p.product_type || "";

  // 1. EV chargers — highest priority
  if (EV_RE.test(name) || type === "EV" || type === "AC Charger" || type === "AC Charger 3-Phase") {
    if (oldCat !== "ev-chargers") {
      p.category = "ev-chargers";
      console.log(`  [ev-chargers] ${oldCat} -> ev-chargers | ${name.substring(0, 80)}`);
      changed++;
    }
    continue;
  }

  // 2. Keep inverters, batteries, panels, mounting, optimizers as-is if already correct
  if (["inverters", "batteries", "panels", "mounting", "optimizers"].includes(oldCat)) {
    continue;
  }

  // 3. cables category → rename to electrical
  if (oldCat === "cables") {
    p.category = "electrical";
    console.log(`  [electrical] cables -> electrical | ${name.substring(0, 80)}`);
    changed++;
    continue;
  }

  // 4. accessories that are actually electrical
  if (oldCat === "accessories" && ELECTRICAL_RE.test(name)) {
    p.category = "electrical";
    console.log(`  [electrical] accessories -> electrical | ${name.substring(0, 80)}`);
    changed++;
    continue;
  }

  // 5. Everything else stays as accessories
}

fs.writeFileSync(FILE, JSON.stringify(products, null, 2) + "\n");
console.log(`\nDone: ${changed} products re-categorized.`);
