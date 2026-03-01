# SUNTREX Blog System — Documentation

## Architecture

Le blog SUNTREX est un systeme complet integre a la marketplace, comprenant :

- **Frontend** : Composant React `SuntrexBlog.jsx` (inline styles, responsive 375px->1440px)
- **Backend** : Supabase (PostgreSQL) pour le stockage, Netlify Functions pour le serverless
- **IA** : Generation d'articles via l'API Claude (Anthropic)
- **SEO** : Schema.org, meta tags, sitemap XML, flux RSS

## Tables Supabase

### `blog_articles`
Table principale des articles.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Cle primaire auto-generee |
| slug | TEXT | URL-friendly unique (ex: `european-solar-market-2026`) |
| title | TEXT | Titre de l'article |
| excerpt | TEXT | Resume court (2 phrases, 160 chars pour SEO) |
| content | TEXT | Corps complet en Markdown simplifie |
| category | TEXT | `market`, `tech`, `guides`, `brand`, `regulation`, `suntrex` |
| author_name | TEXT | Nom affiche de l'auteur |
| author_avatar | TEXT | Initiale ou emoji |
| tags | TEXT[] | Tableau de tags (4-5 max) |
| image | TEXT | URL de la photo hero (Unsplash ou CDN) |
| hero_gradient | TEXT | CSS gradient overlay sur la photo |
| featured | BOOLEAN | Article mis en avant (section "A la une") |
| published | BOOLEAN | Visible publiquement (false = brouillon) |
| read_time | INTEGER | Temps de lecture estime en minutes |
| seo_title | TEXT | Titre optimise SEO (60 chars max) |
| seo_description | TEXT | Meta description (155 chars max) |
| ai_generated | BOOLEAN | Genere par IA (true) ou ecrit manuellement |
| ai_model | TEXT | Modele utilise (claude-sonnet-4-20250514) |
| ai_prompt | TEXT | Prompt/sujet original donne a l'IA |
| reactions_count | INTEGER | Compteur denormalise (auto via trigger) |
| comments_count | INTEGER | Compteur denormalise (auto via trigger) |
| views_count | INTEGER | Vues (incremente par `get_blog_article()`) |
| fts | TSVECTOR | Full-text search francais (auto via trigger) |
| created_at | TIMESTAMPTZ | Date de creation |
| updated_at | TIMESTAMPTZ | Derniere modification (auto) |
| published_at | TIMESTAMPTZ | Date de publication (auto quand published=true) |

### `blog_comments`
Commentaires sur les articles.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Cle primaire |
| article_id | UUID | FK -> blog_articles |
| user_id | UUID | FK -> auth.users (nullable pour anonyme) |
| user_name | TEXT | Nom affiche |
| content | TEXT | Contenu (3-2000 chars) |
| approved | BOOLEAN | Visible si true (moderation) |
| flagged | BOOLEAN | Signale pour moderation |
| created_at | TIMESTAMPTZ | Date |

### `blog_reactions`
Reactions emoji sur les articles.

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Cle primaire |
| article_id | UUID | FK -> blog_articles |
| user_id | UUID | FK -> auth.users (nullable) |
| session_id | TEXT | Pour reactions anonymes |
| reaction_type | TEXT | Emoji : sun, fire, bulb, lightning, book, rocket, scale, globe |

Contrainte UNIQUE : 1 reaction par type par user par article.

### `blog_subscribers`
Inscriptions newsletter (RGPD compliant).

| Champ | Type | Description |
|-------|------|-------------|
| email | TEXT | Email unique |
| consent_marketing | BOOLEAN | Consentement marketing SUNTREX |
| consent_partners | BOOLEAN | Consentement partenaires |
| source | TEXT | Origine (blog_sidebar, article_cta, etc.) |

## Comment creer un article

### Methode 1 : Via le panel Admin (UI)
1. Aller sur le blog
2. Cliquer sur le bouton **Admin** en haut a droite
3. Dans le bloc **AI Content Generator** :
   - Taper le sujet (ex: "impact des tarifs douaniers UE sur les panneaux chinois")
   - Choisir la categorie
   - Cliquer **Generer l'article**
4. L'IA genere titre, contenu, tags, SEO
5. Relire le brouillon, puis cliquer **Publier**

### Methode 2 : Via l'API Netlify Function
```bash
curl -X POST https://suntrex.eu/api/blog-ai-generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "batteries sodium-ion 2026", "category": "tech"}'
```
Retourne l'article en JSON, sauve en brouillon dans Supabase.

### Methode 3 : Directement dans Supabase
Inserer une ligne dans `blog_articles` via le Dashboard Supabase ou SQL :
```sql
INSERT INTO blog_articles (slug, title, excerpt, content, category, author_name, tags, image, published)
VALUES (
  'mon-article',
  'Mon titre',
  'Mon resume...',
  '**Section 1**\n\nContenu...\n\n**Section 2**\n\nContenu...',
  'market',
  'SUNTREX Research',
  ARRAY['tag1', 'tag2'],
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80',
  true
);
```

## Flux RSS
- URL : `https://suntrex.eu/blog/rss.xml`
- Netlify Function : `netlify/functions/blog-rss.js`
- Lit les articles publies depuis Supabase
- Format RSS 2.0 avec Dublin Core
- Cache : 1 heure
- Compatible avec tous les lecteurs RSS (Feedly, Inoreader, etc.)

## Sitemap XML
- URL : `https://suntrex.eu/sitemap.xml`
- Netlify Function : `netlify/functions/blog-sitemap.js`
- Inclut : pages statiques + categories blog + tous les articles publies
- A soumettre dans Google Search Console

## SEO
Chaque article genere automatiquement :
- **Schema.org Article** : headline, author, datePublished, keywords
- **Open Graph** : og:title, og:description, og:type=article, og:url
- **Twitter Card** : summary_large_image
- Meta title et description personnalisables par article

## Categories

| ID | Label | Description |
|----|-------|-------------|
| market | Marche & Tendances | Analyses marche, prix, volumes, tendances |
| tech | Technologie | Innovations PV, N-type, onduleurs, stockage |
| guides | Guides Pratiques | Guides d'achat, dimensionnement, comparatifs |
| brand | Marques & Produits | Tests produits, classements, fiches techniques |
| regulation | Reglementation | EPBD, TVA, tarifs, normes, certifications |
| suntrex | SUNTREX News | Actualites et annonces SUNTREX |

## Photos
- **Source** : Unsplash (licence libre, pas d'attribution requise)
- **Format** : URLs avec parametres `?w=900&q=80` pour optimisation
- **Principe** : JAMAIS de SVG placeholder. Toujours de vraies photos.
- **Fallback** : si `image` est null, utiliser l'image par defaut solar farm

## Moderation des commentaires
- Les commentaires sont `approved: false` par defaut
- Un moderateur doit approuver via Supabase Dashboard ou future interface admin
- Les commentaires signales (`flagged: true`) sont masques en priorite
- Le compteur `comments_count` de l'article est mis a jour automatiquement par trigger

## Stack technique
- React (Vite, inline styles)
- Supabase (PostgreSQL, RLS, Realtime)
- Netlify Functions (RSS, sitemap, AI generation)
- Claude API (Anthropic) pour la generation IA
- Unsplash pour les images
- Deploye sur Vercel (frontend) + Netlify (functions)
