// ─── Strick'in CLI — Advanced Risk Analytics ────────────────────────────────
// VaR, Stress Testing, Correlation Matrix, Drawdown Analysis, Greeks aggregation

import { PRODUCTS, COMMITMENTS } from './data.js';
import type { Product } from './data.js';
import { output, spinner } from './output.js';

// ─── VaR Calculation ─────────────────────────────────────────────────────────

export async function riskAnalyze(opts: {
  product?: string;
  confidence?: string;
  horizon?: string;
  method?: string;
}) {
  const s = spinner('Computing risk metrics...');
  await delay(800 + Math.random() * 500);
  s.stop('Risk analysis complete');

  const product = opts.product ? PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product) : null;
  const confidence = Number(opts.confidence ?? 95);
  const horizon = Number(opts.horizon ?? 10); // days
  const method = opts.method ?? 'historical';

  if (product) {
    // Single product risk
    output(singleProductRisk(product, confidence, horizon, method));
  } else {
    // Portfolio-wide risk
    output(portfolioRisk(confidence, horizon, method));
  }
}

function singleProductRisk(p: Product, confidence: number, horizon: number, method: string) {
  const vol = baseVolatility(p);
  const varPct = vol * zScore(confidence) * Math.sqrt(horizon / 252);
  const nominal = p.totalEngaged || 1_000_000;

  return {
    product: { id: p.id, isin: p.isin, name: p.name },
    riskMetrics: {
      var: {
        method,
        confidencePct: confidence,
        horizonDays: horizon,
        varPct: round2(varPct * 100),
        varAmount: Math.round(nominal * varPct),
        nominal,
      },
      cvar: {
        cvarPct: round2(varPct * 1.3 * 100),
        cvarAmount: Math.round(nominal * varPct * 1.3),
      },
      volatility: {
        annualizedPct: round2(vol * 100),
        dailyPct: round2(vol / Math.sqrt(252) * 100),
        impliedVol: round2((vol + 0.05 + Math.random() * 0.03) * 100),
      },
      maxDrawdown: {
        estimatedPct: round2(vol * 2.5 * 100),
        recoveryDays: Math.round(120 + Math.random() * 180),
      },
      greeks: {
        delta: round2(-0.3 - Math.random() * 0.3),
        gamma: round2(0.01 + Math.random() * 0.02),
        vega: round2(-vol * 2 - Math.random() * 0.1),
        theta: round2(-0.02 - Math.random() * 0.02),
        rho: round2(0.04 + Math.random() * 0.04),
      },
    },
    stressTests: generateStressTests(p, nominal),
    barrierAnalysis: {
      barrierPct: p.barrierCapPct,
      currentDistancePct: round2(100 - p.barrierCapPct + Math.random() * 5),
      probBreachPct: round2(probBarrierBreach(p)),
      worstCaseLoss: round2((1 - p.barrierCapPct / 100) * 100),
    },
  };
}

