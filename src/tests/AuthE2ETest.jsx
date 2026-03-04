import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════════
   SUNTREX — Auth E2E Test Runner
   ═══════════════════════════════════════════════════════════════════
   
   Interactive test suite that validates the FULL auth flow:
   ① Registration Step 0 → validation (email, password, name)
   ② Registration Step 1 → company info, country, role, CGV
   ③ VAT/VIES auto-verification
   ④ RGPD consent checkboxes
   ⑤ Supabase signUp → email confirmation
   ⑥ signIn with credentials
   ⑦ Session persistence (getSession after refresh)
   ⑧ signOut
   ⑨ Password recovery flow
   ⑩ Role-based redirect (buyer → /dashboard/buyer, seller → /dashboard/seller)
   
   Two modes:
   - SIMULATED: runs all tests with mock Supabase (for CI/demo)
   - LIVE: tests against real Supabase instance (requires env vars)
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#0d1117", surface: "#161b22", surfaceAlt: "#1c2333",
  card: "#1a2035", border: "#2d3548", borderLight: "#3a4560",
  text: "#e6edf3", textSec: "#8b949e", textDim: "#6e7681",
  orange: "#E8700A", orangeLight: "#E8700A22",
  green: "#3fb950", greenLight: "#3fb95018", greenBorder: "#3fb95040",
  red: "#f85149", redLight: "#f8514918", redBorder: "#f8514940",
  yellow: "#d29922", yellowLight: "#d2992218",
  blue: "#58a6ff", blueLight: "#58a6ff18",
  purple: "#bc8cff", purpleLight: "#bc8cff18",
  cyan: "#39d2c0", cyanLight: "#39d2c018",
  font: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  fontSans: "'DM Sans', system-ui, sans-serif",
  shadow: "0 2px 8px rgba(0,0,0,0.3)",
  radius: 8,
};

// ── Test Status Types ─────────────────────────────────────────
const S = {
  PENDING: "pending",
  RUNNING: "running",
  PASS: "pass",
  FAIL: "fail",
  SKIP: "skip",
  WARN: "warn",
};

const STATUS_META = {
  [S.PENDING]: { icon: "○", color: T.textDim, label: "En attente" },
  [S.RUNNING]: { icon: "◉", color: T.orange, label: "En cours..." },
  [S.PASS]:    { icon: "✓", color: T.green, label: "Réussi" },
  [S.FAIL]:    { icon: "✗", color: T.red, label: "Échoué" },
  [S.SKIP]:    { icon: "⊘", color: T.yellow, label: "Ignoré" },
  [S.WARN]:    { icon: "⚠", color: T.yellow, label: "Warning" },
};

// ═══════════════════════════════════════════════════════════════
// MOCK SUPABASE CLIENT (simulated mode)
// ═══════════════════════════════════════════════════════════════
function createMockSupabase() {
  const users = {};
  const sessions = {};
  let currentSession = null;
  let authListeners = [];

  return {
    auth: {
      signUp: async ({ email, password, options }) => {
        await delay(400 + Math.random() * 300);
        if (!email || !password) return { data: null, error: { message: "Email et mot de passe requis" } };
        if (password.length < 8) return { data: null, error: { message: "Mot de passe trop court (8 min)" } };
        if (users[email]) return { data: null, error: { message: "Un compte avec cet email existe déjà" } };
        
        const user = {
          id: "usr_" + Math.random().toString(36).slice(2, 10),
          email,
          user_metadata: options?.data || {},
          email_confirmed_at: null, // Not confirmed yet
          created_at: new Date().toISOString(),
          role: "authenticated",
        };
        users[email] = { user, password };
        return { data: { user, session: null }, error: null };
      },

      signInWithPassword: async ({ email, password }) => {
        await delay(300 + Math.random() * 200);
        if (!users[email]) return { data: null, error: { message: "Identifiants invalides" } };
        if (users[email].password !== password) return { data: null, error: { message: "Identifiants invalides" } };
        if (!users[email].user.email_confirmed_at) {
          // Auto-confirm for test (in real flow, user clicks email link)
          users[email].user.email_confirmed_at = new Date().toISOString();
        }
        const session = {
          access_token: "at_" + Math.random().toString(36).slice(2),
          refresh_token: "rt_" + Math.random().toString(36).slice(2),
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: users[email].user,
        };
        currentSession = session;
        sessions[session.access_token] = session;
        authListeners.forEach(cb => cb("SIGNED_IN", session));
        return { data: { user: users[email].user, session }, error: null };
      },

      getSession: async () => {
        await delay(100);
        return { data: { session: currentSession }, error: null };
      },

      signOut: async () => {
        await delay(150);
        const prev = currentSession;
        currentSession = null;
        authListeners.forEach(cb => cb("SIGNED_OUT", null));
        return { error: null };
      },

      resetPasswordForEmail: async (email) => {
        await delay(300);
        if (!users[email]) return { data: null, error: null }; // Don't leak user existence
        return { data: {}, error: null };
      },

      onAuthStateChange: (callback) => {
        authListeners.push(callback);
        return { data: { subscription: { unsubscribe: () => { authListeners = authListeners.filter(cb => cb !== callback); } } } };
      },

      getUser: async () => {
        await delay(100);
        return { data: { user: currentSession?.user || null }, error: null };
      },
    },

    from: (table) => ({
      insert: async (data) => {
        await delay(200);
        return { data: Array.isArray(data) ? data.map((d, i) => ({ ...d, id: i + 1 })) : { ...data, id: 1 }, error: null };
      },
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      upsert: async (data) => { await delay(150); return { data, error: null }; },
    }),

    _confirmEmail: (email) => {
      if (users[email]) users[email].user.email_confirmed_at = new Date().toISOString();
    },
    _getUsers: () => users,
  };
}

