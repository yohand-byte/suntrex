import React, { useState } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import EmptyState from "../shared/EmptyState";
import { useDashboard } from "../DashboardLayout";
import { MOCK_BUYER, MOCK_SELLER } from "../dashboardUtils";

const ALL_NOTIFS = [...MOCK_BUYER.notifications, ...MOCK_SELLER.notifications].sort((a, b) => {
  const parseTime = (t) => {
    if (t.includes("h")) return parseInt(t) * 60;
    if (t.includes("j")) return parseInt(t) * 1440;
    if (t.includes("s")) return parseInt(t) * 10080;
    return parseInt(t);
  };
  return parseTime(a.time) - parseTime(b.time);
});

const NOTIF_ICONS = {
  order: "\uD83D\uDCE6", delivery: "\uD83D\uDE9A", payment: "\uD83D\uDCB3",
  dispute: "\u26A0\uFE0F", payout: "\uD83D\uDCB0", quote: "\uD83D\uDCCB",
  price: "\uD83D\uDCCA", kyc: "\u2705",
};

export default function NotificationsCenter() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();
  const [notifications, setNotifications] = useState(ALL_NOTIFS);
  const [filter, setFilter] = useState("all");

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = filter === "all" ? notifications : notifications.filter(n => !n.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, fontFamily: T.font, margin: 0 }}>
          {lang === "fr" ? "Centre de notifications" : "Notifications center"}
          {unreadCount > 0 && (
            <span style={{ marginLeft: 8, background: T.red, color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 700, verticalAlign: "middle" }}>
              {unreadCount}
            </span>
          )}
        </h1>
        <button onClick={markAllRead} style={{
          background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
          padding: "8px 14px", fontSize: 12, fontWeight: 600, color: T.accent,
          cursor: "pointer", fontFamily: T.font,
        }}>
          {lang === "fr" ? "Tout marquer comme lu" : "Mark all read"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { id: "all", label: "All", labelFr: "Tout" },
          { id: "unread", label: "Unread", labelFr: "Non lus" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
            background: filter === tab.id ? T.text : T.card,
            color: filter === tab.id ? "#fff" : T.textSec,
            border: filter === tab.id ? "none" : `1px solid ${T.border}`,
            borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font, minHeight: 34,
          }}>
            {lang === "fr" ? tab.labelFr : tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={"\uD83D\uDD14"} title={lang === "fr" ? "Aucune notification" : "No notifications"} description={lang === "fr" ? "Vous etes a jour !" : "You're all caught up!"} />
      ) : (
        <div style={{ background: T.card, borderRadius: T.radius, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {filtered.map((n, idx) => (
            <div key={n.id} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              padding: "14px 20px",
              background: n.read ? "transparent" : T.accentLight,
              borderBottom: idx < filtered.length - 1 ? `1px solid ${T.borderLight}` : "none",
              cursor: "pointer",
              transition: T.transitionFast,
            }}
            onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
            >
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{NOTIF_ICONS[n.type] || "\uD83D\uDD14"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.4 }}>{n.msg}</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, marginTop: 4 }}>
                  {lang === "fr" ? "il y a" : ""} {n.time} {lang !== "fr" ? "ago" : ""}
                </div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
