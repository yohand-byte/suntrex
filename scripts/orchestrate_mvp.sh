#!/usr/bin/env bash
set -euo pipefail

BASE_SHA="${BASE_SHA:-20f3968c9cc26a2da1f0a9922d77e82d438c1d0d}"
ORCH_BRANCH="${ORCH_BRANCH:-codex/orchestrator-mvp-final}"
REPORT_DIR="${REPORT_DIR:-review}"
REPORT_FILE="${REPORT_DIR}/orchestration-report-$(date +%Y%m%d-%H%M%S).md"
NETLIFY_DEV_URL="${NETLIFY_DEV_URL:-http://localhost:8888}"
N8N_URL="${N8N_URL:-http://localhost:5678}"

BRANCHES=(
  "codex/agent-runtime-stripe"
  "codex/agent-front-kyc-ui"
  "codex/agent-data-rls"
  "codex/agent-qa-mvp"
  "codex/agent-secops-preprod"
  "codex/agent-pm-docs-mvp"
)

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*"; }
err()  { echo "[ERR ] $*" >&2; }

block() {
  err "$*"
  echo "" >> "$REPORT_FILE"
  echo "## Verdict" >> "$REPORT_FILE"
  echo "**BLOCKED**" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "Cause: $*" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "Next actions:" >> "$REPORT_FILE"
  echo "1. Fix blocker on concerned agent branch" >> "$REPORT_FILE"
  echo "2. Re-run this script from BASE_SHA" >> "$REPORT_FILE"
  echo "3. Re-validate all gates" >> "$REPORT_FILE"
  exit 1
}

run_gate() {
  local label="$1"
  local cmd="$2"
  echo "" >> "$REPORT_FILE"
  echo "### Gate: $label" >> "$REPORT_FILE"
  echo "\`$cmd\`" >> "$REPORT_FILE"
  set +e
  eval "$cmd" > /tmp/orch_gate.out 2>&1
  local rc=$?
  set -e
  if [ $rc -ne 0 ]; then
    echo "- Result: ❌ FAIL" >> "$REPORT_FILE"
    echo "- Exit code: $rc" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    tail -n 120 /tmp/orch_gate.out >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    return $rc
  fi
  echo "- Result: ✅ PASS" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  tail -n 40 /tmp/orch_gate.out >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  return 0
}

require_clean_tree() {
  if [ -n "$(git status --porcelain)" ]; then
    block "Working tree is dirty. Commit or stash first."
  fi
}

resolve_ref() {
  local b="$1"
  if git show-ref --verify --quiet "refs/heads/$b"; then
    echo "$b"
    return
  fi
  if git show-ref --verify --quiet "refs/remotes/origin/$b"; then
    echo "origin/$b"
    return
  fi
  return 1
}

mkdir -p "$REPORT_DIR"

cat > "$REPORT_FILE" <<EOF
# SUNTREX MVP Orchestration Report

- Date: $(date -Iseconds)
- BASE_SHA: \`$BASE_SHA\`
- Orchestrator branch: \`$ORCH_BRANCH\`
- Repo: \`$(pwd)\`

## Preflight
EOF

info "Preflight checks..."
command -v git >/dev/null || block "git not found"
command -v npm >/dev/null || block "npm not found"
command -v node >/dev/null || block "node not found"
command -v curl >/dev/null || block "curl not found"

require_clean_tree

git fetch --all --prune
git checkout -B "$ORCH_BRANCH" "$BASE_SHA"

echo "- ✅ Clean tree" >> "$REPORT_FILE"
echo "- ✅ Checked out \`$ORCH_BRANCH\` at \`$BASE_SHA\`" >> "$REPORT_FILE"

# Branch deliverables check
echo "" >> "$REPORT_FILE"
echo "## Branch delivery check" >> "$REPORT_FILE"
for b in "${BRANCHES[@]}"; do
  ref="$(resolve_ref "$b")" || block "Branch not found: $b"
  count="$(git rev-list --count "$BASE_SHA..$ref")"
  echo "- $b => $count commit(s) above BASE_SHA" >> "$REPORT_FILE"
  if [ "$count" -eq 0 ]; then
    block "No deliverable on $b (0 commit above BASE_SHA)"
  fi
done

# Runtime service checks
echo "" >> "$REPORT_FILE"
echo "## Service checks" >> "$REPORT_FILE"

if curl -fsS "$NETLIFY_DEV_URL" >/dev/null 2>&1; then
  echo "- ✅ netlify dev reachable at $NETLIFY_DEV_URL" >> "$REPORT_FILE"
else
  block "netlify dev not reachable at $NETLIFY_DEV_URL"
fi

if curl -fsS "$N8N_URL/healthz" >/dev/null 2>&1; then
  echo "- ✅ n8n reachable at $N8N_URL" >> "$REPORT_FILE"
else
  block "n8n not reachable at $N8N_URL"
fi

if [ -z "${SMOKE_EMAIL:-}" ] || [ -z "${SMOKE_PASSWORD:-}" ]; then
  block "SMOKE_EMAIL or SMOKE_PASSWORD missing"
fi

echo "" >> "$REPORT_FILE"
echo "## Merge + Gates" >> "$REPORT_FILE"

for b in "${BRANCHES[@]}"; do
  ref="$(resolve_ref "$b")" || block "Cannot resolve branch ref for $b"
  prev_sha="$(git rev-parse HEAD)"

  info "Merging $ref..."
  git merge --no-ff "$ref" -m "merge($b): MVP integration" || block "Merge conflict on $b"

  new_sha="$(git rev-parse HEAD)"
  files_changed="$(git diff --name-only "$prev_sha..$new_sha" | wc -l | tr -d ' ')"

  echo "" >> "$REPORT_FILE"
  echo "### Merge: $b" >> "$REPORT_FILE"
  echo "- Merge commit: \`$new_sha\`" >> "$REPORT_FILE"
  echo "- Previous SHA: \`$prev_sha\`" >> "$REPORT_FILE"
  echo "- Files changed: $files_changed" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "#### Files impacted" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"
  git diff --name-only "$prev_sha..$new_sha" >> "$REPORT_FILE"
  echo '```' >> "$REPORT_FILE"

  run_gate "Build" "npm run build" || {
    [ "${ROLLBACK_ON_FAIL:-0}" = "1" ] && git reset --hard HEAD~1
    block "Build gate failed after merging $b"
  }

  run_gate "Smoke Stripe Local" "bash scripts/stripe_local_smoke.sh \"$SMOKE_EMAIL\" \"$SMOKE_PASSWORD\"" || {
    [ "${ROLLBACK_ON_FAIL:-0}" = "1" ] && git reset --hard HEAD~1
    block "Smoke gate failed after merging $b"
  }

  run_gate "Strict Validation" "node scripts/validate-strict.mjs" || {
    [ "${ROLLBACK_ON_FAIL:-0}" = "1" ] && git reset --hard HEAD~1
    block "Strict validation failed after merging $b"
  }
done

echo "" >> "$REPORT_FILE"
echo "## Verdict" >> "$REPORT_FILE"
echo "**GO deploy** ✅" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Next 3 actions:" >> "$REPORT_FILE"
echo "1. Push orchestrator branch and open PR" >> "$REPORT_FILE"
echo "2. Run final E2E Stripe scenarios once more" >> "$REPORT_FILE"
echo "3. Execute final secret rotation before production cutover" >> "$REPORT_FILE"

info "Done. Report: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"
