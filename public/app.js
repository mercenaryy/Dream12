// ═══════════════════════════════════════════════════════
//  FLOW OS — Frontend App
// ═══════════════════════════════════════════════════════

const API_URL = window.location.origin + "/api";
let sysState = { day: 1 };
let selectedNodeId = null;

// ── UTILITY ────────────────────────────────────────────
const fmt = n => Math.abs(Math.round(n)).toLocaleString('en-IN');
const now = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// ── BOOT SEQUENCE ──────────────────────────────────────
const BOOT_MSGS = [
  'loading system state',
  'connecting to backend node.js server',
  'scanning retail nodes for IPO data',
  'calibrating risk matrix',
  'system ready'
];
let bi = 0;
const bootEl = document.getElementById('boot');
const bmsg = document.getElementById('bmsg');
const bt = setInterval(() => {
  bi++;
  if (bi < BOOT_MSGS.length) {
    bmsg.innerHTML = BOOT_MSGS[bi] + '<span class="cur">_</span>';
  } else {
    clearInterval(bt);
    setTimeout(launch, 500);
  }
}, 550);

async function launch() {
  bootEl.classList.add('gone');
  setTimeout(() => {
    bootEl.style.display = 'none';
    document.getElementById('app').classList.add('on');
    init();
  }, 900);
}

// ── INIT ───────────────────────────────────────────────
async function init() {
  startClock();
  buildTicker();
  await refreshAll();
  
  // Auto-refresh every 5s to show live data
  setInterval(refreshAll, 5000);
}

function startClock() {
  const c = document.getElementById('clock');
  setInterval(() => c.textContent = now(), 1000);
}

async function refreshAll() {
  try {
    await Promise.all([
      fetchUser(),
      fetchNodes(),
      fetchPortfolio(),
      fetchHistory(),
      fetchFeed(),
      fetchAnalytics(),
      fetchStatus()
    ]);
  } catch (err) {
    console.error("Failed to fetch from backend:", err);
    document.getElementById('sys-lbl').innerHTML = '<span style="color:var(--red)">BACKEND DISCONNECTED</span>';
  }
}

// ── FETCH & RENDER ─────────────────────────────────────

async function fetchUser() {
  const res = await fetch(`${API_URL}/user`);
  const user = await res.json();
  
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-tier').textContent = user.tier;
  document.getElementById('user-since').textContent = user.since;
  document.getElementById('user-earned').textContent = '₹' + fmt(user.totalEarned);
  
  flashSet('h-total', fmt(user.totalPortfolio));
  flashSet('h-idle', '₹' + fmt(user.balance));
  flashSet('h-deployed', '₹' + fmt(user.deployed));
  flashSet('h-yield', '₹' + fmt(user.totalEarned));
  
  document.getElementById('h-dep-sub').textContent = `${user.activeCount} active positions`;
}

async function fetchNodes() {
  const res = await fetch(`${API_URL}/nodes`);
  const nodes = await res.json();
  
  const grid = document.getElementById('nodes-grid');
  let html = '';
  
  nodes.forEach(n => {
    const isFull = n.currentFill >= 99;
    html += `
      <div class="node-card ${n.userHasPosition ? 'has-pos' : ''}" onclick="openNodeModal('${n.id}')">
        <div class="glow-strip"></div>
        <div class="node-head">
          <div>
            <div class="node-cat">${n.cat}</div>
            <div class="node-name">${n.name}</div>
          </div>
          <div class="node-risk r${n.risk}">${n.risk === 'L' ? 'LOW' : n.risk === 'M' ? 'MED' : 'HIGH'}</div>
        </div>
        <div class="node-fill-track">
          <div class="node-fill-bar" style="width:${n.currentFill}%; background:${isFull ? 'var(--red)' : 'var(--blue)'}"></div>
        </div>
        <div class="node-metrics">
          <div class="nm"><div class="nm-l">GMP</div><div class="nm-v" style="color:var(--teal)">₹${n.gmp}</div></div>
          <div class="nm"><div class="nm-l">SUBS</div><div class="nm-v">${n.subscriptionRate}x</div></div>
          <div class="nm"><div class="nm-l">YIELD</div><div class="nm-v">${(n.yield * 100).toFixed(1)}%</div></div>
        </div>
        ${n.userHasPosition ? `<div class="node-alloc">INVESTED</div>` : ''}
      </div>
    `;
  });
  
  grid.innerHTML = html;
  document.getElementById('sys-lbl').innerHTML = `LIVE · ${nodes.length} NODES`;
}

