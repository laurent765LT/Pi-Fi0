// ─── RFQ Dispatcher ─────────────────────────────────────────────────────────
// Sends a pricing request to every registered issuer adapter in parallel and
// aggregates the responses. Uses Promise.allSettled so a single failure does
// not poison the whole batch.

import { BNPAdapter } from './adapters/bnp-adapter';
import { SGAdapter } from './adapters/sg-adapter';
import { NatixisAdapter } from './adapters/natixis-adapter';
import { GoldmanAdapter } from './adapters/goldman-adapter';
import { MarexAdapter } from './adapters/marex-adapter';
import type { IssuerPricingAdapter, PricingRequest, PricingResponse } from './IssuerPricingAdapter';

const ADAPTERS: IssuerPricingAdapter[] = [
  new BNPAdapter(),
  new SGAdapter(),
  new NatixisAdapter(),
  new GoldmanAdapter(),
  new MarexAdapter(),
];

export function getAdapters(): IssuerPricingAdapter[] {
  return ADAPTERS;
}

/**
 * Dispatch a pricing request to all issuers in parallel.
 * Returns responses sorted by indicative coupon (desc). Errors/timeouts sink
 * to the bottom of the list.
 */
export async function dispatchRFQ(req: PricingRequest): Promise<PricingResponse[]> {
  const settled = await Promise.allSettled(
    ADAPTERS.map((adapter) => adapter.getQuote(req)),
  );

  const responses: PricingResponse[] = settled.map((outcome, idx) => {
    if (outcome.status === 'fulfilled') return outcome.value;
    const adapter = ADAPTERS[idx]!;
    return {
      issuer: adapter.issuerName,
      issuerShort: adapter.issuerShort,
      requestId: `${adapter.issuerShort.toLowerCase()}-rejected`,
      indicativeCoupon: 0,
      indicativePrice: 0,
      timestamp: new Date().toISOString(),
      latencyMs: 0,
      validity: 0,
      status: 'error',
      errorMessage: outcome.reason instanceof Error ? outcome.reason.message : 'Unknown error',
    };
  });

  return responses.sort((a, b) => {
    if (a.status !== 'success' && b.status === 'success') return 1;
    if (a.status === 'success' && b.status !== 'success') return -1;
    return b.indicativeCoupon - a.indicativeCoupon;
  });
}

/**
 * Dispatch a pricing request and yield each response as soon as it arrives
 * (streaming mode, used by the SSE route).
 */
export async function* dispatchRFQStream(req: PricingRequest): AsyncGenerator<PricingResponse> {
  const pending = new Map<number, Promise<{ idx: number; response: PricingResponse }>>();

  ADAPTERS.forEach((adapter, idx) => {
    pending.set(
      idx,
      adapter
        .getQuote(req)
        .then((response) => ({ idx, response }))
        .catch((err: unknown) => ({
          idx,
          response: {
            issuer: adapter.issuerName,
            issuerShort: adapter.issuerShort,
            requestId: `${adapter.issuerShort.toLowerCase()}-rejected`,
            indicativeCoupon: 0,
            indicativePrice: 0,
            timestamp: new Date().toISOString(),
            latencyMs: 0,
            validity: 0,
            status: 'error' as const,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          },
        })),
    );
  });

  while (pending.size > 0) {
    const { idx, response } = await Promise.race(pending.values());
    pending.delete(idx);
    yield response;
  }
}
