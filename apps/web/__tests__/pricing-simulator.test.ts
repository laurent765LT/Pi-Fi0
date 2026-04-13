import { describe, it, expect } from 'vitest';
import { simulatePricing, PricingConfig } from '../lib/pricing-simulator';

function makeConfig(overrides: Partial<PricingConfig> = {}): PricingConfig {
  return {
    structureType: 'PHOENIX_AUTOCALL',
    currency: 'EUR',
    nominalAmount: 500_000,
    underlying: { name: 'Euro Stoxx 50', spot: 4800, ticker: 'SX5E' },
    payoff: {
      couponType: 'PHOENIX',
      couponRate: 0.08,
      couponBarrier: 0.6,
      couponMemory: true,
      autocallEnabled: true,
      autocallBarrier: 1.0,
      protectionBarrier: 0.6,
      barrierMonitoring: 'CLOSING',
    },
    market: {
      riskFreeRate: 0.03,
      fundingSpread: 0.005,
      structuringMargin: 0.015,
      distributionFee: 0.02,
    },
    mcPaths: 10_000,
    maturityYears: 5,
    ...overrides,
  };
}

describe('simulatePricing', () => {
  it('returns a valid SimulatedResult shape with all required fields', () => {
    const result = simulatePricing(makeConfig());

    expect(result).toHaveProperty('fairValue');
    expect(result).toHaveProperty('issuePrice');
    expect(result).toHaveProperty('expectedReturn');
    expect(result).toHaveProperty('computeTimeMs');
    expect(result).toHaveProperty('riskSummary');
    expect(result).toHaveProperty('costBreakdown');
    expect(result).toHaveProperty('scenarioTable');
    expect(result).toHaveProperty('greeks');
    expect(result).toHaveProperty('modelUsed');
    expect(result).toHaveProperty('assumptions');
    expect(result).toHaveProperty('modelLimitations');
    expect(result).toHaveProperty('sri');
  });

  it('fair value is between 85 and 102', () => {
    // Run multiple times due to jitter
    for (let i = 0; i < 50; i++) {
      const result = simulatePricing(makeConfig());
      expect(result.fairValue).toBeGreaterThanOrEqual(85);
      expect(result.fairValue).toBeLessThanOrEqual(102);
    }
  });

  it('issue price is always 100', () => {
    const result = simulatePricing(makeConfig());
    expect(result.issuePrice).toBe(100);
  });

  it('risk summary probabilities are between 0 and 1', () => {
    for (let i = 0; i < 20; i++) {
      const { riskSummary } = simulatePricing(makeConfig());
      expect(riskSummary.probAutocall).toBeGreaterThanOrEqual(0);
      expect(riskSummary.probAutocall).toBeLessThanOrEqual(1);
      expect(riskSummary.probCapitalLoss).toBeGreaterThanOrEqual(0);
      expect(riskSummary.probCapitalLoss).toBeLessThanOrEqual(1);
      expect(riskSummary.probMaxLoss).toBeGreaterThanOrEqual(0);
      expect(riskSummary.probMaxLoss).toBeLessThanOrEqual(1);
    }
  });

  it('greeks are within expected ranges', () => {
    for (let i = 0; i < 20; i++) {
      const { greeks } = simulatePricing(makeConfig());
      expect(greeks.delta).toBeGreaterThanOrEqual(0.1);
      expect(greeks.delta).toBeLessThanOrEqual(0.9);
      expect(greeks.gamma).toBeGreaterThanOrEqual(0.005);
      expect(greeks.gamma).toBeLessThanOrEqual(0.08);
      expect(greeks.vega).toBeGreaterThanOrEqual(0.03);
      expect(greeks.vega).toBeLessThanOrEqual(0.4);
      expect(greeks.theta).toBeGreaterThanOrEqual(-0.15);
      expect(greeks.theta).toBeLessThanOrEqual(-0.005);
      expect(greeks.rho).toBeGreaterThanOrEqual(0.01);
      expect(greeks.rho).toBeLessThanOrEqual(0.2);
    }
  });

  it('SRI is between 1 and 7', () => {
    const result = simulatePricing(makeConfig());
    expect(result.sri).toBeGreaterThanOrEqual(1);
    expect(result.sri).toBeLessThanOrEqual(7);
  });

  it('capital protected structure has SRI <= 2', () => {
    const result = simulatePricing(
      makeConfig({ structureType: 'CAPITAL_PROTECTED_NOTE' }),
    );
    expect(result.sri).toBeLessThanOrEqual(2);
  });

  it('higher coupon rate decreases fair value on average', () => {
    const trials = 100;
    let lowCouponSum = 0;
    let highCouponSum = 0;

    for (let i = 0; i < trials; i++) {
      const low = simulatePricing(
        makeConfig({ payoff: { ...makeConfig().payoff, couponRate: 0.04 } }),
      );
      const high = simulatePricing(
        makeConfig({ payoff: { ...makeConfig().payoff, couponRate: 0.12 } }),
      );
      lowCouponSum += low.fairValue;
      highCouponSum += high.fairValue;
    }

    expect(lowCouponSum / trials).toBeGreaterThan(highCouponSum / trials);
  });

  it('lower barrier increases capital loss probability on average', () => {
    const trials = 100;
    let highBarrierSum = 0;
    let lowBarrierSum = 0;

    for (let i = 0; i < trials; i++) {
      const highBarrier = simulatePricing(
        makeConfig({ payoff: { ...makeConfig().payoff, protectionBarrier: 0.8 } }),
      );
      const lowBarrier = simulatePricing(
        makeConfig({ payoff: { ...makeConfig().payoff, protectionBarrier: 0.4 } }),
      );
      highBarrierSum += highBarrier.riskSummary.probCapitalLoss;
      lowBarrierSum += lowBarrier.riskSummary.probCapitalLoss;
    }

    expect(lowBarrierSum / trials).toBeGreaterThan(highBarrierSum / trials);
  });

  it('scenario table has 9 entries', () => {
    const result = simulatePricing(makeConfig());
    expect(result.scenarioTable).toHaveLength(9);
  });

  it('cost breakdown total is approximately sum of parts', () => {
    const { costBreakdown } = simulatePricing(makeConfig());
    const total = parseFloat(costBreakdown.totalCost);
    const sum =
      parseFloat(costBreakdown.structuringMargin) +
      parseFloat(costBreakdown.distributionFee) +
      parseFloat(costBreakdown.executionCost) +
      parseFloat(costBreakdown.hedgingCost);

    expect(total).toBeCloseTo(sum, 1);
  });
});
