import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly svc: RecommendationsService) {}

  @Post('generate/:userId')
  generate(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.svc.generateRecommendations(userId, limit ? parseInt(limit) : 10);
  }

  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.svc.getRecommendations(userId);
  }

  @Post('dismiss/:userId/:productId')
  dismiss(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.dismissRecommendation(userId, productId);
  }

  @Post('viewed/:userId/:productId')
  markViewed(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.markViewed(userId, productId);
  }
}
