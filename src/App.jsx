import { useState, useEffect, useRef } from "react";
import AM from "./AnimatedMockups";
import CatalogPage from "./CatalogPage";
import ProductDetailPage from "./ProductDetailPage";
import { LoginModal, RegisterModal, UserMenu } from "./AuthSystem";

/* ═══════════════════════════════════════════════════════════════
   SUNTREX v7 — All corrections applied
   1. Logos = full brand names in colored text (no images)
   2. Product cards = pure white bg (#fff not #fafafa)
   3. Slides auto-play every 6s + auto-start on viewport
   4. Categories = proper title restored
   5. Deye = real official image (.png)
   ═══════════════════════════════════════════════════════════════ */

const PRODUCTS = [
  { id:1, name:"Huawei SUN2000-5KTL-M2", power:"5 kW", type:"String", stock:1364, price:689, img:"/products/huawei-5ktl.jpg" },
  { id:2, name:"Huawei SUN2000-10KTL-M2", power:"10 kW", type:"String", stock:1064, price:1249, img:"/products/huawei-10ktl.jpg" },
  { id:3, name:"Huawei LUNA2000-5-S0", power:"5 kWh", type:"LFP", stock:144, price:1890, img:"/products/huawei-luna.webp" },
  { id:4, name:"Deye SUN-12K-SG04LP3", power:"12 kW", type:"Hybrid", stock:800, price:1450, img:"/products/deye-12k.png" },
  { id:5, name:"Huawei SUN2000-3KTL-M2", power:"3 kW", type:"String", stock:10000, price:479, img:"/products/huawei-3ktl.jpg" },
];

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

const BSLIDES = [
  { label:"Comparez les offres", desc:"Trouvez le meilleur prix en un clic. Comparez les offres de vendeurs verifies dans toute l'Europe.", m:"catalog" },
  { label:"Negociez en direct", desc:"Chat integre avec traduction automatique pour negocier prix, quantites et conditions de livraison.", m:"chat" },
  { label:"Paiement securise Stripe", desc:"Fonds proteges en escrow jusqu'a confirmation de livraison. 3D Secure & SCA conformes.", m:"payment" },
  { label:"Suivi SUNTREX DELIVERY", desc:"Suivi temps reel avec verification photo a chaque etape. Votre colis, notre responsabilite.", m:"delivery" },
];

