import { useState } from "react";

const S = {
  filterSection: { borderBottom:"1px solid #e8e8e8", paddingBottom:14, marginBottom:14 },
  filterTitle: { fontSize:13, fontWeight:600, color:"#333", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" },
  checkbox: { width:16, height:16, borderRadius:3, border:"1.5px solid #ccc", cursor:"pointer", accentColor:"#E8700A" },
};

const Chev = ({open}) => (
  <svg width="12" height="12" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}} fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
);

export function FilterSection({ title, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.filterSection}>
      <div style={S.filterTitle} onClick={()=>setOpen(!open)}>{title} <Chev open={open}/></div>
      {open && <div style={{paddingTop:8}}>{children}</div>}
    </div>
  );
}

export function CheckFilter({ items, selected, onToggle }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {items.map(item => (
        <label key={item} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#444",cursor:"pointer"}}>
          <input type="checkbox" checked={selected.includes(item)} onChange={()=>onToggle(item)} style={S.checkbox}/>
          {item}
        </label>
      ))}
    </div>
  );
}
