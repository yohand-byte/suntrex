// ── Design Tokens — SUNTREX Dashboard ──────────────────────────────
// Calqués sur sun.store avec l'identité SUNTREX

export const T = {
  // Colors
  bg: "#f7f8fa",
  card: "#ffffff",
  border: "#e8eaef",
  borderLight: "#f0f1f5",
  text: "#1a1d26",
  textSec: "#6b7280",
  textMuted: "#9ca3af",
  accent: "#E8700A",
  accentHover: "#d46200",
  accentLight: "#fff7ed",
  green: "#10b981",
  greenBg: "#ecfdf5",
  greenText: "#065f46",
  red: "#ef4444",
  redBg: "#fef2f2",
  redText: "#991b1b",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1e40af",
  yellow: "#f59e0b",
  yellowBg: "#fffbeb",
  yellowText: "#92400e",
  sidebar: "#1a1d26",
  sidebarHover: "#2a2d36",
  sidebarActive: "#33363f",

  // Spacing & Shape
  radius: 10,
  radiusSm: 6,
  radiusLg: 16,
  radiusXl: 20,

  // Typography
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",

  // Shadows
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.12)",

  // Transitions
  transition: "all 0.2s ease",
  transitionFast: "all 0.15s ease",
};

// Status color mapping for transactions
export const TX_STATUS = {
  negotiation: { label: "Negotiation",  labelFr: "Negociation", color: T.yellow, bg: T.yellowBg, text: T.yellowText, icon: "\uD83D\uDCAC" },
  confirmed:   { label: "Confirmed",    labelFr: "Confirmee",   color: T.blue,   bg: T.blueBg,   text: T.blueText,   icon: "\u2714\uFE0F" },
  paid:        { label: "Paid",         labelFr: "Payee",       color: T.green,  bg: T.greenBg,  text: T.greenText,  icon: "\uD83D\uDCB3" },
  shipped:     { label: "Shipped",      labelFr: "Expediee",    color: T.accent, bg: T.accentLight, text: T.accentHover, icon: "\uD83D\uDE9A" },
  delivered:   { label: "Delivered",    labelFr: "Livree",      color: T.green,  bg: T.greenBg,  text: T.greenText,  icon: "\u2705" },
  cancelled:   { label: "Cancelled",    labelFr: "Annulee",     color: T.textMuted, bg: "#f1f5f9", text: "#475569",   icon: "\u2715" },
  disputed:    { label: "Disputed",     labelFr: "Litige",      color: T.red,    bg: T.redBg,    text: T.redText,    icon: "\u26A0\uFE0F" },
};
