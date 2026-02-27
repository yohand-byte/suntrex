import React, { useState } from "react";
import { T } from "../tokens";

// Reusable stat card for dashboard overviews
// Props: icon, label, value, subtitle, trend ({ value, positive }), onClick
export default function StatCard({ icon, label, value, subtitle, trend, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: T.card,
        borderRadius: T.radius,
        padding: "20px 24px",
        border: `1px solid ${T.border}`,
        boxShadow: hovered ? T.shadowMd : T.shadow,
        cursor: onClick ? "pointer" : "default",
        transition: T.transition,
        transform: hovered && onClick ? "translateY(-2px)" : "none",
        flex: 1,
        minWidth: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {icon && (
          <span style={{
            fontSize: 20,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: T.radiusSm,
            background: T.accentLight,
          }}>
            {icon}
          </span>
        )}
        <span style={{
          fontSize: 13,
          fontWeight: 500,
          color: T.textSec,
          fontFamily: T.font,
          letterSpacing: "0.01em",
        }}>
          {label}
        </span>
      </div>

      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: T.text,
        fontFamily: T.font,
        lineHeight: 1.2,
      }}>
        {value}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 6,
      }}>
        {trend && (
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend.positive ? T.greenText : T.redText,
            background: trend.positive ? T.greenBg : T.redBg,
            padding: "2px 8px",
            borderRadius: 99,
            fontFamily: T.font,
          }}>
            {trend.positive ? "\u2191" : "\u2193"} {trend.value}
          </span>
        )}
        {subtitle && (
          <span style={{
            fontSize: 12,
            color: T.textMuted,
            fontFamily: T.font,
          }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
