# SUNTREX n8n — Prod Checklist & E2E Tests

## Workflows créés

| Workflow | ID | Nodes | Statut |
|----------|----|-------|--------|
| Stripe Payment Flow (Core Revenue) | `wnarPrvFAgYu0rmF` | 28 | ✅ Actif |
| Dead Letter & Error Alerting | `0Q23FXcq1VsHZgrr` | 3 | ✅ Actif |
| Test Webhook | `woJyKnotlZnpphp5` | 3 | ✅ Actif |

---

## Actions avant production

### 1. Domaine HTTPS public (bloquant)

```bash
# Option A — Cloudflare Tunnel (gratuit, recommandé)
cloudflared tunnel --url http://localhost:5678

# Option B — ngrok (dev/test)
ngrok http 5678

# Option C — VPS avec nginx + Let's Encrypt
# Pointer le domaine n8n.suntrex.eu vers le serveur
# Configurer N8N_HOST, N8N_PROTOCOL=https, N8N_PORT=443
```

URL finale à mettre dans Stripe Dashboard :
```
https://n8n.suntrex.eu/webhook/wnarPrvFAgYu0rmF/webhook/stripe-payment-webhook
```

---

### 2. Anti-replay event.id ✅ (implémenté)

Le workflow v2 fait un `SELECT` sur `transaction_events` avant chaque traitement :
- Si `stripe_event_id` existe déjà → skip silencieux
- Protège contre les re-livraisons Stripe

---

### 3. Dead-letter + alerting ✅ (implémenté)

Workflow `0Q23FXcq1VsHZgrr` :
- Se déclenche sur toute erreur du workflow principal
- Log dans `transaction_events` avec `event_type: system.workflow_failure`
- **À ajouter en prod** : notification Slack/email via HTTP Request node

Pour ajouter Slack alerting au dead-letter :
```json
{
  "method": "POST",
  "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
  "body": {
    "text": "🚨 SUNTREX n8n error: {{ $json.error_message }} in {{ $json.workflow }}"
  }
}
```

---

### 4. Validation stricte metadata ✅ (implémenté)

Node `Validate & Extract Metadata` vérifie :
- `order_id` ou `transaction_id` → obligatoire
- `buyer_id` → obligatoire
- `seller_id` → obligatoire
- `amount` → entre 100 EUR et 500 000 EUR
- `currency` → whitelist : EUR, GBP, CHF, PLN

Côté Stripe (à vérifier dans le code Netlify Function) :
```javascript
// Dans stripe-connect.js — PaymentIntent creation
await stripe.paymentIntents.create({
  amount: totalCents,
  currency: 'eur',
  metadata: {
    order_id: order.id,        // ← REQUIS par n8n
    buyer_id: buyer.id,        // ← REQUIS par n8n
    seller_id: seller.id,      // ← REQUIS par n8n
    listing_id: listing.id     // facultatif
  },
  // ...
});
```

---

### 5. Events couverts ✅ (implémenté)

| Event Stripe | Handler | Action |
|-------------|---------|--------|
| `payment_intent.succeeded` | `Validate & Extract Metadata` → ... → `Notify Buyer/Seller` | Order PAID + audit + 2 notifications |
| `payment_intent.payment_failed` | `Extract Failed Payment Data` → ... | Order FAILED + notify buyer |
| `charge.dispute.created` | `Mark Order Disputed` | Order DISPUTED + audit log |
| `charge.refunded` | `Extract Refund Data` → ... | Order REFUNDED/PARTIAL + audit log |
| `account.updated` | `Update Company KYC Status` | Company charges_enabled + payouts_enabled |

**Dans Stripe Dashboard → Webhooks → Sélectionner :**
- [x] payment_intent.succeeded
- [x] payment_intent.payment_failed
- [x] charge.dispute.created
- [x] charge.refunded
- [x] account.updated

---

### 6. Rotation des secrets exposés (BLOQUANT avant prod)

```bash
# Secrets à rotater IMMÉDIATEMENT en production :

# 1. Clé API n8n (exposée dans les scripts de test)
# → Supprimer et recréer dans n8n Settings > API Keys

# 2. Stripe Webhook Secret (whsec_)
# → Stripe Dashboard > Webhooks > Rollover signing secret

# 3. Supabase Service Role Key
# → Supabase > Settings > API > Rotate service_role key

# 4. Mot de passe admin n8n
# → Changer "Suntrex123!" immédiatement
```

