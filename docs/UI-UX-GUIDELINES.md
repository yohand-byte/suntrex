# SUNTREX — UI/UX Guidelines

---

## Design Principles

1. **Conversion B2B first** — Chaque élément pousse vers l'inscription puis l'achat
2. **Prix masqués = levier principal** — L'accès aux prix motive l'inscription
3. **Professionnalisme** — Design épuré, sobre, confiance — pas de gadgets inutiles
4. **Rapidité** — Temps de chargement < 2s, navigation fluide
5. **Responsive** — Desktop-first (B2B = 80% desktop) mais mobile fonctionnel

---

## Couleurs

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#E8700A` | CTA, accents, logo, prix |
| `success` | `#4CAF50` | Validations, badges vérifiés |
| `danger` | `#dc2626` | Erreurs, alertes critiques |
| `warning` | `#f59e0b` | Avertissements, en attente |
| `info` | `#1e40af` | Informations, liens |
| `text-primary` | `#222222` | Texte principal |
| `text-secondary` | `#7b7b7b` | Texte secondaire |
| `bg-page` | `#f4f5f7` | Fond de page |
| `bg-card` | `#ffffff` | Fond de carte |
| `border` | `#e4e5ec` | Bordures |

---

## Typographie

- **Police** : `DM Sans` (Google Fonts) — Pro, moderne, lisible
- **Titres** : 700 (bold)
- **Corps** : 400 (regular)
- **Labels** : 500 (medium), 13px
- **Small** : 12px, color `text-secondary`

---

## Composants Clés

### PriceGate (prix masqués)

```
┌─────────────────────────┐
│  ████████ €/pcs         │  ← Blur + overlay
│  [Voir le prix]         │  ← CTA orange → ouvre RegisterModal
└─────────────────────────┘
```

- Si `isVerified === false` → afficher bouton "Voir le prix" ou "Vérification en cours"
- Si `isVerified === true` → afficher le prix en orange bold

### Product Card

```
┌─────────────────────────┐
│  [Image produit]        │  fond #f8f8f8
│                         │
│  Nom du produit         │  14px, bold, 2 lignes max
│  Puissance: 5kW         │  12px, gris
│  Type: Hybride          │
│                         │
│  Des €1,234 /pcs        │  18px, bold, #E8700A
│  ou [Voir le prix]      │
└─────────────────────────┘
```

### Verification Banner (header)

```
⏳ Vérification en cours — Prix et commandes bloqués jusqu'à validation. [Voir mon statut]
```
- Background : `#fffbeb`, border-bottom : `#fde68a`
- Visible pour tous les users `kycStatus !== "verified"`

---

## Pages de Référence (sun.store)

### Homepage
- Hero plein écran avec barre de recherche centrée
- Carrousel marques horizontal (logos cliquables)
- Grille catégories (2 grandes + 2 petites colonnes)
- Section "Meilleurs produits" en scroll horizontal
- Footer avec liens légaux, contact, réseaux

### Catalogue
- Filtres latéraux gauche (accordéon) : disponibilité, catégorie, puissance, marque, prix, type, phases, MPPT
- Toggle "Regroupement de produits" en haut
- Cards produit en grille 3-4 colonnes
- Expansion "Voir les offres (X)" sous chaque produit regroupé

### Fiche Produit
- Image(s) à gauche, specs à droite
- Tableau offres multi-vendeurs : prix, stock, vendeur, drapeau pays, note, badges
- Bouton "Ajouter au panier" par offre
- Onglets : Description, Spécifications, Datasheets, Avis

### Inscription (split-screen)
- Gauche : panneau orange avec avantages + logos marques (300px)
- Droite : formulaire (480px)
- 3 étapes : Compte → Entreprise (SIRET) → Document KYC
- Pas de sélection de rôle (tout le monde = acheteur)

---

## Patterns UX

### Onboarding progressif
1. Inscription rapide (email + mdp) → donne envie de continuer
2. Infos entreprise (auto-fill SIRET) → friction réduite
3. Document KYC (1 upload) → confiance + sécurité
4. Validation admin (24h) → anticipation positive

### Conversion funnel
```
Visiteur → Catalogue (prix masqués) → CTA "Voir le prix"
    → Register (3 étapes)
    → ⏳ Pending (explore sans prix)
    → ✅ Verified (prix + commandes)
    → Achat → Fidélisation
```

### Seller upgrade flow
```
Acheteur vérifié → Menu → "Devenir vendeur" (badge NEW)
    → Explications Stripe Connect KYB
    → Lien Account Links Stripe
    → ⏳ Stripe vérifie (24-72h)
    → ✅ Dashboard vendeur activé
```

---

## Responsive Breakpoints

| Breakpoint | Device | Colonnes catalogue |
|-----------|--------|-------------------|
| > 1200px | Desktop large | 4 |
| 900-1200px | Desktop | 3 |
| 600-900px | Tablet | 2 |
| < 600px | Mobile | 1 |

---

## Accessibilité (cibles)

- Contraste WCAG AA minimum
- Labels sur tous les inputs
- Focus visible sur éléments interactifs
- Alt text sur images produit
- Navigation clavier fonctionnelle

---

*UI/UX Guidelines v1.0 — 23/02/2026*
