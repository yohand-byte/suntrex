/**
 * SUNTREX — Prod-Strict Validation (warnings = failures)
 * Exit 0 = ALL checks green — safe to go live
 * Exit 1 = any failure OR warning — do NOT go live
 *
 * Run: /opt/homebrew/opt/node@22/bin/node scripts/validate-strict.mjs
 */

import { createHmac } from 'crypto';

const API_KEY     = 'n8n_api_ac504f192e4cdd1eb95ccb8b6d7237999e44b199ad78879876c7dcb19569cd28750d74f9bb6a66e6';
const N8N         = 'http://localhost:5678';
const SUPABASE    = 'https://uigoadkslyztxgzahmwv.supabase.co';
const WF_MAIN     = 'wnarPrvFAgYu0rmF';
const WF_DL       = '0Q23FXcq1VsHZgrr';
const WEBHOOK_URL = `${N8N}/webhook/${WF_MAIN}/stripe-webhook-entry/stripe-webhook-entry`;

let passed = 0, failed = 0;

const ok   = (s) => { passed++; console.log('  ✅ ' + s); };
const fail = (s) => { failed++; console.log('  ❌ ' + s); };
// In strict mode, warnings count as failures
const warn = (s) => { failed++; console.log('  ❌ [STRICT] ' + s); };
const hdr  = (s) => console.log('\n━━━ ' + s + ' ' + '━'.repeat(Math.max(0, 55 - s.length)));
const h    = { 'Content-Type': 'application/json', 'X-N8N-API-KEY': API_KEY };

async function get(url, headers = {}) {
  try {
    const r = await fetch(url, { headers: { ...h, ...headers } });
    const t = await r.text();
    try { return { status: r.status, data: JSON.parse(t) }; }
    catch { return { status: r.status, data: t }; }
  } catch(e) { return { status: 0, data: e.message }; }
}

// ── CHECK 1 — n8n health ─────────────────────────────────────────────────────
hdr('CHECK 1/7 — n8n Health & Auth');
const health = await get(`${N8N}/healthz`);
health.data?.status === 'ok' ? ok('n8n running') : fail('n8n unreachable');

const wfRes = await get(`${N8N}/api/v1/workflows/${WF_MAIN}`);
if (wfRes.status === 200) {
  ok('API key valid');
  wfRes.data?.active ? ok('Main workflow ACTIVE') : fail('Main workflow NOT active — activate it');
} else {
  fail('API/workflow error ' + wfRes.status);
}

const dlRes = await get(`${N8N}/api/v1/workflows/${WF_DL}`);
dlRes.status === 200
  ? ok('Dead-letter workflow exists')
  : warn('Dead-letter workflow not found — required for prod error handling');

// ── CHECK 2 — Variables ───────────────────────────────────────────────────────
hdr('CHECK 2/7 — n8n Variables (STRIPE + SUPABASE)');
const varsRes = await get(`${N8N}/api/v1/variables`);
let varsData = [];

if (varsRes.status === 200) {
  varsData = varsRes.data?.data || [];
  const sv  = varsData.find(v => v.key === 'STRIPE_WEBHOOK_SECRET');
  const sbv = varsData.find(v => v.key === 'SUPABASE_SERVICE_ROLE_KEY');

  sv?.value?.startsWith('whsec_')  ? ok('STRIPE_WEBHOOK_SECRET set (whsec_)')
    : sv?.value                    ? fail('STRIPE_WEBHOOK_SECRET wrong format')
                                   : fail('STRIPE_WEBHOOK_SECRET NOT configured → n8n Settings → Variables');

  sbv?.value?.startsWith('eyJ')    ? ok('SUPABASE_SERVICE_ROLE_KEY set (JWT)')
    : sbv?.value                   ? fail('SUPABASE_SERVICE_ROLE_KEY wrong format')
                                   : fail('SUPABASE_SERVICE_ROLE_KEY NOT configured → n8n Settings → Variables');
} else if (varsRes.status === 403) {
  warn('Variables API 403 (Community plan) — cannot verify secrets. Set STRIPE_WEBHOOK_SECRET + SUPABASE_SERVICE_ROLE_KEY manually in n8n Settings → Variables');
} else {
  warn('Cannot read Variables (status ' + varsRes.status + ')');
}

// ── CHECK 3 — Supabase ───────────────────────────────────────────────────────
hdr('CHECK 3/7 — Supabase Connectivity');
const serviceKey = varsData.find(v => v.key === 'SUPABASE_SERVICE_ROLE_KEY')?.value;
if (serviceKey) {
  const sbRes = await fetch(`${SUPABASE}/rest/v1/transaction_events?limit=1&select=id`, {
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, Accept: 'application/json' }
  });
  if (sbRes.status === 200) { ok('Supabase reachable'); ok('transaction_events table accessible'); }
  else if (sbRes.status === 404) { fail('transaction_events table not found — run Supabase migration'); }
  else { fail('Supabase returned ' + sbRes.status); }

  const orderRes = await fetch(`${SUPABASE}/rest/v1/Order?limit=1&select=id,status`, {
    headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, Accept: 'application/json' }
  });
  orderRes.status === 200 ? ok('Order table accessible') : fail('Order table ' + orderRes.status + ' — check RLS/table name');
} else {
  warn('Cannot test Supabase — SUPABASE_SERVICE_ROLE_KEY not readable');
}

