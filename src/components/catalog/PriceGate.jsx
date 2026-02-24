const S_BLUR = { filter:"blur(6px)", userSelect:"none", pointerEvents:"none" };

export default function PriceGate({ price, isLoggedIn, onLogin }) {
  if (isLoggedIn) return <span style={{fontSize:16,fontWeight:700,color:"#222"}}>€{price.toFixed(2)} <span style={{fontSize:11,fontWeight:400,color:"#888"}}>/pcs</span></span>;
  return (
    <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:8}}>
      <span style={{...S_BLUR,fontSize:16,fontWeight:700}}>€{(price * 0.93 + Math.random()*50).toFixed(2)}</span>
      <button onClick={onLogin} style={{background:"#E8700A",color:"#fff",border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
        Voir le prix
      </button>
    </div>
  );
}
