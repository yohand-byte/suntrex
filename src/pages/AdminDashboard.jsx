import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../hooks/useAdminData";
import { supabase } from "../lib/supabase";

var FraudAlerts = lazy(function () { return import("../components/admin/FraudAlerts"); });
var ModerationDashboard = lazy(function () { return import("./admin/ModerationDashboard"); });
var ReconciliationPanel = lazy(function () { return import("../components/admin/ReconciliationPanel"); });
var AlertsPanel = lazy(function () { return import("../components/admin/AlertsPanel"); });

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Admin Dashboard

   Platform command center for the SUNTREX team.
   KPIs, transactions, sellers, registrations, commissions,
   deliveries, disputes, users.

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

var REG_STATUS_MAP = {
  pending_review: { label: "En attente", color: T.yellow, bg: T.yellowBg },
  approved: { label: "Approuvée", color: T.green, bg: T.greenBg },
  rejected: { label: "Refusée", color: T.red, bg: T.redBg },
  info_requested: { label: "Info demandée", color: T.blue, bg: T.blueBg },
};

var USER_STATUS_MAP = {
  active: { label: "Actif", color: T.green, bg: T.greenBg },
  suspended: { label: "Suspendu", color: T.red, bg: T.redBg },
  pending: { label: "En attente", color: T.yellow, bg: T.yellowBg },
};

var DELIVERY_STATUS_MAP = {
  in_transit: { label: "En transit", color: T.accent, bg: T.accentLight },
  delivered: { label: "Livrée", color: T.green, bg: T.greenBg },
  issue: { label: "Problème", color: T.red, bg: T.redBg },
};

var DISPUTE_STATUS_MAP = {
  open: { label: "Ouvert", color: T.red, bg: T.redBg },
  resolved: { label: "Résolu", color: T.green, bg: T.greenBg },
};

function fmt(n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n); }
function fmtDec(n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n); }

// Admin email check (client-side guard)
var ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map(function(e) { return e.trim().toLowerCase(); }).filter(Boolean);
function isAdminEmail(email) {
  if (ADMIN_EMAILS.length === 0) return true;
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

// CSV export
function exportCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  var headers = Object.keys(rows[0]);
  var csv = [headers.join(",")].concat(rows.map(function(r) {
    return headers.map(function(h) { return JSON.stringify(r[h] != null ? r[h] : ""); }).join(",");
  })).join("\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Sidebar ──
var NAV_ITEMS = [
  { id: "overview", icon: "📊", label: "Vue d'ensemble" },
  { id: "transactions", icon: "💳", label: "Transactions" },
  { id: "sellers", icon: "🏢", label: "Vendeurs" },
  { id: "registrations", icon: "📋", label: "Inscriptions" },
  { id: "commissions", icon: "💰", label: "Commissions" },
  { id: "users", icon: "👥", label: "Utilisateurs" },
  { id: "delivery", icon: "🚚", label: "Livraisons" },
  { id: "disputes", icon: "⚠️", label: "Litiges" },
  { id: "fraud", icon: "🛡️", label: "Fraude" },
  { id: "moderation", icon: "💬", label: "Modération" },
  { id: "reconciliation", icon: "🔄", label: "Réconciliation" },
  { id: "alerts", icon: "🔔", label: "Alertes" },
  { id: "settings", icon: "⚙️", label: "Paramètres" },
];

// ── Shared Components ──

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
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, color: color, background: bg, whiteSpace: "nowrap" }}>{label}</span>;
}

