// ─── Strick'in CLI — AI Natural Language Engine ─────────────────────────────
// Translates natural language queries into CLI commands + executes them.
// Pattern-matching engine with intent detection — no external API needed.

import { PRODUCTS, COMMITMENTS, COMMISSIONS } from './data.js';
import type { Product } from './data.js';
import { output, spinner } from './output.js';

interface Intent {
  type: string;
  confidence: number;
  params: Record<string, string>;
  command: string;
  explanation: string;
}

interface AiResponse {
  query: string;
  intent: Intent;
  result: unknown;
  followUp: string[];
}

// ─── Intent Detection ────────────────────────────────────────────────────────

const INTENT_PATTERNS: { pattern: RegExp; type: string; extract: (m: RegExpMatchArray) => Record<string, string> }[] = [
  // Product search — specific patterns first, generic last
  { pattern: /(?:faible\s*risque|risque\s*faible|sri\s*(?:bas|faible)|prudent|conservat)/i, type: 'PRODUCT_LOW_RISK', extract: () => ({ sri: '1-3' }) },
  { pattern: /(?:risque\s*élevé|sri\s*(?:haut|élevé)|agress)/i, type: 'PRODUCT_HIGH_RISK', extract: () => ({ sri: '5-7' }) },
  { pattern: /(?:capital\s*protégé|protecti)/i, type: 'PRODUCT_FILTER_TYPE', extract: () => ({ type: 'CAPITAL_PROTECTED' }) },
  { pattern: /(?:autocall|phoenix)/i, type: 'PRODUCT_FILTER_TYPE', extract: () => ({ type: 'AUTOCALL_PHOENIX' }) },
  { pattern: /(?:taux\s*cond|conditionnel)/i, type: 'PRODUCT_FILTER_TYPE', extract: () => ({ type: 'CONDITIONAL_RATE' }) },
  { pattern: /(?:cherch|trouv|list|montr|affich|quels?).*(?:produit|structuré)/i, type: 'PRODUCT_LIST', extract: () => ({}) },
  { pattern: /(?:meilleur|top|plus\s*(?:rentable|performant)|gain\s*max)/i, type: 'PRODUCT_BEST_RETURN', extract: () => ({}) },
  { pattern: /(?:produit).*(?:bnp|paribas)/i, type: 'PRODUCT_FILTER_ISSUER', extract: () => ({ issuer: 'BNP Paribas' }) },
  { pattern: /(?:produit).*(?:goldman|sachs|gs)/i, type: 'PRODUCT_FILTER_ISSUER', extract: () => ({ issuer: 'Goldman Sachs' }) },
  { pattern: /(?:produit).*(?:natixis)/i, type: 'PRODUCT_FILTER_ISSUER', extract: () => ({ issuer: 'Natixis' }) },
  { pattern: /(?:produit).*(?:sg|société\s*générale)/i, type: 'PRODUCT_FILTER_ISSUER', extract: () => ({ issuer: 'SG Issuer' }) },
  { pattern: /(?:détail|info|fiche).*(?:prod-\d+|FR\w+)/i, type: 'PRODUCT_DETAIL', extract: (m) => ({ id: m[0].match(/(?:prod-\d+|FR\w+)/i)?.[0] ?? '' }) },
  { pattern: /(?:isin|prod-\d+|FR\w{10,})/i, type: 'PRODUCT_DETAIL', extract: (m) => ({ id: m[0].match(/(?:prod-\d+|FR\w+)/i)?.[0] ?? '' }) },

  // Pricing
  { pattern: /(?:pric|valoris|évaluer|simuler|monte\s*carlo)/i, type: 'PRICING', extract: () => ({}) },
  { pattern: /(?:combien\s*vaut|fair\s*value|juste\s*valeur)/i, type: 'PRICING', extract: () => ({}) },

  // RFQ
  { pattern: /(?:rfq|cotation|consultation|quote|émetteur.*proposi)/i, type: 'RFQ', extract: () => ({}) },
  { pattern: /(?:meilleur.*prix|comparer.*émetteur|best.*offer)/i, type: 'RFQ', extract: () => ({}) },

  // Commitments
  { pattern: /(?:engagement|intérêt|commit|souscri)/i, type: 'COMMITMENTS', extract: () => ({}) },
  { pattern: /(?:en\s*attente|pending|statut.*engagement)/i, type: 'COMMITMENTS_PENDING', extract: () => ({ status: 'PENDING' }) },

  // Compliance
  { pattern: /(?:conformit|complianc|mif2|dda|réglementation|contrôle)/i, type: 'COMPLIANCE', extract: () => ({}) },
  { pattern: /(?:risque|vérif|adéquation)/i, type: 'COMPLIANCE', extract: () => ({}) },

  // Commissions
  { pattern: /(?:commission|rétrocession|rémunérat|frais.*distrib)/i, type: 'COMMISSIONS', extract: () => ({}) },

  // Audit
  { pattern: /(?:audit|rapport|bilan|résumé|synthèse|dashboard|overview)/i, type: 'AUDIT', extract: () => ({}) },
  { pattern: /(?:portefeuille|portfolio|position|exposition)/i, type: 'AUDIT', extract: () => ({}) },

  // Skills
  { pattern: /(?:anomali|problème|alert|incohéren)/i, type: 'SKILL_ANOMALY', extract: () => ({}) },
  { pattern: /(?:approuv|valid|accept).*(?:auto|automatiq)/i, type: 'SKILL_APPROVAL', extract: () => ({}) },
  { pattern: /(?:optimis|allocation|répartit|diversifi)/i, type: 'SKILL_OPTIMIZE', extract: () => ({}) },
  { pattern: /(?:rapproch|réconcili|écart.*commission)/i, type: 'SKILL_RECONCILIATION', extract: () => ({}) },
  { pattern: /(?:export|extraire|données|csv|dump)/i, type: 'SKILL_EXPORT', extract: () => ({}) },

  // Risk
  { pattern: /(?:var|value.at.risk|stress|drawdown|volatil|corrélat)/i, type: 'RISK', extract: () => ({}) },

  // Closing soon
  { pattern: /(?:clôture|ferme|bientôt|urgent|deadline)/i, type: 'CLOSING_SOON', extract: () => ({}) },

  // Help
  { pattern: /(?:aide|help|comment|quoi.*faire|capacit)/i, type: 'HELP', extract: () => ({}) },
];

