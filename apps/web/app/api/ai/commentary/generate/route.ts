// ─── /api/ai/commentary/generate ────────────────────────────────────────────
// POST endpoint that generates a client-facing commentary for a structured
// product. Uses the Claude API when ANTHROPIC_API_KEY is available, otherwise
// falls back to a deterministic demo commentary.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  buildSystemPrompt,
  buildUserPrompt,
  type CommentaryContext,
  type CommentaryProductContext,
} from '@/lib/ai/commentary-prompts';
import { pickDemoCommentary } from '@/lib/ai/demo-commentaries';
import type { CommentaryParagraph } from '@/stores/commentary-store';

// ─── Validation ─────────────────────────────────────────────────────────────

// Nested-product shape (legacy / explicit).
const NestedProductSchema = z.object({
  name: z.string().min(1),
  isin: z.string().min(1),
  payoffType: z.string().min(1),
  couponPct: z.number().optional(),
  barrierPct: z.number().optional(),
  underlyingName: z.string().optional(),
  sri: z.number().optional(),
  maturityDate: z.string().optional(),
});

const NestedBodySchema = z.object({
  product: NestedProductSchema,
  clientProfile: z.enum(['prudent', 'equilibre', 'dynamique']),
  objectives: z.array(z.string()).default([]),
  tone: z.enum(['professionnel', 'pedagogique', 'technique']),
});

// Flat shape as specified by the task: fields live at the top-level of the body.
const FlatBodySchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  payoffType: z.string().min(1),
  isin: z.string().optional(),
  couponPct: z.number().nullable().optional(),
  barrierPct: z.number().nullable().optional(),
  underlyingName: z.string().optional(),
  sri: z.number().nullable().optional(),
  maturityDate: z.string().optional(),
  clientProfile: z.enum(['prudent', 'equilibre', 'dynamique']),
  objectives: z.array(z.string()).default([]),
  tone: z.enum(['professionnel', 'pedagogique', 'technique']),
});

type ParsedContext = {
  product: CommentaryProductContext;
  clientProfile: CommentaryContext['clientProfile'];
  objectives: string[];
  tone: CommentaryContext['tone'];
};

function toContext(input: unknown): ParsedContext | null {
  const nested = NestedBodySchema.safeParse(input);
  if (nested.success) {
    return {
      product: nested.data.product,
      clientProfile: nested.data.clientProfile,
      objectives: nested.data.objectives,
      tone: nested.data.tone,
    };
  }

  const flat = FlatBodySchema.safeParse(input);
  if (flat.success) {
    const d = flat.data;
    return {
      product: {
        name: d.productName,
        isin: d.isin ?? d.productId,
        payoffType: d.payoffType,
        couponPct: d.couponPct ?? undefined,
        barrierPct: d.barrierPct ?? undefined,
        underlyingName: d.underlyingName,
        sri: d.sri ?? undefined,
        maturityDate: d.maturityDate,
      },
      clientProfile: d.clientProfile,
      objectives: d.objectives,
      tone: d.tone,
    };
  }

  return null;
}

// ─── Claude API call ────────────────────────────────────────────────────────

interface ClaudeContentBlock {
  type: string;
  text?: string;
}

interface ClaudeResponse {
  content?: ClaudeContentBlock[];
}

async function callClaude(
  apiKey: string,
  ctx: CommentaryContext,
): Promise<CommentaryParagraph[] | null> {
  const systemPrompt = buildSystemPrompt(ctx);
  const userPrompt = buildUserPrompt(ctx);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as ClaudeResponse;
    const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
    if (!text) return null;

    // Extract JSON from the response (strip any markdown fences just in case)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (
      typeof parsed !== 'object' ||
      parsed == null ||
      !('paragraphs' in parsed)
    ) {
      return null;
    }

    const paragraphs = (parsed as { paragraphs: unknown }).paragraphs;
    if (!Array.isArray(paragraphs) || paragraphs.length < 4) return null;

    const validated: CommentaryParagraph[] = [];
    for (let i = 0; i < 4; i++) {
      const p = paragraphs[i] as { title?: unknown; body?: unknown } | undefined;
      if (!p || typeof p.title !== 'string' || typeof p.body !== 'string') {
        return null;
      }
      validated.push({ title: p.title, body: p.body });
    }
    return validated;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide (JSON attendu).' },
      { status: 400 },
    );
  }

  const ctx = toContext(json);
  if (!ctx) {
    return NextResponse.json(
      { error: 'Paramètres invalides.' },
      { status: 400 },
    );
  }

  const fullCtx: CommentaryContext = {
    product: ctx.product,
    clientProfile: ctx.clientProfile,
    objectives: ctx.objectives,
    tone: ctx.tone,
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let paragraphs: CommentaryParagraph[] | null = null;
  let source: 'claude' | 'demo' = 'demo';

  if (apiKey && apiKey.length > 0) {
    paragraphs = await callClaude(apiKey, fullCtx);
    if (paragraphs) source = 'claude';
  }

  if (!paragraphs) {
    paragraphs = pickDemoCommentary({
      product: fullCtx.product,
      clientProfile: fullCtx.clientProfile,
      tone: fullCtx.tone,
      objectives: fullCtx.objectives,
    });
    source = 'demo';
  }

  return NextResponse.json({ paragraphs, source });
}
