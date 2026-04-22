// ─── POST /api/screening/pep-sanctions ───────────────────────────────────────
// Lance un screening PEP/sanctions (mock).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { screenPEPSanctions } from '@/lib/screening/pep-sanctions';

const BodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().min(1),
});

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

  const { firstName, lastName, birthDate } = parsed.data;
  try {
    const result = await screenPEPSanctions(firstName, lastName, birthDate);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Screening indisponible.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
