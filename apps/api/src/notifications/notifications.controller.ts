import { Controller, Sse, Req, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable, map, finalize } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user?.sub ?? req.user?.id ?? 'anonymous';
    return this.notificationsService.getStream(userId).pipe(
      map((notification) => ({
        data: JSON.stringify(notification),
        type: 'notification',
      })),
      finalize(() => this.notificationsService.removeStream(userId)),
    );
  }
}