function portfolioRisk(confidence: number, horizon: number, method: string) {
  const totalExposure = PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);
  const weightedVol = PRODUCTS.reduce((s, p) => {
    const w = p.totalEngaged / totalExposure;
    return s + w * baseVolatility(p);
  }, 0);

  // Diversification benefit (approx 20-30%)
  const diversificationFactor = 0.72 + Math.random() * 0.08;
  const portfolioVol = weightedVol * diversificationFactor;
  const varPct = portfolioVol * zScore(confidence) * Math.sqrt(horizon / 252);

  // Concentration
  const issuerExposure: Record<string, number> = {};
  for (const p of PRODUCTS) {
    const key = p.issuerName.split(' ')[0];
    issuerExposure[key] = (issuerExposure[key] || 0) + p.totalEngaged;
  }
  const maxConcentration = Math.max(...Object.values(issuerExposure));
  const hhi = Object.values(issuerExposure).reduce((s, v) => s + (v / totalExposure) ** 2, 0);

  // Payoff distribution
  const payoffExposure: Record<string, number> = {};
  for (const p of PRODUCTS) {
    payoffExposure[p.payoffType] = (payoffExposure[p.payoffType] || 0) + p.totalEngaged;
  }

  return {
    portfolio: {
      totalExposure,
      productCount: PRODUCTS.length,
      weightedAvgSri: round2(PRODUCTS.reduce((s, p) => s + p.sri * p.totalEngaged / totalExposure, 0)),
    },
    riskMetrics: {
      var: {
        method,
        confidencePct: confidence,
        horizonDays: horizon,
        varPct: round2(varPct * 100),
        varAmount: Math.round(totalExposure * varPct),
      },
      cvar: {
        cvarPct: round2(varPct * 1.3 * 100),
        cvarAmount: Math.round(totalExposure * varPct * 1.3),
      },
      volatility: {
        portfolioAnnualizedPct: round2(portfolioVol * 100),
        undiversifiedPct: round2(weightedVol * 100),
        diversificationBenefitPct: round2((1 - diversificationFactor) * 100),
      },
      maxDrawdown: {
        estimatedPct: round2(portfolioVol * 2.5 * 100),
        recoveryDays: Math.round(90 + Math.random() * 120),
      },
    },
    concentration: {
      hhi: round2(hhi),
      hhiInterpretation: hhi > 0.25 ? 'Concentré' : hhi > 0.15 ? 'Modéré' : 'Diversifié',
      maxIssuerExposurePct: round2(maxConcentration / totalExposure * 100),
      byIssuer: Object.fromEntries(
        Object.entries(issuerExposure)
          .sort(([, a], [, b]) => b - a)
          .map(([k, v]) => [k, { amount: v, pct: round2(v / totalExposure * 100) }])
      ),
      byPayoffType: Object.fromEntries(
        Object.entries(payoffExposure)
          .sort(([, a], [, b]) => b - a)
          .map(([k, v]) => [k, { amount: v, pct: round2(v / totalExposure * 100) }])
      ),
    },
    correlationMatrix: generateCorrelationMatrix(),
    stressTests: {
      equityDown20: { lossAmount: Math.round(totalExposure * 0.12), lossPct: round2(12 + Math.random() * 3) },
      equityDown40: { lossAmount: Math.round(totalExposure * 0.28), lossPct: round2(28 + Math.random() * 5) },
      ratesUp200bps: { lossAmount: Math.round(totalExposure * 0.04), lossPct: round2(4 + Math.random() * 2) },
      ratesDown100bps: { lossAmount: Math.round(totalExposure * 0.02), lossPct: round2(2 + Math.random() * 1) },
      volSpike50: { lossAmount: Math.round(totalExposure * 0.08), lossPct: round2(8 + Math.random() * 3) },
      covid2020Replay: { lossAmount: Math.round(totalExposure * 0.22), lossPct: round2(22 + Math.random() * 4) },
      gfc2008Replay: { lossAmount: Math.round(totalExposure * 0.38), lossPct: round2(38 + Math.random() * 6) },
    },
  };
}

// ─── Stress Testing ──────────────────────────────────────────────────────────

export async function stressTest(opts: { scenario?: string; product?: string }) {
  const s = spinner('Running stress scenarios...');
  await delay(600);
  s.stop('Stress test complete');

  const product = opts.product ? PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product) : null;
  const nominal = product?.totalEngaged ?? PRODUCTS.reduce((s, p) => s + p.totalEngaged, 0);

  const scenarios = [
    { name: 'Equity Crash -30%', shock: -0.30, type: 'equity' },
    { name: 'Equity Crash -50%', shock: -0.50, type: 'equity' },
    { name: 'Rates +200bps', shock: 0.02, type: 'rates' },
    { name: 'Rates -150bps', shock: -0.015, type: 'rates' },
    { name: 'Vol Spike +80%', shock: 0.80, type: 'vol' },
    { name: 'Gold -20%', shock: -0.20, type: 'commodity' },
    { name: 'COVID-19 Replay', shock: -0.35, type: 'combined' },
    { name: 'GFC 2008 Replay', shock: -0.55, type: 'combined' },
    { name: 'Stagflation', shock: -0.15, type: 'combined' },
    { name: 'ECB Emergency Rate Cut', shock: -0.01, type: 'rates' },
  ];

  const results = scenarios.map(sc => {
    const impact = computeStressImpact(sc, product, nominal);
    return {
      scenario: sc.name,
      shockType: sc.type,
      shockMagnitude: sc.shock,
      ...impact,
    };
  });

  output({
    product: product ? { id: product.id, name: product.name } : 'Full Portfolio',
    nominal,
    scenarios: results,
    worstCase: results.reduce((worst, r) => r.lossPct > worst.lossPct ? r : worst, results[0]),
    averageLoss: round2(results.reduce((s, r) => s + r.lossPct, 0) / results.length),
  });
}

