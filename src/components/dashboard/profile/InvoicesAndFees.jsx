import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

const MOCK_INVOICES = [
  { id: "INV-2026-001", date: "2026-02-01", amount: 335, type: "commission", status: "paid" },
  { id: "INV-2026-002", date: "2026-02-15", amount: 678, type: "commission", status: "paid" },
  { id: "INV-2026-003", date: "2026-02-25", amount: 427, type: "commission", status: "pending" },
];

const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

export default function InvoicesAndFees() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Factures & Frais" : "Invoices & Fees"}
      </h1>

      {/* Commission explainer */}
      <div style={{ background: T.accentLight, borderRadius: T.radius, border: `1px solid ${T.accent}20`, padding: 16, marginBottom: 20, fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.5 }}>
        <strong>{lang === "fr" ? "Commission SUNTREX" : "SUNTREX Commission"}</strong>: {lang === "fr" ? "5% en dessous du taux du marche. Nous prenons une commission sur chaque vente reussie." : "5% below market rate. We take a commission on each successful sale."}
      </div>

      {MOCK_INVOICES.length === 0 ? (
        <EmptyState icon={"\uD83E\uDDFE"} title={lang === "fr" ? "Aucune facture" : "No invoices"} />
      ) : (
        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: "10px 20px", background: T.bg, fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: T.font, textTransform: "uppercase" }}>
              <span>ID</span><span>Date</span><span>{lang === "fr" ? "Montant" : "Amount"}</span><span>Status</span>
            </div>
          )}
          {MOCK_INVOICES.map((inv, idx) => (
            <div key={inv.id} style={{
              display: isMobile ? "flex" : "grid",
              gridTemplateColumns: isMobile ? undefined : "1fr 1fr 1fr 1fr",
              flexDirection: isMobile ? "column" : undefined,
              gap: isMobile ? 4 : 12,
              alignItems: isMobile ? "flex-start" : "center",
              padding: isMobile ? 14 : "12px 20px",
              borderBottom: idx < MOCK_INVOICES.length - 1 ? `1px solid ${T.borderLight}` : "none",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font }}>{inv.id}</span>
              <span style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{formatDate(inv.date)}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{formatPrice(inv.amount)}</span>
              <span style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: T.font,
                background: inv.status === "paid" ? T.greenBg : T.yellowBg,
                color: inv.status === "paid" ? T.greenText : T.yellowText,
              }}>
                {inv.status === "paid" ? (lang === "fr" ? "Paye" : "Paid") : (lang === "fr" ? "En attente" : "Pending")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
