import { Helmet } from "react-helmet-async";

var BASE_URL = (import.meta.env.VITE_SITE_URL || "https://suntrex.vercel.app").replace(/\/$/, "");
var DEFAULT_IMAGE = BASE_URL + "/suntrex-og.png";

var ROUTES = {
  "/": {
    title: "SUNTREX — Marketplace B2B équipements photovoltaïques Europe",
    description: "Marketplace B2B photovoltaïque européenne. Comparez les prix de vendeurs vérifiés. Commission -5%, livraison vérifiée, 638 produits.",
  },
  "/catalog": {
    title: "Catalogue — Panneaux solaires, onduleurs, batteries | SUNTREX",
    description: "Catalogue de 600+ équipements PV : panneaux, onduleurs, batteries, montage. Prix réservés aux pros vérifiés.",
  },
  "/blog": {
    title: "Blog — Actualités solaire et photovoltaïque | SUNTREX",
    description: "Restez informé des dernières actualités du secteur photovoltaïque européen, guides techniques, analyses de marché et conseils pour professionnels du solaire.",
  },
  "/faq": {
    title: "FAQ — Questions fréquentes | SUNTREX",
    description: "Trouvez les réponses à vos questions sur SUNTREX : inscription, achat, vente, livraison, paiements, KYC et support technique.",
  },
  "/offers": {
    title: "Offres B2B photovoltaïque — vendeurs vérifiés | SUNTREX",
    description: "Consultez les offres SUNTREX pour panneaux, onduleurs, batteries et accessoires photovoltaïques proposées par des vendeurs professionnels vérifiés.",
  },
  "/admin": {
    title: "Admin Dashboard | SUNTREX",
    description: "Tableau de bord administrateur SUNTREX — gestion des transactions, vendeurs, utilisateurs et commissions.",
  },
  "/dashboard": {
    title: "Mon Dashboard | SUNTREX",
    description: "Gérez vos achats, ventes, offres et commandes depuis votre tableau de bord SUNTREX.",
  },
  "/about": {
    title: "À propos de SUNTREX — Marketplace B2B photovoltaïque",
    description: "Découvrez SUNTREX, la marketplace B2B européenne pour les équipements solaires. Commission 4.75%, livraison vérifiée, support multi-canal.",
  },
  "/cgv": {
    title: "Conditions Générales de Vente | SUNTREX",
    description: "Consultez les conditions générales de vente et d'utilisation de la plateforme SUNTREX.",
  },
  "/privacy": {
    title: "Politique de Confidentialité | SUNTREX",
    description: "Notre politique de confidentialité détaille comment SUNTREX protège vos données personnelles conformément au RGPD.",
  },
  "/product": {
    title: "Fiche produit — Équipement photovoltaïque | SUNTREX",
    description: "Consultez les spécifications techniques, prix et offres de vendeurs pour cet équipement photovoltaïque sur SUNTREX.",
  },
  "/delivery": {
    title: "Suivi de livraison SUNTREX DELIVERY",
    description: "Suivez votre colis en temps réel avec SUNTREX DELIVERY : vérification QR, photos, GPS et preuve de livraison.",
  },
};

var ORG_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SUNTREX",
  "url": "https://suntrex.vercel.app",
  "logo": "https://suntrex.vercel.app/suntrex-logo.png",
  "description": "Marketplace B2B photovoltaïque européenne",
  "contactPoint": { "@type": "ContactPoint", "email": "contact@suntrex.eu", "contactType": "customer service" },
  "sameAs": []
});

var WEBSITE_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SUNTREX",
  "url": "https://suntrex.vercel.app",
  "potentialAction": { "@type": "SearchAction", "target": "https://suntrex.vercel.app/catalog?q={search_term_string}", "query-input": "required name=search_term_string" }
});

export default function PageMeta({ path }) {
  // Normalize path: strip trailing slash, match /catalog/* to /catalog
  var normalized = (path || "/").replace(/\/$/, "") || "/";
  var base = normalized.split("/").slice(0, 2).join("/") || "/";

  var meta = ROUTES[normalized] || ROUTES[base] || ROUTES["/"];
  var canonical = BASE_URL + (normalized === "/" ? "" : normalized);
  var isHome = normalized === "/";

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta property="og:site_name" content="SUNTREX" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="fr" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical + "?lang=en"} />
      <link rel="alternate" hrefLang="de" href={canonical + "?lang=de"} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* JSON-LD structured data — homepage only */}
      {isHome && <script type="application/ld+json">{ORG_JSONLD}</script>}
      {isHome && <script type="application/ld+json">{WEBSITE_JSONLD}</script>}
    </Helmet>
  );
}
