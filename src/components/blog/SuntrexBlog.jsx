import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

// ═══════════════════════════════════════════════════════════════════
// SUNTREX BLOG v3 — REAL PHOTOS + SUPABASE + AI + SEO + RSS
// ═══════════════════════════════════════════════════════════════════

const T = {
  font: "'DM Sans', -apple-system, sans-serif",
  fontDisplay: "'Instrument Serif', Georgia, serif",
  fontMono: "'JetBrains Mono', monospace",
  bg: "#FAFAF7", bgWarm: "#F5F0E8", surface: "#FFFFFF", card: "#FFFFFF",
  border: "#E8E4DC", borderLight: "#F0EDE6",
  text: "#1A1A18", textBody: "#3D3D3A", textMuted: "#8A8A85", textDim: "#B5B5B0",
  orange: "#E8700A", orangeHover: "#D4630A",
  orangeLight: "rgba(232,112,10,0.06)", orangeGlow: "rgba(232,112,10,0.12)",
  amber: "#C5870F", amberLight: "rgba(197,135,15,0.08)",
  green: "#2D8F3E", greenLight: "rgba(45,143,62,0.08)",
  blue: "#1B6EC2", blueLight: "rgba(27,110,194,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.04)", shadowMd: "0 4px 20px rgba(0,0,0,0.06)",
  radius: 8, radiusLg: 16, radiusXl: 24,
};

const useResponsive = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024, w };
};

// ─── PHOTO LIBRARY (Unsplash — free commercial, no attribution needed) ──
const IMG = {
  solarFarm: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80",
  solarRoof: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=900&q=80",
  solarClose: "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=900&q=80",
  inverter: "https://images.unsplash.com/photo-1592833159117-ac62bc51e9be?w=900&q=80",
  battery: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=900&q=80",
  europe: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=900&q=80",
  tradeshow: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80",
  techPanel: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=900&q=80",
  installer: "https://images.unsplash.com/photo-1611365892117-bede7a956b3a?w=900&q=80",
  regulation: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80",
  team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80",
  aiTech: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900&q=80",
  warehouse: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=80",
  heroMain: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1400&q=85",
};

