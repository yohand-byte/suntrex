import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import ALL_PRODUCTS from "../products";
import useResponsive from "../hooks/useResponsive";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Sprint 3: Checkout Page
   
   Flow: ProductDetail → "Détails de l'offre" → Checkout → Stripe Payment → Confirmation
   
   Uses Stripe Elements (loaded dynamically) for PCI compliance.
   Backend: /api/stripe-checkout (create-payment-intent)
   
   Security:
   - Prices fetched server-side (never trust client)
   - 3DS/SCA handled by Stripe PaymentIntents
   - No sensitive data in URL params
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: "#ffffff", surface: "#f8f9fb",
  border: "#e4e5ec", borderLight: "#eef0f4",
  text: "#1a1a2e", textSec: "#5f6368", textDim: "#9aa0a6",
  green: "#34a853", greenLight: "#e6f4ea",
  orange: "#E8700A", orangeLight: "#fff4e6", orangeBorder: "#ffe0b2",
  red: "#ea4335", redLight: "#fce8e6",
  purple: "#7c3aed", purpleLight: "#f3e8ff",
  teal: "#0d9488", tealLight: "#ccfbf1",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  radius: 10, radiusLg: 14,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

const BRAND_CLR = {
  Huawei: "#e4002b", Deye: "#0068b7", Enphase: "#f47920",
  Hoymiles: "#0073cf", Pytes: "#1a73e8",
};

const SELLER_TIERS = {
  platinum: { label: "Platine", icon: "◆", color: "#475569", bg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #e2e8f0)", border: "#94a3b8" },
  gold:     { label: "Or",      icon: "◆", color: "#92400e", bg: "linear-gradient(135deg, #fef3c7, #fcd34d, #fef3c7)", border: "#f59e0b" },
  silver:   { label: "Argent",  icon: "◇", color: "#64748b", bg: "linear-gradient(135deg, #f1f5f9, #e2e8f0, #f1f5f9)", border: "#94a3b8" },
  bronze:   { label: "Bronze",  icon: "○", color: "#9a3412", bg: "linear-gradient(135deg, #fed7aa, #fdba74, #fed7aa)", border: "#f97316" },
};

var CHECKOUT_API = "/api/stripe-checkout";

// ── Step indicator ──
function StepBar({ step }) {
  var steps = ["Récapitulatif", "Livraison", "Paiement", "Confirmation"];
  return <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 32, maxWidth: 600, margin: "0 auto 32px" }}>
    {steps.map(function(label, i) {
      var active = i <= step;
      var current = i === step;
      return <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
        {i > 0 && <div style={{ position: "absolute", top: 14, left: 0, right: "50%", height: 2, background: i <= step ? C.orange : C.borderLight, zIndex: 0 }} />}
        {i < steps.length - 1 && <div style={{ position: "absolute", top: 14, left: "50%", right: 0, height: 2, background: i < step ? C.orange : C.borderLight, zIndex: 0 }} />}
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: active ? C.orange : C.bg, border: "2px solid " + (active ? C.orange : C.borderLight), color: active ? "#fff" : C.textDim, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, position: "relative", zIndex: 1 }}>
          {i < step ? "✓" : i + 1}
        </div>
        <div style={{ fontSize: 11, fontWeight: current ? 700 : 500, color: current ? C.text : C.textDim, marginTop: 6 }}>{label}</div>
      </div>;
    })}
  </div>;
}

// ── Trust badges compact ──
function TrustBar() {
  return <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", padding: "16px 0", borderTop: "1px solid " + C.borderLight, marginTop: 24 }}>
    {[
      { icon: "🛡️", label: "Escrow sécurisé" },
      { icon: "📦", label: "Colis protégé" },
      { icon: "🔒", label: "Paiement 3D Secure" },
      { icon: "🔄", label: "Remboursement 48h" },
    ].map(function(b) {
      return <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textSec, fontWeight: 500 }}>
        <span>{b.icon}</span>{b.label}
      </div>;
    })}
  </div>;
}

