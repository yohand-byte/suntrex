import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useResponsive from "../../hooks/useResponsive";

const CATEGORY_ROUTES = {
  panels: "/catalog/panels",
  inverters: "/catalog/inverters",
  storage: "/catalog/batteries",
  mounting: "/catalog/mounting",
};

function FooterLink({ label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ fontSize: 13, color: hovered ? "#E8700A" : "#7b7b7b", marginBottom: 8, cursor: "pointer", transition: "color .15s" }}
    >
      {label}
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  return (
    <footer style={{padding:isMobile?"32px 16px 20px":"40px 40px 24px",borderTop:"1px solid #e4e5ec"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1.5fr 1fr 1fr 1fr",gap:isMobile?20:40,marginBottom:isMobile?20:32}}>
        <div style={isMobile?{gridColumn:"1/-1"}:undefined}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:24,height:24,borderRadius:5,background:"#E8700A",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg></div><span style={{fontWeight:700,fontSize:16}}>suntrex</span></div><p style={{fontSize:13}}>contact@suntrex.eu</p><p style={{fontSize:12,color:"#7b7b7b",marginTop:4}}>{t("footer.telWhatsappEmail")}</p></div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>{t("footer.contact")}</h4>{[{key:"help",label:t("footer.help")},{key:"sell",label:t("footer.sell")},{key:"about",label:t("footer.about")},{key:"blog",label:t("footer.blog")}].map(l=><FooterLink key={l.key} label={l.label} onClick={()=>{}} />)}</div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>{t("footer.categories")}</h4>{[{key:"panels",label:t("footer.panels")},{key:"inverters",label:t("footer.inverters")},{key:"storage",label:t("footer.storage")},{key:"mounting",label:t("footer.mounting")}].map(l=><FooterLink key={l.key} label={l.label} onClick={()=>navigate(CATEGORY_ROUTES[l.key])} />)}</div>
        <div><h4 style={{fontSize:13,fontWeight:600,marginBottom:12}}>{t("footer.brands")}</h4><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}}>{["Jinko","LONGi","Trina","Huawei","BYD","Deye","SMA","Enphase"].map(l=><FooterLink key={l} label={l} onClick={()=>navigate(`/catalog/all?q=${l}`)} />)}</div></div>
      </div>
      <div style={{borderTop:"1px solid #e4e5ec",paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><span style={{fontSize:12,color:"#7b7b7b"}}>2026 suntrex</span><div style={{display:"flex",alignItems:"center",gap:8}}>{/* Stripe */}<svg width="40" height="17" viewBox="0 0 60 25" fill="none"><path d="M5 0h50a5 5 0 015 5v15a5 5 0 01-5 5H5a5 5 0 01-5-5V5a5 5 0 015-5z" fill="#635BFF"/><path d="M28.4 10.1c0-1.7-0.8-3-2.3-3-1.5 0-2.5 1.3-2.5 3s1 3 2.5 3c0.7 0 1.3-0.2 1.7-0.5l-0.5-1.1c-0.3 0.2-0.7 0.3-1.1 0.3-0.7 0-1.2-0.4-1.3-1.1h3.4c0-0.2 0.1-0.4 0.1-0.6zm-3.5-0.5c0.1-0.7 0.5-1.2 1.2-1.2 0.6 0 1 0.5 1 1.2h-2.2zM20.8 7.1c-0.7 0-1.2 0.3-1.5 0.8V7.2h-1.5v5.7h1.6V9.8c0.2-0.5 0.6-0.8 1.1-0.8 0.2 0 0.3 0 0.5 0.1l0.3-1.5c-0.2-0.3-0.3-0.5-0.5-0.5zM15.7 7.2h-1.3V5.7l-1.6 0.3v1.2H12v1.3h0.8v2.4c0 1.3 0.6 2 1.9 2 0.4 0 0.8-0.1 1.1-0.2l-0.3-1.2c-0.2 0.1-0.4 0.1-0.6 0.1-0.5 0-0.5-0.3-0.5-0.8V8.5h1.3V7.2zM33.3 7.2l-1 3.8-1.1-3.8h-1.6l1.9 5.7h1.5l1.9-5.7h-1.6zM11 7.1c-1.5 0-2.6 1.1-2.6 3 0 1.8 1.1 3 2.8 3 0.7 0 1.3-0.2 1.8-0.5l-0.5-1.1c-0.4 0.2-0.8 0.3-1.2 0.3-0.7 0-1.3-0.3-1.4-1.1h3.5c0-0.1 0-0.4 0-0.6 0-1.7-0.8-3-2.4-3zm-1.2 2.5c0.1-0.7 0.5-1.2 1.1-1.2 0.6 0 1 0.5 1.1 1.2H9.8zM37.7 7.1c-0.5 0-0.9 0.3-1.2 0.7V4.7h-1.6v8.2h1.6V9.8c0.2-0.5 0.5-0.8 1-0.8 0.4 0 0.7 0.3 0.7 0.8v3.1h1.6V9.4c0-1.4-0.7-2.3-2.1-2.3z" fill="#fff"/></svg>{/* Visa */}<svg width="36" height="12" viewBox="0 0 48 16"><path d="M18.5 1.2l-3.3 13.6h-2.7l3.3-13.6h2.7zM33.4 9.8l1.4-3.9 0.8 3.9h-2.2zm3 5l0.8-2.1h-3.8L33 14.8h-2.8l4.2-12.5c0.2-0.5 0.6-0.7 1.1-0.7h2.2l3.4 13.2H38.4zM28.4 10.5c0 2.5-2.2 4.2-5.5 4.2-1.4 0-2.7-0.3-3.5-0.7l0.5-2.1 0.3 0.1c1 0.5 2 0.7 3 0.7 0.9 0 1.9-0.4 1.9-1.2 0-0.5-0.4-0.9-1.6-1.5-1.1-0.5-2.7-1.4-2.7-3.1 0-2.2 1.9-3.8 4.6-3.8 1.2 0 2.2 0.3 2.8 0.5l-0.5 2c-0.5-0.3-1.3-0.6-2.3-0.6-1 0-1.6 0.4-1.6 1 0 0.6 0.7 0.9 1.6 1.3 1.5 0.7 2.9 1.6 3 3.2zM46 1.2l-2.6 13.6h-2.5l0.2-0.8c-0.7 0.7-1.6 1-2.6 1-2 0-3.4-1.6-3.4-3.9 0-2.9 1.9-5.1 4.4-5.1 0.9 0 1.5 0.2 2 0.6l0.8-4.2L46 1.2zm-4.3 8c0-1-0.5-1.7-1.4-1.7-1.1 0-2 1.1-2 2.5 0 1.1 0.6 1.8 1.4 1.8 1 0 2-1 2-2.6z" fill="#1A1F71"/></svg>{/* Mastercard */}<svg width="26" height="16" viewBox="0 0 32 20"><rect x="0" y="0" width="32" height="20" rx="3" fill="#fff" stroke="#ddd" strokeWidth="0.5"/><circle cx="12" cy="10" r="7" fill="#EB001B"/><circle cx="20" cy="10" r="7" fill="#F79E1B"/><path d="M16 4.6a7 7 0 010 10.8 7 7 0 000-10.8z" fill="#FF5F00"/></svg></div><a href="#" style={{fontSize:12,color:"#7b7b7b",textDecoration:"none"}}>{t("footer.legal")}</a></div>
    </footer>
  );
}
