import React, { useState, useRef, useEffect } from "react";
import { T } from "../tokens";

// PriceEditor — inline click-to-edit price field
// Props: value (number), currency ("EUR"), onSave(newValue), disabled, label
export default function PriceEditor({ value, currency = "EUR", onSave, disabled = false, label }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Sync external value changes
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const formatDisplay = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(n);

  const handleSave = async () => {
    const parsed = parseFloat(draft.replace(",", "."));
    if (isNaN(parsed) || parsed < 0) {
      setDraft(String(value));
      setEditing(false);
      return;
    }
    if (parsed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave?.(parsed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setDraft(String(value));
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {label && (
          <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{label}</span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={saving}
          style={{
            width: 100,
            padding: "4px 8px",
            border: `2px solid ${T.accent}`,
            borderRadius: T.radiusSm,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: T.font,
            color: T.text,
            outline: "none",
            background: saving ? T.bg : T.card,
          }}
          aria-label={label || "Edit price"}
        />
        <span style={{ fontSize: 12, color: T.textMuted }}>{currency}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: T.green,
            color: "#fff",
            border: "none",
            borderRadius: T.radiusSm,
            padding: "4px 8px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: T.font,
          }}
          aria-label="Validate price"
        >
          {saving ? "..." : "\u2713"}
        </button>
        <button
          onClick={() => { setDraft(String(value)); setEditing(false); }}
          style={{
            background: "none",
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            padding: "4px 8px",
            fontSize: 13,
            cursor: "pointer",
            color: T.textSec,
            fontFamily: T.font,
          }}
          aria-label="Cancel editing"
        >
          \u2715
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {label && (
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{label}</span>
      )}
      <span style={{
        fontSize: 16,
        fontWeight: 700,
        color: T.text,
        fontFamily: T.font,
      }}>
        {formatDisplay(value)}
      </span>
      {!disabled && onSave && (
        <button
          onClick={() => setEditing(true)}
          style={{
            background: "none",
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 500,
            color: T.accent,
            cursor: "pointer",
            fontFamily: T.font,
            transition: T.transitionFast,
          }}
          aria-label={`Edit ${label || "price"}`}
        >
          Edit
        </button>
      )}
    </div>
  );
}
