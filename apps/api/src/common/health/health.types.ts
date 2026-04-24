// ─────────────────────────────────────────────────────────────────────────────
// Shapes returned by /health and /ready
// ─────────────────────────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface ServiceCheck {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
}

export interface HealthPayload {
  status: 'ok';
  timestamp: string;
  uptime: number;
  version: string;
  commit: string;
  node: string;
}

export interface ReadyPayload {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  commit: string;
  services: {
    db: ServiceCheck;
    redis: ServiceCheck;
    anthropic: ServiceCheck;
  };
}
