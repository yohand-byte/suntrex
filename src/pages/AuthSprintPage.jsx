import { useState, useEffect, useRef, useCallback } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 * SUNTREX — Sprint 1: Auth + KYC Simplifié + PriceGate
 * ═══════════════════════════════════════════════════════════════
 *
 * Complete authentication system with:
 * - Multi-step registration (2 steps max)
 * - KYC simplifié (VAT auto-verification via VIES simulation)
 * - RGPD-compliant consent checkboxes
 * - Login flow with password recovery
 * - PriceGate component (blur + CTA)
 * - Full landing page integration
 * - Supabase-ready auth hooks
 *
 * Design: sun.store-faithful, white/green/orange, professional B2B
 */

// ─── DESIGN TOKENS ─────────────────────────────────────────────
const T = {
  font: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', monospace",
  bg: "#ffffff",
  surface: "#f8f9fa",
  card: "#ffffff",
  border: "#e4e5ec",
  borderLight: "#f0f1f5",
  text: "#141413",
  textMuted: "#7b7b7b",
  textDim: "#a0a0a0",
  orange: "#E8700A",
  orangeHover: "#d4630a",
  orangeLight: "rgba(232,112,10,0.08)",
  orangeGlow: "rgba(232,112,10,0.15)",
  green: "#4CAF50",
  greenLight: "rgba(76,175,80,0.08)",
  greenDark: "#388E3C",
  red: "#e53935",
  redLight: "rgba(229,57,53,0.08)",
  blue: "#1976D2",
  blueLight: "rgba(25,118,210,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
  shadowLg: "0 12px 40px rgba(0,0,0,0.12)",
  shadowXl: "0 20px 60px rgba(0,0,0,0.18)",
  radius: 8,
  radiusLg: 12,
};

// ─── PRODUCT DATA (from Article_3.csv subset) ──────────────────
const PRODUCTS = [
  { id: 1, name: "Huawei SUN2000-5KTL-M2", sku: "HU-SUN-5KTL-M2", power: "5 kW", type: "String Inverter", brand: "Huawei", stock: 1364, price: 689, cat: "inverters", img: "/products/huawei-5ktl.jpg", phases: "1", mppt: 2, warranty: "10 ans" },
  { id: 2, name: "Huawei SUN2000-10KTL-M2", sku: "HU-SUN-10KTL-M2", power: "10 kW", type: "String Inverter", brand: "Huawei", stock: 1064, price: 1249, cat: "inverters", img: "/products/huawei-10ktl.jpg", phases: "3", mppt: 2, warranty: "10 ans" },
  { id: 3, name: "Huawei LUNA2000-5-S0", sku: "HU-LUNA-5S0", power: "5 kWh", type: "LFP Battery", brand: "Huawei", stock: 144, price: 1890, cat: "batteries", img: "/products/huawei-luna.webp", warranty: "10 ans" },
  { id: 4, name: "Deye SUN-12K-SG04LP3", sku: "DY-12K-SG04LP3", power: "12 kW", type: "Hybrid Inverter", brand: "Deye", stock: 800, price: 1450, cat: "inverters", img: "/products/deye-12k.jpg", phases: "3", mppt: 4, warranty: "5 ans" },
  { id: 5, name: "Huawei SUN2000-3KTL-M2", sku: "HU-SUN-3KTL-M2", power: "3 kW", type: "String Inverter", brand: "Huawei", stock: 10000, price: 479, cat: "inverters", img: "/products/huawei-3ktl.jpg", phases: "1", mppt: 2, warranty: "10 ans" },
  { id: 6, name: "Deye SUN-8K-SG04LP3-EU", sku: "DY-8K-SG04LP3", power: "8 kW", type: "Hybrid Inverter", brand: "Deye", stock: 620, price: 1180, cat: "inverters", img: "/products/deye-8k.jpg", phases: "3", mppt: 2, warranty: "5 ans" },
  { id: 7, name: "Huawei LUNA2000-10-S0", sku: "HU-LUNA-10S0", power: "10 kWh", type: "LFP Battery", brand: "Huawei", stock: 88, price: 3490, cat: "batteries", img: "/products/huawei-luna-10.webp", warranty: "10 ans" },
  { id: 8, name: "Huawei SUN2000-450W-P", sku: "HU-SUN-450W-P", power: "450 Wp", type: "Mono PERC", brand: "Huawei", stock: 5200, price: 89, cat: "panels", img: "/products/panel-450w.jpg", warranty: "25 ans" },
  { id: 9, name: "Hoymiles HMS-2000-4T", sku: "HM-HMS-2000-4T", power: "2 kW", type: "Micro-Inverter", brand: "Hoymiles", stock: 2400, price: 345, cat: "inverters", img: "/products/hoymiles-hms.jpg", phases: "1", warranty: "12 ans" },
  { id: 10, name: "Deye RW-M6.1-B", sku: "DY-RW-M6.1", power: "6.1 kWh", type: "LFP Battery", brand: "Deye", stock: 340, price: 2100, cat: "batteries", img: "/products/deye-battery.jpg", warranty: "10 ans" },
];

const BRANDS = [
  { n: "Huawei", c: "#e4002b" }, { n: "SolarEdge", c: "#e21e26" }, { n: "Jinko Solar", c: "#1a8c37" },
  { n: "JA Solar", c: "#003da6" }, { n: "Trina Solar", c: "#cc0000" }, { n: "LONGi", c: "#008c44" },
  { n: "Canadian Solar", c: "#003ca6" }, { n: "SMA", c: "#c00" }, { n: "Sungrow", c: "#1a5aa6" },
  { n: "BYD", c: "#c00" }, { n: "Growatt", c: "#ee7203" }, { n: "GoodWe", c: "#007ac1" },
  { n: "Deye", c: "#0068b7" }, { n: "Enphase", c: "#f47920" }, { n: "Risen", c: "#e60012" },
];

const EU_COUNTRIES = [
  { code: "FR", name: "France", flag: "🇫🇷", vatPrefix: "FR", vatLength: 13 },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", vatPrefix: "DE", vatLength: 11 },
  { code: "BE", name: "Belgique", flag: "🇧🇪", vatPrefix: "BE", vatLength: 12 },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", vatPrefix: "NL", vatLength: 14 },
  { code: "IT", name: "Italie", flag: "🇮🇹", vatPrefix: "IT", vatLength: 13 },
  { code: "ES", name: "Espagne", flag: "🇪🇸", vatPrefix: "ES", vatLength: 11 },
  { code: "AT", name: "Autriche", flag: "🇦🇹", vatPrefix: "ATU", vatLength: 11 },
  { code: "PT", name: "Portugal", flag: "🇵🇹", vatPrefix: "PT", vatLength: 11 },
  { code: "PL", name: "Pologne", flag: "🇵🇱", vatPrefix: "PL", vatLength: 12 },
  { code: "CH", name: "Suisse", flag: "🇨🇭", vatPrefix: "CHE", vatLength: 12 },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", vatPrefix: "LU", vatLength: 10 },
];

