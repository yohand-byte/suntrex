# CLAUDE.md — SUNTREX Netlify Serverless Functions

> Rules specific to `netlify/functions/`. Inherits all global rules from root `CLAUDE.md`.

## Architecture

```
netlify/
├── functions/
│   ├── support-chat-ai.js      # AI chat responses (Claude API)
│   ├── stripe-webhook.js       # Stripe webhook handler (ALL events)
│   ├── stripe-connect.js       # Connect onboarding (Account Links)
│   ├── stripe-checkout.js      # Create PaymentIntent / Checkout Session
│   ├── stripe-transfers.js     # Manual transfers, refunds
│   ├── delivery-tracking.js    # SUNTREX DELIVERY status updates
│   └── CLAUDE.md               # ← THIS FILE
└── netlify.toml                # Routing config
```

## CRITICAL SECURITY RULES

### 1. Environment Variables — NEVER hardcode
```js
// ✅ CORRECT
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ❌ FATAL — instant security breach
const stripe = require('stripe')('sk_live_abc123...');
```

Required env vars (set in Netlify dashboard, NEVER in code):
- `STRIPE_SECRET_KEY` — sk_test_* for dev, sk_live_* for production
- `STRIPE_WEBHOOK_SECRET` — whsec_* for webhook signature verification
- `SUPABASE_URL` — https://uigoadkslyztxgzahmwv.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS, server-only
- `ANTHROPIC_API_KEY` — for Claude AI chat

### 2. Webhook Signature Verification — ALWAYS
```js
// ✅ MANDATORY on every Stripe webhook
const sig = event.headers['stripe-signature'];
let stripeEvent;
try {
  stripeEvent = stripe.webhooks.constructEvent(
    event.body,           // raw body, NOT parsed
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  return { statusCode: 400, body: `Webhook Error: ${err.message}` };
}
```

### 3. Idempotency Keys — on all write operations
```js
// ✅ CORRECT — prevents duplicate charges
const paymentIntent = await stripe.paymentIntents.create({
  amount: 125000, // €1,250.00
  currency: 'eur',
  application_fee_amount: 6250, // SUNTREX commission
  transfer_data: { destination: sellerStripeAccountId },
}, {
  idempotencyKey: `order_${orderId}_payment`
});
```

### 4. Never Trust Client Data
```js
// ❌ WRONG — client sends price
const { amount, sellerId } = JSON.parse(event.body);
await stripe.paymentIntents.create({ amount });

// ✅ CORRECT — look up price server-side
const { listingId, quantity } = JSON.parse(event.body);
const { data: listing } = await supabase
  .from('Listing')
  .select('price, seller_company_id')
  .eq('id', listingId)
  .single();
const amount = listing.price * quantity * 100; // cents
```

## Function Patterns

### Standard Response Format
```js
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    // ... business logic ...
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
```

### Authentication Check
```js
// For authenticated endpoints (not webhooks)
const authHeader = event.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) {
  return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
}
const token = authHeader.split(' ')[1];
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
}
```

## Stripe Connect Specifics

### Destination Charges (primary model)
```js
// Platform (SUNTREX) creates the charge, Stripe splits automatically
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalInCents,
  currency: 'eur',
  payment_method_types: ['card'],
  application_fee_amount: commissionInCents,
  transfer_data: {
    destination: sellerConnectedAccountId, // acct_xxx
  },
  metadata: {
    order_id: orderId,
    buyer_id: buyerId,
    seller_id: sellerId,
    platform: 'suntrex',
  },
});
```

### Seller Onboarding
```js
// Create Account Link for seller KYC
const accountLink = await stripe.accountLinks.create({
  account: sellerStripeAccountId,
  refresh_url: `${FRONTEND_URL}/seller/onboarding?refresh=true`,
  return_url: `${FRONTEND_URL}/seller/onboarding?success=true`,
  type: 'account_onboarding',
});
```

### Webhook Events to Handle
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Update order status, log transaction |
| `payment_intent.payment_failed` | Notify buyer, log failure |
| `charge.dispute.created` | Alert admin, freeze seller funds |
| `charge.dispute.closed` | Update dispute resolution |
| `transfer.created` | Log seller payout |
| `account.updated` | Check charges_enabled/payouts_enabled, update seller status |
| `payout.paid` | Log seller received funds |
| `payout.failed` | Alert seller + admin |

### Multi-Currency
```js
// EUR is default, but support others
const SUPPORTED_CURRENCIES = ['eur', 'gbp', 'chf', 'pln'];
const currency = SUPPORTED_CURRENCIES.includes(requestedCurrency) 
  ? requestedCurrency 
  : 'eur';
```

## AI Chat Function

### System Prompt Structure
The AI function uses a specialized system prompt for SUNTREX context:
- Knows product catalog (Huawei, Deye, Enphase, SMA, etc.)
- Knows processes (KYC, Stripe, SUNTREX DELIVERY)
- Knows commission model (-5% vs competitors)
- Knows target markets (FR/DE/Benelux/IT/ES)
- Professional, concise, solution-oriented tone
- Detects when handoff to human is needed

### Context Window
```js
// Load last 20 messages for conversation context
const { data: messages } = await supabase
  .from('SupportMessage')
  .select('content, sender_type, created_at')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: false })
  .limit(20);
```

## Transaction Logging

Every financial operation MUST be logged in the database:
```js
// After successful payment
await supabase.from('Order').update({
  payment_intent_id: paymentIntent.id,
  charge_id: paymentIntent.latest_charge,
  status: 'paid',
  paid_at: new Date().toISOString(),
  amount: paymentIntent.amount,
  fee: paymentIntent.application_fee_amount,
  currency: paymentIntent.currency,
}).eq('id', orderId);
```

## netlify.toml Config
```toml
[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Testing Checklist
- [ ] All env vars set in Netlify dashboard (not in code)
- [ ] Webhook signature verification works (test with Stripe CLI)
- [ ] Idempotency keys prevent duplicate operations
- [ ] CORS configured for production domain
- [ ] Error responses don't leak internal details
- [ ] All Stripe amounts in cents (€12.50 = 1250)
- [ ] Multi-currency handled correctly
- [ ] Transaction logged in DB after every payment event
- [ ] Rate limiting considered for public endpoints
