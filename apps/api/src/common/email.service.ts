import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not set — emails disabled');
    }
  }

  async sendWeeklyKpiReport(to: string, data: {
    orgName: string;
    period: string;
    totalProducts: number;
    newCommitments: number;
    totalVolume: string;
    conversionRate: string;
    topProducts: Array<{ name: string; volume: string }>;
  }) {
    if (!this.resend) {
      this.logger.debug(`[DRY RUN] Weekly KPI to ${to}: ${JSON.stringify(data)}`);
      return { id: 'dry-run', success: true };
    }

    const html = this.buildKpiHtml(data);

    try {
      const result = await this.resend.emails.send({
        from: "Strick'in <noreply@strickin.com>",
        to,
        subject: `📊 Rapport hebdomadaire — ${data.period}`,
        html,
      });
      this.logger.log(`Weekly KPI email sent to ${to}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendCommitmentNotification(to: string, data: {
    productName: string;
    amount: string;
    status: string;
    userName: string;
  }) {
    if (!this.resend) {
      this.logger.debug(`[DRY RUN] Commitment notification to ${to}: ${JSON.stringify(data)}`);
      return { id: 'dry-run', success: true };
    }

    try {
      const result = await this.resend.emails.send({
        from: "Strick'in <noreply@strickin.com>",
        to,
        subject: `Nouvel engagement — ${data.productName}`,
        html: `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; font-size: 20px; margin: 0;">Strick'in</h1>
            </div>
            <div style="padding: 24px; background: #fff; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #1A0A3E; font-size: 14px;">Bonjour,</p>
              <p style="color: #1A0A3E; font-size: 14px;">
                <strong>${data.userName}</strong> a soumis un engagement de <strong>${data.amount}</strong>
                sur <strong>${data.productName}</strong>.
              </p>
              <div style="background: #FAFAFF; border: 1px solid #E8E5F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 13px; color: #6B6480;">Statut : <strong style="color: #3B1FA8;">${data.status}</strong></p>
              </div>
              <p style="color: #6B6480; font-size: 12px; margin-top: 24px;">
                — L'équipe Strick'in
              </p>
            </div>
          </div>
        `,
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to send commitment email to ${to}`, error);
      throw error;
    }
  }

  private buildKpiHtml(data: {
    orgName: string;
    period: string;
    totalProducts: number;
    newCommitments: number;
    totalVolume: string;
    conversionRate: string;
    topProducts: Array<{ name: string; volume: string }>;
  }): string {
    const topProductsHtml = data.topProducts
      .map((p, i) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #1A0A3E;">${i + 1}. ${p.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #3B1FA8; text-align: right; font-weight: 600;">${p.volume}</td>
        </tr>
      `)
      .join('');

    return `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAFAF8;">
        <div style="background: linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%); padding: 32px 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; font-size: 22px; margin: 0 0 4px 0;">📊 Rapport hebdomadaire</h1>
          <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 0;">${data.orgName} — ${data.period}</p>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #e5e5e5; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 16px; background: #FAFAFF; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24px; font-weight: 700; color: #3B1FA8;">${data.totalProducts}</div>
                <div style="font-size: 11px; color: #6B6480; margin-top: 4px;">Produits actifs</div>
              </td>
              <td style="width: 8px;"></td>
              <td style="padding: 16px; background: #FAFAFF; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24px; font-weight: 700; color: #00B894;">${data.newCommitments}</div>
                <div style="font-size: 11px; color: #6B6480; margin-top: 4px;">Nouveaux engagements</div>
              </td>
              <td style="width: 8px;"></td>
              <td style="padding: 16px; background: #FAFAFF; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24px; font-weight: 700; color: #1A0A3E;">${data.totalVolume}</div>
                <div style="font-size: 11px; color: #6B6480; margin-top: 4px;">Volume total</div>
              </td>
              <td style="width: 8px;"></td>
              <td style="padding: 16px; background: #FAFAFF; border-radius: 8px; text-align: center; width: 25%;">
                <div style="font-size: 24px; font-weight: 700; color: #D4A017;">${data.conversionRate}</div>
                <div style="font-size: 11px; color: #6B6480; margin-top: 4px;">Conversion</div>
              </td>
            </tr>
          </table>
          <h3 style="font-size: 14px; color: #1A0A3E; margin: 0 0 12px 0;">🏆 Top produits</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${topProductsHtml}
          </table>
        </div>
        <div style="padding: 16px 24px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
          <p style="color: #6B6480; font-size: 11px; margin: 0;">
            Strick'in — Plateforme B2B de distribution de produits structurés
          </p>
        </div>
      </div>
    `;
  }
}
