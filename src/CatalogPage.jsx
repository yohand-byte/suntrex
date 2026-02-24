import { useState, useMemo } from "react";
import REAL_PRODUCTS, { CATEGORIES as REAL_CATEGORIES } from "./products";

/* ═══════════════════════════════════════════════════════════
   SUNTREX — Catalog Page
   Real Huawei catalog — 31 products with actual prices
   ═══════════════════════════════════════════════════════════ */

/* ── Build catalog from real products ──────────────────── */
const CATALOG = REAL_PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  power: p.powerKw || (p.capacityKwh ? p.capacityKwh : 0),
  type: p.type,
  phases: p.phases || 0,
  mppt: p.mppt || 0,
  sku: p.sku,
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
      badge: "trusted",
      bankTransfer: true,
      delivery: "suntrex",
    },
  ],
}));

const CATEGORIES = [
  { id:"all", label:"Tous les produits", count: CATALOG.length },
  { id:"inverters", label:"Onduleurs", count: CATALOG.filter(p=>p.category==="inverters").length },
  { id:"batteries", label:"Batteries / Stockage", count: CATALOG.filter(p=>p.category==="batteries").length },
  { id:"optimizers", label:"Optimiseurs", count: CATALOG.filter(p=>p.category==="optimizers").length },
  { id:"ev-chargers", label:"Bornes de recharge", count: CATALOG.filter(p=>p.category==="ev-chargers").length },
  { id:"accessories", label:"Accessoires", count: CATALOG.filter(p=>p.category==="accessories").length },
];

const BRANDS_FILTER = ["Huawei"];
const TYPES_FILTER = ["String","Hybrid","Microinverter","LFP","Monocrystalline","Optimizer"];

/* ── Styles ────────────────────────────────────────── */
const S = {
  page: { display:"flex", maxWidth:1280, margin:"0 auto", padding:"24px 20px", gap:24, fontFamily:"'DM Sans',sans-serif" },
  sidebar: { width:260, flexShrink:0 },
  main: { flex:1, minWidth:0 },
  filterSection: { borderBottom:"1px solid #e8e8e8", paddingBottom:14, marginBottom:14 },
  filterTitle: { fontSize:13, fontWeight:600, color:"#333", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" },
  quickTag: { display:"inline-flex", alignItems:"center", gap:4, padding:"6px 12px", borderRadius:20, border:"1px solid #d0d0d0", fontSize:12, color:"#555", cursor:"pointer", background:"#fff", transition:"all .15s" },
  quickTagActive: { background:"#E8700A", color:"#fff", borderColor:"#E8700A" },
  productCard: { background:"#fff", border:"1px solid #e4e5ec", borderRadius:10, overflow:"hidden", transition:"box-shadow .2s" },
  offerRow: { display:"flex", alignItems:"center", padding:"14px 20px", gap:16, borderTop:"1px solid #f0f0f0", fontSize:13 },
  badge: { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500 },
  greenBtn: { background:"#4CAF50", color:"#fff", border:"none", borderRadius:6, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" },
  priceBlur: { filter:"blur(6px)", userSelect:"none", pointerEvents:"none" },
  checkbox: { width:16, height:16, borderRadius:3, border:"1.5px solid #ccc", cursor:"pointer", accentColor:"#E8700A" },
};

/* ── Chevron icon ─────────────────────────────────── */
const Chev = ({open}) => (
  <svg width="12" height="12" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}} fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
);

/* ── Filter Section (collapsible) ─────────────────── */
function FilterSection({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.filterSection}>
      <div style={S.filterTitle} onClick={()=>setOpen(!open)}>{title} <Chev open={open}/></div>
      {open && <div style={{paddingTop:8}}>{children}</div>}
    </div>
  );
}

/* ── Checkbox filter ──────────────────────────────── */
function CheckFilter({ items, selected, onToggle }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {items.map(item => (
        <label key={item} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#444",cursor:"pointer"}}>
          <input type="checkbox" checked={selected.includes(item)} onChange={()=>onToggle(item)} style={S.checkbox}/>
          {item}
        </label>
      ))}
    </div>
  );
}

