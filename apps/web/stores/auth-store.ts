'use client';

// ─── Shim — rétro-compat for @/stores/auth-store ─────────────────────────────
// The Zustand store has moved to `@/features/auth/store` as part of the
// feature-based refactor (Sprint 1, T1.4 Wave B). This file re-exports the
// public surface so the existing consumers (register page, providers'
// AuthHydrator, hooks that read demo-mode state) keep building unchanged.
//
// Migrate your imports to `@/features/auth` when you touch a consumer:
//
//   - import { useAuthStore } from '@/stores/auth-store';   // legacy
//   + import { useAuthStore } from '@/features/auth';        // preferred

export { useAuthStore, selectIsAuthenticated } from '@/features/auth';
