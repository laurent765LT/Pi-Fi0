// ─── Pricing Simulator ──────────────────────────────────────────────────────
// Generates realistic (but fake) pricing results based on product configuration.
// Used in demo mode to replace static values with dynamic, config-sensitive results.

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingConfig {
  structureType?: string;
  currency?: string;
  nominalAmount?: number;
  underlying?: { name?: string; spot?: number; ticker?: string };
  payoff?: {
    couponType?: string;
    couponRate?: number;
    couponBarrier?: number;
    couponMemory?: boolean;
    autocallEnabled?: boolean;
    autocallBarrier?: number;
    protectionBarrier?: number;
    barrierMonitoring?: string;
    cap?: number;
    participationUp?: number;
  };
  market?: {
    riskFreeRate?: number;
    fundingSpread?: number;
    structuringMargin?: number;
    distributionFee?: number;
  };
  mcPaths?: number;
  maturityYears?: number;
  strikeDate?: string;
  maturityDate?: string;
}

export interface SimulatedResult {
  fairValue: number;
  issuePrice: number;
  expectedReturn: string;
  computeTimeMs: number;
  riskSummary: {
    probAutocall: number;
    probCapitalLoss: number;
    probMaxLoss: number;
    expectedLife: number;
    valueAtRisk95: number;
    conditionalVaR: number;
  };
  costBreakdown: {
    structuringMargin: string;
    distributionFee: string;
    executionCost: string;
    hedgingCost: string;
    totalCost: string;
  };
  scenarioTable: Array<{
    spotShock: number;
    spotLevel: number;
    redemption: number;
    totalCoupons: number;
    totalReturn: number;
  }>;
  greeks: { delta: number; gamma: number; vega: number; theta: number; rho: number };
  modelUsed: string;
  assumptions: string[];
  modelLimitations: string[];
  sri: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function jitter(base: number, pct: number): number {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

function computeMaturityYears(config: PricingConfig): number {
  if (config.maturityYears) return config.maturityYears;
  if (config.maturityDate && config.strikeDate) {
    const ms = new Date(config.maturityDate).getTime() - new Date(config.strikeDate).getTime();
    return Math.max(0.5, ms / (365.25 * 24 * 60 * 60 * 1000));
  }
  return 5;
}

// ─── Core Simulator ──────────────────────────────────────────────────────────

export function simulatePricing(config: PricingConfig): SimulatedResult {
  const payoff = config.payoff ?? {};
  const market = config.market ?? {};
  const spot = config.underlying?.spot ?? 5000;
  const maturityY = computeMaturityYears(config);

  const couponRate = payoff.couponRate ?? 0.08;
  const protBarrier = payoff.protectionBarrier ?? 0.6;
  const autocallBarrier = payoff.autocallBarrier ?? 1.0;
  const autocallEnabled = payoff.autocallEnabled !== false;
  const cap = payoff.cap ?? 0;
  const structType = config.structureType ?? 'PHOENIX_AUTOCALL';

  const riskFree = market.riskFreeRate ?? 0.03;
  const fundingSpread = market.fundingSpread ?? 0.005;
  const structMargin = market.structuringMargin ?? 0.015;
  const distFee = market.distributionFee ?? 0.02;

  // ── Fair value: depends on barrier, coupon, maturity, type ──
  let baseFV = 98.0;

  // Lower barrier → cheaper to hedge → higher fair value
  baseFV += (1 - protBarrier) * 8; // barrier 0.5 → +4, barrier 0.7 → +2.4

  // Higher coupon → more expensive → lower fair value
  baseFV -= couponRate * 30; // 8% coupon → -2.4

  // Autocall feature lowers fair value slightly
  if (autocallEnabled) baseFV -= 1.5;

  // Longer maturity → lower fair value (more time = more risk)
  baseFV -= (maturityY - 3) * 0.5;

  // Capital protected → higher fair value
  if (structType === 'CAPITAL_PROTECTED_NOTE') baseFV += 3;

  // Cap reduces cost
  if (cap > 0) baseFV += cap * 5;

  baseFV = clamp(jitter(baseFV, 0.02), 85, 102);

  const issuePrice = 100;
  const expectedReturn = (couponRate * 100).toFixed(2);

  // ── Probabilities ──
  const probAutocall = autocallEnabled
    ? clamp(jitter(0.5 + (1 - autocallBarrier) * 2, 0.1), 0.15, 0.85)
    : 0;

  const probCapitalLoss = clamp(
    jitter(0.05 + (1 - protBarrier) * 0.3, 0.15),
    0.01, 0.35,
  );

  const probMaxLoss = clamp(probCapitalLoss * 0.4, 0.005, 0.15);

  const expectedLife = autocallEnabled
    ? clamp(jitter(maturityY * (1 - probAutocall * 0.6), 0.1), 1, maturityY)
    : maturityY;

  const var95 = clamp(jitter(-15 - (1 - protBarrier) * 40, 0.1), -60, -5);
  const cvar = clamp(var95 * 1.6, -80, var95 - 5);

  // ── Cost breakdown ──
  const execCost = jitter(0.45, 0.2);
  const hedgeCost = jitter(0.40 + couponRate * 2, 0.15);
  const totalCost = structMargin * 100 + distFee * 100 + execCost + hedgeCost;

  // ── Scenario table ──
  const shocks = [-0.40, -0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30, 0.40];
  const scenarioTable = shocks.map((shock) => {
    const spotLevel = Math.round(spot * (1 + shock));
    const finalLevel = 1 + shock;

    let redemption: number;
    if (finalLevel < protBarrier) {
      redemption = Math.round(finalLevel * 100);
    } else {
      redemption = 100;
    }

    const yearsOfCoupons = autocallEnabled && shock >= 0
      ? Math.min(expectedLife, maturityY)
      : maturityY;

    let totalCoupons: number;
    if (finalLevel >= (payoff.couponBarrier ?? protBarrier)) {
      totalCoupons = +(couponRate * 100 * yearsOfCoupons).toFixed(1);
    } else {
      totalCoupons = 0;
    }

    if (cap > 0 && shock > 0) {
      totalCoupons = Math.min(totalCoupons, cap * 100);
    }

    const totalReturn = +(redemption - 100 + totalCoupons).toFixed(1);

    return { spotShock: shock, spotLevel, redemption, totalCoupons, totalReturn };
  });

  // ── Greeks ──
  const delta = clamp(jitter(0.35 + (1 - protBarrier) * 0.3, 0.15), 0.1, 0.9);
  const gamma = clamp(jitter(0.015 + couponRate * 0.1, 0.2), 0.005, 0.08);
  const vega = clamp(jitter(0.12 + (1 - protBarrier) * 0.15, 0.15), 0.03, 0.4);
  const theta = clamp(jitter(-0.02 - couponRate * 0.05, 0.2), -0.15, -0.005);
  const rho = clamp(jitter(0.06 + maturityY * 0.01, 0.15), 0.01, 0.2);

  // ── SRI estimation ──
  let sri: number;
  if (protBarrier >= 0.9) sri = 2;
  else if (protBarrier >= 0.7) sri = 3;
  else if (protBarrier >= 0.6) sri = 4;
  else if (protBarrier >= 0.5) sri = 5;
  else if (protBarrier >= 0.4) sri = 6;
  else sri = 7;

  if (structType === 'CAPITAL_PROTECTED_NOTE') sri = Math.min(sri, 2);

  // ── Compute time simulation ──
  const mcPaths = config.mcPaths ?? 10000;
  const computeTimeMs = Math.round(800 + mcPaths * 0.05 + Math.random() * 500);

  return {
    fairValue: +baseFV.toFixed(2),
    issuePrice,
    expectedReturn,
    computeTimeMs,
    riskSummary: {
      probAutocall: +probAutocall.toFixed(3),
      probCapitalLoss: +probCapitalLoss.toFixed(3),
      probMaxLoss: +probMaxLoss.toFixed(3),
      expectedLife: +expectedLife.toFixed(1),
      valueAtRisk95: +var95.toFixed(1),
      conditionalVaR: +cvar.toFixed(1),
    },
    costBreakdown: {
      structuringMargin: (structMargin * 100).toFixed(2),
      distributionFee: (distFee * 100).toFixed(2),
      executionCost: execCost.toFixed(2),
      hedgingCost: hedgeCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
    },
    scenarioTable,
    greeks: {
      delta: +delta.toFixed(3),
      gamma: +gamma.toFixed(4),
      vega: +vega.toFixed(3),
      theta: +theta.toFixed(4),
      rho: +rho.toFixed(3),
    },
    modelUsed: mcPaths >= 50000 ? 'Monte Carlo (Stochastic Local Vol)' : 'Monte Carlo (Local Vol)',
    assumptions: [
      'Volatilité locale calibrée sur la nappe de marché',
      'Dividendes discrets estimés sur consensus Bloomberg',
      'Corrélation historique 6 mois glissants',
      'Taux sans risque : courbe ESTER interpolée',
      `${(mcPaths ?? 10000).toLocaleString('fr-FR')} trajectoires Monte Carlo`,
    ],
    modelLimitations: [
      'Modèle simplifié — ne capture pas les sauts de volatilité',
      'Estimation indicative — non contractuelle',
      'Sensibilité aux hypothèses de dividendes et de corrélation',
    ],
    sri,
  };
}

// ─── AI Guide Rules Engine ──────────────────────────────────────────────────

export interface AiAdvice {
  type: 'info' | 'warning' | 'success' | 'tip';
  message: string;
}

export function getAiAdvice(config: PricingConfig, step: number): AiAdvice[] {
  const advices: AiAdvice[] = [];
  const payoff = config.payoff ?? {};
  const market = config.market ?? {};
  const structType = config.structureType ?? '';

  // ── Step 0: Structure ──
  if (step === 0) {
    if (!structType) {
      advices.push({ type: 'tip', message: "Commencez par choisir un type de structure. L'Autocall Phoenix est le plus demandé par les CGP en 2026." });
    }
    if (structType === 'PHOENIX_AUTOCALL') {
      advices.push({ type: 'info', message: "Autocall Phoenix : mécanisme de coupon conditionnel avec mémoire et remboursement anticipé. Produit star du marché, 65% des volumes structurés en France." });
    }
    if (structType === 'CAPITAL_PROTECTED_NOTE') {
      advices.push({ type: 'info', message: "Capital Protégé : idéal pour les profils prudents (SRI 1-2). La protection du capital réduit le rendement potentiel mais sécurise l'investissement." });
    }
    if (config.underlying?.name) {
      advices.push({ type: 'success', message: `Sous-jacent sélectionné : ${config.underlying.name}. Spot actuel estimé : ${config.underlying.spot?.toLocaleString('fr-FR')} pts.` });
    }
    const nominal = config.nominalAmount ?? 0;
    if (nominal > 0 && nominal < 100_000) {
      advices.push({ type: 'warning', message: "Montant nominal faible. En dessous de 100k€, les frais fixes pèsent proportionnellement plus sur le rendement." });
    }
  }

  // ── Step 1: Payoff ──
  if (step === 1) {
    const coupon = payoff.couponRate ?? 0;
    const barrier = payoff.protectionBarrier ?? 0;
    const autocall = payoff.autocallBarrier ?? 0;

    if (coupon > 0.10) {
      advices.push({ type: 'warning', message: `Coupon élevé (${(coupon * 100).toFixed(1)}%). Un coupon > 10% implique généralement un SRI ≥ 5 et une barrière basse. Vérifiez l'adéquation avec le profil client.` });
    }
    if (coupon > 0 && coupon <= 0.06) {
      advices.push({ type: 'success', message: `Coupon modéré (${(coupon * 100).toFixed(1)}%). Bon équilibre rendement/risque pour un profil prudent.` });
    }
    if (barrier < 0.5) {
      advices.push({ type: 'warning', message: `Barrière basse (${(barrier * 100).toFixed(0)}%). Risque de perte en capital significatif. Ce produit sera classé SRI 6-7.` });
    }
    if (barrier >= 0.7) {
      advices.push({ type: 'tip', message: `Barrière à ${(barrier * 100).toFixed(0)}% : bonne protection. Pour un profil prudent (SRI ≤ 3), visez ≥ 60%.` });
    }
    if (autocall > 0 && autocall < 0.9) {
      advices.push({ type: 'info', message: `Barrière autocall à ${(autocall * 100).toFixed(0)}% : probabilité de remboursement anticipé élevée (~${(60 + (1 - autocall) * 100).toFixed(0)}%). Durée de vie attendue réduite.` });
    }
    if (payoff.couponMemory) {
      advices.push({ type: 'tip', message: "Effet mémoire activé : les coupons non versés sont rattrapés dès que la condition est remplie. Très apprécié des CGP." });
    }
  }

  // ── Step 2: Market ──
  if (step === 2) {
    const margin = market.structuringMargin ?? 0;
    const dist = market.distributionFee ?? 0;
    const totalFees = (margin + dist) * 100;

    if (totalFees > 5) {
      advices.push({ type: 'warning', message: `Frais totaux élevés (${totalFees.toFixed(1)}%). Au-delà de 5%, le rendement net pour l'investisseur est significativement impacté.` });
    }
    if (totalFees <= 3.5) {
      advices.push({ type: 'success', message: `Frais compétitifs (${totalFees.toFixed(1)}%). Bonne proposition de valeur pour le client final.` });
    }
    const mcPaths = config.mcPaths ?? 10000;
    if (mcPaths < 5000) {
      advices.push({ type: 'warning', message: "Moins de 5 000 trajectoires : résultats peu fiables. Recommandation : ≥ 10 000 pour une estimation stable." });
    }
    if (mcPaths >= 50000) {
      advices.push({ type: 'info', message: "50k+ trajectoires : précision élevée. Modèle Stochastic Local Vol sera utilisé pour un calibrage optimal." });
    }
  }

  // ── Step 3: Results ──
  if (step === 3) {
    advices.push({ type: 'tip', message: "Résultats disponibles. Vous pouvez maintenant lancer une consultation émetteurs pour obtenir des cotations en direct." });

    const barrier = payoff.protectionBarrier ?? 0.6;
    const coupon = payoff.couponRate ?? 0;
    if (barrier >= 0.6 && coupon <= 0.08) {
      advices.push({ type: 'success', message: "Ce profil rendement/risque est bien adapté à une distribution en assurance-vie. Les CGP prudents apprécieront." });
    }
  }

  return advices;
}

// ─── Live Issuer Simulation ─────────────────────────────────────────────────

export interface IssuerQuote {
  id: string;
  issuerName: string;
  issuerLogo: string;
  price: number;
  spread: number;
  fraisEntree: number;
  delaiLivraison: string;
  conditionsSpeciales: string;
  timestamp: number;
  score: number;
}

const ISSUERS = [
  { name: 'BNP Paribas Issuance', logo: 'BNP', bias: 0, spreadBase: 0.8 },
  { name: 'SG Issuer', logo: 'SG', bias: -0.3, spreadBase: 0.9 },
  { name: 'Natixis Structured Issuance', logo: 'NAT', bias: 0.2, spreadBase: 0.7 },
  { name: 'Goldman Sachs International', logo: 'GS', bias: -0.5, spreadBase: 1.1 },
  { name: 'Barclays Capital', logo: 'BARC', bias: 0.1, spreadBase: 1.0 },
];

const CONDITIONS = [
  'Émission standard',
  'Best execution garantie',
  'Livraison J+5',
  'Cotation ferme 2h',
  'Ramp-up possible +20%',
  'Exécution flash sous 1h',
  'Prix ferme jusqu\'à 17h CET',
  'Minimum 500k€ nominal',
];

export function generateIssuerQuotes(fairValue: number): IssuerQuote[] {
  return ISSUERS.map((issuer, i) => {
    const priceVariation = (Math.random() - 0.5) * 3 + issuer.bias;
    const price = +(fairValue + priceVariation).toFixed(2);
    const spread = +(issuer.spreadBase + (Math.random() - 0.5) * 0.4).toFixed(2);
    const fraisEntree = +(0.3 + Math.random() * 0.7).toFixed(2);

    // Score: higher price = better for issuer (closer to 100 = better for client)
    const priceScore = Math.min(100, Math.max(0, (price - (fairValue - 3)) / 6 * 100));
    const spreadScore = Math.max(0, 100 - spread * 50);
    const score = Math.round(priceScore * 0.6 + spreadScore * 0.4);

    return {
      id: `quote-${i}-${Date.now()}`,
      issuerName: issuer.name,
      issuerLogo: issuer.logo,
      price,
      spread,
      fraisEntree,
      delaiLivraison: ['J+3', 'J+5', 'J+5', 'J+7', 'J+5'][i],
      conditionsSpeciales: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
      timestamp: Date.now(),
      score,
    };
  });
}

export function getQuoteDelay(index: number): number {
  // Each issuer responds with increasing delay (2-10 seconds)
  return 2000 + index * 1500 + Math.random() * 2000;
}
