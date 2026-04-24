import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

// PrismaModule and RedisModule are @Global() so we don't need to import them
// here — their services are injected via their global providers.

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
