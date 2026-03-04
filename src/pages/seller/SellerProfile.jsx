import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SUNTREX — Seller Profile v3
   ═══════════════════════════════════════════════════════════════════════════
   v3 fixes:
   - InvoiceCard: chevron expands full transaction detail list
   - Download button: dropdown menu with "commission..." option
   - Transaction rows: #, transaction nr, amount, date, Details >
   - Badge not shown by default (earned)
   - Dropdowns not truncated
   - Real invoice structure matching sun.store screenshots exactly
   ═══════════════════════════════════════════════════════════════════════════ */

const T = {
  font: "'DM Sans', 'Outfit', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  bg: "#f7f8fa", card: "#ffffff",
  border: "#e2e5ea", borderLight: "#f0f1f4", borderFocus: "#E8700A",
  text: "#111827", textSec: "#6b7280", textDim: "#9ca3af", textPH: "#c1c7d0",
  orange: "#E8700A", orangeHover: "#d4630a", orangeLight: "rgba(232,112,10,0.06)", orangeBorder: "rgba(232,112,10,0.18)",
  green: "#16a34a", greenLight: "rgba(22,163,74,0.06)", greenBorder: "rgba(22,163,74,0.18)", greenSolid: "#dcfce7",
  red: "#dc2626", redLight: "rgba(220,38,38,0.06)",
  blue: "#2563eb", blueLight: "rgba(37,99,235,0.06)",
  shadow: "0 1px 3px rgba(0,0,0,0.04)",
  r: 8, rl: 12, rxl: 16,
};

// ─── COMMISSION ENGINE (Appendix 2) ─────────────────────────────────────
const DISCOUNT = 0.95;
const SUN_STORE_FEES = {
  solar_panels: { label: "Panneaux solaires", icon: "☀️", tiers: [
    { min:150000, label:"> 150k €", rate:0.0084 }, { min:80000, label:"80k – 150k €", rate:0.0131 },
    { min:25000, label:"25k – 80k €", rate:0.0181 }, { min:10000, label:"10k – 25k €", rate:0.0226 },
    { min:5000, label:"5k – 10k €", rate:0.0276 }, { min:0, label:"< 5k €", rate:0.0299 },
  ]},
  inverters_storage: { label: "Onduleurs & Stockage", icon: "⚡", tiers: [
    { min:150000, label:"> 150k €", rate:0.0103 }, { min:80000, label:"80k – 150k €", rate:0.0179 },
    { min:25000, label:"25k – 80k €", rate:0.0261 }, { min:10000, label:"10k – 25k €", rate:0.0314 },
    { min:5000, label:"5k – 10k €", rate:0.0365 }, { min:0, label:"< 5k €", rate:0.0399 },
  ]},
  other: { label: "Autres catégories", icon: "🔧", tiers: [
    { min:100000, label:"> 100k €", rate:0.0119 }, { min:80000, label:"80k – 100k €", rate:0.0206 },
    { min:25000, label:"25k – 80k €", rate:0.0301 }, { min:10000, label:"10k – 25k €", rate:0.0363 },
    { min:5000, label:"5k – 10k €", rate:0.0421 }, { min:0, label:"< 5k €", rate:0.0488 },
  ]},
};

function calcComm(v, cat="inverters_storage", p="suntrex") {
  const c = SUN_STORE_FEES[cat]||SUN_STORE_FEES.other;
  const tier = c.tiers.find(t=>v>=t.min)||c.tiers[c.tiers.length-1];
  const rate = p==="suntrex" ? tier.rate*DISCOUNT : tier.rate;
  return { rate, ratePct:(rate*100).toFixed(2), amount:Math.round(v*rate*100)/100, tier:tier.label,
    sunstoreRate:tier.rate, sunstoreAmount:Math.round(v*tier.rate*100)/100,
    savings:Math.round(v*tier.rate*(1-DISCOUNT)*100)/100 };
}

