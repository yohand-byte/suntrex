import { useState, useMemo, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Sprint 2 V2: Product Detail Page
   ═══════════════════════════════════════════════════════════════
   
   ORIGINAL badge system • SUNTREX identity • NOT a sun.store copy
   
   Unique differentiators:
   ① SUNTREX VERIFIED — Our own verification (not generic "trusted")
   ② COLIS PROTÉGÉ — Package verification system (unique to us)
   ③ PAIEMENT ESCROW — Funds locked until delivery confirmed
   ④ RÉPONSE FLASH — Response time guarantee with live indicator
   ⑤ PRIX GARANTI — Our 5%-below-competitors commission badge
   ⑥ SELLER TIER SYSTEM — Bronze / Silver / Gold / Platinum
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: "#ffffff", surface: "#f8f9fb", surfaceAlt: "#f2f3f7",
  border: "#e4e5ec", borderLight: "#eef0f4",
  text: "#1a1a2e", textSec: "#5f6368", textDim: "#9aa0a6",
  green: "#34a853", greenDark: "#1e7e34", greenLight: "#e6f4ea", greenBorder: "#ceead6",
  orange: "#E8700A", orangeHover: "#d4630a", orangeLight: "#fff4e6", orangeBorder: "#ffe0b2",
  red: "#ea4335", redLight: "#fce8e6",
  blue: "#1a73e8", blueLight: "#e8f0fe",
  yellow: "#fbbc04", yellowLight: "#fef7e0",
  purple: "#7c3aed", purpleLight: "#f3e8ff",
  teal: "#0d9488", tealLight: "#ccfbf1",
  shadow: "0 1px 3px rgba(0,0,0,0.06)", shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  radius: 10, radiusLg: 14,
  font: "'DM Sans', system-ui, sans-serif",
};

