import React, { useState } from "react";
import { T } from "./tokens";
import { useResponsive } from "./shared/useResponsive";

// ── Sidebar menu configs per context ───────────────────────────────
const SIDEBAR_BUY = {
  sections: [
    {
      title: "BUY", titleFr: "ACHETER", collapsible: true, defaultOpen: true,
      items: [
        { id: "purchases",  icon: "\uD83D\uDECD\uFE0F", label: "My purchases",           labelFr: "Mes achats" },
        { id: "messages",    icon: "\uD83D\uDCAC",       label: "Messages",               labelFr: "Messagerie", badge: "3" },
        { id: "addresses",   icon: "\uD83D\uDCCD",       label: "Delivery addresses",     labelFr: "Adresses de livraison" },
        { id: "rfq",         icon: "\uD83D\uDCC4",       label: "Requests for Proposals", labelFr: "Demandes de devis", badge: "NEW" },
        { id: "finance",     icon: "\uD83C\uDFE6",       label: "SUNTREX Finance",        labelFr: "SUNTREX Finance", badge: "NEW" },
      ],
    },
    {
      title: "NOTIFICATIONS", titleFr: "NOTIFICATIONS", collapsible: true, defaultOpen: true,
      items: [
        { id: "notif-center",   icon: "\uD83D\uDD14", label: "Notifications center",   labelFr: "Centre de notifications" },
        { id: "notif-emails",   icon: "\u2709\uFE0F", label: "Notification emails",    labelFr: "Emails de notification" },
        { id: "notif-settings", icon: "\u2699\uFE0F", label: "Notifications settings", labelFr: "Parametres notifications" },
      ],
    },
  ],
};

const SIDEBAR_SELL = {
  sections: [
    {
      title: "SELL", titleFr: "VENDRE", collapsible: true, defaultOpen: true,
      items: [
        { id: "offers",       icon: "\uD83D\uDCCB", label: "Manage offers",  labelFr: "Gérer les offres" },
        { id: "sales",        icon: "\uD83D\uDCB0", label: "My sales",       labelFr: "Mes ventes" },
        { id: "messages",     icon: "\uD83D\uDCAC", label: "Messages",       labelFr: "Messagerie", badge: "3" },
        { id: "warehouses",   icon: "\uD83C\uDFED", label: "Warehouses",     labelFr: "Entrepôts" },
      ],
    },
    {
      title: "NOTIFICATIONS", titleFr: "NOTIFICATIONS", collapsible: true, defaultOpen: true,
      items: [
        { id: "notif-center",   icon: "\uD83D\uDD14", label: "Notifications center",   labelFr: "Centre de notifications" },
        { id: "notif-emails",   icon: "\u2709\uFE0F", label: "Notification emails",    labelFr: "Emails de notification" },
        { id: "notif-settings", icon: "\u2699\uFE0F", label: "Notifications settings", labelFr: "Parametres notifications" },
      ],
    },
  ],
};

const SIDEBAR_NOTIFICATIONS = {
  sections: [
    {
      title: "NOTIFICATIONS", titleFr: "NOTIFICATIONS", collapsible: false, defaultOpen: true,
      items: [
        { id: "notif-center",   icon: "\uD83D\uDD14", label: "Notifications center",   labelFr: "Centre de notifications" },
        { id: "notif-emails",   icon: "\u2709\uFE0F", label: "Notification emails",    labelFr: "Emails de notification" },
        { id: "notif-settings", icon: "\u2699\uFE0F", label: "Notifications settings", labelFr: "Parametres notifications" },
      ],
    },
  ],
};

const CONFIGS = {
  buy: SIDEBAR_BUY,
  sell: SIDEBAR_SELL,
  notifications: SIDEBAR_NOTIFICATIONS,
};