// ─── MOCK DATA ──────────────────────────────────────────────────────────
const SELLER_INIT = {
  badge: null, // null | "verified" | "trusted" | "super" — earned, not default
  account_status: "approved", account_type: "Installer",
  range: "Medium (1-10MW annual capacity ; 500k EUR - 5M EUR annual earnings)",
  first_name: "Yohan", last_name: "Dubois",
  email: "yohan.d@qualiwatt.com", phone_prefix: "+33", phone_number: "07 77 22 74 34",
  chat_language: "French",
  company: { country:"France", vat:"FR37853655363", name:"SAS ENERGIE PLUS", bdo_number:"",
    address:"Qualiwatt Énergie Plus\n27 Rue Bosquet\n75 007 Paris\nFrance" },
  invoices: {
    email: "yohan.d@qualiwatt.com",
    unpaid: [],
    paid: [
      { id:"3P_2026/00005710/02/31470", invoice_for:"Stripe (Secure Payment)", amount:479.36,
        billing_date:"2026-03-01", due_date:"2026-03-01", status:"paid",
        transactions: [
          { nr:"OBuWje5X", amount:80.08, date:"2026-02-02" },
          { nr:"D4ROpUpP", amount:78.57, date:"2026-02-04" },
          { nr:"wpT5sgv0", amount:156.29, date:"2026-02-17" },
          { nr:"kj8OZ3Fi", amount:43.15, date:"2026-02-20" },
          { nr:"6pgVaXg9", amount:42.74, date:"2026-02-19" },
          { nr:"wBQrssXX", amount:27.10, date:"2026-02-23" },
          { nr:"VjFPjRet", amount:51.43, date:"2026-02-23" },
        ],
      },
      { id:"3P_2026/00005547/01/31470", invoice_for:"Stripe (Secure Payment)", amount:565.22,
        billing_date:"2026-02-01", due_date:"2026-02-01", status:"paid",
        transactions: [
          { nr:"JTfJW5Kg", amount:312.40, date:"2026-01-15" },
          { nr:"R8mNqL2x", amount:252.82, date:"2026-01-28" },
        ],
      },
      { id:"3P_2025/00005418/12/31470", invoice_for:"Stripe (Secure Payment)", amount:226.12,
        billing_date:"2026-01-01", due_date:"2026-01-01", status:"paid",
        transactions: [
          { nr:"UlsbkzsJ", amount:226.12, date:"2025-12-18" },
        ],
      },
    ],
  },
  out_of_office: { active: false, date: "" },
};

const BADGE_MAP = {
  verified: { label:"Verified Seller", color:T.blue, bg:T.blueLight, border:`${T.blue}20`, dot:T.blue },
  trusted: { label:"Trusted Seller", color:T.green, bg:T.greenSolid, border:T.greenBorder, dot:T.green },
  super: { label:"Super Seller", color:T.orange, bg:T.orangeLight, border:T.orangeBorder, dot:T.orange },
};

const ACCOUNT_TYPES = ["Installer","Distributor","EPC","Developer","Utility","Reseller","Other"];
const RANGES = [
  "Small (< 1MW annual ; < 500k EUR annual)",
  "Medium (1-10MW annual capacity ; 500k EUR - 5M EUR annual earnings)",
  "Large (10-50MW annual ; 5M - 25M EUR annual)",
  "Enterprise (> 50MW annual ; > 25M EUR annual)",
];
const LANGUAGES = [
  {label:"French",flag:"🇫🇷"},{label:"English",flag:"🇬🇧"},{label:"German",flag:"🇩🇪"},
  {label:"Spanish",flag:"🇪🇸"},{label:"Italian",flag:"🇮🇹"},{label:"Dutch",flag:"🇳🇱"},
  {label:"Polish",flag:"🇵🇱"},{label:"Portuguese",flag:"🇵🇹"},
];
const PHONE_CODES = [
  {prefix:"+33",flag:"🇫🇷"},{prefix:"+49",flag:"🇩🇪"},{prefix:"+31",flag:"🇳🇱"},
  {prefix:"+32",flag:"🇧🇪"},{prefix:"+34",flag:"🇪🇸"},{prefix:"+39",flag:"🇮🇹"},
  {prefix:"+43",flag:"🇦🇹"},{prefix:"+41",flag:"🇨🇭"},{prefix:"+48",flag:"🇵🇱"},
  {prefix:"+351",flag:"🇵🇹"},
];
const COUNTRIES = [
  {label:"France",flag:"🇫🇷"},{label:"Germany",flag:"🇩🇪"},{label:"Netherlands",flag:"🇳🇱"},
  {label:"Belgium",flag:"🇧🇪"},{label:"Spain",flag:"🇪🇸"},{label:"Italy",flag:"🇮🇹"},
  {label:"Austria",flag:"🇦🇹"},{label:"Switzerland",flag:"🇨🇭"},{label:"Poland",flag:"🇵🇱"},
  {label:"Portugal",flag:"🇵🇹"},
];

// ═══════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════
function FloatingField({label,value,onChange,disabled,type="text",hint,textarea,style:s}) {
  const [foc,setFoc]=useState(false);
  const has=value!=null&&String(value).length>0;
  const bd=foc?T.borderFocus:T.border; const sh=foc?`0 0 0 3px ${T.orangeLight}`:"none";
  const base={width:"100%",boxSizing:"border-box",border:`1.5px solid ${bd}`,borderRadius:T.r,
    fontSize:14,fontFamily:T.font,color:T.text,background:disabled?"#f9fafb":"#fff",
    outline:"none",transition:"border-color .2s, box-shadow .2s",boxShadow:sh,opacity:disabled?0.65:1};
  return (
    <div style={{position:"relative",...s}}>
      {textarea?(
        <textarea value={value||""} onChange={e=>onChange?.(e.target.value)}
          onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} disabled={disabled}
          style={{...base,padding:"22px 14px 10px",minHeight:110,resize:"vertical"}} />
      ):(
        <input type={type} value={value||""} onChange={e=>onChange?.(e.target.value)}
          onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} disabled={disabled}
          style={{...base,padding:"22px 14px 8px",height:52}} />
      )}
      <span style={{position:"absolute",left:14,top:has||foc?7:16,fontSize:has||foc?10.5:14,
        fontWeight:has||foc?600:400,color:foc?T.orange:has?T.orange:T.textPH,
        pointerEvents:"none",transition:"all .2s"}}>{label}</span>
      {hint&&<div style={{fontSize:11.5,color:T.textDim,marginTop:5,lineHeight:1.4}}>{hint}</div>}
    </div>
  );
}

