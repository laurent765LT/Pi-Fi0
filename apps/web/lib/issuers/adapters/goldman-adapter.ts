import {
  IssuerPricingAdapter,
  type PricingRequest,
  type PricingResponse,
  baseCouponForRequest,
  hashString,
  mulberry32,
} from '../IssuerPricingAdapter';

// Goldman Sachs — slight premium on complexity.
export class GoldmanAdapter extends IssuerPricingAdapter {
  issuerName = 'Goldman Sachs';
  issuerShort = 'GS';
  pricingEndpoint = 'https://mock.gs.example/api/pricing';

  protected computeQuote(req: PricingRequest) {
    const base = baseCouponForRequest(req);
    const rnd = mulberry32(hashString(`gs|${req.underlying}|${req.maturityYears}`));
    // Premium on complex structures (Phoenix / barrier).
    const complexityBump =
      req.productType === 'AUTOCALL_PHOENIX' || req.productType === 'BARRIER_NOTE' ? 0.0022 : 0.001;
    const coupon = base + complexityBump;
    const price = 99.65 + rnd() * 0.4; // 99.65 - 100.05
    return { coupon, price };
  }

  async getQuote(req: PricingRequest): Promise<PricingResponse> {
    const started = Date.now();
    const latency = 1500 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, latency));
    const elapsed = Date.now() - started;

    const rand = Math.random();
    if (rand < 0.02) {
      return this.buildError(req, elapsed, 'Goldman — paramètres non acceptés.');
    }
    if (rand < 0.07) {
      return this.buildTimeout(req, elapsed);
    }
    return this.buildSuccess(req, this.computeQuote(req), elapsed);
  }
}
