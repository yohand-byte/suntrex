import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   SUNTREX — Centre d'aide / FAQ
   Professional B2B solar marketplace help center
   Categories: Orders, Delivery, Registration/KYC, Technical PV
   ═══════════════════════════════════════════════════════════════════════ */

const B = {
  orange: "#E8700A", orangeLight: "#FFF4E8", orangeDark: "#C45E08",
  dark: "#0F1923", text: "#1a2b3d", muted: "#64748b", light: "#f8fafc",
  white: "#fff", border: "#e2e8f0", green: "#10b981", greenLight: "#ecfdf5",
  blue: "#3b82f6", blueLight: "#eff6ff", purple: "#8b5cf6", purpleLight: "#f5f3ff",
  red: "#ef4444", redLight: "#fef2f2",
};

const CATEGORIES = [
  {
    id: "orders", icon: "💳", label: "Commandes & Paiements", color: B.blue, bg: B.blueLight,
    description: "Passer commande, moyens de paiement, factures, commissions",
    faqs: [
      {
        q: "Comment passer une commande sur SUNTREX ?",
        a: `Après inscription et vérification de votre compte, parcourez le catalogue ou utilisez la recherche pour trouver un produit. Cliquez sur une offre pour voir le détail, puis sur **"Démarrer une négociation"**. Vous entrez alors dans un chat direct avec le vendeur où vous pouvez discuter prix, quantités et délais. Une fois d'accord, le vendeur confirme la transaction et vous recevez un lien de paiement sécurisé Stripe.`
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: `SUNTREX utilise **Stripe** pour garantir la sécurité de chaque transaction. Les moyens acceptés incluent : carte bancaire (Visa, Mastercard, Amex), virement SEPA, et prélèvement SEPA. La **3D Secure (SCA)** est activée systématiquement, conformément à la réglementation européenne. Tous les paiements sont en **EUR**, avec support multi-devises à venir (GBP, CHF, PLN).`
      },
      {
        q: "Comment fonctionne la commission SUNTREX ?",
        a: `SUNTREX prélève une commission de **5% sur chaque transaction** — c'est 5% en dessous de ce que pratiquent nos concurrents. Cette commission est automatiquement déduite lors du transfert au vendeur via Stripe Connect. Le vendeur voit clairement le montant net qu'il recevra avant d'accepter la transaction. Aucuns frais cachés.`
      },
      {
        q: "Comment obtenir ma facture ?",
        a: `Chaque transaction génère automatiquement une facture disponible dans votre espace **Mon compte → Mes achats**. La facture inclut : TVA intra-communautaire, numéros de TVA acheteur et vendeur, détails produits et montants. Vous pouvez la télécharger en PDF à tout moment. Pour les vendeurs, les factures de commission SUNTREX sont disponibles dans **Dashboard vendeur → Factures**.`
      },
      {
        q: "Puis-je annuler une commande ?",
        a: `Tant que le vendeur n'a pas confirmé l'expédition, vous pouvez annuler depuis la page de transaction en cliquant **"Annuler la commande"**. Le remboursement est automatique sous 5-7 jours ouvrés sur votre moyen de paiement. Après expédition, vous devez passer par la procédure de retour (voir section Livraison). En cas de litige, notre équipe support intervient sous 24h.`
      },
      {
        q: "Comment négocier un meilleur prix ?",
        a: `SUNTREX est une marketplace B2B — la négociation fait partie du process. Depuis la page d'un produit, cliquez **"Négocier le prix"** pour ouvrir un chat direct avec le vendeur. Vous pouvez proposer un prix, demander un tarif volume (paliers dégressifs), ou grouper plusieurs produits. Le vendeur peut accepter, contre-proposer ou refuser. Toutes les négociations sont tracées et modérées.`
      },
    ]
  },
  {
    id: "delivery", icon: "🚚", label: "Livraison & SUNTREX DELIVERY", color: B.green, bg: B.greenLight,
    description: "Suivi colis, délais, vérification, assurance transport",
    faqs: [
      {
        q: "Qu'est-ce que SUNTREX DELIVERY ?",
        a: `**SUNTREX DELIVERY** est notre service de livraison intégré qui apporte confiance et transparence à chaque envoi. Il inclut : tracking temps réel avec QR code unique par colis, photos du colis à l'expédition et à la réception, GPS timestamping à chaque étape, e-signature à la livraison, et assurance transport complète. Le vendeur et l'acheteur suivent le même colis en temps réel.`
      },
      {
        q: "Comment suivre ma commande ?",
        a: `Rendez-vous dans **Mon compte → Mes achats** et cliquez sur le numéro de suivi. Vous verrez : la position du colis en temps réel sur une carte, les photos prises par le vendeur à l'expédition, les timestamps GPS à chaque point de transit, et le statut détaillé (préparation, enlevé, en transit, en livraison, livré). Vous pouvez aussi scanner le QR code du colis pour vérifier son authenticité.`
      },
      {
        q: "Quels sont les délais de livraison ?",
        a: `Les délais dépendent de la localisation du vendeur et de la destination. En moyenne : **2-4 jours ouvrés** pour les livraisons nationales, **4-8 jours** pour l'intra-européen (France, Allemagne, Benelux, Italie, Espagne). Les délais exacts sont calculés automatiquement à la commande selon les codes postaux. Le vendeur confirme un créneau d'enlèvement sous 24-48h après paiement.`
      },
      {
        q: "Que faire si mon colis arrive endommagé ?",
        a: `Grâce à SUNTREX DELIVERY, vous avez des preuves photo à chaque étape. À la réception : **prenez des photos immédiatement** et notez les dommages visibles sur le bon de livraison. Puis allez dans **Mes achats → Signaler un problème**. Joignez vos photos et notre équipe compare avec les photos d'expédition. L'assurance transport couvre 100% de la valeur des produits. Résolution sous 48-72h maximum.`
      },
      {
        q: "Comment fonctionne la vérification des colis ?",
        a: `Chaque colis SUNTREX DELIVERY a un **QR code unique**. À la réception, scannez-le avec votre téléphone pour : vérifier l'authenticité de l'envoi, confirmer que le contenu correspond à la commande, voir les photos d'expédition prises par le vendeur, et déclencher la confirmation de réception. Cette vérification protège à la fois l'acheteur et le vendeur en cas de litige.`
      },
      {
        q: "Puis-je retourner un produit ?",
        a: `Vous disposez de **14 jours** après réception pour initier un retour. Le produit doit être dans son emballage d'origine, non installé. Allez dans **Mes achats → Retourner un produit** : vous recevrez une étiquette retour SUNTREX DELIVERY. Le remboursement est effectué sous 5-7 jours après réception et vérification par le vendeur. Les frais de retour sont à la charge de l'acheteur sauf défaut constaté.`
      },
    ]
  },
  {
    id: "registration", icon: "🔐", label: "Inscription & KYC", color: B.purple, bg: B.purpleLight,
    description: "Créer un compte, vérification pro, accès aux prix",
    faqs: [
      {
        q: "Comment créer un compte SUNTREX ?",
        a: `L'inscription est gratuite et prend moins de 2 minutes. Cliquez **"S'inscrire"** en haut à droite, puis renseignez : votre email professionnel, le nom de votre entreprise, votre pays, et un mot de passe. Vous devez accepter les CGV et la politique de confidentialité (obligatoire). Les consentements marketing SUNTREX et partenaires sont optionnels. Confirmez votre email et vous avez immédiatement accès aux prix B2B.`
      },
      {
        q: "Pourquoi les prix sont-ils masqués ?",
        a: `SUNTREX est une plateforme **réservée aux professionnels du solaire**. Les prix B2B sont masqués pour les visiteurs non inscrits afin de protéger nos vendeurs et garantir un environnement professionnel. Dès que vous créez un compte et confirmez votre email, tous les prix sont débloqués. C'est gratuit et instantané — pas besoin d'attendre une validation manuelle pour voir les prix.`
      },
      {
        q: "Qu'est-ce que le KYC et pourquoi est-ce nécessaire ?",
        a: `Le **KYC (Know Your Customer)** est une vérification d'identité obligatoire pour la sécurité de la marketplace. Chez SUNTREX, le KYC est **simplifié** pour ne pas alourdir l'onboarding : nom de l'entreprise et numéro SIRET/TVA intra-communautaire suffisent pour démarrer. Pour les vendeurs, une vérification complémentaire Stripe (KYB) est nécessaire avant de recevoir des paiements. Le processus complet prend 24-48h.`
      },
      {
        q: "Comment devenir vendeur sur SUNTREX ?",
        a: `Après création de votre compte acheteur, cliquez sur **"Vendre sur SUNTREX"** dans votre dashboard. Vous devrez fournir : informations entreprise complètes, numéro de TVA intra-communautaire, compléter l'onboarding Stripe Connect (compte bancaire, identité du dirigeant). Notre équipe vérifie votre profil sous 24-48h. Une fois validé, vous pouvez lister vos produits et recevoir des commandes.`
      },
      {
        q: "Comment fonctionne la vérification vendeur ?",
        a: `SUNTREX applique un système de **badges de confiance** progressifs : **Vérifié** (KYC + KYB Stripe validés), **Fiable** (10+ transactions sans litige), **Super Vendeur** (50+ transactions, note > 4.5/5, temps de réponse < 2h). Chaque vendeur est vérifié avant de pouvoir lister des produits. Nous contrôlons : existence légale de l'entreprise, TVA active, identité du dirigeant via Stripe, et historique commercial si disponible.`
      },
      {
        q: "J'ai oublié mon mot de passe, que faire ?",
        a: `Sur la page de connexion, cliquez **"Mot de passe oublié"**. Entrez votre email — vous recevrez un lien de réinitialisation valable 1 heure. Si vous n'avez pas reçu l'email, vérifiez vos spams. Si le problème persiste, contactez notre support : **support@suntrex.eu** ou via le chat en bas à droite du site. Notre équipe répond en moins de 2 minutes en horaire ouvré.`
      },
    ]
  },
  {
    id: "technical", icon: "⚡", label: "Questions techniques PV", color: B.orange, bg: B.orangeLight,
    description: "Compatibilité, dimensionnement, certifications, normes",
    faqs: [
      {
        q: "Comment choisir entre un onduleur Huawei et Deye ?",
        a: `Les deux marques sont disponibles sur SUNTREX à prix compétitifs. **Huawei SUN2000** : fiabilité éprouvée, monitoring avancé (FusionSolar), optimiseurs MPPT, idéal pour le résidentiel premium et C&I. **Deye Hybrid** : excellent rapport qualité-prix, compatible multi-batteries, idéal pour le stockage résidentiel et les projets sensibles au budget. Utilisez notre **Comparateur IA** pour une recommandation personnalisée selon votre projet.`
      },
      {
        q: "Quelle technologie de panneau choisir en 2026 ?",
        a: `Le marché 2026 est dominé par le **N-type TOPCon** qui représente plus de 70% des livraisons. Avantages : meilleur rendement (22-23%), coefficient de température plus bas, meilleure performance en faible luminosité, et LID (dégradation initiale) quasi nulle. Les leaders disponibles sur SUNTREX : **Risen Energy, Trina Solar, Jinko Solar, Canadian Solar, LONGi**. Le HJT reste un segment premium avec des rendements de 23-24%.`
      },
      {
        q: "Comment dimensionner un système de stockage ?",
        a: `Le dimensionnement dépend de votre usage. En **autoconsommation résidentielle** : capacité batterie = consommation nocturne × 1.2 (typiquement 5-10 kWh). En **backup** : puissance de secours souhaitée × autonomie (ex: 5 kW × 4h = 20 kWh). En **peak shaving C&I** : analysez le profil de charge pour dimensionner. Sur SUNTREX, retrouvez les gammes **Huawei LUNA2000** (modulaire par 5 kWh), **BYD HVS/HVM**, et **Deye SE-G5.x** aux meilleurs prix B2B.`
      },
      {
        q: "Quelles certifications vérifier pour mes produits ?",
        a: `Pour le marché européen, les certifications essentielles sont : **IEC 61215** et **IEC 61730** pour les modules PV, **IEC 62109** pour les onduleurs, **EN 50549-1/2** pour le raccordement réseau, et **VDE-AR-N 4105** pour l'Allemagne. Côté batteries : **IEC 62619** (Li-ion stationnaire) et **UN 38.3** (transport). Sur SUNTREX, chaque fiche produit indique les certifications disponibles et vous pouvez télécharger les datasheets officiels.`
      },
      {
        q: "Comment vérifier la compatibilité onduleur-batterie ?",
        a: `Tous les fabricants publient des listes de compatibilité officielles. Sur SUNTREX : chaque fiche onduleur indique les batteries compatibles, et vice-versa. Règles de base : vérifiez la **plage de tension** (MPP range de l'onduleur vs tension nominale de la batterie), le **protocole de communication** (CAN, RS485, ou propriétaire), et la **puissance de charge/décharge** maximale. Notre **Comparateur IA** peut vérifier automatiquement la compatibilité de votre configuration.`
      },
      {
        q: "Quelle est la différence entre un onduleur string et micro-onduleur ?",
        a: `**Onduleur string** (Huawei SUN2000, SMA, Sungrow) : un appareil centralise la conversion DC→AC. Plus économique sur les grandes installations, maintenance centralisée, monitoring par string. **Micro-onduleur** (Enphase, Hoymiles) : un appareil par panneau. Optimisation individuelle, pas de point de défaillance unique, idéal pour les toitures avec ombrage. **Optimiseurs** (Huawei, SolarEdge) : ajoutent l'optimisation par panneau à un onduleur string. Le choix dépend de l'ombrage, la taille d'installation et le budget.`
      },
    ]
  }
];

