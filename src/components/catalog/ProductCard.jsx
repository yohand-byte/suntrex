import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../CurrencyContext";
import PriceGate from "./PriceGate";
import SellerBadge from "./SellerBadge";
import useResponsive from "../../hooks/useResponsive";

/* ── Brand colors ── */
const BRAND_COLORS = {
  Huawei: "#e4002b", Deye: "#0068b7", Enphase: "#f47920", SMA: "#cc0000",
  SolarEdge: "#e21e26", "Jinko Solar": "#1a8c37", "Trina Solar": "#cc0000",
  LONGi: "#008c44", "JA Solar": "#003da6", "Canadian Solar": "#003ca6",
  BYD: "#c00", Growatt: "#ee7203", GoodWe: "#007ac1", Sungrow: "#1a5aa6",
  "Risen Energy": "#e60012", DualSun: "#ff6600", Hoymiles: "#0073cf",
  K2: "#333", ESDEC: "#ff8c00", Pytes: "#1a73e8", RECOM: "#005eb8",
};

/* ── Brand logo paths ── */
const BRAND_LOGOS = {
  Huawei: "/logos/huawei.svg",
  Deye: "/logos/deye.svg",
  Enphase: "/logos/enphase.svg",
  SMA: "/logos/sma.svg",
  Hoymiles: "/logos/hoymiles.svg",
  DualSun: "/logos/dualsun.svg",
  ESDEC: "/logos/esdec.svg",
  BYD: "/logos/byd.svg",
  GoodWe: "/logos/goodwe.svg",
  "Jinko Solar": "/logos/jinko.svg",
  Sungrow: "/logos/sungrow.svg",
  SolarEdge: "/logos/solaredge.svg",
  "JA Solar": "/logos/ja-solar.svg",
  "Canadian Solar": "/logos/canadian-solar.svg",
  LONGi: "/logos/longi.svg",
  Growatt: "/logos/growatt.svg",
  "Trina Solar": "/logos/trina.svg",
  "Risen Energy": "/logos/risen.svg",
  K2: "/logos/k2systems.svg",
  Pytes: "/logos/pytes.png",
  RECOM: "/logos/recom.png",
};

const S = {
  productCard: { background: "#fff", border: "1px solid #e4e5ec", borderRadius: 12, overflow: "hidden", transition: "box-shadow .2s, transform .15s", cursor: "default" },
  productCardHover: { boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transform: "translateY(-1px)" },
  offerRow: { display: "flex", alignItems: "center", padding: "14px 20px", gap: 16, borderTop: "1px solid #f0f0f0", fontSize: 13 },
  greenBtn: { background: "#4CAF50", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  specBadge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: "#f1f5f9", color: "#475569", whiteSpace: "nowrap" },
  datasheetBadge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: "#fef3c7", color: "#92400e", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" },
};

const Chev = ({ open }) => (
  <svg width="12" height="12" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }} fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
);

const PdfIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M10 13h4" /><path d="M10 17h4" /></svg>
);

