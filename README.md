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

**Every free AI provider on Earth.** No excuses, no missed options.

---

### 🌍 Master Free Provider List

| # | Provider | 🌐 Region | Free Limit | Models | Setup |
|---|----------|-----------|-----------|--------|-------|
| 1 | **OpenRouter** 🔥 | 🌍 Global | 50 req/day | 24+ free models | [openrouter.ai/keys](https://openrouter.ai/keys) |
| 2 | **Groq** ⚡ | 🌍 Global | 14,400 req/day | Llama 4, Qwen3, GPT-OSS | [console.groq.com](https://console.groq.com) |
| 3 | **Google AI Studio** | 🌍 Global | 14,400 req/day | Gemini, Gemma 3 & 4 | [aistudio.google.com](https://aistudio.google.com) |
| 4 | **Cerebras** | 🌍 Global | 14,400 req/day | Llama 3.1, GPT-OSS | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| 5 | **NVIDIA NIM** | 🌍 Global | 40 req/min | Llama, Mistral, Mixtral | [build.nvidia.com](https://build.nvidia.com) |
| 6 | **HuggingFace** 🤗 | 🌍 Global | $0.10/mo credits | 70k+ models | [huggingface.co](https://huggingface.co) |
| 7 | **Cohere** | 🌍 Global | 1,000 req/month | Command A, Aya | [dashboard.cohere.com](https://dashboard.cohere.com) |
| 8 | **GitHub Models** 🐙 | 🌍 Global | Free for GitHub users | GPT-4o, Llama, more | [github.com/marketplace/models](https://github.com/marketplace/models) |
| 9 | **Cloudflare Workers AI** | 🌍 Global | 10,000 neurons/day | Llama, Mistral | [cloudflare.com](https://developers.cloudflare.com/workers-ai/) |
| 10 | **Puter.js** | 🌍 Global | Unlimited, NO API key | GPT-4o, Claude, Llama | [puter.com](https://puter.com) |
| 11 | **Bytez** 🆕 | 🌍 Global | Free inference | 70k+ models | [bytez.com](https://bytez.com) |
| 12 | **Mistral** | 🇫🇷 France | 1B tokens/month | Mistral models | [console.mistral.ai](https://console.mistral.ai) |
| 13 | **Vercel AI Gateway** | 🌍 Global | $5/month credits | Routes to all providers | [vercel.com](https://vercel.com/docs/ai-gateway) |
| 14 | **OpenCode Zen** | 🌍 Global | Free curated models | MiniMax, Arcee | [opencode.ai](https://opencode.ai/docs/zen/) |
| 15 | **Qwen API** 🇨🇳 | 🇨🇳 China | 1M free tokens | Qwen models | [dashscope.aliyun.com](https://dashscope.aliyun.com) |
| 16 | **ModelScope** 🇨🇳 | 🇨🇳 China | 2,000 free calls | Qwen, DeepSeek, more | [modelscope.cn](https://modelscope.cn) |
| 17 | **Baidu ERNIE** 🇨🇳 | 🇨🇳 China | 🆓 Completely free! | ERNIE 4.5 | [console.bce.baidu.com](https://console.bce.baidu.com) |
| 18 | **ByteDance Doubao** 🇨🇳 | 🇨🇳 China | Free tier | Doubao models | [console.volcengine.com](https://console.volcengine.com) |
| 19 | **Zhipu GLM** 🇨🇳 | 🇨🇳 China | Free tier | ChatGLM, GLM-4 | [open.bigmodel.cn](https://open.bigmodel.cn) |
| 20 | **MiniMax** 🇨🇳 | 🇨🇳 China | Free tier | MiniMax models | [api.minimax.chat](https://api.minimax.chat) |

---

### 🆓 Free Providers — Detailed Setup

---

#### 1. OpenRouter Free Models 🔥

**One API key. 24+ free models. The best free gateway.**

| Model | `LLM_MODEL` value | Size |
|-------|-------------------|------|
| **Gemma 4 31B** 🆕 | `openrouter/google/gemma-4-31b-it:free` | 31B |
| **Gemma 4 26B (MoE)** 🆕 | `openrouter/google/gemma-4-26b-a4b-it:free` | 26B |
| **Gemma 3 27B** | `openrouter/google/gemma-3-27b-it:free` | 27B |
| **Gemma 3n E4B** | `openrouter/google/gemma-3n-e4b-it:free` | 4B |
| **Gemma 3n E2B** | `openrouter/google/gemma-3n-e2b-it:free` | 2B |
| **Llama 3.3 70B** | `openrouter/meta-llama/llama-3.3-70b-instruct:free` | 70B |
| **Hermes 3 405B** | `openrouter/nousresearch/hermes-3-llama-3.1-405b:free` | 405B |
| **Qwen3 Coder** | `openrouter/qwen/qwen3-coder:free` | — |
| **Qwen3 80B (MoE)** | `openrouter/qwen/qwen3-next-80b-a3b-instruct:free` | 80B |
| **GPT-OSS 120B** | `openrouter/openai/gpt-oss-120b:free` | 120B |
| **GPT-OSS 20B** | `openrouter/openai/gpt-oss-20b:free` | 20B |
| **GLM 4.5 Air** | `openrouter/z-ai/glm-4.5-air:free` | — |
| **Nemotron Super 120B** | `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | 120B |
| **Nemotron Nano 9B** | `openrouter/nvidia/nemotron-nano-9b-v2:free` | 9B |
| **Nemotron Nano 30B** | `openrouter/nvidia/nemotron-3-nano-30b-a3b:free` | 30B |
| **MiniMax M2.5** | `openrouter/minimax/minimax-m2.5:free` | — |
| **Dolphin Mistral 24B** | `openrouter/cognitivecomputations/dolphin-mistral-24b-venice-edition:free` | 24B |
| **Trinity Large** | `openrouter/arcee-ai/trinity-large-preview:free` | — |
| **Liquid LFM 1.2B** | `openrouter/liquid/lfm-2.5-1.2b-instruct:free` | 1.2B |

**Limits:** 20 req/min, 50 req/day (1000/day with $10 lifetime topup)

```
LLM_API_KEY=sk-or-v1-xxxxxxxx
LLM_MODEL=openrouter/google/gemma-4-31b-it:free
```

---

#### 2. Groq ⚡ FASTEST ON EARTH

**Sub-second responses. Free tier is huge.**

| Model | `LLM_MODEL` value | Free Limit |
|-------|-------------------|-----------|
| **Llama 4 Scout** 🆕 | `groq/llama-4-scout-17b-16e-instruct` | 1,000 req/day |
| **Llama 3.3 70B** | `groq/llama-3.3-70b-versatile` | 1,000 req/day |
| **Llama 3.1 8B** | `groq/llama-3.1-8b-instant` | 14,400 req/day |
| **Qwen 3 32B** | `groq/qwen/qwen3-32b` | 1,000 req/day |
| **GPT-OSS 120B** | `groq/openai/gpt-oss-120b` | 1,000 req/day |
| **GPT-OSS 20B** | `groq/openai/gpt-oss-20b` | 1,000 req/day |

```
LLM_API_KEY=gsk_xxxxxxxx
LLM_MODEL=groq/llama-3.3-70b-versatile
```

---

#### 3. Google AI Studio 🟢

**Generous free tier. No credit card.**

| Model | Free Limit |
|-------|-----------|
| **Gemini 2.5 Flash** | 250K tokens/min, 20 req/day |
| **Gemini 3 Flash** 🆕 | 250K tokens/min, 20 req/day |
| **Gemma 3 27B** | 15K tokens/min, **14,400 req/day** |
| **Gemma 3 12B** | 15K tokens/min, **14,400 req/day** |
| **Gemma 3 4B** | 15K tokens/min, **14,400 req/day** |
| **Gemma 3 1B** | 15K tokens/min, **14,400 req/day** |

```
LLM_API_KEY=AIzaxxxxxxxx
LLM_MODEL=google/gemma-3-27b-it
```

---

#### 4. Cerebras 🧠

| Model | Free Limit |
|-------|-----------|
| **Llama 3.1 8B** | 30 req/min, 14,400 req/day |
| **GPT-OSS 120B** | 30 req/min, 14,400 req/day |

```
LLM_API_KEY=csk-xxxxxx
LLM_MODEL=cerebras/llama3.1-8b
```

---

#### 5. NVIDIA NIM 🟢

Free inference on NVIDIA GPUs. Phone verification required. 40 req/min.

```
LLM_API_KEY=nvapi-xxxxxx
LLM_MODEL=nvidia/llama-3.1-8b-instruct
```

Browse: [build.nvidia.com/models](https://build.nvidia.com/models)

---

#### 6. HuggingFace Inference Providers 🤗

Free serverless inference for models under 10GB. $0.10/mo credits.

```
LLM_API_KEY=hf_xxxxxxxx
LLM_MODEL=huggingface/meta-llama/Llama-3.2-3B-Instruct
```

---

#### 7. Cohere 🟢

| Model | Best For |
|-------|----------|
| Command A | General chat |
| Command R | RAG, search |
| Aya Expanse 32B | Multilingual |

**Limit:** 20 req/min, 1,000 req/month

```
LLM_API_KEY=co-xxxxxx
LLM_MODEL=cohere/command-a
```

---

#### 8. GitHub Models 🐙

Free for all GitHub users. Just use your GitHub token!

```
LLM_API_KEY=ghp_xxxxxxxx
LLM_MODEL=github/gpt-4o
```

---

#### 9. Cloudflare Workers AI ☁️

10,000 neurons/day free.

```
LLM_API_KEY=xxxxxx
LLM_MODEL=cloudflare/@cf/meta/llama-3.1-8b-instruct
```

---

#### 10. Puter.js 🟢 NO API KEYS

GPT-4o, Claude, Llama, Gemini — **zero setup**.

```
LLM_API_KEY=puter-free
LLM_MODEL=puter/ai/gpt-4o
```

---

#### 11. Bytez 🆕

70,000+ open-source models with free inference API. Deploy any HuggingFace model in 3 lines.

```
LLM_API_KEY=your-bytez-key                          # from bytez.com
LLM_MODEL=bytez/meta-llama/Llama-3.1-8B-Instruct
```

> 💡 Unique: Bytez lets you run models that aren't available anywhere else for free.

---

#### 12. Mistral La Plateforme 🇫🇷

Free tier: 1 req/sec, 500K tokens/min, 1B tokens/month. Phone verification required.

```
LLM_API_KEY=xxxxxx
LLM_MODEL=mistral/mistral-small-latest
```

---

#### 13. Vercel AI Gateway

$5/month in free credits. Routes to OpenAI, Anthropic, Google, and more.

```
LLM_API_KEY=xxxxxx
LLM_MODEL=vercel/openai/gpt-4o
```

---

#### 14. OpenCode Zen

Curated free models. OpenAI-compatible.

```
LLM_API_KEY=xxxxxx                                  # from opencode.ai
LLM_MODEL=opencode/big-pickle-stealth
```

---

### 🇨🇳 Chinese Free Providers

These providers are based in China and offer generous free tiers. OpenAI-compatible endpoints available.

---

#### 15. Qwen API (Alibaba) 🇨🇳

**1 MILLION free tokens** for new users. Qwen models are world-class.

| Model | Notes |
|-------|-------|
| Qwen2.5 72B | Top-tier reasoning |
| Qwen2.5 Coder | Best Chinese coding model |
| Qwen2.5 VL | Vision-language |
| Qwen3 | Latest generation |

**Setup:** [dashscope.aliyun.com](https://dashscope.aliyun.com)
```
LLM_API_KEY=sk-xxxxxx                               # from Alibaba Cloud
LLM_MODEL=qwen/qwen2.5-72b-instruct
```

> 💡 International users: sign up at [Alibaba Cloud International](https://www.alibabacloud.com/) — same free credits.

---

#### 16. ModelScope (Alibaba) 🇨🇳

**2,000 free API calls.** Access to Qwen, DeepSeek, and hundreds of community models.

| Models Available |
|-----------------|
| Qwen2.5 (all sizes) |
| DeepSeek V3, R1 |
| ChatGLM |
| Baichuan |
| Yi |
| InternLM |

**Setup:** [modelscope.cn](https://modelscope.cn) → Create API Key
```
LLM_API_KEY=xxxxxx                                  # from ModelScope
LLM_MODEL=modelscope/Qwen/Qwen2.5-72B-Instruct
```

> OpenAI-compatible endpoint: `https://api-inference.modelscope.cn/v1`

---

#### 17. Baidu ERNIE Bot 🇨🇳 COMPLETELY FREE

**Since April 2025, ERNIE Bot is 100% free for everyone.** No limits announced.

| Model | Notes |
|-------|-------|
| ERNIE 4.5 | Baidu's flagship |
| ERNIE 4.0 | Previous gen |
| ERNIE 3.5 | Lightweight |

**Setup:** [console.bce.baidu.com](https://console.bce.baidu.com)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=baidu/ernie-4.5
```

---

#### 18. ByteDance Doubao 🇨🇳

Free tier available. Doubao is ByteDance's (TikTok's parent) AI model.

| Models | Notes |
|--------|-------|
| Doubao Pro | Flagship |
| Doubao Lite | Fast, lightweight |
| Doubao Seed | Latest |

**Setup:** [console.volcengine.com](https://console.volcengine.com)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=bytedance/doubao-pro-256k
```

---

#### 19. Zhipu GLM 🇨🇳

Free tier for ChatGLM models. Great for Chinese + English.

| Models | Notes |
|--------|-------|
| GLM-4 | Flagship |
| GLM-4-9B | Open source |
| GLM-4V | Vision |
| CodeGeeX4 | Coding |

**Setup:** [open.bigmodel.cn](https://open.bigmodel.cn)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=zhipu/glm-4
```

---

#### 20. MiniMax 🇨🇳

Free tier available. Known for long-context and speech.

| Models | Notes |
|--------|-------|
| MiniMax M2.5 | Flagship |
| abab6.5 | Long context |

**Setup:** [api.minimax.chat](https://api.minimax.chat)
```
LLM_API_KEY=xxxxxx
LLM_MODEL=minimax/abab6.5-chat
```

---

### 🎁 Providers with Free Trial Credits

These give you **free credits on signup** — enough for weeks/months of use:

| Provider | Free Credits | Sign Up |
|----------|-------------|---------|
| **Fireworks AI** | Free credits | [fireworks.ai](https://fireworks.ai) |
| **Together AI** | $5 free | [api.together.xyz](https://api.together.xyz) |
| **Baseten** | Free credits | [baseten.co](https://baseten.co) |
| **Nebius** | Free credits | [nebius.ai](https://nebius.ai) |
| **Novita AI** | Free credits | [novita.ai](https://novita.ai) |
| **AI21 Labs** | Free credits | [ai21.com](https://ai21.com) |
| **Upstage** | Free credits | [upstage.ai](https://upstage.ai) |
| **NLP Cloud** | Free credits | [nlpcloud.com](https://nlpcloud.com) |
| **Alibaba Cloud Intl** | 1M tokens free | [alibabacloud.com](https://www.alibabacloud.com) |
| **Modal** | Free credits | [modal.com](https://modal.com) |
| **Inference.net** | Free credits | [inference.net](https://inference.net) |
| **Hyperbolic** | Free credits | [hyperbolic.xyz](https://hyperbolic.xyz) |
| **SambaNova** | Free inference | [sambanova.ai](https://sambanova.ai) |
| **Scaleway** | Free credits | [scaleway.com](https://scaleway.com) |

---

### 💡 Best Setups (Ranked)

#### 🏆 #1 Best Free Overall
```
LLM_API_KEY=sk-or-v1-xxxxxx                         # OpenRouter
LLM_MODEL=openrouter/google/gemma-4-31b-it:free     # Latest Google model, FREE
```

#### ⚡ #2 Best Free for Speed
```
LLM_API_KEY=gsk_xxxxxxxx                            # Groq
LLM_MODEL=groq/llama-3.3-70b-versatile             # Sub-second responses
```

#### 📊 #3 Best Free for High Volume
```
LLM_API_KEY=AIzaxxxxxxxx                            # Google AI Studio
LLM_MODEL=google/gemma-3-27b-it                     # 14,400 requests/day!
```

#### 🤯 #4 Best Free Raw Power
```
LLM_API_KEY=sk-or-v1-xxxxxx                         # OpenRouter
LLM_MODEL=openrouter/nousresearch/hermes-3-llama-3.1-405b:free  # 405B params!
```

#### 🇨🇳 #5 Best Free (China-based)
```
LLM_API_KEY=xxxxxx                                  # Baidu ERNIE
LLM_MODEL=baidu/ernie-4.5                           # Completely free since April 2025
```

#### 💰 #6 Best Value (Paid)
```
LLM_API_KEY=sk-or-v1-xxxxxx                         # OpenRouter
LLM_MODEL=openrouter/deepseek/deepseek-v3           # $0.27/1M tokens
```

#### 🏆 #7 Best Quality (Paid)
```
LLM_API_KEY=sk-or-v1-xxxxxx                         # OpenRouter
LLM_MODEL=openrouter/anthropic/claude-sonnet-4-6    # Top quality
```

#### 🔄 Switch Models Anytime
Change `LLM_MODEL` in Render → Environment → Save. Auto-restarts in 30 seconds.

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
