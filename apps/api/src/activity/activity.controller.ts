import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly svc: ActivityService) {}

  @Get('user/:userId')
  userActivity(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.svc.getUserActivity(userId, limit ? parseInt(limit) : 50);
  }

  @Get('entity/:entityType/:entityId')
  entityActivity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getEntityActivity(entityType, entityId, limit ? parseInt(limit) : 20);
  }

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    return this.svc.getRecentPlatformActivity(limit ? parseInt(limit) : 100);
  }

  @Get('stats')
  stats(@Query('since') since?: string) {
    return this.svc.getActivityStats(since ? new Date(since) : undefined);
  }
}
