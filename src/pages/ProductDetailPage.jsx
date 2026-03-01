import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import REAL_PRODUCTS from "../products";
import useResponsive from "../hooks/useResponsive";
import { generateOffers, getSimilarProducts } from "../lib/multiVendorOffers";

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
      {open && <div style={{ width: "100%", height: 3, background: "#4CAF50", borderRadius: 2 }} />}
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

/* ── Badge Component ── */
function Badge({ children, bg, color, border }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: bg, color, border: "1px solid " + border }}>{children}</span>;
}

/* ── Single Offer Card (sun.store style) ── */
function OfferCard({ offer, isLoggedIn, onLogin, t, formatMoney, lang, isBest }) {
  return (
    <div style={{
      border: isBest ? "2px solid #4CAF50" : "1px solid #e4e5ec",
      borderRadius: 12, padding: "18px 20px", marginBottom: 12,
      background: isBest ? "#f0fdf4" : "#fff",
      position: "relative",
      transition: "box-shadow .15s",
    }}>
      {offer.isBestPrice && (
        <div style={{ position: "absolute", top: -10, left: 16, background: "#4CAF50", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10, letterSpacing: "0.02em" }}>
          {lang === "fr" ? "MEILLEUR PRIX" : "BEST PRICE"}
        </div>
      )}
      
      {/* Top row: seller info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>{offer.sellerName}</span>
            {offer.badge === "trusted" && <Badge bg="#fff8e1" color="#f57f17" border="#ffe082">\u2b50 Super Seller</Badge>}
            {offer.badge === "verified" && <Badge bg="#e8f5e9" color="#2e7d32" border="#c8e6c9">\u2713 V\u00e9rifi\u00e9</Badge>}
            {offer.badge === "new" && <Badge bg="#e3f2fd" color="#1565c0" border="#bbdefb">Nouveau</Badge>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Badge bg="#f5f5f5" color="#555" border="#e0e0e0">{offer.flag} {offer.country}</Badge>
            <Badge bg="#f5f5f5" color="#555" border="#e0e0e0">\u2b50 {offer.rating} ({offer.reviews})</Badge>
            {offer.delivery === "suntrex" && <Badge bg="#fff3e0" color="#e65100" border="#ffe0b2">\ud83d\ude9a SUNTREX Delivery</Badge>}
            {offer.bankTransfer && <Badge bg="#e8f5e9" color="#2e7d32" border="#c8e6c9">\ud83c\udfe6 Virement</Badge>}
            {offer.isBestDelivery && !offer.isBestPrice && <Badge bg="#e3f2fd" color="#1565c0" border="#bbdefb">\u26a1 Livraison rapide</Badge>}
          </div>
        </div>
      </div>
      
      {/* Bottom row: availability + price + CTA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{t("product.availability", "Disponibilit\u00e9")}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>
              {offer.stockMin.toLocaleString()} - {offer.stockMax.toLocaleString()} pcs
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4CAF50", marginLeft: 6, verticalAlign: "middle" }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{lang === "fr" ? "Livraison" : "Delivery"}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>{offer.deliveryDays} {lang === "fr" ? "jours" : "days"}</div>
          </div>
          {offer.moq > 1 && (
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>MOQ</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#555" }}>{offer.moq} pcs</div>
            </div>
          )}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isLoggedIn ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888" }}>{lang === "fr" ? "\u00c0 partir de" : "From"}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>
                {formatMoney(offer.price, lang)}
                <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}> /{lang === "fr" ? "pcs" : "pc"}</span>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ filter: "blur(8px)", userSelect: "none", fontSize: 22, fontWeight: 700, color: "#222" }}>
                {formatMoney(offer.price * 0.9 + Math.random() * 30, lang)}
              </span>
            </div>
          )}
          
          {isLoggedIn ? (
            <button style={{
              background: "#1a3a2a", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
              transition: "background .15s",
            }}
            onMouseEnter={e => e.target.style.background = "#2d5a3d"}
            onMouseLeave={e => e.target.style.background = "#1a3a2a"}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
              {t("product.seeOffer", "D\u00e9tails de l'offre")}
            </button>
          ) : (
            <button onClick={onLogin} style={{
              background: "#E8700A", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {t("product.signUpToSeePrices", "S'inscrire pour voir les prix")}
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
      background: "#fff", transition: "box-shadow .15s", minWidth: 180,
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <img src={p.image || CAT_IMG[p.category] || "/categories/panels.jpg"} alt={p.name}
          style={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
          onError={e => { e.target.onerror = null; e.target.src = CAT_IMG[p.category] || "/categories/panels.jpg"; }} />
      </div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{p.brand}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
      {p.power && <div style={{ fontSize: 12, color: "#555" }}>\u26a1 {p.power}</div>}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#222", marginTop: 8 }}>
        {isLoggedIn ? (
          <>{formatMoney(p.price, lang)} <span style={{ fontSize: 11, fontWeight: 400, color: "#888" }}>/pcs</span></>
        ) : (
          <span style={{ filter: "blur(6px)", userSelect: "none" }}>{formatMoney(p.price * 1.1, lang)}</span>
        )}
      </div>
      {p.stock > 0 && <div style={{ fontSize: 11, color: "#4CAF50", marginTop: 4 }}>\u25cf {p.stock.toLocaleString()} pcs</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ProductDetailPage({ isLoggedIn, onLogin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { formatMoney } = useCurrency();
  const { isMobile } = useResponsive();
  const lang = i18n.language;

  const CATS = {
    inverters: t("catalog.inverters", "Onduleurs"),
    batteries: t("catalog.batteriesStorage", "Batteries"),
    optimizers: t("catalog.optimizers", "Optimiseurs"),
    "ev-chargers": t("catalog.chargingStations", "Bornes de recharge"),
    accessories: t("catalog.accessories", "Accessoires"),
    panels: t("home.categories.solarPanels", "Panneaux solaires"),
    mounting: "Structures de montage",
  };

  const product = REAL_PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px", textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>\ud83d\udd0d</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#222", marginBottom: 8 }}>{t("product.notFound", "Produit non trouv\u00e9")}</h1>
        <p style={{ fontSize: 15, color: "#888", marginBottom: 24 }}>{t("product.notFoundDesc", "Ce produit n'existe pas ou a \u00e9t\u00e9 retir\u00e9 du catalogue.")}</p>
        <button onClick={() => navigate("/catalog")} style={{ background: "#1a3a2a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {t("product.backToCatalog", "Retour au catalogue")}
        </button>
      </div>
    );
  }

  // Generate offers & similar
  const offers = generateOffers(product);
  const similar = getSimilarProducts(product, REAL_PRODUCTS, 4);
  const brandColor = BC[product.brand] || "#555";

  // Build specs
  const quickSpecs = [
    product.power && { label: lang === "fr" ? "Puissance" : "Power", value: product.power },
    product.capacity && { label: lang === "fr" ? "Capacit\u00e9" : "Capacity", value: product.capacity },
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

  const [sortBy, setSortBy] = useState("price-asc");
  const [includeDelivery, setIncludeDelivery] = useState(false);
  
  const sortedOffers = [...offers].sort((a, b) => {
    const pa = includeDelivery ? a.priceWithDelivery : a.price;
    const pb = includeDelivery ? b.priceWithDelivery : b.price;
    if (sortBy === "price-asc") return pa - pb;
    if (sortBy === "price-desc") return pb - pa;
    if (sortBy === "stock") return b.stockMax - a.stockMax;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "delivery") return a.deliveryDays - b.deliveryDays;
    return 0;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 16px 40px" : "20px 32px 60px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ color: "#555", cursor: "pointer" }} onClick={() => navigate("/")}>{t("product.home", "Accueil")}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={{ color: "#555", cursor: "pointer" }} onClick={() => navigate("/catalog")}>{CATS[product.category] || product.category}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={{ color: "#333", fontWeight: 500 }}>{product.name}</span>
      </div>

      {/* ═══ TWO-COLUMN LAYOUT (sun.store style) ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 32, marginBottom: 40 }}>
        
        {/* LEFT: Product info + specs */}
        <div>
          {/* Product header card */}
          <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, padding: isMobile ? 16 : 24, background: "#fff", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, padding: 16 }}>
              <img src={product.image || CAT_IMG[product.category] || "/categories/panels.jpg"} alt={product.name}
                style={{ maxHeight: 260, maxWidth: "100%", objectFit: "contain", mixBlendMode: "multiply" }}
                onError={e => { e.target.onerror = null; e.target.src = CAT_IMG[product.category] || "/categories/panels.jpg"; }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: brandColor, marginBottom: 4 }}>{product.brand}</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: "0 0 12px", lineHeight: 1.3 }}>{product.name}</h1>
            
            {/* Quick specs table */}
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

          {/* Description */}
          {product.description && (
            <Section title="Description">
              <div style={{ background: "#fafafa", borderRadius: 10, padding: "16px 20px", fontSize: 14, lineHeight: 1.7, color: "#444" }}>
                {product.description}
                {product.features && product.features.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {product.features.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: "#4CAF50", flexShrink: 0 }}>\u2713</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Datasheet download */}
          {product.datasheet && (product.datasheet.startsWith("/") || product.datasheet.startsWith("http")) && (
            <Section title={lang === "fr" ? "T\u00e9l\u00e9chargements" : "Downloads"}>
              <a href={product.datasheet} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#fafafa", borderRadius: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" stroke="#4CAF50" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>Datasheet — {product.name}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>PDF</div>
                    </div>
                  </div>
                  <svg width="18" height="18" fill="none" stroke="#4CAF50" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </div>
              </a>
            </Section>
          )}
        </div>

        {/* RIGHT: Offers comparison */}
        <div>
          {/* Sort + delivery toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#555" }}>
              <div onClick={() => setIncludeDelivery(!includeDelivery)} style={{
                width: 40, height: 22, borderRadius: 11, background: includeDelivery ? "#4CAF50" : "#ddd",
                position: "relative", cursor: "pointer", transition: "background .2s",
              }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: includeDelivery ? 20 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              {lang === "fr" ? "Livraison incluse" : "Delivery included"}
            </label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13,
              color: "#555", fontFamily: "inherit", background: "#fff", cursor: "pointer",
            }}>
              <option value="price-asc">{lang === "fr" ? "Prix croissant" : "Lowest price"}</option>
              <option value="price-desc">{lang === "fr" ? "Prix d\u00e9croissant" : "Highest price"}</option>
              <option value="stock">{lang === "fr" ? "Disponibilit\u00e9" : "Availability"}</option>
              <option value="rating">{lang === "fr" ? "Meilleure note" : "Best rating"}</option>
              <option value="delivery">{lang === "fr" ? "Livraison rapide" : "Fastest delivery"}</option>
            </select>
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
              padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
              {lang === "fr" ? "Cr\u00e9er une demande" : "Create request"}
            </button>
          </div>

          {/* Offers list header */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "#222", marginBottom: 14 }}>
            {lang === "fr" ? "Offres" : "Offers"} {product.name}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#888", marginLeft: 8 }}>({sortedOffers.length} {lang === "fr" ? "vendeurs" : "vendors"})</span>
          </div>

          {/* Offer cards */}
          {sortedOffers.map((offer, i) => (
            <OfferCard key={offer.sellerId} offer={offer} isLoggedIn={isLoggedIn} onLogin={onLogin}
              t={t} formatMoney={formatMoney} lang={lang} isBest={i === 0 && sortBy === "price-asc"} />
          ))}
        </div>
      </div>

      {/* ═══ FULL SPECS (full width below) ═══ */}
      <Section title={lang === "fr" ? "Sp\u00e9cifications techniques compl\u00e8tes" : "Full Technical Specifications"}>
        <SpecsTable specs={fullSpecs} />
      </Section>

      {/* ═══ SIMILAR PRODUCTS ═══ */}
      {similar.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#222", margin: 0 }}>
              {lang === "fr" ? "Produits similaires" : "Similar Products"}
            </h2>
            <span onClick={() => navigate("/catalog")} style={{ fontSize: 13, color: "#E8700A", cursor: "pointer", fontWeight: 500 }}>
              {lang === "fr" ? "Voir tout" : "View all"} \u2192
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16 }}>
            {similar.map(p => (
              <SimilarCard key={p.id} p={p} navigate={navigate} formatMoney={formatMoney} lang={lang} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
