import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useResponsive from "../../hooks/useResponsive";

var CATEGORY_ROUTES = {
  panels: "/catalog/panels",
  inverters: "/catalog/inverters",
  storage: "/catalog/batteries",
  mounting: "/catalog/mounting",
  electrical: "/catalog/electrical",
  emobility: "/catalog/emobility",
};

function FooterLink({ label, onClick }) {
  var _h = useState(false), hovered = _h[0], setHovered = _h[1];
  return (
    <div
      onClick={onClick}
      onMouseEnter={function() { setHovered(true); }}
      onMouseLeave={function() { setHovered(false); }}
      style={{ fontSize: 13, color: hovered ? "#E8700A" : "rgba(255,255,255,0.55)", marginBottom: 10, cursor: "pointer", transition: "color .15s" }}
    >
      {label}
    </div>
  );
}

function FooterHeading({ children }) {
  return <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</h4>;
}

// Inline SVG payment icons
function StripeLogo() {
  return <svg width="42" height="18" viewBox="0 0 60 25" fill="none"><rect width="60" height="25" rx="4" fill="#635BFF"/><path d="M28.4 10.1c0-1.7-.8-3-2.3-3s-2.5 1.3-2.5 3 1 3 2.5 3c.7 0 1.3-.2 1.7-.5l-.5-1.1c-.3.2-.7.3-1.1.3-.7 0-1.2-.4-1.3-1.1h3.4c0-.2.1-.4.1-.6zm-3.5-.5c.1-.7.5-1.2 1.2-1.2.6 0 1 .5 1 1.2h-2.2zM20.8 7.1c-.7 0-1.2.3-1.5.8V7.2h-1.5v5.7h1.6V9.8c.2-.5.6-.8 1.1-.8.2 0 .3 0 .5.1l.3-1.5c-.2-.3-.3-.5-.5-.5zM15.7 7.2h-1.3V5.7l-1.6.3v1.2H12v1.3h.8v2.4c0 1.3.6 2 1.9 2 .4 0 .8-.1 1.1-.2l-.3-1.2c-.2.1-.4.1-.6.1-.5 0-.5-.3-.5-.8V8.5h1.3V7.2zM33.3 7.2l-1 3.8-1.1-3.8h-1.6l1.9 5.7h1.5l1.9-5.7h-1.6zM11 7.1c-1.5 0-2.6 1.1-2.6 3 0 1.8 1.1 3 2.8 3 .7 0 1.3-.2 1.8-.5l-.5-1.1c-.4.2-.8.3-1.2.3-.7 0-1.3-.3-1.4-1.1h3.5c0-.1 0-.4 0-.6 0-1.7-.8-3-2.4-3zm-1.2 2.5c.1-.7.5-1.2 1.1-1.2.6 0 1 .5 1.1 1.2H9.8zM37.7 7.1c-.5 0-.9.3-1.2.7V4.7h-1.6v8.2h1.6V9.8c.2-.5.5-.8 1-.8.4 0 .7.3.7.8v3.1h1.6V9.4c0-1.4-.7-2.3-2.1-2.3z" fill="#fff"/></svg>;
}
function VisaLogo() {
  return <svg width="38" height="14" viewBox="0 0 48 16"><path d="M18.5 1.2l-3.3 13.6h-2.7l3.3-13.6h2.7zM33.4 9.8l1.4-3.9.8 3.9h-2.2zm3 5l.8-2.1h-3.8L33 14.8h-2.8l4.2-12.5c.2-.5.6-.7 1.1-.7h2.2l3.4 13.2H38.4zM28.4 10.5c0 2.5-2.2 4.2-5.5 4.2-1.4 0-2.7-.3-3.5-.7l.5-2.1.3.1c1 .5 2 .7 3 .7.9 0 1.9-.4 1.9-1.2 0-.5-.4-.9-1.6-1.5-1.1-.5-2.7-1.4-2.7-3.1 0-2.2 1.9-3.8 4.6-3.8 1.2 0 2.2.3 2.8.5l-.5 2c-.5-.3-1.3-.6-2.3-.6-1 0-1.6.4-1.6 1 0 .6.7.9 1.6 1.3 1.5.7 2.9 1.6 3 3.2zM46 1.2l-2.6 13.6h-2.5l.2-.8c-.7.7-1.6 1-2.6 1-2 0-3.4-1.6-3.4-3.9 0-2.9 1.9-5.1 4.4-5.1.9 0 1.5.2 2 .6l.8-4.2L46 1.2zm-4.3 8c0-1-.5-1.7-1.4-1.7-1.1 0-2 1.1-2 2.5 0 1.1.6 1.8 1.4 1.8 1 0 2-1 2-2.6z" fill="#1A1F71"/></svg>;
}
function MastercardLogo() {
  return <svg width="28" height="18" viewBox="0 0 32 20"><rect x="0" y="0" width="32" height="20" rx="3" fill="#1a1d26" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/><circle cx="12" cy="10" r="7" fill="#EB001B"/><circle cx="20" cy="10" r="7" fill="#F79E1B"/><path d="M16 4.6a7 7 0 010 10.8 7 7 0 000-10.8z" fill="#FF5F00"/></svg>;
}
function SepaLogo() {
  return <svg width="38" height="18" viewBox="0 0 50 24"><rect width="50" height="24" rx="4" fill="#003D6B"/><text x="25" y="15.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="sans-serif">SEPA</text></svg>;
}
function ApplePayLogo() {
  return <svg width="38" height="18" viewBox="0 0 50 24"><rect width="50" height="24" rx="4" fill="#000"/><text x="25" y="15" textAnchor="middle" fontSize="8" fontWeight="600" fill="#fff" fontFamily="sans-serif"> Pay</text><path d="M14 7c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.4-.6.6-1 1.6-.9 2.6 1 0 2-.5 2.6-1.3z" fill="#fff"/><path d="M14.9 8.2c-1.4-.1-2.6.8-3.3.8s-1.7-.8-2.8-.7c-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.1 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.8-2.2-3.3 0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.6-3.2-1.9z" fill="#fff" transform="scale(0.5) translate(14, 2)"/></svg>;
}
function GooglePayLogo() {
  return <svg width="38" height="18" viewBox="0 0 50 24"><rect width="50" height="24" rx="4" fill="#fff" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/><text x="25" y="15" textAnchor="middle" fontSize="7.5" fontWeight="500" fill="#5f6368" fontFamily="sans-serif">G Pay</text><circle cx="12" cy="12" r="3" fill="none" stroke="#4285F4" strokeWidth="1.5"/><path d="M12 9v3l2 1" fill="none" stroke="#4285F4" strokeWidth="0.8"/></svg>;
}

