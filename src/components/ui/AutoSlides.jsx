import { useState, useEffect, useRef } from "react";
import AM from "../../AnimatedMockups";

export default function AutoSlides({ slides, cur, set }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {threshold:0.3});
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => set(c => (c + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [visible, slides.length, set]);

  return (
    <div ref={ref}>
      <div style={{display:"flex"}}>{slides.map((s,i)=>(
        <button key={i} onClick={()=>set(i)} style={{flex:1,padding:"14px 12px",fontSize:13,fontWeight:cur===i?600:400,color:cur===i?"#4CAF50":"#7b7b7b",background:"none",border:"none",borderBottom:cur===i?"3px solid #4CAF50":"3px solid #e4e5ec",cursor:"pointer",textAlign:"left",lineHeight:1.4,fontFamily:"inherit"}}>
          <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:20,height:20,borderRadius:"50%",marginRight:8,background:cur===i?"#4CAF50":"#e4e5ec",color:cur===i?"#fff":"#999",fontSize:11,fontWeight:700}}>{i+1}</span>{s.label}
        </button>
      ))}</div>
      <div key={cur} className="fade-in" style={{background:"#fff",borderRadius:"0 0 12px 12px",border:"1px solid #e4e5ec",borderTop:"none",padding:32,minHeight:360}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:32,alignItems:"center"}}>
          <div><h3 style={{fontSize:20,fontWeight:700,marginBottom:12}}>{slides[cur].label}</h3><p style={{fontSize:14,color:"#7b7b7b",lineHeight:1.6}}>{slides[cur].desc}</p></div>
          <AM type={slides[cur].m}/>
        </div>
      </div>
    </div>
  );
}