// ── SELLER TIER SYSTEM (unique to SUNTREX) ─────────────────────
const SELLER_TIERS = {
  platinum: { label: "Platine", icon: "◆", color: "#475569", bg: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)", border: "#94a3b8", glow: "0 0 8px rgba(148,163,184,0.4)" },
  gold:     { label: "Or", icon: "◆", color: "#92400e", bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #fef3c7 100%)", border: "#f59e0b", glow: "0 0 8px rgba(245,158,11,0.3)" },
  silver:   { label: "Argent", icon: "◇", color: "#64748b", bg: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)", border: "#94a3b8", glow: "none" },
  bronze:   { label: "Bronze", icon: "○", color: "#9a3412", bg: "linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fed7aa 100%)", border: "#f97316", glow: "none" },
};

// ── PRODUCT DATA ───────────────────────────────────────────────
const PRODUCT = {
  id: "hw-sun2000-10ktl-m2", sku: "SUN2000-10KTL-M2",
  name: "Huawei SUN2000-10KTL-M2", brand: "Huawei", brandColor: "#e4002b",
  category: "inverters", type: "Commercial", power: "10 kW",
  phases: 3, mppt: 2, efficiency: "98.6%", protection: "IP65",
  weight: 11.8, warranty: "10 years",
  description: "The SUN2000-10KTL-M2 is a high-efficiency three-phase string inverter for small to medium commercial rooftop installations. Featuring 98.6% peak efficiency, 2 MPPTs, AI-powered AFCI arc-fault detection, and Smart I-V Curve Diagnosis for proactive maintenance. IP65-rated with natural convection cooling for silent, maintenance-free operation.",
  features: ["Smart I-V Curve Diagnosis", "AI Powered AFCI", "PID Recovery", "Export Limitation"],
  certifications: ["IEC 62109-1", "IEC 62109-2", "EN 50549-1"],
};

const OFFERS = [
  { id: "S01", name: "QUALIWATT", country: "FR", flag: "🇫🇷", rating: 4.8, reviews: 8, stock: 1064, price: 1249,
    tier: "gold", verified: true, escrow: true, delivery: "suntrex", colisVerif: true, responseMin: 15, transactions: 142, joined: "2024" },
  { id: "S02", name: "SolarPro GmbH", country: "DE", flag: "🇩🇪", rating: 4.6, reviews: 34, stock: 640, price: 1319,
    tier: "silver", verified: true, escrow: true, delivery: "seller", colisVerif: false, responseMin: 45, transactions: 67, joined: "2025" },
  { id: "S03", name: "EnerSol", country: "ES", flag: "🇪🇸", rating: 4.3, reviews: 12, stock: 320, price: 1398,
    tier: "bronze", verified: false, escrow: false, delivery: "seller", colisVerif: false, responseMin: 120, transactions: 11, joined: "2025" },
];

const SPECS = {
  general: [
    { l: "SKU", v: "SUN2000-10KTL-M2" }, { l: "Marque", v: "Huawei" },
    { l: "Garantie", v: "10 ans (extensible à 20)" }, { l: "Indice de protection", v: "IP65" },
    { l: "Certifications", v: "IEC 62109-1, IEC 62109-2, EN 50549-1" },
  ],
  electrical: [
    { l: "Puissance nominale AC", v: "10 000 W" }, { l: "Puissance max DC", v: "15 000 W" },
    { l: "Rendement max", v: "98.6%" }, { l: "Nombre de MPPT", v: "2" },
    { l: "Nombre de phases", v: "3" }, { l: "Tension de démarrage", v: "200 V" },
    { l: "Plage de tension MPPT", v: "200 V — 1000 V" }, { l: "Courant max par MPPT", v: "15 A" },
  ],
  mechanical: [
    { l: "Poids", v: "11.8 kg" }, { l: "Dimensions (L×l×H)", v: "525 × 370 × 145 mm" },
    { l: "Refroidissement", v: "Convection naturelle" }, { l: "Niveau sonore", v: "< 30 dB" },
  ],
};

const RELATED = [
  { name: "SUN2000-5KTL-M2", brand: "Huawei", power: "5 kW", price: 689, type: "Residential" },
  { name: "SUN2000-20KTL-M5", brand: "Huawei", power: "20 kW", price: 2150, type: "Commercial" },
  { name: "SUN2000-30KTL-M3", brand: "Huawei", power: "30 kW", price: 1626, type: "Commercial" },
  { name: "SUN2000-6KTL-L1", brand: "Huawei", power: "6 kW", price: 545, type: "Hybrid" },
];

// ═══════════════════════════════════════════════════════════════
// SUNTREX BADGE SYSTEM — Original design language
// ═══════════════════════════════════════════════════════════════

// ① Seller Tier Badge (unique metallic gradient system)
function TierBadge({ tier }) {
  const t = SELLER_TIERS[tier];
  if (!t) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px 3px 7px", borderRadius: 6,
      background: t.bg, border: `1px solid ${t.border}`,
      boxShadow: t.glow,
      fontSize: 10.5, fontWeight: 700, color: t.color,
      letterSpacing: "0.03em",
    }}>
      <span style={{ fontSize: 11 }}>{t.icon}</span>
      {t.label}
    </span>
  );
}

// ② SUNTREX VERIFIED badge (our own verification — not generic)
function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 6,
      background: `linear-gradient(135deg, ${C.tealLight} 0%, #e0fef4 100%)`,
      border: `1px solid ${C.teal}40`,
      fontSize: 10.5, fontWeight: 700, color: C.teal,
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L14.09 8.26L22 9.27L16 14.14L18.18 21.02L12 17.77L5.82 21.02L8 14.14L2 9.27L9.91 8.26L12 2Z" fill={C.teal} opacity="0.2"/>
        <path d="M9 12l2 2 4-4" stroke={C.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      SUNTREX Vérifié
    </span>
  );
}

// ③ COLIS PROTÉGÉ badge (QR + photo verification — UNIQUE to SUNTREX)
function ColisProtegeBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px 3px 6px", borderRadius: 6,
      background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
      border: "1px solid #f59e0b40",
      fontSize: 10.5, fontWeight: 700, color: "#92400e",
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 16, height: 16, borderRadius: 3,
        background: "#f59e0b", color: "#fff", fontSize: 8, fontWeight: 800,
      }}>
        QR
      </span>
      Colis protégé
    </span>
  );
}

