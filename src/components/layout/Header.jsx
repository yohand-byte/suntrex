import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserMenu } from "../../AuthSystem";
import LanguageSwitcher from "./LanguageSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import useResponsive from "../../hooks/useResponsive";

export default function Header({ isLoggedIn, currentUser, onShowLogin, onShowRegister, onLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { isMobile, isTablet } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { label: t("header.nav.allProducts"), path: "/catalog" },
    { label: t("header.nav.solarPanels"), path: "/catalog/panels" },
    { label: t("header.nav.inverters"), path: "/catalog/inverters" },
    { label: t("header.nav.energyStorage"), path: "/catalog/batteries" },
    { label: t("header.nav.optimizers"), path: "/catalog/optimizers" },
    { label: t("header.nav.electrical"), path: null },
    { label: t("header.nav.eMobility"), path: null },
  ];

  return (
    <>
      {/* TOP BAR */}
      <div style={{ background: "#1a1a1a", color: "#fff", fontSize: 12, padding: isMobile ? "6px 16px" : "6px 40px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 20, opacity: .7 }}>
          {isMobile ? null : [{key:"about",label:t("header.topLinks.about")},{key:"blog",label:t("header.topLinks.blog")},{key:"faq",label:t("header.topLinks.faq")}].map(l => <a key={l.key} href="#" style={{ color: "#fff", textDecoration: "none" }}>{l.label}</a>)}
        </div>
        <span style={{ opacity: .7 }}>+33 1 XX XX XX XX</span>
      </div>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "#fff", borderBottom: "1px solid #e4e5ec", padding: isMobile ? "0 16px" : "0 40px", height: 56, display: "flex", alignItems: "center", gap: isMobile ? 12 : 24 }}>
        {/* Burger menu button (mobile only) */}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" fill="none" stroke="#333" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>}
            </svg>
          </button>
        )}

        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer", textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#E8700A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>suntrex</span>
        </Link>

        {/* Search bar - hidden on mobile */}
        {!isMobile && (
          <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
            <input placeholder={t("header.search")} style={{ width: "100%", height: 36, borderRadius: 6, border: "1px solid #d3d4db", padding: "0 36px 0 12px", fontSize: 13, outline: "none" }} />
            <button style={{ position: "absolute", right: 1, top: 1, bottom: 1, width: 34, borderRadius: "0 5px 5px 0", border: "none", background: "#E8700A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, marginLeft: "auto" }}>
          {!isMobile && <CurrencySwitcher />}
          {!isMobile && <LanguageSwitcher />}
          {isLoggedIn && currentUser ? (
            <>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#7b7b7b", position: "relative" }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              </button>
              <UserMenu user={currentUser} onLogout={onLogout} onNavigate={(p) => { navigate("/" + p) }} />
              {!isMobile && (
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#7b7b7b" }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
                </button>
              )}
            </>
          ) : (
            <>
              {!isMobile && <button onClick={onShowLogin} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#555" }}>{t("header.login")}</button>}
              <button onClick={onShowRegister} style={{ background: "#E8700A", border: "none", borderRadius: 6, padding: isMobile ? "6px 10px" : "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#fff", fontWeight: 600 }}>{t("header.register")}</button>
            </>
          )}
        </div>
      </header>

      {/* NAV - horizontal scroll on mobile */}
      <nav style={{ borderBottom: "1px solid #e4e5ec", padding: isMobile ? "0 16px" : "0 40px", height: 40, display: "flex", alignItems: "center", background: "#fff", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {NAV_ITEMS.map((item, i) => {
          const isActive = item.path && location.pathname === item.path;
          return (
            <button key={item.label} onClick={() => { if (item.path) { navigate(item.path); setMenuOpen(false); } }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 14px", height: 40, border: "none", background: "none", fontSize: 13, color: isActive ? "#E8700A" : i === 0 && isHome ? "#4CAF50" : "#7b7b7b", fontWeight: isActive || (i === 0 && isHome) ? 600 : 400, cursor: item.path ? "pointer" : "default", borderBottom: isActive ? "2px solid #E8700A" : i === 0 && isHome ? "2px solid #4CAF50" : "2px solid transparent", whiteSpace: "nowrap", fontFamily: "inherit", opacity: item.path ? 1 : .5, flexShrink: 0 }}>
              {item.label}{i > 0 && <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>}
            </button>
          );
        })}
        {!isMobile && <Link to="/catalog" style={{ marginLeft: "auto", fontSize: 13, color: "#E8700A", textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>{t("header.sellOnSuntrex")}</Link>}
      </nav>

      {/* Mobile slide-out menu */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 280, background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.15)", padding: "20px 16px", overflowY: "auto", animation: "fadeIn .2s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: 18 }}>suntrex</span>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#333" }}>✕</button>
            </div>

            {/* Mobile search */}
            <div style={{ marginBottom: 16, position: "relative" }}>
              <input placeholder={t("header.search")} style={{ width: "100%", height: 36, borderRadius: 6, border: "1px solid #d3d4db", padding: "0 36px 0 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <button style={{ position: "absolute", right: 1, top: 1, bottom: 1, width: 34, borderRadius: "0 5px 5px 0", border: "none", background: "#E8700A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
            </div>

            {/* Nav items */}
            {NAV_ITEMS.filter(i => i.path).map(item => (
              <button key={item.label} onClick={() => { navigate(item.path); setMenuOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 0", border: "none", borderBottom: "1px solid #f0f0f0", background: "none", fontSize: 14, color: "#333", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                {item.label}
              </button>
            ))}

            {/* Switchers */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <CurrencySwitcher />
              <LanguageSwitcher />
            </div>

            {/* Auth buttons */}
            {!isLoggedIn && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { onShowLogin(); setMenuOpen(false); }} style={{ width: "100%", padding: "10px 0", border: "1px solid #ddd", borderRadius: 6, background: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#555" }}>{t("header.login")}</button>
                <button onClick={() => { onShowRegister(); setMenuOpen(false); }} style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 6, background: "#E8700A", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#fff", fontWeight: 600 }}>{t("header.register")}</button>
              </div>
            )}

            {/* Links */}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#888" }}>
              {[{key:"about",label:t("header.topLinks.about")},{key:"blog",label:t("header.topLinks.blog")},{key:"faq",label:t("header.topLinks.faq")}].map(l => <a key={l.key} href="#" style={{ color: "#888", textDecoration: "none" }}>{l.label}</a>)}
            </div>
          </div>
        </div>
      )}

      {/* Verification pending banner */}
      {isLoggedIn && currentUser && currentUser.kycStatus !== "verified" && (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: isMobile ? "10px 16px" : "10px 40px", display: "flex", alignItems: "center", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <span style={{ fontSize: 16 }}>⏳</span>
          <div style={{ fontSize: 13, color: "#92400e", flex: 1 }}>
            <b>{t("header.verificationBanner.title")}</b> — {t("header.verificationBanner.message")}
          </div>
          <button onClick={() => navigate("/dashboard")} style={{ background: "#E8700A", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {t("header.verificationBanner.button")}
          </button>
        </div>
      )}
    </>
  );
}