const CONTACT_CHANNELS = [
  { icon: "💬", label: "Chat en ligne", sub: "Réponse < 2 min", action: "chat" },
  { icon: "📧", label: "Email", sub: "support@suntrex.eu", action: "mailto:support@suntrex.eu" },
  { icon: "📱", label: "WhatsApp", sub: "+33 7 XX XX XX XX", action: "https://wa.me/337XXXXXXXX" },
  { icon: "📞", label: "Téléphone", sub: "Lun-Ven 9h-18h CET", action: "tel:+33XXXXXXXXX" },
];

/* ── Accordion Item ── */
function FAQItem({ faq, isOpen, onToggle, idx }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  // Simple markdown bold
  const renderText = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: B.dark, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div style={{
      border: `1px solid ${isOpen ? B.orange + "40" : B.border}`,
      borderRadius: 12,
      marginBottom: 8,
      background: isOpen ? B.orangeLight + "60" : B.white,
      transition: "all 0.25s ease",
      overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "18px 20px", border: "none", background: "transparent",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: isOpen ? B.orange : B.light,
            color: isOpen ? B.white : B.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, flexShrink: 0,
            transition: "all 0.25s ease",
          }}>{idx + 1}</span>
          <span style={{
            fontSize: 15, fontWeight: isOpen ? 600 : 500, color: B.text,
            lineHeight: 1.4,
          }}>{faq.q}</span>
        </div>
        <span style={{
          fontSize: 18, color: isOpen ? B.orange : B.muted,
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.25s ease", flexShrink: 0,
        }}>+</span>
      </button>
      <div style={{
        height, overflow: "hidden",
        transition: "height 0.3s ease",
      }}>
        <div ref={contentRef} style={{
          padding: "0 20px 18px 60px",
          fontSize: 14, lineHeight: 1.75, color: B.muted,
        }}>
          {faq.a.split("\n").map((line, i) => (
            <p key={i} style={{ margin: "0 0 8px" }}>{renderText(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Category Card ── */
function CategoryCard({ cat, isActive, onClick, count }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "20px 18px", borderRadius: 14, border: `2px solid ${isActive ? cat.color : B.border}`,
        background: isActive ? cat.bg : hov ? B.light : B.white,
        cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.2s ease",
        transform: hov && !isActive ? "translateY(-2px)" : "none",
        boxShadow: isActive ? `0 4px 16px ${cat.color}20` : hov ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
        display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 28 }}>{cat.icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
          background: isActive ? cat.color + "20" : B.light,
          color: isActive ? cat.color : B.muted,
        }}>{count} questions</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: B.text }}>{cat.label}</div>
      <div style={{ fontSize: 12, color: B.muted, lineHeight: 1.5 }}>{cat.description}</div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function SuntrexHelpCenter() {
  const [activeCat, setActiveCat] = useState("orders");
  const [openFAQ, setOpenFAQ] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [hovCTA, setHovCTA] = useState(false);

  // Search logic
  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const q = search.toLowerCase().trim();
    const results = [];
    CATEGORIES.forEach(cat => {
      cat.faqs.forEach((faq, idx) => {
        if (faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)) {
          results.push({ ...faq, catId: cat.id, catLabel: cat.label, catIcon: cat.icon, catColor: cat.color, idx });
        }
      });
    });
    setSearchResults(results);
  }, [search]);

  const currentCat = CATEGORIES.find(c => c.id === activeCat);
  const isSearching = searchResults !== null;

  return (
    <div style={{ minHeight: "100vh", background: B.light, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

      {/* ═══ HERO ═══ */}
      <div style={{
        background: `linear-gradient(135deg, ${B.dark} 0%, #1a3550 50%, ${B.dark} 100%)`,
        padding: "60px 24px 50px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: B.orange + "10" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: B.orange + "08" }} />
        
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px",
            background: "rgba(232,112,10,0.15)", borderRadius: 20, marginBottom: 20,
            border: "1px solid rgba(232,112,10,0.25)",
          }}>
            <span style={{ fontSize: 14 }}>☀️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: B.orange, letterSpacing: "0.5px" }}>CENTRE D'AIDE SUNTREX</span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800, color: B.white, margin: "0 0 12px", lineHeight: 1.15,
          }}>
            Comment pouvons-nous{" "}
            <span style={{ color: B.orange }}>vous aider</span> ?
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Retrouvez toutes les réponses sur la marketplace, les paiements, la livraison et les équipements PV.
          </p>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: B.white, borderRadius: 14, padding: "4px 6px 4px 20px",
            maxWidth: 520, margin: "0 auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            <span style={{ fontSize: 18, color: B.muted }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 15,
                padding: "14px 0", background: "transparent", color: B.text,
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                border: "none", background: B.light, borderRadius: 8,
                padding: "8px 12px", cursor: "pointer", fontSize: 12,
                color: B.muted, fontWeight: 600,
              }}>Effacer</button>
            )}
          </div>

          {isSearching && (
            <div style={{
              marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.6)",
            }}>
              {searchResults.length} résultat{searchResults.length !== 1 ? "s" : ""} trouvé{searchResults.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* Search Results */}
        {isSearching ? (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 24,
            }}>
              <span style={{ fontSize: 20 }}>🔍</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: 0 }}>
                Résultats pour « {search} »
              </h2>
            </div>
            {searchResults.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                background: B.white, borderRadius: 16,
                border: `1px solid ${B.border}`,
              }}>
                <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>🔎</span>
                <p style={{ fontSize: 16, fontWeight: 600, color: B.text, margin: "0 0 8px" }}>
                  Aucun résultat trouvé
                </p>
                <p style={{ fontSize: 14, color: B.muted, margin: "0 0 20px" }}>
                  Essayez avec d'autres termes ou parcourez les catégories ci-dessous.
                </p>
                <button
                  onClick={() => setSearch("")}
                  style={{
                    padding: "10px 24px", borderRadius: 10,
                    background: B.orange, color: B.white, border: "none",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >Voir toutes les catégories</button>
              </div>
            ) : (
              <div>
                {searchResults.map((r, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      marginBottom: 4, padding: "2px 10px", borderRadius: 12,
                      background: CATEGORIES.find(c => c.id === r.catId)?.bg || B.light,
                      fontSize: 11, fontWeight: 600,
                      color: r.catColor,
                    }}>
                      {r.catIcon} {r.catLabel}
                    </div>
                    <FAQItem
                      faq={r}
                      isOpen={openFAQ === `search-${i}`}
                      onToggle={() => setOpenFAQ(openFAQ === `search-${i}` ? null : `search-${i}`)}
                      idx={r.idx}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Category Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12, marginBottom: 36,
            }}>
              {CATEGORIES.map(cat => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  isActive={activeCat === cat.id}
                  onClick={() => { setActiveCat(cat.id); setOpenFAQ(null); }}
                  count={cat.faqs.length}
                />
              ))}
            </div>

            {/* Active Category Title */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
              paddingBottom: 16, borderBottom: `2px solid ${currentCat.color}20`,
            }}>
              <span style={{ fontSize: 28 }}>{currentCat.icon}</span>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: B.text, margin: 0 }}>
                  {currentCat.label}
                </h2>
                <p style={{ fontSize: 13, color: B.muted, margin: "2px 0 0" }}>
                  {currentCat.faqs.length} questions fréquentes
                </p>
              </div>
            </div>

            {/* FAQ Accordions */}
            <div>
              {currentCat.faqs.map((faq, idx) => (
                <FAQItem
                  key={`${activeCat}-${idx}`}
                  faq={faq}
                  isOpen={openFAQ === `${activeCat}-${idx}`}
                  onToggle={() => setOpenFAQ(openFAQ === `${activeCat}-${idx}` ? null : `${activeCat}-${idx}`)}
                  idx={idx}
                />
              ))}
            </div>
          </>
        )}

        {/* ═══ CONTACT SECTION ═══ */}
        <div style={{
          marginTop: 48, padding: "36px 28px", borderRadius: 20,
          background: `linear-gradient(135deg, ${B.dark} 0%, #1a3550 100%)`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: B.orange + "15" }} />
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: B.white, margin: "0 0 6px" }}>
              Vous n'avez pas trouvé votre réponse ?
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>
              Notre équipe support répond en moins de 2 minutes. Multi-canal, réactif, professionnel.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}>
              {CONTACT_CHANNELS.map((ch, i) => (
                <div key={i} style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}>
                  <span style={{ fontSize: 22 }}>{ch.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: B.white }}>{ch.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{ch.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ CTA ═══ */}
        <div style={{
          marginTop: 32, textAlign: "center", padding: "40px 24px",
          background: B.white, borderRadius: 20, border: `1px solid ${B.border}`,
        }}>
          <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>☀️</span>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: B.text, margin: "0 0 8px" }}>
            Prêt à comparer les meilleurs prix PV ?
          </h3>
          <p style={{ fontSize: 14, color: B.muted, margin: "0 0 24px", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
            Inscrivez-vous gratuitement et accédez aux prix B2B de milliers de vendeurs vérifiés en Europe.
          </p>
          <button
            onMouseEnter={() => setHovCTA(true)}
            onMouseLeave={() => setHovCTA(false)}
            style={{
              padding: "14px 36px", borderRadius: 12, border: "none",
              background: hovCTA
                ? `linear-gradient(135deg, ${B.orangeDark}, ${B.orange})`
                : `linear-gradient(135deg, ${B.orange}, ${B.orangeDark})`,
              color: B.white, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              boxShadow: hovCTA ? `0 8px 24px ${B.orange}40` : `0 4px 16px ${B.orange}25`,
              transition: "all 0.25s ease",
              transform: hovCTA ? "translateY(-2px)" : "none",
            }}
          >Créer mon compte gratuit →</button>
        </div>

        {/* ═══ SEO / SCHEMA.ORG ═══ */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": CATEGORIES.flatMap(cat =>
            cat.faqs.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": { "@type": "Answer", "text": faq.a.replace(/\*\*/g, "") }
            }))
          )
        })}} />
      </div>
    </div>
  );
}
