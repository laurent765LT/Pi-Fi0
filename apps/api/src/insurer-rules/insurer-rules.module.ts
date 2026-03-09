import { Module } from '@nestjs/common';
import { InsurerRulesService } from './insurer-rules.service';
import { InsurerRulesController } from './insurer-rules.controller';

@Module({
  controllers: [InsurerRulesController],
  providers: [InsurerRulesService],
  exports: [InsurerRulesService],
})
export class InsurerRulesModule {}
