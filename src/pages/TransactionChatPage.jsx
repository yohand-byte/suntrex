import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useChat } from "../hooks/useChat";
import { useTransaction } from "../hooks/useTransaction";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Transaction & Chat Page
   Mode: real (Supabase connected) or demo (mock data fallback)
   ═══════════════════════════════════════════════════════════════ */

const isDemoMode = !supabase;

// ── Mock data (demo fallback) ─────────────────────────────
const MOCK_TRANSACTION = {
  id: "ST-2847",
  status: "negotiation",
  createdAt: "2026-02-24T09:24:00Z",
  product: {
    name: "Huawei SUN2000-10KTL-M2",
    image: "https://solar.huawei.com/admin/asset/v1/pro/view/ac281b3090b74a00b98e0e5c3b4fc5a7.png",
    availability: 1064,
    quantity: 10,
    unitPrice: 1249.0,
    netPrice: 12490.0,
    vat: 0,
    vatRate: "0% (intracommunautaire)",
    incoterms: "Delivery by SUNTREX",
    deliveryTime: "~3 days",
    deliveryCost: 120.0,
    totalGross: 12610.0,
    currency: "EUR",
  },
  seller: {
    id: "seller-001",
    company: "QUALIWATT",
    address: "16-18 rue Eiffel, 77220 Gretz-Armainvilliers, France",
    country: "FR",
    countryFlag: "\u{1F1EB}\u{1F1F7}",
    vatStatus: "active",
    vatNumber: "FR12345678901",
    vatVerifiedAt: "2026-02-22T17:30:00Z",
    transactionsCompleted: 8,
    activeOffers: 52,
    memberSince: "2025-12-09",
    rating: 5.0,
    ratingCount: 3,
    avgResponseTime: "<2h",
    badges: ["trusted", "bankTransfer"],
  },
  buyer: {
    company: "SolarTech Estonia O\u00DC",
    country: "EE",
    countryFlag: "\u{1F1EA}\u{1F1EA}",
    vatStatus: "verified",
    vatNumber: "EE102345678",
    vatVerifiedAt: "2026-02-22T17:30:00Z",
    deliveryAddress: {
      line1: "13***",
      city: "Tallinn",
      country: "Estonia",
      countryFlag: "\u{1F1EA}\u{1F1EA}",
    },
  },
  shipper: { name: "SUNTREX DELIVERY", icon: "\u{1F69B}", tracking: null },
};

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: "buyer",
    senderName: "SolarTech Estonia",
    text: "Bonjour, je suis int\u00E9ress\u00E9 par l'achat de 10 exemplaires du mod\u00E8le **Huawei SUN2000-10KTL-M2**. Pouvons-nous entamer les n\u00E9gociations ?",
    originalLang: "en",
    translatedText: "Hello, I am interested in purchasing 10 units of the **Huawei SUN2000-10KTL-M2** model. Can we start negotiations?",
    timestamp: "2026-02-24T09:24:00Z",
    moderation: { status: "approved", score: 0.98 },
  },
  {
    id: 2,
    sender: "buyer",
    senderName: "SolarTech Estonia",
    text: "Bonjour, avez-vous les SUN2000-10KTL-M2 x10 en stock ? Livraison possible cette semaine ?",
    originalLang: "en",
    translatedText: "Hello, do you have the SUN2000-10KTL-M2 x10 in stock? Delivery possible this week?",
    timestamp: "2026-02-24T09:24:30Z",
    moderation: { status: "approved", score: 0.96 },
  },
  {
    id: 3,
    sender: "seller",
    senderName: "QUALIWATT",
    text: "Bonjour,\n\nOui nous avons 1064 unit\u00E9s en stock. Pour 10 pi\u00E8ces, je peux vous proposer un prix sp\u00E9cial \u00E0 **1 190 \u20AC / unit\u00E9** au lieu de 1 249 \u20AC.\n\nLivraison sous 3 jours via SUNTREX DELIVERY.\n\nCordialement",
    originalLang: "fr",
    translatedText: null,
    timestamp: "2026-02-24T10:06:00Z",
    moderation: { status: "approved", score: 0.99 },
  },
];

