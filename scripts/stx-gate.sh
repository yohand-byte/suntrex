#!/usr/bin/env bash
set -euo pipefail

TICKET="${1:-}"
RANGE="${2:-HEAD~1..HEAD}"
FAIL=0

if [[ -z "$TICKET" ]]; then
  echo "Usage: bash scripts/stx-gate.sh STX-001 [RANGE]"
  exit 2
fi

case "$TICKET" in
  STX-001)
    ALLOW='^(public/robots\.txt|public/sitemap\.xml|HANDOFF\.md)$'
    ;;
  STX-003)
    ALLOW='^(src/(App|main|routes)\.(js|jsx|ts|tsx)|src/pages/.*|src/components/.*|HANDOFF\.md)$'
    ;;
  STX-005)
    ALLOW='^(src/pages/HomePage\.(js|jsx|ts|tsx)|src/components/.*|src/(i18n|locales)/.*|HANDOFF\.md)$'
    ;;
  STX-007)
    ALLOW='^(index\.html|src/(seo|routes|pages)/.*|src/App\.(js|jsx|ts|tsx)|src/components/.*|public/.*|HANDOFF\.md)$'
    ;;
  STX-009)
    ALLOW='^(src/(seo|pages|components)/.*|public/.*|HANDOFF\.md)$'
    ;;
  STX-011)
    ALLOW='^(src/pages/.*|src/components/.*|src/styles/.*|HANDOFF\.md)$'
    ;;
  STX-013)
    ALLOW='^(src/(analytics|tracking|lib|utils|pages|components)/.*|HANDOFF\.md)$'
    ;;
  *)
    echo "Unknown ticket: $TICKET"
    exit 2
    ;;
esac

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  echo "FAIL: not a git repository"
  exit 2
fi

if ! git rev-parse --verify "${RANGE%%..*}" >/dev/null 2>&1; then
  echo "WARN: range start not found (${RANGE%%..*}); trying current HEAD only"
  RANGE="HEAD"
fi

echo "Ticket: $TICKET"
echo "Range:  $RANGE"
echo

echo "A) Fichiers touchés (working tree + staged)"
git diff --name-only --cached || true
git diff --name-only || true
echo

CHANGED="$(git diff --name-only "$RANGE" || true)"
echo "B) Scope check"
if [[ -z "$(echo "$CHANGED" | sed '/^$/d')" ]]; then
  echo "WARN_NO_CHANGED_FILES_IN_RANGE"
else
  echo "$CHANGED"
fi
OUT_OF_SCOPE="$(echo "$CHANGED" | sed '/^$/d' | grep -Ev "$ALLOW" || true)"
if [[ -n "$OUT_OF_SCOPE" ]]; then
  echo "FAIL_OUT_OF_SCOPE_$TICKET"
  echo "$OUT_OF_SCOPE"
  FAIL=1
else
  echo "PASS_SCOPE_$TICKET"
fi
echo

echo "C) Dependencies unchanged"
if git diff --name-only "$RANGE" | grep -E '^(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$' >/dev/null; then
  echo "FAIL_DEPS_CHANGED"
  FAIL=1
else
  echo "PASS_DEPS"
fi
echo

echo "D) Commit message contains ticket ID"
if git log -1 --pretty=%s | grep -Eq 'STX-[0-9]+'; then
  echo "PASS_TICKET_ID"
else
  echo "FAIL_TICKET_ID"
  FAIL=1
fi
echo

echo "E) Validation"
if npm run build; then
  echo "BUILD_PASS"
else
  echo "BUILD_FAIL"
  FAIL=1
fi

if npm run | grep -qE '^[[:space:]]+lint'; then
  if npm run lint; then
    echo "LINT_PASS"
  else
    echo "LINT_FAIL"
    FAIL=1
  fi
else
  echo "LINT_SKIPPED (script missing)"
fi

if npm run | grep -qE '^[[:space:]]+test'; then
  if npm test; then
    echo "TEST_PASS"
  else
    echo "TEST_FAIL"
    FAIL=1
  fi
else
  echo "TEST_SKIPPED (script missing)"
fi
echo

if [[ "$FAIL" -ne 0 ]]; then
  echo "FINAL: FAIL"
  exit 1
fi

echo "FINAL: PASS"
