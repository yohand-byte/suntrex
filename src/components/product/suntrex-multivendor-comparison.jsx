import { useState, useMemo, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   SUNTREX — Multi-Vendor Comparison Engine
   ═══════════════════════════════════════════════════════════════════
   
   The CORE marketplace feature. For each product, buyers see offers
   from multiple verified sellers — sorted, filterable, with trust
   badges and real-time availability.
   
   Architecture:
   ① useProductOffers hook → Supabase listings + profiles + companies
   ② VendorComparisonTable → sortable/filterable offer cards
   ③ ProductHero → specs + aggregate pricing
   ④ RelatedProducts → real catalog cross-sell
   
   Fallback: enriched mock data with 6 realistic EU vendors
   ═══════════════════════════════════════════════════════════════════ */

// ── Design Tokens ─────────────────────────────────────────────────
const T = {
  bg: "#ffffff", surface: "#f8f9fb", surfaceAlt: "#f3f4f8",
  border: "#e4e5ec", borderLight: "#eef0f4", borderHover: "#d1d5db",
  text: "#1a1a2e", textSec: "#5f6368", textDim: "#9aa0a6",
  orange: "#E8700A", orangeHover: "#d4630a", orangeLight: "#fff7ed", orangeBorder: "#fed7aa",
  green: "#059669", greenLight: "#ecfdf5", greenBorder: "#a7f3d0",
  red: "#dc2626", redLight: "#fef2f2",
  blue: "#2563eb", blueLight: "#eff6ff",
  purple: "#7c3aed", purpleLight: "#f5f3ff",
  teal: "#0d9488", tealLight: "#f0fdfa",
  amber: "#d97706", amberLight: "#fffbeb",
  navy: "#1e293b",
  shadow: "0 1px 3px rgba(0,0,0,0.05)", shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.12)",
  radius: 10, radiusLg: 14, radiusSm: 6,
  font: "'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

// ── Seller Tier System ────────────────────────────────────────────
const TIERS = {
  platinum: { label: "Platine", icon: "◆", color: "#475569", bg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #e2e8f0)", border: "#94a3b8", glow: "0 0 12px rgba(148,163,184,0.4)", rank: 4 },
  gold:     { label: "Or",      icon: "◆", color: "#92400e", bg: "linear-gradient(135deg, #fef3c7, #fcd34d, #fef3c7)", border: "#f59e0b", glow: "0 0 10px rgba(245,158,11,0.3)", rank: 3 },
  silver:   { label: "Argent",  icon: "◇", color: "#64748b", bg: "linear-gradient(135deg, #f1f5f9, #e2e8f0, #f1f5f9)", border: "#94a3b8", glow: "none", rank: 2 },
  bronze:   { label: "Bronze",  icon: "○", color: "#9a3412", bg: "linear-gradient(135deg, #fed7aa, #fdba74, #fed7aa)", border: "#f97316", glow: "none", rank: 1 },
};

// ── Country data ──────────────────────────────────────────────────
const FLAGS = { FR: "🇫🇷", DE: "🇩🇪", NL: "🇳🇱", BE: "🇧🇪", ES: "🇪🇸", IT: "🇮🇹", PT: "🇵🇹", AT: "🇦🇹", PL: "🇵🇱", CZ: "🇨🇿" };

// ── Mock vendor offers (enriched, realistic) ──────────────────────
function generateOffersForProduct(product) {
  const baseSellers = [
    { id: "S01", name: "QUALIWATT", country: "FR", rating: 4.9, reviews: 247, tier: "platinum", verified: true, escrow: true, delivery: "suntrex", colisVerif: true, responseMin: 8,  transactions: 1842, joined: "2023", speciality: "Huawei Premium Partner" },
    { id: "S02", name: "SolarPro GmbH", country: "DE", rating: 4.7, reviews: 183, tier: "gold", verified: true, escrow: true, delivery: "suntrex", colisVerif: true, responseMin: 22, transactions: 967, joined: "2024", speciality: "Multi-marques" },
    { id: "S03", name: "EnergieDirect BV", country: "NL", rating: 4.6, reviews: 89, tier: "gold", verified: true, escrow: true, delivery: "seller", colisVerif: false, responseMin: 35, transactions: 423, joined: "2024", speciality: "Benelux specialist" },
    { id: "S04", name: "MedSolar SL", country: "ES", rating: 4.4, reviews: 56, tier: "silver", verified: true, escrow: true, delivery: "seller", colisVerif: false, responseMin: 60, transactions: 198, joined: "2025", speciality: "Prix compétitifs" },
    { id: "S05", name: "VoltaItalia SRL", country: "IT", rating: 4.3, reviews: 34, tier: "silver", verified: true, escrow: false, delivery: "seller", colisVerif: false, responseMin: 90, transactions: 87, joined: "2025", speciality: "Sud Europe" },
    { id: "S06", name: "GreenTech Polska", country: "PL", rating: 4.1, reviews: 19, tier: "bronze", verified: false, escrow: false, delivery: "seller", colisVerif: false, responseMin: 180, transactions: 31, joined: "2025", speciality: "Europe de l'Est" },
  ];

  const basePrice = product.p || 500;
  // Generate realistic price variations (±12%)
  return baseSellers.map((s, i) => {
    const variance = 1 + (i * 0.035) + (Math.sin(i * 2.7 + basePrice * 0.01) * 0.02);
    const price = Math.round(basePrice * variance * 100) / 100;
    const stockBase = product.q || 50;
    const stock = Math.max(0, Math.round(stockBase * (1 - i * 0.15) + (Math.sin(i * 3.1) * stockBase * 0.1)));
    const leadDays = [2, 3, 4, 5, 7, 10][i] || 5;
    const moq = basePrice > 500 ? 1 : basePrice > 50 ? [1, 1, 2, 3, 5, 10][i] : [10, 10, 20, 25, 50, 50][i];
    
    return {
      ...s,
      flag: FLAGS[s.country] || "🇪🇺",
      price,
      stock,
      leadDays,
      moq,
      pricePerWatt: product.d?.match(/(\d+)\s*(?:kW|VA|W)/i) 
        ? (price / parseInt(product.d.match(/(\d+)\s*(?:kW|VA|W)/i)[1])).toFixed(2)
        : null,
      savings: i === 0 ? null : Math.round((price - basePrice * variance * 0.98) / price * 100),
    };
  });
}

// ── Catalog sample for related products ───────────────────────────
const CATALOG_SAMPLE = [
  { id: "HUA/SUN2000-5K-MAP0", n: "Huawei SUN2000-5K-MAP0", b: "HUAWEI", p: 599.62, q: 10, c: "inverters", d: "5 kW Triphasé hybride", img: "/products/huawei-5ktl.jpg" },
  { id: "HUA/SUN2000-10K-MAP0", n: "Huawei SUN2000-10K-MAP0", b: "HUAWEI", p: 808.63, q: 10, c: "inverters", d: "10 kW Triphasé hybride", img: "/products/huawei-10ktl.jpg" },
  { id: "DEY/SUN-6K-SG03LP1-E", n: "Deye SUN-6K Hybride", b: "DEYE", p: 890, q: 34, c: "inverters", d: "6 kW Mono hybride", img: "/products/deye-6k.jpg" },
  { id: "HUA/BAT-LUNA2000-5-E", n: "Huawei Luna 2000-5-E0", b: "HUAWEI", p: 1261, q: 76, c: "batteries", d: "5 kWh LFP", img: "/products/huawei-luna.webp" },
  { id: "HM/HMS-800-2T", n: "Hoymiles HMS-800", b: "HOYMILES", p: 105, q: 4061, c: "inverters", d: "800 VA micro-onduleur", img: "/products/hoymiles-800.jpg" },
  { id: "DEY/BOS-GM5.1", n: "Deye BOS-GM5.1", b: "DEYE", p: 800, q: 26, c: "batteries", d: "5.1 kWh LiFePO4", img: "/products/deye-battery.jpg" },
  { id: "EN/IQ8-PLUS", n: "Enphase IQ8-PLUS", b: "Enphase", p: 80, q: 647, c: "inverters", d: "300 VA micro-onduleur", img: "/products/enphase-iq8.jpg" },
  { id: "HUA/SUN2000-12K-MB0", n: "Huawei SUN2000-12K-MB0", b: "HUAWEI", p: 1128.14, q: 10, c: "inverters", d: "12 kW Triphasé hybride", img: "/products/huawei-12k.jpg" },
];

// Demo product
const DEMO_PRODUCT = {
  id: "HUA/SUN2000-10K-MAP0",
  n: "Huawei SUN2000-10K-MAP0 Triphasé",
  b: "HUAWEI",
  s: "HUA/SUN2000-10K-MAP0",
  p: 808.63,
  q: 10,
  c: "inverters",
  d: "Onduleur triphasé hybride — 10 000 W — Rendement max 98.4%",
  specs: {
    general: [
      { l: "SKU", v: "SUN2000-10K-MAP0" },
      { l: "Marque", v: "Huawei" },
      { l: "Garantie", v: "10 ans (extensible à 25)" },
      { l: "Protection", v: "IP65" },
      { l: "Certifications", v: "IEC 62109-1/2, EN 50549-1, VDE-AR-N 4105" },
    ],
    electrical: [
      { l: "Puissance nominale AC", v: "10 000 W" },
      { l: "Puissance max DC", v: "15 000 W" },
      { l: "Rendement max", v: "98.4%" },
      { l: "MPPT", v: "3" },
      { l: "Phases", v: "3" },
      { l: "Tension MPPT", v: "140 — 980 V" },
      { l: "Courant max/MPPT", v: "15 A" },
      { l: "Compatible batterie", v: "Oui (LUNA2000)" },
    ],
    mechanical: [
      { l: "Poids", v: "13.5 kg" },
      { l: "Dimensions", v: "525 × 370 × 145 mm" },
      { l: "Refroidissement", v: "Convection naturelle" },
      { l: "Bruit", v: "< 29 dB(A)" },
    ],
  },
  features: ["Smart I-V Curve Diagnosis", "AI-Powered AFCI", "PID Recovery", "Export Limitation", "Battery Ready", "FusionSolar App"],
  datasheets: [
    { name: "Fiche technique SUN2000-MAP0", size: "2.4 MB", type: "pdf" },
    { name: "Guide d'installation", size: "5.1 MB", type: "pdf" },
    { name: "Certificat IEC 62109", size: "180 KB", type: "pdf" },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// ICONS (inline SVG for zero dependencies)
// ═══════════════════════════════════════════════════════════════════
const Ico = {
  chevR: (s = 11) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>,
  chevD: (s = 13, open = true) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s" }}><path d="M6 9l6 6 6-6"/></svg>,
  lock: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  cart: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  check: (s = 12) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  shield: (s = 13) => <svg width={s} height={s} fill="none" stroke={T.green} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  truck: (s = 13) => <svg width={s} height={s} fill="none" stroke={T.orange} strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  star: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  dl: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  sort: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h6"/></svg>,
  filter: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  msg: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  compare: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  zap: () => <svg width="14" height="14" fill="none" stroke={T.amber} strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  eye: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function TierBadge({ tier }) {
  const t = TIERS[tier];
  if (!t) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px 2px 6px", borderRadius: 5,
      background: t.bg, border: `1px solid ${t.border}`,
      fontSize: 10, fontWeight: 800, color: t.color,
      letterSpacing: "0.03em", boxShadow: t.glow,
    }}>
      <span style={{ fontSize: 8 }}>{t.icon}</span> {t.label}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 5,
      background: T.greenLight, border: `1px solid ${T.greenBorder}`,
      fontSize: 10, fontWeight: 700, color: T.green,
    }}>
      {Ico.shield(10)} Vérifié
    </span>
  );
}

function EscrowBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 5,
      background: T.blueLight, border: `1px solid #bfdbfe`,
      fontSize: 10, fontWeight: 700, color: T.blue,
    }}>
      🔒 Escrow
    </span>
  );
}

function DeliveryBadge({ type }) {
  const isSuntrex = type === "suntrex";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 5,
      background: isSuntrex ? T.orangeLight : T.surface,
      border: `1px solid ${isSuntrex ? T.orangeBorder : T.borderLight}`,
      fontSize: 10, fontWeight: 700,
      color: isSuntrex ? T.orange : T.textSec,
    }}>
      {Ico.truck(10)} {isSuntrex ? "SUNTREX" : "Vendeur"}
    </span>
  );
}

function ColisVerifBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 7px", borderRadius: 5,
      background: T.tealLight, border: `1px solid #99f6e4`,
      fontSize: 10, fontWeight: 700, color: T.teal,
    }}>
      📦 Colis vérifié
    </span>
  );
}

function ResponseBadge({ minutes }) {
  const isFlash = minutes <= 30;
  const label = minutes < 60 ? `${minutes}min` : `${Math.round(minutes / 60)}h`;
  const color = isFlash ? T.green : minutes <= 60 ? T.amber : T.textDim;
  const bg = isFlash ? T.greenLight : minutes <= 60 ? T.amberLight : T.surface;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 5,
      background: bg, border: `1px solid ${color}25`,
      fontSize: 10, fontWeight: 700, color,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: color,
        animation: isFlash ? "pulse 1.5s ease-in-out infinite" : "none",
      }} />
      {isFlash ? "Flash" : "Réponse"} ~{label}
    </span>
  );
}

