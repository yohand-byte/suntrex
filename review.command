#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
bash ./scripts/review_autopilot.sh
echo
echo "Press Enter to close..."
read -r _
