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
2. Render will fork the repo and show a deploy form. Fill in these fields:

| Field | What to Enter | Required? |
|----------|-------------|-----------|
| `LLM_API_KEY` | Your AI provider API key (see [AI Providers guide](#-ai-model-providers) below) | ✅ Yes |
| `LLM_MODEL` | Model name (e.g. `openai/gpt-4o`, `anthropic/claude-sonnet-4-6`) — leave blank for default | Optional |
| `GITHUB_GIST_TOKEN` | A GitHub token to auto-backup your workspace (see [how to create one](#-getting-your-github-gist-token-required-for-backup)) | ✅ Yes |

3. Click **Apply** → Wait for deploy → Done! 🎉

> 🔑 **GATEWAY_TOKEN** (your dashboard password) is **auto-generated** by Render. After deploy, find it in Render Dashboard → your service → **Environment** tab → `GATEWAY_TOKEN`. You'll need this to access the Control UI.

> 💡 **After deploy**, customize anytime in Render Dashboard → Environment → Save → auto-restarts:
> - Switch AI models (change `LLM_MODEL`)
> - Add Telegram, Discord, WhatsApp bots
> - Set `UPTIMEROBOT_API_KEY` to stay awake 24/7
> - See [full env var reference](#environment-variables)

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
| `GATEWAY_TOKEN` | Required — secures the Control UI (auto-generated on deploy) |
| `OPENCLAW_PASSWORD` | Alternative password auth |
| `ALLOWED_ORIGINS` | CORS allowed origins |

---

## 📋 Environment Variables (Complete Reference)

All variables you can set in Render Dashboard → your service → **Environment**:

### Required (Set During Deploy)

| Variable | Description | Example |
|----------|-------------|---------|
| `LLM_API_KEY` | Your AI provider API key | `sk-or-v1-xxxx` |
| `LLM_MODEL` | AI model to use (defaults to `openai/gpt-4o` if blank) | `anthropic/claude-sonnet-4-6` |
| `GATEWAY_TOKEN` | Dashboard password — **auto-generated by Render** | *(find in Render → Environment)* |

### Required for Backup

| Variable | Description | How to Get |
|----------|-------------|------------|
| `GITHUB_GIST_TOKEN` | GitHub token with `gist` scope | [Guide below](#-getting-your-github-gist-token-required-for-backup) |

### Optional — Channels

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | *(disabled)* |
| `TELEGRAM_USER_ID` | Your Telegram user ID | *(disabled)* |
| `WHATSAPP_ENABLED` | Enable WhatsApp | `false` |
| `DISCORD_TOKEN` | Discord bot token | *(disabled)* |
| `SLACK_TOKEN` | Slack bot token | *(disabled)* |

### Optional — Keep-Alive

| Variable | Description | Default |
|----------|-------------|---------|
| `UPTIMEROBOT_API_KEY` | UptimeRobot API key (keeps service awake 24/7) | *(disabled)* |
| `CRONJOB_ORG_KEY` | cron-job.org API key (backup keep-alive) | *(disabled)* |
| `SELF_PING_INTERVAL` | Self-ping interval in ms | `600000` (10 min) |

### Optional — Other

| Variable | Description | Default |
|----------|-------------|---------|
| `WEBHOOK_URL` | Webhook for restart/backup notifications | *(disabled)* |
| `OPENCLAW_PASSWORD` | Alternative to GATEWAY_TOKEN | *(disabled)* |
| `ALLOWED_ORIGINS` | CORS allowed origins | *(auto)* |

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

You can use **any AI provider** with RendClaw. Here's everything you need — including **completely free options**.

---

### 🆓 Free Providers (No Payment Required)

These providers are **100% free** — no credit card, no trial, just sign up and go.

---

#### OpenRouter Free Models 🔥

[OpenRouter](https://openrouter.ai) gives you **one API key** for 40+ providers. Many models are completely free.

| Model | `LLM_MODEL` value | Size | Best For |
|-------|-------------------|------|----------|
| **Gemma 4 31B** 🆕 | `openrouter/google/gemma-4-31b-it:free` | 31B | General, coding, reasoning |
| **Gemma 4 26B (MoE)** 🆕 | `openrouter/google/gemma-4-26b-a4b-it:free` | 26B | Fast + capable |
| **Gemma 3 27B** | `openrouter/google/gemma-3-27b-it:free` | 27B | Balanced, great quality |
| **Gemma 3 12B** | `openrouter/google/gemma-3-12b-it:free` | 12B | Fast, good quality |
| **Gemma 3 4B** | `openrouter/google/gemma-3-4b-it:free` | 4B | Ultra-fast responses |
| **Llama 3.3 70B** | `openrouter/meta-llama/llama-3.3-70b-instruct:free` | 70B | Complex reasoning |
| **Hermes 3 405B** | `openrouter/nousresearch/hermes-3-llama-3.1-405b:free` | 405B | 🤯 Largest free model |
| **Qwen3 Coder** | `openrouter/qwen/qwen3-coder:free` | — | Coding specialist |
| **Qwen3 80B (MoE)** | `openrouter/qwen/qwen3-next-80b-a3b-instruct:free` | 80B | Fast reasoning |
| **GPT-OSS 120B** | `openrouter/openai/gpt-oss-120b:free` | 120B | Open-source GPT |
| **GPT-OSS 20B** | `openrouter/openai/gpt-oss-20b:free` | 20B | Fast open GPT |
| **GLM 4.5 Air** | `openrouter/z-ai/glm-4.5-air:free` | — | Chinese + English |
| **Nemotron Super 120B** | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | 120B | Massive context |
| **Nemotron Nano 9B** | `openrouter/nvidia/nemotron-nano-9b-v2:free` | 9B | Compact + fast |
| **MiniMax M2.5** | `openrouter/minimax/minimax-m2.5:free` | — | Chinese language |
| **Llama 3.2 3B** | `openrouter/meta-llama/llama-3.2-3b-instruct:free` | 3B | Ultra-lightweight |

**Limits:** 20 requests/min, 50 requests/day (up to 1000/day with $10 lifetime topup)

**Setup:**
```
LLM_API_KEY=sk-or-v1-xxxxxxxx                    # from openrouter.ai/keys
LLM_MODEL=openrouter/google/gemma-4-31b-it:free
```

> 💡 **Best free pick:** Gemma 4 31B — latest Google model, completely free, great quality.

---

#### Groq ⚡ FASTEST

[Groq](https://console.groq.com) runs models on custom LPU chips — **insanely fast** inference. Free tier is generous.

| Model | `LLM_MODEL` value | Free Limit | Speed |
|-------|-------------------|-----------|-------|
| **Llama 4 Scout** 🆕 | `groq/llama-4-scout-17b-16e-instruct` | 1000 req/day | ⚡⚡⚡ |
| **Llama 3.3 70B** | `groq/llama-3.3-70b-versatile` | 1000 req/day | ⚡⚡⚡ |
| **Llama 3.1 8B** | `groq/llama-3.1-8b-instant` | 14,400 req/day | ⚡⚡⚡⚡ |
| **Qwen 3 32B** | `groq/qwen/qwen3-32b` | 1000 req/day | ⚡⚡⚡ |
| **GPT-OSS 120B** | `groq/openai/gpt-oss-120b` | 1000 req/day | ⚡⚡ |
| **GPT-OSS 20B** | `groq/openai/gpt-oss-20b` | 1000 req/day | ⚡⚡⚡ |

**Setup:**
```
LLM_API_KEY=gsk_xxxxxxxx                          # from console.groq.com
LLM_MODEL=groq/llama-3.3-70b-versatile
```

> ⚡ **Why Groq?** Responses come back in under 1 second. Best free option for real-time chat.

---

#### Cerebras 🧠

[Cerebras](https://cloud.cerebras.ai) offers free inference on their wafer-scale chips.

| Model | Free Limit |
|-------|-----------|
| **Llama 3.1 8B** | 30 req/min, 14,400 req/day |
| **GPT-OSS 120B** | 30 req/min, 14,400 req/day |

**Setup:**
```
LLM_API_KEY=csk-xxxxxx                            # from cloud.cerebras.ai
LLM_MODEL=cerebras/llama3.1-8b
```

---

#### Google AI Studio 🟢 Generous Free Tier

[Google AI Studio](https://aistudio.google.com) gives free access to Gemini models — **no credit card**.

| Model | `LLM_MODEL` value | Free Limit |
|-------|-------------------|-----------|
| **Gemini 2.5 Flash** | `google/gemini-2.5-flash` | 250K tokens/min, 20 req/day |
| **Gemini 2.5 Flash-Lite** | `google/gemini-2.5-flash-lite` | 250K tokens/min, 20 req/day |
| **Gemini 3 Flash** 🆕 | `google/gemini-3.0-flash` | 250K tokens/min, 20 req/day |
| **Gemma 3 27B** | `google/gemma-3-27b-it` | 15K tokens/min, 14,400 req/day |
| **Gemma 3 12B** | `google/gemma-3-12b-it` | 15K tokens/min, 14,400 req/day |
| **Gemma 3 4B** | `google/gemma-3-4b-it` | 15K tokens/min, 14,400 req/day |

**Setup:**
```
LLM_API_KEY=AIzaxxxxxxxx                          # from aistudio.google.com/apikey
LLM_MODEL=google/gemini-2.5-flash
```

> 💡 Gemma 3 models have **much higher free limits** (14,400 req/day) than Gemini models (20 req/day). Use Gemma for heavy usage.

---

#### NVIDIA NIM 🟢

[NVIDIA NIM](https://build.nvidia.com) — free inference on NVIDIA GPUs. Phone verification required.

**Rate limit:** 40 requests/minute

**Setup:**
```
LLM_API_KEY=nvapi-xxxxxx                          # from build.nvidia.com
LLM_MODEL=nvidia/llama-3.1-8b-instruct
```

Browse all models at [build.nvidia.com/models](https://build.nvidia.com/models).

---

#### HuggingFace Inference Providers 🤗

[HuggingFace](https://huggingface.co) offers free serverless inference for models under 10GB.

**Free credit:** $0.10/month (enough for light usage)

**Setup:**
```
LLM_API_KEY=hf_xxxxxxxx                           # from huggingface.co/settings/tokens
LLM_MODEL=huggingface/meta-llama/Llama-3.2-3B-Instruct
```

> Works with any model under 10GB on the HuggingFace Hub.

---

#### Cohere 🟢

[Cohere](https://cohere.com) offers free access to their models.

**Limit:** 20 requests/minute, 1000 requests/month

| Model | Best For |
|-------|----------|
| Command A | General chat |
| Command R | RAG, search |
| Aya Expanse 32B | Multilingual |

**Setup:**
```
LLM_API_KEY=co-xxxxxx                             # from dashboard.cohere.com
LLM_MODEL=cohere/command-a
```

---

#### GitHub Models 🐙

[GitHub Models](https://github.com/marketplace/models) — free for all GitHub users. Just use your GitHub token.

**Setup:**
```
LLM_API_KEY=ghp_xxxxxxxx                          # your GitHub token
LLM_MODEL=github/gpt-4o
```

---

#### Cloudflare Workers AI ☁️

[Cloudflare](https://developers.cloudflare.com/workers-ai/) — free tier includes 10,000 neurons/day.

**Setup:**
```
LLM_API_KEY=xxxxxx                                # from Cloudflare dashboard
LLM_MODEL=cloudflare/@cf/meta/llama-3.1-8b-instruct
```

---

#### Puter.js 🟢 ZERO API Keys

[Puter.js](https://puter.com) — AI models with **no API keys at all**. Best for trying things out.

| Available Models |
|-----------------|
| GPT-4o |
| Claude Sonnet 4 |
| Llama 3.1 70B |
| Gemini 2.5 Flash |
| Mixtral 8x22B |

**Setup:**
```
LLM_API_KEY=puter-free
LLM_MODEL=puter/ai/gpt-4o
```

> ⚠️ Puter.js is primarily designed for client-side use. For server deployments, OpenRouter or direct providers are more reliable.

---

### 💰 Paid Providers (with Free Trials/Free Tiers)

#### OpenAI

**Free trial credits** for new accounts.

| Key prefix | Model example |
|-----------|---------------|
| `sk-` | `openai/gpt-4o` |

**Setup:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
```
LLM_API_KEY=sk-xxxxxx
LLM_MODEL=openai/gpt-4o
```

#### Anthropic

| Key prefix | Model example |
|-----------|---------------|
| `sk-ant-` | `anthropic/claude-sonnet-4-6` |

**Setup:** [console.anthropic.com](https://console.anthropic.com)
```
LLM_API_KEY=sk-ant-xxxxxx
LLM_MODEL=anthropic/claude-sonnet-4-6
```

#### Mistral

**Free tier:** 1 req/sec, 500K tokens/min, 1B tokens/month (requires phone verification)

| Key prefix | Model example |
|-----------|---------------|
| `*` | `mistral/mistral-small-latest` |

**Setup:** [console.mistral.ai](https://console.mistral.ai)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=mistral/mistral-small-latest
```

#### DeepSeek

Very cheap — $0.27/1M tokens for their best model.

| Key prefix | Model example |
|-----------|---------------|
| `sk-` | `deepseek/deepseek-chat` |

**Setup:** [platform.deepseek.com](https://platform.deepseek.com)
```
LLM_API_KEY=sk-xxxxxx
LLM_MODEL=deepseek/deepseek-chat
```

#### Moonshot (Kimi)

Free tier available.

| Key prefix | Model example |
|-----------|---------------|
| `sk-` | `moonshot/kimi-k2.5` |

**Setup:** [platform.moonshot.cn](https://platform.moonshot.cn)
```
LLM_API_KEY=sk-xxxxxx
LLM_MODEL=moonshot/kimi-k2.5
```

#### xAI (Grok)

| Key prefix | Model example |
|-----------|---------------|
| `xai-` | `xai/grok-4` |

**Setup:** [console.x.ai](https://console.x.ai)
```
LLM_API_KEY=xai-xxxxxx
LLM_MODEL=xai/grok-4
```

#### Together AI

Some free models available, plus $5 in free credits on signup.

**Setup:** [api.together.xyz](https://api.together.xyz)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=together/meta-llama/Llama-3.3-70B-Instruct-Turbo
```

#### Fireworks AI

Free credits on signup.

**Setup:** [fireworks.ai](https://fireworks.ai)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct
```

---

### 💡 Recommended Setups

#### 🆓 Best Completely Free (High Usage)
```
LLM_API_KEY=AIzaxxxxxxxx                          # Google AI Studio
LLM_MODEL=google/gemma-3-27b-it                   # 14,400 requests/day free!
```

#### 🆓 Best Completely Free (Quality)
```
LLM_API_KEY=sk-or-v1-xxxxxx                       # OpenRouter
LLM_MODEL=openrouter/google/gemma-4-31b-it:free   # Latest model, free
```

#### ⚡ Best Free (Speed)
```
LLM_API_KEY=gsk_xxxxxxxx                          # Groq
LLM_MODEL=groq/llama-3.3-70b-versatile           # Sub-second responses
```

#### 🤯 Best Free (Power)
```
LLM_API_KEY=sk-or-v1-xxxxxx                       # OpenRouter
LLM_MODEL=openrouter/nousresearch/hermes-3-llama-3.1-405b:free  # 405B params, FREE!
```

#### 💰 Best Value (Paid)
```
LLM_API_KEY=sk-or-v1-xxxxxx                       # OpenRouter
LLM_MODEL=openrouter/deepseek/deepseek-v3         # $0.27/1M tokens
```

#### 🏆 Best Quality (Paid)
```
LLM_API_KEY=sk-or-v1-xxxxxx                       # OpenRouter
LLM_MODEL=openrouter/anthropic/claude-sonnet-4-6  # Top quality
```

#### 🔄 Switch Models Anytime
Just change `LLM_MODEL` in Render dashboard → Environment → Save → auto-restarts in 30 seconds. Try different models until you find your favorite!

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
