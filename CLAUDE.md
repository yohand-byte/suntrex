# SUNTREX — Master Prompt & Décomposition Projet

> **Version** : 2.0 — 01/03/2026
> **Auteur** : Yohan × Claude
> **Usage** : Copier dans les instructions projet Claude.ai ou dans CLAUDE.md pour Claude Code

> **This file is automatically read by Claude Code at the start of every session.**
> **All rules below are NON-NEGOTIABLE and permanent. Never ask for confirmation on these.**

---

## IDENTITÉ DU PROJET

**SUNTREX** est une marketplace B2B européenne d'équipements photovoltaïques et de stockage d'énergie. La plateforme connecte installateurs, distributeurs et professionnels du solaire avec des vendeurs vérifiés à travers l'Europe.

**Positionnement** : surpasser sun.store et SolarTraders grâce à 4 différenciateurs clés :

1. **Commissions 5% inférieures** aux concurrents (4.75% vs 5% standard)
2. **SUNTREX DELIVERY** — service de livraison propriétaire avec vérification colis
3. **Outils IA** — advisor solaire, modération automatique, pricing intelligent
4. **Support ultra-réactif** — téléphone, email, WhatsApp, chat in-app

**Équipe** : jeune, expérimentée, bourrée d'idées. On veut marquer les esprits dès le lancement.

**Lancement** : démarrage avec quelques sociétés partenaires offrant d'excellents prix sur Huawei (onduleurs, batteries, optimiseurs) et Deye.

---

## CONCURRENTS & MODÈLES

| | sun.store | SolarTraders | SUNTREX |
|---|---|---|---|
| **URL** | sun.store/fr | solartraders.com/fr | — |
| **Rôle** | Référence UI/UX #1 | Référence catalogue | Notre projet |
| **Prix masqués** | ✅ | ✅ | ✅ |
| **Chat buyer-seller** | ✅ | ❌ | ✅ + modération IA |
| **Livraison propre** | Partiel | ❌ | ✅ SUNTREX DELIVERY |
| **Vérification colis** | ❌ | ❌ | ✅ QR + photos |
| **Outils IA** | ❌ | ❌ | ✅ Advisor + modération |
| **Support multi-canal** | Email | Email | ✅ Tél + WhatsApp + Chat |
| **Commission** | ~5% | ~5% | **4.75%** |

---

## DÉCOMPOSITION EN 6 PARTIES

Le projet est découpé en **6 parties distinctes qui s'emboîtent**. Chaque partie est un module indépendant mais connecté aux autres.

---

### PARTIE 1 — UI/UX & FRONTEND

**Objectif** : Interface professionnelle inspirée de sun.store, orientée conversion B2B.

**Principes** :
- Design épuré, dark/light mode, mobile-first (375px → 1440px)
- Prix masqués par défaut → CTA d'inscription omniprésent
- Navigation par catégories : Panneaux solaires, Onduleurs, Batteries/Stockage, Structures de montage, Câbles et accessoires
- JAMAIS de SVG placeholder pour les produits — toujours des vraies photos

**Pages clés** :
- **Homepage** : Hero + recherche + carrousel marques + meilleurs produits + badges confiance
- **Catalogue** (`/catalog/[category]`) : Filtres latéraux (marque, puissance, type, phases, MPPT, prix), regroupement multi-vendeurs
- **Fiche produit** (`/product/[id]`) : Photos, specs techniques, comparaison prix multi-vendeurs, badges vendeur, datasheet PDF
- **Inscription** : 2 étapes max — email+mdp → infos entreprise (SIRET/TVA + pays + rôle). KYC simplifié.
- **Dashboards** : Acheteur (mes achats, suivi), Vendeur (mes offres, ventes, analytics), Admin (réconciliation, litiges)

**Composant PriceGate** : Blur + gradient sur les prix avec CTA "Inscrivez-vous pour voir les prix". Débloqué quand `user.isVerified === true`. Animation de reveal au login.

**RGPD** : Inscription avec checkboxes obligatoires (CGV + politique de confidentialité) et optionnelles (marketing SUNTREX, marketing partenaires).

