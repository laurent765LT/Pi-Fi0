import { describe, it, expect } from 'vitest';
import { loginSchema, commitmentSchema, pricingConfigSchema } from '../lib/validations';

// ─── loginSchema ────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@strickin.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a short password (< 6 chars)', () => {
    const result = loginSchema.safeParse({
      email: 'user@strickin.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });
});

// ─── commitmentSchema ───────────────────────────────────────────────────────

describe('commitmentSchema', () => {
  const validCommitment = {
    shelfId: 'shelf-001',
    amount: 50_000,
    contractType: 'ASSURANCE_VIE' as const,
    insurerEnvelope: 'AXA France Vie',
    clientCount: 1,
    kidAcknowledged: true as const,
  };

  it('accepts valid commitment data', () => {
    const result = commitmentSchema.safeParse(validCommitment);
    expect(result.success).toBe(true);
  });

  it('rejects amount below 1000', () => {
    const result = commitmentSchema.safeParse({
      ...validCommitment,
      amount: 500,
    });
    expect(result.success).toBe(false);
  });

  it('rejects kidAcknowledged = false', () => {
    const result = commitmentSchema.safeParse({
      ...validCommitment,
      kidAcknowledged: false,
    });
    expect(result.success).toBe(false);
  });
});

// ─── pricingConfigSchema ────────────────────────────────────────────────────

describe('pricingConfigSchema', () => {
  const validPricing = {
    structureType: 'PHOENIX_AUTOCALL',
    productName: 'Phoenix SX5E Mai 2026',
    currency: 'EUR' as const,
    nominalAmount: 500_000,
    couponRate: 8,
    couponBarrier: 60,
    protectionBarrier: 60,
    autocallBarrier: 100,
    mcPaths: 10_000,
    structuringMargin: 1.5,
    distributionFee: 2.0,
  };

  it('accepts valid pricing configuration', () => {
    const result = pricingConfigSchema.safeParse(validPricing);
    expect(result.success).toBe(true);
  });

  it('rejects negative nominal amount', () => {
    const result = pricingConfigSchema.safeParse({
      ...validPricing,
      nominalAmount: -1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative coupon rate', () => {
    const result = pricingConfigSchema.safeParse({
      ...validPricing,
      couponRate: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative structuring margin', () => {
    const result = pricingConfigSchema.safeParse({
      ...validPricing,
      structuringMargin: -1,
    });
    expect(result.success).toBe(false);
  });
});
