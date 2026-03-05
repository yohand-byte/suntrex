import useResponsive from "../hooks/useResponsive";

export default function PrivacyPage() {
  const { isMobile } = useResponsive();
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#0F1923", marginBottom: 16 }}>Politique de Confidentialite</h1>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        SUNTREX s'engage a proteger la vie privee de ses utilisateurs conformement au Reglement General
        sur la Protection des Donnees (RGPD).
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>Donnees collectees</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        Nous collectons uniquement les donnees necessaires au fonctionnement de la plateforme :
        informations d'entreprise, coordonnees, historique de transactions et donnees de navigation.
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>Utilisation des donnees</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        Vos donnees sont utilisees pour : la gestion de votre compte, le traitement des transactions,
        l'amelioration de nos services et, avec votre consentement, l'envoi de communications marketing.
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>Vos droits</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        Vous disposez d'un droit d'acces, de rectification, de suppression et de portabilite de vos donnees.
        Pour exercer ces droits : <a href="mailto:contact@suntrex.eu" style={{ color: "#E8700A" }}>contact@suntrex.eu</a>
      </p>
      <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 40 }}>
        Derniere mise a jour : mars 2026.
      </p>
    </div>
  );
}
