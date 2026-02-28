import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useResponsive from "../hooks/useResponsive";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX — Sprint 4: Delivery Tracker Page
   
   SUNTREX DELIVERY — Suivi de colis avec vérification QR
   
   Differentiator: aucun concurrent n'a ça.
   QR code de vérification = preuve de livraison bidirectionnelle
   (buyer ET seller confirment l'état du colis)
   ═══════════════════════════════════════════════════════════════ */

var C = {
  bg: "#ffffff", surface: "#f8f9fb",
  border: "#e4e5ec", borderLight: "#eef0f4",
  text: "#1a1a2e", textSec: "#5f6368", textDim: "#9aa0a6",
  green: "#34a853", greenLight: "#e6f4ea", greenBorder: "#a8dab5",
  orange: "#E8700A", orangeLight: "#fff4e6", orangeBorder: "#ffe0b2",
  red: "#ea4335", redLight: "#fce8e6",
  blue: "#1a73e8", blueLight: "#e8f0fe",
  purple: "#7c3aed", purpleLight: "#f3e8ff",
  teal: "#0d9488", tealLight: "#ccfbf1",
  yellow: "#fbbc04", yellowLight: "#fef7e0",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  radius: 12, radiusLg: 16,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

// ── Mock delivery data ──
var MOCK_DELIVERIES = {
  "ST-2847": {
    orderId: "ST-2847",
    trackingNumber: "STX-FR-2026-028471",
    status: "in_transit",
    carrier: "SUNTREX Express",
    carrierIcon: "🚚",
    product: { name: "Huawei SUN2000-10KTL-M2", brand: "Huawei", quantity: 10, image: "https://solar.huawei.com/admin/asset/v1/pro/view/ac281b3090b74a00b98e0e5c3b4fc5a7.png" },
    seller: { name: "QUALIWATT", country: "FR", flag: "🇫🇷" },
    buyer: { name: "SolarPro France", address: "45 Avenue de la République, 75011 Paris" },
    weight: "145 kg", packages: 10, pallets: 1,
    verificationCode: "STX-VRF-8K2M9",
    qrHash: "7f3a9b2e4d",
    estimatedDelivery: "2026-03-02",
    shippedAt: "2026-02-27T14:30:00Z",
    events: [
      { status: "ordered", label: "Commande confirmée", date: "2026-02-25T09:24:00Z", icon: "✓", detail: "Paiement validé — Fonds en escrow SUNTREX" },
      { status: "preparing", label: "Préparation en cours", date: "2026-02-26T08:15:00Z", icon: "📋", detail: "Le vendeur prépare votre commande" },
      { status: "quality_check", label: "Contrôle qualité SUNTREX", date: "2026-02-26T16:45:00Z", icon: "🔍", detail: "Vérification des références, quantités et état des produits" },
      { status: "shipped", label: "Expédié", date: "2026-02-27T14:30:00Z", icon: "📦", detail: "Colis remis au transporteur SUNTREX Express" },
      { status: "in_transit", label: "En transit", date: "2026-02-28T06:20:00Z", icon: "🚚", detail: "En route — Hub logistique Lyon → Paris", active: true },
      { status: "out_for_delivery", label: "En livraison", date: null, icon: "🏠", detail: "Le livreur est en route vers votre adresse" },
      { status: "delivered", label: "Livré", date: null, icon: "✅", detail: "Colis livré et vérifié" },
    ],
    inspectionPhotos: [
      { label: "Palette emballée", status: "ok" },
      { label: "Étiquettes vérifiées", status: "ok" },
      { label: "Test visuel produits", status: "ok" },
    ],
  },
};

var STATUS_COLORS = {
  ordered: C.blue,
  preparing: C.purple,
  quality_check: C.teal,
  shipped: C.orange,
  in_transit: C.orange,
  out_for_delivery: C.green,
  delivered: C.green,
  issue: C.red,
};

function formatDate(d) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

function daysUntil(dateStr) {
  var d = new Date(dateStr);
  var now = new Date();
  var diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return "Dans " + diff + " jours";
}

// ── QR Code SVG (generated from hash — simplified visual) ──
function QRCodeVisual({ hash, size }) {
  size = size || 120;
  // Generate deterministic pattern from hash
  var cells = [];
  var grid = 11;
  var cellSize = size / grid;
  for (var i = 0; i < grid * grid; i++) {
    var charCode = hash.charCodeAt(i % hash.length);
    var row = Math.floor(i / grid);
    var col = i % grid;
    // Fixed patterns (finder patterns in corners)
    var isFinderOuter = (row < 3 && col < 3) || (row < 3 && col >= grid - 3) || (row >= grid - 3 && col < 3);
    var isFinderInner = (row === 1 && col === 1) || (row === 1 && col === grid - 2) || (row === grid - 2 && col === 1);
    var filled = isFinderOuter || ((charCode + i * 7) % 3 === 0);
    if (isFinderInner) filled = true;
    cells.push({ x: col * cellSize, y: row * cellSize, w: cellSize, h: cellSize, filled: filled });
  }
  return <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
    <rect width={size} height={size} fill="#fff" rx="4" />
    {cells.map(function(c, i) {
      return c.filled ? <rect key={i} x={c.x + 0.5} y={c.y + 0.5} width={c.w - 1} height={c.h - 1} fill="#1a1a2e" rx="1" /> : null;
    })}
    {/* SUNTREX logo center */}
    <rect x={size / 2 - 12} y={size / 2 - 12} width={24} height={24} fill="#fff" rx="3" />
    <rect x={size / 2 - 9} y={size / 2 - 9} width={18} height={18} fill={C.orange} rx="2" />
    <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800" fontFamily={C.font}>S</text>
  </svg>;
}

// ── Delivery status badge ──
function StatusBadge({ status, label }) {
  var color = STATUS_COLORS[status] || C.textDim;
  var isActive = status === "in_transit" || status === "out_for_delivery";
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: color + "12", border: "1px solid " + color + "30", fontSize: 12, fontWeight: 700, color: color }}>
    {isActive && <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />}
    {label}
  </div>;
}

