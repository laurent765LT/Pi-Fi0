import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService, AppNotification } from '../notifications/notifications.service';

interface IssuerWebhookPayload {
  event: string;
  productId?: string;
  productName?: string;
  userId?: string;
  details?: Record<string, any>;
}

const EVENT_TYPE_MAP: Record<string, AppNotification['type']> = {
  coupon_paid: 'coupon',
  autocall_triggered: 'autocall',
  observation_date: 'observation',
  closing_reminder: 'closing',
  commitment_confirmed: 'commitment',
};

@Controller('api/v1/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('issuer')
  @HttpCode(200)
  async handleIssuerEvent(
    @Headers('x-webhook-key') webhookKey: string,
    @Body() payload: IssuerWebhookPayload,
  ) {
    const expectedKey = this.configService.get<string>('WEBHOOK_SECRET_KEY');
    if (!expectedKey || webhookKey !== expectedKey) {
      throw new UnauthorizedException('Invalid webhook key');
    }

    this.logger.log(`Received issuer webhook: ${payload.event}`);

    // Log the event to ActivityLog
    await this.prisma.activityLog.create({
      data: {
        userId: payload.userId ?? 'system',
        action: `webhook.${payload.event}`,
        entityType: 'product',
        entityId: payload.productId,
        metadata: payload.details ?? {},
      },
    });

    // Build notification
    const notificationType = EVENT_TYPE_MAP[payload.event] ?? 'system';
    const notification: AppNotification = {
      type: notificationType,
      title: this.formatEventTitle(payload.event),
      message: this.formatEventMessage(payload),
      productId: payload.productId,
      productName: payload.productName,
      timestamp: new Date().toISOString(),
    };

    // Emit to specific user or broadcast
    if (payload.userId) {
      this.notificationsService.emit(payload.userId, notification);
    } else {
      this.notificationsService.emitToAll(notification);
    }

    return { received: true };
  }

  private formatEventTitle(event: string): string {
    const titles: Record<string, string> = {
      coupon_paid: 'Coupon verse',
      autocall_triggered: 'Autocall declenche',
      observation_date: 'Date d\'observation',
      closing_reminder: 'Rappel de cloture',
      commitment_confirmed: 'Engagement confirme',
    };
    return titles[event] ?? `Evenement: ${event}`;
  }

  private formatEventMessage(payload: IssuerWebhookPayload): string {
    const product = payload.productName ?? payload.productId ?? 'Produit inconnu';
    const messages: Record<string, string> = {
      coupon_paid: `Le coupon pour ${product} a ete verse.`,
      autocall_triggered: `Autocall declenche sur ${product}.`,
      observation_date: `Prochaine date d'observation pour ${product}.`,
      closing_reminder: `Rappel : ${product} ferme bientot.`,
      commitment_confirmed: `Engagement sur ${product} confirme.`,
    };
    return messages[payload.event] ?? `Evenement ${payload.event} sur ${product}.`;
  }
}