const ROLES = [
  { id: "installer", label: "Installateur", icon: "🔧" },
  { id: "distributor", label: "Distributeur", icon: "📦" },
  { id: "integrator", label: "Intégrateur / EPC", icon: "🏗️" },
  { id: "wholesaler", label: "Grossiste", icon: "🏭" },
  { id: "other", label: "Autre professionnel", icon: "💼" },
];

// ─── SUPABASE CLIENT ────────────────────────────────────────────
// In production: import { supabase } from './lib/supabase';
// Inline detection for Supabase availability
let _supabaseClient = null;
let _supabaseReady = false;

async function getSupabase() {
  if (_supabaseClient) return _supabaseClient;
  try {
    const url = import.meta.env?.VITE_SUPABASE_URL;
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js');
      _supabaseClient = createClient(url, key, {
        auth: { autoRefreshToken: true, persistSession: true, flowType: 'pkce' }
      });
      _supabaseReady = true;
      return _supabaseClient;
    }
  } catch (e) { /* Supabase not available */ }
  return null;
}

// Initialize on load
getSupabase();

// ─── ERROR TRANSLATION (Supabase EN → FR) ──────────────────────
function translateAuthError(msg) {
  if (!msg) return "Erreur inconnue";
  const map = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
    'User already registered': 'Un compte existe déjà avec cet email',
    'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 8 caractères',
    'Unable to validate email address: invalid format': "Format d'email invalide",
    'Email rate limit exceeded': 'Trop de tentatives. Réessayez dans quelques minutes',
    'For security purposes, you can only request this after': 'Veuillez patienter avant de réessayer',
    'Signup requires a valid password': 'Mot de passe requis',
  };
  for (const [eng, fra] of Object.entries(map)) {
    if (msg.includes(eng)) return fra;
  }
  return msg;
}

// ─── MAP SUPABASE PROFILE → UI SHAPE ───────────────────────────
function mapProfile(p) {
  if (!p) return null;
  return {
    id: p.id, email: p.email,
    firstName: p.first_name || p.firstName || "",
    lastName: p.last_name || p.lastName || "",
    companyName: p.company_name || p.companyName || "",
    vatNumber: p.vat_number || p.vatNumber || "",
    vatVerified: p.vat_verified || p.vatVerified || false,
    country: p.country || "", role: p.role || "",
    phone: p.phone || "", isVerified: p.is_verified ?? p.isVerified ?? true,
    kycStatus: p.kyc_status || "pending",
    isSeller: p.is_seller || false,
  };
}

// ─── VIES VAT VALIDATION (Netlify Function + fallback) ──────────
async function validateVAT(vatNumber) {
  // Try real Netlify Function first
  try {
    const response = await fetch('/.netlify/functions/verify-vat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vatNumber: vatNumber.replace(/[\s.-]/g, '').toUpperCase(),
        countryCode: vatNumber.replace(/[\s.-]/g, '').toUpperCase().slice(0, 2),
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (!data.service_unavailable) return data;
    }
  } catch { /* Netlify function not available — fallback to simulation */ }

  // Fallback: simulated VIES response for dev/preview
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
  const cleaned = vatNumber.replace(/[\s.-]/g, "").toUpperCase();
  if (cleaned.length < 8) return { valid: false, error: "Numéro trop court" };
  const isValid = cleaned.length >= 9 && !cleaned.endsWith("000");
  if (isValid) {
    return {
      valid: true,
      company: "Solar Pro " + cleaned.slice(2, 5) + " SAS",
      address: "12 Rue de l'Innovation, 75001 Paris",
      country: cleaned.slice(0, 2),
    };
  }
  return { valid: false, error: "Numéro TVA invalide ou non trouvé dans VIES" };
}

// ─── ICONS ─────────────────────────────────────────────────────
const Icons = {
  sun: (s = 16, c = "#fff") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill={c} />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  eye: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  lock: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  check: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  x: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  loader: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  shield: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  mail: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  ),
  search: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  user: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  building: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  ),
  bell: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  cart: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  arrowRight: (s = 16, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  chevDown: (s = 10, c = "currentColor") => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

// ─── ANIMATED COMPONENTS ───────────────────────────────────────
function FadeIn({ children, delay = 0, duration = 400, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: `opacity ${duration}ms ease, transform ${duration}ms ease`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── INPUT COMPONENT ───────────────────────────────────────────
function Input({ label, icon, error, success, suffix, type = "text", ...props }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5, letterSpacing: "0.01em" }}>{label}</label>}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        height: 44,
        borderRadius: T.radius,
        border: `1.5px solid ${error ? T.red : focused ? T.orange : T.border}`,
        background: error ? T.redLight : focused ? T.orangeLight : T.bg,
        transition: "all 0.2s",
        overflow: "hidden",
      }}>
        {icon && <div style={{ display: "flex", alignItems: "center", paddingLeft: 12, color: error ? T.red : focused ? T.orange : T.textDim }}>{icon}</div>}
        <input
          type={inputType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            background: "transparent",
            padding: `0 ${isPassword || suffix ? "36px" : "12px"} 0 ${icon ? "8px" : "12px"}`,
            fontSize: 14,
            color: T.text,
            outline: "none",
            fontFamily: T.font,
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textDim, display: "flex", padding: 4 }}
          >
            {showPw ? Icons.eyeOff(16) : Icons.eye(16)}
          </button>
        )}
        {suffix && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 4 }}>{suffix}</div>}
      </div>
      {error && <div style={{ fontSize: 11, color: T.red, marginTop: 4, fontWeight: 500 }}>{error}</div>}
      {success && <div style={{ fontSize: 11, color: T.green, marginTop: 4, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>{Icons.check(12, T.green)} {success}</div>}
    </div>
  );
}