// ── Timeline ──
function DeliveryTimeline({ events, currentStatus }) {
  var currentIdx = events.findIndex(function(e) { return e.active; });
  if (currentIdx === -1) currentIdx = events.filter(function(e) { return e.date; }).length - 1;

  return <div style={{ position: "relative" }}>
    {events.map(function(event, i) {
      var isPast = i <= currentIdx;
      var isCurrent = i === currentIdx;
      var isFuture = i > currentIdx;
      var color = isPast ? STATUS_COLORS[event.status] || C.green : C.borderLight;

      return <div key={i} style={{ display: "flex", gap: 16, marginBottom: i < events.length - 1 ? 0 : 0 }}>
        {/* Line + dot */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
          <div style={{
            width: isCurrent ? 32 : 24, height: isCurrent ? 32 : 24,
            borderRadius: "50%",
            background: isPast ? color : C.surface,
            border: "2px solid " + (isPast ? color : C.borderLight),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: isCurrent ? 14 : 11,
            color: isPast ? "#fff" : C.textDim,
            fontWeight: 700, flexShrink: 0,
            boxShadow: isCurrent ? "0 0 0 4px " + color + "25" : "none",
            transition: "all .3s",
          }}>
            {event.icon}
          </div>
          {i < events.length - 1 && <div style={{
            width: 2, flex: 1, minHeight: 40,
            background: i < currentIdx ? color : C.borderLight,
            transition: "background .3s",
          }} />}
        </div>
        {/* Content */}
        <div style={{ flex: 1, paddingBottom: 24, opacity: isFuture ? 0.4 : 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 600, color: isCurrent ? color : C.text }}>{event.label}</span>
            {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: color + "15", color: color }}>EN COURS</span>}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginBottom: 2 }}>{event.date ? formatDate(event.date) : "En attente"}</div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.4 }}>{event.detail}</div>
        </div>
      </div>;
    })}
  </div>;
}

