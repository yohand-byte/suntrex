import { useTranslation } from "react-i18next";
import useResponsive from "../hooks/useResponsive";

const BRAND = { orange: "#E8700A", dark: "#0F1923", muted: "#64748b", light: "#f8fafc", border: "#e2e8f0" };
const SECTIONS = Array.from({ length: 11 }, (_, i) => i + 1);

export default function PrivacyPage() {
  const { t } = useTranslation("pages");
  const { isMobile } = useResponsive();

  const h2Style = { fontSize: isMobile ? 17 : 20, fontWeight: 700, color: BRAND.dark, marginBottom: 10 };
  const pStyle = { fontSize: 15, color: BRAND.muted, lineHeight: 1.7, marginBottom: 32 };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: BRAND.dark, marginBottom: 8 }}>{t("privacy.title")}</h1>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 32 }}>{t("privacy.lastUpdate")}</p>

      {/* Table of contents */}
      <nav style={{ background: BRAND.light, borderRadius: 10, padding: isMobile ? 16 : 20, marginBottom: 40, border: `1px solid ${BRAND.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 6 }}>
          {SECTIONS.map((n) => (
            <button key={n} onClick={() => scrollTo(`priv-s${n}`)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 0", fontSize: 14, color: BRAND.orange, fontFamily: "inherit" }}>
              {t(`privacy.s${n}.title`)}
            </button>
          ))}
        </div>
      </nav>

      {/* Sections */}
      {SECTIONS.map((n) => (
        <div key={n} id={`priv-s${n}`}>
          <h2 style={h2Style}>{t(`privacy.s${n}.title`)}</h2>
          <p style={pStyle}>{t(`privacy.s${n}.text`)}</p>
        </div>
      ))}

      <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 20, borderTop: `1px solid ${BRAND.border}`, paddingTop: 20 }}>
        {t("privacy.lastUpdate")} — <a href="mailto:contact@suntrex.eu" style={{ color: BRAND.orange }}>contact@suntrex.eu</a>
      </p>
    </div>
  );
}