// ── Status config ─────────────────────────────────────────
const STATUS_STEPS = [
  { key: "negotiation", label: "Ouverture des n\u00E9gociations", icon: "\u{1F4AC}" },
  { key: "confirmed", label: "Transaction confirm\u00E9e", icon: "\u2705" },
  { key: "paid", label: "Pay\u00E9e", icon: "\u{1F4B0}" },
  { key: "shipped", label: "Exp\u00E9di\u00E9e", icon: "\u{1F69B}" },
  { key: "delivered", label: "Livr\u00E9e", icon: "\u{1F4E6}" },
  { key: "completed", label: "Termin\u00E9e", icon: "\u{1F3C1}" },
];

// ── Helpers ───────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}, ${fmtTime(iso)}`;
};

// ── Sub-components ────────────────────────────────────────

function ModerationBadge({ mod }) {
  if (!mod) return null;
  if (mod.status === "flagged")
    return (
      <span
        style={{
          fontSize: 10,
          background: "#fef2f2",
          color: "#dc2626",
          padding: "2px 6px",
          borderRadius: 4,
          fontWeight: 600,
        }}
      >
        \u26A0 Signal\u00E9 \u2014 en attente de mod\u00E9ration
      </span>
    );
  return null;
}

function ProductImageWithFallback({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div style={{ fontSize: 28 }}>{"\u26A1"}</div>;
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: 56, height: 56, objectFit: "contain" }}
      onError={() => setFailed(true)}
    />
  );
}

function ChatBubble({ msg, isSeller, autoTranslate }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const isMine = isSeller ? msg.sender === "seller" : msg.sender === "buyer";
  const align = isMine ? "flex-end" : "flex-start";

  const displayText =
    autoTranslate && msg.translatedText && !showOriginal
      ? msg.translatedText
      : msg.text;

  const renderText = (t) => {
    return t.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return (
        <span key={i}>
          {parts}
          {i < t.split("\n").length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
          flexDirection: isMine ? "row-reverse" : "row",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
          {isMine ? "Vous" : msg.senderName}
        </span>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{fmtDateTime(msg.timestamp)}</span>
      </div>
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: isMine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          background: isMine ? "#4CAF50" : "#f3f4f6",
          color: isMine ? "#fff" : "#1f2937",
          fontSize: 13.5,
          lineHeight: 1.55,
          position: "relative",
        }}
      >
        {renderText(displayText)}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
          flexDirection: isMine ? "row-reverse" : "row",
        }}
      >
        {msg.translatedText && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            style={{
              fontSize: 11,
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            {showOriginal ? "Voir la traduction" : "Afficher dans la langue originale"}
          </button>
        )}
        <ModerationBadge mod={msg.moderation} />
      </div>
    </div>
  );
}

function RichTextToolbar() {
  const btnStyle = {
    width: 30,
    height: 30,
    border: "none",
    background: "none",
    borderRadius: 4,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: 14,
    fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <button style={{ ...btnStyle, fontWeight: 700 }} title="Gras">B</button>
      <button style={{ ...btnStyle, fontStyle: "italic" }} title="Italique">I</button>
      <button style={{ ...btnStyle, textDecoration: "underline" }} title="Soulign\u00E9">U</button>
      <div style={{ width: 1, height: 18, background: "#e5e7eb", margin: "0 4px" }} />
      <button style={btnStyle} title="Lien">{"\u{1F517}"}</button>
      <button style={btnStyle} title="Pi\u00E8ce jointe">{"\u{1F4CE}"}</button>
      <button style={btnStyle} title="Image">{"\u{1F5BC}\uFE0F"}</button>
      <button style={btnStyle} title="Emoji">{"\u{1F60A}"}</button>
    </div>
  );
}

