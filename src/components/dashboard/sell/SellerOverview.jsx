import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatCard from "../shared/StatCard";
import { useDashboard } from "../DashboardLayout";
import { MOCK_SELLER } from "../dashboardUtils";

const formatPrice = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

/* ═══════════════════════════════════════════════════════════
   KycBanner — shows appropriate UI for each KYC state
   ═══════════════════════════════════════════════════════════ */
function KycBanner({ status, data, error, actionError, busy, lang, onStart, onResume, onRefresh }) {
  const { isMobile } = useResponsive();

  const s = {
    card: {
      borderRadius: T.radius,
      padding: isMobile ? 16 : 20,
      marginBottom: 24,
      display: "flex",
      alignItems: isMobile ? "flex-start" : "center",
      flexDirection: isMobile ? "column" : "row",
      gap: 16,
    },
    icon: {
      fontSize: 32,
      flexShrink: 0,
    },
    body: { flex: 1 },
    title: { fontSize: 14, fontWeight: 700, fontFamily: T.font, margin: "0 0 4px" },
    desc: { fontSize: 13, fontFamily: T.font, margin: 0, lineHeight: 1.5 },
    btn: {
      height: 38,
      borderRadius: T.radiusSm,
      border: "none",
      padding: "0 18px",
      fontSize: 13,
      fontWeight: 600,
      cursor: busy ? "not-allowed" : "pointer",
      fontFamily: T.font,
      opacity: busy ? 0.65 : 1,
      transition: T.transitionFast,
      whiteSpace: "nowrap",
      flexShrink: 0,
      minWidth: 44,
      minHeight: 44,
    },
    meta: {
      marginTop: 8,
      fontSize: 12,
      color: T.textSec,
      fontFamily: T.font,
      lineHeight: 1.4,
    },
  };

  const blockedFields = data?.requirements?.currently_due || [];
  const kycMeta = data
    ? `${lang === "fr" ? "Paiements" : "Charges"}: ${data.charges_enabled ? "ON" : "OFF"} · ${lang === "fr" ? "Virements" : "Payouts"}: ${data.payouts_enabled ? "ON" : "OFF"}`
    : null;

  // not_started: never created Stripe account
  if (status === "not_started") {
    return (
      <div style={{ ...s.card, background: T.yellowBg, border: `1px solid ${T.yellow}40` }}>
        <span style={s.icon}>🔐</span>
        <div style={s.body}>
          <p style={{ ...s.title, color: T.yellowText }}>
            {lang === "fr" ? "Activez votre compte vendeur" : "Activate your seller account"}
          </p>
          <p style={{ ...s.desc, color: T.yellowText }}>
            {lang === "fr"
              ? "Connectez votre compte Stripe pour recevoir des paiements et publier des offres sur SUNTREX."
              : "Connect your Stripe account to receive payments and publish listings on SUNTREX."}
          </p>
          {kycMeta && <p style={s.meta}>{kycMeta}</p>}
          {actionError && <p style={{ ...s.meta, color: T.redText }}>{actionError}</p>}
        </div>
        <button
          style={{ ...s.btn, background: T.accent, color: "#fff" }}
          onClick={onStart}
          disabled={busy}
        >
          {busy
            ? (lang === "fr" ? "Chargement…" : "Loading…")
            : (lang === "fr" ? "Commencer" : "Get started")}
        </button>
      </div>
    );
  }

  // pending: account created but onboarding not started/complete
  if (status === "pending") {
    return (
      <div style={{ ...s.card, background: T.yellowBg, border: `1px solid ${T.yellow}40` }}>
        <span style={s.icon}>⏳</span>
        <div style={s.body}>
          <p style={{ ...s.title, color: T.yellowText }}>
            {lang === "fr" ? "Finalisez votre inscription Stripe" : "Complete your Stripe setup"}
          </p>
          <p style={{ ...s.desc, color: T.yellowText }}>
            {lang === "fr"
              ? "Votre compte est créé. Complétez le formulaire Stripe KYC pour activer les paiements."
              : "Your account is created. Complete the Stripe KYC form to enable payments."}
          </p>
          {blockedFields.length > 0 && (
            <p style={s.meta}>
              {lang === "fr" ? "Documents requis: " : "Required fields: "}
              {blockedFields.slice(0, 4).join(", ")}
              {blockedFields.length > 4 ? "…" : ""}
            </p>
          )}
          {actionError && <p style={{ ...s.meta, color: T.redText }}>{actionError}</p>}
        </div>
        <button
          style={{ ...s.btn, background: T.accent, color: "#fff" }}
          onClick={onResume}
          disabled={busy}
        >
          {busy
            ? (lang === "fr" ? "Chargement…" : "Loading…")
            : (lang === "fr" ? "Continuer" : "Continue")}
        </button>
      </div>
    );
  }

  // in_review: documents submitted, Stripe is reviewing
  if (status === "in_review") {
    return (
      <div style={{ ...s.card, background: T.blueBg, border: `1px solid ${T.blue}30` }}>
        <span style={s.icon}>🔍</span>
        <div style={s.body}>
          <p style={{ ...s.title, color: T.blueText }}>
            {lang === "fr" ? "Vérification en cours" : "Verification in progress"}
          </p>
          <p style={{ ...s.desc, color: T.blueText }}>
            {lang === "fr"
              ? "Stripe examine vos documents. La vérification prend généralement 1 à 2 jours ouvrés. Vous recevrez une notification dès que votre compte sera approuvé."
              : "Stripe is reviewing your documents. Verification usually takes 1–2 business days. You'll be notified once your account is approved."}
          </p>
          {kycMeta && <p style={s.meta}>{kycMeta}</p>}
        </div>
        <button
          style={{ ...s.btn, background: T.blue, color: "#fff" }}
          onClick={onRefresh}
          disabled={busy}
        >
          {lang === "fr" ? "Actualiser" : "Refresh"}
        </button>
      </div>
    );
  }

  // rejected: Stripe disabled the account
  if (status === "rejected") {
    const reason = data?.requirements?.disabled_reason;
    return (
      <div style={{ ...s.card, background: T.redBg, border: `1px solid ${T.red}30` }}>
        <span style={s.icon}>🚫</span>
        <div style={s.body}>
          <p style={{ ...s.title, color: T.redText }}>
            {lang === "fr" ? "Compte vendeur suspendu" : "Seller account suspended"}
          </p>
          <p style={{ ...s.desc, color: T.redText }}>
            {lang === "fr"
              ? `Stripe a désactivé votre compte.${reason ? ` Raison\u00a0: ${reason}.` : ""} Contactez le support SUNTREX pour résoudre ce problème.`
              : `Stripe has disabled your account.${reason ? ` Reason: ${reason}.` : ""} Contact SUNTREX support to resolve this.`}
          </p>
          {error && (
            <p style={{ ...s.desc, color: T.redText, marginTop: 4, fontSize: 12 }}>
              {error}
            </p>
          )}
          {actionError && (
            <p style={{ ...s.desc, color: T.redText, marginTop: 4, fontSize: 12 }}>
              {actionError}
            </p>
          )}
        </div>
        <button
          style={{ ...s.btn, background: T.red, color: "#fff" }}
          onClick={onResume}
          disabled={busy}
        >
          {lang === "fr" ? "Mettre à jour" : "Update info"}
        </button>
      </div>
    );
  }

  // approved: all good — show a small green confirmation
  if (status === "approved") {
    return (
      <div style={{ ...s.card, background: T.greenBg, border: `1px solid ${T.green}30`, paddingTop: 12, paddingBottom: 12 }}>
        <span style={{ ...s.icon, fontSize: 20 }}>✅</span>
        <p style={{ ...s.desc, color: T.greenText, margin: 0 }}>
          {lang === "fr"
            ? "Compte vendeur actif — vous pouvez recevoir des paiements et publier des offres."
            : "Seller account active — you can receive payments and publish listings."}
        </p>
      </div>
    );
  }

  // demo / loading / unknown: render nothing
  return null;
}