function FloatingSelect({label,value,onChange,options,disabled,style:s}) {
  const [foc,setFoc]=useState(false);
  return (
    <div style={{position:"relative",...s}}>
      <select value={value||""} onChange={e=>onChange?.(e.target.value)}
        onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} disabled={disabled}
        style={{width:"100%",boxSizing:"border-box",height:52,padding:"22px 36px 8px 14px",
          border:`1.5px solid ${foc?T.borderFocus:T.border}`,borderRadius:T.r,fontSize:14,fontFamily:T.font,
          color:T.text,background:disabled?"#f9fafb":"#fff",outline:"none",
          transition:"border-color .2s, box-shadow .2s",boxShadow:foc?`0 0 0 3px ${T.orangeLight}`:"none",
          appearance:"none",cursor:disabled?"default":"pointer",opacity:disabled?0.65:1,
          textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>
        {options.map((o,i)=>{const v=typeof o==="string"?o:o.value;const l=typeof o==="string"?o:o.label;
          return <option key={i} value={v}>{l}</option>;})}
      </select>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2.5" strokeLinecap="round"
        style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><path d="M6 9l6 6 6-6"/></svg>
      {label&&<span style={{position:"absolute",left:14,top:7,fontSize:10.5,fontWeight:600,color:T.orange,pointerEvents:"none"}}>{label}</span>}
    </div>
  );
}

function Btn({children,onClick,disabled,variant="primary",style:s}) {
  const [h,setH]=useState(false);
  const st=variant==="primary"?{background:disabled?T.textDim:h?T.orangeHover:T.orange,color:"#fff",border:"none",
    boxShadow:h&&!disabled?"0 4px 12px rgba(232,112,10,0.25)":"none"}:
    {background:"transparent",color:T.textSec,border:`1.5px solid ${T.border}`};
  return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 22px",borderRadius:T.r,
      fontSize:13.5,fontWeight:variant==="primary"?700:600,cursor:disabled?"default":"pointer",
      fontFamily:T.font,transition:"all .15s",...st,...s}}>{children}</button>;
}