**Variables à configurer dans n8n (Settings → Variables) :**

| Variable | Source |
|----------|--------|
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |

---

## Tests E2E — Scénarios

### Setup Stripe CLI

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Écouter et forwarder vers n8n
stripe listen --forward-to http://localhost:5678/webhook/wnarPrvFAgYu0rmF/webhook/stripe-payment-webhook
```

---

### Test 1 — payment_intent.succeeded

```bash
stripe trigger payment_intent.succeeded \
  --add payment_intent:metadata.order_id=test-order-uuid-001 \
  --add payment_intent:metadata.buyer_id=buyer-uuid-001 \
  --add payment_intent:metadata.seller_id=seller-uuid-001
```

**Résultat attendu :**
- [ ] Webhook reçu (status 200 ACK immédiat)
- [ ] Signature vérifiée
- [ ] `Order` mis à jour → `status: 'paid'`
- [ ] Entrée dans `transaction_events` avec `event_type: 'payment.succeeded'`
- [ ] Notification créée pour `buyer_id`
- [ ] Notification créée pour `seller_id`
- [ ] Re-livraison du même event → skipped (idempotency)

---

### Test 2 — payment_intent.payment_failed

```bash
stripe trigger payment_intent.payment_failed \
  --add payment_intent:metadata.order_id=test-order-uuid-002 \
  --add payment_intent:metadata.buyer_id=buyer-uuid-001 \
  --add payment_intent:metadata.seller_id=seller-uuid-001
```

**Résultat attendu :**
- [ ] `Order` mis à jour → `status: 'payment_failed'`
- [ ] `failure_code` stocké
- [ ] Notification créée pour le buyer

---

### Test 3 — charge.dispute.created

```bash
stripe trigger charge.dispute.created
```

**Résultat attendu :**
- [ ] `Order` mis à jour → `status: 'disputed'`
- [ ] Entrée dans `transaction_events` avec `event_type: 'charge.dispute.created'`

---

### Test 4 — charge.refunded

```bash
stripe trigger charge.refunded
```

**Résultat attendu :**
- [ ] `Order` mis à jour → `status: 'refunded'` ou `'partially_refunded'`
- [ ] `refunded_amount_cents` stocké
- [ ] Log dans `transaction_events`

---

### Test 5 — account.updated (KYC Seller)

```bash
stripe trigger account.updated \
  --add account:charges_enabled=true \
  --add account:payouts_enabled=true
```

**Résultat attendu :**
- [ ] `Company.stripe_charges_enabled = true`
- [ ] `Company.stripe_payouts_enabled = true`
- [ ] `Company.kyc_status = 'verified'`

---

### Test 6 — Signature invalide (sécurité)

```bash
# Envoyer un fake webhook sans signature valide
curl -X POST http://localhost:5678/webhook/wnarPrvFAgYu0rmF/webhook/stripe-payment-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=invalidsignature" \
  -d '{"type":"payment_intent.succeeded","id":"evt_fake"}'
```

**Résultat attendu :**
- [ ] ACK 200 immédiat envoyé (fork avant vérification)
- [ ] Signature rejetée
- [ ] Log dans `transaction_events` avec `event_type: 'stripe.webhook.invalid_signature'`
- [ ] Aucune modification dans `Order`

---

### Test 7 — Dead-letter (erreur workflow)

Provoquer une erreur en supprimant temporairement `SUPABASE_SERVICE_ROLE_KEY` et envoyer un event.

**Résultat attendu :**
- [ ] Erreur capturée par le dead-letter workflow
- [ ] Log dans `transaction_events` avec `event_type: 'system.workflow_failure'`

---

## Monitoring en production

```sql
-- Vérifier les derniers events traités
SELECT event_type, payload->>'stripe_event_id', created_at
FROM transaction_events
ORDER BY created_at DESC
LIMIT 50;

-- Chercher les erreurs workflow
SELECT * FROM transaction_events
WHERE event_type IN ('system.workflow_failure', 'stripe.webhook.invalid_signature')
ORDER BY created_at DESC;

-- Vérifier les paiements du jour
SELECT t.id, t.status, t.payment_intent_id, t.paid_at
FROM "Order" t
WHERE t.status = 'paid'
AND t.paid_at > NOW() - INTERVAL '24 hours'
ORDER BY t.paid_at DESC;
```
