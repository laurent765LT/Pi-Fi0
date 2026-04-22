// ─── /api/push/subscribe ─────────────────────────────────────────────────
// POST — stores a push subscription server-side.
//
// Mock implementation: the subscription is kept in an in-memory Map keyed by
// endpoint. In a production deployment you would persist this to a database
// and associate it with the authenticated user.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SUBSCRIPTIONS, type StoredSubscription } from '@/lib/push/subscriptions-store';

// ─── Validation ──────────────────────────────────────────────────────────

const KeysSchema = z
  .object({
    p256dh: z.string().min(1).optional(),
    auth: z.string().min(1).optional(),
  })
  .passthrough();

const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: KeysSchema.optional(),
});

// ─── Route ───────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide (JSON attendu).' },
      { status: 400 },
    );
  }

  const parsed = SubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Subscription invalide.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sub: StoredSubscription = {
    endpoint: parsed.data.endpoint,
    keys: parsed.data.keys,
    subscribedAt: new Date().toISOString(),
  };

  SUBSCRIPTIONS.set(sub.endpoint, sub);

  return NextResponse.json({
    ok: true,
    mock: true,
    total: SUBSCRIPTIONS.size,
  });
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    mock: true,
    total: SUBSCRIPTIONS.size,
    endpoints: Array.from(SUBSCRIPTIONS.keys()),
  });
}

export async function DELETE(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body invalide.' }, { status: 400 });
  }
  const parsed = z
    .object({ endpoint: z.string().url() })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Endpoint manquant ou invalide.' },
      { status: 400 },
    );
  }
  const removed = SUBSCRIPTIONS.delete(parsed.data.endpoint);
  return NextResponse.json({ ok: true, mock: true, removed });
}
