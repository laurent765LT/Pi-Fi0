import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
import { EmailModule } from './common/email.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ShelvesModule } from './shelves/shelves.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { MarketDataModule } from './market-data/market-data.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { PricingModule } from './pricing/pricing.module';
import { CommissionsModule } from './commissions/commissions.module';
import { InsurerRulesModule } from './insurer-rules/insurer-rules.module';
import { FavoritesModule } from './favorites/favorites.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ActivityModule } from './activity/activity.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './common/health/health.module';
import { DebugModule } from './common/debug/debug.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] }),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuthModule,
    ProductsModule,
    ShelvesModule,
    CommitmentsModule,
    MarketDataModule,
    OnboardingModule,
    AdminModule,
    ChatModule,
    AiModule,
    PricingModule,
    CommissionsModule,
    InsurerRulesModule,
    FavoritesModule,
    RecommendationsModule,
    ActivityModule,
    NotificationsModule,
    WebhooksModule,
    HealthModule,
    DebugModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
