import { useState, useMemo } from "react";

const PHASES = [
  { id: "mvp", label: "Phase 1 — MVP", color: "#E8700A", target: "6 sem." },
  { id: "trust", label: "Phase 2 — Trust & Delivery", color: "#3b82f6", target: "6 sem." },
  { id: "ai", label: "Phase 3 — IA & Scale", color: "#7c3aed", target: "8 sem." },
  { id: "expand", label: "Phase 4 — Expansion", color: "#06b6d4", target: "Continu" },
];

// LAST UPDATED: 2026-03-01
const MODULES = [
  { id: "homepage", phase: "mvp", part: "UI/UX", name: "Homepage & Landing", tasks: [
    { name: "Hero + barre de recherche", done: true },
    { name: "Carrousel marques (15 logos)", done: true },
    { name: "Section Meilleurs produits (top 10)", done: true },
    { name: "Categories visuelles", done: true },
    { name: "CTA inscription / prix masques", done: true },
    { name: "Responsive 375px - 1440px", done: true },
  ]},
  { id: "catalog", phase: "mvp", part: "UI/UX", name: "Catalogue & Filtres", tasks: [
    { name: "629 produits dedupliques", done: true },
    { name: "Grille produits responsive", done: true },
    { name: "Filtres : marque, puissance, type, phases, MPPT", done: true },
    { name: "Recherche autocomplete", done: true },
    { name: "Pagination", done: true },
    { name: "Tags rapides", done: true },
    { name: "Navigation par categories (6)", done: true },
  ]},
  { id: "product-page", phase: "mvp", part: "UI/UX", name: "Fiches Produit", tasks: [
    { name: "Specs techniques completes", done: true },
    { name: "Photos produit reelles", done: true },
    { name: "Stock en temps reel", done: true },
    { name: "Prix gated (blur + CTA)", done: true },
    { name: "Datasheets PDF (13 Huawei)", done: true },
    { name: "Routing correct", done: true },
    { name: "Comparaison multi-vendeurs", done: false },
    { name: "Enrichir images manquantes (75 produits)", done: false },
    { name: "Enrichir datasheets manquantes (185 produits)", done: false },
  ]},
  { id: "auth", phase: "mvp", part: "Auth", name: "Auth + KYC Simplifie", tasks: [
    { name: "AuthSprintPage - inscription 2 etapes (1635 lignes)", done: true },
    { name: "AuthSystem - login/register modal (773 lignes)", done: true },
    { name: "useAuth hook - Supabase Auth complet (343 lignes)", done: true },
    { name: "signUp / signIn / signOut / getSession", done: true },
    { name: "onAuthStateChange listener", done: true },
    { name: "Verification TVA auto via API VIES", done: true },
    { name: "RGPD checkboxes", done: true },
    { name: "Selecteur pays (FR, DE, BE, NL, IT, ES)", done: true },
    { name: "Roles buyer/seller dans Supabase", done: true },
    { name: "Test e2e inscription - verification - session", done: false },
  ]},
  { id: "stripe", phase: "mvp", part: "Paiements", name: "Stripe Connect", tasks: [
    { name: "stripe-checkout.js - PaymentIntent + application_fee", done: true },
    { name: "stripe-connect.js - Onboarding vendeur", done: true },
    { name: "stripe-webhook.js - 7 events", done: true },
    { name: "Idempotency keys", done: true },
    { name: "Prix lus server-side", done: true },
    { name: "3D Secure / SCA", done: true },
    { name: "apiVersion epinglee (2024-06-20)", done: true },
    { name: "CheckoutPage.jsx - Elements + CardElement", done: true },
    { name: "Verif charges_enabled + payouts_enabled", done: true },
    { name: "Env vars configurees (Vercel + Netlify)", done: true },
    { name: "Test mode complet sk_test - paiement - webhook", done: false },
    { name: "Passage en mode live (sk_live_)", done: false },
  ]},
  { id: "dashboard-buyer", phase: "mvp", part: "Dashboards", name: "Dashboard Acheteur", tasks: [
    { name: "BuyerDashboard.jsx (369 lignes)", done: true },
    { name: "BuyerOverview.jsx (249 lignes)", done: true },
    { name: "MyPurchases.jsx (203 lignes)", done: true },
    { name: "BuyerRFQ.jsx (117 lignes)", done: true },
    { name: "DeliveryAddresses.jsx (92 lignes)", done: true },
    { name: "Brancher sur donnees Supabase reelles (useDashboardData hook)", done: true },
  ]},
  { id: "dashboard-seller", phase: "mvp", part: "Dashboards", name: "Dashboard Vendeur", tasks: [
    { name: "SellerDashboard.jsx (593 lignes)", done: true },
    { name: "SellerOverview.jsx (368 lignes)", done: true },
    { name: "ManageOffers.jsx (134 lignes)", done: true },
    { name: "MySales.jsx (315 lignes)", done: true },
    { name: "WarehouseManager.jsx (58 lignes)", done: true },
    { name: "Stripe Connect panel", done: true },
    { name: "Stripe onboarding banner + status KYC", done: true },
    { name: "Brancher sur donnees Supabase reelles (useDashboardData hook)", done: true },
  ]},
  { id: "dashboard-shared", phase: "mvp", part: "Dashboards", name: "Dashboard Commun", tasks: [
    { name: "DashboardLayout.jsx (380 lignes)", done: true },
    { name: "DashboardSidebar + DashboardTopbar", done: true },
    { name: "AccountDetails.jsx", done: true },
    { name: "CompanyDetails.jsx", done: true },
    { name: "InvoicesAndFees.jsx", done: true },
    { name: "OutOfOffice.jsx", done: true },
    { name: "ReviewsPage.jsx", done: true },
    { name: "NotificationsCenter + Settings + Emails", done: true },
    { name: "DashboardRouter.jsx", done: true },
  ]},
  { id: "chat", phase: "mvp", part: "Communication", name: "Chat & Messaging", tasks: [
    { name: "SuntrexSupportChat.jsx - Chat IA Mistral", done: true },
    { name: "supportChatService.js + useSupportChat.js", done: true },
    { name: "TransactionChatPage.jsx (1022 lignes)", done: true },
    { name: "TransactionChat.jsx (404 lignes)", done: true },
    { name: "MessagingInbox.jsx (374 lignes)", done: true },
    { name: "useChat.js - Hook Supabase Realtime (212 lignes)", done: true },
    { name: "Moderation basique (filtre mots cles)", done: false },
  ]},
  { id: "transaction", phase: "mvp", part: "Transactions", name: "Gestion Transactions", tasks: [
    { name: "TransactionPage.jsx (425 lignes)", done: true },
    { name: "TransactionDetails.jsx (186 lignes)", done: true },
    { name: "TransactionProducts.jsx (240 lignes)", done: true },
    { name: "TransactionTimeline.jsx (136 lignes)", done: true },
    { name: "useTransaction.js (67 lignes)", done: true },
    { name: "Brancher sur Stripe webhooks reels", done: false },
  ]},
  { id: "i18n", phase: "mvp", part: "Infra", name: "Multilingue i18n", tasks: [
    { name: "react-i18next configure", done: true },
    { name: "FR", done: true }, { name: "EN", done: true }, { name: "DE", done: true },
    { name: "ES", done: true }, { name: "IT", done: true }, { name: "NL", done: true },
    { name: "EL", done: true }, { name: "Selecteur de langue dans header", done: true },
  ]},
  { id: "infra", phase: "mvp", part: "Infra", name: "Infra & Deploiement", tasks: [
    { name: "Vite + React", done: true },
    { name: "Vercel (suntrex.vercel.app)", done: true },
    { name: "Netlify Functions (5 serverless)", done: true },
    { name: "Supabase (Auth + DB + Realtime + RLS)", done: true },
    { name: "GitHub repo", done: true },
    { name: "Env vars configurees", done: true },
    { name: "SEO meta tags + hreflang", done: true },
  ]},
  { id: "admin", phase: "mvp", part: "Admin", name: "Admin Dashboard", tasks: [
    { name: "AdminDashboard.jsx (400 lignes)", done: true },
    { name: "KPIs : revenu, commissions, commandes", done: true },
    { name: "Liste transactions avec filtres", done: true },
    { name: "Suivi vendeurs + KYC status", done: true },
    { name: "Brancher sur donnees reelles (useDashboardData hook)", done: true },
  ]},
    { id: "blog", phase: "mvp", part: "Content", name: "Blog SUNTREX Insights", tasks: [
    { name: "SuntrexBlog.jsx composant principal (688 lignes)", done: true },
    { name: "BlogPage.jsx route /blog", done: true },
    { name: "8 articles fondateurs", done: true },
    { name: "Filtres par categorie (6 categories)", done: true },
    { name: "Recherche articles", done: true },
    { name: "Articles A la une hero 2 colonnes", done: true },
    { name: "Sidebar newsletter + sujets populaires + stats + RSS", done: true },
    { name: "Photos reelles par article", done: true },
    { name: "Tags + temps de lecture + engagement metrics", done: true },
    { name: "blogService.js service layer (243 lignes)", done: true },
    { name: "blog-ai-generate.js Netlify Function Mistral (143 lignes)", done: true },
    { name: "Supabase migrations blog system", done: true },
    { name: "Brancher sur Supabase articles dynamiques", done: false },
    { name: "Generateur IA articles admin", done: false },
  ]},
  // PHASE 2
  { id: "delivery", phase: "trust", part: "Delivery", name: "Livraison & Tracking", tasks: [
    { name: "DeliveryTrackerPage.jsx (421 lignes)", done: true },
    { name: "Verification colis QR + photos", done: false },
    { name: "Integration API transporteurs", done: false },
    { name: "Branding SUNTREX DELIVERY", done: false },
    { name: "GPS timestamping + preuve livraison", done: false },
    { name: "E-signature reception", done: false },
  ]},
  { id: "escrow", phase: "trust", part: "Paiements", name: "Escrow Avance", tasks: [
    { name: "Fonds bloques jusqu'a confirmation", done: false },
    { name: "Auto-release apres 7 jours", done: false },
    { name: "Dashboard admin reconciliation", done: false },
    { name: "Gestion disputes + remboursements", done: false },
  ]},
  { id: "trust-badges", phase: "trust", part: "Auth", name: "Trust & Badges", tasks: [
    { name: "Badges vendeur auto-calcules", done: false },
    { name: "Notation 1-5 etoiles", done: false },
    { name: "Profil vendeur public", done: false },
    { name: "Temps de reponse affiche", done: false },
  ]},
  { id: "support-multi", phase: "trust", part: "Communication", name: "Support Multi-Canal", tasks: [
    { name: "Chat in-app", done: true },
    { name: "WhatsApp Business API", done: false },
    { name: "Telephone dedie", done: false },
    { name: "Email support avec SLA", done: false },
  ]},
  { id: "bulk-import", phase: "trust", part: "Dashboards", name: "Import Offres en Masse", tasks: [
    { name: "Template XLSX telecharger", done: false },
    { name: "Upload + parsing XLSX", done: false },
    { name: "Validation + preview", done: false },
  ]},
  // PHASE 3
  { id: "ai-advisor", phase: "ai", part: "IA", name: "SUNTREX AI Advisor", tasks: [
    { name: "Chat IA support catalogue (Mistral)", done: true },
    { name: "Recommandation produits personnalisee", done: false },
    { name: "Comparateur intelligent", done: false },
    { name: "Dimensionnement installation", done: false },
  ]},
  { id: "ai-moderation", phase: "ai", part: "IA", name: "Moderation IA", tasks: [
    { name: "Filtre IA messages", done: false },
    { name: "Detection paiement hors-plateforme", done: false },
    { name: "Detection multi-comptes", done: false },
    { name: "Dashboard moderateurs", done: false },
  ]},
  { id: "seo-perf", phase: "ai", part: "Infra", name: "SEO & Performance", tasks: [
    { name: "SSR ou prerender catalogue", done: false },
    { name: "Sitemap.xml dynamique", done: false },
    { name: "Lighthouse > 90", done: false },
  ]},
  // PHASE 4
  { id: "mobile-app", phase: "expand", part: "UI/UX", name: "App Mobile", tasks: [
    { name: "React Native Buyer", done: false },
    { name: "React Native Seller", done: false },
    { name: "Push notifications", done: false },
  ]},
  { id: "api-public", phase: "expand", part: "Infra", name: "API Publique", tasks: [
    { name: "REST API pour ERP", done: false },
    { name: "Webhooks partenaires", done: false },
    { name: "Documentation Swagger", done: false },
  ]},
  { id: "fleet", phase: "expand", part: "Delivery", name: "Flotte Propre", tasks: [
    { name: "Etude corridors FR-DE, Benelux", done: false },
    { name: "Flotte camions SUNTREX", done: false },
    { name: "App chauffeur", done: false },
  ]},
];

