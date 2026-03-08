import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MarketDataService } from './market-data.service';

@Controller('api/v1/market')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name);

  constructor(private readonly marketDataService: MarketDataService) {}

  // ── Quote (Yahoo + Alpha Vantage fallback) ────────────────────────────────

  @Get('quote/:symbol')
  async getQuote(@Param('symbol') symbol: string) {
    try {
      return await this.marketDataService.getQuote(symbol);
    } catch (error) {
      this.logger.error(`Failed to fetch quote for ${symbol}`, error);
      throw new HttpException(
        { message: `Unable to fetch quote for ${symbol}` },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── Euribor (ECB) ──────────────────────────────────────────────────────────

  @Get('euribor')
  async getEuribor() {
    try {
      return await this.marketDataService.getEuribor();
    } catch (error) {
      this.logger.error('Failed to fetch Euribor rate', error);
      throw new HttpException(
        { message: 'Unable to fetch Euribor rate' },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── History (Yahoo + Alpha Vantage fallback) ──────────────────────────────

  @Get('history/:symbol')
  async getHistory(@Param('symbol') symbol: string) {
    try {
      return await this.marketDataService.getHistory(symbol);
    } catch (error) {
      this.logger.error(`Failed to fetch history for ${symbol}`, error);
      throw new HttpException(
        { message: `Unable to fetch history for ${symbol}` },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── Alpha Vantage: Company Overview ────────────────────────────────────────

  @Get('overview/:symbol')
  async getCompanyOverview(@Param('symbol') symbol: string) {
    try {
      return await this.marketDataService.getCompanyOverview(symbol);
    } catch (error) {
      this.logger.error(`Failed to fetch overview for ${symbol}`, error);
      throw new HttpException(
        { message: `Unable to fetch company overview for ${symbol}` },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── Alpha Vantage: Symbol Search ───────────────────────────────────────────

  @Get('search')
  async searchSymbol(@Query('q') keywords: string) {
    if (!keywords || keywords.length < 1) {
      throw new HttpException(
        { message: 'Query parameter "q" is required' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      return await this.marketDataService.searchSymbol(keywords);
    } catch (error) {
      this.logger.error(`Failed to search for ${keywords}`, error);
      throw new HttpException(
        { message: `Unable to search for "${keywords}"` },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── Alpha Vantage: Intraday Data ───────────────────────────────────────────

  @Get('intraday/:symbol')
  async getIntraday(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    const validIntervals = ['1min', '5min', '15min', '30min', '60min'];
    const resolvedInterval = validIntervals.includes(interval ?? '') ? interval! : '5min';

    try {
      return await this.marketDataService.getIntraday(symbol, resolvedInterval);
    } catch (error) {
      this.logger.error(`Failed to fetch intraday for ${symbol}`, error);
      throw new HttpException(
        { message: `Unable to fetch intraday data for ${symbol}` },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ── Alpha Vantage: Forex ───────────────────────────────────────────────────

  @Get('forex/:from/:to')
  async getForexRate(
    @Param('from') from: string,
    @Param('to') to: string,
  ) {
    try {
      return await this.marketDataService.getForexRate(
        from.toUpperCase(),
        to.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(`Failed to fetch forex ${from}/${to}`, error);
      throw new HttpException(
        { message: `Unable to fetch forex rate for ${from}/${to}` },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