const SSLIDES = [
  { label:"Nouveaux marches europeens", desc:"Touchez des acheteurs professionnels dans 25+ pays depuis un seul tableau de bord.", m:"europe" },
  { label:"Creez des offres rapidement", desc:"Import Excel ou creation rapide. Definissez vos prix et stocks en quelques clics.", m:"createoffer" },
  { label:"Stock en temps reel", desc:"Alertes automatiques quand vos stocks baissent, avec suggestions IA de tarification.", m:"stockmgmt" },
  { label:"Dashboard tout-en-un", desc:"Commandes, factures, expeditions, paiements : tout centralise au meme endroit.", m:"dashboard" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [page, setPage] = useState("home"); // "home" | "catalog" | "product"
  const [catalogCategory, setCatalogCategory] = useState("all");

  // Handle Google OAuth callback on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Google auth success
    const googleAuth = params.get("google_auth");
    if (googleAuth) {
      try {
        const userData = JSON.parse(decodeURIComponent(googleAuth));
        setCurrentUser({
          email: userData.email,
          name: userData.name,
          company: "",
          role: "buyer",
          kycStatus: "pending_registration", // Still needs company info + KYC
          country: "",
          provider: "google",
          picture: userData.picture,
        });
        setIsLoggedIn(true);
        setShowRegister(true); // Open register modal at step 1 (company info)
      } catch (e) {
        console.error("Failed to parse Google auth data:", e);
      }
      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }

    // Google auth error
    const authError = params.get("auth_error");
    if (authError) {
      console.error("Google auth error:", authError);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Price visibility: ONLY when KYC is fully verified by admin
  const isVerified = isLoggedIn && currentUser?.kycStatus === "verified";
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [bs, setBs] = useState(0);
  const [ss, setSs] = useState(0);
  const [tab, setTab] = useState("buyer");

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#fff",color:"#262627",minHeight:"100vh"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet"/>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dotPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
        .fade-in{animation:fadeIn .4s ease-out forwards}
        .marquee{animation:marquee 25s linear infinite}.marquee:hover{animation-play-state:paused}
        .hl{transition:transform .2s,box-shadow .2s}.hl:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.08)}
        .ar{animation:slideUp .5s ease-out both}
        .ar:nth-child(1){animation-delay:.1s}.ar:nth-child(2){animation-delay:.3s}
        .ar:nth-child(3){animation-delay:.5s}.ar:nth-child(4){animation-delay:.7s}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:"#1a1a1a",color:"#fff",fontSize:12,padding:"6px 40px",display:"flex",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:20,opacity:.7}}>{["A propos","Blog","FAQ"].map(l=><a key={l} href="#" style={{color:"#fff",textDecoration:"none"}}>{l}</a>)}</div>
        <span style={{opacity:.7}}>+33 1 XX XX XX XX</span>
      </div>

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:40,background:"#fff",borderBottom:"1px solid #e4e5ec",padding:"0 40px",height:56,display:"flex",alignItems:"center",gap:24}}>
        <div onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:6,background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg></div>
          <span style={{fontWeight:700,fontSize:18,letterSpacing:"-0.02em"}}>suntrex</span>
        </div>
        <div style={{flex:1,maxWidth:420,position:"relative"}}>
          <input placeholder="Rechercher un produit ou fabricant..." style={{width:"100%",height:36,borderRadius:6,border:"1px solid #d3d4db",padding:"0 36px 0 12px",fontSize:13,outline:"none"}}/>
          <button style={{position:"absolute",right:1,top:1,bottom:1,width:34,borderRadius:"0 5px 5px 0",border:"none",background:"#E8700A",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginLeft:"auto"}}>
          <span style={{fontSize:13,cursor:"pointer"}}>EUR</span>
          {isLoggedIn && currentUser ? (
            <>
              <button style={{background:"none",border:"none",cursor:"pointer",color:"#7b7b7b",position:"relative"}}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              </button>
              <UserMenu user={currentUser} onLogout={()=>{setIsLoggedIn(false);setCurrentUser(null);setPage("home")}} onNavigate={(p)=>{setPage(p)}}/>
              <button style={{background:"none",border:"none",cursor:"pointer",color:"#7b7b7b"}}><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg></button>
            </>
          ) : (
            <>
              <button onClick={()=>setShowLogin(true)} style={{background:"none",border:"1px solid #ddd",borderRadius:6,padding:"6px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#555"}}>Se connecter</button>
              <button onClick={()=>setShowRegister(true)} style={{background:"#E8700A",border:"none",borderRadius:6,padding:"6px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontWeight:600}}>S'inscrire</button>
            </>
          )}
        </div>
      </header>

      {/* NAV */}
      <nav style={{borderBottom:"1px solid #e4e5ec",padding:"0 40px",height:40,display:"flex",alignItems:"center",background:"#fff"}}>
        {[
          {label:"Tous les produits",cat:"all"},
          {label:"Panneaux solaires",cat:"panels"},
          {label:"Onduleurs",cat:"inverters"},
          {label:"Stockage d'energie",cat:"batteries"},
          {label:"Optimiseurs",cat:"optimizers"},
          {label:"Electrotechnique",cat:null},
          {label:"E-mobilite",cat:null},
        ].map((item,i)=>(
          <button key={item.label} onClick={()=>{if(item.cat){setPage("catalog");setCatalogCategory(item.cat)}}} style={{display:"flex",alignItems:"center",gap:4,padding:"0 14px",height:40,border:"none",background:"none",fontSize:13,color:page==="catalog"&&catalogCategory===item.cat?"#E8700A":i===0&&page==="home"?"#4CAF50":"#7b7b7b",fontWeight:(page==="catalog"&&catalogCategory===item.cat)||(i===0&&page==="home")?600:400,cursor:item.cat?"pointer":"default",borderBottom:page==="catalog"&&catalogCategory===item.cat?"2px solid #E8700A":i===0&&page==="home"?"2px solid #4CAF50":"2px solid transparent",whiteSpace:"nowrap",fontFamily:"inherit",opacity:item.cat?1:.5}}>{item.label}{i>0&&<svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>}</button>
        ))}
        <a href="#" style={{marginLeft:"auto",fontSize:13,color:"#E8700A",textDecoration:"none",fontWeight:500}}>Vendre sur suntrex</a>
      </nav>

      {/* Verification pending banner */}
      {isLoggedIn && currentUser && currentUser.kycStatus !== "verified" && (
        <div style={{background:"#fffbeb",borderBottom:"1px solid #fde68a",padding:"10px 40px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:16}}>⏳</span>
          <div style={{fontSize:13,color:"#92400e",flex:1}}>
            <b>Vérification en cours</b> — Votre compte est en attente de validation. Les prix et commandes seront débloqués après vérification de votre dossier (sous 24h ouvrées).
          </div>
          <button onClick={()=>setPage("dashboard")} style={{background:"#E8700A",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            Voir mon statut
          </button>
        </div>
      )}

      {/* HERO */}
      {page === "product" ? (
        <ProductDetailPage
          productId={selectedProductId}
          isLoggedIn={isVerified}
          onLogin={()=>setShowRegister(true)}
          onBack={()=>{setPage("catalog");window.scrollTo(0,0)}}
        />
      ) : page === "catalog" ? (
        <CatalogPage
          isLoggedIn={isVerified}
          onLogin={()=>setShowRegister(true)}
          category={catalogCategory}
          onProductClick={(id)=>{setSelectedProductId(id);setPage("product");window.scrollTo(0,0)}}
        />
      ) : (
      <>
      {/* HOME CONTENT START */}
      <section style={{position:"relative",height:480,overflow:"hidden",background:"#0a1628"}}>
        <video autoPlay muted loop playsInline poster="/categories/panels.jpg" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:"brightness(0.4)",zIndex:1}}><source src="/hero-video.mp4" type="video/mp4"/></video>
        <div style={{position:"absolute",inset:0,backgroundImage:"url('/categories/panels.jpg')",backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.35)",zIndex:0}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,22,40,0.3) 0%,rgba(10,22,40,0.7) 100%)",zIndex:2}}/>
        <div style={{position:"relative",zIndex:3,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 24px"}}>
          <h1 style={{fontSize:38,fontWeight:600,color:"#fff",lineHeight:1.3,maxWidth:640,marginBottom:14}}>Trouvez, comparez et achetez vos equipements photovoltaiques au meilleur prix</h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.75)",marginBottom:32}}>Une plateforme, des milliers d'offres de fournisseurs verifies en Europe</p>
          <div style={{width:"100%",maxWidth:540,position:"relative"}}>
            <input placeholder="Rechercher un produit ou un fabricant..." style={{width:"100%",height:50,borderRadius:8,border:"none",padding:"0 56px 0 18px",fontSize:15,background:"#fff",boxShadow:"0 4px 24px rgba(0,0,0,0.2)",outline:"none"}}/>
            <button style={{position:"absolute",right:5,top:5,bottom:5,width:44,borderRadius:6,border:"none",background:"#E8700A",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
          </div>
        </div>
      </section>

      {/* ══ FIX 1: BRANDS = TEXT NAMES WITH BRAND COLORS ══ */}
      <section style={{padding:"16px 0",borderBottom:"1px solid #e4e5ec",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:100,background:"linear-gradient(to right,#fff,transparent)",zIndex:2}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:100,background:"linear-gradient(to left,#fff,transparent)",zIndex:2}}/>
        <div className="marquee" style={{display:"flex",alignItems:"center",gap:48,width:"max-content"}}>
          {[...BRANDS,...BRANDS].map((b,i)=>(
            <BrandLogo key={i} brand={b}/>
          ))}
        </div>
      </section>

      {/* ══ FIX 2: PRODUCTS — PURE WHITE BG ══ */}
      <section style={{padding:"48px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
          <div><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:26,fontWeight:700}}>Meilleurs produits</h2></div>
          <a href="#" style={{fontSize:13,color:"#7b7b7b",textDecoration:"underline"}}>Voir toutes les offres</a>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16}}>
          {PRODUCTS.map(p=>(
            <div key={p.id} className="hl" style={{borderRadius:10,border:"1px solid #e4e5ec",background:"#fff",overflow:"hidden",cursor:"pointer"}}>
              <div style={{padding:"8px 12px 0"}}><span style={{fontSize:11,color:"#4CAF50",fontWeight:500}}>{"● "+p.stock.toLocaleString()+" pcs"}</span></div>
              <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",padding:16}}>
                <img src={p.img} alt={p.name} style={{maxHeight:130,maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
              </div>
              <div style={{padding:"10px 12px 14px"}}>
                <h3 style={{fontSize:13,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{p.name}</h3>
                <div style={{display:"flex",gap:16,fontSize:11,color:"#7b7b7b",marginBottom:10}}>
                  <span>Puissance<br/><b style={{color:"#262627"}}>{p.power}</b></span>
                  <span>Type<br/><b style={{color:"#262627"}}>{p.type}</b></span>
                </div>
                {isVerified?(
                  <div><div style={{fontSize:11,color:"#7b7b7b"}}>Des</div><div style={{fontSize:18,fontWeight:700,color:"#E8700A"}}>{"€"+p.price.toLocaleString("fr-FR")}<span style={{fontSize:11,fontWeight:400,color:"#7b7b7b"}}> /pcs</span></div></div>
                ):(
                  <button onClick={()=>setShowRegister(true)} style={{width:"100%",height:34,borderRadius:6,border:"none",background:"#E8700A",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{isLoggedIn ? "Vérification en cours" : "Voir le prix"}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FIX 4: CATEGORIES ══ */}
      <section style={{padding:"0 40px 56px"}}>
        <div style={{marginBottom:24}}><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:26,fontWeight:700}}>Obtenez les meilleurs prix en comparant plusieurs offres</h2></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"220px 180px",gap:12}}>
          <CatCard img="/categories/panels.jpg" title="Panneaux solaires" sub="Jinko, LONGi, Trina, Canadian Solar..." count="1 300+ offres" big/>
          <CatCard img="/categories/inverters.jpg" title="Onduleurs" sub="Huawei, SMA, Growatt, Deye..." count="4 400+ offres"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <CatCard img="/categories/batteries.jpg" title="Stockage d'energie" count="750+ offres" small/>
            <CatCard img="/categories/electrical.jpg" title="Cables & accessoires" count="250+ offres" small/>
          </div>
        </div>
      </section>

      {/* ══ FIX 5: WHY SUNTREX — AUTO-PLAY SLIDES ══ */}
      <section style={{background:"#fafafa",padding:"64px 40px",borderTop:"1px solid #e4e5ec"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <h2 style={{fontSize:32,fontWeight:700,marginBottom:4}}>Pourquoi SUNTREX ?</h2>
          <p style={{fontSize:15,color:"#7b7b7b",marginBottom:28}}>Une place de marche transparente, fiable et conviviale</p>
          <div style={{display:"flex",gap:8,marginBottom:36}}>
            {[["buyer","Pour l'acheteur"],["seller","Pour le vendeur"]].map(([k,l])=>(
              <button key={k} onClick={()=>{setTab(k);k==="buyer"?setBs(0):setSs(0)}} style={{padding:"10px 28px",fontSize:14,fontWeight:600,cursor:"pointer",border:"none",borderRadius:24,background:tab===k?"#4CAF50":"#fff",color:tab===k?"#fff":"#7b7b7b",fontFamily:"inherit",boxShadow:tab===k?"0 2px 8px rgba(76,175,80,0.3)":"0 1px 3px rgba(0,0,0,0.06)",transition:"all .2s"}}>{l}</button>
            ))}
          </div>
          <AutoSlides slides={tab==="buyer"?BSLIDES:SSLIDES} cur={tab==="buyer"?bs:ss} set={tab==="buyer"?setBs:setSs} key={tab}/>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:"44px 40px",borderTop:"1px solid #e4e5ec",borderBottom:"1px solid #e4e5ec"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20,maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
          {[["6 700+","Offres actives"],["25+","Pays couverts"],["500+","Vendeurs verifies"],["2%","Commission plateforme"]].map(([n,l],i)=>(
            <div key={i}><div style={{fontSize:32,fontWeight:700,color:"#E8700A"}}>{n}</div><div style={{fontSize:13,color:"#7b7b7b",marginTop:4}}>{l}</div></div>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section style={{padding:"56px 40px"}}>
        <div style={{textAlign:"center",marginBottom:36}}><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,margin:"0 auto 12px"}}/><h2 style={{fontSize:26,fontWeight:700}}>Ce qui nous differencie</h2></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:20,maxWidth:1080,margin:"0 auto"}}>
          {[
            {icon:<svg width="44" height="44" viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="28" rx="4" stroke="#4CAF50" strokeWidth="2.5"/><path d="M6 18h36" stroke="#4CAF50" strokeWidth="2.5"/><circle cx="24" cy="32" r="5" stroke="#4CAF50" strokeWidth="2"/><path d="M22 32l2 2 4-4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Paiement securise",d:"Escrow via Stripe Connect. Vos fonds sont proteges jusqu'a reception confirmee."},
            {icon:<svg width="44" height="44" viewBox="0 0 48 48" fill="none"><rect x="4" y="20" width="24" height="16" rx="2" stroke="#E8700A" strokeWidth="2.5"/><path d="M28 24h8l6 6v6H28" stroke="#E8700A" strokeWidth="2.5" strokeLinejoin="round"/><circle cx="12" cy="38" r="4" stroke="#E8700A" strokeWidth="2.5"/><circle cx="36" cy="38" r="4" stroke="#E8700A" strokeWidth="2.5"/></svg>,t:"SUNTREX Delivery",d:"Notre propre service logistique avec verification photo a chaque etape."},
            {icon:<svg width="44" height="44" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" stroke="#4CAF50" strokeWidth="2.5"/><path d="M18 24l4 4 8-8" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Commissions reduites",d:"Des frais parmi les plus bas du marche pour maximiser vos marges."},
            {icon:<svg width="44" height="44" viewBox="0 0 48 48" fill="none"><rect x="8" y="6" width="32" height="36" rx="4" stroke="#3b82f6" strokeWidth="2.5"/><path d="M16 16h16M16 24h10M16 32h6" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/><circle cx="36" cy="36" r="8" fill="#fff" stroke="#3b82f6" strokeWidth="2.5"/><path d="M33 36l2 2 4-4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Outils IA integres",d:"Suggestions de prix, analyse marche et matching intelligent."},
          ].map((item,i)=>(
            <div key={i} className="hl" style={{textAlign:"center",padding:28,borderRadius:12,border:"1px solid #e4e5ec",background:"#fff"}}>
              <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}>{item.icon}</div>
              <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>{item.t}</h3>
              <p style={{fontSize:13,color:"#7b7b7b",lineHeight:1.55}}>{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"56px 40px",textAlign:"center",background:"#1a1a1a",color:"#fff"}}>
        <h2 style={{fontSize:26,fontWeight:700,marginBottom:8}}>Pret a commencer ?</h2>
        <p style={{fontSize:15,color:"rgba(255,255,255,0.6)",marginBottom:28}}>Rejoignez des milliers de professionnels du solaire</p>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button onClick={()=>setShowRegister(true)} style={{padding:"14px 32px",borderRadius:24,border:"none",background:"#E8700A",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Creer un compte</button>
          <button style={{padding:"14px 32px",borderRadius:24,border:"1px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Commencer a vendre</button>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{background:"#f8f8f8",padding:"36px 40px",borderTop:"1px solid #e4e5ec",textAlign:"center"}}>
        <h3 style={{fontSize:18,fontWeight:600,marginBottom:16}}>Newsletter</h3>
        <div style={{display:"flex",gap:8,justifyContent:"center",maxWidth:440,margin:"0 auto"}}><input placeholder="Votre email" style={{flex:1,height:40,borderRadius:20,border:"1px solid #d3d4db",padding:"0 16px",fontSize:13,outline:"none"}}/><button style={{padding:"0 24px",height:40,borderRadius:20,border:"none",background:"#141413",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>S'abonner</button></div>
      </section>

      {/* FOOTER */}
      </>
      )}
      {/* END PAGE CONDITIONAL */}
      <footer style={{padding:"40px 40px 24px",borderTop:"1px solid #e4e5ec"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:40,marginBottom:32}}>
          <div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:24,height:24,borderRadius:5,background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg></div><span style={{fontWeight:700,fontSize:16}}>suntrex</span></div><p style={{fontSize:13}}>contact@suntrex.eu</p><p style={{fontSize:12,color:"#7b7b7b",marginTop:4}}>Tel - WhatsApp - Email</p></div>
          <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Contact</h4>{["Aide","Vendre","A propos","Blog"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b",marginBottom:8,cursor:"pointer"}}>{l}</div>)}</div>
          <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Categories</h4>{["Panneaux","Onduleurs","Stockage","Montage"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b",marginBottom:8,cursor:"pointer"}}>{l}</div>)}</div>
          <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Marques</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}}>{["Jinko","LONGi","Trina","Huawei","BYD","Deye","SMA","Enphase"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b"}}>{l}</div>)}</div></div>
        </div>
        <div style={{borderTop:"1px solid #e4e5ec",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:"#7b7b7b"}}>2026 suntrex</span><div style={{display:"flex",gap:12}}><span style={{fontSize:14,fontWeight:700,color:"#6366f1"}}>stripe</span><span style={{fontSize:11,fontWeight:700,color:"#999"}}>VISA</span><span style={{fontSize:11,fontWeight:700,color:"#999"}}>MC</span></div><a href="#" style={{fontSize:12,color:"#7b7b7b",textDecoration:"none"}}>Juridique</a></div>
      </footer>

      {/* CHAT FAB */}
      <button style={{position:"fixed",bottom:24,right:24,width:52,height:52,borderRadius:"50%",border:"none",background:"#4CAF50",color:"#fff",cursor:"pointer",boxShadow:"0 4px 16px rgba(76,175,80,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}><svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>

      {/* AUTH MODALS */}
      {showLogin && (
        <LoginModal
          onClose={()=>setShowLogin(false)}
          onLogin={(user)=>{setCurrentUser(user);setIsLoggedIn(true);setShowLogin(false)}}
          onSwitchToRegister={()=>{setShowLogin(false);setShowRegister(true)}}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={()=>setShowRegister(false)}
          onRegister={(user)=>{
            setCurrentUser(user);
            setIsLoggedIn(true);
            setShowRegister(false);
          }}
          onSwitchToLogin={()=>{setShowRegister(false);setShowLogin(true)}}
        />
      )}
    </div>
  );
}

/* ══ CATEGORY CARD ══ */
function CatCard({img, title, sub, count, big, small}) {
  const pad = big ? 28 : small ? 18 : 22;
  const fs = big ? 26 : small ? 17 : 20;
  return (
    <div className="hl" style={{borderRadius:12,cursor:"pointer",position:"relative",overflow:"hidden",gridRow:big?"1/3":undefined}}>
      <img src={img} alt={title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.65) 100%)"}}/>
      <div style={{position:"relative",zIndex:1,padding:pad,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
        <span style={{fontSize:small?11:12,background:"rgba(255,255,255,0.9)",padding:small?"3px 8px":"4px 12px",borderRadius:20,color:"#555",fontWeight:500,width:"fit-content"}}>{count}</span>
        <h3 style={{fontSize:fs,fontWeight:700,marginTop:small?8:12,color:"#fff"}}>{title}</h3>
        {sub&&<p style={{fontSize:small?12:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>{sub}</p>}
        <button style={{marginTop:small?8:12,padding:small?"6px 14px":"9px 22px",borderRadius:20,border:"none",background:"#4CAF50",color:"#fff",fontSize:small?12:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>Explorer</button>
      </div>
    </div>
  );
}

/* ══ BRAND LOGO: image with text fallback ══ */
function BrandLogo({brand}) {
  const [failed, setFailed] = useState(false);
  const ext = ["sma","solaredge","goodwe","risen","sungrow","enphase"].includes(brand.f) ? "svg" : "png";
  if (failed) return <span style={{fontSize:15,fontWeight:700,color:brand.c,whiteSpace:"nowrap",opacity:.85}}>{brand.n}</span>;
  return <img src={"/logos/"+brand.f+"."+ext} alt={brand.n} style={{height:28,maxWidth:140,objectFit:"contain",opacity:.8}} onError={()=>setFailed(true)}/>;
}
function AutoSlides({slides, cur, set}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {threshold:0.3});
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => set(c => (c + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [visible, slides.length, set]);

  return (
    <div ref={ref}>
      <div style={{display:"flex"}}>{slides.map((s,i)=>(
        <button key={i} onClick={()=>set(i)} style={{flex:1,padding:"14px 12px",fontSize:13,fontWeight:cur===i?600:400,color:cur===i?"#4CAF50":"#7b7b7b",background:"none",border:"none",borderBottom:cur===i?"3px solid #4CAF50":"3px solid #e4e5ec",cursor:"pointer",textAlign:"left",lineHeight:1.4,fontFamily:"inherit"}}>
          <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:"50%",marginRight:8,background:cur===i?"#4CAF50":"#e4e5ec",color:cur===i?"#fff":"#999",fontSize:11,fontWeight:700}}>{i+1}</span>{s.label}
        </button>
      ))}</div>
      <div key={cur} className="fade-in" style={{background:"#fff",borderRadius:"0 0 12px 12px",border:"1px solid #e4e5ec",borderTop:"none",padding:32,minHeight:360}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:32,alignItems:"center"}}>
          <div><h3 style={{fontSize:20,fontWeight:700,marginBottom:12}}>{slides[cur].label}</h3><p style={{fontSize:14,color:"#7b7b7b",lineHeight:1.6}}>{slides[cur].desc}</p></div>
          <AM type={slides[cur].m}/>
        </div>
      </div>
    </div>
  );
}
