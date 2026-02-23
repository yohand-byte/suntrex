# SUNTREX — Décomposition Architecturale du Projet

## Vision

SUNTREX est une marketplace B2B européenne d'équipements photovoltaïques et de stockage d'énergie. L'objectif est de devenir la référence pour les installateurs et distributeurs solaires en Europe, en surpassant sun.store et SolarTraders grâce à : des outils IA innovants, un service de livraison propriétaire (SUNTREX DELIVERY), des commissions 5% inférieures aux concurrents, et un support ultra-réactif multi-canal.

---

## PARTIE 1 — UI/UX & FRONTEND

### 1.1 Landing Page & Onboarding

**Objectif** : Convertir le visiteur en utilisateur inscrit. Les prix sont masqués tant que le KYC simplifié n'est pas complété.

**Pages & composants** :
- **Homepage** : Hero avec barre de recherche produit (comme sun.store), carrousel de marques partenaires (Huawei, Deye, Enphase, SMA, Canadian Solar, Jinko, Trina, BYD...), section "Meilleurs produits", badges de confiance.
- **Inscription / Login** : Formulaire en 2 étapes max — email + mot de passe, puis infos entreprise (SIRET/TVA, pays, rôle). KYC simplifié pour ne pas alourdir. Vérification TVA automatique via API VIES.
- **Prix masqués** : Composant `<PriceGate />` qui affiche un CTA "Inscrivez-vous pour voir les prix" avec blur sur le montant. Débloqué après `user.isVerified === true`.

