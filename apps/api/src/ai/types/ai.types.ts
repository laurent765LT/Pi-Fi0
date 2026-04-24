/**
 * Shared TypeScript types for the AI module.
 * These are intentionally provider-neutral so we can swap SDKs without
 * rippling changes through the rest of the codebase.
 */

// Re-export domain types from prompts so controllers/services have one
// import location to reach for.
export type {
  PortfolioPosition,
  PortfolioSummary,
} from '../prompts/portfolio-analysis.v1';
export type { ProductInput, ClientProfile } from '../prompts/product-commentary.v1';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AIResponse {
  id: string;
  model: string;
  content: string;
  usage: TokenUsage;
  stopReason: string;
  /** true if this response was served from the Redis cache. */
  cached: boolean;
  /** milliseconds end-to-end (including cache lookup). */
  latencyMs: number;
}

export type AIChunk =
  | { type: 'chunk'; text: string }
  | { type: 'done'; usage: TokenUsage; model: string; stopReason: string };

export interface AIAnalysis {
  content: string;
  model: string;
  usage: TokenUsage;
  cached: boolean;
  latencyMs: number;
  promptVersion: string;
}

export interface AIChatOptions {
  stream?: boolean;
  nocache?: boolean;
  maxTokens?: number;
  temperature?: number;
  /** Metadata passed to the chat prompt builder. */
  context?: {
    productNames?: string[];
    productTypes?: string[];
  };
}

export interface AIUsageDaily {
  date: string; // ISO yyyy-mm-dd
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  errors: number;
}

export interface AIUsageTopUser {
  userId: string;
  email: string | null;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

export interface AIUsageStats {
  windowDays: number;
  totalRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  errorRate: number;
  cacheHitRate: number;
  daily: AIUsageDaily[];
  topUsers: AIUsageTopUser[];
}
