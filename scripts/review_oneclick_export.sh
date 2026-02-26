#!/usr/bin/env bash
set -euo pipefail

# One-click export:
# 1) builds a review packet from current git diff
# 2) copies it to clipboard
# 3) opens Claude web app
#
# Usage:
#   ./scripts/review_oneclick_export.sh
#   ./scripts/review_oneclick_export.sh --base HEAD~1
#   ./scripts/review_oneclick_export.sh --staged
#   ./scripts/review_oneclick_export.sh --base HEAD~1 --path api/auth
#   ./scripts/review_oneclick_export.sh --base HEAD~1 --max-lines 400

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_REF="HEAD~1"
OUT_DIR="$ROOT_DIR/review"
OUT_FILE="$OUT_DIR/request.md"
USE_STAGED="0"
PATH_FILTER=""
MAX_LINES="600"
OPEN_MODE="reuse" # reuse | browser | none | app

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE_REF="${2:-}"
      shift 2
      ;;
    --staged)
      USE_STAGED="1"
      shift
      ;;
    --path)
      PATH_FILTER="${2:-}"
      shift 2
      ;;
    --max-lines)
      MAX_LINES="${2:-}"
      shift 2
      ;;
    --open)
      OPEN_MODE="${2:-}"
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

if ! [[ "$MAX_LINES" =~ ^[0-9]+$ ]]; then
  echo "--max-lines must be an integer" >&2
  exit 1
fi

DIFF_STAT=""
DIFF_PATCH=""
SOURCE_LABEL=""

if [[ "$USE_STAGED" == "1" ]]; then
  SOURCE_LABEL="staged changes"
  if [[ -n "$PATH_FILTER" ]]; then
    DIFF_STAT="$(git -C "$ROOT_DIR" diff --cached --stat -- "$PATH_FILTER" || true)"
    DIFF_PATCH="$(git -C "$ROOT_DIR" diff --cached -- "$PATH_FILTER" || true)"
  else
    DIFF_STAT="$(git -C "$ROOT_DIR" diff --cached --stat || true)"
    DIFF_PATCH="$(git -C "$ROOT_DIR" diff --cached || true)"
  fi
else
  if ! git -C "$ROOT_DIR" rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
    echo "Base ref '$BASE_REF' not found. Try --base origin/main or --base HEAD~1" >&2
    exit 1
  fi
  SOURCE_LABEL="diff from $BASE_REF...HEAD"
  if [[ -n "$PATH_FILTER" ]]; then
    DIFF_STAT="$(git -C "$ROOT_DIR" diff --stat "$BASE_REF"...HEAD -- "$PATH_FILTER" || true)"
    DIFF_PATCH="$(git -C "$ROOT_DIR" diff "$BASE_REF"...HEAD -- "$PATH_FILTER" || true)"
  else
    DIFF_STAT="$(git -C "$ROOT_DIR" diff --stat "$BASE_REF"...HEAD || true)"
    DIFF_PATCH="$(git -C "$ROOT_DIR" diff "$BASE_REF"...HEAD || true)"
  fi
fi

PATCH_LINES="$(printf "%s\n" "$DIFF_PATCH" | wc -l | tr -d ' ')"
TRUNCATED="no"
if (( PATCH_LINES > MAX_LINES )); then
  DIFF_PATCH="$(printf "%s\n" "$DIFF_PATCH" | sed -n "1,${MAX_LINES}p")"
  TRUNCATED="yes"
fi

cat > "$OUT_FILE" <<EOF
# Claude Review Request (SUNTREX Marketplace)

Date: $(date +"%Y-%m-%d %H:%M:%S")
Source: $SOURCE_LABEL
Base ref: $BASE_REF
Head: $(git -C "$ROOT_DIR" rev-parse --short HEAD)
Branch: $(git -C "$ROOT_DIR" branch --show-current)
Path filter: ${PATH_FILTER:-<none>}
Patch lines: $PATCH_LINES (truncated: $TRUNCATED, max: $MAX_LINES)

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
  case "$OPEN_MODE" in
    none)
      echo "Open mode: none (no browser/app opened)."
      return 0
      ;;
    app)
      if command -v open >/dev/null 2>&1; then
        if open -a "Claude" >/dev/null 2>&1; then
          echo "Opened Claude mac app."
          return 0
        fi
      fi
      echo "Claude mac app not found. Falling back to browser."
      OPEN_MODE="browser"
      ;;
    reuse|browser)
      ;;
    *)
      echo "Invalid --open mode '$OPEN_MODE' (use: reuse|browser|none|app)" >&2
      return 1
      ;;
  esac

  if [[ "$OPEN_MODE" == "reuse" ]] && command -v osascript >/dev/null 2>&1; then
    # Reuse existing Claude tab in Safari/Chrome if possible; avoid opening new tab every time.
    if osascript <<'APPLESCRIPT' >/dev/null 2>&1
tell application "Safari"
  if it is running then
    set foundTab to false
    repeat with w in windows
      repeat with t in tabs of w
        if (URL of t contains "claude.ai") then
          set current tab of w to t
          set index of w to 1
          activate
          set foundTab to true
          exit repeat
        end if
      end repeat
      if foundTab then exit repeat
    end repeat
    if foundTab then return
  end if
end tell
error "no-safari-tab"
APPLESCRIPT
    then
      echo "Reused existing Claude tab in Safari."
      return 0
    fi

    if osascript <<'APPLESCRIPT' >/dev/null 2>&1
tell application "Google Chrome"
  if it is running then
    set foundTab to false
    repeat with w in windows
      repeat with t in tabs of w
        if (URL of t contains "claude.ai") then
          set active tab index of w to (index of t)
          set index of w to 1
          activate
          set foundTab to true
          exit repeat
        end if
      end repeat
      if foundTab then exit repeat
    end repeat
    if foundTab then return
  end if
end tell
error "no-chrome-tab"
APPLESCRIPT
    then
      echo "Reused existing Claude tab in Chrome."
      return 0
    fi
  fi

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
