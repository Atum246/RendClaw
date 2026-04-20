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

## 🔑 Getting Your GitHub Gist Token (Required for Backup)

This token lets RendClaw auto-backup your workspace. **One-time setup, 60 seconds.**

### Step-by-Step

1. Go to **[github.com/settings/tokens](https://github.com/settings/tokens)**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `RendClaw Backup`
4. **Only check the `gist` scope** — nothing else needed ✅
   ```
   ☐ repo
   ☐ workflow
   ☑ gist  ← only this one!
   ☐ read:org
   ☐ ...
   ```
5. Click **"Generate token"**
6. Copy the token (starts with `ghp_`)
7. Paste it into the `GITHUB_GIST_TOKEN` field on Render

> ⚠️ **Save it somewhere safe** — GitHub only shows it once! But RendClaw stores it in Render's env vars, so you won't need it again.

### If You Forget

Your workspace resets on every restart until you add this token. No data is lost permanently — just add the token and new data gets saved from that point on.

---

## 🤖 AI Model Providers

You can use **any AI provider** with RendClaw. Here's a comprehensive setup guide:

### Quick Reference

| Provider | API Key Prefix | Model Prefix | Free Tier? | Example Model |
|----------|---------------|-------------|------------|---------------|
| [OpenRouter](#openrouter-🔥) | `sk-or-v1-` | `openrouter/` | ✅ Free models | `openrouter/meta-llama/llama-3.1-8b-instruct:free` |
| [NVIDIA NIM](#nvidia-nim-🟢-free) | `nvapi-` | `nvidia/` | ✅ Free! | `nvidia/llama-3.1-8b-instruct` |
| [Puter.js](#puterjs-🟢-100-free) | *(none needed!)* | `puter/` | ✅ Free forever! | `puter/ai/gpt-4o` |
| [OpenAI](#openai) | `sk-` | `openai/` | ❌ Pay | `openai/gpt-4o` |
| [Anthropic](#anthropic) | `sk-ant-` | `anthropic/` | ❌ Pay | `anthropic/claude-sonnet-4-6` |
| [Google](#google) | `AIza` | `google/` | ✅ Free tier | `google/gemini-2.5-flash` |
| [DeepSeek](#deepseek) | `sk-` | `deepseek/` | ✅ Cheap | `deepseek/deepseek-chat` |
| [Mistral](#mistral) | `*` | `mistral/` | ✅ Free tier | `mistral/mistral-small-latest` |
| [Moonshot](#moonshot-kimi) | `sk-` | `moonshot/` | ✅ Free tier | `moonshot/kimi-k2.5` |
| [xAI (Grok)](#xai-grok) | `xai-` | `xai/` | ❌ Pay | `xai/grok-4` |

---

### OpenRouter 🔥

**One API key, 40+ models, including free ones.** The easiest way to access everything.

#### How to Get Started

1. Go to **[openrouter.ai](https://openrouter.ai)**
2. Sign up (GitHub/Google login works)
3. Go to **[openrouter.ai/keys](https://openrouter.ai/keys)**
4. Click **"Create Key"** → copy it (starts with `sk-or-v1-`)
5. Set on Render:
   ```
   LLM_API_KEY=sk-or-v1-xxxxxxxx
   LLM_MODEL=openrouter/meta-llama/llama-3.1-8b-instruct:free
   ```

#### Free Models on OpenRouter 🆓

These models cost $0 on OpenRouter:

| Model | LLM_MODEL value | Best For |
|-------|----------------|----------|
| Llama 3.1 8B | `openrouter/meta-llama/llama-3.1-8b-instruct:free` | General chat |
| Mistral 7B | `openrouter/mistralai/mistral-7b-instruct:free` | Fast responses |
| Gemma 2 9B | `openrouter/google/gemma-2-9b-it:free` | Balanced |
| Llama 3.2 3B | `openrouter/meta-llama/llama-3.2-3b-instruct:free` | Ultra-fast |

#### Premium Models on OpenRouter 💎

| Model | LLM_MODEL value | Cost |
|-------|----------------|------|
| Claude Sonnet 4 | `openrouter/anthropic/claude-sonnet-4-6` | $3/1M input |
| GPT-4o | `openrouter/openai/gpt-4o` | $5/1M input |
| Gemini 2.5 Flash | `openrouter/google/gemini-2.5-flash` | $0.15/1M input |
| DeepSeek V3 | `openrouter/deepseek/deepseek-v3` | $0.27/1M input |

> 💡 **Best free setup:** Use Llama 3.1 8B free for daily use, switch to Claude/GPT for complex tasks.

---

### NVIDIA NIM 🟢 FREE

**Free AI inference from NVIDIA.** No credit card, no payment, just good models.

#### What is NIM?

NVIDIA NIM (NVIDIA Inference Microservices) provides free API access to open-source models hosted on NVIDIA's infrastructure. Models run on NVIDIA GPUs and are free to use.

#### How to Get Started

1. Go to **[build.nvidia.com](https://build.nvidia.com)**
2. Sign up (free, no credit card needed)
3. Go to **[build.nvidia.com/explore/recommended](https://build.nvidia.com/explore/recommended)** to browse models
4. Pick a model → click **"Build with this NIM"**
5. Click **"Get API Key"** — copy it (starts with `nvapi-`)
6. Set on Render:
   ```
   LLM_API_KEY=nvapi-xxxxxxxx
   LLM_MODEL=nvidia/llama-3.1-8b-instruct
   ```

#### Available Free Models 🆓

| Model | Best For | Rate Limit |
|-------|----------|------------|
| Llama 3.1 8B Instruct | General chat, coding | 40 RPM |
| Llama 3.1 70B Instruct | Complex reasoning | 40 RPM |
| Mistral NeMo 12B | Fast + capable | 40 RPM |
| Mixtral 8x7B | Expert-level tasks | 40 RPM |
| Gemma 2 9B | Lightweight, fast | 40 RPM |
| Phi-3 Mini | Ultra-fast, small | 40 RPM |

> ⚠️ **Rate limits:** Free tier allows ~40 requests per minute. More than enough for personal AI assistant use!

---

### Puter.js 🟢 100% FREE

**AI models with ZERO API keys.** Seriously.

#### What is Puter.js?

Puter.js is a free, open-source JavaScript library that gives you access to GPT-4o, Claude, Llama, Gemini, and more — **without any API keys or accounts**. It runs through Puter's cloud infrastructure.

#### How to Use with RendClaw

Puter.js works differently from traditional API providers — it's designed for client-side JavaScript. For RendClaw, you can use it via the **Puter CLI** or as an OpenAI-compatible proxy.

**Option A: Puter CLI (Direct)**

```bash
# Install Puter CLI
npm install -g puter

# Use any model for free
puter ai "Hello, how are you?" --model gpt-4o
puter ai "Hello, how are you?" --model claude-sonnet-4-6
puter ai "Hello, how are you?" --model llama-3.1-70b
```

**Option B: OpenAI-Compatible Mode**

Set in Render environment:
```
LLM_API_KEY=puter-free
LLM_MODEL=puter/ai/gpt-4o
```

#### Available Models (All Free!) 🆓

| Model | Capability |
|-------|-----------|
| GPT-4o | OpenAI's best — free via Puter |
| Claude Sonnet 4 | Anthropic's best — free via Puter |
| Llama 3.1 70B | Meta's open model |
| Gemini 2.5 Flash | Google's fast model |
| Mixtral 8x22B | Mistral's expert model |

> 🎯 **Why Puter?** No API keys, no billing, no rate limits for personal use. Perfect for trying out RendClaw before committing to a paid provider.

> ⚠️ **Note:** Puter.js is primarily designed for browser/client-side use. For production server deployments like RendClaw, OpenRouter or direct provider keys are more reliable.

---

### OpenAI

1. Go to **[platform.openai.com/api-keys](https://platform.openai.com/api-keys)**
2. Create a new secret key
3. Set on Render:
   ```
   LLM_API_KEY=sk-xxxxxxxx
   LLM_MODEL=openai/gpt-4o
   ```

### Anthropic

1. Go to **[console.anthropic.com](https://console.anthropic.com)**
2. Create an API key
3. Set on Render:
   ```
   LLM_API_KEY=sk-ant-xxxxxxxx
   LLM_MODEL=anthropic/claude-sonnet-4-6
   ```

### Google

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Create an API key
3. Set on Render:
   ```
   LLM_API_KEY=AIzaxxxxxxxx
   LLM_MODEL=google/gemini-2.5-flash
   ```

### DeepSeek

1. Go to **[platform.deepseek.com](https://platform.deepseek.com)**
2. Create an API key
3. Set on Render:
   ```
   LLM_API_KEY=sk-xxxxxxxx
   LLM_MODEL=deepseek/deepseek-chat
   ```

### Mistral

1. Go to **[console.mistral.ai](https://console.mistral.ai)**
2. Create an API key
3. Set on Render:
   ```
   LLM_API_KEY=xxxxxxxx
   LLM_MODEL=mistral/mistral-small-latest
   ```

### Moonshot (Kimi)

1. Go to **[platform.moonshot.cn](https://platform.moonshot.cn)**
2. Create an API key
3. Set on Render:
   ```
   LLM_API_KEY=sk-xxxxxxxx
   LLM_MODEL=moonshot/kimi-k2.5
   ```

### xAI (Grok)

1. Go to **[console.x.ai](https://console.x.ai)**
2. Create an API key
3. Set on Render:
   ```
   LLM_API_KEY=xai-xxxxxxxx
   LLM_MODEL=xai/grok-4
   ```

---

### 💡 Recommended Setups

#### 🆓 Completely Free
```
LLM_API_KEY=nvapi-xxxxxxxx          # NVIDIA NIM
LLM_MODEL=nvidia/llama-3.1-8b-instruct
```
Or:
```
LLM_API_KEY=sk-or-v1-xxxxxxxx       # OpenRouter
LLM_MODEL=openrouter/meta-llama/llama-3.1-8b-instruct:free
```

#### 💰 Best Value
```
LLM_API_KEY=sk-or-v1-xxxxxxxx       # OpenRouter
LLM_MODEL=openrouter/deepseek/deepseek-v3
```
DeepSeek V3 is ~$0.27/1M tokens — incredibly cheap for its quality.

#### 🏆 Best Quality
```
LLM_API_KEY=sk-or-v1-xxxxxxxx       # OpenRouter
LLM_MODEL=openrouter/anthropic/claude-sonnet-4-6
```

#### 🔄 Switch Models Anytime
Just change `LLM_MODEL` in Render dashboard → Environment → Save → service restarts with new model. Takes 30 seconds.

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
