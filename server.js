// ═══════════════════════════════════════════════════════
//  FLOW OS — Backend Server v2
//  Node.js + Express · In-Memory Data Store
// ═══════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const { v4: uuid } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ── HELPER ─────────────────────────────────────────────
const fmt = (n) => Math.abs(Math.round(n)).toLocaleString("en-IN");
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const jitter = (base, range) => clamp(base + Math.round((Math.random() - 0.45) * range), 20, 99);

// ── NODE DEFINITIONS ───────────────────────────────────
const NODES = [
  {
    id: "n1", cat: "FMCG", name: "Mehta Grocery", risk: "L",
    baseDemand: 84, yield: 0.048, cycleDays: 5,
    sector: "Fast-Moving Consumer Goods",
    description: "Working capital financing for a 12-store FMCG retail chain across Tier-2 cities. High inventory turnover ensures rapid capital recycling.",
    lotSize: 500, minInvestment: 500, maxInvestment: 25000,
    gmp: 3.2, subscriptionRate: 2.4,
    sectorOutlook: "Strong demand. FMCG sector showing 8.2% YoY growth in Tier-2 markets.",
    promoterHolding: 72, debtToEquity: 0.3,
    pastCycles: [
      { cycle: 1, yield: 4.6, days: 5 },
      { cycle: 2, yield: 5.0, days: 5 },
      { cycle: 3, yield: 4.8, days: 4 },
      { cycle: 4, yield: 4.9, days: 5 },
    ]
  },
  {
    id: "n2", cat: "PHARMA", name: "HealthFirst Pharma", risk: "L",
    baseDemand: 92, yield: 0.042, cycleDays: 4,
    sector: "Pharmaceuticals & Healthcare",
    description: "Short-term inventory financing for a regional pharma distributor supplying 200+ retail pharmacies. Essential goods — recession-proof demand.",
    lotSize: 500, minInvestment: 500, maxInvestment: 20000,
    gmp: 2.8, subscriptionRate: 3.1,
    sectorOutlook: "Stable. Pharma distribution remains essential with consistent 6.5% growth.",
    promoterHolding: 68, debtToEquity: 0.4,
    pastCycles: [
      { cycle: 1, yield: 4.0, days: 4 },
      { cycle: 2, yield: 4.3, days: 4 },
      { cycle: 3, yield: 4.1, days: 4 },
      { cycle: 4, yield: 4.4, days: 3 },
    ]
  },
  {
    id: "n3", cat: "ELECTRONICS", name: "ZenTech Wholesale", risk: "M",
    baseDemand: 67, yield: 0.063, cycleDays: 6,
    sector: "Consumer Electronics",
    description: "Purchase order financing for a wholesale electronics distributor. Higher margins but seasonal demand patterns create moderate risk.",
    lotSize: 1000, minInvestment: 1000, maxInvestment: 30000,
    gmp: 5.1, subscriptionRate: 1.6,
    sectorOutlook: "Moderate. Electronics demand cyclical — festive season approaching boosts outlook.",
    promoterHolding: 55, debtToEquity: 0.8,
    pastCycles: [
      { cycle: 1, yield: 5.8, days: 6 },
      { cycle: 2, yield: 6.5, days: 7 },
      { cycle: 3, yield: 6.2, days: 6 },
      { cycle: 4, yield: 6.8, days: 6 },
    ]
  },
  {
    id: "n4", cat: "DAIRY", name: "PureMilk Co-op", risk: "L",
    baseDemand: 96, yield: 0.039, cycleDays: 3,
    sector: "Dairy & Agriculture",
    description: "Daily procurement financing for a cooperative dairy processing 15,000 litres/day. Ultra-short cycles with near-zero default history.",
    lotSize: 500, minInvestment: 500, maxInvestment: 15000,
    gmp: 1.9, subscriptionRate: 4.2,
    sectorOutlook: "Very strong. Dairy is essential — 12% volume growth in cooperative sector.",
    promoterHolding: 85, debtToEquity: 0.1,
    pastCycles: [
      { cycle: 1, yield: 3.8, days: 3 },
      { cycle: 2, yield: 4.0, days: 3 },
      { cycle: 3, yield: 3.9, days: 3 },
      { cycle: 4, yield: 3.7, days: 3 },
    ]
  },
  {
    id: "n5", cat: "APPAREL", name: "ThreadCraft Stores", risk: "M",
    baseDemand: 55, yield: 0.071, cycleDays: 7,
    sector: "Apparel & Fashion Retail",
    description: "Seasonal inventory financing for a 6-store apparel chain. Higher yield compensates for fashion risk and longer cycles.",
    lotSize: 1000, minInvestment: 1000, maxInvestment: 35000,
    gmp: 6.3, subscriptionRate: 1.2,
    sectorOutlook: "Cautious. Apparel discretionary — watch for consumer sentiment shifts.",
    promoterHolding: 60, debtToEquity: 0.9,
    pastCycles: [
      { cycle: 1, yield: 6.8, days: 7 },
      { cycle: 2, yield: 7.2, days: 7 },
      { cycle: 3, yield: 7.0, days: 8 },
      { cycle: 4, yield: 7.4, days: 7 },
    ]
  },
  {
    id: "n6", cat: "RESTAURANT", name: "Spice Route Chain", risk: "M",
    baseDemand: 74, yield: 0.058, cycleDays: 5,
    sector: "Food & Hospitality",
    description: "Bulk procurement financing for a QSR chain with 8 outlets. Consistent footfall in metro locations. Moderate risk due to perishable inventory.",
    lotSize: 500, minInvestment: 500, maxInvestment: 20000,
    gmp: 4.5, subscriptionRate: 1.9,
    sectorOutlook: "Positive. QSR segment growing 14% YoY in metro markets.",
    promoterHolding: 58, debtToEquity: 0.6,
    pastCycles: [
      { cycle: 1, yield: 5.5, days: 5 },
      { cycle: 2, yield: 5.9, days: 5 },
      { cycle: 3, yield: 5.7, days: 6 },
      { cycle: 4, yield: 6.0, days: 5 },
    ]
  },
  {
    id: "n7", cat: "LOGISTICS", name: "SwiftHaul Express", risk: "H",
    baseDemand: 62, yield: 0.089, cycleDays: 6,
    sector: "Logistics & Supply Chain",
    description: "Fleet expansion financing for a last-mile delivery startup. High yield reflects growth-stage risk. Strong unit economics emerging.",
    lotSize: 2000, minInvestment: 2000, maxInvestment: 50000,
    gmp: 8.2, subscriptionRate: 0.8,
    sectorOutlook: "High growth, high risk. Logistics sector booming but competitive.",
    promoterHolding: 45, debtToEquity: 1.4,
    pastCycles: [
      { cycle: 1, yield: 8.5, days: 6 },
      { cycle: 2, yield: 9.1, days: 7 },
      { cycle: 3, yield: 8.8, days: 6 },
      { cycle: 4, yield: 9.3, days: 6 },
    ]
  },
  {
    id: "n8", cat: "AGRI", name: "Harvest Inputs", risk: "L",
    baseDemand: 89, yield: 0.044, cycleDays: 4,
    sector: "Agricultural Inputs",
    description: "Seasonal input financing for seeds, fertilizers, and crop protection. Backed by Kharif/Rabi season demand cycles with government support.",
    lotSize: 500, minInvestment: 500, maxInvestment: 20000,
    gmp: 2.5, subscriptionRate: 2.8,
    sectorOutlook: "Stable. Government MSP policy and good monsoon forecast support outlook.",
    promoterHolding: 78, debtToEquity: 0.2,
    pastCycles: [
      { cycle: 1, yield: 4.2, days: 4 },
      { cycle: 2, yield: 4.5, days: 4 },
      { cycle: 3, yield: 4.3, days: 4 },
      { cycle: 4, yield: 4.6, days: 4 },
    ]
  },
];

