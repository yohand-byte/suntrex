import { useState } from "react";

const S = {
  filterSection: { borderBottom:"1px solid #e8e8e8", paddingBottom:14, marginBottom:14 },
  filterTitle: { fontSize:13, fontWeight:600, color:"#333", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0" },
  checkbox: { width:16, height:16, borderRadius:3, border:"1.5px solid #ccc", cursor:"pointer", accentColor:"#E8700A", flexShrink:0 },
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
  const [search, setSearch] = useState("");
  const THRESHOLD = 8;
  const MAX_H = 240;

  const needsSearch = items.length > THRESHOLD;
  const q = search.toLowerCase().trim();
  const filtered = q ? items.filter(item => item.toLowerCase().includes(q)) : items;

  // Selected first, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    const aS = selected.includes(a) ? 0 : 1;
    const bS = selected.includes(b) ? 0 : 1;
    if (aS !== bS) return aS - bS;
    return a.localeCompare(b);
  });

  return (
    <div>
      {needsSearch && (
        <div style={{position:"relative", marginBottom:8}}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={"Rechercher (" + items.length + ")…"}
            style={{
              width:"100%", padding:"7px 10px 7px 30px", border:"1px solid #e0e0e0",
              borderRadius:6, fontSize:12, color:"#333", outline:"none",
              background:"#fafafa", boxSizing:"border-box",
            }}
            onFocus={e => { e.target.style.borderColor = "#E8700A"; e.target.style.background = "#fff"; }}
            onBlur={e => { e.target.style.borderColor = "#e0e0e0"; e.target.style.background = "#fafafa"; }}
          />
          <span style={{position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#aaa", pointerEvents:"none"}}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", fontSize:14, color:"#aaa", cursor:"pointer", padding:2}}
            >✕</button>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{fontSize:11, color:"#E8700A", fontWeight:600, marginBottom:6}}>
          {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
        </div>
      )}

      <div style={{
        display:"flex", flexDirection:"column", gap:4,
        ...(needsSearch ? { maxHeight: MAX_H, overflowY:"auto", paddingRight:4 } : {}),
      }}>
        {sorted.length === 0 && (
          <div style={{fontSize:12, color:"#aaa", padding:"8px 0", textAlign:"center"}}>
            Aucun résultat pour "{search}"
          </div>
        )}
        {sorted.map(item => {
          const isSelected = selected.includes(item);
          return (
            <label
              key={item}
              style={{
                display:"flex", alignItems:"center", gap:8, fontSize:12, color: isSelected ? "#333" : "#555",
                cursor:"pointer", padding:"3px 4px", borderRadius:4,
                background: isSelected ? "#fff7ed" : "transparent",
                fontWeight: isSelected ? 600 : 400,
                transition:"background .15s",
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f5f5f5"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
            >
              <input type="checkbox" checked={isSelected} onChange={()=>onToggle(item)} style={S.checkbox}/>
              <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item}</span>
            </label>
          );
        })}
      </div>

      {needsSearch && sorted.length > THRESHOLD && (
        <div style={{fontSize:10, color:"#bbb", textAlign:"center", marginTop:4, borderTop:"1px solid #f0f0f0", paddingTop:4}}>
          ↕ {sorted.length} éléments
        </div>
      )}
    </div>
  );
}
