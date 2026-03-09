import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { CommissionsService } from './commissions.service';

@Controller('commissions')
export class CommissionsController {
  constructor(private readonly svc: CommissionsService) {}

  @Post('rules')
  createRule(@Body() dto: any) {
    return this.svc.createRule(dto);
  }

  @Get('rules')
  listRules(@Query('orgId') orgId?: string) {
    return this.svc.listRules(orgId);
  }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: any) {
    return this.svc.updateRule(id, dto);
  }

  @Post('calculate/:commitmentId')
  calculate(@Param('commitmentId') commitmentId: string) {
    return this.svc.calculateCommissions(commitmentId);
  }

  @Get('summary')
  summary(@Query('orgId') orgId?: string) {
    return this.svc.getCommissionSummary(orgId);
  }

  @Get('org/:orgId')
  byOrg(@Param('orgId') orgId: string, @Query('status') status?: any) {
    return this.svc.getCommissionsByOrg(orgId, status);
  }

  @Post('mark-payable')
  markPayable(@Body() dto: { ids: string[] }) {
    return this.svc.markPayable(dto.ids);
  }

  @Post('mark-paid')
  markPaid(@Body() dto: { ids: string[]; invoiceRef?: string }) {
    return this.svc.markPaid(dto.ids, dto.invoiceRef);
  }
}
