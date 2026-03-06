import { Helmet } from "react-helmet-async";

var BASE_URL = "https://suntrex.eu";
var DEFAULT_IMAGE = BASE_URL + "/suntrex-og.png";

var ROUTES = {
  "/": {
    title: "SUNTREX — Marketplace B2B équipements photovoltaïques Europe",
    description: "Achetez et vendez des panneaux solaires, onduleurs, batteries et accessoires PV entre professionnels européens. Commissions 5% inférieures, livraison vérifiée, support réactif.",
  },
  "/catalog": {
    title: "Catalogue — Panneaux solaires, onduleurs, batteries | SUNTREX",
    description: "Parcourez notre catalogue de 600+ équipements photovoltaïques : panneaux solaires, onduleurs, batteries, systèmes de montage. Prix réservés aux professionnels vérifiés.",
  },
  "/blog": {
    title: "Blog — Actualités solaire et photovoltaïque | SUNTREX",
    description: "Restez informé des dernières actualités du secteur photovoltaïque européen, guides techniques, analyses de marché et conseils pour professionnels du solaire.",
  },
  "/faq": {
    title: "FAQ — Questions fréquentes | SUNTREX",
    description: "Trouvez les réponses à vos questions sur SUNTREX : inscription, achat, vente, livraison, paiements, KYC et support technique.",
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

export default function PageMeta({ path }) {
  // Normalize path: strip trailing slash, match /catalog/* to /catalog
  var normalized = (path || "/").replace(/\/$/, "") || "/";
  var base = normalized.split("/").slice(0, 2).join("/") || "/";

  var meta = ROUTES[normalized] || ROUTES[base] || ROUTES["/"];
  var canonical = BASE_URL + (normalized === "/" ? "" : normalized);

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
    </Helmet>
  );
}
