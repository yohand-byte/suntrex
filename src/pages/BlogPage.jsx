import { useState, useEffect, useRef, useCallback } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 * SUNTREX BLOG — Editorial Magazine Design
 * ═══════════════════════════════════════════════════════════════
 *
 * Professional B2B solar industry blog with:
 * - Editorial magazine-style layout (asymmetric grid)
 * - Real solar industry articles (market intelligence)
 * - Category filtering & search
 * - Reading time estimation
 * - Newsletter CTA for lead gen
 * - Article detail view with rich typography
 * - AI-generated content badge system
 * - Responsive 375px → 1440px
 *
 * Design: Clean editorial, warm whites, solar amber accents
 * Font: Instrument Serif (display) + DM Sans (body)
 */

// ─── DESIGN TOKENS ─────────────────────────────────────────────
const T = {
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontDisplay: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  fontMono: "'JetBrains Mono', 'SF Mono', monospace",
  bg: "#FAFAF7",
  bgWarm: "#F5F0E8",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  border: "#E8E4DC",
  borderLight: "#F0EDE6",
  text: "#1A1A18",
  textBody: "#3D3D3A",
  textMuted: "#8A8A85",
  textDim: "#B5B5B0",
  orange: "#E8700A",
  orangeHover: "#D4630A",
  orangeLight: "rgba(232,112,10,0.06)",
  orangeGlow: "rgba(232,112,10,0.12)",
  amber: "#C5870F",
  amberLight: "rgba(197,135,15,0.08)",
  green: "#2D8F3E",
  greenLight: "rgba(45,143,62,0.06)",
  blue: "#1B6EC2",
  blueLight: "rgba(27,110,194,0.06)",
  red: "#C43030",
  shadow: "0 1px 3px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 20px rgba(0,0,0,0.06)",
  shadowLg: "0 12px 40px rgba(0,0,0,0.08)",
  radius: 8,
  radiusLg: 16,
  radiusXl: 24,
};

// ─── CATEGORIES ─────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "Tout", icon: "◉" },
  { id: "market", label: "Marché & Tendances", icon: "📊" },
  { id: "tech", label: "Technologie", icon: "⚡" },
  { id: "guides", label: "Guides Pratiques", icon: "📖" },
  { id: "brand", label: "Marques & Produits", icon: "🏷️" },
  { id: "regulation", label: "Réglementation", icon: "⚖️" },
  { id: "suntrex", label: "SUNTREX News", icon: "☀️" },
];