// ─── CHECKBOX COMPONENT ────────────────────────────────────────
function Checkbox({ checked, onChange, label, required, children }) {
  return (
    <label style={{ display: "flex", gap: 10, cursor: "pointer", fontSize: 12, color: T.textMuted, lineHeight: 1.5, alignItems: "flex-start" }}>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{
          width: 18, height: 18, minWidth: 18,
          borderRadius: 4,
          border: `1.5px solid ${checked ? T.green : T.border}`,
          background: checked ? T.green : T.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
          marginTop: 1,
          cursor: "pointer",
        }}
      >
        {checked && Icons.check(11, "#fff")}
      </div>
      <span onClick={(e) => { e.preventDefault(); onChange(!checked); }}>
        {children || label}
        {required && <span style={{ color: T.red, marginLeft: 2 }}>*</span>}
      </span>
    </label>
  );
}

// ─── SELECT COMPONENT ──────────────────────────────────────────
function Select({ label, options, value, onChange, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 5 }}>{label}</label>}
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", height: 44, borderRadius: T.radius,
            border: `1.5px solid ${error ? T.red : focused ? T.orange : T.border}`,
            background: error ? T.redLight : focused ? T.orangeLight : T.bg,
            padding: "0 32px 0 12px", fontSize: 14, color: value ? T.text : T.textDim,
            outline: "none", cursor: "pointer", fontFamily: T.font,
            appearance: "none", transition: "all 0.2s",
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.textDim }}>{Icons.chevDown(12)}</div>
      </div>
      {error && <div style={{ fontSize: 11, color: T.red, marginTop: 4, fontWeight: 500 }}>{error}</div>}
    </div>
  );
}

// ─── BUTTON COMPONENT ──────────────────────────────────────────
function Btn({ children, variant = "primary", size = "md", loading, disabled, fullWidth, onClick, style: customStyle = {} }) {
  const [hover, setHover] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    border: "none", cursor: disabled || loading ? "not-allowed" : "pointer",
    fontFamily: T.font, fontWeight: 600, borderRadius: T.radius,
    transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
    width: fullWidth ? "100%" : undefined,
    letterSpacing: "0.01em",
  };
  const sizes = {
    sm: { height: 34, padding: "0 14px", fontSize: 12 },
    md: { height: 44, padding: "0 20px", fontSize: 14 },
    lg: { height: 50, padding: "0 28px", fontSize: 15 },
  };
  const variants = {
    primary: { background: hover && !disabled ? T.orangeHover : T.orange, color: "#fff", boxShadow: hover ? "0 4px 12px rgba(232,112,10,0.3)" : "none" },
    secondary: { background: hover ? T.surface : T.bg, color: T.text, border: `1.5px solid ${T.border}`, boxShadow: hover ? T.shadow : "none" },
    ghost: { background: hover ? T.orangeLight : "transparent", color: T.orange },
    green: { background: hover ? T.greenDark : T.green, color: "#fff", boxShadow: hover ? "0 4px 12px rgba(76,175,80,0.3)" : "none" },
  };
  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...sizes[size], ...variants[variant], ...customStyle }}
    >
      {loading ? <div style={{ animation: "spin 1s linear infinite" }}>{Icons.loader(size === "sm" ? 14 : 16, "currentColor")}</div> : children}
    </button>
  );
}

// ─── PRICE GATE COMPONENT ──────────────────────────────────────
function PriceGate({ price, onLogin }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        fontSize: 22, fontWeight: 700, color: T.textDim,
        filter: "blur(6px)", userSelect: "none", pointerEvents: "none",
        letterSpacing: "-0.02em",
      }}>
        €{price?.toLocaleString("fr-FR")} <span style={{ fontSize: 12, fontWeight: 400 }}>/pcs</span>
      </div>
      <button
        onClick={onLogin}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "absolute", inset: "-6px -10px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: hover ? T.orange : "rgba(232,112,10,0.08)",
          border: `1.5px solid ${hover ? T.orange : "rgba(232,112,10,0.3)"}`,
          borderRadius: 8, cursor: "pointer",
          color: hover ? "#fff" : T.orange,
          fontSize: 12, fontWeight: 700, fontFamily: T.font,
          transition: "all 0.2s",
        }}
      >
        {Icons.lock(13, hover ? "#fff" : T.orange)} S'inscrire pour voir le prix
      </button>
    </div>
  );
}

