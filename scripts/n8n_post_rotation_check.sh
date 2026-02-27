#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ok() { printf "\033[32m[OK]\033[0m %s\n" "$1"; }
warn() { printf "\033[33m[WARN]\033[0m %s\n" "$1"; }
fail() { printf "\033[31m[FAIL]\033[0m %s\n" "$1"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

require_cmd curl
require_cmd python3

# Load optional local env file (without echoing values)
if [ -f "$ROOT_DIR/.env.local" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT_DIR/.env.local" && set +a
fi

# Extract from .mcp.json if env vars are not exported
if [ -z "${N8N_API_URL:-}" ] || [ -z "${N8N_API_KEY:-}" ]; then
  MCP_FILE="$ROOT_DIR/.mcp.json"
  if [ -f "$MCP_FILE" ]; then
    read -r MCP_URL MCP_KEY < <(python3 - <<'PY' "$MCP_FILE"
import json,sys
p=sys.argv[1]
try:
  d=json.load(open(p))
  env=d["mcpServers"]["n8n-mcp"]["env"]
  print(env.get("N8N_API_URL",""), env.get("N8N_API_KEY",""))
except Exception:
  print("", "")
PY
)
    N8N_API_URL="${N8N_API_URL:-$MCP_URL}"
    N8N_API_KEY="${N8N_API_KEY:-$MCP_KEY}"
  fi
fi

[ -n "${N8N_API_URL:-}" ] || fail "N8N_API_URL missing (env or .mcp.json)"
[ -n "${N8N_API_KEY:-}" ] || fail "N8N_API_KEY missing (env or .mcp.json)"

MAIN_WORKFLOW_ID="${MAIN_WORKFLOW_ID:-wnarPrvFAgYu0rmF}"
DEAD_WORKFLOW_ID="${DEAD_WORKFLOW_ID:-0Q23FXcq1VsHZgrr}"
WEBHOOK_PATH="${WEBHOOK_PATH:-webhook/stripe-payment-webhook}"
WEBHOOK_URL="${WEBHOOK_URL:-}"
SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

printf "\nSUNTREX post-rotation validation\n"
printf "N8N: %s\n" "$N8N_API_URL"
printf "Main workflow: %s\n" "$MAIN_WORKFLOW_ID"
printf "Dead-letter workflow: %s\n\n" "$DEAD_WORKFLOW_ID"

# 1) n8n health
health="$(curl -fsS "${N8N_API_URL%/}/healthz")" || fail "n8n health check failed"
printf "%s" "$health" | grep -q '"status":"ok"' \
  && ok "n8n healthz returns status ok" \
  || fail "n8n healthz did not return status ok"

# 2) Workflow active checks
check_workflow_active() {
  local wf_id="$1"
  local label="$2"
  local response
  response="$(curl -fsS "${N8N_API_URL%/}/api/v1/workflows/$wf_id" -H "X-N8N-API-KEY: $N8N_API_KEY")" \
    || fail "$label workflow fetch failed ($wf_id)"

  local active
  active="$(python3 - <<'PY' "$response"
import json,sys
try:
  print(str(json.loads(sys.argv[1]).get("active", "")).lower())
except Exception:
  print("")
PY
)"

  if [ "$active" = "true" ]; then
    ok "$label workflow is active ($wf_id)"
  else
    warn "$label workflow is not active ($wf_id)"
  fi
}

check_workflow_active "$MAIN_WORKFLOW_ID" "Main"
check_workflow_active "$DEAD_WORKFLOW_ID" "Dead-letter"

# 3) Secret format sanity
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  if [[ "$STRIPE_WEBHOOK_SECRET" =~ ^whsec_[A-Za-z0-9]+$ ]]; then
    ok "STRIPE_WEBHOOK_SECRET format looks valid"
  else
    warn "STRIPE_WEBHOOK_SECRET format is unexpected"
  fi
else
  warn "STRIPE_WEBHOOK_SECRET not found in local env (cannot verify format)"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  ok "SUPABASE_SERVICE_ROLE_KEY is present locally"
else
  warn "SUPABASE_SERVICE_ROLE_KEY missing locally (DB checks skipped)"
fi

# 4) Webhook reachability sanity (expect non-404 on at least one candidate URL)
if [ -n "$WEBHOOK_URL" ]; then
  candidates=("$WEBHOOK_URL")
else
  candidates=(
    "${N8N_API_URL%/}/webhook/stripe-payment-webhook"
    "${N8N_API_URL%/}/webhook/${MAIN_WORKFLOW_ID}/webhook/stripe-payment-webhook"
    "${N8N_API_URL%/}/webhook/${MAIN_WORKFLOW_ID}"
  )
fi

reachable_url=""
reachable_code=""
for candidate in "${candidates[@]}"; do
  code="$(curl -sS -o /tmp/suntrex_webhook_probe.out -w '%{http_code}' -X POST "$candidate" \
    -H 'content-type: application/json' \
    --data '{"probe":"post-rotation-check"}' || true)"
  if [ "$code" != "404" ] && [ "$code" != "000" ]; then
    reachable_url="$candidate"
    reachable_code="$code"
    break
  fi
done

if [ -z "$reachable_url" ]; then
  warn "No registered/reachable webhook URL found (checked ${#candidates[@]} format(s))"
  warn "Use WEBHOOK_URL=... npm run n8n:postcheck to force the exact production URL"
else
  ok "Webhook URL reachable ($reachable_url) -> HTTP $reachable_code"
fi

# 5) Supabase write-path sanity (read only)
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  if [[ "$SUPABASE_SERVICE_ROLE_KEY" == *"..."* ]]; then
    warn "SUPABASE_SERVICE_ROLE_KEY looks like a placeholder; DB checks skipped"
    exit 0
  fi
  tx_status="$(curl -sS -o /tmp/suntrex_tx_check.out -w '%{http_code}' \
    "${SUPABASE_URL%/}/rest/v1/transactions?select=id&limit=1" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" || true)"

  if [ "$tx_status" = "200" ]; then
    ok "Supabase transactions table is readable with service role"
  else
    fail "Supabase transactions check failed (HTTP $tx_status)"
  fi

  ev_status="$(curl -sS -o /tmp/suntrex_ev_check.out -w '%{http_code}' \
    "${SUPABASE_URL%/}/rest/v1/transaction_events?select=id&limit=1" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" || true)"

  if [ "$ev_status" = "200" ]; then
    ok "Supabase transaction_events table is readable with service role"
  else
    fail "Supabase transaction_events check failed (HTTP $ev_status)"
  fi
else
  warn "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing locally (DB checks skipped)"
fi

cat <<TXT

Done. Next:
1) Run Stripe CLI E2E triggers from n8n-prod-checklist.md
2) Confirm rows inserted in transaction_events for each event type
3) Monitor dead-letter workflow executions for 24h
TXT
