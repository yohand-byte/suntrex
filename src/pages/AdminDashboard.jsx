import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../hooks/useAdminData";
import { supabase } from "../lib/supabase";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Admin Dashboard

   Platform command center for the SUNTREX team.
   KPIs, transactions, sellers, commissions, disputes, KYC.

   Route: /admin
   Data: useAdminData() → Netlify Function (service_role) → Supabase
   Fallback: mock data when function unavailable
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

var STATUS_MAP = {
  negotiation: { label: "Négociation", color: T.yellow, bg: T.yellowBg },
  confirmed: { label: "Confirmée", color: T.blue, bg: T.blueBg },
  paid: { label: "Payée", color: T.green, bg: T.greenBg },
  shipped: { label: "Expédiée", color: T.accent, bg: T.accentLight },
  in_transit: { label: "En transit", color: T.accent, bg: T.accentLight },
  delivered: { label: "Livrée", color: T.green, bg: T.greenBg },
  completed: { label: "Terminée", color: T.teal, bg: T.tealBg },
  disputed: { label: "Litige", color: T.red, bg: T.redBg },
  cancelled: { label: "Annulée", color: T.textMuted, bg: "#f1f5f9" },
};

var KYC_MAP = {
  verified: { label: "Vérifié", color: T.green, bg: T.greenBg, icon: "✓" },
  pending: { label: "En attente", color: T.yellow, bg: T.yellowBg, icon: "⏳" },
  pending_review: { label: "En attente", color: T.yellow, bg: T.yellowBg, icon: "⏳" },
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

// Admin email check (client-side guard)
var ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map(function(e) { return e.trim().toLowerCase(); }).filter(Boolean);
function isAdminEmail(email) {
  if (ADMIN_EMAILS.length === 0) return true; // dev mode — no restriction
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

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
      return <div key={i} style={{ flex: 1, height: Math.max(2, h), borderRadius: 3, background: d.color || T.accent + "60", transition: "height .3s" }} title={d.label + ": " + fmt(d.value)} />;
    })}
  </div>;
}

function Badge({ label, color, bg }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, color: color, background: bg }}>{label}</span>;
}

function LoadingSpinner() {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
    <div style={{ width: 40, height: 40, border: "3px solid " + T.borderLight, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <div style={{ marginTop: 16, fontSize: 14, color: T.textSec }}>Chargement des données...</div>
  </div>;
}

// ── Section: Overview ──
function OverviewSection({ kpi, transactions, monthlyRevenue }) {
  var k = kpi;
  var chartData = (monthlyRevenue || []).map(function(m) {
    return { label: m.label.split(" ")[0], value: m.value, color: T.accent };
  });
  // Fallback to weekly view if no monthly data
  if (chartData.length === 0) {
    chartData = [
      { label: "Lun", value: 0, color: T.accent },
      { label: "Mar", value: 0, color: T.accent },
      { label: "Mer", value: 0, color: T.accent + "80" },
      { label: "Jeu", value: 0, color: T.accent },
      { label: "Ven", value: 0, color: T.green },
      { label: "Sam", value: 0, color: T.accent + "80" },
      { label: "Dim", value: 0, color: T.accent + "40" },
    ];
  }

  return <div>
    {/* KPI Grid */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="💶" label="Revenu total (GMV)" value={fmt(k.revenue)} color={T.green} />
      <StatCard icon="💰" label="Commissions SUNTREX (4.75%)" value={fmtDec(k.commission)} sub={"sur " + k.orders + " commandes"} color={T.accent} />
      <StatCard icon="📦" label="Commandes" value={k.orders} color={T.blue} />
      <StatCard icon="🧾" label="Panier moyen" value={fmt(k.avgOrder)} color={T.purple} />
    </div>

    {/* Second row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="👥" label="Utilisateurs actifs" value={k.activeUsers} color={T.blue} />
      <StatCard icon="🏢" label="Vendeurs" value={k.sellers} sub={k.pendingKyc + " KYC en attente"} color={T.teal} />
      <StatCard icon="🚚" label="Livraisons en cours" value={k.deliveries?.inTransit || 0} sub={(k.deliveries?.delivered || 0) + " livrées / " + (k.deliveries?.issue || 0) + " problèmes"} color={T.accent} />
      <StatCard icon="⚠️" label="Litiges ouverts" value={k.disputes} color={T.red} />
    </div>

    {/* Revenue chart */}
    <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, marginBottom: 24, boxShadow: T.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>📈 Revenu mensuel</div>
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
      {(transactions || []).slice(0, 5).map(function(tx) {
        var s = STATUS_MAP[tx.status] || {};
        return <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid " + T.borderLight, fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: T.accent, width: 70 }}>{tx.id}</span>
          <span style={{ flex: 1, color: T.text, fontWeight: 500 }}>{tx.flag} {tx.buyer}</span>
          <span style={{ flex: 1, color: T.textSec }}>{tx.product}</span>
          <span style={{ width: 80, textAlign: "right", fontWeight: 700, color: T.text }}>{fmt(tx.total)}</span>
          <Badge label={s.label || tx.status} color={s.color} bg={s.bg} />
        </div>;
      })}
      {(!transactions || transactions.length === 0) && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucune transaction</div>}
    </div>
  </div>;
}

// ── Section: Transactions ──
function TransactionsSection({ transactions }) {
  var _f = useState("all"), filter = _f[0], setFilter = _f[1];
  var allTx = transactions || [];
  var filtered = filter === "all" ? allTx : allTx.filter(function(tx) { return tx.status === filter; });

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
          <span style={{ color: T.textSec }}>{(tx.product || "").length > 28 ? tx.product.slice(0, 28) + "…" : tx.product}</span>
          <span style={{ textAlign: "right", fontWeight: 700, color: T.text }}>{fmt(tx.total)}</span>
          <span style={{ textAlign: "right", fontWeight: 600, color: T.green }}>{fmtDec(tx.commission)}</span>
          <Badge label={s.label || tx.status} color={s.color} bg={s.bg} />
        </div>;
      })}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucune transaction</div>}
    </div>
  </div>;
}

