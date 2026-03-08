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
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  // ── Status ──────────────────────────────────────────────────────────────────

  @Get('status')
  getStatus() {
    return {
      perplexity: this.aiService.isConfigured(),
      features: {
        chat: this.aiService.isConfigured(),
        underlyingAnalysis: this.aiService.isConfigured(),
        marketSentiment: this.aiService.isConfigured(),
        riskAssessment: this.aiService.isConfigured(),
      },
    };
  }

  // ── Financial Chat ──────────────────────────────────────────────────────────

  @Post('chat')
  async chat(@Body() body: { message: string; context?: { productNames?: string[]; productTypes?: string[] } }) {
    if (!body.message?.trim()) {
      throw new HttpException({ message: 'Message is required' }, HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.aiService.financialChat(body.message, body.context);
    } catch (error) {
      this.logger.error('AI chat failed', error);
      throw new HttpException(
        { message: 'AI service temporarily unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ── Underlying Analysis ─────────────────────────────────────────────────────

  @Get('analyze/:ticker')
  async analyzeUnderlying(
    @Param('ticker') ticker: string,
    @Query('name') name?: string,
  ) {
    try {
      return await this.aiService.analyzeUnderlying(
        name ?? ticker,
        ticker,
      );
    } catch (error) {
      this.logger.error(`AI analysis failed for ${ticker}`, error);
      throw new HttpException(
        { message: `Unable to analyze ${ticker}` },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ── Market Sentiment ────────────────────────────────────────────────────────

  @Get('sentiment')
  async getMarketSentiment(@Query('topic') topic?: string) {
    try {
      return await this.aiService.getMarketSentiment(topic);
    } catch (error) {
      this.logger.error('AI sentiment failed', error);
      throw new HttpException(
        { message: 'Unable to fetch market sentiment' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ── Product Risk Assessment ─────────────────────────────────────────────────

  @Post('risk-assessment')
  async assessRisk(
    @Body()
    body: {
      name: string;
      payoffType: string;
      underlyingName: string;
      underlyingTicker: string;
      barrierPct: number | null;
      couponPct: number | null;
      maturityDate: string;
      sri: number;
    },
  ) {
    if (!body.name || !body.underlyingTicker) {
      throw new HttpException(
        { message: 'Product name and underlying ticker are required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.aiService.assessProductRisk(body);
    } catch (error) {
      this.logger.error(`AI risk assessment failed for ${body.name}`, error);
      throw new HttpException(
        { message: 'Unable to assess product risk' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
