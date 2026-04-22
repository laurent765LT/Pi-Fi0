// ─── POST /api/signatures/create ─────────────────────────────────────────────
// Crée une demande de signature via le client Yousign (mock côté lib).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSignatureRequest } from '@/lib/yousign/client';

// ─── Validation ─────────────────────────────────────────────────────────────

const SignerSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  role: z.enum(['cgp', 'client', 'co-souscripteur']),
  order: z.number().int().min(1).max(10),
});

const BodySchema = z.object({
  documentName: z.string().min(1, 'Nom de document requis'),
  documentType: z.enum([
    'fiche-produit',
    'bulletin-souscription',
    'lettre-mission',
    'der',
    'kid',
    'rapport-adequation',
  ]),
  documentHtml: z.string().optional(),
  signers: z.array(SignerSchema).min(1, 'Au moins un signataire'),
  level: z.enum(['simple', 'advanced', 'qualified']),
  message: z.string().max(2000).optional(),
});

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps JSON invalide' },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Paramètres invalides',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const request = await createSignatureRequest(parsed.data);
    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erreur inconnue côté Yousign';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
