import { useTranslation } from "react-i18next";

export default function CatCard({ img, title, sub, count, big, small, onClick, montage, bg, buttonLabel, mobileHeight }) {
  const { t } = useTranslation();
  const pad = big ? 28 : small ? 18 : 22;
  const fs = big ? 26 : small ? 17 : 20;
  const heightStyle = mobileHeight ? { height: mobileHeight } : undefined;

  if (montage) {
    return (
      <div className="hl" onClick={onClick} style={{borderRadius:12,cursor:"pointer",position:"relative",overflow:"hidden",gridRow:mobileHeight?undefined:(big?"1/3":undefined),background:bg||"linear-gradient(135deg,#1a2332 0%,#2d3f52 100%)",...heightStyle}}>
        <img src={img} alt={title} style={{position:"absolute",right:0,bottom:0,height:"90%",maxWidth:"65%",objectFit:"contain",objectPosition:"right bottom",opacity:0.92}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgba(0,0,0,0.45) 0%,rgba(0,0,0,0.05) 60%,transparent 100%)"}}/>
        <div style={{position:"relative",zIndex:1,padding:pad,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
          <span style={{fontSize:small?11:12,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",padding:small?"4px 10px":"5px 14px",borderRadius:4,color:"#fff",fontWeight:600,width:"fit-content",border:"1px solid rgba(255,255,255,0.18)",letterSpacing:"0.02em"}}>{count}</span>
          <h3 style={{fontSize:fs,fontWeight:700,marginTop:small?8:12,color:"#fff"}}>{title}</h3>
          {sub&&<p style={{fontSize:small?12:13,color:"rgba(255,255,255,0.7)",marginTop:4}}>{sub}</p>}
          <button style={{marginTop:small?8:12,padding:small?"6px 14px":"9px 22px",borderRadius:20,border:"none",background:"#E8700A",color:"#fff",fontSize:small?12:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>{buttonLabel || t("home.categories.explore")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hl" onClick={onClick} style={{borderRadius:12,cursor:"pointer",position:"relative",overflow:"hidden",gridRow:mobileHeight?undefined:(big?"1/3":undefined),...heightStyle}}>
      <img src={img} alt={title} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.65) 100%)"}}/>
      <div style={{position:"relative",zIndex:1,padding:pad,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
        <span style={{fontSize:small?11:12,background:"rgba(255,255,255,0.85)",backdropFilter:"blur(10px)",padding:small?"4px 10px":"5px 14px",borderRadius:4,color:"#444",fontWeight:600,width:"fit-content",letterSpacing:"0.02em"}}>{count}</span>
        <h3 style={{fontSize:fs,fontWeight:700,marginTop:small?8:12,color:"#fff"}}>{title}</h3>
        {sub&&<p style={{fontSize:small?12:13,color:"rgba(255,255,255,0.8)",marginTop:4}}>{sub}</p>}
        <button style={{marginTop:small?8:12,padding:small?"6px 14px":"9px 22px",borderRadius:20,border:"none",background:"#4CAF50",color:"#fff",fontSize:small?12:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>{buttonLabel || t("home.categories.explore")}</button>
      </div>
    </div>
  );
}
