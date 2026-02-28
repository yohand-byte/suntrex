import React, { useState } from "react";
import { T, TX_STATUS } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatCard from "../shared/StatCard";
import StatusBadge from "../shared/StatusBadge";
import { useDashboard } from "../DashboardLayout";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

// ── Mock data ──────────────────────────────────────────────────────
const STATS = {
  totalOrders: 23,
  totalSpend: 47520,
  pendingOrders: 4,
  activeRFQs: 2,
  savedProducts: 12,
  avgOrderValue: 2066,
};

const RECENT_ORDERS = [
  { id: "ST-2847", product: "Huawei SUN2000-10KTL-M1", seller: "QUALIWATT", flag: "🇫🇷", amount: 2150, status: "negotiation", date: "2026-03-01" },
  { id: "ST-2843", product: "Huawei LUNA2000-15-S0", seller: "SolarMax DE", flag: "🇩🇪", amount: 4290, status: "confirmed", date: "2026-02-28" },
  { id: "ST-2839", product: "Deye SUN-12K-SG04LP3", seller: "EnergyParts NL", flag: "🇳🇱", amount: 1870, status: "paid", date: "2026-02-27" },
  { id: "ST-2835", product: "Hoymiles HMS-2000-4T", seller: "IberSol España", flag: "🇪🇸", amount: 380, status: "shipped", date: "2026-02-26" },
  { id: "ST-2831", product: "Huawei SUN2000-5KTL-L1", seller: "BelgSolar", flag: "🇧🇪", amount: 1420, status: "delivered", date: "2026-02-24" },
];

const ACTIVITY = [
  { icon: "💬", text: "Nouveau message de QUALIWATT sur ST-2847", time: "il y a 2h", action: "messages" },
  { icon: "✅", text: "Commande ST-2843 confirmée par SolarMax DE", time: "il y a 5h", action: "purchases" },
  { icon: "💳", text: "Paiement de 1 870 € validé pour ST-2839", time: "hier", action: "purchases" },
  { icon: "🚚", text: "ST-2835 expédié — livraison estimée jeudi", time: "il y a 2j", action: "purchases" },
  { icon: "📦", text: "ST-2831 livré et réceptionné", time: "il y a 4j", action: "purchases" },
];

const WEEKLY_SPEND = [
  { label: "Lun", value: 0 },
  { label: "Mar", value: 2150 },
  { label: "Mer", value: 4290 },
  { label: "Jeu", value: 1870 },
  { label: "Ven", value: 380 },
  { label: "Sam", value: 0 },
  { label: "Dim", value: 0 },
];