const PART_ICONS = { "UI/UX": "\u25C8", "Auth": "\uD83D\uDD12", "Paiements": "\uD83D\uDCB3", "Dashboards": "\uD83D\uDCCA", "Communication": "\uD83D\uDCAC", "Transactions": "\uD83D\uDCE6", "Infra": "\u2699\uFE0F", "Admin": "\uD83D\uDC51", "Delivery": "\uD83D\uDE9B", "IA": "\uD83E\uDD16" };
const PART_COLORS = { "UI/UX": "#E8700A", "Auth": "#ef4444", "Paiements": "#6366f1", "Dashboards": "#3b82f6", "Communication": "#10b981", "Transactions": "#f59e0b", "Infra": "#64748b", "Admin": "#7c3aed", "Delivery": "#0d9488", "IA": "#ec4899" };

function ProgressBar({ done, total, color = "#E8700A", height = 6 }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ flex: 1, height, background: "#f1f5f9", borderRadius: height / 2, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: height / 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function TaskItem({ task }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
      <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{task.done ? "\u2705" : "\u2B1C"}</span>
      <span style={{ fontSize: 12.5, color: task.done ? "#64748b" : "#1e293b", textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4 }}>{task.name}</span>
    </div>
  );
}

function ModuleCard({ mod, expanded, onToggle }) {
  var done = mod.tasks.filter(function(t) { return t.done; }).length;
  var total = mod.tasks.length;
  var pct = total === 0 ? 0 : Math.round((done / total) * 100);
  var phase = PHASES.find(function(p) { return p.id === mod.phase; });
  var partColor = PART_COLORS[mod.part] || "#64748b";
  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8eaef", overflow: "hidden", transition: "box-shadow 0.2s", boxShadow: expanded ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div onClick={onToggle} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15 }}>{PART_ICONS[mod.part] || "\u25C8"}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mod.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {pct === 100 && <span style={{ fontSize: 9, fontWeight: 800, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: 4 }}>DONE</span>}
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{done}/{total}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>\u25BC</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: partColor, background: partColor + "15", padding: "1px 6px", borderRadius: 3 }}>{mod.part}</span>
          <div style={{ flex: 1 }}><ProgressBar done={done} total={total} color={pct === 100 ? "#10b981" : (phase ? phase.color : "#E8700A")} height={4} /></div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ paddingTop: 10 }}>{mod.tasks.map(function(t, i) { return <TaskItem key={i} task={t} />; })}</div>
        </div>
      )}
    </div>
  );
}