**Stack** : Vite + React, inline styles (pas de Tailwind actuellement), Supabase Auth.

---

### PARTIE 2 — IA & OUTILS INTELLIGENTS

**Objectif** : Différenciation massive via l'IA — outils ludiques MAIS surtout fonctionnels.

**2.1 — Support Chat IA** (déjà en place)
- Widget flottant avec chatbot IA (Mistral/Claude)
- FAQ automatique, réponses contextualisées PV
- Handoff vers agent humain quand nécessaire
- Mode dégradé : demo mode si Supabase indisponible

**2.2 — AI Solar Advisor** (Phase 3)
- Recommandation de produits basée sur le projet du client (surface toit, orientation, budget)
- Dimensionnement automatique d'installation
- Comparateur intelligent multi-vendeurs
- System prompt spécialisé photovoltaïque

**2.3 — Modération IA** (Phase 2-3)
- Analyse automatique des messages chat buyer-seller
- Détection : tentatives de paiement hors plateforme, langage inapproprié, patterns d'arnaque
- Alertes aux modérateurs humains
- Ton professionnel et courtois OBLIGATOIRE — charte à accepter à l'inscription

**2.4 — Pricing Intelligent** (Phase 3)
- Suggestions de prix pour les vendeurs basées sur le marché
- Détection de prix anormalement bas (dumping) ou élevés
- Alertes sur les opportunités de prix

**2.5 — Recherche Sémantique** (Phase 3)
- Au-delà de la recherche par mots-clés
- Comprend les requêtes techniques PV ("onduleur triphasé 10kW avec 2 MPPT")

**2.6 — Traduction IA Technique** (Phase 2-3)
- Traduction automatique des chats buyer-seller
- Contextualisée pour le vocabulaire photovoltaïque
- Toggle on/off dans le chat

**Stack** : API Claude/Mistral, Netlify Functions, Algolia/Meilisearch.

---

### PARTIE 3 — SUNTREX DELIVERY & VÉRIFICATION

**Objectif** : Service de livraison propriétaire qui apporte confiance aux buyers ET sellers.

**3.1 — Tracking**
- QR code unique généré à l'emballage, lié à la commande et au vendeur
- Tracking temps réel sur carte (buyer + seller)
- Notifications par étape : préparation → enlèvement → en transit → livré

**3.2 — Vérification Colis** (différenciateur clé)
- Photos obligatoires à l'emballage par le vendeur
- Photos à l'enlèvement par le transporteur
- Photos à la livraison + e-signature acheteur
- OCR sur les bons de livraison pour extraction automatique
- GPS timestamping à chaque scan de QR code

**3.3 — Intégration Paiements**
- Escrow amélioré : fonds bloqués sur Stripe tant que la livraison n'est pas confirmée
- Déblocage automatique après X jours si pas de contestation
- Assurance colis optionnelle pour les produits de grande valeur
- Calcul automatique des frais (poids, dimensions, distance, type produit)

**3.4 — Roadmap Logistique**
- **Phase 1** : Partenariats transporteurs existants (DPD, GLS, DB Schenker) sous marque SUNTREX DELIVERY
- **Phase 2** : Flotte propre sur les corridors principaux (France ↔ Allemagne, Benelux)

**Stack** : QR Code API, Cloudflare R2/S3 pour les photos, Supabase Realtime, intégration APIs transporteurs.

---

### PARTIE 4 — PAIEMENTS (STRIPE CONNECT)

**Objectif** : Infrastructure de paiement marketplace sécurisée, conforme SCA/3DS.

**4.1 — Architecture**
- Modèle : **Destination Charges** (SUNTREX encaisse → prélève commission → transfère au vendeur)
- Commission : **4.75%** via `application_fee_amount`
- Multi-devises : EUR (prioritaire), GBP, CHF, PLN

**4.2 — Onboarding Vendeur Stripe**
- Bouton "Connecter Stripe" → Stripe Connect Onboarding (Account Links)
- Vérification : `charges_enabled === true` ET `payouts_enabled === true` avant de lister des produits
- Webhook `account.updated` pour surveillance continue du statut KYC
- UI claire si compte restreint ou en attente

