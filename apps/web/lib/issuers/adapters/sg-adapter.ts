import {
  IssuerPricingAdapter,
  type PricingRequest,
  type PricingResponse,
  baseCouponForRequest,
  hashString,
  mulberry32,
} from '../IssuerPricingAdapter';

// Société Générale — aggressive coupons, tighter barriers.
export class SGAdapter extends IssuerPricingAdapter {
  issuerName = 'Société Générale';
  issuerShort = 'SG';
  pricingEndpoint = 'https://mock.sgcib.example/api/pricing';

  protected computeQuote(req: PricingRequest) {
    const base = baseCouponForRequest(req);
    const rnd = mulberry32(hashString(`sg|${req.underlying}|${req.maturityYears}`));
    // SG pushes aggressive coupons (+35bps) with a slightly richer price (99.5).
    const coupon = base + 0.0035;
    const price = 99.2 + rnd() * 0.45; // 99.20 - 99.65
    return { coupon, price };
  }

  async getQuote(req: PricingRequest): Promise<PricingResponse> {
    const started = Date.now();
    const latency = 1500 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, latency));
    const elapsed = Date.now() - started;

    const rand = Math.random();
    if (rand < 0.02) {
      return this.buildError(req, elapsed, 'SG — limite de risque interne atteinte.');
    }
    if (rand < 0.07) {
      return this.buildTimeout(req, elapsed);
    }
    return this.buildSuccess(req, this.computeQuote(req), elapsed);
  }
}
