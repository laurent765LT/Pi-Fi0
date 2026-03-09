import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { InsurerRulesService } from './insurer-rules.service';

@Controller('insurer-rules')
export class InsurerRulesController {
  constructor(private readonly svc: InsurerRulesService) {}

  @Post()
  create(@Body() dto: any) {
    return this.svc.createRule(dto);
  }

  @Get(':orgId')
  list(@Param('orgId') orgId: string) {
    return this.svc.listRules(orgId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateRule(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.deleteRule(id);
  }

  @Get('check/:orgId/:productId')
  checkEligibility(@Param('orgId') orgId: string, @Param('productId') productId: string) {
    return this.svc.checkProductEligibility(orgId, productId);
  }

  @Post('filter/:orgId')
  filterEligible(@Param('orgId') orgId: string, @Body() dto: { productIds?: string[] }) {
    return this.svc.filterEligibleProducts(orgId, dto.productIds);
  }
}
