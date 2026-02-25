# CLAUDE.md — SUNTREX Payment & Stripe Components

> Rules specific to `src/components/payment/`. Inherits all global rules from root `CLAUDE.md`.

## Architecture

```
src/components/payment/
├── StripeCheckout.jsx          # Checkout flow (PaymentElement)
├── EscrowStatus.jsx            # Escrow tracking for buyer/seller
├── SellerOnboarding.jsx        # Stripe Connect onboarding for sellers
├── PaymentHistory.jsx          # Transaction list (buyer or seller view)
├── DisputeManager.jsx          # Dispute handling UI
├── CommissionDashboard.jsx     # Admin: commission tracking
└── CLAUDE.md                   # ← THIS FILE
```

## ABSOLUTE RULES

### Client-Side = Publishable Key ONLY
```js
// ✅ The ONLY Stripe key allowed in frontend code
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// pk_test_... or pk_live_...
```

### All Payment Logic = Server-Side
```
CLIENT                          SERVER (Netlify Function)
  │                                │
  ├─ "Buy this listing" ──────────►│
  │                                ├─ Validate listing price in DB
  │                                ├─ Create PaymentIntent (sk_test_*)
  │                                ├─ Set application_fee_amount
  │  ◄── client_secret ───────────┤
  │                                │
  ├─ stripe.confirmPayment() ─────►│ (Stripe handles 3DS/SCA)
  │                                │
  │                                ├─ Webhook: payment_intent.succeeded
  │                                ├─ Update Order status in DB
  │                                ├─ Notify buyer + seller
  │  ◄── Order confirmed ─────────┤
```

### Price Integrity
- **NEVER** send price from client to server
- **ALWAYS** look up price from DB on server
- **ALWAYS** re-validate amounts before creating PaymentIntent
- Amount in Stripe = cents (€125.00 → 12500)

## Stripe Elements Integration

### Payment Form
```jsx
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm({ clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElement />
      {/* Submit button */}
    </Elements>
  );
}
```

### 3D Secure / SCA
- Stripe handles automatically via `confirmPayment()`
- Always use `return_url` for redirect-based authentication
- Show loading state during 3DS verification

## Escrow Flow (SUNTREX DELIVERY)

```
Payment succeeded
  → Funds held by Stripe (not transferred yet)
  → Order status: "paid"
  
Seller ships + SUNTREX DELIVERY picks up
  → Order status: "shipped"
  → Buyer sees tracking
  
Buyer confirms delivery OK
  → Order status: "delivered"
  → Trigger transfer to seller
  → Or auto-release after 7 days if no dispute

Buyer reports problem
  → Order status: "disputed"
  → Admin reviews photo evidence
  → Resolution: refund buyer OR release to seller
```

## Seller Onboarding UI

### States to Handle
| `charges_enabled` | `payouts_enabled` | UI State |
|---|---|---|
| false | false | "Complete your verification" — show onboarding button |
| true | false | "Verification in progress" — can list, can't receive payouts |
| true | true | ✅ "Ready to sell" — full access |
| restricted | any | ⚠️ "Action required" — show what's missing |

### Onboarding Button
```jsx
const startOnboarding = async () => {
  const res = await fetch('/api/stripe-connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'create_account_link' }),
  });
  const { url } = await res.json();
  window.location.href = url; // Redirect to Stripe
};
```

## Commission Display

### For Buyers
- Show total price including SUNTREX fee
- "You save X% compared to [competitor]" badge

### For Sellers  
- Show net amount after commission
- "SUNTREX commission: X%" transparent display
- Commission = 5% below market (sun.store, SolarTraders)

### For Admin
- Total GMV (Gross Merchandise Value)
- Total commissions earned
- Pending transfers
- Active disputes
- Refund rate

## Multi-Currency Handling

```jsx
// Format price based on currency
const formatPrice = (amount, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Display with price gating
function PriceDisplay({ price, currency, isVerified }) {
  if (!isVerified) {
    return (
      <div style={{ filter: 'blur(8px)', userSelect: 'none' }}>
        {formatPrice(price, currency)}
      </div>
    );
  }
  return <div style={{ fontWeight: 700 }}>{formatPrice(price, currency)}</div>;
}
```

## Error Handling

### Payment Failures
| Error Code | User Message |
|-----------|-------------|
| `card_declined` | "Votre carte a été refusée. Veuillez réessayer avec un autre moyen de paiement." |
| `insufficient_funds` | "Fonds insuffisants. Veuillez utiliser une autre carte." |
| `expired_card` | "Votre carte a expiré. Veuillez la mettre à jour." |
| `authentication_required` | "Authentification requise. Veuillez confirmer le paiement." |
| `processing_error` | "Erreur temporaire. Veuillez réessayer dans quelques instants." |

### Never Show to Users
- Raw Stripe error messages
- Payment Intent IDs
- Internal error codes
- Stack traces

## Responsive Requirements

- Checkout form: full-width on mobile, max 480px on desktop
- PaymentElement: adapts automatically (Stripe handles this)
- Order history: card layout on mobile, table on desktop
- Escrow timeline: vertical on mobile, horizontal on desktop

## Testing Checklist
- [ ] Test cards: 4242 4242 4242 4242 (success), 4000 0025 0000 3155 (requires 3DS)
- [ ] Commission calculated correctly
- [ ] Escrow holds funds when SUNTREX DELIVERY selected
- [ ] Seller onboarding flow completes and returns correctly
- [ ] Dispute creation triggers admin notification
- [ ] Multi-currency formatting correct (€, £, CHF, PLN)
- [ ] Price gating works (blur for unverified users)
- [ ] Mobile checkout doesn't overflow
- [ ] Error messages are user-friendly and translated
