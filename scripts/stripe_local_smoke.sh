#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# stripe_local_smoke.sh — SUNTREX local smoke tests
# Tests: stripe-connect (create-account, onboarding-link, check-status)
# Prérequis: netlify dev running, jq installed
# Usage: bash scripts/stripe_local_smoke.sh [email] [password]
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ──
BASE_URL="${NETLIFY_DEV_URL:-http://localhost:8888}"
SUPABASE_URL="https://uigoadkslyztxgzahmwv.supabase.co"
ENV_FILE=".env.local"

# ── Colors ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

pass() { echo -e "${GREEN}✓${RESET} $1"; }
fail() { echo -e "${RED}✗${RESET} $1"; FAILURES=$((FAILURES+1)); }
info() { echo -e "${BLUE}→${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠${RESET} $1"; }
section() { echo -e "\n${BOLD}$1${RESET}"; echo "$(printf '─%.0s' {1..50})"; }

FAILURES=0

# ═══════════════════════════════════════════════════════════════
# 0. PRÉREQUIS
# ═══════════════════════════════════════════════════════════════
section "0. Vérification des prérequis"

# jq
if command -v jq &>/dev/null; then
  pass "jq $(jq --version)"
else
  echo -e "${RED}✗ jq manquant. Installer: brew install jq${RESET}"
  exit 1
fi

# netlify dev reachable
if curl -sf --max-time 3 "$BASE_URL" > /dev/null 2>&1; then
  pass "netlify dev répond sur $BASE_URL"
else
  echo -e "${RED}✗ netlify dev ne répond pas sur $BASE_URL${RESET}"
  echo -e "   Lance d'abord: ${BOLD}netlify dev${RESET} (dans un autre terminal)"
  exit 1
fi

# .env.local existe
if [[ -f "$ENV_FILE" ]]; then
  pass ".env.local trouvé"
else
  fail ".env.local manquant"
  exit 1
fi

# Charger les vars depuis .env.local
set -o allexport
# shellcheck disable=SC1090
source <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=')
set +o allexport

# Vérif vars critiques
MISSING_VARS=0
for var in SUPABASE_SERVICE_ROLE_KEY STRIPE_SECRET_KEY VITE_SUPABASE_ANON_KEY; do
  val="${!var:-}"
  if [[ -z "$val" || "$val" == *"..."* || "$val" == *"your-"* ]]; then
    warn "$var non configuré (placeholder détecté)"
    MISSING_VARS=$((MISSING_VARS+1))
  else
    pass "$var configuré (${val:0:12}...)"
  fi
done

if [[ $MISSING_VARS -gt 0 ]]; then
  echo -e "\n${YELLOW}⚠ $MISSING_VARS variable(s) manquante(s). Configure .env.local puis relance.${RESET}"
  echo -e "  Voir: ${BOLD}netlify env:set STRIPE_SECRET_KEY sk_test_...${RESET}"
  exit 1
fi

# ═══════════════════════════════════════════════════════════════
# 1. AUTHENTIFICATION SUPABASE
# ═══════════════════════════════════════════════════════════════
section "1. Authentification Supabase"

EMAIL="${1:-}"
PASSWORD="${2:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo -e "${YELLOW}Usage: bash scripts/stripe_local_smoke.sh <email> <password>${RESET}"
  echo -e "Email et mot de passe d'un compte test Supabase requis."
  read -rp "Email: " EMAIL
  read -rsp "Mot de passe: " PASSWORD
  echo ""
fi

info "Login en tant que $EMAIL..."

AUTH_RESPONSE=$(curl -sf --max-time 10 \
  -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" 2>&1) || {
    fail "Requête auth Supabase échouée"
    echo "  Response: $AUTH_RESPONSE"
    exit 1
  }

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.access_token // empty')
if [[ -z "$TOKEN" ]]; then
  fail "Token non obtenu"
  ERR=$(echo "$AUTH_RESPONSE" | jq -r '.error_description // .msg // "Erreur inconnue"')
  echo "  Erreur: $ERR"
  exit 1
fi

USER_ID=$(echo "$AUTH_RESPONSE" | jq -r '.user.id // "unknown"')
pass "Token obtenu (user_id: $USER_ID)"

# ── Helper curl ──
api_post() {
  local endpoint="$1"
  local body="$2"
  curl -sf --max-time 15 \
    -X POST "$BASE_URL/api/$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$body" 2>&1
}

# ═══════════════════════════════════════════════════════════════
# 2. STRIPE-CONNECT
# ═══════════════════════════════════════════════════════════════
section "2. stripe-connect"

# ── 2a. create-account ──
info "2a. create-account..."
RESP=$(api_post "stripe-connect" '{"action":"create-account"}') || {
  fail "stripe-connect/create-account — requête échouée"
  echo "  Raw: $RESP"
  RESP='{"success":false}'
}

SUCCESS=$(echo "$RESP" | jq -r '.success // false')
ACCT_ID=$(echo "$RESP" | jq -r '.stripe_account_id // empty')
ALREADY=$(echo "$RESP" | jq -r '.already_exists // false')