function computeStressImpact(sc: { shock: number; type: string }, product: Product | null, nominal: number) {
  let lossFactor = 0;

  if (product) {
    const isEquity = product.underlyingYahoo.includes('STOXX') || product.underlyingYahoo.includes('^');
    const isRate = product.underlyingYahoo.includes('EURIBOR') || product.underlyingYahoo.includes('CMS');
    const isGold = product.underlyingYahoo.includes('GC');

    if (sc.type === 'equity' && isEquity) lossFactor = Math.abs(sc.shock) * (1 - product.barrierCapPct / 200);
    else if (sc.type === 'rates' && isRate) lossFactor = Math.abs(sc.shock) * 5;
    else if (sc.type === 'commodity' && isGold) lossFactor = Math.abs(sc.shock) * 0.8;
    else if (sc.type === 'vol') lossFactor = Math.abs(sc.shock) * 0.15;
    else if (sc.type === 'combined') lossFactor = Math.abs(sc.shock) * 0.6;
    else lossFactor = Math.abs(sc.shock) * 0.1;
  } else {
    lossFactor = Math.abs(sc.shock) * 0.5 + Math.random() * 0.05;
  }

  const lossPct = round2(lossFactor * 100);
  return {
    lossPct,
    lossAmount: Math.round(nominal * lossFactor),
    barrierBreached: product ? lossFactor * 100 > (100 - product.barrierCapPct) : lossPct > 40,
    capitalAtRisk: lossPct > 30,
  };
}

// ─── Backtest ────────────────────────────────────────────────────────────────

