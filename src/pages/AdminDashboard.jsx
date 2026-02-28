import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Sprint 6: Admin Dashboard
   
   Platform command center for the SUNTREX team.
   KPIs, transactions, sellers, commissions, disputes, KYC.
   
   Route: /admin
   ═══════════════════════════════════════════════════════════════ */

var T = {
  bg: "#f7f8fa", card: "#ffffff",
  border: "#e8eaef", borderLight: "#f0f1f5",
  text: "#1a1d26", textSec: "#6b7280", textMuted: "#9ca3af",
  accent: "#E8700A", accentHover: "#d46200", accentLight: "#fff7ed",
  green: "#10b981", greenBg: "#ecfdf5", greenText: "#065f46",
  red: "#ef4444", redBg: "#fef2f2", redText: "#991b1b",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1e40af",
  yellow: "#f59e0b", yellowBg: "#fffbeb", yellowText: "#92400e",
  purple: "#7c3aed", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
  teal: "#0d9488", tealBg: "#ccfbf1",
  sidebar: "#1a1d26", sidebarHover: "#2a2d36", sidebarActive: "#33363f",
  radius: 10, radiusSm: 6, radiusLg: 16,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  shadow: "0 1px 3px rgba(0,0,0,0.06)", shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
};

// ── Mock data ──
var MOCK_KPI = {
  revenue: 247850, commission: 12392.50, orders: 156, avgOrder: 1589,
  activeUsers: 342, sellers: 28, pendingKyc: 4, disputes: 2,
  deliveries: { total: 134, inTransit: 18, delivered: 112, issue: 4 },
  growth: { revenue: 23, orders: 18, users: 31, sellers: 12 },
};

var MOCK_TRANSACTIONS = [
  { id: "ST-2847", buyer: "SolarPro France", seller: "QUALIWATT", product: "Huawei SUN2000-10KTL-M2", qty: 10, total: 18500, commission: 925, status: "shipped", date: "2026-02-27", flag: "🇫🇷" },
  { id: "ST-2846", buyer: "GreenTech Berlin", seller: "SolarMax DE", product: "Deye SUN-12K-SG04LP3", qty: 5, total: 9750, commission: 487.50, status: "paid", date: "2026-02-27", flag: "🇩🇪" },
  { id: "ST-2845", buyer: "Volta Instaladores", seller: "QUALIWATT", product: "Huawei LUNA2000-10-S0", qty: 8, total: 32000, commission: 1600, status: "delivered", date: "2026-02-26", flag: "🇪🇸" },
  { id: "ST-2844", buyer: "NL Solar BV", seller: "EnergyParts NL", product: "Hoymiles HMS-2000-4T", qty: 50, total: 15000, commission: 750, status: "in_transit", date: "2026-02-26", flag: "🇳🇱" },
  { id: "ST-2843", buyer: "Italia Solar Srl", seller: "PV Direct IT", product: "Jinko Tiger Neo 580W", qty: 100, total: 23000, commission: 1150, status: "disputed", date: "2026-02-25", flag: "🇮🇹" },
  { id: "ST-2842", buyer: "BelSol SPRL", seller: "QUALIWATT", product: "Huawei SUN2000-5KTL-M1", qty: 20, total: 14000, commission: 700, status: "delivered", date: "2026-02-25", flag: "🇧🇪" },
  { id: "ST-2841", buyer: "SunCraft GmbH", seller: "SolarMax DE", product: "Deye SUN-8K-SG04LP3", qty: 15, total: 19500, commission: 975, status: "delivered", date: "2026-02-24", flag: "🇩🇪" },
  { id: "ST-2840", buyer: "Eco Watt France", seller: "PV Express FR", product: "Trina Vertex S+ 445W", qty: 200, total: 42000, commission: 2100, status: "confirmed", date: "2026-02-24", flag: "🇫🇷" },
];

