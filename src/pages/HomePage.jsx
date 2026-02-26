import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../CurrencyContext";
import REAL_PRODUCTS from "../products";
import CATALOG, { getProductImage } from "../data/catalog";
import BrandLogo from "../components/ui/BrandLogo";
import AutoSlides from "../components/ui/AutoSlides";
import CatCard from "../components/ui/CatCard";
import useResponsive from "../hooks/useResponsive";

// Featured products: top 10 from CSV catalog (priority brands, in stock, sorted by stock desc)
const PRIORITY_BRANDS = /HUAWEI|DEYE|HOYMILES|Enphase|PYTES/i;
const FEATURED_PRODUCTS = CATALOG
  .filter(p => PRIORITY_BRANDS.test(p.brand) && p.stock > 0 && p.price > 10)
  .sort((a, b) => b.stock - a.stock)
  .slice(0, 10)
  .map((p, i) => ({
    id: `csv-${p.sku || i}`,
    name: p.name,
    power: p.power,
    type: p.type || p.category,
    stock: p.stock,
    price: p.price,
    img: getProductImage(p),
  }));

const BRANDS = [
  { n:"Huawei", c:"#e4002b", f:"huawei" },{ n:"Jinko Solar", c:"#1a8c37", f:"jinko" },
  { n:"Trina Solar", c:"#cc0000", f:"trina" },{ n:"LONGi", c:"#008c44", f:"longi" },
  { n:"JA Solar", c:"#003da6", f:"ja-solar" },{ n:"Canadian Solar", c:"#003ca6", f:"canadian-solar" },
  { n:"SMA", c:"#cc0000", f:"sma" },{ n:"Sungrow", c:"#1a5aa6", f:"sungrow" },
  { n:"SolarEdge", c:"#e21e26", f:"solaredge" },{ n:"GoodWe", c:"#007ac1", f:"goodwe" },
  { n:"Growatt", c:"#ee7203", f:"growatt" },{ n:"Risen Energy", c:"#e60012", f:"risen" },
  { n:"BYD", c:"#c00", f:"byd" },{ n:"Deye", c:"#0068b7", f:"deye" },
  { n:"Enphase", c:"#f47920", f:"enphase" },
];

const CAT_COLORS = { inverters:"#E8700A", batteries:"#4CAF50", optimizers:"#3b82f6", "ev-chargers":"#8b5cf6", accessories:"#64748b", panels:"#eab308" };

