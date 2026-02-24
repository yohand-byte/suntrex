const S_BADGE = { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500 };

export default function SellerBadge({ offer }) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
      <span style={{fontSize:12}}>{offer.flag}</span>
      <span style={{...S_BADGE,background:"#f0f7f0",color:"#2e7d32"}}>⭐ {offer.rating} ({offer.reviews})</span>
      {offer.badge==="trusted" && <span style={{...S_BADGE,background:"#e8f5e9",color:"#1b5e20"}}>✓ Vendeur de confiance</span>}
      {offer.bankTransfer && <span style={{...S_BADGE,background:"#e3f2fd",color:"#1565c0"}}>🏦 Virement sécurisé</span>}
      {offer.delivery==="suntrex" && <span style={{...S_BADGE,background:"#fff3e0",color:"#e65100"}}>🚚 SUNTREX Delivery</span>}
    </div>
  );
}