function Badge({children,color=T.green,bg,border,dot,style:s}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color,
    background:bg||`${color}10`,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${border||`${color}25`}`,
    whiteSpace:"nowrap",...s}}>{dot&&<span style={{width:7,height:7,borderRadius:"50%",background:dot}}/>}{children}</span>;
}

function Toast({message,visible}) {
  return <div style={{position:"fixed",bottom:28,left:"50%",transform:`translateX(-50%) translateY(${visible?0:20}px)`,
    padding:"12px 24px",background:"#1b1e2b",color:"#fff",borderRadius:10,fontSize:13,fontWeight:600,
    fontFamily:T.font,boxShadow:"0 8px 30px rgba(0,0,0,0.18)",opacity:visible?1:0,transition:"all .3s",
    zIndex:999,display:"flex",alignItems:"center",gap:8,pointerEvents:visible?"auto":"none"}}>
    <span style={{width:20,height:20,borderRadius:"50%",background:T.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>✓</span>
    {message}
  </div>;
}

function Link({children}) { return <a href="#" style={{color:T.orange,textDecoration:"none",fontWeight:600}}>{children}</a>; }

// ═══════════════════════════════════════════════════════════════════════
// INVOICE CARD — with expandable transactions + download dropdown
// ═══════════════════════════════════════════════════════════════════════
function InvoiceCard({ inv }) {
  const [expanded, setExpanded] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);
  const dlRef = useRef(null);

  // Close download dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dlRef.current && !dlRef.current.contains(e.target)) setDlOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  const txCount = inv.transactions.length;
  const firstTx = inv.transactions[0];
  const moreTx = txCount > 1 ? txCount - 1 : 0;

  return (
    <div style={{
      background: T.card, borderRadius: T.rl, marginBottom: 12, overflow: "hidden",
      border: expanded ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
      boxShadow: expanded ? "0 4px 20px rgba(37,99,235,0.08)" : T.shadow,
      transition: "border-color .2s, box-shadow .2s",
    }}>
      {/* ── HEADER ROW ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: `1px solid ${T.borderLight}` }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Invoice {inv.id}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Download dropdown */}
          <div ref={dlRef} style={{ position: "relative" }}>
            <button onClick={() => setDlOpen(!dlOpen)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: T.card, border: `1.5px solid ${T.green}`,
              borderRadius: T.r, fontSize: 12.5, fontWeight: 600, color: T.green,
              cursor: "pointer", fontFamily: T.font, transition: "all .15s",
            }}>
              Download
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {dlOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 160,
                background: T.card, border: `1.5px solid ${T.border}`, borderRadius: T.r,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden",
                animation: "fadeIn .15s ease",
              }}>
                <button onClick={() => setDlOpen(false)} style={{
                  width: "100%", padding: "10px 14px", border: "none", background: "transparent",
                  fontSize: 13, fontFamily: T.font, color: T.text, cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                  transition: "background .1s",
                }} onMouseEnter={e => e.currentTarget.style.background = T.bg}
                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: T.green }}>commission...</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Expand/collapse chevron */}
          <button onClick={() => setExpanded(!expanded)} style={{
            width: 34, height: 34, borderRadius: T.r,
            border: `1.5px solid ${expanded ? T.orange : T.border}`,
            background: expanded ? T.orangeLight : T.card,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .2s",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={expanded ? T.orange : T.textDim} strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── SUMMARY ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.7fr 0.9fr 0.9fr 0.6fr 1.3fr",
        padding: "14px 20px", gap: 8, alignItems: "center",
        borderBottom: expanded ? `1px solid ${T.border}` : "none" }}>
        <div>
          <div style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>Invoice for:</div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500, lineHeight: 1.3 }}>{inv.invoice_for}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>Amount</div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 700 }}>{inv.amount.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>Billing date</div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{fmtDate(inv.billing_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>Due date</div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{fmtDate(inv.due_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>Status</div>
          <Badge color={inv.status==="paid"?T.green:T.red} bg={inv.status==="paid"?T.greenSolid:T.redLight}
            border={inv.status==="paid"?T.greenBorder:`${T.red}20`} style={{fontSize:11,padding:"3px 10px"}}>
            {inv.status==="paid"?"Paid":"Unpaid"}
          </Badge>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, marginBottom: 2 }}>
            Transaction{txCount>1?"(s)":""}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {firstTx && (
              <span style={{ display:"inline-flex", padding:"3px 10px", borderRadius:6,
                border:`1.5px solid ${T.greenBorder}`, background:T.greenLight,
                fontSize:11.5, fontWeight:600, fontFamily:T.mono, color:T.green, cursor:"pointer" }}>
                #{firstTx.nr}
              </span>
            )}
            {moreTx > 0 && (
              <span onClick={() => setExpanded(!expanded)} style={{ display:"inline-flex", padding:"3px 10px", borderRadius:6,
                border:`1.5px solid ${T.border}`, background:T.card,
                fontSize:11.5, fontWeight:600, color:T.textSec, cursor:"pointer",
                transition: "all .15s" }}>
                +{moreTx}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── EXPANDED TRANSACTION LIST ── */}
      {expanded && (
        <div style={{ animation: "fadeIn .2s ease" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 80px",
            padding: "10px 20px", gap: 8, background: "#f8fafc",
            borderBottom: `1px solid ${T.border}`,
            fontSize: 10.5, fontWeight: 700, color: T.textDim, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span>#</span><span>Transaction nr.</span><span>Amount</span><span>Date</span><span></span>
          </div>

          {/* Transaction rows */}
          {inv.transactions.map((tx, i) => (
            <div key={tx.nr} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 80px",
              padding: "12px 20px", gap: 8, alignItems: "center",
              borderBottom: i < inv.transactions.length - 1 ? `1px solid ${T.borderLight}` : "none",
              fontSize: 13.5, transition: "background .1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ color: T.textDim, fontWeight: 600, fontSize: 13 }}>{i + 1}.</span>
              <span style={{ fontWeight: 500, color: T.text }}>
                <span style={{ color: T.textDim, fontSize: 12 }}>Transaction nr. </span>
                <span style={{ fontWeight: 700, fontFamily: T.mono }}>{tx.nr}</span>
              </span>
              <span style={{ fontWeight: 500, color: T.text }}>
                <span style={{ color: T.textDim, fontSize: 12 }}>Amount: </span>
                <span style={{ fontWeight: 700 }}>{tx.amount.toFixed(2)}</span>
              </span>
              <span style={{ fontWeight: 500, color: T.text }}>
                <span style={{ color: T.textDim, fontSize: 12 }}>Date: </span>
                <span style={{ fontWeight: 600 }}>{fmtDate(tx.date)}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <a href="#" style={{ color: T.blue, fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 3 }}>
                  Details
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </a>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 1: ACCOUNT DETAILS
// ═══════════════════════════════════════════════════════════════════════
function AccountTab({ seller, upd }) {
  const [toast, setToast] = useState(false);
  const b = seller.badge ? BADGE_MAP[seller.badge] : null;

  return (
    <div style={{ maxWidth: 660 }}>
      {b && <div style={{ marginBottom: 14 }}><Badge color={b.color} bg={b.bg} border={b.border} dot={b.dot}>{b.label}</Badge></div>}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 16px" }}>My profile</h2>
      <Badge color={T.green} bg={T.greenSolid} border={T.greenBorder} style={{ marginBottom: 28 }}>
        Your account status: Approved to sell
      </Badge>

      <div style={{ marginBottom: 26 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>Account type</h3>
        <FloatingSelect label="Account type" value={seller.account_type} onChange={v=>upd("account_type",v)} options={ACCOUNT_TYPES}/>
      </div>

      <div style={{ marginBottom: 26 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>Range</h3>
        <FloatingSelect label="Range" value={seller.range} onChange={v=>upd("range",v)} options={RANGES}/>
      </div>

      <div style={{ marginBottom: 26 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>Details</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <FloatingField label="Name" value={seller.first_name} onChange={v=>upd("first_name",v)} />
          <FloatingField label="Surname" value={seller.last_name} onChange={v=>upd("last_name",v)} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:4 }}>
          <FloatingField label="Email" value={seller.email} disabled hint={<span>To change the email address <Link>contact SUNTREX</Link></span>} />
          <div style={{ display:"grid", gridTemplateColumns:"105px 1fr", gap:8 }}>
            <FloatingSelect label="Code" value={seller.phone_prefix} onChange={v=>upd("phone_prefix",v)}
              options={PHONE_CODES.map(c=>({value:c.prefix,label:`${c.flag} ${c.prefix}`}))} />
            <FloatingField label="Phone number" value={seller.phone_number} onChange={v=>upd("phone_number",v)} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>Negotiation chat language</h3>
        <FloatingSelect label="" value={seller.chat_language} onChange={v=>upd("chat_language",v)}
          options={LANGUAGES.map(l=>({value:l.label,label:`${l.flag} ${l.label}`}))} />
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 6, lineHeight: 1.5 }}>
          All the messages in the chat will be automatically translated to the language defined in your profile.
        </div>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={()=>{setToast(true);setTimeout(()=>setToast(false),2500)}}>Save changes</Btn>
        <Btn variant="ghost">Cancel</Btn>
      </div>
      <Toast message="Profile saved successfully" visible={toast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2: PASSWORD
// ═══════════════════════════════════════════════════════════════════════
function PasswordTab() {
  const [old,setOld]=useState(""); const [pw,setPw]=useState(""); const [c,setC]=useState("");
  const [show,setShow]=useState(false); const [toast,setToast]=useState(false);
  const valid=old.length>0&&pw.length>=8&&pw===c;
  return (
    <div style={{ maxWidth:420 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:T.text, margin:"0 0 24px" }}>Profile Password</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
        <FloatingField label="Old password" value={old} onChange={setOld} type={show?"text":"password"} />
        <FloatingField label="New password" value={pw} onChange={setPw} type={show?"text":"password"}
          hint={pw.length>0&&pw.length<8?<span style={{color:T.red}}>Minimum 8 characters</span>:null} />
        <FloatingField label="Confirm password" value={c} onChange={setC} type={show?"text":"password"}
          hint={c.length>0&&pw!==c?<span style={{color:T.red}}>Passwords do not match</span>:null} />
      </div>
      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:T.textSec, cursor:"pointer", marginBottom:22 }}>
        <input type="checkbox" checked={show} onChange={()=>setShow(!show)} style={{accentColor:T.orange}} /> Show passwords
      </label>
      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={()=>{if(valid){setToast(true);setOld("");setPw("");setC("");setTimeout(()=>setToast(false),2500)}}} disabled={!valid}>Save changes</Btn>
        <Btn variant="ghost" onClick={()=>{setOld("");setPw("");setC("")}}>Cancel</Btn>
      </div>
      <Toast message="Password updated" visible={toast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3: COMPANY
// ═══════════════════════════════════════════════════════════════════════
function CompanyTab({ seller, upd }) {
  const [toast,setToast]=useState(false);
  const co=seller.company; const updCo=(k,v)=>upd("company",{...co,[k]:v});
  return (
    <div style={{ maxWidth:540 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:T.text, margin:"0 0 24px" }}>Company details</h2>
      <div style={{ marginBottom:18 }}>
        <FloatingSelect label="Company registration country" value={co.country} disabled
          options={COUNTRIES.map(c=>({value:c.label,label:`${c.flag} ${c.label}`}))} />
        <div style={{ fontSize:11.5, color:T.textDim, marginTop:5 }}>To change country <Link>contact SUNTREX</Link></div>
      </div>
      <div style={{ marginBottom:18 }}>
        <FloatingField label="VAT" value={co.vat} disabled />
        <div style={{ fontSize:11.5, color:T.textDim, marginTop:5 }}>To change VAT ID <Link>contact SUNTREX</Link></div>
      </div>
      <div style={{ marginBottom:18 }}>
        <FloatingField label="Company name" value={co.name} disabled />
        <div style={{ fontSize:11.5, color:T.textDim, marginTop:5 }}>To change company name <Link>contact SUNTREX</Link></div>
      </div>
      <div style={{ marginBottom:18 }}>
        <FloatingField label="BDO Number" value={co.bdo_number} onChange={v=>updCo("bdo_number",v)} />
      </div>
      <div style={{ marginBottom:28 }}>
        <FloatingField label="Address" value={co.address} onChange={v=>updCo("address",v)} textarea />
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Btn onClick={()=>{setToast(true);setTimeout(()=>setToast(false),2500)}}>Save changes</Btn>
        <Btn variant="ghost">Cancel</Btn>
      </div>
      <Toast message="Company details saved" visible={toast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 4: INVOICES & FEES
// ═══════════════════════════════════════════════════════════════════════
function InvoicesTab({ seller, upd }) {
  const [subTab,setSubTab]=useState("unpaid");
  const [toast,setToast]=useState(false);
  const [showFees,setShowFees]=useState(false);
  const [simCat,setSimCat]=useState("inverters_storage");
  const [simVal,setSimVal]=useState(25000);
  const [sort,setSort]=useState("newest");

  const r=calcComm(simVal,simCat,"suntrex"); const rs=calcComm(simVal,simCat,"sunstore");
  const invoices=subTab==="unpaid"?seller.invoices.unpaid:seller.invoices.paid;
  const sorted=[...invoices].sort((a,b)=>sort==="newest"?new Date(b.billing_date)-new Date(a.billing_date):new Date(a.billing_date)-new Date(b.billing_date));

  return (
    <div style={{ maxWidth:760 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:T.text, margin:0 }}>Invoices & Fees</h2>
        <button onClick={()=>setShowFees(!showFees)} style={{
          display:"flex", alignItems:"center", gap:7, padding:"9px 18px",
          background:T.card, border:`1.5px solid ${T.border}`, borderRadius:T.r,
          fontSize:13, fontWeight:600, color:T.text, cursor:"pointer", fontFamily:T.font, boxShadow:T.shadow }}>
          Fees T&C
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
        </button>
      </div>

      <Badge color={T.green} bg={T.greenSolid} border={T.greenBorder} style={{ marginBottom:22 }}>
        Your account status: Approved to sell
      </Badge>

      <div style={{ marginBottom:22 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
          Email address where invoices will be sent
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div style={{ maxWidth:300 }}>
          <FloatingField label="Email" value={seller.invoices.email} onChange={v=>upd("invoices",{...seller.invoices,email:v})} />
        </div>
        <Btn onClick={()=>{setToast(true);setTimeout(()=>setToast(false),2500)}} style={{ marginTop:12 }}>Save changes</Btn>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex", borderBottom:`2px solid ${T.borderLight}`, marginBottom:18 }}>
        {["unpaid","paid"].map(t=>(
          <button key={t} onClick={()=>setSubTab(t)} style={{
            padding:"12px 22px", border:"none",
            borderBottom:subTab===t?`2.5px solid ${T.blue}`:"2.5px solid transparent",
            background:"transparent", cursor:"pointer", fontFamily:T.font, fontSize:14,
            fontWeight:subTab===t?700:500, color:subTab===t?T.text:T.textSec, transition:"all .15s",
            display:"flex", alignItems:"center", gap:5 }}>
            {t==="unpaid"?"Unpaid":"Paid"}
            {t==="paid"&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>}
          </button>
        ))}
      </div>

      {invoices.length>0&&(
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{
            padding:"7px 30px 7px 14px", border:`1.5px solid ${T.border}`, borderRadius:T.r,
            fontSize:12.5, fontFamily:T.font, color:T.textSec, background:T.card,
            cursor:"pointer", outline:"none", appearance:"none",
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%239ca3af'%3E%3Cpath d='M2 3l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center" }}>
            <option value="newest">Sort from newest</option>
            <option value="oldest">Sort from oldest</option>
          </select>
        </div>
      )}

      {invoices.length===0?(
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ position:"relative", display:"inline-block", marginBottom:14 }}>
            <div style={{ fontSize:52 }}>🎉</div>
            <div style={{ position:"absolute", top:-10, left:-25, width:130, height:65, overflow:"hidden", pointerEvents:"none" }}>
              {Array.from({length:16}).map((_,i)=>(
                <div key={i} style={{ position:"absolute", left:`${8+Math.random()*84}%`, top:`${Math.random()*100}%`,
                  width:Math.random()*7+2, height:Math.random()*7+2,
                  background:[T.orange,T.green,T.blue,"#7c3aed","#d97706",T.red,"#06b6d4","#ec4899"][i%8],
                  borderRadius:Math.random()>0.5?"50%":"1px",
                  transform:`rotate(${Math.random()*360}deg)`, opacity:0.65 }}/>))}
            </div>
          </div>
          <h3 style={{ fontSize:19, fontWeight:800, color:T.text, margin:"0 0 8px" }}>All your payments are up to date!</h3>
          <p style={{ fontSize:14, color:T.textSec, lineHeight:1.6, maxWidth:420, margin:"0 auto" }}>
            Great news! You have no outstanding invoices to worry about. Your financials are all sorted, so sit back, relax, and enjoy selling on SUNTREX.
          </p>
        </div>
      ):(
        <div>
          {sorted.map(inv=><InvoiceCard key={inv.id} inv={inv} />)}
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginTop:18 }}>
            <button style={{ width:32, height:32, borderRadius:T.r, border:`1.5px solid ${T.border}`, background:T.card, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <input value="1" readOnly style={{ width:40, height:32, textAlign:"center", border:`1.5px solid ${T.border}`, borderRadius:T.r, fontSize:13, fontFamily:T.font, color:T.text, outline:"none" }} />
            <span style={{ fontSize:13, color:T.textSec }}>of 1</span>
            <button style={{ width:32, height:32, borderRadius:T.r, border:`1.5px solid ${T.border}`, background:T.card, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ━━━ FEES T&C ━━━ */}
      {showFees&&(
        <div style={{ marginTop:28, animation:"fadeIn .3s ease" }}>
          <div style={{ height:1, background:T.border, margin:"0 0 24px" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
            <div>
              <h3 style={{ fontSize:17, fontWeight:800, color:T.text, margin:0 }}>Commission Tables — SUNTREX</h3>
              <p style={{ fontSize:11.5, color:T.textSec, margin:"4px 0 0" }}>Appendix 2 — Fees T&C (01.01.2026). SUNTREX = -5% on every tier.</p>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Badge color={T.green} bg={T.greenLight} border={T.greenBorder} dot={T.green}>-5% vs sun.store</Badge>
              <Badge color={T.orange} bg={T.orangeLight} border={T.orangeBorder}>€0 minimum/month</Badge>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
            {Object.entries(SUN_STORE_FEES).map(([key,cat])=>(
              <div key={key} style={{ borderRadius:T.rl, border:`1px solid ${T.border}`, overflow:"hidden" }}>
                <div style={{ padding:"11px 16px", background:T.bg, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ fontSize:17 }}>{cat.icon}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{cat.label}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 100px 80px", padding:"8px 16px", gap:8, borderBottom:`1px solid ${T.borderLight}`, fontSize:10, fontWeight:700, color:T.textDim, textTransform:"uppercase", letterSpacing:"0.04em" }}>
                  <span>Transaction value</span>
                  <span style={{ textAlign:"right", textDecoration:"line-through", opacity:0.5 }}>sun.store</span>
                  <span style={{ textAlign:"right", color:T.orange }}>SUNTREX</span>
                  <span style={{ textAlign:"right", color:T.green }}>You save</span>
                </div>
                {cat.tiers.map((tier,i)=>(
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 100px 100px 80px", padding:"9px 16px", gap:8, borderBottom:i<cat.tiers.length-1?`1px solid ${T.borderLight}`:"none", fontSize:13, alignItems:"center" }}>
                    <span style={{ color:T.text, fontWeight:500 }}>{tier.label}</span>
                    <span style={{ textAlign:"right", color:T.textDim, textDecoration:"line-through", fontFamily:T.mono, fontSize:12 }}>{(tier.rate*100).toFixed(2)}%</span>
                    <span style={{ textAlign:"right", color:T.orange, fontWeight:800, fontFamily:T.mono, fontSize:12.5 }}>{(tier.rate*DISCOUNT*100).toFixed(2)}%</span>
                    <span style={{ textAlign:"right", color:T.green, fontWeight:700, fontFamily:T.mono, fontSize:11.5 }}>-{((tier.rate-tier.rate*DISCOUNT)*100).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding:"14px 20px", background:"linear-gradient(135deg, #0f172a, #1e293b)", borderRadius:T.rl, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Monthly minimum fee</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:3 }}>sun.store: €5/month minimum per seller — even zero sales (§3.2)</div>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              <div style={{ textAlign:"center" }}><div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontWeight:600 }}>sun.store</div><div style={{ fontSize:20, fontWeight:800, color:"#ef4444", textDecoration:"line-through" }}>€5</div></div>
              <div style={{ width:1, height:28, background:"rgba(255,255,255,0.1)" }} />
              <div style={{ textAlign:"center" }}><div style={{ fontSize:9, color:T.orange, fontWeight:700 }}>SUNTREX</div><div style={{ fontSize:20, fontWeight:800, color:T.green }}>€0</div></div>
            </div>
          </div>
          <div style={{ padding:20, background:T.orangeLight, borderRadius:T.rl, border:`1.5px solid ${T.orangeBorder}` }}>
            <h4 style={{ fontSize:14, fontWeight:800, color:T.text, margin:"0 0 14px" }}>🧮 Commission simulator</h4>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textSec, display:"block", marginBottom:5 }}>Product category</label>
                <select value={simCat} onChange={e=>setSimCat(e.target.value)} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${T.border}`, borderRadius:T.r, fontSize:13, fontFamily:T.font, color:T.text, background:"#fff", cursor:"pointer", outline:"none", boxSizing:"border-box" }}>
                  {Object.entries(SUN_STORE_FEES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textSec, display:"block", marginBottom:5 }}>Net value (€)</label>
                <input type="number" value={simVal} onChange={e=>setSimVal(Number(e.target.value)||0)} style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${T.border}`, borderRadius:T.r, fontSize:13, fontFamily:T.mono, color:T.text, outline:"none", boxSizing:"border-box", background:"#fff" }} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[
                {l:"SUNTREX rate",v:`${r.ratePct}%`,s:r.tier,c:T.orange,bg:"#fff",bd:T.orangeBorder},
                {l:"SUNTREX fee",v:`€${r.amount.toLocaleString("fr-FR",{minimumFractionDigits:2})}`,s:`Net: €${(simVal-r.amount).toLocaleString("fr-FR",{minimumFractionDigits:2})}`,c:T.orange,bg:"#fff",bd:T.orangeBorder},
                {l:"sun.store fee",v:`€${rs.sunstoreAmount.toLocaleString("fr-FR",{minimumFractionDigits:2})}`,s:`${(rs.sunstoreRate*100).toFixed(2)}%`,c:T.textDim,bg:"#f8f9fa",bd:T.border,x:true},
                {l:"You save",v:`€${r.savings.toLocaleString("fr-FR",{minimumFractionDigits:2})}`,s:"per transaction",c:T.green,bg:T.greenLight,bd:T.greenBorder},
              ].map((c,i)=>(
                <div key={i} style={{ padding:"12px 14px", background:c.bg, borderRadius:T.r, border:`1.5px solid ${c.bd}` }}>
                  <div style={{ fontSize:9.5, color:T.textDim, fontWeight:600, textDecoration:c.x?"line-through":"none" }}>{c.l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:c.c, textDecoration:c.x?"line-through":"none", margin:"2px 0" }}>{c.v}</div>
                  <div style={{ fontSize:10, color:c.x?T.textDim:c.c, fontWeight:500 }}>{c.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toast message="Invoice email updated" visible={toast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 5: OUT OF OFFICE
// ═══════════════════════════════════════════════════════════════════════
function OOOTab({ seller, upd }) {
  const [toast,setToast]=useState(false);
  const ooo=seller.out_of_office;
  const toggle=()=>{upd("out_of_office",{...ooo,active:!ooo.active});setToast(true);setTimeout(()=>setToast(false),2500)};
  return (
    <div style={{ maxWidth:420 }}>
      <h2 style={{ fontSize:22, fontWeight:800, color:T.text, margin:"0 0 8px" }}>Out of office mode</h2>
      <p style={{ fontSize:14, color:T.textSec, margin:"0 0 24px", lineHeight:1.5 }}>Activate out of office status to notify buyers of your absence.</p>
      {ooo.active&&<div style={{ padding:"12px 16px", background:T.orangeLight, border:`1.5px solid ${T.orangeBorder}`, borderRadius:T.r, marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:16 }}>🌴</span><span style={{ fontSize:13, fontWeight:700, color:T.orange }}>Out of office mode is ON</span>
      </div>}
      <label style={{ fontSize:14, fontWeight:600, color:T.text, display:"block", marginBottom:8 }}>I will be on holiday:</label>
      <input type="date" value={ooo.date||""} onChange={e=>upd("out_of_office",{...ooo,date:e.target.value})}
        style={{ padding:"10px 14px", border:`1.5px solid ${T.border}`, borderRadius:T.r, fontSize:14, fontFamily:T.font, color:T.text, outline:"none", cursor:"pointer", marginBottom:20 }} />
      <div><Btn onClick={toggle} style={{ background:ooo.active?T.textDim:T.orange }}>{ooo.active?"Switch off":"Switch on"}</Btn></div>
      <Toast message={ooo.active?"Out of office activated":"Out of office deactivated"} visible={toast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
const TABS=[{id:"account",label:"Account details"},{id:"password",label:"Password"},{id:"company",label:"Company details"},{id:"invoices",label:"Invoices & Fees"},{id:"ooo",label:"Out of office mode"}];

export default function SellerProfile() {
  const [tab,setTab]=useState("account");
  const [seller,setSeller]=useState(SELLER_INIT);
  const [hov,setHov]=useState(null);
  const upd=(k,v)=>setSeller(p=>({...p,[k]:v}));

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:"100vh", display:"flex", justifyContent:"center", paddingTop:28, paddingBottom:80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        input:focus,select:focus,textarea:focus{border-color:${T.borderFocus}!important;box-shadow:0 0 0 3px ${T.orangeLight}!important}
        a:hover{text-decoration:underline!important}
      `}</style>
      <div style={{ width:"100%", maxWidth:840, margin:"0 20px", background:T.card, borderRadius:T.rxl, border:`1px solid ${T.border}`, boxShadow:T.shadow, overflow:"hidden" }}>
        <div style={{ display:"flex", borderBottom:`1.5px solid ${T.borderLight}`, padding:"0 4px", overflowX:"auto" }}>
          {TABS.map(t=>{const a=tab===t.id;const h=hov===t.id;return(
            <button key={t.id} onClick={()=>setTab(t.id)} onMouseEnter={()=>setHov(t.id)} onMouseLeave={()=>setHov(null)}
              style={{ padding:"16px 22px", border:"none", borderBottom:a?`2.5px solid ${T.blue}`:"2.5px solid transparent",
                background:h&&!a?"#f8f9fa":"transparent", cursor:"pointer", fontFamily:T.font, fontSize:14,
                fontWeight:a?700:500, color:a?T.text:T.textSec, transition:"all .15s", whiteSpace:"nowrap", flexShrink:0 }}>
              {t.label}</button>);})}
        </div>
        <div style={{ padding:"28px 36px", animation:"fadeIn .25s ease-out", minHeight:400 }}>
          {tab==="account"&&<AccountTab seller={seller} upd={upd}/>}
          {tab==="password"&&<PasswordTab/>}
          {tab==="company"&&<CompanyTab seller={seller} upd={upd}/>}
          {tab==="invoices"&&<InvoicesTab seller={seller} upd={upd}/>}
          {tab==="ooo"&&<OOOTab seller={seller} upd={upd}/>}
        </div>
      </div>
    </div>
  );
}
