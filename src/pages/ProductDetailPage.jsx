import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import REAL_PRODUCTS from "../products";
import useResponsive from "../hooks/useResponsive";

/* ── Category fallback images (real photos, never SVG placeholders) ── */
const CATEGORY_FALLBACK_IMAGES = {
  panels: "/categories/panels.jpg",
  inverters: "/categories/inverters.jpg",
  batteries: "/categories/batteries.jpg",
  "micro-inverters": "/categories/inverters.jpg",
  optimizers: "/categories/inverters.jpg",
  "ev-chargers": "/categories/category-onduleurs.png",
  mounting: "/categories/category-accessoires.png",
  accessories: "/categories/category-accessoires.png",
  cables: "/categories/electrical.jpg",
};

/* ── Build detail view from real products.js data ── */
const BRAND_COLORS = {
  Huawei: "#e4002b", Deye: "#0068b7", Enphase: "#f47920", SMA: "#cc0000",
  "SolarEdge": "#e21e26", "Jinko Solar": "#1a8c37", "Trina Solar": "#cc0000",
  LONGi: "#008c44", "JA Solar": "#003da6", "Canadian Solar": "#003ca6",
  BYD: "#c00", Growatt: "#ee7203", GoodWe: "#007ac1", Sungrow: "#1a5aa6",
  "Risen Energy": "#e60012",
};

function buildProductDetail(p, t, categoryLabels) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.image || "",
    brandColor: BRAND_COLORS[p.brand] || "#555",
    category: p.category,
    categoryLabel: categoryLabels[p.category] || p.category,
    subtitle: [p.type, p.phases ? `${p.phases}-Phase` : null, p.power || p.capacity].filter(Boolean).join(" — "),
    description: p.description || (p.features ? p.features.join(". ") + "." : ""),
    datasheet: (p.datasheet && (p.datasheet.startsWith("/") || p.datasheet.startsWith("http"))) ? p.datasheet : null,
    specs: {
      general: [
        { label: t("product.specLabels.sku"), value: p.sku },
        { label: t("product.specLabels.brand"), value: p.brand },
        { label: t("product.specLabels.warranty"), value: p.warranty || "N/A" },
        ...(p.protection ? [{ label: t("product.specLabels.protectionRating"), value: p.protection }] : []),
        ...(p.certifications ? [{ label: t("product.specLabels.certifications"), value: p.certifications.join(", ") }] : []),
      ],
      electrical: [
        ...(p.power ? [{ label: t("product.specLabels.power"), value: p.power }] : []),
        ...(p.capacity ? [{ label: t("product.specLabels.capacity"), value: p.capacity }] : []),
        ...(p.efficiency ? [{ label: t("product.specLabels.maxEfficiency"), value: p.efficiency }] : []),
        ...(p.phases ? [{ label: t("product.specLabels.phases"), value: String(p.phases) }] : []),
        ...(p.mppt ? [{ label: t("product.specLabels.mpptCount"), value: String(p.mppt) }] : []),
        ...(p.chemistry ? [{ label: t("product.specLabels.chemistry"), value: p.chemistry }] : []),
        ...(p.dod ? [{ label: t("product.specLabels.depthOfDischarge"), value: p.dod }] : []),
        ...(p.cycles ? [{ label: t("product.specLabels.cycles"), value: p.cycles }] : []),
      ],
      mechanical: [
        ...(p.weight ? [{ label: t("product.specLabels.weight"), value: String(p.weight) }] : []),
      ],
      dimensions: [
        ...(p.weight ? [{ label: t("product.specLabels.weight"), value: String(p.weight) }] : []),
      ],
    },
    offers: [
      {
        sellerId: "S01",
        sellerName: p.seller || "QUALIWATT",
        country: "FR",
        flag: "🇫🇷",
        rating: 4.8,
        reviews: 8,
        stock: p.stock,
        price: p.price,
        availableDate: null,
        badge: "trusted",
        bankTransfer: true,
        delivery: "suntrex",
      },
    ],
  };
}

