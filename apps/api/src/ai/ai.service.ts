import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';
import { AIUnavailableException } from './exceptions/ai-unavailable.exception';
import {
  CHAT_SYSTEM_V1,
  PORTFOLIO_ANALYSIS_V1,
  PRODUCT_COMMENTARY_V1,
  MIF2_DISCLAIMER_SUFFIX,
  type PortfolioSummary,
  type ProductInput,
  type ClientProfile,
} from './prompts';
import { calculateCostUsd } from './pricing';
import type {
  AIAnalysis,
  AIChatOptions,
  AIChunk,
  AIResponse,
  ChatMessage,
  TokenUsage,
} from './types/ai.types';

// ─── Minimal SDK shape ───────────────────────────────────────────────────────
//
// We cannot hard-depend on the `@anthropic-ai/sdk` package at compile time
// (the repo may be bootstrapped before the `npm install` step). We declare the
// narrow subset of the SDK surface we rely on, then dynamically require() the
// module at runtime. If the package is missing we fail loudly in onModuleInit.

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface AnthropicContentBlockText {
  type: 'text';
  text: string;
}

interface AnthropicMessage {
  id: string;
  model: string;
  content: Array<AnthropicContentBlockText | { type: string }>;
  stop_reason: string | null;
  usage: AnthropicUsage;
}

interface AnthropicStreamEvent {
  type: string;
  index?: number;
  delta?: { type?: string; text?: string; stop_reason?: string };
  content_block?: { type: string };
  message?: { model?: string; usage?: AnthropicUsage };
  usage?: AnthropicUsage;
}

interface AnthropicMessagesClient {
  create(params: {
    model: string;
    max_tokens: number;
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    stream?: false;
  }): Promise<AnthropicMessage>;
  stream(params: {
    model: string;
    max_tokens: number;
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): AsyncIterable<AnthropicStreamEvent>;
}

interface AnthropicSDK {
  messages: AnthropicMessagesClient;
}

// Narrow typing around `@sentry/node` — we don't want to fail hard if Sentry
// isn't configured; we just log locally.
interface SentryLike {
  captureException: (err: unknown, hint?: Record<string, unknown>) => void;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const CACHE_TTL_SECONDS = 3600;
const DEFAULT_MAX_TOKENS = 2000;
const PORTFOLIO_MAX_TOKENS = 4000;
const CACHE_KEY_MAX_CHARS = 64;
const API_TIMEOUT_MS = 30_000;

type EndpointName = 'chat' | 'analyzePortfolio' | 'generateCommentary';

interface ChatCallParams {
  userId: string;
  endpoint: EndpointName;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  options: AIChatOptions;
  promptVersion: string;
  history?: ChatMessage[];
}

@Injectable()
export class AIService implements OnModuleInit {
  private readonly logger = new Logger(AIService.name);
  private client: AnthropicSDK | null = null;
  private sentry: SentryLike | null = null;
  private readonly model: string;
  private readonly featureFlag: boolean;
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.apiKey = this.config.get<string>('ANTHROPIC_API_KEY') ?? '';
    this.model =
      this.config.get<string>('ANTHROPIC_MODEL') ??
      'claude-3-5-sonnet-20241022';
    this.featureFlag =
      this.config.get<string>('FEATURE_AI_CLAUDE_REAL') === 'true';
  }

