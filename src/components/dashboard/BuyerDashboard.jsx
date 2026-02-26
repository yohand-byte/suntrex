import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { BRAND, fmt, ORDER_STATUS, MOCK_BUYER, useDashboardResponsive } from "./dashboardUtils";

// ── Reusable micro-components ─────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: BRAND.white, borderRadius: 12,
      padding: "18px 20px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: BRAND.gray, fontWeight: 500, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: BRAND.dark }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: BRAND.lightGray, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: `${color || BRAND.orange}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 10, fontSize: 12, color: trend >= 0 ? BRAND.green : BRAND.red, fontWeight: 600 }}>
          {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}% vs mois dernier
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, isMobile }) {
  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  if (isMobile) {
    return (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: BRAND.dark }}>{order.id}</div>
          <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.product}</div>
          <div style={{ fontSize: 11, color: BRAND.lightGray }}>{fmt.date(order.date)}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.dark }}>{fmt.price(order.amount)}</div>
          <span style={{
            display: "inline-block", marginTop: 4,
            padding: "2px 8px", borderRadius: 20,
            background: st.bg, color: st.color,
            fontSize: 10, fontWeight: 700,
          }}>{st.icon} {st.label}</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "120px 1fr 140px 100px 90px 100px",
      gap: 12, alignItems: "center",
      padding: "12px 16px",
      borderBottom: `1px solid ${BRAND.border}`,
      transition: "background 0.12s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ fontSize: 12, fontFamily: "monospace", color: BRAND.dark, fontWeight: 600 }}>{order.id}</div>
      <div>
        <div style={{ fontSize: 13, color: BRAND.dark, fontWeight: 500 }}>{order.product}</div>
        <div style={{ fontSize: 11, color: BRAND.lightGray }}>{order.seller}</div>
      </div>
      <div style={{ fontSize: 12, color: BRAND.gray }}>{fmt.date(order.date)}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.dark }}>{fmt.price(order.amount)}</div>
      <span style={{
        padding: "3px 10px", borderRadius: 20,
        background: st.bg, color: st.color,
        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", textAlign: "center",
      }}>{st.icon} {st.label}</span>
      <div>
        {order.tracking ? (
          <button style={{
            background: "none", border: `1px solid ${BRAND.border}`,
            borderRadius: 6, padding: "4px 10px",
            fontSize: 11, color: BRAND.blue, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            \uD83D\uDE9A Suivre
          </button>
        ) : (
          <span style={{ fontSize: 11, color: BRAND.lightGray }}>\u2014</span>
        )}
      </div>
    </div>
  );
}

