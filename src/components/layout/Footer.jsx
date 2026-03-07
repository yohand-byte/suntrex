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



var PAYMENT_LOGOS = [
  { name: "Stripe", src: "https://cdn.worldvectorlogo.com/logos/stripe-4.svg" },
  { name: "PayPal", src: "https://img.icons8.com/color/96/paypal.png" },
  { name: "Apple Pay", src: "https://img.icons8.com/ios-filled/100/FFFFFF/apple-pay.png" },
];

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
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, justifyContent: isMobile ? "center" : "flex-start" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginRight: 4 }}>Paiements acceptés</span>
          {PAYMENT_LOGOS.map(function(logo) {
            return <img key={logo.name} src={logo.src} alt={logo.name} style={{ height: 30, width: "auto", objectFit: "contain" }} />;
          })}
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