// Trust badge component
function TrustBadge({ icon, label }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
    <span style={{ fontSize: 14 }}>{icon}</span>
    <span>{label}</span>
  </div>;
}

export default function Footer() {
  var _t = useTranslation(), t = _t.t;
  var _r = useResponsive(), isMobile = _r.isMobile, isTablet = _r.isTablet;
  var navigate = useNavigate();

  var gridCols = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1.6fr 1fr 1fr 1fr";
  var pad = isMobile ? "40px 16px 20px" : isTablet ? "48px 24px 24px" : "56px 40px 28px";

  return (
    <footer style={{ background: "#1a1d26", padding: pad }}>
      {/* ── Columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isMobile ? 32 : isTablet ? 32 : 40, marginBottom: isMobile ? 28 : 36 }}>
        {/* Col 1 — SUNTREX */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#E8700A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "-0.02em" }}>suntrex</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 16 }}>
            Marketplace B2B photovoltaïque.<br/>Panneaux, onduleurs, batteries &amp; plus pour les professionnels européens du solaire.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>contact@suntrex.eu</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Tél / WhatsApp : +33 7 00 00 00 00</p>
        </div>

        {/* Col 2 — Navigation */}
        <div>
          <FooterHeading>Navigation</FooterHeading>
          <FooterLink label="Centre d'aide" onClick={function() { navigate("/faq"); }} />
          <FooterLink label="Blog" onClick={function() { navigate("/blog"); }} />
          <FooterLink label="Vendre sur SUNTREX" onClick={function() { navigate("/dashboard/sell"); }} />
          <FooterLink label="À propos" onClick={function() {}} />
          <FooterLink label="Conditions Générales" onClick={function() {}} />
          <FooterLink label="Politique de confidentialité" onClick={function() {}} />
        </div>

        {/* Col 3 — Categories */}
        <div>
          <FooterHeading>Catégories</FooterHeading>
          {[
            { key: "panels", label: "Panneaux solaires" },
            { key: "inverters", label: "Onduleurs" },
            { key: "storage", label: "Batteries" },
            { key: "mounting", label: "Systèmes de montage" },
            { key: "electrical", label: "Électrotechnique" },
            { key: "emobility", label: "E-mobilité" },
          ].map(function(c) {
            return <FooterLink key={c.key} label={c.label} onClick={function() { navigate(CATEGORY_ROUTES[c.key]); }} />;
          })}
        </div>

        {/* Col 4 — Brands */}
        <div>
          <FooterHeading>Marques</FooterHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
            {["Huawei", "Deye", "Jinko", "LONGi", "Trina", "BYD", "SMA", "Enphase"].map(function(b) {
              return <FooterLink key={b} label={b} onClick={function() { navigate("/catalog/all?q=" + b); }} />;
            })}
          </div>
        </div>
      </div>

      {/* ── Payment Logos ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: isMobile ? 12 : 16, justifyContent: isMobile ? "center" : "flex-start" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginRight: 4 }}>Paiements acceptés</span>
          <StripeLogo /><VisaLogo /><MastercardLogo /><SepaLogo /><ApplePayLogo /><GooglePayLogo />
        </div>
      </div>

      {/* ── Trust Badges ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 16 : 28, marginBottom: 24, justifyContent: isMobile ? "center" : "flex-start" }}>
        <TrustBadge icon="🔒" label="Paiement sécurisé 3D Secure" />
        <TrustBadge icon="🚚" label="Livraison vérifiée SUNTREX" />
        <TrustBadge icon="🏷️" label="Commission -5% vs concurrence" />
        <TrustBadge icon="🇪🇺" label="Conforme RGPD" />
      </div>

      {/* ── Legal Bar ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 SUNTREX — Tous droits réservés</span>
        <div style={{ display: "flex", gap: 16 }}>
          {["CGV", "Confidentialité", "Mentions légales"].map(function(l) {
            return <a key={l} href="#" onClick={function(e) { e.preventDefault(); }} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color .15s" }} onMouseEnter={function(e) { e.target.style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={function(e) { e.target.style.color = "rgba(255,255,255,0.35)"; }}>{l}</a>;
          })}
        </div>
      </div>
    </footer>
  );
}