/* ── Styles ── */
const S = {
  page: { maxWidth: 960, margin: "0 auto", padding: "20px 24px 60px", fontFamily: "'DM Sans',sans-serif" },
  breadcrumb: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", marginBottom: 24, flexWrap: "wrap" },
  breadcrumbLink: { color: "#555", textDecoration: "none", cursor: "pointer" },
  breadcrumbCurrent: { color: "#333", fontWeight: 500 },
  productHeader: { display: "flex", gap: 32, marginBottom: 36, border: "1px solid #e8e8e8", borderRadius: 12, padding: 28, background: "#fff" },
  productImage: { width: 240, height: 300, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 16 },
  brandTag: { fontSize: 14, fontWeight: 700, letterSpacing: "0.01em", marginBottom: 6 },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: "#222", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "14px 0" },
  greenBar: { width: "100%", height: 3, background: "#4CAF50", borderRadius: 2, marginTop: 2 },
  specRow: { display: "flex", padding: "14px 20px", fontSize: 14, borderBottom: "1px solid #f0f0f0" },
  specLabel: { flex: 1, color: "#666" },
  specValue: { flex: 1, color: "#222", fontWeight: 500 },
  specRowAlt: { background: "#fafafa" },
  offerCard: { border: "1px solid #e4e5ec", borderRadius: 10, padding: "18px 24px", marginBottom: 12 },
  badge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 },
  priceBlur: { filter: "blur(8px)", userSelect: "none", fontSize: 22, fontWeight: 700, color: "#222" },
  priceCTA: { background: "#1a3a2a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  rfpBanner: { background: "linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)", borderRadius: 12, padding: "28px 32px", marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 },
  downloadRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#fafafa", borderRadius: 8, marginBottom: 8 },
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={S.sectionTitle} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <svg width="16" height="16" style={{ transform: open ? "rotate(0)" : "rotate(180deg)", transition: "transform .2s" }} fill="none" stroke="#555" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
      </div>
      {open && <div style={S.greenBar} />}
      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