export default function DashboardSidebar({ activeTab, activeSection, onSectionChange, lang = "fr", user, company }) {
  const { isMobile, isTablet } = useResponsive();
  const config = CONFIGS[activeTab];

  // Profile tab has no sidebar
  if (activeTab === "profile" || !config) return null;

  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;

  // Tablet: collapsed icon-only sidebar
  if (isTablet) {
    return (
      <div style={{
        width: 60,
        background: T.card,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        paddingTop: 12,
        gap: 4,
        flexShrink: 0,
        overflowY: "auto",
      }}>
        {config.sections.flatMap(s => s.items).map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange?.(item.id)}
              title={getLabel(item)}
              style={{
                width: 44, height: 44, margin: "0 auto",
                borderRadius: T.radiusSm,
                background: active ? T.accentLight : "none",
                border: "none",
                fontSize: 18,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                transition: T.transitionFast,
              }}
              aria-label={getLabel(item)}
            >
              {item.icon}
              {item.badge && (
                <span style={{
                  position: "absolute", top: 2, right: 2,
                  width: 6, height: 6, borderRadius: "50%",
                  background: T.green,
                }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Mobile: no sidebar (handled by bottom tab bar in layout)
  if (isMobile) return null;

  // Desktop: full sidebar
  return (
    <div style={{
      width: 250,
      background: T.card,
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflowY: "auto",
      minHeight: "calc(100vh - 110px)",
    }}>
      {/* User card */}
      {user && (
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${T.borderLight}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.accent}88, #f59e0b88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 13, color: "#fff", flexShrink: 0,
          }}>
            {user.avatar || user.name?.[0] || "U"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: T.text, fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            {company && (
              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {company.name}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {config.sections.map((section) => (
        <SidebarSection
          key={section.title}
          section={section}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          lang={lang}
        />
      ))}
    </div>
  );
}

// ── Collapsible sidebar section ────────────────────────────────────
function SidebarSection({ section, activeSection, onSectionChange, lang }) {
  const [open, setOpen] = useState(section.defaultOpen !== false);

  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;
  const sectionTitle = lang === "fr" ? (section.titleFr || section.title) : section.title;

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Section header */}
      <button
        onClick={() => section.collapsible && setOpen(!open)}
        style={{
          width: "100%", textAlign: "left",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px",
          background: "none", border: "none",
          fontSize: 11, fontWeight: 700,
          color: T.textMuted,
          cursor: section.collapsible ? "pointer" : "default",
          fontFamily: T.font,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {sectionTitle}
        {section.collapsible && (
          <span style={{
            fontSize: 10,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: T.transitionFast,
            color: T.textMuted,
          }}>
            {"\u25BC"}
          </span>
        )}
      </button>

      {/* Items */}
      {open && (
        <div style={{ padding: "0 8px" }}>
          {section.items.map((item) => {
            const active = activeSection === item.id;
            return (
              <SidebarItem
                key={item.id}
                item={item}
                active={active}
                onClick={() => onSectionChange?.(item.id)}
                lang={lang}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Individual sidebar item ────────────────────────────────────────
function SidebarItem({ item, active, onClick, lang }) {
  const [hovered, setHovered] = useState(false);
  const getLabel = (item) => lang === "fr" ? (item.labelFr || item.label) : item.label;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left",
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px",
        borderRadius: T.radiusSm,
        background: active ? T.accentLight : (hovered ? T.bg : "none"),
        border: active ? `1px solid ${T.accent}20` : "1px solid transparent",
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? T.accent : T.text,
        cursor: "pointer",
        fontFamily: T.font,
        transition: T.transitionFast,
        minHeight: 40,
        position: "relative",
      }}
    >
      <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{getLabel(item)}</span>
      {item.badge && (
        <span style={{
          background: T.greenBg, color: T.greenText,
          fontSize: 9, fontWeight: 700,
          padding: "1px 5px", borderRadius: 3,
          letterSpacing: "0.03em",
        }}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

export { SIDEBAR_BUY, SIDEBAR_SELL, SIDEBAR_NOTIFICATIONS };