// ── IN-MEMORY DATA STORE ───────────────────────────────
let store = {
  user: {
    id: uuid(),
    name: "Arjun Mehta",
    avatar: "A",
    tier: "GROWTH INVESTOR",
    since: "Jan 2025",
    balance: 5000,
    totalEarned: 0,
    totalDeposited: 5000,
  },
  nodes: NODES.map((n) => ({
    ...n,
    demand: n.baseDemand,
    currentFill: Math.round(n.baseDemand * 0.6 + Math.random() * 20), // simulated existing fill
    totalSubscribers: Math.floor(Math.random() * 40) + 15,
    status: "open", // open | filling | closed | matured
  })),
  investments: [],    // { id, nodeId, amount, investedAt, maturesAt, day, status: active|matured|collected, yieldEarned }
  cycleHistory: [],   // { id, cycle, nodeId, nodeName, invested, returned, yield, pct, completedAt }
  feed: [],           // { id, time, type, message }
  currentDay: 1,      // simulation day
  cycleCount: 0,
};

// Add initial feed entries
addFeedEntry("system", "Flow OS online. System initialized successfully.");
addFeedEntry("system", "8 retail nodes loaded. Scanning for deployment opportunities.");
addFeedEntry("info", "Market conditions nominal. All nodes accepting capital.");