if [[ "$SUCCESS" == "true" && -n "$ACCT_ID" ]]; then
  if [[ "$ALREADY" == "true" ]]; then
    pass "create-account → compte existant réutilisé ($ACCT_ID)"
  else
    pass "create-account → nouveau compte créé ($ACCT_ID)"
  fi
else
  ERR=$(echo "$RESP" | jq -r '.error // "unknown"')
  if [[ "$ERR" == *"Company not found"* ]]; then
    warn "create-account → Company manquante pour ce user (normal si pas de company en DB)"
  elif [[ "$ERR" == *"not completed"* || "$ERR" == *"KYC"* ]]; then
    warn "create-account → $ERR"
  else
    fail "create-account → $ERR"
    echo "  Raw: $RESP"
  fi
fi

# ── 2b. create-onboarding-link ──
info "2b. create-onboarding-link..."
RESP=$(api_post "stripe-connect" '{"action":"create-onboarding-link"}') || {
  fail "stripe-connect/create-onboarding-link — requête échouée"
  RESP='{"success":false}'
}

SUCCESS=$(echo "$RESP" | jq -r '.success // false')
LINK=$(echo "$RESP" | jq -r '.url // empty')

if [[ "$SUCCESS" == "true" && -n "$LINK" ]]; then
  pass "create-onboarding-link → URL générée"
  echo "  URL: ${LINK:0:60}..."
else
  ERR=$(echo "$RESP" | jq -r '.error // "unknown"')
  if [[ "$ERR" == *"No Stripe account"* ]]; then
    warn "create-onboarding-link → appelle create-account d'abord (attendu si step 2a a échoué)"
  else
    fail "create-onboarding-link → $ERR"
  fi
fi

# ── 2c. check-status ──
info "2c. check-status..."
RESP=$(api_post "stripe-connect" '{"action":"check-status"}') || {
  fail "stripe-connect/check-status — requête échouée"
  RESP='{"success":false}'
}

SUCCESS=$(echo "$RESP" | jq -r '.success // false')
KYC=$(echo "$RESP" | jq -r '.kyc_status // "unknown"')
CHARGES=$(echo "$RESP" | jq -r '.charges_enabled // false')
PAYOUTS=$(echo "$RESP" | jq -r '.payouts_enabled // false')

if [[ "$SUCCESS" == "true" ]]; then
  pass "check-status → kyc_status=$KYC | charges=$CHARGES | payouts=$PAYOUTS"
  if [[ "$KYC" == "approved" ]]; then
    pass "KYC APPROUVÉ — vendeur peut recevoir des paiements"
  elif [[ "$KYC" == "pending" || "$KYC" == "not_started" ]]; then
    warn "KYC $KYC — onboarding Stripe non complété (normal en sandbox)"
  elif [[ "$KYC" == "in_review" ]]; then
    info "KYC in_review — Stripe examine les documents"
  fi
else
  ERR=$(echo "$RESP" | jq -r '.error // "unknown"')
  fail "check-status → $ERR"
fi

# ═══════════════════════════════════════════════════════════════
# 3. STRIPE-WEBHOOK (signature test)
# ═══════════════════════════════════════════════════════════════
section "3. stripe-webhook (test de rejet sans signature)"

info "Vérif que le webhook rejette bien une requête sans signature Stripe..."

WEBHOOK_RESP=$(curl -sf --max-time 10 \
  -X POST "$BASE_URL/api/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' 2>&1) || WEBHOOK_RESP=""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
  -X POST "$BASE_URL/api/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' 2>/dev/null)

if [[ "$HTTP_CODE" == "400" ]]; then
  pass "stripe-webhook rejette correctement une requête sans signature (HTTP 400)"
else
  warn "stripe-webhook a retourné HTTP $HTTP_CODE (attendu 400 — vérifier STRIPE_WEBHOOK_SECRET)"
fi

# ── Stripe CLI disponible ? ──
if command -v stripe &>/dev/null; then
  pass "Stripe CLI détecté — tu peux lancer: stripe listen --forward-to $BASE_URL/api/stripe-webhook"
else
  warn "Stripe CLI non installé. Pour tester les webhooks: brew install stripe/stripe-cli/stripe"
fi

# ═══════════════════════════════════════════════════════════════
# 4. RÉSUMÉ
# ═══════════════════════════════════════════════════════════════
section "4. Résumé"

if [[ $FAILURES -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}Tous les tests passent. Prêt pour le deploy Netlify.${RESET}"
  echo ""
  echo -e "Prochaines étapes:"
  echo -e "  1. ${BOLD}netlify env:set${RESET} → injecter les vraies clés en prod"
  echo -e "  2. ${BOLD}netlify deploy --build --prod${RESET}"
  echo -e "  3. Enregistrer le webhook dans Stripe Dashboard:"
  echo -e "     URL: ${BOLD}https://ton-site.netlify.app/api/stripe-webhook${RESET}"
  echo -e "     Events: payment_intent.succeeded, payment_intent.payment_failed,"
  echo -e "              charge.dispute.created, charge.dispute.closed,"
  echo -e "              charge.refunded, account.updated, transfer.created"
else
  echo -e "${RED}${BOLD}$FAILURES test(s) échoué(s).${RESET} Corriger avant le deploy."
fi

echo ""
