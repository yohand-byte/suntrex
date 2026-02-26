import React, { useState, useCallback, createContext, useContext } from "react";
import { T } from "./tokens";
import { useResponsive } from "./shared/useResponsive";
import DashboardTopbar from "./DashboardTopbar";
import DashboardSidebar from "./DashboardSidebar";
import DashboardRouter, { DEFAULT_SECTIONS } from "./DashboardRouter";
import { MOCK_BUYER, MOCK_SELLER } from "./dashboardUtils";

// ── Dashboard Context ──────────────────────────────────────────────
export const DashboardContext = createContext({
  user: null,
  company: null,
  activeTab: "buy",
  activeSection: null,
  transactionId: null,
  lang: "fr",
  setActiveTab: () => {},
  setActiveSection: () => {},
  navigateToTransaction: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

// ── Mock data for demo mode ────────────────────────────────────────
const DEMO_USER = MOCK_BUYER.user;
const DEMO_COMPANY = MOCK_BUYER.company;
const DEMO_NOTIFICATIONS = [...MOCK_BUYER.notifications, ...MOCK_SELLER.notifications];

// ── Mobile bottom tab bar ──────────────────────────────────────────
const MOBILE_TABS = [
  { id: "buy",           icon: "\uD83D\uDED2", label: "Buy",    labelFr: "Acheter" },
  { id: "sell",          icon: "\uD83D\uDCB0", label: "Sell",   labelFr: "Vendre" },
  { id: "profile",       icon: "\uD83D\uDC64", label: "Profile", labelFr: "Profil" },
  { id: "notifications", icon: "\uD83D\uDD14", label: "Notifs", labelFr: "Notifs" },
];

export default function DashboardLayout({ initialTab = "buy", user: propUser, company: propCompany }) {
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTIONS[initialTab]);
  const [transactionId, setTransactionId] = useState(null);
  const [lang] = useState("fr");

  // Use prop user or demo user
  const user = propUser || DEMO_USER;
  const company = propCompany || DEMO_COMPANY;

  const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.read).length;

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setActiveSection(DEFAULT_SECTIONS[tabId]);
    setTransactionId(null);
  }, []);

  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setTransactionId(null);
  }, []);

  const navigateToTransaction = useCallback((txId) => {
    setActiveSection("transaction");
    setTransactionId(txId);
  }, []);

  const handleProfileAction = useCallback((actionId) => {
    if (actionId === "logout") {
      // Handle logout - navigate to home
      window.location.href = "/";
      return;
    }
    setActiveTab("profile");
    setActiveSection(actionId);
  }, []);

  const handleNotificationClick = useCallback(() => {
    setActiveTab("notifications");
    setActiveSection("notif-center");
  }, []);

  const contextValue = {
    user,
    company,
    activeTab,
    activeSection,
    transactionId,
    lang,
    setActiveTab: handleTabChange,
    setActiveSection: handleSectionChange,
    navigateToTransaction,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: T.bg,
        fontFamily: T.font,
      }}>
        {/* Topbar */}
        <DashboardTopbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onProfileAction={handleProfileAction}
          onNotificationClick={handleNotificationClick}
          unreadCount={unreadCount}
          user={user}
          lang={lang}
        />

        {/* Main content area: sidebar + content */}
        <div style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          paddingBottom: isMobile ? 64 : 0, // Space for mobile bottom bar
        }}>
          {/* Sidebar */}
          <DashboardSidebar
            activeTab={activeTab}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            lang={lang}
            user={user}
            company={company}
          />

          {/* Content */}
          <main style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? 16 : (isTablet ? 24 : 32),
            overflowY: "auto",
          }}>
            <DashboardRouter
              activeTab={activeTab}
              activeSection={activeSection}
              transactionId={transactionId}
              user={user}
              company={company}
              lang={lang}
            />
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        {isMobile && (
          <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            background: T.card,
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            zIndex: 100,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
          }}>
            {MOBILE_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    background: "none",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "8px 12px",
                    cursor: "pointer",
                    minWidth: 60,
                    minHeight: 44,
                    position: "relative",
                  }}
                  aria-label={lang === "fr" ? tab.labelFr : tab.label}
                >
                  <span style={{
                    fontSize: 20,
                    opacity: active ? 1 : 0.5,
                    transition: T.transitionFast,
                  }}>
                    {tab.icon}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    color: active ? T.accent : T.textMuted,
                    fontFamily: T.font,
                  }}>
                    {lang === "fr" ? tab.labelFr : tab.label}
                  </span>
                  {active && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 24,
                      height: 3,
                      borderRadius: 2,
                      background: T.accent,
                    }} />
                  )}
                  {tab.id === "notifications" && unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: 4,
                      right: 8,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: T.red,
                      border: "2px solid #fff",
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
