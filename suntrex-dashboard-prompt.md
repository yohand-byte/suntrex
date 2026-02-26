# PROMPT CLAUDE CODE — Dashboard Unifié BUY/SELL SUNTREX

> **Colle ce prompt entier dans Claude Code depuis `~/Downloads/suntrex`.**
> Claude Code lira automatiquement le `CLAUDE.md` racine — ce prompt ajoute le contexte spécifique pour le dashboard.

---

## MISSION

Créer le **dashboard unifié acheteur/vendeur** de SUNTREX, inspiré de sun.store, avec un système de transactions qui inclut un chat de négociation intégré. Ce dashboard est le cœur de l'interface connectée — c'est la page que voit un utilisateur après login.

**Ce n'est PAS un artefact isolé** — c'est un ensemble de composants React à intégrer dans l'architecture existante (`src/components/`) avec routing, Supabase realtime, et Stripe Connect.

---

## CONTEXTE ARCHITECTURE EXISTANTE

Lis d'abord ces fichiers pour comprendre les conventions :
```
cat CLAUDE.md
cat src/App.jsx | head -50
cat src/components/chat/CLAUDE.md
cat src/components/payment/CLAUDE.md
cat netlify/functions/CLAUDE.md
```

### Stack confirmée
- **Frontend** : Vite + React, inline styles (pas Tailwind, pas CSS modules)
- **State** : React hooks (useState, useEffect, useRef, useContext)
- **DB/Auth** : Supabase (PostgreSQL + Realtime + Auth)
- **Serverless** : Netlify Functions
- **Payments** : Stripe Connect (Destination Charges)
- **Hosting** : Vercel (front) + Netlify (functions)

### Convention de style : INLINE STYLES uniquement
```jsx
// ✅ Ce qu'on fait chez SUNTREX
<div style={{ padding: isMobile ? 16 : 40, display: "flex", gap: 16 }}>

// ❌ INTERDIT — pas de className, pas de Tailwind
<div className="p-4 flex gap-4">
```

---

## STRUCTURE DE FICHIERS À CRÉER

```
src/
├── components/
│   ├── dashboard/
│   │   ├── CLAUDE.md                    # ← Règles spécifiques dashboard
│   │   ├── DashboardLayout.jsx          # Layout principal (sidebar + topbar + content)
│   │   ├── DashboardSidebar.jsx         # Sidebar contextuelle BUY/SELL
│   │   ├── DashboardTopbar.jsx          # Topbar avec BUY|SELL|MY PROFILE|NOTIFICATIONS
│   │   ├── DashboardRouter.jsx          # Routing interne des sections
│   │   │
│   │   ├── buy/                         # === ESPACE ACHETEUR ===
│   │   │   ├── MyPurchases.jsx          # Liste des achats/transactions côté buyer
│   │   │   ├── DeliveryAddresses.jsx    # Gestion des adresses de livraison
│   │   │   ├── BuyerRFQ.jsx            # Demandes de devis (Requests for Proposals)
│   │   │   └── BuyerOverview.jsx        # Vue d'ensemble acheteur (stats, charts)
│   │   │
│   │   ├── sell/                        # === ESPACE VENDEUR ===
│   │   │   ├── ManageOffers.jsx         # Gestion des offres/listings
│   │   │   ├── MySales.jsx             # Liste des ventes (= TransactionsList)
│   │   │   ├── SellerOverview.jsx       # Vue d'ensemble vendeur (stats, revenus)
│   │   │   └── WarehouseManager.jsx     # Gestion des entrepôts
│   │   │
│   │   ├── transaction/                 # === SYSTÈME DE TRANSACTIONS ===
│   │   │   ├── TransactionPage.jsx      # Page transaction complète (le cœur)
│   │   │   ├── TransactionChat.jsx      # Chat de négociation (dans TransactionPage)
│   │   │   ├── TransactionTimeline.jsx  # Timeline statut (Négo→Confirmé→Payé→Expédié→Livré)
│   │   │   ├── TransactionProducts.jsx  # Carte produit éditable (prix, qty, livraison)
│   │   │   └── TransactionDetails.jsx   # Panel détails (vendeur/acheteur, TVA, adresse)
│   │   │
│   │   ├── profile/                     # === MON PROFIL ===
│   │   │   ├── AccountDetails.jsx       # Détails du compte
│   │   │   ├── CompanyDetails.jsx       # Infos entreprise + KYC
│   │   │   ├── InvoicesAndFees.jsx      # Factures et commissions
│   │   │   ├── ReviewsPage.jsx          # Avis reçus/donnés
│   │   │   └── OutOfOffice.jsx          # Mode absence
│   │   │
│   │   ├── notifications/               # === NOTIFICATIONS ===
│   │   │   ├── NotificationsCenter.jsx  # Centre de notifications
│   │   │   ├── NotificationEmails.jsx   # Paramètres email
│   │   │   └── NotificationSettings.jsx # Préférences notifications
│   │   │
│   │   └── shared/                      # === COMPOSANTS PARTAGÉS ===
│   │       ├── StatCard.jsx             # Carte statistique réutilisable
│   │       ├── StatusBadge.jsx          # Badge de statut (Négociation, Payé, Livré...)
│   │       ├── PriceEditor.jsx          # Éditeur de prix inline (click→input→validate)
│   │       ├── TranslationBanner.jsx    # Banner traduction automatique
│   │       ├── EmptyState.jsx           # État vide générique
│   │       └── useResponsive.js         # Hook responsive (comme défini dans CLAUDE.md)
│   │
│   └── ... (chat/, payment/, etc. existants)
```