function addFeedEntry(type, message) {
  store.feed.unshift({
    id: uuid(),
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    type,
    message,
  });
  if (store.feed.length > 50) store.feed = store.feed.slice(0, 50);
}

// ── ROUTES ─────────────────────────────────────────────

// GET /api/user — user profile & balance
app.get("/api/user", (req, res) => {
  const { user, investments } = store;
  const activeInvestments = investments.filter((i) => i.status === "active");
  const maturedInvestments = investments.filter((i) => i.status === "matured");
  const deployed = activeInvestments.reduce((a, i) => a + i.amount, 0);
  const pendingReturns = maturedInvestments.reduce((a, i) => a + i.amount + i.yieldEarned, 0);

  res.json({
    ...user,
    deployed,
    pendingReturns,
    activeCount: activeInvestments.length,
    maturedCount: maturedInvestments.length,
    totalPortfolio: user.balance + deployed + pendingReturns,
  });
});

// GET /api/nodes — all nodes with live data
app.get("/api/nodes", (req, res) => {
  const nodesData = store.nodes.map((n) => {
    const activeInvs = store.investments.filter((i) => i.nodeId === n.id && i.status === "active");
    const userInvested = activeInvs.reduce((a, i) => a + i.amount, 0);
    return {
      id: n.id,
      cat: n.cat,
      name: n.name,
      risk: n.risk,
      demand: n.demand,
      yield: n.yield,
      cycleDays: n.cycleDays,
      currentFill: n.currentFill,
      totalSubscribers: n.totalSubscribers,
      status: n.status,
      gmp: n.gmp,
      subscriptionRate: n.subscriptionRate,
      lotSize: n.lotSize,
      minInvestment: n.minInvestment,
      userInvested,
      userHasPosition: userInvested > 0,
    };
  });
  res.json(nodesData);
});

// GET /api/nodes/:id — full IPO-style detail
app.get("/api/nodes/:id", (req, res) => {
  const node = store.nodes.find((n) => n.id === req.params.id);
  if (!node) return res.status(404).json({ error: "Node not found" });

  const activeInvs = store.investments.filter((i) => i.nodeId === node.id && i.status === "active");
  const userInvested = activeInvs.reduce((a, i) => a + i.amount, 0);
  const allNodeInvs = store.investments.filter((i) => i.nodeId === node.id);
  const completedInvs = allNodeInvs.filter((i) => i.status === "collected");
  const totalReturned = completedInvs.reduce((a, i) => a + i.amount + i.yieldEarned, 0);

  res.json({
    ...node,
    userInvested,
    userHasPosition: userInvested > 0,
    userActiveInvestments: activeInvs,
    totalInvestedAllTime: allNodeInvs.reduce((a, i) => a + i.amount, 0),
    totalReturnedAllTime: totalReturned,
    availableBalance: store.user.balance,
  });
});

// POST /api/deposit — add capital
app.post("/api/deposit", (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 500) {
    return res.status(400).json({ error: "Minimum deposit is ₹500" });
  }
  store.user.balance += amount;
  store.user.totalDeposited += amount;
  addFeedEntry("deposit", `₹${fmt(amount)} deposited. New balance: ₹${fmt(store.user.balance)}.`);
  res.json({ success: true, balance: store.user.balance });
});

