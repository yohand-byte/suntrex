import React, { useState, useMemo } from "react";
import { T, TX_STATUS } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";

// ── Mock conversations ─────────────────────────────────────────────
const MOCK_CONVERSATIONS = [
  {
    id: "conv-1",
    transactionId: "ST-2847",
    counterpart: { name: "QUALIWATT Distribution", country: "FR", flag: "🇫🇷", avatar: "Q" },
    product: "Huawei SUN2000-10KTL-M1",
    status: "negotiation",
    lastMessage: {
      content: "Bonjour, pourriez-vous confirmer le délai de livraison pour 25 unités ?",
      sender: "buyer",
      createdAt: "2026-03-01T09:15:00Z",
    },
    unread: 2,
    updatedAt: "2026-03-01T09:15:00Z",
  },
  {
    id: "conv-2",
    transactionId: "ST-2843",
    counterpart: { name: "SolarMax DE GmbH", country: "DE", flag: "🇩🇪", avatar: "S" },
    product: "Huawei LUNA2000-15-S0",
    status: "confirmed",
    lastMessage: {
      content: "Parfait, la commande est confirmée. Expédition prévue lundi.",
      sender: "seller",
      createdAt: "2026-02-28T16:42:00Z",
    },
    unread: 0,
    updatedAt: "2026-02-28T16:42:00Z",
  },
  {
    id: "conv-3",
    transactionId: "ST-2839",
    counterpart: { name: "EnergyParts NL", country: "NL", flag: "🇳🇱", avatar: "E" },
    product: "Deye SUN-12K-SG04LP3",
    status: "paid",
    lastMessage: {
      content: "Merci pour votre paiement ! Le colis sera préparé sous 24h.",
      sender: "seller",
      createdAt: "2026-02-27T11:30:00Z",
    },
    unread: 1,
    updatedAt: "2026-02-27T11:30:00Z",
  },
  {
    id: "conv-4",
    transactionId: "ST-2835",
    counterpart: { name: "IberSol España", country: "ES", flag: "🇪🇸", avatar: "I" },
    product: "Hoymiles HMS-2000-4T",
    status: "shipped",
    lastMessage: {
      content: "Le numéro de suivi est disponible : SNTRX-2835-FR. Livraison estimée jeudi.",
      sender: "system",
      createdAt: "2026-02-26T14:20:00Z",
    },
    unread: 0,
    updatedAt: "2026-02-26T14:20:00Z",
  },
  {
    id: "conv-5",
    transactionId: "ST-2831",
    counterpart: { name: "BelgSolar BVBA", country: "BE", flag: "🇧🇪", avatar: "B" },
    product: "Huawei SUN2000-5KTL-L1",
    status: "delivered",
    lastMessage: {
      content: "Colis réceptionné en bon état. Merci beaucoup !",
      sender: "buyer",
      createdAt: "2026-02-24T10:05:00Z",
    },
    unread: 0,
    updatedAt: "2026-02-24T10:05:00Z",
  },
  {
    id: "conv-6",
    transactionId: "ST-2828",
    counterpart: { name: "SunTech Italia", country: "IT", flag: "🇮🇹", avatar: "T" },
    product: "Huawei EMMA-A02",
    status: "disputed",
    lastMessage: {
      content: "Un litige a été ouvert : produit non conforme à la description.",
      sender: "system",
      createdAt: "2026-02-23T17:50:00Z",
    },
    unread: 3,
    updatedAt: "2026-02-23T17:50:00Z",
  },
];

const FILTERS = [
  { id: "all", label: "Tous", labelFr: "Tous" },
  { id: "unread", label: "Unread", labelFr: "Non lus" },
  { id: "negotiation", label: "Negotiation", labelFr: "Négociation" },
  { id: "confirmed", label: "Confirmed", labelFr: "Confirmé" },
  { id: "shipped", label: "Shipped", labelFr: "En cours" },
  { id: "disputed", label: "Disputed", labelFr: "Litige" },
];

function timeAgo(dateStr, lang) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return lang === "fr" ? "à l'instant" : "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return lang === "fr" ? "hier" : "yesterday";
  if (days < 7) return `${days}j`;
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" }).format(d);
}