/* ── Price Gate (blur + CTA) ──────────────────────── */
function PriceGate({ price, isLoggedIn, onLogin }) {
  if (isLoggedIn) return <span style={{fontSize:16,fontWeight:700,color:"#222"}}>€{price.toFixed(2)} <span style={{fontSize:11,fontWeight:400,color:"#888"}}>/pcs</span></span>;
  return (
    <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:8}}>
      <span style={{...S.priceBlur,fontSize:16,fontWeight:700}}>€{(price * 0.93 + Math.random()*50).toFixed(2)}</span>
      <button onClick={onLogin} style={{background:"#E8700A",color:"#fff",border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
        Voir le prix
      </button>
    </div>
  );
}

/* ── Seller Badge ─────────────────────────────────── */
function SellerBadge({ offer }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
      <span style={{fontSize:12}}>{offer.flag}</span>
      <span style={{...S.badge,background:"#f0f7f0",color:"#2e7d32"}}>⭐ {offer.rating} ({offer.reviews})</span>
      {offer.badge==="trusted" && <span style={{...S.badge,background:"#e8f5e9",color:"#1b5e20"}}>✓ Vendeur de confiance</span>}
      {offer.bankTransfer && <span style={{...S.badge,background:"#e3f2fd",color:"#1565c0"}}>🏦 Virement sécurisé</span>}
      {offer.delivery==="suntrex" && <span style={{...S.badge,background:"#fff3e0",color:"#e65100"}}>🚚 SUNTREX Delivery</span>}
    </div>
  );
}

