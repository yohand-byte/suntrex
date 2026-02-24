import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PriceGate from "./PriceGate";
import SellerBadge from "./SellerBadge";

const S = {
  productCard: { background:"#fff", border:"1px solid #e4e5ec", borderRadius:10, overflow:"hidden", transition:"box-shadow .2s" },
  offerRow: { display:"flex", alignItems:"center", padding:"14px 20px", gap:16, borderTop:"1px solid #f0f0f0", fontSize:13 },
  greenBtn: { background:"#4CAF50", color:"#fff", border:"none", borderRadius:6, padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap" },
};

const Chev = ({open}) => (
  <svg width="12" height="12" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}} fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
);

export default function ProductCard({ product, isLoggedIn, onLogin, grouped }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const bestOffer = product.offers.reduce((a,b) => a.price < b.price ? a : b);
  const totalStock = product.offers.reduce((sum,o) => sum + o.stock, 0);
  const offerCount = product.offers.length;

  return (
    <div style={S.productCard}>
      <div style={{display:"flex",alignItems:"center",padding:"16px 20px",gap:20}}>
        <div style={{display:"flex",flexDirection:"column",gap:6,width:100,flexShrink:0,alignItems:"center"}}>
          <div style={{width:80,height:80,background:"#f8f8f8",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:4}}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>
            ) : (
              <span style={{fontSize:11,color:"#aaa",textAlign:"center"}}>{product.brand}</span>
            )}
          </div>
          {offerCount > 1 && grouped && (
            <span style={{fontSize:11,color:"#888"}}>{offerCount} offres</span>
          )}
        </div>

        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:6}}>
            <span style={{fontSize:11,color:"#888",background:"#f5f5f5",padding:"2px 8px",borderRadius:4}}>OFF {product.id}</span>
            <SellerBadge offer={bestOffer}/>
          </div>
          <h3 onClick={()=>navigate(`/product/${product.id}`)} style={{fontSize:15,fontWeight:600,color:"#222",margin:"4px 0",cursor:"pointer"}}>{product.name}</h3>
          <div style={{display:"flex",gap:20,fontSize:12,color:"#888",marginTop:4}}>
            <span>Puissance <b style={{color:"#333"}}>{product.power >= 1 ? product.power+" kW" : (product.power*1000)+" W"}</b></span>
            <span>Type <b style={{color:"#333"}}>{product.type}</b></span>
            {product.phases > 0 && <span>Phases <b style={{color:"#333"}}>{product.phases}</b></span>}
            {product.mppt > 0 && <span>MPPT <b style={{color:"#333"}}>{product.mppt}</b></span>}
          </div>
        </div>

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
          <button style={S.greenBtn} onClick={()=>navigate(`/product/${product.id}`)}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12H3m9-9l9 9-9 9"/></svg>
            Détails de l'offre
          </button>
        </div>
      </div>

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
