import {
  IssuerPricingAdapter,
  type PricingRequest,
  type PricingResponse,
  baseCouponForRequest,
  hashString,
  mulberry32,
} from '../IssuerPricingAdapter';

// BNP Paribas — slightly lower coupon, tighter barriers.
export class BNPAdapter extends IssuerPricingAdapter {
  issuerName = 'BNP Paribas';
  issuerShort = 'BNP';
  pricingEndpoint = 'https://mock.bnp.example/api/pricing';

  protected computeQuote(req: PricingRequest) {
    const base = baseCouponForRequest(req);
    const rnd = mulberry32(hashString(`bnp|${req.underlying}|${req.maturityYears}`));
    // BNP offers slightly lower coupon (-15bps) but a better issue price.
    const coupon = Math.max(0.005, base - 0.0015);
    const price = 99.8 + rnd() * 0.35; // 99.80 - 100.15
    return { coupon, price };
  }

  async getQuote(req: PricingRequest): Promise<PricingResponse> {
    const started = Date.now();
    const latency = 1500 + Math.random() * 2000; // 1.5s - 3.5s
    await new Promise((resolve) => setTimeout(resolve, latency));
    const elapsed = Date.now() - started;

    const rand = Math.random();
    if (rand < 0.02) {
      return this.buildError(req, elapsed, 'BNP — service indisponible (HTTP 503).');
    }
    if (rand < 0.07) {
      return this.buildTimeout(req, elapsed);
    }
    return this.buildSuccess(req, this.computeQuote(req), elapsed);
  }
}
