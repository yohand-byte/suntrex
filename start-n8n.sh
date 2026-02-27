#!/bin/bash
# SUNTREX — n8n Startup Script
# Usage:
#   bash start-n8n.sh          # local dev (localhost only)
#   bash start-n8n.sh tunnel   # dev + Cloudflare tunnel (public HTTPS)
#   bash start-n8n.sh prod     # production mode (requires tunnel + all secrets set)

set -e

NODE22="/opt/homebrew/opt/node@22/bin"
export PATH="$NODE22:$PATH"

MODE="${1:-local}"
N8N_URL="http://localhost:5678"
TUNNEL_HOSTNAME="n8n.suntrex.eu"
TUNNEL_NAME="suntrex-n8n"

# ── Verify Node.js version ───────────────────────────────────────────────────
NODE_VER=$(node --version)
if [[ "$NODE_VER" != v22* ]]; then
  echo "❌ Wrong Node.js version: $NODE_VER (need v22)"
  echo "   Run: export PATH=/opt/homebrew/opt/node@22/bin:\$PATH"
  exit 1
fi
echo "✅ Node.js $NODE_VER"

# ── Base n8n config ──────────────────────────────────────────────────────────
export N8N_SECURE_COOKIE=false
export N8N_PORT=5678
export N8N_LOG_LEVEL=info

if [[ "$MODE" == "prod" || "$MODE" == "tunnel" ]]; then
  export N8N_HOST="$TUNNEL_HOSTNAME"
  export N8N_PROTOCOL="https"
  export N8N_EDITOR_BASE_URL="https://$TUNNEL_HOSTNAME"
  export WEBHOOK_URL="https://$TUNNEL_HOSTNAME/"
  echo "🌐 Public mode: https://$TUNNEL_HOSTNAME"
else
  echo "🏠 Local mode: http://localhost:$N8N_PORT"
fi

# ── Start Cloudflare tunnel (background) ─────────────────────────────────────
if [[ "$MODE" == "tunnel" || "$MODE" == "prod" ]]; then
  if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared not found — install with: brew install cloudflared"
    exit 1
  fi

  echo "🚇 Starting Cloudflare tunnel ($TUNNEL_NAME)..."
  cloudflared tunnel run "$TUNNEL_NAME" > /tmp/cloudflared.log 2>&1 &
  TUNNEL_PID=$!
  echo "   Tunnel PID: $TUNNEL_PID (logs: /tmp/cloudflared.log)"

  # Wait for tunnel to be ready
  sleep 4
  if ! kill -0 $TUNNEL_PID 2>/dev/null; then
    echo "❌ Tunnel failed to start — check /tmp/cloudflared.log"
    exit 1
  fi
  echo "✅ Tunnel running → https://$TUNNEL_HOSTNAME"
fi

# ── Pre-flight checks for prod mode ─────────────────────────────────────────
if [[ "$MODE" == "prod" ]]; then
  echo ""
  echo "🔒 Prod pre-flight checks..."

  # Check n8n DB exists
  if [ ! -f "$HOME/.n8n/database.sqlite" ]; then
    echo "❌ n8n database not found — run local mode first to initialize"
    kill $TUNNEL_PID 2>/dev/null
    exit 1
  fi
  echo "✅ n8n database found"

  # Remind about secrets (can't check without starting n8n)
  echo "⚠️  Verify in n8n after start:"
  echo "   Settings → Variables → STRIPE_WEBHOOK_SECRET (whsec_...)"
  echo "   Settings → Variables → SUPABASE_SERVICE_ROLE_KEY (eyJ...)"
fi

# ── Print webhook URL ────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$MODE" == "local" ]]; then
  echo "Webhook URL (local):  http://localhost:5678/webhook/wnarPrvFAgYu0rmF/stripe-webhook-entry/stripe-webhook-entry"
else
  echo "Webhook URL (public): https://$TUNNEL_HOSTNAME/webhook/wnarPrvFAgYu0rmF/stripe-webhook-entry/stripe-webhook-entry"
fi
echo "Editor:               http://localhost:5678"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Cleanup on exit ──────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  if [[ -n "$TUNNEL_PID" ]]; then
    kill $TUNNEL_PID 2>/dev/null
    echo "Tunnel stopped"
  fi
}
trap cleanup EXIT INT TERM

# ── Start n8n ────────────────────────────────────────────────────────────────
echo "🚀 Starting n8n $MODE..."
npx n8n start
