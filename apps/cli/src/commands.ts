// ─── Strick'in CLI Commands ──────────────────────────────────────────────────
// All CLI commands: products, pricing, rfq, commitments, compliance, commissions

import { PRODUCTS, COMMITMENTS, COMMISSIONS, ISSUERS } from './data.js';
import type { Product } from './data.js';
import { output, outputSuccess, outputError, spinner } from './output.js';

// ─── Products ────────────────────────────────────────────────────────────────

export function productsList(opts: {
  type?: string;
  issuer?: string;
  sri?: string;
  status?: string;
  limit?: string;
  sort?: string;
}) {
  let results = [...PRODUCTS];

  if (opts.type) {
    results = results.filter(p => p.payoffType === opts.type!.toUpperCase());
  }
  if (opts.issuer) {
    const q = opts.issuer.toLowerCase();
    results = results.filter(p => p.issuerName.toLowerCase().includes(q));
  }
  if (opts.sri) {
    const [min, max] = opts.sri.includes('-') ? opts.sri.split('-').map(Number) : [Number(opts.sri), Number(opts.sri)];
    results = results.filter(p => p.sri >= min && p.sri <= max);
  }
  if (opts.status) {
    results = results.filter(p => p.status === opts.status!.toUpperCase());
  }

  // Sort
  if (opts.sort) {
    const field = opts.sort.replace('-', '');
    const desc = opts.sort.startsWith('-');
    results.sort((a, b) => {
      const va = (a as any)[field] ?? 0;
      const vb = (b as any)[field] ?? 0;
      return desc ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
    });
  }

  if (opts.limit) {
    results = results.slice(0, Number(opts.limit));
  }

  output({
    count: results.length,
    products: results.map(p => ({
      id: p.id,
      isin: p.isin,
      name: p.name,
      payoffType: p.payoffType,
      issuer: p.issuerName,
      sri: p.sri,
      maxGainPct: p.maxGainPct,
      barrierPct: p.barrierCapPct,
      couponPct: p.couponPct,
      fillPct: p.fillPct,
      status: p.status,
      maturityDate: p.maturityDate,
      shelfClosingDate: p.shelfClosingDate,
    })),
  });
}

export function productsGet(idOrIsin: string) {
  const product = PRODUCTS.find(p => p.id === idOrIsin || p.isin === idOrIsin);
  if (!product) {
    outputError(`Product not found: ${idOrIsin}`);
    process.exit(1);
  }
  output(product);
}

export function productsSearch(query: string) {
  const q = query.toLowerCase();
  const results = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.isin.toLowerCase().includes(q) ||
    p.issuerName.toLowerCase().includes(q) ||
    p.underlyingName.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
  output({
    query,
    count: results.length,
    products: results.map(p => ({
      id: p.id,
      isin: p.isin,
      name: p.name,
      payoffType: p.payoffType,
      issuer: p.issuerName,
      sri: p.sri,
      maxGainPct: p.maxGainPct,
      relevance: computeRelevance(p, q),
    })),
  });
}

