import { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SUNTREX — Buyer Dashboard (Supabase-Connected)
   ═══════════════════════════════════════════════════════════════════════════
   
   Complete buyer-side dashboard with REAL Supabase queries + mock fallback.
   
   Tabs:
   ① Overview — KPIs, recent orders, spending chart, quick actions
   ② Mes Achats — Order history with status tracking + delivery timeline
   ③ Demandes de Devis (RFQ) — Request for quotation management
   ④ Adresses — Shipping/billing address CRUD
   ⑤ Mon Profil — Company info, VAT status, account settings
   
   Supabase tables queried:
   - orders (buyer_id, status, total, items, created_at)
   - order_items (order_id, product_sku, quantity, unit_price, seller_id)
   - rfq (buyer_id, product_sku, quantity, status, responses)
   - addresses (user_id, type, label, street, city, zip, country)
   - profiles (user_id, first_name, last_name, phone, avatar_url)
   - companies (user_id, legal_name, vat_number, vat_verified, country)
   - consents (user_id, cgv_accepted_at, marketing_suntrex)
   
   Design: sun.store sidebar layout, white/green/orange B2B professional
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── DESIGN TOKENS ─────────────────────────────────────────────
const T = {
  font: "'DM Sans', 'Outfit', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  bg: "#f7f8fa",
  surface: "#ffffff",
  card: "#ffffff",
  cardHover: "#fafbfc",
  sidebar: "#1b1e2b",
  sidebarHover: "#252839",
  sidebarActive: "#2d3147",
  border: "#e5e7eb",
  borderLight: "#f0f1f4",
  text: "#111827",
  textSec: "#6b7280",
  textDim: "#9ca3af",
  textWhite: "#f1f5f9",
  textWhiteDim: "#94a3b8",
  orange: "#E8700A",
  orangeHover: "#d4630a",
  orangeLight: "rgba(232,112,10,0.07)",
  orangeBorder: "rgba(232,112,10,0.2)",
  green: "#16a34a",
  greenLight: "rgba(22,163,74,0.07)",
  greenBorder: "rgba(22,163,74,0.2)",
  red: "#dc2626",
  redLight: "rgba(220,38,38,0.07)",
  blue: "#2563eb",
  blueLight: "rgba(37,99,235,0.07)",
  blueBorder: "rgba(37,99,235,0.2)",
  purple: "#7c3aed",
  purpleLight: "rgba(124,58,237,0.07)",
  yellow: "#d97706",
  yellowLight: "rgba(217,119,6,0.07)",
  shadow: "0 1px 3px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.06)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.08)",
  radius: 8,
  radiusLg: 12,
};

// ─── ORDER STATUS ─────────────────────────────────────────────
const ORDER_STATUS = {
  pending:    { label: "En attente",  color: T.yellow, bg: T.yellowLight, icon: "⏳" },
  confirmed:  { label: "Confirmée",   color: T.blue,   bg: T.blueLight,   icon: "✓" },
  processing: { label: "En cours",    color: T.orange, bg: T.orangeLight, icon: "⚙" },
  shipped:    { label: "Expédiée",    color: T.purple, bg: T.purpleLight, icon: "📦" },
  delivered:  { label: "Livrée",      color: T.green,  bg: T.greenLight,  icon: "✓" },
  cancelled:  { label: "Annulée",     color: T.red,    bg: T.redLight,    icon: "✗" },
  disputed:   { label: "Litige",      color: T.red,    bg: T.redLight,    icon: "⚠" },
};

const RFQ_STATUS = {
  draft:    { label: "Brouillon",  color: T.textDim,  bg: "#f3f4f6" },
  sent:     { label: "Envoyée",    color: T.blue,     bg: T.blueLight },
  quoted:   { label: "Devis reçu", color: T.orange,   bg: T.orangeLight },
  accepted: { label: "Acceptée",   color: T.green,    bg: T.greenLight },
  expired:  { label: "Expirée",    color: T.textDim,  bg: "#f3f4f6" },
};

const FLAGS = { FR:"🇫🇷", DE:"🇩🇪", NL:"🇳🇱", BE:"🇧🇪", ES:"🇪🇸", IT:"🇮🇹", PT:"🇵🇹", AT:"🇦🇹", PL:"🇵🇱", CH:"🇨🇭", LU:"🇱🇺" };

// ═══════════════════════════════════════════════════════════════
// SUPABASE HOOK — useBuyerData
// ═══════════════════════════════════════════════════════════════
function useBuyerData(userId) {
  const [data, setData] = useState({ orders: [], rfqs: [], addresses: [], profile: null, company: null, stats: null });
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("mock");

  useEffect(() => {
    if (!userId) return;
    
    async function fetchAll() {
      setLoading(true);
      try {
        /* ──────────────────────────────────────────────────
           SUPABASE REAL QUERIES — uncomment when ready
           ──────────────────────────────────────────────────
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const [ordersRes, rfqRes, addrRes, profileRes, companyRes] = await Promise.all([
          supabase.from("orders").select(`
            *, order_items(*, products(name, sku, brand, image_url))
          `).eq("buyer_id", userId).order("created_at", { ascending: false }).limit(50),
          
          supabase.from("rfq").select("*").eq("buyer_id", userId).order("created_at", { ascending: false }).limit(20),
          
          supabase.from("addresses").select("*").eq("user_id", userId).order("is_default", { ascending: false }),
          
          supabase.from("profiles").select("*").eq("user_id", userId).single(),
          
          supabase.from("companies").select("*").eq("user_id", userId).single(),
        ]);

        if (ordersRes.data?.length > 0 || profileRes.data) {
          setData({
            orders: ordersRes.data || [],
            rfqs: rfqRes.data || [],
            addresses: addrRes.data || [],
            profile: profileRes.data,
            company: companyRes.data,
            stats: computeStats(ordersRes.data || []),
          });
          setSource("supabase");
          setLoading(false);
          return;
        }
        ────────────────────────────────────────────────── */

        // Mock fallback
        await new Promise(r => setTimeout(r, 600));
        const mock = generateMockData(userId);
        setData(mock);
        setSource("mock");
      } catch (err) {
        console.error("useBuyerData error:", err);
        setData(generateMockData(userId));
        setSource("mock");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [userId]);

  return { ...data, loading, source };
}

function computeStats(orders) {
  const now = new Date();
  const thisMonth = orders.filter(o => new Date(o.created_at).getMonth() === now.getMonth());
  const lastMonth = orders.filter(o => { const d = new Date(o.created_at); return d.getMonth() === now.getMonth() - 1; });
  
  return {
    totalOrders: orders.length,
    totalSpent: orders.reduce((s, o) => s + (o.total || 0), 0),
    thisMonthSpent: thisMonth.reduce((s, o) => s + (o.total || 0), 0),
    lastMonthSpent: lastMonth.reduce((s, o) => s + (o.total || 0), 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length : 0,
    pendingOrders: orders.filter(o => ["pending","confirmed","processing","shipped"].includes(o.status)).length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
  };
}

function generateMockData(userId) {
  const products = [
    { sku: "HU-SUN-10KTL", name: "Huawei SUN2000-10KTL-M2", brand: "Huawei", price: 1249 },
    { sku: "HU-LUNA-5S0",  name: "Huawei LUNA2000-5-S0",    brand: "Huawei", price: 1890 },
    { sku: "DY-12K-SG04",  name: "Deye SUN-12K-SG04LP3",    brand: "Deye",   price: 1450 },
    { sku: "HM-HMS-2000",  name: "Hoymiles HMS-2000-4T",     brand: "Hoymiles", price: 345 },
    { sku: "HU-SUN-5KTL",  name: "Huawei SUN2000-5KTL-M2",  brand: "Huawei", price: 689 },
    { sku: "DY-RW-M6.1",   name: "Deye RW-M6.1-B",          brand: "Deye",   price: 2100 },
    { sku: "HU-SUN-3KTL",  name: "Huawei SUN2000-3KTL-M2",  brand: "Huawei", price: 479 },
    { sku: "HU-LUNA-10S0",  name: "Huawei LUNA2000-10-S0",   brand: "Huawei", price: 3490 },
  ];

  const sellers = [
    { name: "QUALIWATT", country: "FR" },
    { name: "SolarPro GmbH", country: "DE" },
    { name: "EnergieDirect BV", country: "NL" },
    { name: "MedSolar SL", country: "ES" },
  ];

  const statuses = ["delivered","delivered","delivered","shipped","processing","confirmed","pending","delivered","delivered","cancelled","delivered","delivered"];

  const orders = Array.from({ length: 12 }, (_, i) => {
    const prod = products[i % products.length];
    const seller = sellers[i % sellers.length];
    const qty = [2, 5, 10, 3, 8, 1, 4, 6, 15, 2, 7, 20][i];
    const d = new Date(); d.setDate(d.getDate() - (i * 7 + Math.floor(Math.random() * 5)));
    
    return {
      id: `ORD-${(2026000 + i).toString().slice(-4)}`,
      created_at: d.toISOString(),
      status: statuses[i],
      seller_name: seller.name,
      seller_country: seller.country,
      total: prod.price * qty,
      items: [{ ...prod, quantity: qty, unit_price: prod.price }],
      delivery_method: i % 3 === 0 ? "SUNTREX Delivery" : "Transporteur vendeur",
      tracking_number: statuses[i] === "shipped" ? `STX-${Math.random().toString(36).slice(2,10).toUpperCase()}` : null,
      payment_method: "Stripe Connect",
      invoice_url: statuses[i] === "delivered" ? "#" : null,
    };
  });

  const rfqs = [
    { id: "RFQ-001", product_name: "Huawei SUN2000-10KTL-M2", quantity: 50, status: "quoted", created_at: new Date(Date.now() - 2*86400000).toISOString(), responses: 3, best_price: 1149, deadline: new Date(Date.now() + 5*86400000).toISOString() },
    { id: "RFQ-002", product_name: "Huawei LUNA2000-5-S0", quantity: 20, status: "sent", created_at: new Date(Date.now() - 1*86400000).toISOString(), responses: 0, best_price: null, deadline: new Date(Date.now() + 7*86400000).toISOString() },
    { id: "RFQ-003", product_name: "Deye SUN-12K-SG04LP3", quantity: 100, status: "accepted", created_at: new Date(Date.now() - 14*86400000).toISOString(), responses: 5, best_price: 1320, deadline: null },
    { id: "RFQ-004", product_name: "Hoymiles HMS-2000-4T", quantity: 200, status: "expired", created_at: new Date(Date.now() - 30*86400000).toISOString(), responses: 2, best_price: 310, deadline: null },
  ];

  const addresses = [
    { id: 1, label: "Siège social", type: "billing", street: "16-18 rue Eiffel", city: "Gretz-Armainvilliers", zip: "77220", country: "FR", is_default: true, contact: "Pierre Durand", phone: "+33 6 12 34 56 78" },
    { id: 2, label: "Entrepôt principal", type: "shipping", street: "Zone Industrielle Nord, Bât. C", city: "Meaux", zip: "77100", country: "FR", is_default: true, contact: "Marc Leroy", phone: "+33 6 98 76 54 32" },
    { id: 3, label: "Chantier Lyon", type: "shipping", street: "12 Avenue Tony Garnier", city: "Lyon", zip: "69007", country: "FR", is_default: false, contact: "Sophie Martin", phone: "+33 7 11 22 33 44" },
  ];

  const profile = {
    first_name: "Pierre", last_name: "Durand", email: "p.durand@solarpro.fr",
    phone: "+33 6 12 34 56 78", role: "installer", avatar_url: null,
    created_at: "2025-11-15T10:00:00Z", email_verified: true,
  };

  const company = {
    legal_name: "Solar Pro Installation SAS", vat_number: "FR12345678901",
    vat_verified: true, country: "FR", siret: "12345678901234",
    address: "16-18 rue Eiffel, 77220 Gretz-Armainvilliers",
    activity: "Installation photovoltaïque", employees: "10-49",
  };

  return { orders, rfqs, addresses, profile, company, stats: computeStats(orders) };
}

// ═══════════════════════════════════════════════════════════════
// ICONS (inline SVG)
// ═══════════════════════════════════════════════════════════════
const Icon = {
  overview: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  cart: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  rfq: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  address: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  profile: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  chevron: (s=12,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>,
  check: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>,
  truck: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  download: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  star: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  bell: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  sun: (s=18, c="#fff") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill={c}/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>,
  plus: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  edit: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  copy: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  external: (s=12,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>,
  shield: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  trash: (s=14,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  logout: (s=18,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: "overview",  label: "Vue d'ensemble", icon: Icon.overview, section: "ACHETER" },
  { id: "purchases", label: "Mes achats",     icon: Icon.cart,     section: "ACHETER" },
  { id: "rfq",       label: "Demandes de devis", icon: Icon.rfq,  section: "ACHETER" },
  { id: "addresses", label: "Adresses",       icon: Icon.address,  section: "ACHETER" },
  { id: "profile",   label: "Mon profil",     icon: Icon.profile,  section: "MON PROFIL" },
];

function Sidebar({ activeTab, onTabChange, profile, company, onSignOut }) {
  const [hover, setHover] = useState(null);
  const sections = [...new Set(TABS.map(t => t.section))];

  return (
    <div style={{
      width: 250, minWidth: 250, background: T.sidebar,
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0, borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Icon.sun(16)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.textWhite, letterSpacing: "-0.02em" }}>
              SUN<span style={{ color: T.orange }}>TREX</span>
            </div>
            <div style={{ fontSize: 9, color: T.textWhiteDim, letterSpacing: "0.05em", fontWeight: 600 }}>MARKETPLACE</div>
          </div>
        </div>
      </div>

      {/* User info */}
      {profile && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.textWhite, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.first_name} {profile.last_name}
              </div>
              <div style={{ fontSize: 10.5, color: T.textWhiteDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {company?.legal_name || profile.email}
              </div>
            </div>
          </div>
          {company?.vat_verified && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 9.5, fontWeight: 700, color: T.green, background: "rgba(22,163,74,0.12)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(22,163,74,0.2)" }}>
              {Icon.shield(10, T.green)} TVA VÉRIFIÉE
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {sections.map(section => (
          <div key={section}>
            <div style={{ padding: "12px 20px 6px", fontSize: 9.5, fontWeight: 800, color: T.textWhiteDim, letterSpacing: "0.1em" }}>
              {section}
            </div>
            {TABS.filter(t => t.section === section).map(tab => {
              const isActive = activeTab === tab.id;
              const isHovered = hover === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  onMouseEnter={() => setHover(tab.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 20px", border: "none", cursor: "pointer",
                    background: isActive ? T.sidebarActive : isHovered ? T.sidebarHover : "transparent",
                    color: isActive ? T.orange : isHovered ? T.textWhite : T.textWhiteDim,
                    fontFamily: T.font, fontSize: 13, fontWeight: isActive ? 700 : 500,
                    transition: "all .15s", textAlign: "left",
                    borderLeft: isActive ? `3px solid ${T.orange}` : "3px solid transparent",
                  }}
                >
                  {tab.icon(16, isActive ? T.orange : isHovered ? T.textWhite : T.textWhiteDim)}
                  {tab.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={onSignOut}
          onMouseEnter={e => e.currentTarget.style.background = T.sidebarHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", border: "none", cursor: "pointer",
            background: "transparent", borderRadius: 6,
            color: T.textWhiteDim, fontFamily: T.font, fontSize: 12, fontWeight: 500,
            transition: "all .15s",
          }}
        >
          {Icon.logout(16, T.textWhiteDim)} Déconnexion
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// KPI CARD
// ═══════════════════════════════════════════════════════════════
function KpiCard({ label, value, sub, icon, color = T.orange, trend }) {
  return (
    <div style={{
      background: T.card, borderRadius: T.radiusLg, padding: "18px 20px",
      border: `1px solid ${T.border}`, boxShadow: T.shadow,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {trend !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: trend >= 0 ? T.green : T.red,
            background: trend >= 0 ? T.greenLight : T.redLight,
            padding: "2px 6px", borderRadius: 4,
          }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: T.textDim }}>{sub}</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════
function StatusBadge({ status, type = "order" }) {
  const map = type === "rfq" ? RFQ_STATUS : ORDER_STATUS;
  const s = map[status] || { label: status, color: T.textDim, bg: "#f3f4f6", icon: "?" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, color: s.color,
      background: s.bg, padding: "3px 9px", borderRadius: 6,
      border: `1px solid ${s.color}20`,
    }}>
      <span style={{ fontSize: 10 }}>{s.icon}</span> {s.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════
function OverviewTab({ data }) {
  const { orders, rfqs, stats } = data;
  const recentOrders = orders.slice(0, 5);
  const pendingRfqs = rfqs.filter(r => ["sent","quoted"].includes(r.status));

  // Mini spending chart (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return { label: d.toLocaleDateString("fr-FR", { month: "short" }), month: d.getMonth(), year: d.getFullYear() };
  });
  const monthlySpend = months.map(m => {
    const total = orders.filter(o => { const d = new Date(o.created_at); return d.getMonth() === m.month && d.getFullYear() === m.year; }).reduce((s, o) => s + o.total, 0);
    return { ...m, total };
  });
  const maxSpend = Math.max(...monthlySpend.map(m => m.total), 1);

  const trendPct = stats?.lastMonthSpent > 0 ? Math.round(((stats.thisMonthSpent - stats.lastMonthSpent) / stats.lastMonthSpent) * 100) : 0;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <KpiCard label="Total dépensé" value={`€${(stats?.totalSpent || 0).toLocaleString("fr-FR")}`} sub="depuis inscription" icon="💰" color={T.green} />
        <KpiCard label="Ce mois" value={`€${(stats?.thisMonthSpent || 0).toLocaleString("fr-FR")}`} sub="vs mois dernier" icon="📊" color={T.blue} trend={trendPct} />
        <KpiCard label="Commandes" value={stats?.totalOrders || 0} sub={`${stats?.pendingOrders || 0} en cours`} icon="📦" color={T.orange} />
        <KpiCard label="Panier moyen" value={`€${Math.round(stats?.avgOrderValue || 0).toLocaleString("fr-FR")}`} sub="HT / commande" icon="🛒" color={T.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Spending chart */}
        <div style={{ background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, padding: 20, boxShadow: T.shadow }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 16px" }}>Dépenses mensuelles</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {monthlySpend.map((m, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600 }}>
                  {m.total > 0 ? `€${(m.total/1000).toFixed(1)}k` : "—"}
                </div>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  height: m.total > 0 ? Math.max(8, (m.total / maxSpend) * 90) : 4,
                  background: i === monthlySpend.length - 1
                    ? `linear-gradient(180deg, ${T.orange}, ${T.orangeHover})`
                    : `linear-gradient(180deg, ${T.blue}40, ${T.blue}20)`,
                  transition: "height .4s ease",
                }} />
                <div style={{ fontSize: 10, color: T.textSec, fontWeight: 600 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + pending RFQs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Quick actions */}
          <div style={{ background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, padding: 16, boxShadow: T.shadow }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>Actions rapides</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Nouvelle demande de devis", icon: "📋", color: T.orange },
                { label: "Parcourir le catalogue", icon: "🔍", color: T.blue },
                { label: "Contacter le support", icon: "💬", color: T.green },
              ].map((a, i) => (
                <button key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 12px", background: a.color + "08",
                  border: `1px solid ${a.color}20`, borderRadius: T.radius,
                  cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 600,
                  color: T.text, transition: "all .15s", textAlign: "left", width: "100%",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = a.color + "14"; e.currentTarget.style.borderColor = a.color + "40"; }}
                onMouseLeave={e => { e.currentTarget.style.background = a.color + "08"; e.currentTarget.style.borderColor = a.color + "20"; }}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pending RFQs */}
          {pendingRfqs.length > 0 && (
            <div style={{ background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.orangeBorder}`, padding: 16, boxShadow: T.shadow }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T.orange, margin: "0 0 8px" }}>
                📋 {pendingRfqs.length} devis en attente
              </h3>
              {pendingRfqs.map(r => (
                <div key={r.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.borderLight}`, fontSize: 11.5, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: T.text, fontWeight: 600 }}>{r.product_name.slice(0,25)}...</span>
                  <StatusBadge status={r.status} type="rfq" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ marginTop: 20, background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Dernières commandes</h3>
          <span style={{ fontSize: 11, color: T.blue, fontWeight: 600, cursor: "pointer" }}>Voir tout →</span>
        </div>
        <div>
          {recentOrders.map((o, i) => (
            <div key={o.id} style={{
              display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 90px",
              alignItems: "center", padding: "12px 20px", gap: 12,
              borderBottom: i < recentOrders.length - 1 ? `1px solid ${T.borderLight}` : "none",
              fontSize: 12,
            }}>
              <span style={{ fontWeight: 700, color: T.blue, fontFamily: T.mono, fontSize: 11 }}>{o.id}</span>
              <div>
                <div style={{ fontWeight: 600, color: T.text }}>{o.items[0]?.name?.slice(0, 30)}</div>
                <div style={{ fontSize: 10.5, color: T.textDim }}>{FLAGS[o.seller_country]} {o.seller_name} · {o.items[0]?.quantity} pcs</div>
              </div>
              <div style={{ fontWeight: 700, color: T.text, textAlign: "right" }}>€{o.total.toLocaleString("fr-FR")}</div>
              <StatusBadge status={o.status} />
              <span style={{ fontSize: 10.5, color: T.textDim, textAlign: "right" }}>
                {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: MES ACHATS
// ═══════════════════════════════════════════════════════════════
function PurchasesTab({ orders }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const filters = [
    { id: "all", label: "Toutes", count: orders.length },
    { id: "pending", label: "En attente", count: orders.filter(o => o.status === "pending").length },
    { id: "shipped", label: "Expédiées", count: orders.filter(o => o.status === "shipped").length },
    { id: "delivered", label: "Livrées", count: orders.filter(o => o.status === "delivered").length },
    { id: "cancelled", label: "Annulées", count: orders.filter(o => o.status === "cancelled").length },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "7px 14px", borderRadius: 6, border: `1px solid ${filter === f.id ? T.orange : T.border}`,
            background: filter === f.id ? T.orangeLight : T.card,
            color: filter === f.id ? T.orange : T.textSec,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            transition: "all .15s",
          }}>
            {f.label} <span style={{ fontWeight: 800, marginLeft: 4 }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(order => (
          <div key={order.id} style={{
            background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`,
            boxShadow: T.shadow, overflow: "hidden",
          }}>
            {/* Order header */}
            <div
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              style={{
                display: "grid", gridTemplateColumns: "100px 1fr 120px 110px 80px 30px",
                alignItems: "center", padding: "14px 18px", gap: 10,
                cursor: "pointer", transition: "background .1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontWeight: 700, color: T.blue, fontFamily: T.mono, fontSize: 11.5 }}>{order.id}</span>
              <div>
                <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{order.items[0]?.name}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>
                  {FLAGS[order.seller_country]} {order.seller_name} · {order.items[0]?.quantity} pcs × €{order.items[0]?.unit_price?.toLocaleString("fr-FR")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: T.text, fontSize: 14 }}>€{order.total.toLocaleString("fr-FR")}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>HT</div>
              </div>
              <StatusBadge status={order.status} />
              <span style={{ fontSize: 11, color: T.textDim, textAlign: "right" }}>
                {new Date(order.created_at).toLocaleDateString("fr-FR")}
              </span>
              <span style={{ color: T.textDim, transform: expanded === order.id ? "rotate(90deg)" : "rotate(0)", transition: "transform .2s" }}>
                {Icon.chevron(12, T.textDim)}
              </span>
            </div>

            {/* Expanded details */}
            {expanded === order.id && (
              <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${T.borderLight}`, paddingTop: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.textDim, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Livraison</div>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{order.delivery_method}</div>
                    {order.tracking_number && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        {Icon.truck(13, T.blue)}
                        <span style={{ fontSize: 11, color: T.blue, fontWeight: 600, fontFamily: T.mono }}>{order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textDim, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Paiement</div>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{order.payment_method}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: T.green, fontWeight: 600 }}>
                      {Icon.shield(11, T.green)} Escrow protégé
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                    {order.invoice_url && (
                      <button style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                        background: T.blueLight, border: `1px solid ${T.blueBorder}`, borderRadius: 6,
                        color: T.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                      }}>
                        {Icon.download(12, T.blue)} Facture PDF
                      </button>
                    )}
                    <button style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                      background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
                      color: T.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                    }}>
                      💬 Contacter vendeur
                    </button>
                  </div>
                </div>

                {/* Delivery timeline */}
                <div style={{ marginTop: 16, padding: "12px 14px", background: T.bg, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Suivi</div>
                  <div style={{ display: "flex", gap: 0 }}>
                    {["Commandé","Confirmé","Préparé","Expédié","Livré"].map((step, si) => {
                      const statusIndex = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1 }[order.status] ?? 0;
                      const done = si <= statusIndex && order.status !== "cancelled";
                      const active = si === statusIndex;
                      return (
                        <div key={si} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: done ? T.green : "#e5e7eb",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            border: active ? `2px solid ${T.orange}` : "none",
                            boxShadow: active ? `0 0 0 4px ${T.orangeLight}` : "none",
                            zIndex: 1,
                          }}>
                            {done && Icon.check(11, "#fff")}
                          </div>
                          <div style={{ fontSize: 9.5, color: done ? T.text : T.textDim, fontWeight: done ? 700 : 500, marginTop: 4, textAlign: "center" }}>{step}</div>
                          {si < 4 && <div style={{ position: "absolute", top: 10, left: "55%", width: "90%", height: 2, background: done && si < statusIndex ? T.green : "#e5e7eb" }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.textDim }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune commande {filter !== "all" ? "avec ce statut" : ""}</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: DEMANDES DE DEVIS (RFQ)
// ═══════════════════════════════════════════════════════════════
function RfqTab({ rfqs }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textDim }}>{rfqs.length} demande{rfqs.length > 1 ? "s" : ""} de devis</div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: T.orange, color: "#fff", border: "none", borderRadius: T.radius,
          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
          boxShadow: "0 2px 8px rgba(232,112,10,0.3)",
        }}>
          {Icon.plus(14, "#fff")} Nouvelle demande
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rfqs.map(rfq => (
          <div key={rfq.id} style={{
            background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`,
            padding: "16px 20px", boxShadow: T.shadow,
            display: "grid", gridTemplateColumns: "80px 1fr 80px 100px 120px 100px",
            alignItems: "center", gap: 12,
          }}>
            <span style={{ fontWeight: 700, color: T.blue, fontFamily: T.mono, fontSize: 11 }}>{rfq.id}</span>
            <div>
              <div style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{rfq.product_name}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>
                {rfq.quantity} pcs · {new Date(rfq.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{rfq.responses}</div>
              <div style={{ fontSize: 9.5, color: T.textDim }}>réponse{rfq.responses > 1 ? "s" : ""}</div>
            </div>
            <StatusBadge status={rfq.status} type="rfq" />
            <div style={{ textAlign: "right" }}>
              {rfq.best_price ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>€{rfq.best_price.toLocaleString("fr-FR")}</div>
                  <div style={{ fontSize: 9.5, color: T.textDim }}>meilleur devis</div>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: T.textDim }}>—</span>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {rfq.deadline && new Date(rfq.deadline) > new Date() ? (
                <span style={{ fontSize: 10.5, color: T.orange, fontWeight: 600 }}>
                  ⏰ {Math.ceil((new Date(rfq.deadline) - new Date()) / 86400000)}j restants
                </span>
              ) : rfq.status === "expired" ? (
                <span style={{ fontSize: 10.5, color: T.textDim }}>Expirée</span>
              ) : rfq.status === "accepted" ? (
                <span style={{ fontSize: 10.5, color: T.green, fontWeight: 600 }}>✓ Acceptée</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {rfqs.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: T.textDim }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune demande de devis</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Parcourez le catalogue et demandez des devis en volume</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4: ADRESSES
// ═══════════════════════════════════════════════════════════════
function AddressesTab({ addresses }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.textDim }}>{addresses.length} adresse{addresses.length > 1 ? "s" : ""} enregistrée{addresses.length > 1 ? "s" : ""}</div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: T.orange, color: "#fff", border: "none", borderRadius: T.radius,
          fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
        }}>
          {Icon.plus(14, "#fff")} Ajouter une adresse
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {addresses.map(addr => (
          <div key={addr.id} style={{
            background: T.card, borderRadius: T.radiusLg, padding: "18px 20px",
            border: `1px solid ${addr.is_default ? T.greenBorder : T.border}`,
            boxShadow: T.shadow, position: "relative",
          }}>
            {addr.is_default && (
              <span style={{
                position: "absolute", top: 12, right: 12,
                fontSize: 9, fontWeight: 800, color: T.green,
                background: T.greenLight, padding: "2px 8px", borderRadius: 4,
                border: `1px solid ${T.greenBorder}`,
              }}>PAR DÉFAUT</span>
            )}
            
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{addr.type === "billing" ? "🏢" : "📦"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{addr.label}</div>
                <div style={{ fontSize: 10, color: T.textDim, fontWeight: 600 }}>
                  {addr.type === "billing" ? "Facturation" : "Livraison"}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6, marginBottom: 10 }}>
              {addr.street}<br />
              {addr.zip} {addr.city}<br />
              {FLAGS[addr.country]} {addr.country}
            </div>

            {addr.contact && (
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>
                👤 {addr.contact} · {addr.phone}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
                color: T.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}>
                {Icon.edit(11)} Modifier
              </button>
              {!addr.is_default && (
                <button style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                  background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
                  color: T.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                }}>
                  {Icon.trash(11, T.textDim)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 5: MON PROFIL
// ═══════════════════════════════════════════════════════════════
function ProfileTab({ profile, company }) {
  if (!profile) return null;

  const Section = ({ title, children }) => (
    <div style={{ background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 16 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h3>
        <button style={{
          display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
          background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6,
          color: T.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
        }}>{Icon.edit(11)} Modifier</button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );

  const Field = ({ label, value, mono, badge }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.borderLight}` }}>
      <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, fontFamily: mono ? T.mono : T.font }}>{value}</span>
        {badge}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <Section title="Informations personnelles">
        <Field label="Nom complet" value={`${profile.first_name} ${profile.last_name}`} />
        <Field label="Email" value={profile.email} mono badge={
          profile.email_verified && <span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: T.greenLight, padding: "2px 6px", borderRadius: 3, border: `1px solid ${T.greenBorder}` }}>✓ Vérifié</span>
        } />
        <Field label="Téléphone" value={profile.phone || "—"} />
        <Field label="Rôle" value={profile.role === "installer" ? "🔧 Installateur" : profile.role} />
        <Field label="Membre depuis" value={new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} />
      </Section>

      {company && (
        <Section title="Entreprise">
          <Field label="Raison sociale" value={company.legal_name} />
          <Field label="Pays" value={`${FLAGS[company.country]} ${company.country}`} />
          <Field label="TVA intracommunautaire" value={company.vat_number || "—"} mono badge={
            company.vat_verified && <span style={{ fontSize: 9, fontWeight: 700, color: T.green, background: T.greenLight, padding: "2px 6px", borderRadius: 3, border: `1px solid ${T.greenBorder}` }}>{Icon.shield(9, T.green)} VIES ✓</span>
          } />
          {company.siret && <Field label="SIRET" value={company.siret} mono />}
          <Field label="Adresse" value={company.address || "—"} />
          <Field label="Activité" value={company.activity || "—"} />
          {company.employees && <Field label="Effectif" value={company.employees} />}
        </Section>
      )}

      {/* Security & Preferences */}
      <Section title="Sécurité & Préférences">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius,
            cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.text, textAlign: "left",
          }}>
            🔒 Changer le mot de passe
            <span style={{ marginLeft: "auto", color: T.textDim }}>{Icon.chevron(12, T.textDim)}</span>
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius,
            cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.text, textAlign: "left",
          }}>
            🔔 Préférences de notification
            <span style={{ marginLeft: "auto", color: T.textDim }}>{Icon.chevron(12, T.textDim)}</span>
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radius,
            cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.text, textAlign: "left",
          }}>
            🌍 Langue & devise (FR / EUR)
            <span style={{ marginLeft: "auto", color: T.textDim }}>{Icon.chevron(12, T.textDim)}</span>
          </button>
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const userId = "demo_buyer_001"; // Replace with real auth: const { user } = useAuth();
  const { orders, rfqs, addresses, profile, company, stats, loading, source } = useBuyerData(userId);

  return (
    <div style={{ fontFamily: T.font, display: "flex", background: T.bg, minHeight: "100vh", color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
      `}</style>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        profile={profile}
        company={company}
        onSignOut={() => console.log("Sign out")}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10, padding: "12px 28px",
          background: "rgba(247,248,250,0.85)", backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: T.text }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            {source === "mock" && (
              <span style={{
                fontSize: 8.5, fontWeight: 800, color: T.yellow,
                background: T.yellowLight, padding: "2px 7px", borderRadius: 4,
                border: `1px solid ${T.yellow}30`, letterSpacing: "0.05em",
              }}>MOCK DATA</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{
              width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              {Icon.bell(16, T.textSec)}
              <span style={{
                position: "absolute", top: 5, right: 5, width: 7, height: 7,
                borderRadius: "50%", background: T.red, border: "2px solid #fff",
              }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28, animation: "fadeIn .3s ease-out" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 24, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
              <div style={{ fontSize: 13, color: T.textDim, marginTop: 12 }}>Chargement des données...</div>
            </div>
          ) : (
            <>
              {activeTab === "overview" && <OverviewTab data={{ orders, rfqs, stats }} />}
              {activeTab === "purchases" && <PurchasesTab orders={orders} />}
              {activeTab === "rfq" && <RfqTab rfqs={rfqs} />}
              {activeTab === "addresses" && <AddressesTab addresses={addresses} />}
              {activeTab === "profile" && <ProfileTab profile={profile} company={company} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