**4.3 — Flux de Paiement**
1. Acheteur confirme la transaction après négociation chat
2. Création `PaymentIntent` côté serveur avec `application_fee_amount` + `transfer_data.destination`
3. 3D Secure / SCA automatique (obligatoire Europe)
4. Paiement réussi → escrow (si SUNTREX DELIVERY) OU transfert immédiat
5. Webhooks : `payment_intent.succeeded`, `charge.dispute.created`, `transfer.created`

**4.4 — Sécurité (NON NÉGOCIABLE)**
- Clés `sk_live_*` et `whsec_*` UNIQUEMENT en variables d'environnement
- JAMAIS de clé Stripe côté client — tout passe par serverless functions
- Vérification signature webhook (`stripe-signature` header)
- Idempotency keys sur toutes les opérations critiques
- Mode test (`sk_test_*`) pour tout développement
- API version épinglée dans le code
- CORS restreint aux domaines connus en production
- Ne JAMAIS faire confiance aux données côté client (montants, prix, rôles)

**4.5 — Réconciliation**
- Logger chaque transaction avec les IDs Stripe (payment_intent, transfer, charge)
- Dashboard admin : commissions, transferts, litiges, remboursements
- Alertes sur écarts montants attendus vs réels

**Stack** : Stripe Connect, Netlify Functions, Supabase pour le logging.

---

### PARTIE 5 — CONFIANCE & MODÉRATION

**Objectif** : Écosystème de confiance pour protéger buyers et sellers.

**5.1 — KYC Simplifié**
- Inscription rapide : email + mot de passe → infos entreprise
- Vérification TVA automatique via API VIES
- Badge "TVA Vérifiée" sur le profil
- Pas de process KYC lourd qui décourage l'inscription — amélioration progressive

**5.2 — Badges & Notation**
- Badges : "Super Vendeur", "Vendeur de Confiance", "TVA Vérifiée", "Livraison SUNTREX"
- Système de notation : note moyenne, nombre de transactions, temps de réponse, ancienneté
- Visibilité des stats vendeur : transactions complétées, offres actives, note

**5.3 — Modération**
- **Équipe humaine** : modérateurs formés au B2B solaire, assistés par l'IA
- **Charte de conduite** : à accepter à l'inscription, ton pro et courtois obligatoire
- **Sanctions graduées** : avertissement → suspension temporaire → bannissement
- **Anti-fraude** : détection comptes multiples, patterns d'arnaque, prix anormaux
- **Surveillance chat** : modérateurs sur les échanges buyer-seller en temps réel

**5.4 — Améliorations Sécurité (idées futures)**
- Système de détection des clients de mauvaise foi
- Score de fiabilité acheteur/vendeur basé sur l'historique
- Protection renforcée sur les grosses transactions
- Système d'arbitrage en cas de litige

---

### PARTIE 6 — INFRASTRUCTURE & DÉPLOIEMENT

**6.1 — Stack Technique Actuelle**

| Couche | Technologie |
|---|---|
| Frontend | Vite + React (inline styles) |
| Backend/DB | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| Serverless | Netlify Functions |
| Paiements | Stripe Connect |
| IA | Mistral AI / Claude API |
| Hébergement | Vercel (frontend) + Netlify (functions) |
| CDN/Storage | Cloudflare R2 (prévu) |

**6.2 — Données Catalogue**
- CSV Article 3 : 674 lignes, 11 colonnes (Item Name, Type, Brand, SKU, Purchase Rate, Stock...)
- 638+ produits réels : Huawei, Deye, Hoymiles, Sungrow, Risen Energy, Trina Solar
- 206 produits uniques (panneaux, onduleurs, batteries, systèmes de montage)

**6.3 — Règles de Déploiement**
- TOUJOURS mettre à jour le repo GitHub après chaque session
- Nettoyer et classifier les dossiers/fichiers dans les repos locaux
- Vérifier le build avant chaque push
- Tester sur l'URL de production après déploiement

**6.4 — Structure des Fichiers CLAUDE.md**