function RFQCard({ rfq }) {
  return (
    <div style={{
      background: BRAND.white, border: `1px solid ${BRAND.border}`,
      borderRadius: 10, padding: "14px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: BRAND.lightGray }}>{rfq.id}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, marginTop: 2 }}>{rfq.product}</div>
        <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 1 }}>
          Qt\u00e9 : {fmt.number(rfq.qty)} \u00b7 Expire : {fmt.date(rfq.deadline)}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          background: BRAND.blueLight, color: BRAND.blue,
          borderRadius: 20, padding: "3px 12px",
          fontSize: 12, fontWeight: 700, marginBottom: 8, display: "inline-block",
        }}>
          {rfq.quotes} offre{rfq.quotes > 1 ? "s" : ""}
        </div>
        <div>
          <button style={{
            background: BRAND.orange, color: "#fff",
            border: "none", borderRadius: 7,
            padding: "6px 14px", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Voir les offres
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────
const BUYER_TABS = (data) => [
  { id: "overview", icon: "\uD83D\uDCCA", label: "Vue d'ensemble", badge: 0 },
  { id: "orders",   icon: "\uD83D\uDCE6", label: "Mes commandes",  badge: data.orders.filter(o => o.status === "pending" || o.status === "shipped").length },
  { id: "rfqs",     icon: "\uD83D\uDCCB", label: "Demandes RFQ",   badge: data.rfqs.length },
  { id: "saved",    icon: "\u2764\uFE0F", label: "Produits suivis", badge: 0 },
  { id: "chat",     icon: "\uD83D\uDCAC", label: "Messages",       badge: 1 },
  { id: "profile",  icon: "\uD83D\uDC64", label: "Mon profil",     badge: 0 },
];

// ── VIEWS ─────────────────────────────────────────────────────────────

function BuyerOverview({ data, isMobile }) {
  const stats = data.stats;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
        <StatCard icon="\uD83D\uDCE6" label="Commandes totales" value={stats.totalOrders} color={BRAND.blue} />
        <StatCard icon="\uD83D\uDCB6" label="Total d\u00e9pens\u00e9" value={fmt.price(stats.totalSpend)} color={BRAND.green} trend={12.4} />
        <StatCard icon="\u23F3" label="En cours" value={stats.pendingOrders} color={BRAND.amber} />
        <StatCard icon="\uD83D\uDCCB" label="RFQ actifs" value={stats.activeRFQs} color={BRAND.orange} />
      </div>

      {/* Recent orders + Saved products */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: 18 }}>
        {/* Recent orders */}
        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark }}>Commandes r\u00e9centes</div>
            <button style={{ background: "none", border: "none", color: BRAND.orange, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Voir tout \u2192</button>
          </div>
          {data.orders.slice(0, 4).map(o => <OrderRow key={o.id} order={o} isMobile={true} />)}
        </div>

        {/* Stats card + dispute alert */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
            borderRadius: 12, padding: 20, color: "#fff",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>D\u00e9pense moyenne</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt.price(stats.avgOrderValue)}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>par commande</div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(255,255,255,0.08)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Produits suivis</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{stats.savedItems} produits</div>
            </div>
          </div>

          {/* Dispute alert */}
          {data.orders.some(o => o.status === "disputed") && (
            <div style={{
              background: BRAND.redLight, border: `1px solid ${BRAND.red}33`,
              borderRadius: 10, padding: "14px 16px",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 20 }}>{"\u26A0\uFE0F"}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.red }}>Litige en cours</div>
                <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>ORD-2024-005 requiert votre r\u00e9ponse sous 48h</div>
                <button style={{
                  marginTop: 8, background: BRAND.red, color: "#fff",
                  border: "none", borderRadius: 6, padding: "5px 14px",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Traiter le litige \u2192
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuyerOrders({ data, isMobile }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? data.orders : data.orders.filter(o => o.status === filter);

  return (
    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
      {/* Status filters */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "pending", "paid", "shipped", "delivered", "disputed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 14px", borderRadius: 20,
            border: `1.5px solid ${filter === s ? BRAND.orange : BRAND.border}`,
            background: filter === s ? BRAND.orange : BRAND.white,
            color: filter === s ? "#fff" : BRAND.gray,
            fontSize: 12, fontWeight: filter === s ? 700 : 500,
            cursor: "pointer", fontFamily: "inherit",
            minHeight: 32,
          }}>
            {s === "all" ? "Toutes" : (ORDER_STATUS[s]?.label || s)}
          </button>
        ))}
      </div>

      {/* Header */}
      {!isMobile && (
        <div style={{
          display: "grid", gridTemplateColumns: "120px 1fr 140px 100px 90px 100px",
          gap: 12, padding: "10px 16px",
          background: BRAND.light, borderBottom: `1px solid ${BRAND.border}`,
          fontSize: 11, fontWeight: 700, color: BRAND.lightGray, textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          <span>N\u00b0 commande</span><span>Produit / Vendeur</span><span>Date</span><span>Montant</span><span>Statut</span><span>Actions</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: BRAND.lightGray }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDCED"}</div>
          Aucune commande trouv\u00e9e
        </div>
      ) : filtered.map(o => <OrderRow key={o.id} order={o} isMobile={isMobile} />)}
    </div>
  );
}

function BuyerSaved({ data, isMobile }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
      {data.saved.map(p => (
        <div key={p.id} style={{
          background: BRAND.white, border: `1px solid ${BRAND.border}`,
          borderRadius: 12, padding: "16px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.orange, textTransform: "uppercase" }}>{p.brand}</div>
            <button style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", padding: 0 }}>{"\u2764\uFE0F"}</button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark, lineHeight: 1.3 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: p.stock > 10 ? BRAND.green : BRAND.amber, fontWeight: 600 }}>
            {p.stock > 0 ? `\u2713 ${p.stock} en stock` : "\u2717 Rupture"}
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 8, borderTop: `1px solid ${BRAND.border}`,
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.dark }}>{fmt.price(p.price)}</div>
            <button style={{
              background: BRAND.orange, color: "#fff",
              border: "none", borderRadius: 7,
              padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              minHeight: 36,
            }}>
              Commander
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN BuyerDashboard ───────────────────────────────────────────────
export default function BuyerDashboard() {
  const { isMobile } = useDashboardResponsive();
  const [tab, setTab] = useState("overview");
  const data = MOCK_BUYER;

  const tabs = BUYER_TABS(data);

  const renderContent = () => {
    switch (tab) {
      case "overview": return <BuyerOverview data={data} isMobile={isMobile} />;
      case "orders":   return <BuyerOrders data={data} isMobile={isMobile} />;
      case "rfqs":     return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark }}>Demandes de devis (RFQ)</div>
            <button style={{ background: BRAND.orange, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
              + Nouvelle demande
            </button>
          </div>
          {data.rfqs.map(r => <RFQCard key={r.id} rfq={r} />)}
        </div>
      );
      case "saved":    return <BuyerSaved data={data} isMobile={isMobile} />;
      case "chat":     return (
        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: 40, textAlign: "center", color: BRAND.lightGray }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\uD83D\uDCAC"}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.dark }}>Messagerie int\u00e9gr\u00e9e</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Le composant SuntrexSupportChat sera int\u00e9gr\u00e9 ici</div>
        </div>
      );
      case "profile":  return (
        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: isMobile ? 20 : 28, maxWidth: 560 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark, marginBottom: 20 }}>Profil entreprise</div>
          {[
            ["Nom", data.user.name], ["Email", data.user.email],
            ["Soci\u00e9t\u00e9", data.company.name], ["TVA", data.company.vat],
            ["Pays", data.company.country], ["Type", data.company.type],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: 13, color: BRAND.gray, fontWeight: 500 }}>{k}</span>
              <span style={{ fontSize: 13, color: BRAND.dark, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <button style={{ marginTop: 20, background: BRAND.orange, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
            Modifier le profil
          </button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <DashboardLayout
      user={data.user}
      company={data.company}
      notifications={data.notifications}
      activeTab={tab}
      onTabChange={setTab}
      tabs={tabs}
      role="buyer"
    >
      {renderContent()}
    </DashboardLayout>
  );
}
