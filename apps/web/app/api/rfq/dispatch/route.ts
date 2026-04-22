// ─── /api/rfq/dispatch ──────────────────────────────────────────────────────
// POST endpoint: dispatches a pricing request to all mock issuers in parallel
// and returns the aggregated responses (sorted by coupon desc).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dispatchRFQ } from '@/lib/issuers/rfq-dispatcher';
import type { PricingRequest } from '@/lib/issuers/IssuerPricingAdapter';

const PricingRequestSchema = z.object({
  productType: z.enum([
    'AUTOCALL_PHOENIX',
    'AUTOCALL_COUPON',
    'CAPITAL_PROTECTED',
    'CONDITIONAL_RATE',
    'BARRIER_NOTE',
  ]),
  underlying: z.string().min(1),
  notional: z.number().positive(),
  maturityYears: z.number().positive(),
  targetCoupon: z.number().min(0).max(1).optional(),
  barrier: z.number().min(0).max(1).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide (JSON attendu).' },
      { status: 400 },
    );
  }

  const parsed = PricingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const pricingReq: PricingRequest = parsed.data;
  const responses = await dispatchRFQ(pricingReq);

  return NextResponse.json({ responses }, { status: 200 });
}
