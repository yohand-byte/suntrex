# SUNTREX — Business Model

---

## Modèle Économique

### Source de revenus principale : Commission marketplace

SUNTREX prélève une **commission sur chaque transaction** via Stripe Connect `application_fee`.

| Poste | SUNTREX | sun.store | SolarTraders |
|-------|---------|-----------|--------------|
| Commission vendeur | **~5% inférieur** au marché | Standard | Standard |
| Frais acheteur | 0 | 0 | 0 |

**Principe** : Notre commission est systématiquement **5% en dessous** de ce que pratiquent nos concurrents. C'est un argument d'acquisition massif pour les vendeurs.

### Sources de revenus secondaires (Phase 2+)

| Source | Phase | Description |
|--------|-------|-------------|
| SUNTREX Delivery | Phase 2 | Marge sur frais de livraison propriétaire |
| Mise en avant produit | Phase 2 | Vendeurs paient pour apparaître en haut du catalogue |
| Abonnement premium vendeur | Phase 3 | Outils IA avancés, analytics, priorité support |
| Assurance colis | Phase 2 | Option assurance sur produits haute valeur |
| API/ERP intégration | Phase 4 | Abonnement pour gros acheteurs (flux automatisé) |

---

## Marché Cible

### Géographie (par priorité)

1. 🇫🇷 **France** — Marché de lancement, réseau existant
2. 🇩🇪 **Allemagne** — Plus gros marché PV européen
3. 🇧🇪🇳🇱🇱🇺 **Benelux** — Forte densité installateurs
4. 🇮🇹 **Italie** — Marché PV en forte croissance
5. 🇪🇸 **Espagne** — Boom solaire résidentiel et commercial

### Segments clients

| Segment | Taille | Besoin | Volume achat |
|---------|--------|--------|-------------|
| Installateurs PV | 80% | Prix compétitifs, livraison rapide, datasheets | 5-50 produits/mois |
| Distributeurs régionaux | 15% | Volume, multi-marques, conditions négo | 50-500 produits/mois |
| Entreprises énergie | 5% | Gros volumes, intégration ERP, SLA | 500+ produits/mois |

---

## Avantages Concurrentiels

### vs sun.store

| Dimension | sun.store | SUNTREX | Avantage |
|-----------|-----------|---------|----------|
| Commission | Standard | -5% | ✅ SUNTREX |
| Livraison | Sous-traitée | Propriétaire (SUNTREX Delivery) | ✅ SUNTREX |
| Vérification colis | Non | QR + photos + GPS | ✅ SUNTREX |
| Outils IA | Non | Advisor, pricing, modération | ✅ SUNTREX |
| Support | Email | Téléphone + email + WhatsApp + chat | ✅ SUNTREX |
| Anti-fraude | Basique | IA + modération humaine | ✅ SUNTREX |
| Catalogue | Large | Plus petit (MVP) | ❌ sun.store |
| Notoriété | Établie | Nouvelle | ❌ sun.store |

### vs SolarTraders

| Dimension | SolarTraders | SUNTREX | Avantage |
|-----------|-------------|---------|----------|
| Chat buyer-seller | Non | Oui + modération | ✅ SUNTREX |
| Paiement intégré | Limité | Stripe Connect complet | ✅ SUNTREX |
| Livraison | Non | SUNTREX Delivery | ✅ SUNTREX |
| Escrow | Non | Oui (Stripe) | ✅ SUNTREX |

---

## Stratégie de Lancement

### Phase 1 — "Land and Expand" (Semaines 1-6)

1. **Recruter 3-5 vendeurs** avec des prix imbattables (Huawei, Deye)
2. **Commissions agressives** pour attirer les premiers vendeurs
3. **Cibler les installateurs FR** via LinkedIn, salons, bouche-à-oreille
4. **Marquer les esprits** avec une UX supérieure et un support réactif
5. **Collecter du feedback** intensivement pour itérer vite

### Phase 2 — "Trust Building" (Semaines 7-12)

1. **Lancer SUNTREX Delivery** sur les corridors FR principaux
2. **Activer les badges de confiance** (Super vendeur, vérifié)
3. **Ouvrir l'Allemagne** (traduction DE, vendeurs DE)
4. **Support WhatsApp** pour les marchés qui l'utilisent massivement

### Phase 3 — "AI Differentiation" (Semaines 13-20)

1. **Lancer les outils IA** comme USP unique
2. **Recherche sémantique** pour une UX imbattable
3. **Scale vendeurs** via import xlsx et outils de pricing

---

## Unit Economics (Estimations)

### Par transaction

| Poste | Montant estimé |
|-------|---------------|
| Panier moyen | 2 500 € |
| Commission SUNTREX | ~X% (~5% sous marché) |
| Frais Stripe | ~1.4% + 0.25€ |
| Marge brute/transaction | Commission - Stripe |

### Coûts fixes mensuels (MVP)

| Poste | Estimation |
|-------|-----------|
| Hébergement (Vercel + DB) | 50-200€ |
| Stripe | Variable (par transaction) |
| Email (Resend) | 20€ |
| Domaine + SSL | ~10€/mois |
| Outils divers | ~100€ |
| **Total fixe** | **~300-500€/mois** |

### Break-even estimé

Avec un panier moyen de 2 500€ et une commission nette de ~2-3% après Stripe :
- ~50-75€ de marge brute par transaction
- Break-even MVP à ~10 transactions/mois (couvrir les coûts fixes)
- **Objectif Phase 1 : 20+ transactions/mois**

---

## Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Pas assez de vendeurs | Critique | Commissions agressives, onboarding white-glove |
| Pas assez d'acheteurs | Critique | SEO, LinkedIn, partenariats installateurs |
| Fraude/mauvaise foi | Élevé | KYC obligatoire, modération, escrow |
| Concurrence sun.store | Moyen | Différenciation Delivery + IA + support |
| Problèmes Stripe Connect | Moyen | Tests intensifs, mode sandbox, monitoring |
| Litige livraison | Moyen | SUNTREX Delivery + vérification colis |

---

*Business Model v1.0 — 23/02/2026*
