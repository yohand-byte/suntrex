import { useState, useMemo } from "react";

const PHASES = [
  { id: "mvp", label: "Phase 1 — MVP", color: "#E8700A", target: "6 sem." },
  { id: "trust", label: "Phase 2 — Trust & Delivery", color: "#3b82f6", target: "6 sem." },
  { id: "ai", label: "Phase 3 — IA & Scale", color: "#7c3aed", target: "8 sem." },
  { id: "expand", label: "Phase 4 — Expansion", color: "#06b6d4", target: "Continu" },
];

// LAST UPDATED: 2026-03-05
const MODULES = [
  // ═══ PHASE 1 — MVP ═══
  {
    id: "homepage", phase: "mvp", part: "UI/UX", name: "Homepage & Landing",
    tasks: [
      { name: "Hero + barre de recherche", done: true },
      { name: "Carrousel marques (15 logos)", done: true },
      { name: "Section Meilleurs produits (top 10)", done: true },
      { name: "Catégories visuelles", done: true },
      { name: "CTA inscription / prix masqués", done: true },
      { name: "Responsive 375px → 1440px", done: true },
    ],
  },
  {
    id: "catalog", phase: "mvp", part: "UI/UX", name: "Catalogue & Filtres",
    tasks: [
      { name: "629 produits dédupliqués (Huawei, Deye, Pytes, Esdec...)", done: true },
      { name: "Grille produits responsive", done: true },
      { name: "Filtres : marque, puissance, type, phases, MPPT", done: true },
      { name: "Recherche autocomplete", done: true },
      { name: "Pagination", done: true },
      { name: "Tags rapides (Disponible, Livraison SUNTREX, etc.)", done: true },
      { name: "Navigation par catégories (6 catégories)", done: true },
    ],
  },
  {
    id: "product-page", phase: "mvp", part: "UI/UX", name: "Fiches Produit",
    tasks: [
      { name: "Specs techniques complètes", done: true },
      { name: "Photos produit réelles", done: true },
      { name: "Stock en temps réel", done: true },
      { name: "Prix gated (blur + CTA inscription)", done: true },
      { name: "Datasheets PDF (13 Huawei)", done: true },
      { name: "Routing correct (ID réels, page 404)", done: true },
      { name: "Comparaison multi-vendeurs (même produit)", done: true },
      { name: "Enrichir images manquantes (75 produits ESDEC/montage)", done: false },
      { name: "Enrichir datasheets manquantes (185 produits)", done: false },
    ],
  },
  {
    id: "auth", phase: "mvp", part: "Auth & Sécurité", name: "Auth + KYC Simplifié",
    tasks: [
      { name: "AuthSprintPage — inscription 2 étapes (1635 lignes)", done: true },
      { name: "AuthSystem — login/register modal (773 lignes)", done: true },
      { name: "useAuth hook — Supabase Auth complet (343 lignes)", done: true },
      { name: "signUp / signIn / signOut / getSession", done: true },
      { name: "onAuthStateChange listener", done: true },
      { name: "Vérification TVA auto via API VIES (Netlify Function)", done: true },
      { name: "RGPD checkboxes (CGV obligatoire, marketing optionnel)", done: true },
      { name: "Sélecteur pays (FR, DE, BE, NL, IT, ES)", done: true },
      { name: "Rôles buyer/seller dans Supabase", done: true },
      { name: "Test e2e inscription → vérification → session persistée", done: true },
    ],
  },
  {
    id: "stripe", phase: "mvp", part: "Paiements", name: "Stripe Connect",
    tasks: [
      { name: "stripe-checkout.js — PaymentIntent + application_fee", done: true },
      { name: "stripe-connect.js — Onboarding vendeur (Account Links)", done: true },
      { name: "stripe-webhook.js — 7 events (payment, dispute, refund, account...)", done: true },
      { name: "Idempotency keys sur opérations critiques", done: true },
      { name: "Prix lus server-side (jamais client)", done: true },
      { name: "3D Secure / SCA (obligatoire EU)", done: true },
      { name: "apiVersion épinglée (2024-06-20)", done: true },
      { name: "CheckoutPage.jsx — Elements + CardElement (595 lignes)", done: true },
      { name: "Vérif charges_enabled + payouts_enabled avant listing", done: true },
      { name: "Env vars Stripe configurées (Vercel + Netlify)", done: true },
      { name: "Test mode complet sk_test → paiement → webhook → transfer", done: true },
      { name: "Passage en mode live (sk_live_)", done: false },
    ],
  },
  {
    id: "dashboard-buyer", phase: "mvp", part: "Dashboards", name: "Dashboard Acheteur",
    tasks: [
      { name: "BuyerDashboard.jsx — Layout principal (369 lignes)", done: true },
      { name: "BuyerOverview.jsx — Vue d'ensemble (249 lignes)", done: true },
      { name: "MyPurchases.jsx — Historique achats (203 lignes)", done: true },
      { name: "BuyerRFQ.jsx — Demandes de devis (117 lignes)", done: true },
      { name: "DeliveryAddresses.jsx — Adresses livraison (92 lignes)", done: true },
      { name: "Brancher sur données Supabase réelles (remplacer mock)", done: true },
    ],
  },
  {
    id: "dashboard-seller", phase: "mvp", part: "Dashboards", name: "Dashboard Vendeur",
    tasks: [
      { name: "SellerDashboard.jsx — Layout + navigation (593 lignes)", done: true },
      { name: "SellerOverview.jsx — KPIs vendeur (368 lignes)", done: true },
      { name: "ManageOffers.jsx — CRUD offres (134 lignes)", done: true },
      { name: "MySales.jsx — Historique ventes (315 lignes)", done: true },
      { name: "WarehouseManager.jsx — Entrepôts (58 lignes)", done: true },
      { name: "Stripe Connect panel dans dashboard", done: true },
      { name: "Stripe onboarding banner + status KYC", done: true },
      { name: "Brancher sur données Supabase réelles (remplacer mock)", done: true },
    ],
  },
  {
    id: "dashboard-shared", phase: "mvp", part: "Dashboards", name: "Dashboard Commun",
    tasks: [
      { name: "DashboardLayout.jsx — Shell avec sidebar (380 lignes)", done: true },
      { name: "DashboardSidebar.jsx + DashboardTopbar.jsx", done: true },
      { name: "AccountDetails.jsx — Infos compte (45 lignes)", done: true },
      { name: "CompanyDetails.jsx — Infos entreprise (42 lignes)", done: true },
      { name: "InvoicesAndFees.jsx — Factures et frais (66 lignes)", done: true },
      { name: "OutOfOffice.jsx — Absence vendeur (77 lignes)", done: true },
      { name: "ReviewsPage.jsx — Avis (59 lignes)", done: true },
      { name: "NotificationsCenter + Settings + Emails (238 lignes)", done: true },
      { name: "DashboardRouter.jsx — Routing interne", done: true },
    ],
  },
  {
    id: "chat", phase: "mvp", part: "Communication", name: "Chat & Messaging",
    tasks: [
      { name: "SuntrexSupportChat.jsx — Chat IA Mistral (support)", done: true },
      { name: "supportChatService.js + useSupportChat.js", done: true },
      { name: "TransactionChatPage.jsx — Chat buyer-seller (1022 lignes)", done: true },
      { name: "TransactionChat.jsx — Composant chat (404 lignes)", done: true },
      { name: "MessagingInbox.jsx — Boîte de réception (374 lignes)", done: true },
      { name: "useChat.js — Hook Supabase Realtime (212 lignes)", done: true },
      { name: "Modération basique (filtre mots clés)", done: true },
    ],
  },
  {
    id: "transaction", phase: "mvp", part: "Transactions", name: "Gestion Transactions",
    tasks: [
      { name: "TransactionPage.jsx — Page transaction (425 lignes)", done: true },
      { name: "TransactionDetails.jsx — Détails commande (186 lignes)", done: true },
      { name: "TransactionProducts.jsx — Produits commandés (240 lignes)", done: true },
      { name: "TransactionTimeline.jsx — Timeline statuts (136 lignes)", done: true },
      { name: "useTransaction.js — Hook gestion état (67 lignes)", done: true },
      { name: "Brancher sur Stripe webhooks réels", done: false },
    ],
  },
  {
    id: "i18n", phase: "mvp", part: "Infrastructure", name: "Multilingue i18n",
    tasks: [
      { name: "react-i18next configuré", done: true },
      { name: "FR — Français", done: true },
      { name: "EN — English", done: true },
      { name: "DE — Deutsch", done: true },
      { name: "ES — Español", done: true },
      { name: "IT — Italiano", done: true },
      { name: "NL — Nederlands", done: true },
      { name: "EL — Ελληνικά", done: true },
      { name: "Sélecteur de langue dans header", done: true },
    ],
  },
  {
    id: "infra", phase: "mvp", part: "Infrastructure", name: "Infra & Déploiement",
    tasks: [
      { name: "Vite + React (build < 5s)", done: true },
      { name: "Vercel — Frontend déployé (suntrex.vercel.app)", done: true },
      { name: "Netlify Functions — 5 serverless (stripe×3, vat, chat-ai)", done: true },
      { name: "Supabase — Auth + DB + Realtime + RLS", done: true },
      { name: "GitHub repo (yohand-byte/suntrex.git)", done: true },
      { name: "Env vars configurées (Vercel + Netlify)", done: true },
      { name: "SEO meta tags + hreflang 7 langues", done: true },
      { name: "Favicon + Apple touch icon", done: true },
    ],
  },
  {
    id: "admin", phase: "mvp", part: "Admin", name: "Admin Dashboard",
    tasks: [
      { name: "AdminDashboard.jsx — Command center (400 lignes)", done: true },
      { name: "KPIs : revenu, commissions, commandes, utilisateurs", done: true },
      { name: "Liste transactions avec filtres", done: true },
      { name: "Suivi vendeurs + KYC status", done: true },
      { name: "Brancher sur données réelles (actuellement mock)", done: true },
    ],
  },
  // ═══ PHASE 2 — TRUST & DELIVERY ═══
  {
    id: "delivery", phase: "trust", part: "SUNTREX DELIVERY", name: "Livraison & Tracking",
    tasks: [
      { name: "DeliveryTrackerPage.jsx — Suivi colis (421 lignes)", done: true },
      { name: "Vérification colis QR + photos (workflow 4 étapes)", done: false },
      { name: "Intégration API transporteurs (DPD, GLS, DB Schenker)", done: false },
      { name: "Branding SUNTREX DELIVERY sur colis", done: false },
      { name: "GPS timestamping + preuve de livraison", done: false },
      { name: "E-signature à la réception", done: false },
    ],
  },
  {
    id: "escrow", phase: "trust", part: "Paiements", name: "Escrow Avancé",
    tasks: [
      { name: "Fonds bloqués jusqu'à confirmation livraison", done: false },
      { name: "Auto-release après 7 jours sans dispute", done: false },
      { name: "Dashboard admin réconciliation", done: false },
      { name: "Alertes écarts montants", done: false },
      { name: "Gestion disputes + remboursements", done: false },
    ],
  },
  {
    id: "trust-badges", phase: "trust", part: "Auth & Sécurité", name: "Trust & Badges",
    tasks: [
      { name: "Badges vendeur auto-calculés (Bronze/Silver/Gold/Platine)", done: false },
      { name: "Notation 1-5 étoiles acheteur → vendeur", done: false },
      { name: "Profil vendeur public", done: false },
      { name: "Temps de réponse moyen affiché", done: false },
    ],
  },
  {
    id: "support-multi", phase: "trust", part: "Communication", name: "Support Multi-Canal",
    tasks: [
      { name: "Chat in-app (déjà fait)", done: true },
      { name: "Intégration WhatsApp Business API", done: false },
      { name: "Téléphone — numéro dédié", done: false },
      { name: "Email support avec SLA", done: false },
    ],
  },
  {
    id: "bulk-import", phase: "trust", part: "Dashboards", name: "Import Offres en Masse",
    tasks: [
      { name: "Template XLSX téléchargeable", done: false },
      { name: "Upload + parsing XLSX", done: false },
      { name: "Validation + preview avant import", done: false },
      { name: "Mapping produits existants", done: false },
    ],
  },
  // ═══ PHASE 3 — IA & SCALE ═══
  {
    id: "ai-advisor", phase: "ai", part: "IA", name: "SUNTREX AI Advisor",
    tasks: [
      { name: "Chat IA support catalogue (Mistral) — déjà fait", done: true },
      { name: "Recommandation produits personnalisée", done: false },
      { name: "Comparateur intelligent multi-vendeurs (UI: ✓ / IA: à venir)", done: false },
      { name: "Dimensionnement installation solaire", done: false },
      { name: "Pricing intelligent pour vendeurs", done: false },
    ],
  },
  {
    id: "ai-moderation", phase: "ai", part: "IA", name: "Modération IA",
    tasks: [
      { name: "Filtre IA messages chat (anti-spam, anti-fraude)", done: false },
      { name: "Détection paiement hors-plateforme", done: false },
      { name: "Détection multi-comptes", done: false },
      { name: "Détection prix anormaux", done: false },
      { name: "Dashboard modérateurs", done: false },
    ],
  },
  {
    id: "seo-perf", phase: "ai", part: "Infrastructure", name: "SEO & Performance",
    tasks: [
      { name: "SSR ou prerender pour le catalogue", done: false },
      { name: "Sitemap.xml dynamique", done: true },
      { name: "Lighthouse > 90 sur toutes les pages", done: false },
      { name: "Lazy loading images + code splitting", done: true },
    ],
  },
  // ═══ PHASE 4 — EXPANSION ═══
  {
    id: "mobile-app", phase: "expand", part: "UI/UX", name: "App Mobile",
    tasks: [
      { name: "React Native — Buyer app", done: false },
      { name: "React Native — Seller app", done: false },
      { name: "Push notifications", done: false },
    ],
  },
  {
    id: "api-public", phase: "expand", part: "Infrastructure", name: "API Publique",
    tasks: [
      { name: "REST API pour intégration ERP", done: false },
      { name: "Webhooks pour partenaires", done: false },
      { name: "Documentation API (Swagger)", done: false },
    ],
  },
  {
    id: "fleet", phase: "expand", part: "SUNTREX DELIVERY", name: "Flotte Propre",
    tasks: [
      { name: "Étude corridors principaux (FR↔DE, Benelux)", done: false },
      { name: "Flotte camions SUNTREX", done: false },
      { name: "App chauffeur", done: false },
    ],
  },
];

