# SUNTREX — Architecture Stripe Connect

> ⚠️ DOCUMENT SENSIBLE — Ne pas partager publiquement. Contient des patterns de sécurité.

---

## Vue d'ensemble

SUNTREX utilise **Stripe Connect** en mode **Destination Charges** pour encaisser les paiements des acheteurs, prélever la commission plateforme, et transférer le reste aux vendeurs.

```
Acheteur → PaymentIntent → SUNTREX (plateforme) → Transfer → Vendeur (compte connecté)
                                    ↓
                            application_fee (commission)
```

---

## Architecture des Comptes

| Entité | Type Stripe | Rôle |
|--------|-------------|------|
| SUNTREX | Platform account | Encaisse, prélève commission, gère litiges |
| Vendeur | Connected account (Standard) | Reçoit les transferts après commission |
| Acheteur | Customer | Paie via PaymentIntent |

---

## Flux de Paiement (Destination Charges)

```javascript
// Backend — créer un PaymentIntent avec destination
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountInCents, // Montant total TTC
  currency: 'eur',
  customer: buyerStripeCustomerId,
  payment_method_types: ['card'],
  transfer_data: {
    destination: sellerStripeAccountId, // acct_xxxxx du vendeur
  },
  application_fee_amount: platformFeeInCents, // Commission SUNTREX
  metadata: {
    order_id: orderId,
    buyer_id: buyerId,
    seller_id: sellerId,
  },
}, {
  idempotencyKey: `order_${orderId}_payment`, // Anti-doublon
});
```

---

## Onboarding Vendeur (Stripe Connect)

### Flux

```
1. Acheteur vérifié clique "Devenir vendeur"
2. Backend crée un compte connecté Stripe
3. Backend génère un Account Link (URL onboarding Stripe)
4. Vendeur complète KYB sur Stripe (identité, IBAN, TVA)
5. Stripe envoie webhook account.updated
6. Backend vérifie charges_enabled + payouts_enabled
7. Si OK → rôle user = "both", dashboard vendeur activé
```

### Code Backend

```javascript
// Créer le compte connecté
const account = await stripe.accounts.create({
  type: 'standard',
  country: user.country, // 'FR', 'DE', etc.
  email: user.email,
  business_type: 'company',
  metadata: {
    suntrex_user_id: user.id,
  },
});

// Générer le lien d'onboarding
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${BASE_URL}/seller/onboarding/refresh`,
  return_url: `${BASE_URL}/seller/onboarding/complete`,
  type: 'account_onboarding',
});

// Rediriger le vendeur vers accountLink.url
```

---

## Webhooks

### Endpoint : `/api/stripe/webhook`

```javascript
// TOUJOURS vérifier la signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body, // raw body, pas JSON parsé
  sig,
  process.env.STRIPE_WEBHOOK_SECRET // whsec_xxxxx
);
```

### Événements critiques

| Événement | Action |
|-----------|--------|
| `payment_intent.succeeded` | Marquer commande "paid", notifier vendeur |
| `payment_intent.payment_failed` | Notifier acheteur, proposer retry |
| `account.updated` | Vérifier `charges_enabled` + `payouts_enabled`, activer vendeur |
| `charge.dispute.created` | Alerter admin, geler la commande |
| `charge.refunded` | Mettre à jour commande, notifier les deux parties |
| `transfer.created` | Logger le transfert pour réconciliation |
| `payout.failed` | Alerter admin + vendeur |

---

## Sécurité — Règles ABSOLUES

### ❌ JAMAIS

- `sk_live_*` ou `sk_test_*` dans le code frontend
- Clés API en dur dans le code (utiliser `.env` exclusivement)
- Clés dans un commit Git (ajouter `.env` au `.gitignore`)
- Faire confiance aux montants envoyés par le client
- Créer un PaymentIntent sans vérifier le prix côté serveur
- Utiliser les clés `live` en développement

### ✅ TOUJOURS

- Variables d'environnement pour TOUTES les clés Stripe
- `idempotencyKey` sur PaymentIntents et Transfers
- Vérification signature webhook (`stripe-signature` header)
- Recalculer le montant côté serveur avant de créer le PaymentIntent
- Vérifier `charges_enabled` avant d'autoriser une vente
- Logger les IDs Stripe en base (payment_intent, transfer, charge)
- Mode test (`sk_test_*`) pour tout développement
- Épingler la version API (`apiVersion`)
- 3D Secure / SCA actif (obligatoire en Europe)

---

## Variables d'Environnement

```env
# .env (JAMAIS commité)
STRIPE_SECRET_KEY=sk_test_xxxxx          # ou sk_live_xxxxx en prod
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx     # ou pk_live_xxxxx en prod
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_API_VERSION=2025-01-27.acacia     # Épingler la version
```

---

## 3D Secure / SCA

Obligatoire en Europe (PSD2). Stripe gère automatiquement avec `payment_method_types: ['card']` et `confirmation_method: 'automatic'`.

```javascript
// Frontend — confirmer avec 3DS si nécessaire
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  { payment_method: { card: cardElement } }
);

if (error) {
  // 3DS échoué ou carte refusée
} else if (paymentIntent.status === 'succeeded') {
  // Paiement OK
}
```

---

## Multi-devises

| Marché | Devise | Devise Stripe |
|--------|--------|--------------|
| France, Allemagne, Benelux, Italie, Espagne | EUR | `eur` |
| Royaume-Uni | GBP | `gbp` |
| Suisse | CHF | `chf` |
| Pologne | PLN | `pln` |

Le vendeur affiche ses prix dans sa devise, l'acheteur paie dans la sienne. Stripe gère la conversion si les comptes sont dans des devises différentes.

---

## Réconciliation

### Dashboard Admin (Phase 2)

- Total encaissé (PaymentIntents succeeded)
- Total commissions (application_fees)
- Total transféré aux vendeurs (transfers)
- Écart = Total encaissé - commissions - transferts (doit être ~0)
- Alerter si écart > 1€

### Logging

Chaque transaction en base :
```
order_id | stripe_pi_id | stripe_charge_id | stripe_transfer_id | amount | fee | net_to_seller | status | created_at
```

---

## Escrow (Phase 2)

Avec SUNTREX Delivery :
1. Acheteur paie → fonds encaissés par SUNTREX
2. Vendeur expédie → tracking SUNTREX Delivery
3. Acheteur confirme réception (ou auto-confirm après X jours)
4. SUNTREX déclenche le transfer vers le vendeur
5. Si litige → fonds gelés, médiation admin

```javascript
// Transfer déclenché UNIQUEMENT après confirmation livraison
if (order.status === 'delivered' && order.delivery_confirmed) {
  await stripe.transfers.create({
    amount: netToSellerInCents,
    currency: 'eur',
    destination: sellerStripeAccountId,
    transfer_group: `order_${order.id}`,
  }, {
    idempotencyKey: `transfer_order_${order.id}`,
  });
}
```

---

*Stripe Architecture v1.0 — 23/02/2026*