export default function MessagingInbox() {
  const { isMobile } = useResponsive();
  const { lang, navigateToTransaction } = useDashboard();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const totalUnread = MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread, 0);

  const filtered = useMemo(() => {
    let items = [...MOCK_CONVERSATIONS];
    if (filter === "unread") items = items.filter(c => c.unread > 0);
    else if (filter !== "all") items = items.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c =>
        c.counterpart.name.toLowerCase().includes(q) ||
        c.product.toLowerCase().includes(q) ||
        c.transactionId.toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [filter, search]);

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 12 : 0,
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
            {lang === "fr" ? "Messagerie" : "Messages"}
            {totalUnread > 0 && (
              <span style={{
                background: T.red, color: "#fff", borderRadius: 99,
                padding: "2px 8px", fontSize: 12, fontWeight: 700,
                marginLeft: 10, verticalAlign: "middle",
              }}>{totalUnread}</span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted, fontFamily: T.font, margin: "4px 0 0" }}>
            {lang === "fr"
              ? `${MOCK_CONVERSATIONS.length} conversations · ${totalUnread} non lu${totalUnread > 1 ? "s" : ""}`
              : `${MOCK_CONVERSATIONS.length} conversations · ${totalUnread} unread`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === "fr" ? "Rechercher une conversation, un produit, un numéro…" : "Search conversations, products, numbers…"}
          style={{
            width: "100%", padding: "10px 14px 10px 38px",
            border: `1px solid ${T.border}`, borderRadius: T.radius,
            fontSize: 13, fontFamily: T.font, color: T.text,
            background: T.card, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = T.accent}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: T.textMuted }}>🔍</span>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 20,
        overflowX: "auto", paddingBottom: 4,
      }}>
        {FILTERS.map(f => {
          const isActive = filter === f.id;
          const count = f.id === "all" ? MOCK_CONVERSATIONS.length
            : f.id === "unread" ? MOCK_CONVERSATIONS.filter(c => c.unread > 0).length
            : MOCK_CONVERSATIONS.filter(c => c.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 14px", borderRadius: 99,
                border: `1px solid ${isActive ? T.accent : T.border}`,
                background: isActive ? T.accentLight : T.card,
                color: isActive ? T.accent : T.textSec,
                fontSize: 12, fontWeight: isActive ? 600 : 500,
                cursor: "pointer", fontFamily: T.font,
                whiteSpace: "nowrap",
                transition: T.transitionFast,
              }}
            >
              {lang === "fr" ? f.labelFr : f.label}
              {count > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Conversation list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💬"
          title={lang === "fr" ? "Aucune conversation" : "No conversations"}
          subtitle={lang === "fr" ? "Vos échanges avec les acheteurs et vendeurs apparaîtront ici." : "Your exchanges with buyers and sellers will appear here."}
        />
      ) : (
        <div style={{
          background: T.card,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          overflow: "hidden",
        }}>
          {filtered.map((conv, i) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              lang={lang}
              isMobile={isMobile}
              isLast={i === filtered.length - 1}
              onClick={() => navigateToTransaction?.(conv.transactionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Conversation row ───────────────────────────────────────────────
function ConversationRow({ conv, lang, isMobile, isLast, onClick }) {
  const [hovered, setHovered] = useState(false);
  const status = TX_STATUS[conv.status] || TX_STATUS.negotiation;
  const hasUnread = conv.unread > 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 10 : 14,
        padding: isMobile ? "12px 14px" : "14px 20px",
        borderBottom: isLast ? "none" : `1px solid ${T.borderLight}`,
        background: hovered ? T.bg : (hasUnread ? "#fffdf8" : T.card),
        cursor: "pointer",
        transition: T.transitionFast,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: "50%",
        background: hasUnread ? T.accent : T.bg,
        color: hasUnread ? "#fff" : T.textSec,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, fontFamily: T.font,
        flexShrink: 0,
        border: hasUnread ? "none" : `1px solid ${T.border}`,
      }}>
        {conv.counterpart.avatar}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: name + time */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 2,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            overflow: "hidden",
          }}>
            <span style={{
              fontSize: 13, fontWeight: hasUnread ? 700 : 600,
              color: T.text, fontFamily: T.font,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {conv.counterpart.flag} {conv.counterpart.name}
            </span>
            {!isMobile && (
              <span style={{
                fontSize: 11, color: T.textMuted, fontFamily: T.font,
              }}>
                · {conv.transactionId}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11, color: hasUnread ? T.accent : T.textMuted,
            fontWeight: hasUnread ? 600 : 400,
            fontFamily: T.font, flexShrink: 0, marginLeft: 8,
          }}>
            {timeAgo(conv.updatedAt, lang)}
          </span>
        </div>

        {/* Product name */}
        <div style={{
          fontSize: 12, color: T.textSec, fontFamily: T.font,
          marginBottom: 3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {conv.product}
        </div>

        {/* Last message preview */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8,
        }}>
          <div style={{
            fontSize: 12,
            color: hasUnread ? T.text : T.textMuted,
            fontWeight: hasUnread ? 500 : 400,
            fontFamily: T.font,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            flex: 1,
          }}>
            {conv.lastMessage.sender === "system" ? "🔔 " : ""}
            {conv.lastMessage.content}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Status pill */}
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: status.text, background: status.bg,
              padding: "2px 8px", borderRadius: 99,
              fontFamily: T.font, whiteSpace: "nowrap",
            }}>
              {status.icon} {lang === "fr" ? status.labelFr : status.label}
            </span>

            {/* Unread badge */}
            {hasUnread && (
              <span style={{
                background: T.accent, color: "#fff",
                borderRadius: 99, minWidth: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, fontFamily: T.font,
              }}>
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