// ─── ARTICLES DATA ──────────────────────────────────────────────
const ARTICLES = [
  {
    id: 1,
    slug: "european-solar-market-2026-trends",
    title: "Marché solaire européen 2026 : les 5 tendances qui redessinent le secteur",
    excerpt: "L'UE a atteint 406 GW de capacité installée, mais la contraction du résidentiel et les nouveaux modèles de financement CFD transforment le paysage. Décryptage pour les professionnels.",
    category: "market",
    author: { name: "SUNTREX Research", avatar: "S" },
    date: "2026-02-28",
    readTime: 8,
    featured: true,
    tags: ["Europe", "Tendances 2026", "CFD", "Stockage"],
    heroImg: "linear-gradient(135deg, #1a3a5c 0%, #2d6aa0 50%, #e8910a 100%)",
    content: `Le marché solaire européen entre dans une phase de maturation. Avec 65,1 GW installés en 2025 selon SolarPower Europe, l'UE a franchi le cap symbolique des 400 GW de capacité cumulative. Mais pour la première fois depuis 2016, le marché annuel s'est légèrement contracté (-0,7%).

**1. La contraction du résidentiel redistribue les cartes**

Le segment résidentiel, qui représentait 28% des installations en 2023, n'en représente plus que 14% en 2025. La baisse des prix de l'électricité post-crise énergétique et la fin de certains mécanismes de soutien expliquent ce repli. Pour les distributeurs et installateurs, c'est un signal fort : le commercial & industriel (C&I) et l'utility-scale deviennent les moteurs de croissance.

**2. Les systèmes hybrides PV + stockage explosent**

À 70$/kWh pour le stockage stationnaire (BloombergNEF 2025), l'intégration batteries devient économiquement incontournable. Les centrales hybrides PV + stockage se multiplient, portées par l'arbitrage énergétique et la nécessité de gérer les prix négatifs aux heures de pointe solaire.

**3. Les Contracts for Difference (CFD) remplacent les tarifs de rachat**

L'Allemagne prévoit la fin des tarifs EEG fin 2026. Partout en Europe, les CFD deviennent le mécanisme dominant : ils sécurisent les revenus des développeurs tout en stabilisant les prix pour les consommateurs. Les installateurs doivent comprendre ces mécanismes pour conseiller leurs clients.

**4. La capacité mondiale atteint 3 TW**

Début 2026, la capacité PV mondiale cumulée a franchi les 3 térawatts (Wood Mackenzie). Cette croissance crée des défis d'intégration réseau et renforce l'importance des solutions de flexibilité.

**5. L'oversupply module maintient les prix bas**

Les prix modules restent sous 0,09€/Wp sur le marché international. Pour les acheteurs professionnels sur SUNTREX, c'est une opportunité : des équipements premium à des tarifs historiquement bas.`,
  },
  {
    id: 2,
    slug: "huawei-sun2000-vs-deye-hybrid-2026",
    title: "Huawei SUN2000 vs Deye Hybrid : comparatif onduleurs 2026 pour installateurs",
    excerpt: "Deux philosophies, deux gammes de prix. Nous avons analysé performances, fiabilité et rapport qualité-prix pour vous aider à faire le bon choix selon vos projets.",
    category: "brand",
    author: { name: "SUNTREX Tech", avatar: "T" },
    date: "2026-02-25",
    readTime: 12,
    featured: true,
    tags: ["Huawei", "Deye", "Onduleurs", "Comparatif"],
    heroImg: "linear-gradient(135deg, #e4002b 0%, #c00020 50%, #0068b7 100%)",
    content: `Pour un installateur professionnel, le choix de l'onduleur est stratégique. Il détermine la performance du système, la satisfaction client et votre marge. En 2026, deux marques dominent le segment résidentiel et C&I en Europe : Huawei avec la gamme SUN2000 et Deye avec ses hybrides.

**Huawei SUN2000 : la référence premium**

• Rendement : jusqu'à 98,6% (record du segment)
• Technologie : MPPT intelligent avec suivi I-V automatique
• Monitoring : FusionSolar app — le standard de l'industrie
• Fiabilité : taux de panne < 0,5% sur 5 ans (données terrain)
• Prix sur SUNTREX : à partir de 479€ (3 kW) à 1 249€ (10 kW)

**Deye Hybrid : le meilleur rapport qualité-prix**

• Rendement : jusqu'à 97,8%
• Atout majeur : hybride natif (PV + batterie + réseau) sans module additionnel
• Flexibilité : compatible avec la plupart des batteries LFP du marché
• Prix sur SUNTREX : jusqu'à -20% vs Huawei à puissance équivalente
• Point d'attention : SAV européen encore en structuration

**Notre verdict pour les installateurs**

Pour des projets résidentiels premium où le client exige le meilleur suivi et une fiabilité maximale : Huawei SUN2000. Pour des projets C&I sensibles au prix avec besoin d'hybridation native : Deye. Sur SUNTREX, comparez les prix de multiples vendeurs pour chaque référence et trouvez le meilleur deal.`,
  },
  {
    id: 3,
    slug: "guide-achat-batteries-stockage-2026",
    title: "Guide d'achat batteries 2026 : LFP, prix, capacités — tout ce que l'installateur doit savoir",
    excerpt: "Avec des prix de stockage à 70$/kWh, le marché des batteries explose. LFP vs NMC, dimensionnement, marques fiables : le guide complet pour bien conseiller vos clients.",
    category: "guides",
    author: { name: "SUNTREX Academy", avatar: "A" },
    date: "2026-02-20",
    readTime: 15,
    featured: false,
    tags: ["Batteries", "LFP", "Stockage", "Guide"],
    heroImg: "linear-gradient(135deg, #1a5aa6 0%, #2d8f3e 50%, #c5870f 100%)",
    content: `Le stockage d'énergie n'est plus une option, c'est une nécessité. En 2026, les prix des batteries stationnaires ont chuté à 70$/kWh — la baisse la plus forte de tous les segments batterie. Voici tout ce que vous devez savoir pour recommander la bonne solution.

**LFP vs NMC : le match est joué**

Le Lithium Fer Phosphate (LFP) a gagné. Plus sûr, plus durable (6000+ cycles), moins cher, et sans cobalt ni nickel. En 2026, plus de 85% des batteries résidentielles et C&I vendues en Europe sont LFP.

**Les références incontournables sur SUNTREX**

• Huawei LUNA2000 : la référence premium, intégration parfaite avec SUN2000
• BYD Battery-Box : modularité et évolutivité, excellent SAV Europe
• Pylontech : rapport prix/capacité imbattable pour le résidentiel
• Deye BOS-G : hybridation native avec onduleurs Deye

**Dimensionnement : les règles d'or**

1. Résidentiel : 1 kWh de stockage pour 1 kWc installé (ratio de base)
2. C&I : analyser le profil de consommation — peak shaving vs autoconsommation
3. Toujours prévoir 20% de marge pour la dégradation sur 10 ans

**Le conseil SUNTREX**

Comparez les prix de 5+ vendeurs avant de vous engager. Les écarts sur une LUNA2000-5-S0 peuvent dépasser 200€ entre vendeurs sur notre marketplace.`,
  },
  {
    id: 4,
    slug: "n-type-topcon-revolution-panneaux-2026",
    title: "La révolution N-type TOPCon : pourquoi vos panneaux PERC sont déjà obsolètes",
    excerpt: "Jinko Tiger Neo, Trina Vertex, LONGi Hi-MO X — la technologie N-type TOPCon domine désormais 70% des livraisons mondiales. Impact sur vos installations.",
    category: "tech",
    author: { name: "SUNTREX Research", avatar: "S" },
    date: "2026-02-15",
    readTime: 10,
    tags: ["N-type", "TOPCon", "Panneaux solaires", "Technologie"],
    heroImg: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #e8700a 100%)",
    content: `La transition technologique est consommée. En 2026, les modules N-type TOPCon représentent plus de 70% des livraisons mondiales, contre moins de 30% fin 2023. Le PERC, technologie dominante pendant une décennie, est en phase de disparition.

**Pourquoi le N-type TOPCon gagne**

• Rendement cellule : 25,5%+ vs 23,5% pour le PERC
• Meilleur coefficient de température : -0,29%/°C vs -0,35%/°C
• Dégradation réduite : LID quasi nulle, PID résistant
• Bifacialité améliorée : gain de 5-15% en conditions favorables

**Les leaders sur SUNTREX**

1. Jinko Tiger Neo (JKM-N) : le plus livré au monde, rapport qualité-prix optimal
2. Trina Vertex N : technologie Zero Busbar, densité de puissance maximale
3. LONGi Hi-MO X : cellules back-contact, rendement record
4. Canadian Solar TOPBiHiKu : excellent comportement en faible luminosité
5. Risen Titan : prix agressif, montée en puissance rapide

**Impact pour les installateurs**

Avec des modules dépassant 600W en utility et 440W en résidentiel, le dimensionnement évolue. Moins de modules par kWc installé = moins de main d'œuvre = meilleure marge. Passez au N-type dès maintenant.`,
  },
  {
    id: 5,
    slug: "reglementation-pv-france-2026",
    title: "Réglementation PV en France 2026 : EPBD, autoconsommation, TVA — ce qui change",
    excerpt: "Nouvelles obligations solaires sur les bâtiments, évolution du tarif d'achat, TVA réduite : les changements réglementaires qui impactent votre activité d'installateur.",
    category: "regulation",
    author: { name: "SUNTREX Legal", avatar: "L" },
    date: "2026-02-10",
    readTime: 7,
    tags: ["France", "EPBD", "Réglementation", "TVA"],
    heroImg: "linear-gradient(135deg, #002654 0%, #FFFFFF 50%, #CE1126 100%)",
    content: `2026 apporte son lot de changements réglementaires pour le photovoltaïque en France. Tour d'horizon des mesures clés.

**Directive EPBD : le solaire obligatoire sur les bâtiments neufs**

La directive européenne sur la performance énergétique des bâtiments (EPBD) entre progressivement en application. Dès 2027, les bâtiments publics et non-résidentiels neufs devront intégrer des installations solaires. Les bâtiments existants de plus de 250m² suivront. C'est un accélérateur massif pour le marché C&I.

**Autoconsommation collective**

Le cadre se simplifie avec l'extension du périmètre géographique à 2km (contre 1km auparavant). Les copropriétés et ZAC peuvent plus facilement mutualiser une installation.

**TVA à taux réduit : maintien du 10%**

La TVA à 10% sur les installations ≤ 3 kWc résidentielles est maintenue. Au-delà, c'est 20%. Pour les projets C&I, la récupération de TVA reste un levier important.

**Le conseil SUNTREX**

Anticipez la vague EPBD : constituez dès maintenant vos stocks de panneaux et onduleurs adaptés au C&I via notre marketplace. Les vendeurs SUNTREX proposent des offres spéciales pour les commandes groupées.`,
  },
  {
    id: 6,
    slug: "suntrex-lance-sa-marketplace",
    title: "SUNTREX lance la première marketplace PV avec livraison vérifiée et IA intégrée",
    excerpt: "Commissions 5% sous le marché, SUNTREX DELIVERY avec vérification photo QR, support multi-canal, et outils IA pour installateurs. Découvrez notre vision.",
    category: "suntrex",
    author: { name: "Équipe SUNTREX", avatar: "☀" },
    date: "2026-03-01",
    readTime: 5,
    featured: false,
    tags: ["SUNTREX", "Marketplace", "IA", "Delivery"],
    heroImg: "linear-gradient(135deg, #E8700A 0%, #C5870F 50%, #2D8F3E 100%)",
    content: `SUNTREX entre sur le marché avec une ambition claire : devenir la marketplace de référence pour les professionnels du photovoltaïque en Europe. Ce qui nous différencie :

**Des commissions 5% sous la concurrence**

Là où sun.store et SolarTraders appliquent les taux standard du marché, nous avons fait le choix de la compétitivité. 5% de moins sur chaque transaction, c'est autant de marge préservée pour les acheteurs et les vendeurs.

**SUNTREX DELIVERY : la confiance par la vérification**

Notre service de livraison propriétaire apporte ce qui manque au marché — la confiance. Chaque colis est photographié, scanné par QR code à chaque étape, avec géolocalisation et horodatage. L'acheteur ET le vendeur suivent le colis en temps réel. Fonds en escrow jusqu'à confirmation.

**L'IA au service des professionnels**

Notre assistant IA ne se contente pas de répondre aux questions. Il recommande des produits, compare les offres, aide au dimensionnement, et traduit automatiquement les échanges buyer-seller dans le contexte technique du PV.

**Support ultra-réactif, multi-canal**

Téléphone, email, WhatsApp, chat in-app. Une équipe jeune, passionnée, avec du métier et des idées. Nous répondons en moins de 2h, pas en 48h.

**Rejoignez les premiers vendeurs et acheteurs**

Les premiers inscrits bénéficieront de conditions préférentielles et d'une visibilité maximale. Inscrivez-vous dès maintenant sur SUNTREX.`,
  },
  {
    id: 7,
    slug: "intersolar-europe-2026-preview",
    title: "Intersolar Europe 2026 : ce qu'il faut attendre du plus grand salon solaire mondial",
    excerpt: "Du 23 au 25 juin à Munich, plus de 2 800 exposants et 100 000 visiteurs. Hybride PV, CFD, stockage next-gen — preview des innovations à surveiller.",
    category: "market",
    author: { name: "SUNTREX Research", avatar: "S" },
    date: "2026-02-22",
    readTime: 6,
    tags: ["Intersolar", "Munich", "Événement", "2026"],
    heroImg: "linear-gradient(135deg, #2d6aa0 0%, #1a3a5c 50%, #e8700a 100%)",
    content: `Intersolar Europe 2026 s'annonce comme l'édition la plus importante de la décennie. Dans un contexte de transformation profonde du marché européen, le salon de Munich sera le lieu où se dessineront les stratégies des 5 prochaines années.

**Les thèmes dominants**

1. Centrales hybrides PV + stockage : la fin du PV standalone
2. Contrats for Difference (CFD) : les nouvelles règles du jeu financier
3. Modules > 700W : la course à la puissance continue
4. IA et digitalisation de la chaîne de valeur
5. Manufacturing européen : renaissance ou illusion ?

**Ce que SUNTREX présentera**

Notre équipe sera à Munich pour rencontrer les acteurs du marché et présenter notre vision de la marketplace PV de demain. Si vous êtes installateur, distributeur ou fabricant, contactez-nous pour un rendez-vous : hello@suntrex.eu

**Rendez-vous**

22 juin : Intersolar Europe Conference (kick-off)
23-25 juin : Exposition + Intersolar Forum
Lieu : Messe München, Allemagne`,
  },
  {
    id: 8,
    slug: "top-10-panneaux-solaires-2026",
    title: "Top 10 des panneaux solaires 2026 : performances, prix et disponibilité en Europe",
    excerpt: "Jinko, LONGi, Trina, JA Solar, Canadian Solar... Classement basé sur les données réelles de livraisons, rendement et retours installateurs.",
    category: "brand",
    author: { name: "SUNTREX Tech", avatar: "T" },
    date: "2026-02-18",
    readTime: 11,
    tags: ["Panneaux solaires", "Classement", "2026", "N-type"],
    heroImg: "linear-gradient(135deg, #0a1628 0%, #1a5aa6 50%, #2d8f3e 100%)",
    content: `Chaque année, les classements changent. Voici le top 10 des panneaux solaires les plus pertinents pour le marché européen en 2026, basé sur les livraisons réelles, le rendement terrain et les retours de notre communauté d'installateurs.

**1. Jinko Tiger Neo (JKM-N series)**
Le plus vendu au monde. N-type TOPCon, rendement 22,8%, excellent rapport qualité-prix. Disponible immédiatement sur SUNTREX.

**2. LONGi Hi-MO X**
Back-contact révolutionnaire, rendement record 23,2%. Premium mais justifié par les performances.

**3. Trina Vertex N**
Zero Busbar Technology, puissance jusqu'à 720W en utility. Fiable et bankable.

**4. JA Solar DeepBlue 4.0 Pro**
N-type avec technologie SMBB, excellent en faible luminosité. Prix agressif.

**5. Canadian Solar TOPBiHiKu**
Bifacial premium, durabilité prouvée sur 25+ ans de track record.

**6. Risen Titan**
Le challanger. Prix imbattable en utility-scale, montée en puissance rapide.

**7. Astronergy ASTRO N7s**
Compact, léger, haute résistance mécanique. Idéal toitures C&I.

**8. Sungrow SG-N series**
Le nouveau venu dans les modules, profitant de son expertise onduleur.

**9. AIKO ABC**
All-Back-Contact sans busbars en face avant. L'innovation la plus disruptive.

**10. DAS Solar N-type**
Montée en puissance impressionnante, qualité en hausse constante.

Tous ces panneaux sont disponibles sur SUNTREX, avec comparaison de prix multi-vendeurs.`,
  },
];

