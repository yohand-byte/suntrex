#!/usr/bin/env bash
set -euo pipefail

# One-click import:
# 1) reads Claude response from clipboard (or file)
# 2) stores it in review/response.md
# 3) extracts P0/P1/P2 checklist in review/todo.md
#
# Usage:
#   ./scripts/review_oneclick_import.sh
#   ./scripts/review_oneclick_import.sh --file /path/to/claude_response.md

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/review"
RESP_FILE="$OUT_DIR/response.md"
TODO_FILE="$OUT_DIR/todo.md"
INPUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      INPUT_FILE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$OUT_DIR"

read_clipboard() {
  if command -v pbpaste >/dev/null 2>&1; then
    pbpaste
    return 0
  fi
  if command -v xclip >/dev/null 2>&1; then
    xclip -selection clipboard -o
    return 0
  fi
  if command -v wl-paste >/dev/null 2>&1; then
    wl-paste
    return 0
  fi
  return 1
}

if [[ -n "$INPUT_FILE" ]]; then
  if [[ ! -f "$INPUT_FILE" ]]; then
    echo "File not found: $INPUT_FILE" >&2
    exit 1
  fi
  if [[ "$(cd "$(dirname "$INPUT_FILE")" && pwd)/$(basename "$INPUT_FILE")" != "$(cd "$(dirname "$RESP_FILE")" && pwd)/$(basename "$RESP_FILE")" ]]; then
    cp "$INPUT_FILE" "$RESP_FILE"
  fi
else
  if ! read_clipboard > "$RESP_FILE"; then
    echo "No clipboard tool found. Use --file <path>." >&2
    exit 1
  fi
fi

if [[ ! -s "$RESP_FILE" ]]; then
  echo "Response is empty. Copy Claude reply and retry." >&2
  exit 1
fi

RESP_LINES="$(wc -l < "$RESP_FILE" | tr -d ' ')"
RESP_CHARS="$(wc -c < "$RESP_FILE" | tr -d ' ')"
FIRST_LINE="$(sed -n '1p' "$RESP_FILE" | tr -d '\r')"

# Guardrail: detect accidental clipboard content (commands/snippets) instead of Claude review.
if [[ "$RESP_CHARS" -lt 40 ]] || [[ "$RESP_LINES" -lt 2 ]]; then
  echo "Imported content looks too short to be a review." >&2
  echo "First line: $FIRST_LINE" >&2
  echo "Copy full Claude response, then run again." >&2
  exit 1
fi

# Detect likely shell command in clipboard first line.
# Keep false-positive risk low by requiring a command-like prefix.
if [[ "$FIRST_LINE" =~ ^(npm|yarn|pnpm|bash|sh|zsh|git|node|docker|curl|cd|cat|rm|mv|cp|ls)[[:space:]] ]] \
   && ! [[ "$FIRST_LINE" =~ ^git[[:space:]].*(showed|found|diff) ]]; then
  echo "Clipboard appears to contain a shell command, not a Claude review." >&2
  echo "First line: $FIRST_LINE" >&2
  echo "Copy full Claude response, then run again." >&2
  exit 1
fi

{
  echo "# Codex Fix TODO (from Claude review)"
  echo
  echo "Date: $(date +"%Y-%m-%d %H:%M:%S")"
  echo
  echo "## Raw response source"
  echo "- File: $RESP_FILE"
  echo
  echo "## Extracted priorities"
  echo
  awk '
    BEGIN { p0=0; p1=0; p2=0 }
    {
      line=$0
      u=toupper(line)
      if (u ~ /P0/) { print "- [ ] [P0] " line; p0++ }
      else if (u ~ /P1/) { print "- [ ] [P1] " line; p1++ }
      else if (u ~ /P2/) { print "- [ ] [P2] " line; p2++ }
    }
    END {
      print ""
      print "## Summary"
      print "- P0 lines: " p0
      print "- P1 lines: " p1
      print "- P2 lines: " p2
      if (p0 == 0 && p1 == 0 && p2 == 0) {
        print ""
        print "- [ ] No explicit P-level tags found; review manually."
      }
    }
  ' "$RESP_FILE"
} > "$TODO_FILE"

echo "Saved Claude response: $RESP_FILE"
echo "Generated TODO checklist: $TODO_FILE"
echo
echo "Next step for Codex:"
echo "Use $TODO_FILE and apply P0/P1 fixes first."
