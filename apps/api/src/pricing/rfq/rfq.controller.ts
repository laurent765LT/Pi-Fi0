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
import { RfqService } from './rfq.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/rfq')
export class RfqController {
  private readonly logger = new Logger(RfqController.name);

  constructor(private readonly rfqService: RfqService) {}

  // ── Create RFQ ─────────────────────────────────────────────────────────────

  @Post()
  async createRfq(@Body() body: any) {
    if (!body.productConfig) {
      throw new HttpException(
        { message: 'productConfig is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.rfqService.createRfq(body);
    } catch (error) {
      this.logger.error('Failed to create RFQ', error);
      throw new HttpException(
        { message: 'Failed to create RFQ' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── Send RFQ to Issuers ────────────────────────────────────────────────────

  @Post(':id/send')
  async sendRfq(@Param('id') id: string) {
    try {
      return await this.rfqService.sendRfq(id);
    } catch (error: any) {
      this.logger.error(`Failed to send RFQ ${id}`, error);
      throw new HttpException(
        { message: error.message ?? 'Failed to send RFQ' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── Get RFQ with Quotes ────────────────────────────────────────────────────

  @Get(':id')
  async getRfq(@Param('id') id: string) {
    const rfq = await this.rfqService.getRfq(id);
    if (!rfq) {
      throw new HttpException(
        { message: 'RFQ not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return rfq;
  }

  // ── List RFQs ──────────────────────────────────────────────────────────────

  @Get()
  async listRfqs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    return this.rfqService.listRfqs({
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
      status,
    });
  }

  // ── Select a Quote ─────────────────────────────────────────────────────────

  @Post(':id/select/:quoteId')
  async selectQuote(
    @Param('id') rfqId: string,
    @Param('quoteId') quoteId: string,
  ) {
    try {
      return await this.rfqService.selectQuote(rfqId, quoteId);
    } catch (error) {
      this.logger.error(`Failed to select quote`, error);
      throw new HttpException(
        { message: 'Failed to select quote' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── Get Issuers ────────────────────────────────────────────────────────────

  @Get('issuers/all')
  async getIssuers() {
    return this.rfqService.getIssuers();
  }
}
