import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    Cookies.set("locale", code, { expires: 365, sameSite: "lax" });
    localStorage.setItem("locale", code);
    document.documentElement.lang = code;
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        aria-expanded={open}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", padding: "4px 8px", borderRadius: 6 }}
      >
        <span>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, background: "#fff", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #e4e5ec", zIndex: 100, minWidth: 160, marginTop: 4, overflow: "hidden" }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              aria-label={`Switch to ${lang.label}`}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: lang.code === current.code ? "#fff3e0" : "transparent", cursor: "pointer", fontSize: 13, color: lang.code === current.code ? "#E8700A" : "#333", fontWeight: lang.code === current.code ? 600 : 400, fontFamily: "inherit", textAlign: "left" }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