function OrderTimeline({ currentStatus, createdAt }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  return (
    <div>
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: isActive ? "#4CAF50" : "#e5e7eb",
                  border: isCurrent ? "2px solid #4CAF50" : "2px solid transparent",
                  boxShadow: isCurrent ? "0 0 0 3px rgba(76,175,80,0.2)" : "none",
                  flexShrink: 0,
                }}
              />
              {i < STATUS_STEPS.length - 1 && (
                <div style={{ width: 2, height: 24, background: i < currentIdx ? "#4CAF50" : "#e5e7eb" }} />
              )}
            </div>
            <div style={{ paddingBottom: 12 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isActive ? "#1f2937" : "#9ca3af",
                  lineHeight: 1,
                }}
              >
                {step.label}
              </div>
              {isCurrent && createdAt && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>
                  {fmtTime(createdAt)}, {fmtDate(createdAt).split(" ").slice(1).join(" ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SellerDetails({ seller }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>D\u00E9tails du vendeur</h3>
        <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: "#6b7280" }}>Statut de la TVA</span>
        <span
          style={{
            fontSize: 11,
            background: seller.vatStatus === "active" ? "#dcfce7" : "#fef9c3",
            color: seller.vatStatus === "active" ? "#166534" : "#854d0e",
            padding: "2px 8px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {"\u2713"} Actif
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 8px", borderRadius: 4, color: "#4b5563" }}>
          Transactions compl\u00E9t\u00E9es {seller.transactionsCompleted}
        </span>
        <span style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 8px", borderRadius: 4, color: "#4b5563" }}>
          Offres actives {seller.activeOffers}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 8px", borderRadius: 4, color: "#4b5563" }}>
          {seller.countryFlag} Vend depuis{" "}
          {new Date(seller.memberSince).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span style={{ fontSize: 11, background: "#fef9c3", padding: "3px 8px", borderRadius: 4, color: "#854d0e" }}>
          {"\u2B50"} {seller.rating.toFixed(1)} bas\u00E9 sur {seller.ratingCount} avis
        </span>
        <span style={{ fontSize: 11, background: "#f3f4f6", padding: "3px 8px", borderRadius: 4, color: "#4b5563" }}>
          {"\u23F1"} Temps de r\u00E9ponse : {seller.avgResponseTime}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function TransactionChatPage({ isLoggedIn, currentUser: appUser }) {
  const { id: transactionId } = useParams();

  // ── Demo mode state ──────────────────────────────────────
  const [demoMessages, setDemoMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const chatEndRef = useRef(null);

  // ── Real mode hooks (only active when supabase connected) ─
  const chatHook = isDemoMode ? null : useChat(transactionId);
  const txHook = isDemoMode ? null : useTransaction(transactionId);

  // ── Derived state ────────────────────────────────────────
  const messages = isDemoMode ? demoMessages : (chatHook?.messages || []);
  const tx = isDemoMode ? MOCK_TRANSACTION : txHook?.transaction;
  const currentRole = isDemoMode ? "seller" : (appUser?.role || "seller");
  const loading = isDemoMode ? false : (chatHook?.loading || txHook?.loading);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send handler ─────────────────────────────────────────
  const handleSend = () => {
    if (!inputText.trim()) return;

    if (isDemoMode) {
      const newMsg = {
        id: demoMessages.length + 1,
        sender: currentRole,
        senderName: currentRole === "seller" ? MOCK_TRANSACTION.seller.company : MOCK_TRANSACTION.buyer.company,
        text: inputText,
        originalLang: "fr",
        translatedText: null,
        timestamp: new Date().toISOString(),
        moderation: { status: "pending", score: null },
      };
      setDemoMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setTimeout(() => {
        setDemoMessages((prev) =>
          prev.map((m) =>
            m.id === newMsg.id ? { ...m, moderation: { status: "approved", score: 0.97 } } : m
          )
        );
      }, 1200);
    } else {
      chatHook.sendMessage(inputText);
      setInputText("");
    }
  };

  // ── Loading state ────────────────────────────────────────
  if (loading || !tx) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u26A1"}</div>
          <div>Chargement de la transaction...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", color: "#1f2937" }}>
      <style>{`
        ::placeholder { color: #9ca3af; }
        textarea:focus, input:focus { outline: none; border-color: #4CAF50 !important; }
        .tx-btn:hover { filter: brightness(0.95); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-anim { animation: fadeIn 0.3s ease-out; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .mod-pending { animation: pulse 1.5s ease-in-out infinite; }
        .toggle-track { transition: background 0.2s; }
        .toggle-thumb { transition: transform 0.2s; }
      `}</style>

      {/* ── Sub-header / Breadcrumb ────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280" }}>
          <Link to="/" style={{ color: "#6b7280", textDecoration: "none" }}>Accueil</Link>
          <span>{"\u203A"}</span>
          <span style={{ color: "#1f2937", fontWeight: 600 }}>Transaction #{tx.id}</span>
          {isDemoMode && (
            <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 4, fontWeight: 600, marginLeft: 8 }}>
              MODE D\u00C9MO
            </span>
          )}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            className="tx-btn"
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #4CAF50",
              background: "#4CAF50",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {"\u2713"} Ajouter des produits de votre liste
          </button>
          <button
            className="tx-btn"
            style={{
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid #ef4444",
              background: "#fff",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {"\u2715"} Annuler la transaction
          </button>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px", display: "flex", gap: 20 }}>
        {/* LEFT COLUMN — Product + Chat */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Product Recap */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                padding: "10px 18px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tx.seller.countryFlag} {tx.seller.company}, {tx.seller.address}
            </div>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 8,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  <ProductImageWithFallback src={tx.product.image} alt={tx.product.name} />
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
                      {tx.product.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6b7280" }}>
                      Disponibilit\u00E9 : <span style={{ color: "#16a34a", fontWeight: 600 }}>{tx.product.availability} pcs</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                      Incoterms : <span style={{ fontWeight: 500 }}>{tx.product.incoterms}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                      Temps d'envoi : <span style={{ fontWeight: 500 }}>{tx.product.deliveryTime}</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: "#E8700A", marginTop: 4, display: "inline-block", cursor: "pointer" }}>
                      D\u00E9tails du produit
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Quantit\u00E9</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.product.quantity} pi\u00E8ces</div>
                    <span style={{ fontSize: 11, color: "#E8700A", cursor: "pointer" }}>{"\u00C9diter"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Prix (pc)</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(tx.product.unitPrice)}</div>
                    <span style={{ fontSize: 11, color: "#E8700A", cursor: "pointer" }}>{"\u00C9diter"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Prix (net)</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(tx.product.netPrice)}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>TVA : {fmt(tx.product.vat)}</div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 20,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Livraison par <span style={{ fontWeight: 600, color: "#E8700A" }}>{"\u{1F69B}"} SUNTREX</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{fmt(tx.product.deliveryCost)}</div>
                <span style={{ fontSize: 11, color: "#E8700A", cursor: "pointer" }}>{"\u00C9diter"}</span>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Total (brut)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1f2937" }}>{fmt(tx.product.totalGross)}</div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: "8px 18px",
                fontSize: 12,
                color: "#6b7280",
                background: "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {"\u{1F310}"} Cette n\u00E9gociation est automatiquement traduite en chat
              {showModerationPanel && (
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: 10,
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {"\u{1F6E1}"} Mod\u00E9ration active
                </span>
              )}
            </div>

            <div style={{ padding: "18px", maxHeight: 420, overflowY: "auto", minHeight: 200 }}>
              {messages.map((msg) => (
                <div key={msg.id} className="msg-anim">
                  <ChatBubble msg={msg} isSeller={currentRole === "seller"} autoTranslate={autoTranslate} />
                  {msg.moderation?.status === "pending" && (
                    <div
                      className="mod-pending"
                      style={{
                        fontSize: 10,
                        color: "#d97706",
                        textAlign: currentRole === msg.sender ? "right" : "left",
                        marginTop: -10,
                        marginBottom: 10,
                      }}
                    >
                      {"\u23F3"} V\u00E9rification en cours{"\u2026"}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 18px" }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={"\u00C9crivez quelque chose\u2026"}
                rows={3}
                style={{
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13.5,
                  fontFamily: "inherit",
                  resize: "none",
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <RichTextToolbar />
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                    onClick={() => setAutoTranslate(!autoTranslate)}
                  >
                    <div
                      className="toggle-track"
                      style={{
                        width: 36,
                        height: 20,
                        borderRadius: 10,
                        background: autoTranslate ? "#4CAF50" : "#d1d5db",
                        position: "relative",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        className="toggle-thumb"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 2,
                          left: autoTranslate ? 18 : 2,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Traduire automatiquement vers French</span>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="tx-btn"
                    style={{
                      padding: "8px 20px",
                      borderRadius: 6,
                      border: "none",
                      background: inputText.trim() ? "#4CAF50" : "#d1d5db",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: inputText.trim() ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {"\u2713"} Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "16px 18px",
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>
              Autres pi\u00E8ces jointes
            </h3>
            <div
              style={{
                border: "1px dashed #d1d5db",
                borderRadius: 8,
                padding: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>Ajouter ici d'autres pi\u00E8ces jointes</span>
              <button
                style={{
                  fontSize: 12,
                  color: "#E8700A",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                Rechercher dans les fichiers
              </button>
            </div>
          </div>

          {/* Contact support */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>Contact avec l'assistance SUNTREX</h3>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                {"\u2709"} support@suntrex.com
                <span style={{ color: "#d1d5db" }}>|</span>
                {"\u{1F4DE}"} +33 1 XX XX XX XX
                <span style={{ color: "#d1d5db" }}>|</span>
                <span style={{ color: "#25D366" }}>{"\u{1F4AC}"} WhatsApp</span>
              </div>
            </div>
            <button
              className="tx-btn"
              style={{
                padding: "7px 14px",
                borderRadius: 6,
                border: "1px solid #ef4444",
                background: "#fff",
                color: "#ef4444",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {"\u26A0"} Signaler un probl\u00E8me
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
            <SellerDetails seller={tx.seller} />
          </div>

          {/* Transaction Details */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", marginBottom: 14 }}>D\u00E9tails de la transaction</h3>

            {/* Buyer coordinates */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Coordonn\u00E9es de l'acheteur</span>
                <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                {tx.buyer.countryFlag} {tx.buyer.company}
              </div>
            </div>

            <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 14px" }} />

            {/* VAT Check */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 4 }}>
                Contr\u00F4le de la TVA{" "}
                <span style={{ fontSize: 10, background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 3, fontWeight: 600, marginLeft: 4 }}>
                  {"\u2713"} V\u00E9rifi\u00E9
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                (Derni\u00E8re v\u00E9rification: {fmtDateTime(tx.buyer.vatVerifiedAt)}){" "}
                <button style={{ fontSize: 11, color: "#E8700A", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Rev\u00E9rifier
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 14px" }} />

            {/* Delivery address */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Adresse de livraison</span>
                <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280" }}>
                {tx.buyer.deliveryAddress.countryFlag} {tx.buyer.deliveryAddress.country}
                <br />
                {tx.buyer.deliveryAddress.line1}
              </div>
            </div>

            <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 14px" }} />

            {/* Order Status */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Statut de la commande</span>
                <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <OrderTimeline currentStatus={tx.status} createdAt={tx.createdAt} />
            </div>

            <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 14px" }} />

            {/* Shipper info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>Envoy\u00E9 par</span>
                <svg width="14" height="14" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280" }}>
                <span style={{ fontWeight: 600, color: "#E8700A" }}>{tx.shipper.icon} {tx.shipper.name}</span>
                <br />
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {tx.seller.company}
                  <br />
                  {tx.seller.address}
                </span>
              </div>
            </div>
          </div>

          {/* Moderation toggle */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{"\u{1F6E1}"} Mod\u00E9ration</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Activer le panneau de mod\u00E9ration</div>
              </div>
              <div style={{ cursor: "pointer" }} onClick={() => setShowModerationPanel(!showModerationPanel)}>
                <div
                  className="toggle-track"
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: showModerationPanel ? "#3b82f6" : "#d1d5db",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    className="toggle-thumb"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 2,
                      left: showModerationPanel ? 18 : 2,
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
            </div>
            {showModerationPanel && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  background: "#eff6ff",
                  borderRadius: 6,
                  fontSize: 11.5,
                  color: "#1e40af",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>R\u00E8gles actives :</div>
                {"\u2713"} Anti-fraude (paiements hors plateforme)<br />
                {"\u2713"} D\u00E9tection langage inappropri\u00E9<br />
                {"\u2713"} Partage d'infos personnelles<br />
                <div style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>
                  {messages.length} messages {"\u2014"} 0 signalements
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
