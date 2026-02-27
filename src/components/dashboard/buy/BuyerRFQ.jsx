import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

const MOCK_RFQS = [
  { id: "RFQ-024", product: "Enphase IQ8-HC", qty: 100, status: "open", quotes: 3, deadline: "2026-03-05", createdAt: "2026-02-20" },
  { id: "RFQ-025", product: "JA Solar JAM54S30 420Wc", qty: 500, status: "open", quotes: 7, deadline: "2026-03-08", createdAt: "2026-02-22" },
  { id: "RFQ-026", product: "Huawei LUNA2000-5-E0", qty: 10, status: "closed", quotes: 4, deadline: "2026-02-20", createdAt: "2026-02-12" },
];

const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

export default function BuyerRFQ() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? MOCK_RFQS : MOCK_RFQS.filter(r => r.status === filter);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
          {lang === "fr" ? "Demandes de devis" : "Requests for Proposals"}
        </h1>
        <button style={{
          background: T.accent, color: "#fff",
          border: "none", borderRadius: T.radiusSm,
          padding: "8px 16px", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font, minHeight: 40,
        }}>
          {lang === "fr" ? "+ Nouvelle demande" : "+ New request"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { id: "all", label: "All", labelFr: "Tout" },
          { id: "open", label: "Open", labelFr: "Ouvertes" },
          { id: "closed", label: "Closed", labelFr: "Fermees" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
            background: filter === tab.id ? T.text : T.card,
            color: filter === tab.id ? "#fff" : T.textSec,
            border: filter === tab.id ? "none" : `1px solid ${T.border}`,
            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font, minHeight: 34,
          }}>
            {lang === "fr" ? tab.labelFr : tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={"\uD83D\uDCC4"}
          title={lang === "fr" ? "Aucune demande de devis" : "No RFQs"}
          description={lang === "fr" ? "Creez une demande pour recevoir des offres de vendeurs." : "Create a request to receive offers from sellers."}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          {filtered.map(rfq => (
            <div key={rfq.id} style={{
              background: T.card, borderRadius: T.radius,
              border: `1px solid ${T.border}`, padding: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, fontFamily: T.font }}>{rfq.id}</span>
                <span style={{
                  padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: T.font,
                  background: rfq.status === "open" ? T.greenBg : "#f1f5f9",
                  color: rfq.status === "open" ? T.greenText : T.textMuted,
                }}>
                  {rfq.status === "open" ? (lang === "fr" ? "Ouverte" : "Open") : (lang === "fr" ? "Fermee" : "Closed")}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 4 }}>
                {rfq.product}
              </div>
              <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, marginBottom: 12 }}>
                {lang === "fr" ? "Quantite" : "Quantity"}: {rfq.qty} pcs
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{
                    background: T.blueBg, color: T.blueText,
                    padding: "3px 10px", borderRadius: 99,
                    fontSize: 12, fontWeight: 600, fontFamily: T.font,
                  }}>
                    {rfq.quotes} {lang === "fr" ? "offres" : "quotes"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>
                  {lang === "fr" ? "Expire:" : "Expires:"} {formatDate(rfq.deadline)}
                </div>
              </div>
              {rfq.status === "open" && (
                <button style={{
                  marginTop: 12, width: "100%",
                  background: T.accentLight, color: T.accent,
                  border: `1px solid ${T.accent}30`,
                  borderRadius: T.radiusSm,
                  padding: "8px 0", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: T.font,
                }}>
                  {lang === "fr" ? "Voir les offres" : "View quotes"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
