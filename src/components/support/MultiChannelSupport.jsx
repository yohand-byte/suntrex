import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import useResponsive from "../../hooks/useResponsive";

const SuntrexSupportChat = lazy(() => import("../chat/SuntrexSupportChat"));

const WHATSAPP_NUMBER = "+33700000000";
const SUPPORT_EMAIL = "contact@suntrex.eu";

export default function MultiChannelSupport({ onOpenChat, userId }) {
  const { t } = useTranslation(["chat"]);
  const tchat = (key, options) => t(`chat:${key}`, options);
  const [open, setOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { isMobile } = useResponsive();
  const ref = useRef(null);
  const channels = [
    {
      id: "chat",
      icon: "💬",
      color: "#E8700A",
      label: tchat("multiChannelSupport.channels.chat.label"),
      desc: tchat("multiChannelSupport.channels.chat.desc"),
    },
    {
      id: "phone",
      icon: "📞",
      color: "#10b981",
      label: tchat("multiChannelSupport.channels.phone.label"),
      desc: tchat("multiChannelSupport.channels.phone.desc"),
    },
    {
      id: "whatsapp",
      icon: "📱",
      color: "#25D366",
      label: tchat("multiChannelSupport.channels.whatsapp.label"),
      desc: tchat("multiChannelSupport.channels.whatsapp.desc"),
    },
    {
      id: "email",
      icon: "✉️",
      color: "#3b82f6",
      label: tchat("multiChannelSupport.channels.email.label"),
      desc: tchat("multiChannelSupport.channels.email.desc"),
    },
  ];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleChannel = (channelId) => {
    setOpen(false);
    switch (channelId) {
      case "chat":
        if (onOpenChat) onOpenChat();
        else setShowChat(true);
        break;
      case "phone":
        window.location.href = "tel:+33186760000";
        break;
      case "whatsapp": {
        const msg = encodeURIComponent(tchat("multiChannelSupport.whatsappGreeting"));
        window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
        break;
      }
      case "email":
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Support%20SUNTREX`;
        break;
    }
  };

  return (
    <>
    {/* Inline support chat */}
    {showChat && (
      <Suspense fallback={null}>
        <SuntrexSupportChat userId={userId || null} onClose={() => setShowChat(false)} />
      </Suspense>
    )}

    <div ref={ref} style={{ position: "fixed", bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24, zIndex: 9998 }}>
      {/* Channel Menu */}
      {open && (
        <div style={{
          position: "absolute", bottom: 64, right: 0,
          background: "#fff", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          border: "1px solid #e2e8f0", overflow: "hidden", width: isMobile ? 260 : 280,
          animation: "slideUp 0.2s ease-out",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{tchat("multiChannelSupport.title")}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{tchat("multiChannelSupport.subtitle")}</div>
          </div>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleChannel(ch.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px",
                border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
                borderBottom: "1px solid #f8fafc", transition: "background 0.15s",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: `${ch.color}12`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>
                {ch.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{ch.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{ch.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 52, height: 52, borderRadius: "50%", border: "none",
          background: open ? "#64748b" : "#E8700A", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(232,112,10,0.3)",
          transition: "all 0.2s", fontSize: 22,
          transform: open ? "rotate(45deg)" : "none",
        }}
        aria-label="Support"
      >
        {open ? "+" : "💬"}
      </button>
    </div>
    </>
  );
}
