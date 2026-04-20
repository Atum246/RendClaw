---
title: RendClaw
emoji: 🎨
colorFrom: green
colorTo: purple
sdk: docker
pinned: true
license: mit
---

# 🎨🦞 RendClaw

**Your always-on AI assistant on Render — free, no server needed.**

Run [OpenClaw](https://openclaw.ai) on **Render** for free. Any LLM, Telegram & WhatsApp support, auto-sync, built-in keep-alive, and a beautiful dashboard.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Atum246/RendClaw)

---

## ✨ Features

- 🎨 **One-Click Deploy**: Deploy to Render with a single click using Blueprints
- 🤖 **Any LLM**: Claude, GPT, Gemini, DeepSeek, Grok, Mistral, Qwen, and 40+ providers via [OpenRouter](https://openrouter.ai)
- 📱 **Multi-Channel**: Telegram, WhatsApp, Discord, Slack, Web Chat
- 💾 **Smart Backup**: GitHub Gist, HuggingFace Datasets, or S3
- ⏰ **Keep-Alive**: UptimeRobot + cron-job.org + self-ping to prevent Render free tier spin-down
- 📊 **Beautiful Dashboard**: Real-time monitoring with Render-themed UI
- 🔐 **Secure**: Token/password auth, CORS control
- 🐳 **Docker Ready**: Pre-built image, deploys in minutes

---

## 🚀 Quick Start

### Option 1: Deploy to Render Button (Easiest!) ⚡

1. Click the **[Deploy to Render](https://render.com/deploy?repo=https://github.com/Atum246/RendClaw)** button
2. Render will fork the repo and show a deploy form with **2 fields** to fill:

| Field | What to Enter |
|----------|-------------|
| `LLM_API_KEY` | Your provider API key (OpenAI, Anthropic, etc.) |
| `GITHUB_GIST_TOKEN` | GitHub token with `gist` scope ([create one here](https://github.com/settings/tokens/new?scopes=gist)) |

3. Click **Apply** → Wait for deploy → Done! 🎉

> 💡 **After deploy**, you can customize in the Render dashboard → Environment:
> - Change `LLM_MODEL` (default: `openai/gpt-4o`)  
> - Add `TELEGRAM_BOT_TOKEN`, `DISCORD_TOKEN`, etc.
> - Set `UPTIMEROBOT_API_KEY` to keep your service awake 24/7

### Option 2: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (or use `https://github.com/Atum246/RendClaw`)
4. Configure:
   - **Runtime**: Docker
   - **Plan**: Free
5. Add environment variables (see below)
6. Click **Create Web Service**

---

## 💬 Where Do I Chat?

**Your web chat UI is your Render URL!**

```
👉 https://your-service-name.onrender.com
```

Just open that link and you'll see the **OpenClaw web chat interface**! 💬⚡

### Chat From Anywhere:

| Channel | How |
|---------|-----|
| 🌐 **Web Browser** | Open your Render URL directly |
| 📱 **Telegram** | Set up bot (see below) |
| 📲 **WhatsApp** | Scan QR from dashboard |
| 🎮 **Discord** | Add bot token |

---

## 📱 Telegram Setup

1. Create a bot via [@BotFather](https://t.me/BotFather): `/newbot`
2. Get your user ID from [@userinfobot](https://t.me/userinfobot)
3. Add to Render environment:

```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_USER_ID=your-user-id
```

---

## 📲 WhatsApp Setup

```
WHATSAPP_ENABLED=true
```

Then scan the QR from your Dashboard (Channels → WhatsApp → Login).

---

## 🎮 Discord Setup

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Add `DISCORD_TOKEN` to your Render environment

---

## 💾 Workspace Backup (Zero-Config After Setup!)

**Render free tier has no persistent disk.** RendClaw handles this for you automatically — set one env var and forget about it.

### What Happens (All Automatic 🤖)

🔄 **On every restart**, RendClaw:
1. **Auto-discovers** your backup from GitHub (even without knowing the Gist ID!)
2. **Restores** your entire workspace (AGENTS.md, SOUL.md, MEMORY.md, conversations — everything)
3. **Resumes syncing** — new changes are backed up every 2 minutes

You never touch anything. It just works. ✅

### Setup (One-Time, 30 Seconds)

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Create a token with **`gist`** scope only
3. Add to Render environment:

```
GITHUB_GIST_TOKEN=ghp_your-token
```

**That's literally it.** RendClaw will:
- Auto-create a Gist on first run
- Pack your workspace as a compressed archive
- Persist the Gist ID inside your workspace (survives in backups)
- Auto-discover it on restart even if everything is wiped
- Sync changes every 2 minutes

### HuggingFace Datasets (Optional)

```
HF_USERNAME=your-username
HF_TOKEN=hf_your-token
```

### S3 (Optional)

```
S3_BACKUP_BUCKET=your-bucket
S3_REGION=us-east-1
```

---

## ⏰ Keep Space Awake

**⚠️ Render free tier spins down after 15 minutes of inactivity!**

Set up keep-alive to run 24/7:

### UptimeRobot (Recommended)

1. Get your **Main API key** from [UptimeRobot](https://uptimerobot.com)
2. Add `UPTIMEROBOT_API_KEY` to Render environment
3. RendClaw auto-creates a monitor for `/health`

### cron-job.org

1. Get API key from [cron-job.org](https://cron-job.org)
2. Add `CRONJOB_ORG_KEY`

### Self-Ping

Built-in — RendClaw pings itself every 10 minutes.

| Variable | Description |
|----------|-------------|
| `UPTIMEROBOT_API_KEY` | UptimeRobot Main API key |
| `CRONJOB_ORG_KEY` | cron-job.org API key |
| `SELF_PING_INTERVAL` | Self-ping interval in ms (default: 600000) |

---

## 🔔 Webhooks

Get notified on restarts or backup failures:

```
WEBHOOK_URL=https://your-webhook-endpoint.com/hook
```

---

## 🔐 Security

| Variable | Description |
|----------|-------------|
| `GATEWAY_TOKEN` | Required — secures the Control UI |
| `OPENCLAW_PASSWORD` | Alternative password auth |
| `ALLOWED_ORIGINS` | CORS allowed origins |

---

## 🤖 LLM Providers

| Provider | Prefix | Example |
|----------|--------|---------|
| Anthropic | `anthropic/` | `anthropic/claude-sonnet-4-6` |
| OpenAI | `openai/` | `openai/gpt-4o` |
| Google | `google/` | `google/gemini-2.5-flash` |
| DeepSeek | `deepseek/` | `deepseek/deepseek-v3.2` |
| xAI | `xai/` | `xai/grok-4` |
| Mistral | `mistral/` | `mistral/mistral-large-latest` |
| Moonshot | `moonshot/` | `moonshot/kimi-k2.5` |

### OpenRouter (All Providers)

```
LLM_API_KEY=sk-or-v1-xxxxxxxx
LLM_MODEL=openrouter/anthropic/claude-sonnet-4-6
```

---

## 📊 Dashboard

Access at your Render URL. Features:
- 🟢 Real-time status & uptime
- 📈 Memory & CPU (with 512MB limit indicator for free tier)
- 📱 Channel connection status
- 💾 Backup sync status
- ⏰ Keep-alive monitor status

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | JSON health check |
| `/api/status` | Full status with resources |

---

## 💻 Local Development

```bash
git clone https://github.com/Atum246/RendClaw.git
cd RendClaw
cp .env.example .env
# Edit .env

# Docker
docker build -t rendclaw .
docker run -p 10000:10000 --env-file .env rendclaw

# Without Docker
npm install -g openclaw@latest
export $(cat .env | xargs)
bash start.sh
```

---

## 🔗 CLI Access

```bash
npm install -g openclaw@latest
openclaw channels login --gateway https://your-service.onrender.com
```

---

## 🏗️ Architecture

```
RendClaw/
├── Dockerfile           # Optimized for Render
├── render.yaml          # Render Blueprint (one-click deploy!)
├── start.sh             # Smart setup wizard (Render-aware)
├── workspace-sync.py    # Multi-backend backup (Gist, HF, S3)
├── health-server.js     # Health endpoint + Render-themed dashboard
├── keepalive.js         # Keep-alive with spin-down warnings
├── docker-compose.yml   # Local development
├── .env.example         # Environment reference
├── tests/test.sh        # Test suite
├── CONTRIBUTING.md      # Contribution guidelines
├── LICENSE              # MIT License
└── README.md            # You are here
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Service keeps spinning down | Set `UPTIMEROBOT_API_KEY` — free tier spins down after 15 min |
| Missing secrets error | Set `LLM_API_KEY`, `LLM_MODEL`, `GATEWAY_TOKEN` |
| Build fails | Check Render logs, ensure Docker is selected as runtime |
| Backup not working | Set `GITHUB_GIST_TOKEN` with `gist` scope. Check Render logs for sync errors |
| Workspace lost after restart | You didn't set `GITHUB_GIST_TOKEN`! Set it now — future data will be saved |
| CORS errors | Set `ALLOWED_ORIGINS=https://your-service.onrender.com` |
| Memory issues | Free tier has 512MB limit — check dashboard |

---

## 📚 Links

- [OpenClaw Docs](https://docs.openclaw.ai)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Render Docs](https://render.com/docs)
- [OpenRouter](https://openrouter.ai)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

**🎨🦞 RendClaw — OpenClaw on Render, made easy.**