async function fetchPortfolio() {
  const res = await fetch(`${API_URL}/portfolio`);
  const data = await res.json();
  
  const list = document.getElementById('investments-list');
  document.getElementById('inv-badge').textContent = `${data.investments.length} positions`;
  
  if (data.investments.length === 0) {
    list.innerHTML = '<div class="hist-empty">No active investments. Click a node to invest.</div>';
    document.getElementById('redeploy').classList.remove('show');
    return;
  }
  
  let html = '';
  let readyToCollect = 0;
  
  data.investments.forEach(inv => {
    if (inv.status === 'matured') readyToCollect += (inv.amount + inv.yieldEarned);
    
    html += `
      <div class="inv-card">
        <div class="inv-left" style="flex:1; padding-right:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="inv-name">${inv.nodeName}</div>
            <div class="inv-sub">${inv.status === 'matured' ? '<span style="color:var(--gold)">MATURED</span>' : `Day ${inv.dayProgress} / ${inv.cycleDays}`}</div>
          </div>
          <div class="inv-prog-wrap">
            <div class="inv-prog-track">
              <div class="inv-prog-bar" style="width:${inv.progressPct}%; background:${inv.status==='matured' ? 'var(--gold)' : 'var(--blue)'}"></div>
            </div>
          </div>
        </div>
        <div class="inv-right" style="width:80px; flex-shrink:0;">
          <div class="inv-amt">₹${fmt(inv.amount)}</div>
          <div class="inv-yield">+₹${fmt(inv.yieldEarned)}</div>
        </div>
      </div>
    `;
  });
  
  list.innerHTML = html;
  
  if (readyToCollect > 0) {
    document.getElementById('redeploy-amt').textContent = '₹' + fmt(readyToCollect);
    document.getElementById('redeploy').classList.add('show');
  } else {
    document.getElementById('redeploy').classList.remove('show');
  }
}

async function fetchHistory() {
  const res = await fetch(`${API_URL}/history`);
  const history = await res.json();
  
  const tbl = document.getElementById('history-table');
  document.getElementById('hist-count').textContent = history.length + ' cycles';
  
  if (!history.length) {
    tbl.innerHTML = '<div class="hist-empty">No completed cycles yet.</div>';
    return;
  }
  
  tbl.innerHTML = history.map(h => `
    <div class="hist-row">
      <div>
        <div class="hist-cycle">Cycle #${h.cycle} — ${h.nodeName}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--txt3)">Day ${h.day} · ${h.completedAt}</div>
      </div>
      <div style="text-align:right">
        <div class="hist-return">+₹${fmt(h.yieldEarned)}</div>
        <div class="hist-pct">+${h.pct}%</div>
      </div>
    </div>
  `).join('');
}

async function fetchFeed() {
  const res = await fetch(`${API_URL}/feed`);
  const feed = await res.json();
  
  const list = document.getElementById('feed-list');
  list.innerHTML = feed.map(f => {
    let colorClass = '';
    if (f.type === 'deposit' || f.type === 'return') colorClass = 'style="color:var(--teal)"';
    if (f.type === 'invest') colorClass = 'style="color:var(--blue)"';
    if (f.type === 'matured') colorClass = 'style="color:var(--gold)"';
    
    return `
      <div class="feed-item">
        <div class="fi-time">${f.time}</div>
        <div class="fi-msg" ${colorClass}>${f.message}</div>
      </div>
    `;
  }).join('');
}

async function fetchAnalytics() {
  const res = await fetch(`${API_URL}/analytics`);
  const data = await res.json();
  
  document.getElementById('ps-risk').textContent = data.riskScore;
  document.getElementById('ps-risk').className = 'pstat-val ' + (data.riskScore === 'Low' ? 'green' : data.riskScore === 'High' ? 'red' : 'amber');
  document.getElementById('ps-yield').textContent = data.avgNodeYield;
  document.getElementById('ps-active').textContent = data.activeNodes;
  document.getElementById('ps-eff').textContent = data.capitalEfficiency;
  
  document.getElementById('util-bar').style.width = data.utilization + '%';
  document.getElementById('util-pct').textContent = data.utilization + '%';
  document.getElementById('h-yield-sub').textContent = '+' + data.growthPct + '%';
  
  document.getElementById('cs-cycles').textContent = data.cycleCount;
  document.getElementById('cs-avg').textContent = data.avgNodeYield;
  document.getElementById('cs-growth').textContent = '₹' + fmt(data.totalEarned);
  
  const arcPct = Math.min(100, parseFloat(data.growthPct) * 5);
  const arcPath = document.getElementById('arc-path');
  if (arcPath) arcPath.style.strokeDashoffset = 117 - (117 * arcPct / 100);
  document.getElementById('arc-val').textContent = data.growthPct + '%';
}

