# CLAUDE.md — SUNTREX Dashboard Module

> Rules specific to `src/components/dashboard/`. Inherits all global rules from root `CLAUDE.md`.

## Architecture

```
src/components/dashboard/
├── CLAUDE.md                    # ← THIS FILE
├── tokens.js                    # Design tokens (colors, spacing, fonts)
├── DashboardLayout.jsx          # Main layout (sidebar + topbar + content area)
├── DashboardSidebar.jsx         # Context-aware sidebar (changes with BUY/SELL/PROFILE)
├── DashboardTopbar.jsx          # Top navigation with BUY|SELL|MY PROFILE|NOTIFICATIONS tabs
├── DashboardRouter.jsx          # Internal section routing
│
├── buy/                         # Buyer space
│   ├── MyPurchases.jsx          # Buyer transactions list
│   ├── DeliveryAddresses.jsx    # Shipping address management
│   ├── BuyerRFQ.jsx            # Request for Proposals
│   └── BuyerOverview.jsx        # Buyer dashboard stats
│
├── sell/                        # Seller space
│   ├── ManageOffers.jsx         # Offer/listing management
│   ├── MySales.jsx             # Seller transactions list (with filters/tabs)
│   ├── SellerOverview.jsx       # Seller dashboard stats + revenue charts
│   └── WarehouseManager.jsx     # Warehouse management
│
├── transaction/                 # Transaction system (shared buyer/seller)
│   ├── TransactionPage.jsx      # Full transaction page (orchestrator)
│   ├── TransactionChat.jsx      # Negotiation chat with auto-translation
│   ├── TransactionTimeline.jsx  # Status pipeline visualization
│   ├── TransactionProducts.jsx  # Editable product card(s)
│   └── TransactionDetails.jsx   # Seller/buyer details panel
│
├── profile/                     # User profile
│   ├── AccountDetails.jsx
│   ├── CompanyDetails.jsx
│   ├── InvoicesAndFees.jsx
│   ├── ReviewsPage.jsx
│   └── OutOfOffice.jsx
│
├── notifications/               # Notification center
│   ├── NotificationsCenter.jsx
│   ├── NotificationEmails.jsx
│   └── NotificationSettings.jsx
│
└── shared/                      # Shared components
    ├── StatCard.jsx             # Reusable stat card
    ├── StatusBadge.jsx          # Transaction status badge
    ├── PriceEditor.jsx          # Inline price editor
    ├── TranslationBanner.jsx    # Auto-translation banner
    ├── EmptyState.jsx           # Empty state placeholder
    └── useResponsive.js         # Responsive hook
```

## ABSOLUTE RULES FOR THIS MODULE

### 1. Context-Aware Navigation
The dashboard has ONE layout but FOUR contexts. The active tab in the topbar determines:
- Which sidebar items are visible
- Which content area is rendered
- The user's current "role" perspective (even if they are both buyer AND seller)

```
Tab active = BUY      → Sidebar shows buy menu → Content = buyer views
Tab active = SELL     → Sidebar shows sell menu → Content = seller views  
Tab active = PROFILE  → Sidebar shows profile menu → Content = profile views
Tab active = NOTIFS   → Sidebar shows notif menu → Content = notification views
```

### 2. Transaction = Central Object
A Transaction is the core business object. It connects:
- Buyer ↔ Seller
- Product(s) ↔ Price negotiation
- Chat messages ↔ Moderation
- Payment ↔ Delivery ↔ Escrow

The same `TransactionPage` component renders for BOTH buyer and seller, but with:
- **Different actions** (seller can edit price; buyer can pay)
- **Different labels** ("Détails du vendeur" vs "Détails de l'acheteur")
- **Same chat** (both sides see same messages)

```jsx
// TransactionPage receives the user's role in this transaction
<TransactionPage 
  transaction={tx} 
  role={user.id === tx.buyer_id ? 'buyer' : 'seller'} 
/>
```

### 3. Price Editing = Server-Validated
When a seller edits a price in the TransactionPage:
1. UI shows inline editor immediately (optimistic)
2. Call Netlify Function `transaction.js` with new price
3. Function validates: is user the seller? is transaction in negotiation?
4. Function updates DB → triggers Supabase realtime
5. UI confirms or rolls back

**NEVER** update price directly from client to Supabase. Always via Netlify Function.

### 4. Chat Messages = Realtime + Moderation
- New messages are inserted via Supabase client (RLS allows participants)
- Realtime subscription delivers messages to both parties instantly
- AI moderation runs server-side (Netlify Function) on message insert
- Flagged messages are hidden with "Ce message a été modéré"
- Translation is handled client-side (or via a translation API call)

### 5. Responsive Behavior

| Component | Mobile (<768) | Tablet (768-1023) | Desktop (≥1024) |
|-----------|--------------|-------------------|-----------------|
| Sidebar | Bottom tab bar (4 icons) | Collapsed (icons only) | Full sidebar (250px) |
| Topbar | Simplified (logo + burger) | Full tabs | Full tabs |
| Transaction card | Stack vertical | 2-col grid | Full row layout |
| Transaction page | Single column, sections stacked | 2 columns for details | Full layout as designed |
| Chat | Full width | Full width | Within transaction layout |
| Product card | Stack vertical | Horizontal, compact | Full 5-column grid |

### 6. State Management Pattern
```jsx
// Each dashboard section manages its own state
// DashboardLayout provides context via React Context:

const DashboardContext = React.createContext({
  user: null,          // Supabase auth user
  company: null,       // User's company details
  activeTab: 'buy',    // BUY | SELL | PROFILE | NOTIFICATIONS
  activeSection: null,  // Current sidebar item
  setActiveTab: () => {},
  setActiveSection: () => {},
  stripeStatus: null,  // { charges_enabled, payouts_enabled }
});
```

## Supabase Tables Used

| Table | Operations | Realtime |
|-------|-----------|----------|
| Transaction | CRUD | ✅ Status changes |
| TransactionItem | CRUD | ❌ |
| TransactionMessage | Read, Insert | ✅ New messages |
| Listing | Read | ❌ |
| Company | Read | ❌ |
| User | Read | ❌ |
| Notification | Read, Update (mark read) | ✅ New notifications |

## Error States to Handle

Every component must handle these states:
1. **Loading**: skeleton/spinner while fetching
2. **Empty**: no transactions/messages/etc → show EmptyState with CTA
3. **Error**: Supabase/network error → show error message with retry button
4. **Offline**: no Supabase config → use mock data for demo mode
5. **Unauthorized**: user not logged in → redirect to login
6. **Forbidden**: user tries to access someone else's transaction → show 403

## Testing Checklist

- [ ] BUY tab shows buyer sidebar and buyer content
- [ ] SELL tab shows seller sidebar and seller content  
- [ ] Transaction list filters work (All/Negotiations/Cancelled/etc.)
- [ ] Transaction search works
- [ ] Click on transaction → opens TransactionPage
- [ ] Breadcrumb navigation works (back to list)
- [ ] Price editing: click Editer → input → validate → price updates
- [ ] Delivery cost editing works
- [ ] Chat: send message → appears in chat
- [ ] Chat: realtime message from other party appears
- [ ] Translation toggle works
- [ ] Timeline shows correct status
- [ ] Cancel transaction → shows reason modal
- [ ] Mobile: sidebar becomes bottom tab bar
- [ ] Mobile: transaction page stacks properly
- [ ] All text in FR + EN
- [ ] No console errors
- [ ] No Stripe keys in client code
