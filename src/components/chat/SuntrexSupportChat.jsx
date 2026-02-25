import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useResponsive from "../../hooks/useResponsive";
import { useSupportChat } from "./useSupportChat";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX Support Chat Widget
   - AI-first (Claude) with human handoff
   - Realtime via Supabase (fallback: demo mode)
   - Attachments via Supabase Storage
   - Fully responsive (mobile bottom-sheet, desktop panel)
   ═══════════════════════════════════════════════════════════════ */

const FAQ_OPTIONS = [
  { key: "tracking", icon: "\ud83d\udce6" },
  { key: "returns", icon: "\ud83d\udd04" },
  { key: "billing", icon: "\ud83d\udcb3" },
  { key: "other", icon: "\ud83d\udcac" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Client-side AI fallback responses (when backend is unavailable)
const AI_FALLBACK = {
  tracking: "Pour suivre votre commande, rendez-vous dans **Mon compte** > **Mes commandes**. Chaque commande dispose d'un suivi en temps r\u00e9el avec SUNTREX DELIVERY.\n\nSouhaitez-vous que je v\u00e9rifie une commande sp\u00e9cifique ?",
  returns: "La proc\u00e9dure de retour est simple :\n\u2022 D\u00e9lai : **14 jours** apr\u00e8s r\u00e9ception\n\u2022 Rendez-vous dans **Mes achats** \u2192 s\u00e9lectionnez la commande \u2192 **Signaler un probl\u00e8me**\n\u2022 Les frais de retour d\u00e9pendent du vendeur\n\nUn probl\u00e8me avec une commande en particulier ?",
  billing: "Pour toute question de facturation :\n\u2022 Vos factures sont dans **Mon compte** > **Facturation**\n\u2022 Le paiement est s\u00e9curis\u00e9 via **Stripe** (3D Secure)\n\u2022 Commission SUNTREX : **5% en dessous** des concurrents\n\nQuelle est votre question pr\u00e9cise ?",
  other: "Je suis l\u2019assistant IA SUNTREX. Je peux vous aider sur :\n\u2022 Suivi de commandes\n\u2022 Informations produits (panneaux, onduleurs, batteries)\n\u2022 Proc\u00e9dures de retour/SAV\n\u2022 Facturation et paiements\n\nPosez-moi votre question !",
  default: "Merci pour votre message. Laissez-moi v\u00e9rifier cela pour vous...",
};

// Safe text rendering: parses **bold** and bullet points without innerHTML
function renderText(text) {
  if (!text) return null;
  return text.split("\n").map((line, lineIdx) => {
    if (line === "") return <div key={lineIdx} style={{ minHeight: 8 }} />;

    // Split by **bold** markers and render safely
    const parts = [];
    let remaining = line;
    let partIdx = 0;
    while (remaining.length > 0) {
      const boldStart = remaining.indexOf("**");
      if (boldStart === -1) {
        parts.push(<span key={partIdx++}>{remaining}</span>);
        break;
      }
      if (boldStart > 0) {
        parts.push(<span key={partIdx++}>{remaining.slice(0, boldStart)}</span>);
      }
      const boldEnd = remaining.indexOf("**", boldStart + 2);
      if (boldEnd === -1) {
        parts.push(<span key={partIdx++}>{remaining.slice(boldStart)}</span>);
        break;
      }
      parts.push(<b key={partIdx++}>{remaining.slice(boldStart + 2, boldEnd)}</b>);
      remaining = remaining.slice(boldEnd + 2);
    }

    // Indent bullet points
    const isBullet = line.startsWith("\u2022 ");
    return (
      <div key={lineIdx} style={{ paddingLeft: isBullet ? 8 : 0 }}>
        {parts}
      </div>
    );
  });
}

let nextLocalId = 1;

export default function SuntrexSupportChat({ userId = null }) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState([
    { id: "welcome", from: "ai", text: t("supportChat.welcome", "\ud83d\udc4b Bonjour ! Je suis l'assistant SUNTREX. Comment puis-je vous aider ?"), time: new Date() },
  ]);
  const [localTyping, setLocalTyping] = useState(false);
  const [view, setView] = useState("home"); // "home" | "chat"
  const [attachments, setAttachments] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [waitingAgent, setWaitingAgent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  // Backend hook
  const {
    conversation,
    messages: realtimeMessages,
    isTyping: realtimeTyping,
    aiMode,
    initConversation,
    send: sendToBackend,
    handoffToHuman: backendHandoff,
    revertToAI: backendRevertToAI,
    closeConversation: backendCloseConversation,
    resetChat: backendResetChat,
  } = useSupportChat(userId);

  const isBackendConnected = conversation && !conversation.isDemo;

  // Use realtime messages when backend connected, otherwise local
  const displayMessages = isBackendConnected ? realtimeMessages : localMessages;
  const isTyping = isBackendConnected ? realtimeTyping : localTyping;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isTyping]);

  // Increment unread when closed and new messages arrive
  useEffect(() => {
    if (!isOpen && displayMessages.length > 1) {
      const last = displayMessages[displayMessages.length - 1];
      if (last.from !== "user") setUnread(prev => prev + 1);
    }
  }, [displayMessages.length, isOpen]);

  const openChat = useCallback(async () => {
    setIsOpen(true);
    setUnread(0);
    if (!conversation) {
      await initConversation({ source: "widget", url: window.location.pathname });
    }
  }, [conversation, initConversation]);

  // Go back to home view
  const goHome = useCallback(() => {
    setView("home");
    setShowMenu(false);
  }, []);

  // Start a new conversation (reset everything)
  const handleNewConversation = useCallback(() => {
    setShowMenu(false);
    setWaitingAgent(false);
    setInput("");
    setAttachments([]);
    setRawFiles([]);
    setLocalMessages([
      { id: "welcome", from: "ai", text: t("supportChat.welcome", "\ud83d\udc4b Bonjour ! Je suis l'assistant SUNTREX. Comment puis-je vous aider ?"), time: new Date() },
    ]);
    setLocalTyping(false);
    backendResetChat();
    setView("home");
  }, [backendResetChat, t]);

  // Close current conversation (mark as closed in Supabase)
  const handleCloseConversation = useCallback(async () => {
    setShowMenu(false);
    setWaitingAgent(false);
    setInput("");
    setAttachments([]);
    setRawFiles([]);
    setLocalMessages([
      { id: "welcome", from: "ai", text: t("supportChat.welcome", "\ud83d\udc4b Bonjour ! Je suis l'assistant SUNTREX. Comment puis-je vous aider ?"), time: new Date() },
    ]);
    setLocalTyping(false);
    await backendCloseConversation();
    setView("home");
  }, [backendCloseConversation, t]);

  // Cancel handoff, revert to AI mode
  const handleRevertToAI = useCallback(async () => {
    setWaitingAgent(false);
    if (isBackendConnected) {
      await backendRevertToAI();
    }
    setLocalMessages(prev => [...prev, {
      id: "system-revert-" + nextLocalId++,
      from: "system",
      text: t("supportChat.revertedToAI", "Vous \u00eates reconnect\u00e9 \u00e0 l'assistant IA."),
      time: new Date(),
    }]);
  }, [isBackendConnected, backendRevertToAI, t]);

  // --- Demo mode AI response ---
  const demoAIResponse = useCallback((userText, faqKey = null) => {
    setLocalTyping(true);
    const delay = 800 + Math.random() * 1200;
    setTimeout(() => {
      let responseText;
      if (faqKey && AI_FALLBACK[faqKey]) {
        responseText = AI_FALLBACK[faqKey];
      } else {
        const lower = userText.toLowerCase();
        if (lower.includes("commande") || lower.includes("suivi") || lower.includes("livr")) {
          responseText = AI_FALLBACK.tracking;
        } else if (lower.includes("retour") || lower.includes("sav") || lower.includes("probl")) {
          responseText = AI_FALLBACK.returns;
        } else if (lower.includes("factur") || lower.includes("paiement") || lower.includes("prix")) {
          responseText = AI_FALLBACK.billing;
        } else if (lower.includes("agent") || lower.includes("humain") || lower.includes("personne")) {
          responseText = "Je vous mets en relation avec un agent. Veuillez patienter...";
          setTimeout(() => setWaitingAgent(true), 500);
        } else {
          responseText = AI_FALLBACK.default + "\n\nJe peux vous aider avec le suivi de commandes, la facturation, ou les retours. Si vous pr\u00e9f\u00e9rez parler \u00e0 un agent humain, dites-le moi.";
        }
      }
      setLocalMessages(prev => [...prev, {
        id: "ai-" + nextLocalId++,
        from: "ai",
        text: responseText,
        time: new Date(),
      }]);
      setLocalTyping(false);
    }, delay);
  }, []);

  // --- FAQ handler ---
  const handleFaq = useCallback(async (faqKey) => {
    setView("chat");
    const labels = {
      tracking: t("supportChat.faq.tracking", "Suivi de commande"),
      returns: t("supportChat.faq.returns", "Retours / SAV"),
      billing: t("supportChat.faq.billing", "Facturation"),
      other: t("supportChat.faq.other", "Autre question"),
    };
    const text = labels[faqKey] || faqKey;

    if (isBackendConnected) {
      await sendToBackend(text);
    } else {
      setLocalMessages(prev => [...prev, {
        id: "user-" + nextLocalId++,
        from: "user",
        text,
        time: new Date(),
      }]);
      demoAIResponse(text, faqKey);
    }
  }, [isBackendConnected, sendToBackend, demoAIResponse, t]);

  // --- Send message ---
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !rawFiles.length) return;
    if (isTyping) return;

    setInput("");
    setView("chat");

    if (isBackendConnected) {
      await sendToBackend(text, rawFiles);
    } else {
      setLocalMessages(prev => [...prev, {
        id: "user-" + nextLocalId++,
        from: "user",
        text: text || "[" + attachments.map(a => a.name).join(", ") + "]",
        attachments: attachments,
        time: new Date(),
      }]);
      if (text) demoAIResponse(text);
    }

    setAttachments([]);
    setRawFiles([]);
  }, [input, rawFiles, attachments, isTyping, isBackendConnected, sendToBackend, demoAIResponse]);

  // --- Handoff ---
  const handleHandoff = useCallback(async () => {
    setWaitingAgent(true);
    if (isBackendConnected) {
      await backendHandoff("User requested agent");
    } else {
      setLocalMessages(prev => [...prev, {
        id: "system-" + nextLocalId++,
        from: "system",
        text: t("supportChat.handoffMessage", "Mise en relation avec un agent... Veuillez patienter."),
        time: new Date(),
      }]);
    }
  }, [isBackendConnected, backendHandoff, t]);

  // --- File attachment ---
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) return false;
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      return true;
    });
    setRawFiles(prev => [...prev, ...valid]);
    setAttachments(prev => [...prev, ...valid.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setRawFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // ─── Styles ───
  const fabSize = isMobile ? 48 : 56;

  const fabStyle = {
    position: "fixed", bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24,
    width: fabSize, height: fabSize,
    borderRadius: "50%", border: "none", background: "#E8700A", color: "#fff",
    cursor: "pointer", boxShadow: "0 4px 20px rgba(232,112,10,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    transition: "transform .2s, box-shadow .2s",
  };

  const panelStyle = {
    position: "fixed",
    bottom: isMobile ? 0 : 92,
    right: isMobile ? 0 : 24,
    width: isMobile ? "100%" : 400,
    height: isMobile ? "90vh" : 560,
    borderRadius: isMobile ? "16px 16px 0 0" : 16,
    background: "#fff",
    boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
    display: "flex", flexDirection: "column",
    zIndex: 1000, overflow: "hidden",
    animation: "chatPanelIn .25s ease-out",
  };

  const headerStyle = {
    background: "linear-gradient(135deg, #E8700A 0%, #c45a00 100%)",
    color: "#fff", padding: "14px 18px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexShrink: 0,
  };

  const bodyStyle = {
    flex: 1, overflowY: "auto", padding: "14px 14px", display: "flex",
    flexDirection: "column", gap: 8, background: "#fafafa",
    WebkitOverflowScrolling: "touch",
  };

  const bubbleBase = {
    maxWidth: "82%", padding: "10px 14px", borderRadius: 16,
    fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
  };
  const aiBubble = { ...bubbleBase, background: "#fff", alignSelf: "flex-start", color: "#222", border: "1px solid #e8e8e8" };
  const userBubble = { ...bubbleBase, background: "#E8700A", alignSelf: "flex-end", color: "#fff" };
  const systemBubble = { ...bubbleBase, background: "#fff3e0", alignSelf: "center", color: "#92400e", fontSize: 12, textAlign: "center", maxWidth: "90%", borderRadius: 8 };
  const agentBubble = { ...bubbleBase, background: "#e8f5e9", alignSelf: "flex-start", color: "#1b5e20", border: "1px solid #c8e6c9" };

  const getBubbleStyle = (from) => {
    if (from === "user") return userBubble;
    if (from === "agent") return agentBubble;
    if (from === "system") return systemBubble;
    return aiBubble;
  };

  const inputBarStyle = {
    display: "flex", flexDirection: "column", gap: 0,
    borderTop: "1px solid #e5e7eb", background: "#fff", flexShrink: 0,
  };

  return (
    <>
      <style>{`
        @keyframes chatPanelIn { from { opacity:0; transform:translateY(16px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes typingDot { 0%,80%,100% { opacity:.3; } 40% { opacity:1; } }
        @keyframes pulseUnread { 0%,100% { transform:scale(1); } 50% { transform:scale(1.15); } }
      `}</style>

      {/* ─── PANEL ─── */}
      {isOpen && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
              {/* Back arrow — only in chat view */}
              {view === "chat" && (
                <button onClick={goHome} aria-label="Back" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4, lineHeight: 1, flexShrink: 0, minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
              )}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Support SUNTREX</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {waitingAgent
                    ? t("supportChat.waitingAgent", "En attente d'un agent...")
                    : aiMode
                      ? t("supportChat.aiPowered", "Assistant IA \u2022 24/7")
                      : t("supportChat.agentConnected", "Agent connect\u00e9")}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, position: "relative" }}>
              {/* Agent handoff button — only in chat view, not waiting */}
              {view === "chat" && !waitingAgent && (
                <button onClick={handleHandoff} title={t("supportChat.talkToAgent", "Parler \u00e0 un agent")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                  <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 4 }}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Agent
                </button>
              )}
              {/* ⋮ Menu button */}
              <button onClick={() => setShowMenu(!showMenu)} aria-label="Menu" style={{ background: showMenu ? "rgba(255,255,255,0.2)" : "none", border: "none", color: "#fff", cursor: "pointer", padding: 4, lineHeight: 1, borderRadius: 6, minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              {/* ✕ Close widget */}
              <button onClick={() => { setIsOpen(false); setShowMenu(false); }} aria-label="Close" style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4, minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u2715"}</button>

              {/* Dropdown menu */}
              {showMenu && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: "#fff", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                  minWidth: isMobile ? 200 : 220, zIndex: 10, overflow: "hidden",
                  animation: "chatPanelIn .15s ease-out",
                }}>
                  <button onClick={handleNewConversation} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", background: "none", border: "none",
                    cursor: "pointer", fontSize: 13, color: "#333", fontFamily: "inherit",
                    textAlign: "left", borderBottom: "1px solid #f0f0f0",
                  }}>
                    <svg width="16" height="16" fill="none" stroke="#E8700A" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    {t("supportChat.newConversation", "Nouvelle conversation")}
                  </button>
                  <button onClick={handleCloseConversation} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", background: "none", border: "none",
                    cursor: "pointer", fontSize: 13, color: "#333", fontFamily: "inherit",
                    textAlign: "left",
                  }}>
                    <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    {t("supportChat.closeConversation", "Fermer la conversation")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={bodyStyle} onClick={() => showMenu && setShowMenu(false)}>
            {view === "home" ? (
              /* ─── HOME VIEW ─── */
              <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
                {/* Welcome */}
                <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{"\u2600\ufe0f"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#222", marginBottom: 4 }}>{t("supportChat.homeTitle", "Comment pouvons-nous vous aider ?")}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>{t("supportChat.homeSubtitle", "Choisissez un sujet ou posez votre question")}</div>
                </div>

                {/* FAQ quick actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {FAQ_OPTIONS.map((faq) => (
                    <button key={faq.key} onClick={() => handleFaq(faq.key)} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", borderRadius: 12,
                      border: "1px solid #e5e7eb", background: "#fff",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      transition: "border-color .15s, box-shadow .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#E8700A"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(232,112,10,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{faq.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{t("supportChat.faq." + faq.key, faq.key)}</div>
                        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                          {faq.key === "tracking" && t("supportChat.faqDesc.tracking", "Suivez vos commandes en temps r\u00e9el")}
                          {faq.key === "returns" && t("supportChat.faqDesc.returns", "Retours, \u00e9changes et SAV")}
                          {faq.key === "billing" && t("supportChat.faqDesc.billing", "Factures, paiements et devis")}
                          {faq.key === "other" && t("supportChat.faqDesc.other", "Produits, technique, autre")}
                        </div>
                      </div>
                      <svg width="16" height="16" fill="none" stroke="#ccc" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: "auto", flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  ))}
                </div>

                {/* Direct message CTA */}
                <button onClick={() => setView("chat")} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px 16px", borderRadius: 10,
                  border: "none", background: "#E8700A", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {t("supportChat.startChat", "\u00c9crire un message")}
                </button>

                {/* Channels */}
                <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "4px 0" }}>
                  {[
                    { icon: "\ud83d\udce7", label: "Email", href: "mailto:support@suntrex.eu" },
                    { icon: "\ud83d\udcde", label: t("supportChat.phone", "T\u00e9l\u00e9phone"), href: "tel:+33123456789" },
                  ].map((ch) => (
                    <a key={ch.label} href={ch.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none", color: "#666", fontSize: 11 }}>
                      <span style={{ fontSize: 20 }}>{ch.icon}</span>
                      <span>{ch.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              /* ─── CHAT VIEW ─── */
              <>
                {displayMessages.map((m) => (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : m.from === "system" ? "center" : "flex-start" }}>
                    {m.from === "agent" && (
                      <div style={{ fontSize: 11, color: "#4CAF50", fontWeight: 600, marginBottom: 2, marginLeft: 4 }}>
                        {t("supportChat.agentLabel", "Agent Support")}
                      </div>
                    )}
                    {m.from === "ai" && m.id !== "welcome" && (
                      <div style={{ fontSize: 10, color: "#999", marginBottom: 2, marginLeft: 4 }}>
                        {t("supportChat.aiLabel", "Assistant IA")}
                      </div>
                    )}
                    <div style={getBubbleStyle(m.from)}>
                      {renderText(m.text)}
                      {m.attachments && m.attachments.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                          {m.attachments.map((att, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.85 }}>
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                              {att.url
                                ? <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>{att.name}</a>
                                : <span>{att.name}</span>}
                              {att.size && <span>({formatSize(att.size)})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "#bbb", marginTop: 2, marginLeft: m.from === "user" ? 0 : 4, marginRight: m.from === "user" ? 4 : 0 }}>
                      {m.time instanceof Date ? m.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ ...aiBubble, display: "flex", gap: 4, padding: "10px 16px" }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8700A", opacity: 0.5, animation: "typingDot 1.2s infinite " + (i * 0.2) + "s" }} />
                    ))}
                  </div>
                )}

                {/* Waiting for agent + revert button */}
                {waitingAgent && !isTyping && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ ...systemBubble, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8700A", animation: "pulseUnread 1.5s infinite" }} />
                      {t("supportChat.waitingAgentMsg", "Un agent va vous r\u00e9pondre sous peu...")}
                    </div>
                    <button onClick={handleRevertToAI} style={{
                      padding: "8px 16px", borderRadius: 20,
                      border: "1.5px solid #E8700A", background: "#fff",
                      color: "#E8700A", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {t("supportChat.revertToAI", "Revenir au chat IA")}
                    </button>
                  </div>
                )}

                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input bar — only in chat view */}
          {view === "chat" && <div style={inputBarStyle}>
            {attachments.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px 0" }}>
                {attachments.map((att, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "#f5f5f5", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#555" }}>
                    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                    <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                    <button onClick={() => removeAttachment(i)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>{"\u2715"}</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "10px 12px 16px" : "10px 12px" }}>
              <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 4, flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <input ref={fileRef} type="file" multiple accept={ALLOWED_TYPES.join(",")} onChange={handleFileSelect} style={{ display: "none" }} />

              <textarea
                rows={1}
                placeholder={t("supportChat.inputPlaceholder", "Votre message...")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                style={{
                  flex: 1, resize: "none", border: "1px solid #d1d5db", borderRadius: 8,
                  padding: "8px 12px", fontSize: 14, outline: "none", fontFamily: "inherit",
                  lineHeight: 1.4, maxHeight: 80, boxSizing: "border-box",
                }}
              />

              <button onClick={handleSend} disabled={isTyping} style={{
                width: 38, height: 38, borderRadius: "50%", border: "none",
                background: "#E8700A", color: "#fff", cursor: isTyping ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                opacity: isTyping ? 0.5 : 1, transition: "opacity .2s",
              }} aria-label="Send">
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
              </button>
            </div>
          </div>}

          {/* Footer */}
          <div style={{ padding: "6px 14px 8px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "#fff" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {[
                { icon: "\ud83d\udcac", label: "Chat" },
                { icon: "\ud83d\udce7", label: "Email" },
              ].map((ch) => (
                <span key={ch.label} style={{ fontSize: 10, color: "#999", display: "flex", alignItems: "center", gap: 3 }}>
                  <span>{ch.icon}</span> {ch.label}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 10, color: "#ccc" }}>suntrex.eu</span>
          </div>
        </div>
      )}

      {/* ─── FAB ─── */}
      {!(isMobile && isOpen) && (
        <button style={fabStyle} onClick={isOpen ? () => setIsOpen(false) : openChat}>
          {!isOpen && unread > 0 && (
            <div style={{
              position: "absolute", top: -2, right: -2,
              minWidth: 18, height: 18, borderRadius: 9,
              background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px", border: "2px solid #fff",
              animation: "pulseUnread 2s infinite",
            }}>
              {unread}
            </div>
          )}
          {isOpen ? (
            <span style={{ fontSize: 22, lineHeight: 1 }}>{"\u2715"}</span>
          ) : (
            <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          )}
        </button>
      )}
    </>
  );
}
