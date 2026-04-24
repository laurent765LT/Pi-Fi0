'use client';

// ─── Shim — rétro-compat for @/hooks/use-auth ────────────────────────────────
// The hook has moved to `@/features/auth` as part of the feature-based
// refactor (Sprint 1, T1.4 Wave B). This file re-exports the public surface
// so the 20+ existing consumers keep building unchanged.
//
// Migrate your imports to `@/features/auth` when you touch a consumer:
//
//   - import { useAuth } from '@/hooks/use-auth';   // legacy
//   + import { useAuth } from '@/features/auth';    // preferred

export {
  useAuth,
  useUser,
  prefetchCurrentUser,
} from '@/features/auth';
export type { UseAuthResult } from '@/features/auth';
