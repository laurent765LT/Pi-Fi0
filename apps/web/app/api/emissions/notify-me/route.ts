import { NextRequest, NextResponse } from 'next/server';

interface NotifyMeBody {
  emissionId?: string;
  action?: 'subscribe' | 'unsubscribe';
  email?: string;
}

/**
 * POST /api/emissions/notify-me
 *
 * Body: { emissionId: string, action: 'subscribe' | 'unsubscribe', email?: string }
 *
 * In demo mode we log the intent and return success. In production,
 * persist the alert to a DB and wire the opening cron job.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let body: NotifyMeBody;
  try {
    body = (await req.json()) as NotifyMeBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { emissionId, action, email } = body;

  if (!emissionId || typeof emissionId !== 'string') {
    return NextResponse.json(
      { error: 'emissionId is required' },
      { status: 400 },
    );
  }

  if (action !== 'subscribe' && action !== 'unsubscribe') {
    return NextResponse.json(
      { error: 'action must be "subscribe" or "unsubscribe"' },
      { status: 400 },
    );
  }

  // eslint-disable-next-line no-console
  console.info(
    `[notify-me] ${action} emission=${emissionId}${email ? ` email=${email}` : ''}`,
  );

  return NextResponse.json({
    success: true,
    emissionId,
    action,
    subscribedAt: action === 'subscribe' ? new Date().toISOString() : null,
  });
}