const PART_ICONS = {
  "UI/UX": "◈", "Auth & Sécurité": "🔒", "Paiements": "💳", "Dashboards": "📊",
  "Communication": "💬", "Transactions": "📦", "Infrastructure": "⚙️", "Admin": "👑",
  "SUNTREX DELIVERY": "🚛", "IA": "🤖",
};

const PART_COLORS = {
  "UI/UX": "#E8700A", "Auth & Sécurité": "#ef4444", "Paiements": "#6366f1", "Dashboards": "#3b82f6",
  "Communication": "#10b981", "Transactions": "#f59e0b", "Infrastructure": "#64748b", "Admin": "#7c3aed",
  "SUNTREX DELIVERY": "#0d9488", "IA": "#ec4899",
};

function ProgressBar({ done, total, color = "#E8700A", height = 6 }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ flex: 1, height, background: "#f1f5f9", borderRadius: height / 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

function TaskItem({ task }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0" }}>
      <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{task.done ? "✅" : "⬜"}</span>
      <span style={{ fontSize: 12.5, color: task.done ? "#64748b" : "#1e293b", textDecoration: task.done ? "line-through" : "none", lineHeight: 1.4 }}>{task.name}</span>
    </div>
  );
}

function ModuleCard({ mod, expanded, onToggle }) {
  const done = mod.tasks.filter(t => t.done).length;
  const total = mod.tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const phase = PHASES.find(p => p.id === mod.phase);
  const partColor = PART_COLORS[mod.part] || "#64748b";

  return (
    <div style={{
      background: "#fff", borderRadius: 10, border: "1px solid #e8eaef",
      overflow: "hidden", transition: "box-shadow 0.2s",
      boxShadow: expanded ? "0 4px 16px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div onClick={onToggle} style={{
        padding: "14px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15 }}>{PART_ICONS[mod.part] || "◈"}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mod.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {pct === 100 && <span style={{ fontSize: 9, fontWeight: 800, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>DONE</span>}
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{done}/{total}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: partColor, background: `${partColor}15`, padding: "1px 6px", borderRadius: 3 }}>{mod.part}</span>
          <div style={{ flex: 1 }}><ProgressBar done={done} total={total} color={pct === 100 ? "#10b981" : phase?.color || "#E8700A"} height={4} /></div>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ paddingTop: 10 }}>
            {mod.tasks.map((t, i) => <TaskItem key={i} task={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuntrexTracker() {
  const [expandedId, setExpandedId] = useState(null);
  const [activePhase, setActivePhase] = useState("all");
  const [showDoneOnly, setShowDoneOnly] = useState(false);

  const filtered = useMemo(() => {
    let mods = MODULES;
    if (activePhase !== "all") mods = mods.filter(m => m.phase === activePhase);
    if (showDoneOnly) mods = mods.filter(m => m.tasks.some(t => !t.done));
    return mods;
  }, [activePhase, showDoneOnly]);

  const globalStats = useMemo(() => {
    const allTasks = MODULES.flatMap(m => m.tasks);
    const done = allTasks.filter(t => t.done).length;
    return { done, total: allTasks.length, pct: Math.round((done / allTasks.length) * 100) };
  }, []);

  const phaseStats = useMemo(() => {
    return PHASES.map(p => {
      const mods = MODULES.filter(m => m.phase === p.id);
      const tasks = mods.flatMap(m => m.tasks);
      const done = tasks.filter(t => t.done).length;
      return { ...p, done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0, modules: mods.length };
    });
  }, []);

  const codeStats = useMemo(() => {
    // Approximate from file analysis
    return { files: 45, lines: 12847, functions: 5, hooks: 4 };
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#f7f8fa", minHeight: "100vh", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E8700A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#fff"/></svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>SUNTREX</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#E8700A", background: "#fff7ed", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>MVP TRACKER</span>
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Dernière mise à jour : 5 mars 2026 — {globalStats.done}/{globalStats.total} tâches complétées</p>
      </div>

      {/* Global Progress */}
      <div style={{ maxWidth: 800, margin: "0 auto 20px", background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e8eaef" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Progression Globale</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#E8700A" }}>{globalStats.pct}%</span>
        </div>
        <ProgressBar done={globalStats.done} total={globalStats.total} height={10} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
          {[
            { label: "Fichiers", value: "~45", icon: "📄" },
            { label: "Lignes code", value: "~13K", icon: "💻" },
            { label: "Netlify Fn", value: "5", icon: "⚡" },
            { label: "Langues", value: "7", icon: "🌍" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 4px", background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Cards */}
      <div style={{ maxWidth: 800, margin: "0 auto 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {phaseStats.map(p => (
          <div key={p.id} onClick={() => setActivePhase(activePhase === p.id ? "all" : p.id)}
            style={{
              background: activePhase === p.id ? `${p.color}10` : "#fff",
              border: `1px solid ${activePhase === p.id ? p.color : "#e8eaef"}`,
              borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.2s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.target}</span>
            </div>
            <ProgressBar done={p.done} total={p.total} color={p.color} height={4} />
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{p.modules} modules · {p.done}/{p.total} tâches</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ maxWidth: 800, margin: "0 auto 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {activePhase === "all" ? "Tous les modules" : PHASES.find(p => p.id === activePhase)?.label} — {filtered.length} modules
        </span>
        <label style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          <input type="checkbox" checked={showDoneOnly} onChange={e => setShowDoneOnly(e.target.checked)} />
          Masquer modules 100%
        </label>
      </div>

      {/* Module Cards */}
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(m => (
          <ModuleCard key={m.id} mod={m} expanded={expandedId === m.id} onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)} />
        ))}
      </div>

      {/* Business Model Summary */}
      <div style={{ maxWidth: 800, margin: "20px auto 0", background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e8eaef" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 12px" }}>💡 Business Model SUNTREX</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, fontSize: 12 }}>
          {[
            { label: "Modèle", value: "Marketplace B2B — Commission sur transactions" },
            { label: "Commission", value: "5% en dessous des concurrents (sun.store, SolarTraders)" },
            { label: "Marché", value: "🇫🇷🇩🇪🇧🇪🇳🇱🇮🇹🇪🇸 Pros solaire en Europe" },
            { label: "Produits", value: "629 réf. — Onduleurs, batteries, panneaux, montage" },
            { label: "Marques prioritaires", value: "Huawei, Deye, puis toutes marques majeures" },
            { label: "Paiement", value: "Stripe Connect — Destination Charges + 3DS/SCA" },
            { label: "Livraison", value: "SUNTREX DELIVERY — Vérification colis QR + photos" },
            { label: "Support", value: "Multi-canal : Chat IA, WhatsApp, Téléphone, Email" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitors */}
      <div style={{ maxWidth: 800, margin: "12px auto 20px", background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e8eaef" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 12px" }}>⚔️ vs Concurrents</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8eaef" }}>
                {["Feature", "sun.store", "SolarTraders", "SUNTREX"].map((h, i) => (
                  <th key={i} style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: i === 3 ? "#E8700A" : "#64748b", fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Prix masqués / onboarding", "✅", "✅", "✅"],
                ["Chat buyer-seller", "✅", "❌", "✅ + Modération IA"],
                ["Livraison propre", "Partiel", "❌", "✅ SUNTREX DELIVERY"],
                ["Vérif colis (QR/photos)", "❌", "❌", "✅"],
                ["Outils IA", "❌", "❌", "✅"],
                ["Support multi-canal", "Email", "Email", "✅ Chat+WhatsApp+Tel"],
                ["Commission", "Standard", "Standard", "-5% vs marché"],
                ["Escrow avancé", "Basique", "❌", "✅ Avancé"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "7px 6px", color: j === 0 ? "#1e293b" : "#64748b", fontWeight: j === 0 || j === 3 ? 600 : 400, background: j === 3 ? "#fffbf5" : "transparent" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