// ── Section: Sellers ──
function SellersSection({ sellers }) {
  var allSellers = sellers || [];
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <StatCard icon="🏢" label="Total vendeurs" value={allSellers.length} color={T.teal} />
      <StatCard icon="✓" label="KYC vérifiés" value={allSellers.filter(function(s) { return s.kyc === "verified"; }).length} color={T.green} />
      <StatCard icon="⏳" label="KYC en attente" value={allSellers.filter(function(s) { return s.kyc === "pending" || s.kyc === "pending_review"; }).length} color={T.yellow} />
    </div>

    <div style={{ background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight, overflow: "hidden", boxShadow: T.shadow }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 90px 80px 80px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>Vendeur</span><span>Pays</span><span>Produits</span><span style={{ textAlign: "right" }}>CA généré</span><span style={{ textAlign: "right" }}>Commission</span><span>KYC</span><span>Tier</span>
      </div>
      {allSellers.map(function(seller) {
        var kyc = KYC_MAP[seller.kyc] || KYC_MAP.pending;
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
      {allSellers.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucun vendeur</div>}
    </div>
  </div>;
}

// ── Section: Commissions ──
function CommissionsSection({ transactions }) {
  var allTx = transactions || [];
  var totalCommission = allTx.reduce(function(a, tx) { return a + (tx.commission || 0); }, 0);
  var bySellerMap = {};
  allTx.forEach(function(tx) {
    if (!bySellerMap[tx.seller]) bySellerMap[tx.seller] = { name: tx.seller, total: 0, count: 0 };
    bySellerMap[tx.seller].total += tx.commission || 0;
    bySellerMap[tx.seller].count++;
  });
  var bySeller = Object.values(bySellerMap).sort(function(a, b) { return b.total - a.total; });

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="💰" label="Commissions totales" value={fmtDec(totalCommission)} sub="4.75% sur chaque transaction" color={T.green} />
      <StatCard icon="📊" label="Commission moyenne" value={fmtDec(allTx.length > 0 ? totalCommission / allTx.length : 0)} sub={"sur " + allTx.length + " transactions"} color={T.accent} />
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
      {bySeller.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucune commission</div>}
    </div>
  </div>;
}

// ── Section: Placeholder for future sections ──
function PlaceholderSection({ title, icon }) {
  return <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 13, color: T.textSec }}>Cette section sera disponible prochainement.</div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  var navigate = useNavigate();
  var _s = useState("overview"), section = _s[0], setSection = _s[1];
  var _m = useState(false), mobileNav = _m[0], setMobileNav = _m[1];
  var { data, loading, error, usingMock, refresh } = useAdminData();

  // Admin guard — check auth + admin email
  // Checks getUser(), getSession(), and listens to onAuthStateChange
  var _a = useState("checking"), authState = _a[0], setAuthState = _a[1]; // "checking" | "admin" | "no_session" | "not_admin"

  useEffect(function() {
    if (!supabase) { setAuthState("admin"); return; } // No supabase = dev mode, allow

    function checkUser(user) {
      if (!user) return false;
      if (isAdminEmail(user.email)) { setAuthState("admin"); return true; }
      setAuthState("not_admin");
      return true;
    }

    // Try getUser first, then getSession as fallback
    async function checkAuth() {
      try {
        var userRes = await supabase.auth.getUser();
        if (checkUser(userRes.data?.user)) return;
      } catch (_e) { /* ignore */ }

      try {
        var sessionRes = await supabase.auth.getSession();
        if (checkUser(sessionRes.data?.session?.user)) return;
      } catch (_e) { /* ignore */ }

      // No session found
      setAuthState("no_session");
    }

    checkAuth();

    // Listen for auth changes (user logs in after page load)
    var sub = supabase.auth.onAuthStateChange(function(_event, session) {
      if (session?.user) {
        checkUser(session.user);
      } else {
        setAuthState("no_session");
      }
    });

    return function() { sub.data?.subscription?.unsubscribe(); };
  }, []);

  // Show loading spinner while checking
  if (authState === "checking") {
    return <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LoadingSpinner />
    </div>;
  }

  // No session — show login prompt (not a silent redirect)
  if (authState === "no_session") {
    return <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40, background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight, boxShadow: T.shadowMd, maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Admin Dashboard</div>
        <div style={{ fontSize: 14, color: T.textSec, marginBottom: 24 }}>Connectez-vous avec un compte admin pour accéder au tableau de bord.</div>
        <button onClick={function() { navigate("/"); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>Retour à l'accueil</button>
      </div>
    </div>;
  }

  // Not admin — show access denied
  if (authState === "not_admin") {
    return <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40, background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight, boxShadow: T.shadowMd, maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛔</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Accès refusé</div>
        <div style={{ fontSize: 14, color: T.textSec, marginBottom: 24 }}>Votre compte n'a pas les droits administrateur.</div>
        <button onClick={function() { navigate("/"); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>Retour à l'accueil</button>
      </div>
    </div>;
  }

  var kpi = data?.kpi || {};
  var transactions = data?.transactions || [];
  var sellers = data?.sellers || [];
  var monthlyRevenue = data?.monthlyRevenue || [];

  function renderSection() {
    if (loading) return <LoadingSpinner />;
    switch (section) {
      case "overview": return <OverviewSection kpi={kpi} transactions={transactions} monthlyRevenue={monthlyRevenue} />;
      case "transactions": return <TransactionsSection transactions={transactions} />;
      case "sellers": return <SellersSection sellers={sellers} />;
      case "commissions": return <CommissionsSection transactions={transactions} />;
      case "delivery": return <PlaceholderSection title="Gestion des livraisons" icon="🚚" />;
      case "disputes": return <PlaceholderSection title="Gestion des litiges" icon="⚠️" />;
      case "users": return <PlaceholderSection title="Gestion des utilisateurs" icon="👥" />;
      case "settings": return <PlaceholderSection title="Paramètres plateforme" icon="⚙️" />;
      default: return <OverviewSection kpi={kpi} transactions={transactions} monthlyRevenue={monthlyRevenue} />;
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
          Commission: 4.75% • EUR
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
          {/* Data source badge */}
          {usingMock ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: T.yellowBg, borderRadius: 8, fontSize: 11, fontWeight: 600, color: T.yellowText }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.yellow, display: "inline-block" }} />
              MOCK
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: T.greenBg, borderRadius: 8, fontSize: 11, fontWeight: 600, color: T.greenText }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block" }} />
              LIVE
            </div>
          )}
          {/* Refresh button */}
          <button onClick={refresh} style={{ background: "none", border: "1px solid " + T.border, borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: T.textSec }} title="Rafraîchir">↻</button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>YA</div>
        </div>
      </div>

      {/* Error banner */}
      {error && !loading && <div style={{ margin: "12px 24px 0", padding: "10px 16px", background: T.yellowBg, border: "1px solid " + T.yellow + "40", borderRadius: 8, fontSize: 12, color: T.yellowText }}>
        Données mock affichées — {error}
      </div>}

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
