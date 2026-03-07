import { useState, useMemo } from "react";
import useResponsive from "../../hooks/useResponsive";

var T = {
  card: "#ffffff", border: "#e8eaef", text: "#1a1d26", textSec: "#6b7280",
  accent: "#E8700A", green: "#10b981", greenBg: "#ecfdf5", greenText: "#065f46",
  red: "#ef4444", redBg: "#fef2f2", redText: "#991b1b",
  yellow: "#f59e0b", yellowBg: "#fffbeb", yellowText: "#92400e",
  blue: "#3b82f6", blueBg: "#eff6ff",
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
};

var MOCK_TRANSACTIONS = [
  { id: "TXN-001", orderId: "ORD-2024-001", date: "2026-03-06", seller: "SolarTech GmbH", stripeAmount: 2450.00, dbAmount: 2450.00, commission: 116.38, status: "match" },
  { id: "TXN-002", orderId: "ORD-2024-003", date: "2026-03-06", seller: "PV Direct France", stripeAmount: 890.00, dbAmount: 885.00, commission: 42.28, status: "mismatch" },
  { id: "TXN-003", orderId: "ORD-2024-005", date: "2026-03-05", seller: "EnerSol Belgium", stripeAmount: 3200.00, dbAmount: 3200.00, commission: 152.00, status: "match" },
  { id: "TXN-004", orderId: "ORD-2024-008", date: "2026-03-05", seller: "Huawei Direct DE", stripeAmount: 15600.00, dbAmount: 15600.00, commission: 741.00, status: "match" },
  { id: "TXN-005", orderId: "ORD-2024-010", date: "2026-03-05", seller: "Deye Europe BV", stripeAmount: 4200.00, dbAmount: 4200.00, commission: 199.50, status: "match" },
  { id: "TXN-006", orderId: "ORD-2024-012", date: "2026-03-04", seller: "SunPower Italia", stripeAmount: 7800.00, dbAmount: 7850.00, commission: 370.50, status: "mismatch" },
  { id: "TXN-007", orderId: "ORD-2024-015", date: "2026-03-04", seller: "PV Direct France", stripeAmount: 1250.00, dbAmount: 1250.00, commission: 59.38, status: "match" },
  { id: "TXN-008", orderId: "ORD-2024-018", date: "2026-03-04", seller: "SolarTech GmbH", stripeAmount: 5500.00, dbAmount: 5500.00, commission: 261.25, status: "match" },
  { id: "TXN-009", orderId: "ORD-2024-020", date: "2026-03-03", seller: "Green Energy NL", stripeAmount: 2100.00, dbAmount: 2100.00, commission: 99.75, status: "match" },
  { id: "TXN-010", orderId: "ORD-2024-022", date: "2026-03-03", seller: "EnerSol Belgium", stripeAmount: 9400.00, dbAmount: 9400.00, commission: 446.50, status: "match" },
  { id: "TXN-011", orderId: "ORD-2024-025", date: "2026-03-03", seller: "Deye Europe BV", stripeAmount: 3600.00, dbAmount: 3600.00, commission: 171.00, status: "match" },
  { id: "TXN-012", orderId: "ORD-2024-028", date: "2026-03-02", seller: "Huawei Direct DE", stripeAmount: 22000.00, dbAmount: 22000.00, commission: 1045.00, status: "match" },
  { id: "TXN-013", orderId: "ORD-2024-030", date: "2026-03-02", seller: "SunPower Italia", stripeAmount: 1750.00, dbAmount: 1750.00, commission: 83.13, status: "match" },
  { id: "TXN-014", orderId: "ORD-2024-033", date: "2026-03-02", seller: "SolarTech GmbH", stripeAmount: 6300.00, dbAmount: 6300.00, commission: 299.25, status: "match" },
  { id: "TXN-015", orderId: "ORD-2024-035", date: "2026-03-01", seller: "PV Direct France", stripeAmount: 4800.00, dbAmount: 4830.00, commission: 228.00, status: "mismatch" },
  { id: "TXN-016", orderId: "ORD-2024-038", date: "2026-03-01", seller: "Green Energy NL", stripeAmount: 11200.00, dbAmount: 11200.00, commission: 532.00, status: "match" },
  { id: "TXN-017", orderId: "ORD-2024-040", date: "2026-03-01", seller: "EnerSol Belgium", stripeAmount: 2950.00, dbAmount: 2950.00, commission: 140.13, status: "match" },
  { id: "TXN-018", orderId: "ORD-2024-042", date: "2026-02-28", seller: "Deye Europe BV", stripeAmount: 8100.00, dbAmount: 8100.00, commission: 384.75, status: "match" },
  { id: "TXN-019", orderId: "ORD-2024-045", date: "2026-02-28", seller: "Huawei Direct DE", stripeAmount: 19500.00, dbAmount: 19500.00, commission: 926.25, status: "match" },
  { id: "TXN-020", orderId: "ORD-2024-048", date: "2026-02-28", seller: "SunPower Italia", stripeAmount: 3400.00, dbAmount: 3400.00, commission: 161.50, status: "match" },
];

