# ============================================================
# 🎨🦞 RendClaw Dockerfile
# Optimized for Render deployment
# ============================================================

FROM node:22-slim

ARG OPENCLAW_VERSION=latest

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    curl \
    git \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install OpenClaw
RUN npm install -g openclaw@${OPENCLAW_VERSION} 2>/dev/null || \
    npm install -g openclaw@latest

# Install Python dependencies
RUN pip3 install --no-cache-dir huggingface_hub requests --break-system-packages 2>/dev/null || \
    pip3 install --no-cache-dir huggingface_hub requests

# Create directory structure
RUN mkdir -p /root/.openclaw/workspace /app

WORKDIR /app

# Copy RendClaw files
COPY start.sh /app/start.sh
COPY workspace-sync.py /app/workspace-sync.py
COPY health-server.js /app/health-server.js
COPY keepalive.js /app/keepalive.js
COPY banner.txt /app/banner.txt

# Make scripts executable
RUN chmod +x /app/start.sh

# Environment defaults
ENV RENDCLAW_VERSION=1.0.0
ENV HEALTH_PORT=10000
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Render uses PORT env var
# OpenClaw gateway will use PORT (default 10000 on Render)
# Health dashboard on HEALTH_PORT

EXPOSE 10000

# ─── Startup ────────────────────────────────────────────────
# Run all services properly: restore first, then start everything in parallel.
# Use exec for the gateway so it becomes PID 1 and receives signals correctly.
CMD ["/bin/bash", "-c", "\
    cat /app/banner.txt && \
    bash /app/start.sh && \
    node /app/health-server.js & \
    python3 /app/workspace-sync.py --daemon & \
    node /app/keepalive.js & \
    PORT=7860 exec openclaw gateway run \
"]
