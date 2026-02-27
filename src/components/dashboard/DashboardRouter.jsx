import React, { lazy, Suspense } from "react";
import { T } from "./tokens";

// ── Lazy-loaded section components ─────────────────────────────────
// Buy sections
const MyPurchases = lazy(() => import("./buy/MyPurchases"));
const DeliveryAddresses = lazy(() => import("./buy/DeliveryAddresses"));
const BuyerRFQ = lazy(() => import("./buy/BuyerRFQ"));
const BuyerOverview = lazy(() => import("./buy/BuyerOverview"));

// Sell sections
const ManageOffers = lazy(() => import("./sell/ManageOffers"));
const MySales = lazy(() => import("./sell/MySales"));
const SellerOverview = lazy(() => import("./sell/SellerOverview"));
const WarehouseManager = lazy(() => import("./sell/WarehouseManager"));

// Transaction
const TransactionPage = lazy(() => import("./transaction/TransactionPage"));

// Profile sections
const AccountDetails = lazy(() => import("./profile/AccountDetails"));
const CompanyDetails = lazy(() => import("./profile/CompanyDetails"));
const InvoicesAndFees = lazy(() => import("./profile/InvoicesAndFees"));
const ReviewsPage = lazy(() => import("./profile/ReviewsPage"));
const OutOfOffice = lazy(() => import("./profile/OutOfOffice"));

// Notifications
const NotificationsCenter = lazy(() => import("./notifications/NotificationsCenter"));
const NotificationEmails = lazy(() => import("./notifications/NotificationEmails"));
const NotificationSettings = lazy(() => import("./notifications/NotificationSettings"));

// ── Loading fallback ───────────────────────────────────────────────
function SectionLoader() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 60, color: T.textMuted, fontFamily: T.font, fontSize: 14,
    }}>
      <div style={{
        width: 24, height: 24,
        border: `3px solid ${T.border}`,
        borderTopColor: T.accent,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginRight: 12,
      }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── Section mapping ────────────────────────────────────────────────
const SECTION_MAP = {
  // Buy
  "purchases": MyPurchases,
  "addresses": DeliveryAddresses,
  "rfq": BuyerRFQ,
  "finance": BuyerOverview, // Finance section defaults to overview for now

  // Sell
  "offers": ManageOffers,
  "sales": MySales,
  "warehouses": WarehouseManager,

  // Transaction (special — receives transactionId)
  "transaction": TransactionPage,

  // Profile
  "account": AccountDetails,
  "password": AccountDetails, // Password is part of account details
  "company": CompanyDetails,
  "invoices": InvoicesAndFees,
  "reviews": ReviewsPage,
  "ooo": OutOfOffice,

  // Notifications
  "notif-center": NotificationsCenter,
  "notif-emails": NotificationEmails,
  "notif-settings": NotificationSettings,
};

// Default sections per tab
const DEFAULT_SECTIONS = {
  buy: "purchases",
  sell: "sales",
  profile: "account",
  notifications: "notif-center",
};

export default function DashboardRouter({ activeTab, activeSection, transactionId, user, company, lang }) {
  const sectionId = activeSection || DEFAULT_SECTIONS[activeTab] || "purchases";
  const Component = SECTION_MAP[sectionId];

  if (!Component) {
    return (
      <div style={{
        padding: 40, textAlign: "center",
        color: T.textMuted, fontFamily: T.font, fontSize: 14,
      }}>
        {lang === "fr" ? "Section non trouvee" : "Section not found"}
      </div>
    );
  }

  return (
    <Suspense fallback={<SectionLoader />}>
      <Component
        user={user}
        company={company}
        lang={lang}
        transactionId={transactionId}
      />
    </Suspense>
  );
}

export { DEFAULT_SECTIONS, SECTION_MAP };
