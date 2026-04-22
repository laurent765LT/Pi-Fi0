// ─── /api/push/send ──────────────────────────────────────────────────────
// POST (admin-only) — simulates sending a web-push payload to all subscribed
// users. No real Web Push dispatch is performed — we just acknowledge the
// request with a mock response summarizing what would have been sent.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSubscriptions } from '@/lib/push/subscriptions-store';

// ─── Validation ──────────────────────────────────────────────────────────

const BodySchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  url: z.string().min(1).max(200).optional(),
  icon: z.string().url().optional(),
  audience: z.enum(['all', 'admins', 'cgp']).default('all'),
});

// ─── Lightweight admin guard ─────────────────────────────────────────────
// In demo mode, the auth store sets a `strickin-auth` cookie containing the
// serialized auth state. We read it and check role === SUPER_ADMIN. Any
// failure is treated as unauthorized.

function isAdmin(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const authHeader = req.headers.get('x-strickin-admin') ?? '';
  if (authHeader === 'true') return true;

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('strickin-auth='));
  if (!match) return false;

  const raw = decodeURIComponent(match.slice('strickin-auth='.length));
  try {
    const parsed = JSON.parse(raw) as {
      state?: { user?: { role?: unknown } };
      user?: { role?: unknown };
    };
    const role = parsed?.state?.user?.role ?? parsed?.user?.role;
    return role === 'SUPER_ADMIN' || role === 'ORG_ADMIN';
  } catch {
    return false;
  }
}

// ─── Route ───────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  if (!isAdmin(req)) {
    return NextResponse.json(
      { error: 'Réservé aux administrateurs.' },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload invalide.', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const subs = getSubscriptions();

  // Mock: we return the list of endpoints that would receive the push. No
  // actual Web Push is sent — connecting a real provider (e.g. web-push npm
  // package with VAPID keys) would be a follow-up task.
  return NextResponse.json({
    ok: true,
    mock: true,
    audience: parsed.data.audience,
    payload: {
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url ?? '/dashboard',
      icon: parsed.data.icon,
    },
    delivered: subs.length,
    endpoints: subs.map((s) => s.endpoint),
    sentAt: new Date().toISOString(),
  });
}
