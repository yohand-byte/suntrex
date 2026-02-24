import { useState } from "react";
import { Link } from "react-router-dom";
import REAL_PRODUCTS from "../products";
import BrandLogo from "../components/ui/BrandLogo";
import AutoSlides from "../components/ui/AutoSlides";
import CatCard from "../components/ui/CatCard";

// Featured products for homepage (pick best sellers)
const PRODUCTS = [
  REAL_PRODUCTS.find(p => p.id === "hw-sun2000-10k-lc0"),
  REAL_PRODUCTS.find(p => p.id === "hw-luna2000-5-e0"),
  REAL_PRODUCTS.find(p => p.id === "hw-sun2000-6k-map0"),
  REAL_PRODUCTS.find(p => p.id === "hw-sun2000-12k-mb0"),
  REAL_PRODUCTS.find(p => p.id === "hw-merc-1300-p"),
].map(p => ({
  id: p.id,
  name: p.name,
  power: p.power || p.capacity || "",
  type: p.type,
  stock: p.stock,
  price: p.price,
  img: p.image || "",
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

export default function HomePage({ isVerified, isLoggedIn, onShowRegister, navigate }) {
  const [bs, setBs] = useState(0);
  const [ss, setSs] = useState(0);
  const [tab, setTab] = useState("buyer");

  return (
    <>
      {/* HERO */}
      <section style={{position:"relative",height:480,overflow:"hidden",background:"#0a1628"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"url('/hero-solar.jpg')",backgroundSize:"cover",backgroundPosition:"center",filter:"brightness(0.35)",zIndex:0}}/>
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

      {/* BRANDS MARQUEE */}
      <section style={{padding:"16px 0",borderBottom:"1px solid #e4e5ec",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:100,background:"linear-gradient(to right,#fff,transparent)",zIndex:2}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:100,background:"linear-gradient(to left,#fff,transparent)",zIndex:2}}/>
        <div className="marquee" style={{display:"flex",alignItems:"center",gap:48,width:"max-content"}}>
          {[...BRANDS,...BRANDS].map((b,i)=>(
            <BrandLogo key={i} brand={b}/>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section style={{padding:"48px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
          <div><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:26,fontWeight:700}}>Meilleurs produits</h2></div>
          <Link to="/catalog" style={{fontSize:13,color:"#7b7b7b",textDecoration:"underline"}}>Voir toutes les offres</Link>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16}}>
          {PRODUCTS.map(p=>(
            <div key={p.id} className="hl" onClick={()=>navigate(`/product/${p.id}`)} style={{borderRadius:10,border:"1px solid #e4e5ec",background:"#fff",overflow:"hidden",cursor:"pointer"}}>
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
                  <button onClick={(e)=>{e.stopPropagation();onShowRegister()}} style={{width:"100%",height:34,borderRadius:6,border:"none",background:"#E8700A",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{isLoggedIn ? "Vérification en cours" : "Voir le prix"}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{padding:"0 40px 56px"}}>
        <div style={{marginBottom:24}}><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:26,fontWeight:700}}>Obtenez les meilleurs prix en comparant plusieurs offres</h2></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"220px 180px",gap:12}}>
          <CatCard img="/categories/panels.jpg" title="Panneaux solaires" sub="Jinko, LONGi, Trina, Canadian Solar..." count="1 300+ offres" big onClick={()=>navigate("/catalog/panels")}/>
          <CatCard img="/categories/inverters.jpg" title="Onduleurs" sub="Huawei, SMA, Growatt, Deye..." count="4 400+ offres" onClick={()=>navigate("/catalog/inverters")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <CatCard img="/categories/batteries.jpg" title="Stockage d'energie" count="750+ offres" small onClick={()=>navigate("/catalog/batteries")}/>
            <CatCard img="/categories/electrical.jpg" title="Cables & accessoires" count="250+ offres" small onClick={()=>navigate("/catalog/accessories")}/>
          </div>
        </div>
      </section>

      {/* WHY SUNTREX */}
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
          <button onClick={onShowRegister} style={{padding:"14px 32px",borderRadius:24,border:"none",background:"#E8700A",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Creer un compte</button>
          <button style={{padding:"14px 32px",borderRadius:24,border:"1px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Commencer a vendre</button>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{background:"#f8f8f8",padding:"36px 40px",borderTop:"1px solid #e4e5ec",textAlign:"center"}}>
        <h3 style={{fontSize:18,fontWeight:600,marginBottom:16}}>Newsletter</h3>
        <div style={{display:"flex",gap:8,justifyContent:"center",maxWidth:440,margin:"0 auto"}}><input placeholder="Votre email" style={{flex:1,height:40,borderRadius:20,border:"1px solid #d3d4db",padding:"0 16px",fontSize:13,outline:"none"}}/><button style={{padding:"0 24px",height:40,borderRadius:20,border:"none",background:"#141413",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>S'abonner</button></div>
      </section>
    </>
  );
}
