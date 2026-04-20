#!/usr/bin/env bash
# ============================================================
# 🎨🦞 RendClaw — Smart Setup Wizard (Render Edition)
# Validates env, generates config, optimized for Render
# ============================================================

set -euo pipefail

# ─── Colors & Formatting ─────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Banner ──────────────────────────────────────────────────
print_banner() {
    echo -e "${PURPLE}${BOLD}"
    echo "  ██████╗ ███████╗███╗   ██╗██████╗  ██████╗██╗      █████╗ ██╗    ██╗"
    echo "  ██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔════╝██║     ██╔══██╗██║    ██║"
    echo "  ██████╔╝█████╗  ██╔██╗ ██║██║  ██║██║     ██║     ███████║██║ █╗ ██║"
    echo "  ██╔══██╗██╔══╝  ██║╚██╗██║██║  ██║██║     ██║     ██╔══██║██║███╗██║"
    echo "  ██║  ██║███████╗██║ ╚████║██████╔╝╚██████╗███████╗██║  ██║╚███╔███╔╝"
    echo "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝"
    echo -e "${NC}"
    echo -e "  ${CYAN}🎨🦞 RendClaw Setup Wizard — Render Edition${NC}"
    echo ""
}

log_info()    { echo -e "${BLUE}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[✓]${NC}      $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC}   $1"; }
log_step()    { echo -e "${PURPLE}[STEP]${NC}   $1"; }

# ─── Platform Detection ──────────────────────────────────────
detect_platform() {
    if [ -n "${RENDER_SERVICE_ID:-}" ]; then
        PLATFORM="render"
        log_info "Platform: Render 🎨"
        log_info "Service: ${RENDER_SERVICE_NAME:-unknown}"
        log_info "Instance: ${RENDER_INSTANCE_ID:-unknown}"
    elif [ -n "${SPACE_ID:-}" ]; then
        PLATFORM="huggingface"
        log_info "Platform: HuggingFace Spaces 🤗"
    elif [ -n "${RAILWAY_ENVIRONMENT:-}" ]; then
        PLATFORM="railway"
        log_info "Platform: Railway 🚂"
    elif [ -n "${FLY_APP_NAME:-}" ]; then
        PLATFORM="flyio"
        log_info "Platform: Fly.io 🪰"
    else
        PLATFORM="local"
        log_info "Platform: Local / Docker 🐳"
    fi
    export NEOCLAW_PLATFORM="$PLATFORM"

    # Render-specific: detect if free tier
    if [ "$PLATFORM" = "render" ]; then
        if [ "${RENDER_SERVICE_PLAN:-}" = "free" ]; then
            log_warn "Free tier detected — service will spin down after 15 min of inactivity"
            log_info "Set up keep-alive to prevent spin-down! ⏰"
        fi
    fi
}

# ─── Required Secrets Validation ─────────────────────────────
validate_secrets() {
    log_step "Validating required secrets..."
    local missing=0

    # Required
    if [ -z "${LLM_API_KEY:-}" ]; then
        log_error "LLM_API_KEY is required! Set your provider API key."
        missing=1
    else
        log_success "LLM_API_KEY set (${#LLM_API_KEY} chars)"
    fi

    # LLM_MODEL — use default if not set (user might leave blank in deploy form)
    if [ -z "${LLM_MODEL:-}" ]; then
        export LLM_MODEL="openai/gpt-4o"
        log_warn "LLM_MODEL not set — using default: $LLM_MODEL"
        log_info "You can change this anytime in Render dashboard → Environment"
    else
        log_success "LLM_MODEL set: $LLM_MODEL"
    fi

    if [ -z "${GATEWAY_TOKEN:-}" ]; then
        log_error "GATEWAY_TOKEN is required! Set a strong password."
        missing=1
    else
        log_success "GATEWAY_TOKEN set (${#GATEWAY_TOKEN} chars)"
    fi

    # Optional warnings
    if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
        log_info "Telegram not configured (optional)"
    else
        log_success "Telegram bot token set 📱"
    fi

    if [ "${WHATSAPP_ENABLED:-false}" = "true" ]; then
        log_success "WhatsApp enabled 📲"
    fi

    if [ -n "${DISCORD_TOKEN:-}" ]; then
        log_success "Discord bot token set 🎮"
    fi

    if [ "$missing" -eq 1 ]; then
        log_error "Missing required secrets! Check your Render environment variables."
        exit 1
    fi
}

