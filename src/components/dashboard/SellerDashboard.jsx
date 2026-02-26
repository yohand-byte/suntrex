import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import { BRAND, fmt, ORDER_STATUS, STRIPE_STATUS, MOCK_SELLER, useDashboardResponsive } from "./dashboardUtils";

// ── StatCard (shared) ─────────────────────────────────────────────────
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

// ── Mini bar chart for revenue ────────────────────────────────────────
function RevenueChart({ data }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: "18px 20px" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark, marginBottom: 16 }}>Revenus mensuels</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {data.map((d, i) => {
          const h = Math.max(8, Math.round((d.value / max) * 100));
          const isLast = i === data.length - 1;
          return (
            <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: isLast ? 800 : 500, color: isLast ? BRAND.orange : BRAND.lightGray, whiteSpace: "nowrap" }}>
                {isLast ? fmt.price(d.value) : ""}
              </div>
              <div style={{
                width: "100%", maxWidth: 48, height: `${h}%`, minHeight: 4,
                background: isLast
                  ? `linear-gradient(to top, ${BRAND.orange}, ${BRAND.amber})`
                  : `${BRAND.dark}15`,
                borderRadius: "4px 4px 0 0",
                transition: "height 0.3s ease",
              }} />
              <div style={{ fontSize: 10, color: BRAND.lightGray, fontWeight: isLast ? 700 : 400 }}>{d.month}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stripe Connect Status Banner ──────────────────────────────────────
function StripeBanner({ status }) {
  const st = STRIPE_STATUS[status] || STRIPE_STATUS.not_started;
  if (status === "active") return null;
  return (
    <div style={{
      background: st.bg, border: `1px solid ${st.color}33`,
      borderRadius: 10, padding: "14px 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 200 }}>
        <span style={{ fontSize: 22 }}>{status === "pending" ? "\u26A0\uFE0F" : "\uD83D\uDCB3"}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: st.color }}>
            Paiements Stripe : {st.label}
          </div>
          <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
            {status === "not_started" && "Activez votre compte vendeur pour recevoir des paiements."}
            {status === "pending" && "Finalisez la v\u00e9rification de votre identit\u00e9 pour activer les virements."}
            {status === "restricted" && "Un probl\u00e8me n\u00e9cessite votre attention imm\u00e9diate."}
          </div>
        </div>
      </div>
      {st.cta && (
        <button style={{
          background: st.color, color: "#fff",
          border: "none", borderRadius: 8,
          padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          whiteSpace: "nowrap", fontFamily: "inherit", minHeight: 44,
        }}>
          {st.cta} \u2192
        </button>
      )}
    </div>
  );
}

// ── Listing row ───────────────────────────────────────────────────────
function ListingRow({ listing, isMobile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusConfig = {
    active:  { label: "Actif",     color: BRAND.green, bg: BRAND.greenLight },
    soldout: { label: "Rupture",   color: BRAND.red,   bg: BRAND.redLight },
    paused:  { label: "Paus\u00e9", color: BRAND.amber, bg: BRAND.amberLight },
    draft:   { label: "Brouillon", color: BRAND.gray,  bg: "#f1f5f9" },
  };
  const st = statusConfig[listing.status] || statusConfig.draft;

  if (isMobile) {
    return (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{listing.name}</div>
          <div style={{ fontSize: 11, color: BRAND.lightGray, fontFamily: "monospace" }}>{listing.sku}</div>
          <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{fmt.price(listing.price)}</span>
            <span style={{ fontSize: 11, color: listing.stock > 0 ? BRAND.green : BRAND.red }}>
              {listing.stock > 0 ? `${listing.stock} stock` : "Rupture"}
            </span>
          </div>
        </div>
        <span style={{ padding: "3px 9px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {st.label}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 80px 70px 60px 60px 90px",
      gap: 12, alignItems: "center",
      padding: "12px 16px",
      borderBottom: `1px solid ${BRAND.border}`,
      transition: "background 0.12s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.dark }}>{listing.name}</div>
        <div style={{ fontSize: 11, color: BRAND.lightGray, fontFamily: "monospace" }}>{listing.sku}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt.price(listing.price)}</div>
      <div style={{ fontSize: 12, color: listing.stock > 0 ? BRAND.green : BRAND.red, fontWeight: 600 }}>{listing.stock}</div>
      <div style={{ fontSize: 12, color: BRAND.gray }}>{listing.views}</div>
      <div style={{ fontSize: 12, color: BRAND.gray }}>{listing.orders}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ padding: "3px 9px", borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
          {st.label}
        </span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: `1px solid ${BRAND.border}`, borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: BRAND.gray, fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
          >{"\u22EF"}</button>
          {menuOpen && (
            <div style={{
              position: "absolute", right: 0, top: 32,
              background: BRAND.white, border: `1px solid ${BRAND.border}`,
              borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              zIndex: 50, minWidth: 150, overflow: "hidden",
            }}>
              {[
                { label: "\u270F\uFE0F Modifier", color: BRAND.dark },
                { label: "\u23F8 Mettre en pause", color: BRAND.dark },
                { label: "\uD83D\uDCCA Statistiques", color: BRAND.dark },
                { label: "\uD83D\uDDD1 Supprimer", color: BRAND.red },
              ].map(action => (
                <button key={action.label} onClick={() => setMenuOpen(false)} style={{
                  display: "block", width: "100%", padding: "9px 14px",
                  background: "none", border: "none",
                  textAlign: "left", fontSize: 13, color: action.color,
                  cursor: "pointer", fontFamily: "inherit",
                }}
                onMouseEnter={e => { e.target.style.background = BRAND.light; }}
                onMouseLeave={e => { e.target.style.background = "none"; }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Seller order row (with fee/net) ───────────────────────────────────
function SellerOrderRow({ order, isMobile }) {
  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  if (isMobile) {
    return (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 16px", borderBottom: `1px solid ${BRAND.border}`, gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: BRAND.dark }}>{order.id}</div>
          <div style={{ fontSize: 12, color: BRAND.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.buyer} \u00b7 {order.product}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, marginTop: 2 }}>{fmt.price(order.amount)}</div>
        </div>
        <span style={{
          padding: "3px 9px", borderRadius: 20,
          background: st.bg, color: st.color,
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {st.icon} {st.label}
        </span>
      </div>
    );
  }
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "110px 1fr 120px 90px 60px 70px 90px",
      gap: 12, alignItems: "center",
      padding: "12px 16px",
      borderBottom: `1px solid ${BRAND.border}`,
      transition: "background 0.12s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: BRAND.dark }}>{order.id}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{order.product}</div>
        <div style={{ fontSize: 11, color: BRAND.lightGray }}>{order.buyer}</div>
      </div>
      <span style={{ fontSize: 12, color: BRAND.gray }}>{fmt.date(order.date)}</span>
      <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt.price(order.amount)}</span>
      <span style={{ fontSize: 12, color: BRAND.red, fontWeight: 600 }}>-{fmt.price(order.fee)}</span>
      <span style={{ fontWeight: 700, fontSize: 13, color: BRAND.green }}>{fmt.price(order.net)}</span>
      <span style={{
        padding: "3px 9px", borderRadius: 20,
        background: st.bg, color: st.color,
        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", textAlign: "center",
      }}>
        {st.icon} {st.label}
      </span>
    </div>
  );
}

// ── Seller tabs ───────────────────────────────────────────────────────
const SELLER_TABS = (data) => [
  { id: "overview", icon: "\uD83D\uDCCA", label: "Vue d'ensemble",  badge: 0 },
  { id: "orders",   icon: "\uD83D\uDCE6", label: "Commandes",       badge: data.orders.filter(o => o.status === "pending").length },
  { id: "listings", icon: "\uD83C\uDFF7\uFE0F", label: "Mes annonces", badge: data.listings.filter(l => l.status === "soldout").length },
  { id: "payouts",  icon: "\uD83D\uDCB6", label: "Paiements",       badge: 0 },
  { id: "chat",     icon: "\uD83D\uDCAC", label: "Messages",        badge: 2 },
  { id: "stripe",   icon: "\uD83D\uDCB3", label: "Stripe Connect",  badge: 0 },
  { id: "profile",  icon: "\uD83C\uDFE2", label: "Mon entreprise",  badge: 0 },
];

// ── SellerOverview ────────────────────────────────────────────────────
function SellerOverview({ data, isMobile }) {
  const st = data.stats;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <StripeBanner status={data.stripeStatus} />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
        <StatCard icon="\uD83D\uDCB6" label="Revenus ce mois" value={fmt.price(st.monthRevenue)} color={BRAND.green} trend={14.8} />
        <StatCard icon="\uD83D\uDCE6" label="Commandes totales" value={fmt.number(st.totalOrders)} color={BRAND.blue} />
        <StatCard icon="\uD83D\uDCB8" label="En attente virement" value={fmt.price(st.pendingPayouts)} color={BRAND.amber} />
        <StatCard icon="\u2B50" label="Note vendeur" value={`${st.avgRating}/5`} color={BRAND.orange} sub={`${st.totalReviews} avis`} />
      </div>

      {/* Chart + Performance */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", gap: 18 }}>
        <RevenueChart data={data.monthlyRevenue} />

        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark }}>Performance</div>
          {[
            { label: "Annonces actives", value: st.activeListings, icon: "\uD83C\uDFF7\uFE0F" },
            { label: "Taux de conversion", value: `${st.conversionRate}%`, icon: "\uD83D\uDCC8" },
            { label: "Temps de r\u00e9ponse", value: st.responseTime, icon: "\u26A1" },
            { label: "CA total", value: fmt.price(st.totalRevenue), icon: "\uD83D\uDCB6" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${BRAND.border}` }}>
              <span style={{ fontSize: 13, color: BRAND.gray }}>
                <span style={{ marginRight: 6 }}>{row.icon}</span>{row.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: BRAND.dark }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: BRAND.dark }}>Derni\u00e8res commandes</div>
          <button style={{ background: "none", border: "none", color: BRAND.orange, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Voir tout \u2192</button>
        </div>
        {data.orders.slice(0, 4).map(o => <SellerOrderRow key={o.id} order={o} isMobile={isMobile} />)}
      </div>
    </div>
  );
}

// ── SellerListings ────────────────────────────────────────────────────
function SellerListings({ data, isMobile }) {
  const [search, setSearch] = useState("");
  const filtered = data.listings.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Rechercher une annonce..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <button style={{
          background: BRAND.orange, color: "#fff", border: "none",
          borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          whiteSpace: "nowrap", fontFamily: "inherit", minHeight: 44,
        }}>
          + Nouvelle annonce
        </button>
        <button style={{
          background: BRAND.white, color: BRAND.dark, border: `1px solid ${BRAND.border}`,
          borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer",
          fontFamily: "inherit", minHeight: 44,
        }}>
          \uD83D\uDCE5 Import XLSX
        </button>
      </div>

      {!isMobile && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 80px 70px 60px 60px 90px",
          gap: 12, padding: "10px 16px",
          background: BRAND.light, borderBottom: `1px solid ${BRAND.border}`,
          fontSize: 11, fontWeight: 700, color: BRAND.lightGray, textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          <span>Produit</span><span>Prix HT</span><span>Stock</span><span>Vues</span><span>Ventes</span><span>Actions</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: BRAND.lightGray }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDD0D"}</div>
          Aucune annonce trouv\u00e9e
        </div>
      ) : filtered.map(l => <ListingRow key={l.id} listing={l} isMobile={isMobile} />)}
    </div>
  );
}

// ── SellerPayouts ─────────────────────────────────────────────────────
function SellerPayouts({ data, isMobile }) {
  const paidTotal = data.payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
        <StatCard icon="\u23F3" label="En attente" value={fmt.price(data.stats.pendingPayouts)} color={BRAND.amber} />
        <StatCard icon="\u2705" label="Vers\u00e9 ce mois" value={fmt.price(paidTotal)} color={BRAND.green} />
        <StatCard icon="\uD83D\uDCB6" label="Total vers\u00e9" value={fmt.price(Math.round(data.stats.totalRevenue * 0.94))} color={BRAND.blue} />
      </div>

      <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BRAND.border}`, fontWeight: 700, fontSize: 14, color: BRAND.dark }}>
          Historique des virements
        </div>
        {data.payouts.map((p, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr 120px 100px 120px",
            gap: 12, alignItems: "center",
            padding: "14px 20px",
            borderBottom: `1px solid ${BRAND.border}`,
          }}>
            {isMobile ? (
              <>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt.price(p.amount)}</div>
                  <div style={{ fontSize: 11, color: BRAND.lightGray }}>{fmt.date(p.date)} \u00b7 {p.ref}</div>
                </div>
                <span style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: p.status === "paid" ? BRAND.greenLight : BRAND.amberLight,
                  color: p.status === "paid" ? BRAND.green : BRAND.amber,
                  fontSize: 11, fontWeight: 700,
                }}>
                  {p.status === "paid" ? "\u2705 Re\u00e7u" : "\u23F3 En cours"}
                </span>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: BRAND.lightGray }}>{p.ref}</div>
                <div style={{ fontSize: 13, color: BRAND.gray }}>{fmt.date(p.date)}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: BRAND.dark }}>{fmt.price(p.amount)}</div>
                <span style={{
                  padding: "4px 12px", borderRadius: 20,
                  background: p.status === "paid" ? BRAND.greenLight : BRAND.amberLight,
                  color: p.status === "paid" ? BRAND.green : BRAND.amber,
                  fontSize: 12, fontWeight: 700, textAlign: "center",
                }}>
                  {p.status === "paid" ? "\u2705 Re\u00e7u" : "\u23F3 En cours"}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Commission explainer */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
        borderRadius: 12, padding: "18px 22px", color: "#fff",
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{"\uD83D\uDCA1"} Commission SUNTREX</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
          SUNTREX pr\u00e9l\u00e8ve une commission de <strong style={{ color: BRAND.amber }}>6%</strong> sur chaque vente \u2014
          soit 5% en dessous de nos concurrents (sun.store : ~11%). Aucun abonnement mensuel.
          Vous ne payez qu{"'"}en cas de vente.
        </div>
      </div>
    </div>
  );
}

// ── SellerStripePanel ─────────────────────────────────────────────────
function SellerStripePanel({ status }) {
  const st = STRIPE_STATUS[status] || STRIPE_STATUS.not_started;
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: isMobile ? 20 : 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 40 }}>{"\uD83D\uDCB3"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: BRAND.dark }}>Stripe Connect</div>
            <div style={{ fontSize: 13, color: BRAND.gray, marginTop: 2 }}>Gestion de vos paiements et virements</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: st.bg, borderRadius: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: st.color }} />
          <div style={{ fontWeight: 700, fontSize: 14, color: st.color }}>{st.label}</div>
        </div>

        {[
          { icon: "\u2705", label: "Recevoir des paiements", active: status === "active" },
          { icon: status === "active" ? "\u2705" : "\u23F3", label: "Virements bancaires", active: status === "active" },
          { icon: "\u2705", label: "Protection disputes Stripe", active: true },
          { icon: "\u2705", label: "3D Secure / SCA Europe", active: true },
          { icon: "\u2705", label: "Rapports financiers", active: status === "active" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${BRAND.border}` }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 13, color: item.active ? BRAND.dark : BRAND.lightGray, fontWeight: item.active ? 500 : 400 }}>
              {item.label}
            </span>
          </div>
        ))}

        {st.cta && (
          <button style={{
            marginTop: 20, width: "100%",
            background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.amber})`,
            color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 0", fontWeight: 800, fontSize: 15, cursor: "pointer",
            fontFamily: "inherit", minHeight: 48,
          }}>
            {st.cta} \u2192
          </button>
        )}
      </div>
    </div>
  );
}