var MOCK_SELLERS = [
  { id: 1, name: "QUALIWATT", country: "FR", flag: "🇫🇷", products: 124, revenue: 89500, commission: 4475, kyc: "verified", tier: "platinum", rating: 4.9, joined: "2026-01-15" },
  { id: 2, name: "SolarMax DE", country: "DE", flag: "🇩🇪", products: 87, revenue: 62300, commission: 3115, kyc: "verified", tier: "gold", rating: 4.7, joined: "2026-01-20" },
  { id: 3, name: "EnergyParts NL", country: "NL", flag: "🇳🇱", products: 56, revenue: 34200, commission: 1710, kyc: "verified", tier: "silver", rating: 4.5, joined: "2026-02-01" },
  { id: 4, name: "PV Direct IT", country: "IT", flag: "🇮🇹", products: 42, revenue: 28100, commission: 1405, kyc: "verified", tier: "silver", rating: 4.3, joined: "2026-02-05" },
  { id: 5, name: "PV Express FR", country: "FR", flag: "🇫🇷", products: 31, revenue: 42000, commission: 2100, kyc: "pending", tier: "bronze", rating: 0, joined: "2026-02-20" },
  { id: 6, name: "SunPower ES", country: "ES", flag: "🇪🇸", products: 0, revenue: 0, commission: 0, kyc: "pending", tier: "none", rating: 0, joined: "2026-02-27" },
];

var STATUS_MAP = {
  confirmed: { label: "Confirmée", color: T.blue, bg: T.blueBg },
  paid: { label: "Payée", color: T.green, bg: T.greenBg },
  shipped: { label: "Expédiée", color: T.accent, bg: T.accentLight },
  in_transit: { label: "En transit", color: T.accent, bg: T.accentLight },
  delivered: { label: "Livrée", color: T.green, bg: T.greenBg },
  disputed: { label: "Litige", color: T.red, bg: T.redBg },
  cancelled: { label: "Annulée", color: T.textMuted, bg: "#f1f5f9" },
};

var KYC_MAP = {
  verified: { label: "Vérifié", color: T.green, bg: T.greenBg, icon: "✓" },
  pending: { label: "En attente", color: T.yellow, bg: T.yellowBg, icon: "⏳" },
  rejected: { label: "Refusé", color: T.red, bg: T.redBg, icon: "✕" },
};

var TIER_MAP = {
  platinum: { label: "Platinum", color: "#e5e7eb", gradient: "linear-gradient(135deg, #e8e8e8, #b8b8b8)" },
  gold: { label: "Gold", color: "#fbbf24", gradient: "linear-gradient(135deg, #fbbf24, #d4951a)" },
  silver: { label: "Silver", color: "#9ca3af", gradient: "linear-gradient(135deg, #d1d5db, #9ca3af)" },
  bronze: { label: "Bronze", color: "#d97706", gradient: "linear-gradient(135deg, #d97706, #92400e)" },
  none: { label: "—", color: T.textMuted, gradient: "none" },
};

function fmt(n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function fmtDec(n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n); }

// ── Sidebar ──
var NAV_ITEMS = [
  { id: "overview", icon: "📊", label: "Vue d'ensemble" },
  { id: "transactions", icon: "💳", label: "Transactions" },
  { id: "sellers", icon: "🏢", label: "Vendeurs" },
  { id: "commissions", icon: "💰", label: "Commissions" },
  { id: "delivery", icon: "🚚", label: "Livraisons" },
  { id: "disputes", icon: "⚠️", label: "Litiges" },
  { id: "users", icon: "👥", label: "Utilisateurs" },
  { id: "settings", icon: "⚙️", label: "Paramètres" },
];

// ── Components ──

function StatCard({ icon, label, value, sub, growth, color }) {
  color = color || T.accent;
  return <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow, flex: 1, minWidth: 180 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
      {growth !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: growth >= 0 ? T.green : T.red, background: growth >= 0 ? T.greenBg : T.redBg, padding: "3px 8px", borderRadius: 6 }}>{growth >= 0 ? "↑" : "↓"} {Math.abs(growth)}%</span>}
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 2 }}>{value}</div>
    <div style={{ fontSize: 12, color: T.textSec }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>;
}

function MiniBar({ data, height }) {
  height = height || 32;
  var max = Math.max.apply(null, data.map(function(d) { return d.value; }));
  return <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: height }}>
    {data.map(function(d, i) {
      var h = max > 0 ? (d.value / max) * height : 2;
      return <div key={i} style={{ flex: 1, height: Math.max(2, h), borderRadius: 3, background: d.color || T.accent + "60", transition: "height .3s" }} title={d.label + ": " + d.value} />;
    })}
  </div>;
}