/* ── Product Card ─────────────────────────────────── */
function ProductCard({ product, isLoggedIn, onLogin, grouped, onProductClick }) {
  const [expanded, setExpanded] = useState(false);
  const bestOffer = product.offers.reduce((a,b) => a.price < b.price ? a : b);
  const totalStock = product.offers.reduce((sum,o) => sum + o.stock, 0);
  const offerCount = product.offers.length;

  return (
    <div style={S.productCard}>
      {/* Main product row */}
      <div style={{display:"flex",alignItems:"center",padding:"16px 20px",gap:20}}>
        {/* Badges row (seller info for best offer) */}
        <div style={{display:"flex",flexDirection:"column",gap:6,width:100,flexShrink:0,alignItems:"center"}}>
          <div style={{width:80,height:80,background:"#f8f8f8",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#aaa",textAlign:"center",padding:4}}>
            {product.brand}
          </div>
          {offerCount > 1 && grouped && (
            <span style={{fontSize:11,color:"#888"}}>{offerCount} offres</span>
          )}
        </div>

        {/* Product info */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:6}}>
            <span style={{fontSize:11,color:"#888",background:"#f5f5f5",padding:"2px 8px",borderRadius:4}}>OFF {product.id}</span>
            <SellerBadge offer={bestOffer}/>
          </div>
          <h3 onClick={()=>onProductClick&&onProductClick(product.id)} style={{fontSize:15,fontWeight:600,color:"#222",margin:"4px 0",cursor:"pointer"}}>{product.name}</h3>
          <div style={{display:"flex",gap:20,fontSize:12,color:"#888",marginTop:4}}>
            <span>Puissance <b style={{color:"#333"}}>{product.power >= 1 ? product.power+" kW" : (product.power*1000)+" W"}</b></span>
            <span>Type <b style={{color:"#333"}}>{product.type}</b></span>
            {product.phases > 0 && <span>Phases <b style={{color:"#333"}}>{product.phases}</b></span>}
            {product.mppt > 0 && <span>MPPT <b style={{color:"#333"}}>{product.mppt}</b></span>}
          </div>
        </div>

        {/* Price & stock */}
        <div style={{textAlign:"right",flexShrink:0,minWidth:140}}>
          <div style={{fontSize:12,color:"#4CAF50",fontWeight:500,marginBottom:4}}>
            <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#4CAF50",marginRight:4}}/>
            {totalStock.toLocaleString()} pcs
          </div>
          <div style={{marginBottom:8}}>
            {isLoggedIn ? (
              <span style={{fontSize:11,color:"#888"}}>dès </span>
            ) : null}
            <PriceGate price={bestOffer.price} isLoggedIn={isLoggedIn} onLogin={onLogin}/>
          </div>
          <button style={S.greenBtn} onClick={()=>onProductClick&&onProductClick(product.id)}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12H3m9-9l9 9-9 9"/></svg>
            Détails de l'offre
          </button>
        </div>
      </div>

      {/* Multi-vendor expand (like sun.store "Voir les offres (X)") */}
      {grouped && offerCount > 1 && (
        <>
          <div
            onClick={()=>setExpanded(!expanded)}
            style={{background:expanded?"#f0f7f0":"#e8f5e9",padding:"8px 20px",cursor:"pointer",display:"flex",justifyContent:"center",alignItems:"center",gap:6,fontSize:13,color:"#2e7d32",fontWeight:500,transition:"background .15s"}}
          >
            {expanded ? "Masquer" : "Voir"} les offres ({offerCount})
            <Chev open={expanded}/>
          </div>
          {expanded && product.offers.map((offer,i) => (
            <div key={i} style={S.offerRow}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:14}}>{offer.flag}</span>
                  <span style={{fontWeight:500,color:"#333"}}>{offer.sellerName}</span>
                  <SellerBadge offer={offer}/>
                </div>
              </div>
              <div style={{textAlign:"right",display:"flex",alignItems:"center",gap:16}}>
                <div>
                  <div style={{fontSize:12,color:"#4CAF50"}}>
                    <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:"#4CAF50",marginRight:3}}/>
                    {offer.stock.toLocaleString()} pcs
                  </div>
                  <PriceGate price={offer.price} isLoggedIn={isLoggedIn} onLogin={onLogin}/>
                </div>
                <button style={{...S.greenBtn,padding:"6px 12px",fontSize:12}}>
                  Détails de l'offre
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN CATALOG COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function CatalogPage({ isLoggedIn, onLogin, category: initCategory, onProductClick }) {
  // Filters state
  const [activeCategory, setActiveCategory] = useState(initCategory || "all");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [grouped, setGrouped] = useState(true);
  const [sortBy, setSortBy] = useState("price-asc");
  const [searchQuery, setSearchQuery] = useState("");
  // Quick tags
  const [quickFilters, setQuickFilters] = useState({ available: false, bankTransfer: false, suntrexDelivery: false, trusted: false });

  const toggleBrand = (b) => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x=>x!==b) : [...prev, b]);
  const toggleType = (t) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  const toggleQuick = (key) => setQuickFilters(prev => ({...prev, [key]: !prev[key]}));

  // Filter & sort
  const filtered = useMemo(() => {
    let items = [...CATALOG];
    // Category
    if (activeCategory !== "all") items = items.filter(p => p.category === activeCategory);
    // Brands
    if (selectedBrands.length) items = items.filter(p => selectedBrands.includes(p.brand));
    // Types
    if (selectedTypes.length) items = items.filter(p => selectedTypes.includes(p.type));
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    // Quick filters (check offers)
    if (quickFilters.available) items = items.filter(p => p.offers.some(o => o.stock > 0));
    if (quickFilters.bankTransfer) items = items.filter(p => p.offers.some(o => o.bankTransfer));
    if (quickFilters.suntrexDelivery) items = items.filter(p => p.offers.some(o => o.delivery === "suntrex"));
    if (quickFilters.trusted) items = items.filter(p => p.offers.some(o => o.badge === "trusted"));
    // Sort
    if (sortBy === "price-asc") items.sort((a,b) => Math.min(...a.offers.map(o=>o.price)) - Math.min(...b.offers.map(o=>o.price)));
    if (sortBy === "price-desc") items.sort((a,b) => Math.min(...b.offers.map(o=>o.price)) - Math.min(...a.offers.map(o=>o.price)));
    if (sortBy === "stock") items.sort((a,b) => b.offers.reduce((s,o)=>s+o.stock,0) - a.offers.reduce((s,o)=>s+o.stock,0));
    if (sortBy === "rating") items.sort((a,b) => Math.max(...b.offers.map(o=>o.rating)) - Math.max(...a.offers.map(o=>o.rating)));

    return items;
  }, [activeCategory, selectedBrands, selectedTypes, searchQuery, quickFilters, sortBy]);

  const totalOffers = filtered.reduce((sum,p) => sum + p.offers.length, 0);

  return (
    <div style={S.page}>
      {/* ── SIDEBAR FILTERS ── */}
      <aside style={S.sidebar}>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:16,color:"#222"}}>Filtres</h2>

        {/* Quick tags */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
          {[
            { key:"available", label:"Disponible", icon:"●" },
            { key:"bankTransfer", label:"Virement sécurisé", icon:"🏦" },
            { key:"suntrexDelivery", label:"SUNTREX Delivery", icon:"🚚" },
            { key:"trusted", label:"Super vendeur", icon:"⭐" },
          ].map(({key,label,icon}) => (
            <button key={key} onClick={()=>toggleQuick(key)}
              style={{...S.quickTag, ...(quickFilters[key] ? S.quickTagActive : {})}}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <FilterSection title="Catégories">
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={()=>setActiveCategory(cat.id)}
                style={{display:"flex",justifyContent:"space-between",padding:"6px 8px",borderRadius:6,border:"none",background:activeCategory===cat.id?"#fff3e0":"transparent",color:activeCategory===cat.id?"#E8700A":"#555",fontWeight:activeCategory===cat.id?600:400,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                <span>{cat.label}</span>
                <span style={{color:"#bbb",fontSize:12}}>{cat.count}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Brands */}
        <FilterSection title="Marque">
          <CheckFilter items={BRANDS_FILTER} selected={selectedBrands} onToggle={toggleBrand}/>
        </FilterSection>

        {/* Type */}
        <FilterSection title="Type" defaultOpen={false}>
          <CheckFilter items={TYPES_FILTER} selected={selectedTypes} onToggle={toggleType}/>
        </FilterSection>

        {/* Power range - simplified */}
        <FilterSection title="Puissance (kW)" defaultOpen={false}>
          <div style={{fontSize:12,color:"#888",padding:"4px 0"}}>Bientôt disponible — slider de puissance</div>
        </FilterSection>

        {/* Phases */}
        <FilterSection title="Nombre de phases" defaultOpen={false}>
          <CheckFilter items={["1","3"]} selected={[]} onToggle={()=>{}}/>
        </FilterSection>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={S.main}>
        {/* Top bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#222",margin:0}}>
              {CATEGORIES.find(c=>c.id===activeCategory)?.label || "Catalogue"}
            </h1>
            <span style={{fontSize:13,color:"#888"}}>{filtered.length} produits · {totalOffers} offres</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {/* Product grouping toggle */}
            <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#555",cursor:"pointer"}}>
              Regroupement de produits
              <div onClick={()=>setGrouped(!grouped)} style={{width:40,height:22,borderRadius:11,background:grouped?"#4CAF50":"#ddd",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:grouped?20:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
              </div>
            </label>
            {/* Sort */}
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:"6px 12px",borderRadius:6,border:"1px solid #ddd",fontSize:13,color:"#555",fontFamily:"inherit",background:"#fff",cursor:"pointer"}}>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="stock">Stock disponible</option>
              <option value="rating">Meilleure note</option>
            </select>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedBrands.length > 0 || selectedTypes.length > 0) && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
            {selectedBrands.map(b => (
              <span key={b} onClick={()=>toggleBrand(b)} style={{...S.badge,background:"#e3f2fd",color:"#1565c0",cursor:"pointer"}}>
                {b} ✕
              </span>
            ))}
            {selectedTypes.map(t => (
              <span key={t} onClick={()=>toggleType(t)} style={{...S.badge,background:"#fce4ec",color:"#c62828",cursor:"pointer"}}>
                {t} ✕
              </span>
            ))}
            <button onClick={()=>{setSelectedBrands([]);setSelectedTypes([])}} style={{background:"none",border:"none",fontSize:12,color:"#888",cursor:"pointer",textDecoration:"underline"}}>
              Effacer tout
            </button>
          </div>
        )}

        {/* Product list */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 0",color:"#888"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔍</div>
              <div style={{fontSize:16,fontWeight:500}}>Aucun produit trouvé</div>
              <div style={{fontSize:13,marginTop:4}}>Essayez de modifier vos filtres</div>
            </div>
          ) : (
            filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isLoggedIn={isLoggedIn}
                onLogin={onLogin}
                grouped={grouped}
                onProductClick={onProductClick}
              />
            ))
          )}
        </div>

        {/* Pagination placeholder */}
        {filtered.length > 0 && (
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:24,padding:16}}>
            <span style={{fontSize:13,color:"#888"}}>Page</span>
            <button style={{width:32,height:32,borderRadius:6,border:"1px solid #E8700A",background:"#E8700A",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>1</button>
            <button style={{width:32,height:32,borderRadius:6,border:"1px solid #ddd",background:"#fff",color:"#555",fontSize:13,cursor:"pointer"}}>2</button>
            <span style={{fontSize:13,color:"#888"}}>sur 2</span>
          </div>
        )}
      </main>
    </div>
  );
}
