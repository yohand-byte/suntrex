import { useState, useMemo } from "react";
import useResponsive from "../../hooks/useResponsive";

var T = {
  bg: "#f7f8fa", card: "#ffffff",
  border: "#e8eaef", borderLight: "#f0f1f5",
  text: "#1a1d26", textSec: "#6b7280", textMuted: "#9ca3af",
  accent: "#E8700A",
  green: "#10b981", greenBg: "#ecfdf5",
  red: "#ef4444", redBg: "#fef2f2",
  yellow: "#f59e0b", yellowBg: "#fffbeb",
  blue: "#3b82f6", blueBg: "#eff6ff",
  purple: "#7c3aed", purpleBg: "#f5f3ff",
  radius: 10,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

var MOCK_ALERTS = [
  { id: "fa-1", type: "duplicate", userId: "usr-042", userName: "Pierre Dumont", company: "SolarPro SARL", field: "vat_number", value: "FR12345678901", matchedWith: "SolarPro Industries", score: 75, status: "pending", date: "2026-03-07T10:30:00Z" },
  { id: "fa-2", type: "duplicate", userId: "usr-089", userName: "Klaus Weber", company: "SunTech GmbH", field: "phone", value: "+49 170 1234567", matchedWith: "SolarKraft GmbH", score: 45, status: "pending", date: "2026-03-07T09:15:00Z" },
  { id: "fa-3", type: "pricing", listingId: "lst-301", productName: "Huawei SUN2000-10KTL-M2", sellerName: "QUALIWATT", price: 8500, marketAvg: 2890, diffPct: 194, score: 90, status: "pending", date: "2026-03-06T16:00:00Z" },
  { id: "fa-4", type: "pricing", listingId: "lst-455", productName: "Deye SUN-12K-SG04LP3", sellerName: "EuroSolar", price: 450, marketAvg: 1850, diffPct: -76, score: 76, status: "pending", date: "2026-03-06T14:20:00Z" },
  { id: "fa-5", type: "duplicate", userId: "usr-120", userName: "Marco Rossi", company: "Italia Solar Srl", field: "registration_ip", value: "185.212.44.101", matchedWith: "Solar Express Srl", score: 35, status: "investigated", date: "2026-03-05T11:00:00Z" },
  { id: "fa-6", type: "pricing", listingId: "lst-602", productName: "Jinko JKM560N-72HL4", sellerName: "PanelWorld", price: 55, marketAvg: 180, diffPct: -69, score: 69, status: "false_positive", date: "2026-03-05T09:45:00Z" },
  { id: "fa-7", type: "duplicate", userId: "usr-155", userName: "Jean-Luc Martin", company: "EnR Solutions", field: "address", value: "12 Rue de la Paix, 75002 Paris", matchedWith: "GreenPower France", score: 55, status: "pending", date: "2026-03-04T17:30:00Z" },
];

var STATUS_CONFIG = {
  pending: { label: "En attente", color: T.yellow, bg: T.yellowBg },
  investigated: { label: "Investigue", color: T.blue, bg: T.blueBg },
  suspended: { label: "Suspendu", color: T.red, bg: T.redBg },
  false_positive: { label: "Faux positif", color: T.green, bg: T.greenBg },
};

function ScoreBadge({ score }) {
  var color = score >= 70 ? T.red : score >= 40 ? T.yellow : T.green;
  var bg = score >= 70 ? T.redBg : score >= 40 ? T.yellowBg : T.greenBg;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: color, background: bg, padding: "2px 8px", borderRadius: 4 }}>
      {score}/100
    </span>
  );
}

