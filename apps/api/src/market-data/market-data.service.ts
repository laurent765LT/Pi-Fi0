import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface QuoteResult {
  symbol: string;
  regularMarketPrice: number;
  change: number;
  changePct: number;
  currency: string;
  shortName: string;
  source: 'yahoo' | 'alphavantage';
}

export interface HistoryPoint {
  timestamp: number;
  close: number;
}

export interface EuriborResult {
  rate: number;
  date: string;
}

export interface CompanyOverview {
  symbol: string;
  name: string;
  description: string;
  exchange: string;
  currency: string;
  country: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  bookValue: number;
  dividendYield: number;
  eps: number;
  beta: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayMA: number;
  twoHundredDayMA: number;
  sharesOutstanding: number;
  profitMargin: number;
  revenuePerShare: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: string;
}

export interface IntradayPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly alphaVantageKey: string;
  private readonly AV_BASE = 'https://www.alphavantage.co/query';

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.alphaVantageKey = this.config.get<string>('ALPHA_VANTAGE_API_KEY') ?? '';
    if (this.alphaVantageKey) {
      this.logger.log('Alpha Vantage API key configured ✓');
    } else {
      this.logger.warn('Alpha Vantage API key not set — AV endpoints will fail');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Yahoo Finance (existing)
  // ═══════════════════════════════════════════════════════════════════════════

  async getQuote(symbol: string): Promise<QuoteResult> {
    const cacheKey = `market:quote:${symbol}`;
    return this.redis.getOrSet<QuoteResult>(cacheKey, 300, async () => {
      // Try Alpha Vantage first (more reliable), fallback to Yahoo
      try {
        return await this.getQuoteAlphaVantage(symbol);
      } catch (avError) {
        this.logger.warn(`Alpha Vantage quote failed for ${symbol}, trying Yahoo...`);
        try {
          return await this.getQuoteYahoo(symbol);
        } catch (yahooError) {
          this.logger.error(`Both sources failed for ${symbol}`);
          throw yahooError;
        }
      }
    });
  }

  private async getQuoteYahoo(symbol: string): Promise<QuoteResult> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketDataBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance request failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    const chart = json?.chart as Record<string, unknown> | undefined;
    const result = (chart?.result as Record<string, unknown>[] | null)?.[0];

    if (!result) {
      throw new Error(`No data returned from Yahoo Finance for ${symbol}`);
    }

    const meta = result.meta as Record<string, unknown>;
    const regularMarketPrice = (meta?.regularMarketPrice as number) ?? 0;
    const previousClose =
      (meta?.chartPreviousClose as number) ??
      (meta?.previousClose as number) ??
      regularMarketPrice;
    const change = regularMarketPrice - previousClose;
    const changePct = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: (meta?.symbol as string) ?? symbol,
      regularMarketPrice,
      change: Math.round(change * 10000) / 10000,
      changePct: Math.round(changePct * 10000) / 10000,
      currency: (meta?.currency as string) ?? 'USD',
      shortName: (meta?.shortName as string) ?? symbol,
      source: 'yahoo',
    };
  }

  private async getQuoteAlphaVantage(symbol: string): Promise<QuoteResult> {
    if (!this.alphaVantageKey) throw new Error('Alpha Vantage API key not configured');

    const url = `${this.AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${this.alphaVantageKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Alpha Vantage request failed: ${response.status}`);

    const json = (await response.json()) as Record<string, unknown>;

    // Check for rate limit
    if (json['Note'] || json['Information']) {
      throw new Error('Alpha Vantage rate limit reached');
    }

    const quote = json['Global Quote'] as Record<string, string> | undefined;
    if (!quote || !quote['05. price']) {
      throw new Error(`No quote data from Alpha Vantage for ${symbol}`);
    }

    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close'] ?? '0');
    const change = parseFloat(quote['09. change'] ?? '0');
    const changePct = parseFloat((quote['10. change percent'] ?? '0').replace('%', ''));

    return {
      symbol: quote['01. symbol'] ?? symbol,
      regularMarketPrice: price,
      change: Math.round(change * 10000) / 10000,
      changePct: Math.round(changePct * 10000) / 10000,
      currency: 'USD',
      shortName: quote['01. symbol'] ?? symbol,
      source: 'alphavantage',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // History (Yahoo + Alpha Vantage)
  // ═══════════════════════════════════════════════════════════════════════════

  async getHistory(symbol: string): Promise<HistoryPoint[]> {
    const cacheKey = `market:history:${symbol}`;
    return this.redis.getOrSet<HistoryPoint[]>(cacheKey, 3600, async () => {
      try {
        return await this.getHistoryYahoo(symbol);
      } catch (err) {
        this.logger.warn(`Yahoo history failed for ${symbol}, trying Alpha Vantage...`);
        return await this.getHistoryAlphaVantage(symbol);
      }
    });
  }

  private async getHistoryYahoo(symbol: string): Promise<HistoryPoint[]> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketDataBot/1.0)' },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance history request failed: ${response.status}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    const chart = json?.chart as Record<string, unknown> | undefined;
    const result = (chart?.result as Record<string, unknown>[] | null)?.[0];

    if (!result) {
      throw new Error(`No history data from Yahoo Finance for ${symbol}`);
    }

    const timestamps = (result.timestamp as number[]) ?? [];
    const indicators = result.indicators as Record<string, unknown> | undefined;
    const quote = (indicators?.quote as Record<string, unknown>[])?.[0];
    const closes = (quote?.close as (number | null)[]) ?? [];

    const points: HistoryPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      const ts = timestamps[i];
      if (close !== null && close !== undefined && ts !== undefined) {
        points.push({ timestamp: ts, close });
      }
    }
    return points;
  }

  private async getHistoryAlphaVantage(symbol: string): Promise<HistoryPoint[]> {
    if (!this.alphaVantageKey) throw new Error('Alpha Vantage API key not configured');

    const url = `${this.AV_BASE}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${this.alphaVantageKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Alpha Vantage history failed: ${response.status}`);

    const json = (await response.json()) as Record<string, unknown>;
    if (json['Note'] || json['Information']) {
      throw new Error('Alpha Vantage rate limit reached');
    }

    const timeSeries = json['Time Series (Daily)'] as Record<string, Record<string, string>> | undefined;
    if (!timeSeries) throw new Error(`No history from Alpha Vantage for ${symbol}`);

    const points: HistoryPoint[] = [];
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

    for (const [dateStr, values] of Object.entries(timeSeries)) {
      const ts = new Date(dateStr).getTime() / 1000;
      const close = parseFloat(values['4. close'] ?? '0');
      if (ts * 1000 >= oneYearAgo && close > 0) {
        points.push({ timestamp: ts, close });
      }
    }

    return points.sort((a, b) => a.timestamp - b.timestamp);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Euribor (ECB)
  // ═══════════════════════════════════════════════════════════════════════════

  async getEuribor(): Promise<EuriborResult> {
    const cacheKey = 'market:ecb:euribor12m';
    return this.redis.getOrSet<EuriborResult>(cacheKey, 3600, async () => {
      const url =
        'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA?format=jsondata&lastNObservations=1';

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`ECB API request failed: ${response.status}`);
      }

      const json = (await response.json()) as Record<string, unknown>;
      const dataSets = json?.dataSets as Record<string, unknown>[] | undefined;
      const firstDataSet = dataSets?.[0] as Record<string, unknown> | undefined;
      const series = firstDataSet?.series as Record<string, unknown> | undefined;
      const seriesKey = series ? Object.keys(series)[0] : undefined;
      const observations =
        seriesKey && series
          ? ((series[seriesKey] as Record<string, unknown>)?.observations as Record<string, unknown[]>)
          : undefined;

      const structure = json?.structure as Record<string, unknown> | undefined;
      const dimensions = structure?.dimensions as Record<string, unknown> | undefined;
      const observationDimensions = dimensions?.observation as Record<string, unknown>[] | undefined;
      const timeDimension = observationDimensions?.find(
        (d) => (d as Record<string, unknown>)?.id === 'TIME_PERIOD',
      ) as Record<string, unknown> | undefined;
      const timeValues = timeDimension?.values as Record<string, unknown>[] | undefined;

      let rate = 0;
      let date = '';

      if (observations) {
        const obsKey = Object.keys(observations)[0];
        if (obsKey !== undefined) {
          const obsValues = observations[obsKey];
          rate = (obsValues?.[0] as number) ?? 0;
          const timeIndex = parseInt(obsKey, 10);
          date = (timeValues?.[timeIndex]?.id as string) ?? '';
        }
      }

      return { rate, date };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Alpha Vantage - Company Overview
  // ═══════════════════════════════════════════════════════════════════════════

  async getCompanyOverview(symbol: string): Promise<CompanyOverview> {
    const cacheKey = `market:av:overview:${symbol}`;
    return this.redis.getOrSet<CompanyOverview>(cacheKey, 86400, async () => {
      if (!this.alphaVantageKey) throw new Error('Alpha Vantage API key not configured');

      const url = `${this.AV_BASE}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${this.alphaVantageKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Alpha Vantage overview failed: ${response.status}`);

      const d = (await response.json()) as Record<string, string>;
      if (d['Note'] || d['Information'] || !d['Symbol']) {
        throw new Error(`No overview data from Alpha Vantage for ${symbol}`);
      }

      return {
        symbol: d['Symbol'] ?? symbol,
        name: d['Name'] ?? '',
        description: d['Description'] ?? '',
        exchange: d['Exchange'] ?? '',
        currency: d['Currency'] ?? 'USD',
        country: d['Country'] ?? '',
        sector: d['Sector'] ?? '',
        industry: d['Industry'] ?? '',
        marketCap: parseFloat(d['MarketCapitalization'] ?? '0'),
        peRatio: parseFloat(d['PERatio'] ?? '0'),
        pegRatio: parseFloat(d['PEGRatio'] ?? '0'),
        bookValue: parseFloat(d['BookValue'] ?? '0'),
        dividendYield: parseFloat(d['DividendYield'] ?? '0'),
        eps: parseFloat(d['EPS'] ?? '0'),
        beta: parseFloat(d['Beta'] ?? '0'),
        fiftyTwoWeekHigh: parseFloat(d['52WeekHigh'] ?? '0'),
        fiftyTwoWeekLow: parseFloat(d['52WeekLow'] ?? '0'),
        fiftyDayMA: parseFloat(d['50DayMovingAverage'] ?? '0'),
        twoHundredDayMA: parseFloat(d['200DayMovingAverage'] ?? '0'),
        sharesOutstanding: parseFloat(d['SharesOutstanding'] ?? '0'),
        profitMargin: parseFloat(d['ProfitMargin'] ?? '0'),
        revenuePerShare: parseFloat(d['RevenuePerShareTTM'] ?? '0'),
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Alpha Vantage - Symbol Search
  // ═══════════════════════════════════════════════════════════════════════════

  async searchSymbol(keywords: string): Promise<SearchResult[]> {
    const cacheKey = `market:av:search:${keywords}`;
    return this.redis.getOrSet<SearchResult[]>(cacheKey, 3600, async () => {
      if (!this.alphaVantageKey) throw new Error('Alpha Vantage API key not configured');

      const url = `${this.AV_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keywords)}&apikey=${this.alphaVantageKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Alpha Vantage search failed: ${response.status}`);

      const json = (await response.json()) as Record<string, unknown>;
      if (json['Note'] || json['Information']) {
        throw new Error('Alpha Vantage rate limit reached');
      }

      const matches = (json['bestMatches'] as Record<string, string>[]) ?? [];

      return matches.map((m) => ({
        symbol: m['1. symbol'] ?? '',
        name: m['2. name'] ?? '',
        type: m['3. type'] ?? '',
        region: m['4. region'] ?? '',
        marketOpen: m['5. marketOpen'] ?? '',
        marketClose: m['6. marketClose'] ?? '',
        timezone: m['7. timezone'] ?? '',
        currency: m['8. currency'] ?? '',
        matchScore: m['9. matchScore'] ?? '0',
      }));
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Alpha Vantage - Intraday Data
  // ═══════════════════════════════════════════════════════════════════════════

  async getIntraday(symbol: string, interval: string = '5min'): Promise<IntradayPoint[]> {
    const cacheKey = `market:av:intraday:${symbol}:${interval}`;
    return this.redis.getOrSet<IntradayPoint[]>(cacheKey, 300, async () => {
      if (!this.alphaVantageKey) throw new Error('Alpha Vantage API key not configured');

      const url = `${this.AV_BASE}?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=compact&apikey=${this.alphaVantageKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Alpha Vantage intraday failed: ${response.status}`);

      const json = (await response.json()) as Record<string, unknown>;
      if (json['Note'] || json['Information']) {
        throw new Error('Alpha Vantage rate limit reached');
      }

      const seriesKey = `Time Series (${interval})`;
      const timeSeries = json[seriesKey] as Record<string, Record<string, string>> | undefined;
      if (!timeSeries) throw new Error(`No intraday data from Alpha Vantage for ${symbol}`);

      const points: IntradayPoint[] = [];
      for (const [dateStr, values] of Object.entries(timeSeries)) {
        points.push({
          timestamp: dateStr,
          open: parseFloat(values['1. open'] ?? '0'),
          high: parseFloat(values['2. high'] ?? '0'),
          low: parseFloat(values['3. low'] ?? '0'),
          close: parseFloat(values['4. close'] ?? '0'),
          volume: parseInt(values['5. volume'] ?? '0', 10),
        });
      }

      return points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Alpha Vantage - Forex / Currency Exchange
  // ═══════════════════════════════════════════════════════════════════════════

  async getForexRate(fromCurrency: string, toCurrency: string): Promise<{
    from: string;
    to: string;
    exchangeRate: number;
    lastRefreshed: string;
    bidPrice: number;
    askPrice: number;
  }> {
    const cacheKey = `market:av:forex:${fromCurrency}:${toCurrency}`;
    return this.redis.getOrSet(cacheKey, 600, async () => {
      if (!this.alphaVantageKey) throw new Error('Alpha Vantage API key not configured');

      const url = `${this.AV_BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${this.alphaVantageKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Alpha Vantage forex failed: ${response.status}`);

      const json = (await response.json()) as Record<string, unknown>;
      if (json['Note'] || json['Information']) {
        throw new Error('Alpha Vantage rate limit reached');
      }

      const data = json['Realtime Currency Exchange Rate'] as Record<string, string> | undefined;
      if (!data) throw new Error(`No forex data for ${fromCurrency}/${toCurrency}`);

      return {
        from: data['1. From_Currency Code'] ?? fromCurrency,
        to: data['3. To_Currency Code'] ?? toCurrency,
        exchangeRate: parseFloat(data['5. Exchange Rate'] ?? '0'),
        lastRefreshed: data['6. Last Refreshed'] ?? '',
        bidPrice: parseFloat(data['8. Bid Price'] ?? '0'),
        askPrice: parseFloat(data['9. Ask Price'] ?? '0'),
      };
    });
  }
}
