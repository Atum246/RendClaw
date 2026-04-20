#!/usr/bin/env node
/**
 * 🎨🦞 RendClaw Health Server
 * Clean modern dashboard + reverse proxy to OpenClaw gateway
 * Optimized for Render
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const net = require('net');

const PORT = process.env.PORT || 10000;
const GATEWAY_HOST = '127.0.0.1';
const GATEWAY_PORT = 7860; // OpenClaw gateway runs on internal port
const LLM_MODEL = process.env.LLM_MODEL || 'Not Set';
const PLATFORM = process.env.NEOCLAW_PLATFORM || 'render';
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.NEOCLAW_EXTERNAL_URL || '';
const WHATSAPP_ENABLED = /^true$/i.test(process.env.WHATSAPP_ENABLED || '');
const HF_BACKUP_ENABLED = !!(process.env.HF_USERNAME && process.env.HF_TOKEN);
const startTime = Date.now();

// Render green accent
const ACCENT = '#46e3b7';
const ACCENT2 = '#2dd4a8';

function getMemoryUsage() { return process.memoryUsage(); }
function getCpuUsage() {
  try {
    const load = require('child_process').execSync("cat /proc/loadavg 2>/dev/null || echo '0 0 0'").toString().trim();
    return parseFloat(load.split(' ')[0]) * 100 / (require('os').cpus().length || 1);
  } catch { return 0; }
}

function checkGatewayHealth() {
  return new Promise(r => {
    const req = http.get(`http://${GATEWAY_HOST}:${GATEWAY_PORT}/health`, { timeout: 3000 }, res => { res.resume(); r(res.statusCode === 200); });
    req.on('error', () => r(false));
    req.on('timeout', () => { req.destroy(); r(false); });
  });
}

function readSyncStatus() {
  try {
    if (fs.existsSync('/tmp/rendclaw-sync-state.json')) {
      const s = JSON.parse(fs.readFileSync('/tmp/rendclaw-sync-state.json', 'utf-8'));
      return { status: s.last_sync ? 'success' : 'configured', timestamp: s.last_sync ? new Date(s.last_sync * 1000).toLocaleString() : null, message: s.sync_count ? s.sync_count + ' syncs completed' : 'Waiting for first sync...' };
    }
  } catch {}
  return { status: 'unknown', timestamp: null, message: 'Configure backup credentials to enable sync' };
}

// ─── UptimeRobot Setup ──────────────────────────────────────
async function handleUptimeRobotSetup(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const { apiKey } = JSON.parse(body);
      if (!apiKey) { res.writeHead(400); res.end(JSON.stringify({ error: 'API key required' })); return; }
      const extUrl = RENDER_URL ? (RENDER_URL.startsWith('http') ? RENDER_URL : `https://${RENDER_URL}`) : (process.env.NEOCLAW_EXTERNAL_URL || '');
      if (!extUrl) { res.writeHead(400); res.end(JSON.stringify({ error: 'Could not determine service URL' })); return; }

      const existing = await utrRequest(apiKey, 'getMonitors', {});
      const found = (existing.monitors || []).find(m => m.url && m.url.includes(extUrl));
      if (found) { res.writeHead(200); res.end(JSON.stringify({ success: true, message: 'Monitor already exists! (ID: ' + found.id + ')' })); return; }

      const result = await utrRequest(apiKey, 'newMonitor', { friendlyName: 'RendClaw Health', url: extUrl + '/health', type: 1, interval: 300 });
      if (result.monitor) { res.writeHead(200); res.end(JSON.stringify({ success: true, message: 'Monitor created! (ID: ' + result.monitor.id + ') ✅' })); }
      else { res.writeHead(500); res.end(JSON.stringify({ error: 'Failed to create monitor. Check your API key.' })); }
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
  });
}

function utrRequest(apiKey, action, params) {
  return new Promise((resolve, reject) => {
    const post = new URLSearchParams({ api_key: apiKey, format: 'json', ...params }).toString();
    const req = https.request({ hostname: 'api.uptimerobot.com', path: '/v2/', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(post) } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { reject(new Error('Invalid response')); } });
    });
    req.on('error', reject); req.write(post); req.end();
  });
}

// ─── Dashboard ──────────────────────────────────────────────
function renderDashboard() {
  const telegram = !!process.env.TELEGRAM_BOT_TOKEN;
  const whatsapp = WHATSAPP_ENABLED;
  const discord = !!process.env.DISCORD_TOKEN;
  const syncData = readSyncStatus();

  function badge(active, configured, activeLabel, configLabel) {
    if (active) return '<span class="badge badge-green"><span class="dot dot-green"></span>' + activeLabel + '</span>';
    if (configured) return '<span class="badge badge-teal">' + configLabel + '</span>';
    return '<span class="badge badge-gray">Disabled</span>';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RendClaw Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  background:linear-gradient(180deg,#f0fdf4 0%,#f8fcfd 50%,#f0f4f8 100%);
  color:#1e293b;min-height:100vh;padding:32px 16px;
  display:flex;justify-content:center;align-items:flex-start;
}
.wrapper{width:100%;max-width:960px}

.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#46e3b7,#2dd4a8);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:700}
.logo-text{font-size:20px;font-weight:700;color:#1e293b}
.logo-text span{color:#2dd4a8}
.header-right{display:flex;align-items:center;gap:12px}
.header-link{font-size:13px;color:#64748b;text-decoration:none;display:flex;align-items:center;gap:4px;transition:color .2s}
.header-link:hover{color:#2dd4a8}

.card{
  background:#fff;border-radius:20px;
  box-shadow:0 8px 32px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.03);
  padding:32px;margin-bottom:20px;
  border:1px solid rgba(0,0,0,.04);
  animation:fadeUp .5s ease-out both;
}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.card:nth-child(2){animation-delay:.1s}
.card:nth-child(3){animation-delay:.2s}
.card:nth-child(4){animation-delay:.3s}

.card-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:20px}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:4px}
.stat{text-align:center;padding:20px 12px;background:#f8fafc;border-radius:14px;border:1px solid #f1f5f9;transition:all .2s}
.stat:hover{border-color:#46e3b7;box-shadow:0 4px 12px rgba(70,227,183,.08)}
.stat-icon{font-size:24px;margin-bottom:8px}
.stat-val{font-size:20px;font-weight:700;color:#1e293b}
.stat-lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

.channels{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.ch-item{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9;transition:all .2s}
.ch-item:hover{border-color:#cbd5e1}
.ch-left{display:flex;align-items:center;gap:10px}
.ch-icon{font-size:20px}
.ch-name{font-size:14px;font-weight:500;color:#334155}

.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600}
.badge-green{background:rgba(16,185,129,.1);color:#059669}
.badge-teal{background:rgba(70,227,183,.1);color:#0d9488}
.badge-gray{background:rgba(148,163,184,.1);color:#94a3b8}
.dot{width:6px;height:6px;border-radius:50%}
.dot-green{background:#10b981}

.sync-row{display:flex;align-items:center;justify-content:space-between;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9}
.sync-left{display:flex;flex-direction:column;gap:2px}
.sync-label{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
.sync-value{font-size:14px;font-weight:500;color:#334155}

.render-note{display:flex;align-items:center;gap:8px;padding:14px 16px;background:rgba(245,158,11,.06);border-radius:12px;border:1px solid rgba(245,158,11,.12);margin-bottom:20px}
.render-note-text{font-size:13px;color:#92400e;font-weight:500}

.urt-desc{font-size:13px;color:#64748b;line-height:1.6;margin-bottom:16px}
.urt-desc strong{color:#1e293b}
.urt-input-row{display:flex;gap:10px;flex-wrap:wrap}
.urt-input{
  flex:1;min-width:200px;height:44px;padding:0 16px;
  border:1px solid #e2e8f0;border-radius:8px;
  font-family:inherit;font-size:14px;color:#334155;
  background:#fff;outline:none;transition:all .2s;
}
.urt-input:focus{border-color:#46e3b7;box-shadow:0 0 0 3px rgba(70,227,183,.12)}
.urt-input::placeholder{color:#94a3b8}
.urt-btn{
  height:44px;padding:0 24px;border:none;border-radius:8px;
  background:#1e293b;color:#fff;font-family:inherit;
  font-size:14px;font-weight:600;cursor:pointer;
  transition:all .2s;white-space:nowrap;
}
.urt-btn:hover{background:#334155}
.urt-btn:disabled{opacity:.5;cursor:wait}
.urt-note{font-size:12px;color:#94a3b8;margin-top:10px}
.urt-result{margin-top:12px;padding:12px 16px;border-radius:8px;font-size:13px;font-weight:500;display:none}
.urt-result.ok{display:block;background:rgba(16,185,129,.08);color:#059669;border:1px solid rgba(16,185,129,.15)}
.urt-result.err{display:block;background:rgba(239,68,68,.08);color:#dc2626;border:1px solid rgba(239,68,68,.15)}
.urt-success{display:flex;align-items:center;gap:8px;padding:14px 16px;background:rgba(16,185,129,.06);border-radius:12px;border:1px solid rgba(16,185,129,.12)}
.urt-success-text{font-size:13px;color:#059669;font-weight:500}
.urt-success strong{color:#047857}

.btn-primary{
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;height:48px;border:none;border-radius:8px;
  background:#1e293b;color:#fff;font-family:inherit;
  font-size:15px;font-weight:600;cursor:pointer;
  transition:all .2s;margin-top:8px;text-decoration:none;
}
.btn-primary:hover{background:#334155;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.15)}

.divider{border:none;border-top:1px solid #f1f5f9;margin:20px 0}

.footer{text-align:center;padding:20px 0;font-size:12px;color:#94a3b8}
.footer a{color:#2dd4a8;text-decoration:none}
.footer a:hover{text-decoration:underline}

.hidden{display:none!important}

.res-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.res-row:last-child{margin-bottom:0}
.res-label{font-size:12px;color:#94a3b8;width:60px;flex-shrink:0}
.res-bar{flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.res-fill{height:100%;border-radius:3px;transition:width .5s ease,background .5s ease}
.res-val{font-size:12px;font-weight:600;color:#334155;width:50px;text-align:right;flex-shrink:0}

@media(max-width:700px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .channels{grid-template-columns:1fr}
  .card{padding:24px}
  .urt-input-row{flex-direction:column}
  .urt-btn{width:100%}
}
</style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <div class="logo">
      <div class="logo-icon">🎨</div>
      <div class="logo-text">Rend<span>Claw</span></div>
    </div>
    <div class="header-right">
      <a href="https://github.com/Atum246/RendClaw" class="header-link" target="_blank">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
      <span class="badge badge-green"><span class="dot dot-green"></span>Online</span>
    </div>
  </div>

  <!-- Render spin-down warning -->
  <div class="render-note">
    <span style="font-size:18px">⚠️</span>
    <span class="render-note-text">Render free tier spins down after 15 min of inactivity. Set up UptimeRobot below to stay awake 24/7!</span>
  </div>

  <div class="card">
    <div class="card-title">Overview</div>
    <div class="stats">
      <div class="stat">
        <div class="stat-icon">🤖</div>
        <div class="stat-val" id="model-val" style="font-size:15px">${LLM_MODEL}</div>
        <div class="stat-lbl">Model</div>
      </div>
      <div class="stat">
        <div class="stat-icon">⏱️</div>
        <div class="stat-val" id="uptime-val">--</div>
        <div class="stat-lbl">Uptime</div>
      </div>
      <div class="stat">
        <div class="stat-icon">🧠</div>
        <div class="stat-val" id="mem-val">--</div>
        <div class="stat-lbl">Memory</div>
      </div>
      <div class="stat">
        <div class="stat-icon">⚡</div>
        <div class="stat-val" id="cpu-val">--</div>
        <div class="stat-lbl">CPU</div>
      </div>
    </div>
    <hr class="divider">
    <div class="res-row">
      <span class="res-label">Memory</span>
      <div class="res-bar"><div class="res-fill" id="mem-bar" style="background:#10b981"></div></div>
      <span class="res-val" id="mem-pct">0%</span>
    </div>
    <div class="res-row">
      <span class="res-label">CPU</span>
      <div class="res-bar"><div class="res-fill" id="cpu-bar" style="background:#10b981"></div></div>
      <span class="res-val" id="cpu-pct">0%</span>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Channels</div>
    <div class="channels">
      <div class="ch-item">
        <div class="ch-left"><span class="ch-icon">📱</span><span class="ch-name">Telegram</span></div>
        <span id="ch-tg">${badge(telegram, telegram, 'Active', 'Configured')}</span>
      </div>
      <div class="ch-item">
        <div class="ch-left"><span class="ch-icon">📲</span><span class="ch-name">WhatsApp</span></div>
        <span id="ch-wa">${badge(whatsapp, whatsapp, 'Active', 'Ready to pair')}</span>
      </div>
      <div class="ch-item">
        <div class="ch-left"><span class="ch-icon">🎮</span><span class="ch-name">Discord</span></div>
        <span id="ch-dc">${badge(discord, discord, 'Active', 'Configured')}</span>
      </div>
      <div class="ch-item">
        <div class="ch-left"><span class="ch-icon">💬</span><span class="ch-name">Web Chat</span></div>
        <span class="badge badge-green"><span class="dot dot-green"></span>Active</span>
      </div>
    </div>
    <a href="/app/" class="btn-primary">💬 Open Control UI</a>
  </div>

  <div class="card">
    <div class="card-title">Workspace Sync</div>
    <div class="sync-row">
      <div class="sync-left">
        <span class="sync-label">Status</span>
        <span class="sync-value" id="sync-status">${syncData.status === 'success' || syncData.status === 'configured' ? '● ' + syncData.status.toUpperCase() : '○ ' + syncData.status.toUpperCase()}</span>
      </div>
      <div style="text-align:right">
        <span class="sync-label">Last Sync</span>
        <span class="sync-value" id="sync-time">${syncData.timestamp || 'Never'}</span>
      </div>
    </div>
    <div class="urt-note" style="margin-top:12px" id="sync-msg">${syncData.message}</div>
  </div>

  <div class="card">
    <div class="card-title">Keep Service Awake</div>
    <div id="urt-configured" class="${process.env.UPTIMEROBOT_API_KEY ? '' : 'hidden'}">
      <div class="urt-success">
        <span style="font-size:20px">✅</span>
        <span class="urt-success-text"><strong>UptimeRobot active!</strong> Your service is being monitored externally.</span>
      </div>
    </div>
    <div id="urt-setup" class="${process.env.UPTIMEROBOT_API_KEY ? 'hidden' : ''}">
      <div class="urt-desc">
        Render free tier spins down after 15 minutes. Paste your UptimeRobot <strong>Main API key</strong> below to create an external monitor and keep your service running 24/7.
      </div>
      <div class="urt-input-row">
        <input id="urt-key" class="urt-input" type="password" placeholder="UptimeRobot Main API key" autocomplete="off" />
        <button id="urt-btn" class="urt-btn" type="button">Create Monitor</button>
      </div>
      <div class="urt-note">One-time setup. Key is only used to create the monitor — it's not stored.</div>
      <div id="urt-result" class="urt-result"></div>
    </div>
  </div>

  <div class="footer">
    RendClaw v1.0.0 — live updates every 10s — <a href="https://github.com/Atum246/RendClaw">GitHub</a>
  </div>

</div>

<script>
function fmt(ms){
  const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60),d=Math.floor(h/24);
  if(d>0)return d+'d '+(h%24)+'h '+(m%60)+'m';
  if(h>0)return h+'h '+(m%60)+'m';
  if(m>0)return m+'m '+(s%60)+'s';
  return s+'s';
}
function barColor(pct){return pct>80?'#ef4444':pct>50?'#f59e0b':'#10b981'}

async function refresh(){
  try{
    const r=await fetch('/api/status');
    const d=await r.json();
    const up=Date.now()-d.startTime;
    document.getElementById('uptime-val').textContent=fmt(up);
    document.getElementById('model-val').textContent=d.model;
    if(d.memory){
      const mb=Math.round(d.memory.rss/1024/1024);
      document.getElementById('mem-val').textContent=mb+'MB';
      const pct=Math.min((mb/2048)*100,100);
      document.getElementById('mem-bar').style.width=pct+'%';
      document.getElementById('mem-bar').style.background=barColor(pct);
      document.getElementById('mem-pct').textContent=Math.round(pct)+'%';
    }
    if(d.cpuUsage!==undefined){
      document.getElementById('cpu-val').textContent=d.cpuUsage.toFixed(1)+'%';
      const cp=Math.min(d.cpuUsage,100);
      document.getElementById('cpu-bar').style.width=cp+'%';
      document.getElementById('cpu-bar').style.background=barColor(cp);
      document.getElementById('cpu-pct').textContent=Math.round(cp)+'%';
    }
    if(d.sync){
      document.getElementById('sync-status').textContent=(d.sync.status==='success'||d.sync.status==='configured'?'● ':'○ ')+d.sync.status.toUpperCase();
      document.getElementById('sync-time').textContent=d.sync.timestamp||'Never';
      document.getElementById('sync-msg').textContent=d.sync.message;
    }
  }catch(e){console.error(e)}
}

document.getElementById('urt-btn').addEventListener('click',async function(){
  const key=document.getElementById('urt-key').value.trim();
  const res=document.getElementById('urt-result');
  if(!key){res.className='urt-result err';res.textContent='Please paste your UptimeRobot API key.';return;}
  this.disabled=true;this.textContent='Creating...';
  try{
    const r=await fetch('/api/uptimerobot/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key})});
    const d=await r.json();
    if(d.success){
      res.className='urt-result ok';res.textContent=d.message;
      document.getElementById('urt-key').value='';
      document.getElementById('urt-setup').classList.add('hidden');
      document.getElementById('urt-configured').classList.remove('hidden');
    }else{res.className='urt-result err';res.textContent=d.error||'Failed.';}
  }catch(e){res.className='urt-result err';res.textContent='Error: '+e.message;}
  this.disabled=false;this.textContent='Create Monitor';
});

refresh();setInterval(refresh,10000);
</script>
</body>
</html>`;
}

// ─── Reverse Proxy ──────────────────────────────────────────
function proxyRequest(req, res) {
  const options = {
    hostname: GATEWAY_HOST,
    port: GATEWAY_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${GATEWAY_HOST}:${GATEWAY_PORT}`,
      'x-forwarded-for': req.socket.remoteAddress || '',
      'x-forwarded-proto': 'https'
    }
  };
  const proxy = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Gateway unavailable' }));
  });
  req.pipe(proxy);
}

// ─── Local Route Check ──────────────────────────────────────
function isLocalRoute(pathname) {
  return pathname === '/health' || pathname === '/api/status' ||
    pathname === '/api/uptimerobot/setup' || pathname === '/' ||
    pathname === '/dashboard' || pathname === '/dashboard/';
}

// ─── Server ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Local routes — handled by dashboard
  if (isLocalRoute(url.pathname)) {
    if (url.pathname === '/health') {
      const gw = await checkGatewayHealth();
      res.writeHead(gw ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: gw ? 'healthy' : 'degraded', uptime: Date.now() - startTime, model: LLM_MODEL, timestamp: new Date().toISOString() }));
      return;
    }
    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        startTime, model: LLM_MODEL, platform: PLATFORM,
        memory: getMemoryUsage(), cpuUsage: getCpuUsage(),
        channels: {
          telegram: { configured: !!process.env.TELEGRAM_BOT_TOKEN, connected: !!process.env.TELEGRAM_BOT_TOKEN },
          whatsapp: { configured: WHATSAPP_ENABLED, connected: WHATSAPP_ENABLED },
          discord: { configured: !!process.env.DISCORD_TOKEN, connected: !!process.env.DISCORD_TOKEN }
        },
        sync: readSyncStatus()
      }));
      return;
    }
    if (url.pathname === '/api/uptimerobot/setup') { await handleUptimeRobotSetup(req, res); return; }
    // Dashboard
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderDashboard());
    return;
  }

  // Everything else → proxy to OpenClaw gateway
  proxyRequest(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎨🦞 RendClaw Dashboard running on port ${PORT}`);
  console.log(`   Dashboard: http://localhost:${PORT}/`);
  console.log(`   Health:    http://localhost:${PORT}/health`);
  console.log(`   Gateway:   proxied to localhost:${GATEWAY_PORT}`);
});
