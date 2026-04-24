import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from './ai.service';
import { AIUnavailableException } from './exceptions/ai-unavailable.exception';
import { calculateCostUsd } from './pricing';
import type {
  AIChunk,
  AIResponse,
  ChatMessage,
} from './types/ai.types';

// ── Test doubles ─────────────────────────────────────────────────────────────

function makeConfig(overrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string | undefined> = {
    ANTHROPIC_API_KEY: 'test-key',
    ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
    FEATURE_AI_CLAUDE_REAL: 'true',
    ...overrides,
  };
  return {
    get: (k: string) => defaults[k],
  };
}

function makeRedisStub() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    setex: vi.fn(async (k: string, _ttl: number, v: string) => {
      store.set(k, v);
    }),
    del: vi.fn(async (k: string) => {
      store.delete(k);
    }),
    _store: store,
  };
}

function makePrismaStub() {
  const created: Array<Record<string, unknown>> = [];
  return {
    aIInteraction: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return data;
      }),
    },
    _created: created,
  };
}

function makeAnthropicStub(response: {
  text: string;
  input_tokens?: number;
  output_tokens?: number;
}) {
  return {
    messages: {
      create: vi.fn(async () => ({
        id: 'msg_1',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: response.text }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: response.input_tokens ?? 100,
          output_tokens: response.output_tokens ?? 200,
        },
      })),
      stream: vi.fn(() => {
        const events = [
          {
            type: 'message_start',
            message: {
              model: 'claude-3-5-sonnet-20241022',
              usage: { input_tokens: 100, output_tokens: 0 },
            },
          },
          {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: 'Hello' },
          },
          {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: ', world!' },
          },
          {
            type: 'message_delta',
            delta: { stop_reason: 'end_turn' },
            usage: { input_tokens: 100, output_tokens: 20 },
          },
        ];
        return {
          async *[Symbol.asyncIterator]() {
            for (const e of events) yield e;
          },
        };
      }),
    },
  };
}

async function buildService(opts: {
  configOverrides?: Record<string, string | undefined>;
  anthropic?: ReturnType<typeof makeAnthropicStub>;
}): Promise<{
  svc: AIService;
  redis: ReturnType<typeof makeRedisStub>;
  prisma: ReturnType<typeof makePrismaStub>;
  anthropic: ReturnType<typeof makeAnthropicStub>;
}> {
  const redis = makeRedisStub();
  const prisma = makePrismaStub();
  const anthropic =
    opts.anthropic ?? makeAnthropicStub({ text: 'Cached response body.' });
  const svc = new AIService(
    makeConfig(opts.configOverrides ?? {}) as never,
    prisma as never,
    redis as never,
  );
  // Bypass onModuleInit require() — inject the stub directly.
  (svc as unknown as { client: unknown }).client = anthropic;
  return { svc, redis, prisma, anthropic };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AIService.chat (non-streaming)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a structured response with usage and latency', async () => {
    const { svc, anthropic } = await buildService({});
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Explain autocall phoenix' },
    ];
    const res = (await svc.chat('u1', messages)) as AIResponse;
    expect(res.content).toContain('Cached response body.');
    expect(res.usage.inputTokens).toBe(100);
    expect(res.usage.outputTokens).toBe(200);
    expect(res.cached).toBe(false);
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
  });

  it('caches deterministic prompts and short-circuits the second call', async () => {
    const { svc, anthropic } = await buildService({});
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What is SRI?' },
    ];
    const first = (await svc.chat('u1', messages)) as AIResponse;
    const second = (await svc.chat('u1', messages)) as AIResponse;
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
  });

  it('bypasses cache when nocache=true', async () => {
    const { svc, anthropic } = await buildService({});
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What is SRI?' },
    ];
    await svc.chat('u1', messages);
    await svc.chat('u1', messages, { nocache: true });
    expect(anthropic.messages.create).toHaveBeenCalledTimes(2);
  });

  it('throws AIUnavailableException when the feature flag is off', async () => {
    const { svc } = await buildService({
      configOverrides: { FEATURE_AI_CLAUDE_REAL: 'false' },
    });
    await expect(
      svc.chat('u1', [{ role: 'user', content: 'x' }]),
    ).rejects.toBeInstanceOf(AIUnavailableException);
  });

  it('records an AIInteraction row per call', async () => {
    const { svc, prisma } = await buildService({});
    await svc.chat('user-42', [{ role: 'user', content: 'hi' }]);
    expect(prisma.aIInteraction.create).toHaveBeenCalledOnce();
    const data = prisma._created[0]!;
    expect(data.userId).toBe('user-42');
    expect(data.endpoint).toBe('chat');
    expect(data.tokensIn).toBe(100);
    expect(data.tokensOut).toBe(200);
  });
});

describe('AIService.chat (streaming)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('yields chunks and a final done event', async () => {
    const { svc } = await buildService({});
    const iterable = (await svc.chat(
      'u1',
      [{ role: 'user', content: 'stream this' }],
      { stream: true },
    )) as AsyncIterable<AIChunk>;
    const chunks: AIChunk[] = [];
    for await (const c of iterable) chunks.push(c);
    const textChunks = chunks
      .filter((c) => c.type === 'chunk')
      .map((c) => (c as { text: string }).text);
    expect(textChunks.join('')).toBe('Hello, world!');
    const done = chunks.find((c) => c.type === 'done');
    expect(done).toBeDefined();
  });
});

describe('AIService.generateCommentary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends the MIF II disclaimer', async () => {
    const anthropic = makeAnthropicStub({
      text: 'This product offers a conditional coupon.',
    });
    const { svc } = await buildService({ anthropic });
    const text = await svc.generateCommentary(
      'u1',
      {
        isin: 'FR0001',
        name: 'Test Product',
        payoffType: 'AUTOCALL_PHOENIX',
        issuerName: 'BNP',
        underlyingName: 'CAC 40',
        sri: 4,
        maturityDate: '2028-06-30',
      },
      {
        experienceLevel: 'intermediate',
        riskTolerance: 'medium',
        investmentHorizon: 'medium',
      },
    );
    expect(text).toContain('conditional coupon');
    expect(text).toContain('Information à caractère pédagogique uniquement');
  });
});

describe('calculateCostUsd', () => {
  it('computes a known cost for claude-3-5-sonnet', () => {
    // 1M input + 1M output = 3 + 15 = 18 USD
    expect(calculateCostUsd('claude-3-5-sonnet-20241022', 1_000_000, 1_000_000))
      .toBeCloseTo(18, 6);
  });

  it('is linear in input and output tokens', () => {
    const a = calculateCostUsd('claude-3-5-sonnet-20241022', 1000, 500);
    const b = calculateCostUsd('claude-3-5-sonnet-20241022', 2000, 1000);
    expect(b).toBeCloseTo(a * 2, 6);
  });
});