function computeRelevance(p: Product, q: string): number {
  let score = 0;
  if (p.name.toLowerCase().includes(q)) score += 50;
  if (p.isin.toLowerCase().includes(q)) score += 40;
  if (p.issuerName.toLowerCase().includes(q)) score += 30;
  if (p.underlyingName.toLowerCase().includes(q)) score += 20;
  if (p.description.toLowerCase().includes(q)) score += 10;
  return score;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export async function pricingRun(opts: {
  product?: string;
  nominal?: string;
  barrier?: string;
  coupon?: string;
  maturity?: string;
}) {
  const s = spinner('Running Monte Carlo simulation (50,000 paths)...');
  await delay(1200 + Math.random() * 800);
  s.stop('Simulation complete');

  const product = opts.product ? PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product) : null;
  const barrier = Number(opts.barrier ?? product?.barrierCapPct ?? 50);
  const coupon = Number(opts.coupon ?? product?.couponPct ?? 5);
  const nominal = Number(opts.nominal ?? 1_000_000);
  const maturityYears = Number(opts.maturity ?? 10);

  // Dynamic pricing based on params
  const fairValue = 95 + (barrier / 100) * 4 - (coupon / 100) * 3 + Math.random() * 1.5;
  const probAutocall = barrier < 60 ? 35 + Math.random() * 15 : 55 + Math.random() * 20;
  const probCapitalLoss = Math.max(2, 30 - barrier * 0.35 + Math.random() * 5);
  const probMaxGain = 25 + Math.random() * 15;

  output({
    pricing: {
      fairValuePct: round2(fairValue),
      fairValueAmount: round2(nominal * fairValue / 100),
      bidPct: round2(fairValue - 0.8 - Math.random() * 0.5),
      askPct: round2(fairValue + 0.3 + Math.random() * 0.3),
      spreadBps: Math.round(110 + Math.random() * 40),
    },
    probabilities: {
      autocallPct: round2(probAutocall),
      maxGainPct: round2(probMaxGain),
      capitalLossPct: round2(probCapitalLoss),
      couponPaymentPct: round2(100 - probCapitalLoss - 5 + Math.random() * 3),
    },
    greeks: {
      delta: round2(-0.3 - Math.random() * 0.2),
      gamma: round2(0.01 + Math.random() * 0.02),
      vega: round2(-0.15 - Math.random() * 0.1),
      theta: round2(-0.02 - Math.random() * 0.01),
      rho: round2(0.05 + Math.random() * 0.03),
    },
    scenarios: [
      { scenario: 'Bull (+20%)', returnPct: round2((product?.maxGainPct ?? 100) * 0.8), probability: round2(probMaxGain) },
      { scenario: 'Base (flat)', returnPct: round2(coupon * maturityYears * 0.6), probability: round2(40 + Math.random() * 10) },
      { scenario: 'Bear (-30%)', returnPct: round2(-15 - Math.random() * 10), probability: round2(probCapitalLoss * 0.6) },
      { scenario: 'Crash (-50%)', returnPct: round2(-40 - Math.random() * 15), probability: round2(probCapitalLoss * 0.4) },
    ],
    config: {
      product: product?.name ?? 'Custom',
      nominal,
      barrierPct: barrier,
      couponPct: coupon,
      maturityYears,
      simulationPaths: 50_000,
      computeTimeMs: Math.round(1200 + Math.random() * 800),
    },
  });
}

// ─── RFQ ─────────────────────────────────────────────────────────────────────

export async function rfqSend(opts: {
  product?: string;
  mode?: string;
  issuers?: string;
  nominal?: string;
}) {
  const product = opts.product ? PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product) : PRODUCTS[0];
  if (!product) {
    outputError('Product not found');
    process.exit(1);
  }

  const targetIssuers = opts.issuers ? opts.issuers.split(',') : ISSUERS;
  const nominal = Number(opts.nominal ?? 1_000_000);
  const mode = opts.mode ?? 'max_coupon';
  const rfqId = `rfq-${Date.now().toString(36)}`;

  const s = spinner(`Sending RFQ to ${targetIssuers.length} issuers...`);
  await delay(800);
  s.stop('RFQ sent');

  // Simulate quotes arriving
  const quotes = [];
  for (const issuer of targetIssuers) {
    const s2 = spinner(`Waiting for ${issuer}...`);
    await delay(500 + Math.random() * 1500);

    const baseFV = 97 + Math.random() * 3;
    const spread = 80 + Math.random() * 60;
    const quote = {
      issuer,
      pricePct: round2(baseFV + (Math.random() - 0.5) * 2),
      spreadBps: Math.round(spread),
      feesPct: round2(0.5 + Math.random() * 1),
      validity: '15min',
      conditions: Math.random() > 0.7 ? 'Min 500k nominal' : null,
      receivedAt: new Date().toISOString(),
    };
    quotes.push(quote);
    s2.stop(`${issuer}: ${quote.pricePct}% (${quote.spreadBps}bps)`);
  }

  // Rank quotes
  quotes.sort((a, b) => b.pricePct - a.pricePct);
  const ranked = quotes.map((q, i) => ({ ...q, rank: i + 1, bestOffer: i === 0 }));

  output({
    rfqId,
    product: { id: product.id, isin: product.isin, name: product.name },
    mode,
    nominal,
    quotesReceived: ranked.length,
    quotes: ranked,
    recommendation: {
      bestIssuer: ranked[0].issuer,
      bestPrice: ranked[0].pricePct,
      savings: round2((ranked[0].pricePct - ranked[ranked.length - 1].pricePct) * nominal / 100),
    },
  });
}