/* ═══════════════════════════════════════════════════════════
   SellerOverview
   ═══════════════════════════════════════════════════════════ */
export default function SellerOverview() {
  const { isMobile } = useResponsive();
  const {
    lang, setActiveSection,
    kycStatus: status, kycData: data, kycBusy: busy, kycActionError: actionError,
    refreshKyc: refresh, startOnboarding, resumeOnboarding,
  } = useDashboard();

  const stats = MOCK_SELLER.stats;
  const monthlyRevenue = MOCK_SELLER.monthlyRevenue;
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));

  // Blur stats when KYC not approved (but not in demo/loading mode)
  const kycBlocked = status !== null && status !== "demo" && status !== "approved";
  const blurStyle = kycBlocked
    ? { filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }
    : {};

  return (
    <div>
      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
        {lang === "fr" ? "Vue d'ensemble vendeur" : "Seller overview"}
      </h1>

      {/* KYC Banner — shown above stats */}
      <KycBanner
        status={status}
        data={data}
        error={null}
        actionError={actionError}
        busy={busy}
        lang={lang}
        onStart={startOnboarding}
        onResume={resumeOnboarding}
        onRefresh={refresh}
      />

      {/* Stats — blurred when KYC incomplete */}
      <div style={{ position: "relative" }}>
        <div style={blurStyle}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: isMobile ? 12 : 16,
            marginBottom: 24,
          }}>
            <StatCard icon={"💰"} label={lang === "fr" ? "Revenus du mois" : "Month revenue"} value={formatPrice(stats.monthRevenue)} trend={{ value: "+14%", positive: true }} onClick={() => setActiveSection("sales")} />
            <StatCard icon={"📦"} label={lang === "fr" ? "Commandes" : "Orders"} value={stats.totalOrders} />
            <StatCard icon={"📋"} label={lang === "fr" ? "Offres actives" : "Active listings"} value={stats.activeListings} onClick={() => setActiveSection("offers")} />
            <StatCard icon={"⭐"} label="Rating" value={`${stats.avgRating}/5`} subtitle={`${stats.totalReviews} avis`} />
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
              minHeight: 44,
            }}>
              {lang === "fr" ? "Voir les details" : "View details"}
            </button>
          </div>
        </div>

        {/* Overlay CTA when KYC blocked */}
        {kycBlocked && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: T.radius,
          }}>
            <div style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusLg,
              padding: "20px 28px",
              textAlign: "center",
              boxShadow: T.shadowMd,
              maxWidth: 320,
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font, margin: "0 0 6px" }}>
                {lang === "fr" ? "Données disponibles après activation" : "Data available after activation"}
              </p>
              <p style={{ fontSize: 12, color: T.textSec, fontFamily: T.font, margin: 0, lineHeight: 1.5 }}>
                {lang === "fr"
                  ? "Complétez votre compte vendeur Stripe pour accéder à vos statistiques."
                  : "Complete your Stripe seller account to access your stats."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