// ─── UTILITIES ──────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const getCategoryInfo = (catId) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];

// ─── NEWSLETTER CTA ─────────────────────────────────────────────
const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${T.text} 0%, #2a2a28 100%)`,
        borderRadius: T.radiusXl,
        padding: "48px 40px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: T.orangeGlow,
          filter: "blur(80px)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 14, fontFamily: T.fontMono, color: T.orange, marginBottom: 8, letterSpacing: 1 }}>
          SUNTREX INTELLIGENCE
        </div>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 400, margin: "0 0 12px", lineHeight: 1.2 }}>
          Recevez l'analyse marché PV chaque semaine
        </h3>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, margin: "0 0 24px", lineHeight: 1.6 }}>
          Prix, tendances, nouvelles réglementations — l'essentiel pour les professionnels du solaire, directement dans votre boîte.
        </p>
        {submitted ? (
          <div
            style={{
              background: "rgba(45,143,62,0.15)",
              border: "1px solid rgba(45,143,62,0.3)",
              borderRadius: T.radius,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
            }}
          >
            <span style={{ fontSize: 20 }}>✓</span> Inscription confirmée ! Bienvenue dans la communauté SUNTREX.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email-pro.com"
              style={{
                flex: 1,
                padding: "14px 18px",
                borderRadius: T.radius,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: 15,
                fontFamily: T.font,
                outline: "none",
                minWidth: 0,
              }}
            />
            <button
              onClick={() => email.includes("@") && setSubmitted(true)}
              style={{
                padding: "14px 28px",
                borderRadius: T.radius,
                border: "none",
                background: T.orange,
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: T.font,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = T.orangeHover)}
              onMouseLeave={(e) => (e.target.style.background = T.orange)}
            >
              S'inscrire
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ARTICLE CARD ───────────────────────────────────────────────
const ArticleCard = ({ article, variant = "default", onClick }) => {
  const [hovered, setHovered] = useState(false);
  const cat = getCategoryInfo(article.category);

  const isFeatured = variant === "featured";

  return (
    <article
      onClick={() => onClick(article)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        borderRadius: T.radiusLg,
        overflow: "hidden",
        background: T.card,
        border: `1px solid ${hovered ? T.border : T.borderLight}`,
        boxShadow: hovered ? T.shadowMd : T.shadow,
        transition: "all 0.35s cubic-bezier(0.23, 1, 0.32, 1)",
        transform: hovered ? "translateY(-4px)" : "none",
        display: "flex",
        flexDirection: isFeatured ? "row" : "column",
        height: isFeatured ? 340 : "auto",
      }}
    >
      {/* Image / Gradient Hero */}
      <div
        style={{
          background: article.heroImg,
          minHeight: isFeatured ? "100%" : 200,
          width: isFeatured ? "50%" : "100%",
          flexShrink: 0,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: 20,
          transition: "filter 0.35s",
          filter: hovered ? "brightness(1.1)" : "brightness(1)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 60%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {cat.icon} {cat.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isFeatured ? "32px 28px" : "24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3
          style={{
            fontFamily: T.fontDisplay,
            fontSize: isFeatured ? 26 : 20,
            fontWeight: 400,
            lineHeight: 1.25,
            margin: "0 0 12px",
            color: T.text,
          }}
        >
          {article.title}
        </h3>
        <p
          style={{
            color: T.textMuted,
            fontSize: 14,
            lineHeight: 1.6,
            margin: "0 0 16px",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: isFeatured ? 4 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {article.excerpt}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {article.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 10px",
                borderRadius: 20,
                background: T.orangeLight,
                color: T.orange,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${T.borderLight}`, paddingTop: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {article.author.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{article.author.name}</div>
            <div style={{ fontSize: 12, color: T.textDim }}>{formatDate(article.date)}</div>
          </div>
          <div
            style={{
              fontSize: 12,
              color: T.textMuted,
              fontFamily: T.fontMono,
              background: T.bgWarm,
              padding: "4px 10px",
              borderRadius: 20,
            }}
          >
            {article.readTime} min
          </div>
        </div>
      </div>
    </article>
  );
};

// ─── ARTICLE DETAIL VIEW ────────────────────────────────────────
const ArticleDetail = ({ article, onBack }) => {
  const cat = getCategoryInfo(article.category);

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          background: T.surface,
          color: T.text,
          fontSize: 14,
          fontFamily: T.font,
          cursor: "pointer",
          marginBottom: 24,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.borderColor = T.orange)}
        onMouseLeave={(e) => (e.target.style.borderColor = T.border)}
      >
        ← Retour au blog
      </button>

      {/* Hero */}
      <div
        style={{
          background: article.heroImg,
          borderRadius: T.radiusXl,
          minHeight: 300,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "40px 48px",
          marginBottom: 40,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%)", borderRadius: T.radiusXl }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 700 }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {cat.icon} {cat.label}
          </span>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "#fff",
              margin: 0,
            }}
          >
            {article.title}
          </h1>
        </div>
      </div>

      {/* Meta bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 40,
          padding: "20px 24px",
          background: T.surface,
          borderRadius: T.radiusLg,
          border: `1px solid ${T.borderLight}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {article.author.avatar}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{article.author.name}</div>
            <div style={{ fontSize: 13, color: T.textMuted }}>{formatDate(article.date)}</div>
          </div>
        </div>
        <div style={{ width: 1, height: 30, background: T.borderLight }} />
        <div style={{ fontSize: 13, color: T.textMuted, fontFamily: T.fontMono }}>⏱ {article.readTime} min de lecture</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {article.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: T.orangeLight,
                color: T.orange,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Article body */}
      <div
        style={{
          maxWidth: 740,
          margin: "0 auto",
          fontFamily: T.font,
          fontSize: 17,
          lineHeight: 1.8,
          color: T.textBody,
        }}
      >
        {article.content.split("\n\n").map((para, i) => {
          if (para.startsWith("**") && para.endsWith("**")) {
            const text = para.replace(/\*\*/g, "");
            return (
              <h2
                key={i}
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 26,
                  fontWeight: 400,
                  color: T.text,
                  margin: "40px 0 16px",
                  lineHeight: 1.25,
                }}
              >
                {text}
              </h2>
            );
          }
          // Handle inline bold
          const parts = para.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i} style={{ margin: "0 0 20px" }}>
              {parts.map((part, j) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={j} style={{ color: T.text, fontWeight: 600 }}>
                      {part.replace(/\*\*/g, "")}
                    </strong>
                  );
                }
                // Handle bullet points
                if (part.includes("• ")) {
                  return part.split("\n").map((line, k) => {
                    if (line.startsWith("• ")) {
                      return (
                        <span key={k} style={{ display: "block", paddingLeft: 20, position: "relative", margin: "6px 0" }}>
                          <span style={{ position: "absolute", left: 0, color: T.orange }}>•</span>
                          {line.slice(2)}
                        </span>
                      );
                    }
                    return <span key={k}>{line}</span>;
                  });
                }
                // Handle numbered items
                if (/^\d+\.\s/.test(part)) {
                  return part.split("\n").map((line, k) => (
                    <span key={k} style={{ display: "block", paddingLeft: 24, position: "relative", margin: "6px 0" }}>
                      <span style={{ position: "absolute", left: 0, color: T.orange, fontWeight: 700, fontFamily: T.fontMono, fontSize: 14 }}>
                        {line.match(/^\d+/)?.[0]}.
                      </span>
                      {line.replace(/^\d+\.\s/, "")}
                    </span>
                  ));
                }
                return part;
              })}
            </p>
          );
        })}
      </div>

      {/* CTA bottom */}
      <div
        style={{
          maxWidth: 740,
          margin: "48px auto 0",
          padding: "32px",
          background: T.orangeLight,
          border: `1px solid ${T.orangeGlow}`,
          borderRadius: T.radiusLg,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 13, fontFamily: T.fontMono, color: T.orange, marginBottom: 8, letterSpacing: 1 }}>
          SUNTREX MARKETPLACE
        </div>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 400, color: T.text, margin: "0 0 12px" }}>
          Comparez les prix de {article.category === "brand" ? "ces produits" : "l'équipement solaire"} sur SUNTREX
        </h3>
        <p style={{ color: T.textMuted, fontSize: 15, margin: "0 0 20px" }}>
          638+ produits, vendeurs vérifiés, prix compétitifs. Inscrivez-vous gratuitement.
        </p>
        <button
          style={{
            padding: "14px 36px",
            borderRadius: T.radius,
            border: "none",
            background: T.orange,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            fontFamily: T.font,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.background = T.orangeHover)}
          onMouseLeave={(e) => (e.target.style.background = T.orange)}
        >
          Voir le catalogue →
        </button>
      </div>
    </div>
  );
};

