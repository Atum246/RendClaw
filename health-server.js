#!/usr/bin/env node
/**
 * 🎨🦞 RendClaw Health Server
 * Health endpoint + beautiful monitoring dashboard
 * Optimized for Render
 */

const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

// ─── Config ─────────────────────────────────────────────────
const PORT = process.env.HEALTH_PORT || 10000;
const GATEWAY_PORT = process.env.PORT || 10000;
const LLM_MODEL = process.env.LLM_MODEL || 'unknown';
const PLATFORM = process.env.NEOCLAW_PLATFORM || 'render';
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.NEOCLAW_EXTERNAL_URL || '';

// ─── Dashboard HTML ─────────────────────────────────────────
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨🦞 RendClaw Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #0d1117;
            --card: #161b22;
            --border: #30363d;
            --text: #e6edf3;
            --dim: #8b949e;
            --green: #3fb950;
            --red: #f85149;
            --yellow: #d29922;
            --blue: #58a6ff;
            --purple: #bc8cff;
            --cyan: #39d2c0;
            --render: #46e3b7;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 40px 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.2em;
            background: linear-gradient(135deg, var(--render), var(--purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
        }
        .header .subtitle { color: var(--dim); font-size: 0.95em; }
        .header .url {
            margin-top: 12px;
            padding: 8px 16px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            display: inline-block;
            font-family: monospace;
            font-size: 0.9em;
            color: var(--render);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            transition: border-color 0.3s, transform 0.2s;
        }
        .card:hover { border-color: var(--render); transform: translateY(-2px); }
        .card-title {
            font-size: 0.75em;
            color: var(--dim);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 12px;
        }
        .card-value {
            font-size: 1.8em;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .card-detail { color: var(--dim); font-size: 0.85em; }
        .status-ok { color: var(--green); }
        .status-warn { color: var(--yellow); }
        .status-error { color: var(--red); }
        .status-info { color: var(--cyan); }
        .status-bar {
            height: 4px;
            background: var(--border);
            border-radius: 2px;
            margin-top: 12px;
            overflow: hidden;
        }
        .status-bar-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.5s ease;
        }
        .channel-list {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 8px;
        }
        .channel-badge {
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.8em;
            border: 1px solid var(--border);
            transition: all 0.3s;
        }
        .channel-badge.active {
            border-color: var(--green);
            color: var(--green);
            background: rgba(63, 185, 80, 0.1);
        }
        .channel-badge.inactive { color: var(--dim); }
        .tip-box {
            margin-top: 20px;
            padding: 16px 20px;
            background: rgba(70, 227, 183, 0.05);
            border: 1px solid rgba(70, 227, 183, 0.2);
            border-radius: 12px;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }
        .tip-box h3 {
            color: var(--render);
            font-size: 0.85em;
            margin-bottom: 8px;
        }
        .tip-box p { color: var(--dim); font-size: 0.9em; line-height: 1.6; }
        .tip-box code {
            background: var(--card);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
            color: var(--render);
        }
        .footer {
            text-align: center;
            padding: 30px 0;
            color: var(--dim);
            font-size: 0.8em;
        }
        .footer a { color: var(--render); text-decoration: none; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        .render-badge {
            display: inline-block;
            padding: 4px 10px;
            background: rgba(70, 227, 183, 0.15);
            border: 1px solid var(--render);
            border-radius: 6px;
            color: var(--render);
            font-size: 0.75em;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨🦞 RendClaw</h1>
        <div class="subtitle">Always-On AI Assistant — Render Edition</div>
        ${RENDER_URL ? '<div class="url">' + RENDER_URL + '</div>' : ''}
        <div class="render-badge">Hosted on Render ☁️</div>
    </div>

    <div class="grid">
        <div class="card">
            <div class="card-title">Status</div>
            <div class="card-value status-ok pulse" id="status">● Online</div>
            <div class="card-detail" id="uptime">Uptime: calculating...</div>
            <div class="status-bar">
                <div class="status-bar-fill" id="uptime-bar" style="width: 100%; background: var(--green);"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Model</div>
            <div class="card-value status-info" id="model">${LLM_MODEL}</div>
            <div class="card-detail" id="platform">Platform: Render 🎨</div>
        </div>

        <div class="card">
            <div class="card-title">Gateway</div>
            <div class="card-value" id="gateway-status">Checking...</div>
            <div class="card-detail" id="gateway-port">Port: ${GATEWAY_PORT}</div>
        </div>

        <div class="card">
            <div class="card-title">Resources</div>
            <div class="card-value" id="memory">--</div>
            <div class="card-detail" id="cpu">CPU: checking...</div>
            <div class="status-bar">
                <div class="status-bar-fill" id="mem-bar" style="width: 0%; background: var(--blue);"></div>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Channels</div>
            <div class="channel-list" id="channels">
                <span class="channel-badge inactive">Loading...</span>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Backup</div>
            <div class="card-value" id="backup-status">--</div>
            <div class="card-detail" id="backup-detail">Checking...</div>
        </div>
    </div>

    <div class="tip-box">
        <h3>💡 Render Free Tier Tip</h3>
        <p>
            Free Render services spin down after 15 minutes of inactivity.
            Set up <code>UPTIMEROBOT_API_KEY</code> to keep your RendClaw awake 24/7!
            Your health endpoint is at <code>/health</code>.
        </p>
    </div>

    <div class="footer">
        <p>🎨🦞 RendClaw v1.0.0 — <a href="https://github.com/Atum246/RendClaw">GitHub</a></p>
    </div>

    <script>
        function formatUptime(ms) {
            const s = Math.floor(ms / 1000);
            const m = Math.floor(s / 60);
            const h = Math.floor(m / 60);
            const d = Math.floor(h / 24);
            if (d > 0) return d + 'd ' + (h % 24) + 'h ' + (m % 60) + 'm';
            if (h > 0) return h + 'h ' + (m % 60) + 'm';
            if (m > 0) return m + 'm ' + (s % 60) + 's';
            return s + 's';
        }

        async function refresh() {
            try {
                const resp = await fetch('/api/status');
                const data = await resp.json();

                const uptimeMs = Date.now() - data.startTime;
                document.getElementById('uptime').textContent = 'Uptime: ' + formatUptime(uptimeMs);

                const gwEl = document.getElementById('gateway-status');
                if (data.gatewayHealthy) {
                    gwEl.textContent = '✓ Healthy';
                    gwEl.className = 'card-value status-ok';
                } else {
                    gwEl.textContent = '✗ Down';
                    gwEl.className = 'card-value status-error';
                }

                if (data.memory) {
                    const memMB = Math.round(data.memory.rss / 1024 / 1024);
                    document.getElementById('memory').textContent = memMB + ' MB';
                    const pct = Math.min((memMB / 512) * 100, 100); // Render free = 512MB
                    document.getElementById('mem-bar').style.width = pct + '%';
                    document.getElementById('mem-bar').style.background =
                        pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--yellow)' : 'var(--green)';
                }

                if (data.cpuUsage !== undefined) {
                    document.getElementById('cpu').textContent = 'CPU: ' + data.cpuUsage.toFixed(1) + '%';
                }

                if (data.channels) {
                    const chEl = document.getElementById('channels');
                    chEl.innerHTML = data.channels.map(ch =>
                        '<span class="channel-badge ' + (ch.active ? 'active' : 'inactive') + '">' +
                        ch.icon + ' ' + ch.name + '</span>'
                    ).join('');
                }

                if (data.backup) {
                    const bEl = document.getElementById('backup-status');
                    if (data.backup.enabled) {
                        bEl.textContent = '✓ Active';
                        bEl.className = 'card-value status-ok';
                        document.getElementById('backup-detail').textContent =
                            'Last: ' + (data.backup.lastSync || 'never') +
                            ' | ' + (data.backup.backend || 'unknown');
                    } else {
                        bEl.textContent = '○ Disabled';
                        bEl.className = 'card-value';
                        document.getElementById('backup-detail').textContent = 'Set GITHUB_GIST_TOKEN';
                    }
                }
            } catch (e) {
                console.error('Status fetch failed:', e);
            }
        }

        refresh();
        setInterval(refresh, 10000);
    </script>
</body>
</html>`;

// ─── Helpers ────────────────────────────────────────────────
function getMemoryUsage() { return process.memoryUsage(); }

function getCpuUsage() {
    try {
        const load = execSync("cat /proc/loadavg 2>/dev/null || echo '0 0 0'").toString().trim();
        return parseFloat(load.split(' ')[0]) * 100 / (require('os').cpus().length || 1);
    } catch { return 0; }
}

function checkGatewayHealth() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${GATEWAY_PORT}/health`, { timeout: 3000 }, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

function getChannels() {
    const channels = [];
    if (process.env.TELEGRAM_BOT_TOKEN) {
        channels.push({ name: 'Telegram', icon: '📱', active: true });
    } else {
        channels.push({ name: 'Telegram', icon: '📱', active: false });
    }
    if (process.env.WHATSAPP_ENABLED === 'true') {
        channels.push({ name: 'WhatsApp', icon: '📲', active: true });
    } else {
        channels.push({ name: 'WhatsApp', icon: '📲', active: false });
    }
    channels.push({ name: 'Web Chat', icon: '🌐', active: true });
    if (process.env.DISCORD_TOKEN) {
        channels.push({ name: 'Discord', icon: '🎮', active: true });
    }
    if (process.env.SLACK_TOKEN) {
        channels.push({ name: 'Slack', icon: '💼', active: true });
    }
    return channels;
}

function getBackupStatus() {
    try {
        const statePath = '/tmp/rendclaw-sync-state.json';
        if (fs.existsSync(statePath)) {
            const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
            return {
                enabled: true,
                lastSync: state.last_sync ? new Date(state.last_sync * 1000).toISOString() : null,
                syncCount: state.sync_count || 0,
                backend: process.env.GITHUB_GIST_TOKEN ? 'GitHub Gist' :
                         process.env.HF_TOKEN ? 'HuggingFace' :
                         process.env.S3_BACKUP_BUCKET ? 'S3' : 'none'
            };
        }
    } catch {}
    return {
        enabled: !!(process.env.GITHUB_GIST_TOKEN || process.env.HF_TOKEN),
        lastSync: null,
        backend: process.env.GITHUB_GIST_TOKEN ? 'GitHub Gist' :
                 process.env.HF_TOKEN ? 'HuggingFace' : 'not configured'
    };
}

// ─── Server ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (url.pathname === '/health') {
        const gatewayOk = await checkGatewayHealth();
        res.writeHead(gatewayOk ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: gatewayOk ? 'healthy' : 'degraded',
            uptime: Date.now() - startTime,
            model: LLM_MODEL,
            platform: 'render',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    if (url.pathname === '/api/status') {
        const gatewayOk = await checkGatewayHealth();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            startTime,
            gatewayHealthy: gatewayOk,
            memory: getMemoryUsage(),
            cpuUsage: getCpuUsage(),
            model: LLM_MODEL,
            platform: 'render',
            channels: getChannels(),
            backup: getBackupStatus()
        }));
        return;
    }

    if (url.pathname === '/' || url.pathname === '/dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(DASHBOARD_HTML);
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

const startTime = Date.now();
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎨🦞 RendClaw Health Server running on port ${PORT}`);
    console.log(`   Dashboard: http://localhost:${PORT}/`);
    console.log(`   Health:    http://localhost:${PORT}/health`);
});
