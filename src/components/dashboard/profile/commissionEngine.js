// ── SUNTREX Commission Engine ──────────────────────────────────────
// Source: sun.store Appendix 2 — Fees T&C (effective 01.01.2026)
// SUNTREX = sun.store × 0.95 on every tier (5% relative discount)
// Minimum monthly fee: sun.store €5 | SUNTREX €0

export const DISCOUNT = 0.95;

export const SUN_STORE_FEES = {
  solar_panels: {
    label: "Solar Panels", labelFr: "Panneaux solaires", icon: "☀️",
    tiers: [
      { min: 150000, label: "> 150k €", rate: 0.0084 },
      { min: 80000,  label: "80k – 150k €", rate: 0.0131 },
      { min: 25000,  label: "25k – 80k €", rate: 0.0181 },
      { min: 10000,  label: "10k – 25k €", rate: 0.0226 },
      { min: 5000,   label: "5k – 10k €", rate: 0.0276 },
      { min: 0,      label: "< 5k €", rate: 0.0299 },
    ],
  },
  inverters_storage: {
    label: "Inverters & Storage", labelFr: "Onduleurs & Stockage", icon: "⚡",
    tiers: [
      { min: 150000, label: "> 150k €", rate: 0.0103 },
      { min: 80000,  label: "80k – 150k €", rate: 0.0179 },
      { min: 25000,  label: "25k – 80k €", rate: 0.0261 },
      { min: 10000,  label: "10k – 25k €", rate: 0.0314 },
      { min: 5000,   label: "5k – 10k €", rate: 0.0365 },
      { min: 0,      label: "< 5k €", rate: 0.0399 },
    ],
  },
  other: {
    label: "Other Categories", labelFr: "Autres catégories", icon: "🔧",
    tiers: [
      { min: 100000, label: "> 100k €", rate: 0.0119 },
      { min: 80000,  label: "80k – 100k €", rate: 0.0206 },
      { min: 25000,  label: "25k – 80k €", rate: 0.0301 },
      { min: 10000,  label: "10k – 25k €", rate: 0.0363 },
      { min: 5000,   label: "5k – 10k €", rate: 0.0421 },
      { min: 0,      label: "< 5k €", rate: 0.0488 },
    ],
  },
};

export function calcCommission(netValue, category = "inverters_storage", platform = "suntrex") {
  const cat = SUN_STORE_FEES[category] || SUN_STORE_FEES.other;
  const tier = cat.tiers.find(t => netValue >= t.min) || cat.tiers[cat.tiers.length - 1];
  const rate = platform === "suntrex" ? tier.rate * DISCOUNT : tier.rate;
  return {
    rate,
    ratePct: (rate * 100).toFixed(2),
    amount: Math.round(netValue * rate * 100) / 100,
    tier: tier.label,
    sunstoreRate: tier.rate,
    sunstoreAmount: Math.round(netValue * tier.rate * 100) / 100,
    savings: Math.round(netValue * tier.rate * (1 - DISCOUNT) * 100) / 100,
  };
}
