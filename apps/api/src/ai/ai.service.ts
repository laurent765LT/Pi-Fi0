import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  citations?: string[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface AnalysisResult {
  content: string;
  citations: string[];
  model: string;
  tokensUsed: number;
}

type AiProvider = 'claude' | 'perplexity';

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly perplexityKey: string;
  private readonly anthropicKey: string;
  private readonly provider: AiProvider;
  private readonly PERPLEXITY_URL = 'https://api.perplexity.ai';
  private readonly ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY') ?? '';
    this.perplexityKey = this.config.get<string>('PERPLEXITY_API_KEY') ?? '';

    // Prefer Claude, fallback to Perplexity
    if (this.anthropicKey) {
      this.provider = 'claude';
      this.logger.log('Claude API configured ✓ (primary provider)');
    } else if (this.perplexityKey) {
      this.provider = 'perplexity';
      this.logger.log('Perplexity API configured ✓ (fallback provider)');
    } else {
      this.provider = 'claude';
      this.logger.warn('No AI API key configured — AI features will be limited');
    }
  }

  // Backward compat alias
  private get apiKey(): string {
    return this.provider === 'claude' ? this.anthropicKey : this.perplexityKey;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Core Perplexity API Call
  // ═══════════════════════════════════════════════════════════════════════════

  async chat(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      searchDomainFilter?: string[];
      returnCitations?: boolean;
    } = {},
  ): Promise<PerplexityResponse> {
    if (!this.apiKey) {
      throw new Error('No AI API key configured');
    }

    if (this.provider === 'claude') {
      return this.chatWithClaude(messages, options);
    }
    return this.chatWithPerplexity(messages, options);
  }

  private async chatWithClaude(
    messages: ChatMessage[],
    options: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<PerplexityResponse> {
    const { temperature = 0.2, maxTokens = 2048 } = options;

    // Separate system message from conversation
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      temperature,
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
    };
    if (systemMsg) {
      body.system = systemMsg.content;
    }

    const response = await fetch(this.ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Claude API error ${response.status}: ${errorText}`);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as any;
    // Normalize Claude response to PerplexityResponse shape
    return {
      id: data.id,
      model: data.model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: data.content?.[0]?.text ?? '' },
        finish_reason: data.stop_reason ?? 'end_turn',
      }],
      citations: [],
      usage: {
        prompt_tokens: data.usage?.input_tokens ?? 0,
        completion_tokens: data.usage?.output_tokens ?? 0,
        total_tokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    };
  }

  private async chatWithPerplexity(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      searchDomainFilter?: string[];
      returnCitations?: boolean;
    },
  ): Promise<PerplexityResponse> {
    const {
      model = 'sonar',
      temperature = 0.2,
      maxTokens = 2048,
      searchDomainFilter,
      returnCitations = true,
    } = options;

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      return_citations: returnCitations,
    };

    if (searchDomainFilter?.length) {
      body.search_domain_filter = searchDomainFilter;
    }

    const response = await fetch(`${this.PERPLEXITY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Perplexity API error ${response.status}: ${errorText}`);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    return (await response.json()) as PerplexityResponse;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Financial Chat Assistant
  // ═══════════════════════════════════════════════════════════════════════════

  async financialChat(
    userMessage: string,
    context?: { productNames?: string[]; productTypes?: string[] },
  ): Promise<AnalysisResult> {
    const systemPrompt = `Tu es un assistant financier expert en produits structurés pour la plateforme Strick'in.
Tu aides les conseillers en gestion de patrimoine (CGP) et les investisseurs institutionnels.

Tes domaines d'expertise :
- Produits structurés : Autocall Phoenix, Autocall Coupon, Capital Protégé, Barrier Reverse Convertibles, Credit Linked Notes
- Indices de risque SRI (1-7)
- Barrières de protection du capital
- Sous-jacents : indices (Euro Stoxx 50, S&P 500, CAC 40), actions individuelles, matières premières
- Marchés financiers européens et internationaux
- Réglementation MiFID II, PRIIPs, DICI

${context?.productNames?.length ? `\nProduits actuellement disponibles sur la plateforme : ${context.productNames.join(', ')}` : ''}
${context?.productTypes?.length ? `\nTypes de produits disponibles : ${context.productTypes.join(', ')}` : ''}

Réponds de manière concise, professionnelle et en français. Fournis des données de marché actuelles quand c'est pertinent.
Si on te demande un conseil d'investissement, rappelle que tu fournis des informations à titre éducatif et non un conseil personnalisé.`;

    const response = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      {
        model: 'sonar',
        temperature: 0.3,
        maxTokens: 1500,
        searchDomainFilter: [
          'reuters.com',
          'bloomberg.com',
          'ft.com',
          'lesechos.fr',
          'boursorama.com',
          'investir.lesechos.fr',
          'zonebourse.com',
        ],
        returnCitations: true,
      },
    );

    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? '',
      citations: response.citations ?? [],
      model: response.model,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Underlying Analysis (for product detail pages)
  // ═══════════════════════════════════════════════════════════════════════════

  async analyzeUnderlying(
    underlyingName: string,
    underlyingTicker: string,
  ): Promise<AnalysisResult> {
    const cacheKey = `ai:underlying:${underlyingTicker}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AnalysisResult;
    }

    const response = await this.chat(
      [
        {
          role: 'system',
          content: `Tu es un analyste financier senior. Fournis une analyse concise et factuelle en français.
Structure ta réponse en sections :
1. **Situation actuelle** — Prix récent, tendance, performance YTD
2. **Facteurs clés** — Catalyseurs positifs et risques principaux
3. **Consensus analystes** — Target price moyen, recommandation consensus
4. **Impact sur les produits structurés** — Comment la volatilité et la tendance affectent les autocalls/barrières

Sois factuel et utilise des données chiffrées quand disponibles.`,
        },
        {
          role: 'user',
          content: `Analyse complète du sous-jacent ${underlyingName} (${underlyingTicker}) pour l'évaluation de produits structurés.`,
        },
      ],
      {
        model: 'sonar',
        temperature: 0.2,
        maxTokens: 2000,
        returnCitations: true,
      },
    );

    const choice = response.choices[0];
    const result: AnalysisResult = {
      content: choice?.message?.content ?? '',
      citations: response.citations ?? [],
      model: response.model,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };

    // Cache for 4 hours
    await this.redis.setex(cacheKey, 14400, JSON.stringify(result));

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Market Sentiment / Trade Ideas
  // ═══════════════════════════════════════════════════════════════════════════

  async getMarketSentiment(topic?: string): Promise<AnalysisResult> {
    const cacheKey = `ai:sentiment:${topic ?? 'general'}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AnalysisResult;
    }

    const query = topic
      ? `Analyse le sentiment de marché actuel concernant ${topic} et son impact sur les produits structurés européens.`
      : `Donne un résumé du sentiment de marché actuel en Europe. Quels sont les thèmes dominants et comment impactent-ils les produits structurés (autocalls, barrières, capital protégé) ? Mentionne les indices majeurs (Euro Stoxx 50, CAC 40, DAX) et la volatilité.`;

    const response = await this.chat(
      [
        {
          role: 'system',
          content: `Tu es un stratégiste de marché spécialisé en produits structurés. Fournis un briefing matinal concis en français avec :
- Tendance marché (bullish/bearish/neutre)
- Points de données clés
- Implications pour les produits structurés en cours
- Risques à surveiller

Utilise des données actuelles et chiffrées.`,
        },
        { role: 'user', content: query },
      ],
      {
        model: 'sonar',
        temperature: 0.3,
        maxTokens: 1500,
        returnCitations: true,
      },
    );

    const choice = response.choices[0];
    const result: AnalysisResult = {
      content: choice?.message?.content ?? '',
      citations: response.citations ?? [],
      model: response.model,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };

    // Cache for 2 hours
    await this.redis.setex(cacheKey, 7200, JSON.stringify(result));

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Product Risk Assessment
  // ═══════════════════════════════════════════════════════════════════════════

  async assessProductRisk(productInfo: {
    name: string;
    payoffType: string;
    underlyingName: string;
    underlyingTicker: string;
    barrierPct: number | null;
    couponPct: number | null;
    maturityDate: string;
    sri: number;
  }): Promise<AnalysisResult> {
    const response = await this.chat(
      [
        {
          role: 'system',
          content: `Tu es un risk manager senior spécialisé en produits structurés. Analyse le risque du produit fourni.
Structure ta réponse :
1. **Profil de risque** — SRI, type de risque principal
2. **Analyse du sous-jacent** — Performance récente, volatilité, distance à la barrière
3. **Scénarios** — Favorable, neutre, défavorable avec probabilités estimées
4. **Recommandation** — Pour quel profil client ce produit convient

Sois précis et quantitatif.`,
        },
        {
          role: 'user',
          content: `Analyse de risque du produit structuré :
- Nom : ${productInfo.name}
- Type : ${productInfo.payoffType}
- Sous-jacent : ${productInfo.underlyingName} (${productInfo.underlyingTicker})
- Barrière : ${productInfo.barrierPct ? productInfo.barrierPct + '%' : 'N/A'}
- Coupon : ${productInfo.couponPct ? productInfo.couponPct + '% p.a.' : 'N/A'}
- Maturité : ${productInfo.maturityDate}
- SRI : ${productInfo.sri}/7`,
        },
      ],
      {
        model: 'sonar',
        temperature: 0.2,
        maxTokens: 2000,
        returnCitations: true,
      },
    );

    const choice = response.choices[0];
    return {
      content: choice?.message?.content ?? '',
      citations: response.citations ?? [],
      model: response.model,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }
}
