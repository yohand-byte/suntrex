import React, { useState } from "react";
import { T, TX_STATUS } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatCard from "../shared/StatCard";
import { useDashboard } from "../DashboardLayout";
import { MOCK_SELLER } from "../dashboardUtils";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

// ── Recent sales with actions ──────────────────────────────────────
const RECENT_SALES = [
  { id: "ST-2847", product: "Huawei SUN2000-10KTL-M1 ×5", buyer: "SolarPro France", flag: "🇫🇷", amount: 10750, fee: 537, status: "negotiation", date: "2026-03-01", actionLabel: "Répondre", actionLabelEn: "Reply" },
  { id: "ST-2846", product: "Huawei LUNA2000-15-S0 ×2", buyer: "GreenBuild BE", flag: "🇧🇪", amount: 8580, fee: 429, status: "confirmed", date: "2026-02-28", actionLabel: "Expédier", actionLabelEn: "Ship" },
  { id: "ST-2843", product: "Deye SUN-12K-SG04LP3 ×3", buyer: "InstallSol ES", flag: "🇪🇸", amount: 5610, fee: 280, status: "paid", date: "2026-02-27", actionLabel: "Préparer", actionLabelEn: "Prepare" },
  { id: "ST-2840", product: "Huawei SUN2000-8K-MAP0 ×8", buyer: "SolarMax NL", flag: "🇳🇱", amount: 7120, fee: 356, status: "shipped", date: "2026-02-26", actionLabel: "Suivi", actionLabelEn: "Track" },
  { id: "ST-2835", product: "Hoymiles HMS-2000-4T ×10", buyer: "PV Italia Srl", flag: "🇮🇹", amount: 3800, fee: 190, status: "delivered", date: "2026-02-24", actionLabel: null },
];

const SELLER_ACTIVITY = [
  { icon: "💬", text: "Nouveau message de SolarPro France sur ST-2847", time: "il y a 1h", type: "message" },
  { icon: "✅", text: "GreenBuild BE a confirmé la commande ST-2846", time: "il y a 4h", type: "order" },
  { icon: "💳", text: "Paiement de 5 610 € reçu pour ST-2843", time: "hier", type: "payment" },
  { icon: "⭐", text: "Nouvelle évaluation 5/5 de SolarMax NL", time: "il y a 2j", type: "review" },
  { icon: "📦", text: "ST-2835 livré et confirmé par PV Italia", time: "il y a 4j", type: "delivery" },
  { icon: "⚠️", text: "Stock faible : SUN2000-5K-MAP0 (0 unités)", time: "il y a 5j", type: "alert" },
];

const TOP_PRODUCTS = [
  { name: "SUN2000-10K-MAP0", orders: 12, revenue: 13416, stock: 9, views: 284 },
  { name: "LUNA2000-5-E0", orders: 8, revenue: 9040, stock: 14, views: 197 },
  { name: "SUN2000-5K-MAP0", orders: 22, revenue: 14960, stock: 0, views: 432 },
  { name: "SUN2000-8K-MAP0", orders: 5, revenue: 4450, stock: 28, views: 156 },
];

/* ═══════════════════════════════════════════════════════════
   KycBanner — shows appropriate UI for each KYC state
   ═══════════════════════════════════════════════════════════ */
