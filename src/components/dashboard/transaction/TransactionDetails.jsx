import React from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import TransactionTimeline from "./TransactionTimeline";

const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };

const formatDate = (d) => {
  if (!d) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
};

// TransactionDetails — seller/buyer info panel + timeline
// Props: transaction, role ("buyer"|"seller"), lang
export default function TransactionDetails({ transaction, role, lang = "fr" }) {
  const { isMobile } = useResponsive();
  const isSeller = role === "seller";

  // The "other party" details
  const otherParty = isSeller ? transaction.buyer : transaction.seller;
  const otherLabel = isSeller
    ? (lang === "fr" ? "Details de l'acheteur" : "Buyer details")
    : (lang === "fr" ? "Details du vendeur" : "Seller details");

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 16 : 20,
    }}>
      {/* Other party details */}
      <div style={{
        flex: 1,
        background: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        padding: isMobile ? 16 : 20,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 16px" }}>
          {otherLabel}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Company name */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.accent}44, #f59e0b44)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: T.accent, flexShrink: 0,
            }}>
              {otherParty?.avatar || otherParty?.name?.[0] || "?"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>
                {otherParty?.companyName || otherParty?.name}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>
                {FLAG_EMOJI[otherParty?.country] || ""} {otherParty?.country}
              </div>
            </div>
          </div>

          {/* Stats pills */}
          {!isSeller && otherParty?.stats && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <InfoPill label={lang === "fr" ? "TVA" : "VAT"} value={otherParty.vatVerified ? "\u2713 Actif" : "\u2717"} color={otherParty.vatVerified ? T.greenText : T.redText} bg={otherParty.vatVerified ? T.greenBg : T.redBg} />
              <InfoPill label={lang === "fr" ? "Tx completees" : "Completed tx"} value={String(otherParty.stats.completedTx || 0)} />
              <InfoPill label={lang === "fr" ? "Offres actives" : "Active offers"} value={String(otherParty.stats.activeOffers || 0)} />
              <InfoPill label={lang === "fr" ? "Depuis" : "Since"} value={formatDate(otherParty.stats.memberSince)} />
              {otherParty.stats.rating && (
                <InfoPill label="" value={`\u2B50 ${otherParty.stats.rating} (${otherParty.stats.reviewCount || 0})`} />
              )}
              {otherParty.stats.responseTime && (
                <InfoPill label={"\uD83D\uDD50"} value={otherParty.stats.responseTime} />
              )}
            </div>
          )}

          {/* Address */}
          {otherParty?.address && (
            <div style={{
              padding: 12,
              background: T.bg,
              borderRadius: T.radiusSm,
              fontSize: 12,
              color: T.textSec,
              fontFamily: T.font,
              lineHeight: 1.5,
            }}>
              <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>
                {lang === "fr" ? "Adresse" : "Address"}
              </div>
              {otherParty.address}
            </div>
          )}
        </div>
      </div>

      {/* Transaction details + Timeline */}
      <div style={{
        flex: 1,
        background: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        padding: isMobile ? 16 : 20,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 16px" }}>
          {lang === "fr" ? "Details de la transaction" : "Transaction details"}
        </h3>

        {/* Buyer contact info */}
        {isSeller && transaction.buyer && (
          <div style={{ marginBottom: 16, fontSize: 12, color: T.textSec, fontFamily: T.font }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span>{FLAG_EMOJI[transaction.buyer.country] || ""}</span>
              <span>{lang === "fr" ? "Coordonnees acheteur:" : "Buyer coordinates:"} {transaction.buyer.country}</span>
            </div>
            {transaction.buyer.vatVerified && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ color: T.green }}>{"\u2713"}</span>
                <span>TVA: {lang === "fr" ? "Verifie" : "Verified"} ({formatDate(transaction.buyer.vatVerifiedAt)})</span>
                <button style={{
                  background: "none", border: "none",
                  color: T.accent, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: T.font,
                  textDecoration: "underline",
                }}>
                  {lang === "fr" ? "Reverifier" : "Re-verify"}
                </button>
              </div>
            )}
            {transaction.buyer.deliveryAddress && (
              <div>
                {lang === "fr" ? "Adresse livraison:" : "Delivery address:"} {transaction.buyer.deliveryAddress}
              </div>
            )}
          </div>
        )}

        {/* Status timeline */}
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 12 }}>
          {lang === "fr" ? "Statut commande:" : "Order status:"}
        </div>
        <TransactionTimeline transaction={transaction} lang={lang} />

        {/* Shipped by */}
        {transaction.seller && (
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: `1px solid ${T.borderLight}`,
            fontSize: 12, color: T.textSec, fontFamily: T.font,
          }}>
            <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>
              {lang === "fr" ? "Envoye par:" : "Shipped by:"}
            </div>
            <div>{transaction.seller.companyName || transaction.seller.name}</div>
            {transaction.seller.address && <div>{transaction.seller.address}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Info pill helper ───────────────────────────────────────────────
function InfoPill({ label, value, color, bg }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 500,
      fontFamily: T.font,
      color: color || T.textSec,
      background: bg || T.bg,
      border: `1px solid ${T.borderLight}`,
    }}>
      {label && <span>{label}:</span>}
      <span style={{ fontWeight: 600 }}>{value}</span>
    </span>
  );
}
