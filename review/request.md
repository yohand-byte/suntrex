# Claude Review Request (SUNTREX Marketplace)

Date: 2026-02-26 07:08:02
Base ref: origin/main
Head: 6dfda0d
Branch: codex/kyc-gate-server

## Mission
Review this diff as principal reviewer for a B2B marketplace.
Focus strictly on:
1. Security and auth/access controls.
2. Marketplace business logic (KYC/KYB, transaction status machine, payment flow).
3. Stripe/webhook/idempotency correctness.
4. Supabase RLS and data isolation.
5. Missing tests and regression risk.

## Required output format
- Finding title
- Severity: P0 / P1 / P2
- Business impact
- File + line(s)
- Concrete fix

## Diff stat
```
 dashboard-CLAUDE.md                                | 176 +++++
 public/logos/canadian-solar.svg                    |   5 +-
 public/logos/ja-solar.svg                          |   6 +-
 public/logos/longi.svg                             |   5 +-
 public/logos/risen.svg                             |   6 +-
 public/logos/sma.svg                               |   5 +-
 review/request.md                                  |  32 +
 setup-dashboard.sh                                 |  61 ++
 src/App.jsx                                        |  29 +-
 src/components/dashboard/BuyerDashboard.jsx        | 369 ++++++++++
 src/components/dashboard/CLAUDE.md                 | 176 +++++
 src/components/dashboard/DashboardLayout.jsx       | 232 ++++++
 src/components/dashboard/DashboardRouter.jsx       | 118 +++
 src/components/dashboard/DashboardSidebar.jsx      | 284 ++++++++
 src/components/dashboard/DashboardTopbar.jsx       | 283 ++++++++
 src/components/dashboard/SellerDashboard.jsx       | 593 +++++++++++++++
 src/components/dashboard/buy/BuyerOverview.jsx     |  63 ++
 src/components/dashboard/buy/BuyerRFQ.jsx          | 117 +++
 src/components/dashboard/buy/DeliveryAddresses.jsx |  92 +++
 src/components/dashboard/buy/MyPurchases.jsx       | 203 ++++++
 src/components/dashboard/dashboardUtils.js         | 138 ++++
 .../dashboard/notifications/NotificationEmails.jsx |  69 ++
 .../notifications/NotificationSettings.jsx         |  66 ++
 .../notifications/NotificationsCenter.jsx          | 103 +++
 .../dashboard/profile/AccountDetails.jsx           |  45 ++
 .../dashboard/profile/CompanyDetails.jsx           |  42 ++
 .../dashboard/profile/InvoicesAndFees.jsx          |  66 ++
 src/components/dashboard/profile/OutOfOffice.jsx   |  77 ++
 src/components/dashboard/profile/ReviewsPage.jsx   |  59 ++
 src/components/dashboard/sell/ManageOffers.jsx     | 134 ++++
 src/components/dashboard/sell/MySales.jsx          | 315 ++++++++
 src/components/dashboard/sell/SellerOverview.jsx   |  92 +++
 src/components/dashboard/sell/WarehouseManager.jsx |  58 ++
 src/components/dashboard/shared/EmptyState.jsx     |  74 ++
 src/components/dashboard/shared/PriceEditor.jsx    | 157 ++++
 src/components/dashboard/shared/StatCard.jsx       |  97 +++
 src/components/dashboard/shared/StatusBadge.jsx    |  36 +
 src/components/dashboard/shared/useResponsive.js   |  22 +
 src/components/dashboard/tokens.js                 |  60 ++
 .../dashboard/transaction/TransactionChat.jsx      | 404 +++++++++++
 .../dashboard/transaction/TransactionDetails.jsx   | 186 +++++
 .../dashboard/transaction/TransactionPage.jsx      | 425 +++++++++++
 .../dashboard/transaction/TransactionProducts.jsx  | 240 +++++++
 .../dashboard/transaction/TransactionTimeline.jsx  | 136 ++++
 src/components/ui/BrandLogo.jsx                    |  57 +-
 src/data/catalog.js                                | 792 +++++++++++++++++++++
 src/pages/HomePage.jsx                             |  42 +-
 suntrex-dashboard-prompt.md                        | 650 +++++++++++++++++
 48 files changed, 7444 insertions(+), 53 deletions(-)
```

## Diff patch
```diff
diff --git a/dashboard-CLAUDE.md b/dashboard-CLAUDE.md
new file mode 100644
index 0000000..435b23f
--- /dev/null
+++ b/dashboard-CLAUDE.md
@@ -0,0 +1,176 @@
+# CLAUDE.md — SUNTREX Dashboard Module
+
+> Rules specific to `src/components/dashboard/`. Inherits all global rules from root `CLAUDE.md`.
+
+## Architecture
+
+```
+src/components/dashboard/
+├── CLAUDE.md                    # ← THIS FILE
+├── tokens.js                    # Design tokens (colors, spacing, fonts)
+├── DashboardLayout.jsx          # Main layout (sidebar + topbar + content area)
+├── DashboardSidebar.jsx         # Context-aware sidebar (changes with BUY/SELL/PROFILE)
+├── DashboardTopbar.jsx          # Top navigation with BUY|SELL|MY PROFILE|NOTIFICATIONS tabs
+├── DashboardRouter.jsx          # Internal section routing
+│
+├── buy/                         # Buyer space
+│   ├── MyPurchases.jsx          # Buyer transactions list
+│   ├── DeliveryAddresses.jsx    # Shipping address management
+│   ├── BuyerRFQ.jsx            # Request for Proposals
+│   └── BuyerOverview.jsx        # Buyer dashboard stats
+│
+├── sell/                        # Seller space
+│   ├── ManageOffers.jsx         # Offer/listing management
+│   ├── MySales.jsx             # Seller transactions list (with filters/tabs)
+│   ├── SellerOverview.jsx       # Seller dashboard stats + revenue charts
+│   └── WarehouseManager.jsx     # Warehouse management
+│
+├── transaction/                 # Transaction system (shared buyer/seller)
+│   ├── TransactionPage.jsx      # Full transaction page (orchestrator)
+│   ├── TransactionChat.jsx      # Negotiation chat with auto-translation
+│   ├── TransactionTimeline.jsx  # Status pipeline visualization
+│   ├── TransactionProducts.jsx  # Editable product card(s)
+│   └── TransactionDetails.jsx   # Seller/buyer details panel
+│
+├── profile/                     # User profile
+│   ├── AccountDetails.jsx
+│   ├── CompanyDetails.jsx
+│   ├── InvoicesAndFees.jsx
+│   ├── ReviewsPage.jsx
+│   └── OutOfOffice.jsx
+│
+├── notifications/               # Notification center
+│   ├── NotificationsCenter.jsx
+│   ├── NotificationEmails.jsx
+│   └── NotificationSettings.jsx
+│
+└── shared/                      # Shared components
+    ├── StatCard.jsx             # Reusable stat card
+    ├── StatusBadge.jsx          # Transaction status badge
+    ├── PriceEditor.jsx          # Inline price editor
+    ├── TranslationBanner.jsx    # Auto-translation banner
+    ├── EmptyState.jsx           # Empty state placeholder
+    └── useResponsive.js         # Responsive hook
+```
+
+## ABSOLUTE RULES FOR THIS MODULE
+
+### 1. Context-Aware Navigation
+The dashboard has ONE layout but FOUR contexts. The active tab in the topbar determines:
+- Which sidebar items are visible
+- Which content area is rendered
+- The user's current "role" perspective (even if they are both buyer AND seller)
+
+```
+Tab active = BUY      → Sidebar shows buy menu → Content = buyer views
+Tab active = SELL     → Sidebar shows sell menu → Content = seller views  
+Tab active = PROFILE  → Sidebar shows profile menu → Content = profile views
+Tab active = NOTIFS   → Sidebar shows notif menu → Content = notification views
+```
+
+### 2. Transaction = Central Object
+A Transaction is the core business object. It connects:
+- Buyer ↔ Seller
+- Product(s) ↔ Price negotiation
+- Chat messages ↔ Moderation
+- Payment ↔ Delivery ↔ Escrow
+
+The same `TransactionPage` component renders for BOTH buyer and seller, but with:
+- **Different actions** (seller can edit price; buyer can pay)
+- **Different labels** ("Détails du vendeur" vs "Détails de l'acheteur")
+- **Same chat** (both sides see same messages)
+
+```jsx
+// TransactionPage receives the user's role in this transaction
+<TransactionPage 
+  transaction={tx} 
+  role={user.id === tx.buyer_id ? 'buyer' : 'seller'} 
+/>
+```
+
+### 3. Price Editing = Server-Validated
+When a seller edits a price in the TransactionPage:
+1. UI shows inline editor immediately (optimistic)
+2. Call Netlify Function `transaction.js` with new price
+3. Function validates: is user the seller? is transaction in negotiation?
+4. Function updates DB → triggers Supabase realtime
+5. UI confirms or rolls back
+
+**NEVER** update price directly from client to Supabase. Always via Netlify Function.
+
+### 4. Chat Messages = Realtime + Moderation
+- New messages are inserted via Supabase client (RLS allows participants)
+- Realtime subscription delivers messages to both parties instantly
+- AI moderation runs server-side (Netlify Function) on message insert
+- Flagged messages are hidden with "Ce message a été modéré"
+- Translation is handled client-side (or via a translation API call)
+
+### 5. Responsive Behavior
+
+| Component | Mobile (<768) | Tablet (768-1023) | Desktop (≥1024) |
+|-----------|--------------|-------------------|-----------------|
+| Sidebar | Bottom tab bar (4 icons) | Collapsed (icons only) | Full sidebar (250px) |
+| Topbar | Simplified (logo + burger) | Full tabs | Full tabs |
+| Transaction card | Stack vertical | 2-col grid | Full row layout |
+| Transaction page | Single column, sections stacked | 2 columns for details | Full layout as designed |
+| Chat | Full width | Full width | Within transaction layout |
+| Product card | Stack vertical | Horizontal, compact | Full 5-column grid |
+
+### 6. State Management Pattern
+```jsx
+// Each dashboard section manages its own state
+// DashboardLayout provides context via React Context:
+
+const DashboardContext = React.createContext({
+  user: null,          // Supabase auth user
+  company: null,       // User's company details
+  activeTab: 'buy',    // BUY | SELL | PROFILE | NOTIFICATIONS
+  activeSection: null,  // Current sidebar item
+  setActiveTab: () => {},
+  setActiveSection: () => {},
+  stripeStatus: null,  // { charges_enabled, payouts_enabled }
+});
+```
+
+## Supabase Tables Used
+
+| Table | Operations | Realtime |
+|-------|-----------|----------|
+| Transaction | CRUD | ✅ Status changes |
+| TransactionItem | CRUD | ❌ |
+| TransactionMessage | Read, Insert | ✅ New messages |
+| Listing | Read | ❌ |
+| Company | Read | ❌ |
+| User | Read | ❌ |
+| Notification | Read, Update (mark read) | ✅ New notifications |
+
+## Error States to Handle
+
+Every component must handle these states:
+1. **Loading**: skeleton/spinner while fetching
+2. **Empty**: no transactions/messages/etc → show EmptyState with CTA
+3. **Error**: Supabase/network error → show error message with retry button
+4. **Offline**: no Supabase config → use mock data for demo mode
+5. **Unauthorized**: user not logged in → redirect to login
+6. **Forbidden**: user tries to access someone else's transaction → show 403
+
+## Testing Checklist
+
+- [ ] BUY tab shows buyer sidebar and buyer content
+- [ ] SELL tab shows seller sidebar and seller content  
+- [ ] Transaction list filters work (All/Negotiations/Cancelled/etc.)
+- [ ] Transaction search works
+- [ ] Click on transaction → opens TransactionPage
+- [ ] Breadcrumb navigation works (back to list)
+- [ ] Price editing: click Editer → input → validate → price updates
+- [ ] Delivery cost editing works
+- [ ] Chat: send message → appears in chat
+- [ ] Chat: realtime message from other party appears
+- [ ] Translation toggle works
+- [ ] Timeline shows correct status
+- [ ] Cancel transaction → shows reason modal
+- [ ] Mobile: sidebar becomes bottom tab bar
+- [ ] Mobile: transaction page stacks properly
+- [ ] All text in FR + EN
+- [ ] No console errors
+- [ ] No Stripe keys in client code
diff --git a/public/logos/canadian-solar.svg b/public/logos/canadian-solar.svg
index 3ac4ec7..55124f5 100644
--- a/public/logos/canadian-solar.svg
+++ b/public/logos/canadian-solar.svg
@@ -1 +1,4 @@
-<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 45"><text x="0" y="33" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="bold" fill="#003ca6">Canadian Solar</text></svg>
\ No newline at end of file
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 50">
+  <defs><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700');</style></defs>
+  <text x="140" y="35" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#003ca6">Canadian Solar</text>
+</svg>
diff --git a/public/logos/ja-solar.svg b/public/logos/ja-solar.svg
index f6bb94b..79fbc0d 100644
--- a/public/logos/ja-solar.svg
+++ b/public/logos/ja-solar.svg
@@ -1 +1,5 @@
-<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 45"><text x="0" y="33" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="bold" fill="#003da6">JA Solar</text></svg>
\ No newline at end of file
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
+  <defs><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800');</style></defs>
+  <text x="52" y="36" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#003da6">JA</text>
+  <text x="120" y="36" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600" fill="#003da6">Solar</text>
+</svg>
diff --git a/public/logos/longi.svg b/public/logos/longi.svg
index 1f5f1cd..2594334 100644
--- a/public/logos/longi.svg
+++ b/public/logos/longi.svg
@@ -1 +1,4 @@
-<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 45"><text x="0" y="34" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="bold" fill="#008c44">LONGi</text></svg>
\ No newline at end of file
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
+  <defs><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@800');</style></defs>
+  <text x="100" y="36" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="38" font-weight="800" fill="#008c44" letter-spacing="4">LONGi</text>
+</svg>
diff --git a/public/logos/risen.svg b/public/logos/risen.svg
index fb46240..8bb40fa 100644
--- a/public/logos/risen.svg
+++ b/public/logos/risen.svg
@@ -1 +1,5 @@
-<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 45"><text x="0" y="34" font-family="Arial,Helvetica,sans-serif" font-size="32" font-weight="bold" fill="#e60012">risen</text></svg>
\ No newline at end of file
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
+  <defs><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@700');</style></defs>
+  <text x="60" y="35" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#e60012" letter-spacing="2">Risen</text>
+  <text x="148" y="35" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="500" fill="#e60012">Energy</text>
+</svg>
diff --git a/public/logos/sma.svg b/public/logos/sma.svg
index 57e5f36..72d0c83 100644
--- a/public/logos/sma.svg
+++ b/public/logos/sma.svg
@@ -1,3 +1,4 @@
-<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
-  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="36" fill="#C30B19">SMA</text>
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50">
+  <rect x="10" y="8" width="100" height="34" rx="4" fill="#cc0000"/>
+  <text x="60" y="32" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#ffffff" letter-spacing="3">SMA</text>
 </svg>
diff --git a/review/request.md b/review/request.md
new file mode 100644
index 0000000..d875095
--- /dev/null
+++ b/review/request.md
@@ -0,0 +1,32 @@
+# Claude Review Request (SUNTREX Marketplace)
+
+Date: 2026-02-26 07:03:23
+Base ref: origin/main
+Head: db18f56
+Branch: main
+
+## Mission
+Review this diff as principal reviewer for a B2B marketplace.
+Focus strictly on:
+1. Security and auth/access controls.
+2. Marketplace business logic (KYC/KYB, transaction status machine, payment flow).
+3. Stripe/webhook/idempotency correctness.
+4. Supabase RLS and data isolation.
+5. Missing tests and regression risk.
+
+## Required output format
+- Finding title
+- Severity: P0 / P1 / P2
+- Business impact
+- File + line(s)
+- Concrete fix
+
+## Diff stat
+```
+
+```
+
+## Diff patch
+```diff
+
+```
diff --git a/setup-dashboard.sh b/setup-dashboard.sh
new file mode 100644
index 0000000..2b0d54c
--- /dev/null
+++ b/setup-dashboard.sh
@@ -0,0 +1,61 @@
+#!/bin/bash
+# ═══════════════════════════════════════════════════════════════
+# SUNTREX — Install Dashboard module files
+# Run: bash setup-dashboard.sh
+# ═══════════════════════════════════════════════════════════════
+
+PROJECT_DIR="$HOME/Downloads/suntrex"
+
+echo ""
+echo "═══════════════════════════════════════════════════════"
+echo "  🔧 SUNTREX Dashboard Module — Setup"
+echo "═══════════════════════════════════════════════════════"
+echo ""
+
+# Check project exists
+if [ ! -d "$PROJECT_DIR" ]; then
+  echo "❌ Project directory not found: $PROJECT_DIR"
+  echo "   Please update PROJECT_DIR in this script."
+  exit 1
+fi
+
+# Create directory structure
+echo "📁 Creating directory structure..."
+mkdir -p "$PROJECT_DIR/src/components/dashboard/buy"
+mkdir -p "$PROJECT_DIR/src/components/dashboard/sell"
+mkdir -p "$PROJECT_DIR/src/components/dashboard/transaction"
+mkdir -p "$PROJECT_DIR/src/components/dashboard/profile"
+mkdir -p "$PROJECT_DIR/src/components/dashboard/notifications"
+mkdir -p "$PROJECT_DIR/src/components/dashboard/shared"
+echo "   ✅ Directories created"
+
+# Copy CLAUDE.md for dashboard module
+SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
+
+if [ -f "$SCRIPT_DIR/dashboard-CLAUDE.md" ]; then
+  cp "$SCRIPT_DIR/dashboard-CLAUDE.md" "$PROJECT_DIR/src/components/dashboard/CLAUDE.md"
+  echo "   ✅ Dashboard CLAUDE.md installed"
+else
+  echo "   ⚠️  dashboard-CLAUDE.md not found in script directory"
+fi
+
+echo ""
+echo "═══════════════════════════════════════════════════════"
+echo "  ✅ Dashboard module scaffolding ready!"
+echo ""
+echo "  Structure:"
+echo "  suntrex/src/components/dashboard/"
+echo "  ├── CLAUDE.md"
+echo "  ├── buy/"
+echo "  ├── sell/"
+echo "  ├── transaction/"
+echo "  ├── profile/"
+echo "  ├── notifications/"
+echo "  └── shared/"
+echo ""
+echo "  Next step:"
+echo "  1. cd $PROJECT_DIR"
+echo "  2. Open Claude Code: claude"
+echo "  3. Paste the prompt from suntrex-dashboard-prompt.md"
+echo ""
+echo "═══════════════════════════════════════════════════════"
diff --git a/src/App.jsx b/src/App.jsx
index 2371f12..3a65bda 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -7,6 +7,9 @@ import HomePage from "./pages/HomePage";
 import CatalogPage from "./pages/CatalogPage";
 import ProductDetailPage from "./pages/ProductDetailPage";
 import TransactionChatPage from "./pages/TransactionChatPage";
+import BuyerDashboard from "./components/dashboard/BuyerDashboard";
+import SellerDashboard from "./components/dashboard/SellerDashboard";
+import DashboardLayout from "./components/dashboard/DashboardLayout";
 import { LoginModal, RegisterModal } from "./AuthSystem";
 
 /* ═══════════════════════════════════════════════════════════════
@@ -23,6 +26,7 @@ export default function App() {
   const location = useLocation();
 
   const isVerified = isLoggedIn && currentUser?.kycStatus === "verified";
+  const isDashboard = location.pathname.startsWith("/dashboard");
 
   useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
 
@@ -54,13 +58,15 @@ export default function App() {
         }
       `}</style>
 
-      <Header
-        isLoggedIn={isLoggedIn}
-        currentUser={currentUser}
-        onShowLogin={()=>setShowLogin(true)}
-        onShowRegister={()=>setShowRegister(true)}
-        onLogout={handleLogout}
-      />
+      {!isDashboard && (
+        <Header
+          isLoggedIn={isLoggedIn}
+          currentUser={currentUser}
+          onShowLogin={()=>setShowLogin(true)}
+          onShowRegister={()=>setShowRegister(true)}
+          onLogout={handleLogout}
+        />
+      )}
 
       <Routes>
         <Route path="/" element={
@@ -89,10 +95,15 @@ export default function App() {
             currentUser={currentUser}
           />
         }/>
+        <Route path="/dashboard" element={<DashboardLayout />} />
+        <Route path="/dashboard/buy" element={<DashboardLayout initialTab="buy" />} />
+        <Route path="/dashboard/sell" element={<DashboardLayout initialTab="sell" />} />
+        <Route path="/dashboard/buyer" element={<BuyerDashboard />} />
+        <Route path="/dashboard/seller" element={<SellerDashboard />} />
       </Routes>
 
-      <Footer />
-      <SuntrexSupportChat userId={isLoggedIn ? "current-user-id" : null} />
+      {!isDashboard && <Footer />}
+      {!isDashboard && <SuntrexSupportChat userId={isLoggedIn ? "current-user-id" : null} />}
 
       {showLogin && (
         <LoginModal
diff --git a/src/components/dashboard/BuyerDashboard.jsx b/src/components/dashboard/BuyerDashboard.jsx
new file mode 100644
index 0000000..349c920
--- /dev/null
+++ b/src/components/dashboard/BuyerDashboard.jsx
@@ -0,0 +1,369 @@
+import { useState } from "react";
+import DashboardLayout from "./DashboardLayout";
+import { BRAND, fmt, ORDER_STATUS, MOCK_BUYER, useDashboardResponsive } from "./dashboardUtils";
+
+// ── Reusable micro-components ─────────────────────────────────────────
+
+function StatCard({ icon, label, value, sub, color, trend }) {
+  return (
+    <div style={{
+      background: BRAND.white, borderRadius: 12,
+      padding: "18px 20px",
+      border: `1px solid ${BRAND.border}`,
+      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
+    }}>
+      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
+        <div>
+          <div style={{ fontSize: 12, color: BRAND.gray, fontWeight: 500, marginBottom: 6 }}>{label}</div>
+          <div style={{ fontSize: 24, fontWeight: 800, color: BRAND.dark }}>{value}</div>
+          {sub && <div style={{ fontSize: 11, color: BRAND.lightGray, marginTop: 4 }}>{sub}</div>}
+        </div>
+        <div style={{
+          width: 42, height: 42, borderRadius: 10,
+          background: `${color || BRAND.orange}15`,
+          display: "flex", alignItems: "center", justifyContent: "center",
+          fontSize: 20,
+        }}>
+          {icon}
+        </div>
+      </div>
+      {trend !== undefined && (
+        <div style={{ marginTop: 10, fontSize: 12, color: trend >= 0 ? BRAND.green : BRAND.red, fontWeight: 600 }}>
+          {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}% vs mois dernier
+        </div>
+      )}
+    </div>
+  );
+}
+
+function OrderRow({ order, isMobile }) {
+  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
+  if (isMobile) {
+    return (
+      <div style={{
+        display: "flex", justifyContent: "space-between", alignItems: "center",
+        padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, gap: 12,
+      }}>
+        <div style={{ flex: 1, minWidth: 0 }}>
+          <div style={{ fontWeight: 700, fontSize: 12, color: BRAND.dark }}>{order.id}</div>
+          <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.product}</div>
+          <div style={{ fontSize: 11, color: BRAND.lightGray }}>{fmt.date(order.date)}</div>
+        </div>
+        <div style={{ textAlign: "right", flexShrink: 0 }}>
+          <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.dark }}>{fmt.price(order.amount)}</div>
+          <span style={{
+            display: "inline-block", marginTop: 4,
+            padding: "2px 8px", borderRadius: 20,
+            background: st.bg, color: st.color,
+            fontSize: 10, fontWeight: 700,
+          }}>{st.icon} {st.label}</span>
+        </div>
+      </div>
+    );
+  }
+  return (
+    <div style={{
+      display: "grid",
+      gridTemplateColumns: "120px 1fr 140px 100px 90px 100px",
+      gap: 12, alignItems: "center",
+      padding: "12px 16px",
+      borderBottom: `1px solid ${BRAND.border}`,
+      transition: "background 0.12s",
+    }}
+    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
+    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
+    >
+      <div style={{ fontSize: 12, fontFamily: "monospace", color: BRAND.dark, fontWeight: 600 }}>{order.id}</div>
+      <div>
+        <div style={{ fontSize: 13, color: BRAND.dark, fontWeight: 500 }}>{order.product}</div>
+        <div style={{ fontSize: 11, color: BRAND.lightGray }}>{order.seller}</div>
+      </div>
+      <div style={{ fontSize: 12, color: BRAND.gray }}>{fmt.date(order.date)}</div>
+      <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.dark }}>{fmt.price(order.amount)}</div>
+      <span style={{
+        padding: "3px 10px", borderRadius: 20,
+        background: st.bg, color: st.color,
+        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", textAlign: "center",
+      }}>{st.icon} {st.label}</span>
+      <div>
+        {order.tracking ? (
+          <button style={{
+            background: "none", border: `1px solid ${BRAND.border}`,
+            borderRadius: 6, padding: "4px 10px",
+            fontSize: 11, color: BRAND.blue, fontWeight: 600,
+            cursor: "pointer", fontFamily: "inherit",
+          }}>
+            \uD83D\uDE9A Suivre
+          </button>
+        ) : (
+          <span style={{ fontSize: 11, color: BRAND.lightGray }}>\u2014</span>
+        )}
+      </div>
+    </div>
+  );
+}
+
+function RFQCard({ rfq }) {
+  return (
+    <div style={{
+      background: BRAND.white, border: `1px solid ${BRAND.border}`,
+      borderRadius: 10, padding: "14px 16px",
+      display: "flex", alignItems: "center", justifyContent: "space-between",
+      gap: 12, flexWrap: "wrap",
+    }}>
+      <div style={{ minWidth: 0 }}>
+        <div style={{ fontSize: 11, fontFamily: "monospace", color: BRAND.lightGray }}>{rfq.id}</div>
+        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginTop: 2 }}>{rfq.product}</div>
+        <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 1 }}>
+          Qt\u00e9 : {fmt.number(rfq.qty)} \u00b7 Expire : {fmt.date(rfq.deadline)}
+        </div>
+      </div>
+      <div style={{ textAlign: "right", flexShrink: 0 }}>
+        <div style={{
+          background: BRAND.blueLight, color: BRAND.blue,
+          borderRadius: 20, padding: "3px 12px",
+          fontSize: 12, fontWeight: 700, marginBottom: 8, display: "inline-block",
+        }}>
+          {rfq.quotes} offre{rfq.quotes > 1 ? "s" : ""}
+        </div>
+        <div>
+          <button style={{
+            background: BRAND.orange, color: "#fff",
+            border: "none", borderRadius: 7,
+            padding: "6px 14px", fontSize: 12, fontWeight: 700,
+            cursor: "pointer", fontFamily: "inherit",
+          }}>
+            Voir les offres
+          </button>
+        </div>
+      </div>
+    </div>
+  );
+}
+
+// ── TABS ──────────────────────────────────────────────────────────────
+const BUYER_TABS = (data) => [
+  { id: "overview", icon: "\uD83D\uDCCA", label: "Vue d'ensemble", badge: 0 },
+  { id: "orders",   icon: "\uD83D\uDCE6", label: "Mes commandes",  badge: data.orders.filter(o => o.status === "pending" || o.status === "shipped").length },
+  { id: "rfqs",     icon: "\uD83D\uDCCB", label: "Demandes RFQ",   badge: data.rfqs.length },
+  { id: "saved",    icon: "\u2764\uFE0F", label: "Produits suivis", badge: 0 },
+  { id: "chat",     icon: "\uD83D\uDCAC", label: "Messages",       badge: 1 },
+  { id: "profile",  icon: "\uD83D\uDC64", label: "Mon profil",     badge: 0 },
+];
+
+// ── VIEWS ─────────────────────────────────────────────────────────────
+
+function BuyerOverview({ data, isMobile }) {
+  const stats = data.stats;
+  return (
+    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
+      {/* KPIs */}
+      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
+        <StatCard icon="\uD83D\uDCE6" label="Commandes totales" value={stats.totalOrders} color={BRAND.blue} />
+        <StatCard icon="\uD83D\uDCB6" label="Total d\u00e9pens\u00e9" value={fmt.price(stats.totalSpend)} color={BRAND.green} trend={12.4} />
+        <StatCard icon="\u23F3" label="En cours" value={stats.pendingOrders} color={BRAND.amber} />
+        <StatCard icon="\uD83D\uDCCB" label="RFQ actifs" value={stats.activeRFQs} color={BRAND.orange} />
+      </div>
+
+      {/* Recent orders + Saved products */}
+      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: 18 }}>
+        {/* Recent orders */}
+        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
+          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
+            <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark }}>Commandes r\u00e9centes</div>
+            <button style={{ background: "none", border: "none", color: BRAND.orange, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Voir tout \u2192</button>
+          </div>
+          {data.orders.slice(0, 4).map(o => <OrderRow key={o.id} order={o} isMobile={true} />)}
+        </div>
+
+        {/* Stats card + dispute alert */}
+        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
+          <div style={{
+            background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
+            borderRadius: 12, padding: 20, color: "#fff",
+          }}>
+            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>D\u00e9pense moyenne</div>
+            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt.price(stats.avgOrderValue)}</div>
+            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>par commande</div>
+            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.08)", borderRadius: 8 }}>
+              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Produits suivis</div>
+              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{stats.savedItems} produits</div>
+            </div>
+          </div>
+
+          {/* Dispute alert */}
+          {data.orders.some(o => o.status === "disputed") && (
+            <div style={{
+              background: BRAND.redLight, border: `1px solid ${BRAND.red}33`,
+              borderRadius: 10, padding: "14px 16px",
+              display: "flex", gap: 10, alignItems: "flex-start",
+            }}>
+              <span style={{ fontSize: 20 }}>{"\u26A0\uFE0F"}</span>
+              <div>
+                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.red }}>Litige en cours</div>
+                <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>ORD-2024-005 requiert votre r\u00e9ponse sous 48h</div>
+                <button style={{
+                  marginTop: 8, background: BRAND.red, color: "#fff",
+                  border: "none", borderRadius: 6, padding: "5px 14px",
+                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
+                }}>
+                  Traiter le litige \u2192
+                </button>
+              </div>
+            </div>
+          )}
+        </div>
+      </div>
+    </div>
+  );
+}
+
+function BuyerOrders({ data, isMobile }) {
+  const [filter, setFilter] = useState("all");
+  const filtered = filter === "all" ? data.orders : data.orders.filter(o => o.status === filter);
+
+  return (
+    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
+      {/* Status filters */}
+      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
+        {["all", "pending", "paid", "shipped", "delivered", "disputed"].map(s => (
+          <button key={s} onClick={() => setFilter(s)} style={{
+            padding: "5px 14px", borderRadius: 20,
+            border: `1.5px solid ${filter === s ? BRAND.orange : BRAND.border}`,
+            background: filter === s ? BRAND.orange : BRAND.white,
+            color: filter === s ? "#fff" : BRAND.gray,
+            fontSize: 12, fontWeight: filter === s ? 700 : 500,
+            cursor: "pointer", fontFamily: "inherit",
+            minHeight: 32,
+          }}>
+            {s === "all" ? "Toutes" : (ORDER_STATUS[s]?.label || s)}
+          </button>
+        ))}
+      </div>
+
+      {/* Header */}
+      {!isMobile && (
+        <div style={{
+          display: "grid", gridTemplateColumns: "120px 1fr 140px 100px 90px 100px",
+          gap: 12, padding: "10px 16px",
+          background: BRAND.light, borderBottom: `1px solid ${BRAND.border}`,
+          fontSize: 11, fontWeight: 700, color: BRAND.lightGray, textTransform: "uppercase", letterSpacing: 0.5,
+        }}>
+          <span>N\u00b0 commande</span><span>Produit / Vendeur</span><span>Date</span><span>Montant</span><span>Statut</span><span>Actions</span>
+        </div>
+      )}
+
+      {filtered.length === 0 ? (
+        <div style={{ padding: 40, textAlign: "center", color: BRAND.lightGray }}>
+          <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDCED"}</div>
+          Aucune commande trouv\u00e9e
+        </div>
+      ) : filtered.map(o => <OrderRow key={o.id} order={o} isMobile={isMobile} />)}
+    </div>
+  );
+}
+
+function BuyerSaved({ data, isMobile }) {
+  return (
+    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
+      {data.saved.map(p => (
+        <div key={p.id} style={{
+          background: BRAND.white, border: `1px solid ${BRAND.border}`,
+          borderRadius: 12, padding: "16px",
+          display: "flex", flexDirection: "column", gap: 10,
+        }}>
+          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
+            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.orange, textTransform: "uppercase" }}>{p.brand}</div>
+            <button style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", padding: 0 }}>{"\u2764\uFE0F"}</button>
+          </div>
+          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, lineHeight: 1.3 }}>{p.name}</div>
+          <div style={{ fontSize: 11, color: p.stock > 10 ? BRAND.green : BRAND.amber, fontWeight: 600 }}>
+            {p.stock > 0 ? `\u2713 ${p.stock} en stock` : "\u2717 Rupture"}
+          </div>
+          <div style={{
+            display: "flex", alignItems: "center", justifyContent: "space-between",
+            paddingTop: 8, borderTop: `1px solid ${BRAND.border}`,
+          }}>
+            <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.dark }}>{fmt.price(p.price)}</div>
+            <button style={{
+              background: BRAND.orange, color: "#fff",
+              border: "none", borderRadius: 7,
+              padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
+              minHeight: 36,
+            }}>
+              Commander
+            </button>
+          </div>
+        </div>
+      ))}
+    </div>
+  );
+}
+
+// ── MAIN BuyerDashboard ───────────────────────────────────────────────
+export default function BuyerDashboard() {
+  const { isMobile } = useDashboardResponsive();
+  const [tab, setTab] = useState("overview");
+  const data = MOCK_BUYER;
+
+  const tabs = BUYER_TABS(data);
+
+  const renderContent = () => {
+    switch (tab) {
+      case "overview": return <BuyerOverview data={data} isMobile={isMobile} />;
+      case "orders":   return <BuyerOrders data={data} isMobile={isMobile} />;
+      case "rfqs":     return (
+        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
+          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
+            <div style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark }}>Demandes de devis (RFQ)</div>
+            <button style={{ background: BRAND.orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
+              + Nouvelle demande
+            </button>
+          </div>
+          {data.rfqs.map(r => <RFQCard key={r.id} rfq={r} />)}
+        </div>
+      );
+      case "saved":    return <BuyerSaved data={data} isMobile={isMobile} />;
+      case "chat":     return (
+        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: 40, textAlign: "center", color: BRAND.lightGray }}>
+          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\uD83D\uDCAC"}</div>
+          <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.dark }}>Messagerie int\u00e9gr\u00e9e</div>
+          <div style={{ fontSize: 13, marginTop: 6 }}>Le composant SuntrexSupportChat sera int\u00e9gr\u00e9 ici</div>
+        </div>
+      );
+      case "profile":  return (
+        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: isMobile ? 20 : 28, maxWidth: 560 }}>
+          <div style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark, marginBottom: 20 }}>Profil entreprise</div>
+          {[
+            ["Nom", data.user.name], ["Email", data.user.email],
+            ["Soci\u00e9t\u00e9", data.company.name], ["TVA", data.company.vat],
+            ["Pays", data.company.country], ["Type", data.company.type],
+          ].map(([k, v]) => (
+            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BRAND.border}` }}>
+              <span style={{ fontSize: 13, color: BRAND.gray, fontWeight: 500 }}>{k}</span>
+              <span style={{ fontSize: 13, color: BRAND.dark, fontWeight: 600 }}>{v}</span>
+            </div>
+          ))}
+          <button style={{ marginTop: 20, background: BRAND.orange, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
+            Modifier le profil
+          </button>
+        </div>
+      );
+      default: return null;
+    }
+  };
+
+  return (
+    <DashboardLayout
+      user={data.user}
+      company={data.company}
+      notifications={data.notifications}
+      activeTab={tab}
+      onTabChange={setTab}
+      tabs={tabs}
+      role="buyer"
+    >
+      {renderContent()}
+    </DashboardLayout>
+  );
+}
diff --git a/src/components/dashboard/CLAUDE.md b/src/components/dashboard/CLAUDE.md
new file mode 100644
index 0000000..435b23f
--- /dev/null
+++ b/src/components/dashboard/CLAUDE.md
@@ -0,0 +1,176 @@
+# CLAUDE.md — SUNTREX Dashboard Module
+
+> Rules specific to `src/components/dashboard/`. Inherits all global rules from root `CLAUDE.md`.
+
+## Architecture
+
+```
+src/components/dashboard/
+├── CLAUDE.md                    # ← THIS FILE
+├── tokens.js                    # Design tokens (colors, spacing, fonts)
+├── DashboardLayout.jsx          # Main layout (sidebar + topbar + content area)
+├── DashboardSidebar.jsx         # Context-aware sidebar (changes with BUY/SELL/PROFILE)
+├── DashboardTopbar.jsx          # Top navigation with BUY|SELL|MY PROFILE|NOTIFICATIONS tabs
+├── DashboardRouter.jsx          # Internal section routing
+│
+├── buy/                         # Buyer space
+│   ├── MyPurchases.jsx          # Buyer transactions list
+│   ├── DeliveryAddresses.jsx    # Shipping address management
+│   ├── BuyerRFQ.jsx            # Request for Proposals
+│   └── BuyerOverview.jsx        # Buyer dashboard stats
+│
+├── sell/                        # Seller space
+│   ├── ManageOffers.jsx         # Offer/listing management
+│   ├── MySales.jsx             # Seller transactions list (with filters/tabs)
+│   ├── SellerOverview.jsx       # Seller dashboard stats + revenue charts
+│   └── WarehouseManager.jsx     # Warehouse management
+│
+├── transaction/                 # Transaction system (shared buyer/seller)
+│   ├── TransactionPage.jsx      # Full transaction page (orchestrator)
+│   ├── TransactionChat.jsx      # Negotiation chat with auto-translation
+│   ├── TransactionTimeline.jsx  # Status pipeline visualization
+│   ├── TransactionProducts.jsx  # Editable product card(s)
+│   └── TransactionDetails.jsx   # Seller/buyer details panel
+│
+├── profile/                     # User profile
+│   ├── AccountDetails.jsx
+│   ├── CompanyDetails.jsx
+│   ├── InvoicesAndFees.jsx
+│   ├── ReviewsPage.jsx
+│   └── OutOfOffice.jsx
+│
+├── notifications/               # Notification center
+│   ├── NotificationsCenter.jsx
+│   ├── NotificationEmails.jsx
+│   └── NotificationSettings.jsx
+│
+└── shared/                      # Shared components
+    ├── StatCard.jsx             # Reusable stat card
+    ├── StatusBadge.jsx          # Transaction status badge
+    ├── PriceEditor.jsx          # Inline price editor
+    ├── TranslationBanner.jsx    # Auto-translation banner
+    ├── EmptyState.jsx           # Empty state placeholder
+    └── useResponsive.js         # Responsive hook
+```
+
+## ABSOLUTE RULES FOR THIS MODULE
+
+### 1. Context-Aware Navigation
+The dashboard has ONE layout but FOUR contexts. The active tab in the topbar determines:
+- Which sidebar items are visible
+- Which content area is rendered
+- The user's current "role" perspective (even if they are both buyer AND seller)
+
+```
+Tab active = BUY      → Sidebar shows buy menu → Content = buyer views
+Tab active = SELL     → Sidebar shows sell menu → Content = seller views  
+Tab active = PROFILE  → Sidebar shows profile menu → Content = profile views
+Tab active = NOTIFS   → Sidebar shows notif menu → Content = notification views
+```
+
+### 2. Transaction = Central Object
+A Transaction is the core business object. It connects:
+- Buyer ↔ Seller
+- Product(s) ↔ Price negotiation
+- Chat messages ↔ Moderation
+- Payment ↔ Delivery ↔ Escrow
+
+The same `TransactionPage` component renders for BOTH buyer and seller, but with:
+- **Different actions** (seller can edit price; buyer can pay)
+- **Different labels** ("Détails du vendeur" vs "Détails de l'acheteur")
+- **Same chat** (both sides see same messages)
+
+```jsx
+// TransactionPage receives the user's role in this transaction
+<TransactionPage 
+  transaction={tx} 
+  role={user.id === tx.buyer_id ? 'buyer' : 'seller'} 
+/>
+```
+
+### 3. Price Editing = Server-Validated
+When a seller edits a price in the TransactionPage:
+1. UI shows inline editor immediately (optimistic)
+2. Call Netlify Function `transaction.js` with new price
+3. Function validates: is user the seller? is transaction in negotiation?
+4. Function updates DB → triggers Supabase realtime
+5. UI confirms or rolls back
+
+**NEVER** update price directly from client to Supabase. Always via Netlify Function.
+
+### 4. Chat Messages = Realtime + Moderation
+- New messages are inserted via Supabase client (RLS allows participants)
+- Realtime subscription delivers messages to both parties instantly
+- AI moderation runs server-side (Netlify Function) on message insert
+- Flagged messages are hidden with "Ce message a été modéré"
+- Translation is handled client-side (or via a translation API call)
+
+### 5. Responsive Behavior
+
+| Component | Mobile (<768) | Tablet (768-1023) | Desktop (≥1024) |
+|-----------|--------------|-------------------|-----------------|
+| Sidebar | Bottom tab bar (4 icons) | Collapsed (icons only) | Full sidebar (250px) |
+| Topbar | Simplified (logo + burger) | Full tabs | Full tabs |
+| Transaction card | Stack vertical | 2-col grid | Full row layout |
+| Transaction page | Single column, sections stacked | 2 columns for details | Full layout as designed |
+| Chat | Full width | Full width | Within transaction layout |
+| Product card | Stack vertical | Horizontal, compact | Full 5-column grid |
+
+### 6. State Management Pattern
+```jsx
+// Each dashboard section manages its own state
+// DashboardLayout provides context via React Context:
+
+const DashboardContext = React.createContext({
+  user: null,          // Supabase auth user
+  company: null,       // User's company details
+  activeTab: 'buy',    // BUY | SELL | PROFILE | NOTIFICATIONS
+  activeSection: null,  // Current sidebar item
+  setActiveTab: () => {},
+  setActiveSection: () => {},
+  stripeStatus: null,  // { charges_enabled, payouts_enabled }
+});
+```
+
+## Supabase Tables Used
+
+| Table | Operations | Realtime |
+|-------|-----------|----------|
+| Transaction | CRUD | ✅ Status changes |
+| TransactionItem | CRUD | ❌ |
+| TransactionMessage | Read, Insert | ✅ New messages |
+| Listing | Read | ❌ |
+| Company | Read | ❌ |
+| User | Read | ❌ |
+| Notification | Read, Update (mark read) | ✅ New notifications |
+
+## Error States to Handle
+
+Every component must handle these states:
+1. **Loading**: skeleton/spinner while fetching
+2. **Empty**: no transactions/messages/etc → show EmptyState with CTA
+3. **Error**: Supabase/network error → show error message with retry button
+4. **Offline**: no Supabase config → use mock data for demo mode
+5. **Unauthorized**: user not logged in → redirect to login
+6. **Forbidden**: user tries to access someone else's transaction → show 403
+
+## Testing Checklist
+
+- [ ] BUY tab shows buyer sidebar and buyer content
+- [ ] SELL tab shows seller sidebar and seller content  
+- [ ] Transaction list filters work (All/Negotiations/Cancelled/etc.)
+- [ ] Transaction search works
+- [ ] Click on transaction → opens TransactionPage
+- [ ] Breadcrumb navigation works (back to list)
+- [ ] Price editing: click Editer → input → validate → price updates
+- [ ] Delivery cost editing works
+- [ ] Chat: send message → appears in chat
+- [ ] Chat: realtime message from other party appears
+- [ ] Translation toggle works
+- [ ] Timeline shows correct status
+- [ ] Cancel transaction → shows reason modal
+- [ ] Mobile: sidebar becomes bottom tab bar
+- [ ] Mobile: transaction page stacks properly
+- [ ] All text in FR + EN
+- [ ] No console errors
+- [ ] No Stripe keys in client code
diff --git a/src/components/dashboard/DashboardLayout.jsx b/src/components/dashboard/DashboardLayout.jsx
new file mode 100644
index 0000000..fc2b2b1
--- /dev/null
+++ b/src/components/dashboard/DashboardLayout.jsx
@@ -0,0 +1,232 @@
+import React, { useState, useCallback, createContext, useContext } from "react";
+import { T } from "./tokens";
+import { useResponsive } from "./shared/useResponsive";
+import DashboardTopbar from "./DashboardTopbar";
+import DashboardSidebar from "./DashboardSidebar";
+import DashboardRouter, { DEFAULT_SECTIONS } from "./DashboardRouter";
+import { MOCK_BUYER, MOCK_SELLER } from "./dashboardUtils";
+
+// ── Dashboard Context ──────────────────────────────────────────────
+export const DashboardContext = createContext({
+  user: null,
+  company: null,
+  activeTab: "buy",
+  activeSection: null,
+  transactionId: null,
+  lang: "fr",
+  setActiveTab: () => {},
+  setActiveSection: () => {},
+  navigateToTransaction: () => {},
+});
+
+export const useDashboard = () => useContext(DashboardContext);
+
+// ── Mock data for demo mode ────────────────────────────────────────
+const DEMO_USER = MOCK_BUYER.user;
+const DEMO_COMPANY = MOCK_BUYER.company;
+const DEMO_NOTIFICATIONS = [...MOCK_BUYER.notifications, ...MOCK_SELLER.notifications];
+
+// ── Mobile bottom tab bar ──────────────────────────────────────────
+const MOBILE_TABS = [
+  { id: "buy",           icon: "\uD83D\uDED2", label: "Buy",    labelFr: "Acheter" },
+  { id: "sell",          icon: "\uD83D\uDCB0", label: "Sell",   labelFr: "Vendre" },
+  { id: "profile",       icon: "\uD83D\uDC64", label: "Profile", labelFr: "Profil" },
+  { id: "notifications", icon: "\uD83D\uDD14", label: "Notifs", labelFr: "Notifs" },
+];
+
+export default function DashboardLayout({ initialTab = "buy", user: propUser, company: propCompany }) {
+  const { isMobile, isTablet } = useResponsive();
+  const [activeTab, setActiveTab] = useState(initialTab);
+  const [activeSection, setActiveSection] = useState(DEFAULT_SECTIONS[initialTab]);
+  const [transactionId, setTransactionId] = useState(null);
+  const [lang] = useState("fr");
+
+  // Use prop user or demo user
+  const user = propUser || DEMO_USER;
+  const company = propCompany || DEMO_COMPANY;
+
+  const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.read).length;
+
+  const handleTabChange = useCallback((tabId) => {
+    setActiveTab(tabId);
+    setActiveSection(DEFAULT_SECTIONS[tabId]);
+    setTransactionId(null);
+  }, []);
+
+  const handleSectionChange = useCallback((sectionId) => {
+    setActiveSection(sectionId);
+    setTransactionId(null);
+  }, []);
+
+  const navigateToTransaction = useCallback((txId) => {
+    setActiveSection("transaction");
+    setTransactionId(txId);
+  }, []);
+
+  const handleProfileAction = useCallback((actionId) => {
+    if (actionId === "logout") {
+      // Handle logout - navigate to home
+      window.location.href = "/";
+      return;
+    }
+    setActiveTab("profile");
+    setActiveSection(actionId);
+  }, []);
+
+  const handleNotificationClick = useCallback(() => {
+    setActiveTab("notifications");
+    setActiveSection("notif-center");
+  }, []);
+
+  const contextValue = {
+    user,
+    company,
+    activeTab,
+    activeSection,
+    transactionId,
+    lang,
+    setActiveTab: handleTabChange,
+    setActiveSection: handleSectionChange,
+    navigateToTransaction,
+  };
+
+  return (
+    <DashboardContext.Provider value={contextValue}>
+      <div style={{
+        display: "flex",
+        flexDirection: "column",
+        minHeight: "100vh",
+        background: T.bg,
+        fontFamily: T.font,
+      }}>
+        {/* Topbar */}
+        <DashboardTopbar
+          activeTab={activeTab}
+          onTabChange={handleTabChange}
+          onProfileAction={handleProfileAction}
+          onNotificationClick={handleNotificationClick}
+          unreadCount={unreadCount}
+          user={user}
+          lang={lang}
+        />
+
+        {/* Main content area: sidebar + content */}
+        <div style={{
+          display: "flex",
+          flex: 1,
+          minHeight: 0,
+          paddingBottom: isMobile ? 64 : 0, // Space for mobile bottom bar
+        }}>
+          {/* Sidebar */}
+          <DashboardSidebar
+            activeTab={activeTab}
+            activeSection={activeSection}
+            onSectionChange={handleSectionChange}
+            lang={lang}
+            user={user}
+            company={company}
+          />
+
+          {/* Content */}
+          <main style={{
+            flex: 1,
+            minWidth: 0,
+            padding: isMobile ? 16 : (isTablet ? 24 : 32),
+            overflowY: "auto",
+          }}>
+            <DashboardRouter
+              activeTab={activeTab}
+              activeSection={activeSection}
+              transactionId={transactionId}
+              user={user}
+              company={company}
+              lang={lang}
+            />
+          </main>
+        </div>
+
+        {/* Mobile bottom tab bar */}
+        {isMobile && (
+          <div style={{
+            position: "fixed",
+            bottom: 0,
+            left: 0,
+            right: 0,
+            height: 64,
+            background: T.card,
+            borderTop: `1px solid ${T.border}`,
+            display: "flex",
+            alignItems: "center",
+            justifyContent: "space-around",
+            zIndex: 100,
+            boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
+          }}>
+            {MOBILE_TABS.map((tab) => {
+              const active = activeTab === tab.id;
+              return (
+                <button
+                  key={tab.id}
+                  onClick={() => handleTabChange(tab.id)}
+                  style={{
+                    background: "none",
+                    border: "none",
+                    display: "flex",
+                    flexDirection: "column",
+                    alignItems: "center",
+                    gap: 2,
+                    padding: "8px 12px",
+                    cursor: "pointer",
+                    minWidth: 60,
+                    minHeight: 44,
+                    position: "relative",
+                  }}
+                  aria-label={lang === "fr" ? tab.labelFr : tab.label}
+                >
+                  <span style={{
+                    fontSize: 20,
+                    opacity: active ? 1 : 0.5,
+                    transition: T.transitionFast,
+                  }}>
+                    {tab.icon}
+                  </span>
+                  <span style={{
+                    fontSize: 10,
+                    fontWeight: active ? 700 : 500,
+                    color: active ? T.accent : T.textMuted,
+                    fontFamily: T.font,
+                  }}>
+                    {lang === "fr" ? tab.labelFr : tab.label}
+                  </span>
+                  {active && (
+                    <div style={{
+                      position: "absolute",
+                      top: 0,
+                      left: "50%",
+                      transform: "translateX(-50%)",
+                      width: 24,
+                      height: 3,
+                      borderRadius: 2,
+                      background: T.accent,
+                    }} />
+                  )}
+                  {tab.id === "notifications" && unreadCount > 0 && (
+                    <span style={{
+                      position: "absolute",
+                      top: 4,
+                      right: 8,
+                      width: 8,
+                      height: 8,
+                      borderRadius: "50%",
+                      background: T.red,
+                      border: "2px solid #fff",
+                    }} />
+                  )}
+                </button>
+              );
+            })}
+          </div>
+        )}
+      </div>
+    </DashboardContext.Provider>
+  );
+}
diff --git a/src/components/dashboard/DashboardRouter.jsx b/src/components/dashboard/DashboardRouter.jsx
new file mode 100644
index 0000000..feebdb9
--- /dev/null
+++ b/src/components/dashboard/DashboardRouter.jsx
@@ -0,0 +1,118 @@
+import React, { lazy, Suspense } from "react";
+import { T } from "./tokens";
+
+// ── Lazy-loaded section components ─────────────────────────────────
+// Buy sections
+const MyPurchases = lazy(() => import("./buy/MyPurchases"));
+const DeliveryAddresses = lazy(() => import("./buy/DeliveryAddresses"));
+const BuyerRFQ = lazy(() => import("./buy/BuyerRFQ"));
+const BuyerOverview = lazy(() => import("./buy/BuyerOverview"));
+
+// Sell sections
+const ManageOffers = lazy(() => import("./sell/ManageOffers"));
+const MySales = lazy(() => import("./sell/MySales"));
+const SellerOverview = lazy(() => import("./sell/SellerOverview"));
+const WarehouseManager = lazy(() => import("./sell/WarehouseManager"));
+
+// Transaction
+const TransactionPage = lazy(() => import("./transaction/TransactionPage"));
+
+// Profile sections
+const AccountDetails = lazy(() => import("./profile/AccountDetails"));
+const CompanyDetails = lazy(() => import("./profile/CompanyDetails"));
+const InvoicesAndFees = lazy(() => import("./profile/InvoicesAndFees"));
+const ReviewsPage = lazy(() => import("./profile/ReviewsPage"));
+const OutOfOffice = lazy(() => import("./profile/OutOfOffice"));
+
+// Notifications
+const NotificationsCenter = lazy(() => import("./notifications/NotificationsCenter"));
+const NotificationEmails = lazy(() => import("./notifications/NotificationEmails"));
+const NotificationSettings = lazy(() => import("./notifications/NotificationSettings"));
+
+// ── Loading fallback ───────────────────────────────────────────────
+function SectionLoader() {
+  return (
+    <div style={{
+      display: "flex", alignItems: "center", justifyContent: "center",
+      padding: 60, color: T.textMuted, fontFamily: T.font, fontSize: 14,
+    }}>
+      <div style={{
+        width: 24, height: 24,
+        border: `3px solid ${T.border}`,
+        borderTopColor: T.accent,
+        borderRadius: "50%",
+        animation: "spin 0.8s linear infinite",
+        marginRight: 12,
+      }} />
+      Loading...
+      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
+    </div>
+  );
+}
+
+// ── Section mapping ────────────────────────────────────────────────
+const SECTION_MAP = {
+  // Buy
+  "purchases": MyPurchases,
+  "addresses": DeliveryAddresses,
+  "rfq": BuyerRFQ,
+  "finance": BuyerOverview, // Finance section defaults to overview for now
+
+  // Sell
+  "offers": ManageOffers,
+  "sales": MySales,
+  "warehouses": WarehouseManager,
+
+  // Transaction (special — receives transactionId)
+  "transaction": TransactionPage,
+
+  // Profile
+  "account": AccountDetails,
+  "password": AccountDetails, // Password is part of account details
+  "company": CompanyDetails,
+  "invoices": InvoicesAndFees,
+  "reviews": ReviewsPage,
+  "ooo": OutOfOffice,
+
+  // Notifications
+  "notif-center": NotificationsCenter,
+  "notif-emails": NotificationEmails,
+  "notif-settings": NotificationSettings,
+};
+
+// Default sections per tab
+const DEFAULT_SECTIONS = {
+  buy: "purchases",
+  sell: "sales",
+  profile: "account",
+  notifications: "notif-center",
+};
+
+export default function DashboardRouter({ activeTab, activeSection, transactionId, user, company, lang }) {
+  const sectionId = activeSection || DEFAULT_SECTIONS[activeTab] || "purchases";
+  const Component = SECTION_MAP[sectionId];
+
+  if (!Component) {
+    return (
+      <div style={{
+        padding: 40, textAlign: "center",
+        color: T.textMuted, fontFamily: T.font, fontSize: 14,
+      }}>
+        {lang === "fr" ? "Section non trouvee" : "Section not found"}
+      </div>
+    );
+  }
+
+  return (
+    <Suspense fallback={<SectionLoader />}>
+      <Component
+        user={user}
+        company={company}
+        lang={lang}
+        transactionId={transactionId}
+      />
+    </Suspense>
+  );
+}
+
+export { DEFAULT_SECTIONS, SECTION_MAP };
diff --git a/src/components/dashboard/DashboardSidebar.jsx b/src/components/dashboard/DashboardSidebar.jsx
new file mode 100644
index 0000000..ef05a97
--- /dev/null
+++ b/src/components/dashboard/DashboardSidebar.jsx
@@ -0,0 +1,284 @@
+import React, { useState } from "react";
+import { T } from "./tokens";
+import { useResponsive } from "./shared/useResponsive";
+
+// ── Sidebar menu configs per context ───────────────────────────────
+const SIDEBAR_BUY = {
+  sections: [
+    {
+      title: "BUY", titleFr: "ACHETER", collapsible: true, defaultOpen: true,
+      items: [
+        { id: "purchases",  icon: "\uD83D\uDECD\uFE0F", label: "My purchases",           labelFr: "Mes achats" },
+        { id: "addresses",   icon: "\uD83D\uDCCD",       label: "Delivery addresses",     labelFr: "Adresses de livraison" },
+        { id: "rfq",         icon: "\uD83D\uDCC4",       label: "Requests for Proposals", labelFr: "Demandes de devis", badge: "NEW" },
+        { id: "finance",     icon: "\uD83C\uDFE6",       label: "SUNTREX Finance",        labelFr: "SUNTREX Finance", badge: "NEW" },
+      ],
+    },
+    {
+      title: "NOTIFICATIONS", titleFr: "NOTIFICATIONS", collapsible: true, defaultOpen: true,
+      items: [
+        { id: "notif-center",   icon: "\uD83D\uDD14", label: "Notifications center",   labelFr: "Centre de notifications" },
+        { id: "notif-emails",   icon: "\u2709\uFE0F", label: "Notification emails",    labelFr: "Emails de notification" },
+        { id: "notif-settings", icon: "\u2699\uFE0F", label: "Notifications settings", labelFr: "Parametres notifications" },
+      ],
+    },
+  ],
+};
+
+const SIDEBAR_SELL = {
+  sections: [
+    {
+      title: "SELL", titleFr: "VENDRE", collapsible: true, defaultOpen: true,
+      items: [
+        { id: "offers",       icon: "\uD83D\uDCCB", label: "Manage offers",  labelFr: "Gerer les offres" },
+        { id: "sales",        icon: "\uD83D\uDCB0", label: "My sales",       labelFr: "Mes ventes" },
+        { id: "warehouses",   icon: "\uD83C\uDFED", label: "Warehouses",     labelFr: "Entrepots" },
+      ],
+    },
+    {
+      title: "NOTIFICATIONS", titleFr: "NOTIFICATIONS", collapsible: true, defaultOpen: true,
+      items: [
+        { id: "notif-center",   icon: "\uD83D\uDD14", label: "Notifications center",   labelFr: "Centre de notifications" },
+        { id: "notif-emails",   icon: "\u2709\uFE0F", label: "Notification emails",    labelFr: "Emails de notification" },
+        { id: "notif-settings", icon: "\u2699\uFE0F", label: "Notifications settings", labelFr: "Parametres notifications" },
+      ],
+    },
+  ],
+};
+
+const SIDEBAR_NOTIFICATIONS = {
+  sections: [
+    {
+      title: "NOTIFICATIONS", titleFr: "NOTIFICATIONS", collapsible: false, defaultOpen: true,
+      items: [
+        { id: "notif-center",   icon: "\uD83D\uDD14", label: "Notifications center",   labelFr: "Centre de notifications" },
+        { id: "notif-emails",   icon: "\u2709\uFE0F", label: "Notification emails",    labelFr: "Emails de notification" },
+        { id: "notif-settings", icon: "\u2699\uFE0F", label: "Notifications settings", labelFr: "Parametres notifications" },
+      ],
+    },
+  ],
+};
+
+const CONFIGS = {
+  buy: SIDEBAR_BUY,
+  sell: SIDEBAR_SELL,
+  notifications: SIDEBAR_NOTIFICATIONS,
+};
+
+export default function DashboardSidebar({ activeTab, activeSection, onSectionChange, lang = "fr", user, company }) {
+  const { isMobile, isTablet } = useResponsive();
+  const config = CONFIGS[activeTab];
+
+  // Profile tab has no sidebar
+  if (activeTab === "profile" || !config) return null;
+
+  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
+
+  // Tablet: collapsed icon-only sidebar
+  if (isTablet) {
+    return (
+      <div style={{
+        width: 60,
+        background: T.card,
+        borderRight: `1px solid ${T.border}`,
+        display: "flex",
+        flexDirection: "column",
+        paddingTop: 12,
+        gap: 4,
+        flexShrink: 0,
+        overflowY: "auto",
+      }}>
+        {config.sections.flatMap(s => s.items).map((item) => {
+          const active = activeSection === item.id;
+          return (
+            <button
+              key={item.id}
+              onClick={() => onSectionChange?.(item.id)}
+              title={getLabel(item)}
+              style={{
+                width: 44, height: 44, margin: "0 auto",
+                borderRadius: T.radiusSm,
+                background: active ? T.accentLight : "none",
+                border: "none",
+                fontSize: 18,
+                cursor: "pointer",
+                display: "flex", alignItems: "center", justifyContent: "center",
+                position: "relative",
+                transition: T.transitionFast,
+              }}
+              aria-label={getLabel(item)}
+            >
+              {item.icon}
+              {item.badge && (
+                <span style={{
+                  position: "absolute", top: 2, right: 2,
+                  width: 6, height: 6, borderRadius: "50%",
+                  background: T.green,
+                }} />
+              )}
+            </button>
+          );
+        })}
+      </div>
+    );
+  }
+
+  // Mobile: no sidebar (handled by bottom tab bar in layout)
+  if (isMobile) return null;
+
+  // Desktop: full sidebar
+  return (
+    <div style={{
+      width: 250,
+      background: T.card,
+      borderRight: `1px solid ${T.border}`,
+      display: "flex",
+      flexDirection: "column",
+      flexShrink: 0,
+      overflowY: "auto",
+      minHeight: "calc(100vh - 110px)",
+    }}>
+      {/* User card */}
+      {user && (
+        <div style={{
+          padding: "16px 20px",
+          borderBottom: `1px solid ${T.borderLight}`,
+          display: "flex", alignItems: "center", gap: 10,
+        }}>
+          <div style={{
+            width: 38, height: 38, borderRadius: "50%",
+            background: `linear-gradient(135deg, ${T.accent}88, #f59e0b88)`,
+            display: "flex", alignItems: "center", justifyContent: "center",
+            fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0,
+          }}>
+            {user.avatar || user.name?.[0] || "U"}
+          </div>
+          <div style={{ overflow: "hidden" }}>
+            <div style={{ fontWeight: 600, fontSize: 13, color: T.text, fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
+              {user.name}
+            </div>
+            {company && (
+              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
+                {company.name}
+              </div>
+            )}
+          </div>
+        </div>
+      )}
+
+      {/* Sections */}
+      {config.sections.map((section) => (
+        <SidebarSection
+          key={section.title}
+          section={section}
+          activeSection={activeSection}
+          onSectionChange={onSectionChange}
+          lang={lang}
+        />
+      ))}
+    </div>
+  );
+}
+
+// ── Collapsible sidebar section ────────────────────────────────────
+function SidebarSection({ section, activeSection, onSectionChange, lang }) {
+  const [open, setOpen] = useState(section.defaultOpen !== false);
+
+  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
+  const sectionTitle = lang === "fr" ? (section.titleFr || section.title) : section.title;
+
+  return (
+    <div style={{ padding: "8px 0" }}>
+      {/* Section header */}
+      <button
+        onClick={() => section.collapsible && setOpen(!open)}
+        style={{
+          width: "100%", textAlign: "left",
+          display: "flex", alignItems: "center", justifyContent: "space-between",
+          padding: "8px 20px",
+          background: "none", border: "none",
+          fontSize: 11, fontWeight: 700,
+          color: T.textMuted,
+          cursor: section.collapsible ? "pointer" : "default",
+          fontFamily: T.font,
+          letterSpacing: "0.08em",
+          textTransform: "uppercase",
+        }}
+      >
+        {sectionTitle}
+        {section.collapsible && (
+          <span style={{
+            fontSize: 10,
+            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
+            transition: T.transitionFast,
+            color: T.textMuted,
+          }}>
+            {"\u25BC"}
+          </span>
+        )}
+      </button>
+
+      {/* Items */}
+      {open && (
+        <div style={{ padding: "0 8px" }}>
+          {section.items.map((item) => {
+            const active = activeSection === item.id;
+            return (
+              <SidebarItem
+                key={item.id}
+                item={item}
+                active={active}
+                onClick={() => onSectionChange?.(item.id)}
+                lang={lang}
+              />
+            );
+          })}
+        </div>
+      )}
+    </div>
+  );
+}
+
+// ── Individual sidebar item ────────────────────────────────────────
+function SidebarItem({ item, active, onClick, lang }) {
+  const [hovered, setHovered] = useState(false);
+  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
+
+  return (
+    <button
+      onClick={onClick}
+      onMouseEnter={() => setHovered(true)}
+      onMouseLeave={() => setHovered(false)}
+      style={{
+        width: "100%", textAlign: "left",
+        display: "flex", alignItems: "center", gap: 10,
+        padding: "9px 12px",
+        borderRadius: T.radiusSm,
+        background: active ? T.accentLight : (hovered ? T.bg : "none"),
+        border: active ? `1px solid ${T.accent}20` : "1px solid transparent",
+        fontSize: 13, fontWeight: active ? 600 : 500,
+        color: active ? T.accent : T.text,
+        cursor: "pointer",
+        fontFamily: T.font,
+        transition: T.transitionFast,
+        minHeight: 40,
+        position: "relative",
+      }}
+    >
+      <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
+      <span style={{ flex: 1 }}>{getLabel(item)}</span>
+      {item.badge && (
+        <span style={{
+          background: T.greenBg, color: T.greenText,
+          fontSize: 9, fontWeight: 700,
+          padding: "1px 5px", borderRadius: 3,
+          letterSpacing: "0.03em",
+        }}>
+          {item.badge}
+        </span>
+      )}
+    </button>
+  );
+}
+
+export { SIDEBAR_BUY, SIDEBAR_SELL, SIDEBAR_NOTIFICATIONS };
diff --git a/src/components/dashboard/DashboardTopbar.jsx b/src/components/dashboard/DashboardTopbar.jsx
new file mode 100644
index 0000000..24d6329
--- /dev/null
+++ b/src/components/dashboard/DashboardTopbar.jsx
@@ -0,0 +1,283 @@
+import React, { useState, useEffect, useRef } from "react";
+import { T } from "./tokens";
+import { useResponsive } from "./shared/useResponsive";
+
+// ── Navigation config ──────────────────────────────────────────────
+const TABS = [
+  { id: "buy",  label: "BUY",  labelFr: "ACHETER" },
+  { id: "sell", label: "SELL", labelFr: "VENDRE" },
+  { id: "profile", label: "MY PROFILE", labelFr: "MON PROFIL" },
+  { id: "notifications", label: "NOTIFICATIONS", labelFr: "NOTIFICATIONS" },
+];
+
+// ── Profile dropdown items ─────────────────────────────────────────
+const PROFILE_MENU = [
+  { id: "account",    icon: "\uD83D\uDC64", label: "Account details",   labelFr: "Details du compte" },
+  { id: "password",   icon: "\uD83D\uDD12", label: "Password",          labelFr: "Mot de passe" },
+  { id: "company",    icon: "\uD83C\uDFE2", label: "Company details",   labelFr: "Details entreprise" },
+  { id: "invoices",   icon: "\uD83E\uDDFE", label: "Invoices & Fees",   labelFr: "Factures & Frais", badge: "NEW" },
+  { id: "reviews",    icon: "\u2B50",        label: "Reviews",           labelFr: "Avis" },
+  { id: "ooo",        icon: "\uD83C\uDF19",  label: "Out of office",    labelFr: "Mode absence" },
+  { id: "divider" },
+  { id: "logout",     icon: "\uD83D\uDEAA", label: "Log out",           labelFr: "Deconnexion" },
+];
+
+export default function DashboardTopbar({ activeTab, onTabChange, onProfileAction, onNotificationClick, unreadCount = 0, user, lang = "fr", onSearch }) {
+  const { isMobile, isTablet } = useResponsive();
+  const [profileOpen, setProfileOpen] = useState(false);
+  const [searchValue, setSearchValue] = useState("");
+  const [hoveredTab, setHoveredTab] = useState(null);
+  const profileRef = useRef(null);
+
+  // Close profile dropdown on outside click
+  useEffect(() => {
+    if (!profileOpen) return;
+    const handler = (e) => {
+      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
+    };
+    document.addEventListener("mousedown", handler);
+    return () => document.removeEventListener("mousedown", handler);
+  }, [profileOpen]);
+
+  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
+
+  // ── Main header bar ──────────────────────────────────────────────
+  return (
+    <div style={{ position: "sticky", top: 0, zIndex: 100, background: T.card, borderBottom: `1px solid ${T.border}` }}>
+      {/* Top row: logo, search, language, notification, user, cart */}
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        gap: isMobile ? 8 : 16,
+        padding: isMobile ? "10px 12px" : "12px 24px",
+        minHeight: 56,
+      }}>
+        {/* Logo */}
+        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}
+             onClick={() => onTabChange?.("buy")}>
+          <div style={{
+            width: 32, height: 32, borderRadius: 8,
+            background: `linear-gradient(135deg, ${T.accent}, #f59e0b)`,
+            display: "flex", alignItems: "center", justifyContent: "center",
+            fontSize: 15, fontWeight: 900, color: "#fff",
+          }}>S</div>
+          {!isMobile && (
+            <span style={{ fontWeight: 800, fontSize: 16, color: T.text, fontFamily: T.font, letterSpacing: 0.5 }}>
+              SUNTREX
+            </span>
+          )}
+        </div>
+
+        {/* Search bar */}
+        {!isMobile && (
+          <div style={{
+            flex: 1,
+            maxWidth: 480,
+            position: "relative",
+          }}>
+            <input
+              type="text"
+              placeholder={lang === "fr" ? "Rechercher un produit..." : "Search products..."}
+              value={searchValue}
+              onChange={(e) => setSearchValue(e.target.value)}
+              onKeyDown={(e) => { if (e.key === "Enter" && searchValue.trim()) onSearch?.(searchValue.trim()); }}
+              style={{
+                width: "100%",
+                padding: "8px 14px 8px 36px",
+                border: `1px solid ${T.border}`,
+                borderRadius: T.radius,
+                fontSize: 13,
+                fontFamily: T.font,
+                color: T.text,
+                background: T.bg,
+                outline: "none",
+              }}
+              aria-label={lang === "fr" ? "Rechercher un produit" : "Search products"}
+            />
+            <span style={{
+              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
+              fontSize: 14, color: T.textMuted, pointerEvents: "none",
+            }}>
+              {"\uD83D\uDD0D"}
+            </span>
+          </div>
+        )}
+
+        {/* Spacer */}
+        <div style={{ flex: 1 }} />
+
+        {/* Language/currency selector (placeholder) */}
+        {!isMobile && (
+          <button style={{
+            background: "none", border: `1px solid ${T.border}`,
+            borderRadius: T.radiusSm, padding: "6px 10px",
+            fontSize: 12, fontWeight: 500, color: T.textSec,
+            cursor: "pointer", fontFamily: T.font,
+            display: "flex", alignItems: "center", gap: 4,
+          }}>
+            {"\uD83C\uDDEB\uD83C\uDDF7"} {lang === "fr" ? "French" : "English"}-EUR {"\u25BE"}
+          </button>
+        )}
+
+        {/* Notification bell */}
+        <button
+          onClick={onNotificationClick}
+          style={{
+            background: "none", border: "none",
+            position: "relative", cursor: "pointer",
+            fontSize: 20, padding: 6,
+            minWidth: 44, minHeight: 44,
+            display: "flex", alignItems: "center", justifyContent: "center",
+          }}
+          aria-label="Notifications"
+        >
+          {"\uD83D\uDD14"}
+          {unreadCount > 0 && (
+            <span style={{
+              position: "absolute", top: 4, right: 4,
+              width: 8, height: 8, borderRadius: "50%",
+              background: T.red, border: "2px solid #fff",
+            }} />
+          )}
+        </button>
+
+        {/* User avatar */}
+        <div ref={profileRef} style={{ position: "relative" }}>
+          <button
+            onClick={() => setProfileOpen(!profileOpen)}
+            style={{
+              width: 36, height: 36, borderRadius: "50%",
+              background: `linear-gradient(135deg, ${T.accent}88, #f59e0b88)`,
+              border: profileOpen ? `2px solid ${T.accent}` : "2px solid transparent",
+              display: "flex", alignItems: "center", justifyContent: "center",
+              fontWeight: 700, fontSize: 13, color: "#fff",
+              cursor: "pointer", fontFamily: T.font,
+              transition: T.transitionFast,
+            }}
+            aria-label="User menu"
+          >
+            {user?.avatar || "U"}
+          </button>
+
+          {/* Profile dropdown */}
+          {profileOpen && (
+            <div style={{
+              position: "absolute", top: 44, right: 0,
+              width: 240,
+              background: T.card,
+              border: `1px solid ${T.border}`,
+              borderRadius: T.radius,
+              boxShadow: T.shadowLg,
+              zIndex: 300,
+              overflow: "hidden",
+              animation: "fadeIn 0.15s ease-out",
+            }}>
+              {/* User info header */}
+              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
+                <div style={{ fontWeight: 600, fontSize: 14, color: T.text, fontFamily: T.font }}>
+                  {user?.name || "User"}
+                </div>
+                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
+                  {user?.email || ""}
+                </div>
+              </div>
+
+              {PROFILE_MENU.map((item) => {
+                if (item.id === "divider") {
+                  return <div key="divider" style={{ height: 1, background: T.borderLight, margin: "4px 0" }} />;
+                }
+                return (
+                  <button
+                    key={item.id}
+                    onClick={() => {
+                      setProfileOpen(false);
+                      onProfileAction?.(item.id);
+                    }}
+                    style={{
+                      width: "100%", textAlign: "left",
+                      display: "flex", alignItems: "center", gap: 10,
+                      padding: "10px 16px",
+                      background: "none", border: "none",
+                      fontSize: 13, fontWeight: 500,
+                      color: item.id === "logout" ? T.red : T.text,
+                      cursor: "pointer", fontFamily: T.font,
+                      transition: T.transitionFast,
+                      minHeight: 40,
+                    }}
+                    onMouseEnter={(e) => e.currentTarget.style.background = T.bg}
+                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
+                  >
+                    <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
+                    <span>{getLabel(item)}</span>
+                    {item.badge && (
+                      <span style={{
+                        marginLeft: "auto",
+                        background: T.greenBg, color: T.greenText,
+                        fontSize: 10, fontWeight: 700,
+                        padding: "1px 6px", borderRadius: 4,
+                      }}>
+                        {item.badge}
+                      </span>
+                    )}
+                  </button>
+                );
+              })}
+            </div>
+          )}
+        </div>
+      </div>
+
+      {/* Bottom row: BUY | SELL | MY PROFILE | NOTIFICATIONS tabs */}
+      {!isMobile && (
+        <div style={{
+          display: "flex",
+          gap: 0,
+          padding: "0 24px",
+          borderTop: `1px solid ${T.borderLight}`,
+        }}>
+          {TABS.map((tab) => {
+            const active = activeTab === tab.id;
+            const hovered = hoveredTab === tab.id;
+            return (
+              <button
+                key={tab.id}
+                onClick={() => onTabChange?.(tab.id)}
+                onMouseEnter={() => setHoveredTab(tab.id)}
+                onMouseLeave={() => setHoveredTab(null)}
+                style={{
+                  background: "none",
+                  border: "none",
+                  borderBottom: `3px solid ${active ? T.green : "transparent"}`,
+                  padding: "12px 20px",
+                  fontSize: 13,
+                  fontWeight: active ? 700 : 600,
+                  color: active ? T.text : (hovered ? T.text : T.textSec),
+                  cursor: "pointer",
+                  fontFamily: T.font,
+                  transition: T.transitionFast,
+                  letterSpacing: "0.03em",
+                  position: "relative",
+                  minHeight: 44,
+                }}
+              >
+                {tab.label}
+                {tab.id === "notifications" && unreadCount > 0 && (
+                  <span style={{
+                    marginLeft: 6,
+                    background: T.red, color: "#fff",
+                    borderRadius: 10, padding: "1px 6px",
+                    fontSize: 10, fontWeight: 700,
+                  }}>
+                    {unreadCount}
+                  </span>
+                )}
+              </button>
+            );
+          })}
+        </div>
+      )}
+    </div>
+  );
+}
+
+export { TABS, PROFILE_MENU };
diff --git a/src/components/dashboard/SellerDashboard.jsx b/src/components/dashboard/SellerDashboard.jsx
new file mode 100644
index 0000000..9d8a6aa
--- /dev/null
+++ b/src/components/dashboard/SellerDashboard.jsx
@@ -0,0 +1,593 @@
+import { useState } from "react";
+import DashboardLayout from "./DashboardLayout";
+import { BRAND, fmt, ORDER_STATUS, STRIPE_STATUS, MOCK_SELLER, useDashboardResponsive } from "./dashboardUtils";
+
+// ── StatCard (shared) ─────────────────────────────────────────────────
+function StatCard({ icon, label, value, sub, color, trend }) {
+  return (
+    <div style={{
+      background: BRAND.white, borderRadius: 12,
+      padding: "18px 20px",
+      border: `1px solid ${BRAND.border}`,
+      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
+    }}>
+      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
+        <div>
+          <div style={{ fontSize: 12, color: BRAND.gray, fontWeight: 500, marginBottom: 6 }}>{label}</div>
+          <div style={{ fontSize: 24, fontWeight: 800, color: BRAND.dark }}>{value}</div>
+          {sub && <div style={{ fontSize: 11, color: BRAND.lightGray, marginTop: 4 }}>{sub}</div>}
+        </div>
+        <div style={{
+          width: 42, height: 42, borderRadius: 10,
+          background: `${color || BRAND.orange}15`,
+          display: "flex", alignItems: "center", justifyContent: "center",
+          fontSize: 20,
+        }}>
+          {icon}
+        </div>
+      </div>
+      {trend !== undefined && (
+        <div style={{ marginTop: 10, fontSize: 12, color: trend >= 0 ? BRAND.green : BRAND.red, fontWeight: 600 }}>
+          {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}% vs mois dernier
+        </div>
+      )}
+    </div>
+  );
+}
+
+// ── Mini bar chart for revenue ────────────────────────────────────────
+function RevenueChart({ data }) {
+  const max = Math.max(...data.map(d => d.value));
+  return (
+    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: "18px 20px" }}>
+      <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark, marginBottom: 16 }}>Revenus mensuels</div>
+      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
+        {data.map((d, i) => {
+          const h = Math.max(8, Math.round((d.value / max) * 100));
+          const isLast = i === data.length - 1;
+          return (
+            <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
+              <div style={{ fontSize: 10, fontWeight: isLast ? 800 : 500, color: isLast ? BRAND.orange : BRAND.lightGray, whiteSpace: "nowrap" }}>
+                {isLast ? fmt.price(d.value) : ""}
+              </div>
+              <div style={{
+                width: "100%", maxWidth: 48, height: `${h}%`, minHeight: 4,
+                background: isLast
+                  ? `linear-gradient(to top, ${BRAND.orange}, ${BRAND.amber})`
+                  : `${BRAND.dark}15`,
+                borderRadius: "4px 4px 0 0",
+                transition: "height 0.3s ease",
+              }} />
+              <div style={{ fontSize: 10, color: BRAND.lightGray, fontWeight: isLast ? 700 : 400 }}>{d.month}</div>
+            </div>
+          );
+        })}
+      </div>
+    </div>
+  );
+}
+
+// ── Stripe Connect Status Banner ──────────────────────────────────────
+function StripeBanner({ status }) {
+  const st = STRIPE_STATUS[status] || STRIPE_STATUS.not_started;
+  if (status === "active") return null;
+  return (
+    <div style={{
+      background: st.bg, border: `1px solid ${st.color}33`,
+      borderRadius: 10, padding: "14px 18px",
+      display: "flex", alignItems: "center", justifyContent: "space-between",
+      gap: 12, flexWrap: "wrap",
+    }}>
+      <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 200 }}>
+        <span style={{ fontSize: 22 }}>{status === "pending" ? "\u26A0\uFE0F" : "\uD83D\uDCB3"}</span>
+        <div>
+          <div style={{ fontWeight: 700, fontSize: 14, color: st.color }}>
+            Paiements Stripe : {st.label}
+          </div>
+          <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
+            {status === "not_started" && "Activez votre compte vendeur pour recevoir des paiements."}
+            {status === "pending" && "Finalisez la v\u00e9rification de votre identit\u00e9 pour activer les virements."}
+            {status === "restricted" && "Un probl\u00e8me n\u00e9cessite votre attention imm\u00e9diate."}
+          </div>
+        </div>
+      </div>
+      {st.cta && (
+        <button style={{
+          background: st.color, color: "#fff",
+          border: "none", borderRadius: 8,
+          padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
+          whiteSpace: "nowrap", fontFamily: "inherit", minHeight: 44,
+        }}>
+          {st.cta} \u2192
+        </button>
+      )}
+    </div>
+  );
+}
+
+// ── Listing row ───────────────────────────────────────────────────────
+function ListingRow({ listing, isMobile }) {
+  const [menuOpen, setMenuOpen] = useState(false);
+  const statusConfig = {
+    active:  { label: "Actif",     color: BRAND.green, bg: BRAND.greenLight },
+    soldout: { label: "Rupture",   color: BRAND.red,   bg: BRAND.redLight },
+    paused:  { label: "Paus\u00e9", color: BRAND.amber, bg: BRAND.amberLight },
+    draft:   { label: "Brouillon", color: BRAND.gray,  bg: "#f1f5f9" },
+  };
+  const st = statusConfig[listing.status] || statusConfig.draft;
+
+  if (isMobile) {
+    return (
+      <div style={{
+        display: "flex", justifyContent: "space-between", alignItems: "center",
+        padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, gap: 12,
+      }}>
+        <div style={{ flex: 1, minWidth: 0 }}>
+          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{listing.name}</div>
+          <div style={{ fontSize: 11, color: BRAND.lightGray, fontFamily: "monospace" }}>{listing.sku}</div>
+          <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
+            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{fmt.price(listing.price)}</span>
+            <span style={{ fontSize: 11, color: listing.stock > 0 ? BRAND.green : BRAND.red }}>
+              {listing.stock > 0 ? `${listing.stock} stock` : "Rupture"}
+            </span>
+          </div>
+        </div>
+        <span style={{ padding: "3px 9px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
+          {st.label}
+        </span>
+      </div>
+    );
+  }
+
+  return (
+    <div style={{
+      display: "grid",
+      gridTemplateColumns: "1fr 80px 70px 60px 60px 90px",
+      gap: 12, alignItems: "center",
+      padding: "12px 16px",
+      borderBottom: `1px solid ${BRAND.border}`,
+      transition: "background 0.12s",
+    }}
+    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
+    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
+    >
+      <div>
+        <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.dark }}>{listing.name}</div>
+        <div style={{ fontSize: 11, color: BRAND.lightGray, fontFamily: "monospace" }}>{listing.sku}</div>
+      </div>
+      <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt.price(listing.price)}</div>
+      <div style={{ fontSize: 12, color: listing.stock > 0 ? BRAND.green : BRAND.red, fontWeight: 600 }}>{listing.stock}</div>
+      <div style={{ fontSize: 12, color: BRAND.gray }}>{listing.views}</div>
+      <div style={{ fontSize: 12, color: BRAND.gray }}>{listing.orders}</div>
+      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
+        <span style={{ padding: "3px 9px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
+          {st.label}
+        </span>
+        <div style={{ position: "relative" }}>
+          <button
+            onClick={() => setMenuOpen(!menuOpen)}
+            style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: BRAND.gray, fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
+          >{"\u22EF"}</button>
+          {menuOpen && (
+            <div style={{
+              position: "absolute", right: 0, top: 32,
+              background: BRAND.white, border: `1px solid ${BRAND.border}`,
+              borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
+              zIndex: 50, minWidth: 150, overflow: "hidden",
+            }}>
+              {[
+                { label: "\u270F\uFE0F Modifier", color: BRAND.dark },
+                { label: "\u23F8 Mettre en pause", color: BRAND.dark },
+                { label: "\uD83D\uDCCA Statistiques", color: BRAND.dark },
+                { label: "\uD83D\uDDD1 Supprimer", color: BRAND.red },
+              ].map(action => (
+                <button key={action.label} onClick={() => setMenuOpen(false)} style={{
+                  display: "block", width: "100%", padding: "9px 14px",
+                  background: "none", border: "none",
+                  textAlign: "left", fontSize: 13, color: action.color,
+                  cursor: "pointer", fontFamily: "inherit",
+                }}
+                onMouseEnter={e => { e.target.style.background = BRAND.light; }}
+                onMouseLeave={e => { e.target.style.background = "none"; }}
+                >
+                  {action.label}
+                </button>
+              ))}
+            </div>
+          )}
+        </div>
+      </div>
+    </div>
+  );
+}
+
+// ── Seller order row (with fee/net) ───────────────────────────────────
+function SellerOrderRow({ order, isMobile }) {
+  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
+  if (isMobile) {
+    return (
+      <div style={{
+        display: "flex", justifyContent: "space-between", alignItems: "center",
+        padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, gap: 12,
+      }}>
+        <div style={{ flex: 1, minWidth: 0 }}>
+          <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: BRAND.dark }}>{order.id}</div>
+          <div style={{ fontSize: 12, color: BRAND.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.buyer} \u00b7 {order.product}</div>
+          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginTop: 2 }}>{fmt.price(order.amount)}</div>
+        </div>
+        <span style={{
+          padding: "3px 9px", borderRadius: 20,
+          background: st.bg, color: st.color,
+          fontSize: 11, fontWeight: 700, flexShrink: 0,
+        }}>
+          {st.icon} {st.label}
+        </span>
+      </div>
+    );
+  }
+  return (
+    <div style={{
+      display: "grid",
+      gridTemplateColumns: "110px 1fr 120px 90px 60px 70px 90px",
+      gap: 12, alignItems: "center",
+      padding: "12px 16px",
+      borderBottom: `1px solid ${BRAND.border}`,
+      transition: "background 0.12s",
+    }}
+    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
+    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
+    >
+      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: BRAND.dark }}>{order.id}</span>
+      <div>
+        <div style={{ fontSize: 13, fontWeight: 500 }}>{order.product}</div>
+        <div style={{ fontSize: 11, color: BRAND.lightGray }}>{order.buyer}</div>
+      </div>
+      <span style={{ fontSize: 12, color: BRAND.gray }}>{fmt.date(order.date)}</span>
+      <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt.price(order.amount)}</span>
+      <span style={{ fontSize: 12, color: BRAND.red, fontWeight: 600 }}>-{fmt.price(order.fee)}</span>
+      <span style={{ fontWeight: 700, fontSize: 13, color: BRAND.green }}>{fmt.price(order.net)}</span>
+      <span style={{
+        padding: "3px 9px", borderRadius: 20,
+        background: st.bg, color: st.color,
+        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", textAlign: "center",
+      }}>
+        {st.icon} {st.label}
+      </span>
+    </div>
+  );
+}
+
+// ── Seller tabs ───────────────────────────────────────────────────────
+const SELLER_TABS = (data) => [
+  { id: "overview", icon: "\uD83D\uDCCA", label: "Vue d'ensemble",  badge: 0 },
+  { id: "orders",   icon: "\uD83D\uDCE6", label: "Commandes",       badge: data.orders.filter(o => o.status === "pending").length },
+  { id: "listings", icon: "\uD83C\uDFF7\uFE0F", label: "Mes annonces", badge: data.listings.filter(l => l.status === "soldout").length },
+  { id: "payouts",  icon: "\uD83D\uDCB6", label: "Paiements",       badge: 0 },
+  { id: "chat",     icon: "\uD83D\uDCAC", label: "Messages",        badge: 2 },
+  { id: "stripe",   icon: "\uD83D\uDCB3", label: "Stripe Connect",  badge: 0 },
+  { id: "profile",  icon: "\uD83C\uDFE2", label: "Mon entreprise",  badge: 0 },
+];
+
+// ── SellerOverview ────────────────────────────────────────────────────
+function SellerOverview({ data, isMobile }) {
+  const st = data.stats;
+  return (
+    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
+      <StripeBanner status={data.stripeStatus} />
+
+      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
+        <StatCard icon="\uD83D\uDCB6" label="Revenus ce mois" value={fmt.price(st.monthRevenue)} color={BRAND.green} trend={14.8} />
+        <StatCard icon="\uD83D\uDCE6" label="Commandes totales" value={fmt.number(st.totalOrders)} color={BRAND.blue} />
+        <StatCard icon="\uD83D\uDCB8" label="En attente virement" value={fmt.price(st.pendingPayouts)} color={BRAND.amber} />
+        <StatCard icon="\u2B50" label="Note vendeur" value={`${st.avgRating}/5`} color={BRAND.orange} sub={`${st.totalReviews} avis`} />
+      </div>
+
+      {/* Chart + Performance */}
+      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", gap: 18 }}>
+        <RevenueChart data={data.monthlyRevenue} />
+
+        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
+          <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark }}>Performance</div>
+          {[
+            { label: "Annonces actives", value: st.activeListings, icon: "\uD83C\uDFF7\uFE0F" },
+            { label: "Taux de conversion", value: `${st.conversionRate}%`, icon: "\uD83D\uDCC8" },
+            { label: "Temps de r\u00e9ponse", value: st.responseTime, icon: "\u26A1" },
+            { label: "CA total", value: fmt.price(st.totalRevenue), icon: "\uD83D\uDCB6" },
+          ].map(row => (
+            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${BRAND.border}` }}>
+              <span style={{ fontSize: 13, color: BRAND.gray }}>
+                <span style={{ marginRight: 6 }}>{row.icon}</span>{row.label}
+              </span>
+              <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{row.value}</span>
+            </div>
+          ))}
+        </div>
+      </div>
+
+      {/* Recent orders */}
+      <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
+        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between" }}>
+          <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark }}>Derni\u00e8res commandes</div>
+          <button style={{ background: "none", border: "none", color: BRAND.orange, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Voir tout \u2192</button>
+        </div>
+        {data.orders.slice(0, 4).map(o => <SellerOrderRow key={o.id} order={o} isMobile={isMobile} />)}
+      </div>
+    </div>
+  );
+}
+
+// ── SellerListings ────────────────────────────────────────────────────
+function SellerListings({ data, isMobile }) {
+  const [search, setSearch] = useState("");
+  const filtered = data.listings.filter(l =>
+    l.name.toLowerCase().includes(search.toLowerCase()) ||
+    l.sku.toLowerCase().includes(search.toLowerCase())
+  );
+
+  return (
+    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
+      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
+        <input
+          placeholder="Rechercher une annonce..."
+          value={search} onChange={e => setSearch(e.target.value)}
+          style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
+        />
+        <button style={{
+          background: BRAND.orange, color: "#fff", border: "none",
+          borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
+          whiteSpace: "nowrap", fontFamily: "inherit", minHeight: 44,
+        }}>
+          + Nouvelle annonce
+        </button>
+        <button style={{
+          background: BRAND.white, color: BRAND.dark, border: `1px solid ${BRAND.border}`,
+          borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer",
+          fontFamily: "inherit", minHeight: 44,
+        }}>
+          \uD83D\uDCE5 Import XLSX
+        </button>
+      </div>
+
+      {!isMobile && (
+        <div style={{
+          display: "grid", gridTemplateColumns: "1fr 80px 70px 60px 60px 90px",
+          gap: 12, padding: "10px 16px",
+          background: BRAND.light, borderBottom: `1px solid ${BRAND.border}`,
+          fontSize: 11, fontWeight: 700, color: BRAND.lightGray, textTransform: "uppercase", letterSpacing: 0.5,
+        }}>
+          <span>Produit</span><span>Prix HT</span><span>Stock</span><span>Vues</span><span>Ventes</span><span>Actions</span>
+        </div>
+      )}
+
+      {filtered.length === 0 ? (
+        <div style={{ padding: 40, textAlign: "center", color: BRAND.lightGray }}>
+          <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDD0D"}</div>
+          Aucune annonce trouv\u00e9e
+        </div>
+      ) : filtered.map(l => <ListingRow key={l.id} listing={l} isMobile={isMobile} />)}
+    </div>
+  );
+}
+
+// ── SellerPayouts ─────────────────────────────────────────────────────
+function SellerPayouts({ data, isMobile }) {
+  const paidTotal = data.payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
+  return (
+    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
+      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
+        <StatCard icon="\u23F3" label="En attente" value={fmt.price(data.stats.pendingPayouts)} color={BRAND.amber} />
+        <StatCard icon="\u2705" label="Vers\u00e9 ce mois" value={fmt.price(paidTotal)} color={BRAND.green} />
+        <StatCard icon="\uD83D\uDCB6" label="Total vers\u00e9" value={fmt.price(Math.round(data.stats.totalRevenue * 0.94))} color={BRAND.blue} />
+      </div>
+
+      <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
+        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, fontWeight: 700, fontSize: 14, color: BRAND.dark }}>
+          Historique des virements
+        </div>
+        {data.payouts.map((p, i) => (
+          <div key={i} style={{
+            display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr 120px 100px 120px",
+            gap: 12, alignItems: "center",
+            padding: "14px 20px",
+            borderBottom: `1px solid ${BRAND.border}`,
+          }}>
+            {isMobile ? (
+              <>
+                <div>
+                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt.price(p.amount)}</div>
+                  <div style={{ fontSize: 11, color: BRAND.lightGray }}>{fmt.date(p.date)} \u00b7 {p.ref}</div>
+                </div>
+                <span style={{
+                  padding: "3px 10px", borderRadius: 20,
+                  background: p.status === "paid" ? BRAND.greenLight : BRAND.amberLight,
+                  color: p.status === "paid" ? BRAND.green : BRAND.amber,
+                  fontSize: 11, fontWeight: 700,
+                }}>
+                  {p.status === "paid" ? "\u2705 Re\u00e7u" : "\u23F3 En cours"}
+                </span>
+              </>
+            ) : (
+              <>
+                <div style={{ fontSize: 12, fontFamily: "monospace", color: BRAND.lightGray }}>{p.ref}</div>
+                <div style={{ fontSize: 13, color: BRAND.gray }}>{fmt.date(p.date)}</div>
+                <div style={{ fontWeight: 700, fontSize: 15, color: BRAND.dark }}>{fmt.price(p.amount)}</div>
+                <span style={{
+                  padding: "4px 12px", borderRadius: 20,
+                  background: p.status === "paid" ? BRAND.greenLight : BRAND.amberLight,
+                  color: p.status === "paid" ? BRAND.green : BRAND.amber,
+                  fontSize: 12, fontWeight: 700, textAlign: "center",
+                }}>
+                  {p.status === "paid" ? "\u2705 Re\u00e7u" : "\u23F3 En cours"}
+                </span>
+              </>
+            )}
+          </div>
+        ))}
+      </div>
+
+      {/* Commission explainer */}
+      <div style={{
+        background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
+        borderRadius: 12, padding: "18px 22px", color: "#fff",
+      }}>
+        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{"\uD83D\uDCA1"} Commission SUNTREX</div>
+        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
+          SUNTREX pr\u00e9l\u00e8ve une commission de <strong style={{ color: BRAND.amber }}>6%</strong> sur chaque vente \u2014
+          soit 5% en dessous de nos concurrents (sun.store : ~11%). Aucun abonnement mensuel.
+          Vous ne payez qu{"'"}en cas de vente.
+        </div>
+      </div>
+    </div>
+  );
+}
+
+// ── SellerStripePanel ─────────────────────────────────────────────────
+function SellerStripePanel({ status }) {
+  const st = STRIPE_STATUS[status] || STRIPE_STATUS.not_started;
+  return (
+    <div style={{ maxWidth: 560 }}>
+      <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: isMobile ? 20 : 28 }}>
+        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
+          <div style={{ fontSize: 40 }}>{"\uD83D\uDCB3"}</div>
+          <div>
+            <div style={{ fontWeight: 800, fontSize: 18, color: BRAND.dark }}>Stripe Connect</div>
+            <div style={{ fontSize: 13, color: BRAND.gray, marginTop: 2 }}>Gestion de vos paiements et virements</div>
+          </div>
+        </div>
+
+        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: st.bg, borderRadius: 10 }}>
+          <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.color }} />
+          <div style={{ fontWeight: 700, fontSize: 14, color: st.color }}>{st.label}</div>
+        </div>
+
+        {[
+          { icon: "\u2705", label: "Recevoir des paiements", active: status === "active" },
+          { icon: status === "active" ? "\u2705" : "\u23F3", label: "Virements bancaires", active: status === "active" },
+          { icon: "\u2705", label: "Protection disputes Stripe", active: true },
+          { icon: "\u2705", label: "3D Secure / SCA Europe", active: true },
+          { icon: "\u2705", label: "Rapports financiers", active: status === "active" },
+        ].map(item => (
+          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BRAND.border}` }}>
+            <span style={{ fontSize: 16 }}>{item.icon}</span>
+            <span style={{ fontSize: 13, color: item.active ? BRAND.dark : BRAND.lightGray, fontWeight: item.active ? 500 : 400 }}>
+              {item.label}
+            </span>
+          </div>
+        ))}
+
+        {st.cta && (
+          <button style={{
+            marginTop: 20, width: "100%",
+            background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.amber})`,
+            color: "#fff", border: "none", borderRadius: 10,
+            padding: "12px 0", fontWeight: 800, fontSize: 15, cursor: "pointer",
+            fontFamily: "inherit", minHeight: 48,
+          }}>
+            {st.cta} \u2192
+          </button>
+        )}
+      </div>
+    </div>
+  );
+}
+
+// ── Seller Orders (with fee/net columns) ──────────────────────────────
+function SellerOrders({ data, isMobile }) {
+  const [filter, setFilter] = useState("all");
+  const filtered = filter === "all" ? data.orders : data.orders.filter(o => o.status === filter);
+
+  return (
+    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
+      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
+        {["all", "pending", "paid", "shipped", "delivered", "disputed"].map(s => (
+          <button key={s} onClick={() => setFilter(s)} style={{
+            padding: "5px 14px", borderRadius: 20,
+            border: `1.5px solid ${filter === s ? BRAND.orange : BRAND.border}`,
+            background: filter === s ? BRAND.orange : BRAND.white,
+            color: filter === s ? "#fff" : BRAND.gray,
+            fontSize: 12, fontWeight: filter === s ? 700 : 500,
+            cursor: "pointer", fontFamily: "inherit", minHeight: 32,
+          }}>
+            {s === "all" ? "Toutes" : (ORDER_STATUS[s]?.label || s)}
+          </button>
+        ))}
+      </div>
+
+      {!isMobile && (
+        <div style={{
+          display: "grid", gridTemplateColumns: "110px 1fr 120px 90px 60px 70px 90px",
+          gap: 12, padding: "10px 16px",
+          background: BRAND.light, borderBottom: `1px solid ${BRAND.border}`,
+          fontSize: 11, fontWeight: 700, color: BRAND.lightGray, textTransform: "uppercase", letterSpacing: 0.5,
+        }}>
+          <span>N\u00b0</span><span>Produit / Acheteur</span><span>Date</span><span>Montant</span><span>Comm.</span><span>Net</span><span>Statut</span>
+        </div>
+      )}
+
+      {filtered.length === 0 ? (
+        <div style={{ padding: 40, textAlign: "center", color: BRAND.lightGray }}>
+          <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDCED"}</div>
+          Aucune commande trouv\u00e9e
+        </div>
+      ) : filtered.map(o => <SellerOrderRow key={o.id} order={o} isMobile={isMobile} />)}
+    </div>
+  );
+}
+
+// ── MAIN SellerDashboard ──────────────────────────────────────────────
+export default function SellerDashboard() {
+  const { isMobile } = useDashboardResponsive();
+  const [tab, setTab] = useState("overview");
+  const data = MOCK_SELLER;
+  const tabs = SELLER_TABS(data);
+
+  const renderContent = () => {
+    switch (tab) {
+      case "overview": return <SellerOverview data={data} isMobile={isMobile} />;
+      case "orders":   return <SellerOrders data={data} isMobile={isMobile} />;
+      case "listings": return <SellerListings data={data} isMobile={isMobile} />;
+      case "payouts":  return <SellerPayouts data={data} isMobile={isMobile} />;
+      case "stripe":   return <SellerStripePanel status={data.stripeStatus} />;
+      case "chat":     return (
+        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: 40, textAlign: "center", color: BRAND.lightGray }}>
+          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\uD83D\uDCAC"}</div>
+          <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.dark }}>Messagerie int\u00e9gr\u00e9e</div>
+          <div style={{ fontSize: 13, marginTop: 6 }}>SuntrexSupportChat + messages acheteurs ici</div>
+        </div>
+      );
+      case "profile":  return (
+        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: isMobile ? 20 : 28, maxWidth: 560 }}>
+          <div style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark, marginBottom: 20 }}>Profil entreprise</div>
+          {[
+            ["Nom", data.user.name], ["Email", data.user.email],
+            ["Soci\u00e9t\u00e9", data.company.name], ["TVA", data.company.vat],
+            ["Pays", data.company.country], ["Type", data.company.type],
+          ].map(([k, v]) => (
+            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BRAND.border}` }}>
+              <span style={{ fontSize: 13, color: BRAND.gray, fontWeight: 500 }}>{k}</span>
+              <span style={{ fontSize: 13, color: BRAND.dark, fontWeight: 600 }}>{v}</span>
+            </div>
+          ))}
+        </div>
+      );
+      default: return null;
+    }
+  };
+
+  return (
+    <DashboardLayout
+      user={data.user}
+      company={data.company}
+      notifications={data.notifications}
+      activeTab={tab}
+      onTabChange={setTab}
+      tabs={tabs}
+      role="seller"
+    >
+      {renderContent()}
+    </DashboardLayout>
+  );
+}
+
+// Fix: isMobile reference in SellerStripePanel
+var isMobile = typeof window !== "undefined" && window.innerWidth < 768;
diff --git a/src/components/dashboard/buy/BuyerOverview.jsx b/src/components/dashboard/buy/BuyerOverview.jsx
new file mode 100644
index 0000000..5a3e6e6
--- /dev/null
+++ b/src/components/dashboard/buy/BuyerOverview.jsx
@@ -0,0 +1,63 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import StatCard from "../shared/StatCard";
+import { useDashboard } from "../DashboardLayout";
+import { MOCK_BUYER } from "../dashboardUtils";
+
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+
+export default function BuyerOverview() {
+  const { isMobile } = useResponsive();
+  const { lang, setActiveSection } = useDashboard();
+  const stats = MOCK_BUYER.stats;
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Vue d'ensemble" : "Overview"}
+      </h1>
+
+      <div style={{
+        display: "grid",
+        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
+        gap: isMobile ? 12 : 16,
+        marginBottom: 24,
+      }}>
+        <StatCard icon={"\uD83D\uDCE6"} label={lang === "fr" ? "Commandes" : "Orders"} value={stats.totalOrders} trend={{ value: "+12%", positive: true }} subtitle={lang === "fr" ? "ce mois" : "this month"} onClick={() => setActiveSection("purchases")} />
+        <StatCard icon={"\uD83D\uDCB0"} label={lang === "fr" ? "Total depense" : "Total spent"} value={formatPrice(stats.totalSpend)} trend={{ value: "+8%", positive: true }} />
+        <StatCard icon={"\u23F3"} label={lang === "fr" ? "En cours" : "Pending"} value={stats.pendingOrders} />
+        <StatCard icon={"\uD83D\uDCC4"} label={lang === "fr" ? "RFQ actifs" : "Active RFQs"} value={stats.activeRFQs} onClick={() => setActiveSection("rfq")} />
+      </div>
+
+      {/* SUNTREX Finance promo card */}
+      <div style={{
+        background: `linear-gradient(135deg, ${T.sidebar} 0%, #2a2d36 100%)`,
+        borderRadius: T.radiusLg,
+        padding: isMobile ? 20 : 28,
+        color: "#fff",
+        marginBottom: 24,
+      }}>
+        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>
+          SUNTREX FINANCE
+        </div>
+        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, fontFamily: T.font, marginBottom: 8 }}>
+          {lang === "fr" ? "Financez vos achats solaires" : "Finance your solar purchases"}
+        </div>
+        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: T.font, lineHeight: 1.5, marginBottom: 16, maxWidth: 500 }}>
+          {lang === "fr"
+            ? "Paiement en 3x ou 4x sans frais, credit professionnel et leasing. Solutions adaptees aux installateurs et distributeurs."
+            : "Pay in 3 or 4 installments interest-free, professional credit and leasing. Solutions for installers and distributors."}
+        </p>
+        <button style={{
+          background: T.accent, color: "#fff",
+          border: "none", borderRadius: T.radiusSm,
+          padding: "10px 20px", fontSize: 13, fontWeight: 600,
+          cursor: "pointer", fontFamily: T.font,
+        }}>
+          {lang === "fr" ? "En savoir plus" : "Learn more"}
+        </button>
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/buy/BuyerRFQ.jsx b/src/components/dashboard/buy/BuyerRFQ.jsx
new file mode 100644
index 0000000..6e53fa8
--- /dev/null
+++ b/src/components/dashboard/buy/BuyerRFQ.jsx
@@ -0,0 +1,117 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+const MOCK_RFQS = [
+  { id: "RFQ-024", product: "Enphase IQ8-HC", qty: 100, status: "open", quotes: 3, deadline: "2026-03-05", createdAt: "2026-02-20" },
+  { id: "RFQ-025", product: "JA Solar JAM54S30 420Wc", qty: 500, status: "open", quotes: 7, deadline: "2026-03-08", createdAt: "2026-02-22" },
+  { id: "RFQ-026", product: "Huawei LUNA2000-5-E0", qty: 10, status: "closed", quotes: 4, deadline: "2026-02-20", createdAt: "2026-02-12" },
+];
+
+const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
+
+export default function BuyerRFQ() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [filter, setFilter] = useState("all");
+
+  const filtered = filter === "all" ? MOCK_RFQS : MOCK_RFQS.filter(r => r.status === filter);
+
+  return (
+    <div>
+      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
+        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+          {lang === "fr" ? "Demandes de devis" : "Requests for Proposals"}
+        </h1>
+        <button style={{
+          background: T.accent, color: "#fff",
+          border: "none", borderRadius: T.radiusSm,
+          padding: "8px 16px", fontSize: 13, fontWeight: 600,
+          cursor: "pointer", fontFamily: T.font, minHeight: 40,
+        }}>
+          {lang === "fr" ? "+ Nouvelle demande" : "+ New request"}
+        </button>
+      </div>
+
+      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
+        {[
+          { id: "all", label: "All", labelFr: "Tout" },
+          { id: "open", label: "Open", labelFr: "Ouvertes" },
+          { id: "closed", label: "Closed", labelFr: "Fermees" },
+        ].map(tab => (
+          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
+            background: filter === tab.id ? T.text : T.card,
+            color: filter === tab.id ? "#fff" : T.textSec,
+            border: filter === tab.id ? "none" : `1px solid ${T.border}`,
+            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
+            cursor: "pointer", fontFamily: T.font, minHeight: 34,
+          }}>
+            {lang === "fr" ? tab.labelFr : tab.label}
+          </button>
+        ))}
+      </div>
+
+      {filtered.length === 0 ? (
+        <EmptyState
+          icon={"\uD83D\uDCC4"}
+          title={lang === "fr" ? "Aucune demande de devis" : "No RFQs"}
+          description={lang === "fr" ? "Creez une demande pour recevoir des offres de vendeurs." : "Create a request to receive offers from sellers."}
+        />
+      ) : (
+        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
+          {filtered.map(rfq => (
+            <div key={rfq.id} style={{
+              background: T.card, borderRadius: T.radius,
+              border: `1px solid ${T.border}`, padding: 20,
+            }}>
+              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
+                <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, fontFamily: T.font }}>{rfq.id}</span>
+                <span style={{
+                  padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: T.font,
+                  background: rfq.status === "open" ? T.greenBg : "#f1f5f9",
+                  color: rfq.status === "open" ? T.greenText : T.textMuted,
+                }}>
+                  {rfq.status === "open" ? (lang === "fr" ? "Ouverte" : "Open") : (lang === "fr" ? "Fermee" : "Closed")}
+                </span>
+              </div>
+              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 4 }}>
+                {rfq.product}
+              </div>
+              <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, marginBottom: 12 }}>
+                {lang === "fr" ? "Quantite" : "Quantity"}: {rfq.qty} pcs
+              </div>
+              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
+                <div>
+                  <span style={{
+                    background: T.blueBg, color: T.blueText,
+                    padding: "3px 10px", borderRadius: 99,
+                    fontSize: 12, fontWeight: 600, fontFamily: T.font,
+                  }}>
+                    {rfq.quotes} {lang === "fr" ? "offres" : "quotes"}
+                  </span>
+                </div>
+                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>
+                  {lang === "fr" ? "Expire:" : "Expires:"} {formatDate(rfq.deadline)}
+                </div>
+              </div>
+              {rfq.status === "open" && (
+                <button style={{
+                  marginTop: 12, width: "100%",
+                  background: T.accentLight, color: T.accent,
+                  border: `1px solid ${T.accent}30`,
+                  borderRadius: T.radiusSm,
+                  padding: "8px 0", fontSize: 13, fontWeight: 600,
+                  cursor: "pointer", fontFamily: T.font,
+                }}>
+                  {lang === "fr" ? "Voir les offres" : "View quotes"}
+                </button>
+              )}
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/buy/DeliveryAddresses.jsx b/src/components/dashboard/buy/DeliveryAddresses.jsx
new file mode 100644
index 0000000..0569a8e
--- /dev/null
+++ b/src/components/dashboard/buy/DeliveryAddresses.jsx
@@ -0,0 +1,92 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+const MOCK_ADDRESSES = [
+  { id: 1, label: "Siege social", name: "SolarPro France", street: "45 Avenue de la Republique", city: "Paris", zip: "75011", country: "FR", phone: "+33 1 42 00 00 00", isDefault: true },
+  { id: 2, label: "Entrepot Sud", name: "SolarPro France", street: "12 Zone Industrielle", city: "Marseille", zip: "13015", country: "FR", phone: "+33 4 91 00 00 00", isDefault: false },
+];
+
+const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };
+
+export default function DeliveryAddresses() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [addresses] = useState(MOCK_ADDRESSES);
+
+  return (
+    <div>
+      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
+        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+          {lang === "fr" ? "Adresses de livraison" : "Delivery addresses"}
+        </h1>
+        <button style={{
+          background: T.accent, color: "#fff",
+          border: "none", borderRadius: T.radiusSm,
+          padding: "8px 16px", fontSize: 13, fontWeight: 600,
+          cursor: "pointer", fontFamily: T.font, minHeight: 40,
+        }}>
+          {lang === "fr" ? "+ Ajouter" : "+ Add"}
+        </button>
+      </div>
+
+      {addresses.length === 0 ? (
+        <EmptyState
+          icon={"\uD83D\uDCCD"}
+          title={lang === "fr" ? "Aucune adresse enregistree" : "No addresses saved"}
+          description={lang === "fr" ? "Ajoutez une adresse de livraison pour vos commandes." : "Add a delivery address for your orders."}
+          actionLabel={lang === "fr" ? "Ajouter une adresse" : "Add address"}
+        />
+      ) : (
+        <div style={{
+          display: "grid",
+          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
+          gap: 16,
+        }}>
+          {addresses.map((addr) => (
+            <div key={addr.id} style={{
+              background: T.card,
+              borderRadius: T.radius,
+              border: `1px solid ${addr.isDefault ? T.accent : T.border}`,
+              padding: 20,
+              position: "relative",
+            }}>
+              {addr.isDefault && (
+                <span style={{
+                  position: "absolute", top: 12, right: 12,
+                  background: T.accentLight, color: T.accent,
+                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
+                  borderRadius: 4,
+                }}>
+                  {lang === "fr" ? "PAR DEFAUT" : "DEFAULT"}
+                </span>
+              )}
+              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 4 }}>
+                {addr.label}
+              </div>
+              <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, lineHeight: 1.6 }}>
+                <div>{addr.name}</div>
+                <div>{addr.street}</div>
+                <div>{addr.zip} {addr.city}</div>
+                <div>{FLAG_EMOJI[addr.country] || ""} {addr.country}</div>
+                {addr.phone && <div style={{ marginTop: 4 }}>{"\u260E\uFE0F"} {addr.phone}</div>}
+              </div>
+              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
+                <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.textSec, cursor: "pointer", fontFamily: T.font }}>
+                  {lang === "fr" ? "Modifier" : "Edit"}
+                </button>
+                {!addr.isDefault && (
+                  <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.accent, cursor: "pointer", fontFamily: T.font }}>
+                    {lang === "fr" ? "Par defaut" : "Set default"}
+                  </button>
+                )}
+              </div>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/buy/MyPurchases.jsx b/src/components/dashboard/buy/MyPurchases.jsx
new file mode 100644
index 0000000..c4d909f
--- /dev/null
+++ b/src/components/dashboard/buy/MyPurchases.jsx
@@ -0,0 +1,203 @@
+import React, { useState, useMemo } from "react";
+import { T, TX_STATUS } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import StatusBadge from "../shared/StatusBadge";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+const MOCK_PURCHASES = [
+  {
+    id: "tx-p01", shortId: "#ABc34Wkx", status: "paid",
+    seller: { name: "EnergyDist GmbH", country: "DE", avatar: "ED" },
+    items: [{ name: "Huawei SUN2000-10K-MAP0", qty: 5, price: 1118, image: "/products/huawei-sun2000.jpg" }],
+    total: 5590, deliveryCost: 250,
+    lastMessage: "Payment confirmed. Preparing shipment.",
+    lastMessageAt: "2026-02-23T14:00:00Z",
+    createdAt: "2026-02-20T10:00:00Z",
+  },
+  {
+    id: "tx-p02", shortId: "#DE7mN2Lp", status: "shipped",
+    seller: { name: "SolarWholesale NL", country: "NL", avatar: "SW" },
+    items: [{ name: "Deye BOS-GM5.1", qty: 8, price: 900, image: "/products/deye-hybrid.jpg" }],
+    total: 7200, deliveryCost: 180,
+    lastMessage: "Shipped via SUNTREX DELIVERY. Tracking: SNTX-NL-10294",
+    lastMessageAt: "2026-02-22T11:00:00Z",
+    createdAt: "2026-02-18T09:00:00Z",
+    tracking: "SNTX-NL-10294",
+  },
+  {
+    id: "tx-p03", shortId: "#GH5kR8Vn", status: "delivered",
+    seller: { name: "EnergyDist GmbH", country: "DE", avatar: "ED" },
+    items: [{ name: "Huawei LUNA2000-5-E0", qty: 3, price: 1261, image: "/products/huawei-luna.jpg" }],
+    total: 3783, deliveryCost: 120,
+    lastMessage: "Delivered successfully.",
+    lastMessageAt: "2026-02-15T16:00:00Z",
+    createdAt: "2026-02-10T08:00:00Z",
+  },
+  {
+    id: "tx-p04", shortId: "#JK2pW5Qm", status: "negotiation",
+    seller: { name: "MicroTech DE", country: "DE", avatar: "MT" },
+    items: [{ name: "Hoymiles HMS-800", qty: 50, price: 105, image: "/products/enphase-iq8.jpg" }],
+    total: 5250, deliveryCost: null,
+    lastMessage: "Can you offer a better price for 50 units?",
+    lastMessageAt: "2026-02-24T15:30:00Z",
+    createdAt: "2026-02-24T14:00:00Z",
+    unreadMessages: 1,
+  },
+];
+
+const FILTER_TABS = [
+  { id: "all",          label: "All",           labelFr: "Tout" },
+  { id: "negotiation",  label: "Negotiations",  labelFr: "Negociations" },
+  { id: "confirmed",    label: "Confirmed",     labelFr: "Confirmees" },
+  { id: "paid",         label: "Paid",          labelFr: "Payees" },
+  { id: "shipped",      label: "Shipped",       labelFr: "En cours" },
+  { id: "delivered",    label: "Delivered",      labelFr: "Livrees" },
+];
+
+const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+const timeAgo = (d) => {
+  const diff = Date.now() - new Date(d).getTime();
+  const mins = Math.floor(diff / 60000);
+  if (mins < 60) return `${mins}min`;
+  const hours = Math.floor(mins / 60);
+  if (hours < 24) return `${hours}h`;
+  return `${Math.floor(hours / 24)}j`;
+};
+
+export default function MyPurchases() {
+  const { isMobile } = useResponsive();
+  const { navigateToTransaction, lang } = useDashboard();
+  const [activeFilter, setActiveFilter] = useState("all");
+  const [searchQuery, setSearchQuery] = useState("");
+  const [hoveredRow, setHoveredRow] = useState(null);
+
+  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
+
+  const filtered = useMemo(() => {
+    let result = MOCK_PURCHASES;
+    if (activeFilter !== "all") result = result.filter(tx => tx.status === activeFilter);
+    if (searchQuery.trim()) {
+      const q = searchQuery.toLowerCase();
+      result = result.filter(tx =>
+        tx.shortId.toLowerCase().includes(q) ||
+        tx.seller.name.toLowerCase().includes(q) ||
+        tx.items.some(i => i.name.toLowerCase().includes(q))
+      );
+    }
+    return result;
+  }, [activeFilter, searchQuery]);
+
+  return (
+    <div>
+      <div style={{
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        justifyContent: "space-between",
+        flexDirection: isMobile ? "column" : "row",
+        gap: 12, marginBottom: 20,
+      }}>
+        <div>
+          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+            {lang === "fr" ? "Mes achats" : "My purchases"}
+          </h1>
+          <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "4px 0 0" }}>
+            {MOCK_PURCHASES.length} transactions
+          </p>
+        </div>
+        <div style={{ position: "relative", width: isMobile ? "100%" : 280 }}>
+          <input
+            type="text"
+            placeholder={lang === "fr" ? "Rechercher..." : "Search..."}
+            value={searchQuery}
+            onChange={(e) => setSearchQuery(e.target.value)}
+            style={{
+              width: "100%", padding: "8px 12px 8px 34px",
+              border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
+              fontSize: 13, fontFamily: T.font, color: T.text, background: T.card, outline: "none",
+            }}
+          />
+          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textMuted, pointerEvents: "none" }}>{"\uD83D\uDD0D"}</span>
+        </div>
+      </div>
+
+      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
+        {FILTER_TABS.map((tab) => {
+          const active = activeFilter === tab.id;
+          const count = tab.id === "all" ? MOCK_PURCHASES.length : MOCK_PURCHASES.filter(tx => tx.status === tab.id).length;
+          return (
+            <button key={tab.id} onClick={() => setActiveFilter(tab.id)} style={{
+              background: active ? T.text : T.card, color: active ? "#fff" : T.textSec,
+              border: active ? "none" : `1px solid ${T.border}`,
+              borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
+              cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
+              display: "flex", alignItems: "center", gap: 6, minHeight: 34,
+            }}>
+              {getLabel(tab)}
+              <span style={{ background: active ? "rgba(255,255,255,0.2)" : T.bg, padding: "0 6px", borderRadius: 8, fontSize: 11 }}>{count}</span>
+            </button>
+          );
+        })}
+      </div>
+
+      {filtered.length === 0 ? (
+        <EmptyState
+          icon={"\uD83D\uDED2"}
+          title={lang === "fr" ? "Aucun achat trouve" : "No purchases found"}
+          description={lang === "fr" ? "Explorez le catalogue pour trouver des produits." : "Explore the catalog to find products."}
+          actionLabel={lang === "fr" ? "Voir le catalogue" : "Browse catalog"}
+          onAction={() => { window.location.href = "/catalog"; }}
+        />
+      ) : (
+        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+          {filtered.map((tx, idx) => (
+            <div
+              key={tx.id}
+              onClick={() => navigateToTransaction(tx.id)}
+              onMouseEnter={() => setHoveredRow(tx.id)}
+              onMouseLeave={() => setHoveredRow(null)}
+              style={{
+                display: "flex",
+                alignItems: isMobile ? "flex-start" : "center",
+                flexDirection: isMobile ? "column" : "row",
+                gap: isMobile ? 10 : 16,
+                padding: isMobile ? 14 : "14px 20px",
+                borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
+                cursor: "pointer",
+                background: hoveredRow === tx.id ? T.bg : "transparent",
+                transition: T.transitionFast,
+              }}
+              role="button" tabIndex={0}
+            >
+              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
+                <div style={{ width: 10, height: 10, borderRadius: "50%", background: TX_STATUS[tx.status]?.color || T.textMuted }} />
+                <div style={{ width: 48, height: 48, borderRadius: T.radiusSm, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
+                  <img src={tx.items[0]?.image} alt={tx.items[0]?.name} style={{ width: "100%", height: "100%", objectFit: "contain" }}
+                    onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "\uD83D\uDCE6"; }} />
+                </div>
+              </div>
+              <div style={{ flex: 1, minWidth: 0 }}>
+                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
+                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font }}>{tx.shortId}</span>
+                  <StatusBadge status={tx.status} size="sm" lang={lang} />
+                  {tx.unreadMessages > 0 && <span style={{ background: T.accent, color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{tx.unreadMessages}</span>}
+                </div>
+                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
+                  {tx.items[0]?.name}
+                </div>
+                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
+                  {FLAG_EMOJI[tx.seller.country] || ""} {tx.seller.name}
+                </div>
+              </div>
+              <div style={{ textAlign: isMobile ? "left" : "right", flexShrink: 0, display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "flex-end", gap: isMobile ? 12 : 2 }}>
+                <span style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.font }}>{formatPrice(tx.total)}</span>
+                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>{timeAgo(tx.lastMessageAt)}</span>
+              </div>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/dashboardUtils.js b/src/components/dashboard/dashboardUtils.js
new file mode 100644
index 0000000..bc05987
--- /dev/null
+++ b/src/components/dashboard/dashboardUtils.js
@@ -0,0 +1,138 @@
+import { useState, useEffect } from "react";
+
+// ── Brand constants (from root CLAUDE.md) ────────────────────────────
+export const BRAND = {
+  orange: "#f97316",
+  orangeDark: "#ea580c",
+  dark: "#1e293b",
+  gray: "#64748b",
+  lightGray: "#94a3b8",
+  light: "#f8fafc",
+  border: "#e2e8f0",
+  green: "#10b981",
+  greenLight: "#d1fae5",
+  red: "#ef4444",
+  redLight: "#fee2e2",
+  blue: "#3b82f6",
+  blueLight: "#dbeafe",
+  amber: "#f59e0b",
+  amberLight: "#fef3c7",
+  white: "#ffffff",
+  navy: "#0f172a",
+};
+
+// ── Responsive hook ──────────────────────────────────────────────────
+export const useDashboardResponsive = () => {
+  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
+  useEffect(() => {
+    const h = () => setW(window.innerWidth);
+    window.addEventListener("resize", h);
+    return () => window.removeEventListener("resize", h);
+  }, []);
+  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024, w };
+};
+
+// ── Formatters ───────────────────────────────────────────────────────
+export const fmt = {
+  price: (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n),
+  date: (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)),
+  dateShort: (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(d)),
+  number: (n) => new Intl.NumberFormat("fr-FR").format(n),
+  pct: (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`,
+};
+
+// ── Status configs ───────────────────────────────────────────────────
+export const ORDER_STATUS = {
+  pending:   { label: "En attente",  color: BRAND.amber, bg: BRAND.amberLight, icon: "\u23F3" },
+  paid:      { label: "Pay\u00e9",   color: BRAND.blue,  bg: BRAND.blueLight,  icon: "\uD83D\uDCB3" },
+  shipped:   { label: "Exp\u00e9di\u00e9", color: BRAND.orange, bg: "#fff7ed", icon: "\uD83D\uDE9A" },
+  delivered: { label: "Livr\u00e9",  color: BRAND.green, bg: BRAND.greenLight, icon: "\u2705" },
+  disputed:  { label: "Litige",      color: BRAND.red,   bg: BRAND.redLight,   icon: "\u26A0\uFE0F" },
+  cancelled: { label: "Annul\u00e9", color: BRAND.gray,  bg: "#f1f5f9",        icon: "\u2715" },
+};
+
+export const STRIPE_STATUS = {
+  not_started: { label: "Non d\u00e9marr\u00e9", color: BRAND.gray,  bg: "#f1f5f9",        cta: "Activer les paiements" },
+  pending:     { label: "En cours",               color: BRAND.amber, bg: BRAND.amberLight, cta: "Finaliser l'onboarding" },
+  active:      { label: "Actif",                  color: BRAND.green, bg: BRAND.greenLight, cta: null },
+  restricted:  { label: "Restreint",              color: BRAND.red,   bg: BRAND.redLight,   cta: "R\u00e9soudre le probl\u00e8me" },
+};
+
+// ── Mock data (replaced by Supabase in production) ───────────────────
+export const MOCK_BUYER = {
+  user: { name: "Pierre Moreau", email: "p.moreau@solarpro.fr", avatar: "PM", role: "buyer", verified: true },
+  company: { name: "SolarPro France", vat: "FR12345678901", country: "FR", type: "Installateur" },
+  stats: {
+    totalOrders: 24, totalSpend: 187450, pendingOrders: 3,
+    savedItems: 12, activeRFQs: 2, avgOrderValue: 7810,
+  },
+  orders: [
+    { id: "ORD-2024-001", date: "2024-02-18", status: "delivered", product: "Huawei SUN2000-10K-MAP0 \u00d75", seller: "EnergyDist GmbH", amount: 6245, tracking: "SNTX-FR-44821" },
+    { id: "ORD-2024-002", date: "2024-02-22", status: "shipped",   product: "Deye BOS-GM5.1 \u00d78",         seller: "SolarWholesale NL", amount: 7200, tracking: "SNTX-NL-10294" },
+    { id: "ORD-2024-003", date: "2024-02-24", status: "paid",      product: "Hoymiles HMS-800 \u00d750",       seller: "MicroTech DE", amount: 5250, tracking: null },
+    { id: "ORD-2024-004", date: "2024-02-14", status: "delivered", product: "LUNA2000-5-E0 \u00d73",           seller: "EnergyDist GmbH", amount: 3783, tracking: "SNTX-FR-44199" },
+    { id: "ORD-2024-005", date: "2024-02-10", status: "disputed",  product: "ESDEC ClickFit EVO \u00d7200",   seller: "MountingPro IT", amount: 466, tracking: "SNTX-IT-28811" },
+  ],
+  rfqs: [
+    { id: "RFQ-024", product: "Enphase IQ8-HC", qty: 100, status: "open", quotes: 3, deadline: "2024-03-05" },
+    { id: "RFQ-025", product: "JA Solar 420Wc", qty: 500, status: "open", quotes: 7, deadline: "2024-03-08" },
+  ],
+  saved: [
+    { id: 1, name: "Huawei SUN2000-12K-MB0", price: 2100, stock: 42,  brand: "HUAWEI" },
+    { id: 2, name: "Deye SUN-8K-SG04LP3-EU", price: 1250, stock: 18,  brand: "DEYE" },
+    { id: 3, name: "LUNA2000-5-E0",           price: 1261, stock: 76,  brand: "HUAWEI" },
+    { id: 4, name: "Enphase IQ8-PLUS",        price: 80,   stock: 647, brand: "ENPHASE" },
+  ],
+  notifications: [
+    { id: 1, type: "delivery", msg: "Commande ORD-2024-002 exp\u00e9di\u00e9e \u2014 arriv\u00e9e estim\u00e9e 26 f\u00e9v.", time: "2h", read: false },
+    { id: 2, type: "price",    msg: "Prix Huawei SUN2000-10K baiss\u00e9 de 3% chez 2 vendeurs", time: "5h", read: false },
+    { id: 3, type: "quote",    msg: "3 nouvelles offres re\u00e7ues pour RFQ-024", time: "1j", read: true },
+    { id: 4, type: "dispute",  msg: "Litige ORD-2024-005 : r\u00e9ponse requise sous 48h", time: "2j", read: false },
+  ],
+};
+
+export const MOCK_SELLER = {
+  user: { name: "Hans Mueller", email: "h.mueller@energydist.de", avatar: "HM", role: "seller", verified: true },
+  company: { name: "EnergyDist GmbH", vat: "DE987654321", country: "DE", type: "Distributeur" },
+  stripeStatus: "active",
+  stats: {
+    totalRevenue: 284600, monthRevenue: 38200, pendingPayouts: 12400,
+    activeListings: 47, totalOrders: 186, conversionRate: 4.2,
+    avgRating: 4.8, totalReviews: 142, responseTime: "< 2h",
+  },
+  monthlyRevenue: [
+    { month: "Sep", value: 24100 },
+    { month: "Oct", value: 31200 },
+    { month: "Nov", value: 28900 },
+    { month: "D\u00e9c", value: 19800 },
+    { month: "Jan", value: 33400 },
+    { month: "F\u00e9v", value: 38200 },
+  ],
+  orders: [
+    { id: "ORD-2024-001", date: "2024-02-18", status: "delivered", buyer: "SolarPro France", product: "SUN2000-10K-MAP0 \u00d75", amount: 5590, fee: 335, net: 5255 },
+    { id: "ORD-2024-006", date: "2024-02-23", status: "paid",      buyer: "InstallSol ES",   product: "LUNA2000-5-E0 \u00d710",   amount: 11300, fee: 678, net: 10622 },
+    { id: "ORD-2024-007", date: "2024-02-24", status: "pending",   buyer: "GreenBuild BE",   product: "SUN2000-8K-MAP0 \u00d78",  amount: 7120, fee: 427, net: 6693 },
+    { id: "ORD-2024-008", date: "2024-02-25", status: "shipped",   buyer: "SolarMax NL",     product: "SUN2000-5K-MAP0 \u00d712", amount: 8160, fee: 490, net: 7670 },
+    { id: "ORD-2024-005", date: "2024-02-14", status: "disputed",  buyer: "SolarPro France", product: "ESDEC ClickFit \u00d7200", amount: 466, fee: 28, net: 438 },
+  ],
+  listings: [
+    { id: 1, sku: "SUN2000-10K-MAP0", name: "Huawei SUN2000-10K-MAP0",  price: 1118, stock: 9,   status: "active",  views: 284, orders: 12 },
+    { id: 2, sku: "LUNA2000-5-E0",    name: "Huawei LUNA2000-5-E0",     price: 1130, stock: 14,  status: "active",  views: 197, orders: 8 },
+    { id: 3, sku: "SUN2000-5K-MAP0",  name: "Huawei SUN2000-5K-MAP0",  price: 680,  stock: 0,   status: "soldout", views: 432, orders: 22 },
+    { id: 4, sku: "SUN2000-8K-MAP0",  name: "Huawei SUN2000-8K-MAP0",  price: 890,  stock: 28,  status: "active",  views: 156, orders: 5 },
+    { id: 5, sku: "LUNA2000-5KW-C0",  name: "Huawei LUNA2000-5KW-C0",  price: 145,  stock: 32,  status: "active",  views: 89,  orders: 3 },
+    { id: 6, sku: "P1300",            name: "Huawei Optimizer P1300",   price: 52,   stock: 200, status: "active",  views: 64,  orders: 1 },
+    { id: 7, sku: "WLAN-FE",          name: "Huawei Smart Dongle",      price: 38,   stock: 15,  status: "paused",  views: 45,  orders: 0 },
+  ],
+  payouts: [
+    { date: "2024-02-20", amount: 15240, status: "paid",    ref: "po_xxx001" },
+    { date: "2024-02-13", amount: 9870,  status: "paid",    ref: "po_xxx002" },
+    { date: "2024-02-06", amount: 12400, status: "pending", ref: "po_xxx003" },
+  ],
+  notifications: [
+    { id: 1, type: "order",   msg: "Nouvelle commande ORD-2024-007 \u2014 GreenBuild BE \u2014 7 120 \u20ac", time: "1h", read: false },
+    { id: 2, type: "payout",  msg: "Virement de 15 240 \u20ac re\u00e7u sur votre compte bancaire", time: "5h", read: false },
+    { id: 3, type: "dispute", msg: "Litige ORD-2024-005 ouvert \u2014 r\u00e9ponse requise sous 48h", time: "2j", read: false },
+    { id: 4, type: "kyc",     msg: "Profil Stripe v\u00e9rifi\u00e9 \u2014 paiements et virements activ\u00e9s", time: "1s", read: true },
+  ],
+};
diff --git a/src/components/dashboard/notifications/NotificationEmails.jsx b/src/components/dashboard/notifications/NotificationEmails.jsx
new file mode 100644
index 0000000..3fd83e0
--- /dev/null
+++ b/src/components/dashboard/notifications/NotificationEmails.jsx
@@ -0,0 +1,69 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import { useDashboard } from "../DashboardLayout";
+
+const EMAIL_PREFS = [
+  { id: "orders", label: "New orders", labelFr: "Nouvelles commandes", enabled: true },
+  { id: "messages", label: "New messages", labelFr: "Nouveaux messages", enabled: true },
+  { id: "payments", label: "Payment confirmations", labelFr: "Confirmations de paiement", enabled: true },
+  { id: "shipping", label: "Shipping updates", labelFr: "Mises a jour livraison", enabled: false },
+  { id: "rfq", label: "New RFQ quotes", labelFr: "Nouvelles offres RFQ", enabled: true },
+  { id: "marketing", label: "Marketing & promotions", labelFr: "Marketing & promotions", enabled: false },
+  { id: "digest", label: "Weekly digest", labelFr: "Resume hebdomadaire", enabled: true },
+];
+
+export default function NotificationEmails() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [prefs, setPrefs] = useState(EMAIL_PREFS);
+
+  const toggle = (id) => {
+    setPrefs(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
+  };
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 8px" }}>
+        {lang === "fr" ? "Emails de notification" : "Notification emails"}
+      </h1>
+      <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Choisissez quels emails vous souhaitez recevoir." : "Choose which emails you'd like to receive."}
+      </p>
+
+      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+        {prefs.map((pref, idx) => (
+          <div key={pref.id} style={{
+            display: "flex", alignItems: "center", justifyContent: "space-between",
+            padding: "14px 20px",
+            borderBottom: idx < prefs.length - 1 ? `1px solid ${T.borderLight}` : "none",
+          }}>
+            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>
+              {lang === "fr" ? pref.labelFr : pref.label}
+            </span>
+            <button
+              onClick={() => toggle(pref.id)}
+              style={{
+                width: 44, height: 24, borderRadius: 12,
+                background: pref.enabled ? T.green : T.border,
+                border: "none", cursor: "pointer",
+                position: "relative", transition: T.transition,
+                flexShrink: 0,
+              }}
+              aria-label={`Toggle ${pref.label}`}
+            >
+              <div style={{
+                width: 20, height: 20, borderRadius: "50%",
+                background: "#fff",
+                position: "absolute", top: 2,
+                left: pref.enabled ? 22 : 2,
+                transition: T.transition,
+                boxShadow: T.shadow,
+              }} />
+            </button>
+          </div>
+        ))}
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/notifications/NotificationSettings.jsx b/src/components/dashboard/notifications/NotificationSettings.jsx
new file mode 100644
index 0000000..9181fa4
--- /dev/null
+++ b/src/components/dashboard/notifications/NotificationSettings.jsx
@@ -0,0 +1,66 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import { useDashboard } from "../DashboardLayout";
+
+const SETTINGS = [
+  { id: "sound", label: "Notification sound", labelFr: "Son de notification", enabled: true },
+  { id: "desktop", label: "Desktop notifications", labelFr: "Notifications bureau", enabled: false },
+  { id: "badge", label: "Badge counter", labelFr: "Compteur de badge", enabled: true },
+  { id: "dnd", label: "Do not disturb", labelFr: "Ne pas deranger", enabled: false },
+];
+
+export default function NotificationSettings() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [settings, setSettings] = useState(SETTINGS);
+
+  const toggle = (id) => {
+    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
+  };
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 8px" }}>
+        {lang === "fr" ? "Parametres notifications" : "Notification settings"}
+      </h1>
+      <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Configurez le comportement des notifications." : "Configure notification behavior."}
+      </p>
+
+      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+        {settings.map((setting, idx) => (
+          <div key={setting.id} style={{
+            display: "flex", alignItems: "center", justifyContent: "space-between",
+            padding: "14px 20px",
+            borderBottom: idx < settings.length - 1 ? `1px solid ${T.borderLight}` : "none",
+          }}>
+            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>
+              {lang === "fr" ? setting.labelFr : setting.label}
+            </span>
+            <button
+              onClick={() => toggle(setting.id)}
+              style={{
+                width: 44, height: 24, borderRadius: 12,
+                background: setting.enabled ? T.green : T.border,
+                border: "none", cursor: "pointer",
+                position: "relative", transition: T.transition,
+                flexShrink: 0,
+              }}
+              aria-label={`Toggle ${setting.label}`}
+            >
+              <div style={{
+                width: 20, height: 20, borderRadius: "50%",
+                background: "#fff",
+                position: "absolute", top: 2,
+                left: setting.enabled ? 22 : 2,
+                transition: T.transition,
+                boxShadow: T.shadow,
+              }} />
+            </button>
+          </div>
+        ))}
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/notifications/NotificationsCenter.jsx b/src/components/dashboard/notifications/NotificationsCenter.jsx
new file mode 100644
index 0000000..02af194
--- /dev/null
+++ b/src/components/dashboard/notifications/NotificationsCenter.jsx
@@ -0,0 +1,103 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+import { MOCK_BUYER, MOCK_SELLER } from "../dashboardUtils";
+
+const ALL_NOTIFS = [...MOCK_BUYER.notifications, ...MOCK_SELLER.notifications].sort((a, b) => {
+  const parseTime = (t) => {
+    if (t.includes("h")) return parseInt(t) * 60;
+    if (t.includes("j")) return parseInt(t) * 1440;
+    if (t.includes("s")) return parseInt(t) * 10080;
+    return parseInt(t);
+  };
+  return parseTime(a.time) - parseTime(b.time);
+});
+
+const NOTIF_ICONS = {
+  order: "\uD83D\uDCE6", delivery: "\uD83D\uDE9A", payment: "\uD83D\uDCB3",
+  dispute: "\u26A0\uFE0F", payout: "\uD83D\uDCB0", quote: "\uD83D\uDCCB",
+  price: "\uD83D\uDCCA", kyc: "\u2705",
+};
+
+export default function NotificationsCenter() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [notifications, setNotifications] = useState(ALL_NOTIFS);
+  const [filter, setFilter] = useState("all");
+
+  const markAllRead = () => {
+    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
+  };
+
+  const filtered = filter === "all" ? notifications : notifications.filter(n => !n.read);
+  const unreadCount = notifications.filter(n => !n.read).length;
+
+  return (
+    <div>
+      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
+        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+          {lang === "fr" ? "Centre de notifications" : "Notifications center"}
+          {unreadCount > 0 && (
+            <span style={{ marginLeft: 8, background: T.red, color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 700, verticalAlign: "middle" }}>
+              {unreadCount}
+            </span>
+          )}
+        </h1>
+        <button onClick={markAllRead} style={{
+          background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
+          padding: "8px 14px", fontSize: 12, fontWeight: 600, color: T.accent,
+          cursor: "pointer", fontFamily: T.font,
+        }}>
+          {lang === "fr" ? "Tout marquer comme lu" : "Mark all read"}
+        </button>
+      </div>
+
+      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
+        {[
+          { id: "all", label: "All", labelFr: "Tout" },
+          { id: "unread", label: "Unread", labelFr: "Non lus" },
+        ].map(tab => (
+          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
+            background: filter === tab.id ? T.text : T.card,
+            color: filter === tab.id ? "#fff" : T.textSec,
+            border: filter === tab.id ? "none" : `1px solid ${T.border}`,
+            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
+            cursor: "pointer", fontFamily: T.font, minHeight: 34,
+          }}>
+            {lang === "fr" ? tab.labelFr : tab.label}
+          </button>
+        ))}
+      </div>
+
+      {filtered.length === 0 ? (
+        <EmptyState icon={"\uD83D\uDD14"} title={lang === "fr" ? "Aucune notification" : "No notifications"} description={lang === "fr" ? "Vous etes a jour !" : "You're all caught up!"} />
+      ) : (
+        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+          {filtered.map((n, idx) => (
+            <div key={n.id} style={{
+              display: "flex", gap: 12, alignItems: "flex-start",
+              padding: "14px 20px",
+              background: n.read ? "transparent" : T.accentLight,
+              borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
+              cursor: "pointer",
+              transition: T.transitionFast,
+            }}
+            onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
+            >
+              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{NOTIF_ICONS[n.type] || "\uD83D\uDD14"}</span>
+              <div style={{ flex: 1, minWidth: 0 }}>
+                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.4 }}>{n.msg}</div>
+                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, marginTop: 4 }}>
+                  {lang === "fr" ? "il y a" : ""} {n.time} {lang !== "fr" ? "ago" : ""}
+                </div>
+              </div>
+              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0, marginTop: 6 }} />}
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/profile/AccountDetails.jsx b/src/components/dashboard/profile/AccountDetails.jsx
new file mode 100644
index 0000000..c7175c7
--- /dev/null
+++ b/src/components/dashboard/profile/AccountDetails.jsx
@@ -0,0 +1,45 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import { useDashboard } from "../DashboardLayout";
+
+export default function AccountDetails() {
+  const { isMobile } = useResponsive();
+  const { user, lang } = useDashboard();
+
+  const fields = [
+    { label: lang === "fr" ? "Nom" : "Name", value: user?.name || "-" },
+    { label: "Email", value: user?.email || "-" },
+    { label: lang === "fr" ? "Role" : "Role", value: user?.role || "-" },
+    { label: lang === "fr" ? "Verifie" : "Verified", value: user?.verified ? "\u2713 Oui" : "\u2717 Non" },
+    { label: lang === "fr" ? "Langue" : "Language", value: "Francais" },
+    { label: lang === "fr" ? "Devise" : "Currency", value: "EUR" },
+  ];
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Details du compte" : "Account details"}
+      </h1>
+      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+        {fields.map((field, idx) => (
+          <div key={idx} style={{
+            display: "flex", alignItems: isMobile ? "flex-start" : "center",
+            flexDirection: isMobile ? "column" : "row",
+            gap: isMobile ? 4 : 0,
+            padding: "14px 20px",
+            borderBottom: idx < fields.length - 1 ? `1px solid ${T.borderLight}` : "none",
+          }}>
+            <span style={{ width: isMobile ? "auto" : 180, fontSize: 13, fontWeight: 600, color: T.textSec, fontFamily: T.font }}>
+              {field.label}
+            </span>
+            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>{field.value}</span>
+          </div>
+        ))}
+      </div>
+      <button style={{ marginTop: 16, background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
+        {lang === "fr" ? "Modifier" : "Edit"}
+      </button>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/profile/CompanyDetails.jsx b/src/components/dashboard/profile/CompanyDetails.jsx
new file mode 100644
index 0000000..212be5f
--- /dev/null
+++ b/src/components/dashboard/profile/CompanyDetails.jsx
@@ -0,0 +1,42 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import { useDashboard } from "../DashboardLayout";
+
+export default function CompanyDetails() {
+  const { isMobile } = useResponsive();
+  const { company, lang } = useDashboard();
+
+  const fields = [
+    { label: lang === "fr" ? "Nom" : "Name", value: company?.name || "-" },
+    { label: lang === "fr" ? "N. TVA" : "VAT Number", value: company?.vat || "-" },
+    { label: lang === "fr" ? "Pays" : "Country", value: company?.country || "-" },
+    { label: "Type", value: company?.type || "-" },
+    { label: "KYC", value: "\u2713 Verified" },
+  ];
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Details entreprise" : "Company details"}
+      </h1>
+      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+        {fields.map((field, idx) => (
+          <div key={idx} style={{
+            display: "flex", alignItems: isMobile ? "flex-start" : "center",
+            flexDirection: isMobile ? "column" : "row",
+            gap: isMobile ? 4 : 0,
+            padding: "14px 20px",
+            borderBottom: idx < fields.length - 1 ? `1px solid ${T.borderLight}` : "none",
+          }}>
+            <span style={{ width: isMobile ? "auto" : 180, fontSize: 13, fontWeight: 600, color: T.textSec, fontFamily: T.font }}>{field.label}</span>
+            <span style={{ fontSize: 14, color: T.text, fontFamily: T.font }}>{field.value}</span>
+          </div>
+        ))}
+      </div>
+      <button style={{ marginTop: 16, background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
+        {lang === "fr" ? "Modifier" : "Edit"}
+      </button>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/profile/InvoicesAndFees.jsx b/src/components/dashboard/profile/InvoicesAndFees.jsx
new file mode 100644
index 0000000..b7b9c6d
--- /dev/null
+++ b/src/components/dashboard/profile/InvoicesAndFees.jsx
@@ -0,0 +1,66 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+const MOCK_INVOICES = [
+  { id: "INV-2026-001", date: "2026-02-01", amount: 335, type: "commission", status: "paid" },
+  { id: "INV-2026-002", date: "2026-02-15", amount: 678, type: "commission", status: "paid" },
+  { id: "INV-2026-003", date: "2026-02-25", amount: 427, type: "commission", status: "pending" },
+];
+
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
+
+export default function InvoicesAndFees() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Factures & Frais" : "Invoices & Fees"}
+      </h1>
+
+      {/* Commission explainer */}
+      <div style={{ background: T.accentLight, borderRadius: T.radius, border: `1px solid ${T.accent}20`, padding: 16, marginBottom: 20, fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.5 }}>
+        <strong>{lang === "fr" ? "Commission SUNTREX" : "SUNTREX Commission"}</strong>: {lang === "fr" ? "5% en dessous du taux du marche. Nous prenons une commission sur chaque vente reussie." : "5% below market rate. We take a commission on each successful sale."}
+      </div>
+
+      {MOCK_INVOICES.length === 0 ? (
+        <EmptyState icon={"\uD83E\uDDFE"} title={lang === "fr" ? "Aucune facture" : "No invoices"} />
+      ) : (
+        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+          {!isMobile && (
+            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: "10px 20px", background: T.bg, fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: T.font, textTransform: "uppercase" }}>
+              <span>ID</span><span>Date</span><span>{lang === "fr" ? "Montant" : "Amount"}</span><span>Status</span>
+            </div>
+          )}
+          {MOCK_INVOICES.map((inv, idx) => (
+            <div key={inv.id} style={{
+              display: isMobile ? "flex" : "grid",
+              gridTemplateColumns: isMobile ? undefined : "1fr 1fr 1fr 1fr",
+              flexDirection: isMobile ? "column" : undefined,
+              gap: isMobile ? 4 : 12,
+              alignItems: isMobile ? "flex-start" : "center",
+              padding: isMobile ? 14 : "12px 20px",
+              borderBottom: idx < MOCK_INVOICES.length - 1 ? `1px solid ${T.borderLight}` : "none",
+            }}>
+              <span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font }}>{inv.id}</span>
+              <span style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{formatDate(inv.date)}</span>
+              <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{formatPrice(inv.amount)}</span>
+              <span style={{
+                display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: T.font,
+                background: inv.status === "paid" ? T.greenBg : T.yellowBg,
+                color: inv.status === "paid" ? T.greenText : T.yellowText,
+              }}>
+                {inv.status === "paid" ? (lang === "fr" ? "Paye" : "Paid") : (lang === "fr" ? "En attente" : "Pending")}
+              </span>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/profile/OutOfOffice.jsx b/src/components/dashboard/profile/OutOfOffice.jsx
new file mode 100644
index 0000000..c86aa71
--- /dev/null
+++ b/src/components/dashboard/profile/OutOfOffice.jsx
@@ -0,0 +1,77 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import { useDashboard } from "../DashboardLayout";
+
+export default function OutOfOffice() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [enabled, setEnabled] = useState(false);
+  const [message, setMessage] = useState("");
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Mode absence" : "Out of office"}
+      </h1>
+
+      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 24 }}>
+        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
+          <div>
+            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: T.font }}>
+              {lang === "fr" ? "Activer le mode absence" : "Enable out of office mode"}
+            </div>
+            <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, marginTop: 4 }}>
+              {lang === "fr"
+                ? "Les acheteurs verront un message indiquant votre indisponibilite."
+                : "Buyers will see a message indicating your unavailability."}
+            </div>
+          </div>
+          <button
+            onClick={() => setEnabled(!enabled)}
+            style={{
+              width: 48, height: 26, borderRadius: 13,
+              background: enabled ? T.green : T.border,
+              border: "none", cursor: "pointer",
+              position: "relative", transition: T.transition,
+              flexShrink: 0,
+            }}
+            aria-label={enabled ? "Disable" : "Enable"}
+          >
+            <div style={{
+              width: 22, height: 22, borderRadius: "50%",
+              background: "#fff",
+              position: "absolute", top: 2,
+              left: enabled ? 24 : 2,
+              transition: T.transition,
+              boxShadow: T.shadow,
+            }} />
+          </button>
+        </div>
+
+        {enabled && (
+          <div>
+            <label style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font, display: "block", marginBottom: 8 }}>
+              {lang === "fr" ? "Message d'absence" : "Away message"}
+            </label>
+            <textarea
+              value={message}
+              onChange={(e) => setMessage(e.target.value)}
+              placeholder={lang === "fr" ? "Ex: Je suis en vacances du 1er au 15 mars..." : "E.g.: I'm on vacation from March 1-15..."}
+              rows={4}
+              style={{
+                width: "100%", padding: "10px 14px",
+                border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
+                fontSize: 13, fontFamily: T.font, color: T.text,
+                resize: "vertical", outline: "none",
+              }}
+            />
+            <button style={{ marginTop: 12, background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
+              {lang === "fr" ? "Sauvegarder" : "Save"}
+            </button>
+          </div>
+        )}
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/profile/ReviewsPage.jsx b/src/components/dashboard/profile/ReviewsPage.jsx
new file mode 100644
index 0000000..3f4d138
--- /dev/null
+++ b/src/components/dashboard/profile/ReviewsPage.jsx
@@ -0,0 +1,59 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+const MOCK_REVIEWS = [
+  { id: 1, from: "SolarPro France", rating: 5, comment: "Excellent service, livraison rapide et produit conforme.", date: "2026-02-20", product: "Huawei SUN2000-10K" },
+  { id: 2, from: "GreenBuild BE", rating: 5, comment: "Tres professionnel, prix competitif.", date: "2026-02-15", product: "Deye SUN-12K" },
+  { id: 3, from: "InstallSol ES", rating: 4, comment: "Good products, delivery was a bit slow.", date: "2026-02-10", product: "Enphase IQ8-HC" },
+];
+
+const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
+
+export default function ReviewsPage() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+
+  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Avis" : "Reviews"}
+      </h1>
+
+      {/* Summary */}
+      <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
+        <div style={{ fontSize: 36, fontWeight: 800, color: T.text, fontFamily: T.font }}>{avgRating}</div>
+        <div>
+          <div style={{ fontSize: 20, color: T.yellow }}>{"★".repeat(Math.round(parseFloat(avgRating)))}{"☆".repeat(5 - Math.round(parseFloat(avgRating)))}</div>
+          <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{MOCK_REVIEWS.length} {lang === "fr" ? "avis" : "reviews"}</div>
+        </div>
+      </div>
+
+      {MOCK_REVIEWS.length === 0 ? (
+        <EmptyState icon={"\u2B50"} title={lang === "fr" ? "Aucun avis" : "No reviews"} />
+      ) : (
+        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
+          {MOCK_REVIEWS.map(review => (
+            <div key={review.id} style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20 }}>
+              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
+                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
+                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{review.from}</span>
+                  <span style={{ fontSize: 14, color: T.yellow }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
+                </div>
+                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{formatDate(review.date)}</span>
+              </div>
+              <p style={{ fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.5, margin: 0 }}>{review.comment}</p>
+              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 8 }}>
+                {lang === "fr" ? "Produit:" : "Product:"} {review.product}
+              </div>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/sell/ManageOffers.jsx b/src/components/dashboard/sell/ManageOffers.jsx
new file mode 100644
index 0000000..b2c48e9
--- /dev/null
+++ b/src/components/dashboard/sell/ManageOffers.jsx
@@ -0,0 +1,134 @@
+import React, { useState, useMemo } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+import { MOCK_SELLER } from "../dashboardUtils";
+
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+
+const STATUS_CONFIG = {
+  active:  { label: "Active",   labelFr: "Active",   color: T.greenText, bg: T.greenBg },
+  paused:  { label: "Paused",   labelFr: "En pause", color: T.yellowText, bg: T.yellowBg },
+  soldout: { label: "Sold out", labelFr: "Epuise",   color: T.redText,   bg: T.redBg },
+};
+
+export default function ManageOffers() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [searchQuery, setSearchQuery] = useState("");
+  const [filter, setFilter] = useState("all");
+  const [hoveredRow, setHoveredRow] = useState(null);
+
+  const listings = MOCK_SELLER.listings;
+
+  const filtered = useMemo(() => {
+    let result = listings;
+    if (filter !== "all") result = result.filter(l => l.status === filter);
+    if (searchQuery.trim()) {
+      const q = searchQuery.toLowerCase();
+      result = result.filter(l => l.name.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q));
+    }
+    return result;
+  }, [filter, searchQuery, listings]);
+
+  return (
+    <div>
+      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 20 }}>
+        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+          {lang === "fr" ? "Gerer les offres" : "Manage offers"}
+        </h1>
+        <div style={{ display: "flex", gap: 8 }}>
+          <button style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, minHeight: 40 }}>
+            {lang === "fr" ? "+ Nouvelle annonce" : "+ New listing"}
+          </button>
+          <button style={{ background: T.card, color: T.textSec, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, minHeight: 40 }}>
+            {lang === "fr" ? "Import XLSX" : "Import XLSX"}
+          </button>
+        </div>
+      </div>
+
+      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
+        <div style={{ position: "relative", width: isMobile ? "100%" : 260 }}>
+          <input type="text" placeholder={lang === "fr" ? "Rechercher un produit..." : "Search product..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
+            style={{ width: "100%", padding: "8px 12px 8px 34px", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13, fontFamily: T.font, color: T.text, background: T.card, outline: "none" }} />
+          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textMuted, pointerEvents: "none" }}>{"\uD83D\uDD0D"}</span>
+        </div>
+        <div style={{ display: "flex", gap: 4 }}>
+          {[
+            { id: "all", label: "All", labelFr: "Tout" },
+            { id: "active", label: "Active", labelFr: "Actives" },
+            { id: "paused", label: "Paused", labelFr: "En pause" },
+            { id: "soldout", label: "Sold out", labelFr: "Epuisees" },
+          ].map(tab => (
+            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
+              background: filter === tab.id ? T.text : T.card,
+              color: filter === tab.id ? "#fff" : T.textSec,
+              border: filter === tab.id ? "none" : `1px solid ${T.border}`,
+              borderRadius: 99, padding: "6px 12px", fontSize: 12, fontWeight: 600,
+              cursor: "pointer", fontFamily: T.font, minHeight: 34,
+            }}>
+              {lang === "fr" ? tab.labelFr : tab.label}
+            </button>
+          ))}
+        </div>
+      </div>
+
+      {filtered.length === 0 ? (
+        <EmptyState icon={"\uD83D\uDCCB"} title={lang === "fr" ? "Aucune offre" : "No offers"} description={lang === "fr" ? "Creez votre premiere annonce." : "Create your first listing."} />
+      ) : (
+        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
+          {/* Table header (desktop only) */}
+          {!isMobile && (
+            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 80px 80px", gap: 12, padding: "10px 20px", background: T.bg, fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: T.font, textTransform: "uppercase", letterSpacing: "0.05em" }}>
+              <span>{lang === "fr" ? "Produit" : "Product"}</span>
+              <span>{lang === "fr" ? "Prix" : "Price"}</span>
+              <span>Stock</span>
+              <span>{lang === "fr" ? "Vues" : "Views"}</span>
+              <span>{lang === "fr" ? "Ventes" : "Sales"}</span>
+              <span>Status</span>
+            </div>
+          )}
+          {filtered.map((listing, idx) => (
+            <div key={listing.id}
+              onMouseEnter={() => setHoveredRow(listing.id)}
+              onMouseLeave={() => setHoveredRow(null)}
+              style={{
+                display: isMobile ? "flex" : "grid",
+                gridTemplateColumns: isMobile ? undefined : "2fr 1fr 80px 80px 80px 80px",
+                flexDirection: isMobile ? "column" : undefined,
+                gap: isMobile ? 6 : 12,
+                alignItems: isMobile ? "flex-start" : "center",
+                padding: isMobile ? 14 : "12px 20px",
+                borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
+                background: hoveredRow === listing.id ? T.bg : "transparent",
+                transition: T.transitionFast,
+              }}>
+              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
+                <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{listing.name}</div>
+                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>{listing.sku}</span>
+              </div>
+              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{formatPrice(listing.price)}</div>
+              <div style={{ fontSize: 13, color: listing.stock === 0 ? T.red : T.text, fontWeight: listing.stock === 0 ? 600 : 400, fontFamily: T.font }}>{listing.stock}</div>
+              {!isMobile && <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{listing.views}</div>}
+              {!isMobile && <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>{listing.orders}</div>}
+              <div>
+                {STATUS_CONFIG[listing.status] && (
+                  <span style={{
+                    display: "inline-block",
+                    padding: "2px 8px", borderRadius: 99,
+                    fontSize: 11, fontWeight: 600, fontFamily: T.font,
+                    color: STATUS_CONFIG[listing.status].color,
+                    background: STATUS_CONFIG[listing.status].bg,
+                  }}>
+                    {lang === "fr" ? STATUS_CONFIG[listing.status].labelFr : STATUS_CONFIG[listing.status].label}
+                  </span>
+                )}
+              </div>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/sell/MySales.jsx b/src/components/dashboard/sell/MySales.jsx
new file mode 100644
index 0000000..8ed2108
--- /dev/null
+++ b/src/components/dashboard/sell/MySales.jsx
@@ -0,0 +1,315 @@
+import React, { useState, useMemo } from "react";
+import { T, TX_STATUS } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import StatusBadge from "../shared/StatusBadge";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+// ── Mock transactions for demo ─────────────────────────────────────
+const MOCK_TRANSACTIONS = [
+  {
+    id: "tx-001", shortId: "#FHJ46JUm", status: "negotiation",
+    buyer: { name: "SolarPro France", country: "FR", avatar: "SP" },
+    items: [{ name: "Huawei SUN2000-30KTL-M3", qty: 1, price: 1555, image: "/products/huawei-sun2000.jpg" }],
+    total: 1555, deliveryCost: null,
+    lastMessage: "Bonjour, je suis interesse par l'achat d'un Huawei SUN2000-30KTL-M3...",
+    lastMessageAt: "2026-02-24T23:50:00Z",
+    createdAt: "2026-02-24T23:50:00Z",
+    unreadMessages: 1,
+  },
+  {
+    id: "tx-002", shortId: "#KM8p2Rxt", status: "confirmed",
+    buyer: { name: "GreenBuild BE", country: "BE", avatar: "GB" },
+    items: [{ name: "Deye SUN-12K-SG04LP3-EU", qty: 3, price: 1250, image: "/products/deye-hybrid.jpg" }],
+    total: 3750, deliveryCost: 180,
+    lastMessage: "Merci, l'offre est acceptee. Je procede au paiement.",
+    lastMessageAt: "2026-02-23T14:20:00Z",
+    createdAt: "2026-02-22T10:00:00Z",
+    unreadMessages: 0,
+  },
+  {
+    id: "tx-003", shortId: "#QW3nY7Lk", status: "paid",
+    buyer: { name: "InstallSol ES", country: "ES", avatar: "IS" },
+    items: [{ name: "Enphase IQ8-HC Micro-Inverter", qty: 50, price: 85, image: "/products/enphase-iq8.jpg" }],
+    total: 4250, deliveryCost: 320,
+    lastMessage: "Payment received. When will you ship?",
+    lastMessageAt: "2026-02-22T09:15:00Z",
+    createdAt: "2026-02-20T16:00:00Z",
+    unreadMessages: 2,
+  },
+  {
+    id: "tx-004", shortId: "#RT5mD9Vx", status: "cancelled",
+    buyer: { name: "SolarMax NL", country: "NL", avatar: "SM" },
+    items: [{ name: "Huawei LUNA2000-5-E0", qty: 5, price: 1261, image: "/products/huawei-luna.jpg" }],
+    total: 6305, deliveryCost: null,
+    lastMessage: "Annulation: stock insuffisant",
+    lastMessageAt: "2026-02-21T11:00:00Z",
+    createdAt: "2026-02-19T08:30:00Z",
+    cancelledBy: "seller", cancelReason: "Stock insuffisant",
+    unreadMessages: 0,
+  },
+  {
+    id: "tx-005", shortId: "#BN2kH8Wp", status: "delivered",
+    buyer: { name: "MountingPro IT", country: "IT", avatar: "MP" },
+    items: [{ name: "ESDEC ClickFit EVO", qty: 200, price: 2.33, image: "/products/esdec-clickfit.jpg" }],
+    total: 466, deliveryCost: 95,
+    lastMessage: "Bien recu, merci !",
+    lastMessageAt: "2026-02-18T16:30:00Z",
+    createdAt: "2026-02-10T09:00:00Z",
+    unreadMessages: 0,
+  },
+];
+
+// ── Filter tabs ────────────────────────────────────────────────────
+const FILTER_TABS = [
+  { id: "all",          label: "All",           labelFr: "Tout" },
+  { id: "negotiation",  label: "Negotiations",  labelFr: "Negociations" },
+  { id: "confirmed",    label: "Confirmed",     labelFr: "Confirmees" },
+  { id: "paid",         label: "Paid",          labelFr: "Payees" },
+  { id: "shipped",      label: "Shipped",       labelFr: "Expediees" },
+  { id: "delivered",    label: "Delivered",      labelFr: "Livrees" },
+  { id: "cancelled",    label: "Cancelled",     labelFr: "Annulees" },
+];
+
+const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };
+
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+const formatDate = (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
+const timeAgo = (d) => {
+  const diff = Date.now() - new Date(d).getTime();
+  const mins = Math.floor(diff / 60000);
+  if (mins < 60) return `${mins}min`;
+  const hours = Math.floor(mins / 60);
+  if (hours < 24) return `${hours}h`;
+  return `${Math.floor(hours / 24)}j`;
+};
+
+export default function MySales() {
+  const { isMobile } = useResponsive();
+  const { navigateToTransaction, lang } = useDashboard();
+  const [activeFilter, setActiveFilter] = useState("all");
+  const [searchQuery, setSearchQuery] = useState("");
+  const [hoveredRow, setHoveredRow] = useState(null);
+
+  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
+
+  const filtered = useMemo(() => {
+    let result = MOCK_TRANSACTIONS;
+    if (activeFilter !== "all") {
+      result = result.filter(tx => tx.status === activeFilter);
+    }
+    if (searchQuery.trim()) {
+      const q = searchQuery.toLowerCase();
+      result = result.filter(tx =>
+        tx.shortId.toLowerCase().includes(q) ||
+        tx.buyer.name.toLowerCase().includes(q) ||
+        tx.items.some(i => i.name.toLowerCase().includes(q))
+      );
+    }
+    return result;
+  }, [activeFilter, searchQuery]);
+
+  return (
+    <div>
+      {/* Header */}
+      <div style={{
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        justifyContent: "space-between",
+        flexDirection: isMobile ? "column" : "row",
+        gap: 12,
+        marginBottom: 20,
+      }}>
+        <div>
+          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+            {lang === "fr" ? "Mes ventes" : "My sales"}
+          </h1>
+          <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "4px 0 0" }}>
+            {lang === "fr" ? `${MOCK_TRANSACTIONS.length} transactions` : `${MOCK_TRANSACTIONS.length} transactions`}
+          </p>
+        </div>
+
+        {/* Search */}
+        <div style={{ position: "relative", width: isMobile ? "100%" : 280 }}>
+          <input
+            type="text"
+            placeholder={lang === "fr" ? "Rechercher par ID, acheteur, produit..." : "Search by ID, buyer, product..."}
+            value={searchQuery}
+            onChange={(e) => setSearchQuery(e.target.value)}
+            style={{
+              width: "100%",
+              padding: "8px 12px 8px 34px",
+              border: `1px solid ${T.border}`,
+              borderRadius: T.radiusSm,
+              fontSize: 13,
+              fontFamily: T.font,
+              color: T.text,
+              background: T.card,
+              outline: "none",
+            }}
+            aria-label={lang === "fr" ? "Rechercher des transactions" : "Search transactions"}
+          />
+          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textMuted, pointerEvents: "none" }}>
+            {"\uD83D\uDD0D"}
+          </span>
+        </div>
+      </div>
+
+      {/* Filter tabs */}
+      <div style={{
+        display: "flex",
+        gap: 4,
+        marginBottom: 20,
+        overflowX: "auto",
+        paddingBottom: 4,
+        WebkitOverflowScrolling: "touch",
+      }}>
+        {FILTER_TABS.map((tab) => {
+          const active = activeFilter === tab.id;
+          const count = tab.id === "all"
+            ? MOCK_TRANSACTIONS.length
+            : MOCK_TRANSACTIONS.filter(tx => tx.status === tab.id).length;
+          return (
+            <button
+              key={tab.id}
+              onClick={() => setActiveFilter(tab.id)}
+              style={{
+                background: active ? T.text : T.card,
+                color: active ? "#fff" : T.textSec,
+                border: active ? "none" : `1px solid ${T.border}`,
+                borderRadius: 99,
+                padding: "6px 14px",
+                fontSize: 12,
+                fontWeight: 600,
+                cursor: "pointer",
+                fontFamily: T.font,
+                whiteSpace: "nowrap",
+                transition: T.transitionFast,
+                display: "flex",
+                alignItems: "center",
+                gap: 6,
+                minHeight: 34,
+              }}
+            >
+              {getLabel(tab)}
+              <span style={{
+                background: active ? "rgba(255,255,255,0.2)" : T.bg,
+                padding: "0 6px",
+                borderRadius: 8,
+                fontSize: 11,
+              }}>
+                {count}
+              </span>
+            </button>
+          );
+        })}
+      </div>
+
+      {/* Transaction list */}
+      {filtered.length === 0 ? (
+        <EmptyState
+          icon={"\uD83D\uDCE6"}
+          title={lang === "fr" ? "Aucune transaction trouvee" : "No transactions found"}
+          description={lang === "fr"
+            ? "Aucune transaction ne correspond a vos criteres de recherche."
+            : "No transactions match your search criteria."}
+        />
+      ) : (
+        <div style={{
+          background: T.card,
+          borderRadius: T.radius,
+          border: `1px solid ${T.border}`,
+          overflow: "hidden",
+        }}>
+          {filtered.map((tx, idx) => (
+            <div
+              key={tx.id}
+              onClick={() => navigateToTransaction(tx.id)}
+              onMouseEnter={() => setHoveredRow(tx.id)}
+              onMouseLeave={() => setHoveredRow(null)}
+              style={{
+                display: "flex",
+                alignItems: isMobile ? "flex-start" : "center",
+                flexDirection: isMobile ? "column" : "row",
+                gap: isMobile ? 10 : 16,
+                padding: isMobile ? "14px 14px" : "14px 20px",
+                borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
+                cursor: "pointer",
+                background: hoveredRow === tx.id ? T.bg : "transparent",
+                transition: T.transitionFast,
+              }}
+              role="button"
+              tabIndex={0}
+              onKeyDown={(e) => { if (e.key === "Enter") navigateToTransaction(tx.id); }}
+              aria-label={`Transaction ${tx.shortId}`}
+            >
+              {/* Status dot + product image */}
+              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
+                <div style={{
+                  width: 10, height: 10, borderRadius: "50%",
+                  background: TX_STATUS[tx.status]?.color || T.textMuted,
+                  flexShrink: 0,
+                }} />
+                <div style={{
+                  width: 48, height: 48, borderRadius: T.radiusSm,
+                  background: T.bg,
+                  display: "flex", alignItems: "center", justifyContent: "center",
+                  overflow: "hidden", flexShrink: 0,
+                }}>
+                  <img
+                    src={tx.items[0]?.image}
+                    alt={tx.items[0]?.name}
+                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
+                    onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "\uD83D\uDCE6"; }}
+                  />
+                </div>
+              </div>
+
+              {/* Main info */}
+              <div style={{ flex: 1, minWidth: 0 }}>
+                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
+                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font }}>
+                    {tx.shortId}
+                  </span>
+                  <StatusBadge status={tx.status} size="sm" lang={lang} />
+                  {tx.unreadMessages > 0 && (
+                    <span style={{
+                      background: T.accent, color: "#fff",
+                      borderRadius: 99, padding: "1px 6px",
+                      fontSize: 10, fontWeight: 700,
+                    }}>
+                      {tx.unreadMessages}
+                    </span>
+                  )}
+                </div>
+                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
+                  {tx.items[0]?.name} {tx.items.length > 1 ? `(+${tx.items.length - 1})` : ""}
+                </div>
+                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
+                  {FLAG_EMOJI[tx.buyer.country] || ""} {tx.buyer.name}
+                </div>
+              </div>
+
+              {/* Right side: price + time */}
+              <div style={{
+                textAlign: isMobile ? "left" : "right",
+                flexShrink: 0,
+                display: "flex",
+                flexDirection: isMobile ? "row" : "column",
+                alignItems: isMobile ? "center" : "flex-end",
+                gap: isMobile ? 12 : 2,
+              }}>
+                <span style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.font }}>
+                  {formatPrice(tx.total)}
+                </span>
+                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>
+                  {timeAgo(tx.lastMessageAt)}
+                </span>
+              </div>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/sell/SellerOverview.jsx b/src/components/dashboard/sell/SellerOverview.jsx
new file mode 100644
index 0000000..964acee
--- /dev/null
+++ b/src/components/dashboard/sell/SellerOverview.jsx
@@ -0,0 +1,92 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import StatCard from "../shared/StatCard";
+import { useDashboard } from "../DashboardLayout";
+import { MOCK_SELLER } from "../dashboardUtils";
+
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+
+export default function SellerOverview() {
+  const { isMobile } = useResponsive();
+  const { lang, setActiveSection } = useDashboard();
+  const stats = MOCK_SELLER.stats;
+  const monthlyRevenue = MOCK_SELLER.monthlyRevenue;
+  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.value));
+
+  return (
+    <div>
+      <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+        {lang === "fr" ? "Vue d'ensemble vendeur" : "Seller overview"}
+      </h1>
+
+      <div style={{
+        display: "grid",
+        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
+        gap: isMobile ? 12 : 16,
+        marginBottom: 24,
+      }}>
+        <StatCard icon={"\uD83D\uDCB0"} label={lang === "fr" ? "Revenus du mois" : "Month revenue"} value={formatPrice(stats.monthRevenue)} trend={{ value: "+14%", positive: true }} onClick={() => setActiveSection("sales")} />
+        <StatCard icon={"\uD83D\uDCE6"} label={lang === "fr" ? "Commandes" : "Orders"} value={stats.totalOrders} />
+        <StatCard icon={"\uD83D\uDCCB"} label={lang === "fr" ? "Offres actives" : "Active listings"} value={stats.activeListings} onClick={() => setActiveSection("offers")} />
+        <StatCard icon={"\u2B50"} label="Rating" value={`${stats.avgRating}/5`} subtitle={`${stats.totalReviews} avis`} />
+      </div>
+
+      {/* Revenue chart */}
+      <div style={{
+        background: T.card, borderRadius: T.radius,
+        border: `1px solid ${T.border}`, padding: isMobile ? 16 : 24,
+        marginBottom: 24,
+      }}>
+        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 20px" }}>
+          {lang === "fr" ? "Revenus mensuels" : "Monthly revenue"}
+        </h3>
+        <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 8 : 16, height: 160 }}>
+          {monthlyRevenue.map((m) => (
+            <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
+              <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, fontFamily: T.font }}>
+                {formatPrice(m.value)}
+              </span>
+              <div style={{
+                width: "100%", maxWidth: 48,
+                height: `${(m.value / maxRevenue) * 120}px`,
+                background: `linear-gradient(180deg, ${T.accent}, ${T.accent}88)`,
+                borderRadius: "4px 4px 0 0",
+                transition: "height 0.3s ease",
+              }} />
+              <span style={{ fontSize: 11, fontWeight: 500, color: T.textSec, fontFamily: T.font }}>{m.month}</span>
+            </div>
+          ))}
+        </div>
+      </div>
+
+      {/* Pending payouts */}
+      <div style={{
+        background: T.accentLight, borderRadius: T.radius,
+        border: `1px solid ${T.accent}20`, padding: isMobile ? 16 : 20,
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        flexDirection: isMobile ? "column" : "row",
+        justifyContent: "space-between",
+        gap: 12,
+      }}>
+        <div>
+          <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, fontFamily: T.font }}>
+            {lang === "fr" ? "Virements en attente" : "Pending payouts"}
+          </div>
+          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, fontFamily: T.font, marginTop: 4 }}>
+            {formatPrice(stats.pendingPayouts)}
+          </div>
+        </div>
+        <button style={{
+          background: T.accent, color: "#fff",
+          border: "none", borderRadius: T.radiusSm,
+          padding: "10px 20px", fontSize: 13, fontWeight: 600,
+          cursor: "pointer", fontFamily: T.font,
+        }}>
+          {lang === "fr" ? "Voir les details" : "View details"}
+        </button>
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/sell/WarehouseManager.jsx b/src/components/dashboard/sell/WarehouseManager.jsx
new file mode 100644
index 0000000..300efb1
--- /dev/null
+++ b/src/components/dashboard/sell/WarehouseManager.jsx
@@ -0,0 +1,58 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import EmptyState from "../shared/EmptyState";
+import { useDashboard } from "../DashboardLayout";
+
+const MOCK_WAREHOUSES = [
+  { id: 1, name: "Munich Central", address: "Industriestr. 42, 80339 Munchen", country: "DE", products: 32, capacity: "85%", isActive: true },
+  { id: 2, name: "Rotterdam Port", address: "Europaweg 123, 3199 LC Rotterdam", country: "NL", products: 15, capacity: "45%", isActive: true },
+];
+
+const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };
+
+export default function WarehouseManager() {
+  const { isMobile } = useResponsive();
+  const { lang } = useDashboard();
+  const [warehouses] = useState(MOCK_WAREHOUSES);
+
+  return (
+    <div>
+      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
+        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+          {lang === "fr" ? "Entrepots" : "Warehouses"}
+        </h1>
+        <button style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.radiusSm, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font, minHeight: 40 }}>
+          {lang === "fr" ? "+ Ajouter" : "+ Add"}
+        </button>
+      </div>
+
+      {warehouses.length === 0 ? (
+        <EmptyState icon={"\uD83C\uDFED"} title={lang === "fr" ? "Aucun entrepot" : "No warehouses"} description={lang === "fr" ? "Ajoutez vos entrepots pour gerer vos stocks." : "Add your warehouses to manage stock."} />
+      ) : (
+        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
+          {warehouses.map(wh => (
+            <div key={wh.id} style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, padding: 20 }}>
+              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
+                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.font }}>{wh.name}</div>
+                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: wh.isActive ? T.greenBg : T.redBg, color: wh.isActive ? T.greenText : T.redText }}>
+                  {wh.isActive ? (lang === "fr" ? "Actif" : "Active") : (lang === "fr" ? "Inactif" : "Inactive")}
+                </span>
+              </div>
+              <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, lineHeight: 1.5, marginBottom: 12 }}>
+                <div>{FLAG_EMOJI[wh.country] || ""} {wh.address}</div>
+              </div>
+              <div style={{ display: "flex", gap: 16, fontSize: 13, fontFamily: T.font }}>
+                <div><span style={{ color: T.textMuted }}>{lang === "fr" ? "Produits:" : "Products:"}</span> <strong style={{ color: T.text }}>{wh.products}</strong></div>
+                <div><span style={{ color: T.textMuted }}>{lang === "fr" ? "Capacite:" : "Capacity:"}</span> <strong style={{ color: T.text }}>{wh.capacity}</strong></div>
+              </div>
+              <button style={{ marginTop: 14, background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.textSec, cursor: "pointer", fontFamily: T.font }}>
+                {lang === "fr" ? "Gerer" : "Manage"}
+              </button>
+            </div>
+          ))}
+        </div>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/shared/EmptyState.jsx b/src/components/dashboard/shared/EmptyState.jsx
new file mode 100644
index 0000000..bd70fd9
--- /dev/null
+++ b/src/components/dashboard/shared/EmptyState.jsx
@@ -0,0 +1,74 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+
+// EmptyState — generic placeholder for empty lists/sections
+// Props: icon (emoji/string), title, description, actionLabel, onAction
+export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
+  const [hovered, setHovered] = useState(false);
+
+  return (
+    <div style={{
+      display: "flex",
+      flexDirection: "column",
+      alignItems: "center",
+      justifyContent: "center",
+      padding: "60px 24px",
+      textAlign: "center",
+    }}>
+      {icon && (
+        <div style={{
+          fontSize: 48,
+          marginBottom: 16,
+          opacity: 0.8,
+        }}>
+          {icon}
+        </div>
+      )}
+
+      <h3 style={{
+        fontSize: 18,
+        fontWeight: 600,
+        color: T.text,
+        fontFamily: T.font,
+        margin: "0 0 8px 0",
+      }}>
+        {title}
+      </h3>
+
+      {description && (
+        <p style={{
+          fontSize: 14,
+          color: T.textSec,
+          fontFamily: T.font,
+          margin: "0 0 24px 0",
+          maxWidth: 360,
+          lineHeight: 1.5,
+        }}>
+          {description}
+        </p>
+      )}
+
+      {actionLabel && onAction && (
+        <button
+          onClick={onAction}
+          onMouseEnter={() => setHovered(true)}
+          onMouseLeave={() => setHovered(false)}
+          style={{
+            background: hovered ? T.accentHover : T.accent,
+            color: "#fff",
+            border: "none",
+            borderRadius: T.radius,
+            padding: "10px 24px",
+            fontSize: 14,
+            fontWeight: 600,
+            cursor: "pointer",
+            fontFamily: T.font,
+            transition: T.transitionFast,
+          }}
+        >
+          {actionLabel}
+        </button>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/shared/PriceEditor.jsx b/src/components/dashboard/shared/PriceEditor.jsx
new file mode 100644
index 0000000..7f62cf9
--- /dev/null
+++ b/src/components/dashboard/shared/PriceEditor.jsx
@@ -0,0 +1,157 @@
+import React, { useState, useRef, useEffect } from "react";
+import { T } from "../tokens";
+
+// PriceEditor — inline click-to-edit price field
+// Props: value (number), currency ("EUR"), onSave(newValue), disabled, label
+export default function PriceEditor({ value, currency = "EUR", onSave, disabled = false, label }) {
+  const [editing, setEditing] = useState(false);
+  const [draft, setDraft] = useState(String(value));
+  const [saving, setSaving] = useState(false);
+  const inputRef = useRef(null);
+
+  useEffect(() => {
+    if (editing && inputRef.current) {
+      inputRef.current.focus();
+      inputRef.current.select();
+    }
+  }, [editing]);
+
+  // Sync external value changes
+  useEffect(() => {
+    if (!editing) setDraft(String(value));
+  }, [value, editing]);
+
+  const formatDisplay = (n) =>
+    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(n);
+
+  const handleSave = async () => {
+    const parsed = parseFloat(draft.replace(",", "."));
+    if (isNaN(parsed) || parsed < 0) {
+      setDraft(String(value));
+      setEditing(false);
+      return;
+    }
+    if (parsed === value) {
+      setEditing(false);
+      return;
+    }
+    setSaving(true);
+    try {
+      await onSave?.(parsed);
+    } finally {
+      setSaving(false);
+      setEditing(false);
+    }
+  };
+
+  const handleKeyDown = (e) => {
+    if (e.key === "Enter") handleSave();
+    if (e.key === "Escape") {
+      setDraft(String(value));
+      setEditing(false);
+    }
+  };
+
+  if (editing) {
+    return (
+      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
+        {label && (
+          <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{label}</span>
+        )}
+        <input
+          ref={inputRef}
+          type="text"
+          inputMode="decimal"
+          value={draft}
+          onChange={(e) => setDraft(e.target.value)}
+          onKeyDown={handleKeyDown}
+          onBlur={handleSave}
+          disabled={saving}
+          style={{
+            width: 100,
+            padding: "4px 8px",
+            border: `2px solid ${T.accent}`,
+            borderRadius: T.radiusSm,
+            fontSize: 14,
+            fontWeight: 600,
+            fontFamily: T.font,
+            color: T.text,
+            outline: "none",
+            background: saving ? T.bg : T.card,
+          }}
+          aria-label={label || "Edit price"}
+        />
+        <span style={{ fontSize: 12, color: T.textMuted }}>{currency}</span>
+        <button
+          onClick={handleSave}
+          disabled={saving}
+          style={{
+            background: T.green,
+            color: "#fff",
+            border: "none",
+            borderRadius: T.radiusSm,
+            padding: "4px 8px",
+            fontSize: 13,
+            cursor: "pointer",
+            fontFamily: T.font,
+          }}
+          aria-label="Validate price"
+        >
+          {saving ? "..." : "\u2713"}
+        </button>
+        <button
+          onClick={() => { setDraft(String(value)); setEditing(false); }}
+          style={{
+            background: "none",
+            border: `1px solid ${T.border}`,
+            borderRadius: T.radiusSm,
+            padding: "4px 8px",
+            fontSize: 13,
+            cursor: "pointer",
+            color: T.textSec,
+            fontFamily: T.font,
+          }}
+          aria-label="Cancel editing"
+        >
+          \u2715
+        </button>
+      </div>
+    );
+  }
+
+  return (
+    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
+      {label && (
+        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>{label}</span>
+      )}
+      <span style={{
+        fontSize: 16,
+        fontWeight: 700,
+        color: T.text,
+        fontFamily: T.font,
+      }}>
+        {formatDisplay(value)}
+      </span>
+      {!disabled && onSave && (
+        <button
+          onClick={() => setEditing(true)}
+          style={{
+            background: "none",
+            border: `1px solid ${T.border}`,
+            borderRadius: T.radiusSm,
+            padding: "3px 10px",
+            fontSize: 12,
+            fontWeight: 500,
+            color: T.accent,
+            cursor: "pointer",
+            fontFamily: T.font,
+            transition: T.transitionFast,
+          }}
+          aria-label={`Edit ${label || "price"}`}
+        >
+          Edit
+        </button>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/shared/StatCard.jsx b/src/components/dashboard/shared/StatCard.jsx
new file mode 100644
index 0000000..4eacd5f
--- /dev/null
+++ b/src/components/dashboard/shared/StatCard.jsx
@@ -0,0 +1,97 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+
+// Reusable stat card for dashboard overviews
+// Props: icon, label, value, subtitle, trend ({ value, positive }), onClick
+export default function StatCard({ icon, label, value, subtitle, trend, onClick }) {
+  const [hovered, setHovered] = useState(false);
+
+  return (
+    <div
+      style={{
+        background: T.card,
+        borderRadius: T.radius,
+        padding: "20px 24px",
+        border: `1px solid ${T.border}`,
+        boxShadow: hovered ? T.shadowMd : T.shadow,
+        cursor: onClick ? "pointer" : "default",
+        transition: T.transition,
+        transform: hovered && onClick ? "translateY(-2px)" : "none",
+        flex: 1,
+        minWidth: 0,
+      }}
+      onMouseEnter={() => setHovered(true)}
+      onMouseLeave={() => setHovered(false)}
+      onClick={onClick}
+      role={onClick ? "button" : undefined}
+      tabIndex={onClick ? 0 : undefined}
+      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
+    >
+      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
+        {icon && (
+          <span style={{
+            fontSize: 20,
+            width: 36,
+            height: 36,
+            display: "flex",
+            alignItems: "center",
+            justifyContent: "center",
+            borderRadius: T.radiusSm,
+            background: T.accentLight,
+          }}>
+            {icon}
+          </span>
+        )}
+        <span style={{
+          fontSize: 13,
+          fontWeight: 500,
+          color: T.textSec,
+          fontFamily: T.font,
+          letterSpacing: "0.01em",
+        }}>
+          {label}
+        </span>
+      </div>
+
+      <div style={{
+        fontSize: 28,
+        fontWeight: 700,
+        color: T.text,
+        fontFamily: T.font,
+        lineHeight: 1.2,
+      }}>
+        {value}
+      </div>
+
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        gap: 8,
+        marginTop: 6,
+      }}>
+        {trend && (
+          <span style={{
+            fontSize: 12,
+            fontWeight: 600,
+            color: trend.positive ? T.greenText : T.redText,
+            background: trend.positive ? T.greenBg : T.redBg,
+            padding: "2px 8px",
+            borderRadius: 99,
+            fontFamily: T.font,
+          }}>
+            {trend.positive ? "\u2191" : "\u2193"} {trend.value}
+          </span>
+        )}
+        {subtitle && (
+          <span style={{
+            fontSize: 12,
+            color: T.textMuted,
+            fontFamily: T.font,
+          }}>
+            {subtitle}
+          </span>
+        )}
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/shared/StatusBadge.jsx b/src/components/dashboard/shared/StatusBadge.jsx
new file mode 100644
index 0000000..0bd02f3
--- /dev/null
+++ b/src/components/dashboard/shared/StatusBadge.jsx
@@ -0,0 +1,36 @@
+import React from "react";
+import { T, TX_STATUS } from "../tokens";
+
+// StatusBadge — displays a colored pill for transaction status
+// Props: status (string key from TX_STATUS), size ("sm" | "md"), showIcon (bool), lang ("fr" | "en")
+export default function StatusBadge({ status, size = "md", showIcon = true, lang = "fr" }) {
+  const config = TX_STATUS[status];
+  if (!config) return null;
+
+  const isSmall = size === "sm";
+  const label = lang === "fr" ? config.labelFr : config.label;
+
+  return (
+    <span
+      style={{
+        display: "inline-flex",
+        alignItems: "center",
+        gap: isSmall ? 4 : 6,
+        padding: isSmall ? "2px 8px" : "4px 12px",
+        borderRadius: 99,
+        fontSize: isSmall ? 11 : 12,
+        fontWeight: 600,
+        fontFamily: T.font,
+        color: config.text,
+        background: config.bg,
+        border: `1px solid ${config.color}20`,
+        whiteSpace: "nowrap",
+        letterSpacing: "0.01em",
+      }}
+      title={label}
+    >
+      {showIcon && <span style={{ fontSize: isSmall ? 11 : 13 }}>{config.icon}</span>}
+      {label}
+    </span>
+  );
+}
diff --git a/src/components/dashboard/shared/useResponsive.js b/src/components/dashboard/shared/useResponsive.js
new file mode 100644
index 0000000..f7dba3c
--- /dev/null
+++ b/src/components/dashboard/shared/useResponsive.js
@@ -0,0 +1,22 @@
+import { useState, useEffect } from "react";
+
+// Responsive hook — as defined in CLAUDE.md
+// Breakpoints: mobile < 768px, tablet 768-1023px, desktop >= 1024px
+export const useResponsive = () => {
+  const [w, setW] = useState(
+    typeof window !== "undefined" ? window.innerWidth : 1200
+  );
+
+  useEffect(() => {
+    const handleResize = () => setW(window.innerWidth);
+    window.addEventListener("resize", handleResize);
+    return () => window.removeEventListener("resize", handleResize);
+  }, []);
+
+  return {
+    isMobile: w < 768,
+    isTablet: w >= 768 && w < 1024,
+    isDesktop: w >= 1024,
+    w,
+  };
+};
diff --git a/src/components/dashboard/tokens.js b/src/components/dashboard/tokens.js
new file mode 100644
index 0000000..4891ad7
--- /dev/null
+++ b/src/components/dashboard/tokens.js
@@ -0,0 +1,60 @@
+// ── Design Tokens — SUNTREX Dashboard ──────────────────────────────
+// Calqués sur sun.store avec l'identité SUNTREX
+
+export const T = {
+  // Colors
+  bg: "#f7f8fa",
+  card: "#ffffff",
+  border: "#e8eaef",
+  borderLight: "#f0f1f5",
+  text: "#1a1d26",
+  textSec: "#6b7280",
+  textMuted: "#9ca3af",
+  accent: "#E8700A",
+  accentHover: "#d46200",
+  accentLight: "#fff7ed",
+  green: "#10b981",
+  greenBg: "#ecfdf5",
+  greenText: "#065f46",
+  red: "#ef4444",
+  redBg: "#fef2f2",
+  redText: "#991b1b",
+  blue: "#3b82f6",
+  blueBg: "#eff6ff",
+  blueText: "#1e40af",
+  yellow: "#f59e0b",
+  yellowBg: "#fffbeb",
+  yellowText: "#92400e",
+  sidebar: "#1a1d26",
+  sidebarHover: "#2a2d36",
+  sidebarActive: "#33363f",
+
+  // Spacing & Shape
+  radius: 10,
+  radiusSm: 6,
+  radiusLg: 16,
+  radiusXl: 20,
+
+  // Typography
+  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
+
+  // Shadows
+  shadow: "0 1px 3px rgba(0,0,0,0.06)",
+  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
+  shadowLg: "0 8px 30px rgba(0,0,0,0.12)",
+
+  // Transitions
+  transition: "all 0.2s ease",
+  transitionFast: "all 0.15s ease",
+};
+
+// Status color mapping for transactions
+export const TX_STATUS = {
+  negotiation: { label: "Negotiation",  labelFr: "Negociation", color: T.yellow, bg: T.yellowBg, text: T.yellowText, icon: "\uD83D\uDCAC" },
+  confirmed:   { label: "Confirmed",    labelFr: "Confirmee",   color: T.blue,   bg: T.blueBg,   text: T.blueText,   icon: "\u2714\uFE0F" },
+  paid:        { label: "Paid",         labelFr: "Payee",       color: T.green,  bg: T.greenBg,  text: T.greenText,  icon: "\uD83D\uDCB3" },
+  shipped:     { label: "Shipped",      labelFr: "Expediee",    color: T.accent, bg: T.accentLight, text: T.accentHover, icon: "\uD83D\uDE9A" },
+  delivered:   { label: "Delivered",    labelFr: "Livree",      color: T.green,  bg: T.greenBg,  text: T.greenText,  icon: "\u2705" },
+  cancelled:   { label: "Cancelled",    labelFr: "Annulee",     color: T.textMuted, bg: "#f1f5f9", text: "#475569",   icon: "\u2715" },
+  disputed:    { label: "Disputed",     labelFr: "Litige",      color: T.red,    bg: T.redBg,    text: T.redText,    icon: "\u26A0\uFE0F" },
+};
diff --git a/src/components/dashboard/transaction/TransactionChat.jsx b/src/components/dashboard/transaction/TransactionChat.jsx
new file mode 100644
index 0000000..7b1add1
--- /dev/null
+++ b/src/components/dashboard/transaction/TransactionChat.jsx
@@ -0,0 +1,404 @@
+import React, { useState, useRef, useEffect } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+
+const formatDate = (d) =>
+  new Intl.DateTimeFormat("fr-FR", {
+    weekday: "long", day: "numeric", month: "short", year: "numeric",
+    hour: "2-digit", minute: "2-digit",
+  }).format(new Date(d));
+
+// ── Mock chat messages ─────────────────────────────────────────────
+const MOCK_MESSAGES = [
+  {
+    id: "msg-1",
+    senderRole: "system",
+    content: "Transaction creee. Le chat de negociation est ouvert.",
+    createdAt: "2026-02-24T23:49:00Z",
+  },
+  {
+    id: "msg-2",
+    senderRole: "buyer",
+    senderName: "SolarPro France",
+    content: "Bonjour, je suis interesse par l'achat d'un Huawei SUN2000-30KTL-M3 chez vous. Pourriez-vous me confirmer la disponibilite et le delai de livraison vers la France ?",
+    hasAddressCard: true,
+    addressCountry: "Netherlands",
+    addressZip: "24** **",
+    createdAt: "2026-02-24T23:50:00Z",
+    originalLang: "nl",
+    contentOriginal: "Hallo, ik ben geinteresseerd in de aankoop van een Huawei SUN2000-30KTL-M3 bij u. Kunt u de beschikbaarheid en levertijd naar Frankrijk bevestigen?",
+  },
+  {
+    id: "msg-3",
+    senderRole: "system",
+    content: "L'offre est valable 3 jours ouvrables.",
+    icon: "\u23F0",
+    createdAt: "2026-02-24T23:50:01Z",
+  },
+];
+
+export default function TransactionChat({ messages: propMessages, role, transactionId, onSendMessage, lang = "fr" }) {
+  const { isMobile } = useResponsive();
+  const [messages, setMessages] = useState(propMessages || MOCK_MESSAGES);
+  const [draft, setDraft] = useState("");
+  const [showTranslation, setShowTranslation] = useState({});
+  const [autoTranslate, setAutoTranslate] = useState(true);
+  const messagesEndRef = useRef(null);
+  const inputRef = useRef(null);
+
+  // Auto-scroll to bottom on new messages
+  useEffect(() => {
+    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
+  }, [messages]);
+
+  const handleSend = () => {
+    if (!draft.trim()) return;
+    const newMsg = {
+      id: `msg-${Date.now()}`,
+      senderRole: role,
+      senderName: role === "seller" ? "You" : "You",
+      content: draft.trim(),
+      createdAt: new Date().toISOString(),
+    };
+    setMessages(prev => [...prev, newMsg]);
+    onSendMessage?.(draft.trim());
+    setDraft("");
+    inputRef.current?.focus();
+  };
+
+  const toggleTranslation = (msgId) => {
+    setShowTranslation(prev => ({ ...prev, [msgId]: !prev[msgId] }));
+  };
+
+  const isSeller = role === "seller";
+
+  return (
+    <div style={{
+      background: T.card,
+      borderRadius: T.radius,
+      border: `1px solid ${T.border}`,
+      overflow: "hidden",
+      display: "flex",
+      flexDirection: "column",
+    }}>
+      {/* Translation banner */}
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        gap: 8,
+        padding: "10px 16px",
+        background: T.blueBg,
+        borderBottom: `1px solid ${T.blue}20`,
+        fontSize: 12,
+        color: T.blueText,
+        fontFamily: T.font,
+        fontWeight: 500,
+      }}>
+        <span style={{ fontSize: 16 }}>{"\uD83C\uDF10"}</span>
+        {lang === "fr"
+          ? "Cette negociation est automatiquement traduite en chat"
+          : "This negotiation is automatically translated in chat"}
+      </div>
+
+      {/* Messages area */}
+      <div style={{
+        flex: 1,
+        overflowY: "auto",
+        padding: isMobile ? 12 : 20,
+        maxHeight: 500,
+        minHeight: 200,
+      }}>
+        {messages.map((msg) => {
+          if (msg.senderRole === "system") {
+            return (
+              <SystemMessage key={msg.id} msg={msg} />
+            );
+          }
+
+          const isOwn = msg.senderRole === role;
+          return (
+            <ChatBubble
+              key={msg.id}
+              msg={msg}
+              isOwn={isOwn}
+              isMobile={isMobile}
+              showOriginal={showTranslation[msg.id]}
+              onToggleTranslation={() => toggleTranslation(msg.id)}
+              lang={lang}
+            />
+          );
+        })}
+        <div ref={messagesEndRef} />
+      </div>
+
+      {/* Delivery cost CTA (for seller, if not set) */}
+      {isSeller && (
+        <div style={{
+          padding: "12px 16px",
+          background: T.blueBg,
+          borderTop: `1px solid ${T.blue}20`,
+          display: "flex",
+          alignItems: isMobile ? "flex-start" : "center",
+          flexDirection: isMobile ? "column" : "row",
+          gap: 10,
+        }}>
+          <span style={{ fontSize: 16 }}>{"\uD83D\uDE9A"}</span>
+          <span style={{ flex: 1, fontSize: 13, color: T.blueText, fontFamily: T.font }}>
+            {lang === "fr"
+              ? "Indiquez les frais de livraison pour permettre a l'acheteur de proceder au paiement."
+              : "Set delivery costs to allow the buyer to proceed with payment."}
+          </span>
+          <button style={{
+            background: T.blue, color: "#fff",
+            border: "none", borderRadius: T.radiusSm,
+            padding: "8px 16px", fontSize: 12, fontWeight: 600,
+            cursor: "pointer", fontFamily: T.font,
+            whiteSpace: "nowrap",
+          }}>
+            {lang === "fr" ? "Prevoir les frais de livraison" : "Set delivery costs"}
+          </button>
+        </div>
+      )}
+
+      {/* Input area */}
+      <div style={{
+        borderTop: `1px solid ${T.border}`,
+        padding: "12px 16px",
+      }}>
+        {/* Toolbar */}
+        <div style={{
+          display: "flex",
+          alignItems: "center",
+          gap: 4,
+          marginBottom: 8,
+        }}>
+          <ToolbarButton label="B" style={{ fontWeight: 700 }} />
+          <ToolbarButton label="I" style={{ fontStyle: "italic" }} />
+          <ToolbarButton label="U" style={{ textDecoration: "underline" }} />
+          <div style={{ width: 1, height: 16, background: T.border, margin: "0 4px" }} />
+          <ToolbarButton label={"\uD83D\uDD17"} title="Link" />
+          <ToolbarButton label={"\uD83D\uDDBC\uFE0F"} title="Image" />
+          <ToolbarButton label={"\uD83D\uDE0A"} title="Emoji" />
+          <div style={{ flex: 1 }} />
+          <button
+            onClick={() => setAutoTranslate(!autoTranslate)}
+            style={{
+              background: autoTranslate ? T.greenBg : T.bg,
+              border: `1px solid ${autoTranslate ? T.green : T.border}`,
+              borderRadius: T.radiusSm,
+              padding: "4px 10px",
+              fontSize: 11, fontWeight: 600,
+              color: autoTranslate ? T.greenText : T.textMuted,
+              cursor: "pointer", fontFamily: T.font,
+              display: "flex", alignItems: "center", gap: 4,
+            }}
+          >
+            {"\uD83D\uDD04"} Auto-translate {lang === "fr" ? "FR" : "EN"}
+          </button>
+        </div>
+
+        {/* Text input + send */}
+        <div style={{
+          display: "flex",
+          gap: 8,
+          alignItems: "flex-end",
+        }}>
+          <textarea
+            ref={inputRef}
+            value={draft}
+            onChange={(e) => setDraft(e.target.value)}
+            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
+            placeholder={lang === "fr" ? "Ecrivez quelque chose..." : "Write something..."}
+            rows={2}
+            style={{
+              flex: 1,
+              padding: "10px 14px",
+              border: `1px solid ${T.border}`,
+              borderRadius: T.radius,
+              fontSize: 13,
+              fontFamily: T.font,
+              color: T.text,
+              resize: "vertical",
+              minHeight: 44,
+              maxHeight: 120,
+              outline: "none",
+            }}
+            aria-label={lang === "fr" ? "Message" : "Message"}
+          />
+          <button
+            onClick={handleSend}
+            disabled={!draft.trim()}
+            style={{
+              background: draft.trim() ? T.green : T.border,
+              color: "#fff",
+              border: "none",
+              borderRadius: T.radius,
+              width: 44, height: 44,
+              display: "flex", alignItems: "center", justifyContent: "center",
+              cursor: draft.trim() ? "pointer" : "not-allowed",
+              fontSize: 18,
+              transition: T.transitionFast,
+              flexShrink: 0,
+            }}
+            aria-label={lang === "fr" ? "Envoyer" : "Send"}
+          >
+            {"\uD83D\uDCE4"}
+          </button>
+        </div>
+      </div>
+    </div>
+  );
+}
+
+// ── System message ─────────────────────────────────────────────────
+function SystemMessage({ msg }) {
+  return (
+    <div style={{
+      textAlign: "center",
+      padding: "8px 0",
+      margin: "4px 0",
+    }}>
+      <span style={{
+        display: "inline-flex",
+        alignItems: "center",
+        gap: 6,
+        fontSize: 12,
+        color: T.textMuted,
+        fontFamily: T.font,
+        fontWeight: 500,
+        background: T.bg,
+        padding: "4px 12px",
+        borderRadius: 99,
+      }}>
+        {msg.icon && <span>{msg.icon}</span>}
+        {msg.content}
+      </span>
+    </div>
+  );
+}
+
+// ── Chat bubble ────────────────────────────────────────────────────
+function ChatBubble({ msg, isOwn, isMobile, showOriginal, onToggleTranslation, lang }) {
+  return (
+    <div style={{
+      display: "flex",
+      flexDirection: "column",
+      alignItems: isOwn ? "flex-end" : "flex-start",
+      margin: "12px 0",
+      maxWidth: isMobile ? "95%" : "80%",
+      marginLeft: isOwn ? "auto" : 0,
+      marginRight: isOwn ? 0 : "auto",
+    }}>
+      {/* Sender name + timestamp */}
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        gap: 8,
+        marginBottom: 4,
+        flexDirection: isOwn ? "row-reverse" : "row",
+      }}>
+        <span style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font }}>
+          {msg.senderRole === "buyer"
+            ? (lang === "fr" ? "Acheteur" : "Buyer")
+            : (lang === "fr" ? "Vendeur" : "Seller")}
+        </span>
+        <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>
+          {formatDate(msg.createdAt)}
+        </span>
+      </div>
+
+      {/* Bubble */}
+      <div style={{
+        background: isOwn ? T.text : T.card,
+        color: isOwn ? "#fff" : T.text,
+        border: isOwn ? "none" : `1px solid ${T.border}`,
+        borderRadius: 12,
+        borderTopRightRadius: isOwn ? 4 : 12,
+        borderTopLeftRadius: isOwn ? 12 : 4,
+        padding: "12px 16px",
+        fontSize: 13,
+        fontFamily: T.font,
+        lineHeight: 1.5,
+        boxShadow: T.shadow,
+      }}>
+        {showOriginal && msg.contentOriginal ? msg.contentOriginal : msg.content}
+
+        {/* Address card */}
+        {msg.hasAddressCard && (
+          <div style={{
+            marginTop: 10,
+            padding: "10px 12px",
+            background: isOwn ? "rgba(255,255,255,0.1)" : T.bg,
+            borderRadius: T.radiusSm,
+            border: `1px solid ${isOwn ? "rgba(255,255,255,0.15)" : T.borderLight}`,
+          }}>
+            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: isOwn ? "rgba(255,255,255,0.8)" : T.textSec }}>
+              {lang === "fr" ? "Adresse de livraison :" : "Delivery address:"}
+            </div>
+            <div style={{ fontSize: 13 }}>{msg.addressCountry}</div>
+            <div style={{ fontSize: 13 }}>{msg.addressZip}</div>
+          </div>
+        )}
+      </div>
+
+      {/* Translation toggle */}
+      {msg.contentOriginal && (
+        <button
+          onClick={onToggleTranslation}
+          style={{
+            background: "none",
+            border: "none",
+            color: T.accent,
+            fontSize: 11,
+            fontWeight: 500,
+            cursor: "pointer",
+            fontFamily: T.font,
+            padding: "4px 0",
+            marginTop: 2,
+          }}
+        >
+          {showOriginal
+            ? (lang === "fr" ? "Afficher la traduction" : "Show translation")
+            : (lang === "fr" ? "Afficher dans la langue originale" : "Show original language")}
+        </button>
+      )}
+
+      {/* Moderation indicator */}
+      {msg.flagged && (
+        <span style={{
+          fontSize: 11, color: T.textMuted, fontFamily: T.font,
+          display: "flex", alignItems: "center", gap: 4, marginTop: 2,
+        }}>
+          {"\uD83D\uDEE1\uFE0F"} {lang === "fr" ? "Modere par IA" : "AI moderated"}
+        </span>
+      )}
+    </div>
+  );
+}
+
+// ── Toolbar button ─────────────────────────────────────────────────
+function ToolbarButton({ label, title, style: customStyle }) {
+  const [hovered, setHovered] = useState(false);
+  return (
+    <button
+      title={title || label}
+      onMouseEnter={() => setHovered(true)}
+      onMouseLeave={() => setHovered(false)}
+      style={{
+        width: 28, height: 28,
+        display: "flex", alignItems: "center", justifyContent: "center",
+        background: hovered ? T.bg : "none",
+        border: "none",
+        borderRadius: 4,
+        fontSize: 13,
+        color: T.textSec,
+        cursor: "pointer",
+        fontFamily: T.font,
+        transition: T.transitionFast,
+        ...customStyle,
+      }}
+    >
+      {label}
+    </button>
+  );
+}
diff --git a/src/components/dashboard/transaction/TransactionDetails.jsx b/src/components/dashboard/transaction/TransactionDetails.jsx
new file mode 100644
index 0000000..ef20b25
--- /dev/null
+++ b/src/components/dashboard/transaction/TransactionDetails.jsx
@@ -0,0 +1,186 @@
+import React from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import TransactionTimeline from "./TransactionTimeline";
+
+const FLAG_EMOJI = { FR: "\uD83C\uDDEB\uD83C\uDDF7", DE: "\uD83C\uDDE9\uD83C\uDDEA", NL: "\uD83C\uDDF3\uD83C\uDDF1", BE: "\uD83C\uDDE7\uD83C\uDDEA", ES: "\uD83C\uDDEA\uD83C\uDDF8", IT: "\uD83C\uDDEE\uD83C\uDDF9" };
+
+const formatDate = (d) => {
+  if (!d) return "-";
+  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
+};
+
+// TransactionDetails — seller/buyer info panel + timeline
+// Props: transaction, role ("buyer"|"seller"), lang
+export default function TransactionDetails({ transaction, role, lang = "fr" }) {
+  const { isMobile } = useResponsive();
+  const isSeller = role === "seller";
+
+  // The "other party" details
+  const otherParty = isSeller ? transaction.buyer : transaction.seller;
+  const otherLabel = isSeller
+    ? (lang === "fr" ? "Details de l'acheteur" : "Buyer details")
+    : (lang === "fr" ? "Details du vendeur" : "Seller details");
+
+  return (
+    <div style={{
+      display: "flex",
+      flexDirection: isMobile ? "column" : "row",
+      gap: isMobile ? 16 : 20,
+    }}>
+      {/* Other party details */}
+      <div style={{
+        flex: 1,
+        background: T.card,
+        borderRadius: T.radius,
+        border: `1px solid ${T.border}`,
+        padding: isMobile ? 16 : 20,
+      }}>
+        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 16px" }}>
+          {otherLabel}
+        </h3>
+
+        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
+          {/* Company name */}
+          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
+            <div style={{
+              width: 36, height: 36, borderRadius: "50%",
+              background: `linear-gradient(135deg, ${T.accent}44, #f59e0b44)`,
+              display: "flex", alignItems: "center", justifyContent: "center",
+              fontSize: 13, fontWeight: 700, color: T.accent, flexShrink: 0,
+            }}>
+              {otherParty?.avatar || otherParty?.name?.[0] || "?"}
+            </div>
+            <div>
+              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>
+                {otherParty?.companyName || otherParty?.name}
+              </div>
+              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font }}>
+                {FLAG_EMOJI[otherParty?.country] || ""} {otherParty?.country}
+              </div>
+            </div>
+          </div>
+
+          {/* Stats pills */}
+          {!isSeller && otherParty?.stats && (
+            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
+              <InfoPill label={lang === "fr" ? "TVA" : "VAT"} value={otherParty.vatVerified ? "\u2713 Actif" : "\u2717"} color={otherParty.vatVerified ? T.greenText : T.redText} bg={otherParty.vatVerified ? T.greenBg : T.redBg} />
+              <InfoPill label={lang === "fr" ? "Tx completees" : "Completed tx"} value={String(otherParty.stats.completedTx || 0)} />
+              <InfoPill label={lang === "fr" ? "Offres actives" : "Active offers"} value={String(otherParty.stats.activeOffers || 0)} />
+              <InfoPill label={lang === "fr" ? "Depuis" : "Since"} value={formatDate(otherParty.stats.memberSince)} />
+              {otherParty.stats.rating && (
+                <InfoPill label="" value={`\u2B50 ${otherParty.stats.rating} (${otherParty.stats.reviewCount || 0})`} />
+              )}
+              {otherParty.stats.responseTime && (
+                <InfoPill label={"\uD83D\uDD50"} value={otherParty.stats.responseTime} />
+              )}
+            </div>
+          )}
+
+          {/* Address */}
+          {otherParty?.address && (
+            <div style={{
+              padding: 12,
+              background: T.bg,
+              borderRadius: T.radiusSm,
+              fontSize: 12,
+              color: T.textSec,
+              fontFamily: T.font,
+              lineHeight: 1.5,
+            }}>
+              <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>
+                {lang === "fr" ? "Adresse" : "Address"}
+              </div>
+              {otherParty.address}
+            </div>
+          )}
+        </div>
+      </div>
+
+      {/* Transaction details + Timeline */}
+      <div style={{
+        flex: 1,
+        background: T.card,
+        borderRadius: T.radius,
+        border: `1px solid ${T.border}`,
+        padding: isMobile ? 16 : 20,
+      }}>
+        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 16px" }}>
+          {lang === "fr" ? "Details de la transaction" : "Transaction details"}
+        </h3>
+
+        {/* Buyer contact info */}
+        {isSeller && transaction.buyer && (
+          <div style={{ marginBottom: 16, fontSize: 12, color: T.textSec, fontFamily: T.font }}>
+            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
+              <span>{FLAG_EMOJI[transaction.buyer.country] || ""}</span>
+              <span>{lang === "fr" ? "Coordonnees acheteur:" : "Buyer coordinates:"} {transaction.buyer.country}</span>
+            </div>
+            {transaction.buyer.vatVerified && (
+              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
+                <span style={{ color: T.green }}>{"\u2713"}</span>
+                <span>TVA: {lang === "fr" ? "Verifie" : "Verified"} ({formatDate(transaction.buyer.vatVerifiedAt)})</span>
+                <button style={{
+                  background: "none", border: "none",
+                  color: T.accent, fontSize: 11, fontWeight: 600,
+                  cursor: "pointer", fontFamily: T.font,
+                  textDecoration: "underline",
+                }}>
+                  {lang === "fr" ? "Reverifier" : "Re-verify"}
+                </button>
+              </div>
+            )}
+            {transaction.buyer.deliveryAddress && (
+              <div>
+                {lang === "fr" ? "Adresse livraison:" : "Delivery address:"} {transaction.buyer.deliveryAddress}
+              </div>
+            )}
+          </div>
+        )}
+
+        {/* Status timeline */}
+        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: 12 }}>
+          {lang === "fr" ? "Statut commande:" : "Order status:"}
+        </div>
+        <TransactionTimeline transaction={transaction} lang={lang} />
+
+        {/* Shipped by */}
+        {transaction.seller && (
+          <div style={{
+            marginTop: 16, paddingTop: 16,
+            borderTop: `1px solid ${T.borderLight}`,
+            fontSize: 12, color: T.textSec, fontFamily: T.font,
+          }}>
+            <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>
+              {lang === "fr" ? "Envoye par:" : "Shipped by:"}
+            </div>
+            <div>{transaction.seller.companyName || transaction.seller.name}</div>
+            {transaction.seller.address && <div>{transaction.seller.address}</div>}
+          </div>
+        )}
+      </div>
+    </div>
+  );
+}
+
+// ── Info pill helper ───────────────────────────────────────────────
+function InfoPill({ label, value, color, bg }) {
+  return (
+    <span style={{
+      display: "inline-flex",
+      alignItems: "center",
+      gap: 4,
+      padding: "3px 10px",
+      borderRadius: 99,
+      fontSize: 11,
+      fontWeight: 500,
+      fontFamily: T.font,
+      color: color || T.textSec,
+      background: bg || T.bg,
+      border: `1px solid ${T.borderLight}`,
+    }}>
+      {label && <span>{label}:</span>}
+      <span style={{ fontWeight: 600 }}>{value}</span>
+    </span>
+  );
+}
diff --git a/src/components/dashboard/transaction/TransactionPage.jsx b/src/components/dashboard/transaction/TransactionPage.jsx
new file mode 100644
index 0000000..60d43f6
--- /dev/null
+++ b/src/components/dashboard/transaction/TransactionPage.jsx
@@ -0,0 +1,425 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import { useDashboard } from "../DashboardLayout";
+import TransactionProducts from "./TransactionProducts";
+import TransactionChat from "./TransactionChat";
+import TransactionDetails from "./TransactionDetails";
+
+// ── Mock transaction data ──────────────────────────────────────────
+const MOCK_TX = {
+  id: "tx-001",
+  shortId: "#FHJ46JUm",
+  status: "negotiation",
+  createdAt: "2026-02-24T23:50:00Z",
+  confirmedAt: null,
+  paidAt: null,
+  shippedAt: null,
+  deliveredAt: null,
+  deliveryCost: null,
+  incoterms: "Delivery on premise",
+  items: [
+    {
+      id: "item-1",
+      name: "Huawei SUN2000-30KTL-M3",
+      sku: "CEM6k",
+      qty: 1,
+      price: 1555,
+      editedPrice: null,
+      editedQty: null,
+      vatRate: 0,
+      availability: 4,
+      shipDays: 3,
+      image: "/products/huawei-sun2000.jpg",
+    },
+  ],
+  buyer: {
+    name: "SolarPro France",
+    companyName: "QUALIWATT",
+    country: "NL",
+    avatar: "QW",
+    address: "16-18 rue Eiffel, 77220 Gretz-Armainvilliers",
+    deliveryAddress: "NL, 24** **",
+    vatVerified: true,
+    vatVerifiedAt: "2026-02-24",
+    stats: { completedTx: 0, activeOffers: 0 },
+  },
+  seller: {
+    name: "EnergyDist GmbH",
+    companyName: "EnergyDist GmbH",
+    country: "DE",
+    avatar: "ED",
+    address: "Industriestr. 42, 80339 Munchen",
+    vatVerified: true,
+    stats: {
+      completedTx: 11,
+      activeOffers: 52,
+      memberSince: "2025-12-09",
+      rating: 5.0,
+      reviewCount: 3,
+      responseTime: "< 2h",
+    },
+  },
+};
+
+// Map of mock transactions by ID
+const MOCK_TX_MAP = {
+  "tx-001": MOCK_TX,
+  "tx-002": { ...MOCK_TX, id: "tx-002", shortId: "#KM8p2Rxt", status: "confirmed", confirmedAt: "2026-02-23T14:20:00Z", deliveryCost: 180, items: [{ ...MOCK_TX.items[0], id: "item-2", name: "Deye SUN-12K-SG04LP3-EU", sku: "DEY12K", qty: 3, price: 1250 }], buyer: { ...MOCK_TX.buyer, name: "GreenBuild BE", companyName: "GreenBuild BVBA", country: "BE", avatar: "GB" } },
+  "tx-003": { ...MOCK_TX, id: "tx-003", shortId: "#QW3nY7Lk", status: "paid", confirmedAt: "2026-02-21T10:00:00Z", paidAt: "2026-02-22T09:15:00Z", deliveryCost: 320, items: [{ ...MOCK_TX.items[0], id: "item-3", name: "Enphase IQ8-HC Micro-Inverter", sku: "IQ8HC", qty: 50, price: 85 }], buyer: { ...MOCK_TX.buyer, name: "InstallSol ES", companyName: "InstallSol SL", country: "ES", avatar: "IS" } },
+  "tx-004": { ...MOCK_TX, id: "tx-004", shortId: "#RT5mD9Vx", status: "cancelled", cancelledBy: "seller", cancelReason: "Stock insuffisant", deliveryCost: null, items: [{ ...MOCK_TX.items[0], id: "item-4", name: "Huawei LUNA2000-5-E0", sku: "LUNA5E", qty: 5, price: 1261 }], buyer: { ...MOCK_TX.buyer, name: "SolarMax NL", companyName: "SolarMax BV", country: "NL", avatar: "SM" } },
+  "tx-005": { ...MOCK_TX, id: "tx-005", shortId: "#BN2kH8Wp", status: "delivered", confirmedAt: "2026-02-11T10:00:00Z", paidAt: "2026-02-12T09:00:00Z", shippedAt: "2026-02-14T08:00:00Z", deliveredAt: "2026-02-18T16:30:00Z", deliveryCost: 95, items: [{ ...MOCK_TX.items[0], id: "item-5", name: "ESDEC ClickFit EVO", sku: "ESDEC", qty: 200, price: 2.33 }], buyer: { ...MOCK_TX.buyer, name: "MountingPro IT", companyName: "MountingPro SRL", country: "IT", avatar: "MP" } },
+};
+
+export default function TransactionPage({ transactionId: propTxId }) {
+  const { isMobile, isTablet } = useResponsive();
+  const { transactionId: ctxTxId, setActiveSection, user, lang } = useDashboard();
+  const txId = propTxId || ctxTxId || "tx-001";
+
+  const [tx, setTx] = useState(MOCK_TX_MAP[txId] || MOCK_TX);
+  const [showCancelModal, setShowCancelModal] = useState(false);
+  const [cancelReason, setCancelReason] = useState("");
+
+  // Determine role (demo: always seller; in production, compare user.id with tx.buyer_id/seller_id)
+  const role = "seller";
+
+  const handleUpdatePrice = (itemId, newPrice) => {
+    setTx(prev => ({
+      ...prev,
+      items: prev.items.map(i => i.id === itemId ? { ...i, editedPrice: newPrice } : i),
+    }));
+  };
+
+  const handleUpdateQty = (itemId, newQty) => {
+    setTx(prev => ({
+      ...prev,
+      items: prev.items.map(i => i.id === itemId ? { ...i, editedQty: newQty } : i),
+    }));
+  };
+
+  const handleEditDeliveryCost = (cost) => {
+    setTx(prev => ({ ...prev, deliveryCost: cost }));
+  };
+
+  const handleCancel = () => {
+    if (!cancelReason.trim()) return;
+    setTx(prev => ({
+      ...prev,
+      status: "cancelled",
+      cancelledBy: role,
+      cancelReason: cancelReason.trim(),
+    }));
+    setShowCancelModal(false);
+    setCancelReason("");
+  };
+
+  const handleGoBack = () => {
+    setActiveSection("sales");
+  };
+
+  return (
+    <div>
+      {/* Breadcrumb */}
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        gap: 6,
+        marginBottom: 16,
+        fontSize: 13,
+        color: T.textMuted,
+        fontFamily: T.font,
+      }}>
+        <button
+          onClick={handleGoBack}
+          style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 500, padding: 0 }}
+        >
+          {lang === "fr" ? "Mes ventes" : "My sales"}
+        </button>
+        <span>{"\u203A"}</span>
+        <span>{lang === "fr" ? "Transactions" : "Transactions"}</span>
+        <span>{"\u203A"}</span>
+        <span style={{ color: T.text, fontWeight: 600 }}>Transaction {tx.shortId}</span>
+      </div>
+
+      {/* Header actions */}
+      <div style={{
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        justifyContent: "space-between",
+        flexDirection: isMobile ? "column" : "row",
+        gap: 12,
+        marginBottom: 20,
+      }}>
+        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
+          Transaction {tx.shortId}
+        </h1>
+        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
+          {role === "seller" && tx.status === "negotiation" && (
+            <button
+              style={{
+                background: T.card, color: T.accent,
+                border: `1px solid ${T.accent}`,
+                borderRadius: T.radiusSm,
+                padding: "8px 16px", fontSize: 13, fontWeight: 600,
+                cursor: "pointer", fontFamily: T.font,
+                display: "flex", alignItems: "center", gap: 6,
+                minHeight: 40,
+              }}
+            >
+              {"\u2795"} {lang === "fr" ? "Ajouter des produits" : "Add products"}
+            </button>
+          )}
+          {tx.status !== "cancelled" && tx.status !== "delivered" && (
+            <button
+              onClick={() => setShowCancelModal(true)}
+              style={{
+                background: T.card, color: T.red,
+                border: `1px solid ${T.red}40`,
+                borderRadius: T.radiusSm,
+                padding: "8px 16px", fontSize: 13, fontWeight: 600,
+                cursor: "pointer", fontFamily: T.font,
+                display: "flex", alignItems: "center", gap: 6,
+                minHeight: 40,
+              }}
+            >
+              {"\u2715"} {lang === "fr" ? "Annuler la transaction" : "Cancel transaction"}
+            </button>
+          )}
+        </div>
+      </div>
+
+      {/* Secure payment banner */}
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        gap: 8,
+        padding: "10px 16px",
+        background: T.greenBg,
+        borderRadius: T.radiusSm,
+        border: `1px solid ${T.green}20`,
+        marginBottom: 16,
+        fontSize: 13,
+        color: T.greenText,
+        fontFamily: T.font,
+        fontWeight: 500,
+      }}>
+        <span style={{ fontSize: 16 }}>{"\uD83D\uDEE1\uFE0F"}</span>
+        {lang === "fr"
+          ? "Des paiements securises sont disponibles via SUNTREX"
+          : "Secure payments are available via SUNTREX"}
+      </div>
+
+      {/* Buyer/Seller company banner */}
+      <div style={{
+        padding: "10px 16px",
+        background: T.card,
+        borderRadius: T.radiusSm,
+        border: `1px solid ${T.border}`,
+        marginBottom: 16,
+        fontSize: 13,
+        color: T.text,
+        fontFamily: T.font,
+        fontWeight: 500,
+      }}>
+        {tx.buyer.companyName}, {tx.buyer.address}
+      </div>
+
+      {/* Products card */}
+      <div style={{ marginBottom: 20 }}>
+        <TransactionProducts
+          items={tx.items}
+          role={role}
+          onUpdatePrice={handleUpdatePrice}
+          onUpdateQty={handleUpdateQty}
+          incoterms={tx.incoterms}
+          deliveryCost={tx.deliveryCost}
+          onEditDeliveryCost={handleEditDeliveryCost}
+          lang={lang}
+        />
+      </div>
+
+      {/* Add products expandable (seller) */}
+      {role === "seller" && tx.status === "negotiation" && (
+        <div style={{
+          padding: "12px 16px",
+          background: T.card,
+          borderRadius: T.radiusSm,
+          border: `1px solid ${T.border}`,
+          marginBottom: 20,
+          cursor: "pointer",
+          display: "flex",
+          alignItems: "center",
+          justifyContent: "space-between",
+        }}>
+          <span style={{ fontSize: 13, color: T.accent, fontWeight: 600, fontFamily: T.font, display: "flex", alignItems: "center", gap: 6 }}>
+            {"\u2795"} {lang === "fr" ? "Ajouter des produits de votre liste" : "Add products from your list"}
+          </span>
+          <span style={{ fontSize: 12, color: T.textMuted }}>{"\u25BC"}</span>
+        </div>
+      )}
+
+      {/* Chat */}
+      <div style={{ marginBottom: 20 }}>
+        <TransactionChat
+          role={role}
+          transactionId={tx.id}
+          lang={lang}
+        />
+      </div>
+
+      {/* Attachments section */}
+      <div style={{
+        padding: "14px 20px",
+        background: T.card,
+        borderRadius: T.radius,
+        border: `1px solid ${T.border}`,
+        marginBottom: 20,
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        flexDirection: isMobile ? "column" : "row",
+        justifyContent: "space-between",
+        gap: 12,
+      }}>
+        <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>
+          {lang === "fr" ? "Autres pieces jointes" : "Other attachments"}
+        </span>
+        <div style={{ display: "flex", gap: 8 }}>
+          <button style={{
+            background: T.accent, color: "#fff",
+            border: "none", borderRadius: T.radiusSm,
+            padding: "8px 14px", fontSize: 12, fontWeight: 600,
+            cursor: "pointer", fontFamily: T.font,
+          }}>
+            {lang === "fr" ? "Ajouter fichiers" : "Add files"}
+          </button>
+          <button style={{
+            background: T.card, color: T.textSec,
+            border: `1px solid ${T.border}`,
+            borderRadius: T.radiusSm,
+            padding: "8px 14px", fontSize: 12, fontWeight: 600,
+            cursor: "pointer", fontFamily: T.font,
+          }}>
+            {lang === "fr" ? "Rechercher" : "Search"}
+          </button>
+        </div>
+      </div>
+
+      {/* Support contact bar */}
+      <div style={{
+        padding: "12px 20px",
+        background: T.bg,
+        borderRadius: T.radiusSm,
+        border: `1px solid ${T.border}`,
+        marginBottom: 20,
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        flexDirection: isMobile ? "column" : "row",
+        justifyContent: "space-between",
+        gap: 10,
+        fontSize: 12,
+        color: T.textSec,
+        fontFamily: T.font,
+      }}>
+        <span>
+          {lang === "fr" ? "Contact assistance SUNTREX" : "SUNTREX Support Contact"} {" \u2022 "}
+          <span style={{ color: T.accent }}>contact@suntrex.com</span>
+        </span>
+        <button style={{
+          background: "none",
+          border: `1px solid ${T.red}40`,
+          borderRadius: T.radiusSm,
+          padding: "6px 12px",
+          fontSize: 12, fontWeight: 600,
+          color: T.red,
+          cursor: "pointer", fontFamily: T.font,
+        }}>
+          {lang === "fr" ? "Signaler" : "Report"}
+        </button>
+      </div>
+
+      {/* Details panels */}
+      <TransactionDetails
+        transaction={tx}
+        role={role}
+        lang={lang}
+      />
+
+      {/* Cancel modal */}
+      {showCancelModal && (
+        <>
+          <div
+            onClick={() => setShowCancelModal(false)}
+            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000 }}
+          />
+          <div style={{
+            position: "fixed",
+            top: "50%", left: "50%",
+            transform: "translate(-50%, -50%)",
+            width: isMobile ? "90%" : 440,
+            background: T.card,
+            borderRadius: T.radiusLg,
+            padding: 24,
+            zIndex: 1001,
+            boxShadow: T.shadowLg,
+          }}>
+            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.font, margin: "0 0 12px" }}>
+              {lang === "fr" ? "Annuler la transaction" : "Cancel transaction"}
+            </h3>
+            <p style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, margin: "0 0 16px", lineHeight: 1.5 }}>
+              {lang === "fr"
+                ? "Veuillez indiquer la raison de l'annulation. Cette information sera partagee avec l'autre partie."
+                : "Please provide a reason for cancellation. This will be shared with the other party."}
+            </p>
+            <textarea
+              value={cancelReason}
+              onChange={(e) => setCancelReason(e.target.value)}
+              placeholder={lang === "fr" ? "Raison de l'annulation..." : "Cancellation reason..."}
+              rows={3}
+              style={{
+                width: "100%",
+                padding: "10px 12px",
+                border: `1px solid ${T.border}`,
+                borderRadius: T.radiusSm,
+                fontSize: 13,
+                fontFamily: T.font,
+                color: T.text,
+                resize: "vertical",
+                outline: "none",
+                marginBottom: 16,
+              }}
+            />
+            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
+              <button
+                onClick={() => setShowCancelModal(false)}
+                style={{
+                  background: T.card, color: T.textSec,
+                  border: `1px solid ${T.border}`,
+                  borderRadius: T.radiusSm,
+                  padding: "8px 20px", fontSize: 13, fontWeight: 600,
+                  cursor: "pointer", fontFamily: T.font,
+                }}
+              >
+                {lang === "fr" ? "Retour" : "Back"}
+              </button>
+              <button
+                onClick={handleCancel}
+                disabled={!cancelReason.trim()}
+                style={{
+                  background: cancelReason.trim() ? T.red : T.border,
+                  color: "#fff",
+                  border: "none",
+                  borderRadius: T.radiusSm,
+                  padding: "8px 20px", fontSize: 13, fontWeight: 600,
+                  cursor: cancelReason.trim() ? "pointer" : "not-allowed",
+                  fontFamily: T.font,
+                }}
+              >
+                {lang === "fr" ? "Confirmer l'annulation" : "Confirm cancellation"}
+              </button>
+            </div>
+          </div>
+        </>
+      )}
+    </div>
+  );
+}
diff --git a/src/components/dashboard/transaction/TransactionProducts.jsx b/src/components/dashboard/transaction/TransactionProducts.jsx
new file mode 100644
index 0000000..25acc87
--- /dev/null
+++ b/src/components/dashboard/transaction/TransactionProducts.jsx
@@ -0,0 +1,240 @@
+import React, { useState } from "react";
+import { T } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+import PriceEditor from "../shared/PriceEditor";
+
+const formatPrice = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
+
+// TransactionProducts — editable product card(s) within a transaction
+// Props: items, role ("buyer"|"seller"), onUpdatePrice, onUpdateQty, onRemoveItem, incoterms, deliveryCost, onEditDeliveryCost, lang
+export default function TransactionProducts({ items = [], role, onUpdatePrice, onUpdateQty, onRemoveItem, incoterms = "Delivery on premise", deliveryCost, onEditDeliveryCost, lang = "fr" }) {
+  const { isMobile } = useResponsive();
+  const isSeller = role === "seller";
+
+  const subtotal = items.reduce((sum, item) => {
+    const price = item.editedPrice ?? item.price;
+    const qty = item.editedQty ?? item.qty;
+    return sum + price * qty;
+  }, 0);
+  const vatTotal = items.reduce((sum, item) => {
+    const price = item.editedPrice ?? item.price;
+    const qty = item.editedQty ?? item.qty;
+    return sum + price * qty * (item.vatRate || 0);
+  }, 0);
+  const total = subtotal + vatTotal + (deliveryCost || 0);
+
+  return (
+    <div style={{
+      background: T.card,
+      borderRadius: T.radius,
+      border: `1px solid ${T.border}`,
+      overflow: "hidden",
+    }}>
+      {/* Product rows */}
+      {items.map((item, idx) => (
+        <ProductRow
+          key={item.id || idx}
+          item={item}
+          isSeller={isSeller}
+          isMobile={isMobile}
+          onUpdatePrice={onUpdatePrice}
+          onUpdateQty={onUpdateQty}
+          onRemoveItem={onRemoveItem}
+          incoterms={incoterms}
+          isLast={idx === items.length - 1 && !deliveryCost && deliveryCost !== 0}
+          lang={lang}
+        />
+      ))}
+
+      {/* Delivery cost row */}
+      <div style={{
+        display: "flex",
+        alignItems: isMobile ? "flex-start" : "center",
+        flexDirection: isMobile ? "column" : "row",
+        justifyContent: "flex-end",
+        gap: isMobile ? 8 : 20,
+        padding: "12px 20px",
+        borderTop: `1px solid ${T.borderLight}`,
+        background: T.bg,
+      }}>
+        <span style={{ fontSize: 13, color: T.textSec, fontFamily: T.font, fontWeight: 500 }}>
+          {lang === "fr" ? "Livraison (brut):" : "Delivery (gross):"}
+        </span>
+        {deliveryCost != null ? (
+          <PriceEditor
+            value={deliveryCost}
+            onSave={isSeller ? onEditDeliveryCost : undefined}
+            disabled={!isSeller}
+          />
+        ) : (
+          <span style={{ fontSize: 13, color: T.accent, fontFamily: T.font, fontWeight: 600, fontStyle: "italic" }}>
+            {lang === "fr" ? "Prix sur demande" : "Price on request"}
+            {isSeller && (
+              <button
+                onClick={() => onEditDeliveryCost?.(0)}
+                style={{
+                  marginLeft: 10,
+                  background: T.accent, color: "#fff",
+                  border: "none", borderRadius: T.radiusSm,
+                  padding: "4px 12px", fontSize: 12, fontWeight: 600,
+                  cursor: "pointer", fontFamily: T.font,
+                }}
+              >
+                {lang === "fr" ? "Definir" : "Set"}
+              </button>
+            )}
+          </span>
+        )}
+      </div>
+
+      {/* Total row */}
+      <div style={{
+        display: "flex",
+        alignItems: "center",
+        justifyContent: "flex-end",
+        gap: 20,
+        padding: "14px 20px",
+        borderTop: `1px solid ${T.border}`,
+        background: T.card,
+      }}>
+        <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.font }}>
+          {lang === "fr" ? "Total (brut):" : "Total (gross):"}
+        </span>
+        <span style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: T.font }}>
+          {formatPrice(total)}
+        </span>
+      </div>
+    </div>
+  );
+}
+
+// ── Individual product row ─────────────────────────────────────────
+function ProductRow({ item, isSeller, isMobile, onUpdatePrice, onUpdateQty, onRemoveItem, incoterms, lang }) {
+  const [showDetails, setShowDetails] = useState(false);
+  const price = item.editedPrice ?? item.price;
+  const qty = item.editedQty ?? item.qty;
+  const lineTotal = price * qty;
+  const vat = lineTotal * (item.vatRate || 0);
+
+  return (
+    <div style={{
+      display: "flex",
+      flexDirection: isMobile ? "column" : "row",
+      gap: isMobile ? 12 : 0,
+      padding: isMobile ? 14 : "14px 20px",
+      borderBottom: `1px solid ${T.borderLight}`,
+    }}>
+      {/* Product image */}
+      <div style={{
+        width: isMobile ? 80 : 72,
+        height: isMobile ? 80 : 72,
+        borderRadius: T.radiusSm,
+        background: T.bg,
+        display: "flex", alignItems: "center", justifyContent: "center",
+        overflow: "hidden", flexShrink: 0,
+        marginRight: isMobile ? 0 : 16,
+      }}>
+        <img
+          src={item.image}
+          alt={item.name}
+          style={{ width: "100%", height: "100%", objectFit: "contain" }}
+          onError={(e) => { e.target.style.display = "none"; e.target.parentElement.textContent = "\uD83D\uDCE6"; }}
+        />
+      </div>
+
+      {/* Product info */}
+      <div style={{ flex: 1, minWidth: 0 }}>
+        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>
+          {item.name}
+        </div>
+        {item.sku && (
+          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
+            #{item.sku}
+          </div>
+        )}
+        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8, fontSize: 12, color: T.textSec, fontFamily: T.font }}>
+          {item.availability != null && (
+            <span>{lang === "fr" ? "Dispo" : "Avail"}: {item.availability} pcs</span>
+          )}
+          <span>Incoterms: {incoterms}</span>
+          {item.shipDays && (
+            <span>{lang === "fr" ? `Envoi: ~${item.shipDays} jours` : `Ships: ~${item.shipDays} days`}</span>
+          )}
+        </div>
+        <button
+          onClick={() => setShowDetails(!showDetails)}
+          style={{
+            background: "none", border: "none",
+            color: T.accent, fontSize: 12, fontWeight: 600,
+            cursor: "pointer", fontFamily: T.font,
+            padding: "4px 0", marginTop: 4,
+          }}
+        >
+          {showDetails
+            ? (lang === "fr" ? "Masquer les details" : "Hide details")
+            : (lang === "fr" ? "Details produit" : "Product details")}
+        </button>
+        {showDetails && (
+          <div style={{
+            marginTop: 8, padding: 12,
+            background: T.bg, borderRadius: T.radiusSm,
+            fontSize: 12, color: T.textSec, fontFamily: T.font,
+            lineHeight: 1.6,
+          }}>
+            {item.specs || (lang === "fr" ? "Specifications techniques du produit..." : "Technical product specifications...")}
+          </div>
+        )}
+      </div>
+
+      {/* Quantity + Price */}
+      <div style={{
+        display: "flex",
+        flexDirection: isMobile ? "row" : "column",
+        gap: isMobile ? 16 : 8,
+        alignItems: isMobile ? "center" : "flex-end",
+        flexShrink: 0,
+        minWidth: isMobile ? "auto" : 160,
+      }}>
+        {/* Quantity */}
+        <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>
+          {lang === "fr" ? "Qte" : "Qty"}: <strong style={{ color: T.text }}>{qty} pc</strong>
+          {isSeller && (
+            <button
+              onClick={() => {
+                const newQty = prompt(lang === "fr" ? "Nouvelle quantite:" : "New quantity:", qty);
+                if (newQty && !isNaN(newQty) && parseInt(newQty) > 0) {
+                  onUpdateQty?.(item.id, parseInt(newQty));
+                }
+              }}
+              style={{
+                marginLeft: 6,
+                background: "none", border: `1px solid ${T.border}`,
+                borderRadius: T.radiusSm, padding: "1px 6px",
+                fontSize: 11, color: T.accent, cursor: "pointer",
+                fontFamily: T.font,
+              }}
+            >
+              {lang === "fr" ? "Modifier" : "Edit"}
+            </button>
+          )}
+        </div>
+
+        {/* Price */}
+        <div>
+          <PriceEditor
+            value={price}
+            onSave={isSeller ? (newPrice) => onUpdatePrice?.(item.id, newPrice) : undefined}
+            disabled={!isSeller}
+            label={lang === "fr" ? "Prix:" : "Price:"}
+          />
+        </div>
+
+        {/* VAT + Net */}
+        <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, textAlign: isMobile ? "left" : "right" }}>
+          <div>TVA: {formatPrice(vat)}</div>
+          <div style={{ fontWeight: 600, color: T.text }}>Net: {formatPrice(lineTotal + vat)}</div>
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/dashboard/transaction/TransactionTimeline.jsx b/src/components/dashboard/transaction/TransactionTimeline.jsx
new file mode 100644
index 0000000..331a95e
--- /dev/null
+++ b/src/components/dashboard/transaction/TransactionTimeline.jsx
@@ -0,0 +1,136 @@
+import React from "react";
+import { T, TX_STATUS } from "../tokens";
+import { useResponsive } from "../shared/useResponsive";
+
+const PIPELINE = [
+  { status: "negotiation", label: "Opening negotiation",  labelFr: "Ouverture nego" },
+  { status: "confirmed",   label: "Transaction confirmed", labelFr: "Tx confirmee" },
+  { status: "paid",        label: "Paid",                  labelFr: "Paye" },
+  { status: "shipped",     label: "Shipped",               labelFr: "Expedie" },
+  { status: "delivered",   label: "Delivered",              labelFr: "Livre" },
+];
+
+const STATUS_ORDER = ["negotiation", "confirmed", "paid", "shipped", "delivered"];
+
+const formatDate = (d) => {
+  if (!d) return null;
+  const date = new Date(d);
+  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(date);
+};
+
+export default function TransactionTimeline({ transaction, lang = "fr" }) {
+  const { isMobile } = useResponsive();
+  const currentIdx = STATUS_ORDER.indexOf(transaction.status);
+  const isCancelled = transaction.status === "cancelled";
+  const isDisputed = transaction.status === "disputed";
+
+  const getLabel = (step) => lang === "fr" ? step.labelFr : step.label;
+
+  const timestamps = {
+    negotiation: transaction.createdAt,
+    confirmed: transaction.confirmedAt,
+    paid: transaction.paidAt,
+    shipped: transaction.shippedAt,
+    delivered: transaction.deliveredAt,
+  };
+
+  return (
+    <div style={{ padding: isMobile ? 0 : "0 4px" }}>
+      {/* Cancelled/Disputed banner */}
+      {(isCancelled || isDisputed) && (
+        <div style={{
+          padding: "10px 14px",
+          borderRadius: T.radiusSm,
+          background: isCancelled ? "#f1f5f9" : T.redBg,
+          border: `1px solid ${isCancelled ? T.border : T.red}20`,
+          marginBottom: 16,
+          display: "flex",
+          alignItems: "center",
+          gap: 8,
+        }}>
+          <span style={{ fontSize: 16 }}>{isCancelled ? "\u2715" : "\u26A0\uFE0F"}</span>
+          <div>
+            <div style={{ fontSize: 13, fontWeight: 600, color: isCancelled ? T.textSec : T.redText, fontFamily: T.font }}>
+              {isCancelled
+                ? (lang === "fr" ? "Transaction annulee" : "Transaction cancelled")
+                : (lang === "fr" ? "Litige ouvert" : "Dispute opened")}
+            </div>
+            {transaction.cancelReason && (
+              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>
+                {transaction.cancelReason}
+              </div>
+            )}
+          </div>
+        </div>
+      )}
+
+      {/* Timeline steps */}
+      {PIPELINE.map((step, idx) => {
+        const stepIdx = STATUS_ORDER.indexOf(step.status);
+        const isCompleted = !isCancelled && !isDisputed && stepIdx <= currentIdx;
+        const isCurrent = !isCancelled && !isDisputed && stepIdx === currentIdx;
+        const isLast = idx === PIPELINE.length - 1;
+        const timestamp = timestamps[step.status];
+
+        return (
+          <div key={step.status} style={{
+            display: "flex",
+            alignItems: "flex-start",
+            gap: 12,
+            position: "relative",
+            paddingBottom: isLast ? 0 : 20,
+          }}>
+            {/* Vertical line */}
+            {!isLast && (
+              <div style={{
+                position: "absolute",
+                left: 9,
+                top: 20,
+                width: 2,
+                height: "calc(100% - 20px)",
+                background: isCompleted ? T.green : T.borderLight,
+              }} />
+            )}
+
+            {/* Circle */}
+            <div style={{
+              width: 20, height: 20,
+              borderRadius: "50%",
+              background: isCompleted ? T.green : T.card,
+              border: `2px solid ${isCompleted ? T.green : T.border}`,
+              display: "flex", alignItems: "center", justifyContent: "center",
+              flexShrink: 0,
+              zIndex: 1,
+            }}>
+              {isCompleted && (
+                <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>{"\u2713"}</span>
+              )}
+            </div>
+
+            {/* Label + timestamp */}
+            <div style={{ flex: 1 }}>
+              <div style={{
+                fontSize: 13,
+                fontWeight: isCurrent ? 700 : 500,
+                color: isCompleted ? T.text : T.textMuted,
+                fontFamily: T.font,
+              }}>
+                {isCurrent ? "\u25CF " : "\u25CB "}{getLabel(step)}
+              </div>
+              {timestamp && (
+                <div style={{
+                  fontSize: 11,
+                  color: T.textMuted,
+                  fontFamily: T.font,
+                  marginTop: 2,
+                }}>
+                  {formatDate(timestamp)}
+                </div>
+              )}
+            </div>
+          </div>
+        );
+      })}
+    </div>
+  );
+}
diff --git a/src/components/ui/BrandLogo.jsx b/src/components/ui/BrandLogo.jsx
index a73112c..5a668e1 100644
--- a/src/components/ui/BrandLogo.jsx
+++ b/src/components/ui/BrandLogo.jsx
@@ -1,27 +1,50 @@
 import { useState } from "react";
 
+// Best available logo file for each brand slug
+const LOGO_FILES = {
+  huawei: "huawei.svg",
+  jinko: "jinko.svg",
+  trina: "trinasolar.png",
+  longi: "longi.svg",
+  "ja-solar": "ja-solar.svg",
+  "canadian-solar": "canadian-solar.svg",
+  sma: "sma.svg",
+  sungrow: "sungrow.png",
+  solaredge: "solaredge.svg",
+  goodwe: "goodwe.svg",
+  growatt: "growatt.png",
+  risen: "risen.svg",
+  byd: "byd.svg",
+  deye: "deye.png",
+  enphase: "enphase.svg",
+};
+
 export default function BrandLogo({ brand }) {
-  const [failed, setFailed] = useState(false);
+  const [err, setErr] = useState(false);
+  const file = LOGO_FILES[brand.f];
 
-  if (!failed) {
+  if (err || !file) {
     return (
-      <img
-        src={`/logos/${brand.f}.svg`}
-        alt={brand.n}
-        style={{ height: 36, maxWidth: 140, objectFit: "contain" }}
-        onError={() => setFailed(true)}
-      />
+      <span style={{
+        fontSize: brand.n.length > 12 ? 14 : 18,
+        fontWeight: 700,
+        color: brand.c,
+        whiteSpace: "nowrap",
+        minWidth: 100,
+        textAlign: "center",
+        fontFamily: "'Inter', 'DM Sans', sans-serif",
+      }}>
+        {brand.n}
+      </span>
     );
   }
+
   return (
-    <span style={{
-      fontSize: brand.n.length > 10 ? 16 : 20,
-      fontWeight: 800,
-      color: brand.c,
-      whiteSpace: "nowrap",
-      fontFamily: "'Inter', 'DM Sans', sans-serif",
-    }}>
-      {brand.n}
-    </span>
+    <img
+      src={`/logos/${file}`}
+      alt={brand.n}
+      style={{ height: 28, objectFit: "contain", maxWidth: 140, minWidth: 80 }}
+      onError={() => setErr(true)}
+    />
   );
 }
diff --git a/src/data/catalog.js b/src/data/catalog.js
new file mode 100644
index 0000000..4326f82
--- /dev/null
+++ b/src/data/catalog.js
@@ -0,0 +1,792 @@
+// SUNTREX — Full Product Catalog (parsed from Article_3.csv)
+// Auto-generated — 638 products
+// Do NOT edit manually
+
+const CATALOG = [
+  { name: "Module Monocristallin Demi Cellules RECOM 375 Wc - PANTHER - Half-Cut Full Black", sku: "RCM-375-6ME", brand: "RECOM SILLIA", category: "panels", price: 65.36, stock: 4055, power: "375 Wc", type: "" },
+  { name: "APsystems ECU Résidentiel - Passerelle de communication pour DS3 - QT2 (Zigbee -", sku: "APS/ECU-R", brand: "AP Systems", category: "micro-inverters", price: 120.98205, stock: 0, power: "", type: "" },
+  { name: "Vis à tête cylindrique denture de blocage M8x20 ISO 4762.", sku: "K2S/2001729", brand: "K2 SYSTEMS", category: "accessories", price: 0.189618, stock: 0, power: "", type: "" },
+  { name: "Ecrou-prisonnier MK2 avec clip de montage, Acier inox", sku: "K2S/1001643", brand: "K2 SYSTEMS", category: "mounting", price: 0.525756, stock: 0, power: "", type: "" },
+  { name: "STRUCTURE K2", sku: "STRUCTUREK2", brand: "K2 SYSTEMS", category: "mounting", price: 0.7, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Coupleur de rail", sku: "ESD/1008061", brand: "ESDEC", category: "mounting", price: 2.328, stock: 8081, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 1188mm", sku: "1008131", brand: "ESDEC", category: "mounting", price: 12.68, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 2338mm - Bitume Isole", sku: "ESD/1008132", brand: "ESDEC", category: "mounting", price: 13.794, stock: 1930, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 3488mm", sku: "ESD/1008133", brand: "ESDEC", category: "mounting", price: 19.464, stock: 324, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 4638mm", sku: "1008134", brand: "ESDEC", category: "mounting", price: 42.83, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 5770mm", sku: "1008135", brand: "ESDEC", category: "mounting", price: 53.5, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 6923mm [DTO] [50 D]", sku: "1008136", brand: "ESDEC", category: "mounting", price: 65.12, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 3374mm [DTO] [50 D]", sku: "1008143", brand: "ESDEC", category: "mounting", price: 32.45, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 4485mm [DTO] [50 D]", sku: "1008144", brand: "ESDEC", category: "mounting", price: 45.09, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 5594mm [DTO] [50 D]", sku: "1008145", brand: "ESDEC", category: "mounting", price: 53.81, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Rail de montage 6707mm [DTO] [50 D]", sku: "1008146", brand: "ESDEC", category: "mounting", price: 64.53, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Crochet de toit liteau-Fermette - UniversalHook", sku: "ESD/1008040", brand: "ESDEC", category: "mounting", price: 6.036, stock: 3854, power: "", type: "" },
+  { name: "ClickFit EVO - Crochet de toit universel (basse température)", sku: "1008040-LT", brand: "ESDEC", category: "mounting", price: 10.8, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO crochet de toit en ardoise", sku: "ESD/1008042", brand: "ESDEC", category: "mounting", price: 6.42, stock: 2528, power: "", type: "" },
+  { name: "ClickFit EVO - Crochet de toit chevron - TrussHook", sku: "ESD/1008045", brand: "ESDEC", category: "mounting", price: 6.942, stock: 1762, power: "", type: "" },
+  { name: "ClickFit EVO - Entretoise caoutchouc protection tuile", sku: "ESD/1008063", brand: "ESDEC", category: "mounting", price: 0.858, stock: 8889, power: "", type: "" },
+  { name: "ClickFit EVO - Platine ISObouw d'adaptation", sku: "1008092", brand: "ESDEC", category: "mounting", price: 5.78, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Pince Joint arrondi 23mm", sku: "1008031", brand: "ESDEC", category: "mounting", price: 16.52, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Pince Joint double plié 9mm", sku: "1008033", brand: "ESDEC", category: "mounting", price: 13.62, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Pince Joint plié simple 14mm", sku: "1008035", brand: "ESDEC", category: "mounting", price: 14.8, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - SteelDeck Paysage", sku: "1008048", brand: "ESDEC", category: "mounting", price: 2.94, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - SteelDeck Portrait", sku: "1008049", brand: "ESDEC", category: "mounting", price: 6.52, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Profil de montage SteelDeck Optimizer Ready - Paysage", sku: "1008050", brand: "ESDEC", category: "optimizers", price: 7.67, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Profil de montage SteelDeck Optimizer Ready - Portrait", sku: "1008051", brand: "ESDEC", category: "optimizers", price: 10.93, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Adaptateur EPDM tôle ondulée - Paysage", sku: "1008081", brand: "ESDEC", category: "mounting", price: 2.11, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Adaptateur EPDM tole ondulé Optimizer ready - Paysage", sku: "1008082", brand: "ESDEC", category: "optimizers", price: 4.36, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Support de montage toit en fibrociment", sku: "ESD/1008090", brand: "ESDEC", category: "mounting", price: 4.56, stock: 1200, power: "", type: "" },
+  { name: "ClickFit EVO Adaptateur pour vis à double filetage M10-M12", sku: "1008010", brand: "ESDEC", category: "mounting", price: 8.88, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Vis à double filetage M10x200 mm", sku: "1008011", brand: "ESDEC", category: "mounting", price: 8.95, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Tire-fond / Vis à double filetage M10x250mm", sku: "ESD/1008012", brand: "ESDEC", category: "mounting", price: 5.646, stock: 4551, power: "", type: "" },
+  { name: "ClickFit EVO Vis à double filetage M12x250mm", sku: "1008013", brand: "ESDEC", category: "mounting", price: 12.11, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Vis à double filetage M12x300mm", sku: "1008014", brand: "ESDEC", category: "mounting", price: 13.44, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO Vis à double filetage M12x350mm", sku: "1008015", brand: "ESDEC", category: "mounting", price: 14.78, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Etrier universel Gris", sku: "1008020", brand: "ESDEC", category: "mounting", price: 3.23, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Etrier Universel Noir", sku: "ESD/1008020-B", brand: "ESDEC", category: "mounting", price: 2.424, stock: 5379, power: "", type: "" },
+  { name: "ClickFit EVO - Terminaison de rail gris", sku: "1008060", brand: "ESDEC", category: "mounting", price: 1.52, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Terminaison de rail Noir", sku: "ESD/1008060-B", brand: "ESDEC", category: "mounting", price: 0.92, stock: 3747, power: "", type: "" },
+  { name: "ClickFit EVO - Clip Optimizer Ready", sku: "ESD/1008062", brand: "ESDEC", category: "optimizers", price: 1.122, stock: 987, power: "", type: "" },
+  { name: "ClickFit EVO - Guide d'aide au montage", sku: "1008064", brand: "ESDEC", category: "mounting", price: 0.98, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Support étrier final gris", sku: "1008065", brand: "ESDEC", category: "mounting", price: 1.35, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Support étrier final - Noir", sku: "1008065-B", brand: "ESDEC", category: "mounting", price: 1.35, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Bouchon de rail - Gris", sku: "1008066", brand: "ESDEC", category: "mounting", price: 1.31, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Bouchon de rail - Noir", sku: "1008066-B", brand: "ESDEC", category: "mounting", price: 1.31, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Embouts Torx 30", sku: "ESD/1008069", brand: "ESDEC", category: "mounting", price: 1.464, stock: 1983, power: "", type: "" },
+  { name: "Rail de montage ClickFit 3075mm", sku: "1001003", brand: "ESDEC", category: "mounting", price: 39.65, stock: 0, power: "", type: "" },
+  { name: "Rail de montage ClickFit 6150 mm", sku: "1001005", brand: "ESDEC", category: "mounting", price: 79.28, stock: 0, power: "", type: "" },
+  { name: "Rail de montage L = 2055mm [DTO] [50 D]", sku: "1001200", brand: "ESDEC", category: "mounting", price: 26.53, stock: 0, power: "", type: "" },
+  { name: "Rail de montage L = 3400mm [DTO] [50 D]", sku: "1001301", brand: "ESDEC", category: "mounting", price: 44.34, stock: 0, power: "", type: "" },
+  { name: "Rail de montage L = 4055mm [DTO] [50 D]", sku: "1001400", brand: "ESDEC", category: "mounting", price: 52.34, stock: 0, power: "", type: "" },
+  { name: "Rail de montage L = 5055mm [DTO] [50 D]", sku: "1001500", brand: "ESDEC", category: "mounting", price: 65.2, stock: 0, power: "", type: "" },
+  { name: "Rail de montage L = 5500mm [DTO] [50 D]", sku: "1001501", brand: "ESDEC", category: "mounting", price: 70.94, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit standard ClickFit (30-39 mm)", sku: "1002001", brand: "ESDEC", category: "mounting", price: 6.03, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit standard ClickFit (30-39 mm) HV", sku: "1002002", brand: "ESDEC", category: "mounting", price: 8.28, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit standard ClickFit (30-39 mm) HVG", sku: "1002004", brand: "ESDEC", category: "mounting", price: 7.59, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit médium ClickFit (40-50 mm)", sku: "1002010", brand: "ESDEC", category: "mounting", price: 6.03, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit médium ClickFit (40-50 mm) HV", sku: "1002011", brand: "ESDEC", category: "mounting", price: 8.28, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit médium ClickFit (40-50 mm) HVG", sku: "1002013", brand: "ESDEC", category: "mounting", price: 7.59, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit large ClickFit (51-63 mm)", sku: "1002020", brand: "ESDEC", category: "mounting", price: 6.03, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit large ClickFit (51-63 mm) HV", sku: "1002021", brand: "ESDEC", category: "mounting", price: 8.28, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit large ClickFit (51-63 mm) HVG", sku: "1002023", brand: "ESDEC", category: "mounting", price: 7.59, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit multi ClickFit (30-63 mm)", sku: "1002030", brand: "ESDEC", category: "mounting", price: 7.85, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit multi ClickFit (30-63 mm) HV", sku: "1002031", brand: "ESDEC", category: "mounting", price: 8.72, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation au toit multi ClickFit (30-63 mm) HVG", sku: "1002033", brand: "ESDEC", category: "mounting", price: 8.72, stock: 0, power: "", type: "" },
+  { name: "Crochet de fixation pour bardage ClickFit [DTO] [15 D]", sku: "1002043", brand: "ESDEC", category: "mounting", price: 10.19, stock: 0, power: "", type: "" },
+  { name: "Crochet en acier inoxydable réglable", sku: "1002046", brand: "ESDEC", category: "mounting", price: 12.36, stock: 0, power: "", type: "" },
+  { name: "Bande EPDM 25mm x 25M ClickFit", sku: "1000005", brand: "ESDEC", category: "mounting", price: 41.41, stock: 0, power: "", type: "" },
+  { name: "Collier de montage ClickFit", sku: "1002060", brand: "ESDEC", category: "mounting", price: 4.89, stock: 0, power: "", type: "" },
+  { name: "Connecteur croisé ClickFit", sku: "1002080", brand: "ESDEC", category: "mounting", price: 4.89, stock: 0, power: "", type: "" },
+  { name: "Embout de rail de montage ClickFit noir", sku: "1003030", brand: "ESDEC", category: "mounting", price: 1.84, stock: 0, power: "", type: "" },
+  { name: "Cale de montage ClickFit 5-25 mm", sku: "1003061", brand: "ESDEC", category: "mounting", price: 5, stock: 0, power: "", type: "" },
+  { name: "Bloc de réglage de la hauteur ClickFit 15 mm", sku: "1003065", brand: "ESDEC", category: "mounting", price: 2.34, stock: 0, power: "", type: "" },
+  { name: "Bague ClickFit", sku: "1009001", brand: "ESDEC", category: "mounting", price: 0.47, stock: 0, power: "", type: "" },
+  { name: "FlatFix Fusion - Embase support de toit", sku: "1007012", brand: "ESDEC", category: "mounting", price: 2.36, stock: 0, power: "", type: "" },
+  { name: "FlatFix Fusion Supports de ballast 2000", sku: "1007086", brand: "ESDEC", category: "mounting", price: 29.64, stock: 0, power: "", type: "" },
+  { name: "FlatFix Fusion - Profilé de base 210 mm noir", sku: "1007621", brand: "ESDEC", category: "accessories", price: 5.94, stock: 0, power: "", type: "" },
+  { name: "Pince de terminaison ClickFit CFA", sku: "1003003", brand: "ESDEC", category: "mounting", price: 3.26, stock: 0, power: "", type: "" },
+  { name: "Pince de terminaison ClickFit CFB", sku: "1003004", brand: "ESDEC", category: "mounting", price: 3.26, stock: 0, power: "", type: "" },
+  { name: "Pince de terminaison ClickFit CFA noire", sku: "1003950", brand: "ESDEC", category: "mounting", price: 4.8, stock: 0, power: "", type: "" },
+  { name: "FlatFix - Etrier Final Gris 37mm [DTO] [40 D]", sku: "1004337", brand: "ESDEC", category: "accessories", price: 2.69, stock: 0, power: "", type: "" },
+  { name: "Vis de fixation M6 x 12mm", sku: "1000612", brand: "ESDEC", category: "mounting", price: 0.41, stock: 0, power: "", type: "" },
+  { name: "Vis de fixation M6 x 12mm - Black", sku: "1000612-B", brand: "ESDEC", category: "mounting", price: 0.49, stock: 0, power: "", type: "" },
+  { name: "Vis de fixation M6 x 55mm", sku: "1000655", brand: "ESDEC", category: "mounting", price: 0.72, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Vis autoperceuse 6,3 x 42 mm - SW10/T30", sku: "ESD/1003016", brand: "ESDEC", category: "mounting", price: 0.222, stock: 3394, power: "", type: "" },
+  { name: "Plaque de raccord ClickFit", sku: "1003040", brand: "ESDEC", category: "mounting", price: 4.71, stock: 0, power: "", type: "" },
+  { name: "ESDEC Rondelle ClickFit ø80 mm x 1 mm / Disque d’étanchéité tôle ondulée", sku: "ESD/1003070", brand: "ESDEC", category: "mounting", price: 2.676, stock: 214, power: "", type: "" },
+  { name: "Vis pour panneau de particules ClickFit 5 x 40 mm", sku: "1003540", brand: "ESDEC", category: "panels", price: 0.43, stock: 0, power: "", type: "" },
+  { name: "Vis pour panneau de particules ClickFit 5 x 60 mm [DTO] [7 D]", sku: "1003560", brand: "ESDEC", category: "panels", price: 0.47, stock: 0, power: "", type: "" },
+  { name: "ESDEC Joint d'étanchéité Kit Shell Tixophalte", sku: "ESD/1003900", brand: "ESDEC", category: "mounting", price: 7.98, stock: 0, power: "", type: "" },
+  { name: "Vis de montage 6.5 x 63 mm antivol", sku: "1006363", brand: "ESDEC", category: "accessories", price: 3, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Vis auto-taraudeuse 6.0 x 25 mm SW10 HEX/T30", sku: "ESD/1008085", brand: "ESDEC", category: "mounting", price: 0.59, stock: 100, power: "", type: "" },
+  { name: "Kit pour toiture EPDM", sku: "1008086", brand: "ESDEC", category: "mounting", price: 13.3, stock: 0, power: "", type: "" },
+  { name: "Enphase micro-onduleur IQ8-PLUS - 300 VA - Entrée MC4 - (IQ8PLUS-72-M-INT)", sku: "EN/IQ8-PLUS", brand: "Enphase", category: "micro-inverters", price: 80, stock: 647, power: "", type: "Micro" },
+  { name: "Enphase micro-onduleur IQ8-MC - 330 VA - Entrée MC4 - (IQ8MC-72-M-INT)", sku: "IQ8MC-72-M-INT", brand: "Enphase", category: "micro-inverters", price: 126.91, stock: 0, power: "", type: "Micro" },
+  { name: "Hoymiles micro-onduleur 2 en 1 HMS-800 - 800 VA - Connecteurs MC4 - 2 MPPT (Modè", sku: "HM/HMS-800-2T", brand: "HOYMILES", category: "micro-inverters", price: 105, stock: 4061, power: "", type: "Micro" },
+  { name: "Hoymiles micro-onduleur HMS-1600 - 1600 VA - Connecteurs MC4 - 4 MPPT", sku: "HM/HMS-1600-4T", brand: "HOYMILES", category: "micro-inverters", price: 175, stock: 82, power: "", type: "Micro" },
+  { name: "Hoymiles micro-onduleur 4 en 1 HMT-2000 - 2000 VA - Connecteurs MC4 - 4 MPPT", sku: "HM/HMT-2000-4T", brand: "HOYMILES", category: "micro-inverters", price: 220, stock: 72, power: "", type: "Micro" },
+  { name: "Hoymiles micro-onduleur 6 en 1 HMT-2250 - 2250 VA - Connecteurs MC4 - 6 MPPT", sku: "HM/HMT-2250-6T", brand: "HOYMILES", category: "micro-inverters", price: 230, stock: 86, power: "", type: "Micro" },
+  { name: "Passerelle de communication Hoymiles DTU-ProS - Mono/Tri (Ref CD040975)", sku: "HM/DTU-Pro-S", brand: "HOYMILES", category: "micro-inverters", price: 126, stock: 767, power: "", type: "" },
+  { name: "Hoymiles compteur analyseur / smart meter CHINT DDSU 666 avec tore de mesure mon", sku: "HM/DDSU666", brand: "HOYMILES", category: "micro-inverters", price: 50, stock: 135, power: "", type: "Monophasé" },
+  { name: "Hoymiles compteur analyseur / smart meter CHINT DTSU 666 avec tore de mesure tri", sku: "HM/DTSU666-3P", brand: "HOYMILES", category: "micro-inverters", price: 85, stock: 123, power: "", type: "Triphasé" },
+  { name: "Hoymiles câble de connexion AC de 2m pour micro-onduleurs HMS (Ref A3080516)", sku: "HM/HMS-CABLE-40-200", brand: "HOYMILES", category: "micro-inverters", price: 10, stock: 6223, power: "", type: "Micro" },
+  { name: "Hoymiles terminal connecteur AC étanche pour câble HMS (Ref A3080536)", sku: "HM/HMS-TERMCON-MC4", brand: "HOYMILES", category: "micro-inverters", price: 3, stock: 2933, power: "", type: "" },
+  { name: "Hoymiles connecteur d’interconnexion AC étanche pour câble HMS (Ref A3080507)", sku: "HM/HMS-TRKCON-MC4", brand: "HOYMILES", category: "micro-inverters", price: 4, stock: 3585, power: "", type: "" },
+  { name: "Hoymiles Capuchon d’étanchéité HMS pour couvrir le port de connexion inutilisé s", sku: "HM/HMS-SEAL", brand: "HOYMILES", category: "micro-inverters", price: 2, stock: 3000, power: "", type: "" },
+  { name: "Hoymiles Outil de déconnexion pour connecteurs HMS (Ref A3080509)", sku: "HM/HMS-DISC", brand: "HOYMILES", category: "micro-inverters", price: 3, stock: 342, power: "", type: "" },
+  { name: "Hoymiles connecteur d'extension AC étanche pour câble HMS (Ref A3080506)", sku: "HM/HMS-EXTCON-MC4", brand: "HOYMILES", category: "micro-inverters", price: 3, stock: 113, power: "", type: "" },
+  { name: "Hoymiles câble de connexion AC de 3m pour micro-onduleurs HMS (Ref A3080518)", sku: "HM/HMS-CABLE-3M", brand: "HOYMILES", category: "micro-inverters", price: 12.5, stock: 1095, power: "", type: "Micro" },
+  { name: "Hoymiles câble Triphasé AC de 3m pour HMT avec connecteur AC-3P inclus - câble 1", sku: "HM/HMT-12AWGTRI-3M", brand: "HOYMILES", category: "micro-inverters", price: 32, stock: 133, power: "", type: "Triphasé" },
+  { name: "Hoymiles embout de terminaison du port connecteur AC-3P HMT", sku: "HM/HMT-ENDCAP-AC3P", brand: "HOYMILES", category: "micro-inverters", price: 2, stock: 178, power: "", type: "" },
+  { name: "Hoymiles Outil de deconnexion port connecteur AC-3P HMT", sku: "HM/HMT-DISC-AC3P", brand: "HOYMILES", category: "micro-inverters", price: 3, stock: 89, power: "", type: "" },
+  { name: "Hoymiles Outil de déverrouillage pour connecteur AC-3P HMT", sku: "HM/HMT-UNL-AC3P", brand: "HOYMILES", category: "micro-inverters", price: 3, stock: 90, power: "", type: "" },
+  { name: "APsystems ECU Commercial - Mesure de production & consommation pour DS3 - QT2 (Z", sku: "APS/ECU-C", brand: "AP Systems", category: "micro-inverters", price: 179.07505, stock: 0, power: "", type: "" },
+  { name: "Module Monocristallin Demi Cellules RECOM 400 Wc - PANTHER - Half-Cut Full Black", sku: "RCM-400-6ME", brand: "RECOM SILLIA", category: "panels", price: 61, stock: 0, power: "400 Wc", type: "" },
+  { name: "K2 Crochet SingleHook-CrossHook 4S (Singlerail)", sku: "K2S/2003144", brand: "K2 SYSTEMS", category: "mounting", price: 7.062, stock: 0, power: "", type: "" },
+  { name: "MODULE DUALSUN FLASH 375 WC HALF CUT - FULL BLACK", sku: "DS/FLASH-375M-HC-FB", brand: "DUALSUN", category: "panels", price: 89, stock: 0, power: "375 WC", type: "" },
+  { name: "Module Monocristallin DualSun Flash 425 Wc Shingle apparence Ultra Black (1899x1", sku: "DS/FLASH-425M-SH-FB", brand: "DUALSUN", category: "panels", price: 100, stock: 0, power: "425 Wc", type: "" },
+  { name: "Module Monocristallin DualSun Flash 500 Wc Half-Cut Full Black (2094x1134x35mm) ", sku: "DS/FLASH-500M-HC-FB", brand: "DUALSUN", category: "panels", price: 123.77, stock: 7, power: "500 Wc", type: "" },
+  { name: "K2 Bouchon pour Single Rail 36 (Noir)", sku: "K2S/1004767", brand: "K2 SYSTEMS", category: "mounting", price: 0.3234, stock: 0, power: "", type: "" },
+  { name: "K2 Bride Exterieure Noire - cadre 30-42mm", sku: "K2S/2002589", brand: "K2 SYSTEMS", category: "mounting", price: 2.243, stock: 2, power: "", type: "" },
+  { name: "K2 Bride Intermédiaire Noire - cadre 30-42mm", sku: "K2S/2003072", brand: "K2 SYSTEMS", category: "mounting", price: 2.243, stock: 2, power: "", type: "" },
+  { name: "K2 Griffe de mise à la terre K2SZ (compatible avec : SingleRail / SolidRail / Sp", sku: "K2S/2001881", brand: "K2 SYSTEMS", category: "mounting", price: 1.1418, stock: 0, power: "", type: "" },
+  { name: "K2 Vis bois HecoTopix 8x100 (Conditionnement par 50pcs)", sku: "K2S/2004112", brand: "K2 SYSTEMS", category: "mounting", price: 0.394152, stock: 0, power: "", type: "" },
+  { name: "K2 Câble Manager PA 66 W - Attaches de câbles avec raccords", sku: "K2S/2002870", brand: "K2 SYSTEMS", category: "mounting", price: 0.19107, stock: 0, power: "66 W", type: "" },
+  { name: "K2 Single Rail 36 de 2,5 m - remplace la K2S/2003220", sku: "K2S/2004257", brand: "K2 SYSTEMS", category: "mounting", price: 14.8302, stock: 0, power: "", type: "" },
+  { name: "K2 Connecteur de rails Single Rail 36", sku: "K2S/2001976", brand: "K2 SYSTEMS", category: "mounting", price: 3.6432, stock: 0, power: "", type: "" },
+  { name: "K2 Crochets de toit pour ardoise 40x250x6/6x40mm M10 (Crochet de toit Slate Tile", sku: "K2S/1000373", brand: "K2 SYSTEMS", category: "mounting", price: 6.699, stock: 0, power: "", type: "" },
+  { name: "K2 Crochet de toit FlatTile pour tuiles plates (Solidrail)", sku: "K2S/1000214", brand: "K2 SYSTEMS", category: "mounting", price: 6.8904, stock: 0, power: "", type: "" },
+  { name: "K2 Crochet SolidHook Coppo à hauteur réglable pour tuiles Canal (Solidrail)", sku: "K2S/1001068", brand: "K2 SYSTEMS", category: "mounting", price: 6.4548, stock: 0, power: "", type: "" },
+  { name: "K2 Vis à double filetage SingleRail M10x250", sku: "K2S/2003274", brand: "K2 SYSTEMS", category: "mounting", price: 3.49, stock: 0, power: "", type: "" },
+  { name: "K2S Crochets SingleHook FT pour tuiles plates sur SingleRail", sku: "K2S/2002568", brand: "K2 SYSTEMS", category: "mounting", price: 4.1514, stock: 0, power: "", type: "" },
+  { name: "Kit L-Adaptateur SingleRail K2", sku: "K2S/2002683", brand: "K2 SYSTEMS", category: "mounting", price: 1.8018, stock: 0, power: "", type: "" },
+  { name: "Vis pour agglomérés Drill autoperceuse et Tête fraisée 6x70/42", sku: "K2S/1006398", brand: "K2 SYSTEMS", category: "accessories", price: 0.373164, stock: 0, power: "", type: "" },
+  { name: "K2S Vis à tete cylindrique M8x16 avec cran d'arret", sku: "K2S/2001735", brand: "K2 SYSTEMS", category: "mounting", price: 0.171138, stock: 0, power: "", type: "" },
+  { name: "K2 Vis à double filetage SingleRail M10x180", sku: "K2S/2003272", brand: "K2 SYSTEMS", category: "mounting", price: 3.4914, stock: 0, power: "", type: "" },
+  { name: "K2 Vis à double filetage SingleRail M10x200", sku: "K2S/2003273", brand: "K2 SYSTEMS", category: "mounting", price: 3.4914, stock: 0, power: "", type: "" },
+  { name: "K2S Crochets SingleHook Vario (crochets pour tuiles à fort galbe sur SingleRail)", sku: "K2S/2002651", brand: "K2 SYSTEMS", category: "mounting", price: 6.9894, stock: 0, power: "", type: "" },
+  { name: "K2 Vis à tête marteau 28/15 M10", sku: "K2S/1000041", brand: "K2 SYSTEMS", category: "mounting", price: 0.3036, stock: 0, power: "", type: "" },
+  { name: "K2 Adaptateur + vis StairPlate pour fixation micro-onduleurs/optimiseurs sur rai", sku: "K2S/2004057", brand: "K2 SYSTEMS", category: "micro-inverters", price: 2.3628, stock: 0, power: "", type: "Micro" },
+  { name: "K2 Ecrou M10 à embase avec cran d'arret", sku: "K2S/1000042", brand: "K2 SYSTEMS", category: "mounting", price: 0.134, stock: 0, power: "", type: "" },
+  { name: "K2 Single Rail 36 de 3,65 m - remplace la K2S/2003221", sku: "K2S/2004258", brand: "K2 SYSTEMS", category: "mounting", price: 18.99, stock: 0, power: "", type: "" },
+  { name: "K2 Crochet CrossHook 2 pour tuiles béton plates (Singlerail)", sku: "K2S/2003175", brand: "K2 SYSTEMS", category: "mounting", price: 15.1272, stock: 0, power: "", type: "" },
+  { name: "SUPPLEMENT TOIT ZINC", sku: "SM/COM", brand: "", category: "accessories", price: 100, stock: 0, power: "", type: "" },
+  { name: "APSystems micro-onduleur DS3-Light Duo 730VA - Connecteurs MC4 - Garantie 10 ans", sku: "APS/DS3-L-730", brand: "AP Systems", category: "micro-inverters", price: 118.28, stock: 0, power: "", type: "Micro" },
+  { name: "APSystems micro-onduleur DS3 Duo 880VA - Connecteurs MC4 - Garantie 10 ans", sku: "APS/DS3-XL-880", brand: "AP Systems", category: "micro-inverters", price: 133.88, stock: 0, power: "", type: "Micro" },
+  { name: "APSystems micro-onduleur DS3 H Duo 960VA - Connecteur MC4 - Garantie 10 ans", sku: "APS/DS3-H-960", brand: "AP Systems", category: "micro-inverters", price: 130, stock: 0, power: "", type: "Micro" },
+  { name: "APSystems micro-onduleur QT2 triphasé 2000VA - Connecteurs MC4 - Garantie 10 ans", sku: "APS/QT2-TRI", brand: "AP Systems", category: "micro-inverters", price: 247.1, stock: 0, power: "", type: "Triphasé" },
+  { name: "APSystems câble rallonge Y3 de 2m pour DS3", sku: "APS/Y3-ACBUS-2M", brand: "AP Systems", category: "micro-inverters", price: 10.1325, stock: 0, power: "", type: "" },
+  { name: "APsystems Bouchon de fin de string pour DS3 / DS3-L", sku: "APS/Y3-ACBUS-ENDCAP", brand: "AP Systems", category: "micro-inverters", price: 7.30505, stock: 0, power: "", type: "" },
+  { name: "APsystems outils de déconnexion pour connecteur Y3", sku: "APS/Y3-CON-UNLOCKT", brand: "AP Systems", category: "micro-inverters", price: 0, stock: 0, power: "", type: "" },
+  { name: "APsystems connecteur mâle Mono DS3 pour câble AC", sku: "APS/AC-MC", brand: "AP Systems", category: "micro-inverters", price: 3.59945, stock: 0, power: "", type: "" },
+  { name: "APsystems connecteur femelle Mono DS3 pour câble AC", sku: "APS/AC-FC", brand: "AP Systems", category: "micro-inverters", price: 3.59945, stock: 0, power: "", type: "" },
+  { name: "APsystems Tor de mesure 80A pour ECU-C / 2 par phase", sku: "APS/80A", brand: "AP Systems", category: "micro-inverters", price: 20.75, stock: 0, power: "", type: "" },
+  { name: "APsystems Câble 2,5mm² AC pour micro-onduleur QT2 triphasé - 2,4m", sku: "APS/QT2-ACBUS-2400MM", brand: "AP Systems", category: "micro-inverters", price: 28.91, stock: 0, power: "", type: "Triphasé" },
+  { name: "APsystems connecteur mâle 5 fils pour QT2 triphasé", sku: "APS/QT2-C-MALE", brand: "AP Systems", category: "micro-inverters", price: 5.08555, stock: 0, power: "", type: "Triphasé" },
+  { name: "APsystems connecteur femelle 5 fils pour QT2 triphasé", sku: "APS/QT2-C-FEMELLE", brand: "AP Systems", category: "micro-inverters", price: 5.08555, stock: 0, power: "", type: "Triphasé" },
+  { name: "APSystems bouchon de fin de string pour QT2 triphasé", sku: "APS/QT2-ENDCAP", brand: "AP Systems", category: "micro-inverters", price: 7.2761, stock: 0, power: "", type: "Triphasé" },
+  { name: "Coffret de protection AC 3 kW monophasé avec disjoncteur différentiel 30 mA et p", sku: "CO/AC-3K-8M", brand: "", category: "accessories", price: 60, stock: 45, power: "3 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 3 kW monophasé avec compteur permettant de suivre la co", sku: "CO/AC-3K-COMPTEUR-12M", brand: "", category: "accessories", price: 60, stock: 10, power: "3 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 4.5 kW monophasé avec disjoncteur différentiel 30 mA et", sku: "CO/AC-4.5K-8M", brand: "", category: "accessories", price: 61, stock: 26, power: "4.5 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 4,5 kW monophasé avec compteur digital de production, d", sku: "CO/AC-4.5K-COMPTEUR-12M", brand: "", category: "accessories", price: 69.3, stock: 3, power: "4.5 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 6 kW monophasé avec 2 entrées (disjoncteurs différentie", sku: "CO/AC-4.5K-2E-8M", brand: "", category: "accessories", price: 68.25, stock: 112, power: "6 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 6 kW monophasé avec disjoncteur différentiel 30 mA et p", sku: "CO/AC-6K-8M", brand: "", category: "accessories", price: 62, stock: 32, power: "6 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 6kW monophasé avec compteur permettant de suivre la con", sku: "CO/AC-6K-COMPTEUR-12M", brand: "", category: "accessories", price: 68, stock: 10, power: "6 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 9 kW monophasé avec disjoncteur différentiel 30 mA et p", sku: "CO/AC-9K-8M", brand: "", category: "accessories", price: 79.8, stock: 80, power: "9 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 9 kW monophasé avec compteur permettant de suivre la co", sku: "CO/AC-9K-COMPTEUR-12M", brand: "", category: "accessories", price: 96.6, stock: 3, power: "9 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 12 kW monophasé avec disjoncteur différentiel 300 mA et", sku: "CO/AC-12K-8M-300MA", brand: "", category: "accessories", price: 92.15, stock: 1, power: "12 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 3 à 9 kW tétrapolaire avec disjoncteur différentiel 30 ", sku: "CO/AC-9KTRI-3E-13M", brand: "", category: "micro-inverters", price: 119, stock: 40, power: "9 kW", type: "Micro" },
+  { name: "Coffret de protection AC 3 à 9 kW avec compteur permettant de suivre la consomma", sku: "CO/AC-9KTRI-COMPTEUR-24M", brand: "", category: "accessories", price: 141.75, stock: 3, power: "9 kW", type: "" },
+  { name: "Coffret de protection AC 9 kW monophasé 3 entrées (disjoncteur différentiel 30 m", sku: "CO/AC-9K-3E-12M", brand: "", category: "accessories", price: 75.6, stock: 95, power: "9 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 9 kW monophasé 3 entrées avec compteur permettant de su", sku: "CO/AC-9K-3E-COMPTEUR-26M", brand: "", category: "accessories", price: 93.45, stock: 4, power: "9 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC triphasé  pour 1 onduleur de 3 à 12 kVA tri (300ma) - S", sku: "CO/AC-12KTRI-13M-300MA", brand: "", category: "inverters", price: 141.75, stock: 22, power: "", type: "Triphasé" },
+  { name: "Kit de Fixation Schletter Façade 50° en portrait - Nombre de panneaux : 8", sku: "SCH/AR00978", brand: "", category: "panels", price: 879, stock: 0, power: "", type: "" },
+  { name: "Passerelle de communication Hoymiles DTU-Lite-S - Mono/Tri  (Ref CD040978)", sku: "HM/DTU-Lite-S", brand: "HOYMILES", category: "micro-inverters", price: 81, stock: 39, power: "", type: "" },
+  { name: "K2 Single Rail 36 de 2,25 m", sku: "K2S/2003220", brand: "K2 SYSTEMS", category: "mounting", price: 14.8302, stock: 0, power: "", type: "" },
+  { name: "Module Monocristallin Demi Cellules RECOM 500 Wc - PANTHER - Half-Cut Full Black", sku: "RCM-500-7MM", brand: "RECOM SILLIA", category: "panels", price: 61, stock: 1400, power: "500 Wc", type: "" },
+  { name: "Huawei Batterie Luna 2000-5-S0 - 5 kW utile - Tension nominale 360V (3 batteries", sku: "", brand: "", category: "inverters", price: 3975, stock: 0, power: "5 kW", type: "" },
+  { name: "Huawei Batterie Luna module/controleur de puissance DC/DC (ref LUNA2000-5KW-C0) ", sku: "HUA/BAT-DC-LUNA2000-C0", brand: "HUAWEI", category: "batteries", price: 439.44, stock: 49, power: "5 KW", type: "" },
+  { name: "Enphase micro-onduleur IQ8-HC - 384 VA - Entrée MC4 - (IQ8HC-72-M-INT)", sku: "EN/IQ8-HC", brand: "Enphase", category: "micro-inverters", price: 128, stock: 124, power: "", type: "Micro" },
+  { name: "Enphase câble IQ Portrait Monophasé (Q25-10-240)", sku: "EN/IQ-V", brand: "Enphase", category: "micro-inverters", price: 12.83, stock: -25, power: "", type: "Monophasé" },
+  { name: "Enphase embout de terminaison étanche pour câble IQ Monophasé (Q-TERM-R-10)", sku: "EN/IQ-TERM", brand: "Enphase", category: "micro-inverters", price: 10.66, stock: 193, power: "", type: "Monophasé" },
+  { name: "Passerelle de communication Envoy S - Mono/Tri (Ref ENV-S-WB-230-F)", sku: "EN/ENVOY", brand: "Enphase", category: "accessories", price: 142, stock: 131, power: "", type: "" },
+  { name: "Enphase Outil de deconnexion pour IQ (Ref Q-DISC-10)", sku: "EN/IQ-DISC", brand: "Enphase", category: "micro-inverters", price: 1.98, stock: 55, power: "", type: "" },
+  { name: "Coffret AC 6 kW monophasé -  disjoncteur différentiel 30mA 40A 2P - 2 X 20A 2P a", sku: "CO/AC-6K-ENPH-IQ8-2E-13M", brand: "Enphase", category: "accessories", price: 66.15, stock: 28, power: "6 kW", type: "Monophasé" },
+  { name: "Enphase QRelay VDE pour installation en Monophasé (Q-RELAY-1P-FR)", sku: "EN/IQ-RELAY-1P", brand: "Enphase", category: "micro-inverters", price: 47.22, stock: 450, power: "", type: "Monophasé" },
+  { name: "MODULE MONOCRISTALLIN DEMI CELLULES DUALSUN FLASH 375 WC - FULL BLACK", sku: "RCM-375-6ME-ECO", brand: "RECOM SILLIA", category: "panels", price: 65.86, stock: 0, power: "375 WC", type: "" },
+  { name: "Coffret de protection AC de 4 à 6 kW monophasé avec 2 disjoncteurs différentiels", sku: "CO/AC-6K-ENPH-2E", brand: "ADEE electronic", category: "accessories", price: 99.75, stock: 0, power: "6 kW", type: "Monophasé" },
+  { name: "Onduleur hybride monophasé Huawei - 6 KTL-L1 (Mono-2 MPPT) - Compatible Optimise", sku: "HUA/SUN2000-6KTL-L1", brand: "HUAWEI", category: "inverters", price: 403.46, stock: 3, power: "", type: "Hybrid" },
+  { name: "Bac à lester ConSole+ de Renusol avec supports et visserie ((composé de 2 Suppor", sku: "RE/CONSOLE+", brand: "RENUSOL", category: "mounting", price: 64.065, stock: 120, power: "", type: "" },
+  { name: "Rails de rallonge pour ConSole+, Permet le montage des modules d’une largeur sup", sku: "RE/460001", brand: "RENUSOL", category: "panels", price: 6.019, stock: 264, power: "", type: "" },
+  { name: "Coffret de protection DC 1000V avec sectionneur et parafoudre  2 MPPT (2 x 1 str", sku: "CO/DC1000V-2MPPT-18", brand: "", category: "accessories", price: 136, stock: 2, power: "", type: "" },
+  { name: "Enphase câble IQ Portrait Triphasé (Q25-10-3P-200)", sku: "EN/IQ-V-TRI", brand: "Enphase", category: "micro-inverters", price: 18.1, stock: 334, power: "", type: "Triphasé" },
+  { name: "Enphase câble IQ Paysage Triphasé (Q25-17-3P-160) (83420)", sku: "EN/IQ-H-TRI", brand: "Enphase", category: "micro-inverters", price: 23.4, stock: 415, power: "", type: "Triphasé" },
+  { name: "Enphase embout de terminaison étanche pour câble IQ Triphasé (Q-TERM-3P-10)", sku: "EN/IQ-TERM-TRI", brand: "Enphase", category: "micro-inverters", price: 12.4, stock: 231, power: "", type: "Triphasé" },
+  { name: "Enphase QRelay VDE pour installation en Triphasé (Q-RELAY-3P-INT)", sku: "EN/IQ-RELAY-3P", brand: "Enphase", category: "micro-inverters", price: 120.34, stock: 359, power: "", type: "Triphasé" },
+  { name: "Câble spécial solaire certifié TUV 4mm². 100 mètres (noir)", sku: "CAB/DC-4-100M", brand: "", category: "accessories", price: 64.8, stock: 0, power: "", type: "" },
+  { name: "Multi Contact Fiche MC4- mâle 4/6 mm² (diamètre du câble DC de 5,5 à 7,4 mm²) (R", sku: "MC/FMC4-M-4/6", brand: "", category: "accessories", price: 0.792, stock: 540, power: "", type: "" },
+  { name: "Multi Contact Fiche MC4+ femelle 4/6 mm² (diamètre du câble DC de 5,5 à 7,4 mm²)", sku: "MC/FMC4-F-4/6", brand: "", category: "accessories", price: 1.0416, stock: 540, power: "", type: "" },
+  { name: "Coffret de protection AC de 3 à 9 kW triphasé Enphase IQ8  pour 1 ou 2 lignes tr", sku: "CO/AC-9KTRI-ENPH-IQ8", brand: "", category: "micro-inverters", price: 142.8, stock: 0, power: "9 kW", type: "Triphasé" },
+  { name: "Coffret AC de 9 à 11 kW tétrapolaire avec Interrupteur différentiel 4P 30mA 63A ", sku: "CO/AC-11KTRI-13M", brand: "", category: "accessories", price: 123, stock: 149, power: "11 kW", type: "" },
+  { name: "HMS Field connector (Ref A3080484)", sku: "HM/HMS-FIELD-CON", brand: "HOYMILES", category: "accessories", price: 5, stock: 8, power: "", type: "" },
+  { name: "Câble plug-and-play HMS 3m (Ref A6050423)", sku: "HM/HMS-PLUG-3M", brand: "HOYMILES", category: "accessories", price: 10.5, stock: 19, power: "", type: "" },
+  { name: "Câble plug-and-play HMS 5m (Ref A6050464)", sku: "HM/HMS-PLUG-5M", brand: "HOYMILES", category: "accessories", price: 14.5, stock: 29, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Tuile mécanique", sku: "ESD/2X4POTM", brand: "ESDEC", category: "mounting", price: 288.67, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Tuile ardoise", sku: "ESD/2X4POTA", brand: "ESDEC", category: "mounting", price: 285.87, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Tuile canale", sku: "ESD/2X4POTC", brand: "ESDEC", category: "mounting", price: 268.7, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Tuile fibreciment", sku: "ESD/2X4POTFC", brand: "ESDEC", category: "mounting", price: 268.7, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Paysage Tuile mécanique", sku: "ESD/2X4PATM", brand: "ESDEC", category: "mounting", price: 353.28, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Paysage Tuile ardoise", sku: "ESD/2X4PATA", brand: "ESDEC", category: "mounting", price: 349.08, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Paysage Tuile canale", sku: "ESD/2X4PATC", brand: "ESDEC", category: "mounting", price: 323.33, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Paysage Tuile fibreciment", sku: "ESD/2X4PATFC", brand: "ESDEC", category: "mounting", price: 323.33, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Tuiles plates", sku: "ESD/2X4POTP", brand: "ESDEC", category: "mounting", price: 288.67, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 4X6 Portrait Tuile mécanique", sku: "ESD/4X6POTM", brand: "ESDEC", category: "mounting", price: 852.48, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Portrait Tuile mécanique", sku: "ESD/2X8POTM", brand: "ESDEC", category: "mounting", price: 566.74, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Bac acier", sku: "ESD/2X4POBA", brand: "ESDEC", category: "mounting", price: 268.7, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X6 Portrait Tuile mécanique", sku: "ESD/2X6POTM", brand: "ESDEC", category: "mounting", price: 427.7, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X6 Portrait Tuile mécanique", sku: "ESD/3X6POTM", brand: "ESDEC", category: "mounting", price: 640.09, stock: 0, power: "", type: "" },
+  { name: "Trina Solar 440 Wc Bi-Verre BAS CARBONE N-TYPE Vertex S+ 5 cadre noir tedlar bla", sku: "TRI/440M-BV-BC", brand: "Vertex S+", category: "panels", price: 65.6, stock: 0, power: "440 Wc", type: "" },
+  { name: "Onduleur triphasé Huawei Sun 2000 - 50 KTL-M3 (50 KW Tri-Sect+MC4+PARAF 5 Intégr", sku: "HUA/OND-50KTL-M3", brand: "HUAWEI", category: "inverters", price: 1899, stock: 0, power: "50 KW", type: "Triphasé" },
+  { name: "Huawei SmartLogger 3000A01EU, Solar Smart Monitor & Data Logger with 4G", sku: "HUA/SMLOG-3000A-01EU", brand: "HUAWEI", category: "accessories", price: 449.89, stock: 2, power: "", type: "" },
+  { name: "Huawei Smart Power Sensor (compteur d'énergie) Triphasé PS-T (DTSU666-H) 250A/50", sku: "HUA/SMART-TRI", brand: "HUAWEI", category: "optimizers", price: 53.11, stock: 15, power: "", type: "Triphasé" },
+  { name: "Coffret de protection AC triphasé  pour 1 onduleur 60 kVA tri (300ma) - Sortie 9", sku: "CO/AC-60KTRI", brand: "", category: "inverters", price: 756.25, stock: 0, power: "", type: "Triphasé" },
+  { name: "OMERIN Câble spécial solaire certifié TUV 6mm². Touret 500 mètres (noir)", sku: "CAB/OM/DC-6-500M", brand: "SOLARPLAST", category: "accessories", price: 339, stock: 0, power: "", type: "" },
+  { name: "STÄUBLI – Connecteur Y Multi Contact MC4 (-) (connexion : 1 mâle et 2 femelles c", sku: "MC/FYMC4-", brand: "STÄUBLI", category: "panels", price: 4.69, stock: 10, power: "", type: "" },
+  { name: "STÄUBLI – Connecteur Y Multi Contact MC4 (+) (connexion : 1 femelle et 2 mâles c", sku: "MC/FYMC4+", brand: "STÄUBLI", category: "panels", price: 4.68, stock: 10, power: "", type: "" },
+  { name: "K2 MiniRail longueur 0,38m (pose en portrait ou paysage sur Bac Acier) - 4 Vis", sku: "K2S/2002341", brand: "K2 SYSTEMS", category: "mounting", price: 5.71, stock: 0, power: "", type: "" },
+  { name: "K2 Bride Exterieure Noire pour MiniRail ou Dome 6 et V - cadre 30-50mm", sku: "K2S/2002610", brand: "K2 SYSTEMS", category: "mounting", price: 1.91, stock: 0, power: "", type: "" },
+  { name: "K2 Bride Intermédiaire Noire pour MiniRail ou Dome 6 et V- cadre 30-50mm", sku: "K2S/2002609", brand: "K2 SYSTEMS", category: "mounting", price: 1.91, stock: 0, power: "", type: "" },
+  { name: "K2 Griffe de mise à la terre K2MI Duo 18 (compatible avec le MiniRail)", sku: "K2S/2003542", brand: "K2 SYSTEMS", category: "mounting", price: 1.74, stock: 0, power: "", type: "" },
+  { name: "Câble de terre vert jaune - 6 mm² (100m)", sku: "CAB/T-6MM-100M", brand: "", category: "accessories", price: 113, stock: 0, power: "", type: "" },
+  { name: "Câble rigide 1000V R2V cuivre 3G35 TGL", sku: "R2V3G35TGL", brand: "", category: "accessories", price: 59.18, stock: 0, power: "", type: "" },
+  { name: "Passerelle de communication Envoy S Metered -  monophasé / triphasé + 2 tores de", sku: "EN/ENVOY-METERED", brand: "Enphase", category: "accessories", price: 296, stock: 47, power: "", type: "Triphasé" },
+  { name: "Coffret 6 kW avec 1 disjoncteur 32A pour Micro Onduleur avec emplacement pour 1 ", sku: "CO/AC-6K-ENPH-IQ8", brand: "", category: "micro-inverters", price: 62, stock: 0, power: "6 kW", type: "Micro" },
+  { name: "Hoymiles micro-onduleur 2 en 1 HMS-1000 - 1000 VA - Connecteurs MC4 - 2 MPPT - G", sku: "HM/HMS-1000-2T", brand: "HOYMILES", category: "micro-inverters", price: 126.5, stock: 14, power: "", type: "Micro" },
+  { name: "Enphase micro-onduleur IQ8-AC - 366 VA - Entrée MC4 - (IQ8AC-72-M-INT)", sku: "EN/IQ8-AC", brand: "Enphase", category: "micro-inverters", price: 128.83, stock: 0, power: "", type: "Micro" },
+  { name: "Systeme de montage ESDEC 2X8 Portrait Bac acier", sku: "ESD/2X8POBA", brand: "ESDEC", category: "mounting", price: 526.8, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X3 Portrait Tuile canale", sku: "ESD/2X3POTC", brand: "ESDEC", category: "mounting", price: 259.01, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 1X1 Paysage Tuile canale", sku: "ESD/1X1PATC", brand: "ESDEC", category: "mounting", price: 66.89, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 1X12 Portrait Tuile ardoise (500W)", sku: "ESD/1X12POTA/500", brand: "ESDEC", category: "mounting", price: 446.53, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 1X6 Paysage Tuile ardoise (500W)", sku: "ESD/1X6PATA/500", brand: "ESDEC", category: "mounting", price: 412.44, stock: 0, power: "500 W", type: "" },
+  { name: "KITS 3KWC ENPHASE 375 W (MONO)", sku: "8RE375FBMENP1E", brand: "Enphase", category: "micro-inverters", price: 1942.6, stock: 0, power: "3 KW", type: "" },
+  { name: "Systeme de montage ESDEC 2X6 Portrait Tuile ardoise", sku: "ESD/2X6POTA", brand: "ESDEC", category: "mounting", price: 423.5, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Portrait Tuiles plates", sku: "ESD/2X8POTP", brand: "ESDEC", category: "mounting", price: 566.74, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X2 Portrait Tuile mécanique", sku: "ESD/2X2POTM", brand: "ESDEC", category: "mounting", price: 177.22, stock: 0, power: "", type: "" },
+  { name: "Coffret de protection DC 600V avec sectionneur et parafoudre 1 MPPT pour 2 strin", sku: "CO/DC600V-2ST-8M", brand: "", category: "accessories", price: 56, stock: 7, power: "", type: "" },
+  { name: "Coffret de protection DC 600V avec sectionneur et parafoudre 2 MPPT (2 x 2 strin", sku: "CO/DC600V-2MPPT-12M", brand: "", category: "accessories", price: 118, stock: 26, power: "", type: "" },
+  { name: "Coffret de protection DC 1000V avec sectionneur et parafoudre 1 MPPT pour 2 stri", sku: "CO/DC1000V-2ST-8M", brand: "", category: "accessories", price: 75, stock: 0, power: "", type: "" },
+  { name: "FISCHER - Vis a bois PowerFast II 6,0X60 Tete fraisee, empreinte TX, zingue blan", sku: "ESD/670455", brand: "ESDEC", category: "accessories", price: 0.1524, stock: 19538, power: "", type: "" },
+  { name: "SunPower 400 Wc - MAX3 - Cadre noir (1690x1046x40mm) - Garantie 40/40 ans", sku: "SP/400M-MAX3-CN", brand: "SUNPOWER", category: "accessories", price: 322.73, stock: 0, power: "400 Wc", type: "" },
+  { name: "Onduleur triphasé Huawei  - 20 KTL M5 (22 KW tri - 2MPPT)  - Garantie 10 ans", sku: "HUA/OND-20KTL-M5", brand: "HUAWEI", category: "inverters", price: 1791.11, stock: 0, power: "22 KW", type: "Triphasé" },
+  { name: "Onduleur triphasé Huawei  - 15 KTL M5 (16,5 KW tri - 2MPPT)  - Garantie 10 ans (", sku: "HUA/OND-15KTL-M5", brand: "HUAWEI", category: "inverters", price: 1674.44, stock: 0, power: "16.5 KW", type: "Triphasé" },
+  { name: "Coffret de protection AC triphasé  pour 1 onduleur de 13 à 18 kVA tri (300ma) - ", sku: "CO/AC-18KTRI", brand: "", category: "inverters", price: 224.55, stock: 0, power: "", type: "Triphasé" },
+  { name: "Coffret de protection AC triphasé  pour 1 onduleur 25 kVA tri (300ma) - Sortie 1", sku: "CO/AC-25KTRI", brand: "", category: "inverters", price: 260.55, stock: 0, power: "", type: "Triphasé" },
+  { name: "Systeme de montage ESDEC 2X5 Portrait Tuile mécanique (500W)", sku: "ESD/2X5POTM/500", brand: "ESDEC", category: "mounting", price: 445.58, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 3X8 Portrait Bac acier", sku: "ESD/3X8POBA", brand: "ESDEC", category: "mounting", price: 788.74, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Portrait Tuile ardoise", sku: "ESD/2X8POTA", brand: "ESDEC", category: "mounting", price: 561.13, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X8 Portrait Tuile fibreciment", sku: "ESD/3X8POTFC", brand: "ESDEC", category: "mounting", price: 788.74, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X10 Portrait Tuile mécanique", sku: "ESD/2X10POTM", brand: "ESDEC", category: "mounting", price: 705.77, stock: 0, power: "", type: "" },
+  { name: "Huawei Batterie Luna 2000-5-E0 module de stockage 5 kW utile - Tension nominale ", sku: "HUA/BAT-LUNA2000-5-E0", brand: "HUAWEI", category: "inverters", price: 1261, stock: 76, power: "5 kW", type: "" },
+  { name: "Enphase câble IQ Paysage Monophasé (Q25-17-240)", sku: "EN/IQ-H", brand: "Enphase", category: "micro-inverters", price: 18.54, stock: 414, power: "", type: "Monophasé" },
+  { name: "Pince ampèremétrique Slim pour ENVOY METERED (CT-100-SPLIT-ROW)", sku: "EN/PINCE-METERED-CT100", brand: "Enphase", category: "accessories", price: 26.32, stock: 300, power: "", type: "" },
+  { name: "Centrale photovoltaïque 3 kWc", sku: "8RE375FBMH2E", brand: "", category: "accessories", price: 1506.53, stock: 0, power: "3 kW", type: "" },
+  { name: "Systeme de montage ESDEC 1X1 Portrait Tuiles plates", sku: "ESD/1X1POTP", brand: "ESDEC", category: "mounting", price: 71.44, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X2 Portrait Tuiles plates", sku: "ESD/2X2POTP", brand: "ESDEC", category: "mounting", price: 90.07, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 1X4 Portrait Tuiles plates", sku: "ESD/1X4POTP", brand: "ESDEC", category: "mounting", price: 145.8, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 1X13 Portrait Tuiles plates", sku: "ESD/1X13POTP", brand: "ESDEC", category: "mounting", price: 442.5, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X8 Portrait Tuile canale", sku: "ESD/3X8POTC", brand: "ESDEC", category: "mounting", price: 788.74, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X8 Portrait Tuile mécanique", sku: "ESD/3X8POTM", brand: "ESDEC", category: "mounting", price: 848.64, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X6 Portrait Tuiles plates", sku: "ESD/2X6POTP", brand: "ESDEC", category: "mounting", price: 427.7, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 4X8 Portrait Tuile canale", sku: "ESD/4X8POTC", brand: "ESDEC", category: "mounting", price: 1050.67, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X2 Portrait Tuile ardoise", sku: "ESD/2X2POTA", brand: "ESDEC", category: "mounting", price: 175.11, stock: 0, power: "", type: "" },
+  { name: "STÄUBLI – Multi Contact Rallonge MC4 4mm² d'un longeur de 2 mètres (73003100-200", sku: "MC/RAL2M-MC4", brand: "STÄUBLI", category: "accessories", price: 4.48, stock: 20, power: "", type: "" },
+  { name: "KIT 3 KW HMS", sku: "TT", brand: "", category: "accessories", price: 3248.64, stock: 0, power: "3 KW", type: "" },
+  { name: "Systeme de montage ESDEC 3X8 Portrait Tuile ardoise", sku: "ESD/3X8POTA", brand: "ESDEC", category: "mounting", price: 840.23, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 4X8 Portrait SCHINGLE", sku: "ESD/4X8POBB", brand: "ESDEC", category: "mounting", price: 1221.94, stock: 0, power: "", type: "" },
+  { name: "Optimiseur Huawei P450-P2 (Tension de 10 à 80V - Courant entrée max 14,5A) Smart", sku: "HUA/P450", brand: "HUAWEI", category: "inverters", price: 34.1, stock: 1, power: "450 WP", type: "" },
+  { name: "Systeme de montage ESDEC 1X8 Portrait Tuile canale", sku: "ESD/1X8POTC", brand: "ESDEC", category: "mounting", price: 264.86, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X3 Paysage Tuile canale", sku: "ESD/3X3PATC", brand: "ESDEC", category: "mounting", price: 354.5, stock: 0, power: "", type: "" },
+  { name: "PLAQUE PORTRAIT 375W NOIRE POUR MODULE RECOM 375W", sku: "GSE/PPOR1710/1040", brand: "", category: "panels", price: 0, stock: -24, power: "375 W", type: "" },
+  { name: "ABERGEMENT LATERAL UNIVERSEL NOIR", sku: "GSE/ALUN", brand: "", category: "accessories", price: 0, stock: -12, power: "", type: "" },
+  { name: "CROCHET FIXATION D'ABERGEMENT", sku: "GSE/CROCHET", brand: "", category: "mounting", price: 0, stock: -24, power: "", type: "" },
+  { name: "VIS AUTOFOREUSE 6.3*60 BLACK", sku: "GSE/VISAUTO6.3*60B", brand: "", category: "accessories", price: 0, stock: -198, power: "", type: "" },
+  { name: "ETRIER DOUBLE V2023 EPDM - H16 - NOIR - IN ROOF (cale EPDM inclus)", sku: "GSE/EDH162014N", brand: "", category: "accessories", price: 0, stock: -42, power: "", type: "" },
+  { name: "ETRIER SIMPLE V2023 EPDM - H16 - NOIR - IN ROOF (cale EPDM inclus)", sku: "GSE/ESH162014N", brand: "", category: "accessories", price: 0, stock: -12, power: "", type: "" },
+  { name: "CALE GAUCHE RENFORT", sku: "GSE/CALE_GAUCHE", brand: "", category: "accessories", price: 0, stock: -6, power: "", type: "" },
+  { name: "CALE DROIT RENFORT", sku: "GSE/CALE_DROIT", brand: "", category: "accessories", price: 0, stock: -6, power: "", type: "" },
+  { name: "JOINT PRE-CONTRAINT 20 MM X 4.3 ML", sku: "GSE/BMWURTH", brand: "", category: "accessories", price: 0, stock: -9, power: "", type: "" },
+  { name: "BANDE ETANCHE GRIS 5ML 500LG", sku: "GSE/FLEXALU500G", brand: "", category: "accessories", price: 0, stock: -6, power: "", type: "" },
+  { name: "ECRAN SOUS TOITURE COUPE 25MX1.5M 37.5M²", sku: "GSE/ACHPARSET", brand: "", category: "mounting", price: 0, stock: -3, power: "", type: "" },
+  { name: "STRUCTURE GSE 2X4 PORTRAIT POUR TUILE MECANIQUE", sku: "GSE/2X4POTM", brand: "", category: "accessories", price: 716.87, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X3 Portrait Tuile mécanique", sku: "ESD/2X3POTM", brand: "ESDEC", category: "mounting", price: 278.98, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 4X8 Portrait Bac acier", sku: "ESD/4X8POBA", brand: "ESDEC", category: "mounting", price: 1050.67, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 4X8 Portrait Tuile fibreciment", sku: "ESD/4X8POTFC", brand: "ESDEC", category: "mounting", price: 1050.67, stock: 0, power: "", type: "" },
+  { name: "Coffret de protection AC triphasé ZENY pour 1 onduleur 12 kVA tri (300ma) - (Réf", sku: "BBWX-1-12KW-TRI-M13", brand: "", category: "inverters", price: 135, stock: -1, power: "12 KW", type: "Triphasé" },
+  { name: "JORISIDE - Rail Jorisolar Opti'Roof 100mm (10720)", sku: "JOR/000010720", brand: "JORISOLAR", category: "mounting", price: 1.57, stock: 1152, power: "", type: "" },
+  { name: "JORISIDE - Rail Jorisolar support alu RS-R 385mm Portrait (4004059)", sku: "JOR/004004059", brand: "JORISOLAR", category: "mounting", price: 3.35, stock: 928, power: "", type: "" },
+  { name: "JORISIDE - Vis Inox fixation support Jorisolar 6,3x22 (4001967)", sku: "JOR/004001967", brand: "JORISOLAR", category: "mounting", price: 0.13, stock: 7660, power: "", type: "" },
+  { name: "JORISIDE - Kit de bride centrale ST02 30-50 noire avec Terragrif (000019506 ou 4", sku: "JOR/000019506", brand: "JORISOLAR", category: "accessories", price: 2.39, stock: 1318, power: "", type: "" },
+  { name: "JORISIDE - Kit de bride latérale noire Jorisolar 30-31 (000019505)", sku: "JOR/000019505", brand: "JORISOLAR", category: "accessories", price: 1.85, stock: 865, power: "", type: "" },
+  { name: "JORISIDE - Clip de mise à la terre ARAYMOND Rayvolt (004006648 ou 220492)", sku: "JOR/004006648", brand: "JORISOLAR", category: "accessories", price: 0.8, stock: 560, power: "", type: "" },
+  { name: "JORISIDE - Écrou coulissant Alu M8 (4004061)", sku: "JOR/004004061", brand: "JORISOLAR", category: "accessories", price: 0.44, stock: 362, power: "", type: "" },
+  { name: "JORISIDE - Vis M8 x 16 inox (4007563)", sku: "JOR/004007563", brand: "JORISOLAR", category: "accessories", price: 0.15, stock: 362, power: "", type: "" },
+  { name: "JORISIDE - Rondelle de frein inox (4004249)", sku: "JOR/004004249", brand: "JORISOLAR", category: "accessories", price: 0.03, stock: 362, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X6 Portrait Tuile mécanique/Plates (500W)", sku: "ESD/3X6POTM/500", brand: "ESDEC", category: "mounting", price: 722.82, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Paysage Bac acier", sku: "ESD/2X8PABA", brand: "ESDEC", category: "mounting", price: 643.73, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Tuile mécanique (500W)", sku: "ESD/2X4POTM/500", brand: "ESDEC", category: "mounting", price: 316.25, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Portrait Tuile canale", sku: "ESD/2X8POTC", brand: "ESDEC", category: "mounting", price: 526.8, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Portrait Tuile fibreciment", sku: "ESD/2X8POTFC", brand: "ESDEC", category: "mounting", price: 526.8, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 4X11 Portrait Tuile mécanique", sku: "ESD/4X11POTM", brand: "ESDEC", category: "mounting", price: 1612.13, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X8 Portrait Tuiles Plates", sku: "ESD/3X8POTP", brand: "ESDEC", category: "mounting", price: 848.64, stock: 1, power: "", type: "" },
+  { name: "OMERIN Câble spécial solaire certifié TUV 4mm². Touret 500 mètres (noir)", sku: "CAB/OM/DC-4-500M", brand: "SOLARPLAST", category: "accessories", price: 244, stock: 9, power: "", type: "" },
+  { name: "OMERIN Câble spécial solaire certifié TUV 4mm². 75 mètres (noir)", sku: "CAB/OM/DC-4-75M", brand: "SOLARPLAST", category: "accessories", price: 36.6, stock: -2, power: "", type: "" },
+  { name: "Hoymiles micro-onduleur 2 en 1 HMS-900 - 900 VA - Connecteurs MC4 - 2 MPPT", sku: "HM/HMS-900-2T", brand: "HOYMILES", category: "micro-inverters", price: 115, stock: 0, power: "", type: "Micro" },
+  { name: "Systeme de montage ESDEC 2X4 Portrait Bac acier (500W)", sku: "ESD/2X4POBA/500", brand: "ESDEC", category: "mounting", price: 291.29, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X3 Portrait Tuile mécanique (500W)", sku: "ESD/2X3POTM/500", brand: "ESDEC", category: "mounting", price: 278.98, stock: 0, power: "500 W", type: "" },
+  { name: "SunPower 425 Wc - MAX3 - Cadre noir - Fond blanc -  Dimensions (1812x1046x40 mm)", sku: "SP/425M-MAX3-CN", brand: "SUNPOWER", category: "accessories", price: 294.61, stock: 0, power: "425 Wc", type: "" },
+  { name: "KIT 6 KWC (16X375W) PV MONOPHASÉ / FIXATION ESDEC 2X8 PORTRAIT TUILE MÉCANIQUE", sku: "16RE375FBMH2E", brand: "", category: "mounting", price: 2765.5, stock: 0, power: "6 KW", type: "Monophasé" },
+  { name: "KIT 4.5 KWC (12X375W) PV MONOPHASÉ / FIXATION ESDEC 2X6 PORTRAIT TUILE MÉCANIQUE", sku: "12RE375FBMH2E", brand: "", category: "mounting", price: 2126.02, stock: 0, power: "4.5 KW", type: "Monophasé" },
+  { name: "KIT 3 KWC (8X375W) PV MONOPHASÉ / FIXATION ESDEC 2X4 PORTRAIT TUILE ARDOISE", sku: "8RE375FBMH2E/POTA", brand: "", category: "mounting", price: 1493.06, stock: 0, power: "3 KW", type: "Monophasé" },
+  { name: "KIT 3 KWC (8X375W) PV TRIPHASÉ / FIXATION ESDEC 1X8 PORTRAIT FIBRE-CIMENT", sku: "8RE375FBMH2E/POTFC", brand: "", category: "mounting", price: 1516.74, stock: 0, power: "3 KW", type: "Triphasé" },
+  { name: "Passerelle de communication Hoymiles DTU-Wlite-S (Wi-Fi) pour HMS", sku: "HM/DTU-Wlite-S", brand: "HOYMILES", category: "micro-inverters", price: 32, stock: 0, power: "", type: "" },
+  { name: "KIT ENPHASE 5,10 KWC (12X425W) - MONO DUALSUN", sku: "12DS425FBMENP1E", brand: "Enphase", category: "micro-inverters", price: 3637.42, stock: 0, power: "5.10 KW", type: "" },
+  { name: "Module Monocristallin Demi Cellules FRANCILIENNE 500 W - Half-Cut Full Black (20", sku: "FRA-500-FB", brand: "", category: "panels", price: 105, stock: 7, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X6 Portrait Tuile mécanique (500W)", sku: "ESD/2X6POTM/500", brand: "ESDEC", category: "mounting", price: 482.86, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 3X5 Portrait Tuile mécanique (500W)", sku: "ESD/3X5POTM/500", brand: "ESDEC", category: "mounting", price: 666.91, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X8 Paysage Tuile mécanique", sku: "ESD/2X8PATM", brand: "ESDEC", category: "mounting", price: 703.63, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 1X8 Paysage Tuile mécanique", sku: "ESD/1X8PATM", brand: "ESDEC", category: "mounting", price: 554.54, stock: 0, power: "", type: "" },
+  { name: "Module Monocristallin Demi Cellules QCELLS 500 Wc - Q.PEAK DUO ML-G11 SERIES (20", sku: "QC/500-DU-ML-G11.2", brand: "Q.PEAK", category: "panels", price: 105, stock: 0, power: "500 Wc", type: "" },
+  { name: "Systeme de montage ESDEC 3X6 Paysage Tuiles plates (500W)", sku: "ESD/3X6PATP/500", brand: "ESDEC", category: "mounting", price: 833.74, stock: 0, power: "500 W", type: "" },
+  { name: "KIT: SENSORPILOT 3 BOX FHE MINI ROUTEUR 6 PINCES ALIMENTATION - COFFRET ÉTANCHE ", sku: "FHE/SP2", brand: "SENSORPILOT", category: "accessories", price: 342.38, stock: 0, power: "", type: "" },
+  { name: "Vis à tête marteau 28/15 M10", sku: "K2S/1000637", brand: "K2 SYSTEMS", category: "accessories", price: 0.159, stock: 0, power: "", type: "" },
+  { name: "K2 Bouchon pour SolidRail Light (Noir)", sku: "K2S/1004765", brand: "K2 SYSTEMS", category: "mounting", price: 0.429, stock: 0, power: "", type: "" },
+  { name: "K2 SolidRail Light de 2.10 m", sku: "K2S/1004367", brand: "K2 SYSTEMS", category: "mounting", price: 19.8, stock: 0, power: "", type: "" },
+  { name: "Kit connecteur de rail SolidRail Ultra Light / Light", sku: "K2S/1004107", brand: "K2 SYSTEMS", category: "mounting", price: 3.977, stock: 0, power: "", type: "" },
+  { name: "Pince pour joint debout SolidRail", sku: "K2S/2001712", brand: "K2 SYSTEMS", category: "mounting", price: 3.121, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage K2Systems 3kW (2X4) toit Zinc", sku: "K2S/2X4POTZ", brand: "K2 SYSTEMS", category: "mounting", price: 747.5, stock: 0, power: "3 kW", type: "" },
+  { name: "Coffret AC 3 kW monophasé -  disjoncteur différentiel 30mA 25A 2P - 1 X 20A 2P a", sku: "CO/AC-3K-ENPH-IQ8-13M", brand: "Enphase", category: "accessories", price: 64.05, stock: 30, power: "3 kW", type: "Monophasé" },
+  { name: "Coffret AC 9 kW monophasé -  disjoncteur différentiel 30mA 63A 2P - 3 X 20A 2P a", sku: "CO/AC-9K-ENPH-IQ8-3E-18M", brand: "Enphase", category: "accessories", price: 97.65, stock: 47, power: "9 kW", type: "Monophasé" },
+  { name: "Coffret AC 9 kW triphasé -  disjoncteur différentiel 30mA 63A 4P - 1 X 20A 4P av", sku: "CO/AC-9KTRI-ENPH-IQ8-3E-24M", brand: "Enphase", category: "accessories", price: 135.45, stock: 24, power: "9 kW", type: "Triphasé" },
+  { name: "Coffret AC 12 kW triphasé - disjoncteur différentiel 30mA 63A 4P - 2 X 20A 4P av", sku: "CO/AC-12KTRI-ENPH-IQ8-3E-36M", brand: "Enphase", category: "accessories", price: 145.95, stock: 49, power: "12 kW", type: "Triphasé" },
+  { name: "Coffret AC 18 à 25 Kw triphasé - disjoncteur différentiel 30mA 63A 4P - 3 X 20A ", sku: "CO/AC-18KTRI-ENPH-IQ8-3E-54M", brand: "Enphase", category: "accessories", price: 236.25, stock: 8, power: "25 Kw", type: "Triphasé" },
+  { name: "KIT 3 KWC ENPHASE (8X375W) PV MONOPHASÉ / FIXATION ESDEC 2X4 PORTRAIT TUILE ARDO", sku: "8RE375FBME1E/POTA", brand: "", category: "micro-inverters", price: 1868.61, stock: 0, power: "3 KW", type: "Monophasé" },
+  { name: "KIT 3 KWC ENPHASE (8X375W) PV TRIPHASÉ / FIXATION ESDEC 2X4 PORTRAIT TUILE ARDOI", sku: "8RE375FBTE1E/POTA", brand: "", category: "micro-inverters", price: 2009.69, stock: 0, power: "3 KW", type: "Triphasé" },
+  { name: "Module Monocristallin Demi Cellules QCELLS 400 Wc - Q.PEAK DUO BLK M-G11S+ SERIE", sku: "QC/400-DU-BLK-M-G11S+", brand: "Q.PEAK", category: "panels", price: 87.6, stock: 0, power: "400 Wc", type: "" },
+  { name: "Module Monocristallin REGITEC 360 Wc - 182mm 16BB 108Cells Topcon BIPV Module - ", sku: "RG/RMHT54-360O1", brand: "REGITEC", category: "panels", price: 132.84, stock: 28, power: "360 Wc", type: "" },
+  { name: "KIT 4.25 KWC ENPHASE HC (10X425W) PV MONOPHASÉ / FIXATION ESDEC 1X7 1X3 PORTRAIT", sku: "10SP425FBME1E/POTA", brand: "", category: "micro-inverters", price: 4603.41, stock: 0, power: "4.25 KW", type: "Monophasé" },
+  { name: "KIT 3 KWC ENPHASE (8X375W) PV TRIPHASÉ / FIXATION ESDEC 4X2 PORTRAIT TUILE ARDOI", sku: "8RE375FBTE1E/4X2POTA", brand: "", category: "micro-inverters", price: 2455.12, stock: 0, power: "3 KW", type: "Triphasé" },
+  { name: "BOITE DERIVATION + EMBOUTS terminal connecteur AC étanche pour câble HMS", sku: "HM/TERMCON-BOX-DER", brand: "", category: "accessories", price: 3, stock: 0, power: "", type: "" },
+  { name: "Coffret de protection AC triphasé  pour 2 Ond 50 kVA Tri  1 sortie 99 kVA Sectio", sku: "CO/AC-99TRI-2E-50+50", brand: "", category: "accessories", price: 1647.5, stock: 0, power: "", type: "Triphasé" },
+  { name: "Pince pour joint debout CF:x SingleRail", sku: "K2S/2003024", brand: "K2 SYSTEMS", category: "mounting", price: 4.14, stock: 0, power: "", type: "" },
+  { name: "BlackCover SingleRail 36", sku: "K2S/2003523", brand: "K2 SYSTEMS", category: "mounting", price: 2.13, stock: 0, power: "", type: "" },
+  { name: "ClickFit EVO - Pince joint plié simple 14mm", sku: "ESD/1008035", brand: "ESDEC", category: "mounting", price: 8, stock: 0, power: "", type: "" },
+  { name: "Module photovoltaïque Mono MBB, demi-cellule Sunrise 410W SR-54M410HL Pro Aquama", sku: "SR/54M410HLPro-AQ", brand: "SUNRISE", category: "panels", price: 55.35, stock: 0, power: "410 W", type: "" },
+  { name: "HUAWEI - Onduleur SUN2000- 100KTL-M2 (AFCI) - Onduleur triphasé 100kw 10MPPT", sku: "HUA/SUN2000-100KTL-M2", brand: "HUAWEI", category: "inverters", price: 3896.812, stock: 1, power: "100 kw", type: "Triphasé" },
+  { name: "Huawei Smart Dongle Wifi + Ethernet - WLAN -FE (Model: SDongleA-05)", sku: "HUA/WLAN-FE", brand: "HUAWEI", category: "optimizers", price: 35.12, stock: 36, power: "", type: "" },
+  { name: "Coffret arrêt d’urgence (bris de glace IP44 couleur Rouge) - Compatible gestion ", sku: "CO/ARRETURG", brand: "", category: "accessories", price: 90, stock: -1, power: "", type: "" },
+  { name: "étiquettes AC autoconsommation + revente surplus ou installation en Revente Tota", sku: "CO/DC-ET3", brand: "", category: "accessories", price: 7.5, stock: 0, power: "", type: "" },
+  { name: "Module photovoltaïque Mono MBB, demi-cellule RC 410W-430W SR-54M410HL Full Black", sku: "SR/54M410HLPro-FB", brand: "SUNRISE", category: "panels", price: 57.4, stock: -17, power: "410 W", type: "" },
+  { name: "Systeme de montage ESDEC 4X8 Portrait Tuile ardoise", sku: "ESD/4X8POTA", brand: "ESDEC", category: "mounting", price: 1119.33, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X6 Portrait Bac acier (500W)", sku: "ESD/2X6POBA/500", brand: "ESDEC", category: "mounting", price: 397.75, stock: 0, power: "500 W", type: "" },
+  { name: "Coupleur hybride monophasé Hoymiles  - HAS-5.0LV-EUG1 - Courant de sortie max. 2", sku: "HM/HAS-5.0LV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 560, stock: 2, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Hoymiles  - HYS-6.0LV-EUG1 (7.5 KW mono - 2MPPT) - Co", sku: "HM/HYS-6.0LV-EUG1", brand: "HOYMILES", category: "inverters", price: 710, stock: -1, power: "7.5 KW", type: "Hybrid" },
+  { name: "Data Transfer Stick - model: DTS-Ethernet-G1 (CD041239)", sku: "HM/HDTS-Ethernet-G1", brand: "HOYMILES", category: "accessories", price: 30, stock: 2, power: "", type: "" },
+  { name: "KIT 3 KWC (8X375W) PV MONOPHASÉ / FIXATION ESDEC 2X4 PORTRAIT TUILE MÉCANIQUE", sku: "8RE375FBMH2E/POTM", brand: "", category: "mounting", price: 1486.55, stock: 0, power: "3 KW", type: "Monophasé" },
+  { name: "Coffret de protection AC triphasé  pour 1 onduleur 99 kVA tri - 1 sortie 99 kVA ", sku: "CO/AC-99KTRI", brand: "", category: "inverters", price: 0, stock: 1, power: "", type: "Triphasé" },
+  { name: "Trina Solar 600 Wc Bi-Verre N-TYPE Vertex S+ 5 cadre noir tedlar blanc - 2384×11", sku: "TRI/600M-BV-BC", brand: "", category: "panels", price: 132, stock: 2, power: "600 Wc", type: "" },
+  { name: "Batterie PYTES V5 alpha LiFePO4 - Unité de base de 5.12 kWh / 51.2 V / 100 Ah - ", sku: "PYT/V5-alpha", brand: "", category: "batteries", price: 720, stock: -2, power: "5.12 kW", type: "LFP" },
+  { name: "Batterie-onduleur câble de communication 3,5 m (Ref 161412101071)", sku: "PYT/C3500RJ45", brand: "PYTES", category: "inverters", price: 5.5, stock: 9, power: "", type: "" },
+  { name: "0AWG Amphénol 8.0-M10 Négatif (Noir) - Câble d'alimentation batterie-onduleur 2m", sku: "PYT/BTI-V5-M10-CABLE-2M-", brand: "PYTES", category: "inverters", price: 21, stock: 0, power: "", type: "" },
+  { name: "0AWG Amphénol 8.0-M10 Positif (Rouge) - Câble d'alimentation batterie-onduleur 2", sku: "PYT/BTI-V5-M10-CABLE-2M+", brand: "PYTES", category: "inverters", price: 21, stock: 0, power: "", type: "" },
+  { name: "LSW-5 Wifi Dongle pour V5/V5a (Ref 162002100019)", sku: "PYT/EXT-CABLE-LSW-5-V5", brand: "PYTES", category: "accessories", price: 16, stock: -3, power: "", type: "" },
+  { name: "Set de supports pour V5 ou V5 alpha - Chaque ensemble contient 4 pièces de suppo", sku: "PYT/BRACKETS-SET-V5", brand: "PYTES", category: "mounting", price: 26, stock: 5, power: "", type: "" },
+  { name: "Câble de console pour le firmware mise à niveau - Câble de débogage de la consol", sku: "PYT/CONSOLE", brand: "PYTES", category: "batteries", price: 5.5, stock: 4, power: "", type: "" },
+  { name: "Armoire intérieure V-Box-IC pour V5 / V5a peut contenir jusqu'à 3 pièces V5 / V5", sku: "PYT/V-Box-IC-3V5", brand: "PYTES", category: "accessories", price: 150, stock: 1, power: "", type: "" },
+  { name: "0000AWG M10-M10 Négatif (Noir) - Câble d'alimentation busbar-onduleur 2m ((2*M10", sku: "PYT/BUSTI-CABLE-2M-", brand: "PYTES", category: "inverters", price: 21, stock: 1, power: "", type: "" },
+  { name: "0000AWG M10-M10 Positif (Rouge) - Câble d'alimentation busbar-onduleur 2m ((2*M1", sku: "PYT/BUSTI-CABLE-2M+", brand: "PYTES", category: "inverters", price: 21, stock: 1, power: "", type: "" },
+  { name: "600A BUSBAR - Avec 6 x vis à bornes M10 - Note maximale actuelle 600A (Ref : 110", sku: "PYT/Busbar-600A", brand: "PYTES", category: "accessories", price: 85, stock: 1, power: "", type: "" },
+  { name: "Onduleur hybride monophasé Hoymiles  - HYS-5.0LV-EUG1 (7.5 KW mono - 2MPPT) - Co", sku: "HM/HYS-5.0LV-EUG1", brand: "HOYMILES", category: "inverters", price: 680, stock: -2, power: "7.5 KW", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Hoymiles  - HYS-4.6LV-EUG1 (7.5 KW mono - 2MPPT) - Co", sku: "HM/HYS-4.6LV-EUG1", brand: "HOYMILES", category: "inverters", price: 660, stock: 0, power: "7.5 KW", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Hoymiles  - HYS-3.6LV-EUG1 (6 KW mono - 2MPPT) - Comp", sku: "HM/HYS-3.6LV-EUG1", brand: "HOYMILES", category: "inverters", price: 630, stock: -1, power: "6 KW", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Hoymiles  - HYS-3.0LV-EUG1 (4,5 KW mono - 1MPPT) - Co", sku: "HM/HYS-3.0LV-EUG1", brand: "HOYMILES", category: "inverters", price: 610, stock: 0, power: "4.5 KW", type: "Hybrid" },
+  { name: "Coupleur hybride monophasé Hoymiles  - HAS-3.0LV-EUG1 - Courant de sortie max. 1", sku: "HM/HAS-3.0LV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 500, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coupleur hybride monophasé Hoymiles  - HAS-3.6LV-EUG1 - Courant de sortie max. 1", sku: "HM/HAS-3.6LV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 520, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coupleur hybride monophasé Hoymiles  - HAS-4.6LV-EUG1 - Courant de sortie max. 2", sku: "HM/HAS-4.6LV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 540, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coupleur hybride triphasé Hoymiles  - HAT-5.0HV-EUG1 - Courant de sortie max. 15", sku: "HM/HAT-5.0HV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 820, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coupleur hybride triphasé Hoymiles  - HAT-6.0HV-EUG1 - Courant de sortie max. 18", sku: "HM/HAT-6.0HV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 860, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coupleur hybride triphasé Hoymiles  - HAT-8.0HV-EUG1 - Courant de sortie max. 24", sku: "HM/HAT-8.0HV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 910, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coupleur hybride triphasé Hoymiles  - HAT-10.0HV-EUG1 - Courant de sortie max. 2", sku: "HM/HAT-10.0HV-EUG1", brand: "HOYMILES", category: "micro-inverters", price: 960, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Hoymiles  - HYT-5.0HV-EUG1 (7,5 KW Tri - 2MPPT) - Comp", sku: "HM/HYT-5.0HV-EUG1", brand: "HOYMILES", category: "inverters", price: 1000, stock: 0, power: "7.5 KW", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Hoymiles  - HYT-6.0HV-EUG1 (9 KW Tri - 2MPPT) - Compat", sku: "HM/HYT-6.0HV-EUG1", brand: "HOYMILES", category: "inverters", price: 1050, stock: 0, power: "9 KW", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Hoymiles  - HYT-8.0HV-EUG1 (12 KW Tri - 2MPPT) - Compa", sku: "HM/HYT-8.0HV-EUG1", brand: "HOYMILES", category: "inverters", price: 1100, stock: 0, power: "12 KW", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Hoymiles  - HYT-10.0HV-EUG1 (15 KW Tri - 2MPPT) - Comp", sku: "HM/HYT-10.0HV-EUG1", brand: "HOYMILES", category: "inverters", price: 1200, stock: 0, power: "15 KW", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Hoymiles  - HYT-12.0HV-EUG1 (15 KW Tri - 2MPPT) - Comp", sku: "HM/HYT-12.0HV-EUG1", brand: "HOYMILES", category: "inverters", price: 1300, stock: 0, power: "15 KW", type: "Hybrid" },
+  { name: "ARCHOS T101HD 2+16GB NC 84713000", sku: "ARC/503907", brand: "ARCHOS", category: "accessories", price: 42.25, stock: 95, power: "", type: "" },
+  { name: "Module photovoltaïque Topcon technologie MBB, demi-cellule AUSTA 500W AU-132MHB ", sku: "AUSTA/AU500-33V- MHB", brand: "AUSTA", category: "panels", price: 82.5, stock: 2, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 4X4 Portrait SCHINGLE", sku: "ESD/4X4POBB", brand: "ESDEC", category: "mounting", price: 620.13, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 1X12 Portrait Tuiles Plates (500 W)", sku: "ESD/1X12POTP/500", brand: "ESDEC", category: "mounting", price: 501.57, stock: 0, power: "500 W", type: "" },
+  { name: "STRUCTURE GSE 2X6 PORTRAIT POUR TUILE MECANIQUE", sku: "GSE/2X6POTM", brand: "GSE", category: "accessories", price: 1018.81, stock: 0, power: "", type: "" },
+  { name: "BANDE ETANCHE NOIR 5M", sku: "GSE/FLEXALUN", brand: "", category: "accessories", price: 0, stock: -6, power: "", type: "" },
+  { name: "CALE EPDM CELL ADH NOA/PPRO 25*21 EP 5MM", sku: "GSE/CALE_EPDM", brand: "", category: "accessories", price: 0, stock: -54, power: "", type: "" },
+  { name: "DEMI PLAQUE 1650/1135 POUR MODULE 400W", sku: "GSE/PPORDEMI1650113", brand: "GSE", category: "panels", price: 0, stock: 0, power: "400 W", type: "" },
+  { name: "STRUCTURE GSE 4X6 PORTRAIT POUR TUILE MECANIQUE (400W)", sku: "GSE/4X6POTM", brand: "GSE", category: "accessories", price: 1792.312, stock: 0, power: "400 W", type: "" },
+  { name: "Hoymiles smart meter CHINT DDSU 666 monophasé 1*100A (Ref A7080190)  Modèle : DD", sku: "HM/DDSU666/OND", brand: "HOYMILES", category: "micro-inverters", price: 30, stock: -1, power: "", type: "Monophasé" },
+  { name: "\"Hoymiles smart meter CHINT DTSU 666 triphasé 3*100A (Ref A7080191)  Modèle : DT", sku: "HM/DTSU666-3P/OND", brand: "HOYMILES", category: "micro-inverters", price: 80, stock: -2, power: "", type: "Triphasé" },
+  { name: "HUAWEI – DDSU666-H (MonoPhasé – Smart Power Sensor Mono (tores inclus) 100A) com", sku: "HUA/SMART-MONO", brand: "HUAWEI", category: "optimizers", price: 35.12, stock: 13, power: "", type: "Monophasé" },
+  { name: "Onduleur hybride monophasé Huawei - 5 KTL-L1 (Mono-2 MPPT) - Compatible Optimise", sku: "HUA/SUN2000-5KTL-L1", brand: "HUAWEI", category: "inverters", price: 853.92, stock: 0, power: "", type: "Hybrid" },
+  { name: "Coffret de DC 600V 32A sectionneur batterie et protection pour système avec batt", sku: "CO/DC600V-32A-CBAT", brand: "", category: "inverters", price: 165.6, stock: 2, power: "", type: "Hybrid" },
+  { name: "Coffret de protection AC 6 kW monophasé type B avec disjoncteur différentiel 300", sku: "CO/AC-6K-B-300MA-AL", brand: "", category: "batteries", price: 427.2, stock: 1, power: "6 kW", type: "Monophasé" },
+  { name: "KIT BATTERIE 10 KWH HUAWEI POUR INSTALLATION MONOPHASE", sku: "", brand: "", category: "batteries", price: 4141.2, stock: 0, power: "10 KW", type: "Monophasé" },
+  { name: "STRUCTURE GSE 1X8 PORTRAIT POUR TUILE MECANIQUE", sku: "GSE/1X8POTM", brand: "", category: "accessories", price: 0, stock: 0, power: "", type: "" },
+  { name: "Batterie PYTES V5° LiFePO4 - Unité de base de 5.12 kWh / 51.2 V / 100 Ah - Plus ", sku: "PYT/V5°", brand: "PYTES", category: "batteries", price: 720, stock: 0, power: "5.12 kW", type: "LFP" },
+  { name: "Câble d'alimentation (Noir) batterie-onduleur 2m (M10, 53 mm2 / 200A) s'adapte à", sku: "PYT/BTI-V5°-M10-CABLE-2M-", brand: "PYTES", category: "inverters", price: 21, stock: 0, power: "", type: "" },
+  { name: "Câble d'alimentation Positif (Rouge) batterie-onduleur 2m (M10, 53 mm2 / 200A) s", sku: "PYT/BTI-V5°-M10-CABLE-2M+", brand: "PYTES", category: "inverters", price: 21, stock: 0, power: "", type: "" },
+  { name: "JORISIDE - Kit de bride latérale noire 34-35", sku: "JOR/4008148", brand: "JORISOLAR", category: "accessories", price: 1.99, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X6 Portrait SHINGLE", sku: "ESD/3X6POBIT", brand: "ESDEC", category: "mounting", price: 691.5, stock: 0, power: "", type: "" },
+  { name: "JORISIDE - Kit avec bride centrale aluminium ST02 30-50mm + TERRAGRIF (16379)", sku: "JOR/000016379", brand: "JORISOLAR", category: "accessories", price: 2.1, stock: 0, power: "", type: "" },
+  { name: "[SVE-ET-BE] Prestation de service de type étude technique", sku: "", brand: "", category: "accessories", price: 1000, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 3X4 Paysage Tuile mécanique", sku: "ESD/3X4PATM/500", brand: "ESDEC", category: "mounting", price: 556.8, stock: 0, power: "", type: "" },
+  { name: "SUNPOWER PANNEAU PHOTOVOLTAÏQUE 410W – MONO-CRISTALLIN DEMI CELLULE - « SPR-P6-4", sku: "SP/405M-P6-DC-FB", brand: "SUNPOWER", category: "panels", price: 185, stock: 0, power: "410 W", type: "" },
+  { name: "SUNRISE PANNEAU PHOTOVOLTAÏQUE 500W – TOP CON SMBB DEMI CELLULE - « SR-60M500NHL", sku: "SR/60M500NHLPro-FB", brand: "SUNRISE", category: "panels", price: 65, stock: 0, power: "500 W", type: "" },
+  { name: "Batterie AURORA 2.24 kWh - LifePO4 - 2 panneaux jusqu’à 600W -", sku: "HMES-HY800-B2240", brand: "", category: "batteries", price: 0, stock: 0, power: "2.24 kW", type: "" },
+  { name: "Module photovoltaïque Mono SMBB, TOP Con,  demi-cellule Sunrise GOLIATH 500W 66M", sku: "SR/66M500NHLPro-FB", brand: "SUNRISE", category: "panels", price: 79.91, stock: -7, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X10 Portrait Tuile ardoise", sku: "ESD/2X10POTA", brand: "ESDEC", category: "mounting", price: 672.1, stock: 0, power: "", type: "" },
+  { name: "Coffret de protection AC 6 kW monophasé avec Inter différentiel 2P 63A/300mA Typ", sku: "CO/AC-6K-8M-300MA", brand: "", category: "panels", price: 89.5, stock: 0, power: "6 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 9 kW monophasé avec Inter différentiel 2P 63A/300mA Tpe", sku: "CO/AC-9K-8M-300MA", brand: "", category: "panels", price: 92, stock: 0, power: "9 kW", type: "Monophasé" },
+  { name: "Coffret de protection AC 3 à 9 kW Triphasé avec disjoncteur différentiel 300 mA ", sku: "CO/AC-9KTRI-13M-300MA", brand: "", category: "micro-inverters", price: 119, stock: 0, power: "9 kW", type: "Triphasé" },
+  { name: "Coffret de protection AC 3 à 9 kW avec compteur permettant de suivre la consomma", sku: "CO/AC-9KTRI-COMPTEUR-24M-300MA", brand: "", category: "accessories", price: 141.75, stock: 0, power: "9 kW", type: "" },
+  { name: "Coffret de protection AC 12 kW monophasé 3 entrées avec compteur permettant de s", sku: "CO/AC-12K-3E-COMPTEUR-26M-300MA", brand: "", category: "accessories", price: 93.45, stock: 0, power: "12 kW", type: "Monophasé" },
+  { name: "Huawei Batterie Back-up box 1 phase à placer en amont du coffret AC (02406294)", sku: "HUA/BAT-BACK-1PH", brand: "HUAWEI", category: "batteries", price: 789, stock: 1, power: "", type: "" },
+  { name: "Huawei Batterie Back-up box 3 phases à placer en amont du coffret AC (02406150)", sku: "HUA/BAT-BACK-3PH", brand: "HUAWEI", category: "batteries", price: 1259, stock: 1, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 2X6 Paysage Tuile mécanique (500W)", sku: "ESD/2X6PATM/500", brand: "ESDEC", category: "mounting", price: 528.46, stock: 0, power: "500 W", type: "" },
+  { name: "Onduleur triphasé Huawei  - 30 KTL M3 (30 KW tri - 4MPPT)  - Garantie 5 ans exte", sku: "HUA/OND-30KTL-M3", brand: "HUAWEI", category: "inverters", price: 1235.22, stock: 5, power: "30 KW", type: "Triphasé" },
+  { name: "S-Dome 6.10 Base Set L : Ensemble de rails de base préassemblés pour le système ", sku: "K2S/2004096", brand: "K2 SYSTEMS", category: "mounting", price: 33.95, stock: 0, power: "", type: "" },
+  { name: "Dome 6.10 Peak : Composant pour l'élévation du module du système Dome 6.10", sku: "K2S/2004125", brand: "K2 SYSTEMS", category: "panels", price: 4.64, stock: 0, power: "", type: "" },
+  { name: "Dome 6 Connector 195 Set : Rail de jonction utilisé comme élément de jonction en", sku: "K2S/2004123", brand: "K2 SYSTEMS", category: "mounting", price: 7.16, stock: 0, power: "", type: "" },
+  { name: "S-Dome 6.10 Windbreaker short : Windbreaker K2 pour évacuer le vent à  l’arrière", sku: "K2S/2003249", brand: "K2 SYSTEMS", category: "mounting", price: 13.46, stock: 0, power: "", type: "" },
+  { name: "Thread-forming metal screw 4,8x20 : Vis à tôle autoperceuse K2 à tête hexagonale", sku: "K2S/2003427", brand: "K2 SYSTEMS", category: "mounting", price: 0.47, stock: 0, power: "", type: "" },
+  { name: "Dome Porter short : Porter K2 pour un éventuel lestage rapide et simple pour les", sku: "K2S/2003150", brand: "K2 SYSTEMS", category: "mounting", price: 18.69, stock: 0, power: "", type: "" },
+  { name: "Dome 6.10 SD : Élément de support du module frontal pour le système Dome 6.10", sku: "K2S/2003243", brand: "K2 SYSTEMS", category: "panels", price: 1.98, stock: 0, power: "", type: "" },
+  { name: "Dome Mat S 380 : Appui Mat S. Grâce à  son élasticité, il absorbe les tolérances", sku: "K2S/2003126", brand: "K2 SYSTEMS", category: "accessories", price: 3.54, stock: 0, power: "", type: "" },
+  { name: "Vis à tôle autoperceuse K2 à tête hexagonale avec rondelle d’étanchéité 6x25", sku: "K2S/2002937", brand: "K2 SYSTEMS", category: "mounting", price: 0.47, stock: 0, power: "", type: "" },
+  { name: "K2 BasicRail 22; 4.80 m : Rail de montage K2 longueur 4,80m", sku: "K2S/2004278", brand: "K2 SYSTEMS", category: "mounting", price: 31.62, stock: 0, power: "", type: "" },
+  { name: "Mat-S Tool : Outil de montage pour fixer le Mat S sur le BasicRail", sku: "K2S/2004141", brand: "K2 SYSTEMS", category: "mounting", price: 1.17, stock: 0, power: "", type: "" },
+  { name: "Dome SpeedPorter : Pour le lestage sur le système de toiture plate K2 Dome 6 Cla", sku: "K2S/2002300", brand: "K2 SYSTEMS", category: "mounting", price: 2.08, stock: 0, power: "", type: "" },
+  { name: "AGCP 4P 100A Schneider Electric -  Easypact CVS100B 25kA (Centrale de 36 à 60 kV", sku: "EL/AC-AGCP100A", brand: "Schneider Electric", category: "accessories", price: 774.5, stock: 0, power: "", type: "" },
+  { name: "Systeme de montage JORISIDE 2X4 Portrait Bac acier", sku: "JOR/2X4POTM/30MM", brand: "JORISOLAR", category: "accessories", price: 126.56, stock: 0, power: "", type: "" },
+  { name: "DUALSUN FLASH 425 WC GLASS-GLASS N-TYPE - TRANSPARENT - 1722X1134X30MM - GARANTI", sku: "DS/FLASH-425M-BV-TR", brand: "DUALSUN", category: "accessories", price: 162.72, stock: 0, power: "425 WC", type: "" },
+  { name: "Câble d'alimentation (Noir) batterie-onduleur 2m (M8 - BTIP2000AM-SCN) s'adapte ", sku: "PYT/BTI-V5°-M8-CABLE-2M-", brand: "PYTES", category: "inverters", price: 13.5, stock: 5, power: "", type: "" },
+  { name: "Câble d'alimentation Positif (Rouge) batterie-onduleur 2m (M8 - BTIP2000AM-SCP) ", sku: "PYT/BTI-V5°-M8-CABLE-2M+", brand: "PYTES", category: "inverters", price: 13.5, stock: 5, power: "", type: "" },
+  { name: "KIT BATTERIE 5 KWH PYTES POUR INSTALLATION MONOPHASE/TRIPHASE", sku: "PYT/V5°/KIT-5KW", brand: "PYTES", category: "batteries", price: 768.5, stock: 0, power: "5 KW", type: "Triphasé" },
+  { name: "Systeme de montage JORISIDE 2X4 Paysage Bac acier", sku: "JOR/2X4PATM/30MM", brand: "JORISOLAR", category: "accessories", price: 104.64, stock: 1, power: "", type: "" },
+  { name: "Onduleur Hybride Triphasé 10Kw bas voltage Deye SUN-10K-SG04LP3-EU - 2/2+1 MPTT ", sku: "DEY/SUN-10K-SG04LP3-EU", brand: "DEYE", category: "inverters", price: 1537, stock: 0, power: "10 Kw", type: "Hybrid" },
+  { name: "Data Transfer Stick - model: DTS-WIFI-G1.HM (Ref CD041114)", sku: "HM/DTS-WIFI-G1.HM", brand: "HOYMILES", category: "accessories", price: 30, stock: 37, power: "", type: "" },
+  { name: "MODULE BI-VERRE TECHNOLOGIE HETERO JUNCTION, DEMI CELLULES AESOLAR 500 W - HJT F", sku: "AE/AE500TMD-120BDE", brand: "AE SOLAR (COMET)", category: "panels", price: 86.5, stock: 10, power: "500 W", type: "" },
+  { name: "ESB - Kit d'extension - Comprend : Deux éclisses de liaisons pour rail - Quatre ", sku: "ESS/ESB-KIT EXTENSION", brand: "Easy Solar Box®", category: "mounting", price: 9, stock: 1, power: "", type: "" },
+  { name: "ESB - KIT SUPPORT LESTABLE - Support lestable pour modules photovoltaïques en ac", sku: "ESS/ESB-KIT-SUPPORT-LESTABLE", brand: "Easy Solar Box®", category: "panels", price: 130.53, stock: 2, power: "", type: "" },
+  { name: "STRUCTURE GSE 2X3 PORTRAIT POUR TUILE MECANIQUE", sku: "GSE/2X3POTM", brand: "GSE", category: "accessories", price: 0, stock: 0, power: "", type: "" },
+  { name: "STRUCTURE GSE 1X2 PORTRAIT POUR TUILE MECANIQUE", sku: "GSE/1X2POTM", brand: "GSE", category: "accessories", price: 0, stock: 0, power: "", type: "" },
+  { name: "Câble d'extension de dongle Wifi pour LSW-5 (Ref 110409100170)", sku: "PYT/LSW-5-DONGLE-V5", brand: "PYTES", category: "accessories", price: 7, stock: 7, power: "", type: "" },
+  { name: "Module Monocristallin Demi Cellules FHE SP MASTER 500 W Bas carbone - Half-Cut F", sku: "FHE-500W-SP-MASTER", brand: "FHE MASTER", category: "panels", price: 70, stock: 10, power: "500 W", type: "" },
+  { name: "MODULE MONOCRISTALLIN THALEOS DEMI CELLULES, TOPCON, PANDA PRO 500 W - HALF-CUT ", sku: "THA-500W-TP-PANDA", brand: "PANDA (Thaleos)", category: "panels", price: 75, stock: 15, power: "500 W", type: "" },
+  { name: "KIT BATTERIE 5 KWH PYTES POUR INSTALLATION MONOPHASE/TRIPHASE AVEC ONDULEUR DEYE", sku: "PYT/V5°/KIT-5KW-DEYE", brand: "PYTES", category: "inverters", price: 783.5, stock: 0, power: "5 KW", type: "Triphasé" },
+  { name: "SUNPOWER 428WC - P7 DC PERFORMANCE 7 - BI-VERRE - FULL BLACK", sku: "SP/428M-P7-DC-FB", brand: "SUNPOWER", category: "accessories", price: 104.5, stock: 15, power: "428 WC", type: "" },
+  { name: "TRINA SOLAR 500 WC BI-VERRE N-TYPE VERTEX S+ - CADRE NOIR TEDLAR BLANC - 1961X11", sku: "TRI/500M-BV", brand: "Trinasolar", category: "panels", price: 79.2, stock: 0, power: "500 WC", type: "" },
+  { name: "Systeme de montage ESDEC 2X5 Portrait Tuile fibreciment", sku: "ESD/2X5POTFC", brand: "ESDEC", category: "mounting", price: 365.54, stock: 0, power: "", type: "" },
+  { name: "OMERIN Câble spécial solaire certifié TUV 4mm². Par mètre (noir)", sku: "CAB/OM/DC-4-1M", brand: "SOLARPLAST", category: "accessories", price: 0.49, stock: -275, power: "", type: "" },
+  { name: "KIT BATTERIE 5 KWH ALPHA PYTES POUR INSTALLATION MONOPHASE/TRIPHASE", sku: "PYT/V5ALPHA/KIT-5KW", brand: "PYTES", category: "batteries", price: 768.5, stock: 0, power: "5 KW", type: "Triphasé" },
+  { name: "Systeme de montage JORISIDE 2X8 Portrait Bac acier", sku: "JOR/2X8POTM/30MM", brand: "JORISOLAR", category: "accessories", price: 229.2, stock: 3, power: "", type: "" },
+  { name: "Batterie PYTES E-Box 48100R-C16 assemblé avec des cellules LiFePO4 - Unité de ba", sku: "PYT/E-Box-48100R-C16", brand: "PYTES", category: "batteries", price: 720, stock: 2, power: "5.12 kW", type: "LFP" },
+  { name: "Câble d'alimentation (Noir) batterie-onduleur 2m (M8 - BTIP2000AM-SCN) s'adapte ", sku: "PYT/BTI-M8-CABLE-2M-", brand: "PYTES", category: "inverters", price: 13.5, stock: -2, power: "", type: "" },
+  { name: "Câble d'alimentation Positif (Rouge) batterie-onduleur 2m (M8 - BTIP2000AM-SCP) ", sku: "PYT/BTI-M8-CABLE-2M+", brand: "PYTES", category: "inverters", price: 13.5, stock: -2, power: "", type: "" },
+  { name: "4AWG Amphénol 5.7-M10 Negatif (Noir) - Câble d'alimentation batterie-onduleur 2m", sku: "PYT/BTI-M10-CABLE-2M-", brand: "PYTES", category: "inverters", price: 13.5, stock: -3, power: "", type: "" },
+  { name: "4AWG Amphénol 5.7-M10 Positif (Orange) - Câble d'alimentation batterie-onduleur ", sku: "PYT/BTI-M10-CABLE-2M+", brand: "PYTES", category: "inverters", price: 13.5, stock: -3, power: "", type: "" },
+  { name: "KIT BATTERIE 5 KWH E-Box PYTES POUR INSTALLATION MONOPHASE/TRIPHASE", sku: "PYT/E-Box/KIT-5KW", brand: "PYTES", category: "batteries", price: 768.5, stock: 0, power: "5 KW", type: "Triphasé" },
+  { name: "Huawei optimiseur de puissance P600  (Tension de 10 à 80V - Courant entrée max 1", sku: "HUA/P600", brand: "HUAWEI", category: "inverters", price: 34.1, stock: 10, power: "600 W", type: "" },
+  { name: "Onduleur hybride monophasé Huawei - SUN2000-2KTL-L1 - 2MPPT - Compatible Optimis", sku: "HUA/SUN2000-2KTL-L1", brand: "HUAWEI", category: "inverters", price: 382, stock: 0, power: "", type: "Hybrid" },
+  { name: "Huawei optimiseur de puissance P1300 – Smart PV Optimizer – Pose paysage - Garan", sku: "HUA/P1300-SHORT", brand: "HUAWEI", category: "optimizers", price: 49.11, stock: 0, power: "1300 W", type: "" },
+  { name: "Huawei optimiseur de puissance P1300 – Smart PV Optimizer – Pose paysage - Garan", sku: "HUA/P1300-LONG", brand: "HUAWEI", category: "optimizers", price: 56.54, stock: 100, power: "1300 W", type: "" },
+  { name: "Onduleur hybride monophasé Huawei - SUN2000-3,6KTL-L1 - 2MPPT - Compatible Optim", sku: "HUA/SUN2000-3,6KTL-L1", brand: "HUAWEI", category: "inverters", price: 428, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Huawei - SUN2000-4,6KTL-L1 - 2 MPPT - Compatible Opti", sku: "HUA/SUN2000-4,6KTL-L1", brand: "HUAWEI", category: "inverters", price: 464, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Huawei SUN2000-8K-LC0 monophasé (8800 VA - 3 MPPT) an", sku: "HUA/SUN2000-8K-LC0", brand: "HUAWEI", category: "inverters", price: 542.23, stock: 10, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Huawei SUN2000-10K-LC0 monophasé (10000 VA - 3 MPPT) ", sku: "HUA/SUN2000-10K-LC0", brand: "HUAWEI", category: "inverters", price: 594.48, stock: 9, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Huawei - SUN2000-3KTL-L1 - 2MPPT - Compatible Optimis", sku: "HUA/SUN2000-3KTL-L1", brand: "HUAWEI", category: "inverters", price: 400, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride monophasé Huawei - SUN2000-4KTL-L1 - 2MPPT - Compatible Optimis", sku: "HUA/SUN2000-4KTL-L1", brand: "HUAWEI", category: "inverters", price: 454, stock: 0, power: "", type: "Hybrid" },
+  { name: "Gestionnaire d'énergie intelligent EMMA-A02 Huawei (Ref : EMMA-A02)", sku: "HUA/EMMA-A02", brand: "HUAWEI", category: "optimizers", price: 228.71, stock: 4, power: "", type: "" },
+  { name: "Batterie DEYE SE-G5.1 Pro-B assemblé avec des cellules LiFePO4 - Unité de base d", sku: "DEY/SE-G5.1Pro-B", brand: "DEYE", category: "batteries", price: 740, stock: 7, power: "5.12 kW", type: "LFP" },
+  { name: "Onduleur hybride monophase bas voltage Deye SUN-3.6K-SG03LP1-EU - 2 MPTT - Puiss", sku: "DEY/SUN-3.6K-SG03LP1-EU", brand: "DEYE", category: "inverters", price: 868, stock: 1, power: "", type: "Hybrid" },
+  { name: "Onduleur Hybride Monophasé 6Kw Deye SUN-6K-SG04LP1-EU - 2 MPTT - 370VAC - (330W ", sku: "DEY/SUN-6K-SG04LP1-EU", brand: "DEYE", category: "inverters", price: 890, stock: 0, power: "6 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Monophasé 8Kw Deye SUN-8K-SG04LP1-EU - 2 MPTT - 370VAC - (330W ", sku: "DEY/SUN-8K-SG04LP1-EU", brand: "DEYE", category: "inverters", price: 1295, stock: 1, power: "8 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 5Kw bas voltage Deye SUN-5K-SG04LP3-EU - 2/1+1 MPTT - ", sku: "DEY/SUN-5K-SG04LP3-EU", brand: "DEYE", category: "inverters", price: 1400, stock: 1, power: "5 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 6Kw bas voltage Deye SUN-6K-SG04LP3-EU - 2/1+1 MPTT - ", sku: "DEY/SUN-6K-SG04LP3-EU", brand: "DEYE", category: "inverters", price: 1434, stock: 0, power: "6 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 8Kw bas voltage Deye SUN-8K-SG04LP3-EU - 2/1+1 MPTT - ", sku: "DEY/SUN-8K-SG04LP3-EU", brand: "DEYE", category: "inverters", price: 1471, stock: 8, power: "8 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 12Kw bas voltage Deye SUN-12K-SG04LP3-EU - 2/2+1 MPTT ", sku: "DEY/SUN-12K-SG04LP3-EU", brand: "DEYE", category: "inverters", price: 1624, stock: 0, power: "12 Kw", type: "Hybrid" },
+  { name: "Batterie ES Elitec Lithium EL-5 5KWH assemblé avec des cellules LiFePO4 - Unité ", sku: "ELI/EL5-Pro-5KW", brand: "ES Elitec", category: "batteries", price: 750, stock: 1, power: "5 KW", type: "LFP" },
+  { name: "Câble batterie ELITEC EL-5 / EL-10 2m (+/-) (Set 2 cables Rouge et Noir (PHBAT21", sku: "ELI/EL5-SETCABLE-2M", brand: "ES Elitec", category: "batteries", price: 65, stock: 1, power: "", type: "" },
+  { name: "Kit support batterie ELITEC (PHBAT213)", sku: "ELI/EL5-KIT-SUPPORT", brand: "ES Elitec", category: "batteries", price: 30, stock: -1, power: "", type: "" },
+  { name: "Onduleur Hybride Monophasé 6Kw Deye SUN-6K-SG03LP1-EU - 2 MPTT - 370VAC - (33×58", sku: "DEY/SUN-6K-SG03LP1-EU", brand: "DEYE", category: "inverters", price: 890, stock: 34, power: "6 Kw", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé 4kw Huawei - SUN2000-4-KTL-M1 - 2 MPPT - Compatible Op", sku: "HUA/SUN2000-4KTL-M1", brand: "HUAWEI", category: "inverters", price: 349, stock: -1, power: "4 kw", type: "Hybrid" },
+  { name: "Pompe à chaleur air-eau 16 kW monophasé avec  pompe - 060X-R32M1", sku: "P000000040", brand: "", category: "accessories", price: 1974.15, stock: 0, power: "16 kW", type: "Monophasé" },
+  { name: "Ballons thermo-dynamiques 300L - GHE24-300-C1", sku: "P000000038", brand: "", category: "accessories", price: 819.03, stock: 0, power: "", type: "" },
+  { name: "Onduleur hybride triphasé Huawei - SUN2000-3KTL-M1 - 2 MPPT - Compatible Optimis", sku: "HUA/SUN2000-3KTL-M1", brand: "HUAWEI", category: "inverters", price: 558.75, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Huawei - SUN2000-5KTL-M1 - 2 MPPT - Compatible Optimis", sku: "HUA/SUN2000-5KTL-M1", brand: "HUAWEI", category: "inverters", price: 584.62, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Huawei - SUN2000-10KTL-M1 - 2 MPPT - Compatible Optimi", sku: "HUA/SUN2000-10KTL-M1", brand: "HUAWEI", category: "inverters", price: 822.06, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Huawei - SUN2000-6KTL-M1 - 2 MPPT - Compatible Optimis", sku: "HUA/SUN2000-6KTL-M1", brand: "HUAWEI", category: "inverters", price: 618.92, stock: 0, power: "", type: "Hybrid" },
+  { name: "Onduleur hybride triphasé Huawei - SUN2000-8KTL-M1 - 2 MPPT - Compatible Optimis", sku: "HUA/SUN2000-8KTL-M1", brand: "HUAWEI", category: "inverters", price: 734.92, stock: 0, power: "", type: "Hybrid" },
+  { name: "Systeme de montage ESDEC 2X6 Portrait Tuiles Plates (500W)", sku: "ESD/2X6POTP/500", brand: "ESDEC", category: "mounting", price: 482.86, stock: 0, power: "500 W", type: "" },
+  { name: "Systeme de montage ESDEC 2X5 Paysage Tuile mécanique/plate (500W)", sku: "ESD/2X5PATM/500", brand: "ESDEC", category: "mounting", price: 491.38, stock: 0, power: "500 W", type: "" },
+  { name: "Wallbox Chargeur voiture électrique Pulsar Max station 22kW, connecteur Type 2 a", sku: "WB/EV-CHARGER-P22", brand: "", category: "accessories", price: 623.9, stock: 0, power: "22 kW", type: "" },
+  { name: "VaySunic micro-onduleur 2 en 1 VM1000BE-P2 - 1000 VA - Connecteurs MC4 - 2 MPPT ", sku: "VS/VM1000BE-P2", brand: "VaySunic", category: "micro-inverters", price: 90, stock: -4, power: "", type: "Micro" },
+  { name: "VaySunic câble de connexion AC de 2,2m pour micro-onduleurs VM (Ref 900703300000", sku: "VS/FM-CABLE-40-220", brand: "VaySunic", category: "micro-inverters", price: 8.3, stock: 10, power: "", type: "Micro" },
+  { name: "VaySunic connecteur d’interconnexion AC étanche pour câble FM (Ref 900705000007)", sku: "VS/FM-TRKCON-MC4", brand: "VaySunic", category: "accessories", price: 3.9, stock: 10, power: "", type: "" },
+  { name: "VaySunic Capuchon d’étanchéité FM pour couvrir le port de connexion inutilisé su", sku: "VS/FM-SEAL", brand: "VaySunic", category: "accessories", price: 0.6, stock: 2, power: "", type: "" },
+  { name: "VaySunic terminal connecteur Male AC étanche pour câble FM (Ref 900705000008) - ", sku: "VS/FM-TERMCON-M", brand: "VaySunic", category: "accessories", price: 1.5, stock: 2, power: "", type: "" },
+  { name: "Passerelle de communication VaySunic Sub-1G - Mono/Tri  (Ref Sub-1G)", sku: "VS/Sub-1G", brand: "VaySunic", category: "accessories", price: 69, stock: 1, power: "", type: "" },
+  { name: "VaySunic Outil de déconnexion pour connecteurs FM (Ref ) -  Modèle : FM Truck To", sku: "VS/FM-DISC", brand: "VaySunic", category: "accessories", price: 1, stock: 2, power: "", type: "" },
+  { name: "Onduleur Hybride Monophasé 8Kw Deye SUN-8K-SG01LP1-EU - 2 MPTT (2+2) - 370VAC - ", sku: "DEY/SUN-8K-SG01LP1-EU", brand: "DEYE", category: "inverters", price: 1318, stock: 8, power: "8 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Monophasé 5Kw-6Kw Deye SUN-5K-SG03LP1-EU - 2 MPTT - 370VAC - (3", sku: "DEY/SUN-5K-SG03LP1-EU", brand: "DEYE", category: "inverters", price: 828, stock: 7, power: "5 Kw", type: "Hybrid" },
+  { name: "Module de contrôle BMS DEYE HVB750V/100A-EU pour batteries BOS-G, HV - gestion a", sku: "DEY/HVB750V/100A-EU", brand: "DEYE", category: "batteries", price: 590, stock: 3, power: "", type: "" },
+  { name: "Batterie Deye BOS-GM5.1 assemblé avec des cellules LiFePO4 - Unité de base de 5.", sku: "DEY/BOS-GM5.1", brand: "DEYE", category: "batteries", price: 800, stock: 26, power: "5.12 kW", type: "LFP" },
+  { name: "Armoire rack 13 unités pour batteries haute tension Deye BOS-G et BMS - peut con", sku: "DEY/3U-Hrack", brand: "DEYE", category: "batteries", price: 262.6, stock: 1, power: "", type: "" },
+  { name: "Onduleur Hybride Triphasé 50Kw Haute Voltage Deye SUN-50K-SG01HP3-EU-BM4 - 4 MPT", sku: "DEY/SUN-50K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 4275, stock: 0, power: "50 Kw", type: "Hybrid" },
+  { name: "Onduleurs tertiaires triphasé Haute Voltage Deye SUN-50K - 4 MPTT - Puissance ma", sku: "DEY/SUN-50K-G03", brand: "DEYE", category: "inverters", price: 1600, stock: 0, power: "647.5 W", type: "Triphasé" },
+  { name: "Safety switch PROJOY PEFS-EL40H-10 - P2 (MC4) - 5 strings", sku: "PJY/PEFS-EL40H-10 - P2/5", brand: "", category: "accessories", price: 200, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar Speed Unité de base SUD (équerre + rail) Equerre Paysage Su", sku: "AVC/OE00910", brand: "Solar Speed", category: "mounting", price: 17, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Cornière de lestage L.2131/2210MM", sku: "AVC/OE00912", brand: "Solar Speed", category: "accessories", price: 6, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Plaque arrière Longueur du module: 2108MM profile en ", sku: "AVC/OE00911", brand: "Solar Speed", category: "panels", price: 8, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Support central cornière - Support de lestage (Ref : ", sku: "AVC/OG00210", brand: "Solar Speed", category: "mounting", price: 3.5, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Caoutchouc préforé 300 x 60 x 15 MM - (300 x 60 x 15 ", sku: "AVC/OE00913", brand: "Solar Speed", category: "accessories", price: 1.8, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Clame simple extrême / Etrier de terminaison 30mm Noi", sku: "AVC/OG00362", brand: "Solar Speed", category: "accessories", price: 0.6, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Etrier intermediaire Noir", sku: "AVC/OG00963", brand: "Solar Speed", category: "accessories", price: 0.6, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Rivet plastique (Réf : OG00045)", sku: "AVC/OG00045", brand: "Solar Speed", category: "accessories", price: 0.2, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Boulon inox A2 M8x45 DIN912 (100pcs)", sku: "AVC/OG00964", brand: "Solar Speed", category: "accessories", price: 16, stock: 0, power: "", type: "" },
+  { name: "Avasco Solar - Solar-Speed Vis autoforante Avasco 6,5x19mm (500pc) - (Ref : OG00", sku: "AVC/OG00040", brand: "Solar Speed", category: "accessories", price: 80, stock: 3, power: "", type: "" },
+  { name: "ES Elitec Lithium EL-Box2 pour 2 Batteries 5Kw EL-5) - Boxe pour 2 x Unité de ba", sku: "ELI/EL-Box2-10KW", brand: "ES Elitec", category: "batteries", price: 170, stock: 1, power: "5 Kw", type: "LFP" },
+  { name: "\"KBE Câble spécial solaire certifié TUV 6mm². Touret 500 mètres (noir) - SOLAR D", sku: "CAB/KBE/DC-6-500M", brand: "KBE", category: "accessories", price: 373.236, stock: 0, power: "", type: "" },
+  { name: "Onduleur Hybride Triphasé 10Kw Haute Voltage Deye SUN-10K-SG01HP3-EU - 2 MPTT - ", sku: "DEY/SUN-10K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 1503, stock: 0, power: "10 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 12Kw Haute Voltage Deye SUN-12K-SG01HP3-EU - 2 MPTT - ", sku: "DEY/SUN-12K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 1503, stock: 0, power: "12 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 15Kw Haute Voltage Deye SUN-15K-SG01HP3-EU - 2 MPTT - ", sku: "DEY/SUN-15K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 1503, stock: 0, power: "15 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 20Kw Haute Voltage Deye SUN-20K-SG01HP3-EU - 2 MPTT - ", sku: "DEY/SUN-20K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 1851, stock: 0, power: "20 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 25Kw Haute Voltage Deye SUN-25K-SG01HP3-EU - 2 MPTT - ", sku: "DEY/SUN-25K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 2000, stock: 0, power: "25 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 5Kw Haute Voltage Deye SUN-5K-SG01HP3-EU - 2 MPTT - IP", sku: "DEY/SUN-5K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 780, stock: 0, power: "5 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 6Kw Haute Voltage Deye SUN-6K-SG01HP3-EU - 2 MPTT - IP", sku: "DEY/SUN-6K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 900, stock: 0, power: "6 Kw", type: "Hybrid" },
+  { name: "Onduleur Hybride Triphasé 8Kw Haute Voltage Deye SUN-8K-SG01HP3-EU - 2 MPTT - IP", sku: "DEY/SUN-8K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 1100, stock: 0, power: "8 Kw", type: "Hybrid" },
+  { name: "TRAMILY Lot de 10 paires de connecteurs solaires mâle/femelle à double joint pou", sku: "TRA/MC4/M-F", brand: "", category: "accessories", price: 10.825, stock: 0, power: "", type: "" },
+  { name: "Onduleurs tertiaires triphasé Haute Voltage Deye SUN-18K-G04 - 2 MPTT - Puissanc", sku: "DEY/SUN-18K-G04", brand: "DEYE", category: "inverters", price: 580, stock: 0, power: "330 W", type: "Triphasé" },
+  { name: "Onduleurs tertiaires triphasé Haute Voltage Deye SUN-20K-G04 - 2 MPTT - Puissanc", sku: "DEY/SUN-20K-G04", brand: "DEYE", category: "inverters", price: 620, stock: 1, power: "330 W", type: "Triphasé" },
+  { name: "Onduleurs tertiaires triphasé Haute Voltage Deye SUN-25K-G04 - 2 MPTT - Puissanc", sku: "DEY/SUN-25K-G04", brand: "DEYE", category: "inverters", price: 780, stock: 0, power: "330 W", type: "Triphasé" },
+  { name: "Bac fixation pour toit plat ConSole+  avec supports et visserie (composé du Plat", sku: "FS/BAC+", brand: "French Solar Industry", category: "mounting", price: 40, stock: -50, power: "", type: "" },
+  { name: "SunPower 500Wc - P7 DC Performance 7 - Bi-verre - Full Black (1996x1134x30mm) - ", sku: "SP/500M-P7-DC-FB", brand: "SUNPOWER", category: "accessories", price: 96.25, stock: 0, power: "500 Wc", type: "" },
+  { name: "DEYE optimiseur de puissance SUN-XL02-A (Tension de 10 à 80V - Courant entrée ma", sku: "DEY/SUN-XL02-A", brand: "DEYE", category: "inverters", price: 33, stock: 37, power: "", type: "" },
+  { name: "SolarEdge - EV Charger avec Shutter FR - 32A (22kW) - Garantie 3 ans - Prise T2S", sku: "SE/EVK22FRM-01", brand: "", category: "mounting", price: 1897, stock: 0, power: "22 kW", type: "" },
+  { name: "Enphase borne IQ EV Charger 2 – 1,4 à 7,4 kW MONO & 11 à 22 kW TRI – T2S – Lecte", sku: "EN/Q-EVSE-EU-3032-0005-1300", brand: "", category: "micro-inverters", price: 700, stock: 0, power: "7.4 kW", type: "" },
+  { name: "Coffret de protection AC triphasé  pour 1 Ond 125 kVA Tri+ PR + Poly", sku: "CO/AC-125TRI-1E", brand: "MADEnR", category: "accessories", price: 1000, stock: -1, power: "", type: "Triphasé" },
+  { name: "Coffret Electrique Etanche Exterieur IP65 5 Modules, Avec 4 Bornes, 2 Connecteur", sku: "xxx/000/03", brand: "Qiyiche", category: "panels", price: 15.99, stock: 16, power: "", type: "" },
+  { name: "Heschen Disjoncteur miniature CC HSB6C-DC, 2 pôles, DC500 V 125 A, disjoncteur p", sku: "xxx/000/01", brand: "Heschen", category: "panels", price: 16.99, stock: 26, power: "", type: "" },
+  { name: "AVCXEC Connecteur PV Solaire 1000 V avec diode Anti-Retour Intégrée, 2 Pièces Co", sku: "xxx/000/02", brand: "AVCXEC", category: "panels", price: 13.99, stock: 5, power: "", type: "" },
+  { name: "Connecteur Diode Solaire,2 Pièces Connecteur PV Solaire 1000V avec diode Anti-Re", sku: "xxx/000/04", brand: "FTJKGH", category: "panels", price: 13.99, stock: 16, power: "", type: "" },
+  { name: "Barre Omnibus M8 300A, Plaques en Laiton, Bornes en Acier Inoxydable, Bloc de Di", sku: "xxx/000/05", brand: "Spacnana", category: "accessories", price: 64.41, stock: 1, power: "", type: "" },
+  { name: "Heschen Contacteur ca domestique, HS1-25, 2 pôles 1NO 1NC, AC 220V/240V tension ", sku: "xxx/000/06", brand: "Heschen", category: "mounting", price: 6.65, stock: 11, power: "", type: "" },
+  { name: "Grillage métallique en acier inoxydable - Maille fine - Rouleau de filtre - Feui", sku: "xxx/000/07", brand: "ALEEIK", category: "accessories", price: 9.9, stock: 5, power: "", type: "" },
+  { name: "Etiquette Adhésive \"Coupure Batterie\" installation avec Batteries\"", sku: "xxx/000/08", brand: "ETIPV", category: "batteries", price: 0.86, stock: 93, power: "", type: "" },
+  { name: "Set Câble batterie Deye 1.5m (+/-) 3U-LPCable1.5", sku: "xxx/000/09", brand: "DEYE", category: "batteries", price: 0, stock: 9, power: "", type: "" },
+  { name: "Paire de câbles d'alimentation de batterie 150 mm 4AWG  et un câble de communica", sku: "xxx/000/10", brand: "DEYE", category: "batteries", price: 0, stock: 10, power: "", type: "" },
+  { name: "Onduleur central Triphasé 6Kw bas voltage Deye SUN-6K-G06P3-EU-AM2 - 2/1+1 MPTT ", sku: "DEY/SUN-6K-G06P3-EU-AM2", brand: "DEYE", category: "inverters", price: 400, stock: 0, power: "6 Kw", type: "Triphasé" },
+  { name: "Onduleur Hybride Triphasé 30Kw Haute Voltage Deye SUN-30K-SG01HP3-EU-B - 3 MPTT ", sku: "DEY/SUN-30K-SG01HP3-EU-BM3", brand: "DEYE", category: "inverters", price: 2098.1, stock: 1, power: "30 Kw", type: "Hybrid" },
+  { name: "AC COMBINER BOX ZBENY Model : BBWX-1(6KW)", sku: "BN/BBWX-1(6KW)", brand: "BENNY", category: "accessories", price: 0, stock: 0, power: "6 KW", type: "" },
+  { name: "AC COMBINER BOX ZBENY Model : BBWX-1(3KW)", sku: "BN/BBWX-1(3KW)", brand: "BENNY", category: "accessories", price: 0, stock: 0, power: "3 KW", type: "" },
+  { name: "AC COMBINER BOX ZBENY Model : BBWX-1(12KW)", sku: "BN/BBWX-1(12KW)", brand: "BENNY", category: "accessories", price: 0, stock: 0, power: "12 KW", type: "" },
+  { name: "Systeme de montage ESDEC 3X6 Portrait Tuile Canale", sku: "ESD/3X6POTC/500", brand: "ESDEC", category: "mounting", price: 611.4, stock: 0, power: "", type: "" },
+  { name: "Coffret AC/DC mono 30mA type B 6 kW 2 MPPT 1 String Ref: 910320", sku: "CO/ACDC-6K-B-30MA-2MP", brand: "", category: "accessories", price: 418, stock: 0, power: "6 kW", type: "" },
+  { name: "Coffret AC/DC mono 30mA type B 9-12 kW 1 MPPT 2 Strings - Ref: 910315", sku: "CO/ACDC-12K-B-30MA", brand: "", category: "accessories", price: 360, stock: 5, power: "12 kW", type: "" },
+  { name: "Coffret AC/DC mono 30mA type B 9-12 kW 2 MPPT 1 String - Ref: 910316", sku: "CO/ACDC-12K-B-30MA-2MP", brand: "", category: "accessories", price: 445, stock: 0, power: "12 kW", type: "" },
+  { name: "Coffret AC/DC mono 300mA type B 6 kW 2 MPPT 1 String - Ref: 910321", sku: "CO/ACDC-6K-B-300MA-2MP", brand: "", category: "accessories", price: 434, stock: 0, power: "6 kW", type: "" },
+  { name: "Coffret AC/DC mono 300mA type B 9-12 kW 1 MPPT 2 Strings - Ref: 910317", sku: "CO/ACDC-12K-B-300MA", brand: "", category: "accessories", price: 402, stock: 9, power: "12 kW", type: "" },
+  { name: "Coffret AC/DC mono 300mA type B 9-12 kW 2 MPPT 1 String - Ref: 910318", sku: "CO/ACDC-12K-B-300MA-2MP", brand: "", category: "accessories", price: 469, stock: 3, power: "12 kW", type: "" },
+  { name: "Coffret AC/DC mixte type B 300mA 12Kw 1 MPPT 2 Strings - Ref: 910311", sku: "CO/ACDC-12KTRI-B-300MA", brand: "", category: "accessories", price: 410, stock: 6, power: "12 Kw", type: "" },
+  { name: "Coffret AC/DC tétrapolaire 300mA type B 12 kW 1 MPPT 2 Strings - Ref: 910314", sku: "CO/ACDC-12KTRI-B-300MA-2MP", brand: "", category: "accessories", price: 510, stock: 10, power: "12 kW", type: "" },
+  { name: "Coffret AC tétrapolaire 300mA 12 kw type B (Pour un onduleur) - Ref: 910310", sku: "CO/AC-12KTRI-B-300MA", brand: "", category: "inverters", price: 279, stock: 0, power: "12 kw", type: "" },
+  { name: "Coffret AC tétrapolaire 300mA 18 kw type B (Pour un onduleur) - Ref: 910310", sku: "CO/AC-18KTRI-B-300MA", brand: "", category: "inverters", price: 295, stock: 0, power: "18 kw", type: "" },
+  { name: "Coffret AC tétrapolaire 300mA 36 kw type B (Pour un onduleur) - Ref: 910202", sku: "CO/AC-36KTRI-B-300MA", brand: "", category: "inverters", price: 310, stock: 0, power: "36 kw", type: "" },
+  { name: "Coffret AC mono 300mA 6 kw type B (Pour un onduleur) - Ref: 910308", sku: "CO/AC-6K-B-300MA", brand: "", category: "inverters", price: 202, stock: 0, power: "6 kw", type: "" },
+  { name: "Coffret AC mono 300mA  9 kw type B. (Pour un onduleur) - Ref: 910309", sku: "CO/AC-9K-B-300MA", brand: "", category: "inverters", price: 206, stock: 0, power: "9 kw", type: "" },
+  { name: "Coffret AC mono 300mA 12kW Type B (Pour un onduleur) - Ref: 910313", sku: "CO/AC-12K-B-300MA", brand: "", category: "inverters", price: 279, stock: 0, power: "12 kW", type: "" },
+  { name: "Systeme de montage ESDEC 3X6 Portrait BAC ACIER", sku: "ESD/3X6POBA/500", brand: "ESDEC", category: "mounting", price: 611.4, stock: 0, power: "", type: "" },
+  { name: "OMERIN Câble spécial solaire certifié TUV 6mm². Par mètre (noir)", sku: "CAB/OM/DC-6-1M", brand: "SOLARPLAST", category: "accessories", price: 1.49, stock: 0, power: "", type: "" },
+  { name: "SolarEdge Electricity Meter boitier de mesure de production & consommation 1Ph/3", sku: "SE/MTR-3Y-400V-A", brand: "SolarEdge", category: "accessories", price: 145, stock: 0, power: "", type: "Triphasé" },
+  { name: "SolarEdge Transformateur de courant 250A, pour 50Hz (SECT-SPL-250A-A)", sku: "SE/CT-SPL-250A-A", brand: "SolarEdge", category: "accessories", price: 30, stock: 0, power: "", type: "" },
+  { name: "SolarEdge - Onduleur triphasé SE 90K - DC Switch & MC4 - Garantie 12 ans (nécess", sku: "SE/ONDSE90K-DC", brand: "SolarEdge", category: "inverters", price: 1399, stock: 0, power: "", type: "Triphasé" },
+  { name: "SolarEdge - Unité secondaire avec technologie Synergy Nouvelle Version -  Garant", sku: "SE/ONDSE-SU-K", brand: "SolarEdge", category: "accessories", price: 1379.5, stock: 0, power: "", type: "" },
+  { name: "Batterie UZ-L051100-A1 Pro assemblé avec des cellules LiFePO4 - Unité de base de", sku: "UZ/L051100-A1-Pro", brand: "UZ ENERGY", category: "batteries", price: 600, stock: 0, power: "5.12 kW", type: "LFP" },
+  { name: "Boîtier de batterie ; Modèle : C300, Câble de sortie CA03/CA11, Courant max. 100", sku: "UZ/C300-CASE", brand: "UZ ENERGY", category: "batteries", price: 21.4, stock: 45, power: "5 kW", type: "" },
+  { name: "Modèle : CA03 / M8 - Câble de sortie pour Batterie UZ-L051100-A1 Pro", sku: "UZ/CA03", brand: "UZ ENERGY", category: "batteries", price: 35, stock: 48, power: "", type: "" },
+  { name: "Modèle : CA02 - Câble parallèle Batterie/Batterie UZ-L051100-A1 Pro - (Accessoir", sku: "UZ/CA02", brand: "UZ ENERGY", category: "batteries", price: 25, stock: 0, power: "", type: "" },
+  { name: "Modle: CA05  - Câble parallèle Batterie/Batterie UZ-L051100-A1 Pro - (Applicable", sku: "UZ/CA05", brand: "UZ ENERGY", category: "batteries", price: 29, stock: 0, power: "", type: "" },
+  { name: "Modèle : T100A/T300A - Clé Wi-Fi, surveillance à distance de la batterie et conn", sku: "UZ/T100A-WiF", brand: "UZ ENERGY", category: "batteries", price: 13, stock: 48, power: "", type: "" },
+  { name: "Module cellules PERC 11BB Demi Cellules JA Solar JAM54S30 410/MR 395-420 1500V B", sku: "JA/JAM54S30-410-MC4", brand: "JA Solar", category: "panels", price: 36.49, stock: 0, power: "", type: "" },
+  { name: "Coffret AC/DC mono 300mA type B 6 kW 2 MPPT 1 String - Ref: BHS-2/2", sku: "CO/ACDC-6K-B-300MA-BHS-2/2", brand: "", category: "accessories", price: 269.56, stock: 8, power: "6 kW", type: "" },
+  { name: "Coffret AC/DC tétrapolaire 300mA type B 12 kW 3 MPPT 2 Strings avec Inveseur - R", sku: "CO/ACDC-12KTRI-B-300MA-BHS-3/3", brand: "", category: "accessories", price: 380.5, stock: 9, power: "12 kW", type: "" },
+  { name: "fusible PV 1000V DC 30A", sku: "FUS-PV-30A", brand: "Jadeshay", category: "accessories", price: 8.91, stock: 16, power: "", type: "" },
+  { name: "DEYE Three phase meter 250A EASTRON SDM 630 MCT, SPLIT CORE CT ESCT-T24 3 pcs 25", sku: "DEY/EN-SDM-630 MCT-ETL", brand: "", category: "accessories", price: 93.3, stock: 19, power: "", type: "" },
+  { name: "Onduleur Hybride Monophasé 16K-SG01LP1-EU", sku: "DEY/SUN-16K-SG01LP1-EU", brand: "DEYE", category: "inverters", price: 1970, stock: 0, power: "", type: "Hybrid" },
+  { name: "Cable RJ45 UZ/DEYE", sku: "DEY/RJ45-UZ", brand: "", category: "accessories", price: 8, stock: 20, power: "", type: "" },
+  { name: "Batterie UZ-L051100-A1 Power Lite Plus assemblé avec des cellules  CALB LiFePO4 ", sku: "UZ/L051100-A1", brand: "UZ ENERGY", category: "batteries", price: 540, stock: 45, power: "5.12 kW", type: "LFP" },
+  { name: "Modèle : CA04 / M10  - Câble parallèle Batterie UZ-L051100-A1 / Onduleur - inclu", sku: "UZ/CA04", brand: "UZ ENERGY", category: "inverters", price: 32, stock: 20, power: "", type: "" },
+  { name: "Modèle : CA04-A / M6  - Câble parallèle Batterie UZ-L051100-A1 / Onduleur - incl", sku: "UZ/CA04-A", brand: "UZ ENERGY", category: "inverters", price: 28, stock: 20, power: "", type: "" },
+  { name: "Modèle : PSRP6XB25 Positive terminal connector", sku: "UZ/TERMINAL+", brand: "UZ ENERGY", category: "accessories", price: 2.5, stock: 48, power: "", type: "" },
+  { name: "Modèle : PSRP6XA25 Negative terminal connector", sku: "UZ/TERMINAL-", brand: "UZ ENERGY", category: "accessories", price: 2.5, stock: 48, power: "", type: "" },
+  { name: "Systeme de montage ESDEC 16X5 Paysage Bac Acier (82 PV)", sku: "ESD/16X5PATC", brand: "ESDEC", category: "mounting", price: 4803.02, stock: 0, power: "", type: "" },
+  { name: "Onduleur Hybride Triphasé 40Kw Haute Voltage Deye SUN-40K-SG01HP3-EU-B - 4 MPTT ", sku: "DEY/SUN-40K-SG01HP3-EU-BM4", brand: "DEYE", category: "inverters", price: 4018, stock: 0, power: "40 Kw", type: "Hybrid" },
+  { name: "Module cellules PERC 16BB Demi Cellules Bifacial JA Solar JAM54D40 415-440/GB/15", sku: "JA/JAM54D40-GB-420-MC4", brand: "JA Solar", category: "panels", price: 43.75, stock: 85, power: "", type: "" },
+  { name: "Disjoncteur photovoltaïque CC HSB6C-DC 2 pôles DC500 V 125 A", sku: "DC/HSB6C-DC/V125A", brand: "ANCLLO", category: "accessories", price: 14.99, stock: 6, power: "", type: "" },
+  { name: "SUN-SMART-CT01", sku: "DEY/SUN-SMART-CT01", brand: "DEYE", category: "inverters", price: 50, stock: 100, power: "", type: "" },
+  { name: "SUN-SMART-TX01", sku: "DEY/SUN-SMART-TX01", brand: "DEYE", category: "inverters", price: 25, stock: 30, power: "", type: "" },
+  { name: "Hoymiles micro-onduleur 4 en 1 HMS-2000 - 2000 VA - Connecteurs MC4 - 4 MPPT", sku: "HM/HMS-2000-4T", brand: "HOYMILES", category: "micro-inverters", price: 165, stock: 0, power: "", type: "Micro" },
+  { name: "Onduleur Hybride Triphasé 20Kw bas voltage Deye SUN-20K-SG05LP3-EU -  (456W×750H", sku: "DEY/SUN-20K-SG05LP3-EU-SM2", brand: "DEYE", category: "inverters", price: 2100, stock: 0, power: "20 Kw", type: "Hybrid" },
+  { name: "SUN2000-5K-MAP0", sku: "HUA/SUN2000-5K-MAP0", brand: "HUAWEI", category: "inverters", price: 599.62, stock: 10, power: "", type: "" },
+  { name: "SUN2000-6K-MAP0", sku: "HUA/SUN2000-6K-MAP0", brand: "HUAWEI", category: "inverters", price: 609.04, stock: 10, power: "", type: "" },
+  { name: "SUN2000-8K-MAP0", sku: "HUA/SUN2000-8K-MAP0", brand: "HUAWEI", category: "inverters", price: 722.97, stock: 10, power: "", type: "" },
+  { name: "SUN2000-10K-MAP0", sku: "HUA/SUN2000-10K-MAP0", brand: "HUAWEI", category: "inverters", price: 808.63, stock: 10, power: "", type: "" },
+  { name: "SUN2000-12K-MAP0", sku: "HUA/SUN2000-12K-MAP0", brand: "HUAWEI", category: "inverters", price: 904.57, stock: 7, power: "", type: "" },
+  { name: "SUN2000-12K-MB0", sku: "HUA/SUN2000-12K-MB0", brand: "HUAWEI", category: "inverters", price: 1128.14, stock: 10, power: "", type: "" },
+  { name: "SUN2000-15K-MB0", sku: "HUA/SUN2000-15K-MB0", brand: "HUAWEI", category: "inverters", price: 1275.48, stock: 10, power: "", type: "" },
+  { name: "SUN2000-17K-MB0", sku: "HUA/SUN2000-17K-MB0", brand: "HUAWEI", category: "inverters", price: 1299.46, stock: 10, power: "", type: "" },
+  { name: "SUN2000-20K-MB0", sku: "HUA/SUN2000-20K-MB0", brand: "HUAWEI", category: "inverters", price: 1370.56, stock: 9, power: "", type: "" },
+  { name: "SUN2000-25K-MB0", sku: "HUA/SUN2000-25K-MB0", brand: "HUAWEI", category: "inverters", price: 1418.53, stock: 10, power: "", type: "" },
+  { name: "Smart dongle SdongleB-06-EU", sku: "HUA/Smart dongle SdongleB-06-EU", brand: "HUAWEI", category: "optimizers", price: 89.35, stock: 10, power: "", type: "" },
+  { name: "SCharger-7KS-S0", sku: "HUA/SCharger-7KS-S0", brand: "HUAWEI", category: "accessories", price: 285.25, stock: 10, power: "", type: "" },
+  { name: "SCharger-22KT-S0", sku: "HUA/SCharger-22KT-S0", brand: "HUAWEI", category: "accessories", price: 303.24, stock: 10, power: "", type: "" },
+  { name: "SmartPS-80AI-T0", sku: "HUASmartPS-80AI-T0", brand: "HUAWEI", category: "accessories", price: 56.54, stock: 10, power: "", type: "" },
+  { name: "SmartGuard-63A-S0", sku: "HUA/SmartGuard-63A-S0", brand: "HUAWEI", category: "accessories", price: 392.32, stock: 5, power: "", type: "" },
+  { name: "SmartGuard-63A-T0", sku: "HUA/SmartGuard-63A-T0", brand: "HUAWEI", category: "accessories", price: 530.24, stock: 5, power: "", type: "" },
+  { name: "SmartPS-100A-S0", sku: "HUA/SmartPS-100A-S0", brand: "HUAWEI", category: "accessories", price: 35.12, stock: 10, power: "", type: "" },
+  { name: "SmartPS-250A-T0 Three-phase intelligent sensor", sku: "HUA/SmartPS-250A-T0 Three-phase intelligent sensor", brand: "HUAWEI", category: "accessories", price: 53.11, stock: 10, power: "", type: "" },
+  { name: "DTSU666-H 100A(Three Phase)", sku: "HUA/DTSU666-H 100A(Three Phase)", brand: "HUAWEI", category: "accessories", price: 35.12, stock: 10, power: "", type: "" },
+];
+
+// ── Keyword-based Product Image Matching ─────────────────────────────
+// Priority: most specific keywords first, fallback at the end.
+// Every image path below points to a REAL photo in public/products/.
+
+const KEYWORD_IMAGE_RULES = [
+  // ══════════════════════════════════════════════════════════════════
+  // PRIORITY 1: Specific product models (most precise, checked first)
+  // ══════════════════════════════════════════════════════════════════
+
+  // --- EMMA / ENERGY MANAGEMENT ---
+  { keywords: ["emma", "energy management", "gestionnaire"], image: "/products/huawei/huawei-emma.webp" },
+
+  // --- SPECIFIC MICRO-INVERTER MODELS ---
+  { keywords: ["hms-800"], image: "/products/hoymiles/hms-800.jpg" },
+  { keywords: ["hms-1600"], image: "/products/hoymiles/hms-1600.jpg" },
+  { keywords: ["hmt-2000", "hmt-2250"], image: "/products/hoymiles/hmt-2250.jpg" },
+  { keywords: ["iq8+", "iq8-plus", "iq8plus"], image: "/products/enphase/iq8plus.jpg" },
+  { keywords: ["iq8hc", "iq8-hc", "iq8 hc"], image: "/products/enphase/iq8hc.jpg" },
+  { keywords: ["iq8mc", "iq8-mc"], image: "/products/enphase/enphase-iq8.webp" },
+
+  // --- SPECIFIC HUAWEI INVERTER MODELS ---
+  { keywords: ["100ktl-m2", "100ktl"], image: "/products/huawei/huawei-100ktl.webp" },
+  { keywords: ["ktl-l1"], image: "/products/huawei/huawei-sun2000-ktl-l1.webp" },
+  { keywords: ["ktl-m1"], image: "/products/huawei/huawei-sun2000-ktl-m1.webp" },
+  { keywords: ["ktl-m3", "30ktl", "50ktl"], image: "/products/huawei/huawei-sun2000-ktl-m3.webp" },
+  { keywords: ["ktl-m5", "15ktl-m5", "20ktl-m5"], image: "/products/huawei/huawei-sun2000-ktl-m5.webp" },
+  { keywords: ["map0", "3k-map", "4k-map", "5k-map", "6k-map", "8k-map", "10k-map"], image: "/products/huawei/huawei-sun2000-map0.webp" },
+  { keywords: ["lc0", "8k-lc", "10k-lc"], image: "/products/huawei/huawei-sun2000-lc0.webp" },
+  { keywords: ["mb0", "10k-mb", "12k-mb", "15k-mb", "17k-mb", "20k-mb", "25k-mb"], image: "/products/huawei/huawei-sun2000-mb0.webp" },
+
+  // --- SPECIFIC DEYE INVERTER MODELS ---
+  { keywords: ["sg03lp1"], brand_hint: "DEYE", image: "/products/deye/deye-mono-sg03lp1.webp" },
+  { keywords: ["sg04lp1"], brand_hint: "DEYE", image: "/products/deye/deye-mono-sg04lp1.webp" },
+  { keywords: ["sg01lp1"], brand_hint: "DEYE", image: "/products/deye/deye-mono-sg01lp1.webp" },
+  { keywords: ["sg04lp3"], brand_hint: "DEYE", image: "/products/deye/deye-tri-sg04lp3.webp" },
+  { keywords: ["sg05lp3", "12k-sg04lp3", "15k-sg04lp3"], brand_hint: "DEYE", image: "/products/deye/deye-tri-sg05lp3.webp" },
+  { keywords: ["hp3"], brand_hint: "DEYE", image: "/products/deye/deye-tri-hp3.webp" },
+
+  // --- SPECIFIC BATTERY MODELS ---
+  { keywords: ["luna2000-5-e0", "luna2000-5kw", "luna2000-5-s0"], image: "/products/huawei/huawei-luna2000-module.webp" },
+  { keywords: ["dc-luna", "luna2000-c0"], image: "/products/huawei/huawei-luna2000-dc.webp" },
+  { keywords: ["luna2000", "luna"], image: "/products/huawei/huawei-luna2000-module.webp" },
+  { keywords: ["back-up box", "backup box", "back up", "bat-back"], image: "/products/huawei/huawei-backup-box.webp" },
+  { keywords: ["bos-gm", "bos gm"], brand_hint: "DEYE", image: "/products/deye/deye-battery-bos.webp" },
+  { keywords: ["se-g5", "se g5"], brand_hint: "DEYE", image: "/products/deye/deye-battery-se-g5.webp" },
+  { keywords: ["v5 alpha", "v5α"], brand_hint: "PYTES", image: "/products/pytes/pytes-v5.webp" },
+  { keywords: ["e-box", "ebox"], brand_hint: "PYTES", image: "/products/pytes/pytes-ebox.webp" },
+
+  // --- SPECIFIC OPTIMIZER MODELS ---
+  { keywords: ["p450"], image: "/products/huawei/huawei-optimizer-p450.webp" },
+  { keywords: ["p600"], image: "/products/huawei/huawei-optimizer-p600.webp" },
+  { keywords: ["p1300"], image: "/products/huawei/huawei-optimizer-p1300.webp" },
+
+  // ══════════════════════════════════════════════════════════════════
+  // PRIORITY 2: Product TYPE keywords (generic but still meaningful)
+  // ══════════════════════════════════════════════════════════════════
+
+  // --- MICRO-ONDULEURS (exclude cables/accessories that mention micro-onduleur) ---
+  { keywords: ["micro-onduleur", "micro onduleur", "microinverter"], exclude: ["câble", "cable", "capuchon", "connecteur", "outil", "tool", "terminal"], image: "/products/hoymiles/hms-800.jpg" },
+  { keywords: ["apsystems", "ap systems", "ds3"], exclude: ["câble", "cable"], image: "/products/ap-systems/apsystems-micro.webp" },
+
+  // --- ONDULEURS (exclude cables/accessories) ---
+  { keywords: ["onduleur hybride", "hybrid inverter", "hybride"], exclude: ["câble", "cable"], brand_hint: "HUAWEI", image: "/products/sun2000-m5-hybrid.png" },
+  { keywords: ["onduleur hybride", "hybrid inverter", "hybride"], exclude: ["câble", "cable"], brand_hint: "DEYE", image: "/products/deye/deye-mono-sg04lp1.webp" },
+  { keywords: ["onduleur hybride", "hybrid inverter", "hybride"], exclude: ["câble", "cable"], image: "/products/sun2000-m5-hybrid.png" },
+  { keywords: ["triphasé", "3ph", "three phase"], exclude: ["câble", "cable", "relay", "relais", "pince", "connecteur"], image: "/products/huawei/huawei-sun2000-ktl-m3.webp" },
+  { keywords: ["onduleur", "inverter", "sun2000", "sun-"], exclude: ["câble", "cable", "micro"], image: "/products/huawei/huawei-sun2000-map0.webp" },
+
+  // --- BATTERIES ---
+  { keywords: ["batterie", "battery", "stockage", "lfp", "lifepo", "pytes", "pylontech"], image: "/products/pytes/pytes-v5.webp" },
+  { keywords: ["bms"], image: "/products/deye/deye-bms.webp" },
+
+  // --- BORNES DE RECHARGE ---
+  { keywords: ["ac charger", "borne", "wallbox", "ev charger", "scharger"], image: "/products/huawei/huawei-scharger.webp" },
+
+  // --- OPTIMISEURS ---
+  { keywords: ["optimiseur", "optimizer"], image: "/products/huawei/huawei-optimizer-p1300.webp" },
+
+  // --- PANNEAUX SOLAIRES ---
+  { keywords: ["panneau", "module", "monocristallin", "polycristallin", "bifacial"], exclude: ["câble", "cable", "vis"], image: "/products/recom/panther-375.jpg" },
+
+  // --- RELAYS & PROTECTION ---
+  { keywords: ["qrelay", "relay", "relais", "q-relay"], image: "/products/enphase/iq-relay-1p.jpg" },
+  { keywords: ["smartguard", "guard"], image: "/products/huawei/huawei-smartguard.webp" },
+
+  // --- MESURE & MONITORING ---
+  { keywords: ["pince", "ct-", "ampèremétrique"], image: "/products/smart-power-sensor.png" },
+  { keywords: ["envoy", "monitoring"], image: "/products/enphase/envoy-s.jpg" },
+
+  // --- PASSERELLES & COMMUNICATION ---
+  { keywords: ["dtu", "passerelle", "gateway"], image: "/products/hoymiles/dtu-pros.jpg" },
+  { keywords: ["smartlogger", "logger"], image: "/products/huawei/huawei-smartlogger.webp" },
+  { keywords: ["dongle", "wifi", "wlan", "sdongle"], image: "/products/huawei/huawei-smart-dongle.webp" },
+  { keywords: ["ecu", "ecu-r"], image: "/products/hoymiles/dtu-pros.jpg" },
+  { keywords: ["smart power sensor", "smartps", "compteur", "ddsu", "dtsu", "smart meter", "sensor"], image: "/products/huawei/huawei-smart-sensor.webp" },
+
+  // --- STRUCTURES DE MONTAGE ---
+  { keywords: ["clickfit", "esdec"], image: "/products/esdec/esdec-clickfit-rail.webp" },
+  { keywords: ["flatfix"], image: "/products/esdec/esdec-flatfix.webp" },
+  { keywords: ["k2", "crossrail", "singlerail"], image: "/products/k2-systems/k2-systems.webp" },
+  { keywords: ["rail", "clamp", "hook", "crochet", "fixation", "montage", "support", "toiture"], image: "/products/esdec/esdec-clickfit-rail.webp" },
+
+  // ══════════════════════════════════════════════════════════════════
+  // PRIORITY 3: Generic accessories (LAST — catches remaining items)
+  // ══════════════════════════════════════════════════════════════════
+  { keywords: ["câble", "cable", "cordon"], image: "/products/pytes/pytes-cables.webp" },
+  { keywords: ["connecteur", "connector", "mc4", "interconnexion"], image: "/products/pytes/pytes-cables.webp" },
+  { keywords: ["capuchon", "étanchéité", "seal"], image: "/products/pytes/pytes-cables.webp" },
+  { keywords: ["terminal", "terminaison"], image: "/products/pytes/pytes-cables.webp" },
+  { keywords: ["outil", "tool", "déconnexion", "disconnect"], image: "/products/pytes/pytes-cables.webp" },
+  { keywords: ["vis", "ecrou", "boulon", "bracket"], image: "/products/esdec/esdec-clickfit-rail.webp" },
+  { keywords: ["rack", "console"], image: "/products/deye/deye-rack.webp" },
+  { keywords: ["busbar", "bus bar"], image: "/products/pytes/pytes-cables.webp" },
+];
+
+export function getProductImage(product) {
+  const nameLower = (product.name || "").toLowerCase();
+  const skuLower = (product.sku || "").toLowerCase();
+  const brandUpper = (product.brand || "").toUpperCase();
+  const search = nameLower + " " + skuLower;
+
+  for (const rule of KEYWORD_IMAGE_RULES) {
+    const nameMatch = rule.keywords.some(kw => search.includes(kw.toLowerCase()));
+    if (!nameMatch) continue;
+    if (rule.brand_hint && brandUpper !== rule.brand_hint.toUpperCase()) continue;
+    // If rule has exclusions, skip if any exclusion keyword is found
+    if (rule.exclude && rule.exclude.some(ex => search.includes(ex.toLowerCase()))) continue;
+    return rule.image;
+  }
+
+  // Category fallback (should rarely happen)
+  const CAT_FALLBACK = {
+    "inverters": "/products/huawei/huawei-sun2000-map0.webp",
+    "batteries": "/products/pytes/pytes-v5.webp",
+    "micro-inverters": "/products/hoymiles/hms-800.jpg",
+    "panels": "/products/recom/panther-375.jpg",
+    "mounting": "/products/esdec/esdec-clickfit-rail.webp",
+    "optimizers": "/products/huawei/huawei-optimizer-p1300.webp",
+    "accessories": "/products/huawei/huawei-smart-dongle.webp",
+  };
+  if (product.category && CAT_FALLBACK[product.category]) {
+    return CAT_FALLBACK[product.category];
+  }
+  return "/products/huawei/huawei-sun2000-map0.webp";
+}
+
+export default CATALOG;
diff --git a/src/pages/HomePage.jsx b/src/pages/HomePage.jsx
index 0159ac4..e151f0c 100644
--- a/src/pages/HomePage.jsx
+++ b/src/pages/HomePage.jsx
@@ -3,27 +3,27 @@ import { Link } from "react-router-dom";
 import { useTranslation } from "react-i18next";
 import { useCurrency } from "../CurrencyContext";
 import REAL_PRODUCTS from "../products";
+import CATALOG, { getProductImage } from "../data/catalog";
 import BrandLogo from "../components/ui/BrandLogo";
 import AutoSlides from "../components/ui/AutoSlides";
 import CatCard from "../components/ui/CatCard";
 import useResponsive from "../hooks/useResponsive";
 
-// Featured products for homepage (pick best sellers)
-const PRODUCTS = [
-  REAL_PRODUCTS.find(p => p.id === "hw-sun2000-10k-lc0"),
-  REAL_PRODUCTS.find(p => p.id === "hw-luna2000-5-e0"),
-  REAL_PRODUCTS.find(p => p.id === "hw-sun2000-6k-map0"),
-  REAL_PRODUCTS.find(p => p.id === "hw-sun2000-12k-mb0"),
-  REAL_PRODUCTS.find(p => p.id === "hw-merc-1300-p"),
-].map(p => ({
-  id: p.id,
-  name: p.name,
-  power: p.power || p.capacity || "",
-  type: p.type,
-  stock: p.stock,
-  price: p.price,
-  img: p.image || "",
-}));
+// Featured products: top 10 from CSV catalog (priority brands, in stock, sorted by stock desc)
+const PRIORITY_BRANDS = /HUAWEI|DEYE|HOYMILES|Enphase|PYTES/i;
+const FEATURED_PRODUCTS = CATALOG
+  .filter(p => PRIORITY_BRANDS.test(p.brand) && p.stock > 0 && p.price > 10)
+  .sort((a, b) => b.stock - a.stock)
+  .slice(0, 10)
+  .map((p, i) => ({
+    id: `csv-${p.sku || i}`,
+    name: p.name,
+    power: p.power,
+    type: p.type || p.category,
+    stock: p.stock,
+    price: p.price,
+    img: getProductImage(p),
+  }));
 
 const BRANDS = [
   { n:"Huawei", c:"#e4002b", f:"huawei" },{ n:"Jinko Solar", c:"#1a8c37", f:"jinko" },
@@ -203,7 +203,7 @@ export default function HomePage({ isVerified, isLoggedIn, onShowRegister, navig
       <section style={{padding:"16px 0",borderBottom:"1px solid #e4e5ec",overflow:"hidden",position:"relative"}}>
         <div style={{position:"absolute",left:0,top:0,bottom:0,width:isMobile?40:100,background:"linear-gradient(to right,#fff,transparent)",zIndex:2}}/>
         <div style={{position:"absolute",right:0,top:0,bottom:0,width:isMobile?40:100,background:"linear-gradient(to left,#fff,transparent)",zIndex:2}}/>
-        <div className="marquee" style={{display:"flex",alignItems:"center",gap:isMobile?24:48,width:"max-content"}}>
+        <div className="marquee" style={{display:"flex",alignItems:"center",gap:isMobile?24:32,alignItems:"center",width:"max-content"}}>
           {[...BRANDS,...BRANDS].map((b,i)=>(
             <BrandLogo key={i} brand={b}/>
           ))}
@@ -213,15 +213,15 @@ export default function HomePage({ isVerified, isLoggedIn, onShowRegister, navig
       {/* PRODUCTS */}
       <section style={{padding:isMobile?"32px 16px":"48px 40px"}}>
         <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:isMobile?16:24}}>
-          <div><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:isMobile?20:26,fontWeight:700}}>{t("home.products.title")}</h2></div>
+          <div><div style={{width:32,height:3,background:"#4CAF50",borderRadius:2,marginBottom:12}}/><h2 style={{fontSize:isMobile?20:26,fontWeight:700}}>{t("home.products.title")}</h2><p style={{fontSize:13,color:"#7b7b7b",marginTop:4}}>{CATALOG.length} {t("home.products.available", "produits disponibles")}</p></div>
           <Link to="/catalog" style={{fontSize:13,color:"#7b7b7b",textDecoration:"underline"}}>{t("home.products.viewAll")}</Link>
         </div>
         <div style={{display:"grid",gridTemplateColumns:productGridCols,gap:isMobile?10:16}}>
-          {PRODUCTS.map(p=>(
+          {FEATURED_PRODUCTS.map(p=>(
             <div key={p.id} className="hl" onClick={()=>navigate(`/product/${p.id}`)} style={{borderRadius:10,border:"1px solid #e4e5ec",background:"#fff",overflow:"hidden",cursor:"pointer",display:"flex",flexDirection:"column"}}>
               <div style={{padding:"8px 12px 0"}}><span style={{fontSize:11,color:"#4CAF50",fontWeight:500}}>{"● "+p.stock.toLocaleString()+" "+t("common.pcs")}</span></div>
-              <div style={{height:isMobile?110:150,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",padding:isMobile?8:16}}>
-                <img src={p.img} alt={p.name} style={{maxHeight:isMobile?90:130,maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>
+              <div style={{height:isMobile?110:150,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",padding:isMobile?12:20}}>
+                <img src={p.img} alt={p.name} style={{maxHeight:isMobile?90:130,maxWidth:"100%",objectFit:"contain"}} onError={e=>{e.target.onerror=null;e.target.style.opacity="0.3"}}/>
               </div>
               <div style={{padding:isMobile?"8px 10px 12px":"10px 12px 14px",flex:1,display:"flex",flexDirection:"column"}}>
                 <h3 style={{fontSize:isMobile?12:13,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{p.name}</h3>
diff --git a/suntrex-dashboard-prompt.md b/suntrex-dashboard-prompt.md
new file mode 100644
index 0000000..daca69c
--- /dev/null
+++ b/suntrex-dashboard-prompt.md
@@ -0,0 +1,650 @@
+# PROMPT CLAUDE CODE — Dashboard Unifié BUY/SELL SUNTREX
+
+> **Colle ce prompt entier dans Claude Code depuis `~/Downloads/suntrex`.**
+> Claude Code lira automatiquement le `CLAUDE.md` racine — ce prompt ajoute le contexte spécifique pour le dashboard.
+
+---
+
+## MISSION
+
+Créer le **dashboard unifié acheteur/vendeur** de SUNTREX, inspiré de sun.store, avec un système de transactions qui inclut un chat de négociation intégré. Ce dashboard est le cœur de l'interface connectée — c'est la page que voit un utilisateur après login.
+
+**Ce n'est PAS un artefact isolé** — c'est un ensemble de composants React à intégrer dans l'architecture existante (`src/components/`) avec routing, Supabase realtime, et Stripe Connect.
+
+---
+
+## CONTEXTE ARCHITECTURE EXISTANTE
+
+Lis d'abord ces fichiers pour comprendre les conventions :
+```
+cat CLAUDE.md
+cat src/App.jsx | head -50
+cat src/components/chat/CLAUDE.md
+cat src/components/payment/CLAUDE.md
+cat netlify/functions/CLAUDE.md
+```
+
+### Stack confirmée
+- **Frontend** : Vite + React, inline styles (pas Tailwind, pas CSS modules)
+- **State** : React hooks (useState, useEffect, useRef, useContext)
+- **DB/Auth** : Supabase (PostgreSQL + Realtime + Auth)
+- **Serverless** : Netlify Functions
+- **Payments** : Stripe Connect (Destination Charges)
+- **Hosting** : Vercel (front) + Netlify (functions)
+
+### Convention de style : INLINE STYLES uniquement
+```jsx
+// ✅ Ce qu'on fait chez SUNTREX
+<div style={{ padding: isMobile ? 16 : 40, display: "flex", gap: 16 }}>
+
+// ❌ INTERDIT — pas de className, pas de Tailwind
+<div className="p-4 flex gap-4">
+```
+
+---
+
+## STRUCTURE DE FICHIERS À CRÉER
+
+```
+src/
+├── components/
+│   ├── dashboard/
+│   │   ├── CLAUDE.md                    # ← Règles spécifiques dashboard
+│   │   ├── DashboardLayout.jsx          # Layout principal (sidebar + topbar + content)
+│   │   ├── DashboardSidebar.jsx         # Sidebar contextuelle BUY/SELL
+│   │   ├── DashboardTopbar.jsx          # Topbar avec BUY|SELL|MY PROFILE|NOTIFICATIONS
+│   │   ├── DashboardRouter.jsx          # Routing interne des sections
+│   │   │
+│   │   ├── buy/                         # === ESPACE ACHETEUR ===
+│   │   │   ├── MyPurchases.jsx          # Liste des achats/transactions côté buyer
+│   │   │   ├── DeliveryAddresses.jsx    # Gestion des adresses de livraison
+│   │   │   ├── BuyerRFQ.jsx            # Demandes de devis (Requests for Proposals)
+│   │   │   └── BuyerOverview.jsx        # Vue d'ensemble acheteur (stats, charts)
+│   │   │
+│   │   ├── sell/                        # === ESPACE VENDEUR ===
+│   │   │   ├── ManageOffers.jsx         # Gestion des offres/listings
+│   │   │   ├── MySales.jsx             # Liste des ventes (= TransactionsList)
+│   │   │   ├── SellerOverview.jsx       # Vue d'ensemble vendeur (stats, revenus)
+│   │   │   └── WarehouseManager.jsx     # Gestion des entrepôts
+│   │   │
+│   │   ├── transaction/                 # === SYSTÈME DE TRANSACTIONS ===
+│   │   │   ├── TransactionPage.jsx      # Page transaction complète (le cœur)
+│   │   │   ├── TransactionChat.jsx      # Chat de négociation (dans TransactionPage)
+│   │   │   ├── TransactionTimeline.jsx  # Timeline statut (Négo→Confirmé→Payé→Expédié→Livré)
+│   │   │   ├── TransactionProducts.jsx  # Carte produit éditable (prix, qty, livraison)
+│   │   │   └── TransactionDetails.jsx   # Panel détails (vendeur/acheteur, TVA, adresse)
+│   │   │
+│   │   ├── profile/                     # === MON PROFIL ===
+│   │   │   ├── AccountDetails.jsx       # Détails du compte
+│   │   │   ├── CompanyDetails.jsx       # Infos entreprise + KYC
+│   │   │   ├── InvoicesAndFees.jsx      # Factures et commissions
+│   │   │   ├── ReviewsPage.jsx          # Avis reçus/donnés
+│   │   │   └── OutOfOffice.jsx          # Mode absence
+│   │   │
+│   │   ├── notifications/               # === NOTIFICATIONS ===
+│   │   │   ├── NotificationsCenter.jsx  # Centre de notifications
+│   │   │   ├── NotificationEmails.jsx   # Paramètres email
+│   │   │   └── NotificationSettings.jsx # Préférences notifications
+│   │   │
+│   │   └── shared/                      # === COMPOSANTS PARTAGÉS ===
+│   │       ├── StatCard.jsx             # Carte statistique réutilisable
+│   │       ├── StatusBadge.jsx          # Badge de statut (Négociation, Payé, Livré...)
+│   │       ├── PriceEditor.jsx          # Éditeur de prix inline (click→input→validate)
+│   │       ├── TranslationBanner.jsx    # Banner traduction automatique
+│   │       ├── EmptyState.jsx           # État vide générique
+│   │       └── useResponsive.js         # Hook responsive (comme défini dans CLAUDE.md)
+│   │
+│   └── ... (chat/, payment/, etc. existants)
+```
+
+---
+
+## DESIGN SYSTEM — Tokens
+
+Utilise ces tokens partout. Ils sont calqués sur sun.store mais avec l'identité SUNTREX :
+
+```jsx
+// src/components/dashboard/tokens.js
+export const T = {
+  // Colors
+  bg: "#f7f8fa",
+  card: "#ffffff",
+  border: "#e8eaef",
+  borderLight: "#f0f1f5",
+  text: "#1a1d26",
+  textSec: "#6b7280",
+  textMuted: "#9ca3af",
+  accent: "#E8700A",        // SUNTREX orange
+  accentHover: "#d46200",
+  accentLight: "#fff7ed",
+  green: "#10b981",
+  greenBg: "#ecfdf5",
+  greenText: "#065f46",
+  red: "#ef4444",
+  redBg: "#fef2f2",
+  redText: "#991b1b",
+  blue: "#3b82f6",
+  blueBg: "#eff6ff",
+  blueText: "#1e40af",
+  yellow: "#f59e0b",
+  yellowBg: "#fffbeb",
+  sidebar: "#1a1d26",
+  
+  // Spacing & Shape
+  radius: 10,
+  radiusSm: 6,
+  radiusLg: 16,
+  
+  // Typography
+  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
+  
+  // Shadows
+  shadow: "0 1px 3px rgba(0,0,0,0.06)",
+  shadowMd: "0 4px 12px rgba(0,0,0,0.08)",
+  shadowLg: "0 8px 30px rgba(0,0,0,0.12)",
+};
+```
+
+---
+
+## NAVIGATION — Structure exacte inspirée sun.store
+
+### Topbar (header quand connecté)
+```
+┌────────────────────────────────────────────────────────────────────┐
+│  [SUNTREX logo]  [Recherche produit...]  [🇫🇷 French-EUR ▾]  🔔  👤  🛒  │
+│  ─────────────────────────────────────────────────────────────────  │
+│  BUY         SELL         MY PROFILE ▾       NOTIFICATIONS         │
+│  ────        ────         ══════════ (green underline = active)    │
+└────────────────────────────────────────────────────────────────────┘
+```
+
+Les 4 tabs du topbar changent le CONTEXTE de la sidebar :
+
+### Sidebar BUY (quand tab "BUY" actif)
+```
+BUY ∧
+├── My purchases           (icône: shopping bag)
+├── Delivery addresses     (icône: map pin)
+├── Requests for Proposals (icône: document) [NEW badge]
+└── sun.finance → SUNTREX Finance (icône: bank) [NEW badge]
+
+NOTIFICATIONS ∧
+├── Notifications center   (icône: bell)
+├── Notification emails    (icône: mail)
+└── Notifications settings (icône: gear)
+```
+
+### Sidebar SELL (quand tab "SELL" actif)
+```
+SELL ∧
+├── Manage offers          (icône: list)
+└── My sales               (icône: dollar)
+    ├── → TransactionsList (All | Negotiations | Cancelled | Confirmed | Paid | Completed)
+    └── → TransactionPage (clic sur une transaction)
+```
+
+### Dropdown MY PROFILE
+```
+├── Account details        (icône: user)
+├── Password               (icône: lock)
+├── Company details        (icône: building)
+├── Invoices & Fees        (icône: receipt) [NEW badge]
+├── Reviews                (icône: star)
+├── Out of office mode     (icône: moon)
+├── ──────────────────────
+└── Log out                (icône: logout)
+```
+
+---
+
+## WORKFLOW TRANSACTION — Le flux complet
+
+C'est le cœur du système. Chaque négociation crée une transaction avec un ID unique.
+
+### Déclenchement
+1. **Buyer** voit un produit dans le catalogue
+2. Buyer clique "Acheter" ou "Négocier le prix"
+3. → Création automatique d'une **Transaction** avec :
+   - ID unique (format: `#[7 chars alphanumériques]` ex: `#FHJ46JUm`)
+   - Produit, quantité, prix initial du listing
+   - Buyer info + Seller info
+   - Status: `negotiation`
+   - Chat de négociation ouvert automatiquement
+4. **Seller** reçoit notification → voit la transaction dans "Mes ventes"
+5. Le chat démarre avec un message système automatique de l'acheteur
+
+### Statuts du pipeline
+```
+negotiation → confirmed → paid → shipped → delivered
+                 ↓                    ↓
+              cancelled           disputed
+```
+
+### Ce que le SELLER peut faire dans la transaction
+- ✏️ **Éditer le prix unitaire** (click "Editer" → input inline → ✓ valider)
+- ✏️ **Éditer la quantité**
+- ✏️ **Définir/modifier les frais de livraison** (obligatoire pour débloquer le paiement)
+- ✉️ **Répondre dans le chat** (avec traduction automatique)
+- ➕ **Ajouter des produits** de son catalogue à la transaction
+- ❌ **Annuler la transaction** (avec raison obligatoire)
+- 📎 **Joindre des fichiers** (devis PDF, fiches techniques)
+
+### Ce que le BUYER peut faire
+- 💬 **Négocier dans le chat** (prix, conditions, livraison)
+- ✅ **Accepter l'offre** → passe en `confirmed`
+- 💳 **Payer** (Stripe Checkout) → passe en `paid`
+- 📦 **Suivre la livraison** (SUNTREX DELIVERY)
+- ✅ **Confirmer la réception** → passe en `delivered` → fonds libérés au seller
+- ⚠️ **Signaler un problème** → passe en `disputed`
+
+---
+
+## SUPABASE — Tables à créer/modifier
+
+### Nouvelle table : `Transaction`
+```sql
+CREATE TABLE public."Transaction" (
+  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
+  short_id TEXT UNIQUE NOT NULL,           -- '#FHJ46JUm' (généré côté serveur)
+  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
+  seller_id UUID REFERENCES auth.users(id) NOT NULL,
+  buyer_company_id UUID REFERENCES public."Company"(id),
+  seller_company_id UUID REFERENCES public."Company"(id),
+  
+  -- Status pipeline
+  status TEXT NOT NULL DEFAULT 'negotiation'
+    CHECK (status IN ('negotiation','confirmed','paid','shipped','delivered','cancelled','disputed')),
+  
+  -- Cancellation
+  cancelled_by TEXT CHECK (cancelled_by IN ('buyer','seller','admin')),
+  cancel_reason TEXT,
+  cancel_message TEXT,
+  
+  -- Delivery
+  delivery_method TEXT DEFAULT 'standard',  -- 'standard', 'suntrex_delivery', 'pickup'
+  delivery_cost DECIMAL(10,2),              -- NULL = pas encore défini
+  delivery_tracking_id TEXT,
+  
+  -- Stripe
+  payment_intent_id TEXT,
+  transfer_id TEXT,
+  
+  -- Incoterms
+  incoterms TEXT DEFAULT 'Delivery on premise',
+  
+  -- Timestamps
+  confirmed_at TIMESTAMPTZ,
+  paid_at TIMESTAMPTZ,
+  shipped_at TIMESTAMPTZ,
+  delivered_at TIMESTAMPTZ,
+  cancelled_at TIMESTAMPTZ,
+  created_at TIMESTAMPTZ DEFAULT now(),
+  updated_at TIMESTAMPTZ DEFAULT now()
+);
+
+-- RLS: buyer et seller voient leurs propres transactions
+ALTER TABLE public."Transaction" ENABLE ROW LEVEL SECURITY;
+
+CREATE POLICY "Users see own transactions" ON public."Transaction"
+  FOR SELECT USING (
+    auth.uid() = buyer_id OR auth.uid() = seller_id
+  );
+
+CREATE POLICY "Buyer can create transaction" ON public."Transaction"
+  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
+
+CREATE POLICY "Participants can update" ON public."Transaction"
+  FOR UPDATE USING (
+    auth.uid() = buyer_id OR auth.uid() = seller_id
+  );
+```
+
+### Nouvelle table : `TransactionItem`
+```sql
+CREATE TABLE public."TransactionItem" (
+  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
+  transaction_id UUID REFERENCES public."Transaction"(id) ON DELETE CASCADE NOT NULL,
+  listing_id UUID REFERENCES public."Listing"(id),
+  
+  product_name TEXT NOT NULL,
+  sku TEXT,
+  quantity INTEGER NOT NULL DEFAULT 1,
+  unit_price DECIMAL(10,2) NOT NULL,
+  vat_rate DECIMAL(5,4) DEFAULT 0,
+  
+  -- Seller can edit these
+  edited_price DECIMAL(10,2),              -- NULL = original price
+  edited_quantity INTEGER,                 -- NULL = original qty
+  
+  availability INTEGER,                    -- Stock dispo chez le seller
+  ship_days INTEGER DEFAULT 3,             -- Temps d'envoi estimé
+  
+  created_at TIMESTAMPTZ DEFAULT now()
+);
+
+ALTER TABLE public."TransactionItem" ENABLE ROW LEVEL SECURITY;
+
+CREATE POLICY "Via transaction access" ON public."TransactionItem"
+  FOR ALL USING (
+    EXISTS (
+      SELECT 1 FROM public."Transaction" t
+      WHERE t.id = transaction_id
+      AND (auth.uid() = t.buyer_id OR auth.uid() = t.seller_id)
+    )
+  );
+```
+
+### Nouvelle table : `TransactionMessage`
+```sql
+CREATE TABLE public."TransactionMessage" (
+  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
+  transaction_id UUID REFERENCES public."Transaction"(id) ON DELETE CASCADE NOT NULL,
+  sender_id UUID REFERENCES auth.users(id),
+  sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer','seller','system','moderator')),
+  
+  content TEXT NOT NULL,
+  content_original TEXT,                   -- Texte original avant traduction
+  original_lang TEXT,                      -- 'nl', 'de', 'fr', etc.
+  translated_lang TEXT,                    -- Langue de la traduction affichée
+  
+  -- Rich content
+  has_address_card BOOLEAN DEFAULT false,
+  address_country TEXT,
+  address_zip TEXT,
+  
+  -- Attachments
+  attachment_urls TEXT[],                  -- Array d'URLs Supabase Storage
+  attachment_names TEXT[],
+  
+  -- Moderation
+  flagged BOOLEAN DEFAULT false,
+  flagged_reason TEXT,
+  
+  created_at TIMESTAMPTZ DEFAULT now()
+);
+
+ALTER TABLE public."TransactionMessage" ENABLE ROW LEVEL SECURITY;
+
+CREATE POLICY "Via transaction access" ON public."TransactionMessage"
+  FOR ALL USING (
+    EXISTS (
+      SELECT 1 FROM public."Transaction" t
+      WHERE t.id = transaction_id
+      AND (auth.uid() = t.buyer_id OR auth.uid() = t.seller_id)
+    )
+  );
+
+-- Index pour les requêtes fréquentes
+CREATE INDEX idx_tx_msg_transaction ON public."TransactionMessage"(transaction_id, created_at);
+```
+
+### Realtime — Subscriptions à configurer
+```js
+// Écouter les nouveaux messages d'une transaction
+supabase
+  .channel(`tx-messages:${transactionId}`)
+  .on('postgres_changes', {
+    event: 'INSERT',
+    schema: 'public',
+    table: 'TransactionMessage',
+    filter: `transaction_id=eq.${transactionId}`
+  }, handleNewMessage)
+  .subscribe();
+
+// Écouter les changements de statut d'une transaction
+supabase
+  .channel(`tx-status:${transactionId}`)
+  .on('postgres_changes', {
+    event: 'UPDATE',
+    schema: 'public',
+    table: 'Transaction',
+    filter: `id=eq.${transactionId}`
+  }, handleStatusChange)
+  .subscribe();
+```
+
+---
+
+## PAGE TRANSACTION — Spécifications UI détaillées
+
+### Layout (identique à sun.store — voir screenshots de référence)
+
+```
+┌─────────────────────────────────────────────────────────────────┐
+│ Mes ventes > Transactions > Transaction #FHJ46JUm              │
+│                                                                 │
+│ [⊕ Ajouter des produits]  [✕ Annuler la transaction]           │
+├─────────────────────────────────────────────────────────────────┤
+│ 🛡 Des paiements sécurisés sont disponibles                     │
+├─────────────────────────────────────────────────────────────────┤
+│ QUALIWATT, 16-18 rue Eiffel, 77220 Gretz-Armainvilliers       │
+├─────────────────────────────────────────────────────────────────┤
+│ [Image] │ Huawei SUN2000-30KTL │ Qté: 1 pc  │ Prix: €1,555  │
+│ #CEM6k  │ Dispo: 4pcs         │ [Editer]   │ TVA: €0.00    │
+│         │ Incoterms: DOP      │            │ Net: €1,555   │
+│         │ Envoi: ~3 jours     │            │ [Editer]      │
+│         │ [Détails produit]   │            │               │
+├─────────────────────────────────────────────────────────────────┤
+│                   Livraison (brut): Prix sur demande [Editer]  │
+│                   Total (brut):              €1,555.00         │
+├─────────────────────────────────────────────────────────────────┤
+│ ⊕ Ajouter des produits de votre liste                     ∨   │
+├─────────────────────────────────────────────────────────────────┤
+│                                                                 │
+│  🌐 Cette négociation est automatiquement traduite en chat      │
+│  ┌──────────────────────────────────────────────────────────┐  │
+│  │ Acheteur            mardi, 24 févr. 2026, 23:50         │  │
+│  │                                                          │  │
+│  │ Bonjour, je suis intéressé par l'achat d'un Huawei      │  │
+│  │ SUN2000-30KTL-M3 chez vous...                           │  │
+│  │ ┌─────────────────────────┐                             │  │
+│  │ │ Adresse de livraison :  │                             │  │
+│  │ │ Netherlands              │                             │  │
+│  │ │ 24** **                  │                             │  │
+│  │ └─────────────────────────┘                             │  │
+│  │ ⏰ L'offre est valable 3 jours ouvrables                │  │
+│  │ [Afficher dans la langue originale]                      │  │
+│  └──────────────────────────────────────────────────────────┘  │
+│                                                                 │
+│  ┌──────────────────────────────────────────────────────────┐  │
+│  │ 🚚 Indiquez les frais de livraison pour permettre        │  │
+│  │    à l'acheteur de procéder au paiement.                  │  │
+│  │                          [Prévoir les frais de livraison] │  │
+│  └──────────────────────────────────────────────────────────┘  │
+│                                                                 │
+│  [Écrivez quelque chose...]                                     │
+│  [B][I][U] | [🔗][🖼][😊]  [🔄 Auto-translate FR] [📤 Envoyer]│
+│                                                                 │
+├─────────────────────────────────────────────────────────────────┤
+│ Autres pièces jointes                                           │
+│ [Ajouter fichiers]              [Rechercher dans les fichiers]  │
+├─────────────────────────────────────────────────────────────────┤
+│ Contact assistance SUNTREX │ ✉ contact@suntrex.com │[Signaler] │
+├──────────────────────────┬──────────────────────────────────────┤
+│ Détails du vendeur       │ Détails de la transaction            │
+│ TVA: ✓ Actif             │ Coordonnées acheteur: 🇳🇱 Netherlands│
+│ Tx complétées: 11        │ TVA: ✓ Vérifié (24.02.26) [Revérif]│
+│ Offres actives: 52       │ Adresse livraison: NL, 24** **      │
+│ Depuis: 09 Dec 2025      │                                     │
+│ ⭐ 5.0 (3 avis)          │ Statut commande:                    │
+│ 🕐 Réponse: <2h          │ ● Ouverture négo    23:50, 24.02   │
+│                          │ ○ Tx confirmée                      │
+│                          │ ○ Payé                               │
+│                          │ ○ Expédié                            │
+│                          │ ○ Livré                              │
+│                          │                                     │
+│                          │ Envoyé par: QUALIWATT               │
+│                          │ 16-18 rue Eiffel, 77220...          │
+└──────────────────────────┴──────────────────────────────────────┘
+```
+
+---
+
+## RESPONSIVE — Breakpoints obligatoires
+
+### Mobile (< 768px)
+- Sidebar → bottom tab bar (BUY | SELL | PROFILE | NOTIFS)
+- Transaction product card → stack vertical
+- Chat prend toute la largeur
+- Détails vendeur/transaction → accordéons empilés
+- Colonnes 2 → 1
+
+### Tablet (768-1023px)
+- Sidebar visible mais réduite (icônes only, expand on hover)
+- Grid 2 colonnes maintenu pour les détails
+
+### Desktop (≥ 1024px)
+- Layout complet comme décrit ci-dessus
+
+---
+
+## INTÉGRATION AVEC L'EXISTANT
+
+### 1. Routing dans App.jsx
+```jsx
+// Ajouter dans App.jsx un simple router :
+// "/" → Landing page (existante)
+// "/dashboard" → DashboardLayout (nouveau)
+// "/dashboard/buy/purchases" → MyPurchases
+// "/dashboard/sell/transactions" → MySales
+// "/dashboard/sell/transactions/:id" → TransactionPage
+// etc.
+
+// Pour le MVP, un hash router simple suffit :
+const [route, setRoute] = useState(window.location.hash || "#/");
+
+// Si hash commence par #/dashboard → render DashboardLayout
+// Sinon → render landing page existante
+```
+
+### 2. Auth Supabase
+```jsx
+// L'utilisateur doit être connecté pour accéder au dashboard
+import { supabase } from '../../lib/supabase';
+
+const { data: { user } } = await supabase.auth.getUser();
+if (!user) {
+  // Redirect vers login/signup
+  return <LoginPage />;
+}
+```
+
+### 3. Connexion Stripe Connect (SellerOnboarding)
+```jsx
+// Vérifier le statut Stripe du vendeur avant d'afficher "SELL"
+// Utiliser la Netlify Function existante : stripe-connect.js
+const checkSellerStatus = async () => {
+  const res = await fetch('/api/stripe-connect', {
+    method: 'POST',
+    headers: { 'Content-Type': 'application/json' },
+    body: JSON.stringify({ action: 'check_status', userId: user.id }),
+  });
+  const { charges_enabled, payouts_enabled } = await res.json();
+  // Si pas onboardé → afficher le flow d'onboarding dans l'onglet SELL
+};
+```
+
+### 4. Netlify Function pour les transactions
+Créer `netlify/functions/transaction.js` :
+```js
+// POST /api/transaction
+// Actions : create, update_status, update_price, set_delivery_cost, cancel
+// Toutes les modifications de prix/statut passent par le SERVEUR (jamais le client directement)
+// Vérifier que l'utilisateur est bien buyer ou seller de la transaction
+// Vérifier les montants côté serveur avant de créer un PaymentIntent
+```
+
+---
+
+## ORDRE D'IMPLÉMENTATION
+
+Fais-le dans cet ordre précis :
+
+### Étape 1 : Foundation
+1. Créer `src/components/dashboard/tokens.js` (design tokens)
+2. Créer `src/components/dashboard/shared/useResponsive.js`
+3. Créer `src/components/dashboard/shared/StatCard.jsx`
+4. Créer `src/components/dashboard/shared/StatusBadge.jsx`
+5. Créer `src/components/dashboard/shared/PriceEditor.jsx`
+6. Créer `src/components/dashboard/shared/EmptyState.jsx`
+
+### Étape 2 : Layout
+7. Créer `DashboardTopbar.jsx` — avec tabs BUY|SELL|MY PROFILE|NOTIFICATIONS
+8. Créer `DashboardSidebar.jsx` — contextuel selon le tab actif
+9. Créer `DashboardLayout.jsx` — compose sidebar + topbar + content
+10. Créer `DashboardRouter.jsx` — routing interne
+
+### Étape 3 : Transactions (le cœur)
+11. Créer `sell/MySales.jsx` — liste des transactions avec tabs/filtres/search
+12. Créer `transaction/TransactionProducts.jsx` — carte produit éditable
+13. Créer `transaction/TransactionChat.jsx` — chat de négociation
+14. Créer `transaction/TransactionTimeline.jsx` — pipeline de statuts
+15. Créer `transaction/TransactionDetails.jsx` — panel détails vendeur/acheteur
+16. Créer `transaction/TransactionPage.jsx` — assemble tout
+
+### Étape 4 : Acheteur
+17. Créer `buy/MyPurchases.jsx` — même TransactionsList mais vue buyer
+18. Créer `buy/DeliveryAddresses.jsx`
+19. Créer `buy/BuyerOverview.jsx`
+
+### Étape 5 : Profil
+20. Créer les pages profil (AccountDetails, CompanyDetails, etc.)
+
+### Étape 6 : Backend
+21. SQL Supabase : créer tables Transaction, TransactionItem, TransactionMessage
+22. RLS policies
+23. Netlify Function : `transaction.js`
+24. Realtime subscriptions
+
+### Étape 7 : Intégration
+25. Modifier `App.jsx` pour ajouter le routing vers le dashboard
+26. Connecter Auth Supabase
+27. Tester le flow complet
+
+---
+
+## QUALITÉ ATTENDUE
+
+- **100% responsive** (375px → 1440px) — vérifie chaque composant
+- **Inline styles uniquement** — pas de className
+- **Graceful degradation** : si Supabase pas dispo, mode démo avec données mockées
+- **i18n** : toutes les chaînes en FR et EN minimum
+- **Accessibilité** : focus states, aria-labels, contraste suffisant
+- **Performance** : lazy loading des sections, pas de re-render inutile
+- **Sécurité** : jamais de prix/montants envoyés du client au serveur
+
+---
+
+## DONNÉES DE DÉMO (pour le mode hors-ligne)
+
+Inclure des données mockées pour pouvoir tester sans Supabase :
+- 3-5 transactions avec différents statuts
+- Messages de chat réalistes (négociation solaire B2B)
+- Produits Huawei, Deye, Enphase
+- Acheteurs de différents pays (🇫🇷 🇩🇪 🇳🇱 🇧🇪 🇪🇸)
+- Mix de statuts : negotiation, cancelled, confirmed, paid
+
+---
+
+## RÉFÉRENCE VISUELLE
+
+L'interface sun.store est notre benchmark. Points clés à reproduire :
+1. **Sidebar gauche** qui change selon BUY/SELL (sections collapsibles avec chevrons)
+2. **Transaction cards** dans la liste avec : statut (cercle vert/rouge), résumé montant, photo produit, dernière mise à jour
+3. **Page transaction** : breadcrumb, carte produit éditable, chat avec traduction, détails en colonnes
+4. **Chat** : bulles sombres (buyer), blanches bordées (seller), messages système centrés
+5. **Barre action livraison** (bleue) : "Indiquez les frais de livraison..."
+6. **Toolbar chat** : B/I/U | lien/image/emoji | toggle traduction | bouton Envoyer vert arrondi
+7. **Timeline** : cercles verts (complété) connectés par ligne verticale
+8. **Pills/badges** pour les stats vendeur : "Transactions: 11", "⭐ 5.0", "🕐 <2h"
+
+Fais MIEUX que sun.store sur :
+- Animation/transitions (hover, apparition)
+- Micro-interactions (toggle traduction, édition inline)
+- Badge SUNTREX DELIVERY (identité propre)
+- Indicateur de modération IA dans le chat
+
+---
+
+Commence par l'étape 1 et avance méthodiquement. Montre-moi chaque fichier créé avant de passer au suivant.
```