const CATEGORIES = [
  { id: "all", label: "Tout", icon: "◉" },
  { id: "market", label: "Marché", icon: "📊" },
  { id: "tech", label: "Technologie", icon: "⚡" },
  { id: "guides", label: "Guides", icon: "📖" },
  { id: "brand", label: "Produits", icon: "🏷️" },
  { id: "regulation", label: "Réglementation", icon: "⚖️" },
  { id: "suntrex", label: "SUNTREX", icon: "☀️" },
];
const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
const formatDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// ─── ARTICLES WITH REAL PHOTOS ────────────────────────────────────
const SEED_ARTICLES = [
  {
    id: "a1", slug: "european-solar-market-2026",
    title: "Marché solaire européen 2026 : les 5 tendances qui redessinent le secteur",
    excerpt: "L'UE atteint 406 GW mais la contraction résidentielle et les CFD transforment le paysage.",
    category: "market", author_name: "SUNTREX Research", author_avatar: "S",
    date: "2026-02-28", read_time: 8, featured: true, published: true,
    tags: ["Europe", "Tendances", "CFD", "Stockage"],
    image: IMG.solarFarm,
    overlay: "linear-gradient(135deg, rgba(26,58,92,0.82) 0%, rgba(232,145,10,0.65) 100%)",
    seo_title: "Marché solaire européen 2026 | SUNTREX Blog",
    seo_description: "Analyse des 5 tendances majeures du marché solaire européen en 2026.",
    reactions: { "☀️": 24, "🔥": 18, "💡": 12 }, comments_count: 7,
    content: `Le marché solaire européen entre dans une phase de maturation. Avec 65,1 GW installés en 2025 selon SolarPower Europe, l'UE a franchi les 400 GW cumulatifs. Mais pour la première fois depuis 2016, le marché s'est légèrement contracté (-0,7%).\n\n**1. Contraction du résidentiel**\n\nLe résidentiel passe de 28% (2023) à 14% (2025). Le C&I et l'utility-scale deviennent les moteurs.\n\n**2. Hybride PV + stockage**\n\nÀ 70$/kWh (BloombergNEF), l'intégration batteries devient incontournable.\n\n**3. CFD remplacent les tarifs de rachat**\n\nFin EEG en Allemagne fin 2026. Les CFD sécurisent les revenus partout en Europe.\n\n**4. Capacité mondiale 3 TW**\n\nDéfis d'intégration réseau inédits.\n\n**5. Oversupply = prix bas**\n\nModules sous 0,09€/Wp. Équipements premium à prix historiquement bas sur SUNTREX.`,
  },
  {
    id: "a2", slug: "huawei-vs-deye-2026",
    title: "Huawei SUN2000 vs Deye Hybrid : le comparatif onduleurs 2026",
    excerpt: "Deux philosophies, deux gammes de prix. Analyse pour installateurs professionnels.",
    category: "brand", author_name: "SUNTREX Tech", author_avatar: "T",
    date: "2026-02-25", read_time: 12, featured: true, published: true,
    tags: ["Huawei", "Deye", "Onduleurs", "Comparatif"],
    image: IMG.inverter,
    overlay: "linear-gradient(135deg, rgba(228,0,43,0.75) 0%, rgba(0,104,183,0.75) 100%)",
    seo_title: "Huawei vs Deye : comparatif onduleurs 2026 | SUNTREX",
    seo_description: "Comparatif Huawei SUN2000 vs Deye Hybrid pour installateurs.",
    reactions: { "⚡": 31, "🔥": 22, "💡": 15 }, comments_count: 14,
    content: `Pour un installateur, le choix onduleur est stratégique. Deux marques dominent en Europe 2026.\n\n**Huawei SUN2000 — référence premium**\n\nRendement 98,6%. FusionSolar app. Taux panne < 0,5%. Sur SUNTREX: 479€ (3kW) à 1 249€ (10kW).\n\n**Deye Hybrid — meilleur rapport qualité-prix**\n\nRendement 97,8%. Hybride natif. -20% vs Huawei. SAV européen en structuration.\n\n**Verdict** : Premium résidentiel → Huawei. C&I prix + hybridation → Deye. Comparez sur SUNTREX.`,
  },
  {
    id: "a3", slug: "guide-batteries-stockage-2026",
    title: "Guide d'achat batteries 2026 : LFP, dimensionnement, prix",
    excerpt: "70$/kWh pour le stockage. LFP vs NMC, marques fiables, règles d'or.",
    category: "guides", author_name: "SUNTREX Academy", author_avatar: "A",
    date: "2026-02-20", read_time: 15, featured: false, published: true,
    tags: ["Batteries", "LFP", "Stockage", "Guide"],
    image: IMG.battery,
    overlay: "linear-gradient(135deg, rgba(26,90,166,0.82) 0%, rgba(197,135,15,0.7) 100%)",
    seo_title: "Guide batteries 2026 : LFP, prix | SUNTREX",
    seo_description: "Guide complet batteries 2026 : LFP vs NMC, Huawei LUNA, BYD.",
    reactions: { "📖": 19, "💡": 28, "☀️": 8 }, comments_count: 9,
    content: `Le stockage n'est plus optionnel. Prix 2026 : 70$/kWh.\n\n**LFP vs NMC : le match est joué**\n\nLFP gagne. 6000+ cycles, sans cobalt, plus sûr. 85%+ du marché Europe.\n\n**Sur SUNTREX**\n\n• Huawei LUNA2000 — référence premium\n• BYD Battery-Box — modularité\n• Pylontech — prix/capacité imbattable\n• Deye BOS-G — hybridation native\n\n**Dimensionnement** : 1 kWh / 1 kWc résidentiel. +20% marge dégradation.`,
  },
  {
    id: "a4", slug: "n-type-topcon-revolution",
    title: "N-type TOPCon : pourquoi vos panneaux PERC sont déjà obsolètes",
    excerpt: "70% des livraisons mondiales. Jinko Tiger Neo, Trina Vertex, LONGi Hi-MO X.",
    category: "tech", author_name: "SUNTREX Research", author_avatar: "S",
    date: "2026-02-15", read_time: 10, featured: false, published: true,
    tags: ["N-type", "TOPCon", "Panneaux", "Technologie"],
    image: IMG.solarClose,
    overlay: "linear-gradient(135deg, rgba(10,22,40,0.82) 0%, rgba(232,112,10,0.7) 100%)",
    seo_title: "N-type TOPCon 2026 : fin du PERC | SUNTREX",
    seo_description: "Révolution N-type TOPCon 2026 : rendement 25.5%, leaders du marché.",
    reactions: { "⚡": 45, "🔥": 33, "💡": 21 }, comments_count: 18,
    content: `N-type TOPCon = 70%+ des livraisons mondiales en 2026.\n\n**Pourquoi le N-type gagne**\n\nRendement 25,5%+ vs 23,5% PERC. Coeff temp -0,29%/°C. Bifacialité +5-15%.\n\n**Leaders SUNTREX**\n\n1. Jinko Tiger Neo — N°1 mondial\n2. Trina Vertex N — Zero Busbar\n3. LONGi Hi-MO X — back-contact record\n4. Canadian Solar TOPBiHiKu\n5. Risen Titan — prix agressif\n\nModules 600W+ utility, 440W+ résidentiel. Moins de modules/kWc = meilleure marge.`,
  },
  {
    id: "a5", slug: "reglementation-pv-france-2026",
    title: "Réglementation PV France 2026 : EPBD, autoconsommation, TVA",
    excerpt: "Obligations solaires bâtiments, tarif d'achat, TVA : ce qui change pour installateurs.",
    category: "regulation", author_name: "SUNTREX Legal", author_avatar: "L",
    date: "2026-02-10", read_time: 7, featured: false, published: true,
    tags: ["France", "EPBD", "TVA", "Réglementation"],
    image: IMG.regulation,
    overlay: "linear-gradient(135deg, rgba(0,38,84,0.82) 0%, rgba(206,17,38,0.65) 100%)",
    seo_title: "Réglementation PV France 2026 | SUNTREX",
    seo_description: "Changements PV France 2026 : EPBD, autoconsommation, TVA 10%.",
    reactions: { "⚖️": 16, "💡": 22, "📖": 11 }, comments_count: 5,
    content: `2026 : changements majeurs PV en France.\n\n**EPBD : solaire obligatoire bâtiments neufs**\n\nDès 2027 : bâtiments publics et non-résidentiels. Accélérateur massif C&I.\n\n**Autoconsommation collective**\n\nPérimètre étendu à 2km. Copropriétés facilitées.\n\n**TVA 10% maintenue**\n\nRésidentiel ≤ 3 kWc. Au-delà : 20%. Anticipez la vague EPBD sur SUNTREX.`,
  },
  {
    id: "a6", slug: "suntrex-marketplace-launch",
    title: "SUNTREX lance la marketplace PV avec livraison vérifiée et IA intégrée",
    excerpt: "Commissions -5%, SUNTREX DELIVERY, support multi-canal et outils IA. Notre vision.",
    category: "suntrex", author_name: "Équipe SUNTREX", author_avatar: "☀",
    date: "2026-03-01", read_time: 5, featured: false, published: true,
    tags: ["SUNTREX", "Marketplace", "IA", "Delivery"],
    image: IMG.team,
    overlay: "linear-gradient(135deg, rgba(232,112,10,0.8) 0%, rgba(45,143,62,0.75) 100%)",
    seo_title: "SUNTREX : marketplace PV Europe | Lancement",
    seo_description: "SUNTREX lance la marketplace PV B2B avec commissions -5%.",
    reactions: { "☀️": 52, "🔥": 38, "🚀": 27 }, comments_count: 23,
    content: `SUNTREX entre sur le marché avec une ambition claire.\n\n**Commissions -5%**\n\n5% de moins que sun.store et SolarTraders sur chaque transaction.\n\n**SUNTREX DELIVERY**\n\nColis photographié, QR scanné, géolocalisé. Escrow jusqu'à confirmation.\n\n**IA pour les pros**\n\nRecommandation, comparaison, dimensionnement, traduction technique.\n\n**Support multi-canal**\n\nTéléphone, email, WhatsApp, chat. Réponse < 2h. Rejoignez les premiers inscrits !`,
  },
  {
    id: "a7", slug: "intersolar-europe-2026",
    title: "Intersolar Europe 2026 : preview du plus grand salon solaire mondial",
    excerpt: "23-25 juin Munich, 2 800 exposants. Hybride PV, CFD, stockage next-gen.",
    category: "market", author_name: "SUNTREX Research", author_avatar: "S",
    date: "2026-02-22", read_time: 6, featured: false, published: true,
    tags: ["Intersolar", "Munich", "2026", "Événement"],
    image: IMG.tradeshow,
    overlay: "linear-gradient(135deg, rgba(45,106,160,0.82) 0%, rgba(232,112,10,0.68) 100%)",
    seo_title: "Intersolar Europe 2026 : preview | SUNTREX",
    seo_description: "Intersolar 2026 Munich : thèmes, innovations, SUNTREX présent.",
    reactions: { "🌍": 14, "☀️": 19, "🔥": 11 }, comments_count: 4,
    content: `Intersolar Europe 2026 : la plus importante de la décennie.\n\n**Thèmes**\n\n1. Centrales hybrides PV+stockage\n2. CFD nouvelles règles\n3. Modules > 700W\n4. IA et digitalisation\n5. Manufacturing européen\n\n**SUNTREX à Munich**\n\nContact : hello@suntrex.eu\n\n22 juin Conference. 23-25 juin Exposition. Messe München.`,
  },
  {
    id: "a8", slug: "top-10-panneaux-2026",
    title: "Top 10 panneaux solaires 2026 : performances, prix et disponibilité",
    excerpt: "Jinko, LONGi, Trina, JA Solar... Classement données réelles et retours terrain.",
    category: "brand", author_name: "SUNTREX Tech", author_avatar: "T",
    date: "2026-02-18", read_time: 11, featured: false, published: true,
    tags: ["Panneaux", "Classement", "2026", "N-type"],
    image: IMG.techPanel,
    overlay: "linear-gradient(135deg, rgba(10,22,40,0.78) 0%, rgba(45,143,62,0.7) 100%)",
    seo_title: "Top 10 panneaux solaires 2026 | SUNTREX",
    seo_description: "Classement des 10 meilleurs panneaux solaires Europe 2026.",
    reactions: { "☀️": 37, "⚡": 29, "🔥": 24 }, comments_count: 21,
    content: `Top 10 panneaux Europe 2026 — données réelles.\n\n**1. Jinko Tiger Neo** — N°1 mondial, 22,8%\n**2. LONGi Hi-MO X** — Back-contact, 23,2%\n**3. Trina Vertex N** — Zero Busbar, 720W\n**4. JA Solar DeepBlue 4.0 Pro**\n**5. Canadian Solar TOPBiHiKu**\n**6. Risen Titan** — Prix utility\n**7. Astronergy ASTRO N7s**\n**8. Sungrow SG-N**\n**9. AIKO ABC** — Innovation disruptive\n**10. DAS Solar N-type**\n\nTous sur SUNTREX avec comparaison multi-vendeurs.`,
  },
];

