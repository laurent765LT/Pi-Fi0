import type { UpcomingEmission } from '@/stores/emissions-store';

/**
 * Mock email service — in demo mode, logs to console only.
 * In production, wire this to Resend / SendGrid / Postmark using
 * RESEND_API_KEY etc. The API is designed so that the call-site
 * does not change when you swap providers.
 */

interface EmailSendOptions {
  subject: string;
  body: string;
  html?: string;
}

function formatDateFr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function buildEmissionOpeningEmail(emission: UpcomingEmission): EmailSendOptions {
  const subject = `[Strick'in] Ouverture de la souscription: ${emission.productName}`;
  const body = [
    `Bonjour,`,
    ``,
    `La souscription du produit "${emission.productName}" (émetteur: ${emission.issuer}) est désormais ouverte.`,
    ``,
    `Caractéristiques indicatives :`,
    `  - Sous-jacent : ${emission.underlying}`,
    `  - Coupon attendu : ${emission.expectedCoupon}%`,
    `  - Barrière attendue : ${emission.expectedBarrier}%`,
    `  - Durée : ${emission.expectedMaturityYears} ans`,
    `  - Ticket minimum : ${emission.minTicket.toLocaleString('fr-FR')} €`,
    `  - Fenêtre : ${formatDateFr(emission.subscriptionStart)} → ${formatDateFr(emission.subscriptionEnd)}`,
    ``,
    `Connectez-vous sur Strick'in pour en savoir plus.`,
    ``,
    `— L'équipe Strick'in`,
  ].join('\n');

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #1A0A3E;">
      <h2 style="color: #3B1FA8; margin: 0 0 8px;">Ouverture de la souscription</h2>
      <p style="font-size: 15px; margin: 0 0 16px;">
        <strong>${emission.productName}</strong> &mdash; ${emission.issuer}
      </p>
      <ul style="font-size: 14px; line-height: 1.6; padding-left: 18px;">
        <li>Sous-jacent : <strong>${emission.underlying}</strong></li>
        <li>Coupon attendu : <strong>${emission.expectedCoupon}%</strong></li>
        <li>Barrière attendue : <strong>${emission.expectedBarrier}%</strong></li>
        <li>Durée : <strong>${emission.expectedMaturityYears} ans</strong></li>
        <li>Ticket minimum : <strong>${emission.minTicket.toLocaleString('fr-FR')} €</strong></li>
        <li>Fenêtre : <strong>${formatDateFr(emission.subscriptionStart)}</strong> &rarr; <strong>${formatDateFr(emission.subscriptionEnd)}</strong></li>
      </ul>
      <p style="font-size: 13px; color: #7B6FA0; margin-top: 24px;">— Strick'in</p>
    </div>
  `;

  return { subject, body, html };
}

export async function sendEmissionOpeningEmail(
  userEmail: string,
  emission: UpcomingEmission,
): Promise<void> {
  const { subject, body } = buildEmissionOpeningEmail(emission);

  // Demo mode: log to console.
  // Production: replace with actual provider call — e.g.
  //
  //   await resend.emails.send({
  //     from: 'noreply@strickin.com',
  //     to: userEmail,
  //     subject,
  //     html,
  //   });
  //
  if (typeof window !== 'undefined' || typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info(
      `[email-service] → ${userEmail}\n  Subject: ${subject}\n  ${body.split('\n').join('\n  ')}`,
    );
  }

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 50));
}

export async function sendGenericEmail(
  userEmail: string,
  options: EmailSendOptions,
): Promise<void> {
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info(
      `[email-service] → ${userEmail}\n  Subject: ${options.subject}`,
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
}
