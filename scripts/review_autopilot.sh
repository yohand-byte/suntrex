#!/usr/bin/env bash
set -euo pipefail

# Review autopilot:
# 1) export review packet
# 2) wait for user to copy Claude response
# 3) run import + fix automatically
#
# Intended for macOS with pbcopy/pbpaste.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPORT_SCRIPT="$ROOT_DIR/scripts/review_oneclick_export.sh"
IMPORT_SCRIPT="$ROOT_DIR/scripts/review_oneclick_import.sh"
FIX_SCRIPT="$ROOT_DIR/scripts/codex_fix_from_review.sh"
OUT_DIR="$ROOT_DIR/review"
RESP_FILE="$OUT_DIR/autopilot_response.md"
TIMEOUT_SECONDS=1800
POLL_SECONDS=2

mkdir -p "$OUT_DIR"

if ! command -v pbpaste >/dev/null 2>&1; then
  echo "pbpaste not found. This autopilot currently supports macOS clipboard." >&2
  exit 1
fi

echo "Step 1/3: preparing review packet..."
bash "$EXPORT_SCRIPT" --base HEAD~1 --max-lines 500 --open reuse

REQUEST_CLIPBOARD="$(pbpaste)"
REQUEST_HASH="$(printf "%s" "$REQUEST_CLIPBOARD" | shasum -a 256 | awk '{print $1}')"

echo
echo "Step 2/3: waiting for Claude response in clipboard..."
echo "- Paste packet in Claude (Cmd+V), send."
echo "- Copy full Claude response (Cmd+C)."
echo "- This terminal will continue automatically."

start_ts="$(date +%s)"
while true; do
  now_ts="$(date +%s)"
  elapsed=$(( now_ts - start_ts ))
  if (( elapsed > TIMEOUT_SECONDS )); then
    echo "Timeout after $TIMEOUT_SECONDS seconds. Run script again." >&2
    exit 1
  fi

  CLIP="$(pbpaste || true)"
  if [[ -n "$CLIP" ]]; then
    HASH="$(printf "%s" "$CLIP" | shasum -a 256 | awk '{print $1}')"
    if [[ "$HASH" != "$REQUEST_HASH" ]]; then
      # Basic plausibility check: avoid capturing obvious shell commands.
      first_line="$(printf "%s" "$CLIP" | sed -n '1p')"
      if [[ "${#CLIP}" -ge 80 ]] && ! [[ "$first_line" =~ ^(npm|yarn|pnpm|bash|zsh|git)[[:space:]] ]]; then
        printf "%s" "$CLIP" > "$RESP_FILE"
        break
      fi
    fi
  fi
  sleep "$POLL_SECONDS"
done

echo "Step 3/3: importing response and generating Codex fix request..."
bash "$IMPORT_SCRIPT" --file "$RESP_FILE"
bash "$FIX_SCRIPT"

echo
echo "Done."
echo "Open and paste this in Codex:"
echo "  $ROOT_DIR/review/codex_fix_request.md"