function detectIntent(query: string): Intent {
  for (const { pattern, type, extract } of INTENT_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      const params = extract(match);
      return buildIntent(type, params, query);
    }
  }

  // Fallback: try keyword matching
  const keywords = query.toLowerCase().split(/\s+/);
  if (keywords.some(k => ['produit', 'product', 'structuré'].includes(k))) {
    return buildIntent('PRODUCT_LIST', {}, query);
  }

  return buildIntent('HELP', {}, query);
}

function buildIntent(type: string, params: Record<string, string>, query: string): Intent {
  const intents: Record<string, { command: string; explanation: string; confidence: number }> = {
    PRODUCT_LIST: { command: 'products list', explanation: 'Listing du catalogue complet', confidence: 0.9 },
    PRODUCT_FILTER_TYPE: { command: `products list --type ${params.type}`, explanation: `Filtrage par type ${params.type}`, confidence: 0.95 },
    PRODUCT_LOW_RISK: { command: `products list --sri ${params.sri}`, explanation: 'Produits à risque faible (SRI 1-3)', confidence: 0.9 },
    PRODUCT_HIGH_RISK: { command: `products list --sri ${params.sri}`, explanation: 'Produits à risque élevé (SRI 5-7)', confidence: 0.9 },
    PRODUCT_BEST_RETURN: { command: 'products list --sort -maxGainPct --limit 5', explanation: 'Top 5 produits par gain maximal', confidence: 0.85 },
    PRODUCT_FILTER_ISSUER: { command: `products list --issuer "${params.issuer}"`, explanation: `Produits émis par ${params.issuer}`, confidence: 0.95 },
    PRODUCT_DETAIL: { command: `products get ${params.id}`, explanation: `Détail du produit ${params.id}`, confidence: 0.95 },
    PRICING: { command: 'pricing run', explanation: 'Simulation Monte Carlo de pricing', confidence: 0.85 },
    RFQ: { command: 'rfq send', explanation: 'Consultation multi-émetteurs', confidence: 0.85 },
    COMMITMENTS: { command: 'commitments list', explanation: 'Liste des marques d\'intérêt', confidence: 0.85 },
    COMMITMENTS_PENDING: { command: 'commitments list --status PENDING', explanation: 'Engagements en attente de validation', confidence: 0.9 },
    COMPLIANCE: { command: 'compliance check', explanation: 'Contrôle de conformité MIF2/DDA', confidence: 0.85 },
    COMMISSIONS: { command: 'commissions list', explanation: 'Suivi des commissions', confidence: 0.85 },
    AUDIT: { command: 'audit', explanation: 'Rapport d\'audit du portefeuille', confidence: 0.9 },
    SKILL_ANOMALY: { command: 'skills run anomaly-detection', explanation: 'Détection d\'anomalies dans le portefeuille', confidence: 0.9 },
    SKILL_APPROVAL: { command: 'workflow batch-approve', explanation: 'Approbation automatique des engagements', confidence: 0.85 },
    SKILL_OPTIMIZE: { command: 'skills run portfolio-optimizer', explanation: 'Optimisation d\'allocation', confidence: 0.85 },
    SKILL_RECONCILIATION: { command: 'skills run commission-reconciliation', explanation: 'Rapprochement des commissions', confidence: 0.85 },
    SKILL_EXPORT: { command: 'skills run data-export', explanation: 'Export des données', confidence: 0.85 },
    RISK: { command: 'risk analyze', explanation: 'Analyse de risque avancée', confidence: 0.85 },
    CLOSING_SOON: { command: 'watch --closing', explanation: 'Produits en clôture imminente', confidence: 0.9 },
    HELP: { command: '--help', explanation: 'Aide et commandes disponibles', confidence: 0.5 },
  };

  const intent = intents[type] ?? intents.HELP;
  return { type, confidence: intent.confidence, params, command: intent.command, explanation: intent.explanation };
}

