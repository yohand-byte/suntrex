import { useState, useEffect } from "react";

// ── Brand constants (from root CLAUDE.md) ────────────────────────────
export const BRAND = {
  orange: "#f97316",
  orangeDark: "#ea580c",
  dark: "#1e293b",
  gray: "#64748b",
  lightGray: "#94a3b8",
  light: "#f8fafc",
  border: "#e2e8f0",
  green: "#10b981",
  greenLight: "#d1fae5",
  red: "#ef4444",
  redLight: "#fee2e2",
  blue: "#3b82f6",
  blueLight: "#dbeafe",
  amber: "#f59e0b",
  amberLight: "#fef3c7",
  white: "#ffffff",
  navy: "#0f172a",
};

// ── Responsive hook ──────────────────────────────────────────────────
export const useDashboardResponsive = () => {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024, w };
};

// ── Formatters ───────────────────────────────────────────────────────
export const fmt = {
  price: (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n),
  date: (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)),
  dateShort: (d) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(d)),
  number: (n) => new Intl.NumberFormat("fr-FR").format(n),
  pct: (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`,
};

// ── Status configs ───────────────────────────────────────────────────
export const ORDER_STATUS = {
  pending:   { label: "En attente",  color: BRAND.amber, bg: BRAND.amberLight, icon: "\u23F3" },
  paid:      { label: "Pay\u00e9",   color: BRAND.blue,  bg: BRAND.blueLight,  icon: "\uD83D\uDCB3" },
  shipped:   { label: "Exp\u00e9di\u00e9", color: BRAND.orange, bg: "#fff7ed", icon: "\uD83D\uDE9A" },
  delivered: { label: "Livr\u00e9",  color: BRAND.green, bg: BRAND.greenLight, icon: "\u2705" },
  disputed:  { label: "Litige",      color: BRAND.red,   bg: BRAND.redLight,   icon: "\u26A0\uFE0F" },
  cancelled: { label: "Annul\u00e9", color: BRAND.gray,  bg: "#f1f5f9",        icon: "\u2715" },
};

export const STRIPE_STATUS = {
  not_started: { label: "Non d\u00e9marr\u00e9", color: BRAND.gray,  bg: "#f1f5f9",        cta: "Activer les paiements" },
  pending:     { label: "En cours",               color: BRAND.amber, bg: BRAND.amberLight, cta: "Finaliser l'onboarding" },
  active:      { label: "Actif",                  color: BRAND.green, bg: BRAND.greenLight, cta: null },
  restricted:  { label: "Restreint",              color: BRAND.red,   bg: BRAND.redLight,   cta: "R\u00e9soudre le probl\u00e8me" },
};

// ── Mock data (replaced by Supabase in production) ───────────────────
export const MOCK_BUYER = {
  user: { name: "Pierre Moreau", email: "p.moreau@solarpro.fr", avatar: "PM", role: "buyer", verified: true },
  company: { name: "SolarPro France", vat: "FR12345678901", country: "FR", type: "Installateur" },
  stats: {
    totalOrders: 24, totalSpend: 187450, pendingOrders: 3,
    savedItems: 12, activeRFQs: 2, avgOrderValue: 7810,
  },
  orders: [
    { id: "ORD-2024-001", date: "2024-02-18", status: "delivered", product: "Huawei SUN2000-10K-MAP0 \u00d75", seller: "EnergyDist GmbH", amount: 6245, tracking: "SNTX-FR-44821" },
    { id: "ORD-2024-002", date: "2024-02-22", status: "shipped",   product: "Deye BOS-GM5.1 \u00d78",         seller: "SolarWholesale NL", amount: 7200, tracking: "SNTX-NL-10294" },
    { id: "ORD-2024-003", date: "2024-02-24", status: "paid",      product: "Hoymiles HMS-800 \u00d750",       seller: "MicroTech DE", amount: 5250, tracking: null },
    { id: "ORD-2024-004", date: "2024-02-14", status: "delivered", product: "LUNA2000-5-E0 \u00d73",           seller: "EnergyDist GmbH", amount: 3783, tracking: "SNTX-FR-44199" },
    { id: "ORD-2024-005", date: "2024-02-10", status: "disputed",  product: "ESDEC ClickFit EVO \u00d7200",   seller: "MountingPro IT", amount: 466, tracking: "SNTX-IT-28811" },
  ],
  rfqs: [
    { id: "RFQ-024", product: "Enphase IQ8-HC", qty: 100, status: "open", quotes: 3, deadline: "2024-03-05" },
    { id: "RFQ-025", product: "JA Solar 420Wc", qty: 500, status: "open", quotes: 7, deadline: "2024-03-08" },
  ],
  saved: [
    { id: 1, name: "Huawei SUN2000-12K-MB0", price: 2100, stock: 42,  brand: "HUAWEI" },
    { id: 2, name: "Deye SUN-8K-SG04LP3-EU", price: 1250, stock: 18,  brand: "DEYE" },
    { id: 3, name: "LUNA2000-5-E0",           price: 1261, stock: 76,  brand: "HUAWEI" },
    { id: 4, name: "Enphase IQ8-PLUS",        price: 80,   stock: 647, brand: "ENPHASE" },
  ],
  notifications: [
    { id: 1, type: "delivery", msg: "Commande ORD-2024-002 exp\u00e9di\u00e9e \u2014 arriv\u00e9e estim\u00e9e 26 f\u00e9v.", time: "2h", read: false },
    { id: 2, type: "price",    msg: "Prix Huawei SUN2000-10K baiss\u00e9 de 3% chez 2 vendeurs", time: "5h", read: false },
    { id: 3, type: "quote",    msg: "3 nouvelles offres re\u00e7ues pour RFQ-024", time: "1j", read: true },
    { id: 4, type: "dispute",  msg: "Litige ORD-2024-005 : r\u00e9ponse requise sous 48h", time: "2j", read: false },
  ],
};

export const MOCK_SELLER = {
  user: { name: "Hans Mueller", email: "h.mueller@energydist.de", avatar: "HM", role: "seller", verified: true },
  company: { name: "EnergyDist GmbH", vat: "DE987654321", country: "DE", type: "Distributeur" },
  stripeStatus: "active",
  stats: {
    totalRevenue: 284600, monthRevenue: 38200, pendingPayouts: 12400,
    activeListings: 47, totalOrders: 186, conversionRate: 4.2,
    avgRating: 4.8, totalReviews: 142, responseTime: "< 2h",
  },
  monthlyRevenue: [
    { month: "Sep", value: 24100 },
    { month: "Oct", value: 31200 },
    { month: "Nov", value: 28900 },
    { month: "D\u00e9c", value: 19800 },
    { month: "Jan", value: 33400 },
    { month: "F\u00e9v", value: 38200 },
  ],
  orders: [
    { id: "ORD-2024-001", date: "2024-02-18", status: "delivered", buyer: "SolarPro France", product: "SUN2000-10K-MAP0 \u00d75", amount: 5590, fee: 335, net: 5255 },
    { id: "ORD-2024-006", date: "2024-02-23", status: "paid",      buyer: "InstallSol ES",   product: "LUNA2000-5-E0 \u00d710",   amount: 11300, fee: 678, net: 10622 },
    { id: "ORD-2024-007", date: "2024-02-24", status: "pending",   buyer: "GreenBuild BE",   product: "SUN2000-8K-MAP0 \u00d78",  amount: 7120, fee: 427, net: 6693 },
    { id: "ORD-2024-008", date: "2024-02-25", status: "shipped",   buyer: "SolarMax NL",     product: "SUN2000-5K-MAP0 \u00d712", amount: 8160, fee: 490, net: 7670 },
    { id: "ORD-2024-005", date: "2024-02-14", status: "disputed",  buyer: "SolarPro France", product: "ESDEC ClickFit \u00d7200", amount: 466, fee: 28, net: 438 },
  ],
  listings: [
    { id: 1, sku: "SUN2000-10K-MAP0", name: "Huawei SUN2000-10K-MAP0",  price: 1118, stock: 9,   status: "active",  views: 284, orders: 12 },
    { id: 2, sku: "LUNA2000-5-E0",    name: "Huawei LUNA2000-5-E0",     price: 1130, stock: 14,  status: "active",  views: 197, orders: 8 },
    { id: 3, sku: "SUN2000-5K-MAP0",  name: "Huawei SUN2000-5K-MAP0",  price: 680,  stock: 0,   status: "soldout", views: 432, orders: 22 },
    { id: 4, sku: "SUN2000-8K-MAP0",  name: "Huawei SUN2000-8K-MAP0",  price: 890,  stock: 28,  status: "active",  views: 156, orders: 5 },
    { id: 5, sku: "LUNA2000-5KW-C0",  name: "Huawei LUNA2000-5KW-C0",  price: 145,  stock: 32,  status: "active",  views: 89,  orders: 3 },
    { id: 6, sku: "P1300",            name: "Huawei Optimizer P1300",   price: 52,   stock: 200, status: "active",  views: 64,  orders: 1 },
    { id: 7, sku: "WLAN-FE",          name: "Huawei Smart Dongle",      price: 38,   stock: 15,  status: "paused",  views: 45,  orders: 0 },
  ],
  payouts: [
    { date: "2024-02-20", amount: 15240, status: "paid",    ref: "po_xxx001" },
    { date: "2024-02-13", amount: 9870,  status: "paid",    ref: "po_xxx002" },
    { date: "2024-02-06", amount: 12400, status: "pending", ref: "po_xxx003" },
  ],
  notifications: [
    { id: 1, type: "order",   msg: "Nouvelle commande ORD-2024-007 \u2014 GreenBuild BE \u2014 7 120 \u20ac", time: "1h", read: false },
    { id: 2, type: "payout",  msg: "Virement de 15 240 \u20ac re\u00e7u sur votre compte bancaire", time: "5h", read: false },
    { id: 3, type: "dispute", msg: "Litige ORD-2024-005 ouvert \u2014 r\u00e9ponse requise sous 48h", time: "2j", read: false },
    { id: 4, type: "kyc",     msg: "Profil Stripe v\u00e9rifi\u00e9 \u2014 paiements et virements activ\u00e9s", time: "1s", read: true },
  ],
};