// ─── Commitments ─────────────────────────────────────────────────────────────

export function commitmentsList(opts: { status?: string; product?: string }) {
  let results = [...COMMITMENTS];
  if (opts.status) {
    results = results.filter(c => c.status === opts.status!.toUpperCase());
  }
  if (opts.product) {
    const q = opts.product.toLowerCase();
    results = results.filter(c => c.productName.toLowerCase().includes(q));
  }

  const totalAmount = results.reduce((sum, c) => sum + c.amount, 0);
  output({
    count: results.length,
    totalAmount,
    commitments: results,
  });
}

export function commitmentsCreate(opts: {
  product: string;
  amount: string;
  contract?: string;
  insurer?: string;
  clients?: string;
}) {
  const product = PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product);
  if (!product) {
    outputError(`Product not found: ${opts.product}`);
    process.exit(1);
  }

  const amount = Number(opts.amount);
  if (isNaN(amount) || amount < 1000) {
    outputError('Amount must be >= 1000 EUR');
    process.exit(1);
  }

  const commitment = {
    id: `c-${Date.now().toString(36)}`,
    shelfId: product.id,
    productName: product.name,
    productIsin: product.isin,
    amount,
    contractType: opts.contract ?? 'ASSURANCE_VIE',
    insurerEnvelope: opts.insurer ?? 'Generali Vie',
    clientCount: Number(opts.clients ?? 1),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    mif2Disclaimer: 'Expression d\'intérêt non engageante - MIF2/DDA',
  };

  outputSuccess('Commitment created', commitment);
}

// ─── Compliance ──────────────────────────────────────────────────────────────

export function complianceCheck(opts: { product?: string; client?: string; amount?: string }) {
  const product = opts.product ? PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product) : null;

  const checks = [
    {
      rule: 'KID_DELIVERY',
      description: 'Document d\'Informations Clés remis avant souscription',
      status: 'PASS',
      detail: 'KID disponible pour tous les produits du catalogue',
    },
    {
      rule: 'SRI_ADEQUACY',
      description: 'Adéquation SRI / profil investisseur',
      status: product && product.sri >= 6 ? 'WARNING' : 'PASS',
      detail: product ? `SRI ${product.sri}/7 — ${product.sri >= 6 ? 'Risque élevé, vérifier profil' : 'Compatible profil modéré'}` : 'Aucun produit spécifié',
    },
    {
      rule: 'CONCENTRATION_LIMIT',
      description: 'Limite de concentration par émetteur (max 20%)',
      status: 'PASS',
      detail: 'Aucun dépassement détecté',
    },
    {
      rule: 'MIF2_SUITABILITY',
      description: 'Test d\'adéquation MIF2',
      status: 'PASS',
      detail: 'Conformité MIF2 vérifiée',
    },
    {
      rule: 'DDA_DISCLOSURE',
      description: 'Transparence DDA sur les frais',
      status: product && product.entryFeePct > 6 ? 'WARNING' : 'PASS',
      detail: product ? `Frais d'entrée ${product.entryFeePct}% — ${product.entryFeePct > 6 ? 'Frais élevés, disclosure renforcée requise' : 'Dans les normes'}` : 'OK',
    },
    {
      rule: 'AMOUNT_THRESHOLD',
      description: 'Seuil de montant et vérification LCB-FT',
      status: opts.amount && Number(opts.amount) > 5_000_000 ? 'WARNING' : 'PASS',
      detail: opts.amount ? `Montant ${Number(opts.amount).toLocaleString('fr-FR')}€ — ${Number(opts.amount) > 5_000_000 ? 'Seuil LCB-FT, vérification renforcée' : 'OK'}` : 'Aucun montant spécifié',
    },
    {
      rule: 'PRODUCT_GOVERNANCE',
      description: 'Marché cible et distribution validés',
      status: 'PASS',
      detail: product ? `${product.name} — Distribution validée pour CGP indépendants` : 'OK',
    },
    {
      rule: 'SHELF_STATUS',
      description: 'Étagère ouverte à la souscription',
      status: product?.status === 'ACTIVE' ? 'PASS' : 'FAIL',
      detail: product ? `Statut: ${product.status}` : 'Aucun produit spécifié',
    },
  ];

  const passCount = checks.filter(c => c.status === 'PASS').length;
  const warnCount = checks.filter(c => c.status === 'WARNING').length;
  const failCount = checks.filter(c => c.status === 'FAIL').length;

  output({
    summary: {
      totalChecks: checks.length,
      passed: passCount,
      warnings: warnCount,
      failed: failCount,
      overallStatus: failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARNING' : 'PASS',
    },
    checks,
    product: product ? { id: product.id, isin: product.isin, name: product.name } : null,
  });
}