export default function HomePage({ isVerified, isLoggedIn, onShowRegister, navigate }) {
  const { t, i18n } = useTranslation();
  const { formatMoney } = useCurrency();
  const { isMobile, isTablet } = useResponsive();

  const [bs, setBs] = useState(0);
  const [ss, setSs] = useState(0);
  const [tab, setTab] = useState("buyer");
  const [sq, setSq] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [hlIdx, setHlIdx] = useState(-1);
  const searchRef = useRef(null);
  const dropRef = useRef(null);

  const px = isMobile ? "16px" : "40px";

  /* ── Translated slide data ── */
  const BSLIDES = useMemo(() => [
    { label: t("home.buyerSlides.compareOffers.label"), desc: t("home.buyerSlides.compareOffers.desc"), m: "catalog" },
    { label: t("home.buyerSlides.negotiateDirect.label"), desc: t("home.buyerSlides.negotiateDirect.desc"), m: "chat" },
    { label: t("home.buyerSlides.securePayment.label"), desc: t("home.buyerSlides.securePayment.desc"), m: "payment" },
    { label: t("home.buyerSlides.tracking.label"), desc: t("home.buyerSlides.tracking.desc"), m: "delivery" },
  ], [t]);

  const SSLIDES = useMemo(() => [
    { label: t("home.sellerSlides.newMarkets.label"), desc: t("home.sellerSlides.newMarkets.desc"), m: "europe" },
    { label: t("home.sellerSlides.createOffers.label"), desc: t("home.sellerSlides.createOffers.desc"), m: "createoffer" },
    { label: t("home.sellerSlides.realTimeStock.label"), desc: t("home.sellerSlides.realTimeStock.desc"), m: "stockmgmt" },
    { label: t("home.sellerSlides.dashboard.label"), desc: t("home.sellerSlides.dashboard.desc"), m: "dashboard" },
  ], [t]);

  /* ── Category labels for search results ── */
  const CAT_LABELS = useMemo(() => ({
    inverters: t("home.catLabels.inverters"),
    batteries: t("home.catLabels.batteries"),
    optimizers: t("home.catLabels.optimizers"),
    "ev-chargers": t("home.catLabels.evChargers"),
    accessories: t("home.catLabels.accessories"),
    panels: t("home.catLabels.panels"),
  }), [t]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fuzzy search across products
  const searchResults = useMemo(() => {
    const q = sq.trim().toLowerCase();
    if (q.length < 2) return [];
    const terms = q.split(/\s+/);
    return REAL_PRODUCTS
      .map(p => {
        const haystack = `${p.name} ${p.sku} ${p.brand} ${p.type || ""} ${p.category} ${p.power || ""} ${p.capacity || ""}`.toLowerCase();
        let score = 0;
        for (const term of terms) {
          if (haystack.includes(term)) score++;
          if (p.name.toLowerCase().includes(term)) score += 2;
          if (p.sku.toLowerCase().includes(term)) score += 3;
        }
        return { ...p, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [sq]);

  const goSearch = () => {
    if (sq.trim()) { navigate(`/catalog?q=${encodeURIComponent(sq.trim())}`); setShowDrop(false); }
  };

  const handleSearchKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHlIdx(i => Math.min(i + 1, searchResults.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHlIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (hlIdx >= 0 && searchResults[hlIdx]) { navigate(`/product/${searchResults[hlIdx].id}`); setShowDrop(false); setSq(""); }
      else goSearch();
    }
    else if (e.key === "Escape") setShowDrop(false);
  };

  const productGridCols = isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)";

  return (
    <>
      {/* HERO */}
      <section style={{position:"relative",height:isMobile?320:480,background:"#0a1628"}}>
        <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
          <video autoPlay muted loop playsInline poster="/hero-solar.jpg" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.35)",zIndex:1}}><source src="/hero-video.mp4" type="video/mp4"/></video>
          <div style={{position:"absolute",inset:0,backgroundImage:"url('/hero-solar.jpg')",backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.35)",zIndex:0}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,22,40,0.3) 0%,rgba(10,22,40,0.7) 100%)",zIndex:2}}/>
        </div>
        <div style={{position:"relative",zIndex:10,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:isMobile?"0 16px":"0 24px"}}>
          <h1 style={{fontSize:isMobile?22:38,fontWeight:600,color:"#fff",lineHeight:1.3,maxWidth:640,marginBottom:isMobile?10:14}}>{t("home.hero.title")}</h1>
          <p style={{fontSize:isMobile?13:15,color:"rgba(255,255,255,0.75)",marginBottom:isMobile?20:32}}>{t("home.hero.subtitle")}</p>
          <div ref={searchRef} style={{width:"100%",maxWidth:540,position:"relative"}}>
            <input
              value={sq}
              onChange={e=>{setSq(e.target.value);setShowDrop(true);setHlIdx(-1)}}
              onFocus={()=>{if(sq.trim().length>=2)setShowDrop(true)}}
              onKeyDown={handleSearchKey}
              placeholder={t("home.hero.searchPlaceholder")}
              style={{width:"100%",height:isMobile?44:50,borderRadius:showDrop&&searchResults.length>0?"8px 8px 0 0":8,border:"none",padding:"0 56px 0 18px",fontSize:isMobile?14:15,background:"#fff",boxShadow:"0 4px 24px rgba(0,0,0,0.2)",outline:"none",fontFamily:"'DM Sans',sans-serif"}}
            />
            <button onClick={goSearch} style={{position:"absolute",right:5,top:5,bottom:showDrop&&searchResults.length>0?"auto":5,height:isMobile?34:40,width:isMobile?38:44,borderRadius:6,border:"none",background:"#E8700A",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            {/* Autocomplete dropdown */}
            {showDrop && searchResults.length > 0 && (
              <div ref={dropRef} style={{position:"absolute",top:isMobile?44:50,left:0,right:0,background:"#fff",borderRadius:"0 0 10px 10px",boxShadow:"0 12px 40px rgba(0,0,0,0.25)",zIndex:50,overflow:"hidden",maxHeight:420,overflowY:"auto"}}>
                {searchResults.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={()=>{navigate(`/product/${p.id}`);setShowDrop(false);setSq("")}}
                    onMouseEnter={()=>setHlIdx(i)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",cursor:"pointer",background:hlIdx===i?"#f8f8f8":"#fff",borderTop:i>0?"1px solid #f0f0f0":"none",transition:"background .1s"}}
                  >
                    <div style={{width:48,height:48,borderRadius:6,background:"#fff",border:"1px solid #f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",padding:4}}>
                      {p.image ? <img src={p.image} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",mixBlendMode:"multiply"}}/> : <span style={{fontSize:9,color:"#bbb"}}>{p.brand}</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"#222",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                        <span style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:CAT_COLORS[p.category]||"#888",color:"#fff",fontWeight:600}}>{CAT_LABELS[p.category]||p.category}</span>
                        <span style={{fontSize:11,color:"#888"}}>{p.sku}</span>
                        {p.stock > 0 && <span style={{fontSize:10,color:"#4CAF50",fontWeight:500}}>● {p.stock} {t("common.pcs")}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {isVerified ? (
                        <div style={{fontSize:15,fontWeight:700,color:"#E8700A"}}>{formatMoney(p.price, i18n.language)}</div>
                      ) : (
                        <div style={{fontSize:11,color:"#bbb",fontStyle:"italic"}}>{t("home.hero.loginToSee")}</div>
                      )}
                    </div>
                  </div>
                ))}
                <div
                  onClick={goSearch}
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 16px",borderTop:"1px solid #e8e8e8",cursor:"pointer",background:hlIdx===searchResults.length?"#f8f8f8":"#fafafa",fontSize:13,color:"#E8700A",fontWeight:600}}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  {t("home.hero.viewAllResults")} "{sq}"
                </div>
              </div>
            )}
            {showDrop && sq.trim().length >= 2 && searchResults.length === 0 && (
              <div style={{position:"absolute",top:isMobile?44:50,left:0,right:0,background:"#fff",borderRadius:"0 0 10px 10px",boxShadow:"0 12px 40px rgba(0,0,0,0.25)",zIndex:50,padding:"20px 16px",textAlign:"center"}}>
                <div style={{fontSize:13,color:"#888"}}>{t("home.hero.noResults")} "<b>{sq}</b>"</div>
                <div style={{fontSize:11,color:"#aaa",marginTop:4}}>{t("home.hero.noResultsHint")}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BRANDS MARQUEE */}
      <section style={{padding:"16px 0",borderBottom:"1px solid #e4e5ec",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:isMobile?40:100,background:"linear-gradient(to right,#fff,transparent)",zIndex:2}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:isMobile?40:100,background:"linear-gradient(to left,#fff,transparent)",zIndex:2}}/>
        <div className="marquee" style={{display:"flex",alignItems:"center",gap:isMobile?24:32,alignItems:"center",width:"max-content"}}>
          {[...BRANDS,...BRANDS].map((b,i)=>(
            <BrandLogo key={i} brand={b}/>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section style={{padding:isMobile?"32px 16px":"48px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:isMobile?16:24}}>
          <div><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:isMobile?20:26,fontWeight:700}}>{t("home.products.title")}</h2><p style={{fontSize:13,color:"#7b7b7b",marginTop:4}}>{CATALOG.length} {t("home.products.available", "produits disponibles")}</p></div>
          <Link to="/catalog" style={{fontSize:13,color:"#7b7b7b",textDecoration:"underline"}}>{t("home.products.viewAll")}</Link>
        </div>
        <div style={{display:"grid",gridTemplateColumns:productGridCols,gap:isMobile?10:16}}>
          {FEATURED_PRODUCTS.map(p=>(
            <div key={p.id} className="hl" onClick={()=>navigate(`/product/${p.id}`)} style={{borderRadius:10,border:"1px solid #e4e5ec",background:"#fff",overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"8px 12px 0"}}><span style={{fontSize:11,color:"#4CAF50",fontWeight:500}}>{"● "+p.stock.toLocaleString()+" "+t("common.pcs")}</span></div>
              <div style={{height:isMobile?110:150,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",padding:isMobile?12:20}}>
                <img src={p.img} alt={p.name} style={{maxHeight:isMobile?90:130,maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.target.onerror=null;e.target.style.opacity="0.3"}}/>
              </div>
              <div style={{padding:isMobile?"8px 10px 12px":"10px 12px 14px",flex:1,display:"flex",flexDirection:"column"}}>
                <h3 style={{fontSize:isMobile?12:13,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{p.name}</h3>
                <div style={{display:"flex",gap:isMobile?8:16,fontSize:11,color:"#7b7b7b",marginBottom:10}}>
                  <span>{t("home.products.power")}<br/><b style={{color:"#262627"}}>{p.power}</b></span>
                  {!isMobile && <span>{t("home.products.type")}<br/><b style={{color:"#262627"}}>{p.type}</b></span>}
                </div>
                <div style={{marginTop:"auto"}}>
                {isVerified?(
                  <div><div style={{fontSize:11,color:"#7b7b7b"}}>{t("home.products.from")}</div><div style={{fontSize:isMobile?15:18,fontWeight:700,color:"#E8700A"}}>{formatMoney(p.price, i18n.language)}<span style={{fontSize:11,fontWeight:400,color:"#7b7b7b"}}> {t("home.products.perPiece")}</span></div></div>
                ):(
                  <div onClick={(e)=>{e.stopPropagation();onShowRegister()}} style={{position:"relative",cursor:"pointer",borderRadius:6,overflow:"hidden"}}>
                    <div style={{fontSize:isMobile?15:18,fontWeight:700,color:"#E8700A",filter:"blur(6px)",userSelect:"none",pointerEvents:"none",padding:"4px 0"}}>{formatMoney((p.price||999)*0.97, i18n.language)}<span style={{fontSize:11,fontWeight:400,color:"#7b7b7b"}}> {t("home.products.perPiece")}</span></div>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.55)",backdropFilter:"blur(2px)"}}>
                      <span style={{fontSize:isMobile?10:11,fontWeight:600,color:"#E8700A",background:"rgba(232,112,10,0.1)",padding:"4px 12px",borderRadius:4,border:"1px solid rgba(232,112,10,0.2)"}}>{isLoggedIn?t("home.products.verificationPending"):t("home.products.seePrice")}</span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{padding:isMobile?`0 16px 40px`:`0 ${px} 56px`}}>
        <div style={{marginBottom:isMobile?16:24}}><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:isMobile?20:26,fontWeight:700}}>{t("home.categories.title")}</h2></div>
        {isMobile ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <CatCard img="/categories/panels.jpg" title={t("home.categories.solarPanels")} sub={t("home.categories.panelsSub")} count={t("home.categories.panelsOffers")} onClick={()=>navigate("/catalog/panels")} buttonLabel={t("home.categories.explore")} mobileHeight={180}/>
            <CatCard img="/categories/category-onduleurs.png" title={t("home.categories.inverters")} sub={t("home.categories.invertersSub")} count={t("home.categories.invertersOffers")} montage bg="linear-gradient(135deg,#1a2332 0%,#2d3f52 100%)" onClick={()=>navigate("/catalog/inverters")} buttonLabel={t("home.categories.explore")} mobileHeight={160}/>
            <CatCard img="/categories/category-batteries.png" title={t("home.categories.energyStorage")} count={t("home.categories.storageOffers")} small montage bg="linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)" onClick={()=>navigate("/catalog/batteries")} buttonLabel={t("home.categories.explore")} mobileHeight={140}/>
            <CatCard img="/categories/category-accessoires.png" title={t("home.categories.cablesAccessories")} count={t("home.categories.accessoriesOffers")} small montage bg="linear-gradient(135deg,#2d2d2d 0%,#434343 100%)" onClick={()=>navigate("/catalog/accessories")} buttonLabel={t("home.categories.explore")} mobileHeight={140}/>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"220px 180px",gap:12}}>
            <CatCard img="/categories/panels.jpg" title={t("home.categories.solarPanels")} sub={t("home.categories.panelsSub")} count={t("home.categories.panelsOffers")} big onClick={()=>navigate("/catalog/panels")} buttonLabel={t("home.categories.explore")}/>
            <CatCard img="/categories/category-onduleurs.png" title={t("home.categories.inverters")} sub={t("home.categories.invertersSub")} count={t("home.categories.invertersOffers")} montage bg="linear-gradient(135deg,#1a2332 0%,#2d3f52 100%)" onClick={()=>navigate("/catalog/inverters")} buttonLabel={t("home.categories.explore")}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <CatCard img="/categories/category-batteries.png" title={t("home.categories.energyStorage")} count={t("home.categories.storageOffers")} small montage bg="linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)" onClick={()=>navigate("/catalog/batteries")} buttonLabel={t("home.categories.explore")}/>
              <CatCard img="/categories/category-accessoires.png" title={t("home.categories.cablesAccessories")} count={t("home.categories.accessoriesOffers")} small montage bg="linear-gradient(135deg,#2d2d2d 0%,#434343 100%)" onClick={()=>navigate("/catalog/accessories")} buttonLabel={t("home.categories.explore")}/>
            </div>
          </div>
        )}
      </section>

      {/* WHY SUNTREX */}
      <section style={{background:"#fafafa",padding:isMobile?"40px 16px":"64px 40px",borderTop:"1px solid #e4e5ec"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:isMobile?24:32,fontWeight:700,marginBottom:4}}>{t("home.whySuntrex.title")}</h2>
          <p style={{fontSize:isMobile?13:15,color:"#7b7b7b",marginBottom:isMobile?20:28}}>{t("home.whySuntrex.subtitle")}</p>
          <div style={{display:"flex",gap:8,marginBottom:isMobile?24:36}}>
            {[["buyer",t("home.whySuntrex.forBuyer")],["seller",t("home.whySuntrex.forSeller")]].map(([k,l])=>(
              <button key={k} onClick={()=>{setTab(k);k==="buyer"?setBs(0):setSs(0)}} style={{padding:isMobile?"8px 20px":"10px 28px",fontSize:isMobile?13:14,fontWeight:600,cursor:"pointer",border:"none",borderRadius:24,background:tab===k?"#4CAF50":"#fff",color:tab===k?"#fff":"#7b7b7b",fontFamily:"inherit",boxShadow:tab===k?"0 2px 8px rgba(76,175,80,0.3)":"0 1px 3px rgba(0,0,0,0.06)",transition:"all .2s"}}>{l}</button>
            ))}
          </div>
          <AutoSlides slides={tab==="buyer"?BSLIDES:SSLIDES} cur={tab==="buyer"?bs:ss} set={tab==="buyer"?setBs:setSs} key={tab} isMobile={isMobile}/>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:isMobile?"32px 16px":"44px 40px",borderTop:"1px solid #e4e5ec",borderBottom:"1px solid #e4e5ec"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?16:20,maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
          {[["6 700+",t("home.stats.activeOffers")],["25+",t("home.stats.countriesCovered")],["500+",t("home.stats.verifiedSellers")],["2%",t("home.stats.platformFee")]].map(([n,l],i)=>(
            <div key={i}><div style={{fontSize:isMobile?24:32,fontWeight:700,color:"#E8700A"}}>{n}</div><div style={{fontSize:isMobile?12:13,color:"#7b7b7b",marginTop:4}}>{l}</div></div>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section style={{padding:isMobile?"40px 16px":"56px 40px"}}>
        <div style={{textAlign:"center",marginBottom:isMobile?24:36}}><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,margin:"0 auto 12px"}}/><h2 style={{fontSize:isMobile?20:26,fontWeight:700}}>{t("home.differentiators.title")}</h2></div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?12:20,maxWidth:1080,margin:"0 auto"}}>
          {[
            {icon:<svg width={isMobile?32:44} height={isMobile?32:44} viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="28" rx="4" stroke="#4CAF50" strokeWidth="2.5"/><path d="M6 18h36" stroke="#4CAF50" strokeWidth="2.5"/><circle cx="24" cy="32" r="5" stroke="#4CAF50" strokeWidth="2"/><path d="M22 32l2 2 4-4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:t("home.differentiators.securePayment.title"),d:t("home.differentiators.securePayment.desc")},
            {icon:<svg width={isMobile?32:44} height={isMobile?32:44} viewBox="0 0 48 48" fill="none"><rect x="4" y="20" width="24" height="16" rx="2" stroke="#E8700A" strokeWidth="2.5"/><path d="M28 24h8l6 6v6H28" stroke="#E8700A" strokeWidth="2.5" strokeLinejoin="round"/><circle cx="12" cy="38" r="4" stroke="#E8700A" strokeWidth="2.5"/><circle cx="36" cy="38" r="4" stroke="#E8700A" strokeWidth="2.5"/></svg>,t:t("home.differentiators.delivery.title"),d:t("home.differentiators.delivery.desc")},
            {icon:<svg width={isMobile?32:44} height={isMobile?32:44} viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" stroke="#4CAF50" strokeWidth="2.5"/><path d="M18 24l4 4 8-8" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:t("home.differentiators.lowFees.title"),d:t("home.differentiators.lowFees.desc")},
            {icon:<svg width={isMobile?32:44} height={isMobile?32:44} viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="4" stroke="#3b82f6" strokeWidth="2.5"/><path d="M16 16h16M16 24h10M16 32h6" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/><circle cx="36" cy="36" r="8" fill="#fff" stroke="#3b82f6" strokeWidth="2.5"/><path d="M33 36l2 2 4-4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:t("home.differentiators.aiTools.title"),d:t("home.differentiators.aiTools.desc")},
          ].map((item,i)=>(
            <div key={i} className="hl" style={{textAlign:"center",padding:isMobile?16:28,borderRadius:12,border:"1px solid #e4e5ec",background:"#fff"}}>
              <div style={{marginBottom:isMobile?10:16,display:"flex",justifyContent:"center"}}>{item.icon}</div>
              <h3 style={{fontSize:isMobile?13:15,fontWeight:600,marginBottom:isMobile?4:8}}>{item.t}</h3>
              {!isMobile && <p style={{fontSize:13,color:"#7b7b7b",lineHeight:1.55}}>{item.d}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:isMobile?"40px 16px":"56px 40px",textAlign:"center",background:"#1a1a1a",color:"#fff"}}>
        <h2 style={{fontSize:isMobile?20:26,fontWeight:700,marginBottom:8}}>{t("home.cta.title")}</h2>
        <p style={{fontSize:isMobile?13:15,color:"rgba(255,255,255,0.6)",marginBottom:isMobile?20:28}}>{t("home.cta.subtitle")}</p>
        <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:12,justifyContent:"center",alignItems:"center"}}>
          <button onClick={onShowRegister} style={{padding:"14px 32px",borderRadius:24,border:"none",background:"#E8700A",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:isMobile?"100%":"auto"}}>{t("home.cta.createAccount")}</button>
          <button style={{padding:"14px 32px",borderRadius:24,border:"1px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit",width:isMobile?"100%":"auto"}}>{t("home.cta.startSelling")}</button>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{background:"#f8f8f8",padding:isMobile?"28px 16px":"36px 40px",borderTop:"1px solid #e4e5ec",textAlign:"center"}}>
        <h3 style={{fontSize:isMobile?16:18,fontWeight:600,marginBottom:16}}>{t("home.newsletter.title")}</h3>
        <div style={{display:"flex",flexDirection:isMobile?"column":"row",gap:8,justifyContent:"center",maxWidth:440,margin:"0 auto"}}><input placeholder={t("home.newsletter.placeholder")} style={{flex:1,height:40,borderRadius:20,border:"1px solid #d3d4db",padding:"0 16px",fontSize:13,outline:"none"}}/><button style={{padding:"0 24px",height:40,borderRadius:20,border:"none",background:"#141413",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{t("home.newsletter.subscribe")}</button></div>
      </section>
    </>
  );
}
