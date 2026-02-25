import { useState, useRef, useEffect } from "react";
import useResponsive from "../../hooks/useResponsive";

const FAQ_OPTIONS = ["Suivi de commande", "Retours / SAV", "Facturation", "Autre question"];

const WELCOME_MSG = { id: 0, sender: "support", text: "👋 Bonjour ! Comment pouvons-nous vous aider ?" };

let nextId = 1;

export default function ChatFab() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const bottomRef = useRef(null);
  const { isMobile } = useResponsive();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchAIReply = async (allMessages) => {
    setIsTyping(true);
    const apiMessages = allMessages
      .filter((m) => m.id !== 0)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "No reply");
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: nextId++, sender: "support", text: data.reply }]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: nextId++, sender: "support", text: "Désolé, une erreur est survenue. Contactez support@suntrex.com pour assistance." },
      ]);
    }
  };

  const handleFaq = (label) => {
    setShowFaq(false);
    const newMsg = { id: nextId++, sender: "user", text: label };
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      fetchAIReply(updated);
      return updated;
    });
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText("");
    setShowFaq(false);
    const newMsg = { id: nextId++, sender: "user", text };
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      fetchAIReply(updated);
      return updated;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- styles ---
  const fabSize = isMobile ? 44 : 52;
  const fabStyle = {
    position: "fixed", bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24, width: fabSize, height: fabSize,
    borderRadius: "50%", border: "none", background: "#4CAF50", color: "#fff",
    cursor: "pointer", boxShadow: "0 4px 16px rgba(76,175,80,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
  };

  const badgeStyle = {
    position: "absolute", top: 2, right: 2, width: 10, height: 10,
    borderRadius: "50%", background: "#E8700A", border: "2px solid #fff",
  };

  const panelStyle = {
    position: "fixed",
    bottom: isMobile ? 0 : 88,
    right: isMobile ? 0 : 24,
    width: isMobile ? "100%" : 380,
    height: isMobile ? "85vh" : 520,
    borderRadius: isMobile ? "12px 12px 0 0" : 12,
    background: "#fff",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    display: "flex", flexDirection: "column", zIndex: 1000, overflow: "hidden",
    animation: "chatPanelIn .2s ease-out",
  };

  const headerStyle = {
    background: "#E8700A", color: "#fff", padding: "16px 18px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontWeight: 700, fontSize: 15,
  };

  const bodyStyle = {
    flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex",
    flexDirection: "column", gap: 10, background: "#fafafa",
  };

  const bubbleBase = { maxWidth: "78%", padding: "10px 14px", borderRadius: 16, fontSize: 14, lineHeight: 1.45, wordBreak: "break-word" };
  const supportBubble = { ...bubbleBase, background: "#f3f4f6", alignSelf: "flex-start", color: "#222" };
  const userBubble = { ...bubbleBase, background: "#4CAF50", alignSelf: "flex-end", color: "#fff" };

  const faqBtnStyle = {
    padding: "7px 14px", borderRadius: 20, border: "1.5px solid #E8700A",
    background: "#fff", color: "#E8700A", fontSize: 13, fontWeight: 600,
    cursor: "pointer",
  };

  const inputBarStyle = {
    display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "10px 12px 16px" : "10px 12px",
    borderTop: "1px solid #e5e7eb",
  };

  const textareaStyle = {
    flex: 1, resize: "none", border: "1px solid #d1d5db", borderRadius: 8,
    padding: "8px 10px", fontSize: 14, outline: "none", fontFamily: "inherit",
    lineHeight: 1.4, maxHeight: 60,
  };

  const sendBtnStyle = {
    width: 36, height: 36, borderRadius: "50%", border: "none",
    background: "#4CAF50", color: "#fff", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };

  return (
    <>
      <style>{`
        @keyframes chatPanelIn { from { opacity:0; transform:scale(.9) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes typingDot { 0%,80%,100% { opacity:.3; } 40% { opacity:1; } }
      `}</style>

      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span>Support SUNTREX</span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
          </div>

          <div style={bodyStyle}>
            {messages.map((m) => (
              <div key={m.id} style={m.sender === "support" ? supportBubble : userBubble}>{m.text}</div>
            ))}

            {showFaq && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                {FAQ_OPTIONS.map((label) => (
                  <button key={label} style={faqBtnStyle} onClick={() => handleFaq(label)}>{label}</button>
                ))}
              </div>
            )}

            {isTyping && (
              <div style={{ ...supportBubble, display: "flex", gap: 4, padding: "10px 16px" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#999", animation: `typingDot 1.2s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={inputBarStyle}>
            <textarea
              rows={1}
              placeholder="Votre message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={textareaStyle}
              disabled={isTyping}
            />
            <button onClick={handleSend} style={{ ...sendBtnStyle, opacity: isTyping ? 0.5 : 1 }} aria-label="Envoyer" disabled={isTyping}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Hide FAB when panel is open on mobile */}
      {!(isMobile && open) && (
        <button style={fabStyle} onClick={() => setOpen((v) => !v)}>
          {!open && <div style={badgeStyle} />}
          {open ? (
            <span style={{ fontSize: 22, lineHeight: 1 }}>✕</span>
          ) : (
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          )}
        </button>
      )}
    </>
  );
}