# ─── Render URL Detection ────────────────────────────────────
detect_render_url() {
    if [ "$PLATFORM" = "render" ]; then
        if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
            if [[ "$RENDER_EXTERNAL_URL" == https://* ]]; then
                export NEOCLAW_EXTERNAL_URL="$RENDER_EXTERNAL_URL"
            else
                export NEOCLAW_EXTERNAL_URL="https://${RENDER_EXTERNAL_URL}"
            fi
            log_info "Render URL: $NEOCLAW_EXTERNAL_URL"
        elif [ -n "${RENDER_SERVICE_NAME:-}" ]; then
            export NEOCLAW_EXTERNAL_URL="https://${RENDER_SERVICE_NAME}.onrender.com"
            log_info "Render URL: $NEOCLAW_EXTERNAL_URL"
        fi
    fi
}

# ─── Restore Workspace ───────────────────────────────────────
restore_workspace() {
    log_step "Restoring workspace..."
    if python3 /app/workspace-sync.py --restore 2>/dev/null; then
        log_success "Workspace restored from backup! 💾"
    else
        log_info "No previous backup found — starting fresh 🆕"
    fi
}

# ─── Generate OpenClaw Config ────────────────────────────────
generate_config() {
    log_step "Generating OpenClaw configuration..."

    # Gateway runs on internal port 7860 — health server uses PORT (10000) for Render
    local gateway_port=7860

    # Build channel config
    local channels_config="{}"

    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ]; then
        local user_ids="${TELEGRAM_USER_IDS:-${TELEGRAM_USER_ID:-}}"
        channels_config=$(cat <<EOF
{
  "telegram": {
    "token": "$TELEGRAM_BOT_TOKEN",
    "allowedUsers": [$(
        if [ -n "$user_ids" ]; then
            echo "$user_ids" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | paste -sd',' -
        fi
    )]
  }
}
EOF
)
    fi

    if [ "${WHATSAPP_ENABLED:-false}" = "true" ]; then
        channels_config=$(echo "$channels_config" | python3 -c "
import sys, json
cfg = json.load(sys.stdin)
cfg['whatsapp'] = {'enabled': True}
print(json.dumps(cfg, indent=2))
" 2>/dev/null || echo "$channels_config")
    fi

    if [ -n "${DISCORD_TOKEN:-}" ]; then
        channels_config=$(echo "$channels_config" | python3 -c "
import sys, json
cfg = json.load(sys.stdin)
cfg['discord'] = {'token': '${DISCORD_TOKEN}'}
print(json.dumps(cfg, indent=2))
" 2>/dev/null || echo "$channels_config")
    fi

    # Build allowed origins for Control UI
    local origins=""
    if [ -n "${NEOCLAW_EXTERNAL_URL:-}" ]; then
        origins="\"${NEOCLAW_EXTERNAL_URL}\""
    fi
    if [ -n "${ALLOWED_ORIGINS:-}" ]; then
        if [ -n "$origins" ]; then
            origins="${origins}, ${ALLOWED_ORIGINS}"
        else
            origins="${ALLOWED_ORIGINS}"
        fi
    fi
    # Always allow localhost
    if [ -n "$origins" ]; then
        origins="\"http://localhost:${gateway_port}\", \"http://127.0.0.1:${gateway_port}\", ${origins}"
    else
        origins="\"http://localhost:${gateway_port}\", \"http://127.0.0.1:${gateway_port}\""
    fi

    # Extract provider name from model ID (e.g. "google" from "google/gemma-3-27b-it")
    local provider_name=$(echo "$LLM_MODEL" | cut -d'/' -f1)

    # Write config — using correct OpenClaw 2026.3.x schema
    cat > /root/.openclaw/openclaw.json <<CONFIGEOF
{
  "gateway": {
    "port": $gateway_port,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "$GATEWAY_TOKEN"
    },
    "controlUi": {
      "allowedOrigins": [$origins],
      "dangerouslyAllowHostHeaderOriginFallback": true
    }
  },
  "models": {
    "providers": {
      "$provider_name": {
        "apiKey": "$LLM_API_KEY"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "$LLM_MODEL"
      },
      "workspace": "/root/.openclaw/workspace"
    }
  },
  "channels": $channels_config
}
CONFIGEOF

    log_success "Config generated! ⚙️"
}

# ─── Print Startup Summary ──────────────────────────────────
print_summary() {
    echo ""
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  🎨🦞 RendClaw is ready!${NC}"
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}Platform:${NC}     $PLATFORM"
    echo -e "  ${CYAN}Model:${NC}        $LLM_MODEL"
    echo -e "  ${CYAN}URL:${NC}          ${NEOCLAW_EXTERNAL_URL:-http://localhost:${PORT:-10000}}"
    echo -e "  ${CYAN}Telegram:${NC}     $([ -n "${TELEGRAM_BOT_TOKEN:-}" ] && echo '✅ Enabled' || echo '❌ Disabled')"
    echo -e "  ${CYAN}WhatsApp:${NC}     $([ "${WHATSAPP_ENABLED:-false}" = "true" ] && echo '✅ Enabled' || echo '❌ Disabled')"
    echo -e "  ${CYAN}Discord:${NC}      $([ -n "${DISCORD_TOKEN:-}" ] && echo '✅ Enabled' || echo '❌ Disabled')"
    echo -e "  ${CYAN}Webhooks:${NC}     $([ -n "${WEBHOOK_URL:-}" ] && echo '🔔 Active' || echo '—')"
    echo ""
    echo -e "  ${YELLOW}Starting gateway...${NC}"
    echo ""
}

# ─── Notification on Restart ────────────────────────────────
send_restart_notification() {
    if [ -n "${WEBHOOK_URL:-}" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"event\": \"rendclaw_restart\",
                \"platform\": \"$PLATFORM\",
                \"model\": \"$LLM_MODEL\",
                \"url\": \"${NEOCLAW_EXTERNAL_URL:-unknown}\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }" >/dev/null 2>&1 || true
    fi
}

# ─── Main ────────────────────────────────────────────────────
main() {
    print_banner
    detect_platform
    validate_secrets
    detect_render_url
    restore_workspace
    generate_config
    send_restart_notification
    print_summary
}

main "$@"
