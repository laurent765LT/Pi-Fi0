// ─── /api/rfq/stream ────────────────────────────────────────────────────────
// GET endpoint returning a Server-Sent Events stream. Each issuer quote is
// pushed as it arrives so the UI can render progressively.

import { z } from 'zod';
import { dispatchRFQStream } from '@/lib/issuers/rfq-dispatcher';
import type { PricingRequest, ProductType } from '@/lib/issuers/IssuerPricingAdapter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ProductTypeSchema = z.enum([
  'AUTOCALL_PHOENIX',
  'AUTOCALL_COUPON',
  'CAPITAL_PROTECTED',
  'CONDITIONAL_RATE',
  'BARRIER_NOTE',
]);

function parseNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;

  const productTypeRaw = params.get('productType') ?? 'AUTOCALL_PHOENIX';
  const productTypeParsed = ProductTypeSchema.safeParse(productTypeRaw);
  const productType: ProductType = productTypeParsed.success
    ? productTypeParsed.data
    : 'AUTOCALL_PHOENIX';

  const pricingReq: PricingRequest = {
    productType,
    underlying: params.get('underlying') ?? '^STOXX50E',
    notional: parseNumber(params.get('notional'), 1_000_000),
    maturityYears: parseNumber(params.get('maturityYears'), 5),
    targetCoupon: parseOptionalNumber(params.get('targetCoupon')),
    barrier: parseOptionalNumber(params.get('barrier')),
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Initial "open" event so the EventSource knows the stream is alive.
      controller.enqueue(
        encoder.encode(`event: open\ndata: ${JSON.stringify({ pricingReq })}\n\n`),
      );

      try {
        for await (const response of dispatchRFQStream(pricingReq)) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
          );
        }
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream error';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