---

## DESIGN SYSTEM — Tokens

Utilise ces tokens partout. Ils sont calqués sur sun.store mais avec l'identité SUNTREX :

```jsx
// src/components/dashboard/tokens.js
export const T = {
  // Colors
  bg: "#f7f8fa",
  card: "#ffffff",
  border: "#e8eaef",
  borderLight: "#f0f1f5",
  text: "#1a1d26",
  textSec: "#6b7280",
  textMuted: "#9ca3af",
  accent: "#E8700A",        // SUNTREX orange
  accentHover: "#d46200",
  accentLight: "#fff7ed",
  green: "#10b981",
  greenBg: "#ecfdf5",
  greenText: "#065f46",
  red: "#ef4444",
  redBg: "#fef2f2",
  redText: "#991b1b",
  blue: "#3b82f6",
  blueBg: "#eff6ff",
  blueText: "#1e40af",
  yellow: "#f59e0b",
  yellowBg: "#fffbeb",
  sidebar: "#1a1d26",
  
  // Spacing & Shape
  radius: 10,
  radiusSm: 6,
  radiusLg: 16,
  
  // Typography
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  
  // Shadows
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.12)",
};
```

---

## NAVIGATION — Structure exacte inspirée sun.store

### Topbar (header quand connecté)
```
┌────────────────────────────────────────────────────────────────────┐
│  [SUNTREX logo]  [Recherche produit...]  [🇫🇷 French-EUR ▾]  🔔  👤  🛒  │
│  ─────────────────────────────────────────────────────────────────  │
│  BUY         SELL         MY PROFILE ▾       NOTIFICATIONS         │
│  ────        ────         ══════════ (green underline = active)    │
└────────────────────────────────────────────────────────────────────┘
```

Les 4 tabs du topbar changent le CONTEXTE de la sidebar :

### Sidebar BUY (quand tab "BUY" actif)
```
BUY ∧
├── My purchases           (icône: shopping bag)
├── Delivery addresses     (icône: map pin)
├── Requests for Proposals (icône: document) [NEW badge]
└── sun.finance → SUNTREX Finance (icône: bank) [NEW badge]

NOTIFICATIONS ∧
├── Notifications center   (icône: bell)
├── Notification emails    (icône: mail)
└── Notifications settings (icône: gear)
```

### Sidebar SELL (quand tab "SELL" actif)
```
SELL ∧
├── Manage offers          (icône: list)
└── My sales               (icône: dollar)
    ├── → TransactionsList (All | Negotiations | Cancelled | Confirmed | Paid | Completed)
    └── → TransactionPage (clic sur une transaction)
```