// ── Package verification card ──
function VerificationCard({ verificationCode, qrHash, isMobile }) {
  var _s = useState(false), revealed = _s[0], setRevealed = _s[1];

  return <div style={{ border: "2px solid " + C.yellow, borderRadius: C.radiusLg, overflow: "hidden", background: "linear-gradient(135deg, " + C.yellowLight + ", #fff)" }}>
    <div style={{ padding: "14px 20px", background: C.yellow + "20", borderBottom: "1px solid " + C.yellow + "40", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 18 }}>🔐</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Vérification de colis SUNTREX</div>
        <div style={{ fontSize: 10.5, color: C.textSec }}>Scannez à la réception pour confirmer l'intégrité</div>
      </div>
    </div>
    <div style={{ padding: 20, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: 20 }}>
      {/* QR Code */}
      <div style={{ textAlign: "center" }}>
        <div style={{ padding: 12, background: "#fff", borderRadius: 10, border: "1px solid " + C.borderLight, display: "inline-block", boxShadow: C.shadow }}>
          <QRCodeVisual hash={qrHash} size={100} />
        </div>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>Scannez avec l'app SUNTREX</div>
      </div>
      {/* Verification code */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Code de vérification</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.1em", color: C.text, fontFamily: "monospace", background: "#fff", padding: "8px 14px", borderRadius: 8, border: "1px solid " + C.borderLight }}>
            {revealed ? verificationCode : "••••-•••-••••"}
          </div>
          <button onClick={function() { setRevealed(!revealed); }} style={{ padding: "8px 12px", border: "1px solid " + C.border, borderRadius: 8, background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font, color: C.textSec }}>
            {revealed ? "Masquer" : "Révéler"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
          <div style={{ marginBottom: 6 }}>
            <b style={{ color: C.text }}>Comment ça marche :</b>
          </div>
          <div>1. Le livreur scanne le QR à la livraison</div>
          <div>2. Vous vérifiez le code sur votre app/email</div>
          <div>3. Les deux parties confirment → fonds libérés de l'escrow</div>
        </div>
      </div>
    </div>
  </div>;
}

// ── Inspection report ──
function InspectionReport({ photos }) {
  return <div style={{ border: "1px solid " + C.teal + "30", borderRadius: C.radius, overflow: "hidden", background: C.tealLight + "30" }}>
    <div style={{ padding: "12px 16px", background: C.teal + "10", borderBottom: "1px solid " + C.teal + "20", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 15 }}>🔍</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>Rapport d'inspection SUNTREX</span>
      <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: C.greenLight, color: C.green }}>✓ VALIDÉ</span>
    </div>
    <div style={{ padding: 16 }}>
      {photos.map(function(p, i) {
        return <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < photos.length - 1 ? "1px solid " + C.borderLight : "none" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: p.status === "ok" ? C.greenLight : C.redLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
            {p.status === "ok" ? "✓" : "✕"}
          </div>
          <span style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>{p.label}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: p.status === "ok" ? C.green : C.red }}>{p.status === "ok" ? "Conforme" : "Problème"}</span>
        </div>;
      })}
    </div>
  </div>;
}

