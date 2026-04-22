// ─── Shared push subscriptions store (module-scoped) ─────────────────────
// In-memory Map keyed by endpoint. Resets on cold start — acceptable for mock.

export interface StoredSubscription {
  endpoint: string;
  keys?: Record<string, unknown>;
  subscribedAt: string;
}

export const SUBSCRIPTIONS: Map<string, StoredSubscription> = new Map();

export function getSubscriptions(): StoredSubscription[] {
  return Array.from(SUBSCRIPTIONS.values());
}
