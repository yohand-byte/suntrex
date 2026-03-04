// ═══ SUNTREX VendorOfferCard — Marketplace Offer Card ═══
// Extracted from suntrex-multivendor-comparison.jsx
// Displays one seller's offer with badges, price, stock, CTA

import { useState } from "react";

const T = {
  bg: "#ffffff", surface: "#f8f9fb", border: "#e4e5ec", borderLight: "#eef0f4", borderHover: "#d1d5db",
  text: "#1a1a2e", textSec: "#5f6368", textDim: "#9aa0a6",
  orange: "#E8700A", orangeLight: "#fff7ed", orangeBorder: "#fed7aa",
  green: "#059669", greenLight: "#ecfdf5", greenBorder: "#a7f3d0",
  blue: "#2563eb", blueLight: "#eff6ff",
  teal: "#0d9488", tealLight: "#f0fdfa",
  amber: "#d97706", amberLight: "#fffbeb",
  font: "'DM Sans', system-ui, sans-serif",
  radius: 10, radiusLg: 14, shadow: "0 1px 3px rgba(0,0,0,0.05)", shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
};

const TIERS = {
  platinum: { label: "Platine", icon: "◆", color: "#475569", bg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #e2e8f0)", border: "#94a3b8", glow: "0 0 12px rgba(148,163,184,0.4)" },
  gold:     { label: "Or",      icon: "◆", color: "#92400e", bg: "linear-gradient(135deg, #fef3c7, #fcd34d, #fef3c7)", border: "#f59e0b", glow: "0 0 10px rgba(245,158,11,0.3)" },
  silver:   { label: "Argent",  icon: "◇", color: "#64748b", bg: "linear-gradient(135deg, #f1f5f9, #e2e8f0, #f1f5f9)", border: "#94a3b8", glow: "none" },
  bronze:   { label: "Bronze",  icon: "○", color: "#9a3412", bg: "linear-gradient(135deg, #fed7aa, #fdba74, #fed7aa)", border: "#f97316", glow: "none" },
};

export function TierBadge({ tier }) {
  const t = TIERS[tier]; if (!t) return null;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px 2px 6px",borderRadius:5,background:t.bg,border:`1px solid ${t.border}`,fontSize:10,fontWeight:800,color:t.color,letterSpacing:"0.03em",boxShadow:t.glow }}><span style={{fontSize:8}}>{t.icon}</span> {t.label}</span>;
}

export function VerifiedBadge() {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:5,background:T.greenLight,border:`1px solid ${T.greenBorder}`,fontSize:10,fontWeight:700,color:T.green }}>🛡️ Vérifié</span>;
}

export function EscrowBadge() {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:5,background:T.blueLight,border:"1px solid #bfdbfe",fontSize:10,fontWeight:700,color:T.blue }}>🔒 Escrow</span>;
}

export function DeliveryBadge({ type }) {
  const s = type === "suntrex";
  return <span style={{ display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:5,background:s?T.orangeLight:T.surface,border:`1px solid ${s?T.orangeBorder:T.borderLight}`,fontSize:10,fontWeight:700,color:s?T.orange:T.textSec }}>🚛 {s?"SUNTREX":"Vendeur"}</span>;
}

export function ColisVerifBadge() {
  return <span style={{ display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:5,background:T.tealLight,border:"1px solid #99f6e4",fontSize:10,fontWeight:700,color:T.teal }}>📦 Colis vérifié</span>;
}

export function ResponseBadge({ minutes }) {
  const flash = minutes <= 30;
  const label = minutes < 60 ? `${minutes}min` : `${Math.round(minutes/60)}h`;
  const color = flash ? T.green : minutes <= 60 ? T.amber : T.textDim;
  const bg = flash ? T.greenLight : minutes <= 60 ? T.amberLight : T.surface;
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:5,background:bg,border:`1px solid ${color}25`,fontSize:10,fontWeight:700,color }}><span style={{ width:5,height:5,borderRadius:"50%",background:color,animation:flash?"pulse 1.5s ease-in-out infinite":"none" }}/> {flash?"Flash":"Réponse"} ~{label}</span>;
}

