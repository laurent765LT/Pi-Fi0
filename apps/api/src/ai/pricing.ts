/**
 * Claude pricing table (USD per 1M tokens).
 * Source: https://www.anthropic.com/pricing (snapshot 2024-11).
 *
 * We keep only the models the app currently uses. Add new entries here when
 * migrating to a new SKU.
 */
const PRICING_USD_PER_MTOKEN: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  'claude-3-opus-20240229': { input: 15, output: 75 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

export function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = PRICING_USD_PER_MTOKEN[model] ?? DEFAULT_PRICING;
  const cost =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;
  // Round to 6 decimals (tenth of a cent precision).
  return Math.round(cost * 1_000_000) / 1_000_000;
}