// ── CHECK 4 — Webhook endpoint ───────────────────────────────────────────────
hdr('CHECK 4/7 — Webhook Endpoint (clean URL, no spaces)');
WEBHOOK_URL.includes('%20') || WEBHOOK_URL.includes(' ')
  ? fail('Webhook URL has spaces — rename the webhook node in n8n')
  : ok('Webhook URL clean: ' + WEBHOOK_URL);

const whr = await fetch(WEBHOOK_URL, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'test.ping', id: 'evt_test_ping' })
}).catch(() => ({ status: 0 }));

whr.status === 200 ? ok('Webhook reachable (200)')
  : whr.status === 404 ? fail('Webhook 404 — workflow not active or URL wrong')
  : fail('Webhook unreachable (status ' + whr.status + ')');

// ── CHECK 5 — HTTPS URL ───────────────────────────────────────────────────────
hdr('CHECK 5/7 — HTTPS Public URL (required for Stripe)');
const settingsRes = await get(`${N8N}/rest/settings`);
const publicUrl = settingsRes.data?.data?.urlBaseWebhook || '';

let pubUrl = '';
if (publicUrl.startsWith('https://') && !publicUrl.includes('localhost')) {
  ok('HTTPS configured: ' + publicUrl);
  pubUrl = publicUrl + 'webhook/' + WF_MAIN + '/stripe-webhook-entry/stripe-webhook-entry';
  const pubRes = await fetch(pubUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'test.ping' })
  }).catch(() => ({ status: 0 }));
  pubRes.status === 200 ? ok('Public webhook reachable') : fail('Public webhook ' + pubRes.status + ' — check tunnel');
} else {
  fail('No HTTPS URL — Stripe cannot deliver webhooks to localhost');
  console.log('  Fix: bash start-n8n.sh tunnel');
}

// ── CHECK 6 — Stripe signature ────────────────────────────────────────────────
hdr('CHECK 6/7 — Stripe Signature Verification');
const fakeSecret = varsData.find(v => v.key === 'STRIPE_WEBHOOK_SECRET')?.value || '';
if (fakeSecret.startsWith('whsec_')) {
  const raw = Buffer.from(fakeSecret.replace('whsec_', ''), 'base64');
  const ts  = Math.floor(Date.now() / 1000);
  const pl  = JSON.stringify({ id: 'evt_test_' + Date.now(), type: 'test.ping', data: { object: { metadata: {} } } });
  const sig = createHmac('sha256', raw).update(`${ts}.${pl}`, 'utf8').digest('hex');
  const sigRes = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${ts},v1=${sig}` },
    body: pl
  }).catch(() => ({ status: 0 }));
  sigRes.status === 200 ? ok('Stripe signature verification passes')
    : warn('Sig test returned ' + sigRes.status + ' — expected 200 ACK');
} else {
  warn('STRIPE_WEBHOOK_SECRET not readable — cannot validate signature logic');
}

// ── CHECK 7 — Execution health ────────────────────────────────────────────────
hdr('CHECK 7/7 — Execution Health (0 errors required)');
const execRes = await get(`${N8N}/api/v1/executions?workflowId=${WF_MAIN}&limit=10&status=error`);
if (execRes.status === 200) {
  const errs = execRes.data?.data || [];
  if (errs.length === 0) { ok('No failed executions'); }
  else {
    fail(errs.length + ' failed execution(s) — fix before go-live:');
    errs.slice(0, 3).forEach(e => console.log('    - ' + e.id + ' | ' + new Date(e.startedAt).toISOString()));
  }
} else { warn('Cannot read executions (status ' + execRes.status + ')'); }

const dlExecRes = await get(`${N8N}/api/v1/executions?workflowId=${WF_DL}&limit=5`);
if (dlExecRes.status === 200) {
  const dl = dlExecRes.data?.data || [];
  dl.length === 0 ? ok('Dead-letter: 0 executions')
    : warn('Dead-letter triggered ' + dl.length + 'x — fix errors before go-live');
}

// ── FINAL REPORT ──────────────────────────────────────────────────────────────
const total = passed + failed;
const pct   = total > 0 ? Math.round(passed / total * 100) : 0;

console.log('\n' + '━'.repeat(60));
console.log('STRICT VALIDATION REPORT');
console.log('━'.repeat(60));
console.log('Passed : ' + passed + '/' + total + ' (' + pct + '%)');
console.log('Failed : ' + failed + '  (warnings = failures in strict mode)');
console.log('');

if (failed === 0) {
  console.log('🟢 ALL CHECKS PASSED — Safe to go live');
  console.log('   Next: E2E tests → scripts/final-rotation.mjs');
  process.exit(0);
} else {
  console.log('🔴 NOT READY — ' + failed + ' check(s) failed');
  if (!varsData.find(v => v.key === 'STRIPE_WEBHOOK_SECRET')?.value)
    console.log('  → n8n Settings → Variables → STRIPE_WEBHOOK_SECRET = whsec_...');
  if (!varsData.find(v => v.key === 'SUPABASE_SERVICE_ROLE_KEY')?.value)
    console.log('  → n8n Settings → Variables → SUPABASE_SERVICE_ROLE_KEY = eyJ...');
  if (!publicUrl.startsWith('https://'))
    console.log('  → bash start-n8n.sh tunnel');
  console.log('\nRerun: /opt/homebrew/opt/node@22/bin/node scripts/validate-strict.mjs');
  process.exit(1);
}