function SellerRating({ rating, reviews }) {
  const pct = (rating / 5) * 100;
  const color = rating >= 4.5 ? T.green : rating >= 4 ? T.amber : T.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Ico.star(11)}
      <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{rating.toFixed(1)}</span>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: T.borderLight, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: color, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 10.5, color: T.textDim }}>({reviews})</span>
    </div>
  );
}

function StockIndicator({ stock }) {
  const color = stock > 100 ? T.green : stock > 10 ? T.amber : stock > 0 ? T.red : T.textDim;
  const label = stock > 100 ? "En stock" : stock > 10 ? "Stock limité" : stock > 0 ? "Dernières pcs" : "Sur commande";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
        {stock > 0 ? stock.toLocaleString("fr-FR") : "—"}
        <span style={{ fontWeight: 400, color: T.textSec, marginLeft: 3 }}>pcs</span>
      </span>
      <span style={{ fontSize: 10, color, fontWeight: 600, background: `${color}12`, padding: "1px 5px", borderRadius: 3 }}>
        {label}
      </span>
    </div>
  );
}

function PriceDisplay({ price, logged, onLogin }) {
  if (!logged) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: T.textDim, filter: "blur(8px)", userSelect: "none" }}>
          €{(price * (0.88 + Math.random() * 0.24)).toFixed(0)}
        </span>
        <button onClick={onLogin} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: T.orange, color: "#fff", border: "none",
          borderRadius: 7, padding: "8px 14px", fontSize: 11.5,
          fontWeight: 700, cursor: "pointer", fontFamily: T.font,
          transition: "all .15s",
        }}>
          {Ico.lock()} Voir le prix
        </button>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, color: T.textDim, fontWeight: 500 }}>à partir de</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
        €{price.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
        <span style={{ fontSize: 11, fontWeight: 400, color: T.textDim, marginLeft: 2 }}>/pcs HT</span>
      </div>
    </div>
  );
}