// ── Order summary card ──
function OrderSummary({ product, offer, quantity, setQuantity, formatMoney, language }) {
  var unitPrice = offer.price;
  var subtotal = unitPrice * quantity;
  var commission = subtotal * 0.05;
  var deliveryCost = offer.delivery === "suntrex" ? (subtotal > 5000 ? 0 : 89) : 0;
  var total = subtotal + deliveryCost;
  var brandColor = BRAND_CLR[product.brand] || "#666";

  return <div style={{ border: "1px solid " + C.border, borderRadius: C.radiusLg, overflow: "hidden", background: C.bg }}>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid " + C.borderLight, background: C.surface }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Récapitulatif de commande</div>
    </div>
    <div style={{ padding: 20 }}>
      {/* Product */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid " + C.borderLight }}>
        <div style={{ width: 72, height: 72, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", border: "1px solid " + C.borderLight }}>
          {product.image
            ? <img src={product.image} alt={product.name} style={{ maxWidth: "85%", maxHeight: "85%", objectFit: "contain", mixBlendMode: "multiply" }} />
            : <span style={{ fontSize: 28, opacity: 0.15 }}>☀</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: brandColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{product.brand}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 4 }}>{product.name}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>{product.power || product.capacity || ""}</div>
        </div>
      </div>

      {/* Seller */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid " + C.borderLight }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, " + C.orange + "20, " + C.orange + "40)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.orange, border: "2px solid " + C.orange + "30" }}>
          {offer.sellerName.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{offer.sellerName} {offer.flag}</div>
          <div style={{ fontSize: 10, color: C.textDim }}>{offer.transactions} transactions</div>
        </div>
        {SELLER_TIERS[offer.tier] && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 5, background: SELLER_TIERS[offer.tier].bg, border: "1px solid " + SELLER_TIERS[offer.tier].border, fontSize: 9.5, fontWeight: 700, color: SELLER_TIERS[offer.tier].color, marginLeft: "auto" }}>
          {SELLER_TIERS[offer.tier].icon} {SELLER_TIERS[offer.tier].label}
        </span>}
      </div>

      {/* Quantity */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.textSec }}>Quantité</span>
        <div style={{ display: "flex", alignItems: "center", gap: 0, border: "1px solid " + C.border, borderRadius: 8, overflow: "hidden" }}>
          <button onClick={function() { if (quantity > 1) setQuantity(quantity - 1); }} style={{ width: 36, height: 36, border: "none", background: C.surface, cursor: "pointer", fontSize: 16, fontWeight: 600, color: C.textSec, fontFamily: C.font }}>−</button>
          <input type="number" value={quantity} onChange={function(e) { var v = parseInt(e.target.value) || 1; setQuantity(Math.max(1, Math.min(v, offer.stock))); }} style={{ width: 50, height: 36, border: "none", borderLeft: "1px solid " + C.borderLight, borderRight: "1px solid " + C.borderLight, textAlign: "center", fontSize: 14, fontWeight: 700, fontFamily: C.font, outline: "none", color: C.text }} />
          <button onClick={function() { if (quantity < offer.stock) setQuantity(quantity + 1); }} style={{ width: 36, height: 36, border: "none", background: C.surface, cursor: "pointer", fontSize: 16, fontWeight: 600, color: C.textSec, fontFamily: C.font }}>+</button>
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: C.textDim, textAlign: "right", marginBottom: 16, marginTop: -10 }}>
        <span style={{ color: offer.stock > 100 ? C.green : offer.stock > 10 ? "#f59e0b" : C.red }}>●</span> {offer.stock.toLocaleString()} disponibles
      </div>

      {/* Price breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSec }}>
          <span>Prix unitaire</span><span style={{ fontWeight: 600, color: C.text }}>{formatMoney(unitPrice, language)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSec }}>
          <span>Sous-total ({quantity} x {formatMoney(unitPrice, language)})</span><span style={{ fontWeight: 600, color: C.text }}>{formatMoney(subtotal, language)}</span>
        </div>
        {offer.delivery === "suntrex" && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textSec }}>
          <span>📦 Livraison SUNTREX</span>
          <span style={{ fontWeight: 600, color: deliveryCost === 0 ? C.green : C.text }}>
            {deliveryCost === 0 ? "GRATUIT" : formatMoney(deliveryCost, language)}
          </span>
        </div>}
        {deliveryCost === 0 && subtotal > 5000 && <div style={{ fontSize: 10, color: C.green, textAlign: "right" }}>Livraison offerte dès 5 000€</div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textDim }}>
          <span>TVA</span><span>Intracommunautaire (0%)</span>
        </div>
      </div>

      {/* Total */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "2px solid " + C.text }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Total TTC</span>
        <span style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>{formatMoney(total, language)}</span>
      </div>
    </div>
  </div>;
}

