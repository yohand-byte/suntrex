import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

const EMAIL_PREFS = [
  { id: "orders", label: "New orders", labelFr: "Nouvelles commandes", enabled: true },
  { id: "messages", label: "New messages", labelFr: "Nouveaux messages", enabled: true },
  { id: "payments", label: "Payment confirmations", labelFr: "Confirmations de paiement", enabled: true },
  { id: "shipping", label: "Shipping updates", labelFr: "Mises a jour livraison", enabled: false },
  { id: "rfq", label: "New RFQ quotes", labelFr: "Nouvelles offres RFQ", enabled: true },
  { id: "marketing", label: "Marketing & promotions", labelFr: "Marketing & promotions", enabled: false },
  { id: "digest", label: "Weekly digest", labelFr: "Resume hebdomadaire", enabled: true },
];

export default function NotificationEmails() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [prefs, setPrefs] = useState(EMAIL_PREFS);

  const toggle = (id) => {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 8px" }}>
        {lang === "fr" ? "Emails de notification" : "Notification emails"}
      </h1>
      <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Choisissez quels emails vous souhaitez recevoir." : "Choose which emails you'd like to receive."}
      </p>

      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {prefs.map((pref, idx) => (
          <div key={pref.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: idx < prefs.length - 1 ? `1px solid ${T.borderLight}` : "none",
          }}>
            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>
              {lang === "fr" ? pref.labelFr : pref.label}
            </span>
            <button
              onClick={() => toggle(pref.id)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: pref.enabled ? T.green : T.border,
                border: "none", cursor: "pointer",
                position: "relative", transition: T.transition,
                flexShrink: 0,
              }}
              aria-label={`Toggle ${pref.label}`}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                position: "absolute", top: 2,
                left: pref.enabled ? 22 : 2,
                transition: T.transition,
                boxShadow: T.shadow,
              }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
