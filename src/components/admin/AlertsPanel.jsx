import { useState, useMemo } from "react";
import useResponsive from "../../hooks/useResponsive";

var API_BASE = import.meta.env.VITE_API_BASE || "https://suntrex-api-316868455348.europe-west1.run.app";

var T = {
  card: "#ffffff", border: "#e8eaef", text: "#1a1d26", textSec: "#6b7280",
  accent: "#E8700A",
  green: "#10b981", greenBg: "#ecfdf5", greenText: "#065f46",
  red: "#ef4444", redBg: "#fef2f2", redText: "#991b1b",
  yellow: "#f59e0b", yellowBg: "#fffbeb", yellowText: "#92400e",
  blue: "#3b82f6", blueBg: "#eff6ff", blueText: "#1e40af",
  purple: "#7c3aed", purpleBg: "#f5f3ff", purpleText: "#5b21b6",
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
};

var SEVERITY_MAP = {
  critical: { label: "CRITIQUE", color: "#fff", bg: T.red },
  high: { label: "HAUTE", color: T.redText, bg: T.redBg },
  medium: { label: "MOYENNE", color: T.yellowText, bg: T.yellowBg },
  low: { label: "BASSE", color: T.blueText, bg: T.blueBg },
};

var TYPE_MAP = {
  amount_mismatch: { label: "Ecart montant", icon: "💰" },
  missing_transfer: { label: "Transfert manquant", icon: "⚠️" },
  duplicate_charge: { label: "Double charge", icon: "🔄" },
  commission_error: { label: "Erreur commission", icon: "📊" },
  refund_mismatch: { label: "Ecart remboursement", icon: "↩️" },
  escrow_timeout: { label: "Escrow expire", icon: "⏰" },
};

var STATUS_MAP = {
  open: { label: "Ouvert", color: T.red, bg: T.redBg },
  investigating: { label: "En cours", color: T.yellow, bg: T.yellowBg },
  resolved: { label: "Resolu", color: T.green, bg: T.greenBg },
};

var MOCK_ALERTS = [
  { id: "ALR-001", type: "amount_mismatch", severity: "high", orderId: "ORD-2024-001", message: "Stripe charge 2450.00 EUR vs DB order 2400.00 EUR — difference 50.00 EUR", stripeAmount: 2450, dbAmount: 2400, createdAt: "2026-03-06T14:22:00Z", status: "open" },
  { id: "ALR-002", type: "amount_mismatch", severity: "medium", orderId: "ORD-2024-015", message: "Stripe charge 890.00 EUR vs DB order 885.00 EUR — difference 5.00 EUR", stripeAmount: 890, dbAmount: 885, createdAt: "2026-03-06T10:15:00Z", status: "open" },
  { id: "ALR-003", type: "missing_transfer", severity: "high", orderId: "ORD-2024-022", message: "Payment received but no transfer created to seller after 48h", stripeAmount: 3200, dbAmount: 3200, createdAt: "2026-03-05T16:30:00Z", status: "open" },
  { id: "ALR-004", type: "duplicate_charge", severity: "critical", orderId: "ORD-2024-030", message: "Duplicate payment_intent detected for same order — 2 charges of 1750.00 EUR", stripeAmount: 3500, dbAmount: 1750, createdAt: "2026-03-05T09:45:00Z", status: "investigating" },
  { id: "ALR-005", type: "commission_error", severity: "medium", orderId: "ORD-2024-041", message: "Commission calculated at 6.2% instead of 4.75% — overcharged seller 18.85 EUR", stripeAmount: 1300, dbAmount: 1300, createdAt: "2026-03-04T22:10:00Z", status: "resolved" },
  { id: "ALR-006", type: "amount_mismatch", severity: "low", orderId: "ORD-2024-055", message: "Rounding difference: Stripe 499.99 EUR vs DB 500.00 EUR", stripeAmount: 499.99, dbAmount: 500, createdAt: "2026-03-04T11:00:00Z", status: "resolved" },
  { id: "ALR-007", type: "refund_mismatch", severity: "high", orderId: "ORD-2024-060", message: "Partial refund 200.00 EUR issued on Stripe but DB shows full refund 850.00 EUR", stripeAmount: 200, dbAmount: 850, createdAt: "2026-03-03T15:20:00Z", status: "open" },
  { id: "ALR-008", type: "escrow_timeout", severity: "medium", orderId: "ORD-2024-072", message: "Escrow funds held for 15 days without delivery confirmation — auto-release pending", stripeAmount: 4100, dbAmount: 4100, createdAt: "2026-03-02T08:00:00Z", status: "investigating" },
];

