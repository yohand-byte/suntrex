import React from "react";
import { T, TX_STATUS } from "../tokens";

// StatusBadge — displays a colored pill for transaction status
// Props: status (string key from TX_STATUS), size ("sm" | "md"), showIcon (bool), lang ("fr" | "en")
export default function StatusBadge({ status, size = "md", showIcon = true, lang = "fr" }) {
  const config = TX_STATUS[status];
  if (!config) return null;

  const isSmall = size === "sm";
  const label = lang === "fr" ? config.labelFr : config.label;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        padding: isSmall ? "2px 8px" : "4px 12px",
        borderRadius: 99,
        fontSize: isSmall ? 11 : 12,
        fontWeight: 600,
        fontFamily: T.font,
        color: config.text,
        background: config.bg,
        border: `1px solid ${config.color}20`,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
      title={label}
    >
      {showIcon && <span style={{ fontSize: isSmall ? 11 : 13 }}>{config.icon}</span>}
      {label}
    </span>
  );
}
