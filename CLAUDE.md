# CLAUDE.md — SUNTREX Project Configuration

> **This file is automatically read by Claude Code at the start of every session.**
> **All rules below are NON-NEGOTIABLE and permanent. Never ask for confirmation on these.**

---

## PROJECT IDENTITY

**SUNTREX** — B2B European marketplace for photovoltaic equipment and energy storage systems.
Target: solar installers, distributors, and professionals across Europe.
Competitors/benchmarks: [sun.store](https://sun.store/fr) (primary UI/UX reference), [SolarTraders](https://www.solartraders.com/fr/) (catalog reference).

---

## GOLDEN RULES (apply to ALL code, ALL sessions)

### 1. 100% RESPONSIVE — No exceptions
- Every component, page, and UI element MUST be responsive: **375px → 768px → 1024px → 1440px**
- Mobile-first approach preferred. Desktop-first acceptable if responsive breakpoints are included.
- **NEVER** use fixed widths/heights/padding without mobile fallback.
- Test mental model: if it breaks on iPhone SE (375px), it's not done.
- Use the `useResponsive()` hook pattern:
  ```js
  const useResponsive = () => {
    const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
    useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
    return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024, w };
  };
  ```
- Breakpoints: `mobile < 768px`, `tablet 768-1023px`, `desktop ≥ 1024px`
- Grid columns: `mobile: 1-2 cols`, `tablet: 2-3 cols`, `desktop: 3-5 cols`
- Padding: `mobile: 16px`, `tablet: 24px`, `desktop: 40px`
- Font scaling: reduce headings by ~40% on mobile, body text by ~15%
- Touch targets: minimum 44x44px on mobile
- No horizontal scroll. Ever.

### 2. SECURITY-FIRST — Non-negotiable
- **Stripe keys** (`sk_live_*`, `sk_test_*`, `whsec_*`): ONLY in environment variables. Never in code, never in Git.
- **Supabase service_role key**: server-side only (Netlify Functions). Never exposed to client.
- **Client-side**: only use Supabase anon key (`VITE_SUPABASE_ANON_KEY`).
- **RLS enabled** on ALL Supabase public tables. No exceptions.
- **Webhook signature verification**: always use `stripe.webhooks.constructEvent()` with `whsec_*`.
- **Idempotency keys** on all Stripe write operations (PaymentIntents, Transfers).
- **SCA/3D Secure**: mandatory for all European payments (Stripe handles via PaymentIntents).
- **Never trust client-side data** for amounts, prices, or user roles. Always verify server-side.
- **API version pinned** in Stripe config.
- **CORS**: restrict to known domains in production.

### 3. CODE LANGUAGE & CONVENTIONS
- **Code, comments, variable names, commit messages**: English
- **Conversations with the developer (Yohan)**: French
- **Platform content**: Multilingual (FR, EN, DE, ES, IT, NL)

### 4. NO BREAKING CHANGES
- When modifying existing files, preserve all existing functionality.
- If refactoring, ensure backward compatibility or flag breaking changes explicitly.
- Always check current file state before editing.

---

## TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vite + React | Inline styles (no Tailwind currently) |
| Styling | Inline styles + CSS objects | Use style objects, not className |
| State | React hooks (useState, useEffect) | No Redux/Zustand yet |
| Backend/DB | Supabase (PostgreSQL + Realtime + Storage + Auth) | Project: `uigoadkslyztxgzahmwv` |
| Serverless | Netlify Functions | For Stripe, AI, server-side ops |
| Payments | Stripe Connect (Destination Charges) | Multi-vendor with `application_fee` |
| AI | Anthropic Claude API | Support chat, moderation, advisor |
| Hosting | Vercel (frontend) + Netlify (functions) | |
| Search | Planned: Algolia or Meilisearch | |
| Email | Planned: Resend or SendGrid | |
| Monitoring | Planned: Sentry + Vercel Analytics | |

---

## PROJECT STRUCTURE

```
suntrex/                          # ~/Downloads/suntrex
├── public/
│   ├── products/                 # Product images (JPG/PNG/WebP)
│   ├── categories/               # Category images
│   ├── logos/                    # Brand logos (SVG preferred)
│   └── hero-video.mp4           # Hero background video
├── src/
│   ├── App.jsx                  # Main app (437 lines, landing page)
│   ├── components/
│   │   ├── chat/                # Support chat system
│   │   │   ├── SuntrexSupportChat.jsx
│   │   │   ├── supportChatService.js
│   │   │   └── useSupportChat.js
│   │   ├── ui/                  # Shared UI components
│   │   ├── catalog/             # Product catalog components
│   │   ├── delivery/            # SUNTREX DELIVERY components
│   │   ├── ai/                  # AI tools components
│   │   └── payment/             # Stripe/payment components
│   ├── lib/
│   │   ├── supabase.js          # Supabase client (anon key)
│   │   ├── stripe.js            # Stripe client helpers
│   │   └── ai.js                # AI service helpers
│   └── i18n/                    # Translations (FR, EN, DE, ES, IT, NL)
├── netlify/
│   └── functions/               # Serverless functions
│       ├── support-chat-ai.js   # AI chat endpoint
│       ├── stripe-webhook.js    # Stripe webhook handler
│       └── stripe-connect.js    # Connect onboarding
├── CLAUDE.md                    # ← THIS FILE
├── netlify.toml                 # Netlify config
├── package.json
└── vite.config.js
```

---

## STYLING CONVENTIONS

The project uses **inline styles with JavaScript objects**. Not Tailwind, not CSS modules.

```jsx
// ✅ CORRECT — Inline style objects
<div style={{ padding: isMobile ? "16px" : "40px", display: "flex", gap: 16 }}>

// ✅ CORRECT — Extracted style constants
const cardStyle = { borderRadius: 12, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };

// ❌ WRONG — No className, no Tailwind
<div className="p-4 flex gap-4">
```

### Brand Colors
```js
const BRAND = {
  orange: "#f97316",      // Primary CTA, accents
  dark: "#1e293b",        // Text, headers
  gray: "#64748b",        // Secondary text
  light: "#f8fafc",       // Backgrounds
  border: "#e2e8f0",      // Borders
  green: "#10b981",       // Success, online status
  red: "#ef4444",         // Errors, alerts
  blue: "#3b82f6",        // Links, info
  white: "#ffffff",       // Cards, modals
};
```

### Typography
- Headings: `fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif"`
- Body: same family, weights 400/500/600/700
- Hero: 38px desktop → 22px mobile
- Section titles: 28px desktop → 20px mobile
- Body: 15px desktop → 14px mobile
- Small/captions: 12-13px

---

## ENVIRONMENT VARIABLES

### Client-side (Vite — `VITE_` prefix required)
```env
VITE_SUPABASE_URL=https://uigoadkslyztxgzahmwv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPPORT_AI_ENDPOINT=/api/support-chat-ai
```

### Server-side (Netlify Functions — no prefix)
```env
SUPABASE_URL=https://uigoadkslyztxgzahmwv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # ⚠️ NEVER client-side
STRIPE_SECRET_KEY=sk_test_...            # ⚠️ NEVER client-side
STRIPE_WEBHOOK_SECRET=whsec_...          # ⚠️ NEVER client-side
ANTHROPIC_API_KEY=sk-ant-...             # ⚠️ NEVER client-side
```

---

## SUPABASE SCHEMA (existing tables)

| Table | Key Fields | RLS |
|-------|-----------|-----|
| User | id, email, role, company_id | ✅ Own profile only |
| Company | id, name, vat_number, country | ✅ All read, owner update |
| Listing | id, product_name, price, seller_company_id | ✅ All read, own company CRUD |
| Warehouse | id, company_id, location | ✅ Own company only |
| Order | id, buyer_id, seller_id, status, payment_intent_id | ✅ Buyer/seller see own |
| OrderItem | id, order_id, listing_id, quantity | ✅ Via order access |
| RFQ | id, buyer_id, status | ✅ Buyer own, sellers browse open |
| Quote | id, rfq_id, seller_id | ✅ Seller own, buyer sees on own RFQ |
| Review | id, reviewer_id, rating | ✅ All read, reviewer CRUD own |
| Notification | id, user_id, message | ✅ Own notifications only |
| SupportConversation | id, user_id, status, ai_mode | ✅ User own, agents all |
| SupportMessage | id, conversation_id, sender_type | ✅ Via conversation access |
| SupportAgent | id, user_id, status, languages | ✅ All authenticated read |
| SupportCannedResponse | id, category, shortcut | ✅ Agents read |

**Critical**: RLS is enabled on ALL tables. Service role key (server-side) bypasses RLS.

---

## STRIPE CONNECT ARCHITECTURE

```
Buyer pays → SUNTREX platform receives
  → application_fee (commission) kept by SUNTREX
  → remainder transferred to Seller (connected account)
```

### Payment Flow
1. Create `PaymentIntent` with `application_fee_amount` + `transfer_data.destination`
2. 3D Secure/SCA handled automatically by Stripe (mandatory EU)
3. On success: funds in escrow (if SUNTREX DELIVERY) or immediate transfer
4. Webhooks: `payment_intent.succeeded`, `charge.dispute.created`, `transfer.created`, `account.updated`

### Seller Onboarding
- Stripe Connect Onboarding via Account Links
- Check `charges_enabled && payouts_enabled` before allowing listings
- Monitor `account.updated` webhook for KYC status changes

### Commission
- SUNTREX commission = 5% below market competitors (sun.store, SolarTraders)

---

## BUSINESS RULES

### Price Gating
- Visitors (not logged in): prices are **hidden** with blur + CTA "Sign up to see prices"
- Logged in + verified: prices visible
- Component: `<PriceGate />` checks `user.isVerified`

### Product Categories
1. Solar Panels (Panneaux solaires)
2. Inverters (Onduleurs)
3. Batteries / Energy Storage (Stockage d'énergie)
4. Mounting Systems (Systèmes de montage)
5. Electrical / Cables (Électrotechnique)
6. E-Mobility (E-mobilité)

### Key Brands (launch)
- **Priority**: Huawei (inverters, batteries, optimizers), Deye (hybrid inverters)
- **Catalog**: Enphase, SMA, Canadian Solar, Jinko, Trina, BYD, LONGi, SolarEdge, JA Solar, Risen, Sungrow, Growatt, GoodWe

### Target Markets
- Priority: 🇫🇷 France, 🇩🇪 Germany, 🇧🇪🇳🇱🇱🇺 Benelux, 🇮🇹 Italy, 🇪🇸 Spain
- Currencies: EUR (primary), GBP, CHF, PLN

### RGPD / Legal (EU compliance)
Registration must include consent checkboxes:
1. ✅ **Mandatory**: Accept CGV + Privacy Policy
2. ☐ **Optional**: Marketing communications from SUNTREX
3. ☐ **Optional**: Marketing from SUNTREX partners

---

## DIFFERENTIATORS vs COMPETITORS

| Feature | sun.store | SolarTraders | SUNTREX |
|---------|----------|-------------|---------|
| Price gating / onboarding | ✅ | ✅ | ✅ |
| Buyer-seller chat | ✅ | ❌ | ✅ + AI moderation |
| Own delivery service | Partial | ❌ | ✅ SUNTREX DELIVERY |
| Package verification (photos/QR) | ❌ | ❌ | ✅ |
| AI tools (advisor, pricing) | ❌ | ❌ | ✅ |
| WhatsApp + Phone support | Email only | Email | ✅ Multi-channel |
| Commission rate | Market rate | Market rate | **-5% vs competitors** |
| Escrow + delivery verification | Basic | ❌ | ✅ Advanced |
| AI technical translation | Basic | ❌ | ✅ PV-contextualized |

---

## SUNTREX DELIVERY

Package verification workflow:
1. **Seller ships**: photos of package + content, QR code generated
2. **SUNTREX pickup**: QR scan, visual inspection, photo + GPS timestamp
3. **Transit**: real-time tracking for buyer AND seller
4. **Delivery**: delivery photo, e-signature, buyer verification (OK / Damaged / Missing)
5. **Settlement**: OK → funds released to seller. Problem → auto-dispute with photo evidence.

---

## SUPPORT CHAT SYSTEM

- **AI-first**: Claude-powered chatbot responds 24/7
- **Handoff**: automatic or manual escalation to human agent
- **Multi-channel**: Chat (in-app), WhatsApp, Email, Phone
- **Moderation**: AI filters inappropriate content, fraud attempts, off-platform payment requests
- **SLA target**: < 30min chat/WhatsApp, < 2h email

---

## DEVELOPMENT PHASES

### Phase 1 — MVP (current) 🔄
- Homepage + product catalog with filters
- Registration/login with simplified KYC
- Price gating for unregistered visitors
- Product pages with multi-vendor price comparison
- Basic buyer-seller chat (with AI + moderation)
- Stripe Connect payments (destination charges)
- Basic buyer/seller dashboards
- Multilingual FR/EN
- Deploy on Vercel + Netlify

### Phase 2 — Trust & Delivery
- SUNTREX DELIVERY (tracking, QR, photos, verification)
- Enhanced escrow (funds held until delivery confirmation)
- Seller badges + rating system
- Multi-channel support (chat + WhatsApp)
- Bulk offer import (XLSX)
- Admin dashboard (reconciliation, disputes, commissions)
- Add DE/ES languages

### Phase 3 — AI & Scale
- SUNTREX AI Advisor (recommendation, comparator, sizing)
- AI chat moderation
- Intelligent pricing for sellers
- Semantic search
- Enhanced AI translation
- Add IT/NL languages
- Performance + SEO optimization

### Phase 4 — Expansion
- Own delivery fleet on main corridors
- Mobile app (React Native)
- Loyalty program / volume discounts
- Public API for ERP integration
- Services marketplace (installation, maintenance)

---

## CHECKLIST BEFORE MARKING ANY TASK COMPLETE

- [ ] Works on iPhone SE (375px) — no overflow, no broken layout
- [ ] Works on iPad (768px) — proper tablet layout
- [ ] Works on Desktop (1440px) — full layout as designed
- [ ] No Stripe keys or secrets in client code
- [ ] RLS policies cover the new tables/columns
- [ ] Error states handled (loading, error, empty)
- [ ] French AND English text (or i18n keys) for user-facing strings
- [ ] Graceful degradation if backend/API unavailable
- [ ] No `console.log` left in production code (use proper error handling)
- [ ] Accessibility basics: alt text, focus states, semantic HTML where possible
