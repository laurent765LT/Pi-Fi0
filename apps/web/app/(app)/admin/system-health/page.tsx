// ─────────────────────────────────────────────────────────────────────────────
// /admin/system-health — dashboard of downstream dependencies
// ─────────────────────────────────────────────────────────────────────────────
// Polls /ready + /admin/migrations every 10s and renders a status row per
// service. Admin-only (gated by the /admin layout). Safe to refresh-heavy —
// /ready is O(ms) and returns a consistent shape.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useEffect, useMemo, useState } from 'react';

// ── Types (mirrors apps/api/src/common/health/health.types.ts) ───────────────

type HealthStatus = 'ok' | 'degraded' | 'down';

interface ServiceCheck {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
}

interface ReadyPayload {
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

interface MigrationsPayload {
  total: number;
  last: { name: string; appliedAt: string | null } | null;
  pending: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const POLL_MS = 10_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: HealthStatus): string {
  if (s === 'ok') return 'bg-green-500';
  if (s === 'degraded') return 'bg-amber-500';
  return 'bg-red-500';
}

function statusLabel(s: HealthStatus): string {
  if (s === 'ok') return 'Opérationnel';
  if (s === 'degraded') return 'Dégradé';
  return 'Indisponible';
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR');
  } catch {
    return iso;
  }
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchReady(): Promise<ReadyPayload | null> {
  try {
    const res = await fetch(`${API_BASE.replace('/api/v1', '')}/ready`, { cache: 'no-store' });
    if (!res.ok && res.status !== 503) return null;
    return (await res.json()) as ReadyPayload;
  } catch {
    return null;
  }
}

async function fetchMigrations(): Promise<MigrationsPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/migrations`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as MigrationsPayload;
  } catch {
    return null;
  }
}

// ── Row components ───────────────────────────────────────────────────────────

function ServiceRow({ name, check }: { name: string; check: ServiceCheck }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-3 w-3 rounded-full ${statusColor(check.status)}`}
          aria-hidden
        />
        <span className="font-body text-sm font-semibold text-ink">{name}</span>
      </div>
      <div className="text-right">
        <div className="text-sm text-ink">{statusLabel(check.status)}</div>
        {check.latencyMs !== undefined && (
          <div className="font-mono text-xs text-ink-3">{check.latencyMs} ms</div>
        )}
        {check.error && <div className="text-xs text-red-600">{check.error}</div>}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const [ready, setReady] = useState<ReadyPayload | null>(null);
  const [migrations, setMigrations] = useState<MigrationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [r, m] = await Promise.all([fetchReady(), fetchMigrations()]);
      if (cancelled) return;
      setReady(r);
      setMigrations(m);
      setLastRefresh(new Date());
      setLoading(false);
    }

    void refresh();
    const handle = window.setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, []);

  const overallColor = useMemo(() => {
    if (!ready) return 'bg-gray-300';
    return statusColor(ready.status);
  }, [ready]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold text-ink">Santé du système</h1>
          <p className="mt-1 text-sm text-ink-3">
            Monitoring temps réel des services. Rafraîchissement auto toutes les 10 s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${overallColor}`} aria-hidden />
          <span className="text-sm font-semibold text-ink">
            {ready ? statusLabel(ready.status) : loading ? 'Chargement…' : 'API injoignable'}
          </span>
        </div>
      </header>

      {/* Services */}
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-syne text-sm font-bold uppercase tracking-widest text-ink-3">
          Services
        </h2>
        {ready ? (
          <>
            <ServiceRow name="PostgreSQL (Supabase)" check={ready.services.db} />
            <ServiceRow name="Redis (Upstash)" check={ready.services.redis} />
            <ServiceRow name="Anthropic Claude API" check={ready.services.anthropic} />
          </>
        ) : (
          <p className="text-sm text-ink-3">Impossible de contacter /ready.</p>
        )}
      </section>

      {/* Meta */}
      <section className="grid gap-3 sm:grid-cols-3">
        <MetaCard label="Version">{ready?.version ?? '—'}</MetaCard>
        <MetaCard label="Commit">
          <code className="font-mono text-xs">
            {(ready?.commit ?? process.env.NEXT_PUBLIC_GIT_COMMIT ?? 'dev').slice(0, 8)}
          </code>
        </MetaCard>
        <MetaCard label="Uptime">
          {ready ? formatUptime(ready.uptime) : '—'}
        </MetaCard>
      </section>

      {/* Migrations */}
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-syne text-sm font-bold uppercase tracking-widest text-ink-3">
          Base de données — migrations
        </h2>
        {migrations ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-3">Total appliquées</dt>
              <dd className="font-semibold text-ink">{migrations.total}</dd>
            </div>
            <div>
              <dt className="text-ink-3">En attente</dt>
              <dd className={`font-semibold ${migrations.pending > 0 ? 'text-amber-600' : 'text-ink'}`}>
                {migrations.pending}
              </dd>
            </div>
            <div>
              <dt className="text-ink-3">Dernière migration</dt>
              <dd className="truncate font-mono text-xs text-ink">
                {migrations.last ? migrations.last.name : '—'}
              </dd>
              <dd className="text-xs text-ink-3">
                {migrations.last ? formatDate(migrations.last.appliedAt) : ''}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-ink-3">Endpoint /admin/migrations indisponible.</p>
        )}
      </section>

      <footer className="text-xs text-ink-3">
        Dernier refresh : {lastRefresh ? lastRefresh.toLocaleTimeString('fr-FR') : '—'}
      </footer>
    </div>
  );
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-widest text-ink-3">{label}</div>
      <div className="mt-1 font-syne text-lg font-bold text-ink">{children}</div>
    </div>
  );
}
