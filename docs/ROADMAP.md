# SUNTREX — Roadmap de Développement

> Dernière mise à jour : 23/02/2026

---

## Vue d'ensemble

```
Phase 1 (MVP)        Phase 2 (Trust)       Phase 3 (IA)          Phase 4 (Scale)
4-6 semaines          4-6 semaines          6-8 semaines          Continu
────────────────── ─────────────────── ─────────────────── ──────────────────
Lancement minimal     Livraison +           Outils IA +           Expansion EU +
Quelques vendeurs     Confiance             Automatisation        App mobile
```

---

## Phase 1 — MVP (4-6 semaines)

**Objectif** : Lancer avec quelques vendeurs (produits Huawei, Deye) et prouver le concept.

### 🟢 Fait (23/02/2026)
- [x] Landing page avec hero, catégories, carrousel marques
- [x] Catalogue produits avec filtres (marque, catégorie, puissance, disponibilité)
- [x] Fiches produits avec comparaison multi-vendeurs
- [x] Prix masqués pour visiteurs non inscrits (PriceGate)
- [x] Inscription avec SIRET/SIREN auto-fill via API (recherche-entreprises.api.gouv.fr)
- [x] TVA intracommunautaire obligatoire
- [x] KYC document obligatoire (pas de skip)
- [x] Conformité RGPD (3 checkboxes consentement)
- [x] Login / Register modals
- [x] UserMenu dropdown avec navigation profil
- [x] Bannière "vérification en cours" pour users non vérifiés
- [x] Prix bloqués tant que KYC non validé (isVerified flag)
- [x] Build Vite fonctionnel, déployable Vercel

### 🟡 En cours
- [ ] Déploiement production Vercel avec domaine suntrex.com
- [ ] Assets réels (logos marques, images produits haute qualité)
- [ ] Repo GitHub avec documentation

### 🔴 À faire
- [ ] **Backend API** (Node.js / Next.js API Routes)
  - [ ] Auth endpoints (register, login, verify email)
  - [ ] Google OAuth
  - [ ] Upload KYC documents (S3/Cloudflare R2)
  - [ ] CRUD produits et offres
  - [ ] Gestion utilisateurs (admin verify KYC)
- [ ] **Base de données** (PostgreSQL via Neon/Supabase)
  - [ ] Schema : users, companies, products, offers, orders, transactions
  - [ ] Migrations
- [ ] **Stripe Connect** (paiements)
  - [ ] Onboarding vendeur (Account Links)
  - [ ] Destination Charges avec application_fee
  - [ ] Webhooks (payment_intent.succeeded, account.updated)
  - [ ] 3D Secure / SCA
- [ ] **Chat acheteur-vendeur** (basique, sans IA)
  - [ ] WebSocket ou Pusher
  - [ ] Modération manuelle
- [ ] **Dashboard vendeur** (gérer offres, mes ventes)
- [ ] **Dashboard acheteur** (mes achats)
- [ ] **Multilingue FR/EN**
- [ ] **Email transactionnel** (Resend/SendGrid)
  - [ ] Confirmation inscription
  - [ ] KYC validé/rejeté
  - [ ] Confirmation commande

---

## Phase 2 — Trust & Delivery (4-6 semaines)

**Objectif** : Se différencier avec SUNTREX DELIVERY et un système de confiance.

- [ ] **SUNTREX DELIVERY**
  - [ ] QR codes par colis
  - [ ] Tracking temps réel (GPS + horodatage)
  - [ ] Photos vérification (expédition + réception)
  - [ ] Signature électronique
  - [ ] Dashboard livraisons admin
- [ ] **Escrow amélioré**
  - [ ] Fonds bloqués jusqu'à confirmation livraison
  - [ ] Déblocage automatique après X jours sans contestation
  - [ ] Gestion des litiges avec preuves photo/GPS
- [ ] **Système de confiance**
  - [ ] Badges vendeur (Super vendeur, Vendeur de confiance)
  - [ ] Notation vendeur (transactions, temps de réponse, taux annulation)
  - [ ] Score de fiabilité IA
- [ ] **Support multi-canal**
  - [ ] Chat in-app
  - [ ] WhatsApp Business API
  - [ ] Téléphone (numéro dédié par marché)
- [ ] **Import offres en masse** (template xlsx)
- [ ] **Dashboard admin**
  - [ ] Réconciliation Stripe
  - [ ] Suivi commissions
  - [ ] Gestion litiges
  - [ ] Validation KYC
- [ ] **Multilingue DE/ES**

---

## Phase 3 — IA & Automatisation (6-8 semaines)

**Objectif** : Outils IA innovants comme différenciateur majeur.

- [ ] **SUNTREX AI Advisor** (acheteur)
  - [ ] Recommandation produit par requête naturelle
  - [ ] Comparateur intelligent (tableau specs + analyse prix/perf)
  - [ ] Calculateur de dimensionnement
  - [ ] Chat IA widget flottant
- [ ] **SUNTREX Seller AI** (vendeur)
  - [ ] Pricing intelligent (analyse concurrence plateforme)
  - [ ] Gestion stock prédictive
  - [ ] Auto-réponse négociation (suggestions)
- [ ] **IA de Modération**
  - [ ] Filtrage temps réel chat
  - [ ] Détection arnaque (paiement hors plateforme)
  - [ ] Scoring confiance algorithmique
  - [ ] Alertes modérateurs
- [ ] **Recherche sémantique**
  - [ ] "batterie Huawei 10 kWh" → LUNA2000-10-S0
  - [ ] Filtrage dynamique par requête naturelle
  - [ ] Autocomplete intelligent
- [ ] **Traduction IA contextualisée** (vocabulaire technique PV)
- [ ] **Multilingue IT/NL**
- [ ] **SEO technique** (SSR, meta tags, structured data)

---

## Phase 4 — Expansion (continu)

- [ ] Flotte de livraison propre (corridors FR↔DE, FR↔BE, FR↔NL)
- [ ] App mobile (React Native)
- [ ] Programme fidélité / volume discounts
- [ ] API publique (intégration ERP gros acheteurs)
- [ ] Marketplace services (installation, maintenance, audit)
- [ ] Expansion marchés : Pologne, Scandinavie, UK
- [ ] Certification B Corp / engagement RSE

---

## KPIs de Suivi

| Métrique | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| Vendeurs actifs | 3-5 | 15-25 | 50+ |
| Produits listés | 50-100 | 500+ | 2000+ |
| Acheteurs inscrits | 100 | 500 | 2000+ |
| Transactions/mois | 10-20 | 100+ | 500+ |
| GMV mensuel | 50K€ | 500K€ | 2M€+ |
| NPS | >40 | >50 | >60 |

---

*Document vivant — Mis à jour à chaque sprint.*