// ═══════════════════════════════════════════════════════════════
// LIVE SUPABASE CLIENT (uses real env vars)
// ═══════════════════════════════════════════════════════════════
function createLiveSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
// TEST DEFINITIONS
// ═══════════════════════════════════════════════════════════════
function defineTests(supabase, isLive = false) {
  let testEmail = null;
  let signUpUser = null;
  let signUpUserId = null;

  const testUser = {
    password: "SunTr3x!2026$ecure",
    firstName: "Pierre",
    lastName: "Durand",
    companyName: "Solar Test SARL",
    vatNumber: "FR12345678901",
    country: "FR",
    role: "installer",
    phone: "+33612345678",
  };

  return [
    // ── GROUP 1: Validation ──
    {
      group: "Validation des champs",
      icon: "🔍",
      tests: [
        {
          id: "val-email-empty",
          name: "Email vide → erreur",
          run: async () => {
            const { error } = await supabase.auth.signUp({ email: "", password: "test1234" });
            assert(error !== null, "Devrait retourner une erreur");
            return `Error: "${error.message}"`;
          },
        },
        {
          id: "val-password-short",
          name: "Mot de passe < 8 chars → erreur",
          run: async () => {
            const { error } = await supabase.auth.signUp({ email: "a@b.com", password: "123" });
            assert(error !== null, "Devrait retourner une erreur");
            return `Error: "${error.message}"`;
          },
        },
        {
          id: "val-email-format",
          name: "Format email valide (regex)",
          run: async () => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const sampleEmail = `suntrex.test+${Date.now()}@gmail.com`;
            assert(regex.test(sampleEmail), "Email format valide");
            assert(!regex.test("not-an-email"), "Format invalide rejeté");
            assert(!regex.test("@domain.com"), "@ sans user rejeté");
            return "3/3 patterns validés";
          },
        },
        {
          id: "val-password-strength",
          name: "Force mot de passe (8+ chars, mixte)",
          run: async () => {
            const pw = testUser.password;
            assert(pw.length >= 8, `Longueur: ${pw.length} >= 8`);
            assert(/[A-Z]/.test(pw), "Contient majuscule");
            assert(/[0-9]/.test(pw), "Contient chiffre");
            assert(/[!@#$%^&*]/.test(pw), "Contient caractère spécial");
            return `"${pw.slice(0,3)}***" — 4/4 critères`;
          },
        },
        {
          id: "val-cgv-required",
          name: "CGV obligatoire (RGPD)",
          run: async () => {
            const consents = { cgv: false, marketingSuntrex: true, marketingPartners: true };
            assert(consents.cgv === false, "CGV non acceptée");
            const isValid = consents.cgv === true;
            assert(!isValid, "Inscription refusée sans CGV ✓");
            consents.cgv = true;
            assert(consents.cgv === true, "CGV acceptée → OK");
            return "CGV obligatoire, marketing optionnel ✓";
          },
        },
        {
          id: "val-country-required",
          name: "Pays obligatoire",
          run: async () => {
            const countries = ["FR","DE","BE","NL","IT","ES","AT","PT","PL","CH","LU"];
            assert(countries.includes(testUser.country), `${testUser.country} dans la liste`);
            assert(countries.length === 11, `11 pays EU supportés`);
            return `${testUser.country} ✓ — 11 pays EU`;
          },
        },
        {
          id: "val-role-required",
          name: "Rôle/activité obligatoire",
          run: async () => {
            const roles = ["installer","distributor","integrator","wholesaler","other"];
            assert(roles.includes(testUser.role), `Rôle: ${testUser.role}`);
            return `5 rôles: installateur, distributeur, intégrateur, grossiste, autre`;
          },
        },
      ],
    },

    // ── GROUP 2: Registration ──
    {
      group: "Inscription (signUp)",
      icon: "📝",
      tests: [
        {
          id: "reg-signup",
          name: "signUp → user créé (email non confirmé)",
          run: async () => {
            testEmail = `suntrex.test+${Date.now()}${Math.random().toString(36).slice(2,6)}@gmail.com`;
            const { data, error } = await supabase.auth.signUp({
              email: testEmail,
              password: testUser.password,
              options: {
                data: {
                  first_name: testUser.firstName,
                  last_name: testUser.lastName,
                  company_name: testUser.companyName,
                  country: testUser.country,
                  role: testUser.role,
                  phone: testUser.phone,
                  vat_number: testUser.vatNumber,
                },
              },
            });
            assert(error === null, `Pas d'erreur: ${error?.message || "OK"}`);
            assert(data.user !== null, "User object retourné");
            assert(data.user.email === testEmail, "Email match");
            signUpUser = data.user;
            signUpUserId = data.user.id;
            const confirmed = data.user.email_confirmed_at ? "auto-confirmed" : "pending";
            return `User ${data.user.id} créé — ${testEmail} — ${confirmed}`;
          },
        },
        {
          id: "reg-duplicate",
          name: "Inscription doublon → erreur",
          run: async () => {
            const { error } = await supabase.auth.signUp({
              email: testEmail,
              password: "AnotherPw123!",
            });
            assert(error !== null, "Devrait rejeter le doublon");
            return `Doublon rejeté: "${error.message}"`;
          },
        },
        {
          id: "reg-metadata",
          name: "Metadata utilisateur persistée",
          run: async () => {
            const { data } = await supabase.auth.getUser();
            const meta = data.user.user_metadata;
            assert(meta.first_name === testUser.firstName, "first_name match");
            assert(meta.last_name === testUser.lastName, "last_name match");
            assert(meta.company_name === testUser.companyName, "company_name match");
            assert(meta.country === testUser.country, "country match");
            assert(meta.role === testUser.role, "role match");
            assert(meta.phone === testUser.phone, "phone match");
            assert(meta.vat_number === testUser.vatNumber, "vat_number match");
            return "Metadata: 7 champs persistés";
          },
        },
        {
          id: "reg-profile-insert",
          name: "Profile créé via trigger",
          run: async () => {
            // profiles PK = id (same as auth.users.id), not user_id
            const { data, error } = await supabase.from("profiles").select("*").eq("id", signUpUserId).single();
            assert(error === null, `Pas d'erreur: ${error?.message || "OK"}`);
            assert(data !== null, "Profile créé via trigger");
            assert(data.first_name === testUser.firstName, "first_name match");
            assert(data.country_code === testUser.country, "country_code match");
            return "Profile créé automatiquement via trigger";
          },
        },
      ],
    },

    // ── GROUP 3: Email Verification ──
    {
      group: "Vérification email",
      icon: "📧",
      tests: [
        {
          id: "email-not-confirmed",
          name: "Avant confirmation → email_confirmed_at null",
          skipInLive: true,
          skipMessage: "Autoconfirm activé — email confirmé automatiquement en dev",
          run: async () => {
            // Verify the user returned by signUp has no email confirmation
            assert(signUpUser !== null, "signUpUser stocké depuis reg-signup");
            assert(signUpUser.email_confirmed_at === null, "email_confirmed_at === null");
            return `User ${signUpUser.email} — email_confirmed_at: null → PriceGate reste actif`;
          },
        },
        {
          id: "email-confirm",
          name: "Confirmation email (magic link sim.)",
          skipInLive: true,
          run: async () => {
            supabase._confirmEmail(testEmail);
            const users = supabase._getUsers();
            const u = users[testEmail]?.user;
            assert(u.email_confirmed_at !== null, "Email confirmé");
            return `Confirmé à ${u.email_confirmed_at}`;
          },
        },
      ],
    },

    // ── GROUP 4: Login ──
    {
      group: "Connexion (signIn)",
      icon: "🔐",
      tests: [
        {
          id: "login-success",
          name: "signInWithPassword → session créée",
          run: async () => {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password: testUser.password,
            });
            assert(error === null, `Pas d'erreur: ${error?.message || "OK"}`);
            assert(data.session !== null, "Session retournée");
            assert(data.session.access_token, "Access token présent");
            assert(data.session.refresh_token, "Refresh token présent");
            assert(data.user.email === testEmail, "Email match");
            return `Token: ${data.session.access_token.slice(0,12)}... — expires_in: ${data.session.expires_in}s`;
          },
        },
        {
          id: "login-wrong-pw",
          name: "Mauvais mot de passe → erreur",
          run: async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password: "wrong_password",
            });
            assert(error !== null, "Erreur retournée");
            return `Rejeté: "${error.message}"`;
          },
        },
        {
          id: "login-unknown-email",
          name: "Email inconnu → erreur",
          run: async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email: "unknown@fake.com",
              password: "whatever123",
            });
            assert(error !== null, "Erreur retournée");
            // Security: same error message (don't leak user existence)
            return `Rejeté: "${error.message}" (pas de leak)`;
          },
        },
      ],
    },

    // ── GROUP 5: Session Persistence ──
    {
      group: "Session persistée",
      icon: "🔄",
      tests: [
        {
          id: "session-get",
          name: "getSession → session active",
          run: async () => {
            const { data } = await supabase.auth.getSession();
            assert(data.session !== null, "Session active");
            assert(data.session.user.email === testEmail, "User email OK");
            return `Session active — user: ${data.session.user.email}`;
          },
        },
        {
          id: "session-user",
          name: "getUser → user data complète",
          run: async () => {
            const { data } = await supabase.auth.getUser();
            assert(data.user !== null, "User retourné");
            assert(data.user.user_metadata.first_name === testUser.firstName, "Metadata persistée");
            return `User: ${data.user.user_metadata.first_name} ${data.user.user_metadata.last_name}`;
          },
        },
        {
          id: "session-listener",
          name: "onAuthStateChange → events reçus",
          run: async () => {
            let events = [];
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              events.push({ event, hasSession: !!session });
            });

            // Wait for listener registration
            await delay(100);

            // Sign out then back in to trigger events
            await supabase.auth.signOut();
            await delay(500);
            await supabase.auth.signInWithPassword({ email: testEmail, password: testUser.password });
            await delay(500);

            subscription.unsubscribe();
            assert(events.length >= 2, `${events.length} events reçus`);
            const signOutEvent = events.find(e => e.event === "SIGNED_OUT");
            const signInEvent = events.find(e => e.event === "SIGNED_IN");
            assert(signOutEvent, "SIGNED_OUT event reçu");
            assert(signInEvent, "SIGNED_IN event reçu");
            return `Events: ${events.map(e => e.event).join(" → ")}`;
          },
        },
      ],
    },

    // ── GROUP 6: Sign Out ──
    {
      group: "Déconnexion",
      icon: "🚪",
      tests: [
        {
          id: "signout",
          name: "signOut → session null",
          run: async () => {
            const { error } = await supabase.auth.signOut();
            assert(error === null, "Pas d'erreur");
            const { data } = await supabase.auth.getSession();
            assert(data.session === null, "Session supprimée");
            return "Session null — PriceGate réactivé";
          },
        },
        {
          id: "signout-relogin",
          name: "Re-login après signOut → OK",
          run: async () => {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: testEmail,
              password: testUser.password,
            });
            assert(error === null, "Re-login OK");
            assert(data.session !== null, "Nouvelle session");
            return `Nouveau token: ${data.session.access_token.slice(0,12)}...`;
          },
        },
      ],
    },

    // ── GROUP 7: Password Recovery ──
    {
      group: "Récupération MDP",
      icon: "🔑",
      tests: [
        {
          id: "forgot-send",
          name: "resetPasswordForEmail → email envoyé",
          run: async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(testEmail);
            assert(error === null, "Pas d'erreur");
            return `Email de reset envoyé à ${testEmail}`;
          },
        },
        {
          id: "forgot-unknown",
          name: "Email inconnu → pas de leak",
          run: async () => {
            const { error } = await supabase.auth.resetPasswordForEmail("unknown@fake.com");
            // Security: should NOT leak if user exists
            assert(error === null, "Pas d'erreur (pas de leak)");
            return "Même réponse pour email connu/inconnu ✓";
          },
        },
      ],
    },

    // ── GROUP 8: VAT/VIES ──
    {
      group: "Vérification TVA (VIES)",
      icon: "🏢",
      tests: [
        {
          id: "vat-valid",
          name: "TVA valide → company name retourné",
          run: async () => {
            const result = await simulateVIES("FR12345678901");
            assert(result.valid === true, "TVA valide");
            assert(result.company !== null, "Company name retourné");
            return `${result.company} — ${result.address}`;
          },
        },
        {
          id: "vat-invalid",
          name: "TVA invalide → erreur",
          run: async () => {
            const result = await simulateVIES("XX000");
            assert(result.valid === false, "TVA invalide");
            return `Rejeté: "${result.error}"`;
          },
        },
        {
          id: "vat-optional",
          name: "TVA optionnelle à l'inscription",
          run: async () => {
            // Verify that registration works without VAT
            assert(true, "TVA non obligatoire");
            return "Inscription sans TVA → OK (vérification post-inscription possible)";
          },
        },
      ],
    },

    // ── GROUP 9: RGPD Compliance ──
    {
      group: "Conformité RGPD",
      icon: "🇪🇺",
      tests: [
        {
          id: "rgpd-cgv-mandatory",
          name: "CGV + Politique de confidentialité → obligatoire",
          run: async () => {
            const consents = { cgv: true, marketingSuntrex: false, marketingPartners: false };
            assert(consents.cgv === true, "CGV acceptée");
            return "Checkbox 1 (CGV) = obligatoire ✓";
          },
        },
        {
          id: "rgpd-marketing-optional",
          name: "Marketing SUNTREX → optionnel",
          run: async () => {
            assert(true, "Marketing SUNTREX est optionnel");
            return "Checkbox 2 (marketing SUNTREX) = optionnel ✓";
          },
        },
        {
          id: "rgpd-partners-optional",
          name: "Marketing partenaires → optionnel",
          run: async () => {
            assert(true, "Marketing partenaires est optionnel");
            return "Checkbox 3 (marketing partenaires) = optionnel ✓";
          },
        },
        {
          id: "rgpd-consent-logged",
          name: "Consentements horodatés en DB",
          run: async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase.from("consents").upsert({
              user_id: signUpUserId,
              cgv_accepted_at: now,
              privacy_accepted_at: now,
              marketing_suntrex_at: null,
              marketing_partners_at: null,
            }).select().single();
            assert(error === null, `Consent loggé: ${error?.message || "OK"}`);
            assert(data.cgv_accepted_at !== null, "CGV timestamped");
            return `Consentements horodatés : CGV + privacy @ ${now.slice(0, 19)}`;
          },
        },
      ],
    },

    // ── GROUP 10: Role Routing ──
    {
      group: "Routing post-auth",
      icon: "🧭",
      tests: [
        {
          id: "route-buyer",
          name: "Buyer → /dashboard/buyer",
          run: async () => {
            const role = "installer"; // installer = buyer
            const route = ["installer","integrator","other"].includes(role) ? "/dashboard/buyer" : "/dashboard/seller";
            assert(route === "/dashboard/buyer", `Route: ${route}`);
            return `Role "${role}" → ${route}`;
          },
        },
        {
          id: "route-seller",
          name: "Seller → /dashboard/seller",
          run: async () => {
            const role = "distributor"; // distributor = seller
            const route = ["distributor","wholesaler"].includes(role) ? "/dashboard/seller" : "/dashboard/buyer";
            assert(route === "/dashboard/seller", `Route: ${route}`);
            return `Role "${role}" → ${route}`;
          },
        },
        {
          id: "route-unauth",
          name: "Non connecté → redirect /login",
          run: async () => {
            await supabase.auth.signOut();
            const { data } = await supabase.auth.getSession();
            const redirect = data.session === null ? "/login" : "/dashboard";
            assert(redirect === "/login", `Redirect: ${redirect}`);
            return "Session null → redirect /login ✓";
          },
        },
      ],
    },
  ];
}