// ─── DATABASE SIMULATION (replace with real Supabase in production) ──
const createDB = () => {
  let articles = [...SEED_ARTICLES];
  let comments = [
    { id: "c1", article_id: "a1", user_name: "Jean-Marc D.", content: "Excellente analyse. Les CFD changent tout pour nous installateurs.", date: "2026-02-28", approved: true },
    { id: "c2", article_id: "a2", user_name: "Pierre M.", content: "Testé les deux. Huawei résidentiel, Deye volume C&I. Exactement ça.", date: "2026-02-26", approved: true },
    { id: "c3", article_id: "a4", user_name: "Lucas R.", content: "Le N-type change la donne toitures complexes. Top comparatif.", date: "2026-02-16", approved: true },
    { id: "c4", article_id: "a6", user_name: "Marie T.", content: "Enfin une marketplace avec de vrais différenciateurs !", date: "2026-03-01", approved: true },
  ];
  return {
    getArticles: async (f = {}) => {
      let r = articles.filter(a => a.published);
      if (f.category && f.category !== "all") r = r.filter(a => a.category === f.category);
      if (f.search) { const q = f.search.toLowerCase(); r = r.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q))); }
      return r.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    getAllArticles: async () => [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)),
    createArticle: async (d) => { const a = { ...d, id: "a" + Date.now(), date: new Date().toISOString().split("T")[0], reactions: {}, comments_count: 0 }; articles.unshift(a); return a; },
    deleteArticle: async (id) => { articles = articles.filter(a => a.id !== id); },
    getComments: async (aid) => comments.filter(c => c.article_id === aid && c.approved),
    addComment: async (d) => { const c = { ...d, id: "c" + Date.now(), date: new Date().toISOString().split("T")[0], approved: true }; comments.push(c); const a = articles.find(x => x.id === d.article_id); if (a) a.comments_count = (a.comments_count || 0) + 1; return c; },
    toggleReaction: async (aid, emoji) => { const a = articles.find(x => x.id === aid); if (a) { if (!a.reactions) a.reactions = {}; a.reactions[emoji] = (a.reactions[emoji] || 0) + 1; } return a?.reactions; },
  };
};
const db = createDB();
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

