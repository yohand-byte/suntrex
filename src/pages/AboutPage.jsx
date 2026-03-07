import { useTranslation } from "react-i18next";
import useResponsive from "../hooks/useResponsive";

export default function AboutPage() {
  const { t } = useTranslation("pages");
  const { isMobile } = useResponsive();
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#0F1923", marginBottom: 16 }}>{t("about.title")}</h1>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        {t("about.description")}
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>{t("about.missionTitle")}</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        {t("about.missionText")}
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>{t("about.contactTitle")}</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7 }}>
        Email : <a href="mailto:contact@suntrex.eu" style={{ color: "#E8700A" }}>contact@suntrex.eu</a><br/>
        {t("about.contactWhatsapp")}
      </p>
    </div>
  );
}
