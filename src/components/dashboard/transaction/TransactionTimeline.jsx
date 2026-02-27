import React from "react";
import { T, TX_STATUS } from "../tokens";
import { useResponsive } from "../shared/useResponsive";

const PIPELINE = [
  { status: "negotiation", label: "Opening negotiation",  labelFr: "Ouverture nego" },
  { status: "confirmed",   label: "Transaction confirmed", labelFr: "Tx confirmee" },
  { status: "paid",        label: "Paid",                  labelFr: "Paye" },
  { status: "shipped",     label: "Shipped",               labelFr: "Expedie" },
  { status: "delivered",   label: "Delivered",              labelFr: "Livre" },
];

const STATUS_ORDER = ["negotiation", "confirmed", "paid", "shipped", "delivered"];

const formatDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(date);
};

export default function TransactionTimeline({ transaction, lang = "fr" }) {
  const { isMobile } = useResponsive();
  const currentIdx = STATUS_ORDER.indexOf(transaction.status);
  const isCancelled = transaction.status === "cancelled";
  const isDisputed = transaction.status === "disputed";

  const getLabel = (step) => lang === "fr" ? step.labelFr : step.label;

  const timestamps = {
    negotiation: transaction.createdAt,
    confirmed: transaction.confirmedAt,
    paid: transaction.paidAt,
    shipped: transaction.shippedAt,
    delivered: transaction.deliveredAt,
  };

  return (
    <div style={{ padding: isMobile ? 0 : "0 4px" }}>
      {/* Cancelled/Disputed banner */}
      {(isCancelled || isDisputed) && (
        <div style={{
          padding: "10px 14px",
          borderRadius: T.radiusSm,
          background: isCancelled ? "#f1f5f9" : T.redBg,
          border: `1px solid ${isCancelled ? T.border : T.red}20`,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{isCancelled ? "\u2715" : "\u26A0\uFE0F"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isCancelled ? T.textSec : T.redText, fontFamily: T.font }}>
              {isCancelled
                ? (lang === "fr" ? "Transaction annulee" : "Transaction cancelled")
                : (lang === "fr" ? "Litige ouvert" : "Dispute opened")}
            </div>
            {transaction.cancelReason && (
              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
                {transaction.cancelReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline steps */}
      {PIPELINE.map((step, idx) => {
        const stepIdx = STATUS_ORDER.indexOf(step.status);
        const isCompleted = !isCancelled && !isDisputed && stepIdx <= currentIdx;
        const isCurrent = !isCancelled && !isDisputed && stepIdx === currentIdx;
        const isLast = idx === PIPELINE.length - 1;
        const timestamp = timestamps[step.status];

        return (
          <div key={step.status} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            position: "relative",
            paddingBottom: isLast ? 0 : 20,
          }}>
            {/* Vertical line */}
            {!isLast && (
              <div style={{
                position: "absolute",
                left: 9,
                top: 20,
                width: 2,
                height: "calc(100% - 20px)",
                background: isCompleted ? T.green : T.borderLight,
              }} />
            )}

            {/* Circle */}
            <div style={{
              width: 20, height: 20,
              borderRadius: "50%",
              background: isCompleted ? T.green : T.card,
              border: `2px solid ${isCompleted ? T.green : T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              zIndex: 1,
            }}>
              {isCompleted && (
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>{"\u2713"}</span>
              )}
            </div>

            {/* Label + timestamp */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13,
                fontWeight: isCurrent ? 700 : 500,
                color: isCompleted ? T.text : T.textMuted,
                fontFamily: T.font,
              }}>
                {isCurrent ? "\u25CF " : "\u25CB "}{getLabel(step)}
              </div>
              {timestamp && (
                <div style={{
                  fontSize: 11,
                  color: T.textMuted,
                  fontFamily: T.font,
                  marginTop: 2,
                }}>
                  {formatDate(timestamp)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