function LoadingSpinner() {
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
    <div style={{ width: 40, height: 40, border: "3px solid " + T.borderLight, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <div style={{ marginTop: 16, fontSize: 14, color: T.textSec }}>Chargement des données...</div>
  </div>;
}

function FilterBtn({ label, active, onClick }) {
  return <button onClick={onClick} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid " + (active ? T.accent : T.border), background: active ? T.accent : T.card, color: active ? "#fff" : T.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>{label}</button>;
}

function SearchInput({ value, onChange, placeholder }) {
  return <input value={value} onChange={function(e) { onChange(e.target.value); }} placeholder={placeholder || "Rechercher..."} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid " + T.border, fontSize: 12, fontFamily: T.font, outline: "none", minWidth: 180 }} />;
}

function ActionBtn({ label, color, bg, onClick }) {
  return <button onClick={onClick} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: bg, color: color, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap" }}>{label}</button>;
}

function TableWrapper({ children }) {
  return <div style={{ background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight, overflow: "hidden", boxShadow: T.shadow }}>
    <div style={{ overflowX: "auto" }}>{children}</div>
  </div>;
}

// ── Section: Overview ──
function OverviewSection({ kpi, transactions, monthlyRevenue }) {
  var k = kpi;
  var g = k.growth || {};
  var chartData = (monthlyRevenue || []).map(function(m) {
    return { label: m.label.split(" ")[0], value: m.value, color: T.accent };
  });
  var commissionChartData = (monthlyRevenue || []).map(function(m) {
    return { label: m.label.split(" ")[0], value: Math.round(m.value * 0.0475), color: T.green };
  });

  if (chartData.length === 0) {
    chartData = [{ label: "—", value: 0, color: T.accent }];
  }

  return <div>
    {/* KPI Grid */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="💶" label="Revenu total (GMV)" value={fmt(k.revenue)} growth={g.revenue} color={T.green} />
      <StatCard icon="💰" label="Commissions SUNTREX" value={fmtDec(k.commission)} sub={"4.75% sur " + k.orders + " commandes"} growth={g.orders} color={T.accent} />
      <StatCard icon="📦" label="Commandes" value={k.orders} growth={g.orders} color={T.blue} />
      <StatCard icon="🧾" label="Panier moyen" value={fmt(k.avgOrder)} color={T.purple} />
    </div>

    {/* Second row */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="👥" label="Utilisateurs actifs" value={k.activeUsers} growth={g.users} color={T.blue} />
      <StatCard icon="🏢" label="Vendeurs" value={k.sellers} sub={k.pendingKyc + " KYC en attente"} growth={g.sellers} color={T.teal} />
      <StatCard icon="🚚" label="Livraisons en cours" value={(k.deliveries && k.deliveries.inTransit) || 0} sub={((k.deliveries && k.deliveries.delivered) || 0) + " livrées / " + ((k.deliveries && k.deliveries.issue) || 0) + " problèmes"} color={T.accent} />
      <StatCard icon="⚠️" label="Litiges ouverts" value={k.disputes} color={T.red} />
    </div>

    {/* Charts row */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
      {/* Revenue chart */}
      <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow }}>
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
      {/* Commission chart */}
      <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>💰 Commissions mensuelles</div>
          <span style={{ fontSize: 12, color: T.textMuted }}>Total: {fmtDec(commissionChartData.reduce(function(a, d) { return a + d.value; }, 0))}</span>
        </div>
        <MiniBar data={commissionChartData} height={80} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {commissionChartData.map(function(d) {
            return <span key={d.label} style={{ fontSize: 10, color: T.textMuted, flex: 1, textAlign: "center" }}>{d.label}</span>;
          })}
        </div>
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
  var _s = useState(""), search = _s[0], setSearch = _s[1];
  var _c = useState("all"), countryFilter = _c[0], setCountryFilter = _c[1];
  var _d1 = useState(""), dateFrom = _d1[0], setDateFrom = _d1[1];
  var _d2 = useState(""), dateTo = _d2[0], setDateTo = _d2[1];
  var _p = useState(0), page = _p[0], setPage = _p[1];
  var _det = useState(null), detail = _det[0], setDetail = _det[1];
  var PER_PAGE = 15;

  var allTx = transactions || [];
  var countries = useMemo(function() {
    var set = {};
    allTx.forEach(function(tx) { if (tx.country) set[tx.country] = tx.flag; });
    return Object.keys(set).sort().map(function(c) { return { code: c, flag: set[c] }; });
  }, [allTx]);

  var filtered = allTx.filter(function(tx) {
    if (filter !== "all" && tx.status !== filter) return false;
    if (countryFilter !== "all" && tx.country !== countryFilter) return false;
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    if (search) {
      var q = search.toLowerCase();
      if (!(tx.buyer || "").toLowerCase().includes(q) && !(tx.seller || "").toLowerCase().includes(q) && !(tx.product || "").toLowerCase().includes(q) && !(tx.id || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  var totalPages = Math.ceil(filtered.length / PER_PAGE);
  var paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return <div>
    {/* Filters row */}
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
      {[{ id: "all", label: "Toutes" }, { id: "paid", label: "Payées" }, { id: "shipped", label: "Expédiées" }, { id: "in_transit", label: "En transit" }, { id: "delivered", label: "Livrées" }, { id: "disputed", label: "Litiges" }, { id: "cancelled", label: "Annulées" }].map(function(f) {
        return <FilterBtn key={f.id} label={f.label} active={filter === f.id} onClick={function() { setFilter(f.id); setPage(0); }} />;
      })}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
      <SearchInput value={search} onChange={function(v) { setSearch(v); setPage(0); }} placeholder="Rechercher acheteur, vendeur, produit..." />
      <select value={countryFilter} onChange={function(e) { setCountryFilter(e.target.value); setPage(0); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid " + T.border, fontSize: 12, fontFamily: T.font, background: T.card }}>
        <option value="all">Tous pays</option>
        {countries.map(function(c) { return <option key={c.code} value={c.code}>{c.flag} {c.code}</option>; })}
      </select>
      <input type="date" value={dateFrom} onChange={function(e) { setDateFrom(e.target.value); setPage(0); }} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid " + T.border, fontSize: 12, fontFamily: T.font }} />
      <span style={{ fontSize: 12, color: T.textMuted }}>→</span>
      <input type="date" value={dateTo} onChange={function(e) { setDateTo(e.target.value); setPage(0); }} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid " + T.border, fontSize: 12, fontFamily: T.font }} />
      <button onClick={function() { exportCSV(filtered, "suntrex-transactions.csv"); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + T.border, background: T.card, color: T.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>📥 Export CSV</button>
      <span style={{ fontSize: 12, color: T.textMuted, marginLeft: "auto" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
    </div>

    <TableWrapper>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 90px 90px 80px 100px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 800 }}>
        <span>ID</span><span>Acheteur</span><span>Vendeur</span><span>Produit</span><span style={{ textAlign: "right" }}>Montant</span><span style={{ textAlign: "right" }}>Commission</span><span>Date</span><span>Statut</span>
      </div>
      {/* Rows */}
      {paged.map(function(tx) {
        var s = STATUS_MAP[tx.status] || {};
        return <div key={tx.id} onClick={function() { setDetail(tx); }} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr 90px 90px 80px 100px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", cursor: "pointer", transition: "background .15s", minWidth: 800 }} onMouseEnter={function(e) { e.currentTarget.style.background = T.bg; }} onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
          <span style={{ fontWeight: 700, color: T.accent }}>{tx.id}</span>
          <span style={{ color: T.text, fontWeight: 500 }}>{tx.flag} {tx.buyer}</span>
          <span style={{ color: T.textSec }}>{tx.seller}</span>
          <span style={{ color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.product}</span>
          <span style={{ textAlign: "right", fontWeight: 700, color: T.text }}>{fmt(tx.total)}</span>
          <span style={{ textAlign: "right", fontWeight: 600, color: T.green }}>{fmtDec(tx.commission)}</span>
          <span style={{ color: T.textMuted, fontSize: 11 }}>{tx.date}</span>
          <Badge label={s.label || tx.status} color={s.color} bg={s.bg} />
        </div>;
      })}
      {paged.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucune transaction</div>}
    </TableWrapper>

    {/* Pagination */}
    {totalPages > 1 && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
      <button onClick={function() { setPage(Math.max(0, page - 1)); }} disabled={page === 0} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + T.border, background: T.card, color: page === 0 ? T.textMuted : T.text, fontSize: 12, cursor: page === 0 ? "default" : "pointer", fontFamily: T.font }}>← Précédent</button>
      <span style={{ padding: "7px 14px", fontSize: 12, color: T.textSec }}>{page + 1} / {totalPages}</span>
      <button onClick={function() { setPage(Math.min(totalPages - 1, page + 1)); }} disabled={page >= totalPages - 1} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid " + T.border, background: T.card, color: page >= totalPages - 1 ? T.textMuted : T.text, fontSize: 12, cursor: page >= totalPages - 1 ? "default" : "pointer", fontFamily: T.font }}>Suivant →</button>
    </div>}

    {/* Detail panel */}
    {detail && <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, maxWidth: "100vw", background: T.card, boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 100, padding: 24, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.accent }}>{detail.id}</div>
        <button onClick={function() { setDetail(null); }} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.textMuted }}>✕</button>
      </div>
      <div style={{ fontSize: 13, lineHeight: 2, color: T.text }}>
        <div><strong>Acheteur :</strong> {detail.flag} {detail.buyer}</div>
        <div><strong>Vendeur :</strong> {detail.seller}</div>
        <div><strong>Produit :</strong> {detail.product}</div>
        <div><strong>Quantité :</strong> {detail.qty}</div>
        <div><strong>Montant :</strong> {fmt(detail.total)}</div>
        <div><strong>Commission :</strong> {fmtDec(detail.commission)}</div>
        <div><strong>Date :</strong> {detail.date}</div>
        <div><strong>Pays :</strong> {detail.country}</div>
        <div style={{ marginTop: 8 }}><strong>Statut :</strong> <Badge label={(STATUS_MAP[detail.status] || {}).label || detail.status} color={(STATUS_MAP[detail.status] || {}).color} bg={(STATUS_MAP[detail.status] || {}).bg} /></div>
      </div>
    </div>}
    {detail && <div onClick={function() { setDetail(null); }} style={{ position: "fixed", top: 0, left: 0, right: 420, bottom: 0, background: "rgba(0,0,0,0.2)", zIndex: 99 }} />}
  </div>;
}

// ── Section: Sellers ──
function SellersSection({ sellers }) {
  var _f = useState("all"), filter = _f[0], setFilter = _f[1];
  var _s = useState(""), search = _s[0], setSearch = _s[1];
  var _c = useState("all"), countryFilter = _c[0], setCountryFilter = _c[1];
  var _exp = useState(null), expanded = _exp[0], setExpanded = _exp[1];
  var _sellers = useState(sellers || []), localSellers = _sellers[0], setLocalSellers = _sellers[1];

  useEffect(function() { setLocalSellers(sellers || []); }, [sellers]);

  var countries = useMemo(function() {
    var set = {};
    localSellers.forEach(function(s) { if (s.country) set[s.country] = s.flag; });
    return Object.keys(set).sort().map(function(c) { return { code: c, flag: set[c] }; });
  }, [localSellers]);

  var filtered = localSellers.filter(function(s) {
    if (filter === "verified" && s.kyc !== "verified") return false;
    if (filter === "pending" && s.kyc !== "pending" && s.kyc !== "pending_review") return false;
    if (filter === "rejected" && s.kyc !== "rejected") return false;
    if (countryFilter !== "all" && s.country !== countryFilter) return false;
    if (search && !(s.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleSuspend(id) {
    setLocalSellers(localSellers.map(function(s) {
      if (s.id === id) return Object.assign({}, s, { status: s.status === "suspended" ? "active" : "suspended" });
      return s;
    }));
  }

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <StatCard icon="🏢" label="Total vendeurs" value={localSellers.length} color={T.teal} />
      <StatCard icon="✓" label="KYC vérifiés" value={localSellers.filter(function(s) { return s.kyc === "verified"; }).length} color={T.green} />
      <StatCard icon="⏳" label="KYC en attente" value={localSellers.filter(function(s) { return s.kyc === "pending" || s.kyc === "pending_review"; }).length} color={T.yellow} />
      <StatCard icon="✕" label="KYC refusés" value={localSellers.filter(function(s) { return s.kyc === "rejected"; }).length} color={T.red} />
    </div>

    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      {[{ id: "all", label: "Tous" }, { id: "verified", label: "Vérifiés" }, { id: "pending", label: "En attente" }, { id: "rejected", label: "Refusés" }].map(function(f) {
        return <FilterBtn key={f.id} label={f.label} active={filter === f.id} onClick={function() { setFilter(f.id); }} />;
      })}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher vendeur..." />
      <select value={countryFilter} onChange={function(e) { setCountryFilter(e.target.value); }} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid " + T.border, fontSize: 12, fontFamily: T.font, background: T.card }}>
        <option value="all">Tous pays</option>
        {countries.map(function(c) { return <option key={c.code} value={c.code}>{c.flag} {c.code}</option>; })}
      </select>
    </div>

    <TableWrapper>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 90px 80px 80px 140px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 800 }}>
        <span>Vendeur</span><span>Pays</span><span>Produits</span><span style={{ textAlign: "right" }}>CA généré</span><span style={{ textAlign: "right" }}>Commission</span><span>KYC</span><span>Tier</span><span>Actions</span>
      </div>
      {filtered.map(function(seller) {
        var kyc = KYC_MAP[seller.kyc] || KYC_MAP.pending;
        var tier = TIER_MAP[seller.tier] || TIER_MAP.none;
        var isExpanded = expanded === seller.id;
        return <div key={seller.id}>
          <div onClick={function() { setExpanded(isExpanded ? null : seller.id); }} style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 90px 80px 80px 140px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", cursor: "pointer", background: isExpanded ? T.bg : "", minWidth: 800 }}>
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
            <div style={{ display: "flex", gap: 4 }} onClick={function(e) { e.stopPropagation(); }}>
              <ActionBtn label="Profil" color={T.blueText} bg={T.blueBg} onClick={function() {}} />
              <ActionBtn label={seller.status === "suspended" ? "Réactiver" : "Suspendre"} color={seller.status === "suspended" ? T.greenText : T.redText} bg={seller.status === "suspended" ? T.greenBg : T.redBg} onClick={function() { toggleSuspend(seller.id); }} />
              <ActionBtn label="Email" color={T.purpleText} bg={T.purpleBg} onClick={function() { window.location.href = "mailto:" + seller.email; }} />
            </div>
          </div>
          {isExpanded && <div style={{ padding: "12px 16px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 12, color: T.textSec, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><strong style={{ color: T.text }}>TVA :</strong> {seller.vat || "—"}</div>
            <div><strong style={{ color: T.text }}>Email :</strong> {seller.email || "—"}</div>
            <div><strong style={{ color: T.text }}>Note :</strong> {seller.rating > 0 ? seller.rating + "/5" : "Pas de note"}</div>
            <div><strong style={{ color: T.text }}>Statut :</strong> <Badge label={(USER_STATUS_MAP[seller.status] || {}).label || seller.status} color={(USER_STATUS_MAP[seller.status] || {}).color} bg={(USER_STATUS_MAP[seller.status] || {}).bg} /></div>
          </div>}
        </div>;
      })}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucun vendeur</div>}
    </TableWrapper>
  </div>;
}

// ── Section: Registrations (NEW) ──
function RegistrationsSection({ registrations }) {
  var _f = useState("all"), filter = _f[0], setFilter = _f[1];
  var _regs = useState(registrations || []), localRegs = _regs[0], setLocalRegs = _regs[1];

  useEffect(function() { setLocalRegs(registrations || []); }, [registrations]);

  var pendingCount = localRegs.filter(function(r) { return r.status === "pending_review"; }).length;
  var approvedCount = localRegs.filter(function(r) { return r.status === "approved"; }).length;

  var filtered = localRegs.filter(function(r) {
    if (filter === "pending_review" && r.status !== "pending_review") return false;
    if (filter === "approved" && r.status !== "approved") return false;
    if (filter === "rejected" && r.status !== "rejected") return false;
    if (filter === "info_requested" && r.status !== "info_requested") return false;
    return true;
  });

  function updateStatus(id, status) {
    setLocalRegs(localRegs.map(function(r) {
      if (r.id === id) return Object.assign({}, r, { status: status });
      return r;
    }));
  }

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
      <StatCard icon="📋" label="Total demandes" value={localRegs.length} color={T.blue} />
      <StatCard icon="⏳" label="En attente" value={pendingCount} color={T.yellow} />
      <StatCard icon="✓" label="Approuvées" value={approvedCount} color={T.green} />
    </div>

    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {[{ id: "all", label: "Toutes" }, { id: "pending_review", label: "En attente" }, { id: "approved", label: "Approuvées" }, { id: "rejected", label: "Refusées" }, { id: "info_requested", label: "Info demandée" }].map(function(f) {
        return <FilterBtn key={f.id} label={f.label} active={filter === f.id} onClick={function() { setFilter(f.id); }} />;
      })}
    </div>

    <TableWrapper>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 70px 80px 120px 80px 180px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 900 }}>
        <span>Entreprise</span><span>Contact</span><span>Email</span><span>Pays</span><span>Rôle</span><span>N° TVA</span><span>Statut</span><span>Actions</span>
      </div>
      {filtered.map(function(reg) {
        var st = REG_STATUS_MAP[reg.status] || {};
        return <div key={reg.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 70px 80px 120px 80px 180px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", minWidth: 900 }}>
          <div>
            <div style={{ fontWeight: 600, color: T.text }}>{reg.companyName}</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>{reg.date}</div>
          </div>
          <span style={{ color: T.text }}>{reg.contactName}</span>
          <span style={{ color: T.textSec, fontSize: 11 }}>{reg.email}</span>
          <span>{reg.flag} {reg.country}</span>
          <span style={{ fontSize: 11, color: T.textSec }}>{reg.role}</span>
          <span style={{ fontSize: 11, color: T.textMuted }}>{reg.vatNumber}</span>
          <Badge label={st.label || reg.status} color={st.color} bg={st.bg} />
          <div style={{ display: "flex", gap: 4 }}>
            {reg.status !== "approved" && <ActionBtn label="Approuver" color={T.greenText} bg={T.greenBg} onClick={function() { updateStatus(reg.id, "approved"); }} />}
            {reg.status !== "rejected" && <ActionBtn label="Refuser" color={T.redText} bg={T.redBg} onClick={function() { updateStatus(reg.id, "rejected"); }} />}
            {reg.status !== "info_requested" && <ActionBtn label="Demander info" color={T.yellowText} bg={T.yellowBg} onClick={function() { updateStatus(reg.id, "info_requested"); }} />}
          </div>
        </div>;
      })}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucune demande d'inscription</div>}
    </TableWrapper>
  </div>;
}

// ── Section: Commissions ──
function CommissionsSection({ transactions, monthlyRevenue }) {
  var allTx = transactions || [];
  var totalCommission = allTx.reduce(function(a, tx) { return a + (tx.commission || 0); }, 0);
  var bySellerMap = {};
  allTx.forEach(function(tx) {
    if (!bySellerMap[tx.seller]) bySellerMap[tx.seller] = { name: tx.seller, total: 0, count: 0 };
    bySellerMap[tx.seller].total += tx.commission || 0;
    bySellerMap[tx.seller].count++;
  });
  var bySeller = Object.values(bySellerMap).sort(function(a, b) { return b.total - a.total; });
  var top5 = bySeller.slice(0, 5);

  var monthlyCommData = (monthlyRevenue || []).map(function(m) {
    return { label: m.label.split(" ")[0], value: Math.round(m.value * 0.0475), color: T.green };
  });

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
      <StatCard icon="💰" label="Commissions totales" value={fmtDec(totalCommission)} sub="4.75% sur chaque transaction" color={T.green} />
      <StatCard icon="📊" label="Commission moyenne" value={fmtDec(allTx.length > 0 ? totalCommission / allTx.length : 0)} sub={"sur " + allTx.length + " transactions"} color={T.accent} />
      <StatCard icon="🏆" label="Top vendeur" value={bySeller[0] ? bySeller[0].name : "—"} sub={fmtDec(bySeller[0] ? bySeller[0].total : 0) + " de commissions"} color={T.purple} />
      <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow, flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: T.accent, marginBottom: 4 }}>4,75%</div>
        <div style={{ fontSize: 12, color: T.textSec }}>Taux de commission actuel</div>
        <div style={{ fontSize: 11, color: T.green, marginTop: 4, fontWeight: 600 }}>-5% vs concurrence</div>
      </div>
    </div>

    {/* Monthly evolution */}
    <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>📈 Évolution des commissions (12 mois)</div>
        <span style={{ fontSize: 12, color: T.textMuted }}>Total: {fmtDec(monthlyCommData.reduce(function(a, d) { return a + d.value; }, 0))}</span>
      </div>
      <MiniBar data={monthlyCommData} height={80} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {monthlyCommData.map(function(d) {
          return <span key={d.label} style={{ fontSize: 10, color: T.textMuted, flex: 1, textAlign: "center" }}>{d.label}</span>;
        })}
      </div>
    </div>

    {/* Top 5 sellers */}
    <div style={{ background: T.card, borderRadius: T.radiusLg, padding: 20, border: "1px solid " + T.borderLight, boxShadow: T.shadow }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>🏆 Top 5 vendeurs par commission</div>
      {top5.map(function(s, i) {
        var pct = totalCommission > 0 ? (s.total / totalCommission) * 100 : 0;
        return <div key={s.name} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              <span style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", background: i === 0 ? T.accent : T.borderLight, color: i === 0 ? "#fff" : T.textSec, fontSize: 10, textAlign: "center", lineHeight: "20px", marginRight: 8 }}>{i + 1}</span>
              {s.name}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{fmtDec(s.total)} <span style={{ color: T.textMuted, fontWeight: 400, fontSize: 11 }}>({s.count} tx · {pct.toFixed(1)}%)</span></span>
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

// ── Section: Users ──
function UsersSection({ users }) {
  var _f = useState("all"), roleFilter = _f[0], setRoleFilter = _f[1];
  var _sf = useState("all"), statusFilter = _sf[0], setStatusFilter = _sf[1];
  var _s = useState(""), search = _s[0], setSearch = _s[1];
  var _users = useState(users || []), localUsers = _users[0], setLocalUsers = _users[1];

  useEffect(function() { setLocalUsers(users || []); }, [users]);

  var filtered = localUsers.filter(function(u) {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (search) {
      var q = search.toLowerCase();
      if (!(u.name || "").toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q) && !(u.company || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  var totalBuyers = localUsers.filter(function(u) { return u.role === "buyer" || u.role === "both"; }).length;
  var totalSellers = localUsers.filter(function(u) { return u.role === "seller" || u.role === "both"; }).length;
  var totalSuspended = localUsers.filter(function(u) { return u.status === "suspended"; }).length;

  function toggleSuspend(id) {
    setLocalUsers(localUsers.map(function(u) {
      if (u.id === id) return Object.assign({}, u, { status: u.status === "suspended" ? "active" : "suspended" });
      return u;
    }));
  }

  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <StatCard icon="👥" label="Total utilisateurs" value={localUsers.length} color={T.blue} />
      <StatCard icon="🛒" label="Acheteurs" value={totalBuyers} color={T.teal} />
      <StatCard icon="🏢" label="Vendeurs" value={totalSellers} color={T.accent} />
      <StatCard icon="🚫" label="Suspendus" value={totalSuspended} color={T.red} />
    </div>

    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      {[{ id: "all", label: "Tous rôles" }, { id: "buyer", label: "Acheteurs" }, { id: "seller", label: "Vendeurs" }, { id: "both", label: "Both" }].map(function(f) {
        return <FilterBtn key={f.id} label={f.label} active={roleFilter === f.id} onClick={function() { setRoleFilter(f.id); }} />;
      })}
      <span style={{ width: 1, background: T.border, margin: "0 4px" }} />
      {[{ id: "all", label: "Tous statuts" }, { id: "active", label: "Actifs" }, { id: "suspended", label: "Suspendus" }, { id: "pending", label: "En attente" }].map(function(f) {
        return <FilterBtn key={f.id + "-s"} label={f.label} active={statusFilter === f.id} onClick={function() { setStatusFilter(f.id); }} />;
      })}
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      <SearchInput value={search} onChange={setSearch} placeholder="Rechercher nom, email, entreprise..." />
      <span style={{ fontSize: 12, color: T.textMuted, marginLeft: "auto", alignSelf: "center" }}>{filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}</span>
    </div>

    <TableWrapper>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 70px 70px 70px 90px 100px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 800 }}>
        <span>Nom</span><span>Email</span><span>Entreprise</span><span>Pays</span><span>Rôle</span><span>KYC</span><span>Dernier accès</span><span>Actions</span>
      </div>
      {filtered.map(function(u) {
        var kyc = KYC_MAP[u.kycStatus] || KYC_MAP.pending;
        var us = USER_STATUS_MAP[u.status] || {};
        return <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 70px 70px 70px 90px 100px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", minWidth: 800 }}>
          <div>
            <div style={{ fontWeight: 600, color: T.text }}>{u.name}</div>
            <Badge label={us.label || u.status} color={us.color} bg={us.bg} />
          </div>
          <span style={{ color: T.textSec, fontSize: 11 }}>{u.email}</span>
          <span style={{ color: T.text }}>{u.company}</span>
          <span>{u.flag} {u.country}</span>
          <span style={{ fontSize: 11 }}>{u.role}</span>
          <Badge label={kyc.label} color={kyc.color} bg={kyc.bg} />
          <span style={{ fontSize: 11, color: T.textMuted }}>{u.lastActive}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <ActionBtn label={u.status === "suspended" ? "Réactiver" : "Suspendre"} color={u.status === "suspended" ? T.greenText : T.redText} bg={u.status === "suspended" ? T.greenBg : T.redBg} onClick={function() { toggleSuspend(u.id); }} />
          </div>
        </div>;
      })}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucun utilisateur</div>}
    </TableWrapper>
  </div>;
}

// ── Section: Delivery ──
function DeliverySection({ kpi, deliveries }) {
  var del = deliveries || [];
  var k = kpi || {};
  var dk = k.deliveries || {};
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
      <StatCard icon="🚚" label="En transit" value={dk.inTransit || 0} color={T.accent} />
      <StatCard icon="✓" label="Livrées" value={dk.delivered || 0} color={T.green} />
      <StatCard icon="⚠️" label="Problèmes" value={dk.issue || 0} color={T.red} />
    </div>

    <TableWrapper>
      <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 1fr 1fr 1fr 100px 100px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 800 }}>
        <span>ID</span><span>Commande</span><span>Acheteur</span><span>Vendeur</span><span>Origine</span><span>Destination</span><span>Livraison est.</span><span>Statut</span>
      </div>
      {del.map(function(d) {
        var st = DELIVERY_STATUS_MAP[d.status] || {};
        return <div key={d.id} style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 1fr 1fr 1fr 100px 100px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", minWidth: 800 }}>
          <span style={{ fontWeight: 700, color: T.accent }}>{d.id}</span>
          <span style={{ color: T.textSec }}>{d.orderId}</span>
          <span style={{ color: T.text }}>{d.flag} {d.buyer}</span>
          <span style={{ color: T.textSec }}>{d.seller}</span>
          <span style={{ color: T.textMuted, fontSize: 11 }}>{d.origin}</span>
          <span style={{ color: T.textMuted, fontSize: 11 }}>{d.destination}</span>
          <span style={{ color: T.textSec, fontSize: 11 }}>{d.estimatedDelivery}</span>
          <Badge label={st.label || d.status} color={st.color} bg={st.bg} />
        </div>;
      })}
      {del.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucune livraison</div>}
    </TableWrapper>

    <div style={{ textAlign: "center", padding: 20, marginTop: 16, background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight }}>
      <span style={{ fontSize: 13, color: T.textSec }}>🚚 SUNTREX DELIVERY — Module complet (tracking QR, photos, vérification) disponible prochainement</span>
    </div>
  </div>;
}

// ── Section: Disputes ──
function DisputesSection({ kpi, disputes }) {
  var dis = disputes || [];
  var openCount = dis.filter(function(d) { return d.status === "open"; }).length;
  var resolvedCount = dis.filter(function(d) { return d.status === "resolved"; }).length;
  return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
      <StatCard icon="⚠️" label="Litiges ouverts" value={openCount} color={T.red} />
      <StatCard icon="✓" label="Résolus ce mois" value={resolvedCount} color={T.green} />
      <StatCard icon="💶" label="Montant en jeu" value={fmtDec(dis.filter(function(d) { return d.status === "open"; }).reduce(function(a, d) { return a + (d.amount || 0); }, 0))} color={T.yellow} />
    </div>

    <TableWrapper>
      <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 1fr 2fr 90px 80px", gap: 8, padding: "12px 16px", background: T.bg, borderBottom: "1px solid " + T.borderLight, fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 700 }}>
        <span>ID</span><span>Commande</span><span>Acheteur</span><span>Vendeur</span><span>Raison</span><span>Montant</span><span>Statut</span>
      </div>
      {dis.map(function(d) {
        var st = DISPUTE_STATUS_MAP[d.status] || {};
        return <div key={d.id} style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 1fr 2fr 90px 80px", gap: 8, padding: "12px 16px", borderBottom: "1px solid " + T.borderLight, fontSize: 12, alignItems: "center", minWidth: 700 }}>
          <span style={{ fontWeight: 700, color: T.red }}>{d.id}</span>
          <span style={{ color: T.textSec }}>{d.orderId}</span>
          <span style={{ color: T.text }}>{d.flag} {d.buyer}</span>
          <span style={{ color: T.textSec }}>{d.seller}</span>
          <span style={{ color: T.text, fontSize: 11 }}>{d.reason}</span>
          <span style={{ fontWeight: 700, color: d.amount > 0 ? T.red : T.textMuted }}>{d.amount > 0 ? fmtDec(d.amount) : "—"}</span>
          <Badge label={st.label || d.status} color={st.color} bg={st.bg} />
        </div>;
      })}
      {dis.length === 0 && <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>Aucun litige</div>}
    </TableWrapper>

    <div style={{ textAlign: "center", padding: 20, marginTop: 16, background: T.card, borderRadius: T.radiusLg, border: "1px solid " + T.borderLight }}>
      <span style={{ fontSize: 13, color: T.textSec }}>⚠️ Module litiges — Version complète (résolution automatique, preuves photos) disponible prochainement</span>
    </div>
  </div>;
}

// ── Section: Settings placeholder ──
function SettingsSection() {
  return <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>Paramètres plateforme</div>
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

  // Admin guard
  var _a = useState("checking"), authState = _a[0], setAuthState = _a[1];

  useEffect(function() {
    if (!supabase) { setAuthState("admin"); return; }

    function checkUser(user) {
      if (!user) return false;
      if (isAdminEmail(user.email)) { setAuthState("admin"); return true; }
      setAuthState("not_admin");
      return true;
    }

    async function checkAuth() {
      try {
        var userRes = await supabase.auth.getUser();
        if (checkUser(userRes.data?.user)) return;
      } catch (_e) { /* ignore */ }

      try {
        var sessionRes = await supabase.auth.getSession();
        if (checkUser(sessionRes.data?.session?.user)) return;
      } catch (_e) { /* ignore */ }

      setAuthState("no_session");
    }

    checkAuth();

    var sub = supabase.auth.onAuthStateChange(function(_event, session) {
      if (session?.user) {
        checkUser(session.user);
      } else {
        setAuthState("no_session");
      }
    });

    return function() { sub.data?.subscription?.unsubscribe(); };
  }, []);

  if (authState === "checking") {
    return <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LoadingSpinner />
    </div>;
  }

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
  var registrations = data?.registrations || [];
  var users = data?.users || [];
  var deliveries = data?.deliveries || [];
  var disputes = data?.disputes || [];

  var pendingRegCount = registrations.filter(function(r) { return r.status === "pending_review"; }).length;

  function renderSection() {
    if (loading) return <LoadingSpinner />;
    switch (section) {
      case "overview": return <OverviewSection kpi={kpi} transactions={transactions} monthlyRevenue={monthlyRevenue} />;
      case "transactions": return <TransactionsSection transactions={transactions} />;
      case "sellers": return <SellersSection sellers={sellers} />;
      case "registrations": return <RegistrationsSection registrations={registrations} />;
      case "commissions": return <CommissionsSection transactions={transactions} monthlyRevenue={monthlyRevenue} />;
      case "users": return <UsersSection users={users} />;
      case "delivery": return <DeliverySection kpi={kpi} deliveries={deliveries} />;
      case "disputes": return <DisputesSection kpi={kpi} disputes={disputes} />;
      case "fraud": return <Suspense fallback={null}><FraudAlerts /></Suspense>;
      case "moderation": return <Suspense fallback={null}><ModerationDashboard /></Suspense>;
      case "reconciliation": return <Suspense fallback={null}><ReconciliationPanel /></Suspense>;
      case "alerts": return <Suspense fallback={null}><AlertsPanel /></Suspense>;
      case "settings": return <SettingsSection />;
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
          var hasBadge = item.id === "registrations" && pendingRegCount > 0;
          return <button key={item.id} onClick={function() { setSection(item.id); setMobileNav(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: active ? T.sidebarActive : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: T.font, textAlign: "left", transition: "all .15s", marginBottom: 2, position: "relative" }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
            {hasBadge && <span style={{ marginLeft: "auto", background: T.accent, color: "#fff", fontSize: 9, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingRegCount}</span>}
          </button>;
        })}
      </div>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, padding: "0 20px" }}>
        <div style={{ padding: 12, background: T.sidebarHover, borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>SUNTREX v1.0</div>
          Commission: 4.75% · EUR
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
          var hasBadge = item.id === "registrations" && pendingRegCount > 0;
          return <button key={item.id} onClick={function() { setSection(item.id); setMobileNav(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px", borderRadius: 8, border: "none", background: active ? T.sidebarActive : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: T.font, textAlign: "left", marginBottom: 4 }}>
            <span>{item.icon}</span>{item.label}
            {hasBadge && <span style={{ marginLeft: "auto", background: T.accent, color: "#fff", fontSize: 9, fontWeight: 800, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingRegCount}</span>}
          </button>;
        })}
      </div>
    </div>}
  </div>;
}
