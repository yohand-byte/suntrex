import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import useResponsive from "../hooks/useResponsive";
import useProductsCatalog from "../hooks/useProductsCatalog";
import { generateOffers, getSimilarProducts, TIERS } from "../lib/multiVendorOffers";
import { TierBadge, VerifiedBadge, EscrowBadge, ColisVerifBadge, DeliveryBadge, ResponseBadge } from "../components/product/TrustBadges";
import ComparisonDrawer from "../components/product/ComparisonDrawer";
import ProductRecommendation from "../components/ai/ProductRecommendation";

/* ── Fallback images ── */
const CAT_IMG = {
  panels: "/categories/panels.jpg", inverters: "/categories/inverters.jpg",
  batteries: "/categories/batteries.jpg", "micro-inverters": "/categories/inverters.jpg",
  optimizers: "/categories/inverters.jpg", "ev-chargers": "/categories/category-onduleurs.png",
  mounting: "/categories/category-accessoires.png", accessories: "/categories/category-accessoires.png",
  cables: "/categories/electrical.jpg",
};

const BC = {
  Huawei: "#e4002b", Deye: "#0068b7", Enphase: "#f47920", SMA: "#cc0000",
  SolarEdge: "#e21e26", "Jinko Solar": "#1a8c37", "Trina Solar": "#cc0000",
  LONGi: "#008c44", "JA Solar": "#003da6", "Canadian Solar": "#003ca6",
  BYD: "#c00", Growatt: "#ee7203", GoodWe: "#007ac1", Sungrow: "#1a5aa6",
  "Risen Energy": "#e60012", Hoymiles: "#1a73e8",
};

