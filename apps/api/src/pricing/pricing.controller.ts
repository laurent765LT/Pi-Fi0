import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/pricing')
export class PricingController {
  private readonly logger = new Logger(PricingController.name);

  constructor(private readonly pricingService: PricingService) {}

  // ── Price a Product ────────────────────────────────────────────────────────

  @Post('price')
  async priceProduct(
    @Body() body: { config: any; saveRun?: boolean },
  ) {
    if (!body.config) {
      throw new HttpException(
        { message: 'Product configuration is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.pricingService.priceProduct({
        config: body.config,
        saveRun: body.saveRun ?? true,
      });
      return result;
    } catch (error) {
      this.logger.error('Pricing failed', error);
      throw new HttpException(
        { message: 'Pricing engine error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── Validate Config ────────────────────────────────────────────────────────

  @Post('validate')
  validateConfig(@Body() body: { config: any }) {
    if (!body.config) {
      throw new HttpException(
        { message: 'Product configuration is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.pricingService.validateConfig(body.config);
  }

  // ── Scenario Analysis ──────────────────────────────────────────────────────

  @Post('scenarios')
  runScenarios(
    @Body() body: { config: any; shocks?: number[] },
  ) {
    if (!body.config) {
      throw new HttpException(
        { message: 'Product configuration is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return this.pricingService.runScenarios({
        config: body.config,
        shocks: body.shocks,
      });
    } catch (error) {
      this.logger.error('Scenario analysis failed', error);
      throw new HttpException(
        { message: 'Scenario analysis error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── Pricing Run History ────────────────────────────────────────────────────

  @Get('history')
  async getHistory(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.pricingService.getHistory({
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string) {
    const run = await this.pricingService.getRun(id);
    if (!run) {
      throw new HttpException(
        { message: 'Pricing run not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return run;
  }

  // ── Templates ──────────────────────────────────────────────────────────────

  @Get('templates')
  async getTemplates() {
    return this.pricingService.getTemplates();
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    const tpl = await this.pricingService.getTemplate(id);
    if (!tpl) {
      throw new HttpException(
        { message: 'Template not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return tpl;
  }

  @Post('templates')
  async createTemplate(
    @Body() body: { name: string; description?: string; structureType: string; config: any },
  ) {
    if (!body.name || !body.structureType || !body.config) {
      throw new HttpException(
        { message: 'name, structureType and config are required' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.pricingService.createTemplate(body);
  }
}