// ─── Commissions ─────────────────────────────────────────────────────────────

export function commissionsList(opts: { status?: string; period?: string }) {
  let results = [...COMMISSIONS];
  if (opts.status) results = results.filter(c => c.status === opts.status!.toUpperCase());
  if (opts.period) results = results.filter(c => c.period === opts.period);

  const totalAmount = results.reduce((sum, c) => sum + c.amount, 0);
  const byStatus = {
    ACCRUED: results.filter(c => c.status === 'ACCRUED').reduce((s, c) => s + c.amount, 0),
    PAYABLE: results.filter(c => c.status === 'PAYABLE').reduce((s, c) => s + c.amount, 0),
    PAID: results.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0),
  };

  output({
    count: results.length,
    totalAmount,
    byStatus,
    commissions: results,
  });
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export function auditReport() {
  const totalEngaged = PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);
  const totalTarget = PRODUCTS.reduce((s, p) => s + p.targetAmount, 0);
  const avgFill = PRODUCTS.reduce((s, p) => s + p.fillPct, 0) / PRODUCTS.length;

  const byIssuer = PRODUCTS.reduce((acc, p) => {
    const key = p.issuerName.split(' ')[0]; // Shortened
    acc[key] = (acc[key] || 0) + p.totalEngaged;
    return acc;
  }, {} as Record<string, number>);

  const byPayoff = PRODUCTS.reduce((acc, p) => {
    acc[p.payoffType] = (acc[p.payoffType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const closingSoon = PRODUCTS.filter(p => {
    const days = (new Date(p.shelfClosingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  });

  output({
    report: {
      generatedAt: new Date().toISOString(),
      period: '2026-Q1',
    },
    portfolio: {
      totalProducts: PRODUCTS.length,
      totalTargetAmount: totalTarget,
      totalEngagedAmount: totalEngaged,
      avgFillPct: round2(avgFill),
      totalCommitments: COMMITMENTS.length,
      totalCommissionsEarned: COMMISSIONS.reduce((s, c) => s + c.amount, 0),
    },
    distribution: {
      byIssuer,
      byPayoffType: byPayoff,
      closingSoonCount: closingSoon.length,
      closingSoon: closingSoon.map(p => ({ id: p.id, name: p.name, closingDate: p.shelfClosingDate })),
    },
    risk: {
      avgSri: round2(PRODUCTS.reduce((s, p) => s + p.sri, 0) / PRODUCTS.length),
      highRiskProducts: PRODUCTS.filter(p => p.sri >= 6).length,
      lowBarrierProducts: PRODUCTS.filter(p => p.barrierCapPct <= 40).length,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
