export default function Footer() {
  return (
    <footer style={{padding:"40px 40px 24px",borderTop:"1px solid #e4e5ec"}}>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:40,marginBottom:32}}>
        <div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:24,height:24,borderRadius:5,background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg></div><span style={{fontWeight:700,fontSize:16}}>suntrex</span></div><p style={{fontSize:13}}>contact@suntrex.eu</p><p style={{fontSize:12,color:"#7b7b7b",marginTop:4}}>Tel - WhatsApp - Email</p></div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Contact</h4>{["Aide","Vendre","A propos","Blog"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b",marginBottom:8,cursor:"pointer"}}>{l}</div>)}</div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Categories</h4>{["Panneaux","Onduleurs","Stockage","Montage"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b",marginBottom:8,cursor:"pointer"}}>{l}</div>)}</div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>Marques</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}}>{["Jinko","LONGi","Trina","Huawei","BYD","Deye","SMA","Enphase"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b"}}>{l}</div>)}</div></div>
      </div>
      <div style={{borderTop:"1px solid #e4e5ec",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:"#7b7b7b"}}>2026 suntrex</span><div style={{display:"flex",gap:12}}><span style={{fontSize:14,fontWeight:700,color:"#6366f1"}}>stripe</span><span style={{fontSize:11,fontWeight:700,color:"#999"}}>VISA</span><span style={{fontSize:11,fontWeight:700,color:"#999"}}>MC</span></div><a href="#" style={{fontSize:12,color:"#7b7b7b",textDecoration:"none"}}>Juridique</a></div>
    </footer>
  );
}