// ─── VAT INPUT WITH VERIFICATION ───────────────────────────────
function VATInput({ value, onChange, country, onVerified }) {
  const [status, setStatus] = useState("idle"); // idle | checking | valid | invalid
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const verify = useCallback(async (vat) => {
    if (!vat || vat.length < 6) {
      setStatus("idle");
      setResult(null);
      setError(null);
      return;
    }
    setStatus("checking");
    setError(null);
    try {
      const res = await validateVAT(vat);
      if (res.valid) {
        setStatus("valid");
        setResult(res);
        setError(null);
        onVerified?.(res);
      } else {
        setStatus("invalid");
        setResult(null);
        setError(res.error);
      }
    } catch {
      setStatus("invalid");
      setError("Erreur de connexion VIES");
    }
  }, [onVerified]);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (value && value.length >= 6) {
      timeoutRef.current = setTimeout(() => verify(value), 1500);
    } else {
      setStatus("idle");
      setResult(null);
      setError(null);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [value, verify]);

  const prefix = country ? EU_COUNTRIES.find(c => c.code === country)?.vatPrefix || "" : "";

  const suffix = (
    <>
      {status === "checking" && <div style={{ animation: "spin 1s linear infinite", color: T.orange }}>{Icons.loader(14, T.orange)}</div>}
      {status === "valid" && <div style={{ color: T.green, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>{Icons.check(14, T.green)} Vérifié</div>}
      {status === "invalid" && <div style={{ color: T.red }}>{Icons.x(14, T.red)}</div>}
    </>
  );

  return (
    <div>
      <Input
        label="Numéro de TVA intracommunautaire"
        placeholder={prefix ? `${prefix}XXXXXXXXX` : "Numéro TVA"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        suffix={suffix}
        error={status === "invalid" ? error : undefined}
        success={status === "valid" ? `${result.company}` : undefined}
      />
      {status === "valid" && result && (
        <FadeIn>
          <div style={{
            background: T.greenLight, border: `1px solid rgba(76,175,80,0.2)`,
            borderRadius: T.radius, padding: "10px 14px", marginTop: -6, marginBottom: 14,
            fontSize: 12, color: T.greenDark, display: "flex", flexDirection: "column", gap: 2,
          }}>
            <div style={{ fontWeight: 700 }}>{result.company}</div>
            <div style={{ opacity: 0.8 }}>{result.address}</div>
          </div>
        </FadeIn>
      )}
      <div style={{ fontSize: 11, color: T.textDim, marginTop: -8, marginBottom: 10 }}>
        Vérifié automatiquement via le registre européen VIES. Optionnel au moment de l'inscription.
      </div>
    </div>
  );
}

// ─── STEP INDICATOR ────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: i < current ? T.green : i === current ? T.orange : T.borderLight,
            color: i <= current ? "#fff" : T.textDim,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700,
            transition: "all 0.3s",
            boxShadow: i === current ? "0 0 0 4px rgba(232,112,10,0.15)" : "none",
          }}>
            {i < current ? Icons.check(13, "#fff") : i + 1}
          </div>
          {i < total - 1 && <div style={{ width: 32, height: 2, borderRadius: 1, background: i < current ? T.green : T.borderLight, transition: "all 0.3s" }} />}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUTH MODAL — Registration + Login
// ═══════════════════════════════════════════════════════════════
function AuthModal({ isOpen, onClose, onAuth, initialMode = "register" }) {
  const [mode, setMode] = useState(initialMode); // register | login | forgot
  const [step, setStep] = useState(0); // 0 = credentials, 1 = company info
  const [loading, setLoading] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState(false);
  const [vatResult, setVatResult] = useState(null);

  // Registration fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [vatVerified, setVatVerified] = useState(false);

  // RGPD Consents
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [marketingSuntrex, setMarketingSuntrex] = useState(false);
  const [marketingPartners, setMarketingPartners] = useState(false);

  // Errors
  const [errors, setErrors] = useState({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep(0);
      setErrors({});
      setLoginError("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Validation
  const validateStep0 = () => {
    const e = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email professionnel requis";
    if (!password || password.length < 8) e.password = "8 caractères minimum";
    if (!firstName.trim()) e.firstName = "Requis";
    if (!lastName.trim()) e.lastName = "Requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!companyName.trim()) e.companyName = "Nom de l'entreprise requis";
    if (!country) e.country = "Pays requis";
    if (!role) e.role = "Activité requise";
    if (!cgvAccepted) e.cgv = "Vous devez accepter les CGV et la politique de confidentialité";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep0()) setStep(1);
  };

  // ─── REGISTER — Real Supabase Auth ─────────────────────────────
  const handleRegister = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    setErrors({});

    try {
      const sb = await getSupabase();

      if (sb) {
        // 🔌 PRODUCTION: Real Supabase Auth
        const { data: authData, error: authError } = await sb.auth.signUp({
          email, password,
          options: {
            data: { first_name: firstName, last_name: lastName, role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) throw new Error(authError.message);
        const userId = authData.user?.id;
        if (!userId) throw new Error("Inscription échouée");

        // Update profile with phone
        if (phone) await sb.from('profiles').update({ phone }).eq('id', userId);

        // Create company
        await sb.from('companies').insert({
          owner_user_id: userId, legal_name: companyName, country_code: country,
          vat_number: vatNumber || null, vat_verified: vatVerified || false,
          vat_company_name: vatResult?.company || null,
          vat_address: vatResult?.address || null,
        });

        // Record RGPD consents (audit trail)
        await sb.from('consents').insert([
          { user_id: userId, consent_type: 'cgv_privacy', granted: true },
          { user_id: userId, consent_type: 'marketing_suntrex', granted: !!marketingSuntrex },
          { user_id: userId, consent_type: 'marketing_partners', granted: !!marketingPartners },
        ]);

        // If email confirmation required (Supabase default), show confirmation screen
        if (!authData.session) {
          setEmailConfirmation(true);
          setLoading(false);
          return;
        }

        // Fetch full profile + company view
        const { data: profile } = await sb.from('user_with_company').select('*').eq('id', userId).single();
        setLoading(false);
        onAuth(mapProfile(profile || { id: userId, email, first_name: firstName, last_name: lastName, company_name: companyName, is_verified: true }));
        return;
      }

      // 🧪 DEMO fallback (no Supabase)
      await new Promise(r => setTimeout(r, 1500));
      const demoUser = { email, firstName, lastName, companyName, vatNumber, vatVerified, country, role, phone, isVerified: true };
      localStorage.setItem('suntrex_user', JSON.stringify(demoUser));
      setLoading(false);
      onAuth(demoUser);

    } catch (err) {
      setErrors({ general: translateAuthError(err.message) });
      setLoading(false);
    }
  };

  // ─── LOGIN — Real Supabase Auth ────────────────────────────────
  const handleLogin = async () => {
    setLoginError("");
    if (!loginEmail || !loginPassword) { setLoginError("Email et mot de passe requis"); return; }
    setLoading(true);

    try {
      const sb = await getSupabase();

      if (sb) {
        const { data, error } = await sb.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
        if (error) throw new Error(error.message);

        // Update last_login_at
        await sb.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

        // Fetch full profile
        const { data: profile } = await sb.from('user_with_company').select('*').eq('id', data.user.id).single();
        setLoading(false);
        onAuth(mapProfile(profile || { id: data.user.id, email: loginEmail, is_verified: true }));
        return;
      }

      // 🧪 DEMO fallback
      await new Promise(r => setTimeout(r, 1000));
      const demoUser = { email: loginEmail, firstName: "Jean", lastName: "Dupont", companyName: "Solar Pro SAS", isVerified: true };
      localStorage.setItem('suntrex_user', JSON.stringify(demoUser));
      setLoading(false);
      onAuth(demoUser);

    } catch (err) {
      setLoginError(translateAuthError(err.message));
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD — Real Supabase Auth ──────────────────────
  const handleForgot = async () => {
    setLoading(true);
    try {
      const sb = await getSupabase();
      if (sb) {
        const { error } = await sb.auth.resetPasswordForEmail(forgotEmail, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw new Error(error.message);
      } else {
        await new Promise(r => setTimeout(r, 1000)); // Demo fallback
      }
      setForgotSent(true);
    } catch (err) {
      setErrors({ forgot: translateAuthError(err.message) });
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.card, borderRadius: 16, width: "100%", maxWidth: 460,
        boxShadow: T.shadowXl, overflow: "hidden",
        maxHeight: "90vh", overflowY: "auto",
        animation: "modalIn 0.3s ease-out",
      }}>
        {/* Header */}
        <div style={{
          padding: "28px 32px 0", textAlign: "center", position: "relative",
        }}>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: T.textDim, padding: 4,
          }}>{Icons.x(18)}</button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: T.orange,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{Icons.sun(18)}</div>
            <span style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: "-0.03em" }}>suntrex</span>
          </div>

          {mode === "register" && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>
                {step === 0 ? "Créez votre compte" : "Votre entreprise"}
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>
                {step === 0 ? "Accédez aux meilleurs prix B2B du photovoltaïque" : "Quelques informations pour personnaliser votre expérience"}
              </p>
              <StepIndicator current={step} total={2} />
            </>
          )}
          {mode === "login" && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Bon retour !</h2>
              <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>Connectez-vous à votre compte SUNTREX</p>
            </>
          )}
          {mode === "forgot" && (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Mot de passe oublié ?</h2>
              <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4, marginBottom: 20 }}>Entrez votre email, nous vous enverrons un lien de réinitialisation</p>
            </>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "0 32px 28px" }}>

          {/* ── EMAIL CONFIRMATION SCREEN ── */}
          {emailConfirmation && (
            <FadeIn>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.greenLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  {Icons.mail(28, T.green)}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>Vérifiez votre email</h3>
                <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
                  Un email de confirmation a été envoyé à <strong style={{ color: T.text }}>{email}</strong>.
                  Cliquez sur le lien pour activer votre compte et accéder aux prix.
                </p>
                <div style={{ background: T.surface, borderRadius: T.radius, padding: 14, fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>
                  Vous ne trouvez pas l'email ? Vérifiez vos spams ou{' '}
                  <button onClick={() => setEmailConfirmation(false)} style={{ background: "none", border: "none", color: T.orange, cursor: "pointer", fontWeight: 600, fontFamily: T.font, fontSize: 12 }}>
                    réessayez avec un autre email
                  </button>
                </div>
                <button onClick={onClose} style={{ marginTop: 16, background: "none", border: "none", color: T.orange, cursor: "pointer", fontWeight: 600, fontFamily: T.font, fontSize: 13 }}>Fermer</button>
              </div>
            </FadeIn>
          )}

          {/* ── GENERAL ERROR ── */}
          {errors.general && !emailConfirmation && (
            <div style={{ background: T.redLight, border: `1px solid ${T.red}20`, borderRadius: T.radius, padding: "10px 14px", fontSize: 12, color: T.red, marginBottom: 16 }}>
              {errors.general}
            </div>
          )}

          {/* ── REGISTER STEP 0 ── */}
          {mode === "register" && step === 0 && !emailConfirmation && (
            <FadeIn key="reg-0">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <Input label="Prénom" placeholder="Jean" value={firstName} onChange={e => setFirstName(e.target.value)} error={errors.firstName} />
                <Input label="Nom" placeholder="Dupont" value={lastName} onChange={e => setLastName(e.target.value)} error={errors.lastName} />
              </div>
              <Input label="Email professionnel" placeholder="jean@entreprise.com" type="email" icon={Icons.mail(15, T.textDim)} value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
              <Input label="Mot de passe" placeholder="8 caractères minimum" type="password" icon={Icons.lock(15, T.textDim)} value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />

              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {[
                  { ok: password.length >= 8, t: "8+ car." },
                  { ok: /[A-Z]/.test(password), t: "Majuscule" },
                  { ok: /[0-9]/.test(password), t: "Chiffre" },
                ].map((r, i) => (
                  <div key={i} style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "2px 8px", borderRadius: 20,
                    background: r.ok ? T.greenLight : T.surface,
                    color: r.ok ? T.green : T.textDim,
                    transition: "all 0.2s",
                  }}>
                    {r.ok ? "✓" : "○"} {r.t}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14 }}>
                <Btn variant="primary" fullWidth onClick={handleNextStep}>Continuer {Icons.arrowRight(14, "#fff")}</Btn>
              </div>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.textMuted }}>
                Déjà un compte ?{" "}
                <span onClick={() => setMode("login")} style={{ color: T.orange, cursor: "pointer", fontWeight: 600 }}>Se connecter</span>
              </div>
            </FadeIn>
          )}

          {/* ── REGISTER STEP 1 ── */}
          {mode === "register" && step === 1 && !emailConfirmation && (
            <FadeIn key="reg-1">
              <Input label="Nom de l'entreprise" placeholder="Solar Pro SAS" icon={Icons.building(15, T.textDim)} value={companyName} onChange={e => setCompanyName(e.target.value)} error={errors.companyName} />

              <Select
                label="Pays"
                placeholder="Sélectionnez votre pays"
                value={country}
                onChange={setCountry}
                options={EU_COUNTRIES.map(c => ({ value: c.code, label: `${c.flag} ${c.name}` }))}
                error={errors.country}
              />

              <Select
                label="Activité principale"
                placeholder="Quel est votre métier ?"
                value={role}
                onChange={setRole}
                options={ROLES.map(r => ({ value: r.id, label: `${r.icon} ${r.label}` }))}
                error={errors.role}
              />

              <Input label="Téléphone (optionnel)" placeholder="+33 6 12 34 56 78" value={phone} onChange={e => setPhone(e.target.value)} />

              <VATInput value={vatNumber} onChange={setVatNumber} country={country} onVerified={(res) => { setVatVerified(true); setVatResult(res); }} />

              {/* RGPD CONSENTS */}
              <div style={{
                background: T.surface, borderRadius: T.radius,
                padding: "14px 16px", marginBottom: 16,
                border: `1px solid ${errors.cgv ? T.red : T.borderLight}`,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
                  Consentements
                </div>
                <Checkbox checked={cgvAccepted} onChange={setCgvAccepted} required>
                  J'accepte les <a href="#" style={{ color: T.orange, textDecoration: "underline" }}>Conditions Générales de Vente</a> et la <a href="#" style={{ color: T.orange, textDecoration: "underline" }}>Politique de confidentialité</a>
                </Checkbox>
                <Checkbox checked={marketingSuntrex} onChange={setMarketingSuntrex}>
                  J'accepte de recevoir les offres et actualités SUNTREX par email
                </Checkbox>
                <Checkbox checked={marketingPartners} onChange={setMarketingPartners}>
                  J'accepte de recevoir les offres des partenaires SUNTREX
                </Checkbox>
                {errors.cgv && <div style={{ fontSize: 11, color: T.red, fontWeight: 500 }}>{errors.cgv}</div>}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="secondary" onClick={() => setStep(0)} style={{ flex: "0 0 auto" }}>← Retour</Btn>
                <Btn variant="primary" fullWidth loading={loading} onClick={handleRegister}>
                  {Icons.shield(14, "#fff")} Créer mon compte
                </Btn>
              </div>
            </FadeIn>
          )}

          {/* ── LOGIN ── */}
          {mode === "login" && (
            <FadeIn key="login">
              <Input label="Email" placeholder="jean@entreprise.com" type="email" icon={Icons.mail(15, T.textDim)} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <Input label="Mot de passe" type="password" icon={Icons.lock(15, T.textDim)} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
              {loginError && <div style={{ fontSize: 12, color: T.red, marginBottom: 10, fontWeight: 500 }}>{loginError}</div>}

              <div style={{ textAlign: "right", marginBottom: 14 }}>
                <span onClick={() => setMode("forgot")} style={{ fontSize: 12, color: T.orange, cursor: "pointer", fontWeight: 500 }}>Mot de passe oublié ?</span>
              </div>

              <Btn variant="primary" fullWidth loading={loading} onClick={handleLogin}>Se connecter</Btn>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.textMuted }}>
                Pas encore de compte ?{" "}
                <span onClick={() => setMode("register")} style={{ color: T.orange, cursor: "pointer", fontWeight: 600 }}>Créer un compte</span>
              </div>
            </FadeIn>
          )}

          {/* ── FORGOT ── */}
          {mode === "forgot" && (
            <FadeIn key="forgot">
              {!forgotSent ? (
                <>
                  <Input label="Email" placeholder="jean@entreprise.com" type="email" icon={Icons.mail(15, T.textDim)} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                  <Btn variant="primary" fullWidth loading={loading} onClick={handleForgot}>Envoyer le lien de réinitialisation</Btn>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: T.text }}>Email envoyé !</h3>
                  <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
                    Si un compte existe pour <b>{forgotEmail}</b>, vous recevrez un lien de réinitialisation dans quelques minutes.
                  </p>
                </div>
              )}
              <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: T.textMuted }}>
                <span onClick={() => setMode("login")} style={{ color: T.orange, cursor: "pointer", fontWeight: 500 }}>← Retour à la connexion</span>
              </div>
            </FadeIn>
          )}

          {/* Trust badges */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 16,
            marginTop: 20, paddingTop: 16,
            borderTop: `1px solid ${T.borderLight}`,
          }}>
            {[
              { icon: "🔒", label: "Chiffré SSL" },
              { icon: "🇪🇺", label: "RGPD" },
              { icon: "⚡", label: "Stripe Secure" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.textDim, fontWeight: 500 }}>
                <span>{b.icon}</span>{b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT CARD ──────────────────────────────────────────────
function ProductCard({ product, isLoggedIn, onLogin }) {
  const [hover, setHover] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: T.radiusLg, border: `1px solid ${hover ? "rgba(232,112,10,0.3)" : T.border}`,
        background: T.card, overflow: "hidden", cursor: "pointer",
        transition: "all 0.2s",
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? T.shadowMd : T.shadow,
      }}
    >
      {/* Stock badge */}
      <div style={{ padding: "8px 12px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: product.stock > 100 ? T.green : product.stock > 10 ? "#f59e0b" : T.red,
        }}>
          ● {product.stock > 1000 ? `${(product.stock / 1000).toFixed(1)}k` : product.stock} pcs
        </span>
        {product.brand && (
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {product.brand}
          </span>
        )}
      </div>

      {/* Image */}
      <div style={{
        height: 130, display: "flex", alignItems: "center", justifyContent: "center",
        background: T.surface, margin: "6px 10px", borderRadius: 8,
        overflow: "hidden",
      }}>
        {!imgErr ? (
          <img src={product.img} alt={product.name} style={{ maxHeight: 110, maxWidth: "90%", objectFit: "contain", transition: "transform 0.3s", transform: hover ? "scale(1.05)" : "scale(1)" }} onError={() => setImgErr(true)} />
        ) : (
          <div style={{ fontSize: 40, opacity: 0.2 }}>☀</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "8px 12px 14px" }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, color: T.text, minHeight: 34 }}>{product.name}</h3>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: T.textMuted, marginBottom: 10 }}>
          <span>Puissance<br /><b style={{ color: T.text }}>{product.power}</b></span>
          <span>Type<br /><b style={{ color: T.text }}>{product.type?.split(" ")[0]}</b></span>
          {product.phases && <span>Phases<br /><b style={{ color: T.text }}>{product.phases}</b></span>}
        </div>

        {/* Price or PriceGate */}
        {isLoggedIn ? (
          <div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Dès</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.orange, letterSpacing: "-0.02em" }}>
              €{product.price.toLocaleString("fr-FR")}
              <span style={{ fontSize: 11, fontWeight: 400, color: T.textMuted }}> /pcs</span>
            </div>
            <div style={{ fontSize: 10, color: T.green, fontWeight: 500, marginTop: 2 }}>
              3 vendeurs · Meilleur prix
            </div>
          </div>
        ) : (
          <PriceGate price={product.price} onLogin={onLogin} />
        )}
      </div>
    </div>
  );
}