export default function VendorOfferCard({ offer, logged, onLogin, rank, onCompare, isSelected }) {
  const [hov, setHov] = useState(false);
  const o = offer;
  const isBest = rank === 0;

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      border: `1.5px solid ${isSelected?T.blue:isBest?T.orangeBorder:hov?T.borderHover:T.borderLight}`,
      borderRadius: T.radiusLg, marginBottom: 12, overflow: "hidden",
      background: isSelected ? T.blueLight : T.bg,
      transition: "all .2s", boxShadow: hov ? T.shadowMd : T.shadow, position: "relative",
    }}>
      {isBest && <div style={{ position:"absolute",top:0,left:20,zIndex:2,background:`linear-gradient(135deg,${T.orange},#f59e0b)`,color:"#fff",fontSize:9,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase",padding:"3px 12px",borderRadius:"0 0 6px 6px" }}>★ Meilleur prix</div>}

      <div style={{ padding:isBest?"22px 18px 14px":"14px 18px", background:isBest?"linear-gradient(135deg,#fff7ed,#fffbeb)":T.bg, borderBottom:`1px solid ${T.borderLight}` }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10 }}>
          <div style={{ flex:1,minWidth:200 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
              <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${T.orange}18,${T.orange}35)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:T.orange,border:`2px solid ${T.orange}25`,flexShrink:0 }}>{o.name.charAt(0)}</div>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:T.text }}>{o.name}</span>
                  <span style={{ fontSize:14 }}>{o.flag}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:10.5,color:T.textDim,fontWeight:500 }}>
                  <span>{o.transactions?.toLocaleString()} ventes</span>
                  <span style={{ width:1,height:10,background:T.border }}/>
                  <span>Depuis {o.joined}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:4,alignItems:"center" }}>
              <TierBadge tier={o.tier}/>
              {o.verified && <VerifiedBadge/>}
              {o.escrow && <EscrowBadge/>}
              {o.colisVerif && <ColisVerifBadge/>}
              <DeliveryBadge type={o.delivery}/>
              <ResponseBadge minutes={o.responseMin}/>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ fontSize:11 }}>★</span>
            <span style={{ fontSize:13,fontWeight:800,color:T.text }}>{o.rating?.toFixed(1)}</span>
            <span style={{ fontSize:10.5,color:T.textDim }}>({o.reviews})</span>
          </div>
        </div>
      </div>

      <div style={{ padding:"12px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          <div style={{ display:"flex",alignItems:"center",gap:5 }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:o.stock>100?T.green:o.stock>10?T.amber:T.textDim }}/>
            <span style={{ fontSize:12,fontWeight:600 }}>{o.stock?.toLocaleString()} pcs</span>
          </div>
          <div style={{ fontSize:10.5,color:T.textDim }}>📦 Délai: <b>{o.leadDays}j</b> · MOQ: <b>{o.moq} pcs</b></div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {logged ? (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-0.02em" }}>
                €{o.price?.toLocaleString("fr-FR",{minimumFractionDigits:2})}
                <span style={{ fontSize:11,fontWeight:400,color:T.textDim }}>/pcs HT</span>
              </div>
            </div>
          ) : (
            <button onClick={onLogin} style={{ display:"flex",alignItems:"center",gap:5,background:T.orange,color:"#fff",border:"none",borderRadius:7,padding:"8px 14px",fontSize:11.5,fontWeight:700,cursor:"pointer",fontFamily:T.font }}>🔒 Voir le prix</button>
          )}
          {logged && (
            <button style={{ display:"flex",alignItems:"center",gap:5,background:T.orange,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:T.font }}>💬 Contacter</button>
          )}
        </div>
      </div>
    </div>
  );
}