function SpecsTable({ specs }) {
  return (
    <div style={{ border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden" }}>
      {specs.map((spec, i) => (
        <div key={i} style={{ ...S.specRow, ...(i % 2 === 0 ? S.specRowAlt : {}) }}>
          <span style={S.specLabel}>{spec.label}</span>
          <span style={S.specValue}>{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

function OfferCard({ offer, isLoggedIn, onLogin, t, formatMoney, language }) {
  return (
    <div style={S.offerCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
            {t("product.availability")}{" "}
            <b style={{ color: "#222" }}>
              {offer.availableDate || t("product.immediate")} ({offer.stock.toLocaleString()} {t("common.pcs")})
            </b>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: offer.stock > 0 ? "#4CAF50" : "#f44336", marginLeft: 6 }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {offer.badge === "trusted" && (
              <span style={{ ...S.badge, background: "#fff8e1", color: "#f57f17", border: "1px solid #ffe082" }}>⭐ {t("product.superSeller")}</span>
            )}
            <span style={{ ...S.badge, background: "#f5f5f5", color: "#555", border: "1px solid #e0e0e0" }}>{offer.flag} {offer.country}</span>
            <span style={{ ...S.badge, background: "#f5f5f5", color: "#555", border: "1px solid #e0e0e0" }}>⭐ {offer.rating} ({offer.reviews})</span>
            {offer.bankTransfer && (
              <span style={{ ...S.badge, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" }}>🏦 {t("product.secureBankTransfer")}</span>
            )}
            {offer.delivery === "suntrex" && (
              <span style={{ ...S.badge, background: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2" }}>🚚 SUNTREX Delivery</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isLoggedIn ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888" }}>{t("product.from")}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>{formatMoney(offer.price, language)} <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>{t("product.perPiece")}</span></div>
            </div>
          ) : (
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={S.priceBlur}>{formatMoney(offer.price * 0.9 + Math.random() * 30, language)}</span>
              <button onClick={onLogin} style={S.priceCTA}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {t("product.signUpToSeePrices")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ isLoggedIn, onLogin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { formatMoney } = useCurrency();
  const { isMobile } = useResponsive();

  const CATEGORY_LABELS = {
    inverters: t("catalog.inverters"), batteries: t("catalog.batteriesStorage"), optimizers: t("catalog.optimizers"),
    "ev-chargers": t("catalog.chargingStations"), accessories: t("catalog.accessories"), panels: t("home.categories.solarPanels"),
  };

  const realProduct = REAL_PRODUCTS.find(p => p.id === id);

  if (!realProduct) {
    return (
      <div style={{ ...S.page, textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#222", marginBottom: 8 }}>{t("product.notFound", "Produit non trouvé")}</h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 24 }}>{t("product.notFoundDesc", "Ce produit n'existe pas ou a été retiré du catalogue.")}</p>
        <button
          onClick={() => navigate("/catalog")}
          style={{ background: "#1a3a2a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          {t("product.backToCatalog", "Retour au catalogue")}
        </button>
      </div>
    );
  }

  const product = buildProductDetail(realProduct, t, CATEGORY_LABELS);
  const [sortOffers, setSortOffers] = useState("price-asc");

  const sortedOffers = [...product.offers].sort((a, b) => {
    if (sortOffers === "price-asc") return a.price - b.price;
    if (sortOffers === "price-desc") return b.price - a.price;
    if (sortOffers === "stock") return b.stock - a.stock;
    if (sortOffers === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <div style={{...S.page, padding: isMobile ? "16px 16px 40px" : "20px 24px 60px"}}>
      <div style={S.breadcrumb}>
        <span style={S.breadcrumbLink} onClick={()=>navigate(-1)}>{t("product.home")}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={S.breadcrumbLink} onClick={()=>navigate(-1)}>{product.categoryLabel}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={S.breadcrumbCurrent}>{product.name}</span>
      </div>

      <div style={{...S.productHeader, flexDirection: isMobile ? "column" : "row", padding: isMobile ? 16 : 28}}>
        <div style={{...S.productImage, width: isMobile ? "100%" : 240, height: isMobile ? 200 : 300}}>
          <img
            src={product.image || CATEGORY_FALLBACK_IMAGES[product.category] || "/categories/panels.jpg"}
            alt={product.name}
            style={{ maxHeight: 300, maxWidth: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
            onError={e => { e.target.onerror = null; e.target.src = CATEGORY_FALLBACK_IMAGES[product.category] || "/categories/panels.jpg"; }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.brandTag, color: product.brandColor }}>{product.brand}</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#222", margin: "4px 0 8px", lineHeight: 1.3 }}>{product.name}</h1>
          <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{product.subtitle}</div>
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden" }}>
            {product.specs.electrical.slice(0, 4).map((spec, i) => (
              <div key={i} style={{ ...S.specRow, ...(i % 2 === 0 ? S.specRowAlt : {}), padding: "12px 20px" }}>
                <span style={{ ...S.specLabel, fontSize: 13 }}>{spec.label}</span>
                <span style={{ ...S.specValue, fontSize: 13 }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Section title={t("product.description")}>
        <div style={{ background: "#fafafa", borderRadius: 10, padding: "20px 24px", fontSize: 14, lineHeight: 1.7, color: "#444" }}>{product.description}</div>
      </Section>

      {product.datasheet && (
        <Section title={t("product.downloads")}>
          <a href={product.datasheet} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ ...S.downloadRow, cursor: "pointer", transition: "background .15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" fill="none" stroke="#4CAF50" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{t("product.datasheet")} — {product.name}</span>
                  <span style={{ fontSize: 11, color: "#888", display: "block", marginTop: 2 }}>{product.datasheet.startsWith("/") ? "PDF" : t("product.productPage")}</span>
                </div>
              </div>
              <svg width="18" height="18" fill="none" stroke="#4CAF50" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </div>
          </a>
        </Section>
      )}

      <Section title={`${t("product.technicalSpecs")} — ${product.name}`}>
        <SpecsTable specs={[...product.specs.general, ...product.specs.electrical]} />
      </Section>

      <Section title={t("product.mechanicalSpecs")} defaultOpen={false}>
        <SpecsTable specs={product.specs.mechanical} />
      </Section>

      <Section title={`${t("product.dimensions")} — ${product.name}`}>
        <SpecsTable specs={product.specs.dimensions} />
      </Section>

      <div style={{...S.rfpBanner, flexDirection: isMobile ? "column" : "row", padding: isMobile ? "20px 16px" : "28px 32px"}}>
        <div>
          <h3 style={{ color: "#fff", fontSize: isMobile ? 16 : 18, fontWeight: 700, marginBottom: 6 }}>{t("product.rfpBanner.title")}</h3>
          <p style={{ color: "#a8d5ba", fontSize: isMobile ? 13 : 14, margin: 0 }}>{t("product.rfpBanner.subtitle")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 8 : 16, marginTop: 12 }}>
            {[t("product.rfpBanner.fast"), t("product.rfpBanner.free"), t("product.rfpBanner.noCommitment"), t("product.rfpBanner.responseTime")].map(tag => (
              <span key={tag} style={{ fontSize: 12, color: "#a8d5ba", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#4CAF50" }}>✓</span> {tag}
              </span>
            ))}
          </div>
        </div>
        <button style={{ background: "#fff", color: "#1a3a2a", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          {t("product.rfpBanner.createRequest")}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#222" }}>{t("product.offers")} — {product.name}</h2>
        <select value={sortOffers} onChange={e => setSortOffers(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, color: "#555", fontFamily: "inherit", background: "#fff", cursor: "pointer" }}>
          <option value="price-asc">{t("product.sortByLowestPrice")}</option>
          <option value="price-desc">{t("product.sortByHighestPrice")}</option>
          <option value="stock">{t("product.sortByAvailability")}</option>
          <option value="rating">{t("product.sortByBestRating")}</option>
        </select>
      </div>

      {sortedOffers.map((offer, i) => (
        <OfferCard key={i} offer={offer} isLoggedIn={isLoggedIn} onLogin={onLogin} t={t} formatMoney={formatMoney} language={i18n.language} />
      ))}
    </div>
  );
}
