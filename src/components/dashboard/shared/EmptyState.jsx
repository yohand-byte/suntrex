import React, { useState } from "react";
import { T } from "../tokens";

// EmptyState — generic placeholder for empty lists/sections
// Props: icon (emoji/string), title, description, actionLabel, onAction
export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px",
      textAlign: "center",
    }}>
      {icon && (
        <div style={{
          fontSize: 48,
          marginBottom: 16,
          opacity: 0.8,
        }}>
          {icon}
        </div>
      )}

      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        color: T.text,
        fontFamily: T.font,
        margin: "0 0 8px 0",
      }}>
        {title}
      </h3>

      {description && (
        <p style={{
          fontSize: 14,
          color: T.textSec,
          fontFamily: T.font,
          margin: "0 0 24px 0",
          maxWidth: 360,
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: hovered ? T.accentHover : T.accent,
            color: "#fff",
            border: "none",
            borderRadius: T.radius,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: T.font,
            transition: T.transitionFast,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
