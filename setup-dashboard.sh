#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SUNTREX — Install Dashboard module files
# Run: bash setup-dashboard.sh
# ═══════════════════════════════════════════════════════════════

PROJECT_DIR="$HOME/Downloads/suntrex"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🔧 SUNTREX Dashboard Module — Setup"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check project exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Project directory not found: $PROJECT_DIR"
  echo "   Please update PROJECT_DIR in this script."
  exit 1
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "$PROJECT_DIR/src/components/dashboard/buy"
mkdir -p "$PROJECT_DIR/src/components/dashboard/sell"
mkdir -p "$PROJECT_DIR/src/components/dashboard/transaction"
mkdir -p "$PROJECT_DIR/src/components/dashboard/profile"
mkdir -p "$PROJECT_DIR/src/components/dashboard/notifications"
mkdir -p "$PROJECT_DIR/src/components/dashboard/shared"
echo "   ✅ Directories created"

# Copy CLAUDE.md for dashboard module
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/dashboard-CLAUDE.md" ]; then
  cp "$SCRIPT_DIR/dashboard-CLAUDE.md" "$PROJECT_DIR/src/components/dashboard/CLAUDE.md"
  echo "   ✅ Dashboard CLAUDE.md installed"
else
  echo "   ⚠️  dashboard-CLAUDE.md not found in script directory"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Dashboard module scaffolding ready!"
echo ""
echo "  Structure:"
echo "  suntrex/src/components/dashboard/"
echo "  ├── CLAUDE.md"
echo "  ├── buy/"
echo "  ├── sell/"
echo "  ├── transaction/"
echo "  ├── profile/"
echo "  ├── notifications/"
echo "  └── shared/"
echo ""
echo "  Next step:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Open Claude Code: claude"
echo "  3. Paste the prompt from suntrex-dashboard-prompt.md"
echo ""
echo "═══════════════════════════════════════════════════════"
