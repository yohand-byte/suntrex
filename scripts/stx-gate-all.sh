#!/usr/bin/env bash
set -euo pipefail

RANGE="${1:-HEAD~1..HEAD}"
REPORT_FILE="${2:-gate-report.md}"
TICKETS=(STX-001 STX-003 STX-005 STX-007 STX-009 STX-011 STX-013)
FAIL=0

{
  echo "# STX Gate Report"
  echo
  echo "- Generated: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "- Range: $RANGE"
  echo
} > "$REPORT_FILE"

echo "Running STX gates on range: $RANGE"
echo "Report: $REPORT_FILE"
echo

for T in "${TICKETS[@]}"; do
  echo "=============================="
  echo "Gate: $T"
  echo "=============================="

  {
    echo "## $T"
    echo
    echo '```text'
  } >> "$REPORT_FILE"

  if bash scripts/stx-gate.sh "$T" "$RANGE" | tee -a "$REPORT_FILE"; then
    echo "✅ $T PASS"
    {
      echo '```'
      echo
      echo "Result: PASS"
      echo
    } >> "$REPORT_FILE"
  else
    echo "❌ $T FAIL"
    FAIL=1
    {
      echo '```'
      echo
      echo "Result: FAIL"
      echo
    } >> "$REPORT_FILE"
  fi

  echo

done

if [[ "$FAIL" -ne 0 ]]; then
  echo "FINAL: FAIL (one or more tickets failed)"
  {
    echo "# Overall"
    echo
    echo "FAIL"
  } >> "$REPORT_FILE"
  exit 1
fi

echo "FINAL: PASS (all tickets passed)"
{
  echo "# Overall"
  echo
  echo "PASS"
} >> "$REPORT_FILE"
