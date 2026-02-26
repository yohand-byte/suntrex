#!/usr/bin/env bash
set -euo pipefail

# One-click export:
# 1) builds a review packet from current git diff
# 2) copies it to clipboard
# 3) opens Claude web app
#
# Usage:
#   ./scripts/review_oneclick_export.sh
#   ./scripts/review_oneclick_export.sh --base origin/main

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_REF="HEAD~1"
OUT_DIR="$ROOT_DIR/review"
OUT_FILE="$OUT_DIR/request.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$BASE_REF" ]]; then
  echo "Base ref cannot be empty" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

if ! git -C "$ROOT_DIR" rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "Base ref '$BASE_REF' not found. Try --base origin/main or --base HEAD~1" >&2
  exit 1
fi

DIFF_STAT="$(git -C "$ROOT_DIR" diff --stat "$BASE_REF"...HEAD || true)"
DIFF_PATCH="$(git -C "$ROOT_DIR" diff "$BASE_REF"...HEAD || true)"

cat > "$OUT_FILE" <<EOF
# Claude Review Request (SUNTREX Marketplace)

Date: $(date +"%Y-%m-%d %H:%M:%S")
Base ref: $BASE_REF
Head: $(git -C "$ROOT_DIR" rev-parse --short HEAD)
Branch: $(git -C "$ROOT_DIR" branch --show-current)

## Mission
Review this diff as principal reviewer for a B2B marketplace.
Focus strictly on:
1. Security and auth/access controls.
2. Marketplace business logic (KYC/KYB, transaction status machine, payment flow).
3. Stripe/webhook/idempotency correctness.
4. Supabase RLS and data isolation.
5. Missing tests and regression risk.

## Required output format
- Finding title
- Severity: P0 / P1 / P2
- Business impact
- File + line(s)
- Concrete fix

## Diff stat
\`\`\`
$DIFF_STAT
\`\`\`

## Diff patch
\`\`\`diff
$DIFF_PATCH
\`\`\`
EOF

copy_clipboard() {
  if command -v pbcopy >/dev/null 2>&1; then
    pbcopy < "$OUT_FILE"
    echo "Copied review packet to clipboard with pbcopy."
    return 0
  fi
  if command -v xclip >/dev/null 2>&1; then
    xclip -selection clipboard < "$OUT_FILE"
    echo "Copied review packet to clipboard with xclip."
    return 0
  fi
  if command -v wl-copy >/dev/null 2>&1; then
    wl-copy < "$OUT_FILE"
    echo "Copied review packet to clipboard with wl-copy."
    return 0
  fi
  echo "No clipboard tool found. Packet saved at: $OUT_FILE"
}

open_claude() {
  if command -v open >/dev/null 2>&1; then
    open "https://claude.ai"
    echo "Opened https://claude.ai"
    return 0
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "https://claude.ai" >/dev/null 2>&1 &
    echo "Opened https://claude.ai"
    return 0
  fi
  echo "Could not auto-open browser. Open manually: https://claude.ai"
}

copy_clipboard || true
open_claude || true

echo
echo "Next step:"
echo "1) Paste in Claude (Cmd/Ctrl+V)"
echo "2) Ask Claude for P0/P1/P2 findings"
echo "3) Run: ./scripts/review_oneclick_import.sh"

