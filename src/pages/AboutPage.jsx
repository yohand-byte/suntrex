import { useTranslation } from "react-i18next";
import useResponsive from "../hooks/useResponsive";

const BRAND = { orange: "#E8700A", dark: "#0F1923", muted: "#64748b", light: "#f8fafc", border: "#e2e8f0" };

const ICONS = [
  "\u{1F4B0}", // commission
  "\u{1F512}", // payment
  "\u{1F69A}", // delivery
  "\u{1F4AC}", // chat
  "\u{2600}\u{FE0F}",  // products
  "\u{1F4DE}", // support
];

export default function AboutPage() {
  const { t } = useTranslation("pages");
  const { isMobile, isTablet } = useResponsive();
  const advantages = t("about.advantages", { returnObjects: true });
  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: BRAND.dark }}>
      {/* Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "48px 16px 32px" : "72px 40px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, marginBottom: 16 }}>{t("about.title")}</h1>
        <p style={{ fontSize: isMobile ? 15 : 17, color: BRAND.muted, lineHeight: 1.7, maxWidth: 700, margin: "0 auto" }}>{t("about.hero")}</p>
      </section>

      {/* Problem / Solution */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "0 16px 40px" : "0 40px 56px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        <div style={{ background: "#fff7ed", borderRadius: 12, padding: isMobile ? 24 : 32 }}>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 12 }}>{t("about.problemTitle")}</h2>
          <p style={{ fontSize: 15, color: BRAND.muted, lineHeight: 1.7 }}>{t("about.problemText")}</p>
        </div>
        <div style={{ background: "#f0fdf4", borderRadius: 12, padding: isMobile ? 24 : 32 }}>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 12 }}>{t("about.solutionTitle")}</h2>
          <p style={{ fontSize: 15, color: BRAND.muted, lineHeight: 1.7 }}>{t("about.solutionText")}</p>
        </div>
      </section>

      {/* Advantages grid */}
      <section style={{ background: BRAND.light, padding: isMobile ? "40px 16px" : "56px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20 }}>
          {Array.isArray(advantages) && advantages.map((adv, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: isMobile ? 20 : 24, border: `1px solid ${BRAND.border}` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{ICONS[i]}</div>
              <p style={{ fontSize: 14, color: BRAND.dark, lineHeight: 1.6, fontWeight: 500 }}>{adv}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: BRAND.dark, padding: isMobile ? "32px 16px" : "40px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
          {["Products", "Brands", "Languages", "Countries"].map((key) => (
            <div key={key}>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: BRAND.orange }}>{t(`about.stats${key}`)}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{t(`about.stats${key}Label`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "40px 16px" : "56px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, marginBottom: 12 }}>{t("about.teamTitle")}</h2>
        <p style={{ fontSize: 15, color: BRAND.muted, lineHeight: 1.7 }}>{t("about.teamText")}</p>
      </section>

      {/* Contact */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "0 16px 60px" : "0 40px 80px", textAlign: "center" }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 12 }}>{t("about.contactTitle")}</h2>
        <a href={`mailto:${t("about.contact")}`} style={{ fontSize: 16, color: BRAND.orange, fontWeight: 600, textDecoration: "none" }}>{t("about.contact")}</a>
      </section>
    </div>
  );
}
