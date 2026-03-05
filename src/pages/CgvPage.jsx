import useResponsive from "../hooks/useResponsive";

export default function CgvPage() {
  const { isMobile } = useResponsive();
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#0F1923", marginBottom: 16 }}>Conditions Generales de Vente</h1>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        Les presentes conditions generales de vente regissent l'utilisation de la plateforme SUNTREX
        et les transactions effectuees entre acheteurs et vendeurs.
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>1. Objet</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        SUNTREX est une marketplace B2B qui met en relation des professionnels du secteur photovoltaique.
        Les transactions sont realisees directement entre acheteurs et vendeurs, SUNTREX agissant en tant qu'intermediaire.
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>2. Commission</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        SUNTREX preleve une commission de 4.75% sur chaque transaction realisee via la plateforme.
        Les paiements sont securises via Stripe Connect avec authentification 3D Secure.
      </p>
      <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 40 }}>
        Derniere mise a jour : mars 2026. Pour toute question : <a href="mailto:contact@suntrex.eu" style={{ color: "#E8700A" }}>contact@suntrex.eu</a>
      </p>
    </div>
  );
}
