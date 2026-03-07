import { useState, useRef, useEffect } from "react";
import { T } from "../tokens";
import { useResponsive } from "../shared/useResponsive";
import { useDashboard } from "../DashboardLayout";

const MONO = "'JetBrains Mono', 'SF Mono', monospace";

// ── SUNTREX Commission Rates (official — Appendix 2, Fees T&C 01.01.2026) ──
const COMMISSION = {
  solar_panels: { label: "Solar Panels", labelFr: "Panneaux solaires", icon: "\u2600\uFE0F", tiers: [
    { min: 150000, label: "> 150k \u20AC", rate: 0.0080 },
    { min: 80000, label: "80k \u2013 150k \u20AC", rate: 0.0124 },
    { min: 25000, label: "25k \u2013 80k \u20AC", rate: 0.0172 },
    { min: 10000, label: "10k \u2013 25k \u20AC", rate: 0.0215 },
    { min: 5000, label: "5k \u2013 10k \u20AC", rate: 0.0262 },
    { min: 0, label: "< 5k \u20AC", rate: 0.0284 },
  ]},
  inverters_storage: { label: "Inverters & Storage", labelFr: "Onduleurs & Stockage", icon: "\u26A1", tiers: [
    { min: 150000, label: "> 150k \u20AC", rate: 0.0098 },
    { min: 80000, label: "80k \u2013 150k \u20AC", rate: 0.0170 },
    { min: 25000, label: "25k \u2013 80k \u20AC", rate: 0.0248 },
    { min: 10000, label: "10k \u2013 25k \u20AC", rate: 0.0298 },
    { min: 5000, label: "5k \u2013 10k \u20AC", rate: 0.0347 },
    { min: 0, label: "< 5k \u20AC", rate: 0.0379 },
  ]},
  other: { label: "Other categories", labelFr: "Autres cat\u00E9gories", icon: "\uD83D\uDD27", tiers: [
    { min: 150000, label: "> 150k \u20AC", rate: 0.0113 },
    { min: 80000, label: "80k \u2013 150k \u20AC", rate: 0.0196 },
    { min: 25000, label: "25k \u2013 80k \u20AC", rate: 0.0286 },
    { min: 10000, label: "10k \u2013 25k \u20AC", rate: 0.0345 },
    { min: 5000, label: "5k \u2013 10k \u20AC", rate: 0.0400 },
    { min: 0, label: "< 5k \u20AC", rate: 0.0464 },
  ]},
};

function calcComm(value, cat = "inverters_storage") {
  const c = COMMISSION[cat] || COMMISSION.other;
  const tier = c.tiers.find(t => value >= t.min) || c.tiers[c.tiers.length - 1];
  return {
    rate: tier.rate,
    ratePct: (tier.rate * 100).toFixed(2),
    amount: Math.round(value * tier.rate * 100) / 100,
    tier: tier.label,
    net: Math.round(value * (1 - tier.rate) * 100) / 100,
  };
}

// ── Mock invoices ──
const MOCK_INVOICES = {
  email: "yohan.d@qualiwatt.com",
  unpaid: [],
  paid: [
    { id: "3P_2026/00005710/02/31470", invoice_for: "Stripe (Secure Payment)", amount: 479.36,
      billing_date: "2026-03-01", due_date: "2026-03-01", status: "paid",
      transactions: [
        { nr: "OBuWje5X", amount: 80.08, date: "2026-02-02" },
        { nr: "D4ROpUpP", amount: 78.57, date: "2026-02-04" },
        { nr: "wpT5sgv0", amount: 156.29, date: "2026-02-17" },
        { nr: "kj8OZ3Fi", amount: 43.15, date: "2026-02-20" },
        { nr: "6pgVaXg9", amount: 42.74, date: "2026-02-19" },
        { nr: "wBQrssXX", amount: 27.10, date: "2026-02-23" },
        { nr: "VjFPjRet", amount: 51.43, date: "2026-02-23" },
      ],
    },
    { id: "3P_2026/00005547/01/31470", invoice_for: "Stripe (Secure Payment)", amount: 565.22,
      billing_date: "2026-02-01", due_date: "2026-02-01", status: "paid",
      transactions: [
        { nr: "JTfJW5Kg", amount: 312.40, date: "2026-01-15" },
        { nr: "R8mNqL2x", amount: 252.82, date: "2026-01-28" },
      ],
    },
    { id: "3P_2025/00005418/12/31470", invoice_for: "Stripe (Secure Payment)", amount: 226.12,
      billing_date: "2026-01-01", due_date: "2026-01-01", status: "paid",
      transactions: [
        { nr: "UlsbkzsJ", amount: 226.12, date: "2025-12-18" },
      ],
    },
  ],
};

