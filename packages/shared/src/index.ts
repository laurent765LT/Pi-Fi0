/**
 * @strickin/shared — public surface.
 *
 * This file is the root re-export of the package. Consumers should in general
 * prefer the sub-path imports (`@strickin/shared/domain`, `/api`, `/events`,
 * `/constants`, `/utils`, `/schemas`) so tree-shaking can strip what they do
 * not use. The root export keeps backwards compatibility with v1 imports.
 *
 * @see ./domain   — Entities and value objects (mirror of Prisma schema).
 * @see ./api      — HTTP DTOs and response envelopes.
 * @see ./events   — Domain events emitted by the backend.
 * @see ./constants — Shared catalogue values (scales, labels, colours).
 * @see ./utils    — Pure formatters / validators / type-guards.
 * @see ./schemas  — Runtime Zod schemas.
 */

// ── Full re-exports ─────────────────────────────────────────────────────────
export * from './domain';
export * from './api';
export * from './events';
export * from './constants';
export * from './utils';
export * from './schemas';

// ── v1 aliases ──────────────────────────────────────────────────────────────
// The legacy `AuthResponse` shape is preserved to avoid breaking imports in
// any app that pinned on it. New code should prefer `AuthResponseDto`.
export type { LegacyAuthResponse as AuthResponse } from './api/auth';

// The legacy `MarketQuote` shape used by the demo market-data page lived at
// the root of the package before the restructure. Re-exported verbatim to
// keep any direct imports working.
export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  timestamp: string;
}