async function fetchStatus() {
  const res = await fetch(`${API_URL}/status`);
  const status = await res.json();
  sysState.day = status.day;
  document.getElementById('h-day').textContent = status.day;
  document.getElementById('node-badge').textContent = `${status.totalNodes} nodes · ${status.nodesOpen} open`;
}

// ── ACTIONS ────────────────────────────────────────────

async function depositCapital() {
  const inp = document.getElementById('deposit-input');
  const amount = parseInt(inp.value);
  if (!amount || amount < 500) { toast('Minimum deposit is ₹500', 'var(--red)'); return; }
  
  const res = await fetch(`${API_URL}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  
  if (res.ok) {
    inp.value = '';
    toast(`₹${fmt(amount)} deposited successfully`, 'var(--teal)');
    refreshAll();
  }
}

async function advanceDay() {
  document.querySelector('.hero-card-glow').classList.add('flash');
  setTimeout(() => document.querySelector('.hero-card-glow').classList.remove('flash'), 500);
  
  const res = await fetch(`${API_URL}/cycle/advance`, { method: 'POST' });
  const data = await res.json();
  
  toast(data.message, data.maturedCount > 0 ? 'var(--gold)' : 'var(--blue)');
  refreshAll();
}

async function collectAll() {
  const res = await fetch(`${API_URL}/collect-all`, { method: 'POST' });
  if (res.ok) {
    const data = await res.json();
    toast(`Collected ₹${fmt(data.totalReturned)} (Yield: ₹${fmt(data.totalYield)})`, 'var(--teal)');
    document.getElementById('redeploy').classList.remove('show');
    refreshAll();
  }
}

// ── MODAL & INVESTING ──────────────────────────────────

async function openNodeModal(nodeId) {
  selectedNodeId = nodeId;
  const res = await fetch(`${API_URL}/nodes/${nodeId}`);
  const node = await res.json();
  
  const content = document.getElementById('modal-content');
  const isFull = node.currentFill >= 99;
  
  content.innerHTML = `
    <div class="md-header">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <div class="md-cat">${node.cat}</div>
          <div class="md-title">${node.name}</div>
          <div class="ipo-badge">IPO ALLOCATION OPEN</div>
        </div>
        <div class="node-risk r${node.risk}" style="font-size:12px; padding:6px 12px;">RISK: ${node.risk === 'L' ? 'LOW' : node.risk === 'M' ? 'MEDIUM' : 'HIGH'}</div>
      </div>
      <div class="md-desc" style="margin-top:16px;">${node.description}</div>
    </div>
    
    <div class="md-body">
      <div>
        <div class="md-sub">
          <span class="md-sub-lbl">Subscription Status</span>
          <span class="md-sub-val">${node.subscriptionRate}x Subscribed</span>
        </div>
        <div class="md-sub-track">
          <div class="md-sub-bar" style="width:${Math.min(100, node.currentFill)}%; background:${isFull ? 'var(--red)' : 'linear-gradient(90deg, var(--teal2), var(--teal))'}"></div>
        </div>
        
        <div class="md-metrics">
          <div class="md-metric">
            <div class="md-ml">Current GMP</div>
            <div class="md-mv" style="color:var(--gold)">₹${node.gmp}</div>
          </div>
          <div class="md-metric">
            <div class="md-ml">Cycle Duration</div>
            <div class="md-mv">${node.cycleDays} Days</div>
          </div>
          <div class="md-metric">
            <div class="md-ml">Est. Yield</div>
            <div class="md-mv" style="color:var(--teal)">${(node.yield * 100).toFixed(1)}%</div>
          </div>
          <div class="md-metric">
            <div class="md-ml">Total Subs</div>
            <div class="md-mv">${node.totalSubscribers}</div>
          </div>
        </div>
        
        <div class="md-box">
          <div class="md-box-title">Issue Details</div>
          <div class="md-row"><span>Lot Size</span><span>₹${fmt(node.lotSize)}</span></div>
          <div class="md-row"><span>Min Investment</span><span>₹${fmt(node.minInvestment)}</span></div>
          <div class="md-row"><span>Max Investment</span><span>₹${fmt(node.maxInvestment)}</span></div>
          <div class="md-row"><span>Sector</span><span>${node.sector}</span></div>
        </div>
        
        <div class="md-box">
          <div class="md-box-title">Sector Outlook</div>
          <div class="md-desc" style="font-size:11px; max-width:100%;">${node.sectorOutlook}</div>
        </div>
      </div>
      
      <div>
        <div class="invest-panel">
          <div class="ip-bal">Available: ₹${fmt(node.availableBalance)}</div>
          <div class="ip-input-wrap">
            <span class="ip-curr">₹</span>
            <input type="number" id="invest-amount" class="ip-input" placeholder="${fmt(node.lotSize)}" value="${node.lotSize}" step="${node.lotSize}" min="${node.minInvestment}" max="${node.maxInvestment}" oninput="updateEstimate(${node.yield})">
          </div>
          <button class="ip-btn" id="invest-btn" onclick="submitInvest()" ${isFull || node.availableBalance < node.minInvestment ? 'disabled' : ''}>
            ${isFull ? 'ISSUE CLOSED' : 'INVEST NOW'}
          </button>
          
          <div class="ip-est">
            <span class="ip-est-lbl">Est. Returns (${node.cycleDays} days)</span>
            <span class="ip-est-val" id="est-returns">₹${fmt(node.lotSize * (1 + node.yield))}</span>
          </div>
        </div>
        
        ${node.userHasPosition ? `
          <div style="margin-top:16px; padding:12px; background:var(--gold-dim); border:1px solid rgba(245,166,35,0.2); border-radius:var(--r); font-family:'DM Mono',monospace; font-size:10px; color:var(--gold); text-align:center;">
            You have ₹${fmt(node.userInvested)} actively invested in this node.
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.getElementById('modal-overlay').classList.add('show');
}

function closeNodeModal() {
  document.getElementById('modal-overlay').classList.remove('show');
  selectedNodeId = null;
}

function closeModal(e) {
  if (e.target.id === 'modal-overlay') closeNodeModal();
}

function updateEstimate(yieldRate) {
  const amt = parseInt(document.getElementById('invest-amount').value) || 0;
  document.getElementById('est-returns').textContent = '₹' + fmt(amt * (1 + yieldRate));
}

async function submitInvest() {
  const amount = parseInt(document.getElementById('invest-amount').value);
  const btn = document.getElementById('invest-btn');
  
  btn.disabled = true;
  btn.textContent = 'PROCESSING...';
  
  const res = await fetch(`${API_URL}/invest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeId: selectedNodeId, amount })
  });
  
  const data = await res.json();
  
  if (res.ok) {
    toast(`Successfully invested ₹${fmt(amount)}`, 'var(--teal)');
    closeNodeModal();
    refreshAll();
  } else {
    toast(data.error, 'var(--red)');
    btn.disabled = false;
    btn.textContent = 'INVEST NOW';
  }
}

