import React, { useState, useEffect, useRef } from "react";
import { T } from "./tokens";
import { useResponsive } from "./shared/useResponsive";

// ── Navigation config ──────────────────────────────────────────────
const TABS = [
  { id: "buy",  label: "BUY",  labelFr: "ACHETER" },
  { id: "sell", label: "SELL", labelFr: "VENDRE" },
  { id: "profile", label: "MY PROFILE", labelFr: "MON PROFIL" },
  { id: "notifications", label: "NOTIFICATIONS", labelFr: "NOTIFICATIONS" },
];

// ── KYC pill config (sell tab only) ───────────────────────────────
const KYC_PILL = {
  not_started: { bg: "#f97316", label: { fr: "🔐 Activer vendeur", en: "🔐 Activate seller" } },
  pending:     { bg: "#f59e0b", label: { fr: "⏳ Finaliser KYC",   en: "⏳ Complete KYC"   } },
  in_review:   { bg: "#3b82f6", label: { fr: "🔍 KYC en cours",    en: "🔍 KYC in review"  } },
  rejected:    { bg: "#ef4444", label: { fr: "⚠ KYC requis",       en: "⚠ KYC required"   } },
};

// ── Profile dropdown items ─────────────────────────────────────────
const PROFILE_MENU = [
  { id: "account",    icon: "\uD83D\uDC64", label: "Account details",   labelFr: "Details du compte" },
  { id: "password",   icon: "\uD83D\uDD12", label: "Password",          labelFr: "Mot de passe" },
  { id: "company",    icon: "\uD83C\uDFE2", label: "Company details",   labelFr: "Details entreprise" },
  { id: "invoices",   icon: "\uD83E\uDDFE", label: "Invoices & Fees",   labelFr: "Factures & Frais", badge: "NEW" },
  { id: "reviews",    icon: "\u2B50",        label: "Reviews",           labelFr: "Avis" },
  { id: "ooo",        icon: "\uD83C\uDF19",  label: "Out of office",    labelFr: "Mode absence" },
  { id: "divider" },
  { id: "logout",     icon: "\uD83D\uDEAA", label: "Log out",           labelFr: "Deconnexion" },
];

