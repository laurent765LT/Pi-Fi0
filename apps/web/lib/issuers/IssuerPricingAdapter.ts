// ─── IssuerPricingAdapter ───────────────────────────────────────────────────
// Abstract base class for issuer pricing adapters (Phase 3.1 — mock).
// Each concrete adapter simulates an external issuer pricing API with
// deterministic-but-realistic mock logic.

export type ProductType =
  | 'AUTOCALL_PHOENIX'
  | 'AUTOCALL_COUPON'
  | 'CAPITAL_PROTECTED'
  | 'CONDITIONAL_RATE'
  | 'BARRIER_NOTE';

export interface PricingRequest {
  productType: ProductType;
  underlying: string;
  notional: number;
  maturityYears: number;
  targetCoupon?: number;
  barrier?: number;
}

export type PricingStatus = 'success' | 'timeout' | 'error';

export interface PricingResponse {
  issuer: string;
  issuerShort: string;
  requestId: string;
  indicativeCoupon: number; // fraction (e.g. 0.0825 for 8.25%)
  indicativePrice: number; // issue price in % of nominal (e.g. 99.8)
  timestamp: string;
  latencyMs: number;
  validity: number; // seconds the quote remains valid
  status: PricingStatus;
  errorMessage?: string;
}

// ─── Deterministic PRNG (mulberry32) ────────────────────────────────────────

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function baseCouponForRequest(req: PricingRequest): number {
  // Deterministic baseline coupon before issuer-specific adjustment.
  const seed = hashString(
    `${req.productType}|${req.underlying}|${req.maturityYears}|${req.notional}`,
  );
  const rnd = mulberry32(seed);
  const noise = (rnd() - 0.5) * 0.01; // +/- 50bps

  const maturityAdj = Math.min(0.04, Math.max(-0.015, (req.maturityYears - 3) * 0.004));
  const barrierAdj = req.barrier != null ? (0.6 - req.barrier) * 0.04 : 0;

  const typeBase: Record<ProductType, number> = {
    AUTOCALL_PHOENIX: 0.085,
    AUTOCALL_COUPON: 0.072,
    CAPITAL_PROTECTED: 0.035,
    CONDITIONAL_RATE: 0.055,
    BARRIER_NOTE: 0.068,
  };

  return Math.max(0.01, typeBase[req.productType] + maturityAdj + barrierAdj + noise);
}

export function buildRequestId(issuerShort: string, req: PricingRequest): string {
  const stamp = Date.now().toString(36);
  const seed = hashString(`${issuerShort}|${req.underlying}|${stamp}`);
  return `${issuerShort.toLowerCase()}-${seed.toString(36).slice(0, 8)}-${stamp.slice(-4)}`;
}

// ─── Base adapter ───────────────────────────────────────────────────────────

export abstract class IssuerPricingAdapter {
  abstract issuerName: string;
  abstract issuerShort: string;
  abstract pricingEndpoint: string;

  abstract getQuote(req: PricingRequest): Promise<PricingResponse>;

  protected abstract computeQuote(req: PricingRequest): {
    coupon: number;
    price: number;
  };

  /** Build a successful response payload. */
  protected buildSuccess(
    req: PricingRequest,
    quote: { coupon: number; price: number },
    latencyMs: number,
  ): PricingResponse {
    return {
      issuer: this.issuerName,
      issuerShort: this.issuerShort,
      requestId: buildRequestId(this.issuerShort, req),
      indicativeCoupon: quote.coupon,
      indicativePrice: quote.price,
      timestamp: new Date().toISOString(),
      latencyMs: Math.round(latencyMs),
      validity: 120,
      status: 'success',
    };
  }

  /** Build a timeout response payload. */
  protected buildTimeout(req: PricingRequest, latencyMs: number): PricingResponse {
    return {
      issuer: this.issuerName,
      issuerShort: this.issuerShort,
      requestId: buildRequestId(this.issuerShort, req),
      indicativeCoupon: 0,
      indicativePrice: 0,
      timestamp: new Date().toISOString(),
      latencyMs: Math.round(latencyMs),
      validity: 0,
      status: 'timeout',
      errorMessage: `Timeout émetteur ${this.issuerShort} (> 5s).`,
    };
  }

  /** Build an error response payload. */
  protected buildError(
    req: PricingRequest,
    latencyMs: number,
    message: string,
  ): PricingResponse {
    return {
      issuer: this.issuerName,
      issuerShort: this.issuerShort,
      requestId: buildRequestId(this.issuerShort, req),
      indicativeCoupon: 0,
      indicativePrice: 0,
      timestamp: new Date().toISOString(),
      latencyMs: Math.round(latencyMs),
      validity: 0,
      status: 'error',
      errorMessage: message,
    };
  }
}
