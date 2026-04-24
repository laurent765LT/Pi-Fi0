'use client';

import { useCallback, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  productNames?: string[];
  productTypes?: string[];
}

export interface AIChatState {
  response: string;
  isStreaming: boolean;
  error: string | null;
  isDemo: boolean;
}

export interface UseAIChatOptions {
  /** Force demo mode regardless of NEXT_PUBLIC_USE_REAL_API. */
  demo?: boolean;
  /** Invoked with each streamed chunk (accumulating text is also tracked in state). */
  onChunk?: (delta: string) => void;
  /** Invoked once streaming completes. */
  onDone?: (full: string) => void;
  /** Optional access token for the /ai/chat request (Bearer). */
  token?: string | null;
}

// ─── Environment helpers ─────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const USE_REAL_API =
  (process.env.NEXT_PUBLIC_USE_REAL_API ?? 'true').toLowerCase() === 'true';

// ─── Demo fallback — delegates to the legacy intelligent engine when possible ─

function demoReply(messages: ChatMessage[]): string {
  const last = messages[messages.length - 1]?.content ?? '';
  return [
    `Mode démo : réponse factice à votre message « ${last.slice(0, 80)} ».`,
    '',
    "L'API IA réelle n'est pas activée (`NEXT_PUBLIC_USE_REAL_API=false`).",
    "Déployez l'API NestJS et repassez ce flag à `true` pour obtenir des réponses Claude en temps réel.",
    '',
    "_Information à caractère pédagogique uniquement. Ne constitue pas un conseil en investissement. Consultez votre conseiller._",
  ].join('\n');
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * React hook for talking to `/ai/chat`.
 *
 * - **Streaming mode (default)**: opens an SSE connection and yields chunks
 *   via `onChunk` while updating the `response` state in real time.
 * - **Demo mode**: resolves with a canned response after a short delay.
 *
 * Example:
 * ```tsx
 * const { send, response, isStreaming } = useAIChat({ token });
 * await send([{ role: 'user', content: 'Explain autocalls' }]);
 * ```
 */
export function useAIChat(options: UseAIChatOptions = {}) {
  const [state, setState] = useState<AIChatState>({
    response: '',
    isStreaming: false,
    error: null,
    isDemo: options.demo ?? !USE_REAL_API,
  });
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({
      response: '',
      isStreaming: false,
      error: null,
      isDemo: options.demo ?? !USE_REAL_API,
    });
  }, [options.demo]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const send = useCallback(
    async (
      messages: ChatMessage[],
      args: { context?: ChatContext; stream?: boolean; nocache?: boolean } = {},
    ): Promise<string> => {
      const { stream = true, context, nocache } = args;
      const demo = options.demo ?? !USE_REAL_API;

      setState({ response: '', isStreaming: true, error: null, isDemo: demo });

      if (demo) {
        // Simulate a short delay so consumers still see streaming-like UX.
        await new Promise((r) => setTimeout(r, 400));
        const text = demoReply(messages);
        setState({ response: text, isStreaming: false, error: null, isDemo: true });
        options.onChunk?.(text);
        options.onDone?.(text);
        return text;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

      try {
        const res = await fetch(`${API_BASE}/ai/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages, context, stream, nocache }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const msg =
            res.status === 503
              ? 'Service IA temporairement indisponible. Veuillez réessayer dans quelques instants.'
              : `Erreur ${res.status}`;
          setState({ response: '', isStreaming: false, error: msg, isDemo: false });
          return '';
        }

        if (!stream) {
          const data = (await res.json()) as { content?: string };
          const text = data.content ?? '';
          setState({ response: text, isStreaming: false, error: null, isDemo: false });
          options.onDone?.(text);
          return text;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let full = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const raw of events) {
            const trimmed = raw.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload) continue;
            try {
              const parsed = JSON.parse(payload) as {
                chunk?: string;
                done?: boolean;
                error?: string;
              };
              if (parsed.error) {
                setState({
                  response: full,
                  isStreaming: false,
                  error: parsed.error,
                  isDemo: false,
                });
                return full;
              }
              if (parsed.chunk) {
                full += parsed.chunk;
                options.onChunk?.(parsed.chunk);
                setState((s) => ({ ...s, response: full }));
              }
              if (parsed.done) {
                setState({
                  response: full,
                  isStreaming: false,
                  error: null,
                  isDemo: false,
                });
                options.onDone?.(full);
                return full;
              }
            } catch {
              // Malformed SSE frame — ignore.
            }
          }
        }
        setState((s) => ({ ...s, isStreaming: false }));
        options.onDone?.(full);
        return full;
      } catch (err) {
        if (controller.signal.aborted) {
          return '';
        }
        const msg = err instanceof Error ? err.message : 'Erreur réseau';
        setState({ response: '', isStreaming: false, error: msg, isDemo: false });
        return '';
      } finally {
        abortRef.current = null;
      }
    },
    [options],
  );

  return {
    ...state,
    send,
    abort,
    reset,
  };
}
