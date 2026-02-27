import React, { useState, useMemo } from "react";
import { T, TX_STATUS } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

const MOCK_PURCHASES = [
  {
    id: "tx-p01", shortId: "#ABc34Wkx", status: "paid",
    seller: { name: "EnergyDist GmbH", country: "DE", avatar: "ED" },
    items: [{ name: "Huawei SUN2000-10K-MAP0", qty: 5, price: 1118, image: "/products/huawei-sun2000.jpg" }],
    total: 5590, deliveryCost: 250,
    lastMessage: "Payment confirmed. Preparing shipment.",
    lastMessageAt: "2026-02-23T14:00:00Z",
    createdAt: "2026-02-20T10:00:00Z",
  },
  {
    id: "tx-p02", shortId: "#DE7mN2Lp", status: "shipped",
    seller: { name: "SolarWholesale NL", country: "NL", avatar: "SW" },
    items: [{ name: "Deye BOS-GM5.1", qty: 8, price: 900, image: "/products/deye-hybrid.jpg" }],
    total: 7200, deliveryCost: 180,
    lastMessage: "Shipped via SUNTREX DELIVERY. Tracking: SNTX-NL-10294",
    lastMessageAt: "2026-02-22T11:00:00Z",
    createdAt: "2026-02-18T09:00:00Z",
    tracking: "SNTX-NL-10294",
  },
  {
    id: "tx-p03", shortId: "#GH5kR8Vn", status: "delivered",
    seller: { name: "EnergyDist GmbH", country: "DE", avatar: "ED" },
    items: [{ name: "Huawei LUNA2000-5-E0", qty: 3, price: 1261, image: "/products/huawei-luna.jpg" }],
    total: 3783, deliveryCost: 120,
    lastMessage: "Delivered successfully.",
    lastMessageAt: "2026-02-15T16:00:00Z",
    createdAt: "2026-02-10T08:00:00Z",
  },
  {
    id: "tx-p04", shortId: "#JK2pW5Qm", status: "negotiation",
    seller: { name: "MicroTech DE", country: "DE", avatar: "MT" },
    items: [{ name: "Hoymiles HMS-800", qty: 50, price: 105, image: "/products/enphase-iq8.jpg" }],
    total: 5250, deliveryCost: null,
    lastMessage: "Can you offer a better price for 50 units?",
    lastMessageAt: "2026-02-24T15:30:00Z",
    createdAt: "2026-02-24T14:00:00Z",
    unreadMessages: 1,
  },
];

const FILTER_TABS = [
  { id: "all",          label: "All",           labelFr: "Tout" },
  { id: "negotiation",  label: "Negotiations",  labelFr: "Negociations" },
  { id: "confirmed",    label: "Confirmed",     labelFr: "Confirmees" },
  { id: "paid",         label: "Paid",          labelFr: "Payees" },
  { id: "shipped",      label: "Shipped",       labelFr: "En cours" },
  { id: "delivered",    label: "Delivered",      labelFr: "Livrees" },
];

const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };
const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
};

export default function MyPurchases() {
  const { isMobile } = useResponsive();
  const { navigateToTransaction, lang } = useDashboard();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;

  const filtered = useMemo(() => {
    let result = MOCK_PURCHASES;
    if (activeFilter !== "all") result = result.filter(tx => tx.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx =>
        tx.shortId.toLowerCase().includes(q) ||
        tx.seller.name.toLowerCase().includes(q) ||
        tx.items.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeFilter, searchQuery]);

  return (
    <div>
      <div style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        flexDirection: isMobile ? "column" : "row",
        gap: 12, marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
            {lang === "fr" ? "Mes achats" : "My purchases"}
          </h1>
          <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "4px 0 0" }}>
            {MOCK_PURCHASES.length} transactions
          </p>
        </div>
        <div style={{ position: "relative", width: isMobile ? "100%" : 280 }}>
          <input
            type="text"
            placeholder={lang === "fr" ? "Rechercher..." : "Search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 34px",
              border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
              fontSize: 13, fontFamily: T.font, color: T.text, background: T.card, outline: "none",
            }}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textMuted, pointerEvents: "none" }}>{"\uD83D\uDD0D"}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          const count = tab.id === "all" ? MOCK_PURCHASES.length : MOCK_PURCHASES.filter(tx => tx.status === tab.id).length;
          return (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)} style={{
              background: active ? T.text : T.card, color: active ? "#fff" : T.textSec,
              border: active ? "none" : `1px solid ${T.border}`,
              borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 6, minHeight: 34,
            }}>
              {getLabel(tab)}
              <span style={{ background: active ? "rgba(255,255,255,0.2)" : T.bg, padding: "0 6px", borderRadius: 8, fontSize: 11 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={"\uD83D\uDED2"}
          title={lang === "fr" ? "Aucun achat trouve" : "No purchases found"}
          description={lang === "fr" ? "Explorez le catalogue pour trouver des produits." : "Explore the catalog to find products."}
          actionLabel={lang === "fr" ? "Voir le catalogue" : "Browse catalog"}
          onAction={() => { window.location.href = "/catalog"; }}
        />
      ) : (
        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {filtered.map((tx, idx) => (
            <div
              key={tx.id}
              onClick={() => navigateToTransaction(tx.id)}
              onMouseEnter={() => setHoveredRow(tx.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 10 : 16,
                padding: isMobile ? 14 : "14px 20px",
                borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
                cursor: "pointer",
                background: hoveredRow === tx.id ? T.bg : "transparent",
                transition: T.transitionFast,
              }}
              role="button" tabIndex={0}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: TX_STATUS[tx.status]?.color || T.textMuted }} />
                <div style={{ width: 48, height: 48, borderRadius: T.radiusSm, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={tx.items[0]?.image} alt={tx.items[0]?.name} style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "\uD83D\uDCE6"; }} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font }}>{tx.shortId}</span>
                  <StatusBadge status={tx.status} size="sm" lang={lang} />
                  {tx.unreadMessages > 0 && <span style={{ background: T.accent, color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{tx.unreadMessages}</span>}
                </div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tx.items[0]?.name}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
                  {FLAG_EMOJI[tx.seller.country] || ""} {tx.seller.name}
                </div>
              </div>
              <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0, display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "flex-end", gap: isMobile ? 12 : 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.font }}>{formatPrice(tx.total)}</span>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>{timeAgo(tx.lastMessageAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