### Dropdown MY PROFILE
```
├── Account details        (icône: user)
├── Password               (icône: lock)
├── Company details        (icône: building)
├── Invoices & Fees        (icône: receipt) [NEW badge]
├── Reviews                (icône: star)
├── Out of office mode     (icône: moon)
├── ──────────────────────
└── Log out                (icône: logout)
```

---

## WORKFLOW TRANSACTION — Le flux complet

C'est le cœur du système. Chaque négociation crée une transaction avec un ID unique.

### Déclenchement
1. **Buyer** voit un produit dans le catalogue
2. Buyer clique "Acheter" ou "Négocier le prix"
3. → Création automatique d'une **Transaction** avec :
   - ID unique (format: `#[7 chars alphanumériques]` ex: `#FHJ46JUm`)
   - Produit, quantité, prix initial du listing
   - Buyer info + Seller info
   - Status: `negotiation`
   - Chat de négociation ouvert automatiquement
4. **Seller** reçoit notification → voit la transaction dans "Mes ventes"
5. Le chat démarre avec un message système automatique de l'acheteur

### Statuts du pipeline
```
negotiation → confirmed → paid → shipped → delivered
                 ↓                    ↓
              cancelled           disputed
```

### Ce que le SELLER peut faire dans la transaction
- ✏️ **Éditer le prix unitaire** (click "Editer" → input inline → ✓ valider)
- ✏️ **Éditer la quantité**
- ✏️ **Définir/modifier les frais de livraison** (obligatoire pour débloquer le paiement)
- ✉️ **Répondre dans le chat** (avec traduction automatique)
- ➕ **Ajouter des produits** de son catalogue à la transaction
- ❌ **Annuler la transaction** (avec raison obligatoire)
- 📎 **Joindre des fichiers** (devis PDF, fiches techniques)

### Ce que le BUYER peut faire
- 💬 **Négocier dans le chat** (prix, conditions, livraison)
- ✅ **Accepter l'offre** → passe en `confirmed`
- 💳 **Payer** (Stripe Checkout) → passe en `paid`
- 📦 **Suivre la livraison** (SUNTREX DELIVERY)
- ✅ **Confirmer la réception** → passe en `delivered` → fonds libérés au seller
- ⚠️ **Signaler un problème** → passe en `disputed`

---

## SUPABASE — Tables à créer/modifier

### Nouvelle table : `Transaction`
```sql
CREATE TABLE public."Transaction" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id TEXT UNIQUE NOT NULL,           -- '#FHJ46JUm' (généré côté serveur)
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  buyer_company_id UUID REFERENCES public."Company"(id),
  seller_company_id UUID REFERENCES public."Company"(id),
  
  -- Status pipeline
  status TEXT NOT NULL DEFAULT 'negotiation'
    CHECK (status IN ('negotiation','confirmed','paid','shipped','delivered','cancelled','disputed')),
  
  -- Cancellation
  cancelled_by TEXT CHECK (cancelled_by IN ('buyer','seller','admin')),
  cancel_reason TEXT,
  cancel_message TEXT,
  
  -- Delivery
  delivery_method TEXT DEFAULT 'standard',  -- 'standard', 'suntrex_delivery', 'pickup'
  delivery_cost DECIMAL(10,2),              -- NULL = pas encore défini
  delivery_tracking_id TEXT,
  
  -- Stripe
  payment_intent_id TEXT,
  transfer_id TEXT,
  
  -- Incoterms
  incoterms TEXT DEFAULT 'Delivery on premise',
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: buyer et seller voient leurs propres transactions
ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own transactions" ON public."Transaction"
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "Buyer can create transaction" ON public."Transaction"
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Participants can update" ON public."Transaction"
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );
```

### Nouvelle table : `TransactionItem`
```sql
CREATE TABLE public."TransactionItem" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public."Transaction"(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public."Listing"(id),
  
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,4) DEFAULT 0,
  
  -- Seller can edit these
  edited_price DECIMAL(10,2),              -- NULL = original price
  edited_quantity INTEGER,                 -- NULL = original qty
  
  availability INTEGER,                    -- Stock dispo chez le seller
  ship_days INTEGER DEFAULT 3,             -- Temps d'envoi estimé
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public."TransactionItem" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Via transaction access" ON public."TransactionItem"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Transaction" t
      WHERE t.id = transaction_id
      AND (auth.uid() = t.buyer_id OR auth.uid() = t.seller_id)
    )
  );
```

