import React, { useState, useRef, useEffect } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";

const formatDate = (d) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));

// ── Mock chat messages ─────────────────────────────────────────────
const MOCK_MESSAGES = [
  {
    id: "msg-1",
    senderRole: "system",
    content: "Transaction creee. Le chat de negociation est ouvert.",
    createdAt: "2026-02-24T23:49:00Z",
  },
  {
    id: "msg-2",
    senderRole: "buyer",
    senderName: "SolarPro France",
    content: "Bonjour, je suis interesse par l'achat d'un Huawei SUN2000-30KTL-M3 chez vous. Pourriez-vous me confirmer la disponibilite et le delai de livraison vers la France ?",
    hasAddressCard: true,
    addressCountry: "Netherlands",
    addressZip: "24** **",
    createdAt: "2026-02-24T23:50:00Z",
    originalLang: "nl",
    contentOriginal: "Hallo, ik ben geinteresseerd in de aankoop van een Huawei SUN2000-30KTL-M3 bij u. Kunt u de beschikbaarheid en levertijd naar Frankrijk bevestigen?",
  },
  {
    id: "msg-3",
    senderRole: "system",
    content: "L'offre est valable 3 jours ouvrables.",
    icon: "\u23F0",
    createdAt: "2026-02-24T23:50:01Z",
  },
];

