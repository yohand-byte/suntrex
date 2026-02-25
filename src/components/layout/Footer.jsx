import { useTranslation } from "react-i18next";
import useResponsive from "../../hooks/useResponsive";

export default function Footer() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  return (
    <footer style={{padding:isMobile?"32px 16px 20px":"40px 40px 24px",borderTop:"1px solid #e4e5ec"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1.5fr 1fr 1fr 1fr",gap:isMobile?20:40,marginBottom:isMobile?20:32}}>
        <div style={isMobile?{gridColumn:"1/-1"}:undefined}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:24,height:24,borderRadius:5,background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg></div><span style={{fontWeight:700,fontSize:16}}>suntrex</span></div><p style={{fontSize:13}}>contact@suntrex.eu</p><p style={{fontSize:12,color:"#7b7b7b",marginTop:4}}>{t("footer.telWhatsappEmail")}</p></div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>{t("footer.contact")}</h4>{[{key:"help",label:t("footer.help")},{key:"sell",label:t("footer.sell")},{key:"about",label:t("footer.about")},{key:"blog",label:t("footer.blog")}].map(l=><div key={l.key} style={{fontSize:13,color:"#7b7b7b",marginBottom:8,cursor:"pointer"}}>{l.label}</div>)}</div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>{t("footer.categories")}</h4>{[{key:"panels",label:t("footer.panels")},{key:"inverters",label:t("footer.inverters")},{key:"storage",label:t("footer.storage")},{key:"mounting",label:t("footer.mounting")}].map(l=><div key={l.key} style={{fontSize:13,color:"#7b7b7b",marginBottom:8,cursor:"pointer"}}>{l.label}</div>)}</div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>{t("footer.brands")}</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}}>{["Jinko","LONGi","Trina","Huawei","BYD","Deye","SMA","Enphase"].map(l=><div key={l} style={{fontSize:13,color:"#7b7b7b"}}>{l}</div>)}</div></div>
      </div>
      <div style={{borderTop:"1px solid #e4e5ec",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><span style={{fontSize:12,color:"#7b7b7b"}}>2026 suntrex</span><div style={{display:"flex",gap:12}}><span style={{fontSize:14,fontWeight:700,color:"#6366f1"}}>stripe</span><span style={{fontSize:11,fontWeight:700,color:"#999"}}>VISA</span><span style={{fontSize:11,fontWeight:700,color:"#999"}}>MC</span></div><a href="#" style={{fontSize:12,color:"#7b7b7b",textDecoration:"none"}}>{t("footer.legal")}</a></div>
    </footer>
  );
}