function exportCSV(rows) {
  var headers = "ID,Order,Date,Seller,Stripe (EUR),DB (EUR),Diff (EUR),Commission,Status\n";
  var csv = headers + rows.map(function (r) {
    var diff = Math.abs(r.stripeAmount - r.dbAmount).toFixed(2);
    return [r.id, r.orderId, r.date, '"' + r.seller + '"', r.stripeAmount.toFixed(2), r.dbAmount.toFixed(2), diff, r.commission.toFixed(2), r.status].join(",");
  }).join("\n");
  var blob = new Blob([csv], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "suntrex-reconciliation-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReconciliationPanel() {
  var { isMobile } = useResponsive();
  var [filter, setFilter] = useState("all");

  var filtered = useMemo(function () {
    if (filter === "all") return MOCK_TRANSACTIONS;
    return MOCK_TRANSACTIONS.filter(function (t) { return t.status === filter; });
  }, [filter]);

  var stats = useMemo(function () {
    var totalStripe = MOCK_TRANSACTIONS.reduce(function (s, t) { return s + t.stripeAmount; }, 0);
    var totalDB = MOCK_TRANSACTIONS.reduce(function (s, t) { return s + t.dbAmount; }, 0);
    var totalCommission = MOCK_TRANSACTIONS.reduce(function (s, t) { return s + t.commission; }, 0);
    var mismatches = MOCK_TRANSACTIONS.filter(function (t) { return t.status === "mismatch"; });
    var totalDiff = mismatches.reduce(function (s, t) { return s + Math.abs(t.stripeAmount - t.dbAmount); }, 0);
    return { totalStripe: totalStripe, totalDB: totalDB, totalCommission: totalCommission, mismatches: mismatches.length, totalDiff: totalDiff, total: MOCK_TRANSACTIONS.length };
  }, []);

  var fmtEur = function (n) { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n); };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: T.text, fontFamily: T.font }}>
            Reconciliation Stripe vs DB
          </div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>
            {stats.total} transactions — {stats.mismatches} anomalie{stats.mismatches > 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={function () { exportCSV(filtered); }} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
          Exporter CSV
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Stripe", value: fmtEur(stats.totalStripe), color: T.blue, bg: T.blueBg },
          { label: "Total DB", value: fmtEur(stats.totalDB), color: T.green, bg: T.greenBg },
          { label: "Commissions", value: fmtEur(stats.totalCommission), color: T.accent, bg: "#fff7ed" },
          { label: "Ecarts", value: fmtEur(stats.totalDiff), color: stats.mismatches > 0 ? T.red : T.green, bg: stats.mismatches > 0 ? T.redBg : T.greenBg },
        ].map(function (s) {
          return (
            <div key={s.label} style={{ background: T.card, borderRadius: 12, padding: isMobile ? 14 : 18, border: "1px solid " + T.border, boxShadow: T.shadow }}>
              <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { id: "all", label: "Toutes (" + stats.total + ")" },
          { id: "match", label: "OK (" + (stats.total - stats.mismatches) + ")" },
          { id: "mismatch", label: "Ecarts (" + stats.mismatches + ")" },
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

      {/* Table */}
      <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.border, overflow: "auto", boxShadow: T.shadow }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: T.font, minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid " + T.border }}>
              {["Commande", "Date", "Vendeur", "Stripe", "DB", "Diff", "Commission", "Statut"].map(function (h) {
                return <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: T.textSec, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map(function (txn) {
              var diff = Math.abs(txn.stripeAmount - txn.dbAmount);
              var isMismatch = txn.status === "mismatch";
              return (
                <tr key={txn.id} style={{ borderBottom: "1px solid " + T.border, background: isMismatch ? T.redBg : "transparent" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: T.text }}>{txn.orderId}</td>
                  <td style={{ padding: "12px 14px", color: T.textSec }}>{txn.date}</td>
                  <td style={{ padding: "12px 14px", color: T.text }}>{txn.seller}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: T.text, fontVariantNumeric: "tabular-nums" }}>{fmtEur(txn.stripeAmount)}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: T.text, fontVariantNumeric: "tabular-nums" }}>{fmtEur(txn.dbAmount)}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: isMismatch ? T.red : T.green, fontVariantNumeric: "tabular-nums" }}>
                    {isMismatch ? fmtEur(diff) : "—"}
                  </td>
                  <td style={{ padding: "12px 14px", color: T.textSec, fontVariantNumeric: "tabular-nums" }}>{fmtEur(txn.commission)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: isMismatch ? T.redBg : T.greenBg,
                      color: isMismatch ? T.redText : T.greenText,
                    }}>
                      {isMismatch ? "ECART" : "OK"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
