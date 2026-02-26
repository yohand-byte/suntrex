import React, { useState, useMemo } from "react";
import { T, TX_STATUS } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

// ── Mock transactions for demo ─────────────────────────────────────
const MOCK_TRANSACTIONS = [
  {
    id: "tx-001", shortId: "#FHJ46JUm", status: "negotiation",
    buyer: { name: "SolarPro France", country: "FR", avatar: "SP" },
    items: [{ name: "Huawei SUN2000-30KTL-M3", qty: 1, price: 1555, image: "/products/huawei-sun2000.jpg" }],
    total: 1555, deliveryCost: null,
    lastMessage: "Bonjour, je suis interesse par l'achat d'un Huawei SUN2000-30KTL-M3...",
    lastMessageAt: "2026-02-24T23:50:00Z",
    createdAt: "2026-02-24T23:50:00Z",
    unreadMessages: 1,
  },
  {
    id: "tx-002", shortId: "#KM8p2Rxt", status: "confirmed",
    buyer: { name: "GreenBuild BE", country: "BE", avatar: "GB" },
    items: [{ name: "Deye SUN-12K-SG04LP3-EU", qty: 3, price: 1250, image: "/products/deye-hybrid.jpg" }],
    total: 3750, deliveryCost: 180,
    lastMessage: "Merci, l'offre est acceptee. Je procede au paiement.",
    lastMessageAt: "2026-02-23T14:20:00Z",
    createdAt: "2026-02-22T10:00:00Z",
    unreadMessages: 0,
  },
  {
    id: "tx-003", shortId: "#QW3nY7Lk", status: "paid",
    buyer: { name: "InstallSol ES", country: "ES", avatar: "IS" },
    items: [{ name: "Enphase IQ8-HC Micro-Inverter", qty: 50, price: 85, image: "/products/enphase-iq8.jpg" }],
    total: 4250, deliveryCost: 320,
    lastMessage: "Payment received. When will you ship?",
    lastMessageAt: "2026-02-22T09:15:00Z",
    createdAt: "2026-02-20T16:00:00Z",
    unreadMessages: 2,
  },
  {
    id: "tx-004", shortId: "#RT5mD9Vx", status: "cancelled",
    buyer: { name: "SolarMax NL", country: "NL", avatar: "SM" },
    items: [{ name: "Huawei LUNA2000-5-E0", qty: 5, price: 1261, image: "/products/huawei-luna.jpg" }],
    total: 6305, deliveryCost: null,
    lastMessage: "Annulation: stock insuffisant",
    lastMessageAt: "2026-02-21T11:00:00Z",
    createdAt: "2026-02-19T08:30:00Z",
    cancelledBy: "seller", cancelReason: "Stock insuffisant",
    unreadMessages: 0,
  },
  {
    id: "tx-005", shortId: "#BN2kH8Wp", status: "delivered",
    buyer: { name: "MountingPro IT", country: "IT", avatar: "MP" },
    items: [{ name: "ESDEC ClickFit EVO", qty: 200, price: 2.33, image: "/products/esdec-clickfit.jpg" }],
    total: 466, deliveryCost: 95,
    lastMessage: "Bien recu, merci !",
    lastMessageAt: "2026-02-18T16:30:00Z",
    createdAt: "2026-02-10T09:00:00Z",
    unreadMessages: 0,
  },
];

// ── Filter tabs ────────────────────────────────────────────────────
const FILTER_TABS = [
  { id: "all",          label: "All",           labelFr: "Tout" },
  { id: "negotiation",  label: "Negotiations",  labelFr: "Negociations" },
  { id: "confirmed",    label: "Confirmed",     labelFr: "Confirmees" },
  { id: "paid",         label: "Paid",          labelFr: "Payees" },
  { id: "shipped",      label: "Shipped",       labelFr: "Expediees" },
  { id: "delivered",    label: "Delivered",      labelFr: "Livrees" },
  { id: "cancelled",    label: "Cancelled",     labelFr: "Annulees" },
];

const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };

