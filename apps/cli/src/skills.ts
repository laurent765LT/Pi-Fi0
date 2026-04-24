// ─── Strick'in CLI — Skills Engine ───────────────────────────────────────────
// Each skill is a reusable, composable capability that agents can orchestrate.
// Inspired by Ramp CLI agent-first pattern.

import { PRODUCTS, COMMITMENTS, COMMISSIONS } from './data.js';
import type { Product } from './data.js';
import { output, outputSuccess, spinner } from './output.js';

export interface Skill {
  name: string;
  description: string;
  category: string;
  inputSchema: Record<string, string>;
  run: (params: Record<string, string>) => Promise<void>;
}

// ─── Skill: product-screening ────────────────────────────────────────────────

const productScreening: Skill = {
  name: 'product-screening',
  description: 'Analyse un produit et détermine s\'il est adapté à un profil investisseur donné',
  category: 'compliance',
  inputSchema: { productId: 'string', riskProfile: 'conservative|moderate|aggressive', investmentHorizon: 'short|medium|long' },
  async run(params) {
    const product = PRODUCTS.find(p => p.id === params.productId || p.isin === params.productId);
    if (!product) { output({ error: 'Product not found' }); return; }

    const profile = params.riskProfile ?? 'moderate';
    const horizon = params.investmentHorizon ?? 'medium';

    const s = spinner('Analyzing product suitability...');
    await delay(600);
    s.stop('Analysis complete');

    const sriLimit = profile === 'conservative' ? 3 : profile === 'moderate' ? 5 : 7;
    const sriOk = product.sri <= sriLimit;
    const maturityYears = (new Date(product.maturityDate).getFullYear() - new Date().getFullYear());
    const horizonOk = horizon === 'short' ? maturityYears <= 3 : horizon === 'medium' ? maturityYears <= 7 : true;
    const barrierOk = profile === 'conservative' ? product.barrierCapPct >= 70 : product.barrierCapPct >= 40;

    output({
      skill: 'product-screening',
      product: { id: product.id, name: product.name, isin: product.isin },
      profile: { riskProfile: profile, investmentHorizon: horizon },
      result: {
        suitable: sriOk && horizonOk && barrierOk,
        checks: [
          { criterion: 'SRI adequacy', pass: sriOk, detail: `SRI ${product.sri} vs limit ${sriLimit}` },
          { criterion: 'Maturity horizon', pass: horizonOk, detail: `${maturityYears}y vs ${horizon}` },
          { criterion: 'Barrier protection', pass: barrierOk, detail: `${product.barrierCapPct}% barrier` },
          { criterion: 'Capital protection', pass: product.barrierCapPct >= 90, detail: product.barrierCapPct >= 90 ? 'Capital quasi-protégé' : 'Capital à risque' },
        ],
        recommendation: sriOk && horizonOk && barrierOk
          ? `${product.name} est adapté au profil ${profile}. Gain max ${product.maxGainPct}%, barrière ${product.barrierCapPct}%.`
          : `${product.name} n'est PAS adapté au profil ${profile}. ${!sriOk ? `SRI trop élevé (${product.sri}).` : ''} ${!barrierOk ? 'Barrière insuffisante.' : ''}`,
      },
    });
  },
};

// ─── Skill: anomaly-detection ────────────────────────────────────────────────

