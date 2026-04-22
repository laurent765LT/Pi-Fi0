import {
  IssuerPricingAdapter,
  type PricingRequest,
  type PricingResponse,
  baseCouponForRequest,
  hashString,
  mulberry32,
} from '../IssuerPricingAdapter';

// Natixis — balanced profile.
export class NatixisAdapter extends IssuerPricingAdapter {
  issuerName = 'Natixis';
  issuerShort = 'NATX';
  pricingEndpoint = 'https://mock.natixis.example/api/pricing';

  protected computeQuote(req: PricingRequest) {
    const base = baseCouponForRequest(req);
    const rnd = mulberry32(hashString(`natx|${req.underlying}|${req.maturityYears}`));
    // Natixis: balanced coupon, market-standard price.
    const coupon = base + 0.0008;
    const price = 99.55 + rnd() * 0.3; // 99.55 - 99.85
    return { coupon, price };
  }

  async getQuote(req: PricingRequest): Promise<PricingResponse> {
    const started = Date.now();
    const latency = 1500 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, latency));
    const elapsed = Date.now() - started;

    const rand = Math.random();
    if (rand < 0.02) {
      return this.buildError(req, elapsed, 'Natixis — pricing engine hors-ligne.');
    }
    if (rand < 0.07) {
      return this.buildTimeout(req, elapsed);
    }
    return this.buildSuccess(req, this.computeQuote(req), elapsed);
  }
}