// ── Seller Orders (with fee/net columns) ──────────────────────────────
function SellerOrders({ data, isMobile }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? data.orders : data.orders.filter(o => o.status === filter);

  return (
    <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "pending", "paid", "shipped", "delivered", "disputed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "5px 14px", borderRadius: 20,
            border: `1.5px solid ${filter === s ? BRAND.orange : BRAND.border}`,
            background: filter === s ? BRAND.orange : BRAND.white,
            color: filter === s ? "#fff" : BRAND.gray,
            fontSize: 12, fontWeight: filter === s ? 700 : 500,
            cursor: "pointer", fontFamily: "inherit", minHeight: 32,
          }}>
            {s === "all" ? "Toutes" : (ORDER_STATUS[s]?.label || s)}
          </button>
        ))}
      </div>

      {!isMobile && (
        <div style={{
          display: "grid", gridTemplateColumns: "110px 1fr 120px 90px 60px 70px 90px",
          gap: 12, padding: "10px 16px",
          background: BRAND.light, borderBottom: `1px solid ${BRAND.border}`,
          fontSize: 11, fontWeight: 700, color: BRAND.lightGray, textTransform: "uppercase", letterSpacing: 0.5,
        }}>
          <span>N\u00b0</span><span>Produit / Acheteur</span><span>Date</span><span>Montant</span><span>Comm.</span><span>Net</span><span>Statut</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: BRAND.lightGray }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{"\uD83D\uDCED"}</div>
          Aucune commande trouv\u00e9e
        </div>
      ) : filtered.map(o => <SellerOrderRow key={o.id} order={o} isMobile={isMobile} />)}
    </div>
  );
}