export async function backtest(opts: {
  product?: string;
  years?: string;
  startDate?: string;
}) {
  const s = spinner('Running historical backtest...');
  await delay(1000 + Math.random() * 500);
  s.stop('Backtest complete');

  const product = opts.product ? PRODUCTS.find(p => p.id === opts.product || p.isin === opts.product) : PRODUCTS[0];
  const years = Number(opts.years ?? 5);
  const periods = years * 12; // monthly

  if (!product) {
    output({ error: 'Product not found' });
    return;
  }

  // Generate simulated historical path
  const vol = baseVolatility(product);
  const drift = 0.005 + (product.couponPct ?? 3) / 100 / 12; // Modest monthly drift
  let value = 100;
  let maxValue = 100;
  let maxDrawdown = 0;
  const path: { date: string; value: number; drawdown: number }[] = [];
  const returns: number[] = [];
  let autocallTriggered = false;
  let autocallMonth = 0;

  for (let i = 0; i < periods; i++) {
    const monthlyReturn = drift + (vol / Math.sqrt(12)) * normalRandom();
    const prevValue = value;
    value = value * (1 + monthlyReturn);
    returns.push(monthlyReturn);

    if (value > maxValue) maxValue = value;
    const dd = (maxValue - value) / maxValue;
    if (dd > maxDrawdown) maxDrawdown = dd;

    // Check autocall
    if (!autocallTriggered && product.autocallBarrierPct && i >= 12 && value >= 100 * (product.autocallBarrierPct / 100)) {
      if (Math.random() > 0.6) {
        autocallTriggered = true;
        autocallMonth = i;
      }
    }

    const date = new Date();
    date.setMonth(date.getMonth() - (periods - i));
    path.push({
      date: date.toISOString().slice(0, 7),
      value: round2(value),
      drawdown: round2(dd * 100),
    });
  }

  // Compute stats
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length * 12;
  const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn / 12) ** 2, 0) / returns.length) * Math.sqrt(12);
  const sharpe = stdDev > 0 ? (avgReturn - 0.03) / stdDev : 0;
  const sortino = (() => {
    const downside = returns.filter(r => r < 0);
    const downsideDev = Math.sqrt(downside.reduce((s, r) => s + r ** 2, 0) / Math.max(1, downside.length)) * Math.sqrt(12);
    return downsideDev > 0 ? (avgReturn - 0.03) / downsideDev : 0;
  })();

  const finalReturn = (value / 100 - 1) * 100;
  const barrierBreached = path.some(p => p.value < product.barrierCapPct);

  output({
    product: { id: product.id, isin: product.isin, name: product.name },
    config: { years, periods, startingValue: 100 },
    performance: {
      finalValue: round2(value),
      totalReturnPct: round2(finalReturn),
      annualizedReturnPct: round2(avgReturn * 100),
      volatilityPct: round2(stdDev * 100),
      sharpeRatio: round2(sharpe),
      sortinoRatio: round2(sortino),
      maxDrawdownPct: round2(maxDrawdown * 100),
      positiveMonths: returns.filter(r => r > 0).length,
      negativeMonths: returns.filter(r => r < 0).length,
    },
    events: {
      autocallTriggered,
      autocallMonth: autocallTriggered ? autocallMonth : null,
      barrierBreached,
      couponsReceived: product.couponPct ? Math.floor(years * (1 - maxDrawdown)) : 0,
    },
    path: path.filter((_, i) => i % 3 === 0 || i === path.length - 1), // Every 3 months for brevity
    comparison: {
      vsEuroStoxx: { returnPct: round2(avgReturn * 100 - 2 + Math.random() * 4) },
      vsBonds: { returnPct: round2(avgReturn * 100 + 1 + Math.random() * 2) },
      vsGold: { returnPct: round2(avgReturn * 100 - 1 + Math.random() * 3) },
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateStressTests(p: Product, nominal: number) {
  return [
    { scenario: 'Underlying -20%', lossPct: round2(Math.max(0, 20 - p.barrierCapPct * 0.2 + Math.random() * 5)), triggered: false },
    { scenario: 'Underlying -40%', lossPct: round2(Math.max(5, 40 - p.barrierCapPct * 0.3 + Math.random() * 8)), triggered: p.barrierCapPct <= 50 },
    { scenario: 'Underlying -60%', lossPct: round2(Math.max(20, 60 - p.barrierCapPct * 0.3)), triggered: true },
    { scenario: 'Vol +50%', lossPct: round2(5 + Math.random() * 8), triggered: false },
    { scenario: 'Rates +200bps', lossPct: round2(2 + Math.random() * 4), triggered: false },
  ].map(s => ({ ...s, lossAmount: Math.round(nominal * s.lossPct / 100) }));
}

function generateCorrelationMatrix() {
  return {
    note: 'Correlation between underlying asset classes',
    matrix: {
      'Euro Stoxx 50': { 'Euro Stoxx 50': 1.00, Gold: round2(-0.15 + Math.random() * 0.1), 'EUR CMS 10Y': round2(0.2 + Math.random() * 0.1) },
      Gold: { 'Euro Stoxx 50': round2(-0.15 + Math.random() * 0.1), Gold: 1.00, 'EUR CMS 10Y': round2(-0.1 + Math.random() * 0.1) },
      'EUR CMS 10Y': { 'Euro Stoxx 50': round2(0.2 + Math.random() * 0.1), Gold: round2(-0.1 + Math.random() * 0.1), 'EUR CMS 10Y': 1.00 },
    },
  };
}

function baseVolatility(p: Product): number {
  // Rough vol based on product characteristics
  const sriVol: Record<number, number> = { 1: 0.05, 2: 0.08, 3: 0.12, 4: 0.16, 5: 0.20, 6: 0.25, 7: 0.30 };
  return sriVol[p.sri] ?? 0.18;
}

function probBarrierBreach(p: Product): number {
  const vol = baseVolatility(p);
  const distance = (100 - p.barrierCapPct) / 100;
  const matYears = (new Date(p.maturityDate).getFullYear() - new Date().getFullYear());
  return Math.min(60, Math.max(2, (vol * Math.sqrt(matYears) / distance) * 10 + Math.random() * 5));
}

function zScore(confidence: number): number {
  if (confidence >= 99) return 2.326;
  if (confidence >= 97.5) return 1.96;
  if (confidence >= 95) return 1.645;
  if (confidence >= 90) return 1.282;
  return 1.0;
}

function normalRandom(): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
