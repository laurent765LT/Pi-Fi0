import {
  IssuerPricingAdapter,
  type PricingRequest,
  type PricingResponse,
  baseCouponForRequest,
  hashString,
  mulberry32,
} from '../IssuerPricingAdapter';

// Marex — small ticket specialist, higher variance.
export class MarexAdapter extends IssuerPricingAdapter {
  issuerName = 'Marex Financial';
  issuerShort = 'MRX';
  pricingEndpoint = 'https://mock.marex.example/api/pricing';

  protected computeQuote(req: PricingRequest) {
    const base = baseCouponForRequest(req);
    const rnd = mulberry32(hashString(`mrx|${req.underlying}|${req.maturityYears}`));
    // Specialist on small tickets: boost on sub-500k, penalty on large.
    const ticketBump = req.notional < 500_000 ? 0.0035 : req.notional > 5_000_000 ? -0.0015 : 0.001;
    // Higher variance (+/- 80bps).
    const variance = (rnd() - 0.5) * 0.016;
    const coupon = Math.max(0.005, base + ticketBump + variance);
    const price = 99.1 + rnd() * 0.7; // 99.10 - 99.80
    return { coupon, price };
  }

  async getQuote(req: PricingRequest): Promise<PricingResponse> {
    const started = Date.now();
    const latency = 1500 + Math.random() * 2000;
    await new Promise((resolve) => setTimeout(resolve, latency));
    const elapsed = Date.now() - started;

    const rand = Math.random();
    if (rand < 0.02) {
      return this.buildError(req, elapsed, 'Marex — ticket en-dessous du minimum.');
    }
    if (rand < 0.07) {
      return this.buildTimeout(req, elapsed);
    }
    return this.buildSuccess(req, this.computeQuote(req), elapsed);
  }
}