function Badge({ label, color, bg }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, color: color, background: bg }}>{label}</span>;
}

// ── Section: Overview ──
function OverviewSection() {
  var k = MOCK_KPI;
  var chartData = [
    { label: "Lun", value: 12400, color: T.accent },
    { label: "Mar", value: 18300, color: T.accent },
    { label: "Mer", value: 9800, color: T.accent + "80" },
    { label: "Jeu", value: 22100, color: T.accent },
    { label: "Ven", value: 31500, color: T.green },
    { label: "Sam", value: 15200, color: T.accent + "80" },
    { label: "Dim", value: 8700, color: T.accent + "40" },
  ];

  return <div>
    {/* KPI Grid */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="💶" label="Revenu total (GMV)" value={fmt(k.revenue)} growth={k.growth.revenue} color={T.green} />
      <StatCard icon="💰" label="Commissions SUNTREX (5%)" value={fmtDec(k.commission)} sub={"sur " + k.orders + " commandes"} color={T.accent} />
      <StatCard icon="📦" label="Commandes" value={k.orders} growth={k.growth.orders} color={T.blue} />
      <StatCard icon="🧾" label="Panier moyen" value={fmt(k.avgOrder)} color={T.purple} />
    </div>

    {/* Second row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="👥" label="Utilisateurs actifs" value={k.activeUsers} growth={k.growth.users} color={T.blue} />
      <StatCard icon="🏢" label="Vendeurs" value={k.sellers} growth={k.growth.sellers} sub={k.pendingKyc + " KYC en attente"} color={T.teal} />
      <StatCard icon="🚚" label="Livraisons en cours" value={k.deliveries.inTransit} sub={k.deliveries.delivered + " livrées / " + k.deliveries.issue + " problèmes"} color={T.accent} />
      <StatCard icon="⚠️" label="Litiges ouverts" value={k.disputes} color={T.red} />
    </div>

    {/* Revenue chart (simplified bar) */}
    <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, marginBottom: 24, boxShadow: T.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>📈 Revenu cette semaine</div>
        <span style={{ fontSize: 12, color: T.textMuted }}>Total: {fmt(chartData.reduce(function(a, d) { return a + d.value; }, 0))}</span>
      </div>
      <MiniBar data={chartData} height={80} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {chartData.map(function(d) {
          return <span key={d.label} style={{ fontSize: 10, color: T.textMuted, flex: 1, textAlign: "center" }}>{d.label}</span>;
        })}
      </div>
    </div>

    {/* Recent transactions */}
    <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>🕐 Dernières transactions</div>
      {MOCK_TRANSACTIONS.slice(0, 5).map(function(tx) {
        var s = STATUS_MAP[tx.status] || {};
        return <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid " + T.borderLight, fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: T.accent, width: 70 }}>{tx.id}</span>
          <span style={{ flex: 1, color: T.text, fontWeight: 500 }}>{tx.flag} {tx.buyer}</span>
          <span style={{ flex: 1, color: T.textSec }}>{tx.product}</span>
          <span style={{ width: 80, textAlign: "right", fontWeight: 700, color: T.text }}>{fmt(tx.total)}</span>
          <Badge label={s.label || tx.status} color={s.color} bg={s.bg} />
        </div>;
      })}
    </div>
  </div>;
}

// ── Section: Transactions ──
function TransactionsSection() {
  var _f = useState("all"), filter = _f[0], setFilter = _f[1];
  var filtered = filter === "all" ? MOCK_TRANSACTIONS : MOCK_TRANSACTIONS.filter(function(tx) { return tx.status === filter; });

  return <div>
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {[{ id: "all", label: "Toutes" }, { id: "paid", label: "Payées" }, { id: "shipped", label: "Expédiées" }, { id: "delivered", label: "Livrées" }, { id: "disputed", label: "Litiges" }].map(function(f) {
        var active = filter === f.id;
        return <button key={f.id} onClick={function() { setFilter(f.id); }} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid " + (active ? T.accent : T.border), background: active ? T.accent : T.card, color: active ? "#fff" : T.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>{f.label}</button>;
      })}
    </div>

    <div style={{ background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight, overflow: "hidden", boxShadow: T.shadow }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 90px 90px 100px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>ID</span><span>Acheteur</span><span>Vendeur</span><span>Produit</span><span style={{ textAlign: "right" }}>Montant</span><span style={{ textAlign: "right" }}>Commission</span><span>Statut</span>
      </div>
      {/* Rows */}
      {filtered.map(function(tx) {
        var s = STATUS_MAP[tx.status] || {};
        return <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 90px 90px 100px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", cursor: "pointer", transition: "background .15s" }} onMouseEnter={function(e) { e.currentTarget.style.background = T.bg; }} onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
          <span style={{ fontWeight: 700, color: T.accent }}>{tx.id}</span>
          <span style={{ color: T.text, fontWeight: 500 }}>{tx.flag} {tx.buyer}</span>
          <span style={{ color: T.textSec }}>{tx.seller}</span>
          <span style={{ color: T.textSec }}>{tx.product.length > 28 ? tx.product.slice(0, 28) + "…" : tx.product}</span>
          <span style={{ textAlign: "right", fontWeight: 700, color: T.text }}>{fmt(tx.total)}</span>
          <span style={{ textAlign: "right", fontWeight: 600, color: T.green }}>{fmtDec(tx.commission)}</span>
          <Badge label={s.label || tx.status} color={s.color} bg={s.bg} />
        </div>;
      })}
    </div>
  </div>;
}

// ── Section: Sellers ──
function SellersSection() {
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <StatCard icon="🏢" label="Total vendeurs" value={MOCK_SELLERS.length} color={T.teal} />
      <StatCard icon="✓" label="KYC vérifiés" value={MOCK_SELLERS.filter(function(s) { return s.kyc === "verified"; }).length} color={T.green} />
      <StatCard icon="⏳" label="KYC en attente" value={MOCK_SELLERS.filter(function(s) { return s.kyc === "pending"; }).length} color={T.yellow} />
    </div>

    <div style={{ background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight, overflow: "hidden", boxShadow: T.shadow }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 90px 80px 80px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>Vendeur</span><span>Pays</span><span>Produits</span><span style={{ textAlign: "right" }}>CA généré</span><span style={{ textAlign: "right" }}>Commission</span><span>KYC</span><span>Tier</span>
      </div>
      {MOCK_SELLERS.map(function(seller) {
        var kyc = KYC_MAP[seller.kyc] || {};
        var tier = TIER_MAP[seller.tier] || TIER_MAP.none;
        return <div key={seller.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 90px 80px 80px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, color: T.text }}>{seller.name}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>Depuis {new Date(seller.joined).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}</div>
          </div>
          <span>{seller.flag} {seller.country}</span>
          <span style={{ fontWeight: 600 }}>{seller.products}</span>
          <span style={{ textAlign: "right", fontWeight: 700, color: T.text }}>{fmt(seller.revenue)}</span>
          <span style={{ textAlign: "right", fontWeight: 600, color: T.green }}>{fmtDec(seller.commission)}</span>
          <Badge label={kyc.label} color={kyc.color} bg={kyc.bg} />
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: tier.gradient, color: seller.tier === "platinum" || seller.tier === "silver" ? "#333" : "#fff", textAlign: "center" }}>{tier.label}</span>
        </div>;
      })}
    </div>
  </div>;
}