// POST /api/invest — invest in a specific node
app.post("/api/invest", (req, res) => {
  const { nodeId, amount } = req.body;
  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node) return res.status(404).json({ error: "Node not found" });
  if (node.status === "closed") return res.status(400).json({ error: "Node is currently closed" });
  if (!amount || amount < node.minInvestment) {
    return res.status(400).json({ error: `Minimum investment is ₹${node.minInvestment}` });
  }
  if (amount > node.maxInvestment) {
    return res.status(400).json({ error: `Maximum investment is ₹${node.maxInvestment}` });
  }
  if (amount % node.lotSize !== 0) {
    return res.status(400).json({ error: `Amount must be in multiples of ₹${node.lotSize} (lot size)` });
  }
  if (amount > store.user.balance) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  // Deduct balance & create investment
  store.user.balance -= amount;
  const yieldAmount = Math.round(amount * node.yield);
  const investment = {
    id: uuid(),
    nodeId: node.id,
    nodeName: node.name,
    nodeCat: node.cat,
    nodeRisk: node.risk,
    amount,
    yieldRate: node.yield,
    yieldEarned: yieldAmount,
    investedAt: new Date().toISOString(),
    investedOnDay: store.currentDay,
    maturesOnDay: store.currentDay + node.cycleDays,
    cycleDays: node.cycleDays,
    status: "active",
    dayProgress: 0,
  };
  store.investments.push(investment);

  // Update node metrics
  node.currentFill = clamp(node.currentFill + Math.round(amount / 200), 0, 99);
  node.totalSubscribers += 1;
  node.subscriptionRate = Math.round((node.subscriptionRate + 0.1) * 10) / 10;

  addFeedEntry("invest", `Deployed ₹${fmt(amount)} → ${node.name} (${node.cat}). Cycle: ${node.cycleDays} days.`);

  res.json({ success: true, investment, balance: store.user.balance });
});

// POST /api/collect/:id — collect returns from a matured investment
app.post("/api/collect/:id", (req, res) => {
  const inv = store.investments.find((i) => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: "Investment not found" });
  if (inv.status !== "matured") return res.status(400).json({ error: "Investment not yet matured" });

  const returned = inv.amount + inv.yieldEarned;
  store.user.balance += returned;
  store.user.totalEarned += inv.yieldEarned;
  inv.status = "collected";

  // Record in cycle history
  store.cycleCount++;
  store.cycleHistory.unshift({
    id: uuid(),
    cycle: store.cycleCount,
    nodeId: inv.nodeId,
    nodeName: inv.nodeName,
    nodeCat: inv.nodeCat,
    invested: inv.amount,
    returned,
    yieldEarned: inv.yieldEarned,
    pct: ((inv.yieldEarned / inv.amount) * 100).toFixed(2),
    completedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    day: store.currentDay,
  });

  addFeedEntry("return", `Return: ₹${fmt(returned)} from ${inv.nodeName} (+${((inv.yieldEarned / inv.amount) * 100).toFixed(1)}%).`);

  res.json({ success: true, returned, yieldEarned: inv.yieldEarned, balance: store.user.balance });
});

// POST /api/collect-all — collect all matured investments
app.post("/api/collect-all", (req, res) => {
  const matured = store.investments.filter((i) => i.status === "matured");
  if (!matured.length) return res.status(400).json({ error: "No matured investments to collect" });

  let totalReturned = 0;
  let totalYield = 0;

  matured.forEach((inv) => {
    const returned = inv.amount + inv.yieldEarned;
    store.user.balance += returned;
    store.user.totalEarned += inv.yieldEarned;
    inv.status = "collected";
    totalReturned += returned;
    totalYield += inv.yieldEarned;

    store.cycleCount++;
    store.cycleHistory.unshift({
      id: uuid(),
      cycle: store.cycleCount,
      nodeId: inv.nodeId,
      nodeName: inv.nodeName,
      nodeCat: inv.nodeCat,
      invested: inv.amount,
      returned,
      yieldEarned: inv.yieldEarned,
      pct: ((inv.yieldEarned / inv.amount) * 100).toFixed(2),
      completedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      day: store.currentDay,
    });
  });

  addFeedEntry("return", `Collected ₹${fmt(totalReturned)} from ${matured.length} matured positions (+₹${fmt(totalYield)} yield).`);

  res.json({ success: true, totalReturned, totalYield, count: matured.length, balance: store.user.balance });
});

// GET /api/portfolio — user's active & matured investments
app.get("/api/portfolio", (req, res) => {
  const investments = store.investments
    .filter((i) => i.status === "active" || i.status === "matured")
    .map((i) => ({
      ...i,
      dayProgress: Math.min(i.cycleDays, store.currentDay - i.investedOnDay),
      progressPct: Math.min(100, Math.round(((store.currentDay - i.investedOnDay) / i.cycleDays) * 100)),
    }));

  const deployed = investments.filter((i) => i.status === "active").reduce((a, i) => a + i.amount, 0);
  const pendingReturns = investments.filter((i) => i.status === "matured").reduce((a, i) => a + i.amount + i.yieldEarned, 0);

  res.json({ investments, deployed, pendingReturns });
});

// GET /api/history — cycle history
app.get("/api/history", (req, res) => {
  res.json(store.cycleHistory.slice(0, 20));
});