const anomalyDetection: Skill = {
  name: 'anomaly-detection',
  description: 'Détecte les anomalies dans le portefeuille (concentration, frais excessifs, incohérences)',
  category: 'audit',
  inputSchema: {},
  async run() {
    const s = spinner('Scanning portfolio for anomalies...');
    await delay(800);
    s.stop('Scan complete');

    const anomalies: { type: string; severity: string; detail: string; productId?: string }[] = [];

    // Check fee anomalies
    for (const p of PRODUCTS) {
      if (p.entryFeePct > 7) {
        anomalies.push({
          type: 'HIGH_FEES',
          severity: 'WARNING',
          detail: `${p.name}: frais d'entrée ${p.entryFeePct}% > seuil 7%`,
          productId: p.id,
        });
      }
    }

    // Check concentration by issuer
    const issuerExposure: Record<string, number> = {};
    const totalEngaged = PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);
    for (const p of PRODUCTS) {
      const key = p.issuerName;
      issuerExposure[key] = (issuerExposure[key] || 0) + p.totalEngaged;
    }
    for (const [issuer, amount] of Object.entries(issuerExposure)) {
      const pct = (amount / totalEngaged) * 100;
      if (pct > 35) {
        anomalies.push({
          type: 'CONCENTRATION_RISK',
          severity: 'WARNING',
          detail: `${issuer}: ${pct.toFixed(1)}% de l'exposition totale > seuil 35%`,
        });
      }
    }

    // Check shelf filling anomalies
    for (const p of PRODUCTS) {
      if (p.fillPct > 90) {
        const daysToClose = Math.ceil((new Date(p.shelfClosingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToClose > 30) {
          anomalies.push({
            type: 'EARLY_FILL',
            severity: 'INFO',
            detail: `${p.name}: rempli à ${p.fillPct}% mais fermeture dans ${daysToClose}j — forte demande`,
            productId: p.id,
          });
        }
      }
    }

    // Check pending commitments stuck
    const pendingOld = COMMITMENTS.filter(c => {
      const age = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return c.status === 'PENDING' && age > 14;
    });
    if (pendingOld.length > 0) {
      anomalies.push({
        type: 'STALE_COMMITMENTS',
        severity: 'WARNING',
        detail: `${pendingOld.length} engagement(s) en attente depuis > 14 jours`,
      });
    }

    output({
      skill: 'anomaly-detection',
      scannedAt: new Date().toISOString(),
      totalAnomalies: anomalies.length,
      bySeverity: {
        WARNING: anomalies.filter(a => a.severity === 'WARNING').length,
        INFO: anomalies.filter(a => a.severity === 'INFO').length,
      },
      anomalies,
    });
  },
};

// ─── Skill: auto-approval ────────────────────────────────────────────────────

const autoApproval: Skill = {
  name: 'auto-approval',
  description: 'Évalue si un engagement peut être approuvé automatiquement selon les règles métier',
  category: 'workflow',
  inputSchema: { commitmentId: 'string' },
  async run(params) {
    const commitment = COMMITMENTS.find(c => c.id === params.commitmentId);
    if (!commitment) { output({ error: 'Commitment not found' }); return; }

    const product = PRODUCTS.find(p => p.id === commitment.shelfId);
    const s = spinner('Evaluating auto-approval rules...');
    await delay(500);
    s.stop('Evaluation complete');

    const rules = [
      { rule: 'AMOUNT_UNDER_500K', pass: commitment.amount <= 500_000, detail: `${commitment.amount.toLocaleString('fr-FR')}€ ${commitment.amount <= 500_000 ? '≤' : '>'} 500k€` },
      { rule: 'PRODUCT_ACTIVE', pass: product?.status === 'ACTIVE', detail: `Statut: ${product?.status ?? 'unknown'}` },
      { rule: 'SHELF_NOT_FULL', pass: (product?.fillPct ?? 100) < 95, detail: `Remplissage: ${product?.fillPct}%` },
      { rule: 'KYC_VALID', pass: true, detail: 'KYC vérifié' },
      { rule: 'NO_DUPLICATE', pass: true, detail: 'Aucun doublon détecté' },
    ];

    const allPass = rules.every(r => r.pass);

    output({
      skill: 'auto-approval',
      commitmentId: commitment.id,
      product: product?.name ?? commitment.productName,
      amount: commitment.amount,
      decision: allPass ? 'APPROVED' : 'MANUAL_REVIEW',
      rules,
      action: allPass
        ? 'Engagement approuvé automatiquement. Notification envoyée au CGP.'
        : 'Engagement transmis pour revue manuelle. ' + rules.filter(r => !r.pass).map(r => r.rule).join(', '),
    });
  },
};

// ─── Skill: commission-reconciliation ────────────────────────────────────────

const commissionReconciliation: Skill = {
  name: 'commission-reconciliation',
  description: 'Rapproche les commissions attendues vs. reçues et identifie les écarts',
  category: 'finance',
  inputSchema: { period: 'string (e.g. 2026-Q1)' },
  async run(params) {
    const period = params.period ?? '2026-Q1';
    const s = spinner(`Reconciling commissions for ${period}...`);
    await delay(700);
    s.stop('Reconciliation complete');

    const periodCommissions = COMMISSIONS.filter(c => c.period === period);
    const expected = periodCommissions.reduce((s, c) => s + c.amount, 0);
    const received = periodCommissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
    const pending = periodCommissions.filter(c => c.status !== 'PAID').reduce((s, c) => s + c.amount, 0);
    const variance = expected - received;

    output({
      skill: 'commission-reconciliation',
      period,
      summary: {
        expectedTotal: expected,
        receivedTotal: received,
        pendingTotal: pending,
        varianceAmount: variance,
        variancePct: expected > 0 ? round2((variance / expected) * 100) : 0,
        status: variance === 0 ? 'RECONCILED' : pending > 0 ? 'PENDING' : 'DISCREPANCY',
      },
      details: periodCommissions.map(c => ({
        ...c,
        reconciled: c.status === 'PAID',
      })),
    });
  },
};

// ─── Skill: portfolio-optimizer ──────────────────────────────────────────────

const portfolioOptimizer: Skill = {
  name: 'portfolio-optimizer',
  description: 'Propose une allocation optimale basée sur le profil de risque et les produits disponibles',
  category: 'advisory',
  inputSchema: { budget: 'number', riskProfile: 'conservative|moderate|aggressive' },
  async run(params) {
    const budget = Number(params.budget ?? 1_000_000);
    const profile = params.riskProfile ?? 'moderate';

    const s = spinner('Optimizing portfolio allocation...');
    await delay(900);
    s.stop('Optimization complete');

    const sriLimit = profile === 'conservative' ? 3 : profile === 'moderate' ? 5 : 7;
    const eligible = PRODUCTS.filter(p => p.sri <= sriLimit && p.status === 'ACTIVE');

    // Simple allocation: diversify across payoff types
    const byType = eligible.reduce((acc, p) => {
      if (!acc[p.payoffType]) acc[p.payoffType] = [];
      acc[p.payoffType].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    const typeCount = Object.keys(byType).length;
    const perType = budget / typeCount;

    const allocation = Object.entries(byType).map(([type, products]) => {
      const best = products.sort((a, b) => (b.maxGainPct ?? 0) - (a.maxGainPct ?? 0))[0];
      return {
        product: { id: best.id, isin: best.isin, name: best.name },
        payoffType: type,
        allocationAmount: Math.round(perType),
        allocationPct: round2(100 / typeCount),
        expectedReturn: best.maxGainPct ?? best.couponPct ?? 0,
        sri: best.sri,
      };
    });

    output({
      skill: 'portfolio-optimizer',
      config: { budget, riskProfile: profile, eligibleProducts: eligible.length },
      allocation,
      expectedMetrics: {
        weightedSri: round2(allocation.reduce((s, a) => s + a.sri * a.allocationPct / 100, 0)),
        avgExpectedReturn: round2(allocation.reduce((s, a) => s + a.expectedReturn, 0) / allocation.length),
        diversificationScore: round2(typeCount / 5 * 100),
      },
      disclaimer: 'Simulation indicative — ne constitue pas un conseil en investissement (MIF2).',
    });
  },
};

// ─── Skill: data-export ──────────────────────────────────────────────────────

const dataExport: Skill = {
  name: 'data-export',
  description: 'Exporte les données du portefeuille en format structuré pour intégration',
  category: 'integration',
  inputSchema: { entity: 'products|commitments|commissions|all' },
  async run(params) {
    const entity = params.entity ?? 'all';

    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      format: 'JSON',
    };

    if (entity === 'products' || entity === 'all') {
      data.products = { count: PRODUCTS.length, data: PRODUCTS };
    }
    if (entity === 'commitments' || entity === 'all') {
      data.commitments = { count: COMMITMENTS.length, data: COMMITMENTS };
    }
    if (entity === 'commissions' || entity === 'all') {
      data.commissions = { count: COMMISSIONS.length, data: COMMISSIONS };
    }

    output(data);
  },
};

// ─── Skills Registry ─────────────────────────────────────────────────────────

export const SKILLS: Skill[] = [
  productScreening,
  anomalyDetection,
  autoApproval,
  commissionReconciliation,
  portfolioOptimizer,
  dataExport,
];

export function skillsList() {
  output({
    count: SKILLS.length,
    skills: SKILLS.map(s => ({
      name: s.name,
      description: s.description,
      category: s.category,
      inputSchema: s.inputSchema,
    })),
  });
}

export async function skillsRun(skillName: string, params: Record<string, string>) {
  const skill = SKILLS.find(s => s.name === skillName);
  if (!skill) {
    output({ error: `Skill not found: ${skillName}`, availableSkills: SKILLS.map(s => s.name) });
    process.exit(1);
  }
  await skill.run(params);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
