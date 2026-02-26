#!/usr/bin/env bash
set -euo pipefail

# Build a Codex-ready fix request from Claude review TODO file.
# Usage:
#   ./scripts/codex_fix_from_review.sh
#   ./scripts/codex_fix_from_review.sh --todo review/todo.md

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TODO_FILE="$ROOT_DIR/review/todo.md"
OUT_FILE="$ROOT_DIR/review/codex_fix_request.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --todo)
      TODO_FILE="${2:-}"
      shift 2
      ;;
    --out)
      OUT_FILE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$TODO_FILE" ]]; then
  echo "TODO file not found: $TODO_FILE" >&2
  echo "Run npm run review:import first." >&2
  exit 1
fi

P01_ITEMS="$(awk '
  /^[[:space:]]*-[[:space:]]*\[[ xX]\][[:space:]]*\[(P0|P1)\]/ {
    print $0
  }
' "$TODO_FILE")"

if [[ -z "$P01_ITEMS" ]]; then
  echo "No P0/P1 items found in $TODO_FILE"
  exit 0
fi

mkdir -p "$(dirname "$OUT_FILE")"

cat > "$OUT_FILE" <<EOF
# Codex Fix Request (from Claude review)

Date: $(date +"%Y-%m-%d %H:%M:%S")
Source TODO: $TODO_FILE

## Mission
Apply only the P0/P1 fixes below from the external review.

## Constraints
- Keep current behavior unless explicitly required by a finding.
- Do not revert unrelated user changes.
- Add minimal tests for each fixed P0/P1 when applicable.
- Summarize each fix with file references.

## Priority findings to fix
$P01_ITEMS

## Expected output
1) Code changes applied.
2) Tests run (or explicit reason not run).
3) Remaining risks (if any).
EOF

copy_clipboard() {
  if command -v pbcopy >/dev/null 2>&1; then
    pbcopy < "$OUT_FILE"
    return 0
  fi
  if command -v xclip >/dev/null 2>&1; then
    xclip -selection clipboard < "$OUT_FILE"
    return 0
  fi
  if command -v wl-copy >/dev/null 2>&1; then
    wl-copy < "$OUT_FILE"
    return 0
  fi
  return 1
}

if copy_clipboard; then
  echo "Copied Codex fix request to clipboard."
else
  echo "Clipboard tool not found. Open manually:"
  echo "  $OUT_FILE"
fi

echo "Generated:"
echo "  $OUT_FILE"
echo
echo "Next step:"
echo "Paste into Codex and run the fixes."