// ── Progress bar ──
function DeliveryProgress({ events }) {
  var total = events.length;
  var done = events.filter(function(e) { return e.date; }).length;
  var pct = Math.round((done / total) * 100);
  return <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Progression</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{pct}%</span>
    </div>
    <div style={{ height: 6, borderRadius: 3, background: C.borderLight, overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct + "%", borderRadius: 3, background: "linear-gradient(90deg, " + C.orange + ", " + C.green + ")", transition: "width .5s ease" }} />
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export default function DeliveryTrackerPage() {
  var _p = useParams(), orderId = _p.orderId;
  var navigate = useNavigate();
  var _t = useTranslation(), t = _t.t;
  var _r = useResponsive(), isMobile = _r.isMobile;

  // Lookup delivery (mock — in production: fetch from Supabase)
  var delivery = MOCK_DELIVERIES[orderId] || MOCK_DELIVERIES["ST-2847"];
  var currentEvent = delivery.events.find(function(e) { return e.active; }) || delivery.events[delivery.events.length - 1];
  var _s = useState(false), showReport = _s[0], setShowReport = _s[1];

  return <div style={{ fontFamily: C.font, background: C.surface, minHeight: "100vh" }}>
    <style>{"\n      @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}\n      @keyframes truck{0%{transform:translateX(0)}50%{transform:translateX(4px)}100%{transform:translateX(0)}}\n    "}</style>

    {/* Header */}
    <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)", padding: "24px 0", color: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={function() { navigate(-1); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 12px", color: "#fff", cursor: "pointer", fontSize: 14 }}>←</button>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Suivi de livraison</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                <span style={{ color: C.orange }}>SUNTREX</span> DELIVERY
              </div>
            </div>
          </div>
          <StatusBadge status={delivery.status} label={currentEvent.label} />
        </div>

        {/* Quick info bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 12 : 24, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { label: "N° commande", value: delivery.orderId, color: C.orange },
            { label: "N° suivi", value: delivery.trackingNumber, color: "#fff" },
            { label: "Livraison estimée", value: daysUntil(delivery.estimatedDelivery), color: C.green },
            { label: "Colis", value: delivery.packages + " colis / " + delivery.pallets + " palette", color: "#fff" },
          ].map(function(item) {
            return <div key={item.label}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>;
          })}
        </div>
      </div>
    </div>

    {/* Content */}
    <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 20px" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, alignItems: "flex-start" }}>

        {/* Left: Timeline */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Product card */}
          <div style={{ background: C.bg, borderRadius: C.radiusLg, border: "1px solid " + C.border, padding: 20, marginBottom: 20, boxShadow: C.shadow }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {delivery.product.image
                  ? <img src={delivery.product.image} alt="" style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                  : <span style={{ opacity: 0.15, fontSize: 24 }}>☀</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#e4002b", textTransform: "uppercase" }}>{delivery.product.brand}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{delivery.product.name}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>x{delivery.product.quantity} — {delivery.seller.name} {delivery.seller.flag}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.teal, background: C.tealLight, padding: "4px 10px", borderRadius: 6 }}>
                  🛡️ Escrow actif
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: C.bg, borderRadius: C.radiusLg, border: "1px solid " + C.border, padding: 20, marginBottom: 20, boxShadow: C.shadow }}>
            <DeliveryProgress events={delivery.events} />
            <DeliveryTimeline events={delivery.events} currentStatus={delivery.status} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={function() { setShowReport(!showReport); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "1px solid " + C.teal + "40", borderRadius: 8, background: C.tealLight + "40", color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>
              🔍 {showReport ? "Masquer" : "Voir"} le rapport d'inspection
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "1px solid " + C.border, borderRadius: 8, background: C.bg, color: C.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>
              💬 Contacter le vendeur
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", border: "1px solid " + C.red + "40", borderRadius: 8, background: C.redLight + "40", color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.font }}>
              ⚠️ Signaler un problème
            </button>
          </div>

          {/* Inspection report (toggle) */}
          {showReport && <div style={{ marginTop: 20 }}>
            <InspectionReport photos={delivery.inspectionPhotos} />
          </div>}
        </div>

        {/* Right: Verification + info */}
        <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0 }}>
          {/* QR Verification */}
          <div style={{ marginBottom: 20 }}>
            <VerificationCard verificationCode={delivery.verificationCode} qrHash={delivery.qrHash} isMobile={isMobile} />
          </div>

          {/* Delivery details */}
          <div style={{ background: C.bg, borderRadius: C.radiusLg, border: "1px solid " + C.border, overflow: "hidden", marginBottom: 20, boxShadow: C.shadow }}>
            <div style={{ padding: "14px 16px", background: C.surface, borderBottom: "1px solid " + C.borderLight }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>📍 Détails de livraison</div>
            </div>
            <div style={{ padding: 16 }}>
              {[
                { label: "Destination", value: delivery.buyer.address },
                { label: "Destinataire", value: delivery.buyer.name },
                { label: "Transporteur", value: delivery.carrier },
                { label: "Poids total", value: delivery.weight },
                { label: "Expédié le", value: formatDate(delivery.shippedAt) },
                { label: "Livraison estimée", value: new Date(delivery.estimatedDelivery).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) },
              ].map(function(item) {
                return <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + C.borderLight, fontSize: 12 }}>
                  <span style={{ color: C.textDim }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: C.text, textAlign: "right", maxWidth: "60%" }}>{item.value}</span>
                </div>;
              })}
            </div>
          </div>

          {/* SUNTREX Delivery guarantee */}
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #2d2d44)", borderRadius: C.radiusLg, padding: 20, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🚚</div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                Garantie <span style={{ color: C.orange }}>SUNTREX</span> DELIVERY
              </div>
            </div>
            {[
              "Livraison assurée contre les dommages",
              "Inspection à l'expédition et à la réception",
              "Code de vérification bidirectionnel",
              "Remboursement sous 48h si problème",
              "Support dédié 7j/7",
            ].map(function(text) {
              return <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                <span style={{ color: C.green, fontSize: 10 }}>✓</span>{text}
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  </div>;
}
