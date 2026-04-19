#!/usr/bin/env bash
# ============================================================
# 🧪 RendClaw Test Suite
# ============================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; WARN=$((WARN+1)); }
section() { echo -e "\n${BOLD}$1${NC}"; }

# ─── File Structure ─────────────────────────────────────────
section "📁 File Structure"
for f in Dockerfile render.yaml start.sh workspace-sync.py health-server.js keepalive.js .env.example docker-compose.yml README.md LICENSE; do
    if [ -f "$PROJECT_DIR/$f" ]; then
        pass "$f exists"
    else
        fail "$f missing"
    fi
done

# ─── Shell Scripts ──────────────────────────────────────────
section "🐚 Shell Scripts"
if bash -n "$PROJECT_DIR/start.sh" 2>/dev/null; then pass "start.sh — valid syntax"; else fail "start.sh — syntax error"; fi
if grep -q "^main" "$PROJECT_DIR/start.sh"; then pass "start.sh — has main()"; else fail "start.sh — missing main()"; fi
if grep -q "detect_platform" "$PROJECT_DIR/start.sh"; then pass "start.sh — platform detection"; else fail "start.sh — no platform detection"; fi
if grep -q "render" "$PROJECT_DIR/start.sh"; then pass "start.sh — Render-aware"; else warn "start.sh — not Render-specific"; fi

# ─── Python ─────────────────────────────────────────────────
section "🐍 Python"
if python3 -c "import ast; ast.parse(open('$PROJECT_DIR/workspace-sync.py').read())" 2>/dev/null; then
    pass "workspace-sync.py — valid syntax"
else
    fail "workspace-sync.py — syntax error"
fi
BACKEND_COUNT=$(grep -c "class.*Backend" "$PROJECT_DIR/workspace-sync.py" 2>/dev/null || echo 0)
if [ "$BACKEND_COUNT" -ge 3 ]; then pass "workspace-sync.py — $BACKEND_COUNT backends"; else warn "workspace-sync.py — only $BACKEND_COUNT backends"; fi

# ─── Node.js ────────────────────────────────────────────────
section "🟢 Node.js"
if node --check "$PROJECT_DIR/health-server.js" 2>/dev/null; then pass "health-server.js — valid syntax"; else fail "health-server.js — syntax error"; fi
if node --check "$PROJECT_DIR/keepalive.js" 2>/dev/null; then pass "keepalive.js — valid syntax"; else fail "keepalive.js — syntax error"; fi

# ─── Docker & Render ────────────────────────────────────────
section "🐳 Docker & Render"
if grep -q "FROM" "$PROJECT_DIR/Dockerfile"; then pass "Dockerfile — has FROM"; else fail "Dockerfile — no FROM"; fi
if grep -q "EXPOSE 10000" "$PROJECT_DIR/Dockerfile"; then pass "Dockerfile — exposes port 10000"; else warn "Dockerfile — port not 10000"; fi
if grep -q "services:" "$PROJECT_DIR/render.yaml"; then pass "render.yaml — has services"; else fail "render.yaml — no services"; fi
if grep -q "plan: free" "$PROJECT_DIR/render.yaml"; then pass "render.yaml — free plan"; else warn "render.yaml — no free plan"; fi
if grep -q "autoDeploy: true" "$PROJECT_DIR/render.yaml"; then pass "render.yaml — auto-deploy"; else warn "render.yaml — no auto-deploy"; fi
if grep -q "disk:" "$PROJECT_DIR/render.yaml"; then pass "render.yaml — persistent disk"; else warn "render.yaml — no disk"; fi

# ─── Environment ────────────────────────────────────────────
section "🔧 Environment"
for var in LLM_API_KEY LLM_MODEL GATEWAY_TOKEN; do
    if grep -q "$var" "$PROJECT_DIR/.env.example"; then pass ".env.example — has $var"; else fail ".env.example — missing $var"; fi
done

# ─── Dashboard ──────────────────────────────────────────────
section "📊 Dashboard"
if grep -q "/health" "$PROJECT_DIR/health-server.js"; then pass "health-server.js — health endpoint"; else fail "health-server.js — no health"; fi
if grep -q "/api/status" "$PROJECT_DIR/health-server.js"; then pass "health-server.js — status API"; else warn "health-server.js — no status API"; fi
if grep -q "render\|Render" "$PROJECT_DIR/health-server.js"; then pass "health-server.js — Render-themed"; else warn "health-server.js — not Render-specific"; fi

# ─── README ─────────────────────────────────────────────────
section "📖 Documentation"
README_LINES=$(wc -l < "$PROJECT_DIR/README.md")
if [ "$README_LINES" -gt 50 ]; then pass "README.md — $README_LINES lines"; else warn "README.md — only $README_LINES lines"; fi
for s in "Features" "Quick Start" "Telegram" "Backup" "Keep" "LLM" "Troubleshoot" "Render"; do
    if grep -qi "$s" "$PROJECT_DIR/README.md"; then pass "README.md — covers $s"; else warn "README.md — missing $s"; fi
done

# ─── Security ───────────────────────────────────────────────
section "🔐 Security"
if grep -q "GATEWAY_TOKEN" "$PROJECT_DIR/start.sh"; then pass "start.sh — validates GATEWAY_TOKEN"; else fail "start.sh — no GATEWAY_TOKEN check"; fi
if grep -q "Access-Control\|CORS\|cors" "$PROJECT_DIR/health-server.js"; then pass "health-server.js — CORS support"; else warn "health-server.js — no CORS"; fi

# ─── Summary ────────────────────────────────────────────────
section "═══════════════════════════════════════"
echo -e "${BOLD}Results:${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo -e "  ${YELLOW}Warnings: $WARN${NC}"
section "═══════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✅ All critical tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}${BOLD}❌ $FAIL test(s) failed!${NC}"
    exit 1
fi
