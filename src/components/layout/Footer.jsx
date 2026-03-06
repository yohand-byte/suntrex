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



// Payment brand logos — real recognizable SVGs
function StripeLogo() {
  return (
    <svg viewBox="0 0 120 50" width="80" height="34" style={{ borderRadius: 6 }}>
      <rect fill="#635BFF" width="120" height="50" rx="8"/>
      <g transform="translate(22,10) scale(0.065)">
        <path d="M414 166.7c0-55.8-27-95.7-78.6-95.7-51.9 0-83.2 39.9-83.2 95.3 0 62.9 37 94.6 90.1 94.6 25.9 0 45.5-5.9 60.2-14.1V204c-14.7 7.4-31.6 11.9-53 11.9-21 0-39.6-7.4-42-32.8h105.8c0-2.8.7-14 .7-16.4zm-107-20.3c0-24.4 14.9-34.5 28.5-34.5 13.2 0 27.2 10.1 27.2 34.5H307zM248.9 73.4c-21.2 0-34.9 10-42.5 16.9l-2.8-13.4H158v304.2l48.8-10.4.1-73.8c7.8 5.6 19.3 13.6 38.4 13.6 38.8 0 74.2-31.2 74.2-100 0-62.9-36-96.1-70.6-96.1zm-12.4 147.8c-12.8 0-20.4-4.5-25.6-10.1l-.3-79.7c5.6-6.2 13.4-10.5 25.9-10.5 19.8 0 33.5 22.2 33.5 50 0 28.7-13.4 50.3-33.5 50.3zM127.4 56.2l49-10.5V0L127.4 10.3v45.9zM127.4 76.9h49V261h-49V76.9zM79.5 89.7l-3.1-12.8H31.9V261h48.8V141.5c11.5-15 31-12.3 37.1-10.2V76.9c-6.3-2.4-29.4-6.8-38.3 12.8zM31.9 30L0 36.8v39.1l31.9-6.8V30z" fill="#fff"/>
      </g>
    </svg>
  );
}
function PayPalLogo() {
  return (
    <svg viewBox="0 0 120 50" width="80" height="34" style={{ borderRadius: 6 }}>
      <rect fill="#fff" width="120" height="50" rx="8" stroke="#e2e8f0"/>
      <g transform="translate(17,6) scale(0.75)">
        <path d="M46.2 11.4c-1.6-1.8-4.4-2.6-8-2.6h-10.5c-.7 0-1.4.5-1.5 1.3L22.5 36c-.1.5.3 1 .9 1h6.4l1.6-10.3v.3c.1-.7.8-1.3 1.5-1.3h3.2c6.2 0 11.1-2.5 12.5-9.8 0-.2.1-.4.1-.6.4-2.6 0-4.3-1.5-5.9" fill="#27346A"/>
        <path d="M48.2 17.9c-1.4 7.3-6.3 9.8-12.5 9.8h-3.2c-.7 0-1.4.5-1.5 1.3l-1.9 12.5c-.1.5.3.8.8.8h5.7c.6 0 1.2-.5 1.3-1.1l.1-.3 1-6.5.1-.3c.1-.6.7-1.1 1.3-1.1h.8c5.4 0 9.6-2.2 10.8-8.5.5-2.6.3-4.8-1.1-6.4-.4-.4-.9-.8-1.7-1.2" fill="#2790C3"/>
        <path d="M45.5 16.7c-.2-.1-.4-.1-.6-.2-.2-.1-.4-.1-.7-.1-2-.3-4.3-.1-6.8-.1h-8.6c-.2 0-.3 0-.5.1-.4.2-.7.6-.8 1.1l-1.7 11 0 .3c.1-.7.8-1.3 1.5-1.3h3.2c6.2 0 11.1-2.5 12.5-9.8 0-.2.1-.4.1-.6-.4-.2-.7-.3-1.1-.4-.2 0-.3-.1-.5-.1" fill="#1F264F"/>
      </g>
      <text x="72" y="22" fill="#27346A" fontSize="11" fontWeight="800" fontFamily="Arial,sans-serif">Pay</text>
      <text x="72" y="36" fill="#2790C3" fontSize="11" fontWeight="800" fontFamily="Arial,sans-serif">Pal</text>
    </svg>
  );
}
function ApplePayLogo() {
  return (
    <svg viewBox="0 0 120 50" width="80" height="34" style={{ borderRadius: 6 }}>
      <rect fill="#000" width="120" height="50" rx="8"/>
      <g transform="translate(20,10) scale(0.55)">
        {/* Apple logo */}
        <path d="M28.2 12.1c-1.5 1.8-4 3.2-6.4 3-0.3-2.5 0.9-5.1 2.3-6.7 1.6-1.9 4.2-3.2 6.3-3.3 0.3 2.6-0.7 5.2-2.2 7z" fill="#fff"/>
        <path d="M30.4 15.5c-3.5-0.2-6.5 2-8.2 2-1.7 0-4.2-1.9-7-1.8-3.6 0.1-6.9 2.1-8.8 5.3-3.7 6.5-1 16.1 2.7 21.3 1.8 2.6 3.9 5.5 6.7 5.4 2.7-0.1 3.7-1.7 6.9-1.7 3.2 0 4.1 1.7 6.9 1.7 2.9 0 4.7-2.6 6.5-5.2 2-3 2.8-5.8 2.9-6-0.1 0-5.5-2.1-5.6-8.4 0-5.2 4.3-7.8 4.5-7.9-2.5-3.6-6.3-4-7.5-4.1v-0.6z" fill="#fff"/>
      </g>
      <text x="62" y="33" fill="#fff" fontSize="17" fontWeight="600" fontFamily="-apple-system,SF Pro Display,Helvetica Neue,sans-serif" textAnchor="start">Pay</text>
    </svg>
  );
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
  var pad = isMobile ? "24px 16px" : isTablet ? "36px 24px 24px" : "56px 40px 28px";

  return (
    <footer style={{ background: "#1a1d26", padding: pad }}>
      {/* ── Columns ── */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isMobile ? 24 : isTablet ? 28 : 40, marginBottom: isMobile ? 28 : 36 }}>
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
          <a href="mailto:contact@suntrex.eu" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block", textDecoration: "none" }}>contact@suntrex.eu</a>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Tél / WhatsApp : +33 7 00 00 00 00</p>
        </div>

        {/* Col 2 — Navigation */}
        <div>
          <FooterHeading>Navigation</FooterHeading>
          <FooterLink label="Centre d'aide" onClick={function() { navigate("/faq"); }} />
          <FooterLink label="Blog" onClick={function() { navigate("/blog"); }} />
          <FooterLink label="Vendre sur SUNTREX" onClick={function() { navigate("/dashboard/sell"); }} />
          <FooterLink label="À propos" onClick={function() { navigate("/about"); }} />
          <FooterLink label="Conditions Générales" onClick={function() { navigate("/cgv"); }} />
          <FooterLink label="Politique de confidentialité" onClick={function() { navigate("/privacy"); }} />
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
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, justifyContent: isMobile ? "center" : "flex-start" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginRight: 4 }}>Paiements acceptés</span>
          <StripeLogo />
          <PayPalLogo />
          <ApplePayLogo />
        </div>
      </div>

      {/* ── Trust Badges ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, max-content)", gap: isMobile ? 10 : 28, marginBottom: 24, justifyContent: isMobile ? "center" : "flex-start" }}>
        <TrustBadge icon="🔒" label="Paiement sécurisé 3D Secure" />
        <TrustBadge icon="🚚" label="Livraison vérifiée SUNTREX" />
        <TrustBadge icon="🏷️" label="Commission -5% vs concurrence" />
        <TrustBadge icon="🇪🇺" label="Conforme RGPD" />
      </div>

      {/* ── Legal Bar ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 SUNTREX — Tous droits réservés</span>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "CGV", path: "/cgv" },
            { label: "Confidentialité", path: "/privacy" },
            { label: "Mentions légales", path: "/about" },
          ].map(function(l) {
            return <a key={l.label} href={l.path} onClick={function(e) { e.preventDefault(); navigate(l.path); }} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color .15s" }} onMouseEnter={function(e) { e.target.style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={function(e) { e.target.style.color = "rgba(255,255,255,0.35)"; }}>{l.label}</a>;
          })}
        </div>
      </div>
    </footer>
  );
}