### Nouvelle table : `TransactionMessage`
```sql
CREATE TABLE public."TransactionMessage" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public."Transaction"(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer','seller','system','moderator')),
  
  content TEXT NOT NULL,
  content_original TEXT,                   -- Texte original avant traduction
  original_lang TEXT,                      -- 'nl', 'de', 'fr', etc.
  translated_lang TEXT,                    -- Langue de la traduction affichée
  
  -- Rich content
  has_address_card BOOLEAN DEFAULT false,
  address_country TEXT,
  address_zip TEXT,
  
  -- Attachments
  attachment_urls TEXT[],                  -- Array d'URLs Supabase Storage
  attachment_names TEXT[],
  
  -- Moderation
  flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public."TransactionMessage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Via transaction access" ON public."TransactionMessage"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Transaction" t
      WHERE t.id = transaction_id
      AND (auth.uid() = t.buyer_id OR auth.uid() = t.seller_id)
    )
  );

-- Index pour les requêtes fréquentes
CREATE INDEX idx_tx_msg_transaction ON public."TransactionMessage"(transaction_id, created_at);
```

### Realtime — Subscriptions à configurer
```js
// Écouter les nouveaux messages d'une transaction
supabase
  .channel(`tx-messages:${transactionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'TransactionMessage',
    filter: `transaction_id=eq.${transactionId}`
  }, handleNewMessage)
  .subscribe();