// ─── AI Execute ──────────────────────────────────────────────────────────────

export async function aiQuery(query: string, opts: { execute?: boolean }) {
  const s = spinner('Analyzing query...');
  await delay(400 + Math.random() * 300);
  const intent = detectIntent(query);
  s.stop(`Intent: ${intent.type} (${(intent.confidence * 100).toFixed(0)}%)`);

  // Execute the resolved command
  let result: unknown = null;
  if (opts.execute !== false) {
    result = await executeIntent(intent);
  }

  const followUp = generateFollowUp(intent);

  const response: AiResponse = {
    query,
    intent,
    result,
    followUp,
  };

  output(response);
}

async function executeIntent(intent: Intent): Promise<unknown> {
  switch (intent.type) {
    case 'PRODUCT_LIST':
    case 'PRODUCT_FILTER_TYPE':
    case 'PRODUCT_FILTER_ISSUER': {
      let results = [...PRODUCTS];
      if (intent.params.type) results = results.filter(p => p.payoffType === intent.params.type);
      if (intent.params.issuer) results = results.filter(p => p.issuerName.toLowerCase().includes(intent.params.issuer.toLowerCase()));
      return { count: results.length, products: results.map(summarize) };
    }
    case 'PRODUCT_LOW_RISK': {
      const results = PRODUCTS.filter(p => p.sri <= 3);
      return { count: results.length, products: results.map(summarize) };
    }
    case 'PRODUCT_HIGH_RISK': {
      const results = PRODUCTS.filter(p => p.sri >= 5);
      return { count: results.length, products: results.map(summarize) };
    }
    case 'PRODUCT_BEST_RETURN': {
      const results = [...PRODUCTS].sort((a, b) => (b.maxGainPct ?? 0) - (a.maxGainPct ?? 0)).slice(0, 5);
      return { products: results.map(summarize) };
    }
    case 'PRODUCT_DETAIL': {
      const p = PRODUCTS.find(p => p.id === intent.params.id || p.isin === intent.params.id);
      return p ?? { error: 'Product not found' };
    }
    case 'COMMITMENTS':
    case 'COMMITMENTS_PENDING': {
      let results = [...COMMITMENTS];
      if (intent.params.status) results = results.filter(c => c.status === intent.params.status);
      return { count: results.length, totalAmount: results.reduce((s, c) => s + c.amount, 0), commitments: results };
    }
    case 'COMMISSIONS': {
      const total = COMMISSIONS.reduce((s, c) => s + c.amount, 0);
      return { count: COMMISSIONS.length, totalAmount: total, commissions: COMMISSIONS };
    }
    case 'AUDIT': {
      const totalEngaged = PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);
      return {
        totalProducts: PRODUCTS.length,
        totalEngaged,
        avgFillPct: Math.round(PRODUCTS.reduce((s, p) => s + p.fillPct, 0) / PRODUCTS.length),
        totalCommitments: COMMITMENTS.length,
        totalCommissions: COMMISSIONS.reduce((s, c) => s + c.amount, 0),
      };
    }
    case 'CLOSING_SOON': {
      const soon = PRODUCTS.filter(p => {
        const days = (new Date(p.shelfClosingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
      }).map(p => ({
        ...summarize(p),
        daysToClose: Math.ceil((new Date(p.shelfClosingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      }));
      return { closingSoon: soon.length, products: soon };
    }
    case 'SKILL_ANOMALY': {
      const anomalies = [];
      for (const p of PRODUCTS) {
        if (p.entryFeePct > 7) anomalies.push({ type: 'HIGH_FEES', product: p.name, detail: `${p.entryFeePct}%` });
      }
      return { anomaliesFound: anomalies.length, anomalies };
    }
    case 'HELP': {
      return {
        commands: ['products', 'pricing', 'rfq', 'commitments', 'compliance', 'commissions', 'audit', 'skills', 'workflow', 'risk', 'watch', 'ai', 'batch', 'serve'],
        examples: [
          'strickin ai "quels produits à faible risque?"',
          'strickin ai "top 5 meilleurs rendements"',
          'strickin ai "détails produit FR0014013A96"',
          'strickin ai "anomalies dans le portefeuille"',
          'strickin ai "engagements en attente"',
        ],
      };
    }
    default:
      return { message: `Intent ${intent.type} recognized but execution not implemented in AI mode` };
  }
}

function generateFollowUp(intent: Intent): string[] {
  const suggestions: Record<string, string[]> = {
    PRODUCT_LIST: ['Filtrer par type: "produits autocall"', 'Voir les détails: "détail prod-001"', 'Analyser le risque: "risk analyze"'],
    PRODUCT_LOW_RISK: ['Optimiser l\'allocation: "optimiser portefeuille"', 'Vérifier la compliance: "conformité"'],
    PRODUCT_BEST_RETURN: ['Pricer le meilleur: "pricer le top produit"', 'Lancer une RFQ: "cotation émetteurs"'],
    COMMITMENTS: ['Approuver auto: "approuver automatiquement"', 'Rapport d\'audit: "bilan portefeuille"'],
    AUDIT: ['Détecter les anomalies: "anomalies"', 'Exporter les données: "export"'],
    COMPLIANCE: ['Voir les détails produit: "fiche produit"', 'Analyser le risque: "VaR et stress test"'],
    HELP: ['Essayez: "produits capital protégé"', 'Ou: "résumé du portefeuille"', 'Ou: "anomalies et alertes"'],
  };
  return suggestions[intent.type] ?? ['Essayez "aide" pour voir les commandes disponibles'];
}

function summarize(p: Product) {
  return {
    id: p.id, isin: p.isin, name: p.name,
    payoffType: p.payoffType, issuer: p.issuerName,
    sri: p.sri, maxGainPct: p.maxGainPct, barrierPct: p.barrierCapPct,
    fillPct: p.fillPct, status: p.status,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
