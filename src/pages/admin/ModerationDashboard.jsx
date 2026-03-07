import { useState, useMemo } from "react";
import useResponsive from "../../hooks/useResponsive";

var T = {
  bg: "#f7f8fa", card: "#ffffff",
  border: "#e8eaef", borderLight: "#f0f1f5",
  text: "#1a1d26", textSec: "#6b7280", textMuted: "#9ca3af",
  accent: "#E8700A",
  green: "#10b981", greenBg: "#ecfdf5",
  red: "#ef4444", redBg: "#fef2f2",
  yellow: "#f59e0b", yellowBg: "#fffbeb",
  blue: "#3b82f6", blueBg: "#eff6ff",
  purple: "#7c3aed", purpleBg: "#f5f3ff",
  radius: 10,
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Mock blocked messages with realistic scenarios
var MOCK_MESSAGES = [
  { id: "mod-1", senderId: "usr-012", senderName: "Pierre Leclerc", senderCompany: "SolarInstall FR", recipientId: "usr-034", recipientName: "Hans Muller", content: "Mon IBAN est FR76 3000 4012 3456 7890 1234 567, envoyez le paiement directement", reason: "iban_detected", reasonLabel: "IBAN detecte", score: 85, status: "blocked", date: "2026-03-07T14:30:00Z" },
  { id: "mod-2", senderId: "usr-045", senderName: "Marco Bianchi", senderCompany: "Italia Solar Srl", recipientId: "usr-078", recipientName: "Sophie Martin", content: "Appelez-moi au 06 12 34 56 78 pour discuter du prix hors plateforme", reason: "phone_detected", reasonLabel: "Numero de telephone", score: 72, status: "blocked", date: "2026-03-07T13:15:00Z" },
  { id: "mod-3", senderId: "usr-089", senderName: "Klaus Weber", senderCompany: "SunTech GmbH", recipientId: "usr-023", recipientName: "Antoine Dubois", content: "Paiement direct par virement bancaire SVP, je peux vous faire -10% si on evite la plateforme", reason: "payment_bypass", reasonLabel: "Paiement hors-plateforme", score: 90, status: "blocked", date: "2026-03-07T11:00:00Z" },
  { id: "mod-4", senderId: "usr-101", senderName: "Jan de Vries", senderCompany: "NL Solar BV", recipientId: "usr-056", recipientName: "Carlos Garcia", content: "Votre offre est ridicule, vous etes des arnaqueurs et des voleurs", reason: "inappropriate", reasonLabel: "Langage inapproprie", score: 68, status: "blocked", date: "2026-03-07T10:20:00Z" },
  { id: "mod-5", senderId: "usr-034", senderName: "Hans Muller", senderCompany: "Deutsche Solar AG", recipientId: "usr-067", recipientName: "Lisa Dupont", content: "Contactez-moi sur contactpro@gmail.com pour continuer les negotiations", reason: "email_detected", reasonLabel: "Email externe", score: 65, status: "blocked", date: "2026-03-07T09:45:00Z" },
  { id: "mod-6", senderId: "usr-056", senderName: "Carlos Garcia", senderCompany: "Iberia Solar SL", recipientId: "usr-089", recipientName: "Klaus Weber", content: "On peut se retrouver sur WhatsApp? Mon numero c'est +34 612 345 678", reason: "phone_detected", reasonLabel: "Numero de telephone", score: 70, status: "blocked", date: "2026-03-06T16:30:00Z" },
  { id: "mod-7", senderId: "usr-120", senderName: "Alessandro Romano", senderCompany: "Roma Energy", recipientId: "usr-045", recipientName: "Marco Bianchi", content: "Payez directement sur notre compte, je vais vous donner le RIB", reason: "payment_bypass", reasonLabel: "Paiement hors-plateforme", score: 88, status: "blocked", date: "2026-03-06T15:10:00Z" },
  { id: "mod-8", senderId: "usr-078", senderName: "Sophie Martin", senderCompany: "EcoSun France", recipientId: "usr-012", recipientName: "Pierre Leclerc", content: "Envoyez-moi les specs sur mon email perso sophie.m@hotmail.fr", reason: "email_detected", reasonLabel: "Email externe", score: 55, status: "approved", date: "2026-03-06T14:00:00Z" },
  { id: "mod-9", senderId: "usr-023", senderName: "Antoine Dubois", senderCompany: "Dubois Solar", recipientId: "usr-101", recipientName: "Jan de Vries", content: "Bande de crooks, je vais signaler votre societe", reason: "inappropriate", reasonLabel: "Langage inapproprie", score: 62, status: "blocked", date: "2026-03-06T11:30:00Z" },
  { id: "mod-10", senderId: "usr-155", senderName: "Nikolaos Papadopoulos", senderCompany: "Helios Solar GR", recipientId: "usr-034", recipientName: "Hans Muller", content: "Passez sur le site solardeals.com pour un meilleur prix", reason: "external_link", reasonLabel: "Lien externe", score: 58, status: "blocked", date: "2026-03-05T17:00:00Z" },
  { id: "mod-11", senderId: "usr-067", senderName: "Lisa Dupont", senderCompany: "GreenPower France", recipientId: "usr-120", recipientName: "Alessandro Romano", content: "On peut conclure en cash? Pas de facture, juste un virement", reason: "payment_bypass", reasonLabel: "Paiement hors-plateforme", score: 82, status: "blocked", date: "2026-03-05T15:20:00Z" },
  { id: "mod-12", senderId: "usr-034", senderName: "Hans Muller", senderCompany: "Deutsche Solar AG", recipientId: "usr-155", recipientName: "Nikolaos Papadopoulos", content: "Je peux vous envoyer une facture via mon compte PayPal hans.muller@paypal.me", reason: "payment_bypass", reasonLabel: "Paiement hors-plateforme", score: 78, status: "approved", date: "2026-03-05T12:00:00Z" },
];

var REASON_COLORS = {
  iban_detected: { color: T.red, bg: T.redBg },
  phone_detected: { color: T.yellow, bg: T.yellowBg },
  payment_bypass: { color: T.red, bg: T.redBg },
  inappropriate: { color: T.purple, bg: T.purpleBg },
  email_detected: { color: T.blue, bg: T.blueBg },
  external_link: { color: T.accent, bg: "#fff7ed" },
};

export default function ModerationDashboard() {
  var { isMobile } = useResponsive();
  var [messages, setMessages] = useState(MOCK_MESSAGES);
  var [filter, setFilter] = useState("blocked");
  var [expandedId, setExpandedId] = useState(null);

  var filtered = useMemo(function () {
    if (filter === "all") return messages;
    return messages.filter(function (m) { return m.status === filter; });
  }, [messages, filter]);

  var stats = useMemo(function () {
    var today = new Date().toISOString().slice(0, 10);
    var weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    return {
      blockedToday: messages.filter(function (m) { return m.status === "blocked" && m.date.slice(0, 10) === today; }).length,
      blockedWeek: messages.filter(function (m) { return m.status === "blocked" && m.date.slice(0, 10) >= weekAgo; }).length,
      blockedTotal: messages.filter(function (m) { return m.status === "blocked"; }).length,
      approvedTotal: messages.filter(function (m) { return m.status === "approved"; }).length,
      topReasons: (function () {
        var counts = {};
        messages.forEach(function (m) {
          counts[m.reasonLabel] = (counts[m.reasonLabel] || 0) + 1;
        });
        return Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      })(),
    };
  }, [messages]);

  function updateStatus(id, newStatus) {
    setMessages(function (prev) {
      return prev.map(function (m) { return m.id === id ? Object.assign({}, m, { status: newStatus }) : m; });
    });
  }

  return (
    <div style={{ fontFamily: T.font }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Bloques aujourd'hui", value: stats.blockedToday, color: T.red },
          { label: "Bloques cette semaine", value: stats.blockedWeek, color: T.yellow },
          { label: "Total bloques", value: stats.blockedTotal, color: T.accent },
          { label: "Faux positifs", value: stats.approvedTotal, color: T.green },
        ].map(function (s) {
          return (
            <div key={s.label} style={{ background: T.card, borderRadius: T.radius, padding: 16, border: "1px solid " + T.borderLight }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Top reasons */}
      <div style={{ background: T.card, borderRadius: T.radius, padding: 16, border: "1px solid " + T.borderLight, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>Top raisons de blocage</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {stats.topReasons.map(function (r) {
            var rc = REASON_COLORS[Object.keys(REASON_COLORS).find(function (k) {
              return MOCK_MESSAGES.some(function (m) { return m.reason === k && m.reasonLabel === r[0]; });
            }) || "payment_bypass"] || { color: T.textSec, bg: T.bg };
            return (
              <span key={r[0]} style={{ fontSize: 11, fontWeight: 600, color: rc.color, background: rc.bg, padding: "4px 10px", borderRadius: 6 }}>
                {r[0]} ({r[1]})
              </span>
            );
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { id: "blocked", label: "Bloques (" + stats.blockedTotal + ")" },
          { id: "approved", label: "Approuves (" + stats.approvedTotal + ")" },
          { id: "all", label: "Tout (" + messages.length + ")" },
        ].map(function (tab) {
          return (
            <button key={tab.id} onClick={function () { setFilter(tab.id); }} style={{
              padding: "6px 14px", borderRadius: 20,
              border: filter === tab.id ? "none" : "1px solid " + T.border,
              background: filter === tab.id ? T.text : T.card,
              color: filter === tab.id ? "#fff" : T.textSec,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Messages list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(function (msg) {
          var rc = REASON_COLORS[msg.reason] || { color: T.textSec, bg: T.bg };
          var expanded = expandedId === msg.id;
          return (
            <div key={msg.id} style={{
              background: T.card, borderRadius: T.radius,
              border: "1px solid " + (msg.score >= 80 ? T.red + "30" : T.borderLight),
              overflow: "hidden",
            }}>
              {/* Row header */}
              <div
                onClick={function () { setExpandedId(expanded ? null : msg.id); }}
                style={{
                  padding: isMobile ? "12px 14px" : "12px 20px",
                  display: "flex", alignItems: isMobile ? "flex-start" : "center",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 8 : 16, cursor: "pointer",
                }}
              >
                {/* Score */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: msg.score >= 70 ? T.redBg : msg.score >= 50 ? T.yellowBg : T.blueBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  color: msg.score >= 70 ? T.red : msg.score >= 50 ? T.yellow : T.blue,
                }}>
                  {msg.score}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{msg.senderName}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{msg.senderCompany}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>&#x2192; {msg.recipientName}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: expanded ? "normal" : "nowrap", maxWidth: expanded ? "none" : isMobile ? 250 : 500 }}>
                    {msg.content}
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: rc.color, background: rc.bg, padding: "2px 8px", borderRadius: 4 }}>
                    {msg.reasonLabel}
                  </span>
                  <span style={{ fontSize: 10, color: T.textMuted }}>
                    {new Date(msg.date).toLocaleDateString("fr-FR")}
                  </span>
                  <span style={{ fontSize: 11, color: T.textMuted, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                    &#x25BC;
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div style={{ padding: "0 20px 16px", borderTop: "1px solid " + T.borderLight }}>
                  <div style={{ padding: "12px 14px", borderRadius: 8, background: T.bg, marginTop: 12, marginBottom: 12, fontSize: 13, color: T.text, lineHeight: 1.6, fontStyle: "italic" }}>
                    "{msg.content}"
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginBottom: 12 }}>
                    <div><span style={{ color: T.textMuted }}>Expediteur:</span> <b>{msg.senderName}</b> ({msg.senderCompany})</div>
                    <div><span style={{ color: T.textMuted }}>Destinataire:</span> <b>{msg.recipientName}</b></div>
                    <div><span style={{ color: T.textMuted }}>Raison:</span> <span style={{ color: rc.color, fontWeight: 600 }}>{msg.reasonLabel}</span></div>
                    <div><span style={{ color: T.textMuted }}>Score:</span> <b style={{ color: msg.score >= 70 ? T.red : T.yellow }}>{msg.score}/100</b></div>
                    <div><span style={{ color: T.textMuted }}>Date:</span> {new Date(msg.date).toLocaleString("fr-FR")}</div>
                    <div><span style={{ color: T.textMuted }}>Statut:</span> {msg.status === "blocked" ? "Bloque" : msg.status === "approved" ? "Approuve" : msg.status}</div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {msg.status === "blocked" && (
                      <button onClick={function (e) { e.stopPropagation(); updateStatus(msg.id, "approved"); }} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: T.green, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                        Approuver (faux positif)
                      </button>
                    )}
                    {msg.status === "blocked" && (
                      <button onClick={function (e) { e.stopPropagation(); }} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: T.red, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                        Bannir l'utilisateur
                      </button>
                    )}
                    {msg.status === "approved" && (
                      <button onClick={function (e) { e.stopPropagation(); updateStatus(msg.id, "blocked"); }} style={{ padding: "7px 16px", borderRadius: 6, border: "1px solid " + T.border, background: T.card, color: T.textSec, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
                        Re-bloquer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 14 }}>
          Aucun message dans cette categorie.
        </div>
      )}
    </div>
  );
}
