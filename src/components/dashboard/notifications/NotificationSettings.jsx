import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

const SETTINGS = [
  { id: "sound", label: "Notification sound", labelFr: "Son de notification", enabled: true },
  { id: "desktop", label: "Desktop notifications", labelFr: "Notifications bureau", enabled: false },
  { id: "badge", label: "Badge counter", labelFr: "Compteur de badge", enabled: true },
  { id: "dnd", label: "Do not disturb", labelFr: "Ne pas deranger", enabled: false },
];

export default function NotificationSettings() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [settings, setSettings] = useState(SETTINGS);

  const toggle = (id) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 8px" }}>
        {lang === "fr" ? "Parametres notifications" : "Notification settings"}
      </h1>
      <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Configurez le comportement des notifications." : "Configure notification behavior."}
      </p>

      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        {settings.map((setting, idx) => (
          <div key={setting.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: idx < settings.length - 1 ? `1px solid ${T.borderLight}` : "none",
          }}>
            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>
              {lang === "fr" ? setting.labelFr : setting.label}
            </span>
            <button
              onClick={() => toggle(setting.id)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: setting.enabled ? T.green : T.border,
                border: "none", cursor: "pointer",
                position: "relative", transition: T.transition,
                flexShrink: 0,
              }}
              aria-label={`Toggle ${setting.label}`}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                position: "absolute", top: 2,
                left: setting.enabled ? 22 : 2,
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
