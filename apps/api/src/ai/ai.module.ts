import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIUsageService } from './ai-usage.service';
import { AIController, AIAdminController } from './ai.controller';

@Module({
  controllers: [AIController, AIAdminController],
  providers: [AIService, AIUsageService],
  exports: [AIService, AIUsageService],
})
export class AiModule {}