// ─── USER MENU (logged in) ─────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          padding: "4px 8px", borderRadius: T.radius,
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.target.style.background = T.surface}
        onMouseLeave={e => e.target.style.background = "transparent"}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.orange}, ${T.green})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 12, fontWeight: 700,
        }}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{user.firstName} {user.lastName}</div>
          <div style={{ fontSize: 10, color: T.textDim }}>{user.companyName}</div>
        </div>
        {Icons.chevDown(10, T.textDim)}
      </button>

      {open && (
        <FadeIn duration={150} style={{
          position: "absolute", top: "100%", right: 0, marginTop: 6,
          background: T.card, borderRadius: T.radiusLg, border: `1px solid ${T.border}`,
          boxShadow: T.shadowLg, minWidth: 220, overflow: "hidden", zIndex: 100,
        }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{user.firstName} {user.lastName}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>{user.email}</div>
            {user.isVerified && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 10, fontWeight: 700, color: T.green, background: T.greenLight, padding: "2px 8px", borderRadius: 20 }}>
                {Icons.check(10, T.green)} Compte vérifié
              </div>
            )}
          </div>
          {[
            { label: "Mon profil", icon: "👤" },
            { label: "Mes achats", icon: "📦" },
            { label: "Notifications", icon: "🔔" },
            { label: "Paramètres", icon: "⚙️" },
          ].map((item, i) => (
            <button key={i} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 16px", background: "none", border: "none",
              cursor: "pointer", fontSize: 13, color: T.text, fontFamily: T.font,
              transition: "background 0.1s",
            }}
              onMouseEnter={e => e.target.style.background = T.surface}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${T.borderLight}` }}>
            <button onClick={() => { setOpen(false); onLogout(); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 16px", background: "none", border: "none",
              cursor: "pointer", fontSize: 13, color: T.red, fontFamily: T.font, fontWeight: 500,
            }}>
              ← Se déconnecter
            </button>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function SuntrexApp() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [toastMsg, setToastMsg] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // ─── SESSION PERSISTENCE: auto-login on page load ─────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sb = await getSupabase();
        if (sb) {
          // Real Supabase session check
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user && mounted) {
            const { data: profile } = await sb.from('user_with_company').select('*').eq('id', session.user.id).single();
            setUser(mapProfile(profile || { id: session.user.id, email: session.user.email, is_verified: true }));
          }
          // Listen for auth state changes
          sb.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await sb.from('user_with_company').select('*').eq('id', session.user.id).single();
              setUser(mapProfile(profile || { id: session.user.id, email: session.user.email }));
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
          });
        } else {
          // Demo: check localStorage
          const stored = localStorage.getItem('suntrex_user');
          if (stored && mounted) setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('[SUNTREX] Session check failed:', e);
      }
      if (mounted) setSessionLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const isLoggedIn = !!user;

  const openRegister = () => { setAuthMode("register"); setShowAuth(true); };
  const openLogin = () => { setAuthMode("login"); setShowAuth(true); };

  const handleAuth = (userData) => {
    setUser({ ...userData, isVerified: userData.isVerified !== false });
    setShowAuth(false);
    setToastMsg(`Bienvenue ${userData.firstName} ! Les prix sont maintenant visibles.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleLogout = async () => {
    try {
      const sb = await getSupabase();
      if (sb) await sb.auth.signOut();
      else localStorage.removeItem('suntrex_user');
    } catch { /* ignore */ }
    setUser(null);
    setToastMsg("Vous avez été déconnecté.");
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, color: T.text, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes scroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        .brand-scroll { animation: scroll 35s linear infinite }
        .brand-scroll:hover { animation-play-state: paused }
        ::selection { background: rgba(232,112,10,0.2) }
        input::placeholder { color: #b0b0b0 }
      `}</style>

      {/* Session loading overlay */}
      {sessionLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, background: T.bg,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.sun(20)}</div>
          <div style={{ animation: "spin 1s linear infinite", color: T.orange }}>{Icons.loader(24, T.orange)}</div>
          <span style={{ fontSize: 13, color: T.textMuted }}>Chargement...</span>
        </div>
      )}

      {/* ═══ TOP BANNER ═══ */}
      <div style={{
        background: "#141413", color: "rgba(255,255,255,0.7)",
        fontSize: 12, padding: "6px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 20 }}>
          {["À propos", "Blog", "FAQ", "Aide"].map(l => <a key={l} href="#" style={{ color: "inherit", textDecoration: "none", transition: "color 0.15s" }}>{l}</a>)}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          📞 +33 1 XX XX XX XX
          <span style={{ opacity: 0.3 }}>|</span>
          Carrières
        </span>
      </div>

      {/* ═══ HEADER ═══ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "0 40px", height: 56,
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, background: T.orange,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{Icons.sun(16)}</div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: T.text }}>suntrex</span>
        </div>

        <div style={{ flex: 1, maxWidth: 440, position: "relative" }}>
          <input placeholder="Rechercher un produit ou fabricant..." style={{
            width: "100%", height: 38, borderRadius: T.radius,
            border: `1.5px solid ${T.border}`, padding: "0 40px 0 14px",
            fontSize: 13, outline: "none", fontFamily: T.font,
            transition: "border-color 0.2s",
          }} onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
          <button style={{
            position: "absolute", right: 1, top: 1, bottom: 1, width: 38,
            borderRadius: "0 6px 6px 0", border: "none", background: T.orange,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{Icons.search(14, "#fff")}</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: T.radius }}>🇫🇷 EUR</span>

          {isLoggedIn ? (
            <>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: T.textDim, padding: 6, borderRadius: T.radius, display: "flex" }}>
                {Icons.bell(18)}
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.red, marginLeft: -8, marginTop: -2 }} />
              </button>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: T.textDim, padding: 6, borderRadius: T.radius, display: "flex" }}>
                {Icons.cart(18)}
              </button>
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Btn variant="ghost" size="sm" onClick={openLogin}>Se connecter</Btn>
              <Btn variant="primary" size="sm" onClick={openRegister}>{Icons.user(13, "#fff")} S'inscrire</Btn>
            </>
          )}
        </div>
      </header>

      {/* ═══ NAV ═══ */}
      <nav style={{
        borderBottom: `1px solid ${T.border}`, padding: "0 40px", height: 42,
        display: "flex", alignItems: "center", background: T.bg,
      }}>
        {[
          { l: "Tous les produits", active: true },
          { l: "Panneaux solaires" },
          { l: "Onduleurs" },
          { l: "Stockage d'énergie" },
          { l: "Systèmes de montage" },
          { l: "Électrotechnique" },
          { l: "E-mobilité" },
        ].map((item, i) => (
          <button key={i} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "0 14px", height: 42, border: "none", background: "none",
            fontSize: 13, fontFamily: T.font,
            color: item.active ? T.green : T.textMuted,
            fontWeight: item.active ? 600 : 400,
            cursor: "pointer",
            borderBottom: item.active ? `2px solid ${T.green}` : "2px solid transparent",
            whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}>
            {item.l}
            {!item.active && Icons.chevDown(10, T.textDim)}
          </button>
        ))}
        <a href="#" onClick={openRegister} style={{ marginLeft: "auto", fontSize: 13, color: T.orange, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          Vendre sur suntrex {Icons.arrowRight(12, T.orange)}
        </a>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: "relative", height: 440, overflow: "hidden",
        background: "linear-gradient(135deg, #0a1628 0%, #132744 50%, #0d2137 100%)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('/categories/panels.jpg')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.3)", zIndex: 0,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)", zIndex: 1 }} />
        <div style={{
          position: "relative", zIndex: 2,
          height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 24px",
        }}>
          <h1 style={{
            fontSize: 40, fontWeight: 700, color: "#fff",
            lineHeight: 1.25, maxWidth: 640, marginBottom: 14,
            letterSpacing: "-0.02em",
          }}>
            Trouvez, comparez et achetez des équipements photovoltaïques au meilleur prix
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
            Une plateforme, des milliers d'offres de fournisseurs vérifiés
          </p>
          <div style={{ width: "100%", maxWidth: 540, position: "relative" }}>
            <input placeholder="Rechercher un produit ou un fabricant..." style={{
              width: "100%", height: 52, borderRadius: 10,
              border: "none", padding: "0 56px 0 18px",
              fontSize: 15, fontFamily: T.font,
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
              outline: "none",
            }} />
            <button style={{
              position: "absolute", right: 5, top: 5, bottom: 5, width: 44,
              borderRadius: 7, border: "none", background: T.orange,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>{Icons.search(18, "#fff")}</button>
          </div>
          {!isLoggedIn && (
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 12, color: "rgba(255,255,255,0.6)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {Icons.lock(13, "rgba(255,255,255,0.5)")} Prix visibles après inscription gratuite
              </span>
              <button onClick={openRegister} style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 6, padding: "6px 16px", color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                transition: "all 0.2s",
              }}>
                Créer un compte →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ BRAND LOGOS ═══ */}
      <section style={{
        padding: "16px 0", borderBottom: `1px solid ${T.border}`,
        overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, #fff, transparent)", zIndex: 2 }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, #fff, transparent)", zIndex: 2 }} />
        <div className="brand-scroll" style={{ display: "flex", alignItems: "center", gap: 48, width: "max-content" }}>
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} style={{ fontSize: 14, fontWeight: 700, color: b.c, whiteSpace: "nowrap", opacity: 0.7 }}>{b.n}</span>
          ))}
        </div>
      </section>

      {/* ═══ PRODUCTS ═══ */}
      <section style={{ padding: "48px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div style={{ width: 32, height: 3, background: T.green, borderRadius: 2, marginBottom: 12 }} />
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Meilleurs produits</h2>
            <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Les offres les plus compétitives de nos vendeurs vérifiés</p>
          </div>
          <a href="#" style={{ fontSize: 13, color: T.textMuted, textDecoration: "underline" }}>Voir toutes les offres</a>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p} isLoggedIn={isLoggedIn} onLogin={openRegister} />
          ))}
        </div>
      </section>

      {/* ═══ TRUST SECTION ═══ */}
      <section style={{ background: T.surface, padding: "56px 40px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 32, height: 3, background: T.green, borderRadius: 2, margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 26, fontWeight: 700 }}>Ce qui nous différencie</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, maxWidth: 1080, margin: "0 auto" }}>
          {[
            { icon: "🔒", title: "Paiement sécurisé", desc: "Escrow Stripe Connect. Vos fonds sont protégés jusqu'à confirmation de livraison.", color: T.blue },
            { icon: "🚚", title: "SUNTREX Delivery", desc: "Livraison avec vérification photo et QR code à chaque étape.", color: T.green },
            { icon: "📊", title: "-5% Commission", desc: "Commissions inférieures au marché. Plus de marge pour vous.", color: T.orange },
            { icon: "🤖", title: "Outils IA", desc: "Dimensionnement automatique et comparaison de prix intelligente.", color: "#7c3aed" },
          ].map((item, i) => (
            <div key={i} style={{
              textAlign: "center", padding: 28, borderRadius: T.radiusLg,
              border: `1px solid ${T.border}`, background: T.card,
              transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>{item.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: T.text }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ padding: "44px 40px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          {[
            ["6 700+", "Offres actives"],
            ["25+", "Pays couverts"],
            ["500+", "Vendeurs vérifiés"],
            ["-5%", "Commission vs marché"],
          ].map(([n, l], i) => (
            <div key={i}>
              <div style={{ fontSize: 34, fontWeight: 800, color: T.orange, letterSpacing: "-0.03em" }}>{n}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      {!isLoggedIn && (
        <section style={{ padding: "64px 40px", textAlign: "center", background: "#141413", color: "#fff" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Prêt à commencer ?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>Rejoignez des milliers de professionnels du solaire en Europe</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn variant="primary" size="lg" onClick={openRegister}>{Icons.user(16, "#fff")} Créer un compte gratuit</Btn>
            <Btn variant="secondary" size="lg" onClick={openLogin} style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff", background: "transparent" }}>Se connecter</Btn>
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "40px 40px 24px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40, marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: T.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>{Icons.sun(14)}</div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>suntrex</span>
            </div>
            <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Marketplace B2B européenne d'équipements photovoltaïques et de stockage d'énergie.</p>
          </div>
          {[
            { title: "Contact", links: ["Aide", "contact@suntrex.com", "+33 1 XX XX XX XX"] },
            { title: "Catégories", links: ["Panneaux solaires", "Onduleurs", "Stockage", "Montage"] },
            { title: "Marques", links: ["Huawei", "Deye", "Jinko", "Enphase", "SMA"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: T.text }}>{col.title}</h4>
              {col.links.map((l, j) => <div key={j} style={{ fontSize: 13, color: T.textMuted, marginBottom: 6, cursor: "pointer" }}>{l}</div>)}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textDim }}>
          <span>© 2026 SUNTREX — Tous droits réservés</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ color: T.textDim, textDecoration: "none" }}>CGV</a>
            <a href="#" style={{ color: T.textDim, textDecoration: "none" }}>Confidentialité</a>
            <a href="#" style={{ color: T.textDim, textDecoration: "none" }}>Cookies</a>
            <a href="#" style={{ color: T.textDim, textDecoration: "none" }}>Mentions légales</a>
          </div>
        </div>
      </footer>

      {/* ═══ AUTH MODAL ═══ */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuth={handleAuth}
        initialMode={authMode}
      />

      {/* ═══ TOAST ═══ */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          zIndex: 2000, animation: "toastIn 0.3s ease-out",
        }}>
          <div style={{
            background: T.green, color: "#fff",
            padding: "12px 24px", borderRadius: T.radius,
            boxShadow: T.shadowLg, fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: T.font,
          }}>
            {Icons.check(16, "#fff")} {toastMsg}
          </div>
        </div>
      )}

      {/* ═══ CHAT BUTTON ═══ */}
      <button style={{
        position: "fixed", bottom: 24, right: 24,
        width: 52, height: 52, borderRadius: "50%",
        border: "none", background: T.green, color: "#fff",
        cursor: "pointer", boxShadow: "0 4px 16px rgba(76,175,80,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, transition: "transform 0.2s",
      }}
        onMouseEnter={e => e.target.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}
      >
        <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </button>
    </div>
  );
}
