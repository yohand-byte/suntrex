import { useState, useRef, useEffect } from "react";
import { useCurrency } from "../../CurrencyContext";

export default function CurrencySwitcher() {
  const { currency, setCurrency, currencies } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = currencies.find(c => c.code === currency) || currencies[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Select currency"
        aria-expanded={open}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", padding: "4px 8px", borderRadius: 6 }}
      >
        <span>{current.symbol}</span>
        <span>{current.code}</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, background: "#fff", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e4e5ec", zIndex: 100, minWidth: 180, marginTop: 4, overflow: "hidden" }}>
          {currencies.map(c => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              aria-label={`Switch to ${c.name}`}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: c.code === currency ? "#fff3e0" : "transparent", cursor: "pointer", fontSize: 13, color: c.code === currency ? "#E8700A" : "#333", fontWeight: c.code === currency ? 600 : 400, fontFamily: "inherit", textAlign: "left" }}
            >
              <span style={{ width: 24 }}>{c.symbol}</span>
              <span>{c.name}</span>
              <span style={{ marginLeft: "auto", color: "#999", fontSize: 11 }}>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