const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}j`;
};

export default function MySales() {
  const { isMobile } = useResponsive();
  const { navigateToTransaction, lang } = useDashboard();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;

  const filtered = useMemo(() => {
    let result = MOCK_TRANSACTIONS;
    if (activeFilter !== "all") {
      result = result.filter(tx => tx.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx =>
        tx.shortId.toLowerCase().includes(q) ||
        tx.buyer.name.toLowerCase().includes(q) ||
        tx.items.some(i => i.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeFilter, searchQuery]);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        flexDirection: isMobile ? "column" : "row",
        gap: 12,
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
            {lang === "fr" ? "Mes ventes" : "My sales"}
          </h1>
          <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "4px 0 0" }}>
            {lang === "fr" ? `${MOCK_TRANSACTIONS.length} transactions` : `${MOCK_TRANSACTIONS.length} transactions`}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: isMobile ? "100%" : 280 }}>
          <input
            type="text"
            placeholder={lang === "fr" ? "Rechercher par ID, acheteur, produit..." : "Search by ID, buyer, product..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusSm,
              fontSize: 13,
              fontFamily: T.font,
              color: T.text,
              background: T.card,
              outline: "none",
            }}
            aria-label={lang === "fr" ? "Rechercher des transactions" : "Search transactions"}
          />
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textMuted, pointerEvents: "none" }}>
            {"\uD83D\uDD0D"}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        overflowX: "auto",
        paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
      }}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          const count = tab.id === "all"
            ? MOCK_TRANSACTIONS.length
            : MOCK_TRANSACTIONS.filter(tx => tx.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                background: active ? T.text : T.card,
                color: active ? "#fff" : T.textSec,
                border: active ? "none" : `1px solid ${T.border}`,
                borderRadius: 99,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: T.font,
                whiteSpace: "nowrap",
                transition: T.transitionFast,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: 34,
              }}
            >
              {getLabel(tab)}
              <span style={{
                background: active ? "rgba(255,255,255,0.2)" : T.bg,
                padding: "0 6px",
                borderRadius: 8,
                fontSize: 11,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={"\uD83D\uDCE6"}
          title={lang === "fr" ? "Aucune transaction trouvee" : "No transactions found"}
          description={lang === "fr"
            ? "Aucune transaction ne correspond a vos criteres de recherche."
            : "No transactions match your search criteria."}
        />
      ) : (
        <div style={{
          background: T.card,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}>
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
                padding: isMobile ? "14px 14px" : "14px 20px",
                borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
                cursor: "pointer",
                background: hoveredRow === tx.id ? T.bg : "transparent",
                transition: T.transitionFast,
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") navigateToTransaction(tx.id); }}
              aria-label={`Transaction ${tx.shortId}`}
            >
              {/* Status dot + product image */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: TX_STATUS[tx.status]?.color || T.textMuted,
                  flexShrink: 0,
                }} />
                <div style={{
                  width: 48, height: 48, borderRadius: T.radiusSm,
                  background: T.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  <img
                    src={tx.items[0]?.image}
                    alt={tx.items[0]?.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "\uD83D\uDCE6"; }}
                  />
                </div>
              </div>

              {/* Main info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font }}>
                    {tx.shortId}
                  </span>
                  <StatusBadge status={tx.status} size="sm" lang={lang} />
                  {tx.unreadMessages > 0 && (
                    <span style={{
                      background: T.accent, color: "#fff",
                      borderRadius: 99, padding: "1px 6px",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {tx.unreadMessages}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tx.items[0]?.name} {tx.items.length > 1 ? `(+${tx.items.length - 1})` : ""}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
                  {FLAG_EMOJI[tx.buyer.country] || ""} {tx.buyer.name}
                </div>
              </div>

              {/* Right side: price + time */}
              <div style={{
                textAlign: isMobile ? "left" : "right",
                flexShrink: 0,
                display: "flex",
                flexDirection: isMobile ? "row" : "column",
                alignItems: isMobile ? "center" : "flex-end",
                gap: isMobile ? 12 : 2,
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.font }}>
                  {formatPrice(tx.total)}
                </span>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>
                  {timeAgo(tx.lastMessageAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
