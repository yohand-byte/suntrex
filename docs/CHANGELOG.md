# SUNTREX — Changelog

Toutes les modifications notables du projet sont documentées ici.

---

## [0.7.0] — 2026-02-23 (Nuit)

### Auth System v2 — Réécriture complète
- **Suppression sélection de rôle** — Tout le monde s'inscrit comme acheteur. Devenir vendeur = démarche séparée depuis le profil.
- **API SIRENE corrigée** — Migration vers `recherche-entreprises.api.gouv.fr` (gratuite, sans clé). Auto-fill nom, adresse, CP, ville.
- **SIRET obligatoire** pour entreprises françaises, vérification avant de continuer
- **TVA intracommunautaire obligatoire** pour tous
- **Document KYC obligatoire** — Suppression du bouton "Passer pour l'instant"
- **Prix bloqués** — Nouveau flag `isVerified` = `isLoggedIn && kycStatus === "verified"`. Prix masqués tant que KYC non validé par admin.
- **Bannière vérification** — Bandeau jaune dans le header pour users en attente
- **"Devenir vendeur"** — Option dans UserMenu avec badge NEW
- **Modal redimensionnée** — Panneau latéral 300px, total 780px (step 0)

### RGPD Compliance
- 3 checkboxes consentement (CGV obligatoire, marketing opt-in, partenaires opt-in)
- Checkbox CGV bloque la progression si non cochée
- Liens cliquables vers pages légales

## [0.6.0] — 2026-02-23

### Auth & Onboarding System
- Login modal (email + mdp + Google)
- Register modal 3 étapes (compte → entreprise → KYC)
- KYC différencié buyer (léger) vs seller (renforcé + Stripe)
- UserMenu dropdown avec sections profil/acheter/vendre
- Layout split-screen inscription (formulaire + panneau avantages)

## [0.5.0] — 2026-02-23

### Catalogue & Fiche Produit
- CatalogPage avec filtres latéraux (marque, catégorie, puissance, dispo)
- Regroupement produits par modèle avec expansion offres
- ProductDetailPage avec specs, multi-vendeurs, badges vendeur
- Prix masqués via `isLoggedIn` prop
- Navigation catalogue ↔ fiche produit

## [0.4.0] — 2026-02-23

### Landing Page v7
- Hero avec vidéo background + overlay gradient
- Barre de recherche centrée
- Carrousel marques défilant (logos texte avec fallback)
- Grille catégories asymétrique
- Slides interactifs acheteur/vendeur
- Section confiance + CTA inscription
- Footer complet

### Assets
- Vidéo hero (Pexels)
- Images produits Huawei/Deye (sites officiels)
- Logos marques (texte fallback — images à intégrer)

## [0.3.0] — 2026-02-23

### Configuration Projet
- Init Vite + React
- Configuration Vercel (vercel.json)
- Structure dossiers src/public
- Build pipeline fonctionnel

---

## [0.1.0] — 2026-02-23

### Project Kickoff
- Décomposition architecturale complète (6 parties)
- Analyse concurrentielle sun.store / SolarTraders
- Définition stack technique
- Roadmap 4 phases

---

*Format basé sur [Keep a Changelog](https://keepachangelog.com/)*