export default function DashboardTopbar({ activeTab, onTabChange, onProfileAction, onNotificationClick, unreadCount = 0, user, lang = "fr", onSearch, kycStatus, onKycAction }) {
  const { isMobile, isTablet } = useResponsive();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [hoveredTab, setHoveredTab] = useState(null);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;

  // ── Main header bar ──────────────────────────────────────────────
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100, background: T.card, borderBottom: `1px solid ${T.border}` }}>
      {/* Top row: logo, search, language, notification, user, cart */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 8 : 16,
        padding: isMobile ? "10px 12px" : "12px 24px",
        minHeight: 56,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}
             onClick={() => onTabChange?.("buy")}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${T.accent}, #f59e0b)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 900, color: "#fff",
          }}>S</div>
          {!isMobile && (
            <span style={{ fontWeight: 800, fontSize: 16, color: T.text, fontFamily: T.font, letterSpacing: 0.5 }}>
              SUNTREX
            </span>
          )}
        </div>

        {/* Search bar */}
        {!isMobile && (
          <div style={{
            flex: 1,
            maxWidth: 480,
            position: "relative",
          }}>
            <input
              type="text"
              placeholder={lang === "fr" ? "Rechercher un produit..." : "Search products..."}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchValue.trim()) onSearch?.(searchValue.trim()); }}
              style={{
                width: "100%",
                padding: "8px 14px 8px 36px",
                border: `1px solid ${T.border}`,
                borderRadius: T.radius,
                fontSize: 13,
                fontFamily: T.font,
                color: T.text,
                background: T.bg,
                outline: "none",
              }}
              aria-label={lang === "fr" ? "Rechercher un produit" : "Search products"}
            />
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, color: T.textMuted, pointerEvents: "none",
            }}>
              {"\uD83D\uDD0D"}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Language/currency selector (placeholder) */}
        {!isMobile && (
          <button style={{
            background: "none", border: `1px solid ${T.border}`,
            borderRadius: T.radiusSm, padding: "6px 10px",
            fontSize: 12, fontWeight: 500, color: T.textSec,
            cursor: "pointer", fontFamily: T.font,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {"\uD83C\uDDEB\uD83C\uDDF7"} {lang === "fr" ? "French" : "English"}-EUR {"\u25BE"}
          </button>
        )}

        {/* KYC pill — desktop only, sell tab, not approved */}
        {!isMobile && activeTab === "sell" && kycStatus && KYC_PILL[kycStatus] && (
          <button
            onClick={onKycAction}
            style={{
              background: KYC_PILL[kycStatus].bg,
              color: "#fff",
              border: "none",
              borderRadius: 20,
              padding: "0 14px",
              height: 32,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            aria-label={lang === "fr" ? KYC_PILL[kycStatus].label.fr : KYC_PILL[kycStatus].label.en}
          >
            {lang === "fr" ? KYC_PILL[kycStatus].label.fr : KYC_PILL[kycStatus].label.en}
          </button>
        )}

        {/* Notification bell */}
        <button
          onClick={onNotificationClick}
          style={{
            background: "none", border: "none",
            position: "relative", cursor: "pointer",
            fontSize: 20, padding: 6,
            minWidth: 44, minHeight: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Notifications"
        >
          {"\uD83D\uDD14"}
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4,
              width: 8, height: 8, borderRadius: "50%",
              background: T.red, border: "2px solid #fff",
            }} />
          )}
        </button>

        {/* User avatar */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.accent}88, #f59e0b88)`,
              border: profileOpen ? `2px solid ${T.accent}` : "2px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, color: "#fff",
              cursor: "pointer", fontFamily: T.font,
              transition: T.transitionFast,
            }}
            aria-label="User menu"
          >
            {user?.avatar || "U"}
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div style={{
              position: "absolute", top: 44, right: 0,
              width: 240,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: T.radius,
              boxShadow: T.shadowLg,
              zIndex: 300,
              overflow: "hidden",
              animation: "fadeIn 0.15s ease-out",
            }}>
              {/* User info header */}
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: T.text, fontFamily: T.font }}>
                  {user?.name || "User"}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
                  {user?.email || ""}
                </div>
              </div>

              {PROFILE_MENU.map((item) => {
                if (item.id === "divider") {
                  return <div key="divider" style={{ height: 1, background: T.borderLight, margin: "4px 0" }} />;
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setProfileOpen(false);
                      onProfileAction?.(item.id);
                    }}
                    style={{
                      width: "100%", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 16px",
                      background: "none", border: "none",
                      fontSize: 13, fontWeight: 500,
                      color: item.id === "logout" ? T.red : T.text,
                      cursor: "pointer", fontFamily: T.font,
                      transition: T.transitionFast,
                      minHeight: 40,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                    <span>{getLabel(item)}</span>
                    {item.badge && (
                      <span style={{
                        marginLeft: "auto",
                        background: T.greenBg, color: T.greenText,
                        fontSize: 10, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 4,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: BUY | SELL | MY PROFILE | NOTIFICATIONS tabs */}
      {!isMobile && (
        <div style={{
          display: "flex",
          gap: 0,
          padding: "0 24px",
          borderTop: `1px solid ${T.borderLight}`,
        }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const hovered = hoveredTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `3px solid ${active ? T.green : "transparent"}`,
                  padding: "12px 20px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  color: active ? T.text : (hovered ? T.text : T.textSec),
                  cursor: "pointer",
                  fontFamily: T.font,
                  transition: T.transitionFast,
                  letterSpacing: "0.03em",
                  position: "relative",
                  minHeight: 44,
                }}
              >
                {tab.label}
                {tab.id === "notifications" && unreadCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    background: T.red, color: "#fff",
                    borderRadius: 10, padding: "1px 6px",
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { TABS, PROFILE_MENU };
