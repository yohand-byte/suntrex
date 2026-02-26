import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatCard from "../shared/StatCard";
import { useDashboard } from "../DashboardLayout";
import { MOCK_BUYER } from "../dashboardUtils";

const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default function BuyerOverview() {
  const { isMobile } = useResponsive();
  const { lang, setActiveSection } = useDashboard();
  const stats = MOCK_BUYER.stats;

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Vue d'ensemble" : "Overview"}
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: isMobile ? 12 : 16,
        marginBottom: 24,
      }}>
        <StatCard icon={"\uD83D\uDCE6"} label={lang === "fr" ? "Commandes" : "Orders"} value={stats.totalOrders} trend={{ value: "+12%", positive: true }} subtitle={lang === "fr" ? "ce mois" : "this month"} onClick={() => setActiveSection("purchases")} />
        <StatCard icon={"\uD83D\uDCB0"} label={lang === "fr" ? "Total depense" : "Total spent"} value={formatPrice(stats.totalSpend)} trend={{ value: "+8%", positive: true }} />
        <StatCard icon={"\u23F3"} label={lang === "fr" ? "En cours" : "Pending"} value={stats.pendingOrders} />
        <StatCard icon={"\uD83D\uDCC4"} label={lang === "fr" ? "RFQ actifs" : "Active RFQs"} value={stats.activeRFQs} onClick={() => setActiveSection("rfq")} />
      </div>

      {/* SUNTREX Finance promo card */}
      <div style={{
        background: `linear-gradient(135deg, ${T.sidebar} 0%, #2a2d36 100%)`,
        borderRadius: T.radiusLg,
        padding: isMobile ? 20 : 28,
        color: "#fff",
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>
          SUNTREX FINANCE
        </div>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, fontFamily: T.font, marginBottom: 8 }}>
          {lang === "fr" ? "Financez vos achats solaires" : "Finance your solar purchases"}
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: T.font, lineHeight: 1.5, marginBottom: 16, maxWidth: 500 }}>
          {lang === "fr"
            ? "Paiement en 3x ou 4x sans frais, credit professionnel et leasing. Solutions adaptees aux installateurs et distributeurs."
            : "Pay in 3 or 4 installments interest-free, professional credit and leasing. Solutions for installers and distributors."}
        </p>
        <button style={{
          background: T.accent, color: "#fff",
          border: "none", borderRadius: T.radiusSm,
          padding: "10px 20px", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>
          {lang === "fr" ? "En savoir plus" : "Learn more"}
        </button>
      </div>
    </div>
  );
}
