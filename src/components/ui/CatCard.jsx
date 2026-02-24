export default function CatCard({ img, title, sub, count, big, small, onClick, montage, bg }) {
  const pad = big ? 28 : small ? 18 : 22;
  const fs = big ? 26 : small ? 17 : 20;

  if (montage) {
    return (
      <div className="hl" onClick={onClick} style={{borderRadius:12,cursor:"pointer",position:"relative",overflow:"hidden",gridRow:big?"1/3":undefined,background:bg||"linear-gradient(135deg,#1a2332 0%,#2d3f52 100%)"}}>
        <img src={img} alt={title} style={{position:"absolute",right:0,bottom:0,height:"90%",maxWidth:"65%",objectFit:"contain",objectPosition:"right bottom",opacity:0.92}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.05) 60%,transparent 100%)"}}/>
        <div style={{position:"relative",zIndex:1,padding:pad,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
          <span style={{fontSize:small?11:12,background:"rgba(255,255,255,0.15)",backdropFilter:"blur(8px)",padding:small?"3px 8px":"4px 12px",borderRadius:20,color:"#fff",fontWeight:500,width:"fit-content",border:"1px solid rgba(255,255,255,0.15)"}}>{count}</span>
          <h3 style={{fontSize:fs,fontWeight:700,marginTop:small?8:12,color:"#fff"}}>{title}</h3>
          {sub&&<p style={{fontSize:small?12:13,color:"rgba(255,255,255,0.7)",marginTop:4}}>{sub}</p>}
          <button style={{marginTop:small?8:12,padding:small?"6px 14px":"9px 22px",borderRadius:20,border:"none",background:"#E8700A",color:"#fff",fontSize:small?12:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>Explorer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hl" onClick={onClick} style={{borderRadius:12,cursor:"pointer",position:"relative",overflow:"hidden",gridRow:big?"1/3":undefined}}>
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
