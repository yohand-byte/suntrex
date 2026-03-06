import { useState, useEffect, useCallback } from "react";
import useResponsive from "../../hooks/useResponsive";

const API_URL = import.meta.env.VITE_API_URL || "";

const ESCROW_STEPS = [
  { key: "paid", label: "Paye", labelEn: "Paid", icon: "💳" },
  { key: "shipped", label: "Expedie", labelEn: "Shipped", icon: "📦" },
  { key: "delivered", label: "Livre", labelEn: "Delivered", icon: "🚛" },
  { key: "released", label: "Fonds liberes", labelEn: "Funds Released", icon: "✅" },
];

const STATUS_CONFIG = {
  held: { color: "#E8700A", bg: "#fff7ed", label: "Fonds securises", labelEn: "Funds Secured" },
  released: { color: "#10b981", bg: "#ecfdf5", label: "Fonds liberes", labelEn: "Funds Released" },
  disputed: { color: "#ef4444", bg: "#fef2f2", label: "Litige en cours", labelEn: "Dispute In Progress" },
  pending: { color: "#6b7280", bg: "#f9fafb", label: "En attente", labelEn: "Pending" },
};

function getStepIndex(order) {
  if (!order) return 0;
  if (order.escrowStatus === "released" || order.status === "COMPLETED") return 3;
  if (order.deliveredAt) return 2;
  if (order.shippedAt) return 1;
  if (order.paidAt || order.escrowStatus === "held") return 0;
  return 0;
}

function getDaysRemaining(escrowHeldAt) {
  if (!escrowHeldAt) return null;
  const held = new Date(escrowHeldAt);
  const autoRelease = new Date(held.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.ceil((autoRelease - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function EscrowStatus({ order, currentUser, onUpdate }) {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  if (!order) return null;

  const status = STATUS_CONFIG[order.escrowStatus] || STATUS_CONFIG.pending;
  const stepIndex = getStepIndex(order);
  const isBuyer = currentUser?.id === order.buyerId;
  const daysRemaining = getDaysRemaining(order.escrowHeldAt);
  const canRelease = isBuyer && order.escrowStatus === "held" && stepIndex >= 2;
  const canDispute = isBuyer && order.escrowStatus === "held";

  const callEscrow = useCallback(async (action, body = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = (await (await import("../../lib/supabase")).supabase?.auth.getSession())?.data?.session?.access_token;
      const res = await fetch(`${API_URL}/api/escrow/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id, ...body }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
      if (onUpdate) onUpdate(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [order.id, onUpdate]);

  const pad = isMobile ? 16 : 24;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: `${pad}px`, borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔒</span>
            <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: "#1e293b" }}>Escrow SUNTREX</span>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: status.color, background: status.bg,
            padding: "4px 12px", borderRadius: 20, letterSpacing: "0.02em",
          }}>
            {status.label}
          </span>
        </div>
        {daysRemaining !== null && order.escrowStatus === "held" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
            Auto-release dans {daysRemaining} jour{daysRemaining !== 1 ? "s" : ""} si aucun litige
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div style={{ padding: `${pad}px`, display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 12 : 0, flexDirection: isMobile ? "column" : "row" }}>
        {ESCROW_STEPS.map((step, i) => {
          const active = i <= stepIndex;
          const current = i === stepIndex;
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", flex: isMobile ? "none" : 1, gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? (current ? "#E8700A" : "#10b981") : "#f1f5f9",
                color: active ? "#fff" : "#94a3b8", fontSize: 16, fontWeight: 700, flexShrink: 0,
                border: current ? "2px solid #E8700A" : "2px solid transparent",
                boxShadow: current ? "0 0 0 4px rgba(232,112,10,0.15)" : "none",
              }}>
                {active ? step.icon : (i + 1)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#1e293b" : "#94a3b8" }}>{step.label}</div>
              </div>
              {!isMobile && i < ESCROW_STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < stepIndex ? "#10b981" : "#e2e8f0", margin: "0 8px", borderRadius: 1 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Buyer Actions */}
      {isBuyer && order.escrowStatus !== "released" && (
        <div style={{ padding: `0 ${pad}px ${pad}px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
          {canRelease && (
            <button
              onClick={() => callEscrow("release")}
              disabled={loading}
              style={{
                flex: 1, padding: "12px 20px", borderRadius: 8, border: "none", cursor: loading ? "wait" : "pointer",
                background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "..." : "Confirmer reception — Liberer les fonds"}
            </button>
          )}
          {canDispute && !showDispute && (
            <button
              onClick={() => setShowDispute(true)}
              style={{
                flex: canRelease ? "none" : 1, padding: "12px 20px", borderRadius: 8, border: "1px solid #ef4444",
                background: "#fff", color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Signaler un probleme
            </button>
          )}
        </div>
      )}

      {/* Dispute Form */}
      {showDispute && (
        <div style={{ padding: `0 ${pad}px ${pad}px` }}>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Decrivez le probleme..."
            style={{
              width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "vertical", marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { callEscrow("dispute", { reason: disputeReason }); setShowDispute(false); }}
              disabled={loading}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Confirmer le litige
            </button>
            <button
              onClick={() => setShowDispute(false)}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b",
                fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: `0 ${pad}px ${pad}px`, fontSize: 12, color: "#ef4444" }}>
          Erreur : {error}
        </div>
      )}
    </div>
  );
}