// ── UTILS ──────────────────────────────────────────────

function flashSet(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.textContent !== val) {
    el.textContent = val;
    el.classList.remove('flash-gold');
    void el.offsetWidth;
    el.classList.add('flash-gold');
    setTimeout(() => el.classList.remove('flash-gold'), 700);
  }
}

let toastTimer = null;
function toast(msg, color = 'var(--teal)') {
  const t = document.getElementById('toast');
  const p = document.getElementById('toast-pip');
  const m = document.getElementById('toast-msg');
  p.style.background = color;
  m.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

function buildTicker() {
  const items = [
    {lbl:'FMCG NODE',val:'+4.8%',dir:'up'},{lbl:'DAIRY NODE',val:'+3.9%',dir:'up'},
    {lbl:'PHARMA NODE',val:'+4.2%',dir:'up'},{lbl:'LOGISTICS',val:'+8.9%',dir:'up'},
    {lbl:'ELECTRONICS',val:'+6.3%',dir:'up'},{lbl:'AGRI NODE',val:'+4.4%',dir:'up'},
    {lbl:'AVG CYCLE',val:'5.1 days',dir:'nt'},{lbl:'SYSTEM UPTIME',val:'100%',dir:'up'},
    {lbl:'RISK SCORE',val:'Low',dir:'nt'},{lbl:'APPAREL NODE',val:'+7.1%',dir:'up'}
  ];
  const el = document.getElementById('ticker');
  const html = items.map(it => `<div class="tick-item t${it.dir}"><span>${it.lbl}</span><span class="tick-sep">·</span><span class="tv">${it.val}</span></div>`).join('');
  el.innerHTML = html + html;
}