export default function MvpTracker() {
  var st = useState(null); var expandedId = st[0]; var setExpandedId = st[1];
  var st2 = useState("all"); var activePhase = st2[0]; var setActivePhase = st2[1];
  var st3 = useState(false); var showDoneOnly = st3[0]; var setShowDoneOnly = st3[1];

  var filtered = useMemo(function() {
    var mods = MODULES;
    if (activePhase !== "all") mods = mods.filter(function(m) { return m.phase === activePhase; });
    if (showDoneOnly) mods = mods.filter(function(m) { return m.tasks.some(function(t) { return !t.done; }); });
    return mods;
  }, [activePhase, showDoneOnly]);

  var globalStats = useMemo(function() {
    var allTasks = MODULES.reduce(function(acc, m) { return acc.concat(m.tasks); }, []);
    var done = allTasks.filter(function(t) { return t.done; }).length;
    return { done: done, total: allTasks.length, pct: Math.round((done / allTasks.length) * 100) };
  }, []);

  var phaseStats = useMemo(function() {
    return PHASES.map(function(p) {
      var mods = MODULES.filter(function(m) { return m.phase === p.id; });
      var tasks = mods.reduce(function(acc, m) { return acc.concat(m.tasks); }, []);
      var done = tasks.filter(function(t) { return t.done; }).length;
      return Object.assign({}, p, { done: done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, modules: mods.length });
    });
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#f7f8fa", minHeight: "100vh", padding: "20px 16px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E8700A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>SUNTREX</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#E8700A", background: "#fff7ed", padding: "2px 8px", borderRadius: 4 }}>MVP TRACKER</span>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Derniere mise a jour : 1 mars 2026 - {globalStats.done}/{globalStats.total} taches completees</p>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto 20px", background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e8eaef" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Progression Globale</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#E8700A" }}>{globalStats.pct}%</span>
        </div>
        <ProgressBar done={globalStats.done} total={globalStats.total} height={10} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
          {[{ label: "Fichiers", value: "~45", icon: "\uD83D\uDCC4" }, { label: "Lignes code", value: "~13K", icon: "\uD83D\uDCBB" }, { label: "Netlify Fn", value: "5", icon: "\u26A1" }, { label: "Langues", value: "7", icon: "\uD83C\uDF0D" }].map(function(s, i) {
            return <div key={i} style={{ textAlign: "center", padding: "10px 4px", background: "#f8fafc", borderRadius: 8 }}><div style={{ fontSize: 16 }}>{s.icon}</div><div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{s.value}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div></div>;
          })}
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {phaseStats.map(function(p) {
          return <div key={p.id} onClick={function() { setActivePhase(activePhase === p.id ? "all" : p.id); }} style={{ background: activePhase === p.id ? p.color + "10" : "#fff", border: "1px solid " + (activePhase === p.id ? p.color : "#e8eaef"), borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.target}</span>
            </div>
            <ProgressBar done={p.done} total={p.total} color={p.color} height={4} />
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{p.modules} modules - {p.done}/{p.total} taches</div>
          </div>;
        })}
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>{activePhase === "all" ? "Tous les modules" : PHASES.find(function(p) { return p.id === activePhase; }).label} - {filtered.length} modules</span>
        <label style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showDoneOnly} onChange={function(e) { setShowDoneOnly(e.target.checked); }} />
          Masquer modules 100%
        </label>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(function(m) {
          return <ModuleCard key={m.id} mod={m} expanded={expandedId === m.id} onToggle={function() { setExpandedId(expandedId === m.id ? null : m.id); }} />;
        })}
      </div>
    </div>
  );
}