/* ── Collapsible Section ── */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "14px 0", fontSize: 17, fontWeight: 700, color: "#222" }}>
        <span>{title}</span>
        <svg width="16" height="16" style={{ transform: open ? "rotate(0)" : "rotate(180deg)", transition: "transform .2s" }} fill="none" stroke="#555" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
      </div>
      {open && <div style={{ width: "100%", height: 3, background: "#E8700A", borderRadius: 2 }} />}
      {open && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

/* ── Specs Table ── */
function SpecsTable({ specs }) {
  return (
    <div style={{ border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden" }}>
      {specs.map((s, i) => (
        <div key={i} style={{ display: "flex", padding: "14px 20px", fontSize: 14, borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
          <span style={{ flex: 1, color: "#666" }}>{s.label}</span>
          <span style={{ flex: 1, color: "#222", fontWeight: 500 }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── v2 Offer Card with Trust Badges ── */
function OfferCard({ offer, isLoggedIn, onLogin, t, formatMoney, lang, isBest, onCompare, isCompareSelected }) {
  const o = offer;
  return (
    <div style={{
      border: isBest ? "2px solid #059669" : isCompareSelected ? "2px solid #2563eb" : "1px solid #e4e5ec",
      borderRadius: 12, overflow: "hidden", marginBottom: 12,
      background: isCompareSelected ? "#eff6ff" : isBest ? "#f0fdf4" : "#fff",
      position: "relative", transition: "box-shadow .2s, border-color .2s",
    }}>
      {o.isBestPrice && (
        <div style={{ position: "absolute", top: 0, left: 16, background: "linear-gradient(135deg, #E8700A 0%, #f59e0b 100%)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 12px", borderRadius: "0 0 6px 6px", zIndex: 2 }}>
          ★ {lang === "fr" ? "MEILLEUR PRIX" : "BEST PRICE"}
        </div>
      )}

      {/* Top: seller info + badges */}
      <div style={{ padding: o.isBestPrice ? "22px 20px 12px" : "14px 20px 12px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg, #E8700A18, #E8700A35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#E8700A",
                border: "2px solid #E8700A25", flexShrink: 0,
              }}>
                {o.sellerName.charAt(0)}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#222" }}>{o.sellerName}</span>
                  <span style={{ fontSize: 14 }}>{o.flag}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "#888" }}>
                  <span>{o.transactions?.toLocaleString() || 0} {lang === "fr" ? "ventes" : "sales"}</span>
                  <span style={{ width: 1, height: 10, background: "#e4e5ec" }} />
                  <span>{lang === "fr" ? "Depuis" : "Since"} {o.joined || "2024"}</span>
                  {o.speciality && (
                    <>
                      <span style={{ width: 1, height: 10, background: "#e4e5ec" }} />
                      <span style={{ color: "#E8700A", fontWeight: 600 }}>{o.speciality}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Trust badges row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
              <TierBadge tier={o.tier} />
              {o.verified && <VerifiedBadge />}
              {o.escrow && <EscrowBadge />}
              {o.colisVerif && <ColisVerifBadge />}
              <DeliveryBadge type={o.delivery} />
              <ResponseBadge minutes={o.responseMin || 60} />
            </div>
          </div>
          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>⭐</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#222" }}>{o.rating.toFixed(1)}</span>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#eef0f4", overflow: "hidden" }}>
              <div style={{ width: (o.rating / 5 * 100) + "%", height: "100%", borderRadius: 2, background: o.rating >= 4.5 ? "#059669" : "#d97706" }} />
            </div>
            <span style={{ fontSize: 10.5, color: "#888" }}>({o.reviews})</span>
          </div>
        </div>
      </div>

      {/* Bottom: stock + price + actions */}
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: o.stock > 100 ? "#059669" : o.stock > 10 ? "#d97706" : o.stock > 0 ? "#dc2626" : "#9aa0a6",
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#222" }}>
              {o.stock > 0 ? o.stockMin.toLocaleString() + " – " + o.stockMax.toLocaleString() : "—"} pcs
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10.5, color: "#888" }}>
            <span>📦 {lang === "fr" ? "Délai" : "Lead"}: <b style={{ color: "#222" }}>{o.deliveryDays}j</b></span>
            {o.moq > 1 && <span>🔢 MOQ: <b style={{ color: "#222" }}>{o.moq} pcs</b></span>}
            {o.delivery === "suntrex" && <span style={{ color: "#E8700A", fontWeight: 700 }}>🚛 Suivi inclus</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isLoggedIn ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#888" }}>{lang === "fr" ? "À partir de" : "From"}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>
                {formatMoney(o.price, lang)}
                <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}> /pcs</span>
              </div>
            </div>
          ) : (
            <span style={{ filter: "blur(8px)", userSelect: "none", fontSize: 22, fontWeight: 700, color: "#222" }}>
              ---,-- €
            </span>
          )}

          {/* Compare checkbox */}
          {isLoggedIn && (
            <button onClick={() => onCompare?.(o.sellerId)} style={{
              width: 32, height: 32, borderRadius: 7, cursor: "pointer",
              border: "1px solid " + (isCompareSelected ? "#2563eb" : "#e4e5ec"),
              background: isCompareSelected ? "#eff6ff" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isCompareSelected ? "#2563eb" : "#888",
              fontSize: 14, transition: "all .15s",
            }} title={lang === "fr" ? "Comparer" : "Compare"}>
              ⚖️
            </button>
          )}

          {isLoggedIn ? (
            <button style={{
              background: "#1a3a2a", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 18px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              transition: "background .15s",
            }}
            onMouseEnter={e => e.target.style.background = "#2d5a3d"}
            onMouseLeave={e => e.target.style.background = "#1a3a2a"}>
              💬 {t("product.seeOffer", "Contacter")}
            </button>
          ) : (
            <button onClick={onLogin} style={{
              background: "#E8700A", color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 18px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
            }}>
              🔒 {t("product.signUpToSeePrices", "S'inscrire")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Similar Product Card ── */
function SimilarCard({ p, navigate, formatMoney, lang, isLoggedIn }) {
  return (
    <div onClick={() => navigate("/product/" + p.id)} style={{
      border: "1px solid #e8e8e8", borderRadius: 10, padding: 16, cursor: "pointer",
      background: "#fff", transition: "box-shadow .15s, transform .15s", minWidth: 180,
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <img src={p.image || CAT_IMG[p.category] || "/categories/panels.jpg"} alt={p.name}
          style={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
          onError={e => { e.target.onerror = null; e.target.src = CAT_IMG[p.category] || "/categories/panels.jpg"; }} />
      </div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{p.brand}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
      {p.power && <div style={{ fontSize: 12, color: "#555" }}>⚡ {p.power}</div>}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginTop: 8 }}>
        {isLoggedIn ? (
          <>{formatMoney(p.price, lang)} <span style={{ fontSize: 11, fontWeight: 400, color: "#888" }}>/pcs</span></>
        ) : (
          <span style={{ filter: "blur(6px)", userSelect: "none" }}>---,-- €</span>
        )}
      </div>
      {p.stock > 0 && <div style={{ fontSize: 11, color: "#059669", marginTop: 4 }}>● {p.stock.toLocaleString()} pcs</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ProductDetailPage({ isLoggedIn, onLogin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["translation", "catalog", "homepage"]);
  const tcatalog = (key, opts) => t(`catalog:${key}`, opts);
  const thome = (key, opts) => t(`homepage:${key}`, opts);
  const { formatMoney } = useCurrency();
  const { isMobile } = useResponsive();
  const { products, loading: productsLoading } = useProductsCatalog();
  const lang = i18n.language;

  const CATS = {
    inverters: tcatalog("inverters", "Onduleurs"),
    batteries: tcatalog("batteriesStorage", "Batteries"),
    optimizers: tcatalog("optimizers", "Optimiseurs"),
    "ev-chargers": tcatalog("chargingStations", "Bornes de recharge"),
    accessories: tcatalog("accessories", "Accessoires"),
    panels: thome("categories.solarPanels", "Panneaux solaires"),
    mounting: "Structures de montage",
  };

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  if (productsLoading) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>⏳</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#222", marginBottom: 8 }}>Chargement du produit...</h1>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#222", marginBottom: 8 }}>{t("product.notFound", "Produit non trouvé")}</h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 24 }}>{t("product.notFoundDesc", "Ce produit n'existe pas ou a été retiré du catalogue.")}</p>
        <button onClick={() => navigate("/catalog")} style={{ background: "#1a3a2a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {t("product.backToCatalog", "Retour au catalogue")}
        </button>
      </div>
    );
  }

  // Generate offers & similar
  const offers = useMemo(() => generateOffers(product), [product]);
  const similar = getSimilarProducts(product, products, 4);
  const brandColor = BC[product.brand] || "#555";

  // Build specs
  const quickSpecs = [
    product.power && { label: lang === "fr" ? "Puissance" : "Power", value: product.power },
    product.capacity && { label: lang === "fr" ? "Capacité" : "Capacity", value: product.capacity },
    product.phases && { label: "Phases", value: String(product.phases) },
    product.efficiency && { label: lang === "fr" ? "Rendement" : "Efficiency", value: product.efficiency },
    product.mppt && { label: "MPPT", value: String(product.mppt) },
    product.chemistry && { label: lang === "fr" ? "Chimie" : "Chemistry", value: product.chemistry },
  ].filter(Boolean);

  const fullSpecs = [
    { label: "SKU", value: product.sku },
    { label: lang === "fr" ? "Marque" : "Brand", value: product.brand },
    { label: lang === "fr" ? "Garantie" : "Warranty", value: product.warranty || "N/A" },
    ...(product.protection ? [{ label: lang === "fr" ? "Protection" : "Protection Rating", value: product.protection }] : []),
    ...(product.certifications ? [{ label: "Certifications", value: product.certifications.join(", ") }] : []),
    ...quickSpecs,
    ...(product.dod ? [{ label: "DoD", value: product.dod }] : []),
    ...(product.cycles ? [{ label: "Cycles", value: product.cycles }] : []),
    ...(product.weight ? [{ label: lang === "fr" ? "Poids" : "Weight", value: String(product.weight) }] : []),
  ];

  // ── State: sorting, filtering, comparison ──
  const [sortBy, setSortBy] = useState("price-asc");
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const countries = useMemo(() => [...new Set(offers.map(o => o.country))], [offers]);

  const sortedOffers = useMemo(() => {
    let s = [...offers];
    if (filterCountry !== "all") s = s.filter(o => o.country === filterCountry);
    if (filterDelivery !== "all") s = s.filter(o => o.delivery === filterDelivery);

    s.sort((a, b) => {
      const pa = includeDelivery ? a.priceWithDelivery : a.price;
      const pb = includeDelivery ? b.priceWithDelivery : b.price;
      if (sortBy === "price-asc") return pa - pb;
      if (sortBy === "price-desc") return pb - pa;
      if (sortBy === "stock") return b.stockMax - a.stockMax;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "delivery") return a.deliveryDays - b.deliveryDays;
      if (sortBy === "trust") return (TIERS[b.tier]?.rank || 0) - (TIERS[a.tier]?.rank || 0);
      return 0;
    });
    return s;
  }, [offers, sortBy, includeDelivery, filterCountry, filterDelivery]);

  const toggleCompare = useCallback((sellerId) => {
    setCompareIds(prev =>
      prev.includes(sellerId) ? prev.filter(x => x !== sellerId) : [...prev, sellerId].slice(-4)
    );
  }, []);

  const aggStock = offers.reduce((s, o) => s + o.stock, 0);
  const bestPrice = offers.length > 0 ? Math.min(...offers.map(o => o.price)) : 0;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 16px 40px" : "20px 32px 60px", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}`}</style>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ color: "#555", cursor: "pointer" }} onClick={() => navigate("/")}>{t("product.home", "Accueil")}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={{ color: "#555", cursor: "pointer" }} onClick={() => navigate("/catalog")}>{CATS[product.category] || product.category}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={{ color: "#333", fontWeight: 500 }}>{product.name}</span>
      </div>

      {/* ═══ TWO-COLUMN LAYOUT ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32, marginBottom: 40 }}>

        {/* LEFT: Product info + specs */}
        <div>
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, padding: isMobile ? 16 : 24, background: "#fff", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, padding: 16 }}>
              <img src={product.image || CAT_IMG[product.category] || "/categories/panels.jpg"} alt={product.name}
                style={{ maxHeight: 260, maxWidth: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
                onError={e => { e.target.onerror = null; e.target.src = CAT_IMG[product.category] || "/categories/panels.jpg"; }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: brandColor, marginBottom: 4 }}>{product.brand}</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: "0 0 12px", lineHeight: 1.3 }}>{product.name}</h1>

            {/* Aggregate bar */}
            <div style={{
              background: "linear-gradient(135deg, #fff7ed, #fffbeb)", border: "1px solid #fed7aa",
              borderRadius: 10, padding: "12px 16px", marginBottom: 16,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
            }}>
              <div>
                <div style={{ fontSize: 10.5, color: "#E8700A", fontWeight: 600 }}>{lang === "fr" ? "Disponible maintenant" : "Available now"}</div>
                <div style={{ fontSize: 12.5, color: "#222", fontWeight: 600 }}>
                  <span style={{ color: "#059669" }}>●</span> {aggStock.toLocaleString()} pcs
                  <span style={{ color: "#888", fontWeight: 400 }}> — <b style={{ color: "#E8700A" }}>{offers.length} {lang === "fr" ? "vendeurs" : "vendors"}</b> {lang === "fr" ? "dans" : "in"} {countries.length} {lang === "fr" ? "pays" : "countries"}</span>
                </div>
              </div>
              {isLoggedIn ? (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#888" }}>{lang === "fr" ? "à partir de" : "from"}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#222", letterSpacing: "-0.02em" }}>
                    {formatMoney(bestPrice, lang)}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#888" }}> /pcs HT</span>
                  </div>
                </div>
              ) : (
                <button onClick={onLogin} style={{
                  background: "#E8700A", color: "#fff", border: "none", borderRadius: 7,
                  padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  🔒 {lang === "fr" ? "Voir les prix" : "See prices"}
                </button>
              )}
            </div>

            {quickSpecs.length > 0 && (
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 8, overflow: "hidden" }}>
                {quickSpecs.map((s, i) => (
                  <div key={i} style={{ display: "flex", padding: "12px 16px", fontSize: 13, borderBottom: i < quickSpecs.length - 1 ? "1px solid #f0f0f0" : "none", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                    <span style={{ flex: 1, color: "#666" }}>{s.label}</span>
                    <span style={{ flex: 1, color: "#222", fontWeight: 500 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {product.description && (
            <Section title="Description">
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "16px 20px", fontSize: 14, lineHeight: 1.7, color: "#444" }}>
                {product.description}
                {product.features && product.features.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {product.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: "#059669", flexShrink: 0 }}>✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {product.datasheet && (product.datasheet.startsWith("/") || product.datasheet.startsWith("http")) && (
            <Section title={lang === "fr" ? "Téléchargements" : "Downloads"}>
              <a href={product.datasheet} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#fafafa", borderRadius: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>📄</div>
                    <div>
                      <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>Datasheet — {product.name}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>PDF</div>
                    </div>
                  </div>
                  <svg width="18" height="18" fill="none" stroke="#E8700A" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </div>
              </a>
            </Section>
          )}
        </div>

        {/* RIGHT: Offers comparison */}
        <div>
          {/* Compare button (sticky) */}
          {compareIds.length >= 2 && (
            <div style={{ position: "sticky", top: 70, zIndex: 50, marginBottom: 12 }}>
              <button onClick={() => setShowCompare(true)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#2563eb", color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", boxShadow: "0 3px 12px rgba(37,99,235,0.3)",
              }}>
                ⚖️ {lang === "fr" ? "Comparer" : "Compare"} ({compareIds.length} {lang === "fr" ? "vendeurs" : "vendors"})
              </button>
            </div>
          )}

          {/* Sort + filters bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#555" }}>
              <div onClick={() => setIncludeDelivery(!includeDelivery)} style={{
                width: 40, height: 22, borderRadius: 11, background: includeDelivery ? "#059669" : "#ddd",
                position: "relative", cursor: "pointer", transition: "background .2s",
              }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: includeDelivery ? 20 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              {lang === "fr" ? "Livraison incluse" : "Delivery included"}
            </label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: "7px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 12,
              color: "#555", fontFamily: "inherit", background: "#fff", cursor: "pointer",
            }}>
              <option value="price-asc">{lang === "fr" ? "Prix ↑" : "Price ↑"}</option>
              <option value="price-desc">{lang === "fr" ? "Prix ↓" : "Price ↓"}</option>
              <option value="stock">{lang === "fr" ? "Stock" : "Stock"}</option>
              <option value="rating">{lang === "fr" ? "Note" : "Rating"}</option>
              <option value="delivery">{lang === "fr" ? "Délai" : "Delivery"}</option>
              <option value="trust">{lang === "fr" ? "Confiance" : "Trust"}</option>
            </select>
          </div>

          {/* Country + delivery filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{
              padding: "5px 10px", borderRadius: 6, border: "1px solid #ddd",
              fontSize: 11, color: "#555", fontFamily: "inherit", background: "#fff", cursor: "pointer",
            }}>
              <option value="all">{lang === "fr" ? "Tous pays" : "All countries"}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterDelivery} onChange={e => setFilterDelivery(e.target.value)} style={{
              padding: "5px 10px", borderRadius: 6, border: "1px solid #ddd",
              fontSize: 11, color: "#555", fontFamily: "inherit", background: "#fff", cursor: "pointer",
            }}>
              <option value="all">{lang === "fr" ? "Toute livraison" : "All delivery"}</option>
              <option value="suntrex">🚛 SUNTREX</option>
              <option value="seller">📦 {lang === "fr" ? "Vendeur" : "Seller"}</option>
            </select>
            {(filterCountry !== "all" || filterDelivery !== "all") && (
              <button onClick={() => { setFilterCountry("all"); setFilterDelivery("all"); }} style={{
                background: "none", border: "none", fontSize: 11, color: "#dc2626",
                cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
              }}>
                ✕ Reset
              </button>
            )}
          </div>

          {/* RFQ Banner */}
          <div style={{
            background: "linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)",
            borderRadius: 12, padding: "20px 24px", marginBottom: 20,
          }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              {lang === "fr" ? "BESOIN DE CE PRODUIT ?" : "NEED THIS PRODUCT?"}
            </div>
            <div style={{ color: "#a8d5ba", fontSize: 13, marginBottom: 12 }}>
              {lang === "fr" ? "Envoyez une demande de devis aux vendeurs !" : "Send a quote request to all vendors!"}
            </div>
            <button style={{
              background: "#fff", color: "#1a3a2a", border: "none", borderRadius: 8,
              padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              ➕ {lang === "fr" ? "Créer une demande (RFQ)" : "Create request (RFQ)"}
            </button>
          </div>

          {/* Offers list header */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            {lang === "fr" ? "Offres" : "Offers"} {product.name}
            <span style={{ fontSize: 11, fontWeight: 600, color: "#E8700A", background: "#fff7ed", padding: "2px 8px", borderRadius: 10 }}>
              {sortedOffers.length} {lang === "fr" ? "vendeurs" : "vendors"}
            </span>
          </div>

          {/* Offer cards */}
          {sortedOffers.map((offer, i) => (
            <OfferCard
              key={offer.sellerId}
              offer={offer}
              isLoggedIn={isLoggedIn}
              onLogin={onLogin}
              t={t}
              formatMoney={formatMoney}
              lang={lang}
              isBest={i === 0 && sortBy === "price-asc" && filterCountry === "all"}
              onCompare={toggleCompare}
              isCompareSelected={compareIds.includes(offer.sellerId)}
            />
          ))}

          {sortedOffers.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 20px", color: "#888", background: "#fafafa", borderRadius: 10, border: "1px solid #eee" }}>
              <p style={{ fontSize: 13, margin: "0 0 8px" }}>{lang === "fr" ? "Aucune offre ne correspond à vos filtres." : "No offers match your filters."}</p>
              <button onClick={() => { setFilterCountry("all"); setFilterDelivery("all"); }} style={{
                background: "#E8700A", color: "#fff", border: "none", borderRadius: 6,
                padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {lang === "fr" ? "Réinitialiser" : "Reset filters"}
              </button>
            </div>
          )}

          {/* Trust section */}
          <div style={{ marginTop: 20, borderRadius: 12, overflow: "hidden", border: "1px solid #e8e8e8" }}>
            <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #1e293b, #334155)", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: "#E8700A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>🛡️</span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Protection SUNTREX</span>
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>{lang === "fr" ? "Chaque transaction protégée" : "Every transaction protected"}</span>
            </div>
            <div style={{ padding: "12px 18px", background: "#fff" }}>
              {[
                { icon: "🔒", text: lang === "fr" ? "Fonds sécurisés en escrow jusqu'à confirmation de réception" : "Funds secured in escrow until delivery confirmed" },
                { icon: "📦", text: lang === "fr" ? "Colis vérifié par QR code + photo avant expédition" : "Package verified by QR code + photo" },
                { icon: "🚛", text: lang === "fr" ? "Suivi temps réel + assurance transport incluse" : "Real-time tracking + shipping insurance" },
                { icon: "📞", text: lang === "fr" ? "Support multicanal — Chat, Email, Téléphone, WhatsApp" : "Multichannel support — Chat, Email, Phone, WhatsApp" },
                { icon: "💰", text: lang === "fr" ? "Commission -5% vs concurrence (4.75% au lieu de 5%+)" : "Commission -5% vs competitors (4.75% vs 5%+)" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #f0f0f0" : "none", fontSize: 12, color: "#555" }}>
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full specs */}
      <Section title={lang === "fr" ? "Spécifications techniques complètes" : "Full Technical Specifications"}>
        <SpecsTable specs={fullSpecs} />
      </Section>

      {/* Similar products */}
      {similar.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}>
              {lang === "fr" ? "Produits similaires" : "Similar Products"}
            </h2>
            <span onClick={() => navigate("/catalog")} style={{ fontSize: 13, color: "#E8700A", cursor: "pointer", fontWeight: 500 }}>
              {lang === "fr" ? "Voir tout" : "View all"} →
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16 }}>
            {similar.map(p => (
              <SimilarCard key={p.id} p={p} navigate={navigate} formatMoney={formatMoney} lang={lang} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div style={{ padding: isMobile ? "0" : "0 20px", maxWidth: 1200, margin: "0 auto" }}>
        <ProductRecommendation currentProduct={product} lang={lang} />
      </div>

      {/* Comparison Drawer */}
      {showCompare && (
        <ComparisonDrawer
          offers={offers}
          selectedIds={compareIds}
          onClose={() => setShowCompare(false)}
          isLoggedIn={isLoggedIn}
          formatMoney={formatMoney}
          lang={lang}
        />
      )}
    </div>
  );
}
