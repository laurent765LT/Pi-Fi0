// ─── /api/webhooks/yousign ───────────────────────────────────────────────────
// Webhook receiver (GET + POST). En production, vérifier X-Yousign-Signature
// via HMAC SHA-256 sur le body brut avec le secret partagé. En démo, toute
// signature est acceptée.

import { NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Mock signature verification ────────────────────────────────────────────

function verifyYousignSignature(
  _body: string,
  _signature: string | null,
): boolean {
  // En prod : compare HMAC SHA-256 du body avec le secret.
  // En dev/démo : on accepte toujours.
  if (process.env.NODE_ENV !== 'production') return true;
  // Exemple (non branché car secret absent du projet) :
  // const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  // return signature === expected;
  return true;
}

// ─── Event shape (subset) ───────────────────────────────────────────────────

const EventSchema = z.object({
  event_name: z
    .enum([
      'procedure.started',
      'member.started',
      'member.finished',
      'member.refused',
      'procedure.finished',
      'procedure.expired',
    ])
    .optional(),
  procedure_id: z.string().optional(),
  member_id: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

// ─── Handlers ───────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Endpoint de vérification pour la configuration du webhook chez Yousign.
  const url = new URL(req.url);
  const challenge = url.searchParams.get('challenge');
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  return NextResponse.json({
    ok: true,
    service: 'yousign-webhook',
    mode: process.env.NODE_ENV === 'production' ? 'prod' : 'mock',
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-yousign-signature');

  if (!verifyYousignSignature(raw, signature)) {
    return NextResponse.json(
      { error: 'Signature webhook invalide' },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: 'JSON invalide' },
      { status: 400 },
    );
  }

  const parsed = EventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload non reconnu', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // En démo, on se contente de logguer. Un vrai backend mettrait le store à
  // jour côté serveur (DB). Le store client reçoit ses mises à jour via la
  // simulation locale (mockSimulateProgress).
  // eslint-disable-next-line no-console
  console.info('[yousign.webhook] event received', parsed.data);

  return NextResponse.json({ ok: true });
}
