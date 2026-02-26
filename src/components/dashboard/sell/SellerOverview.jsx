import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatCard from "../shared/StatCard";
import { useDashboard } from "../DashboardLayout";
import { MOCK_SELLER } from "../dashboardUtils";

const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

export default function SellerOverview() {
  const { isMobile } = useResponsive();
  const { lang, setActiveSection } = useDashboard();
  const stats = MOCK_SELLER.stats;
  const monthlyRevenue = MOCK_SELLER.monthlyRevenue;
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Vue d'ensemble vendeur" : "Seller overview"}
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: isMobile ? 12 : 16,
        marginBottom: 24,
      }}>
        <StatCard icon={"\uD83D\uDCB0"} label={lang === "fr" ? "Revenus du mois" : "Month revenue"} value={formatPrice(stats.monthRevenue)} trend={{ value: "+14%", positive: true }} onClick={() => setActiveSection("sales")} />
        <StatCard icon={"\uD83D\uDCE6"} label={lang === "fr" ? "Commandes" : "Orders"} value={stats.totalOrders} />
        <StatCard icon={"\uD83D\uDCCB"} label={lang === "fr" ? "Offres actives" : "Active listings"} value={stats.activeListings} onClick={() => setActiveSection("offers")} />
        <StatCard icon={"\u2B50"} label="Rating" value={`${stats.avgRating}/5`} subtitle={`${stats.totalReviews} avis`} />
      </div>

      {/* Revenue chart */}
      <div style={{
        background: T.card, borderRadius: T.radius,
        border: `1px solid ${T.border}`, padding: isMobile ? 16 : 24,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
          {lang === "fr" ? "Revenus mensuels" : "Monthly revenue"}
        </h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 8 : 16, height: 160 }}>
          {monthlyRevenue.map((m) => (
            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, fontFamily: T.font }}>
                {formatPrice(m.value)}
              </span>
              <div style={{
                width: "100%", maxWidth: 48,
                height: `${(m.value / maxRevenue) * 120}px`,
                background: `linear-gradient(180deg, ${T.accent}, ${T.accent}88)`,
                borderRadius: "4px 4px 0 0",
                transition: "height 0.3s ease",
              }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font }}>{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending payouts */}
      <div style={{
        background: T.accentLight, borderRadius: T.radius,
        border: `1px solid ${T.accent}20`, padding: isMobile ? 16 : 20,
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, fontFamily: T.font }}>
            {lang === "fr" ? "Virements en attente" : "Pending payouts"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, fontFamily: T.font, marginTop: 4 }}>
            {formatPrice(stats.pendingPayouts)}
          </div>
        </div>
        <button style={{
          background: T.accent, color: "#fff",
          border: "none", borderRadius: T.radiusSm,
          padding: "10px 20px", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>
          {lang === "fr" ? "Voir les details" : "View details"}
        </button>
      </div>
    </div>
  );
}
