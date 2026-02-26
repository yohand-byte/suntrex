import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

export default function CompanyDetails() {
  const { isMobile } = useResponsive();
  const { company, lang } = useDashboard();

  const fields = [
    { label: lang === "fr" ? "Nom" : "Name", value: company?.name || "-" },
    { label: lang === "fr" ? "N. TVA" : "VAT Number", value: company?.vat || "-" },
    { label: lang === "fr" ? "Pays" : "Country", value: company?.country || "-" },
    { label: "Type", value: company?.type || "-" },
    { label: "KYC", value: "\u2713 Verified" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Details entreprise" : "Company details"}
      </h1>
      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {fields.map((field, idx) => (
          <div key={idx} style={{
            display: "flex", alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 4 : 0,
            padding: "14px 20px",
            borderBottom: idx < fields.length - 1 ? `1px solid ${T.borderLight}` : "none",
          }}>
            <span style={{ width: isMobile ? "auto" : 180, fontSize: 13, fontWeight: 600, color: T.textSec, fontFamily: T.font }}>{field.label}</span>
            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>{field.value}</span>
          </div>
        ))}
      </div>
      <button style={{ marginTop: 16, background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
        {lang === "fr" ? "Modifier" : "Edit"}
      </button>
    </div>
  );
}