// Écouter les changements de statut d'une transaction
supabase
  .channel(`tx-status:${transactionId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'Transaction',
    filter: `id=eq.${transactionId}`
  }, handleStatusChange)
  .subscribe();
```

---

## PAGE TRANSACTION — Spécifications UI détaillées

### Layout (identique à sun.store — voir screenshots de référence)

```
┌─────────────────────────────────────────────────────────────────┐
│ Mes ventes > Transactions > Transaction #FHJ46JUm              │
│                                                                 │
│ [⊕ Ajouter des produits]  [✕ Annuler la transaction]           │
├─────────────────────────────────────────────────────────────────┤
│ 🛡 Des paiements sécurisés sont disponibles                     │
├─────────────────────────────────────────────────────────────────┤
│ QUALIWATT, 16-18 rue Eiffel, 77220 Gretz-Armainvilliers       │
├─────────────────────────────────────────────────────────────────┤
│ [Image] │ Huawei SUN2000-30KTL │ Qté: 1 pc  │ Prix: €1,555  │
│ #CEM6k  │ Dispo: 4pcs         │ [Editer]   │ TVA: €0.00    │
│         │ Incoterms: DOP      │            │ Net: €1,555   │
│         │ Envoi: ~3 jours     │            │ [Editer]      │
│         │ [Détails produit]   │            │               │
├─────────────────────────────────────────────────────────────────┤
│                   Livraison (brut): Prix sur demande [Editer]  │
│                   Total (brut):              €1,555.00         │
├─────────────────────────────────────────────────────────────────┤
│ ⊕ Ajouter des produits de votre liste                     ∨   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Cette négociation est automatiquement traduite en chat      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Acheteur            mardi, 24 févr. 2026, 23:50         │  │
│  │                                                          │  │
│  │ Bonjour, je suis intéressé par l'achat d'un Huawei      │  │
│  │ SUN2000-30KTL-M3 chez vous...                           │  │
│  │ ┌─────────────────────────┐                             │  │
│  │ │ Adresse de livraison :  │                             │  │
│  │ │ Netherlands              │                             │  │
│  │ │ 24** **                  │                             │  │
│  │ └─────────────────────────┘                             │  │
│  │ ⏰ L'offre est valable 3 jours ouvrables                │  │
│  │ [Afficher dans la langue originale]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🚚 Indiquez les frais de livraison pour permettre        │  │
│  │    à l'acheteur de procéder au paiement.                  │  │
│  │                          [Prévoir les frais de livraison] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Écrivez quelque chose...]                                     │
│  [B][I][U] | [🔗][🖼][😊]  [🔄 Auto-translate FR] [📤 Envoyer]│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Autres pièces jointes                                           │
│ [Ajouter fichiers]              [Rechercher dans les fichiers]  │
├─────────────────────────────────────────────────────────────────┤
│ Contact assistance SUNTREX │ ✉ contact@suntrex.com │[Signaler] │
├──────────────────────────┬──────────────────────────────────────┤
│ Détails du vendeur       │ Détails de la transaction            │
│ TVA: ✓ Actif             │ Coordonnées acheteur: 🇳🇱 Netherlands│
│ Tx complétées: 11        │ TVA: ✓ Vérifié (24.02.26) [Revérif]│
│ Offres actives: 52       │ Adresse livraison: NL, 24** **      │
│ Depuis: 09 Dec 2025      │                                     │
│ ⭐ 5.0 (3 avis)          │ Statut commande:                    │
│ 🕐 Réponse: <2h          │ ● Ouverture négo    23:50, 24.02   │
│                          │ ○ Tx confirmée                      │
│                          │ ○ Payé                               │
│                          │ ○ Expédié                            │
│                          │ ○ Livré                              │
│                          │                                     │
│                          │ Envoyé par: QUALIWATT               │
│                          │ 16-18 rue Eiffel, 77220...          │
└──────────────────────────┴──────────────────────────────────────┘
```

---

## RESPONSIVE — Breakpoints obligatoires

### Mobile (< 768px)
- Sidebar → bottom tab bar (BUY | SELL | PROFILE | NOTIFS)
- Transaction product card → stack vertical
- Chat prend toute la largeur
- Détails vendeur/transaction → accordéons empilés
- Colonnes 2 → 1

### Tablet (768-1023px)
- Sidebar visible mais réduite (icônes only, expand on hover)
- Grid 2 colonnes maintenu pour les détails

### Desktop (≥ 1024px)
- Layout complet comme décrit ci-dessus

---

## INTÉGRATION AVEC L'EXISTANT

### 1. Routing dans App.jsx
```jsx
// Ajouter dans App.jsx un simple router :
// "/" → Landing page (existante)
// "/dashboard" → DashboardLayout (nouveau)
// "/dashboard/buy/purchases" → MyPurchases
// "/dashboard/sell/transactions" → MySales
// "/dashboard/sell/transactions/:id" → TransactionPage
// etc.

// Pour le MVP, un hash router simple suffit :
const [route, setRoute] = useState(window.location.hash || "#/");

// Si hash commence par #/dashboard → render DashboardLayout
// Sinon → render landing page existante
```

### 2. Auth Supabase
```jsx
// L'utilisateur doit être connecté pour accéder au dashboard
import { supabase } from '../../lib/supabase';

const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // Redirect vers login/signup
  return <LoginPage />;
}
```

### 3. Connexion Stripe Connect (SellerOnboarding)
```jsx
// Vérifier le statut Stripe du vendeur avant d'afficher "SELL"
// Utiliser la Netlify Function existante : stripe-connect.js
const checkSellerStatus = async () => {
  const res = await fetch('/api/stripe-connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'check_status', userId: user.id }),
  });
  const { charges_enabled, payouts_enabled } = await res.json();
  // Si pas onboardé → afficher le flow d'onboarding dans l'onglet SELL
};
```

### 4. Netlify Function pour les transactions
Créer `netlify/functions/transaction.js` :
```js
// POST /api/transaction
// Actions : create, update_status, update_price, set_delivery_cost, cancel
// Toutes les modifications de prix/statut passent par le SERVEUR (jamais le client directement)
// Vérifier que l'utilisateur est bien buyer ou seller de la transaction
// Vérifier les montants côté serveur avant de créer un PaymentIntent
```

---

## ORDRE D'IMPLÉMENTATION

Fais-le dans cet ordre précis :

### Étape 1 : Foundation
1. Créer `src/components/dashboard/tokens.js` (design tokens)
2. Créer `src/components/dashboard/shared/useResponsive.js`
3. Créer `src/components/dashboard/shared/StatCard.jsx`
4. Créer `src/components/dashboard/shared/StatusBadge.jsx`
5. Créer `src/components/dashboard/shared/PriceEditor.jsx`
6. Créer `src/components/dashboard/shared/EmptyState.jsx`

### Étape 2 : Layout
7. Créer `DashboardTopbar.jsx` — avec tabs BUY|SELL|MY PROFILE|NOTIFICATIONS
8. Créer `DashboardSidebar.jsx` — contextuel selon le tab actif
9. Créer `DashboardLayout.jsx` — compose sidebar + topbar + content
10. Créer `DashboardRouter.jsx` — routing interne

### Étape 3 : Transactions (le cœur)
11. Créer `sell/MySales.jsx` — liste des transactions avec tabs/filtres/search
12. Créer `transaction/TransactionProducts.jsx` — carte produit éditable
13. Créer `transaction/TransactionChat.jsx` — chat de négociation
14. Créer `transaction/TransactionTimeline.jsx` — pipeline de statuts
15. Créer `transaction/TransactionDetails.jsx` — panel détails vendeur/acheteur
16. Créer `transaction/TransactionPage.jsx` — assemble tout

### Étape 4 : Acheteur
17. Créer `buy/MyPurchases.jsx` — même TransactionsList mais vue buyer
18. Créer `buy/DeliveryAddresses.jsx`
19. Créer `buy/BuyerOverview.jsx`

### Étape 5 : Profil
20. Créer les pages profil (AccountDetails, CompanyDetails, etc.)

### Étape 6 : Backend
21. SQL Supabase : créer tables Transaction, TransactionItem, TransactionMessage
22. RLS policies
23. Netlify Function : `transaction.js`
24. Realtime subscriptions

### Étape 7 : Intégration
25. Modifier `App.jsx` pour ajouter le routing vers le dashboard
26. Connecter Auth Supabase
27. Tester le flow complet

---

## QUALITÉ ATTENDUE

- **100% responsive** (375px → 1440px) — vérifie chaque composant
- **Inline styles uniquement** — pas de className
- **Graceful degradation** : si Supabase pas dispo, mode démo avec données mockées
- **i18n** : toutes les chaînes en FR et EN minimum
- **Accessibilité** : focus states, aria-labels, contraste suffisant
- **Performance** : lazy loading des sections, pas de re-render inutile
- **Sécurité** : jamais de prix/montants envoyés du client au serveur

---

## DONNÉES DE DÉMO (pour le mode hors-ligne)

Inclure des données mockées pour pouvoir tester sans Supabase :
- 3-5 transactions avec différents statuts
- Messages de chat réalistes (négociation solaire B2B)
- Produits Huawei, Deye, Enphase
- Acheteurs de différents pays (🇫🇷 🇩🇪 🇳🇱 🇧🇪 🇪🇸)
- Mix de statuts : negotiation, cancelled, confirmed, paid

---

## RÉFÉRENCE VISUELLE

L'interface sun.store est notre benchmark. Points clés à reproduire :
1. **Sidebar gauche** qui change selon BUY/SELL (sections collapsibles avec chevrons)
2. **Transaction cards** dans la liste avec : statut (cercle vert/rouge), résumé montant, photo produit, dernière mise à jour
3. **Page transaction** : breadcrumb, carte produit éditable, chat avec traduction, détails en colonnes
4. **Chat** : bulles sombres (buyer), blanches bordées (seller), messages système centrés
5. **Barre action livraison** (bleue) : "Indiquez les frais de livraison..."
6. **Toolbar chat** : B/I/U | lien/image/emoji | toggle traduction | bouton Envoyer vert arrondi
7. **Timeline** : cercles verts (complété) connectés par ligne verticale
8. **Pills/badges** pour les stats vendeur : "Transactions: 11", "⭐ 5.0", "🕐 <2h"

Fais MIEUX que sun.store sur :
- Animation/transitions (hover, apparition)
- Micro-interactions (toggle traduction, édition inline)
- Badge SUNTREX DELIVERY (identité propre)
- Indicateur de modération IA dans le chat

---

Commence par l'étape 1 et avance méthodiquement. Montre-moi chaque fichier créé avant de passer au suivant.