// ── Section: Commissions ──
function CommissionsSection() {
  var totalCommission = MOCK_TRANSACTIONS.reduce(function(a, tx) { return a + tx.commission; }, 0);
  var bySellerMap = {};
  MOCK_TRANSACTIONS.forEach(function(tx) {
    if (!bySellerMap[tx.seller]) bySellerMap[tx.seller] = { name: tx.seller, total: 0, count: 0 };
    bySellerMap[tx.seller].total += tx.commission;
    bySellerMap[tx.seller].count++;
  });
  var bySeller = Object.values(bySellerMap).sort(function(a, b) { return b.total - a.total; });

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="💰" label="Commissions totales" value={fmtDec(totalCommission)} sub="5% sur chaque transaction" color={T.green} />
      <StatCard icon="📊" label="Commission moyenne" value={fmtDec(totalCommission / MOCK_TRANSACTIONS.length)} sub={"sur " + MOCK_TRANSACTIONS.length + " transactions"} color={T.accent} />
      <StatCard icon="🏆" label="Top vendeur" value={bySeller[0]?.name || "—"} sub={fmtDec(bySeller[0]?.total || 0) + " de commissions"} color={T.purple} />
    </div>

    <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>💰 Commissions par vendeur</div>
      {bySeller.map(function(s) {
        var pct = totalCommission > 0 ? (s.total / totalCommission) * 100 : 0;
        return <div key={s.name} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{fmtDec(s.total)} <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 11 }}>({s.count} tx)</span></span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: T.borderLight, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", borderRadius: 4, background: "linear-gradient(90deg, " + T.accent + ", " + T.green + ")", transition: "width .5s ease" }} />
          </div>
        </div>;
      })}
    </div>
  </div>;
}

