import { useState } from "react";

export default function ModerationAlert({ result, lang = "fr", onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (!result || result.status === "ok" || dismissed) return null;

  const isBlocked = result.status === "blocked";

  const messages = {
    fr: {
      warning: "Votre message contient des informations sensibles. Pour votre securite, utilisez les outils de paiement SUNTREX.",
      blocked: "Ce message a ete bloque par notre systeme de moderation.",
    },
    en: {
      warning: "Your message contains sensitive information. For your safety, use SUNTREX payment tools.",
      blocked: "This message was blocked by our moderation system.",
    },
  };

  const msg = (messages[lang] || messages.fr)[result.status];
  const bg = isBlocked ? "#fef2f2" : "#fffbeb";
  const border = isBlocked ? "#fecaca" : "#fde68a";
  const color = isBlocked ? "#991b1b" : "#92400e";
  const icon = isBlocked ? "🚫" : "⚠️";

  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginBottom: 8,
      background: bg, border: `1px solid ${border}`,
      display: "flex", alignItems: "flex-start", gap: 8,
      fontSize: 12, color, fontFamily: "'DM Sans', sans-serif",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>
          {isBlocked ? "Message bloque" : "Avertissement"}
        </div>
        <div style={{ lineHeight: 1.4 }}>{msg}</div>
        {result.issues && result.issues.length > 0 && (
          <div style={{ fontSize: 10, color: `${color}99`, marginTop: 4 }}>
            Score: {result.score}/100 — {result.issues.map(i => i.type).join(", ")}
          </div>
        )}
      </div>
      {!isBlocked && (
        <button
          onClick={() => { setDismissed(true); onDismiss?.(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, color, padding: 0, lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
