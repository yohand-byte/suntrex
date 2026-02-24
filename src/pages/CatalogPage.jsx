import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import REAL_PRODUCTS, { CATEGORIES as REAL_CATEGORIES } from "../products";
import ProductCard from "../components/catalog/ProductCard";
import { FilterSection, CheckFilter } from "../components/catalog/FilterSidebar";

/* ── Build catalog from real products ── */
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

const S = {
  page: { display:"flex", maxWidth:1280, margin:"0 auto", padding:"24px 20px", gap:24, fontFamily:"'DM Sans',sans-serif" },
  sidebar: { width:260, flexShrink:0 },
  main: { flex:1, minWidth:0 },
  quickTag: { display:"inline-flex", alignItems:"center", gap:4, padding:"6px 12px", borderRadius:20, border:"1px solid #d0d0d0", fontSize:12, color:"#555", cursor:"pointer", background:"#fff", transition:"all .15s" },
  quickTagActive: { background:"#E8700A", color:"#fff", borderColor:"#E8700A" },
  badge: { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500 },
};

export default function CatalogPage({ isLoggedIn, onLogin }) {
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState(urlCategory || "all");
  useEffect(() => { setActiveCategory(urlCategory || "all"); }, [urlCategory]);

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [grouped, setGrouped] = useState(true);
  const [sortBy, setSortBy] = useState("price-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState({ available: false, bankTransfer: false, suntrexDelivery: false, trusted: false });

  const toggleBrand = (b) => setSelectedBrands(prev => prev.includes(b) ? prev.filter(x=>x!==b) : [...prev, b]);
  const toggleType = (t) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);
  const toggleQuick = (key) => setQuickFilters(prev => ({...prev, [key]: !prev[key]}));

  const filtered = useMemo(() => {
    let items = [...CATALOG];
    if (activeCategory !== "all") items = items.filter(p => p.category === activeCategory);
    if (selectedBrands.length) items = items.filter(p => selectedBrands.includes(p.brand));
    if (selectedTypes.length) items = items.filter(p => selectedTypes.includes(p.type));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (quickFilters.available) items = items.filter(p => p.offers.some(o => o.stock > 0));
    if (quickFilters.bankTransfer) items = items.filter(p => p.offers.some(o => o.bankTransfer));
    if (quickFilters.suntrexDelivery) items = items.filter(p => p.offers.some(o => o.delivery === "suntrex"));
    if (quickFilters.trusted) items = items.filter(p => p.offers.some(o => o.badge === "trusted"));
    if (sortBy === "price-asc") items.sort((a,b) => Math.min(...a.offers.map(o=>o.price)) - Math.min(...b.offers.map(o=>o.price)));
    if (sortBy === "price-desc") items.sort((a,b) => Math.min(...b.offers.map(o=>o.price)) - Math.min(...a.offers.map(o=>o.price)));
    if (sortBy === "stock") items.sort((a,b) => b.offers.reduce((s,o)=>s+o.stock,0) - a.offers.reduce((s,o)=>s+o.stock,0));
    if (sortBy === "rating") items.sort((a,b) => Math.max(...b.offers.map(o=>o.rating)) - Math.max(...a.offers.map(o=>o.rating)));
    return items;
  }, [activeCategory, selectedBrands, selectedTypes, searchQuery, quickFilters, sortBy]);

  const totalOffers = filtered.reduce((sum,p) => sum + p.offers.length, 0);

  return (
    <div style={S.page}>
      <aside style={S.sidebar}>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:16,color:"#222"}}>Filtres</h2>
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

        <FilterSection title="Marque">
          <CheckFilter items={BRANDS_FILTER} selected={selectedBrands} onToggle={toggleBrand}/>
        </FilterSection>

        <FilterSection title="Type" defaultOpen={false}>
          <CheckFilter items={TYPES_FILTER} selected={selectedTypes} onToggle={toggleType}/>
        </FilterSection>

        <FilterSection title="Puissance (kW)" defaultOpen={false}>
          <div style={{fontSize:12,color:"#888",padding:"4px 0"}}>Bientôt disponible — slider de puissance</div>
        </FilterSection>

        <FilterSection title="Nombre de phases" defaultOpen={false}>
          <CheckFilter items={["1","3"]} selected={[]} onToggle={()=>{}}/>
        </FilterSection>
      </aside>

      <main style={S.main}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#222",margin:0}}>
              {CATEGORIES.find(c=>c.id===activeCategory)?.label || "Catalogue"}
            </h1>
            <span style={{fontSize:13,color:"#888"}}>{filtered.length} produits · {totalOffers} offres</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#555",cursor:"pointer"}}>
              Regroupement de produits
              <div onClick={()=>setGrouped(!grouped)} style={{width:40,height:22,borderRadius:11,background:grouped?"#4CAF50":"#ddd",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:grouped?20:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
              </div>
            </label>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
              style={{padding:"6px 12px",borderRadius:6,border:"1px solid #ddd",fontSize:13,color:"#555",fontFamily:"inherit",background:"#fff",cursor:"pointer"}}>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="stock">Stock disponible</option>
              <option value="rating">Meilleure note</option>
            </select>
          </div>
        </div>

        {(selectedBrands.length > 0 || selectedTypes.length > 0) && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
            {selectedBrands.map(b => (
              <span key={b} onClick={()=>toggleBrand(b)} style={{...S.badge,background:"#e3f2fd",color:"#1565c0",cursor:"pointer"}}>{b} ✕</span>
            ))}
            {selectedTypes.map(t => (
              <span key={t} onClick={()=>toggleType(t)} style={{...S.badge,background:"#fce4ec",color:"#c62828",cursor:"pointer"}}>{t} ✕</span>
            ))}
            <button onClick={()=>{setSelectedBrands([]);setSelectedTypes([])}} style={{background:"none",border:"none",fontSize:12,color:"#888",cursor:"pointer",textDecoration:"underline"}}>
              Effacer tout
            </button>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 0",color:"#888"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔍</div>
              <div style={{fontSize:16,fontWeight:500}}>Aucun produit trouvé</div>
              <div style={{fontSize:13,marginTop:4}}>Essayez de modifier vos filtres</div>
            </div>
          ) : (
            filtered.map(product => (
              <ProductCard key={product.id} product={product} isLoggedIn={isLoggedIn} onLogin={onLogin} grouped={grouped}/>
            ))
          )}
        </div>

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