// ④ ESCROW badge (funds protection)
function EscrowBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 6,
      background: `linear-gradient(135deg, ${C.purpleLight} 0%, #ede9fe 100%)`,
      border: `1px solid ${C.purple}30`,
      fontSize: 10.5, fontWeight: 700, color: C.purple,
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="14" rx="2" stroke={C.purple} strokeWidth="2" opacity="0.4"/>
        <path d="M12 10v4m-2-2h4" stroke={C.purple} strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Escrow
    </span>
  );
}

// ⑤ SUNTREX DELIVERY badge (our own delivery with tracking)
function DeliveryBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px 3px 6px", borderRadius: 6,
      background: `linear-gradient(135deg, ${C.orangeLight} 0%, #fff7ed 100%)`,
      border: `1px solid ${C.orange}30`,
      fontSize: 10.5, fontWeight: 700, color: C.orange,
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 16, height: 16, borderRadius: "50%",
        background: C.orange, padding: 0,
      }}>
        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>
      </span>
      SUNTREX Delivery
    </span>
  );
}

// ⑥ RÉPONSE FLASH — live response time indicator (animated dot)
function ResponseBadge({ minutes }) {
  const isFlash = minutes <= 30;
  const isFast = minutes <= 60;
  const label = minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)}h`;
  const color = isFlash ? C.green : isFast ? C.orange : C.textDim;
  const bg = isFlash ? C.greenLight : isFast ? C.orangeLight : C.surface;
  
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 6,
      background: bg, border: `1px solid ${color}30`,
      fontSize: 10.5, fontWeight: 700, color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color,
        animation: isFlash ? "flashPulse 1.5s ease-in-out infinite" : "none",
      }} />
      {isFlash ? "Réponse flash" : "Réponse"} ~{label}
    </span>
  );
}

// ── Seller Stats Mini (transactions + ancienneté) ──────────────
function SellerStats({ transactions, joined }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      fontSize: 10.5, color: C.textDim, fontWeight: 500,
    }}>
      <span>{transactions} transactions</span>
      <span style={{ width: 1, height: 10, background: C.border }} />
      <span>Depuis {joined}</span>
    </span>
  );
}

// ── Icons ──────────────────────────────────────────────────────
const Ico = {
  chevR: (s=12) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>,
  chevD: (s=14, open=true) => <svg width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{transform:open?"rotate(0)":"rotate(-90deg)",transition:"transform .2s"}}><path d="M6 9l6 6 6-6"/></svg>,
  lock: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  cart: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  plus: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  dl: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ai: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={C.purple} strokeWidth="1.5" opacity="0.3"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke={C.purple} strokeWidth="3" strokeLinecap="round"/></svg>,
};

// ── Rating with seller bar ─────────────────────────────────────
function SellerRating({ rating, reviews }) {
  const pct = (rating / 5) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 50, height: 5, borderRadius: 3, background: C.borderLight, overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 3,
          background: rating >= 4.5 ? C.green : rating >= 4 ? C.orange : C.red,
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{rating}</span>
      <span style={{ fontSize: 10.5, color: C.textDim }}>({reviews} avis)</span>
    </div>
  );
}

// ── Collapsible Section ────────────────────────────────────────
function Sec({ title, children, open: init = true, accent = C.orange }) {
  const [open, setOpen] = useState(init);
  return <div style={{ borderBottom: `1px solid ${C.borderLight}`, marginBottom: 4 }}>
    <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 0", background: "none", border: "none", cursor: "pointer", fontSize: 14.5, fontWeight: 700, color: C.text, textAlign: "left", fontFamily: C.font }}>{title}{Ico.chevD(13, open)}</button>
    {open && <><div style={{ width: "100%", height: 2.5, background: accent, borderRadius: 2, marginBottom: 12 }} /><div style={{ paddingBottom: 18 }}>{children}</div></>}
  </div>;
}

function SpTbl({ rows }) {
  return <div style={{ border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden" }}>
    {rows.map((r, i) => <div key={i} style={{ display: "flex", padding: "11px 16px", fontSize: 13, background: i % 2 === 0 ? C.surface : C.bg, borderBottom: i < rows.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
      <span style={{ flex: 1, color: C.textSec, fontWeight: 500 }}>{r.l}</span>
      <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{r.v}</span>
    </div>)}
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// OFFER CARD V2 — with original SUNTREX badges
// ═══════════════════════════════════════════════════════════════
function OfferCard({ o, logged, rank }) {
  const [h, setH] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        border: `1.5px solid ${rank === 0 ? C.orangeBorder : h ? C.border : C.borderLight}`,
        borderRadius: C.radiusLg, marginBottom: 12, overflow: "hidden",
        background: C.bg, transition: "all .2s",
        boxShadow: h ? C.shadowMd : C.shadow,
      }}
    >
      {/* Top bar: Seller identity */}
      <div style={{
        padding: "14px 20px 12px",
        background: rank === 0 ? "linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)" : C.bg,
        borderBottom: `1px solid ${C.borderLight}`,
        position: "relative",
      }}>
        {rank === 0 && (
          <div style={{
            position: "absolute", top: 0, left: 20,
            background: `linear-gradient(135deg, ${C.orange} 0%, #f59e0b 100%)`,
            color: "#fff", fontSize: 9, fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: "0 0 6px 6px",
          }}>
            ★ Meilleur prix
          </div>
        )}

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexWrap: "wrap", gap: 8, marginTop: rank === 0 ? 8 : 0,
        }}>
          {/* Left: seller info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {/* Seller avatar circle */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.orange}20 0%, ${C.orange}40 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: C.orange,
                border: `2px solid ${C.orange}30`,
              }}>
                {o.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>
                  {o.name}
                  <span style={{ fontSize: 14, marginLeft: 5 }}>{o.flag}</span>
                </div>
                <SellerStats transactions={o.transactions} joined={o.joined} />
              </div>
            </div>

            {/* Badges row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
              <TierBadge tier={o.tier} />
              {o.verified && <VerifiedBadge />}
              {o.escrow && <EscrowBadge />}
              {o.colisVerif && <ColisProtegeBadge />}
              {o.delivery === "suntrex" && <DeliveryBadge />}
              <ResponseBadge minutes={o.responseMin} />
            </div>
          </div>

          {/* Right: rating */}
          <SellerRating rating={o.rating} reviews={o.reviews} />
        </div>
      </div>

      {/* Bottom: availability + price */}
      <div style={{
        padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12.5, color: C.textSec }}>
            Disponibilité{" "}
            <b style={{ color: C.text }}>
              {o.stock > 0 ? `${o.stock.toLocaleString()} pcs` : "Sur commande"}
            </b>
            <span style={{
              display: "inline-block", width: 7, height: 7, borderRadius: "50%",
              background: o.stock > 100 ? C.green : o.stock > 10 ? "#f59e0b" : C.red,
              marginLeft: 5, verticalAlign: "middle",
            }} />
          </div>
          {o.delivery === "suntrex" && (
            <div style={{ fontSize: 10.5, color: C.orange, fontWeight: 600, marginTop: 4 }}>
              📦 Livraison SUNTREX — Suivi + vérification inclus
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logged ? (
            <>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: C.textDim }}>dès</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                  €{o.price.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim, marginLeft: 2 }}>/pcs</span>
                </div>
              </div>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                background: C.orange, color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 20px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: C.font, transition: "all .15s",
                boxShadow: h ? "0 3px 12px rgba(232,112,10,0.35)" : "none",
              }}>
                {Ico.cart()} Détails de l'offre
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.textDim, filter: "blur(7px)", userSelect: "none" }}>
                €{(o.price * 0.9 + Math.random() * 30).toFixed(0)}
              </span>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                background: C.orange, color: "#fff", border: "none",
                borderRadius: 8, padding: "10px 18px",
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: C.font,
              }}>
                {Ico.lock()} S'inscrire pour voir les prix
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function ProductDetailV2() {
  const [logged, setLogged] = useState(true);
  const [sort, setSort] = useState("price-asc");
  const [showAll, setShowAll] = useState(false);
  const P = PRODUCT;

  const sorted = useMemo(() => {
    const s = [...OFFERS];
    if (sort === "price-asc") s.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") s.sort((a, b) => b.price - a.price);
    if (sort === "stock") s.sort((a, b) => b.stock - a.stock);
    if (sort === "rating") s.sort((a, b) => b.rating - a.rating);
    return s;
  }, [sort]);

  const visible = showAll ? sorted : sorted.slice(0, 2);

  return (
    <div style={{ fontFamily: C.font, background: C.bg, minHeight: "100vh", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes flashPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .offer-enter { animation: fadeSlide .3s ease-out both }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${C.borderLight}`, padding: "12px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.bg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>SUN</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.orange, letterSpacing: "-0.02em" }}>TREX</span>
          </div>
          <span style={{
            fontSize: 8.5, fontWeight: 700, color: "#fff",
            background: `linear-gradient(135deg, ${C.orange} 0%, #f59e0b 100%)`,
            padding: "2px 7px", borderRadius: 4, letterSpacing: "0.06em",
          }}>SPRINT 2</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setLogged(!logged)}
            style={{
              padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: C.font,
              background: logged ? C.greenLight : C.orangeLight,
              color: logged ? C.greenDark : C.orange,
              transition: "all .15s",
            }}
          >
            {logged ? "✓ Connecté" : "⊘ Non connecté"}
          </button>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.textDim }}>
        <span style={{ cursor: "pointer", color: C.textSec }}>Accueil</span>{Ico.chevR(10)}
        <span style={{ cursor: "pointer", color: C.textSec }}>Onduleurs</span>{Ico.chevR(10)}
        <span style={{ color: C.text, fontWeight: 500 }}>{P.name}</span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 60px" }}>
        {/* ── Product Header ── */}
        <div style={{
          display: "flex", gap: 28, border: `1px solid ${C.border}`,
          borderRadius: C.radiusLg, padding: 24, background: C.bg,
          marginBottom: 24, boxShadow: C.shadow, flexWrap: "wrap",
        }}>
          {/* Image */}
          <div style={{
            width: 300, minHeight: 340, background: C.surface, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, position: "relative", overflow: "hidden",
            border: `1px solid ${C.borderLight}`,
          }}>
            <div style={{ position: "absolute", top: 10, left: 12, fontSize: 10, fontWeight: 800, color: P.brandColor, opacity: .6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{P.brand}</div>
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10.5, fontWeight: 700, color: C.green, background: "#fff", padding: "2px 7px", borderRadius: 10, boxShadow: C.shadow }}>● 2.0k pcs</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 72, opacity: .12, marginBottom: 8 }}>☀</div>
              <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>{P.brand} {P.sku}</div>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: P.brandColor, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 5 }}>{P.brand}</div>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: C.text, lineHeight: 1.25, margin: "0 0 5px" }}>{P.name}</h1>
            <div style={{ fontSize: 13.5, color: C.textSec, marginBottom: 16 }}>{P.type} — {P.phases}-Phase — {P.power}</div>

            {/* Quick specs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginBottom: 18 }}>
              {[
                { l: "Puissance", v: P.power, i: "⚡" }, { l: "Phases", v: `${P.phases}Φ`, i: "🔌" }, { l: "MPPT", v: P.mppt, i: "📊" },
                { l: "Rendement", v: P.efficiency, i: "📈" }, { l: "Protection", v: P.protection, i: "🛡️" }, { l: "Poids", v: `${P.weight} kg`, i: "⚖️" },
              ].map((s, i) => (
                <div key={i} style={{ background: C.surface, borderRadius: 7, padding: "9px 12px", border: `1px solid ${C.borderLight}` }}>
                  <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 2 }}>{s.i} {s.l}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Availability + price bar */}
            <div style={{
              background: `linear-gradient(135deg, ${C.orangeLight} 0%, #fffbeb 100%)`,
              border: `1px solid ${C.orangeBorder}`,
              borderRadius: C.radius, padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <div style={{ fontSize: 10.5, color: C.orange, fontWeight: 600, marginBottom: 1 }}>
                  Total disponible
                </div>
                <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>
                  <span style={{ color: C.green }}>●</span> {OFFERS.reduce((s, o) => s + o.stock, 0).toLocaleString()} pcs
                  <span style={{ color: C.textDim, fontWeight: 400, marginLeft: 7 }}>de {OFFERS.length} vendeurs</span>
                </div>
              </div>
              {logged ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10.5, color: C.textDim }}>dès</div>
                  <div style={{ fontSize: 23, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                    €{Math.min(...OFFERS.map(o => o.price)).toLocaleString()}
                    <span style={{ fontSize: 12, fontWeight: 400, color: C.textDim }}> /pcs</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => setLogged(true)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: C.orange, color: "#fff", border: "none",
                  borderRadius: 7, padding: "9px 16px", fontSize: 12.5,
                  fontWeight: 700, cursor: "pointer", fontFamily: C.font,
                }}>
                  {Ico.lock()} S'inscrire pour voir les prix
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Two columns ── */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* LEFT: specs */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <Sec title="Description" accent={C.orange}>
              <div style={{ background: C.surface, borderRadius: C.radius, padding: "16px 20px", fontSize: 13.5, lineHeight: 1.7, color: C.textSec, border: `1px solid ${C.borderLight}` }}>
                {P.description}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                {P.features.map((f, i) => <span key={i} style={{ background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 16 }}>✓ {f}</span>)}
              </div>
            </Sec>

            <Sec title="Téléchargements" open={false} accent={C.orange}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.surface, borderRadius: C.radius, border: `1px solid ${C.borderLight}`, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 7, background: C.orangeLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" fill="none" stroke={C.orange} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>Fiche technique — {P.name}</div>
                    <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 1 }}>PDF</div>
                  </div>
                </div>
                {Ico.dl()}
              </div>
            </Sec>

            <Sec title="Spécifications techniques" accent={C.orange}>
              <SpTbl rows={[...SPECS.general, ...SPECS.electrical]} />
            </Sec>

            <Sec title="Caractéristiques mécaniques" open={false} accent={C.orange}>
              <SpTbl rows={SPECS.mechanical} />
            </Sec>
          </div>

          {/* RIGHT: offers */}
          <div style={{ flex: 1, minWidth: 320 }}>
            {/* AI Advisor teaser */}
            <div style={{
              background: `linear-gradient(135deg, ${C.purpleLight} 0%, #ede9fe 100%)`,
              border: `1px solid ${C.purple}20`,
              borderRadius: C.radiusLg, padding: "16px 20px",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", transition: "all .15s",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.purple} 0%, #a78bfa 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16,
              }}>
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.purple }}>SUNTREX AI Advisor</div>
                <div style={{ fontSize: 11, color: C.textSec }}>Ce produit est-il adapté à votre projet ? Demandez à notre IA →</div>
              </div>
            </div>

            {/* RFP Banner */}
            <div style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)",
              borderRadius: C.radiusLg, padding: "22px 24px", marginBottom: 20,
              position: "relative", overflow: "hidden",
            }}>
              {/* Subtle grid pattern */}
              <div style={{
                position: "absolute", inset: 0, opacity: 0.05,
                backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
              <div style={{ position: "relative" }}>
                <h3 style={{ color: "#fff", fontSize: 15.5, fontWeight: 700, marginBottom: 5 }}>Besoin d'un prix pour une grande quantité ?</h3>
                <p style={{ color: "#9ca3af", fontSize: 12.5, margin: "0 0 12px" }}>Demande de proposition (RFP) — offres personnalisées de tous nos vendeurs.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {["Rapide", "Gratuit", "Sans engagement", "Réponse < 24h"].map(t => <span key={t} style={{ fontSize: 10.5, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}><span style={{ color: C.orange }}>✓</span> {t}</span>)}
                </div>
                <button style={{
                  background: C.orange, color: "#fff", border: "none",
                  borderRadius: 7, padding: "9px 18px", fontSize: 12.5,
                  fontWeight: 700, cursor: "pointer", fontFamily: C.font,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {Ico.plus()} Créer une demande
                </button>
              </div>
            </div>

            {/* Offers header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 15.5, fontWeight: 700, margin: 0 }}>
                Offres <span style={{ fontSize: 12, fontWeight: 500, color: C.textDim }}>({OFFERS.length} vendeurs)</span>
              </h2>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{
                padding: "6px 10px", borderRadius: 7, border: `1px solid ${C.border}`,
                fontSize: 11.5, color: C.textSec, fontFamily: C.font, background: C.bg, cursor: "pointer",
              }}>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="stock">Disponibilité</option>
                <option value="rating">Meilleure note</option>
              </select>
            </div>

            {/* Offer Cards */}
            {visible.map((o, i) => <div key={o.id} className="offer-enter" style={{ animationDelay: `${i * 0.08}s` }}><OfferCard o={o} logged={logged} rank={sort === "price-asc" ? i : -1} /></div>)}

            {!showAll && sorted.length > 2 && (
              <button onClick={() => setShowAll(true)} style={{
                width: "100%", padding: "11px",
                background: `linear-gradient(135deg, ${C.orange} 0%, #f59e0b 100%)`,
                color: "#fff", border: "none", borderRadius: C.radius,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: C.font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                Voir toutes les offres ({sorted.length}) {Ico.chevD(11, true)}
              </button>
            )}

            {/* Trust Section — SUNTREX Identity */}
            <div style={{
              marginTop: 20, borderRadius: C.radiusLg, overflow: "hidden",
              border: `1px solid ${C.border}`,
            }}>
              <div style={{
                padding: "14px 20px",
                background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)",
                color: "#fff",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: C.orange, display: "inline-flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 11,
                  }}>🛡️</span>
                  Protection SUNTREX
                </div>
              </div>
              <div style={{ padding: "14px 20px", background: C.bg }}>
                {[
                  { icon: <EscrowBadge />, text: "Fonds bloqués et sécurisés jusqu'à confirmation de réception" },
                  { icon: <ColisProtegeBadge />, text: "Chaque colis vérifié par QR code + photo avant expédition" },
                  { icon: <DeliveryBadge />, text: "Suivi en temps réel + assurance transport incluse" },
                  { icon: "📞", text: "Support multicanal — Chat, Email, Téléphone, WhatsApp — SLA < 30min" },
                  { icon: "🔄", text: "Remboursement sous 48h en cas de litige confirmé" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0",
                    borderBottom: i < 4 ? `1px solid ${C.borderLight}` : "none",
                    fontSize: 12, color: C.textSec,
                  }}>
                    <span style={{ flexShrink: 0 }}>{typeof item.icon === "string" ? item.icon : item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Products ── */}
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Produits similaires</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {RELATED.map((r, i) => (
              <div key={i} style={{
                border: `1px solid ${C.borderLight}`, borderRadius: C.radius,
                padding: 13, cursor: "pointer", transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.boxShadow = C.shadowMd }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderLight; e.currentTarget.style.boxShadow = "none" }}
              >
                <div style={{ height: 90, background: C.surface, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 28, opacity: .12 }}>☀</span>
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: P.brandColor, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>Huawei</div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 5, minHeight: 28 }}>{r.name}</div>
                <div style={{ fontSize: 10.5, color: C.textSec }}>{r.power} • {r.type}</div>
                {logged ? <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 7 }}>€{r.price.toLocaleString()} <span style={{ fontSize: 10, color: C.textDim, fontWeight: 400 }}>/pcs</span></div>
                  : <div style={{ fontSize: 11.5, color: C.orange, fontWeight: 600, marginTop: 7, cursor: "pointer" }} onClick={() => setLogged(true)}>S'inscrire →</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