// ── MAIN SellerDashboard ──────────────────────────────────────────────
export default function SellerDashboard() {
  const { isMobile } = useDashboardResponsive();
  const [tab, setTab] = useState("overview");
  const data = MOCK_SELLER;
  const tabs = SELLER_TABS(data);

  const renderContent = () => {
    switch (tab) {
      case "overview": return <SellerOverview data={data} isMobile={isMobile} />;
      case "orders":   return <SellerOrders data={data} isMobile={isMobile} />;
      case "listings": return <SellerListings data={data} isMobile={isMobile} />;
      case "payouts":  return <SellerPayouts data={data} isMobile={isMobile} />;
      case "stripe":   return <SellerStripePanel status={data.stripeStatus} />;
      case "chat":     return (
        <div style={{ background: BRAND.white, borderRadius: 12, border: `1px solid ${BRAND.border}`, padding: 40, textAlign: "center", color: BRAND.lightGray }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\uD83D\uDCAC"}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: BRAND.dark }}>Messagerie int\u00e9gr\u00e9e</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>SuntrexSupportChat + messages acheteurs ici</div>
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
      role="seller"
    >
      {renderContent()}
    </DashboardLayout>
  );
}

// Fix: isMobile reference in SellerStripePanel
var isMobile = typeof window !== "undefined" && window.innerWidth < 768;