function isAdminEmail(email) {
  if (ADMIN_EMAILS.length === 0) return false;
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

// ─── REUSABLE UI ──────────────────────────────────────────────────
const Badge = ({ children, color = T.orange, bg = T.orangeLight, style = {} }) => (
  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600, ...style }}>{children}</span>
);

const Btn = ({ children, variant = "primary", onClick, style = {}, disabled }) => {
  const [h, sH] = useState(false);
  const base = variant === "primary" ? { background: h && !disabled ? T.orangeHover : T.orange, color: "#fff", border: "none" }
    : { background: h ? T.orangeLight : "transparent", color: T.orange, border: `1px solid ${h ? T.orange : T.border}` };
  return <button onClick={onClick} disabled={disabled} onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
    style={{ padding: "10px 20px", borderRadius: T.radius, fontSize: 14, fontWeight: 600, fontFamily: T.font, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.2s", ...base, ...style }}>{children}</button>;
};

// ─── ARTICLE CARD WITH REAL PHOTO ─────────────────────────────────
const ArticleCard = ({ article, featured, onClick }) => {
  const [hov, sH] = useState(false);
  const { isMobile } = useResponsive();
  const cat = getCat(article.category);
  const isFeat = featured && !isMobile;

  return (
    <article onClick={() => onClick(article)} onMouseEnter={() => sH(true)} onMouseLeave={() => sH(false)}
      style={{
        cursor: "pointer", borderRadius: T.radiusLg, overflow: "hidden", background: T.card,
        border: `1px solid ${hov ? T.border : T.borderLight}`, boxShadow: hov ? T.shadowMd : T.shadow,
        transition: "all 0.3s ease", transform: hov ? "translateY(-3px)" : "none",
        display: "flex", flexDirection: isFeat ? "row" : "column", height: isFeat ? 300 : "auto",
      }}>

      {/* PHOTO */}
      <div style={{ position: "relative", minHeight: isFeat ? "100%" : 190, width: isFeat ? "48%" : "100%", flexShrink: 0, overflow: "hidden" }}>
        <img src={article.image || IMG.solarFarm} alt={article.title} loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            transition: "transform 0.5s", transform: hov ? "scale(1.06)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: article.overlay, opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />
        <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 2, display: "flex", gap: 6 }}>
          <Badge bg="rgba(255,255,255,0.2)" color="#fff" style={{ backdropFilter: "blur(8px)" }}>{cat.icon} {cat.label}</Badge>
          {article.featured && <Badge bg="rgba(232,112,10,0.35)" color="#fff" style={{ backdropFilter: "blur(8px)" }}>⭐ À la une</Badge>}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: isFeat ? "22px 20px" : "16px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: isFeat ? 22 : 17, fontWeight: 400, lineHeight: 1.2, margin: "0 0 8px", color: T.text }}>{article.title}</h3>
        <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.5, margin: "0 0 10px", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{article.excerpt}</p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {article.tags?.slice(0, 3).map(t => <Badge key={t}>{t}</Badge>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${T.borderLight}`, paddingTop: 10, fontSize: 11 }}>
          {Object.entries(article.reactions || {}).slice(0, 3).map(([e, c]) => (
            <span key={e} style={{ background: T.bgWarm, padding: "2px 7px", borderRadius: 10, color: T.textMuted }}>{e}{c}</span>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ color: T.textDim }}>💬{article.comments_count || 0}</span>
          <span style={{ color: T.textDim, fontFamily: T.fontMono, background: T.bgWarm, padding: "2px 7px", borderRadius: 10 }}>{article.read_time}min</span>
        </div>
      </div>
    </article>
  );
};

// ─── COMMENTS SECTION ─────────────────────────────────────────────
const Comments = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState(""); const [name, setName] = useState(""); const [posting, setPosting] = useState(false);
  useEffect(() => { db.getComments(articleId).then(setComments); }, [articleId]);
  const post = async () => { if (!text.trim() || !name.trim()) return; setPosting(true); const c = await db.addComment({ article_id: articleId, user_name: name, content: text }); setComments(p => [c, ...p]); setText(""); setPosting(false); };
  return (
    <div style={{ marginTop: 40 }}>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 400, margin: "0 0 16px" }}>Commentaires ({comments.length})</h3>
      <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.borderLight}`, padding: 16, marginBottom: 20 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom"
          style={{ width: "100%", padding: "10px 12px", borderRadius: T.radius, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, background: T.bg, color: T.text, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Votre commentaire..." rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: T.radius, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, background: T.bg, color: T.text, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: T.textDim }}>🔒 Modéré par SUNTREX</span>
          <Btn onClick={post} disabled={!text.trim() || !name.trim() || posting} style={{ padding: "8px 18px" }}>{posting ? "..." : "Publier"}</Btn>
        </div>
      </div>
      {comments.map(c => (
        <div key={c.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.borderLight}` }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.bgWarm, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: T.orange, flexShrink: 0 }}>{c.user_name[0]}</div>
          <div><div style={{ fontSize: 13, marginBottom: 3 }}><strong>{c.user_name}</strong> <span style={{ color: T.textDim, fontSize: 11 }}>· {formatDate(c.date)}</span></div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: T.textBody }}>{c.content}</p></div>
        </div>
      ))}
    </div>
  );
};

// ─── REACTIONS ─────────────────────────────────────────────────────
const Reactions = ({ article, onUpdate }) => {
  const emojis = ["☀️", "🔥", "💡", "⚡", "📖", "🚀"];
  const [reacted, setReacted] = useState(new Set());
  const r = article.reactions || {};
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "12px 0" }}>
      {emojis.map(e => {
        const active = reacted.has(e);
        return <button key={e} onClick={async () => { if (active) return; setReacted(p => new Set([...p, e])); const u = await db.toggleReaction(article.id, e); onUpdate?.(u); }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 18,
            border: `1px solid ${active ? T.orange : T.border}`, background: active ? T.orangeLight : T.surface,
            cursor: "pointer", fontSize: 13, fontFamily: T.font, transition: "all 0.2s" }}>
          <span>{e}</span><span style={{ fontSize: 12, fontWeight: 600, color: active ? T.orange : T.textMuted }}>{r[e] || 0}</span>
        </button>;
      })}
    </div>
  );
};

// ─── AI GENERATOR (uses Mistral AI via Netlify Function) ───
const AIGenerator = ({ onGenerated }) => {
  const [topic, setTopic] = useState(""); const [cat, setCat] = useState("market");
  const [gen, setGen] = useState(false); const [prog, setProg] = useState(""); const [result, setResult] = useState(null);

  const generate = async () => {
    if (!topic.trim()) return; setGen(true); setProg("Génération via Mistral AI...");
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + "/api/blog-ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, category: cat }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const article = data.article;
      setResult({ ...article, image: article.image || IMG.aiTech, overlay: "linear-gradient(135deg, rgba(26,26,24,0.85) 0%, rgba(232,112,10,0.8) 100%)" });
      setProg(data.saved ? "✓ Sauvé en base !" : "✓ Prêt !");
    } catch (err) {
      setProg(`❌ Erreur : ${err.message || "génération impossible"}`);
      setResult(null);
    } finally { setGen(false); }
  };

  return (
    <div style={{ background: `linear-gradient(135deg, ${T.text} 0%, #2a2a26 100%)`, borderRadius: T.radiusXl, padding: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: T.orangeGlow, filter: "blur(50px)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div><div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.orange, letterSpacing: 1 }}>AI CONTENT GENERATOR</div><div style={{ fontSize: 14, fontWeight: 600 }}>Générer un article avec Mistral AI</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Sujet (ex: impact tarifs douaniers panneaux chinois)"
            style={{ flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: T.radius, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontFamily: T.font, outline: "none" }} />
          <select value={cat} onChange={e => setCat(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: T.radius, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, fontFamily: T.font }}>
            {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id} style={{ color: "#000" }}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <Btn onClick={generate} disabled={gen || !topic.trim()} style={{ width: "100%" }}>{gen ? `⏳ ${prog}` : "⚡ Générer l'article"}</Btn>
        {result && (
          <div style={{ marginTop: 14, padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: T.radiusLg, border: "1px solid rgba(255,255,255,0.1)" }}>
            <Badge bg="rgba(45,143,62,0.2)" color="#6ee76e" style={{ marginBottom: 6 }}>✓ Brouillon</Badge>
            <h4 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 400, margin: "0 0 4px" }}>{result.title}</h4>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>{result.excerpt}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={async () => { await db.createArticle({ ...result, published: true }); onGenerated(); setResult(null); setTopic(""); }}>📤 Publier</Btn>
              <Btn variant="ghost" onClick={() => setResult(null)} style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>✕</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── RSS PREVIEW ──────────────────────────────────────────────────
const RSSPanel = ({ articles }) => {
  const [show, setShow] = useState(false);
  const rss = articles.filter(a => a.published).slice(0, 5).map(a =>
    `  <item>\n    <title>${a.title}</title>\n    <link>https://suntrex.eu/blog/${a.slug}</link>\n    <pubDate>${new Date(a.date).toUTCString()}</pubDate>\n    <category>${getCat(a.category).label}</category>\n  </item>`
  ).join("\n");
  return (
    <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.borderLight}`, overflow: "hidden" }}>
      <button onClick={() => setShow(!show)} style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.text }}>
        📡 Flux RSS <span style={{ flex: 1 }} /><span style={{ fontSize: 11, color: T.textDim, fontFamily: T.fontMono }}>rss.xml</span><span style={{ transform: show ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
      </button>
      {show && <pre style={{ margin: "0 16px 16px", background: T.text, color: "#a8e6a0", padding: 12, borderRadius: T.radius, fontSize: 10, fontFamily: T.fontMono, overflow: "auto", maxHeight: 200, whiteSpace: "pre-wrap" }}>
{`<?xml version="1.0"?>\n<rss version="2.0">\n<channel>\n  <title>SUNTREX Blog</title>\n  <link>https://suntrex.eu/blog</link>\n${rss}\n</channel>\n</rss>`}
      </pre>}
    </div>
  );
};

// ─── SEO PREVIEW ──────────────────────────────────────────────────
const SEOPreview = ({ article }) => {
  if (!article) return null;
  return (
    <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.borderLight}`, padding: 16 }}>
      <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.orange, letterSpacing: 1, marginBottom: 10 }}>SEO / SCHEMA.ORG</div>
      <div style={{ padding: 12, background: "#fff", borderRadius: T.radius, border: `1px solid ${T.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: "#1a0dab", fontFamily: "Arial", marginBottom: 2 }}>{article.seo_title || article.title}</div>
        <div style={{ fontSize: 11, color: "#006621", fontFamily: "Arial", marginBottom: 3 }}>suntrex.eu/blog/{article.slug}</div>
        <div style={{ fontSize: 11, color: "#545454", fontFamily: "Arial", lineHeight: 1.4 }}>{(article.seo_description || article.excerpt)?.slice(0, 155)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10, fontFamily: T.fontMono }}>
        {[["og:type", "article"], ["og:site", "SUNTREX"], ["schema", "Article"], ["section", getCat(article.category).label]].map(([k, v]) => (
          <div key={k} style={{ padding: "3px 6px", background: T.bgWarm, borderRadius: 4 }}><span style={{ color: T.textDim }}>{k}:</span> <span style={{ color: T.green }}>{v}</span></div>
        ))}
      </div>
    </div>
  );
};

// ─── NEWSLETTER ───────────────────────────────────────────────────
const Newsletter = () => {
  const [email, setEmail] = useState(""); const [done, setDone] = useState(false);
  return (
    <div style={{ background: `linear-gradient(135deg, ${T.text} 0%, #2a2a28 100%)`, borderRadius: T.radiusXl, padding: "28px 20px", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: T.orangeGlow, filter: "blur(50px)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.orange, letterSpacing: 1, marginBottom: 5 }}>SUNTREX INTELLIGENCE</div>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 400, margin: "0 0 6px" }}>L'analyse PV chaque semaine</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 14px" }}>Prix, tendances, réglementation — pour les pros.</p>
        {done ? <div style={{ background: "rgba(45,143,62,0.15)", border: "1px solid rgba(45,143,62,0.3)", borderRadius: T.radius, padding: "8px 12px", fontSize: 13 }}>✓ Bienvenue !</div>
        : <div style={{ display: "flex", gap: 6 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@pro.com" style={{ flex: 1, padding: "9px 10px", borderRadius: T.radius, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontFamily: T.font, outline: "none", minWidth: 0 }} />
            <Btn onClick={() => email.includes("@") && setDone(true)} style={{ padding: "9px 14px" }}>OK</Btn>
          </div>}
      </div>
    </div>
  );
};

// ─── ARTICLE DETAIL VIEW ──────────────────────────────────────────
const ArticleDetail = ({ article, onBack }) => {
  const { isMobile } = useResponsive();
  const cat = getCat(article.category);
  const [reactions, setReactions] = useState(article.reactions);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <Btn variant="ghost" onClick={onBack} style={{ marginBottom: 16, padding: "8px 16px" }}>← Retour au blog</Btn>

      {/* HERO WITH REAL PHOTO */}
      <div style={{ position: "relative", minHeight: isMobile ? 220 : 340, borderRadius: T.radiusXl, overflow: "hidden", display: "flex", alignItems: "flex-end", marginBottom: 28 }}>
        <img src={article.image || IMG.solarFarm} alt={article.title} loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: article.overlay }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: isMobile ? "24px 18px" : "36px 40px", maxWidth: 700 }}>
          <Badge bg="rgba(255,255,255,0.2)" color="#fff" style={{ backdropFilter: "blur(8px)", marginBottom: 10 }}>{cat.icon} {cat.label}</Badge>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 24 : 36, fontWeight: 400, lineHeight: 1.1, color: "#fff", margin: 0 }}>{article.title}</h1>
        </div>
      </div>

      {/* META BAR */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 24, padding: "14px 18px", background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>{article.author_avatar}</div>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{article.author_name}</div><div style={{ fontSize: 11, color: T.textMuted }}>{formatDate(article.date)}</div></div>
        </div>
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.fontMono }}>⏱ {article.read_time}min</span>
        <div style={{ flex: 1 }} />
        {article.tags?.map(t => <Badge key={t}>{t}</Badge>)}
      </div>

      {/* REACTIONS */}
      <Reactions article={{ ...article, reactions }} onUpdate={setReactions} />

      {/* ARTICLE BODY */}
      <div style={{ maxWidth: 720, margin: "0 auto", fontSize: 16, lineHeight: 1.8, color: T.textBody }}>
        {article.content?.split("\n\n").map((para, i) => {
          if (para.startsWith("**") && para.endsWith("**"))
            return <h2 key={i} style={{ fontFamily: T.fontDisplay, fontSize: 23, fontWeight: 400, color: T.text, margin: "32px 0 12px" }}>{para.replace(/\*\*/g, "")}</h2>;
          const parts = para.split(/(\*\*.*?\*\*)/g);
          return <p key={i} style={{ margin: "0 0 16px" }}>
            {parts.map((p, j) => {
              if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} style={{ color: T.text, fontWeight: 600 }}>{p.replace(/\*\*/g, "")}</strong>;
              if (p.includes("• ")) return p.split("\n").map((l, k) => l.startsWith("• ") ? <span key={k} style={{ display: "block", paddingLeft: 16, position: "relative", margin: "3px 0" }}><span style={{ position: "absolute", left: 0, color: T.orange }}>•</span>{l.slice(2)}</span> : <span key={k}>{l}</span>);
              return p;
            })}
          </p>;
        })}
      </div>

      {/* SEO PREVIEW */}
      <div style={{ maxWidth: 720, margin: "32px auto 0" }}><SEOPreview article={article} /></div>

      {/* CTA */}
      <div style={{ maxWidth: 720, margin: "32px auto 0", padding: 24, background: T.orangeLight, border: `1px solid ${T.orangeGlow}`, borderRadius: T.radiusLg, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.orange, letterSpacing: 1, marginBottom: 4 }}>SUNTREX MARKETPLACE</div>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 400, margin: "0 0 8px" }}>Comparez les prix sur SUNTREX</h3>
        <p style={{ color: T.textMuted, fontSize: 13, margin: "0 0 14px" }}>638+ produits, vendeurs vérifiés, commissions -5%.</p>
        <Btn>Voir le catalogue →</Btn>
      </div>

      {/* COMMENTS */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}><Comments articleId={article.id} /></div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN BLOG APP
