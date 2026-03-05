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



// Real payment brand SVG logos
function VisaLogo() {
  return <svg viewBox="0 0 780 500" width="52" height="34" style={{ borderRadius: 4 }}><rect fill="#1A1F71" width="780" height="500" rx="40"/><path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8zM541.8 156.3c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.5-90.2 64.5-.3 28.1 26.5 43.7 46.8 53.1 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.2 93-67.2.2-22.4-14.1-39.4-45.2-53.4-18.8-9.1-30.4-15.2-30.3-24.4 0-8.2 9.8-16.9 30.9-16.9 17.6-.3 30.4 3.6 40.4 7.6l4.8 2.3 7.3-42.7zM676.8 152.9h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.5h56.2s9.2-24.1 11.3-29.4c6.1 0 60.8.1 68.6.1 1.6 6.9 6.5 29.3 6.5 29.3h49.7l-43.6-195.8zm-65.8 126.5c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.8h-44.6zM232.8 152.9l-52.4 133.5-5.6-27.1c-9.7-31.2-40-65-73.9-81.9l47.9 171.1 56.6-.1 84.2-195.5h-56.8z" fill="#fff"/><path d="M131.9 152.9H46.5l-.7 4c67.2 16.2 111.7 55.5 130.1 102.6l-18.8-90.2c-3.2-12.4-12.8-16-25.2-16.4z" fill="#F2AE14"/></svg>;
}
function MastercardLogo() {
  return <svg viewBox="0 0 780 500" width="52" height="34" style={{ borderRadius: 4 }}><rect fill="#000" width="780" height="500" rx="40"/><circle cx="310" cy="250" r="150" fill="#EB001B"/><circle cx="470" cy="250" r="150" fill="#F79E1B"/><path d="M390 130.7c-38.1 30-62.5 76.3-62.5 128.3s24.4 98.3 62.5 128.3c38.1-30 62.5-76.3 62.5-128.3s-24.4-98.3-62.5-128.3z" fill="#FF5F00"/></svg>;
}
function SepaLogo() {
  return <svg viewBox="0 0 780 500" width="52" height="34" style={{ borderRadius: 4 }}><rect fill="#2B4D9B" width="780" height="500" rx="40"/><text x="390" y="280" fill="#fff" fontSize="160" fontFamily="Arial,sans-serif" fontWeight="700" textAnchor="middle">SEPA</text></svg>;
}
function ApplePayLogo() {
  return <svg viewBox="0 0 780 500" width="52" height="34" style={{ borderRadius: 4 }}><rect fill="#000" width="780" height="500" rx="40"/><text x="390" y="290" fill="#fff" fontSize="140" fontFamily="SF Pro,-apple-system,sans-serif" fontWeight="600" textAnchor="middle">Pay</text></svg>;
}
function GooglePayLogo() {
  return <svg viewBox="0 0 780 500" width="52" height="34" style={{ borderRadius: 4 }}><rect fill="#fff" stroke="#dadce0" width="780" height="500" rx="40"/><text x="390" y="290" fill="#3C4043" fontSize="150" fontFamily="Google Sans,Arial,sans-serif" fontWeight="500" textAnchor="middle">GPay</text></svg>;
}
function StripeLogo() {
  return <svg viewBox="0 0 780 500" width="52" height="34" style={{ borderRadius: 4 }}><rect fill="#635BFF" width="780" height="500" rx="40"/><text x="390" y="290" fill="#fff" fontSize="155" fontFamily="Arial,sans-serif" fontWeight="700" textAnchor="middle">stripe</text></svg>;
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
          <StripeLogo />
          <VisaLogo />
          <MastercardLogo />
          <SepaLogo />
          <ApplePayLogo />
          <GooglePayLogo />
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
          {["CGV", "Confidentialité", "Mentions légales"].map(function(l) {
            return <a key={l} href="#" onClick={function(e) { e.preventDefault(); }} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color .15s" }} onMouseEnter={function(e) { e.target.style.color = "rgba(255,255,255,0.7)"; }} onMouseLeave={function(e) { e.target.style.color = "rgba(255,255,255,0.35)"; }}>{l}</a>;
          })}
        </div>
      </div>
    </footer>
  );
}