// Collapsible section
function Section({ title, children, defaultOpen = true, accent = T.orange, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${T.borderLight}`, marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "14px 0", background: "none", border: "none",
        cursor: "pointer", fontFamily: T.font, textAlign: "left",
      }}>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
          {title}
          {count != null && <span style={{ fontSize: 10.5, fontWeight: 600, color: accent, background: `${accent}12`, padding: "2px 7px", borderRadius: 10 }}>{count}</span>}
        </span>
        {Ico.chevD(13, open)}
      </button>
      {open && (
        <>
          <div style={{ width: "100%", height: 2.5, background: accent, borderRadius: 2, marginBottom: 14 }} />
          <div style={{ paddingBottom: 18 }}>{children}</div>
        </>
      )}
    </div>
  );
}

function SpecsTable({ rows }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden" }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: "flex", padding: "10px 14px", fontSize: 12.5,
          background: i % 2 === 0 ? T.surface : T.bg,
          borderBottom: i < rows.length - 1 ? `1px solid ${T.borderLight}` : "none",
        }}>
          <span style={{ flex: 1, color: T.textSec, fontWeight: 500 }}>{r.l}</span>
          <span style={{ flex: 1, color: T.text, fontWeight: 600 }}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VENDOR OFFER CARD — The core comparison unit
// ═══════════════════════════════════════════════════════════════════
function VendorOfferCard({ offer, logged, onLogin, rank, isCompact, onCompare, isSelected }) {
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const o = offer;
  const isBest = rank === 0;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="offer-card"
      style={{
        border: `1.5px solid ${isSelected ? T.blue : isBest ? T.orangeBorder : hov ? T.borderHover : T.borderLight}`,
        borderRadius: T.radiusLg,
        marginBottom: isCompact ? 8 : 12,
        overflow: "hidden",
        background: isSelected ? T.blueLight : T.bg,
        transition: "all .2s ease",
        boxShadow: hov ? T.shadowMd : T.shadow,
        position: "relative",
      }}
    >
      {/* Best price ribbon */}
      {isBest && (
        <div style={{
          position: "absolute", top: 0, left: 20, zIndex: 2,
          background: `linear-gradient(135deg, ${T.orange} 0%, #f59e0b 100%)`,
          color: "#fff", fontSize: 9, fontWeight: 800,
          letterSpacing: "0.06em", textTransform: "uppercase",
          padding: "3px 12px", borderRadius: "0 0 6px 6px",
        }}>
          ★ Meilleur prix
        </div>
      )}

      {/* Main row */}
      <div style={{
        padding: isBest ? "22px 18px 14px" : "14px 18px",
        background: isBest ? "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)" : T.bg,
        borderBottom: `1px solid ${T.borderLight}`,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexWrap: "wrap", gap: 10,
        }}>
          {/* Left: seller info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.orange}18 0%, ${T.orange}35 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: T.orange,
                border: `2px solid ${T.orange}25`, flexShrink: 0,
              }}>
                {o.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{o.name}</span>
                  <span style={{ fontSize: 14 }}>{o.flag}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: T.textDim, fontWeight: 500 }}>
                  <span>{o.transactions.toLocaleString()} ventes</span>
                  <span style={{ width: 1, height: 10, background: T.border }} />
                  <span>Depuis {o.joined}</span>
                  {o.speciality && (
                    <>
                      <span style={{ width: 1, height: 10, background: T.border }} />
                      <span style={{ color: T.orange, fontWeight: 600 }}>{o.speciality}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
              <TierBadge tier={o.tier} />
              {o.verified && <VerifiedBadge />}
              {o.escrow && <EscrowBadge />}
              {o.colisVerif && <ColisVerifBadge />}
              <DeliveryBadge type={o.delivery} />
              <ResponseBadge minutes={o.responseMin} />
            </div>
          </div>

          {/* Right: rating */}
          <SellerRating rating={o.rating} reviews={o.reviews} />
        </div>
      </div>

      {/* Bottom: stock + price + actions */}
      <div style={{
        padding: "12px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <StockIndicator stock={o.stock} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10.5, color: T.textDim }}>
            <span>📦 Délai: <b style={{ color: T.text }}>{o.leadDays}j</b></span>
            <span>🔢 MOQ: <b style={{ color: T.text }}>{o.moq} pcs</b></span>
            {o.delivery === "suntrex" && (
              <span style={{ color: T.orange, fontWeight: 700 }}>
                🚛 Suivi + vérification inclus
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PriceDisplay price={o.price} logged={logged} onLogin={onLogin} />
          {logged && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onCompare?.(o.id)} style={{
                width: 34, height: 34, borderRadius: 7,
                border: `1px solid ${isSelected ? T.blue : T.border}`,
                background: isSelected ? T.blueLight : T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: isSelected ? T.blue : T.textDim,
                transition: "all .15s",
              }} title="Comparer">
                {Ico.compare()}
              </button>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                background: T.orange, color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 16px",
                fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                fontFamily: T.font, transition: "all .15s",
                boxShadow: hov ? "0 3px 12px rgba(232,112,10,0.35)" : "none",
              }}>
                {Ico.msg()} Contacter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable detail */}
      {expanded && logged && (
        <div style={{
          padding: "12px 18px", borderTop: `1px solid ${T.borderLight}`,
          background: T.surface, fontSize: 12, color: T.textSec,
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>Conditions</div>
            <div>MOQ: {o.moq} pcs</div>
            <div>Délai: {o.leadDays} jours ouvrés</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>Protection</div>
            <div>{o.escrow ? "✓ Paiement escrow" : "✗ Pas d'escrow"}</div>
            <div>{o.colisVerif ? "✓ Colis vérifié" : "✗ Pas de vérif. colis"}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>Livraison</div>
            <div>{o.delivery === "suntrex" ? "🚛 SUNTREX DELIVERY" : "📦 Expédition vendeur"}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COMPARISON TABLE — Side-by-side view for selected vendors
// ═══════════════════════════════════════════════════════════════════
function ComparisonDrawer({ offers, selectedIds, onClose, logged }) {
  const selected = offers.filter(o => selectedIds.includes(o.id));
  if (selected.length < 2) return null;

  const rows = [
    { label: "Prix unitaire HT", key: "price", fmt: v => `€${v.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}` },
    { label: "Stock", key: "stock", fmt: v => v > 0 ? `${v.toLocaleString()} pcs` : "Sur commande" },
    { label: "Délai", key: "leadDays", fmt: v => `${v} jours` },
    { label: "MOQ", key: "moq", fmt: v => `${v} pcs` },
    { label: "Note", key: "rating", fmt: v => `★ ${v.toFixed(1)}` },
    { label: "Livraison", key: "delivery", fmt: v => v === "suntrex" ? "🚛 SUNTREX" : "📦 Vendeur" },
    { label: "Escrow", key: "escrow", fmt: v => v ? "✓ Oui" : "✗ Non" },
    { label: "Vérif. colis", key: "colisVerif", fmt: v => v ? "✓ Oui" : "✗ Non" },
    { label: "Réponse", key: "responseMin", fmt: v => v < 60 ? `~${v} min` : `~${Math.round(v/60)}h` },
    { label: "Transactions", key: "transactions", fmt: v => v.toLocaleString() },
  ];

  const bestPrice = Math.min(...selected.map(s => s.price));

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: T.bg, borderTop: `2px solid ${T.orange}`,
      boxShadow: "0 -8px 30px rgba(0,0,0,0.15)",
      maxHeight: "60vh", overflow: "auto",
      animation: "slideUp .3s ease-out",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {Ico.compare()}
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
              Comparaison directe
            </span>
            <span style={{ fontSize: 11, color: T.textDim }}>({selected.length} vendeurs)</span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: T.font, color: T.textSec,
          }}>
            Fermer ✕
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px", background: T.surface, borderBottom: `2px solid ${T.border}`, fontWeight: 600, color: T.textSec, width: 140 }}>
                  Critère
                </th>
                {selected.map(s => (
                  <th key={s.id} style={{
                    textAlign: "center", padding: "10px 12px", background: T.surface,
                    borderBottom: `2px solid ${T.border}`,
                  }}>
                    <div style={{ fontWeight: 700, color: T.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: T.textDim }}>{s.flag} {s.country}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.key}>
                  <td style={{ padding: "9px 12px", fontWeight: 500, color: T.textSec, borderBottom: `1px solid ${T.borderLight}`, background: i % 2 === 0 ? T.bg : T.surface }}>
                    {row.label}
                  </td>
                  {selected.map(s => {
                    const val = s[row.key];
                    const isBestPrice = row.key === "price" && val === bestPrice;
                    return (
                      <td key={s.id} style={{
                        textAlign: "center", padding: "9px 12px",
                        borderBottom: `1px solid ${T.borderLight}`,
                        background: i % 2 === 0 ? T.bg : T.surface,
                        fontWeight: isBestPrice ? 800 : 600,
                        color: isBestPrice ? T.green : T.text,
                      }}>
                        {logged ? row.fmt(val) : (row.key === "price" ? "●●●●" : row.fmt(val))}
                        {isBestPrice && <span style={{ fontSize: 9, color: T.green, display: "block", fontWeight: 600 }}>Meilleur</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RELATED PRODUCTS GRID
// ═══════════════════════════════════════════════════════════════════
function RelatedProducts({ currentId, category, logged, onLogin }) {
  const related = CATALOG_SAMPLE.filter(p => p.c === category && p.id !== currentId).slice(0, 4);
  if (related.length === 0) return null;

  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        Produits similaires
        <span style={{ fontSize: 11, fontWeight: 500, color: T.textDim }}>({related.length})</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {related.map(p => (
          <div key={p.id} className="hl" style={{
            border: `1px solid ${T.borderLight}`, borderRadius: T.radius,
            padding: 14, cursor: "pointer", transition: "all .2s",
            background: T.bg,
          }}>
            <div style={{
              height: 100, background: T.surface, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10, position: "relative", overflow: "hidden",
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: T.textDim, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {p.b}
              </div>
              <div style={{ position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 700, color: T.green, background: T.greenLight, padding: "1px 5px", borderRadius: 4 }}>
                {p.q > 0 ? `${p.q} pcs` : "—"}
              </div>
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#e4002b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{p.b}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, lineHeight: 1.3, marginBottom: 4, minHeight: 30, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {p.n}
            </div>
            <div style={{ fontSize: 10.5, color: T.textSec, marginBottom: 6 }}>{p.d}</div>
            {logged ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                  €{p.p.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                  <span style={{ fontSize: 10, fontWeight: 400, color: T.textDim }}>/pcs</span>
                </div>
                <span style={{ fontSize: 10, color: T.orange, fontWeight: 700 }}>
                  {generateOffersForProduct(p).length} offres →
                </span>
              </div>
            ) : (
              <button onClick={onLogin} style={{
                width: "100%", background: "none", border: `1px solid ${T.orange}`,
                borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 700,
                color: T.orange, cursor: "pointer", fontFamily: T.font,
              }}>
                S'inscrire pour voir les prix
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Product Detail with Multi-Vendor Comparison
// ═══════════════════════════════════════════════════════════════════
export default function SuntrexMultiVendor() {
  const [logged, setLogged] = useState(true);
  const [sort, setSort] = useState("price-asc");
  const [showAll, setShowAll] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");
  const [activeSpecTab, setActiveSpecTab] = useState("electrical");

  const P = DEMO_PRODUCT;
  const offers = useMemo(() => generateOffersForProduct(P), []);

  // Sort logic
  const sorted = useMemo(() => {
    let s = [...offers];
    if (filterCountry !== "all") s = s.filter(o => o.country === filterCountry);
    if (filterDelivery !== "all") s = s.filter(o => o.delivery === filterDelivery);
    switch (sort) {
      case "price-asc": s.sort((a, b) => a.price - b.price); break;
      case "price-desc": s.sort((a, b) => b.price - a.price); break;
      case "stock": s.sort((a, b) => b.stock - a.stock); break;
      case "rating": s.sort((a, b) => b.rating - a.rating); break;
      case "lead": s.sort((a, b) => a.leadDays - b.leadDays); break;
      case "trust": s.sort((a, b) => (TIERS[b.tier]?.rank || 0) - (TIERS[a.tier]?.rank || 0)); break;
    }
    return s;
  }, [offers, sort, filterCountry, filterDelivery]);

  const visible = showAll ? sorted : sorted.slice(0, 3);
  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(-4));
  }, []);

  const aggStock = offers.reduce((s, o) => s + o.stock, 0);
  const bestPrice = Math.min(...offers.map(o => o.price));
  const countries = [...new Set(offers.map(o => o.country))];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
        .offer-card { animation: fadeSlide .35s ease-out both }
        .offer-card:nth-child(1){animation-delay:.05s}.offer-card:nth-child(2){animation-delay:.1s}
        .offer-card:nth-child(3){animation-delay:.15s}.offer-card:nth-child(4){animation-delay:.2s}
        .offer-card:nth-child(5){animation-delay:.25s}.offer-card:nth-child(6){animation-delay:.3s}
        .hl{transition:transform .2s,box-shadow .2s,border-color .2s}.hl:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.08);border-color:${T.orange}!important}
        @media(max-width:767px){.hl:hover{transform:none;box-shadow:none}}
        ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
      `}</style>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${T.borderLight}`, padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: T.bg, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
            <span style={{ color: T.text }}>SUN</span>
            <span style={{ color: T.orange }}>TREX</span>
          </span>
          <span style={{
            fontSize: 8, fontWeight: 800, color: "#fff",
            background: `linear-gradient(135deg, ${T.orange}, #f59e0b)`,
            padding: "2px 8px", borderRadius: 4, letterSpacing: "0.08em",
          }}>MULTI-VENDOR</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {compareIds.length >= 2 && (
            <button onClick={() => setShowCompare(true)} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: T.blue, color: "#fff", border: "none",
              borderRadius: 7, padding: "7px 14px", fontSize: 11.5,
              fontWeight: 700, cursor: "pointer", fontFamily: T.font,
              animation: "fadeSlide .3s ease-out",
            }}>
              {Ico.compare()} Comparer ({compareIds.length})
            </button>
          )}
          <button onClick={() => setLogged(!logged)} style={{
            padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "none", fontFamily: T.font,
            background: logged ? T.greenLight : T.orangeLight,
            color: logged ? T.green : T.orange, transition: "all .15s",
          }}>
            {logged ? "✓ Connecté" : "⊘ Non connecté"}
          </button>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 20px 0", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textDim }}>
        <span style={{ cursor: "pointer", color: T.textSec }}>Accueil</span>
        {Ico.chevR(9)}
        <span style={{ cursor: "pointer", color: T.textSec }}>Onduleurs</span>
        {Ico.chevR(9)}
        <span style={{ cursor: "pointer", color: T.textSec }}>Huawei</span>
        {Ico.chevR(9)}
        <span style={{ color: T.text, fontWeight: 600 }}>{P.n}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 80px" }}>

        {/* ═══ PRODUCT HERO ═══ */}
        <div style={{
          display: "flex", gap: 28, border: `1px solid ${T.border}`,
          borderRadius: T.radiusLg, padding: 24, background: T.bg,
          marginBottom: 24, boxShadow: T.shadow, flexWrap: "wrap",
        }}>
          {/* Image placeholder */}
          <div style={{
            width: 310, minHeight: 350, background: `linear-gradient(135deg, ${T.surface} 0%, #f1f2f6 100%)`,
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, position: "relative", overflow: "hidden",
            border: `1px solid ${T.borderLight}`,
          }}>
            <div style={{ position: "absolute", top: 10, left: 12, fontSize: 10, fontWeight: 800, color: "#e4002b", opacity: .5, textTransform: "uppercase", letterSpacing: "0.06em" }}>HUAWEI</div>
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10, fontWeight: 700, color: T.green, background: "#fff", padding: "2px 8px", borderRadius: 10, boxShadow: T.shadow }}>
              ● {aggStock.toLocaleString()} pcs total
            </div>
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ width: 160, height: 160, margin: "0 auto 12px", background: "#e4002b12", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 56, opacity: .15 }}>⚡</span>
              </div>
              <div style={{ fontSize: 11, color: T.textDim, fontWeight: 500 }}>{P.b} {P.s}</div>
              <div style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>Photo produit réelle en production</div>
            </div>
            {/* Thumbnails */}
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", gap: 6 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  flex: 1, height: 48, background: T.bg, borderRadius: 6,
                  border: `1.5px solid ${i === 1 ? T.orange : T.borderLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "border-color .15s",
                  fontSize: 10, color: T.textDim,
                }}>
                  {i === 1 ? "◉" : "○"}
                </div>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#e4002b", letterSpacing: "0.04em", textTransform: "uppercase" }}>HUAWEI</span>
              <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono }}>{P.s}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, lineHeight: 1.2, margin: "0 0 6px" }}>{P.n}</h1>
            <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5, margin: "0 0 18px" }}>{P.d}</p>

            {/* Quick specs grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
              {[
                { l: "Puissance", v: "10 kW", i: "⚡" },
                { l: "Phases", v: "3Φ", i: "🔌" },
                { l: "MPPT", v: "3", i: "📊" },
                { l: "Rendement", v: "98.4%", i: "📈" },
                { l: "Protection", v: "IP65", i: "🛡️" },
                { l: "Poids", v: "13.5 kg", i: "⚖️" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: T.surface, borderRadius: 8, padding: "8px 10px",
                  border: `1px solid ${T.borderLight}`,
                }}>
                  <div style={{ fontSize: 10, color: T.textDim, marginBottom: 2 }}>{s.i} {s.l}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Aggregate pricing bar */}
            <div style={{
              background: `linear-gradient(135deg, ${T.orangeLight} 0%, #fffbeb 100%)`,
              border: `1px solid ${T.orangeBorder}`,
              borderRadius: T.radius, padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <div style={{ fontSize: 10.5, color: T.orange, fontWeight: 600 }}>
                  Disponible maintenant
                </div>
                <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: T.green }}>●</span>
                  {aggStock.toLocaleString()} pcs
                  <span style={{ color: T.textDim, fontWeight: 400 }}>
                    de <b style={{ color: T.orange }}>{offers.length} vendeurs</b> dans {countries.length} pays
                  </span>
                </div>
              </div>
              {logged ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: T.textDim }}>à partir de</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                    €{bestPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    <span style={{ fontSize: 11, fontWeight: 400, color: T.textDim }}> /pcs HT</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => setLogged(true)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: T.orange, color: "#fff", border: "none",
                  borderRadius: 7, padding: "9px 16px", fontSize: 12.5,
                  fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                }}>
                  {Ico.lock()} S'inscrire pour voir les prix
                </button>
              )}
            </div>

            {/* Features pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
              {P.features.map((f, i) => (
                <span key={i} style={{
                  background: T.blueLight, color: T.blue,
                  fontSize: 10.5, fontWeight: 600, padding: "3px 9px",
                  borderRadius: 16, display: "flex", alignItems: "center", gap: 3,
                }}>
                  {Ico.check(9)} {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ TWO COLUMN LAYOUT ═══ */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

          {/* LEFT: Specs + Datasheets */}
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            <Section title="Description" accent={T.orange}>
              <div style={{
                background: T.surface, borderRadius: T.radius, padding: "16px 18px",
                fontSize: 13, lineHeight: 1.7, color: T.textSec,
                border: `1px solid ${T.borderLight}`,
              }}>
                L'onduleur hybride triphasé SUN2000-10K-MAP0 de Huawei offre une puissance de 10 kW
                avec un rendement exceptionnel de 98.4%. Équipé de 3 MPPT, il est compatible avec les
                batteries LUNA2000 pour le stockage d'énergie. Certifié IP65, il fonctionne en
                convection naturelle pour un silence total. Détection d'arc AFCI intégrée par
                intelligence artificielle.
              </div>
            </Section>

            <Section title="Spécifications techniques" accent={T.orange}>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {Object.keys(P.specs).map(tab => (
                  <button key={tab} onClick={() => setActiveSpecTab(tab)} style={{
                    padding: "6px 14px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                    cursor: "pointer", fontFamily: T.font, border: "none", transition: "all .15s",
                    background: activeSpecTab === tab ? T.orange : T.surface,
                    color: activeSpecTab === tab ? "#fff" : T.textSec,
                  }}>
                    {tab === "general" ? "Général" : tab === "electrical" ? "Électrique" : "Mécanique"}
                  </button>
                ))}
              </div>
              <SpecsTable rows={P.specs[activeSpecTab]} />
            </Section>

            <Section title="Téléchargements" defaultOpen={false} accent={T.orange} count={P.datasheets.length}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {P.datasheets.map((ds, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", background: T.surface, borderRadius: 8,
                    border: `1px solid ${T.borderLight}`, cursor: "pointer",
                    transition: "border-color .15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>📄</span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{ds.name}</div>
                        <div style={{ fontSize: 10.5, color: T.textDim }}>{ds.size} — {ds.type.toUpperCase()}</div>
                      </div>
                    </div>
                    {Ico.dl()}
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* RIGHT: Offers + RFQ */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>

            {/* AI Advisor CTA */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              background: T.purpleLight, borderRadius: T.radius, marginBottom: 14,
              border: `1px solid #ddd6fe`, cursor: "pointer",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${T.purple} 0%, #a855f7 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.purple }}>SUNTREX AI Advisor</div>
                <div style={{ fontSize: 11, color: T.textSec }}>Ce produit convient-il à votre projet ? Demandez à notre IA →</div>
              </div>
            </div>

            {/* RFQ Banner */}
            <div style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              borderRadius: T.radiusLg, padding: "20px 22px", marginBottom: 18,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0, opacity: 0.04,
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }} />
              <div style={{ position: "relative" }}>
                <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
                  Besoin d'un prix pour {'>'}50 pcs ?
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 12px" }}>
                  Créez une demande (RFQ) — recevez des offres personnalisées de tous nos vendeurs.
                </p>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  {["Gratuit", "Sans engagement", "Réponses < 24h", "Multi-vendeurs"].map(t => (
                    <span key={t} style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ color: T.orange }}>✓</span> {t}
                    </span>
                  ))}
                </div>
                <button style={{
                  background: T.orange, color: "#fff", border: "none",
                  borderRadius: 7, padding: "9px 18px", fontSize: 12,
                  fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                }}>
                  Créer une demande (RFQ)
                </button>
              </div>
            </div>

            {/* ═══ OFFERS SECTION ═══ */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 10, flexWrap: "wrap", gap: 8,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                Offres vendeurs
                <span style={{
                  fontSize: 11, fontWeight: 600, color: T.orange,
                  background: T.orangeLight, padding: "2px 8px", borderRadius: 10,
                }}>
                  {sorted.length} vendeurs
                </span>
              </h2>
            </div>

            {/* Filters + Sort bar */}
            <div style={{
              display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.textDim, fontSize: 11.5 }}>
                {Ico.sort()}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{
                padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                fontSize: 11, color: T.textSec, fontFamily: T.font, background: T.bg,
                cursor: "pointer",
              }}>
                <option value="price-asc">Prix ↑</option>
                <option value="price-desc">Prix ↓</option>
                <option value="stock">Stock</option>
                <option value="rating">Note</option>
                <option value="lead">Délai</option>
                <option value="trust">Confiance</option>
              </select>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.textDim, fontSize: 11.5, marginLeft: 4 }}>
                {Ico.filter()}
              </div>
              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{
                padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                fontSize: 11, color: T.textSec, fontFamily: T.font, background: T.bg, cursor: "pointer",
              }}>
                <option value="all">Tous pays</option>
                {countries.map(c => <option key={c} value={c}>{FLAGS[c]} {c}</option>)}
              </select>

              <select value={filterDelivery} onChange={e => setFilterDelivery(e.target.value)} style={{
                padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                fontSize: 11, color: T.textSec, fontFamily: T.font, background: T.bg, cursor: "pointer",
              }}>
                <option value="all">Toute livraison</option>
                <option value="suntrex">🚛 SUNTREX seulement</option>
                <option value="seller">📦 Vendeur</option>
              </select>

              {(filterCountry !== "all" || filterDelivery !== "all") && (
                <button onClick={() => { setFilterCountry("all"); setFilterDelivery("all"); }} style={{
                  background: "none", border: "none", fontSize: 11, color: T.red,
                  cursor: "pointer", fontWeight: 600, fontFamily: T.font,
                }}>
                  ✕ Reset
                </button>
              )}
            </div>

            {/* Vendor Offer Cards */}
            {visible.map((o, i) => (
              <VendorOfferCard
                key={o.id}
                offer={o}
                logged={logged}
                onLogin={() => setLogged(true)}
                rank={sort === "price-asc" && filterCountry === "all" ? i : -1}
                isCompact={false}
                onCompare={toggleCompare}
                isSelected={compareIds.includes(o.id)}
              />
            ))}

            {/* Show all button */}
            {!showAll && sorted.length > 3 && (
              <button onClick={() => setShowAll(true)} style={{
                width: "100%", padding: "12px",
                background: `linear-gradient(135deg, ${T.orange} 0%, #f59e0b 100%)`,
                color: "#fff", border: "none", borderRadius: T.radius,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: "0 2px 10px rgba(232,112,10,0.3)",
              }}>
                Voir les {sorted.length} offres {Ico.chevD(11, true)}
              </button>
            )}

            {sorted.length === 0 && (
              <div style={{
                textAlign: "center", padding: "30px 20px", color: T.textDim,
                background: T.surface, borderRadius: T.radius, border: `1px solid ${T.borderLight}`,
              }}>
                <p style={{ fontSize: 13, margin: "0 0 8px" }}>Aucune offre ne correspond à vos filtres.</p>
                <button onClick={() => { setFilterCountry("all"); setFilterDelivery("all"); }} style={{
                  background: T.orange, color: "#fff", border: "none",
                  borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: T.font,
                }}>
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {/* Trust Section */}
            <div style={{
              marginTop: 20, borderRadius: T.radiusLg, overflow: "hidden",
              border: `1px solid ${T.border}`,
            }}>
              <div style={{
                padding: "14px 18px",
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                color: "#fff", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: T.orange, display: "inline-flex",
                  alignItems: "center", justifyContent: "center", fontSize: 12,
                }}>🛡️</span>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>Protection SUNTREX</span>
                <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>Chaque transaction protégée</span>
              </div>
              <div style={{ padding: "12px 18px", background: T.bg }}>
                {[
                  { badge: <EscrowBadge />, text: "Fonds sécurisés en escrow jusqu'à confirmation de réception" },
                  { badge: <ColisVerifBadge />, text: "Chaque colis vérifié par QR code + photo avant expédition" },
                  { badge: <DeliveryBadge type="suntrex" />, text: "Suivi temps réel + assurance transport incluse" },
                  { badge: "📞", text: "Support multicanal — Chat, Email, Téléphone, WhatsApp — SLA < 30min" },
                  { badge: "💰", text: "Commission -5% vs concurrence (4.75% au lieu de 5%+)" },
                  { badge: "🔄", text: "Remboursement sous 48h en cas de litige confirmé" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0",
                    borderBottom: i < 5 ? `1px solid ${T.borderLight}` : "none",
                    fontSize: 12, color: T.textSec,
                  }}>
                    <span style={{ flexShrink: 0 }}>{typeof item.badge === "string" ? item.badge : item.badge}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentId={P.id}
          category={P.c}
          logged={logged}
          onLogin={() => setLogged(true)}
        />
      </div>

      {/* Comparison Drawer */}
      {showCompare && (
        <ComparisonDrawer
          offers={offers}
          selectedIds={compareIds}
          onClose={() => setShowCompare(false)}
          logged={logged}
        />
      )}
    </div>
  );
}
