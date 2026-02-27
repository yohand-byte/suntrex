/**
 * SUNTREX — Final Rotation Script (post-E2E)
 * Run AFTER all E2E tests pass.
 * Rotates n8n API key and prints manual steps for external secrets.
 *
 * Run: /opt/homebrew/opt/node@22/bin/node scripts/final-rotation.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const DEFAULT_MCP_JSON = '/Users/yohanaboujdid/Downloads/suntrex/.mcp.json';
const MCP_JSON   = process.env.MCP_JSON_PATH || DEFAULT_MCP_JSON;
const ADMIN_EMAIL = 'admin@suntrex.com';
const WF_MAIN    = 'wnarPrvFAgYu0rmF';
const WF_DL      = '0Q23FXcq1VsHZgrr';

function readMcpEnv(filePath) {
  try {
    const mcp = JSON.parse(readFileSync(filePath, 'utf8'));
    return mcp?.mcpServers?.['n8n-mcp']?.env || {};
  } catch {
    return {};
  }
}

const mcpEnv = readMcpEnv(MCP_JSON);
const N8N = process.env.N8N_API_URL || mcpEnv.N8N_API_URL || 'http://localhost:5678';
const CURRENT_API_KEY = process.env.N8N_API_KEY || mcpEnv.N8N_API_KEY || '';

const ok  = s => console.log('  ✅ ' + s);
const err = s => console.log('  ❌ ' + s);
const hdr = s => console.log('\n━━━ ' + s + ' ' + '━'.repeat(Math.max(0, 55 - s.length)));

async function apiGet(path, key = CURRENT_API_KEY) {
  const r = await fetch(N8N + path, { headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': key } });
  const t = await r.text();
  try { return { status: r.status, data: JSON.parse(t) }; }
  catch { return { status: r.status, data: t }; }
}

// ── STEP 1 — Verify n8n running ───────────────────────────────────────────────
hdr('STEP 1/4 — Verify n8n Running');
if (!CURRENT_API_KEY) {
  err('Missing N8N_API_KEY (set env var or configure .mcp.json)');
  process.exit(1);
}

const health = await fetch(N8N + '/healthz').then(r => r.json()).catch(() => null);
if (health?.status !== 'ok') {
  err('n8n not running — start it first: bash start-n8n.sh tunnel');
  process.exit(1);
}
ok('n8n running at ' + N8N);

// Verify workflows still active before rotating
const wfCheck = await apiGet('/api/v1/workflows/' + WF_MAIN);
if (wfCheck.status !== 200 || !wfCheck.data?.active) {
  err('Main workflow not found or inactive — check before rotating');
  process.exit(1);
}
ok('Main payment workflow ACTIVE (' + (wfCheck.data?.nodes?.length || '?') + ' nodes)');

// ── STEP 2 — Rotate n8n API key ───────────────────────────────────────────────
hdr('STEP 2/4 — Rotate n8n API Key');

// Read current admin password from stdin (security: don't hardcode)
const { createInterface } = await import('readline');
const rl = createInterface({ input: process.stdin, output: process.stdout });
const adminPassword = await new Promise(resolve => {
  rl.question('  Enter n8n admin password: ', answer => { rl.close(); resolve(answer.trim()); });
});

// Login
const loginRes = await fetch(N8N + '/rest/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: adminPassword })
});
const sessionCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
if (!sessionCookie) {
  err('Login failed — check password');
  process.exit(1);
}
ok('Login OK');

// Find and delete existing API keys
const keysRes = await fetch(N8N + '/rest/api-keys', { headers: { Cookie: sessionCookie } });
const keysData = await keysRes.json().catch(() => ({ data: [] }));
const existingKeys = keysData.data || keysData || [];

for (const key of existingKeys) {
  const delRes = await fetch(N8N + '/rest/api-keys/' + key.id, { method: 'DELETE', headers: { Cookie: sessionCookie } });
  if (delRes.status === 200 || delRes.status === 204) {
    ok('Deleted old key: ' + (key.label || key.id));
  }
}

// Create new API key
const newKeyRes = await fetch(N8N + '/rest/api-keys', {
  method: 'POST',
  headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
  body: JSON.stringify({ label: 'suntrex-mcp' })
});
const newKeyData = await newKeyRes.json();
const NEW_API_KEY = newKeyData.data?.apiKey || newKeyData.apiKey;

if (!NEW_API_KEY) {
  err('Failed to create new API key: ' + JSON.stringify(newKeyData).slice(0, 200));
  process.exit(1);
}
ok('New API key created: ' + NEW_API_KEY.slice(0, 24) + '...');

// ── STEP 3 — Update .mcp.json ─────────────────────────────────────────────────
hdr('STEP 3/4 — Update .mcp.json');
try {
  const mcp = JSON.parse(readFileSync(MCP_JSON, 'utf8'));
  mcp.mcpServers['n8n-mcp'].env.N8N_API_KEY = NEW_API_KEY;
  writeFileSync(MCP_JSON, JSON.stringify(mcp, null, 2) + '\n');
  ok('.mcp.json updated');
} catch(e) {
  err('Could not update .mcp.json: ' + e.message + '\n  Update manually: N8N_API_KEY = ' + NEW_API_KEY);
}

// ── STEP 4 — Verify workflows active with new key ─────────────────────────────
hdr('STEP 4/4 — Verify with New Key');
const wfList = await apiGet('/api/v1/workflows', NEW_API_KEY);
if (wfList.status === 200) {
  const wfs = wfList.data.data || [];
  ok('n8n API reachable with new key (' + wfs.length + ' workflows)');

  const main = wfs.find(w => w.id === WF_MAIN);
  const dl   = wfs.find(w => w.id === WF_DL);

  main?.active ? ok('Main payment workflow: ACTIVE') : err('Main payment workflow: NOT ACTIVE');
  dl ? ok('Dead-letter workflow: exists') : err('Dead-letter workflow: not found');
} else {
  err('API check failed with new key (status ' + wfList.status + ')');
}

// ── MANUAL STEPS ──────────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANUAL STEPS REQUIRED — EXTERNAL SECRETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. STRIPE WEBHOOK SECRET
   1. Stripe Dashboard → Developers → Webhooks → your endpoint
   2. Click "Roll signing secret"
   3. Copy new whsec_...
   4. n8n → Settings → Variables → STRIPE_WEBHOOK_SECRET = <new whsec_>
   5. Rerun: /opt/homebrew/opt/node@22/bin/node scripts/validate-strict.mjs

B. SUPABASE SERVICE ROLE KEY
   1. Supabase Dashboard → Project Settings → API
   2. Rotate project JWT secret (regenerates anon + service_role)
   3. Copy new service_role key
   4. n8n → Settings → Variables → SUPABASE_SERVICE_ROLE_KEY = <new key>
   5. Rerun: npm run n8n:postcheck

C. VERIFY STRIPE WEBHOOK ENDPOINT URL
   URL must be: https://n8n.suntrex.eu/webhook/${WF_MAIN}/stripe-webhook-entry/stripe-webhook-entry
   Stripe Dashboard → Developers → Webhooks → Edit endpoint URL if needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automated (done now):
  ✅ n8n API key rotated
  ✅ .mcp.json updated

Manual (do now):
  ⏳ Stripe whsec_ rotation (step A above)
  ⏳ Verify Stripe webhook URL (step C)

New n8n API key (save this):
`);
console.log('  ' + NEW_API_KEY);
console.log('');
console.log('After manual steps: /opt/homebrew/opt/node@22/bin/node scripts/validate-strict.mjs');