// ── Sub-components ──
function SmallBadge({ children, color = T.green, bg, border, dot, style: s }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color,
      background: bg || `${color}10`, padding: "5px 12px", borderRadius: 20,
      border: `1.5px solid ${border || `${color}25`}`, whiteSpace: "nowrap", ...s }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />}
      {children}
    </span>
  );
}

function Toast({ message, visible }) {
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      padding: "12px 24px", background: "#1b1e2b", color: "#fff", borderRadius: 10,
      fontSize: 13, fontWeight: 600, fontFamily: T.font,
      boxShadow: "0 8px 30px rgba(0,0,0,0.18)", opacity: visible ? 1 : 0,
      transition: "all .3s", zIndex: 999, display: "flex", alignItems: "center", gap: 8,
      pointerEvents: visible ? "auto" : "none" }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: T.green,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>\u2713</span>
      {message}
    </div>
  );
}

function InvoiceCard({ inv, lang }) {
  const [expanded, setExpanded] = useState(false);
  const [dlOpen, setDlOpen] = useState(false);
  const dlRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dlRef.current && !dlRef.current.contains(e.target)) setDlOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const txCount = inv.transactions.length;
  const firstTx = inv.transactions[0];
  const moreTx = txCount > 1 ? txCount - 1 : 0;

  return (
    <div style={{
      background: T.card, borderRadius: T.radiusLg, marginBottom: 12, overflow: "hidden",
      border: expanded ? `2px solid ${T.blue}` : `1px solid ${T.border}`,
      boxShadow: expanded ? "0 4px 20px rgba(37,99,235,0.08)" : T.shadow,
      transition: "border-color .2s, box-shadow .2s",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px", borderBottom: `1px solid ${T.borderLight}` }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>
          {lang === "fr" ? "Facture" : "Invoice"} {inv.id}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Download dropdown */}
          <div ref={dlRef} style={{ position: "relative" }}>
            <button onClick={() => setDlOpen(!dlOpen)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", background: T.card, border: `1.5px solid ${T.green}`,
              borderRadius: T.radiusSm, fontSize: 12.5, fontWeight: 600, color: T.green,
              cursor: "pointer", fontFamily: T.font, transition: "all .15s",
            }}>
              {lang === "fr" ? "T\u00E9l\u00E9charger" : "Download"}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {dlOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 160,
                background: T.card, border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
                boxShadow: T.shadowLg, zIndex: 50, overflow: "hidden",
              }}>
                <button onClick={() => setDlOpen(false)} style={{
                  width: "100%", padding: "10px 14px", border: "none", background: "transparent",
                  fontSize: 13, fontFamily: T.font, color: T.text, cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                  transition: "background .1s",
                }} onMouseEnter={e => e.currentTarget.style.background = T.bg}
                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: T.green }}>commission...</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Expand/collapse */}
          <button onClick={() => setExpanded(!expanded)} style={{
            width: 34, height: 34, borderRadius: T.radiusSm,
            border: `1.5px solid ${expanded ? T.accent : T.border}`,
            background: expanded ? T.accentLight : T.card,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .2s",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={expanded ? T.accent : T.textMuted} strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.7fr 0.9fr 0.9fr 0.6fr 1.3fr",
        padding: "14px 20px", gap: 8, alignItems: "center",
        borderBottom: expanded ? `1px solid ${T.border}` : "none" }}>
        <div>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
            {lang === "fr" ? "Facture pour :" : "Invoice for:"}
          </div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500, lineHeight: 1.3 }}>{inv.invoice_for}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
            {lang === "fr" ? "Montant" : "Amount"}
          </div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 700 }}>{inv.amount.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
            {lang === "fr" ? "Date facturation" : "Billing date"}
          </div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{fmtDate(inv.billing_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
            {lang === "fr" ? "\u00C9ch\u00E9ance" : "Due date"}
          </div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{fmtDate(inv.due_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>Status</div>
          <SmallBadge
            color={inv.status === "paid" ? T.greenText : T.redText}
            bg={inv.status === "paid" ? T.greenBg : T.redBg}
            border={inv.status === "paid" ? `${T.green}30` : `${T.red}30`}
            style={{ fontSize: 11, padding: "3px 10px" }}>
            {inv.status === "paid" ? (lang === "fr" ? "Pay\u00E9e" : "Paid") : (lang === "fr" ? "Impay\u00E9e" : "Unpaid")}
          </SmallBadge>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.textMuted, fontWeight: 600, marginBottom: 2 }}>
            Transaction{txCount > 1 ? "(s)" : ""}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {firstTx && (
              <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 6,
                border: `1.5px solid ${T.green}30`, background: T.greenBg,
                fontSize: 11.5, fontWeight: 600, fontFamily: MONO, color: T.greenText, cursor: "pointer" }}>
                #{firstTx.nr}
              </span>
            )}
            {moreTx > 0 && (
              <span onClick={() => setExpanded(!expanded)} style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 6,
                border: `1.5px solid ${T.border}`, background: T.card,
                fontSize: 11.5, fontWeight: 600, color: T.textSec, cursor: "pointer",
                transition: "all .15s" }}>
                +{moreTx}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded transaction list */}
      {expanded && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 80px",
            padding: "10px 20px", gap: 8, background: T.bg,
            borderBottom: `1px solid ${T.border}`,
            fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <span>#</span>
            <span>Transaction nr.</span>
            <span>{lang === "fr" ? "Montant" : "Amount"}</span>
            <span>Date</span>
            <span></span>
          </div>
          {inv.transactions.map((tx, i) => (
            <div key={tx.nr} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 80px",
              padding: "12px 20px", gap: 8, alignItems: "center",
              borderBottom: i < inv.transactions.length - 1 ? `1px solid ${T.borderLight}` : "none",
              fontSize: 13.5, transition: "background .1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ color: T.textMuted, fontWeight: 600, fontSize: 13 }}>{i + 1}.</span>
              <span style={{ fontWeight: 500, color: T.text }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>Transaction nr. </span>
                <span style={{ fontWeight: 700, fontFamily: MONO }}>{tx.nr}</span>
              </span>
              <span style={{ fontWeight: 500, color: T.text }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>{lang === "fr" ? "Montant : " : "Amount: "}</span>
                <span style={{ fontWeight: 700 }}>{tx.amount.toFixed(2)}</span>
              </span>
              <span style={{ fontWeight: 500, color: T.text }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>Date: </span>
                <span style={{ fontWeight: 600 }}>{fmtDate(tx.date)}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <a href="#" style={{ color: T.blue, fontSize: 12.5, fontWeight: 600, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 3 }}>
                  {lang === "fr" ? "D\u00E9tails" : "Details"}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </a>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──
export default function InvoicesAndFees() {
  const { isMobile } = useResponsive();
  const { lang } = useDashboard();

  const [subTab, setSubTab] = useState("unpaid");
  const [showFees, setShowFees] = useState(false);
  const [simCat, setSimCat] = useState("inverters_storage");
  const [simVal, setSimVal] = useState(25000);
  const [sort, setSort] = useState("newest");
  const [invoiceEmail, setInvoiceEmail] = useState(MOCK_INVOICES.email);
  const [toast, setToast] = useState(false);

  const r = calcComm(simVal, simCat);
  const invoices = subTab === "unpaid" ? MOCK_INVOICES.unpaid : MOCK_INVOICES.paid;
  const sorted = [...invoices].sort((a, b) =>
    sort === "newest" ? new Date(b.billing_date) - new Date(a.billing_date) : new Date(a.billing_date) - new Date(b.billing_date)
  );

  const fr = lang === "fr";

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 800, color: T.text, fontFamily: T.font, margin: 0 }}>
          {fr ? "Factures & Frais" : "Invoices & Fees"}
        </h1>
        <button onClick={() => setShowFees(!showFees)} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
          background: T.card, border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
          fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: T.font, boxShadow: T.shadow,
        }}>
          {fr ? "Grille tarifaire" : "Fees T&C"}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
        </button>
      </div>

      <SmallBadge color={T.greenText} bg={T.greenBg} border={`${T.green}30`} style={{ marginBottom: 22 }}>
        {fr ? "Votre compte est approuv\u00E9 pour vendre" : "Your account status: Approved to sell"}
      </SmallBadge>

      {/* Invoice email */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          {fr ? "Adresse email de r\u00E9ception des factures" : "Email address where invoices will be sent"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div style={{ maxWidth: 300 }}>
          <input type="email" value={invoiceEmail} onChange={e => setInvoiceEmail(e.target.value)} style={{
            width: "100%", boxSizing: "border-box", height: 44, padding: "0 14px",
            border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14,
            fontFamily: T.font, color: T.text, background: "#fff", outline: "none",
          }} />
        </div>
        <button onClick={() => { setToast(true); setTimeout(() => setToast(false), 2500); }} style={{
          marginTop: 12, padding: "10px 22px", borderRadius: T.radiusSm,
          background: T.accent, color: "#fff", border: "none", fontSize: 13.5,
          fontWeight: 700, cursor: "pointer", fontFamily: T.font,
        }}>
          {fr ? "Enregistrer" : "Save changes"}
        </button>
      </div>

      {/* Unpaid / Paid sub-tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${T.borderLight}`, marginBottom: 18 }}>
        {["unpaid", "paid"].map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            padding: "12px 22px", border: "none",
            borderBottom: subTab === t ? `2.5px solid ${T.blue}` : "2.5px solid transparent",
            background: "transparent", cursor: "pointer", fontFamily: T.font, fontSize: 14,
            fontWeight: subTab === t ? 700 : 500, color: subTab === t ? T.text : T.textSec,
            transition: "all .15s", display: "flex", alignItems: "center", gap: 5,
          }}>
            {t === "unpaid" ? (fr ? "Impay\u00E9es" : "Unpaid") : (fr ? "Pay\u00E9es" : "Paid")}
          </button>
        ))}
      </div>

      {/* Sort */}
      {invoices.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            padding: "7px 30px 7px 14px", border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
            fontSize: 12.5, fontFamily: T.font, color: T.textSec, background: T.card,
            cursor: "pointer", outline: "none", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%239ca3af'%3E%3Cpath d='M2 3l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
          }}>
            <option value="newest">{fr ? "Plus r\u00E9centes" : "Sort from newest"}</option>
            <option value="oldest">{fr ? "Plus anciennes" : "Sort from oldest"}</option>
          </select>
        </div>
      )}

      {/* Invoice list or empty state */}
      {invoices.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>\uD83C\uDF89</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: T.text, margin: "0 0 8px" }}>
            {fr ? "Tous vos paiements sont \u00E0 jour !" : "All your payments are up to date!"}
          </h3>
          <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
            {fr
              ? "Bonne nouvelle ! Vous n\u2019avez aucune facture impay\u00E9e. Vos finances sont en ordre, profitez de la vente sur SUNTREX."
              : "Great news! You have no outstanding invoices to worry about. Your financials are all sorted, so sit back, relax, and enjoy selling on SUNTREX."}
          </p>
        </div>
      ) : (
        <div>
          {sorted.map(inv => <InvoiceCard key={inv.id} inv={inv} lang={lang} />)}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 18 }}>
            <button style={{ width: 32, height: 32, borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
              background: T.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <input value="1" readOnly style={{ width: 40, height: 32, textAlign: "center",
              border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 13,
              fontFamily: T.font, color: T.text, outline: "none" }} />
            <span style={{ fontSize: 13, color: T.textSec }}>{fr ? "sur" : "of"} 1</span>
            <button style={{ width: 32, height: 32, borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
              background: T.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Fees T&C panel ── */}
      {showFees && (
        <div style={{ marginTop: 28 }}>
          <div style={{ height: 1, background: T.border, margin: "0 0 24px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: T.text, margin: 0 }}>
                {fr ? "Grille de commissions \u2014 SUNTREX" : "Commission Tables \u2014 SUNTREX"}
              </h3>
              <p style={{ fontSize: 11.5, color: T.textSec, margin: "4px 0 0" }}>
                {fr ? "Annexe 2 \u2014 Conditions tarifaires (01.01.2026)" : "Appendix 2 \u2014 Fees T&C (01.01.2026)"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <SmallBadge color={T.greenText} bg={T.greenBg} border={`${T.green}30`} dot={T.green}>
                {fr ? "Parmi les plus bas du march\u00E9" : "Among the lowest on the market"}
              </SmallBadge>
              <SmallBadge color={T.accent} bg={T.accentLight} border={`${T.accent}30`}>
                {fr ? "0\u20AC minimum/mois" : "\u20AC0 minimum/month"}
              </SmallBadge>
            </div>
          </div>

          {/* Commission tables by category */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {Object.entries(COMMISSION).map(([key, cat]) => (
              <div key={key} style={{ borderRadius: T.radiusLg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                <div style={{ padding: "11px 16px", background: T.bg, borderBottom: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 17 }}>{cat.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                    {fr ? cat.labelFr : cat.label}
                  </span>
                </div>
                {/* Table header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px",
                  padding: "8px 16px", gap: 8, borderBottom: `1px solid ${T.borderLight}`,
                  fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <span>{fr ? "Valeur transaction" : "Transaction value"}</span>
                  <span style={{ textAlign: "right", color: T.accent }}>SUNTREX</span>
                </div>
                {/* Tiers */}
                {cat.tiers.map((tier, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px",
                    padding: "9px 16px", gap: 8,
                    borderBottom: i < cat.tiers.length - 1 ? `1px solid ${T.borderLight}` : "none",
                    fontSize: 13, alignItems: "center" }}>
                    <span style={{ color: T.text, fontWeight: 500 }}>{tier.label}</span>
                    <span style={{ textAlign: "right", color: T.accent, fontWeight: 800, fontFamily: MONO, fontSize: 12.5 }}>
                      {(tier.rate * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Monthly minimum fee */}
          <div style={{ padding: "14px 20px", background: "linear-gradient(135deg, #0f172a, #1e293b)",
            borderRadius: T.radiusLg, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {fr ? "Frais mensuels minimum" : "Monthly minimum fee"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                {fr ? "Aucun minimum requis \u2014 vous ne payez que sur vos ventes" : "No minimum required \u2014 you only pay on your sales"}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.accent, fontWeight: 700 }}>SUNTREX</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>\u20AC0</div>
            </div>
          </div>

          {/* Commission simulator */}
          <div style={{ padding: isMobile ? 16 : 20, background: T.accentLight, borderRadius: T.radiusLg,
            border: `1.5px solid ${T.accent}30` }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: "0 0 14px" }}>
              {fr ? "\uD83E\uDDEE Simulateur de commission" : "\uD83E\uDDEE Commission simulator"}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: "block", marginBottom: 5 }}>
                  {fr ? "Cat\u00E9gorie produit" : "Product category"}
                </label>
                <select value={simCat} onChange={e => setSimCat(e.target.value)} style={{
                  width: "100%", padding: "9px 12px", border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
                  fontSize: 13, fontFamily: T.font, color: T.text, background: "#fff",
                  cursor: "pointer", outline: "none", boxSizing: "border-box",
                }}>
                  {Object.entries(COMMISSION).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {fr ? v.labelFr : v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textSec, display: "block", marginBottom: 5 }}>
                  {fr ? "Valeur nette (\u20AC)" : "Net value (\u20AC)"}
                </label>
                <input type="number" value={simVal} onChange={e => setSimVal(Number(e.target.value) || 0)} style={{
                  width: "100%", padding: "9px 12px", border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm,
                  fontSize: 13, fontFamily: MONO, color: T.text, outline: "none",
                  boxSizing: "border-box", background: "#fff",
                }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
              {[
                { l: fr ? "Taux SUNTREX" : "SUNTREX rate", v: `${r.ratePct}%`, s: r.tier, c: T.accent, bg: "#fff", bd: `${T.accent}30` },
                { l: fr ? "Commission SUNTREX" : "SUNTREX fee", v: `\u20AC${r.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`, s: `${fr ? "Net" : "Net"}: \u20AC${r.net.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`, c: T.accent, bg: "#fff", bd: `${T.accent}30` },
                { l: fr ? "Palier appliqu\u00E9" : "Applied tier", v: r.tier, s: fr ? "selon la valeur" : "based on value", c: T.blue, bg: T.blueBg, bd: `${T.blue}30` },
              ].map((c, i) => (
                <div key={i} style={{ padding: "12px 14px", background: c.bg, borderRadius: T.radiusSm, border: `1.5px solid ${c.bd}` }}>
                  <div style={{ fontSize: 9.5, color: T.textMuted, fontWeight: 600 }}>{c.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.c, margin: "2px 0" }}>{c.v}</div>
                  <div style={{ fontSize: 10, color: c.c, fontWeight: 500 }}>{c.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Toast message={fr ? "Email facture mis \u00E0 jour" : "Invoice email updated"} visible={toast} />
    </div>
  );
}
