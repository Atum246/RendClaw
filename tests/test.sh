#!/usr/bin/env bash
# ============================================================
# 🧪 RendClaw Test Suite
# ============================================================

set -uo pipefail

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

PROJECT="/root/.openclaw/workspace/RendClaw"

# ─── File Structure ─────────────────────────────────────────
section "📁 File Structure"
for f in Dockerfile render.yaml start.sh workspace-sync.py health-server.js keepalive.js .env.example docker-compose.yml README.md LICENSE; do
    if [ -f "$PROJECT/$f" ]; then
        pass "$f exists"
    else
        fail "$f missing"
    fi
done

# ─── Shell Scripts ──────────────────────────────────────────
section "🐚 Shell Scripts"
if bash -n "$PROJECT/start.sh" 2>/dev/null; then pass "start.sh — valid syntax"; else fail "start.sh — syntax error"; fi
if grep -q "^main" "$PROJECT/start.sh"; then pass "start.sh — has main()"; else fail "start.sh — missing main()"; fi
if grep -q "detect_platform" "$PROJECT/start.sh"; then pass "start.sh — platform detection"; else fail "start.sh — no platform detection"; fi
if grep -q "render" "$PROJECT/start.sh"; then pass "start.sh — Render-aware"; else warn "start.sh — not Render-specific"; fi

# ─── Python ─────────────────────────────────────────────────
section "🐍 Python"
if python3 -c "import ast; ast.parse(open('$PROJECT/workspace-sync.py').read())" 2>/dev/null; then
    pass "workspace-sync.py — valid syntax"
else
    fail "workspace-sync.py — syntax error"
fi
BACKEND_COUNT=$(grep -c "class.*Backend" "$PROJECT/workspace-sync.py" 2>/dev/null || echo 0)
if [ "$BACKEND_COUNT" -ge 3 ]; then pass "workspace-sync.py — $BACKEND_COUNT backends"; else warn "workspace-sync.py — only $BACKEND_COUNT backends"; fi

# ─── Node.js ────────────────────────────────────────────────
section "🟢 Node.js"
if node --check "$PROJECT/health-server.js" 2>/dev/null; then pass "health-server.js — valid syntax"; else fail "health-server.js — syntax error"; fi
if node --check "$PROJECT/keepalive.js" 2>/dev/null; then pass "keepalive.js — valid syntax"; else fail "keepalive.js — syntax error"; fi

# ─── Docker & Render ────────────────────────────────────────
section "🐳 Docker & Render"
if grep -q "FROM" "$PROJECT/Dockerfile"; then pass "Dockerfile — has FROM"; else fail "Dockerfile — no FROM"; fi
if grep -q "EXPOSE 10000" "$PROJECT/Dockerfile"; then pass "Dockerfile — exposes port 10000"; else warn "Dockerfile — port not 10000"; fi
if grep -q "services:" "$PROJECT/render.yaml"; then pass "render.yaml — has services"; else fail "render.yaml — no services"; fi
if grep -q "plan: free" "$PROJECT/render.yaml"; then pass "render.yaml — free plan"; else warn "render.yaml — no free plan"; fi
if grep -q "autoDeploy: true" "$PROJECT/render.yaml"; then pass "render.yaml — auto-deploy"; else warn "render.yaml — no auto-deploy"; fi
if grep -q "disk:" "$PROJECT/render.yaml"; then pass "render.yaml — persistent disk"; else warn "render.yaml — no disk"; fi

# ─── Environment ────────────────────────────────────────────
section "🔧 Environment"
for var in LLM_API_KEY LLM_MODEL GATEWAY_TOKEN GITHUB_GIST_TOKEN; do
    if grep -q "$var" "$PROJECT/.env.example"; then pass ".env.example — has $var"; else fail ".env.example — missing $var"; fi
done

# ─── Dashboard ──────────────────────────────────────────────
section "📊 Dashboard"
if grep -q "/health" "$PROJECT/health-server.js"; then pass "health-server.js — health endpoint"; else fail "health-server.js — no health"; fi
if grep -q "/api/status" "$PROJECT/health-server.js"; then pass "health-server.js — status API"; else warn "health-server.js — no status API"; fi
if grep -q "render" "$PROJECT/health-server.js"; then pass "health-server.js — Render-themed"; else warn "health-server.js — not Render-specific"; fi

# ─── README ─────────────────────────────────────────────────
section "📖 Documentation"
README_LINES=$(wc -l < "$PROJECT/README.md")
if [ "$README_LINES" -gt 50 ]; then pass "README.md — $README_LINES lines"; else warn "README.md — only $README_LINES lines"; fi
for s in "Features" "Quick Start" "Where Do I Chat" "Telegram" "Backup" "Keep" "LLM" "Troubleshoot" "Render"; do
    if grep -qi "$s" "$PROJECT/README.md"; then pass "README.md — covers $s"; else warn "README.md — missing $s"; fi
done

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
