import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { RfqService } from './rfq/rfq.service';
import { RfqController } from './rfq/rfq.controller';

@Module({
  controllers: [PricingController, RfqController],
  providers: [PricingService, RfqService],
  exports: [PricingService, RfqService],
})
export class PricingModule {}