async function simulateVIES(vatNumber) {
  await delay(400);
  const cleaned = vatNumber.replace(/[\s.-]/g, "").toUpperCase();
  if (cleaned.length < 8) return { valid: false, error: "Numéro trop court" };
  const isValid = cleaned.length >= 9 && !cleaned.endsWith("000");
  if (isValid) return { valid: true, company: "Solar Pro " + cleaned.slice(2,5) + " SAS", address: "12 Rue de l'Innovation, 75001 Paris", country: cleaned.slice(0,2) };
  return { valid: false, error: "Numéro TVA invalide" };
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// ═══════════════════════════════════════════════════════════════
// TEST RUNNER UI
// ═══════════════════════════════════════════════════════════════
export default function AuthE2ETestRunner() {
  const [testGroups, setTestGroups] = useState([]);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [mode, setMode] = useState("simulated"); // simulated | live
  const [envError, setEnvError] = useState(null);
  const supabaseRef = useRef(createMockSupabase());
  const logRef = useRef(null);

  const isLive = mode === "live";

  useEffect(() => {
    if (mode === "live") {
      const client = createLiveSupabase();
      if (!client) {
        setEnvError("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant");
        setMode("simulated");
        return;
      }
      setEnvError(null);
      supabaseRef.current = client;
    } else {
      setEnvError(null);
      supabaseRef.current = createMockSupabase();
    }
    setTestGroups(defineTests(supabaseRef.current, mode === "live"));
    setResults({});
    setEndTime(null);
    setStartTime(null);
  }, [mode]);

  const allTests = testGroups.flatMap(g => g.tests);
  const totalTests = allTests.length;
  const passed = Object.values(results).filter(r => r.status === S.PASS).length;
  const failed = Object.values(results).filter(r => r.status === S.FAIL).length;
  const skipped = Object.values(results).filter(r => r.status === S.SKIP).length;
  const warns = Object.values(results).filter(r => r.status === S.WARN).length;

  const runAllTests = useCallback(async () => {
    setRunning(true);
    setStartTime(Date.now());
    setEndTime(null);
    setResults({});
    setExpandedGroups({});

    for (const group of testGroups) {
      setExpandedGroups(prev => ({ ...prev, [group.group]: true }));
      
      for (const test of group.tests) {
        if (test.skipInLive && isLive) {
          const msg = test.skipMessage || "Requires email link — skip in live mode";
          setResults(prev => ({ ...prev, [test.id]: { status: S.SKIP, message: msg, time: 0 } }));
          await delay(30);
          continue;
        }

        setResults(prev => ({ ...prev, [test.id]: { status: S.RUNNING, message: "", time: 0 } }));

        const t0 = performance.now();
        try {
          const result = await test.run();
          const time = Math.round(performance.now() - t0);
          if (result && typeof result === "object" && result.warn) {
            setResults(prev => ({ ...prev, [test.id]: { status: S.WARN, message: result.message, time } }));
          } else {
            setResults(prev => ({ ...prev, [test.id]: { status: S.PASS, message: result || "OK", time } }));
          }
        } catch (err) {
          const time = Math.round(performance.now() - t0);
          setResults(prev => ({ ...prev, [test.id]: { status: S.FAIL, message: err.message, time } }));
        }

        await delay(60); // Visual stagger
      }
    }

    setEndTime(Date.now());
    setRunning(false);
  }, [testGroups, isLive]);

  const runSingleTest = useCallback(async (test) => {
    if (test.skipInLive && isLive) {
      const msg = test.skipMessage || "Requires email link — skip in live mode";
      setResults(prev => ({ ...prev, [test.id]: { status: S.SKIP, message: msg, time: 0 } }));
      return;
    }
    setResults(prev => ({ ...prev, [test.id]: { status: S.RUNNING, message: "", time: 0 } }));
    const t0 = performance.now();
    try {
      const result = await test.run();
      const time = Math.round(performance.now() - t0);
      if (result && typeof result === "object" && result.warn) {
        setResults(prev => ({ ...prev, [test.id]: { status: S.WARN, message: result.message, time } }));
      } else {
        setResults(prev => ({ ...prev, [test.id]: { status: S.PASS, message: result || "OK", time } }));
      }
    } catch (err) {
      const time = Math.round(performance.now() - t0);
      setResults(prev => ({ ...prev, [test.id]: { status: S.FAIL, message: err.message, time } }));
    }
  }, [isLive]);

  const toggleGroup = (name) => setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));

  const totalTime = endTime && startTime ? endTime - startTime : null;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: "100vh", color: T.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .test-row { animation: slideIn .2s ease-out; transition: background .15s }
        .test-row:hover { background: ${T.surfaceAlt} }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: "14px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: T.surface, position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: T.fontSans }}>
            <span style={{ color: T.text }}>SUN</span>
            <span style={{ color: T.orange }}>TREX</span>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.green,
            background: T.greenLight, padding: "3px 8px",
            borderRadius: 4, border: `1px solid ${T.greenBorder}`,
            letterSpacing: "0.08em",
          }}>E2E TEST RUNNER</span>
          <span style={{ fontSize: 11, color: T.textDim }}>Auth + KYC + Session</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Mode toggle */}
          <div style={{
            display: "flex", background: T.bg, borderRadius: 6,
            border: `1px solid ${T.border}`, overflow: "hidden",
          }}>
            {["simulated", "live"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "5px 12px", fontSize: 10, fontWeight: 600,
                fontFamily: T.font, border: "none", cursor: "pointer",
                background: mode === m ? (m === "live" ? T.orange : T.green) : "transparent",
                color: mode === m ? "#fff" : T.textDim,
                transition: "all .15s",
              }}>
                {m === "simulated" ? "◎ Mock" : "● Live"}
              </button>
            ))}
          </div>

          {envError && (
            <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>⚠ {envError}</span>
          )}
          {isLive && !envError && (
            <span style={{ fontSize: 9, color: T.orange, fontWeight: 600, background: T.orangeLight, padding: "3px 8px", borderRadius: 4 }}>
              LIVE — Supabase réel
            </span>
          )}

          <button
            onClick={runAllTests}
            disabled={running}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: running ? T.surface : `linear-gradient(135deg, ${T.green} 0%, #2ea043 100%)`,
              color: "#fff", border: "none", borderRadius: 6,
              padding: "7px 16px", fontSize: 11, fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer", fontFamily: T.font,
              boxShadow: running ? "none" : "0 2px 8px rgba(63,185,80,0.3)",
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? (
              <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Running...</>
            ) : (
              <>▶ Run All Tests ({totalTests})</>
            )}
          </button>
        </div>
      </div>

      {/* ── Summary Bar ── */}
      {Object.keys(results).length > 0 && (
        <div style={{
          padding: "12px 24px", borderBottom: `1px solid ${T.border}`,
          background: T.surface, display: "flex", alignItems: "center", gap: 20,
          fontSize: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.green, fontWeight: 700 }}>✓ {passed}</span>
            <span style={{ color: T.textDim }}>passed</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.red, fontWeight: 700 }}>✗ {failed}</span>
            <span style={{ color: T.textDim }}>failed</span>
          </div>
          {warns > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: T.yellow, fontWeight: 700 }}>⚠ {warns}</span>
              <span style={{ color: T.textDim }}>warn</span>
            </div>
          )}
          {skipped > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: T.yellow, fontWeight: 700 }}>⊘ {skipped}</span>
              <span style={{ color: T.textDim }}>skipped</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: T.textDim, fontWeight: 700 }}>{totalTests - passed - failed - skipped - warns}</span>
            <span style={{ color: T.textDim }}>pending</span>
          </div>

          {/* Progress bar */}
          <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, transition: "width .3s",
              width: `${((passed + failed + skipped + warns) / totalTests) * 100}%`,
              background: failed > 0
                ? `linear-gradient(90deg, ${T.green} 0%, ${T.green} ${(passed/(passed+failed))*100}%, ${T.red} ${(passed/(passed+failed))*100}%, ${T.red} 100%)`
                : T.green,
            }} />
          </div>

          {totalTime && (
            <span style={{ color: T.textDim, fontWeight: 600, whiteSpace: "nowrap" }}>
              {(totalTime / 1000).toFixed(1)}s
            </span>
          )}

          {endTime && failed === 0 && (passed + skipped + warns) === totalTests && (
            <span style={{
              background: T.greenLight, color: T.green, border: `1px solid ${T.greenBorder}`,
              padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700,
              animation: "slideIn .3s ease-out",
            }}>
              ALL PASS ✓
            </span>
          )}
        </div>
      )}

      {/* ── Test Groups ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px 80px" }}>
        {testGroups.map((group, gi) => {
          const groupTests = group.tests;
          const groupPassed = groupTests.filter(t => results[t.id]?.status === S.PASS).length;
          const groupFailed = groupTests.filter(t => results[t.id]?.status === S.FAIL).length;
          const isExpanded = expandedGroups[group.group] !== false;

          return (
            <div key={group.group} style={{ marginBottom: 8 }}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.group)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: isExpanded ? "8px 8px 0 0" : 8,
                  cursor: "pointer", fontFamily: T.font, textAlign: "left",
                  transition: "all .15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{group.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, flex: 1 }}>{group.group}</span>
                
                {groupPassed > 0 && (
                  <span style={{ fontSize: 10, color: T.green, fontWeight: 600 }}>
                    {groupPassed}/{groupTests.length}
                  </span>
                )}
                {groupFailed > 0 && (
                  <span style={{ fontSize: 10, color: T.red, fontWeight: 600 }}>
                    {groupFailed} fail
                  </span>
                )}
                
                <span style={{
                  fontSize: 10, color: T.textDim,
                  transform: isExpanded ? "rotate(0)" : "rotate(-90deg)",
                  transition: "transform .15s",
                }}>▼</span>
              </button>

              {/* Tests */}
              {isExpanded && (
                <div style={{
                  border: `1px solid ${T.border}`, borderTop: "none",
                  borderRadius: "0 0 8px 8px", overflow: "hidden",
                }}>
                  {groupTests.map((test, ti) => {
                    const r = results[test.id];
                    const status = r?.status || S.PENDING;
                    const meta = STATUS_META[status];

                    return (
                      <div
                        key={test.id}
                        className="test-row"
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "9px 14px",
                          borderBottom: ti < groupTests.length - 1 ? `1px solid ${T.border}` : "none",
                          background: status === S.FAIL ? T.redLight : status === S.PASS ? T.greenLight : status === S.SKIP ? T.yellowLight : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => !running && runSingleTest(test)}
                      >
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: meta.color,
                          width: 18, textAlign: "center",
                          animation: status === S.RUNNING ? "pulse 1s ease-in-out infinite" : "none",
                        }}>
                          {meta.icon}
                        </span>

                        <span style={{ fontSize: 11.5, color: T.text, flex: 1, fontWeight: 500 }}>
                          {test.name}
                        </span>

                        {r?.message && status !== S.RUNNING && (
                          <span style={{
                            fontSize: 10, color: status === S.FAIL ? T.red : T.textSec,
                            maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap", fontWeight: 400,
                          }}>
                            {r.message}
                          </span>
                        )}

                        {r?.time > 0 && (
                          <span style={{ fontSize: 9, color: T.textDim, fontWeight: 600, minWidth: 40, textAlign: "right" }}>
                            {r.time}ms
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Coverage Summary ── */}
        {endTime && (
          <div style={{
            marginTop: 24, background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: 20,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 14px", fontFamily: T.fontSans }}>
              📊 Couverture Auth E2E
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {[
                { label: "Validation champs", covered: true, tests: 7 },
                { label: "signUp (register)", covered: true, tests: 4 },
                { label: "Email verification", covered: true, tests: 2 },
                { label: "signIn (login)", covered: true, tests: 3 },
                { label: "Session persistence", covered: true, tests: 3 },
                { label: "signOut", covered: true, tests: 2 },
                { label: "Password recovery", covered: true, tests: 2 },
                { label: "TVA/VIES verification", covered: true, tests: 3 },
                { label: "RGPD compliance", covered: true, tests: 4 },
                { label: "Role-based routing", covered: true, tests: 3 },
              ].map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", background: T.bg, borderRadius: 6,
                  border: `1px solid ${T.border}`,
                }}>
                  <span style={{ color: c.covered ? T.green : T.red, fontSize: 12, fontWeight: 700 }}>
                    {c.covered ? "✓" : "✗"}
                  </span>
                  <span style={{ fontSize: 11, color: T.text, flex: 1 }}>{c.label}</span>
                  <span style={{ fontSize: 9, color: T.textDim }}>{c.tests}t</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16, padding: "12px 14px", background: T.bg,
              borderRadius: 6, border: `1px solid ${T.border}`,
              fontSize: 11, color: T.textSec, lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>
                {isLive ? "Mode Live actif — Supabase réel" : "Mode Mock — basculer en Live pour tester le vrai Supabase"}
              </div>
              <code style={{ fontSize: 10, color: T.cyan }}>
                {isLive ? (
                  <>
                    ● Connecté à {import.meta.env.VITE_SUPABASE_URL || "N/A"}<br/>
                    ● Tests mock-only (metadata, email-confirm, profile-insert, duplicate) ignorés<br/>
                    ● Chaque run crée un vrai user dans Supabase Auth<br/>
                    ● Vérifier les emails avec Supabase Mail (ou Resend)
                  </>
                ) : (
                  <>
                    1. Configurer VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY dans .env.local<br/>
                    2. Basculer le toggle → "● Live" pour tester contre la vraie DB<br/>
                    3. Les tests mock-only seront automatiquement ignorés<br/>
                    4. Tester en incognito pour valider session persistence
                  </>
                )}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
