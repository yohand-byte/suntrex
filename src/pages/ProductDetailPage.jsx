import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import REAL_PRODUCTS from "../products";

/* ── Build detail view from real products.js data ── */
const BRAND_COLORS = {
  Huawei: "#e4002b", Deye: "#0068b7", Enphase: "#f47920", SMA: "#cc0000",
  "SolarEdge": "#e21e26", "Jinko Solar": "#1a8c37", "Trina Solar": "#cc0000",
  LONGi: "#008c44", "JA Solar": "#003da6", "Canadian Solar": "#003ca6",
  BYD: "#c00", Growatt: "#ee7203", GoodWe: "#007ac1", Sungrow: "#1a5aa6",
  "Risen Energy": "#e60012",
};

const CATEGORY_LABELS = {
  inverters: "Onduleurs", batteries: "Stockage", optimizers: "Optimiseurs",
  "ev-chargers": "Bornes de recharge", accessories: "Accessoires", panels: "Panneaux solaires",
};

function buildProductDetail(p) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.image || "",
    brandColor: BRAND_COLORS[p.brand] || "#555",
    category: p.category,
    categoryLabel: CATEGORY_LABELS[p.category] || p.category,
    subtitle: [p.type, p.phases ? `${p.phases}-Phase` : null, p.power || p.capacity].filter(Boolean).join(" — "),
    description: p.features ? p.features.join(". ") + "." : "",
    datasheet: p.datasheet || `${p.sku}-datasheet.pdf`,
    specs: {
      general: [
        { label: "SKU", value: p.sku },
        { label: "Marque", value: p.brand },
        { label: "Garantie", value: p.warranty || "N/A" },
        ...(p.protection ? [{ label: "Indice de protection", value: p.protection }] : []),
        ...(p.certifications ? [{ label: "Certifications", value: p.certifications.join(", ") }] : []),
      ],
      electrical: [
        ...(p.power ? [{ label: "Puissance", value: p.power }] : []),
        ...(p.capacity ? [{ label: "Capacité", value: p.capacity }] : []),
        ...(p.efficiency ? [{ label: "Rendement max", value: p.efficiency }] : []),
        ...(p.phases ? [{ label: "Nombre de phases", value: String(p.phases) }] : []),
        ...(p.mppt ? [{ label: "Nombre de MPPT", value: String(p.mppt) }] : []),
        ...(p.chemistry ? [{ label: "Chimie", value: p.chemistry }] : []),
        ...(p.dod ? [{ label: "Profondeur de décharge", value: p.dod }] : []),
        ...(p.cycles ? [{ label: "Cycles", value: p.cycles }] : []),
      ],
      mechanical: [
        ...(p.weight ? [{ label: "Poids (kg)", value: String(p.weight) }] : []),
      ],
      dimensions: [
        ...(p.weight ? [{ label: "Poids (kg)", value: String(p.weight) }] : []),
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

/* ── Mock product data (fallback for demo IDs) ── */
const MOCK_PRODUCTS = {
  "PAN001": {
    id: "PAN001", name: "Jinko Tiger Neo N-type 575W", brand: "Jinko Solar", brandColor: "#1a8c37",
    category: "panels", categoryLabel: "Panneaux solaires", subtitle: "Monocrystalline N-Type",
    description: "The Tiger Neo series leverages Jinko's latest N-type TOPCon cell technology, delivering industry-leading efficiency up to 22.27%.",
    datasheet: "jinko-tiger-neo-575w-datasheet.pdf",
    specs: {
      general: [{ label: "Nom de la série", value: "Tiger Neo N-type 72HL4" },{ label: "Gamme de puissance (Wp)", value: "555-580" },{ label: "Nom du modèle", value: "JKM575N-72HL4-V" },{ label: "Années de garantie", value: "15" }],
      electrical: [{ label: "Puissance du module", value: "575 W" },{ label: "Tension Vmpp (V)", value: "42.57" },{ label: "Efficacité (%)", value: "22.27" }],
      mechanical: [{ label: "Type de cellule", value: "N-Type TOPCon" },{ label: "Nombre de cellules", value: "144 (6x24)" }],
      dimensions: [{ label: "Hauteur (mm)", value: "2278" },{ label: "Largeur (mm)", value: "1134" },{ label: "Poids (kg)", value: "28.4" }],
    },
    offers: [
      { sellerId: "S03", sellerName: "EnerSol ES", country: "ES", flag: "🇪🇸", rating: 4.5, reviews: 56, stock: 3000, price: 95, availableDate: null, badge: null, bankTransfer: true, delivery: "seller" },
      { sellerId: "S01", sellerName: "SolarTech DE", country: "DE", flag: "🇩🇪", rating: 4.9, reviews: 132, stock: 5000, price: 98, availableDate: null, badge: "trusted", bankTransfer: true, delivery: "suntrex" },
    ],
  },
  "INV002": {
    id: "INV002", name: "Huawei SUN2000-5KTL-M2", brand: "Huawei", brandColor: "#e4002b",
    category: "inverters", categoryLabel: "Onduleurs", subtitle: "String Inverter — Monophasé",
    description: "L'onduleur string résidentiel de Huawei avec rendement maximal de 98.4%, compatible avec l'optimiseur SUN2000-450W-P2 et la batterie LUNA2000.",
    datasheet: "huawei-sun2000-5ktl-m2-datasheet.pdf",
    specs: {
      general: [{ label: "Nom de la série", value: "SUN2000-2/3/3.68/4/4.6/5/6KTL-M2" },{ label: "Nom du modèle", value: "SUN2000-5KTL-M2" },{ label: "Années de garantie", value: "10 (extensible à 20)" }],
      electrical: [{ label: "Puissance nominale AC", value: "5000 W" },{ label: "Puissance max DC", value: "7500 W" },{ label: "Rendement max", value: "98.4%" },{ label: "Nombre de MPPT", value: "2" }],
      mechanical: [{ label: "Type de refroidissement", value: "Convection naturelle" },{ label: "Indice de protection", value: "IP65" }],
      dimensions: [{ label: "Hauteur (mm)", value: "365" },{ label: "Largeur (mm)", value: "295" },{ label: "Poids (kg)", value: "10.5" }],
    },
    offers: [
      { sellerId: "S01", sellerName: "SolarTech DE", country: "DE", flag: "🇩🇪", rating: 4.9, reviews: 132, stock: 380, price: 689, availableDate: null, badge: "trusted", bankTransfer: true, delivery: "suntrex" },
      { sellerId: "S03", sellerName: "EnerSol ES", country: "ES", flag: "🇪🇸", rating: 4.5, reviews: 56, stock: 200, price: 710, availableDate: null, badge: null, bankTransfer: true, delivery: "seller" },
    ],
  },
};

/* ── Styles ── */
const S = {
  page: { maxWidth: 960, margin: "0 auto", padding: "20px 24px 60px", fontFamily: "'DM Sans',sans-serif" },
  breadcrumb: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#888", marginBottom: 24, flexWrap: "wrap" },
  breadcrumbLink: { color: "#555", textDecoration: "none", cursor: "pointer" },
  breadcrumbCurrent: { color: "#333", fontWeight: 500 },
  productHeader: { display: "flex", gap: 32, marginBottom: 36, border: "1px solid #e8e8e8", borderRadius: 12, padding: 28 },
  productImage: { width: 200, height: 240, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 16 },
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

function OfferCard({ offer, isLoggedIn, onLogin }) {
  return (
    <div style={S.offerCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
            Disponibilité{" "}
            <b style={{ color: "#222" }}>
              {offer.availableDate || "Immédiate"} ({offer.stock.toLocaleString()} pcs)
            </b>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: offer.stock > 0 ? "#4CAF50" : "#f44336", marginLeft: 6 }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {offer.badge === "trusted" && (
              <span style={{ ...S.badge, background: "#fff8e1", color: "#f57f17", border: "1px solid #ffe082" }}>⭐ Super vendeur</span>
            )}
            <span style={{ ...S.badge, background: "#f5f5f5", color: "#555", border: "1px solid #e0e0e0" }}>{offer.flag} {offer.country}</span>
            <span style={{ ...S.badge, background: "#f5f5f5", color: "#555", border: "1px solid #e0e0e0" }}>⭐ {offer.rating} ({offer.reviews})</span>
            {offer.bankTransfer && (
              <span style={{ ...S.badge, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" }}>🏦 VIREMENT BANCAIRE SÉCURISÉ</span>
            )}
            {offer.delivery === "suntrex" && (
              <span style={{ ...S.badge, background: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2" }}>🚚 SUNTREX Delivery</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isLoggedIn ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888" }}>dès</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#222" }}>€{offer.price.toFixed(2)} <span style={{ fontSize: 12, fontWeight: 400, color: "#888" }}>/pcs</span></div>
            </div>
          ) : (
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={S.priceBlur}>€{(offer.price * 0.9 + Math.random() * 30).toFixed(2)}</span>
              <button onClick={onLogin} style={S.priceCTA}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Inscrivez-vous pour voir les prix
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

  const realProduct = REAL_PRODUCTS.find(p => p.id === id);
  const product = realProduct ? buildProductDetail(realProduct) : (MOCK_PRODUCTS[id] || MOCK_PRODUCTS["INV002"]);
  const [sortOffers, setSortOffers] = useState("price-asc");

  const sortedOffers = [...product.offers].sort((a, b) => {
    if (sortOffers === "price-asc") return a.price - b.price;
    if (sortOffers === "price-desc") return b.price - a.price;
    if (sortOffers === "stock") return b.stock - a.stock;
    if (sortOffers === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <div style={S.page}>
      <div style={S.breadcrumb}>
        <span style={S.breadcrumbLink} onClick={()=>navigate(-1)}>Accueil</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={S.breadcrumbLink} onClick={()=>navigate(-1)}>{product.categoryLabel}</span>
        <svg width="10" height="10" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <span style={S.breadcrumbCurrent}>{product.name}</span>
      </div>

      <div style={S.productHeader}>
        <div style={S.productImage}>
          {product.image ? (
            <img src={product.image} alt={product.name} style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
          ) : (
            <div style={{ textAlign: "center", color: "#ccc" }}>
              <svg width="48" height="48" fill="none" stroke="#ddd" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <div style={{ fontSize: 11, marginTop: 4 }}>{product.brand}</div>
            </div>
          )}
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

      <Section title="Description">
        <div style={{ background: "#fafafa", borderRadius: 10, padding: "20px 24px", fontSize: 14, lineHeight: 1.7, color: "#444" }}>{product.description}</div>
      </Section>

      <Section title="Téléchargements">
        <div style={S.downloadRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            </div>
            <span style={{ fontSize: 13, color: "#333" }}>{product.datasheet}</span>
          </div>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
        </div>
        <div style={{ textAlign: "right", marginTop: 4 }}>
          <a href="#" style={{ fontSize: 13, color: "#4CAF50", textDecoration: "underline" }}>Télécharger tous les fichiers</a>
        </div>
      </Section>

      <Section title={`Spécifications techniques — ${product.name}`}>
        <SpecsTable specs={[...product.specs.general, ...product.specs.electrical]} />
      </Section>

      <Section title="Caractéristiques mécaniques" defaultOpen={false}>
        <SpecsTable specs={product.specs.mechanical} />
      </Section>

      <Section title={`Dimensions — ${product.name}`}>
        <SpecsTable specs={product.specs.dimensions} />
      </Section>

      <div style={S.rfpBanner}>
        <div>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>AVEZ-VOUS BESOIN DE CE PRODUIT ?</h3>
          <p style={{ color: "#a8d5ba", fontSize: 14, margin: 0 }}>Envoyez une demande de proposition aux vendeurs !</p>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {["Rapide", "Gratuit", "Sans engagement", "Réponse sous 24h"].map(t => (
              <span key={t} style={{ fontSize: 12, color: "#a8d5ba", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#4CAF50" }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
        <button style={{ background: "#fff", color: "#1a3a2a", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          Créer une demande
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#222" }}>Offres — {product.name}</h2>
        <select value={sortOffers} onChange={e => setSortOffers(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, color: "#555", fontFamily: "inherit", background: "#fff", cursor: "pointer" }}>
          <option value="price-asc">Par le prix le plus bas</option>
          <option value="price-desc">Par le prix le plus haut</option>
          <option value="stock">Par disponibilité</option>
          <option value="rating">Par meilleure note</option>
        </select>
      </div>

      {sortedOffers.map((offer, i) => (
        <OfferCard key={i} offer={offer} isLoggedIn={isLoggedIn} onLogin={onLogin} />
      ))}
    </div>
  );
}