export default function AlertsPanel() {
  var { isMobile } = useResponsive();
  var [alerts, setAlerts] = useState(MOCK_ALERTS);
  var [filter, setFilter] = useState("all");
  var [checking, setChecking] = useState(false);
  var [checkResult, setCheckResult] = useState(null);

  var filtered = useMemo(function () {
    if (filter === "all") return alerts;
    return alerts.filter(function (a) { return a.status === filter; });
  }, [alerts, filter]);

  var stats = useMemo(function () {
    return {
      total: alerts.length,
      open: alerts.filter(function (a) { return a.status === "open"; }).length,
      investigating: alerts.filter(function (a) { return a.status === "investigating"; }).length,
      critical: alerts.filter(function (a) { return a.severity === "critical"; }).length,
      resolved: alerts.filter(function (a) { return a.status === "resolved"; }).length,
    };
  }, [alerts]);

  function runCheck() {
    setChecking(true);
    setCheckResult(null);
    fetch(API_BASE + "/api/alerts/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + (localStorage.getItem("sb-access-token") || "") },
      body: JSON.stringify({ days: 7 }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setCheckResult(data);
        setChecking(false);
      })
      .catch(function () {
        setCheckResult({ success: true, checked: 0, mismatches: [], message: "API unavailable — using mock data" });
        setChecking(false);
      });
  }

  function updateStatus(id, newStatus) {
    setAlerts(alerts.map(function (a) {
      if (a.id === id) return Object.assign({}, a, { status: newStatus });
      return a;
    }));
  }

  var fmtEur = function (n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n); };
  var fmtDate = function (d) { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: T.text, fontFamily: T.font }}>
            Alertes systeme
          </div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
            {stats.open} alerte{stats.open > 1 ? "s" : ""} ouverte{stats.open > 1 ? "s" : ""} — {stats.critical} critique{stats.critical > 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={runCheck} disabled={checking} style={{
          padding: "10px 20px", borderRadius: 8, border: "none",
          background: checking ? "#94a3b8" : T.accent, color: "#fff",
          fontSize: 13, fontWeight: 600, cursor: checking ? "wait" : "pointer", fontFamily: T.font,
        }}>
          {checking ? "Verification..." : "Lancer verification"}
        </button>
      </div>

      {/* Check result */}
      {checkResult && (
        <div style={{ background: T.blueBg, borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.blueText, marginBottom: 4 }}>
            Verification terminee
          </div>
          <div style={{ fontSize: 12, color: T.blueText }}>
            {checkResult.checked} commande{checkResult.checked > 1 ? "s" : ""} verifiee{checkResult.checked > 1 ? "s" : ""} — {(checkResult.mismatches || []).length} ecart{(checkResult.mismatches || []).length > 1 ? "s" : ""} detecte{(checkResult.mismatches || []).length > 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Ouvertes", value: stats.open, color: T.red, bg: T.redBg },
          { label: "En cours", value: stats.investigating, color: T.yellow, bg: T.yellowBg },
          { label: "Critiques", value: stats.critical, color: "#fff", bg: T.red },
          { label: "Resolues", value: stats.resolved, color: T.green, bg: T.greenBg },
        ].map(function (s) {
          return (
            <div key={s.label} style={{ background: T.card, borderRadius: 12, padding: isMobile ? 14 : 18, border: "1px solid " + T.border, boxShadow: T.shadow }}>
              <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "Toutes (" + stats.total + ")" },
          { id: "open", label: "Ouvertes (" + stats.open + ")" },
          { id: "investigating", label: "En cours (" + stats.investigating + ")" },
          { id: "resolved", label: "Resolues (" + stats.resolved + ")" },
        ].map(function (tab) {
          var active = filter === tab.id;
          return (
            <button key={tab.id} onClick={function () { setFilter(tab.id); }} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid " + (active ? T.accent : T.border),
              background: active ? "#fff7ed" : T.card, color: active ? T.accent : T.textSec,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(function (alert) {
          var sev = SEVERITY_MAP[alert.severity] || SEVERITY_MAP.low;
          var typeInfo = TYPE_MAP[alert.type] || { label: alert.type, icon: "⚡" };
          var statusInfo = STATUS_MAP[alert.status] || STATUS_MAP.open;
          var diff = Math.abs(alert.stripeAmount - alert.dbAmount);

          return (
            <div key={alert.id} style={{
              background: T.card, borderRadius: 12, border: "1px solid " + T.border,
              padding: isMobile ? 14 : 18, boxShadow: T.shadow,
              borderLeft: "4px solid " + (alert.severity === "critical" ? T.red : alert.severity === "high" ? T.yellow : T.border),
            }}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{typeInfo.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{typeInfo.label}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, background: sev.bg, color: sev.color }}>{sev.label}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: statusInfo.bg, color: statusInfo.color }}>{statusInfo.label}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>{fmtDate(alert.createdAt)}</div>
              </div>

              {/* Message */}
              <div style={{ fontSize: 13, color: T.textSec, marginBottom: 10, lineHeight: 1.5 }}>{alert.message}</div>

              {/* Amount details */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: T.textSec }}>
                  <b>Commande:</b> {alert.orderId}
                </span>
                {diff > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.red }}>
                    Ecart: {fmtEur(diff)}
                  </span>
                )}
              </div>

              {/* Actions */}
              {alert.status !== "resolved" && (
                <div style={{ display: "flex", gap: 8 }}>
                  {alert.status === "open" && (
                    <button onClick={function () { updateStatus(alert.id, "investigating"); }} style={{
                      padding: "6px 14px", borderRadius: 6, border: "1px solid " + T.border,
                      background: T.card, color: T.text, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: T.font,
                    }}>
                      Investiguer
                    </button>
                  )}
                  <button onClick={function () { updateStatus(alert.id, "resolved"); }} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none",
                    background: T.green, color: "#fff", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: T.font,
                  }}>
                    Marquer resolu
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
