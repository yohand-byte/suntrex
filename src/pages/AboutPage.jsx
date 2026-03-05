import useResponsive from "../hooks/useResponsive";

export default function AboutPage() {
  const { isMobile } = useResponsive();
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: "#0F1923", marginBottom: 16 }}>A propos de SUNTREX</h1>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        SUNTREX est la marketplace B2B europeenne dediee aux equipements photovoltaiques et au stockage d'energie.
        Nous connectons installateurs, distributeurs et professionnels du solaire avec des vendeurs verifies a travers l'Europe.
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>Notre mission</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 24 }}>
        Simplifier l'approvisionnement en equipements solaires pour les professionnels europeens,
        avec des prix competitifs, un service de livraison verifie et des outils intelligents.
      </p>
      <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#0F1923", marginBottom: 12 }}>Contact</h2>
      <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7 }}>
        Email : <a href="mailto:contact@suntrex.eu" style={{ color: "#E8700A" }}>contact@suntrex.eu</a><br/>
        WhatsApp : +33 7 00 00 00 00
      </p>
    </div>
  );
}
