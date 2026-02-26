# ☀️ SUNTREX — Marketplace B2B Solaire Européenne

> **La marketplace qui connecte les professionnels du solaire en Europe.**
> Comparez les prix de milliers de vendeurs vérifiés. Panneaux solaires, onduleurs, batteries, accessoires.

[![Status](https://img.shields.io/badge/Status-MVP%20Development-orange)]()
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Vite%20%2B%20Stripe-blue)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 🎯 Vision

SUNTREX ambitionne de devenir **la référence européenne** pour l'achat d'équipements photovoltaïques en B2B. Notre différenciation :

- **Commissions 5% inférieures** aux concurrents (sun.store, SolarTraders)
- **SUNTREX Delivery** — service de livraison propriétaire avec vérification des colis
- **Outils IA** — recommandation produit, pricing intelligent, modération automatique
- **Support ultra-réactif** — multi-canal (téléphone, email, WhatsApp, chat)
- **Sécurité renforcée** — KYC obligatoire, modération chat, anti-fraude IA

## 🏗️ Architecture

```
suntrex/
├── src/
│   ├── App.jsx                 # Application principale (routing, layout)
│   ├── AuthSystem.jsx          # Login, Register, UserMenu, KYC
│   ├── CatalogPage.jsx         # Catalogue produits avec filtres
│   ├── ProductDetailPage.jsx   # Fiche produit détaillée
│   └── AnimatedMockups.jsx     # Composants visuels landing
├── public/                     # Assets statiques
├── docs/                       # Documentation projet
│   ├── PROJECT-DECOMPOSITION.md
│   ├── ROADMAP.md
│   ├── MVP-SPEC.md
│   ├── BUSINESS-MODEL.md
│   ├── UI-UX-GUIDELINES.md
│   ├── STRIPE-ARCHITECTURE.md
│   ├── SECURITY.md
│   └── CHANGELOG.md
├── package.json
├── vite.config.js
└── vercel.json
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/[your-org]/suntrex.git
cd suntrex

# Install
npm install

# Dev
npm run dev

# Build
npm run build
```

## 📋 Documentation

| Document | Description |
|----------|-------------|
| [Project Decomposition](docs/PROJECT-DECOMPOSITION.md) | Architecture complète en 6 parties |
| [Roadmap](docs/ROADMAP.md) | Phases de développement (MVP → Scale) |
| [MVP Spec](docs/MVP-SPEC.md) | Spécifications MVP Phase 1 |
| [Business Model](docs/BUSINESS-MODEL.md) | Modèle économique et différenciation |
| [UI/UX Guidelines](docs/UI-UX-GUIDELINES.md) | Design system et références |
| [Stripe Architecture](docs/STRIPE-ARCHITECTURE.md) | Paiements, Connect, sécurité |
| [Security](docs/SECURITY.md) | Politique de sécurité |
| [Marketplace Audit (2026-02-26)](docs/AUDIT-MARKETPLACE-2026-02-26.md) | Audit produit/UI-UX/logique métier orienté marketplace |
| [Implementation Backlog (2026-02-26)](docs/IMPLEMENTATION-BACKLOG-2026-02-26.md) | Backlog exécutable sprint 1-2 semaines |
| [Codex Multi Prompts MVP (2026-02-26)](docs/CODEX-MULTI-PROMPTS-MVP-2026-02-26.md) | Prompts prêts à l'emploi par stream d'exécution |
| [Roadmap Parallèle Q2 2026](docs/ROADMAP-PARALLEL-2026-Q2.md) | Plan daté avec suivi par validation de lignes |
| [Changelog](docs/CHANGELOG.md) | Historique des modifications |

## 🎛️ Strategy Artifact

- Premium strategy console (Business Plan + MVP + Roadmap interactive):  
  `/artifacts/premium-strategy-console.html`

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite + CSS-in-JS |
| Hébergement | Vercel |
| Paiements | Stripe Connect |
| API SIRENE | recherche-entreprises.api.gouv.fr |
| Auth | Custom (Google OAuth prévu) |

## 🎯 Concurrents / Modèles

- **[sun.store](https://sun.store/fr)** — Référence UI/UX, prix masqués, onboarding
- **[SolarTraders](https://www.solartraders.com/fr/)** — Catalogue multi-vendeurs

## 🔒 Sécurité

- Clés Stripe **jamais** dans le code — uniquement variables d'environnement
- KYC obligatoire pour TOUS les utilisateurs (SIRET vérifié via API)
- Prix masqués tant que KYC non validé par admin
- Webhooks Stripe avec vérification de signature
- Voir [docs/SECURITY.md](docs/SECURITY.md)

## 👥 Équipe

Une équipe jeune avec du métier et des idées à revendre.

---

*SUNTREX — Marketplace B2B Solaire Européenne — 2026*
