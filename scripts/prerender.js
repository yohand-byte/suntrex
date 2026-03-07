#!/usr/bin/env node
/**
 * SUNTREX — Prerender static pages for SEO crawlers
 *
 * Generates static HTML snapshots of key public routes so Google/Bing
 * can index real content instead of an empty SPA shell.
 *
 * Usage: node scripts/prerender.js  (run after vite build)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');

// Routes to prerender (public, crawlable pages)
const ROUTES = [
  '/',
  '/catalog',
  '/blog',
  '/faq',
  '/about',
  '/cgv',
  '/privacy',
];

// Meta tags per route (mirrors PageMeta.jsx)
const META = {
  '/': {
    title: 'SUNTREX — Marketplace B2B equipements photovoltaiques Europe',
    description: 'Achetez et vendez des panneaux solaires, onduleurs, batteries et accessoires PV entre professionnels europeens.',
  },
  '/catalog': {
    title: 'Catalogue — Panneaux solaires, onduleurs, batteries | SUNTREX',
    description: 'Parcourez notre catalogue de 600+ equipements photovoltaiques : panneaux solaires, onduleurs, batteries, systemes de montage.',
  },
  '/blog': {
    title: 'Blog — Actualites solaire et photovoltaique | SUNTREX',
    description: 'Restez informe des dernieres actualites du secteur photovoltaique europeen.',
  },
  '/faq': {
    title: 'FAQ — Questions frequentes | SUNTREX',
    description: 'Trouvez les reponses a vos questions sur SUNTREX : inscription, achat, vente, livraison, paiements.',
  },
  '/about': {
    title: 'A propos de SUNTREX — Marketplace B2B photovoltaique',
    description: 'Decouvrez SUNTREX, la marketplace B2B europeenne pour les equipements solaires.',
  },
  '/cgv': {
    title: 'Conditions Generales de Vente | SUNTREX',
    description: 'Consultez les conditions generales de vente et d\'utilisation de la plateforme SUNTREX.',
  },
  '/privacy': {
    title: 'Politique de Confidentialite | SUNTREX',
    description: 'Notre politique de confidentialite detaille comment SUNTREX protege vos donnees personnelles.',
  },
};

function prerender() {
  const indexHtml = readFileSync(resolve(DIST, 'index.html'), 'utf-8');
  let count = 0;

  for (const route of ROUTES) {
    const meta = META[route] || META['/'];
    const canonical = 'https://suntrex.eu' + (route === '/' ? '' : route);

    // Inject proper meta tags into the HTML shell
    let html = indexHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
      .replace(
        /<meta name="description"[^>]*\/>/,
        `<meta name="description" content="${meta.description}" />`
      )
      .replace(
        /<meta property="og:title"[^>]*\/>/,
        `<meta property="og:title" content="${meta.title}" />`
      )
      .replace(
        /<meta property="og:description"[^>]*\/>/,
        `<meta property="og:description" content="${meta.description}" />`
      )
      .replace(
        /<link rel="canonical"[^>]*\/>/,
        `<link rel="canonical" href="${canonical}" />`
      );

    // Add structured data for homepage
    if (route === '/') {
      const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'SUNTREX',
        url: 'https://suntrex.eu',
        description: meta.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://suntrex.eu/catalog?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      });
      html = html.replace(
        '</head>',
        `<script type="application/ld+json">${jsonLd}</script>\n</head>`
      );
    }

    // Add noscript content for crawlers (semantic HTML with real text)
    const noscriptContent = `
    <noscript>
      <h1>${meta.title}</h1>
      <p>${meta.description}</p>
      <nav>
        <a href="/">Accueil</a> |
        <a href="/catalog">Catalogue</a> |
        <a href="/blog">Blog</a> |
        <a href="/faq">FAQ</a> |
        <a href="/about">A propos</a>
      </nav>
      <p>SUNTREX - Marketplace B2B photovoltaique europeenne. Panneaux solaires, onduleurs, batteries, systemes de montage.</p>
      <p>Marques: Huawei, Deye, Jinko, LONGi, Trina, BYD, SMA, Enphase</p>
    </noscript>`;

    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>${noscriptContent}`
    );

    // Write to dist/[route]/index.html
    const outDir = route === '/'
      ? DIST
      : resolve(DIST, route.replace(/^\//, ''));

    if (route !== '/') {
      mkdirSync(outDir, { recursive: true });
    }

    const outFile = route === '/'
      ? resolve(DIST, 'index.html')
      : resolve(outDir, 'index.html');

    writeFileSync(outFile, html, 'utf-8');
    count++;
    console.log(`  [prerender] ${route} -> ${outFile.replace(DIST, 'dist')}`);
  }

  console.log(`\n  Prerendered ${count} routes.`);
}

prerender();