```
suntrex/
├── CLAUDE.md                              ← CE FICHIER (Master v2.0)
├── src/components/chat/CLAUDE.md          ← Règles module chat
├── src/components/payment/CLAUDE.md       ← Règles module paiement
└── netlify/functions/CLAUDE.md            ← Règles serverless
```

---

## ROADMAP PAR PHASES

### Phase 1 — MVP (4-6 semaines) ← EN COURS
- ✅ Homepage + catalogue 638 produits
- ✅ Chat support IA
- 🔄 Inscription/login + KYC simplifié
- 🔄 Prix masqués (PriceGate)
- ⬜ Fiches produits détaillées + comparaison multi-vendeurs
- ⬜ Chat buyer-seller basique (modération manuelle)
- ⬜ Stripe Connect (destination charges)
- ⬜ Dashboards buyer/seller basiques
- ⬜ Multilingue FR/EN

### Phase 2 — Trust & Delivery (4-6 semaines)
- SUNTREX DELIVERY : tracking + QR + photos + vérification
- Escrow amélioré (fonds bloqués jusqu'à confirmation livraison)
- Badges vendeur + système de notation
- Support multi-canal (WhatsApp + chat)
- Import offres en masse (xlsx)
- Dashboard admin (réconciliation, litiges)
- Multilingue +DE/ES

### Phase 3 — IA & Scale (6-8 semaines)
- AI Solar Advisor (recommandation, dimensionnement)
- Modération IA automatique du chat
- Pricing intelligent vendeurs
- Recherche sémantique
- Traduction IA technique
- Multilingue +IT/NL
- Optimisation performance + SEO

### Phase 4 — Expansion (continu)
- Flotte de livraison propre
- App mobile (React Native)
- Programme fidélité / volume discounts
- API publique pour intégration ERP
- Marketplace de services (installation, maintenance)

---

## RÈGLES POUR CLAUDE CODE

### Langue
- **Code, commentaires, variables, commits** : anglais
- **Échanges avec Yohan** : français
- **Contenu plateforme** : multilingue (FR, EN, DE, ES, IT, NL)

### Style de code
- Inline styles avec objets JavaScript (pas de Tailwind, pas de CSS modules)
- React hooks (useState, useEffect) — pas de Redux/Zustand
- Composants fonctionnels uniquement
- Nommage : PascalCase composants, camelCase fonctions/variables

### Responsive (100% obligatoire)
- Breakpoints : `mobile < 768px`, `tablet 768-1023px`, `desktop ≥ 1024px`
- Hook `useResponsive()` dans `src/hooks/useResponsive.js`
- Grid : `mobile 1-2 cols`, `tablet 2-3 cols`, `desktop 3-5 cols`
- Padding : `mobile 16px`, `tablet 24px`, `desktop 40px`
- Font scaling : headings -40% mobile, body -15%
- Touch targets : minimum 44x44px
- Aucun scroll horizontal. Jamais.

### Sécurité (toujours)
- Ne JAMAIS exposer de clés API côté client
- Toutes les opérations sensibles passent par Netlify Functions
- Vérifier les données côté serveur, ne jamais faire confiance au client
- Variables d'environnement pour tous les secrets

### Avant de coder
- Vérifier l'état actuel du fichier avant modification
- Préserver les fonctionnalités existantes
- Si refactoring → assurer la rétrocompatibilité

### Après chaque session
- Commit + push sur GitHub
- Nettoyer et classifier les fichiers
- Vérifier le build
- Tester sur l'URL de production

### Visuels
- JAMAIS de SVG placeholder pour les produits
- Toujours des vraies photos (URLs fabricants ou images téléchargées)
- Fond blanc ou transparent pour les photos produit

---

## STYLING CONVENTIONS

```jsx
// ✅ CORRECT — Inline style objects
<div style={{ padding: isMobile ? "16px" : "40px", display: "flex", gap: 16 }}>

// ✅ CORRECT — Extracted style constants
const cardStyle = { borderRadius: 12, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };

// ❌ WRONG — No className, no Tailwind
<div className="p-4 flex gap-4">
```

### Brand Colors
```js
const BRAND = {
  orange: "#E8700A",       // Primary CTA, accents
  dark: "#0F1923",         // Text, headers
  muted: "#64748b",        // Secondary text
  light: "#f8fafc",        // Backgrounds
  border: "#e2e8f0",       // Borders
  green: "#10b981",        // Success, online status
  red: "#ef4444",          // Errors, alerts
  blue: "#3b82f6",         // Links, info
  white: "#ffffff",        // Cards, modals
};
```

### Typography
- Font : `"DM Sans", sans-serif` (primary), `"Playfair Display", serif` (display)
- Weights : 400/500/600/700/800
- Hero : 38px desktop → 22px mobile
- Section titles : 28px desktop → 20px mobile
- Body : 15px desktop → 14px mobile
- Small/captions : 12-13px

---

## ENVIRONMENT VARIABLES

### Client-side (Vite — `VITE_` prefix required)
```env
VITE_SUPABASE_URL=https://uigoadkslyztxgzahmwv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPPORT_AI_ENDPOINT=/api/support-chat-ai
```

### Server-side (Netlify/Vercel Functions — no prefix)
```env
SUPABASE_URL=https://uigoadkslyztxgzahmwv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # ⚠️ NEVER client-side
STRIPE_SECRET_KEY=sk_test_...            # ⚠️ NEVER client-side
STRIPE_WEBHOOK_SECRET=whsec_...          # ⚠️ NEVER client-side
MISTRAL_API_KEY=...                      # ⚠️ NEVER client-side
```

---

## SUPABASE SCHEMA (existing tables)

| Table | Key Fields | RLS |
|-------|-----------|-----|
| User | id, email, role, company_id | ✅ Own profile only |
| Company | id, name, vat_number, country | ✅ All read, owner update |
| Listing | id, product_name, price, seller_company_id | ✅ All read, own company CRUD |
| Warehouse | id, company_id, location | ✅ Own company only |
| Order | id, buyer_id, seller_id, status, payment_intent_id | ✅ Buyer/seller see own |
| OrderItem | id, order_id, listing_id, quantity | ✅ Via order access |
| RFQ | id, buyer_id, status | ✅ Buyer own, sellers browse open |
| Quote | id, rfq_id, seller_id | ✅ Seller own, buyer sees on own RFQ |
| Review | id, reviewer_id, rating | ✅ All read, reviewer CRUD own |
| Notification | id, user_id, message | ✅ Own notifications only |
| SupportConversation | id, user_id, status, ai_mode | ✅ User own, agents all |
| SupportMessage | id, conversation_id, sender_type | ✅ Via conversation access |
| blog_articles | id, slug, title, content, category, ai_generated | ✅ All read, admin CRUD |

**Critical**: RLS is enabled on ALL tables. Service role key (server-side) bypasses RLS.

---

## CHECKLIST BEFORE MARKING ANY TASK COMPLETE

- [ ] Works on iPhone SE (375px) — no overflow, no broken layout
- [ ] Works on iPad (768px) — proper tablet layout
- [ ] Works on Desktop (1440px) — full layout as designed
- [ ] No API keys or secrets in client code
- [ ] RLS policies cover the new tables/columns
- [ ] Error states handled (loading, error, empty)
- [ ] French AND English text (or i18n keys) for user-facing strings
- [ ] Graceful degradation if backend/API unavailable
- [ ] No `console.log` left in production code
- [ ] Accessibility basics: alt text, focus states, semantic HTML where possible

---

## COMMENT UTILISER CE PROMPT

**Dans Claude Code** : Ce fichier est lu automatiquement. Préciser la partie :
- "On travaille sur la PARTIE 1 — UI/UX"
- "On attaque la PARTIE 4 — Stripe Connect"
- "Je veux avancer sur la Phase 2 du roadmap"

**Fichiers CLAUDE.md spécialisés** (complémentaires, non remplacés) :
- `src/components/chat/CLAUDE.md` — règles module chat
- `src/components/payment/CLAUDE.md` — règles module paiement
- `netlify/functions/CLAUDE.md` — règles serverless functions