function KycBanner({ status, data, error, actionError, busy, lang, onStart, onResume, onRefresh }) {
  const { isMobile } = useResponsive();
  const s = {
    card: { borderRadius: T.radius, padding: isMobile ? 16 : 20, marginBottom: 24, display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 16 },
    icon: { fontSize: 32, flexShrink: 0 },
    body: { flex: 1 },
    title: { fontSize: 14, fontWeight: 700, fontFamily: T.font, margin: "0 0 4px" },
    desc: { fontSize: 13, fontFamily: T.font, margin: 0, lineHeight: 1.5 },
    btn: { height: 38, borderRadius: T.radiusSm, border: "none", padding: "0 18px", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", fontFamily: T.font, opacity: busy ? 0.65 : 1, transition: T.transitionFast, whiteSpace: "nowrap", flexShrink: 0, minWidth: 44, minHeight: 44 },
    meta: { marginTop: 8, fontSize: 12, color: T.textSec, fontFamily: T.font, lineHeight: 1.4 },
  };

  const blockedFields = data?.requirements?.currently_due || [];
  const kycMeta = data ? `${lang === "fr" ? "Paiements" : "Payments"}: ${data.charges_enabled ? "ACTIF" : "INACTIF"} · ${lang === "fr" ? "Virements" : "Payouts"}: ${data.payouts_enabled ? "ACTIF" : "INACTIF"}` : null;

  if (status === "not_started") return (
    <div style={{ ...s.card, background: T.yellowBg, border: `1px solid ${T.yellow}40` }}>
      <span style={s.icon}>🔐</span>
      <div style={s.body}>
        <p style={{ ...s.title, color: T.yellowText }}>{lang === "fr" ? "Activez votre compte vendeur" : "Activate your seller account"}</p>
        <p style={{ ...s.desc, color: T.yellowText }}>{lang === "fr" ? "Connectez votre compte Stripe pour recevoir des paiements et publier des offres sur SUNTREX." : "Connect your Stripe account to receive payments and publish listings on SUNTREX."}</p>
        {kycMeta && <p style={s.meta}>{kycMeta}</p>}
        {actionError && <p style={{ ...s.meta, color: T.redText }}>{actionError}</p>}
      </div>
      <button style={{ ...s.btn, background: T.accent, color: "#fff" }} onClick={onStart} disabled={busy}>{busy ? "Chargement…" : (lang === "fr" ? "Commencer" : "Get started")}</button>
    </div>
  );
  if (status === "pending") return (
    <div style={{ ...s.card, background: T.yellowBg, border: `1px solid ${T.yellow}40` }}>
      <span style={s.icon}>⏳</span>
      <div style={s.body}>
        <p style={{ ...s.title, color: T.yellowText }}>{lang === "fr" ? "Finalisez votre inscription Stripe" : "Complete your Stripe setup"}</p>
        <p style={{ ...s.desc, color: T.yellowText }}>{lang === "fr" ? "Complétez le formulaire Stripe KYC pour activer les paiements." : "Complete the Stripe KYC form to enable payments."}</p>
        {blockedFields.length > 0 && <p style={s.meta}>{lang === "fr" ? "Documents requis: " : "Required: "}{blockedFields.slice(0, 4).join(", ")}</p>}
        {actionError && <p style={{ ...s.meta, color: T.redText }}>{actionError}</p>}
      </div>
      <button style={{ ...s.btn, background: T.accent, color: "#fff" }} onClick={onResume} disabled={busy}>{busy ? "Chargement…" : (lang === "fr" ? "Continuer" : "Continue")}</button>
    </div>
  );
  if (status === "in_review") return (
    <div style={{ ...s.card, background: T.blueBg, border: `1px solid ${T.blue}30` }}>
      <span style={s.icon}>🔍</span>
      <div style={s.body}>
        <p style={{ ...s.title, color: T.blueText }}>{lang === "fr" ? "Vérification en cours" : "Verification in progress"}</p>
        <p style={{ ...s.desc, color: T.blueText }}>{lang === "fr" ? "Stripe examine vos documents. Délai : 1 à 2 jours ouvrés." : "Stripe is reviewing your documents. 1–2 business days."}</p>
        {kycMeta && <p style={s.meta}>{kycMeta}</p>}
      </div>
      <button style={{ ...s.btn, background: T.blue, color: "#fff" }} onClick={onRefresh} disabled={busy}>{lang === "fr" ? "Actualiser" : "Refresh"}</button>
    </div>
  );
  if (status === "rejected") return (
    <div style={{ ...s.card, background: T.redBg, border: `1px solid ${T.red}30` }}>
      <span style={s.icon}>🚫</span>
      <div style={s.body}>
        <p style={{ ...s.title, color: T.redText }}>{lang === "fr" ? "Compte vendeur suspendu" : "Seller account suspended"}</p>
        <p style={{ ...s.desc, color: T.redText }}>{lang === "fr" ? "Contactez le support SUNTREX pour résoudre ce problème." : "Contact SUNTREX support."}</p>
      </div>
      <button style={{ ...s.btn, background: T.red, color: "#fff" }} onClick={onResume} disabled={busy}>{lang === "fr" ? "Mettre à jour" : "Update info"}</button>
    </div>
  );
  if (status === "approved") return (
    <div style={{ ...s.card, background: T.greenBg, border: `1px solid ${T.green}30`, paddingTop: 12, paddingBottom: 12 }}>
      <span style={{ ...s.icon, fontSize: 20 }}>✅</span>
      <p style={{ ...s.desc, color: T.greenText, margin: 0 }}>{lang === "fr" ? "Compte vendeur actif — paiements et offres activés." : "Seller account active — payments and listings enabled."}</p>
    </div>
  );
  return null;
}

/* ═══════════════════════════════════════════════════════════
   SellerOverview — enrichi Sprint 7
   ═══════════════════════════════════════════════════════════ */
export default function SellerOverview() {
  const { isMobile } = useResponsive();
  const {
    lang, setActiveSection,
    kycStatus: status, kycData: data, kycBusy: busy, kycActionError: actionError,
    refreshKyc: refresh, startOnboarding, resumeOnboarding, navigateToTransaction,
  } = useDashboard();

  const stats = MOCK_SELLER.stats;
  const monthlyRevenue = MOCK_SELLER.monthlyRevenue;
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

  const kycBlocked = status !== null && status !== "demo" && status !== "approved";
  const blurStyle = kycBlocked ? { filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 } : {};

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Tableau de bord vendeur" : "Seller Dashboard"}
      </h1>

      <KycBanner status={status} data={data} error={null} actionError={actionError} busy={busy} lang={lang} onStart={startOnboarding} onResume={resumeOnboarding} onRefresh={refresh} />

      <div style={{ position: "relative" }}>
        <div style={blurStyle}>
          {/* ── KPI cards ──────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 24 }}>
            <StatCard icon="💰" label={lang === "fr" ? "Revenus du mois" : "Month revenue"} value={fmt(stats.monthRevenue)} trend={{ value: "+14%", positive: true }} onClick={() => setActiveSection("sales")} />
            <StatCard icon="📦" label={lang === "fr" ? "Commandes" : "Orders"} value={stats.totalOrders} subtitle={lang === "fr" ? "total" : "total"} />
            <StatCard icon="📋" label={lang === "fr" ? "Offres actives" : "Active listings"} value={stats.activeListings} onClick={() => setActiveSection("offers")} />
            <StatCard icon="⭐" label="Rating" value={`${stats.avgRating}/5`} subtitle={`${stats.totalReviews} ${lang === "fr" ? "avis" : "reviews"}`} />
          </div>

          {/* ── Two columns: Recent sales + Activity ─────────── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Recent sales */}
            <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
                  {lang === "fr" ? "Dernières ventes" : "Recent sales"}
                </span>
                <button onClick={() => setActiveSection("sales")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                  {lang === "fr" ? "Voir tout →" : "View all →"}
                </button>
              </div>
              {RECENT_SALES.map((sale, i) => {
                const st = TX_STATUS[sale.status] || TX_STATUS.negotiation;
                return (
                  <SaleRow key={sale.id} sale={sale} st={st} isMobile={isMobile} isLast={i === RECENT_SALES.length - 1} lang={lang} onClickTx={() => navigateToTransaction?.(sale.id)} />
                );
              })}
            </div>

            {/* Activity feed */}
            <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
                  {lang === "fr" ? "Activité récente" : "Recent activity"}
                </span>
                <button onClick={() => setActiveSection("messages")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>💬</button>
              </div>
              {SELLER_ACTIVITY.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 18px", borderBottom: i < SELLER_ACTIVITY.length - 1 ? `1px solid ${T.borderLight}` : "none", cursor: "pointer", transition: T.transitionFast }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = T.card}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: item.type === "alert" ? T.redText : T.text, fontWeight: item.type === "alert" ? 600 : 400, fontFamily: T.font, lineHeight: 1.4 }}>{item.text}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Monthly Revenue Chart ──────────────────────────── */}
          <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: isMobile ? 16 : 20, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
                {lang === "fr" ? "Revenus mensuels" : "Monthly revenue"}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.accent, fontFamily: T.font }}>
                {fmt(monthlyRevenue.reduce((s, m) => s + m.value, 0))}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 8 : 16, height: 140 }}>
              {monthlyRevenue.map((m) => (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, fontFamily: T.font }}>{fmt(m.value)}</span>
                  <div style={{ width: "100%", maxWidth: 48, height: `${(m.value / maxRevenue) * 100}px`, background: `linear-gradient(180deg, ${T.accent}, ${T.accent}88)`, borderRadius: "4px 4px 0 0", transition: "height 0.3s ease" }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top Products + Pending Payouts ─────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Top products */}
            <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
                  {lang === "fr" ? "Produits les plus vendus" : "Top products"}
                </span>
                <button onClick={() => setActiveSection("offers")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                  {lang === "fr" ? "Gérer →" : "Manage →"}
                </button>
              </div>
              {TOP_PRODUCTS.map((p, i) => {
                const maxOrders = Math.max(...TOP_PRODUCTS.map(x => x.orders));
                return (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: i < TOP_PRODUCTS.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: T.radiusSm, background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: T.accent, fontFamily: T.font, flexShrink: 0 }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 4 }}>{p.name}</div>
                      {/* Mini bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: T.borderLight, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${(p.orders / maxOrders) * 100}%`, height: "100%", background: T.accent, borderRadius: 2, transition: "width .3s ease" }} />
                        </div>
                        <span style={{ fontSize: 10, color: T.textMuted, fontFamily: T.font, whiteSpace: "nowrap" }}>{p.orders} ventes</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>{fmt(p.revenue)}</div>
                      <div style={{ fontSize: 10, color: p.stock === 0 ? T.red : T.textMuted, fontWeight: p.stock === 0 ? 600 : 400, fontFamily: T.font }}>
                        {p.stock === 0 ? (lang === "fr" ? "⚠️ Rupture" : "⚠️ Out") : `${p.stock} ${lang === "fr" ? "en stock" : "in stock"}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pending payouts + quick metrics */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Pending payouts */}
              <div style={{ background: T.accentLight, borderRadius: T.radius, border: `1px solid ${T.accent}20`, padding: isMobile ? 16 : 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, fontFamily: T.font }}>
                  {lang === "fr" ? "Virements en attente" : "Pending payouts"}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.text, fontFamily: T.font, marginTop: 4 }}>
                  {fmt(stats.pendingPayouts)}
                </div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font, marginTop: 4 }}>
                  {lang === "fr" ? "Prochain virement dans ~2 jours" : "Next payout in ~2 days"}
                </div>
                <button style={{ marginTop: 12, background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                  {lang === "fr" ? "Voir les détails" : "View details"}
                </button>
              </div>

              {/* Quick metrics */}
              <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: isMobile ? 16 : 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: 14 }}>
                  {lang === "fr" ? "Indicateurs clés" : "Key metrics"}
                </div>
                <MetricRow label={lang === "fr" ? "Taux de conversion" : "Conversion rate"} value={`${stats.conversionRate}%`} icon="📈" />
                <MetricRow label={lang === "fr" ? "Temps de réponse" : "Response time"} value={stats.responseTime} icon="⚡" good />
                <MetricRow label={lang === "fr" ? "Commission SUNTREX" : "SUNTREX commission"} value="5%" icon="🏷️" subtitle={lang === "fr" ? "-5% vs concurrents" : "-5% vs competitors"} />
                <MetricRow label={lang === "fr" ? "Revenus totaux" : "Total revenue"} value={fmt(stats.totalRevenue)} icon="💎" isLast />
              </div>
            </div>
          </div>

          {/* ── SUNTREX Delivery promo ─────────────────────────── */}
          <div style={{ background: `linear-gradient(135deg, ${T.sidebar} 0%, #2a2d36 100%)`, borderRadius: T.radiusLg, padding: isMobile ? 20 : 28, color: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>SUNTREX DELIVERY</div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, fontFamily: T.font, marginBottom: 8 }}>
              {lang === "fr" ? "Livraison sécurisée avec vérification" : "Secure delivery with verification"}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: T.font, lineHeight: 1.5, marginBottom: 16, maxWidth: 500 }}>
              {lang === "fr"
                ? "QR codes, photos de vérification, preuve de livraison. Renforcez la confiance de vos acheteurs avec SUNTREX DELIVERY."
                : "QR codes, verification photos, proof of delivery. Build buyer trust with SUNTREX DELIVERY."}
            </p>
            <button style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
              {lang === "fr" ? "Activer SUNTREX DELIVERY →" : "Enable SUNTREX DELIVERY →"}
            </button>
          </div>
        </div>

        {/* KYC lock overlay */}
        {kycBlocked && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: T.radius }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusLg, padding: "20px 28px", textAlign: "center", boxShadow: T.shadowMd, maxWidth: 320 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font, margin: "0 0 6px" }}>
                {lang === "fr" ? "Données disponibles après activation" : "Data available after activation"}
              </p>
              <p style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, margin: 0, lineHeight: 1.5 }}>
                {lang === "fr" ? "Complétez votre compte vendeur Stripe." : "Complete your Stripe seller account."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sale row with action button ────────────────────────────────── */
function SaleRow({ sale, st, isMobile, isLast, lang, onClickTx }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClickTx}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 12,
        padding: isMobile ? "10px 14px" : "12px 18px",
        borderBottom: isLast ? "none" : `1px solid ${T.borderLight}`,
        background: hovered ? T.bg : T.card,
        cursor: "pointer", transition: T.transitionFast,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>{sale.id}</span>
          <span style={{ fontSize: 11, color: T.textMuted }}>· {sale.flag} {sale.buyer}</span>
        </div>
        <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sale.product}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font }}>{fmt(sale.amount)}</div>
          <div style={{ fontSize: 10, color: T.greenText, fontFamily: T.font }}>-{fmt(sale.fee)} fee</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: st.text, background: st.bg, padding: "2px 8px", borderRadius: 99, fontFamily: T.font, whiteSpace: "nowrap" }}>{st.icon} {lang === "fr" ? st.labelFr : st.label}</span>
        {sale.actionLabel && (
          <button onClick={e => { e.stopPropagation(); }} style={{
            background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm,
            padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
          }}>
            {lang === "fr" ? sale.actionLabel : sale.actionLabelEn}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Metric row ─────────────────────────────────────────────────── */
function MetricRow({ label, value, icon, subtitle, good, isLast }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: isLast ? "none" : `1px solid ${T.borderLight}` }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.font }}>{label}</div>
        {subtitle && <div style={{ fontSize: 10, color: T.greenText, fontFamily: T.font, fontWeight: 500 }}>{subtitle}</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: good ? T.greenText : T.text, fontFamily: T.font }}>{value}</div>
    </div>
  );
}
