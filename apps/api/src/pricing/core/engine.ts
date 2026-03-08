// ═══════════════════════════════════════════════════════════════════════════════
// PRICING ENGINE — Main Engine Orchestrator
// Monte Carlo simulation for path-dependent structured products
// ═══════════════════════════════════════════════════════════════════════════════

import {
  type StructuredProductConfig,
  type PricingResult,
  type ScenarioRow,
  type CostBreakdown,
  type RiskSummary,
  type GreeksApprox,
  type PayoffPoint,
} from './types';

import {
  createRng,
  generateGBMPath,
  generateCorrelatedPaths,
  discount,
  yearFraction,
  bsCall,
  bsPut,
  bsGreeks,
  zeroCouponBond,
} from './math';

// ── Path Evaluation Result ───────────────────────────────────────────────────

interface PathResult {
  redemption: number;       // terminal redemption %
  totalCoupons: number;     // total coupons paid %
  autocalled: boolean;
  autocallPeriod: number;   // period of autocall (0 if not autocalled)
  barrierBreached: boolean;
  couponsPaid: number;      // number of coupon periods paid
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function priceStructuredProduct(config: StructuredProductConfig): PricingResult {
  const startTime = performance.now();
  const warnings: string[] = [];
  const assumptions: string[] = [];
  const modelLimitations: string[] = [];

  // ── Determine model ───────────────────────────────────────────────────────
  const isPathDependent = config.payoff.autocallEnabled ||
    config.payoff.couponType === 'CONDITIONAL' ||
    config.payoff.couponType === 'MEMORY' ||
    config.payoff.barrierMonitoring === 'CONTINUOUS';

  const hasBasket = !!config.basket && config.basket.components.length > 1;
  const modelUsed = isPathDependent ? 'MONTE_CARLO' : 'SEMI_ANALYTICAL';

  assumptions.push('Geometric Brownian Motion for all underlyings');
  assumptions.push('Flat volatility surface (no skew/smile)');
  assumptions.push('Continuous dividend yield');
  assumptions.push('Constant risk-free rate');
  assumptions.push(`Day count convention: ${config.schedule.dayCountConvention}`);

  if (hasBasket) {
    assumptions.push('Constant correlation between basket components');
    modelLimitations.push('Correlation is assumed constant — real markets exhibit time-varying correlation');
  }

  modelLimitations.push('No credit risk modeling (issuer default not simulated)');
  modelLimitations.push('No stochastic volatility — may underestimate tail risks');
  modelLimitations.push('No jump diffusion — sudden market crashes not modeled');

  if (config.payoff.barrierMonitoring === 'CONTINUOUS') {
    modelLimitations.push('Continuous barrier approximated by daily monitoring');
    warnings.push('Continuous barrier monitoring is simulated with daily steps — real continuous monitoring would require adjustment');
  }

  // ── Compute time parameters ───────────────────────────────────────────────
  const T = yearFraction(
    config.schedule.strikeDate,
    config.schedule.maturityDate,
    config.schedule.dayCountConvention,
  );

  if (T <= 0) {
    warnings.push('Product has already matured or invalid dates');
  }

  const stepsPerYear = config.observationFrequency === 'DAILY' ? 252 :
    config.observationFrequency === 'WEEKLY' ? 52 : 12;
  const totalSteps = Math.max(1, Math.round(T * stepsPerYear));

  // ── Monte Carlo Simulation ────────────────────────────────────────────────
  const numPaths = config.mcPaths || 10000;
  const rng = createRng(config.mcSeed || 42);

  const pathResults: PathResult[] = [];
  let totalFairValueSum = 0;

  for (let p = 0; p < numPaths; p++) {
    let path: number[];

    if (hasBasket) {
      const basket = config.basket!;
      const underlyings = basket.components.map((c) => ({
        S0: c.underlying.spot / c.underlying.strikeLevel, // normalized to 1
        r: config.market.riskFreeRate,
        q: c.underlying.dividendYield,
        sigma: c.underlying.volatility,
      }));

      const paths = generateCorrelatedPaths(
        underlyings,
        basket.correlationMatrix,
        T,
        totalSteps,
        rng,
      );

      // Compute basket value at each step based on basket type
      path = new Array(totalSteps + 1);
      for (let t = 0; t <= totalSteps; t++) {
        if (basket.type === 'WORST_OF') {
          path[t] = Math.min(...paths.map((pth, i) => pth[t]! / 1.0)); // already normalized
        } else if (basket.type === 'BEST_OF') {
          path[t] = Math.max(...paths.map((pth) => pth[t]!));
        } else {
          // Equal or custom weighted average
          path[t] = paths.reduce((sum, pth, i) =>
            sum + pth[t]! * basket.components[i]!.weight, 0);
        }
      }
    } else {
      // Single underlying
      const rawPath = generateGBMPath(
        config.underlying.spot,
        config.market.riskFreeRate,
        config.underlying.dividendYield,
        config.underlying.volatility,
        T,
        totalSteps,
        rng,
      );
      // Normalize to strike level
      path = rawPath.map((v) => v / config.underlying.strikeLevel);
    }

    // Evaluate payoff along the path
    const result = evaluatePath(path, config, T, totalSteps);
    pathResults.push(result);

    // Discount the total cashflow
    const autocallTime = result.autocalled
      ? (result.autocallPeriod / totalSteps) * T
      : T;
    const discountedRedemption = discount(
      result.redemption,
      config.market.riskFreeRate + config.market.fundingSpread,
      autocallTime,
    );
    const discountedCoupons = result.totalCoupons * 0.98; // simplified discounting
    totalFairValueSum += discountedRedemption + discountedCoupons;
  }

  // ── Aggregate results ─────────────────────────────────────────────────────
  const fairValue = (totalFairValueSum / numPaths) * 100; // as percentage of nominal

  // Cost breakdown
  const costBreakdown: CostBreakdown = {
    structuringMargin: config.market.structuringMargin * 100,
    distributionFee: config.market.distributionFee * 100,
    executionCost: config.market.executionCost * 100,
    hedgingCost: 0.25, // estimated
    totalCost: (config.market.structuringMargin + config.market.distributionFee +
      config.market.executionCost) * 100 + 0.25,
  };

  const issuePrice = Math.max(90, Math.min(110, fairValue - costBreakdown.totalCost));

  // Risk summary from MC paths
  const autocallCount = pathResults.filter((r) => r.autocalled).length;
  const couponPaidCount = pathResults.filter((r) => r.totalCoupons > 0).length;
  const capitalLossCount = pathResults.filter((r) => r.redemption < 1).length;
  const barrierBreachCount = pathResults.filter((r) => r.barrierBreached).length;

  const allReturns = pathResults.map((r) =>
    (r.redemption + r.totalCoupons - 1) * 100);
  allReturns.sort((a, b) => a - b);

  const riskSummary: RiskSummary = {
    probAutocall: autocallCount / numPaths,
    probCouponPayment: couponPaidCount / numPaths,
    probCapitalLoss: capitalLossCount / numPaths,
    probBarrierBreach: barrierBreachCount / numPaths,
    expectedLossGivenDefault: capitalLossCount > 0
      ? pathResults
          .filter((r) => r.redemption < 1)
          .reduce((sum, r) => sum + (1 - r.redemption), 0) / capitalLossCount * 100
      : 0,
    valueAtRisk95: -(allReturns[Math.floor(numPaths * 0.05)] ?? 0),
    conditionalVaR95: -(
      allReturns.slice(0, Math.floor(numPaths * 0.05))
        .reduce((s, v) => s + v, 0) / Math.max(1, Math.floor(numPaths * 0.05))
    ),
  };

  // Expected values
  const avgRedemption = pathResults.reduce((s, r) => s + r.redemption, 0) / numPaths;
  const avgCoupons = pathResults.reduce((s, r) => s + r.totalCoupons, 0) / numPaths;
  const expectedReturn = (avgRedemption + avgCoupons - 1) * 100;
  const annualizedReturn = T > 0 ? (Math.pow(avgRedemption + avgCoupons, 1 / T) - 1) * 100 : 0;
  const maxGain = Math.max(...allReturns);
  const maxLoss = Math.min(...allReturns);

  // Greeks (approximated via bump-and-reprice for MC products)
  const greeksApprox = approximateGreeks(config, fairValue);

  // Indicative coupon
  const indicativeCoupon = config.payoff.couponRate > 0
    ? config.payoff.couponRate * 100
    : null;

  // Scenario table (spot shocks)
  const scenarioTable = generateScenarioTable(config, pathResults, numPaths, T);

  // Payoff chart
  const payoffChartData = generatePayoffChart(config);

  const computeTimeMs = Math.round(performance.now() - startTime);

  return {
    fairValue: Math.round(fairValue * 100) / 100,
    issuePrice: Math.round(issuePrice * 100) / 100,
    indicativeCoupon,
    expectedRedemption: Math.round(avgRedemption * 10000) / 100,
    expectedReturn: Math.round(expectedReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    breakEven: config.payoff.couponRate > 0
      ? Math.round((1 - config.payoff.protectionBarrier) * 10000) / 100
      : null,
    maxGain: Math.round(maxGain * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    scenarioTable,
    costBreakdown,
    riskSummary,
    greeksApprox,
    payoffChartData,
    modelUsed,
    modelLimitations,
    assumptions,
    warnings,
    computeTimeMs,
  };
}

// ── Path Evaluator ───────────────────────────────────────────────────────────

function evaluatePath(
  normalizedPath: number[], // path normalized to strike (1.0 = at strike)
  config: StructuredProductConfig,
  T: number,
  totalSteps: number,
): PathResult {
  const payoff = config.payoff;
  let autocalled = false;
  let autocallPeriod = 0;
  let totalCoupons = 0;
  let couponsPaid = 0;
  let barrierBreached = false;
  let missedCoupons = 0; // for memory coupon

  // Determine observation steps
  const couponSteps = getCouponObservationSteps(payoff.couponFrequency, T, totalSteps);
  const autocallSteps = payoff.autocallEnabled
    ? getCouponObservationSteps('QUARTERLY', T, totalSteps) // autocall typically quarterly
    : [];

  // Check barrier breach (European = at maturity, Continuous = any step)
  if (payoff.barrierMonitoring === 'CONTINUOUS' || payoff.barrierMonitoring === 'DAILY_CLOSE') {
    for (let t = 1; t <= totalSteps; t++) {
      if (normalizedPath[t]! <= payoff.knockInLevel || normalizedPath[t]! <= payoff.protectionBarrier) {
        barrierBreached = true;
        break;
      }
    }
  }

  // Check autocall at each observation date
  if (payoff.autocallEnabled) {
    for (let i = 0; i < autocallSteps.length; i++) {
      const step = autocallSteps[i]!;
      if (step > totalSteps) break;

      const barrier = payoff.autocallStepDown.length > i
        ? payoff.autocallStepDown[i]!
        : payoff.autocallBarrier;

      if (normalizedPath[step]! >= barrier) {
        autocalled = true;
        autocallPeriod = step;

        // Pay any remaining coupons up to autocall
        const couponsUpToAutocall = couponSteps.filter((s) => s <= step).length;
        if (payoff.couponType !== 'NONE') {
          const perPeriodCoupon = payoff.couponRate / couponFrequencyMultiplier(payoff.couponFrequency);
          totalCoupons += couponsUpToAutocall * perPeriodCoupon;
          couponsPaid = couponsUpToAutocall;
        }
        break;
      }
    }
  }

  // Evaluate coupons (if not autocalled)
  if (!autocalled && payoff.couponType !== 'NONE') {
    const perPeriodCoupon = payoff.couponRate / couponFrequencyMultiplier(payoff.couponFrequency);

    for (let i = 0; i < couponSteps.length; i++) {
      const step = couponSteps[i]!;
      if (step > totalSteps) break;

      const spotAtObs = normalizedPath[step]!;

      if (payoff.couponType === 'FIXED') {
        totalCoupons += perPeriodCoupon;
        couponsPaid++;
      } else if (payoff.couponType === 'CONDITIONAL') {
        if (spotAtObs >= payoff.couponBarrier) {
          totalCoupons += perPeriodCoupon;
          couponsPaid++;
        }
      } else if (payoff.couponType === 'MEMORY') {
        if (spotAtObs >= payoff.couponBarrier) {
          // Pay current + all missed coupons
          totalCoupons += perPeriodCoupon * (1 + missedCoupons);
          couponsPaid += 1 + missedCoupons;
          missedCoupons = 0;
        } else {
          missedCoupons++;
        }
      }
    }
  }

  // Terminal redemption
  let redemption: number;
  const terminalLevel = normalizedPath[totalSteps]!;

  if (autocalled) {
    redemption = 1.0; // 100% at autocall
  } else if (payoff.protectionType === 'FULL' || payoff.capitalGuaranteeLevel >= 1.0) {
    // Fully capital protected
    const upside = Math.max(0, terminalLevel - payoff.strike) * payoff.participationUp;
    const cappedUpside = payoff.cap > 0 ? Math.min(upside, payoff.cap) : upside;
    redemption = payoff.capitalGuaranteeLevel + cappedUpside;
  } else if (payoff.protectionType === 'BARRIER') {
    // European barrier check
    if (payoff.barrierMonitoring === 'EUROPEAN') {
      barrierBreached = terminalLevel < payoff.protectionBarrier;
    }

    if (barrierBreached) {
      // Barrier breached: investor bears full downside
      redemption = Math.max(0, terminalLevel / payoff.strike);
    } else if (terminalLevel >= payoff.strike) {
      // Above strike: 100% redemption (or with upside participation)
      const upside = (terminalLevel - payoff.strike) * payoff.participationUp;
      const cappedUpside = payoff.cap > 0 ? Math.min(upside, payoff.cap) : upside;
      redemption = 1.0 + cappedUpside;
    } else {
      // Between barrier and strike: 100% redemption
      redemption = 1.0;
    }
  } else {
    // No protection: linear payoff
    redemption = Math.max(0, terminalLevel / payoff.strike);
  }

  return {
    redemption,
    totalCoupons,
    autocalled,
    autocallPeriod,
    barrierBreached,
    couponsPaid,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCouponObservationSteps(
  frequency: string,
  T: number,
  totalSteps: number,
): number[] {
  const periodsPerYear = couponFrequencyMultiplier(frequency);
  const totalPeriods = Math.floor(T * periodsPerYear);
  const steps: number[] = [];

  for (let i = 1; i <= totalPeriods; i++) {
    const t = (i / periodsPerYear) / T;
    steps.push(Math.round(t * totalSteps));
  }

  return steps.filter((s) => s > 0 && s <= totalSteps);
}

function couponFrequencyMultiplier(freq: string): number {
  switch (freq) {
    case 'MONTHLY': return 12;
    case 'QUARTERLY': return 4;
    case 'SEMI_ANNUAL': return 2;
    case 'ANNUAL':
    default: return 1;
  }
}

function approximateGreeks(
  config: StructuredProductConfig,
  fairValue: number,
): GreeksApprox {
  // Approximate Greeks via BS decomposition (bond + option)
  const S = config.underlying.spot;
  const K = config.underlying.strikeLevel;
  const T = yearFraction(config.schedule.strikeDate, config.schedule.maturityDate);
  const r = config.market.riskFreeRate;
  const q = config.underlying.dividendYield;
  const sigma = config.underlying.volatility;

  const bsParams = { S, K, T: Math.max(T, 0.01), r, q, sigma };
  const greeks = bsGreeks(bsParams, true);

  // Scale by participation and adjust for structured nature
  const participation = config.payoff.participationUp;

  return {
    delta: Math.round(greeks.delta * participation * 10000) / 10000,
    gamma: Math.round(greeks.gamma * participation * 10000) / 10000,
    vega: Math.round(greeks.vega * participation * 100) / 100,
    theta: Math.round(greeks.theta * participation * 100) / 100,
    rho: Math.round(greeks.rho * 100) / 100,
  };
}

function generateScenarioTable(
  config: StructuredProductConfig,
  pathResults: PathResult[],
  numPaths: number,
  T: number,
): ScenarioRow[] {
  const shocks = [-0.50, -0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30, 0.50];
  const strike = config.underlying.strikeLevel;

  return shocks.map((shock) => {
    const spotLevel = strike * (1 + shock);
    const normalizedLevel = 1 + shock;

    // Determine terminal payoff at this spot level
    let redemption: number;
    const payoff = config.payoff;

    if (payoff.capitalGuaranteeLevel >= 1.0) {
      const upside = Math.max(0, normalizedLevel - 1) * payoff.participationUp;
      const cappedUpside = payoff.cap > 0 ? Math.min(upside, payoff.cap) : upside;
      redemption = 1.0 + cappedUpside;
    } else if (normalizedLevel < payoff.protectionBarrier) {
      redemption = normalizedLevel;
    } else if (normalizedLevel >= 1) {
      redemption = 1.0;
    } else {
      redemption = 1.0;
    }

    const annualCoupon = payoff.couponRate;
    const totalCoupons = normalizedLevel >= payoff.couponBarrier
      ? annualCoupon * T : 0;
    const totalReturn = (redemption + totalCoupons - 1) * 100;
    const annualizedReturn = T > 0
      ? (Math.pow(redemption + totalCoupons, 1 / T) - 1) * 100 : 0;

    return {
      spotShock: shock,
      spotLevel: Math.round(spotLevel * 100) / 100,
      redemption: Math.round(redemption * 10000) / 100,
      totalCoupons: Math.round(totalCoupons * 10000) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      autocallProbability: shock >= 0 ? pathResults.filter((r) => r.autocalled).length / numPaths : 0,
      couponProbability: normalizedLevel >= payoff.couponBarrier ? 1 : 0,
      capitalLossProbability: normalizedLevel < payoff.protectionBarrier ? 1 : 0,
    };
  });
}

function generatePayoffChart(config: StructuredProductConfig): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  const payoff = config.payoff;

  for (let pct = 0; pct <= 200; pct += 2) {
    const normalizedSpot = pct / 100;
    let payoffValue: number;

    if (payoff.capitalGuaranteeLevel >= 1.0) {
      // Capital protected
      const upside = Math.max(0, normalizedSpot - payoff.strike) * payoff.participationUp;
      const cappedUpside = payoff.cap > 0 ? Math.min(upside, payoff.cap) : upside;
      payoffValue = (payoff.capitalGuaranteeLevel + cappedUpside) * 100;
    } else if (normalizedSpot < payoff.protectionBarrier) {
      // Below barrier
      payoffValue = normalizedSpot * 100;
    } else if (normalizedSpot >= payoff.strike) {
      // Above strike
      const upside = (normalizedSpot - payoff.strike) * payoff.participationUp;
      const cappedUpside = payoff.cap > 0 ? Math.min(upside, payoff.cap) : upside;
      payoffValue = (1 + cappedUpside) * 100;
    } else {
      // Between barrier and strike
      payoffValue = 100;
    }

    points.push({
      spot: pct,
      payoff: Math.round(payoffValue * 100) / 100,
    });
  }

  return points;
}
