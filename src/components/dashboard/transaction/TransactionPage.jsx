import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";
import TransactionProducts from "./TransactionProducts";
import TransactionChat from "./TransactionChat";
import TransactionDetails from "./TransactionDetails";

// ── Mock transaction data ──────────────────────────────────────────
const MOCK_TX = {
  id: "tx-001",
  shortId: "#FHJ46JUm",
  status: "negotiation",
  createdAt: "2026-02-24T23:50:00Z",
  confirmedAt: null,
  paidAt: null,
  shippedAt: null,
  deliveredAt: null,
  deliveryCost: null,
  incoterms: "Delivery on premise",
  items: [
    {
      id: "item-1",
      name: "Huawei SUN2000-30KTL-M3",
      sku: "CEM6k",
      qty: 1,
      price: 1555,
      editedPrice: null,
      editedQty: null,
      vatRate: 0,
      availability: 4,
      shipDays: 3,
      image: "/products/huawei-sun2000.jpg",
    },
  ],
  buyer: {
    name: "SolarPro France",
    companyName: "QUALIWATT",
    country: "NL",
    avatar: "QW",
    address: "16-18 rue Eiffel, 77220 Gretz-Armainvilliers",
    deliveryAddress: "NL, 24** **",
    vatVerified: true,
    vatVerifiedAt: "2026-02-24",
    stats: { completedTx: 0, activeOffers: 0 },
  },
  seller: {
    name: "EnergyDist GmbH",
    companyName: "EnergyDist GmbH",
    country: "DE",
    avatar: "ED",
    address: "Industriestr. 42, 80339 Munchen",
    vatVerified: true,
    stats: {
      completedTx: 11,
      activeOffers: 52,
      memberSince: "2025-12-09",
      rating: 5.0,
      reviewCount: 3,
      responseTime: "< 2h",
    },
  },
};

// Map of mock transactions by ID
const MOCK_TX_MAP = {
  "tx-001": MOCK_TX,
  "tx-002": { ...MOCK_TX, id: "tx-002", shortId: "#KM8p2Rxt", status: "confirmed", confirmedAt: "2026-02-23T14:20:00Z", deliveryCost: 180, items: [{ ...MOCK_TX.items[0], id: "item-2", name: "Deye SUN-12K-SG04LP3-EU", sku: "DEY12K", qty: 3, price: 1250 }], buyer: { ...MOCK_TX.buyer, name: "GreenBuild BE", companyName: "GreenBuild BVBA", country: "BE", avatar: "GB" } },
  "tx-003": { ...MOCK_TX, id: "tx-003", shortId: "#QW3nY7Lk", status: "paid", confirmedAt: "2026-02-21T10:00:00Z", paidAt: "2026-02-22T09:15:00Z", deliveryCost: 320, items: [{ ...MOCK_TX.items[0], id: "item-3", name: "Enphase IQ8-HC Micro-Inverter", sku: "IQ8HC", qty: 50, price: 85 }], buyer: { ...MOCK_TX.buyer, name: "InstallSol ES", companyName: "InstallSol SL", country: "ES", avatar: "IS" } },
  "tx-004": { ...MOCK_TX, id: "tx-004", shortId: "#RT5mD9Vx", status: "cancelled", cancelledBy: "seller", cancelReason: "Stock insuffisant", deliveryCost: null, items: [{ ...MOCK_TX.items[0], id: "item-4", name: "Huawei LUNA2000-5-E0", sku: "LUNA5E", qty: 5, price: 1261 }], buyer: { ...MOCK_TX.buyer, name: "SolarMax NL", companyName: "SolarMax BV", country: "NL", avatar: "SM" } },
  "tx-005": { ...MOCK_TX, id: "tx-005", shortId: "#BN2kH8Wp", status: "delivered", confirmedAt: "2026-02-11T10:00:00Z", paidAt: "2026-02-12T09:00:00Z", shippedAt: "2026-02-14T08:00:00Z", deliveredAt: "2026-02-18T16:30:00Z", deliveryCost: 95, items: [{ ...MOCK_TX.items[0], id: "item-5", name: "ESDEC ClickFit EVO", sku: "ESDEC", qty: 200, price: 2.33 }], buyer: { ...MOCK_TX.buyer, name: "MountingPro IT", companyName: "MountingPro SRL", country: "IT", avatar: "MP" } },
};