export default function BuyerOverview() {
  const { isMobile } = useResponsive();
  const { lang, setActiveSection, navigateToTransaction } = useDashboard();

  const maxSpend = Math.max(...WEEKLY_SPEND.map(d => d.value), 1);

  return (
    <div>
      {/* Title */}
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Tableau de bord acheteur" : "Buyer Dashboard"}
      </h1>

      {/* KPI cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: isMobile ? 10 : 14,
        marginBottom: 24,
      }}>
        <StatCard icon="📦" label={lang === "fr" ? "Commandes" : "Orders"} value={STATS.totalOrders} trend={{ value: "+12%", positive: true }} subtitle={lang === "fr" ? "total" : "total"} onClick={() => setActiveSection("purchases")} />
        <StatCard icon="💰" label={lang === "fr" ? "Dépensé" : "Spent"} value={fmt(STATS.totalSpend)} trend={{ value: "+8%", positive: true }} />
        <StatCard icon="⏳" label={lang === "fr" ? "En cours" : "Pending"} value={STATS.pendingOrders} onClick={() => setActiveSection("purchases")} />
        <StatCard icon="📄" label={lang === "fr" ? "Devis actifs" : "Active RFQs"} value={STATS.activeRFQs} onClick={() => setActiveSection("rfq")} />
      </div>

      {/* Two columns: Recent orders + Activity feed */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Recent orders */}
        <div style={{
          background: T.card, borderRadius: T.radius,
          border: `1px solid ${T.border}`, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
              {lang === "fr" ? "Dernières commandes" : "Recent orders"}
            </span>
            <button
              onClick={() => setActiveSection("purchases")}
              style={{
                background: "none", border: "none", color: T.accent,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}
            >
              {lang === "fr" ? "Voir tout →" : "View all →"}
            </button>
          </div>

          {RECENT_ORDERS.map((order, i) => {
            const st = TX_STATUS[order.status] || TX_STATUS.negotiation;
            return (
              <div
                key={order.id}
                onClick={() => navigateToTransaction?.(order.id)}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? 8 : 12,
                  padding: isMobile ? "10px 14px" : "12px 18px",
                  borderBottom: i < RECENT_ORDERS.length - 1 ? `1px solid ${T.borderLight}` : "none",
                  cursor: "pointer",
                  transition: T.transitionFast,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = T.card}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>{order.id}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>· {order.flag} {order.seller}</span>
                  </div>
                  <div style={{
                    fontSize: 12, color: T.textSec, fontFamily: T.font,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {order.product}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font }}>{fmt(order.amount)}</div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: st.text, background: st.bg,
                    padding: "1px 7px", borderRadius: 99, fontFamily: T.font,
                  }}>
                    {st.icon} {lang === "fr" ? st.labelFr : st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity feed */}
        <div style={{
          background: T.card, borderRadius: T.radius,
          border: `1px solid ${T.border}`, overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
              {lang === "fr" ? "Activité récente" : "Recent activity"}
            </span>
            <button
              onClick={() => setActiveSection("messages")}
              style={{
                background: "none", border: "none", color: T.accent,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}
            >
              💬
            </button>
          </div>

          {ACTIVITY.map((item, i) => (
            <div
              key={i}
              onClick={() => item.action && setActiveSection(item.action)}
              style={{
                display: "flex", gap: 10, padding: "10px 18px",
                borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${T.borderLight}` : "none",
                cursor: item.action ? "pointer" : "default",
                transition: T.transitionFast,
              }}
              onMouseEnter={e => { if (item.action) e.currentTarget.style.background = T.bg; }}
              onMouseLeave={e => e.currentTarget.style.background = T.card}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.text, fontFamily: T.font, lineHeight: 1.4 }}>{item.text}</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly spend chart */}
      <div style={{
        background: T.card, borderRadius: T.radius,
        border: `1px solid ${T.border}`, padding: isMobile ? 16 : 20,
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
            {lang === "fr" ? "Dépenses cette semaine" : "This week's spending"}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.accent, fontFamily: T.font }}>
            {fmt(WEEKLY_SPEND.reduce((s, d) => s + d.value, 0))}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 6 : 10, height: 100 }}>
          {WEEKLY_SPEND.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", maxWidth: 40,
                height: Math.max((d.value / maxSpend) * 80, d.value > 0 ? 6 : 2),
                background: d.value > 0 ? `linear-gradient(180deg, ${T.accent}, ${T.accentHover})` : T.borderLight,
                borderRadius: 4,
                transition: "height .3s ease",
              }} />
              <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.font }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SUNTREX Finance promo */}
      <div style={{
        background: `linear-gradient(135deg, ${T.sidebar} 0%, #2a2d36 100%)`,
        borderRadius: T.radiusLg,
        padding: isMobile ? 20 : 28,
        color: "#fff",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>
          SUNTREX FINANCE
        </div>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, fontFamily: T.font, marginBottom: 8 }}>
          {lang === "fr" ? "Financez vos achats solaires" : "Finance your solar purchases"}
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: T.font, lineHeight: 1.5, marginBottom: 16, maxWidth: 500 }}>
          {lang === "fr"
            ? "Paiement en 3x ou 4x sans frais, crédit professionnel et leasing."
            : "Pay in 3 or 4 installments interest-free, professional credit and leasing."}
        </p>
        <button style={{
          background: T.accent, color: "#fff",
          border: "none", borderRadius: T.radiusSm,
          padding: "10px 20px", fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>
          {lang === "fr" ? "En savoir plus →" : "Learn more →"}
        </button>
      </div>
    </div>
  );
}