**Référence sun.store** : La homepage est épurée avec un hero en plein écran, une recherche centrée, et un défilement de logos de marques. Le menu catégories est horizontal en haut (Panneaux solaires, Onduleurs, Stockage d'énergie, Systèmes de montage, Électrotechnique, E-mobilité).

### 1.2 Catalogue & Navigation Produits

**Objectif** : Permettre de trouver, filtrer et comparer rapidement les produits de multiples vendeurs.

**Pages & composants** :
- **Page catégorie** (`/catalog/[category]`) : Liste de produits avec filtres latéraux (disponibilité, catégorie, puissance, marque, prix, type, nombre de phases, MPPT, dimensions). Toggle "Regroupement de produits" pour fusionner les offres identiques de différents vendeurs.
- **Fiche produit** (`/product/[id]`) : Photo(s), spécifications techniques (puissance, type, phases), disponibilité multi-vendeurs avec comparaison de prix, bouton "Détails de l'offre", lien datasheet/certifications.
- **Comparaison multi-vendeurs** : Pour un même produit, affichage des différentes offres (prix, stock, localisation entrepôt, note vendeur, badges "Vendeur de confiance", "Virement bancaire sécurisé", drapeau pays).
- **Filtres rapides** (tags) : "Disponible dès maintenant", "Virement bancaire sécurisé", "Livraison par SUNTREX", "Super vendeur".
- **Recherche** : Barre de recherche globale avec autocomplétion par nom de produit et fabricant.

**Référence sun.store** : Filtres très complets à gauche, produits à droite avec regroupement par modèle et expansion "Voir les offres (X)". Chaque offre affiche le drapeau du pays vendeur, la note, les badges de confiance.

### 1.3 Dashboard Acheteur

**Sections** (sidebar gauche comme sun.store) :
- **Mon profil** : Détails du compte, mot de passe, coordonnées entreprise, factures et frais, commentaires, mode hors bureau.
- **Acheter** : Mes achats, adresses de livraison, demandes de devis.
- **Notifications** : Centre de notifications, e-mails, paramètres.

### 1.4 Dashboard Vendeur

**Sections** :
- **Vendre** : Gérer les offres (ajout unique, import xlsx/xls en masse), mes ventes, recevoir des demandes (RFP avec filtres par catégorie/fabricant/capacité/MOQ/prix min), entrepôts, livraison (liste de prix), modes de paiement (Stripe Connect), intégration d'API.
- **Gestion des offres** : Vue liste/grille, onglets "Actives et inactives / Actives / Expiring / Inactive / Brouillons", recherche, tri, filtres, actions en masse.
- **Import d'offres** : Téléchargement d'un template xlsx, sélection de l'entrepôt, upload drag & drop.
- **Paramètres RFP** : Activation par catégorie (Solar Panels, Inverters, Batteries) avec filtres (fabricant, capacité min/max, MOQ, prix min/kWh).

### 1.5 Transaction & Négociation (Chat Buyer-Seller)

**Objectif** : Permettre la négociation de prix, la confirmation de commande, et le suivi — tout en restant professionnel et modéré.

**Composants** :
- **Page transaction** (`/transaction/[id]`) : Récapitulatif produit (nom, quantité, prix unitaire, prix net, TVA, frais de livraison, total brut), chat intégré avec traduction automatique, panneau latéral (détails vendeur, détails transaction, coordonnées acheteur, contrôle TVA, adresse de livraison, statut commande, infos expéditeur).
- **Chat modéré** : Traduction automatique multi-langues, formatage riche (B/I/U, liens, pièces jointes, emojis), possibilité de signaler un problème, contact avec l'assistance SUNTREX. **Modération IA + humaine** pour garantir un ton pro et courtois. Filtre automatique des messages inappropriés, alertes pour les modérateurs.
- **Statut de commande** : Ouverture des négociations → Transaction confirmée → Payée → Expédiée → Livrée → Terminée (ou Annulée avec raison).
- **Pièces jointes** : Upload de documents (bons de commande, preuves de livraison, etc.).

**Référence sun.store** : Le chat est central dans la transaction. On voit la traduction automatique, les détails vendeur (statut TVA, transactions complétées, offres actives, note, temps de réponse), et un workflow de commande clair.

### 1.6 Design System & Multilingue

- **Design tokens** : Couleurs SUNTREX (à définir, probablement solaire/énergie — orange/vert/bleu foncé), typographie professionnelle B2B, espacement, ombres.
- **Composants réutilisables** : Button, Card, Badge, Filter, ProductCard, PriceDisplay, PriceGate, ChatBubble, StatusBadge, SellerCard, RatingStars.
- **i18n** : FR, EN, DE, ES, IT, NL minimum. Framework : next-intl ou react-i18next. Traduction du catalogue produit ET de l'interface.
- **Responsive** : Desktop-first (B2B = principalement desktop) mais mobile fonctionnel.

---

## PARTIE 2 — OUTILS IA

### 2.1 Assistant IA Acheteur — "SUNTREX AI Advisor"

**Fonctionnalités** :
- **Recommandation de produits** : "J'ai besoin d'un onduleur hybride 10kW triphasé pour une installation en France" → suggestions personnalisées parmi le catalogue.
- **Comparateur intelligent** : Comparer automatiquement 2-3 produits avec tableau de specs + analyse prix/performance.
- **Calculateur de dimensionnement** : Saisir la taille d'installation → recommandation du nombre de panneaux, onduleur adapté, batteries, câblage.
- **Chat IA** : Widget flottant (comme le chat vert de sun.store en bas à droite) mais alimenté par un LLM spécialisé PV.

### 2.2 Assistant IA Vendeur — "SUNTREX Seller AI"

**Fonctionnalités** :
- **Pricing intelligent** : Analyse des prix concurrents sur la plateforme pour un même produit, suggestion de prix compétitif.
- **Gestion de stock prédictive** : Alertes quand un produit va expirer ou quand la demande augmente.
- **Auto-réponse négociation** : Réponses suggérées en chat basées sur l'historique de négociation du vendeur et les tendances du marché.
- **Traduction IA améliorée** : Traduction du chat en temps réel avec contexte technique PV (ne pas confondre "inverter" et "convertisseur" par exemple).

### 2.3 IA de Modération

**Objectif** : Garantir des échanges professionnels et courtois sur la plateforme.

- **Filtrage temps réel** : Détection de langage inapproprié, tentatives d'arnaque (demande de paiement hors plateforme), coordonnées personnelles partagées prématurément.
- **Scoring de confiance** : Algorithme IA qui évalue la fiabilité d'un vendeur/acheteur basé sur : historique de transactions, temps de réponse, taux d'annulation, litiges.
- **Alertes modérateurs** : Notification en temps réel à l'équipe de modération humaine quand l'IA détecte un comportement suspect.
- **Détection de fraude** : Patterns de mauvaise foi (commandes fictives, prix aberrants pour attirer puis annuler, etc.).

### 2.4 Recherche IA (Search)

- **Recherche sémantique** : Comprendre "batterie Huawei 10 kWh" même si le produit est listé comme "LUNA2000-10-S0".
- **Filtrage dynamique** : L'IA affine les filtres en fonction de la requête naturelle.
- **Suggestions autocomplete** : Basées sur les tendances d'achat et le catalogue.

---

## PARTIE 3 — SUNTREX DELIVERY

### 3.1 Vision

Service de livraison propriétaire qui apporte de la confiance aux acheteurs ET aux vendeurs. Différenciateur majeur par rapport à sun.store qui sous-traite la livraison.

### 3.2 Système de Vérification des Colis

**Objectif** : Éliminer les litiges liés aux colis endommagés, manquants ou non conformes.

**Workflow** :
1. **Expédition par le vendeur** : Le vendeur emballe, prend des photos du colis (état + contenu), scan du bon de livraison → upload sur la plateforme. QR code SUNTREX collé sur chaque colis.
2. **Prise en charge SUNTREX DELIVERY** : Le transporteur SUNTREX scanne le QR code, vérifie visuellement l'état du colis, prend une photo de réception → horodatage GPS.
3. **Transit** : Tracking en temps réel pour l'acheteur ET le vendeur. Notifications automatiques à chaque étape (enlevé, en transit, en livraison, livré).
4. **Livraison** : Photo du colis à la livraison, signature électronique de l'acheteur, vérification de l'état du colis par l'acheteur (OK / Endommagé / Manquant).
5. **Confirmation ou litige** : Si tout est OK → fonds débloqués au vendeur via Stripe. Si problème → ouverture automatique de litige avec toutes les preuves photo/GPS.

**Composants techniques** :
- **Tracking API** : Endpoints pour chaque étape du workflow. Webhooks vers l'UI pour mise à jour en temps réel.
- **QR Code système** : Génération unique par colis, lié à la commande et au vendeur.
- **Photo verification** : Upload + stockage S3/Cloudflare R2. OCR sur les bons de livraison pour extraction automatique des infos.
- **GPS timestamping** : Géolocalisation à chaque scan de QR code.
- **Dashboard livraison** : Vue temps réel de toutes les livraisons en cours pour l'admin SUNTREX.

### 3.3 Intégration avec les Paiements

- **Escrow amélioré** : Les fonds restent en escrow Stripe tant que la livraison n'est pas confirmée par l'acheteur. Déblocage automatique après X jours si pas de contestation.
- **Assurance colis** : Option d'assurance intégrée pour les colis de grande valeur (panneaux solaires, onduleurs).
- **Calcul des frais** : En fonction du poids, des dimensions, de la distance, et du type de produit (fragile/lourd).

### 3.4 Partenaires logistiques

Phase 1 : Partenariat avec des transporteurs existants (DPD, GLS, DB Schenker pour le B2B lourd) sous la marque SUNTREX DELIVERY. Phase 2 : Flotte propre sur les corridors les plus fréquentés (France ↔ Allemagne, Benelux).

---

## PARTIE 4 — PAIEMENTS (STRIPE CONNECT)

### 4.1 Architecture

- **Modèle** : Destination Charges. SUNTREX est la plateforme, chaque vendeur a un compte connecté Stripe.
- **Flux** : Acheteur paie → SUNTREX encaisse → prélève `application_fee` (commission) → transfère le solde au vendeur.
- **Commission** : 5% en dessous de ce que pratiquent sun.store et SolarTraders. À définir précisément, mais l'idée est d'être le moins cher du marché.

### 4.2 Onboarding Vendeur Stripe

- **Flux** : Bouton "Connecter Stripe" dans le dashboard vendeur → Stripe Connect Onboarding (Account Links) → Retour sur SUNTREX avec compte vérifié.
- **Vérification** : Avant qu'un vendeur puisse lister des produits, on vérifie `charges_enabled === true` ET `payouts_enabled === true`.
- **Webhook `account.updated`** : Surveillance continue du statut KYC. Si un compte devient restreint → notification au vendeur + masquage temporaire de ses offres.
- **UI** : Page "Modes de paiement" dans le dashboard vendeur (comme sun.store — "Connexion réussie", email Stripe lié, toggle "Permettre le paiement sécurisé").

### 4.3 Flux de Paiement Acheteur

1. L'acheteur confirme la transaction après négociation chat.
2. Création d'un `PaymentIntent` avec `application_fee_amount` et `transfer_data.destination` (compte vendeur).
3. **3D Secure / SCA** : Obligatoire en Europe. Stripe le gère automatiquement avec les PaymentIntents.
4. Paiement réussi → fonds en escrow (si SUNTREX DELIVERY) ou transfert immédiat (si livraison vendeur).
5. Webhooks : `payment_intent.succeeded`, `charge.dispute.created`, `transfer.created`.

### 4.4 Sécurité (Non négociable)

- Clés `sk_live_*` et `whsec_*` UNIQUEMENT en variables d'environnement (Vercel/Netlify env vars).
- JAMAIS de clé Stripe côté client. Toutes les opérations passent par des serverless functions / API routes.
- Vérification de signature webhook (`stripe.webhooks.constructEvent`).
- Idempotency keys sur toutes les opérations critiques.
- API version épinglée dans le code.
- Mode test (`sk_test_*`) pour tout développement.
- Multi-devises : EUR par défaut, avec support GBP, CHF, PLN.

### 4.5 Réconciliation & Admin

- Chaque transaction loggée en DB avec : `payment_intent_id`, `transfer_id`, `charge_id`, `amount`, `fee`, `currency`, `status`, `seller_id`, `buyer_id`, `product_id`, `timestamps`.
- **Dashboard admin** : Commissions perçues, transferts vendeurs, litiges (disputes), remboursements, alertes sur écarts.
- **Alertes automatiques** : Si montant transféré ≠ montant attendu → notification immédiate à l'admin.

---

## PARTIE 5 — SUPPORT & TRUST

### 5.1 Support Multi-Canal Ultra-Réactif

**Canaux** :
- **Chat in-app** : Widget intégré (type Intercom/Crisp) avec escalation vers un humain.
- **WhatsApp Business** : Numéro dédié SUNTREX, réponses automatiques IA pour les questions fréquentes, escalation vers l'équipe.
- **Téléphone** : Ligne directe avec horaires étendus (9h-19h CET minimum).
- **Email** : Support classique avec SLA < 2h en heures ouvrées.
- **Réseaux sociaux** : Présence active sur LinkedIn (B2B) et autres canaux pertinents.

**Objectif** : Temps de réponse moyen < 30 min sur chat/WhatsApp, < 2h sur email. C'est un avantage concurrentiel direct face à sun.store.

### 5.2 Système de Confiance

- **Badges vendeur** : "Vendeur de confiance" (basé sur score IA + historique), "Super vendeur", "Virement bancaire sécurisé", "Livraison SUNTREX".
- **Notes et avis** : Système de notation post-transaction (1-5 étoiles + commentaire). Visible publiquement.
- **Contrôle TVA** : Vérification automatique du numéro de TVA intracommunautaire. Badge "TVA Vérifiée" sur le profil.
- **Détails vendeur** : Transactions complétées, offres actives, ancienneté, note moyenne, temps de réponse moyen (comme sun.store).
- **Protection acheteur** : Escrow Stripe + vérification colis SUNTREX DELIVERY = double protection.

### 5.3 Modération

- **Équipe de modération** : Modérateurs humains formés au B2B solaire, assistés par l'IA.
- **Règles de conduite** : Charte à accepter à l'inscription. Ton professionnel et courtois obligatoire.
- **Sanctions graduées** : Avertissement → suspension temporaire → bannissement.
- **Anti-fraude** : Détection des comptes multiples, des patterns d'arnaque, des prix anormalement bas (dumping) ou élevés.

---

## PARTIE 6 — INFRASTRUCTURE & DÉPLOIEMENT

### 6.1 Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js + React + Tailwind CSS |
| Backend/API | Next.js API Routes / Netlify Functions |
| Base de données | PostgreSQL (Neon/Supabase) ou selon l'existant |
| Auth | NextAuth.js ou Clerk |
| Paiements | Stripe Connect |
| Storage fichiers | Cloudflare R2 / AWS S3 |
| CDN/Hébergement | Vercel (frontend) + Netlify (functions) |
| Recherche | Algolia ou Meilisearch |
| i18n | next-intl |
| Chat temps réel | WebSockets (Socket.io) ou Pusher |
| IA | API Anthropic (Claude) / OpenAI pour les assistants |
| Email transactionnel | Resend ou SendGrid |
| Monitoring | Sentry + Vercel Analytics |

### 6.2 Architecture des Modules

```
suntrex/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (public)/       # Pages publiques (home, catalog, product)
│   │   │   ├── (auth)/         # Login, register, onboarding
│   │   │   ├── (buyer)/        # Dashboard acheteur
│   │   │   ├── (seller)/       # Dashboard vendeur
│   │   │   ├── (admin)/        # Dashboard admin SUNTREX
│   │   │   └── api/            # API routes (Stripe, webhooks, etc.)
│   │   ├── components/
│   │   │   ├── ui/             # Design system (Button, Card, Badge...)
│   │   │   ├── catalog/        # ProductCard, FilterSidebar, PriceGate...
│   │   │   ├── chat/           # ChatBubble, ChatWindow, ModeratedChat...
│   │   │   ├── delivery/       # TrackingMap, QRScanner, PhotoUpload...
│   │   │   ├── ai/             # AIAdvisor, AIChat, PriceSuggestion...
│   │   │   └── payment/        # StripeCheckout, EscrowStatus...
│   │   ├── lib/
│   │   │   ├── stripe.ts       # Stripe server-side helpers
│   │   │   ├── auth.ts         # Auth configuration
│   │   │   ├── db.ts           # Database client
│   │   │   └── ai.ts           # AI service helpers
│   │   └── i18n/               # Traductions FR, EN, DE, ES, IT, NL
│   └── admin/                  # Admin panel (optionnel, séparé)
├── packages/
│   ├── db/                     # Schema Prisma/Drizzle, migrations
│   ├── types/                  # Types partagés TypeScript
│   └── utils/                  # Fonctions utilitaires partagées
└── services/
    ├── delivery-api/           # API SUNTREX DELIVERY (tracking, QR, photos)
    └── ai-services/            # Microservices IA (modération, recommandation)
```

---

## ROADMAP — Phases de Développement

### Phase 1 — MVP (4-6 semaines)
**Objectif** : Lancer avec quelques vendeurs (Huawei, Deye) et prouver le concept.

- Homepage + catalogue produits avec filtres
- Inscription/login avec KYC simplifié
- Prix masqués pour visiteurs non inscrits
- Fiches produits avec comparaison multi-vendeurs
- Chat acheteur-vendeur basique (sans IA, avec modération manuelle)
- Paiement Stripe Connect (destination charges)
- Dashboard vendeur basique (gérer offres, mes ventes)
- Dashboard acheteur basique (mes achats)
- Multilingue FR/EN
- Déploiement Vercel + Netlify

### Phase 2 — Trust & Delivery (4-6 semaines)
**Objectif** : Différenciation avec SUNTREX DELIVERY et système de confiance.

- SUNTREX DELIVERY : tracking, QR codes, photos, vérification colis
- Escrow amélioré (fonds bloqués jusqu'à confirmation livraison)
- Badges vendeur et système de notation
- Support multi-canal (chat in-app + WhatsApp)
- Import d'offres en masse (xlsx)
- Dashboard admin (réconciliation, litiges, commissions)
- Multilingue DE/ES ajoutés

### Phase 3 — IA & Scale (6-8 semaines)
**Objectif** : Outils IA et scaling vers toute l'Europe.

- SUNTREX AI Advisor (recommandation, comparateur, dimensionnement)
- IA de modération automatique du chat
- Pricing intelligent pour vendeurs
- Recherche sémantique
- Traduction IA améliorée
- Multilingue IT/NL ajoutés
- Optimisation performance et SEO

### Phase 4 — Expansion (continu)
- Flotte de livraison propre sur corridors principaux
- App mobile (React Native)
- Programme de fidélité / volume discounts
- API publique pour intégration ERP des gros acheteurs
- Marketplace de services (installation, maintenance)

---

## DIFFÉRENCIATEURS vs CONCURRENTS

| Feature | sun.store | SolarTraders | SUNTREX |
|---|---|---|---|
| Prix masqués / onboarding | ✅ | ✅ | ✅ |
| Chat buyer-seller | ✅ | ❌ | ✅ + Modération IA |
| Service de livraison propre | Partiel (sous-traitance) | ❌ | ✅ SUNTREX DELIVERY |
| Vérification colis (photos/QR) | ❌ | ❌ | ✅ |
| Outils IA (advisor, pricing) | ❌ | ❌ | ✅ |
| Support WhatsApp + Téléphone | Email uniquement | Email | ✅ Multi-canal |
| Commissions | Standard marché | Standard marché | -5% vs concurrents |
| Escrow + vérification livraison | Basique (Stripe) | ❌ | ✅ Avancé |
| Traduction IA technique | Basique | ❌ | ✅ Contextualisée PV |
| Anti-fraude IA | ❌ | ❌ | ✅ |

---

*Document généré le 23/02/2026 — SUNTREX Project Decomposition v1.0*
