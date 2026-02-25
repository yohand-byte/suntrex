import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../CurrencyContext";
import PriceGate from "./PriceGate";
import SellerBadge from "./SellerBadge";
import useResponsive from "../../hooks/useResponsive";

const BRAND_COLORS = {
  Huawei: "#e4002b", Deye: "#0068b7", Enphase: "#f47920", SMA: "#cc0000",
  SolarEdge: "#e21e26", "Jinko Solar": "#1a8c37", "Trina Solar": "#cc0000",
  LONGi: "#008c44", "JA Solar": "#003da6", "Canadian Solar": "#003ca6",
  BYD: "#c00", Growatt: "#ee7203", GoodWe: "#007ac1", Sungrow: "#1a5aa6",
  "Risen Energy": "#e60012", DualSun: "#ff6600", Hoymiles: "#0073cf",
  K2: "#333", ESDEC: "#ff8c00", Pytes: "#1a73e8", RECOM: "#005eb8",
};

const BRAND_LOGOS = {
  Huawei: "/logos/huawei.svg", Deye: "/logos/deye.svg",
  Enphase: "/logos/enphase.svg", SMA: "/logos/sma.svg",
  Hoymiles: "/logos/hoymiles.svg", DualSun: "/logos/dualsun.svg",
  ESDEC: "/logos/esdec.svg", BYD: "/logos/byd.svg",
  GoodWe: "/logos/goodwe.svg", "Jinko Solar": "/logos/jinko.svg",
  Sungrow: "/logos/sungrow.svg", SolarEdge: "/logos/solaredge.svg",
  "JA Solar": "/logos/ja-solar.svg", "Canadian Solar": "/logos/canadian-solar.svg",
  LONGi: "/logos/longi.svg", Growatt: "/logos/growatt.svg",
  "Trina Solar": "/logos/trina.svg", "Risen Energy": "/logos/risen.svg",
  K2: "/logos/k2systems.svg", Pytes: "/logos/pytes.png", RECOM: "/logos/recom.png",
};

export default function ProductModal({ product, isLoggedIn, onLogin, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const brandColor = BRAND_COLORS[product.brand] || "#64748b";
  const brandLogo = BRAND_LOGOS[product.brand];
  const bestOffer = product.offers.reduce((a, b) => a.price < b.price ? a : b);
  const totalStock = product.offers.reduce((sum, o) => sum + o.stock, 0);

  // Close on Escape
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  // Spec rows to display
  const specRows = [];
  if (product.power > 0) specRows.push({ label: t("catalog.powerLabel", "Power"), value: product.power >= 1 ? product.power + " kW" : (product.power * 1000) + " W" });
  if (product.type) specRows.push({ label: t("catalog.type", "Type"), value: product.type });
  if (product.phases > 0) specRows.push({ label: t("catalog.phases", "Phases"), value: product.phases === 1 ? "Monophasé" : "Triphasé" });
  if (product.mppt > 0) specRows.push({ label: "MPPT", value: product.mppt });
  if (product.efficiency) specRows.push({ label: t("catalog.efficiency", "Efficiency"), value: product.efficiency });
  if (product.protection) specRows.push({ label: t("catalog.protection", "Protection"), value: product.protection });
  if (product.weight) specRows.push({ label: t("catalog.weight", "Weight"), value: product.weight + " kg" });
  if (product.warranty) specRows.push({ label: t("catalog.warranty", "Warranty"), value: product.warranty });
  if (product.dimensions) specRows.push({ label: "Dimensions", value: product.dimensions });
  if (product.capacityKwh) specRows.push({ label: t("catalog.capacity", "Capacity"), value: product.capacityKwh + " kWh" });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? 12 : 24, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%",
          maxWidth: isMobile ? "100%" : 720, maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "modalSlideIn .2s ease-out",
        }}
      >
        {/* ── Header with brand color bar ── */}
        <div style={{ height: 4, background: brandColor, borderRadius: "16px 16px 0 0" }} />

        {/* ── Close button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 20, color: "#999",
              cursor: "pointer", padding: 4, lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: isMobile ? "0 16px 20px" : "0 28px 28px" }}>
          <div style={{ display: "flex", gap: isMobile ? 16 : 24, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start" }}>
            {/* Image */}
            <div style={{
              width: isMobile ? "100%" : 220, height: isMobile ? 200 : 220, flexShrink: 0,
              background: "#fafafa", borderRadius: 12, display: "flex", alignItems: "center",
              justifyContent: "center", overflow: "hidden", border: "1px solid #f0f0f0",
              position: "relative",
            }}>
              {brandLogo && (
                <img
                  src={brandLogo}
                  alt={product.brand}
                  style={{ position: "absolute", top: 8, left: 8, height: 20, opacity: 0.6, objectFit: "contain" }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", mixBlendMode: "multiply" }}
                />
              ) : (
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", background: brandColor + "18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 700, color: brandColor,
                }}>
                  {product.brand.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Brand + SKU */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                  color: brandColor, background: brandColor + "12", border: `1px solid ${brandColor}30`,
                }}>
                  {product.brand}
                </span>
                {product.sku && (
                  <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
                    {product.sku}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#1e293b", margin: "0 0 12px", lineHeight: 1.2 }}>
                {product.name}
              </h2>

              {/* Price + stock */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#888" }}>{t("catalog.from")} </span>
                  <PriceGate price={bestOffer.price} isLoggedIn={isLoggedIn} onLogin={onLogin} size="large" />
                </div>
                <div style={{ fontSize: 13, color: totalStock > 0 ? "#4CAF50" : "#ef4444", fontWeight: 500 }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: totalStock > 0 ? "#4CAF50" : "#ef4444", marginRight: 4 }} />
                  {totalStock > 0 ? `${totalStock.toLocaleString()} ${t("common.pcs")}` : t("catalog.outOfStock", "Rupture")}
                </div>
              </div>

              {/* Seller info */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14 }}>{bestOffer.flag}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{bestOffer.sellerName}</span>
                <SellerBadge offer={bestOffer} />
              </div>
            </div>
          </div>

          {/* ── Specs table ── */}
          {specRows.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t("catalog.technicalSpecs", "Technical Specifications")}
              </h3>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                {specRows.map((row, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "10px 16px",
                    background: i % 2 === 0 ? "#fafbfc" : "#fff",
                    borderBottom: i < specRows.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Certifications ── */}
          {product.certifications && product.certifications.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                {t("catalog.certifications", "Certifications")}:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {product.certifications.map((cert, i) => (
                  <span key={i} style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11,
                    background: "#f1f5f9", color: "#475569", fontWeight: 500,
                  }}>
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Features ── */}
          {product.features && product.features.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                {t("catalog.features", "Features")}:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {product.features.map((feat, i) => (
                  <span key={i} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 12,
                    background: "#ecfdf5", color: "#065f46", fontWeight: 500,
                  }}>
                    ✓ {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <button
              onClick={() => { onClose(); navigate(`/product/${product.id}`); }}
              style={{
                flex: 1, minWidth: 160, padding: "12px 20px", borderRadius: 8,
                background: "#4CAF50", color: "#fff", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12H3m9-9l9 9-9 9" /></svg>
              {t("catalog.offerDetails")}
            </button>
            {product.datasheet && (
              <a
                href={product.datasheet}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "12px 20px", borderRadius: 8,
                  background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf2420",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  textDecoration: "none",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M12 18v-6" /><path d="M9 15l3 3 3-3" /></svg>
                Datasheet PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