export default function TransactionPage({ transactionId: propTxId }) {
  const { isMobile, isTablet } = useResponsive();
  const { transactionId: ctxTxId, setActiveSection, user, lang } = useDashboard();
  const txId = propTxId || ctxTxId || "tx-001";

  const [tx, setTx] = useState(MOCK_TX_MAP[txId] || MOCK_TX);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Determine role (demo: always seller; in production, compare user.id with tx.buyer_id/seller_id)
  const role = "seller";

  const handleUpdatePrice = (itemId, newPrice) => {
    setTx(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, editedPrice: newPrice } : i),
    }));
  };

  const handleUpdateQty = (itemId, newQty) => {
    setTx(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, editedQty: newQty } : i),
    }));
  };

  const handleEditDeliveryCost = (cost) => {
    setTx(prev => ({ ...prev, deliveryCost: cost }));
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) return;
    setTx(prev => ({
      ...prev,
      status: "cancelled",
      cancelledBy: role,
      cancelReason: cancelReason.trim(),
    }));
    setShowCancelModal(false);
    setCancelReason("");
  };

  const handleGoBack = () => {
    setActiveSection("sales");
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
        fontSize: 13,
        color: T.textMuted,
        fontFamily: T.font,
      }}>
        <button
          onClick={handleGoBack}
          style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 500, padding: 0 }}
        >
          {lang === "fr" ? "Mes ventes" : "My sales"}
        </button>
        <span>{"\u203A"}</span>
        <span>{lang === "fr" ? "Transactions" : "Transactions"}</span>
        <span>{"\u203A"}</span>
        <span style={{ color: T.text, fontWeight: 600 }}>Transaction {tx.shortId}</span>
      </div>

      {/* Header actions */}
      <div style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        flexDirection: isMobile ? "column" : "row",
        gap: 12,
        marginBottom: 20,
      }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
          Transaction {tx.shortId}
        </h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {role === "seller" && tx.status === "negotiation" && (
            <button
              style={{
                background: T.card, color: T.accent,
                border: `1px solid ${T.accent}`,
                borderRadius: T.radiusSm,
                padding: "8px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: T.font,
                display: "flex", alignItems: "center", gap: 6,
                minHeight: 40,
              }}
            >
              {"\u2795"} {lang === "fr" ? "Ajouter des produits" : "Add products"}
            </button>
          )}
          {tx.status !== "cancelled" && tx.status !== "delivered" && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                background: T.card, color: T.red,
                border: `1px solid ${T.red}40`,
                borderRadius: T.radiusSm,
                padding: "8px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: T.font,
                display: "flex", alignItems: "center", gap: 6,
                minHeight: 40,
              }}
            >
              {"\u2715"} {lang === "fr" ? "Annuler la transaction" : "Cancel transaction"}
            </button>
          )}
        </div>
      </div>

      {/* Secure payment banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: T.greenBg,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.green}20`,
        marginBottom: 16,
        fontSize: 13,
        color: T.greenText,
        fontFamily: T.font,
        fontWeight: 500,
      }}>
        <span style={{ fontSize: 16 }}>{"\uD83D\uDEE1\uFE0F"}</span>
        {lang === "fr"
          ? "Des paiements securises sont disponibles via SUNTREX"
          : "Secure payments are available via SUNTREX"}
      </div>

      {/* Buyer/Seller company banner */}
      <div style={{
        padding: "10px 16px",
        background: T.card,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.border}`,
        marginBottom: 16,
        fontSize: 13,
        color: T.text,
        fontFamily: T.font,
        fontWeight: 500,
      }}>
        {tx.buyer.companyName}, {tx.buyer.address}
      </div>

      {/* Products card */}
      <div style={{ marginBottom: 20 }}>
        <TransactionProducts
          items={tx.items}
          role={role}
          onUpdatePrice={handleUpdatePrice}
          onUpdateQty={handleUpdateQty}
          incoterms={tx.incoterms}
          deliveryCost={tx.deliveryCost}
          onEditDeliveryCost={handleEditDeliveryCost}
          lang={lang}
        />
      </div>

      {/* Add products expandable (seller) */}
      {role === "seller" && tx.status === "negotiation" && (
        <div style={{
          padding: "12px 16px",
          background: T.card,
          borderRadius: T.radiusSm,
          border: `1px solid ${T.border}`,
          marginBottom: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, color: T.accent, fontWeight: 600, fontFamily: T.font, display: "flex", alignItems: "center", gap: 6 }}>
            {"\u2795"} {lang === "fr" ? "Ajouter des produits de votre liste" : "Add products from your list"}
          </span>
          <span style={{ fontSize: 12, color: T.textMuted }}>{"\u25BC"}</span>
        </div>
      )}

      {/* Chat */}
      <div style={{ marginBottom: 20 }}>
        <TransactionChat
          role={role}
          transactionId={tx.id}
          lang={lang}
        />
      </div>

      {/* Attachments section */}
      <div style={{
        padding: "14px 20px",
        background: T.card,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        marginBottom: 20,
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>
          {lang === "fr" ? "Autres pieces jointes" : "Other attachments"}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            background: T.accent, color: "#fff",
            border: "none", borderRadius: T.radiusSm,
            padding: "8px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
          }}>
            {lang === "fr" ? "Ajouter fichiers" : "Add files"}
          </button>
          <button style={{
            background: T.card, color: T.textSec,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm,
            padding: "8px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
          }}>
            {lang === "fr" ? "Rechercher" : "Search"}
          </button>
        </div>
      </div>

      {/* Support contact bar */}
      <div style={{
        padding: "12px 20px",
        background: T.bg,
        borderRadius: T.radiusSm,
        border: `1px solid ${T.border}`,
        marginBottom: 20,
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 12,
        color: T.textSec,
        fontFamily: T.font,
      }}>
        <span>
          {lang === "fr" ? "Contact assistance SUNTREX" : "SUNTREX Support Contact"} {" \u2022 "}
          <span style={{ color: T.accent }}>contact@suntrex.com</span>
        </span>
        <button style={{
          background: "none",
          border: `1px solid ${T.red}40`,
          borderRadius: T.radiusSm,
          padding: "6px 12px",
          fontSize: 12, fontWeight: 600,
          color: T.red,
          cursor: "pointer", fontFamily: T.font,
        }}>
          {lang === "fr" ? "Signaler" : "Report"}
        </button>
      </div>

      {/* Details panels */}
      <TransactionDetails
        transaction={tx}
        role={role}
        lang={lang}
      />

      {/* Cancel modal */}
      {showCancelModal && (
        <>
          <div
            onClick={() => setShowCancelModal(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }}
          />
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "90%" : 440,
            background: T.card,
            borderRadius: T.radiusLg,
            padding: 24,
            zIndex: 1001,
            boxShadow: T.shadowLg,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 12px" }}>
              {lang === "fr" ? "Annuler la transaction" : "Cancel transaction"}
            </h3>
            <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "0 0 16px", lineHeight: 1.5 }}>
              {lang === "fr"
                ? "Veuillez indiquer la raison de l'annulation. Cette information sera partagee avec l'autre partie."
                : "Please provide a reason for cancellation. This will be shared with the other party."}
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={lang === "fr" ? "Raison de l'annulation..." : "Cancellation reason..."}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${T.border}`,
                borderRadius: T.radiusSm,
                fontSize: 13,
                fontFamily: T.font,
                color: T.text,
                resize: "vertical",
                outline: "none",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  background: T.card, color: T.textSec,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  padding: "8px 20px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: T.font,
                }}
              >
                {lang === "fr" ? "Retour" : "Back"}
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                style={{
                  background: cancelReason.trim() ? T.red : T.border,
                  color: "#fff",
                  border: "none",
                  borderRadius: T.radiusSm,
                  padding: "8px 20px", fontSize: 13, fontWeight: 600,
                  cursor: cancelReason.trim() ? "pointer" : "not-allowed",
                  fontFamily: T.font,
                }}
              >
                {lang === "fr" ? "Confirmer l'annulation" : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
