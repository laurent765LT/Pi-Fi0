/**
 * AI / Chat HTTP contracts.
 *
 * The chat surface uses Server-Sent Events (SSE): server emits a sequence of
 * {@link StreamChunk} messages terminated by an empty `data: [DONE]` frame.
 */

/** Role of a chat message, following OpenAI/Anthropic conventions. */
export const ChatRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  TOOL: 'tool',
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

/** Single message in a conversation. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Optional id of the tool call this message responds to. */
  toolCallId?: string;
  /** Optional name of the tool (when role = TOOL). */
  name?: string;
}

/** Request body for POST /ai/chat (non-streaming) or /ai/chat/stream (SSE). */
export interface ChatRequest {
  messages: ChatMessage[];
  /** Optional provider/model override (ops-only). */
  model?: string;
  /** Sampling temperature (0.0 = deterministic, 1.0 = creative). */
  temperature?: number;
  /** Hard cap on response length. */
  maxTokens?: number;
  /** Arbitrary correlation id for observability. */
  requestId?: string;
}

/** Non-streaming response to POST /ai/chat. */
export interface ChatResponse {
  message: ChatMessage;
  /** Approximate token usage for billing. */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Individual SSE chunk for POST /ai/chat/stream. */
export type StreamChunk =
  | { type: 'content.delta'; delta: string }
  | { type: 'message.end'; usage: ChatResponse['usage'] }
  | { type: 'error'; message: string };

/** Request body for POST /ai/analyze-portfolio. */
export interface AnalyzePortfolioRequest {
  clientId: string;
  /** Positions to analyse (ids of open Position records). */
  positionIds: string[];
  /** Optional horizon in months (defaults to 12). */
  horizonMonths?: number;
}

/** Response to POST /ai/analyze-portfolio. */
export interface AnalyzePortfolioResponse {
  summary: string;
  findings: Array<{
    severity: 'info' | 'warning' | 'alert';
    title: string;
    description: string;
  }>;
  recommendations: Array<{
    productId: string;
    rationale: string;
    score: number;
  }>;
}