export default function FraudAlerts() {
  var { isMobile } = useResponsive();
  var [alerts, setAlerts] = useState(MOCK_ALERTS);
  var [filter, setFilter] = useState("all");

  var filtered = useMemo(function () {
    if (filter === "all") return alerts;
    if (filter === "duplicate") return alerts.filter(function (a) { return a.type === "duplicate"; });
    if (filter === "pricing") return alerts.filter(function (a) { return a.type === "pricing"; });
    if (filter === "high") return alerts.filter(function (a) { return a.score >= 70; });
    return alerts;
  }, [alerts, filter]);

  var stats = useMemo(function () {
    return {
      total: alerts.length,
      pending: alerts.filter(function (a) { return a.status === "pending"; }).length,
      highRisk: alerts.filter(function (a) { return a.score >= 70; }).length,
      duplicates: alerts.filter(function (a) { return a.type === "duplicate"; }).length,
      pricing: alerts.filter(function (a) { return a.type === "pricing"; }).length,
    };
  }, [alerts]);

  function updateStatus(id, newStatus) {
    setAlerts(function (prev) {
      return prev.map(function (a) { return a.id === id ? Object.assign({}, a, { status: newStatus }) : a; });
    });
  }

  return (
    <div style={{ fontFamily: T.font }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Alertes en attente", value: stats.pending, color: T.yellow },
          { label: "Risque eleve", value: stats.highRisk, color: T.red },
          { label: "Comptes suspects", value: stats.duplicates, color: T.purple },
          { label: "Prix anormaux", value: stats.pricing, color: T.accent },
        ].map(function (s) {
          return (
            <div key={s.label} style={{ background: T.card, borderRadius: T.radius, padding: 16, border: "1px solid " + T.borderLight }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "Tout (" + alerts.length + ")" },
          { id: "duplicate", label: "Comptes (" + stats.duplicates + ")" },
          { id: "pricing", label: "Prix (" + stats.pricing + ")" },
          { id: "high", label: "Risque eleve (" + stats.highRisk + ")" },
        ].map(function (tab) {
          return (
            <button key={tab.id} onClick={function () { setFilter(tab.id); }} style={{
              padding: "6px 14px", borderRadius: 20, border: filter === tab.id ? "none" : "1px solid " + T.border,
              background: filter === tab.id ? T.text : T.card, color: filter === tab.id ? "#fff" : T.textSec,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(function (alert) {
          var sc = STATUS_CONFIG[alert.status] || STATUS_CONFIG.pending;
          return (
            <div key={alert.id} style={{
              background: T.card, borderRadius: T.radius,
              border: "1px solid " + (alert.score >= 70 ? T.red + "30" : T.borderLight),
              padding: isMobile ? 14 : "14px 20px",
              display: "flex", flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 10 : 16,
            }}>
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: alert.type === "duplicate" ? T.purpleBg : T.yellowBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>
                {alert.type === "duplicate" ? "\uD83D\uDC65" : "\uD83D\uDCB0"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                    {alert.type === "duplicate" ? alert.userName + " — " + alert.company : alert.productName}
                  </span>
                  <ScoreBadge score={alert.score} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, padding: "2px 6px", borderRadius: 4 }}>
                    {sc.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                  {alert.type === "duplicate"
                    ? "Doublon: " + alert.field + " = " + alert.value + " (aussi " + alert.matchedWith + ")"
                    : alert.diffPct > 0
                      ? "+" + alert.diffPct + "% vs moyenne (" + alert.marketAvg + " EUR) — " + alert.sellerName
                      : alert.diffPct + "% vs moyenne (" + alert.marketAvg + " EUR) — " + alert.sellerName
                  }
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                  {new Date(alert.date).toLocaleDateString("fr-FR")} {new Date(alert.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Actions */}
              {alert.status === "pending" && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={function () { updateStatus(alert.id, "investigated"); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid " + T.border, background: T.card, color: T.textSec, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                    Investiguer
                  </button>
                  <button onClick={function () { updateStatus(alert.id, "suspended"); }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.red, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                    Suspendre
                  </button>
                  <button onClick={function () { updateStatus(alert.id, "false_positive"); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid " + T.border, background: T.card, color: T.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                    Faux positif
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
