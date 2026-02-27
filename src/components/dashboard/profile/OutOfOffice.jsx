import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

export default function OutOfOffice() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Mode absence" : "Out of office"}
      </h1>

      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.font }}>
              {lang === "fr" ? "Activer le mode absence" : "Enable out of office mode"}
            </div>
            <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, marginTop: 4 }}>
              {lang === "fr"
                ? "Les acheteurs verront un message indiquant votre indisponibilite."
                : "Buyers will see a message indicating your unavailability."}
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 48, height: 26, borderRadius: 13,
              background: enabled ? T.green : T.border,
              border: "none", cursor: "pointer",
              position: "relative", transition: T.transition,
              flexShrink: 0,
            }}
            aria-label={enabled ? "Disable" : "Enable"}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#fff",
              position: "absolute", top: 2,
              left: enabled ? 24 : 2,
              transition: T.transition,
              boxShadow: T.shadow,
            }} />
          </button>
        </div>

        {enabled && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font, display: "block", marginBottom: 8 }}>
              {lang === "fr" ? "Message d'absence" : "Away message"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === "fr" ? "Ex: Je suis en vacances du 1er au 15 mars..." : "E.g.: I'm on vacation from March 1-15..."}
              rows={4}
              style={{
                width: "100%", padding: "10px 14px",
                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
                fontSize: 13, fontFamily: T.font, color: T.text,
                resize: "vertical", outline: "none",
              }}
            />
            <button style={{ marginTop: 12, background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
              {lang === "fr" ? "Sauvegarder" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