// GET /api/feed — system feed
app.get("/api/feed", (req, res) => {
  res.json(store.feed.slice(0, 20));
});

// GET /api/analytics — portfolio analytics
app.get("/api/analytics", (req, res) => {
  const activeInvs = store.investments.filter((i) => i.status === "active");
  const deployed = activeInvs.reduce((a, i) => a + i.amount, 0);
  const total = store.user.balance + deployed;

  const riskMap = { L: 0, M: 1, H: 2 };
  const activeRisks = activeInvs.map((i) => {
    const node = store.nodes.find((n) => n.id === i.nodeId);
    return riskMap[node?.risk || "L"];
  });
  const avgRisk = activeRisks.length ? activeRisks.reduce((a, b) => a + b, 0) / activeRisks.length : 0;
  const riskLabel = avgRisk < 0.5 ? "Low" : avgRisk < 1.2 ? "Medium" : "High";

  const avgYield = (store.nodes.reduce((a, n) => a + n.yield, 0) / store.nodes.length * 100).toFixed(1);
  const efficiency = total > 0 ? ((store.user.totalEarned / total) * 100).toFixed(2) + "%" : "—";
  const utilization = total > 0 ? Math.round((deployed / total) * 100) : 0;

  res.json({
    riskScore: riskLabel,
    avgNodeYield: avgYield + "%",
    activeNodes: activeInvs.length + " / 8",
    capitalEfficiency: efficiency,
    utilization,
    deployed,
    idle: store.user.balance,
    totalPortfolio: total,
    totalEarned: store.user.totalEarned,
    cycleCount: store.cycleCount,
    growthPct: store.user.totalDeposited > 0 ? ((store.user.totalEarned / store.user.totalDeposited) * 100).toFixed(2) : "0.00",
  });
});

// POST /api/cycle/advance — advance 1 day (for demo)
app.post("/api/cycle/advance", (req, res) => {
  store.currentDay++;

  // Fluctuate node demand
  store.nodes.forEach((n) => {
    n.demand = clamp(n.baseDemand + Math.round((Math.random() - 0.45) * 10), 30, 99);
    // Slightly fluctuate GMP
    n.gmp = Math.round((n.gmp + (Math.random() - 0.5) * 0.4) * 10) / 10;
    n.gmp = Math.max(0, n.gmp);
  });

  // Check for matured investments
  let maturedCount = 0;
  store.investments.forEach((inv) => {
    if (inv.status === "active" && store.currentDay >= inv.maturesOnDay) {
      inv.status = "matured";
      maturedCount++;
      addFeedEntry("matured", `${inv.nodeName} cycle complete. ₹${fmt(inv.amount + inv.yieldEarned)} ready to collect.`);
    }
  });

  if (maturedCount > 0) {
    addFeedEntry("system", `${maturedCount} investment(s) matured. Collect your returns.`);
  }

  // Background noise — random feed entries
  if (Math.random() > 0.5) {
    const node = pick(store.nodes);
    const msgs = [
      `Demand signal: ${node.name} at ${node.demand}%.`,
      `${node.cat} sector scan complete. ${node.demand > 75 ? "Strong" : "Moderate"} activity.`,
      `Node health check: ${node.name} — all systems nominal.`,
      `Subscription update: ${node.name} at ${node.subscriptionRate}x.`,
    ];
    addFeedEntry("info", pick(msgs));
  }

  res.json({
    day: store.currentDay,
    maturedCount,
    message: maturedCount > 0
      ? `Day ${store.currentDay}: ${maturedCount} investment(s) matured!`
      : `Day ${store.currentDay}: System advancing. All positions nominal.`,
  });
});

// GET /api/status — overall system status
app.get("/api/status", (req, res) => {
  const activeInvs = store.investments.filter((i) => i.status === "active");
  const maturedInvs = store.investments.filter((i) => i.status === "matured");
  res.json({
    day: store.currentDay,
    activeInvestments: activeInvs.length,
    maturedInvestments: maturedInvs.length,
    nodesOpen: store.nodes.filter((n) => n.status === "open").length,
    totalNodes: store.nodes.length,
  });
});

// ── START SERVER ───────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`\n  ╔════════════════════════════════════════╗`);
  console.log(`  ║   Flow OS Server · v2.0                ║`);
  console.log(`  ║   Running on http://localhost:${PORT}      ║`);
  console.log(`  ╚════════════════════════════════════════╝\n`);
});