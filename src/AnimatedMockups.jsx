import { useState, useEffect } from "react";

const B = {background:"#f8f8f8",borderRadius:12,border:"1px solid #e4e5ec",padding:20,minHeight:300,overflow:"hidden"};

export default function AM({type}) {
  const [s, setS] = useState(0);
  useEffect(() => {setS(0); const t = setInterval(() => setS(v => v + 1), 600); return () => clearInterval(t);}, [type]);

  if (type === "catalog") return (<div style={B}>
    <div style={{fontSize:11,color:"#999",marginBottom:8,fontWeight:600}}>SUNTREX — Recherche intelligente</div>
    <div style={{background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 12px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
      <svg width="14" height="14" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <span style={{fontSize:13,color:s>0?"#333":"#ccc"}}>{s>0&&"Huawei SUN2000-10KTL"}{s>0&&s<4&&<span style={{color:"#E8700A"}}>|</span>}</span>
    </div>
    {s>=2&&<div style={{fontSize:11,color:"#4CAF50",marginBottom:12,fontWeight:500}}>47 offres de 12 vendeurs</div>}
    {[{v:"SolarPro GmbH",f:"DE",r:"4.9",p:"1 180",d:3},{v:"PV Direct France",f:"FR",r:"4.8",p:"1 210",d:5},{v:"GreenEnergy BV",f:"NL",r:"4.7",p:"1 249",d:7}].map((r,i)=>s>=r.d&&(
      <div key={i} className="ar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,background:"#e8f5e9",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#4CAF50"}}>{r.f}</div><div><div style={{fontSize:12,fontWeight:600}}>{r.v}</div><div style={{fontSize:11,color:"#999"}}>{r.r}</div></div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:15,fontWeight:700,color:"#E8700A"}}>{"€"+r.p}<span style={{fontSize:11,fontWeight:400}}>/pcs</span></div><div style={{fontSize:11,color:"#4CAF50"}}>En stock</div></div>
      </div>
    ))}
    {s>=9&&<button style={{marginTop:12,width:"100%",padding:10,borderRadius:8,border:"none",background:"#E8700A",color:"#fff",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>Voir toutes les offres</button>}
  </div>);

  if (type === "chat") {
    const ms=[{f:"b",m:"Quel prix pour 200x SUN2000-10KTL ?",d:1},{f:"s",m:"Fur 200 Stuck: €1.120/Stk.",t:"Pour 200 : €1 120/u.",d:3},{f:"b",m:"€1 090 ? Paiement immédiat.",d:6},{f:"s",m:"€1 100 — mein bestes Angebot.",t:"€1 100 — meilleure offre.",d:8},{f:"b",m:"Deal !",d:10}];
    return(<div style={B}>
      <div style={{fontSize:11,color:"#999",marginBottom:8,fontWeight:600}}>CHAT — Traduction IA en temps réel</div>
      <div style={{background:"#fff",borderRadius:10,border:"1px solid #eee",padding:14,minHeight:220}}>
        {ms.map((m,i)=>s>=m.d&&(<div key={i} className="ar" style={{display:"flex",justifyContent:m.f==="b"?"flex-end":"flex-start",marginBottom:8}}>
          <div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:12,background:m.f==="b"?"#E8700A":"#f5f5f5",color:m.f==="b"?"#fff":"#333",fontSize:12,lineHeight:1.4}}>
            {m.m}{m.t&&<div style={{fontSize:10,opacity:.75,marginTop:3,fontStyle:"italic"}}>{m.t}</div>}
          </div>
        </div>))}
        {s>=11&&<div style={{textAlign:"center",padding:8,fontSize:11,color:"#4CAF50",fontWeight:500}}>Accord trouvé — Paiement sécurisé...</div>}
      </div>
    </div>);
  }

  if (type === "payment") return(<div style={B}>
    <div style={{fontSize:11,color:"#999",marginBottom:16,fontWeight:600}}>STRIPE CONNECT — Escrow sécurisé</div>
    <div style={{background:"#fff",border:"1px solid #eee",borderRadius:10,padding:16}}>
      {s>=1&&<div className="ar">{[["200x SUN2000-10KTL","€220 000"],["Livraison SUNTREX","€1 200"],["Commission (2%)","€4 400"]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#7b7b7b"}}>{l}</span><span style={{fontWeight:500}}>{v}</span></div>)}</div>}
      {s>=3&&<div className="ar" style={{display:"flex",justifyContent:"space-between",borderTop:"2px solid #e4e5ec",paddingTop:12,fontSize:16}}><span style={{fontWeight:700}}>Total</span><span style={{fontWeight:700,color:"#E8700A"}}>€225 600</span></div>}
      {s>=5&&<div className="ar" style={{background:"#f0fdf4",padding:10,borderRadius:8,fontSize:12,color:"#2e7d32",textAlign:"center",marginTop:14,fontWeight:500}}>Escrow activé — Fonds sécurisés</div>}
      {s>=7&&<div className="ar" style={{marginTop:12,display:"flex",gap:8}}>{["3D Secure","SCA Europe","Escrow"].map((t,i)=><div key={i} style={{flex:1,padding:8,textAlign:"center",background:"#f5f5f5",borderRadius:8,fontSize:11,fontWeight:600,color:"#4CAF50"}}>{t}</div>)}</div>}
      {s>=9&&<div style={{marginTop:12,height:44,borderRadius:8,background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:600}}>Paiement confirmé</div>}
    </div>
  </div>);

  if (type === "delivery") {
    const st=[{s:"Commande confirmée",d:1},{s:"Expédié par le vendeur",d:3},{s:"Pris en charge SUNTREX",d:5},{s:"Contrôle qualité",d:7},{s:"En transit",d:9},{s:"Livré — Photo confirmée",d:11}];
    return(<div style={B}>
      <div style={{fontSize:11,color:"#999",marginBottom:16,fontWeight:600}}>SUNTREX DELIVERY — Suivi temps réel</div>
      <div style={{background:"#fff",border:"1px solid #eee",borderRadius:10,padding:16}}>
        {st.map((x,i)=>{const done=s>=x.d+2,act=s>=x.d&&!done;if(s<x.d)return null;return(
          <div key={i} className="ar" style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:done?"#4CAF50":act?"#E8700A":"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {done&&<svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}
              {act&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"dotPulse 1s infinite"}}/>}
            </div>
            <div style={{fontSize:13,fontWeight:done||act?600:400,color:done?"#2e7d32":act?"#E8700A":"#999"}}>{x.s}</div>
          </div>
        );})}
      </div>
    </div>);
  }

  if (type === "europe") return(<div style={B}>
    <div style={{fontSize:11,color:"#999",marginBottom:8,fontWeight:600}}>VOS MARCHES — 25+ pays</div>
    <svg viewBox="0 0 500 380" style={{width:"100%",height:260}}>
      <g fill="#e8f0e8" stroke="#c5d5c5" strokeWidth="0.5">
        <path d="M150,220 L170,190 L200,185 L220,200 L210,240 L180,250 L150,240Z"/>
        <path d="M210,160 L240,150 L260,165 L255,195 L225,200 L210,185Z"/>
        <path d="M120,260 L180,255 L185,290 L140,300 L110,280Z"/>
        <path d="M230,220 L245,210 L260,250 L250,290 L235,280Z"/>
        <path d="M265,155 L300,150 L310,175 L290,190 L265,180Z"/>
        <path d="M195,155 L210,150 L212,165 L198,168Z"/>
      </g>
      {[[165,215,"FR"],[235,175,"DE"],[150,270,"ES"],[245,250,"IT"],[285,170,"PL"],[200,160,"BE"]].map(([x,y,c],i)=>
        s>=i*2&&<g key={i}><circle cx={x} cy={y} r="10" fill="#4CAF50" opacity=".15"><animate attributeName="r" values="8;14;8" dur="3s" repeatCount="indefinite"/></circle><circle cx={x} cy={y} r="4" fill="#4CAF50"/><text x={x+12} y={y+4} fontSize="10" fill="#333" fontWeight="600">{c}</text></g>
      )}
    </svg>
  </div>);

  if (type === "createoffer") return(<div style={B}>
    <div style={{fontSize:11,color:"#999",marginBottom:12,fontWeight:600}}>CRÉATION D'OFFRE RAPIDE</div>
    <div style={{background:"#fff",border:"1px solid #eee",borderRadius:10,padding:16}}>
      {s>=1&&<div className="ar" style={{marginBottom:10}}><div style={{fontSize:11,color:"#999",marginBottom:4}}>Produit</div><div style={{padding:"8px 12px",background:"#f5f5f5",borderRadius:8,fontSize:13,fontWeight:500}}>Huawei SUN2000-10KTL-M2</div></div>}
      {s>=3&&<div className="ar" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div><div style={{fontSize:11,color:"#999",marginBottom:4}}>Prix unitaire</div><div style={{padding:"8px 12px",background:"#f5f5f5",borderRadius:8,fontSize:13,fontWeight:700,color:"#E8700A"}}>€1 180</div></div>
        <div><div style={{fontSize:11,color:"#999",marginBottom:4}}>Stock</div><div style={{padding:"8px 12px",background:"#f5f5f5",borderRadius:8,fontSize:13}}>500 pcs</div></div>
      </div>}
      {s>=5&&<div className="ar" style={{marginBottom:10}}><div style={{padding:"8px 12px",background:"#f5f5f5",borderRadius:8,fontSize:13}}>SUNTREX Delivery — 3-5 jours ouvrés</div></div>}
      {s>=7&&<div className="ar" style={{padding:"8px 12px",background:"#f0fdf4",borderRadius:8,fontSize:12,color:"#2e7d32"}}>IA : Prix moyen marche €1 220 — vous etes -3.3%, très compétitif</div>}
      {s>=9&&<button style={{marginTop:12,width:"100%",padding:10,borderRadius:8,border:"none",background:"#4CAF50",color:"#fff",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>Offre publiée</button>}
    </div>
  </div>);

  if (type === "stockmgmt") return(<div style={B}>
    <div style={{fontSize:11,color:"#999",marginBottom:12,fontWeight:600}}>GESTION DES STOCKS</div>
    <div style={{background:"#fff",border:"1px solid #eee",borderRadius:10,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 14px",background:"#f9f9f9",fontSize:11,fontWeight:600,color:"#999"}}><span>Produit</span><span>Stock</span><span>Prix</span><span>Statut</span></div>
      {[{n:"SUN2000-10KTL",st:"500",p:"€1 180",c:"#4CAF50",l:"En stock",d:1},{n:"SUN2000-5KTL",st:"12",p:"€689",c:"#f59e0b",l:"Stock bas",d:3},{n:"LUNA2000-5-S0",st:"88",p:"€1 890",c:"#4CAF50",l:"En stock",d:5},{n:"SUN2000-3KTL",st:"0",p:"€479",c:"#e53e3e",l:"Rupture",d:7}].map((r,i)=>s>=r.d&&(
        <div key={i} className="ar" style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 14px",borderTop:"1px solid #f0f0f0",alignItems:"center"}}>
          <span style={{fontSize:12,fontWeight:500}}>{r.n}</span><span style={{fontSize:12,fontWeight:600,color:r.c}}>{r.st}</span><span style={{fontSize:12}}>{r.p}</span>
          <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:10,background:r.c==="#4CAF50"?"#f0fdf4":r.c==="#f59e0b"?"#fffbeb":"#fef2f2",color:r.c,textAlign:"center"}}>{r.l}</span>
        </div>
      ))}
      {s>=9&&<div style={{padding:"10px 14px",background:"#fffbeb",fontSize:12,color:"#92400e",borderTop:"1px solid #f0f0f0"}}>IA : SUN2000-5KTL stock critique. +3% prix recommandé.</div>}
    </div>
  </div>);

  // dashboard (default)
  return(<div style={B}>
    <div style={{fontSize:11,color:"#999",marginBottom:12,fontWeight:600}}>TABLEAU DE BORD VENDEUR</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:16}}>
      {[["Offres","124","#4CAF50"],["Ventes","€45,2k","#E8700A"],["Commandes","38","#3b82f6"],["Note","4.8","#f59e0b"]].map(([l,v,c],i)=>s>=i*2&&<div key={i} className="ar" style={{textAlign:"center",padding:12,background:"#fff",borderRadius:10,border:"1px solid #eee"}}><div style={{fontSize:10,color:"#999"}}>{l}</div><div style={{fontSize:16,fontWeight:700,marginTop:2,color:c}}>{v}</div></div>)}
    </div>
    {s>=6&&<div className="ar" style={{background:"#fff",border:"1px solid #eee",borderRadius:10,padding:12}}>
      <div style={{fontSize:11,color:"#999",marginBottom:8}}>Dernières commandes</div>
      {[["#ST-2847","€12 400","En transit"],["#ST-2846","€8 900","Livré"],["#ST-2845","€22 100","Payé"]].map(([id,a,st],i)=>s>=8+i*2&&<div key={i} className="ar" style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:12,borderBottom:"1px solid #f5f5f5"}}><span style={{fontWeight:500}}>{id}</span><span>{a}</span><span style={{color:"#7b7b7b"}}>{st}</span></div>)}
    </div>}
  </div>);
}