// ─── MAIN BLOG PAGE ─────────────────────────────────────────────
export default function SuntrexBlog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const filtered = ARTICLES.filter((a) => {
    const matchCat = activeCategory === "all" || a.category === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const featuredArticles = filtered.filter((a) => a.featured);
  const regularArticles = filtered.filter((a) => !a.featured);

  if (selectedArticle) {
    return (
      <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          * { box-sizing: border-box; }
          ::selection { background: ${T.orangeLight}; color: ${T.orange}; }
          input::placeholder { color: ${T.textDim}; }
        `}</style>

        {/* Header */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(250,250,247,0.85)",
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${T.borderLight}`,
            padding: "14px 0",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 800 }}>
                S
              </div>
              <span style={{ fontWeight: 700, fontSize: 18, color: T.text }}>SUNTREX</span>
              <span style={{ fontSize: 14, color: T.textDim, marginLeft: 4 }}>/ Blog</span>
            </div>
            <button
              style={{
                padding: "10px 24px",
                borderRadius: T.radius,
                border: "none",
                background: T.orange,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: T.font,
                cursor: "pointer",
              }}
            >
              Voir le catalogue
            </button>
          </div>
        </header>

        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
          <ArticleDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
        </main>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        * { box-sizing: border-box; }
        ::selection { background: ${T.orangeLight}; color: ${T.orange}; }
        input::placeholder { color: ${T.textDim}; }
        @media (max-width: 768px) {
          .blog-featured-grid { grid-template-columns: 1fr !important; }
          .blog-featured-card { flex-direction: column !important; height: auto !important; }
          .blog-featured-card > div:first-child { min-height: 200px !important; width: 100% !important; }
          .blog-grid { grid-template-columns: 1fr !important; }
          .blog-hero-title { font-size: 36px !important; }
          .blog-filters { overflow-x: auto; flex-wrap: nowrap !important; }
        }
      `}</style>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(250,250,247,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.borderLight}`,
          padding: "14px 0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${T.orange}, ${T.amber})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              S
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: T.text }}>SUNTREX</span>
            <span style={{ fontSize: 14, color: T.textDim, marginLeft: 4 }}>/ Blog</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              style={{
                padding: "10px 24px",
                borderRadius: T.radius,
                border: "none",
                background: T.orange,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: T.font,
                cursor: "pointer",
              }}
            >
              Voir le catalogue
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Hero Section */}
        <section
          style={{
            padding: "64px 0 48px",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "none" : "translateY(20px)",
            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <div style={{ maxWidth: 700 }}>
            <div
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: 20,
                background: T.orangeLight,
                color: T.orange,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: T.fontMono,
                letterSpacing: 0.5,
                marginBottom: 20,
              }}
            >
              ☀ SUNTREX INSIGHTS
            </div>
            <h1
              className="blog-hero-title"
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 400,
                lineHeight: 1.05,
                color: T.text,
                margin: "0 0 16px",
              }}
            >
              L'intelligence marché{" "}
              <em style={{ fontStyle: "italic", color: T.orange }}>solaire</em>, par les pros, pour les pros
            </h1>
            <p style={{ fontSize: 18, color: T.textMuted, lineHeight: 1.6, margin: 0 }}>
              Analyses de marché, comparatifs produits, guides techniques et réglementation. Tout ce que les installateurs et distributeurs PV doivent savoir.
            </p>
          </div>
        </section>

        {/* Search + Filters */}
        <section style={{ marginBottom: 40 }}>
          {/* Search */}
          <div style={{ position: "relative", marginBottom: 20, maxWidth: 480 }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: T.textDim, fontSize: 18 }}>
              ⌕
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article, une marque, un sujet..."
              style={{
                width: "100%",
                padding: "14px 18px 14px 44px",
                borderRadius: T.radiusLg,
                border: `1px solid ${T.border}`,
                background: T.surface,
                fontSize: 15,
                fontFamily: T.font,
                color: T.text,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.orange)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </div>

          {/* Category filters */}
          <div className="blog-filters" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 20,
                    border: `1px solid ${isActive ? T.orange : T.border}`,
                    background: isActive ? T.orange : T.surface,
                    color: isActive ? "#fff" : T.textBody,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: T.font,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 4,
                  height: 24,
                  borderRadius: 2,
                  background: T.orange,
                }}
              />
              <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 400, color: T.text, margin: 0 }}>À la une</h2>
            </div>
            <div className="blog-featured-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
              {featuredArticles.map((article) => (
                <div key={article.id} className="blog-featured-card">
                  <ArticleCard article={article} variant="featured" onClick={setSelectedArticle} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Articles Grid + Sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 40, alignItems: "start" }}>
          {/* Main column */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: T.amber }} />
              <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 400, color: T.text, margin: 0 }}>
                {activeCategory === "all" ? "Derniers articles" : getCategoryInfo(activeCategory).label}
              </h2>
              <span style={{ fontSize: 13, color: T.textDim, fontFamily: T.fontMono }}>
                {filtered.length} article{filtered.length > 1 ? "s" : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  background: T.surface,
                  borderRadius: T.radiusLg,
                  border: `1px solid ${T.borderLight}`,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: T.textMuted, fontSize: 16 }}>Aucun article trouvé pour cette recherche.</p>
              </div>
            ) : (
              <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {(regularArticles.length > 0 ? regularArticles : filtered).map((article, i) => (
                  <div
                    key={article.id}
                    style={{
                      opacity: loaded ? 1 : 0,
                      transform: loaded ? "none" : "translateY(20px)",
                      transition: `all 0.5s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.08}s`,
                    }}
                  >
                    <ArticleCard article={article} onClick={setSelectedArticle} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside
            style={{
              position: "sticky",
              top: 80,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
            className="blog-sidebar"
          >
            {/* Newsletter */}
            <NewsletterCTA />

            {/* Popular tags */}
            <div
              style={{
                background: T.surface,
                borderRadius: T.radiusLg,
                padding: "24px",
                border: `1px solid ${T.borderLight}`,
              }}
            >
              <h4 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 400, color: T.text, margin: "0 0 16px" }}>
                Sujets populaires
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["N-type TOPCon", "Huawei", "Stockage", "France", "Onduleurs", "Deye", "Intersolar", "Batteries LFP", "Prix modules", "EPBD"].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: `1px solid ${T.border}`,
                        background: "transparent",
                        color: T.textBody,
                        fontSize: 13,
                        fontFamily: T.font,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = T.orange;
                        e.target.style.color = T.orange;
                        e.target.style.background = T.orangeLight;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = T.border;
                        e.target.style.color = T.textBody;
                        e.target.style.background = "transparent";
                      }}
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* SUNTREX Stats */}
            <div
              style={{
                background: `linear-gradient(135deg, ${T.text} 0%, #2a2a28 100%)`,
                borderRadius: T.radiusLg,
                padding: "24px",
                color: "#fff",
              }}
            >
              <h4 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 400, margin: "0 0 16px" }}>
                SUNTREX en chiffres
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { n: "638+", l: "Produits" },
                  { n: "15+", l: "Marques" },
                  { n: "-5%", l: "vs concurrents" },
                  { n: "24/7", l: "Support" },
                ].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: T.orange, fontFamily: T.fontMono }}>{s.n}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Responsive sidebar hide */}
        <style>{`
          @media (max-width: 960px) {
            .blog-sidebar { display: none !important; }
            main > div:last-child { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </main>
    </div>
  );
}
