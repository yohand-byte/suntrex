import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

export default function AccountDetails() {
  const { isMobile } = useResponsive();
  const { user, lang } = useDashboard();

  const fields = [
    { label: lang === "fr" ? "Nom" : "Name", value: user?.name || "-" },
    { label: "Email", value: user?.email || "-" },
    { label: lang === "fr" ? "Role" : "Role", value: user?.role || "-" },
    { label: lang === "fr" ? "Verifie" : "Verified", value: user?.verified ? "\u2713 Oui" : "\u2717 Non" },
    { label: lang === "fr" ? "Langue" : "Language", value: "Francais" },
    { label: lang === "fr" ? "Devise" : "Currency", value: "EUR" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Details du compte" : "Account details"}
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
            <span style={{ width: isMobile ? "auto" : 180, fontSize: 13, fontWeight: 600, color: T.textSec, fontFamily: T.font }}>
              {field.label}
            </span>
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