// ── Section: Placeholder for future sections ──
function PlaceholderSection({ title, icon }) {
  return <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 13, color: T.textSec }}>Cette section sera disponible dans le prochain sprint.</div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  var navigate = useNavigate();
  var _s = useState("overview"), section = _s[0], setSection = _s[1];
  var _m = useState(false), mobileNav = _m[0], setMobileNav = _m[1];

  function renderSection() {
    switch (section) {
      case "overview": return <OverviewSection />;
      case "transactions": return <TransactionsSection />;
      case "sellers": return <SellersSection />;
      case "commissions": return <CommissionsSection />;
      case "delivery": return <PlaceholderSection title="Gestion des livraisons" icon="🚚" />;
      case "disputes": return <PlaceholderSection title="Gestion des litiges" icon="⚠️" />;
      case "users": return <PlaceholderSection title="Gestion des utilisateurs" icon="👥" />;
      case "settings": return <PlaceholderSection title="Paramètres plateforme" icon="⚙️" />;
      default: return <OverviewSection />;
    }
  }

  return <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", display: "flex" }}>
    <style>{"\n      @keyframes spin{to{transform:rotate(360deg)}}\n      @media(max-width:767px){.admin-sidebar{display:none!important}}\n    "}</style>

    {/* Sidebar */}
    <div className="admin-sidebar" style={{ width: 240, background: T.sidebar, minHeight: "100vh", padding: "20px 0", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid " + T.sidebarHover }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={function() { navigate("/"); }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>S</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>SUNTREX</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: "16px 12px" }}>
        {NAV_ITEMS.map(function(item) {
          var active = section === item.id;
          return <button key={item.id} onClick={function() { setSection(item.id); setMobileNav(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: active ? T.sidebarActive : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: T.font, textAlign: "left", transition: "all .15s", marginBottom: 2 }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
          </button>;
        })}
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, padding: "0 20px" }}>
        <div style={{ padding: 12, background: T.sidebarHover, borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>SUNTREX v1.0</div>
          Commission: 5% • EUR
        </div>
      </div>
    </div>

    {/* Main content */}
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Top bar */}
      <div style={{ background: T.card, borderBottom: "1px solid " + T.borderLight, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mobile hamburger */}
          <button onClick={function() { setMobileNav(!mobileNav); }} style={{ display: "none", background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }} className="mobile-only">☰</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{NAV_ITEMS.find(function(n) { return n.id === section; })?.icon} {NAV_ITEMS.find(function(n) { return n.id === section; })?.label}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: T.greenBg, borderRadius: 8, fontSize: 11, fontWeight: 600, color: T.greenText }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block" }} />
            Live
          </div>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>YA</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1200 }}>
        {renderSection()}
      </div>
    </div>

    {/* Mobile nav overlay */}
    {mobileNav && <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={function() { setMobileNav(false); }} />
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 260, background: T.sidebar, padding: "20px 12px" }}>
        <div style={{ padding: "0 8px 20px", fontSize: 16, fontWeight: 800, color: "#fff" }}>
          <span style={{ color: T.accent }}>SUNTREX</span> Admin
        </div>
        {NAV_ITEMS.map(function(item) {
          var active = section === item.id;
          return <button key={item.id} onClick={function() { setSection(item.id); setMobileNav(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px", borderRadius: 8, border: "none", background: active ? T.sidebarActive : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: T.font, textAlign: "left", marginBottom: 4 }}>
            <span>{item.icon}</span>{item.label}
          </button>;
        })}
      </div>
    </div>}
  </div>;
}