export default function TransactionChat({ messages: propMessages, role, transactionId, onSendMessage, lang = "fr" }) {
  const { isMobile } = useResponsive();
  const [messages, setMessages] = useState(propMessages || MOCK_MESSAGES);
  const [draft, setDraft] = useState("");
  const [showTranslation, setShowTranslation] = useState({});
  const [autoTranslate, setAutoTranslate] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderRole: role,
      senderName: role === "seller" ? "You" : "You",
      content: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    onSendMessage?.(draft.trim());
    setDraft("");
    inputRef.current?.focus();
  };

  const toggleTranslation = (msgId) => {
    setShowTranslation(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const isSeller = role === "seller";

  return (
    <div style={{
      background: T.card,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Translation banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        background: T.blueBg,
        borderBottom: `1px solid ${T.blue}20`,
        fontSize: 12,
        color: T.blueText,
        fontFamily: T.font,
        fontWeight: 500,
      }}>
        <span style={{ fontSize: 16 }}>{"\uD83C\uDF10"}</span>
        {lang === "fr"
          ? "Cette negociation est automatiquement traduite en chat"
          : "This negotiation is automatically translated in chat"}
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: isMobile ? 12 : 20,
        maxHeight: 500,
        minHeight: 200,
      }}>
        {messages.map((msg) => {
          if (msg.senderRole === "system") {
            return (
              <SystemMessage key={msg.id} msg={msg} />
            );
          }

          const isOwn = msg.senderRole === role;
          return (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isOwn={isOwn}
              isMobile={isMobile}
              showOriginal={showTranslation[msg.id]}
              onToggleTranslation={() => toggleTranslation(msg.id)}
              lang={lang}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Delivery cost CTA (for seller, if not set) */}
      {isSeller && (
        <div style={{
          padding: "12px 16px",
          background: T.blueBg,
          borderTop: `1px solid ${T.blue}20`,
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>{"\uD83D\uDE9A"}</span>
          <span style={{ flex: 1, fontSize: 13, color: T.blueText, fontFamily: T.font }}>
            {lang === "fr"
              ? "Indiquez les frais de livraison pour permettre a l'acheteur de proceder au paiement."
              : "Set delivery costs to allow the buyer to proceed with payment."}
          </span>
          <button style={{
            background: T.blue, color: "#fff",
            border: "none", borderRadius: T.radiusSm,
            padding: "8px 16px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
            whiteSpace: "nowrap",
          }}>
            {lang === "fr" ? "Prevoir les frais de livraison" : "Set delivery costs"}
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={{
        borderTop: `1px solid ${T.border}`,
        padding: "12px 16px",
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 8,
        }}>
          <ToolbarButton label="B" style={{ fontWeight: 700 }} />
          <ToolbarButton label="I" style={{ fontStyle: "italic" }} />
          <ToolbarButton label="U" style={{ textDecoration: "underline" }} />
          <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px" }} />
          <ToolbarButton label={"\uD83D\uDD17"} title="Link" />
          <ToolbarButton label={"\uD83D\uDDBC\uFE0F"} title="Image" />
          <ToolbarButton label={"\uD83D\uDE0A"} title="Emoji" />
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setAutoTranslate(!autoTranslate)}
            style={{
              background: autoTranslate ? T.greenBg : T.bg,
              border: `1px solid ${autoTranslate ? T.green : T.border}`,
              borderRadius: T.radiusSm,
              padding: "4px 10px",
              fontSize: 11, fontWeight: 600,
              color: autoTranslate ? T.greenText : T.textMuted,
              cursor: "pointer", fontFamily: T.font,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {"\uD83D\uDD04"} Auto-translate {lang === "fr" ? "FR" : "EN"}
          </button>
        </div>

        {/* Text input + send */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={lang === "fr" ? "Ecrivez quelque chose..." : "Write something..."}
            rows={2}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `1px solid ${T.border}`,
              borderRadius: T.radius,
              fontSize: 13,
              fontFamily: T.font,
              color: T.text,
              resize: "vertical",
              minHeight: 44,
              maxHeight: 120,
              outline: "none",
            }}
            aria-label={lang === "fr" ? "Message" : "Message"}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            style={{
              background: draft.trim() ? T.green : T.border,
              color: "#fff",
              border: "none",
              borderRadius: T.radius,
              width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: draft.trim() ? "pointer" : "not-allowed",
              fontSize: 18,
              transition: T.transitionFast,
              flexShrink: 0,
            }}
            aria-label={lang === "fr" ? "Envoyer" : "Send"}
          >
            {"\uD83D\uDCE4"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── System message ─────────────────────────────────────────────────
function SystemMessage({ msg }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "8px 0",
      margin: "4px 0",
    }}>
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: T.textMuted,
        fontFamily: T.font,
        fontWeight: 500,
        background: T.bg,
        padding: "4px 12px",
        borderRadius: 99,
      }}>
        {msg.icon && <span>{msg.icon}</span>}
        {msg.content}
      </span>
    </div>
  );
}

// ── Chat bubble ────────────────────────────────────────────────────
function ChatBubble({ msg, isOwn, isMobile, showOriginal, onToggleTranslation, lang }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isOwn ? "flex-end" : "flex-start",
      margin: "12px 0",
      maxWidth: isMobile ? "95%" : "80%",
      marginLeft: isOwn ? "auto" : 0,
      marginRight: isOwn ? 0 : "auto",
    }}>
      {/* Sender name + timestamp */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
        flexDirection: isOwn ? "row-reverse" : "row",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>
          {msg.senderRole === "buyer"
            ? (lang === "fr" ? "Acheteur" : "Buyer")
            : (lang === "fr" ? "Vendeur" : "Seller")}
        </span>
        <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>
          {formatDate(msg.createdAt)}
        </span>
      </div>

      {/* Bubble */}
      <div style={{
        background: isOwn ? T.text : T.card,
        color: isOwn ? "#fff" : T.text,
        border: isOwn ? "none" : `1px solid ${T.border}`,
        borderRadius: 12,
        borderTopRightRadius: isOwn ? 4 : 12,
        borderTopLeftRadius: isOwn ? 12 : 4,
        padding: "12px 16px",
        fontSize: 13,
        fontFamily: T.font,
        lineHeight: 1.5,
        boxShadow: T.shadow,
      }}>
        {showOriginal && msg.contentOriginal ? msg.contentOriginal : msg.content}

        {/* Address card */}
        {msg.hasAddressCard && (
          <div style={{
            marginTop: 10,
            padding: "10px 12px",
            background: isOwn ? "rgba(255,255,255,0.1)" : T.bg,
            borderRadius: T.radiusSm,
            border: `1px solid ${isOwn ? "rgba(255,255,255,0.15)" : T.borderLight}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: isOwn ? "rgba(255,255,255,0.8)" : T.textSec }}>
              {lang === "fr" ? "Adresse de livraison :" : "Delivery address:"}
            </div>
            <div style={{ fontSize: 13 }}>{msg.addressCountry}</div>
            <div style={{ fontSize: 13 }}>{msg.addressZip}</div>
          </div>
        )}
      </div>

      {/* Translation toggle */}
      {msg.contentOriginal && (
        <button
          onClick={onToggleTranslation}
          style={{
            background: "none",
            border: "none",
            color: T.accent,
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: T.font,
            padding: "4px 0",
            marginTop: 2,
          }}
        >
          {showOriginal
            ? (lang === "fr" ? "Afficher la traduction" : "Show translation")
            : (lang === "fr" ? "Afficher dans la langue originale" : "Show original language")}
        </button>
      )}

      {/* Moderation indicator */}
      {msg.flagged && (
        <span style={{
          fontSize: 11, color: T.textMuted, fontFamily: T.font,
          display: "flex", alignItems: "center", gap: 4, marginTop: 2,
        }}>
          {"\uD83D\uDEE1\uFE0F"} {lang === "fr" ? "Modere par IA" : "AI moderated"}
        </span>
      )}
    </div>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────
function ToolbarButton({ label, title, style: customStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title || label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hovered ? T.bg : "none",
        border: "none",
        borderRadius: 4,
        fontSize: 13,
        color: T.textSec,
        cursor: "pointer",
        fontFamily: T.font,
        transition: T.transitionFast,
        ...customStyle,
      }}
    >
      {label}
    </button>
  );
}