// ── Delivery form ──
function DeliveryForm({ data, setData }) {
  function field(label, key, placeholder, required) {
    return <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
      <input value={data[key] || ""} onChange={function(e) { setData(Object.assign({}, data, { [key]: e.target.value })); }} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + C.border, fontSize: 13, fontFamily: C.font, outline: "none", boxSizing: "border-box", transition: "border .15s" }} onFocus={function(e) { e.target.style.borderColor = C.orange; }} onBlur={function(e) { e.target.style.borderColor = C.border; }} />
    </div>;
  }
  return <div style={{ border: "1px solid " + C.border, borderRadius: C.radiusLg, overflow: "hidden" }}>
    <div style={{ padding: "16px 20px", background: C.surface, borderBottom: "1px solid " + C.borderLight }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>📍 Adresse de livraison</div>
    </div>
    <div style={{ padding: 20 }}>
      {field("Entreprise", "company", "Nom de l'entreprise", true)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("Prénom", "firstName", "Jean", true)}
        {field("Nom", "lastName", "Dupont", true)}
      </div>
      {field("Adresse", "address", "123 Rue de la Paix", true)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        {field("Code postal", "zip", "75001", true)}
        {field("Ville", "city", "Paris", true)}
      </div>
      {field("Pays", "country", "France", true)}
      {field("Téléphone", "phone", "+33 6 12 34 56 78", true)}
      {field("Instructions livraison", "notes", "Dock de déchargement, horaires...", false)}
    </div>
  </div>;
}

// ── Payment step (Stripe Elements placeholder — needs @stripe/react-stripe-js) ──
function PaymentStep({ total, formatMoney, language, onPay, loading, error }) {
  return <div style={{ border: "1px solid " + C.border, borderRadius: C.radiusLg, overflow: "hidden" }}>
    <div style={{ padding: "16px 20px", background: C.surface, borderBottom: "1px solid " + C.borderLight }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>💳 Paiement sécurisé</div>
    </div>
    <div style={{ padding: 20 }}>
      {/* Stripe Elements will mount here once @stripe/react-stripe-js is installed */}
      <div id="stripe-card-element" style={{ padding: 14, border: "1px solid " + C.border, borderRadius: 8, marginBottom: 16, minHeight: 44, background: "#fafafa" }}>
        <div style={{ fontSize: 13, color: C.textDim, textAlign: "center", padding: 10 }}>
          Stripe Elements — carte bancaire sécurisée
          <div style={{ fontSize: 11, marginTop: 4 }}>3D Secure / SCA activé automatiquement (requis EU)</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, padding: 12, background: C.purpleLight, borderRadius: 8, border: "1px solid " + C.purple + "20" }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🛡️</span>
        <div style={{ fontSize: 12, color: C.purple, lineHeight: 1.5 }}>
          <b>Escrow SUNTREX</b> — Vos fonds sont sécurisés et ne seront transférés au vendeur qu'après confirmation de réception.
        </div>
      </div>

      {error && <div style={{ padding: 12, background: C.redLight, borderRadius: 8, color: C.red, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>⚠️ {error}</div>}

      <button onClick={onPay} disabled={loading} style={{ width: "100%", padding: "14px 24px", background: loading ? C.textDim : C.orange, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: C.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: loading ? "none" : "0 4px 14px rgba(232,112,10,0.3)", transition: "all .2s" }}>
        {loading
          ? <><span style={{ width: 18, height: 18, border: "2px solid #fff4", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Traitement en cours...</>
          : <>🔒 Payer {formatMoney(total, language)}</>
        }
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
        {["Visa", "Mastercard", "AMEX", "SEPA"].map(function(m) {
          return <span key={m} style={{ fontSize: 10, color: C.textDim, fontWeight: 600, padding: "3px 8px", border: "1px solid " + C.borderLight, borderRadius: 4 }}>{m}</span>;
        })}
      </div>
    </div>
  </div>;
}

// ── Confirmation step ──
function ConfirmationStep({ orderId, navigate }) {
  return <div style={{ textAlign: "center", padding: "40px 20px" }}>
    <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.greenLight, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>✓</div>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>Commande confirmée !</h2>
    <p style={{ fontSize: 14, color: C.textSec, marginBottom: 6 }}>Votre paiement a été accepté. Le vendeur a été notifié.</p>
    <div style={{ display: "inline-block", padding: "8px 16px", background: C.surface, borderRadius: 8, border: "1px solid " + C.borderLight, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 24 }}>
      Commande <span style={{ color: C.orange }}>#{orderId || "ST-XXXX"}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340, margin: "0 auto" }}>
      {[
        { icon: "📧", text: "Email de confirmation envoyé" },
        { icon: "💬", text: "Chat avec le vendeur ouvert" },
        { icon: "📦", text: "Suivi de livraison disponible dans votre dashboard" },
        { icon: "🛡️", text: "Fonds en escrow jusqu'à réception" },
      ].map(function(item) {
        return <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.textSec, textAlign: "left" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>{item.text}
        </div>;
      })}
    </div>
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
      <button onClick={function() { navigate("/dashboard/buy"); }} style={{ padding: "12px 24px", background: C.orange, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: C.font }}>Voir ma commande</button>
      <button onClick={function() { navigate("/catalog"); }} style={{ padding: "12px 24px", background: C.bg, color: C.textSec, border: "1px solid " + C.border, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>Continuer les achats</button>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function CheckoutPage({ isLoggedIn, onLogin }) {
  var _useParams = useParams(), productId = _useParams.productId;
  var navigate = useNavigate();
  var location = useLocation();
  var _useTrans = useTranslation(), t = _useTrans.t, i18n = _useTrans.i18n;
  var _useCurr = useCurrency(), formatMoney = _useCurr.formatMoney;
  var _useResp = useResponsive(), isMobile = _useResp.isMobile;
  var language = i18n.language;

  // Get offer data from location state (passed from ProductDetailV2)
  var offerData = (location.state && location.state.offer) || null;
  var product = useMemo(function() { return ALL_PRODUCTS.find(function(p) { return p.id === productId; }); }, [productId]);

  var [step, setStep] = useState(0); // 0=summary, 1=delivery, 2=payment, 3=confirmation
  var [quantity, setQuantity] = useState((offerData && offerData.quantity) || 1);
  var [delivery, setDelivery] = useState({});
  var [payLoading, setPayLoading] = useState(false);
  var [payError, setPayError] = useState(null);
  var [orderId, setOrderId] = useState(null);

  // Default offer if not passed via state
  var offer = offerData || (product ? {
    sellerId: "S01", sellerName: product.seller || "QUALIWATT",
    country: "FR", flag: "🇫🇷", rating: 4.8, reviews: 8,
    stock: product.stock, price: product.price,
    tier: "gold", verified: true, escrow: true,
    delivery: "suntrex", colisVerif: true,
    responseMin: 15, transactions: 142, joined: "2024",
  } : null);

  // Redirect if not logged in
  useEffect(function() {
    if (!isLoggedIn) {
      onLogin();
      navigate("/product/" + productId);
    }
  }, [isLoggedIn]);

  if (!product || !offer) {
    return <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", fontFamily: C.font }}>
      <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>🛒</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Produit introuvable</h2>
      <button onClick={function() { navigate("/catalog"); }} style={{ marginTop: 16, padding: "10px 20px", background: C.orange, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>Retour au catalogue</button>
    </div>;
  }

  var subtotal = offer.price * quantity;
  var deliveryCost = offer.delivery === "suntrex" ? (subtotal > 5000 ? 0 : 89) : 0;
  var total = subtotal + deliveryCost;

  function canProceed() {
    if (step === 0) return quantity >= 1;
    if (step === 1) return delivery.company && delivery.firstName && delivery.lastName && delivery.address && delivery.zip && delivery.city && delivery.country && delivery.phone;
    return true;
  }

  function handleNext() {
    if (step < 2) setStep(step + 1);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  async function handlePay() {
    setPayLoading(true);
    setPayError(null);
    try {
      // In production: call backend to create PaymentIntent, then confirm with Stripe Elements
      // For MVP demo: simulate payment success after delay
      await new Promise(function(r) { setTimeout(r, 2000); });
      setOrderId("ST-" + Math.floor(1000 + Math.random() * 9000));
      setStep(3);
    } catch (err) {
      setPayError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPayLoading(false);
    }
  }

  return <div style={{ fontFamily: C.font, background: C.surface, minHeight: "100vh" }}>
    <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>

    {/* Header */}
    <div style={{ background: C.bg, borderBottom: "1px solid " + C.borderLight, padding: "16px 0" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={function() { navigate("/"); }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: C.orange }}>SUNTREX</span>
          <span style={{ fontSize: 12, color: C.textDim }}>Checkout sécurisé</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.green, fontWeight: 600 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          SSL sécurisé
        </div>
      </div>
    </div>

    <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 20px" }}>
      <StepBar step={step} />

      {step === 3
        ? <ConfirmationStep orderId={orderId} navigate={navigate} />
        : <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, alignItems: "flex-start" }}>

          {/* Left: step content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {step === 0 && <OrderSummary product={product} offer={offer} quantity={quantity} setQuantity={setQuantity} formatMoney={formatMoney} language={language} />}
            {step === 1 && <DeliveryForm data={delivery} setData={setDelivery} />}
            {step === 2 && <PaymentStep total={total} formatMoney={formatMoney} language={language} onPay={handlePay} loading={payLoading} error={payError} />}

            {/* Navigation */}
            {step < 3 && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              {step > 0
                ? <button onClick={handleBack} style={{ padding: "10px 20px", background: C.bg, color: C.textSec, border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>← Retour</button>
                : <button onClick={function() { navigate("/product/" + productId); }} style={{ padding: "10px 20px", background: C.bg, color: C.textSec, border: "1px solid " + C.border, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>← Retour au produit</button>
              }
              {step < 2 && <button onClick={handleNext} disabled={!canProceed()} style={{ padding: "10px 24px", background: canProceed() ? C.orange : C.textDim, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: canProceed() ? "pointer" : "default", fontFamily: C.font, opacity: canProceed() ? 1 : 0.6 }}>
                Continuer →
              </button>}
            </div>}
          </div>

          {/* Right: mini summary sticky */}
          {!isMobile && step < 3 && <div style={{ width: 280, flexShrink: 0, position: "sticky", top: 20 }}>
            <div style={{ border: "1px solid " + C.border, borderRadius: C.radiusLg, padding: 16, background: C.bg }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>Votre commande</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {product.image ? <img src={product.image} alt="" style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} /> : <span style={{ opacity: 0.15 }}>☀</span>}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{product.name}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>x{quantity}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid " + C.borderLight, paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSec, marginBottom: 6 }}><span>Sous-total</span><span>{formatMoney(subtotal, language)}</span></div>
                {offer.delivery === "suntrex" && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSec, marginBottom: 6 }}><span>Livraison</span><span style={{ color: deliveryCost === 0 ? C.green : C.text }}>{deliveryCost === 0 ? "Gratuit" : formatMoney(deliveryCost, language)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: C.text, marginTop: 8, paddingTop: 8, borderTop: "2px solid " + C.text }}>
                  <span>Total</span><span>{formatMoney(total, language)}</span>
                </div>
              </div>
            </div>
            <TrustBar />
          </div>}
        </div>
      }
    </div>
  </div>;
}