export default function ProductCard({ product, isLoggedIn, onLogin, grouped, onOpenModal }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const bestOffer = product.offers.reduce((a, b) => a.price < b.price ? a : b);
  const totalStock = product.offers.reduce((sum, o) => sum + o.stock, 0);
  const offerCount = product.offers.length;
  const brandColor = BRAND_COLORS[product.brand] || "#64748b";
  const brandLogo = BRAND_LOGOS[product.brand];

  const imgSize = isMobile ? 90 : 130;

  const handleCardClick = (e) => {
    // Don't trigger modal for buttons, links, or expand area
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-expand]")) return;
    if (onOpenModal) onOpenModal(product);
  };

  return (
    <div
      style={{ ...S.productCard, ...(hovered ? S.productCardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", padding: isMobile ? "12px 14px" : "16px 20px", gap: isMobile ? 12 : 20 }}>
        {/* ── Image zone ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: imgSize, flexShrink: 0, alignItems: "center" }}>
          <div style={{
            width: imgSize, height: imgSize, background: "#fafafa", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 6,
            border: "1px solid #f0f0f0", position: "relative",
          }}>
            {/* Brand logo overlay */}
            {brandLogo && (
              <img
                src={brandLogo}
                alt={product.brand}
                style={{ position: "absolute", top: 4, left: 4, height: 16, opacity: 0.7, objectFit: "contain" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            {product.image && !imgError ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: brandColor + "18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: brandColor,
                }}>
                  {product.brand.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 9, color: "#aaa", textAlign: "center" }}>{product.brand}</span>
              </div>
            )}
          </div>
          {offerCount > 1 && grouped && (
            <span style={{ fontSize: 11, color: "#888" }}>{offerCount} {t("catalog.offers")}</span>
          )}
        </div>

        {/* ── Product info ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <SellerBadge offer={bestOffer} />
            {/* Brand color indicator */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
              borderRadius: 4, fontSize: 11, fontWeight: 600, color: brandColor,
              background: brandColor + "12", border: `1px solid ${brandColor}30`,
            }}>
              {product.brand}
            </span>
          </div>

          <h3
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
            style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: "#222", margin: "4px 0", cursor: "pointer", lineHeight: 1.3 }}
          >
            {product.name}
          </h3>

          {/* ── Specs badges ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
            {product.power > 0 && (
              <span style={{ ...S.specBadge, background: "#eff6ff", color: "#1d4ed8" }}>
                ⚡ {product.power >= 1 ? product.power + " kW" : (product.power * 1000) + " W"}
              </span>
            )}
            {product.type && (
              <span style={S.specBadge}>
                {product.type}
              </span>
            )}
            {product.phases > 0 && (
              <span style={{ ...S.specBadge, background: "#f0fdf4", color: "#166534" }}>
                {product.phases === 1 ? "1Ph" : "3Ph"}
              </span>
            )}
            {product.mppt > 0 && (
              <span style={{ ...S.specBadge, background: "#fef3c7", color: "#92400e" }}>
                {product.mppt} MPPT
              </span>
            )}
            {product.efficiency && (
              <span style={{ ...S.specBadge, background: "#ecfdf5", color: "#065f46" }}>
                {product.efficiency}
              </span>
            )}
            {product.protection && (
              <span style={{ ...S.specBadge, background: "#f5f3ff", color: "#5b21b6" }}>
                {product.protection}
              </span>
            )}
            {/* Datasheet badge */}
            {product.datasheet && (
              <a
                href={product.datasheet}
                target="_blank"
                rel="noopener noreferrer"
                style={S.datasheetBadge}
                onClick={(e) => e.stopPropagation()}
              >
                <PdfIcon /> PDF
              </a>
            )}
          </div>
        </div>

        {/* ── Price & CTA ── */}
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: isMobile ? 100 : 140 }}>
          <div style={{ fontSize: 12, color: totalStock > 0 ? "#4CAF50" : "#ef4444", fontWeight: 500, marginBottom: 4 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: totalStock > 0 ? "#4CAF50" : "#ef4444", marginRight: 4 }} />
            {totalStock > 0 ? `${totalStock.toLocaleString()} ${t("common.pcs")}` : t("catalog.outOfStock", "Rupture")}
          </div>
          <div style={{ marginBottom: 8 }}>
            {isLoggedIn ? (
              <span style={{ fontSize: 11, color: "#888" }}>{t("catalog.from")} </span>
            ) : null}
            <PriceGate price={bestOffer.price} isLoggedIn={isLoggedIn} onLogin={onLogin} />
          </div>
          {!isMobile && (
            <button style={S.greenBtn} onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12H3m9-9l9 9-9 9" /></svg>
              {t("catalog.offerDetails")}
            </button>
          )}
        </div>
      </div>

      {/* ── Offers expand (grouped mode) ── */}
      {grouped && offerCount > 1 && (
        <>
          <div
            data-expand="true"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ background: expanded ? "#f0f7f0" : "#e8f5e9", padding: "8px 20px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: 13, color: "#2e7d32", fontWeight: 500, transition: "background .15s" }}
          >
            {expanded ? t("catalog.hideOffers") : t("catalog.viewOffers")} {t("catalog.theOffers")} ({offerCount})
            <Chev open={expanded} />
          </div>
          {expanded && product.offers.map((offer, i) => (
            <div key={i} style={S.offerRow}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{offer.flag}</span>
                  <span style={{ fontWeight: 500, color: "#333" }}>{offer.sellerName}</span>
                  <SellerBadge offer={offer} />
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#4CAF50" }}>
                    <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#4CAF50", marginRight: 3 }} />
                    {offer.stock.toLocaleString()} {t("common.pcs")}
                  </div>
                  <PriceGate price={offer.price} isLoggedIn={isLoggedIn} onLogin={onLogin} />
                </div>
                <button style={{ ...S.greenBtn, padding: "6px 12px", fontSize: 12 }}>
                  {t("catalog.offerDetails")}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