// ═══════════════════════════════════════════════════════════════════
export default function SuntrexBlog() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [view, setView] = useState("list");
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { db.getAllArticles().then(setArticles); setTimeout(() => setLoaded(true), 100); }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAdmin(false);
      return;
    }

    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setIsAdmin(isAdminEmail(user?.email));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsAdmin(isAdminEmail(session?.user?.email));
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin && view === "admin") {
      setView("list");
    }
  }, [isAdmin, view]);

  const refresh = async () => { const a = await db.getAllArticles(); setArticles(a); };
  const filtered = articles.filter(a => {
    if (!a.published && view !== "admin") return false;
    const mc = activeCat === "all" || a.category === activeCat;
    const q = search.toLowerCase().trim();
    const ms = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q) || a.tags?.some(t => t.toLowerCase().includes(q));
    return mc && ms;
  });

  const openArticle = (a) => { setSelected(a); setView("article"); window.scrollTo(0, 0); };
  const backToList = () => { setView("list"); setSelected(null); };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box;margin:0}::selection{background:${T.orangeLight};color:${T.orange}}input::placeholder,textarea::placeholder{color:${T.textDim}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}`}</style>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,247,0.88)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.borderLight}`, padding: "10px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }} onClick={backToList}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 800 }}>S</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>SUNTREX</span>
            <span style={{ fontSize: 12, color: T.textDim }}>/ Blog</span>
          </div>
          <div style={{ flex: 1 }} />
          {isAdmin && (
            <button onClick={() => setView(view === "admin" ? "list" : "admin")}
              style={{ padding: "6px 12px", borderRadius: T.radius, border: `1px solid ${view === "admin" ? T.orange : T.border}`, background: view === "admin" ? T.orangeLight : "transparent", color: view === "admin" ? T.orange : T.textMuted, fontSize: 11, fontFamily: T.fontMono, cursor: "pointer" }}>
              {view === "admin" ? "✕ Admin" : "⚙ Admin"}
            </button>
          )}
          <Btn style={{ padding: "7px 16px", fontSize: 13 }}>Catalogue</Btn>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: `0 ${isMobile ? 16 : 24}px 80px` }}>

        {/* ARTICLE VIEW */}
        {view === "article" && selected && <div style={{ paddingTop: 28 }}><ArticleDetail article={selected} onBack={backToList} /></div>}

        {/* ADMIN VIEW */}
        {view === "admin" && (
          <div style={{ paddingTop: 28 }}>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 400, marginBottom: 24 }}>⚙ Administration Blog</h1>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 28 }}>
              <AIGenerator onGenerated={refresh} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <RSSPanel articles={articles} />
                <SEOPreview article={articles[0]} />
              </div>
            </div>
            {/* Articles list */}
            <div style={{ background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.borderLight}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 400, flex: 1 }}>Articles ({articles.length})</h3>
                <Badge bg={T.greenLight} color={T.green}>{articles.filter(a => a.published).length} publiés</Badge>
                <Badge bg={T.amberLight} color={T.amber}>{articles.filter(a => !a.published).length} brouillons</Badge>
              </div>
              {articles.map(a => (
                <div key={a.id} style={{ padding: "12px 18px", borderBottom: `1px solid ${T.borderLight}`, display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                  {/* Thumbnail */}
                  <img src={a.image || IMG.solarFarm} alt={a.title} style={{ width: 48, height: 34, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.published ? T.green : T.amber, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{getCat(a.category).icon} {getCat(a.category).label} · {formatDate(a.date)} · 💬{a.comments_count || 0}</div>
                  </div>
                  <button onClick={() => openArticle(a)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer", fontSize: 11, fontFamily: T.font, color: T.textMuted }}>👁 Voir</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <>
            {/* HERO */}
            <section style={{ padding: `${isMobile ? 36 : 48}px 0 ${isMobile ? 24 : 36}px`, opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(12px)", transition: "all 0.5s" }}>
              <Badge style={{ marginBottom: 14 }}>☀ SUNTREX INSIGHTS</Badge>
              <h1 style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 30 : 46, fontWeight: 400, lineHeight: 1.05, margin: "0 0 12px" }}>
                L'intelligence marché <em style={{ fontStyle: "italic", color: T.orange }}>solaire</em>
              </h1>
              <p style={{ fontSize: isMobile ? 14 : 16, color: T.textMuted, lineHeight: 1.5, margin: 0, maxWidth: 560 }}>
                Analyses, comparatifs et guides pour les pros du photovoltaïque en Europe.
              </p>
            </section>

            {/* SEARCH + FILTERS */}
            <section style={{ marginBottom: 28 }}>
              <div style={{ position: "relative", marginBottom: 12, maxWidth: 400 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textDim }}>⌕</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                  style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: T.radiusLg, border: `1px solid ${T.border}`, background: T.surface, fontSize: 14, fontFamily: T.font, color: T.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setActiveCat(c.id)}
                    style={{ padding: "6px 12px", borderRadius: 16, border: `1px solid ${activeCat === c.id ? T.orange : T.border}`, background: activeCat === c.id ? T.orange : T.surface, color: activeCat === c.id ? "#fff" : T.textBody, fontSize: 12, fontWeight: activeCat === c.id ? 600 : 500, fontFamily: T.font, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </section>

            {/* FEATURED */}
            {filtered.filter(a => a.featured).length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: T.orange }} />
                  <h2 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 400 }}>À la une</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 16 }}>
                  {filtered.filter(a => a.featured).map(a => <ArticleCard key={a.id} article={a} featured onClick={openArticle} />)}
                </div>
              </section>
            )}

            {/* ARTICLES GRID + SIDEBAR */}
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 300px" : "1fr", gap: 28, alignItems: "start" }}>
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: T.amber }} />
                  <h2 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 400 }}>
                    {activeCat === "all" ? "Derniers articles" : getCat(activeCat).label}
                  </h2>
                  <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.fontMono }}>{filtered.length}</span>
                </div>
                {filtered.length === 0 ? (
                  <div style={{ padding: 36, textAlign: "center", background: T.surface, borderRadius: T.radiusLg, border: `1px solid ${T.borderLight}` }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div><p style={{ color: T.textMuted }}>Aucun article trouvé.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: isTablet || isDesktop ? "1fr 1fr" : "1fr", gap: 14 }}>
                    {filtered.filter(a => !a.featured).map((a, i) => (
                      <div key={a.id} style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(12px)", transition: `all 0.4s ease ${i * 0.05}s` }}>
                        <ArticleCard article={a} onClick={openArticle} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SIDEBAR (desktop only) */}
              {isDesktop && (
                <aside style={{ position: "sticky", top: 68, display: "flex", flexDirection: "column", gap: 16 }}>
                  <Newsletter />
                  <div style={{ background: T.surface, borderRadius: T.radiusLg, padding: 16, border: `1px solid ${T.borderLight}` }}>
                    <h4 style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 400, margin: "0 0 10px" }}>Sujets populaires</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {["N-type", "Huawei", "Stockage", "Deye", "Batteries", "EPBD", "Intersolar", "Jinko"].map(tag => (
                        <button key={tag} onClick={() => setSearch(tag)}
                          style={{ padding: "4px 10px", borderRadius: 14, border: `1px solid ${T.border}`, background: "transparent", color: T.textBody, fontSize: 11, fontFamily: T.font, cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={e => { e.target.style.borderColor = T.orange; e.target.style.color = T.orange; e.target.style.background = T.orangeLight; }}
                          onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textBody; e.target.style.background = "transparent"; }}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: `linear-gradient(135deg, ${T.text} 0%, #2a2a26 100%)`, borderRadius: T.radiusLg, padding: 16, color: "#fff" }}>
                    <h4 style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 400, margin: "0 0 10px" }}>SUNTREX</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[{ n: "638+", l: "Produits" }, { n: "15+", l: "Marques" }, { n: "-5%", l: "Commissions" }, { n: "<2h", l: "Support" }].map(s => (
                        <div key={s.l}><div style={{ fontSize: 20, fontWeight: 700, color: T.orange, fontFamily: T.fontMono }}>{s.n}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.l}</div></div>
                      ))}
                    </div>
                  </div>
                  <RSSPanel articles={articles} />
                </aside>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