  async onModuleInit(): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not configured — AI features disabled',
      );
      return;
    }
    if (!this.featureFlag) {
      this.logger.log(
        'FEATURE_AI_CLAUDE_REAL=false — AI calls will be refused in production mode',
      );
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod: unknown = require('@anthropic-ai/sdk');
      const AnthropicCtor = this.extractAnthropicCtor(mod);
      this.client = new AnthropicCtor({ apiKey: this.apiKey }) as AnthropicSDK;
      this.logger.log(
        `Claude SDK initialised (model=${this.model}, flag=${this.featureFlag})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to load @anthropic-ai/sdk — install it with "npm i @anthropic-ai/sdk". Cause: ${String(
          err,
        )}`,
      );
    }
    // Optional Sentry. We load it lazily so the worker boots even if the dep
    // isn't installed yet.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.sentry = require('@sentry/node') as SentryLike;
    } catch {
      /* Sentry not installed — silent */
    }
  }

  private extractAnthropicCtor(mod: unknown): new (opts: {
    apiKey: string;
  }) => unknown {
    if (typeof mod === 'function') {
      return mod as new (opts: { apiKey: string }) => unknown;
    }
    if (mod && typeof mod === 'object') {
      const asObj = mod as { default?: unknown; Anthropic?: unknown };
      if (typeof asObj.default === 'function') {
        return asObj.default as new (opts: { apiKey: string }) => unknown;
      }
      if (typeof asObj.Anthropic === 'function') {
        return asObj.Anthropic as new (opts: { apiKey: string }) => unknown;
      }
    }
    throw new Error('Could not locate Anthropic constructor in @anthropic-ai/sdk');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API
  // ───────────────────────────────────────────────────────────────────────────

  isConfigured(): boolean {
    return Boolean(this.client) && this.featureFlag;
  }

  /**
   * Main chat entrypoint. Accepts a history of messages (the latest is the
   * user's current question). Caches deterministic single-turn prompts only.
   */
  async chat(
    userId: string,
    messages: ChatMessage[],
    options: AIChatOptions = {},
  ): Promise<AIResponse | AsyncIterable<AIChunk>> {
    if (!messages.length) {
      throw new AIUnavailableException('empty_messages');
    }
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      throw new AIUnavailableException('last_message_must_be_user');
    }
    const history = messages.slice(0, -1);

    const systemPrompt = CHAT_SYSTEM_V1.systemPrompt;
    const userPrompt = CHAT_SYSTEM_V1.buildUserPrompt(
      last.content,
      options.context,
    );

    if (options.stream) {
      return this.streamChat({
        userId,
        endpoint: 'chat',
        systemPrompt,
        userPrompt,
        history,
        maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        options,
        promptVersion: CHAT_SYSTEM_V1.version,
      });
    }

    return this.executeChat({
      userId,
      endpoint: 'chat',
      systemPrompt,
      userPrompt,
      history,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      options,
      promptVersion: CHAT_SYSTEM_V1.version,
    });
  }

  async analyzePortfolio(
    userId: string,
    portfolioData: PortfolioSummary,
  ): Promise<AIAnalysis> {
    const userPrompt = PORTFOLIO_ANALYSIS_V1.buildUserPrompt(portfolioData);
    const response = await this.executeChat({
      userId,
      endpoint: 'analyzePortfolio',
      systemPrompt: PORTFOLIO_ANALYSIS_V1.systemPrompt,
      userPrompt,
      maxTokens: PORTFOLIO_MAX_TOKENS,
      options: {},
      promptVersion: PORTFOLIO_ANALYSIS_V1.version,
    });
    return this.toAnalysis(response, PORTFOLIO_ANALYSIS_V1.version);
  }

  async generateCommentary(
    userId: string,
    product: ProductInput,
    profile: ClientProfile,
  ): Promise<string> {
    const userPrompt = PRODUCT_COMMENTARY_V1.buildUserPrompt(product, profile);
    const response = await this.executeChat({
      userId,
      endpoint: 'generateCommentary',
      systemPrompt: PRODUCT_COMMENTARY_V1.systemPrompt,
      userPrompt,
      maxTokens: DEFAULT_MAX_TOKENS,
      options: {},
      promptVersion: PRODUCT_COMMENTARY_V1.version,
    });
    return this.withDisclaimer(response.content);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cache helper (exported shape matches task spec)
  // ───────────────────────────────────────────────────────────────────────────

  async getCached<T>(
    key: string,
    ttlSec: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    try {
      const hit = await this.redis.get(key);
      if (hit) {
        return JSON.parse(hit) as T;
      }
    } catch (err) {
      this.logger.warn(`Redis GET failed (${key}): ${String(err)}`);
    }
    const value = await fetcher();
    try {
      await this.redis.setex(key, ttlSec, JSON.stringify(value));
    } catch (err) {
      this.logger.warn(`Redis SETEX failed (${key}): ${String(err)}`);
    }
    return value;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internal: non-streaming path
  // ───────────────────────────────────────────────────────────────────────────

  private async executeChat(params: ChatCallParams): Promise<AIResponse> {
    this.ensureReady();
    const start = Date.now();
    const { userId, endpoint, systemPrompt, userPrompt, maxTokens, options } =
      params;

    const cacheKey = this.buildCacheKey(userId, userPrompt, this.model);
    const canCache = !options.stream && !options.nocache && !params.history?.length;

    if (canCache) {
      try {
        const raw = await this.redis.get(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as AIResponse;
          await this.trackInteraction({
            userId,
            endpoint,
            promptHash: this.shortHash(userPrompt),
            tokensIn: 0,
            tokensOut: 0,
            latencyMs: Date.now() - start,
            costUsd: 0,
            cached: true,
            model: cached.model,
            success: true,
          });
          return { ...cached, cached: true, latencyMs: Date.now() - start };
        }
      } catch (err) {
        this.logger.warn(`Cache read failed: ${String(err)}`);
      }
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (params.history) {
      for (const m of params.history) {
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: 'user', content: userPrompt });

    let anthropicResponse: AnthropicMessage;
    try {
      anthropicResponse = await this.callWithTimeout(() =>
        this.client!.messages.create({
          model: this.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages,
          stream: false,
        }),
      );
    } catch (err) {
      await this.onApiError(err, userId, endpoint, userPrompt, start);
      throw new AIUnavailableException(this.classifyError(err), err);
    }

    const text = this.extractText(anthropicResponse);
    const usage: TokenUsage = {
      inputTokens: anthropicResponse.usage.input_tokens,
      outputTokens: anthropicResponse.usage.output_tokens,
    };
    const costUsd = calculateCostUsd(
      anthropicResponse.model,
      usage.inputTokens,
      usage.outputTokens,
    );

    const result: AIResponse = {
      id: anthropicResponse.id,
      model: anthropicResponse.model,
      content: text,
      usage,
      stopReason: anthropicResponse.stop_reason ?? 'end_turn',
      cached: false,
      latencyMs: Date.now() - start,
    };

    if (canCache) {
      try {
        await this.redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
      } catch (err) {
        this.logger.warn(`Cache write failed: ${String(err)}`);
      }
    }

    await this.trackInteraction({
      userId,
      endpoint,
      promptHash: this.shortHash(userPrompt),
      tokensIn: usage.inputTokens,
      tokensOut: usage.outputTokens,
      latencyMs: result.latencyMs,
      costUsd,
      cached: false,
      model: result.model,
      success: true,
    });

    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internal: streaming path
  // ───────────────────────────────────────────────────────────────────────────

  private async *streamChat(
    params: ChatCallParams,
  ): AsyncIterable<AIChunk> {
    this.ensureReady();
    const start = Date.now();
    const { userId, endpoint, systemPrompt, userPrompt, maxTokens } = params;

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (params.history) {
      for (const m of params.history) {
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: 'user', content: userPrompt });

    let stream: AsyncIterable<AnthropicStreamEvent>;
    try {
      stream = this.client!.messages.stream({
        model: this.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      });
    } catch (err) {
      await this.onApiError(err, userId, endpoint, userPrompt, start);
      throw new AIUnavailableException(this.classifyError(err), err);
    }

    let modelId = this.model;
    const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    let stopReason = 'end_turn';

    try {
      for await (const event of stream) {
        if (event.type === 'message_start' && event.message) {
          modelId = event.message.model ?? modelId;
          if (event.message.usage) {
            usage.inputTokens = event.message.usage.input_tokens ?? 0;
            usage.outputTokens = event.message.usage.output_tokens ?? 0;
          }
        } else if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta' &&
          event.delta.text
        ) {
          yield { type: 'chunk', text: event.delta.text };
        } else if (event.type === 'message_delta') {
          if (event.usage) {
            usage.outputTokens = event.usage.output_tokens ?? usage.outputTokens;
          }
          if (event.delta?.stop_reason) {
            stopReason = event.delta.stop_reason;
          }
        }
      }
    } catch (err) {
      await this.onApiError(err, userId, endpoint, userPrompt, start);
      throw new AIUnavailableException(this.classifyError(err), err);
    }

    yield { type: 'done', usage, model: modelId, stopReason };

    const costUsd = calculateCostUsd(modelId, usage.inputTokens, usage.outputTokens);
    await this.trackInteraction({
      userId,
      endpoint,
      promptHash: this.shortHash(userPrompt),
      tokensIn: usage.inputTokens,
      tokensOut: usage.outputTokens,
      latencyMs: Date.now() - start,
      costUsd,
      cached: false,
      model: modelId,
      success: true,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ───────────────────────────────────────────────────────────────────────────

  private ensureReady(): void {
    if (!this.client || !this.featureFlag) {
      throw new AIUnavailableException(
        !this.client ? 'sdk_not_initialised' : 'feature_flag_off',
      );
    }
  }

  private async callWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`claude_timeout_${API_TIMEOUT_MS}ms`));
      }, API_TIMEOUT_MS);
      fn()
        .then((v) => {
          clearTimeout(timer);
          resolve(v);
        })
        .catch((e: unknown) => {
          clearTimeout(timer);
          reject(e instanceof Error ? e : new Error(String(e)));
        });
    });
  }

  private extractText(msg: AnthropicMessage): string {
    const parts: string[] = [];
    for (const block of msg.content) {
      if (block.type === 'text') {
        parts.push((block as AnthropicContentBlockText).text);
      }
    }
    return parts.join('');
  }

  private buildCacheKey(userId: string, prompt: string, model: string): string {
    const raw = createHash('sha256')
      .update(`${userId}:${prompt}:${model}`)
      .digest('hex');
    return `ai:cache:${raw.slice(0, CACHE_KEY_MAX_CHARS)}`;
  }

  private shortHash(prompt: string): string {
    return createHash('sha256').update(prompt).digest('hex').slice(0, 32);
  }

  private withDisclaimer(content: string): string {
    return content.trimEnd() + MIF2_DISCLAIMER_SUFFIX;
  }

  private toAnalysis(response: AIResponse, version: string): AIAnalysis {
    return {
      content: this.withDisclaimer(response.content),
      model: response.model,
      usage: response.usage,
      cached: response.cached,
      latencyMs: response.latencyMs,
      promptVersion: version,
    };
  }

  private classifyError(err: unknown): string {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes('timeout')) return 'timeout';
      if (msg.includes('429') || msg.includes('rate')) return 'rate_limit';
      if (msg.includes('401') || msg.includes('auth')) return 'auth';
      if (msg.includes('quota')) return 'quota_exceeded';
      if (msg.includes('5')) return 'upstream_5xx';
    }
    return 'unknown';
  }

  private async onApiError(
    err: unknown,
    userId: string,
    endpoint: EndpointName,
    prompt: string,
    start: number,
  ): Promise<void> {
    this.logger.error(
      `Claude API error (${endpoint}): ${err instanceof Error ? err.message : String(err)}`,
    );
    if (this.sentry) {
      try {
        this.sentry.captureException(err, {
          tags: { endpoint, module: 'ai', userId },
        });
      } catch {
        /* ignore */
      }
    }
    await this.trackInteraction({
      userId,
      endpoint,
      promptHash: this.shortHash(prompt),
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: Date.now() - start,
      costUsd: 0,
      cached: false,
      model: this.model,
      success: false,
    });
  }

  private async trackInteraction(input: {
    userId: string;
    endpoint: EndpointName;
    promptHash: string;
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    costUsd: number;
    cached: boolean;
    model: string;
    success: boolean;
  }): Promise<void> {
    // Best effort — a DB write failure should NEVER block an AI response.
    // The AIInteraction model is provisioned by a parallel migration agent;
    // if it's not yet deployed we fall back to a structured log line so the
    // data is still recoverable.
    const prismaAny = this.prisma as unknown as {
      aIInteraction?: {
        create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
      };
      aiInteraction?: {
        create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
      };
    };
    const model = prismaAny.aIInteraction ?? prismaAny.aiInteraction;
    const payload = {
      userId: input.userId,
      endpoint: input.endpoint,
      promptHash: input.promptHash,
      tokensIn: input.tokensIn,
      tokensOut: input.tokensOut,
      latencyMs: input.latencyMs,
      estimatedCostUsd: input.costUsd,
      cached: input.cached,
      model: input.model,
      success: input.success,
    };
    if (!model) {
      this.logger.log(`ai_interaction ${JSON.stringify(payload)}`);
      return;
    }
    try {
      await model.create({ data: payload });
    } catch (err) {
      this.logger.warn(
        `AIInteraction persist failed (${input.endpoint}): ${String(err)}`,
      );
    }
  }
}
