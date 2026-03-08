import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { RedisModule } from './common/redis.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
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
  ],
})
export class AppModule {}
