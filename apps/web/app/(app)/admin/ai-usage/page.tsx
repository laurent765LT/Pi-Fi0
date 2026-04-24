'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Brain, DollarSign, Gauge, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Daily {
  date: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  errors: number;
}

interface TopUser {
  userId: string;
  email: string | null;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

interface Stats {
  windowDays: number;
  totalRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  errorRate: number;
  cacheHitRate: number;
  daily: Daily[];
  topUsers: TopUser[];
}

// ─── Env helpers ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const USE_REAL_API =
  (process.env.NEXT_PUBLIC_USE_REAL_API ?? 'true').toLowerCase() === 'true';

// Seven-day demo dataset so the page is useful when the backend is off.
const DEMO_STATS: Stats = {
  windowDays: 7,
  totalRequests: 482,
  totalTokensIn: 210_000,
  totalTokensOut: 95_000,
  totalCostUsd: 2.055,
  errorRate: 0.015,
  cacheHitRate: 0.32,
  daily: Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const requests = 40 + Math.round(Math.random() * 60);
    const tokensIn = requests * 430;
    const tokensOut = requests * 200;
    return {
      date: d.toISOString().slice(0, 10),
      requests,
      tokensIn,
      tokensOut,
      costUsd: (tokensIn * 3) / 1_000_000 + (tokensOut * 15) / 1_000_000,
      errors: Math.random() < 0.4 ? 1 : 0,
    };
  }),
  topUsers: [
    { userId: 'u1', email: 'cgp1@cabinet.fr', requests: 98, tokensIn: 38_000, tokensOut: 21_000, costUsd: 0.429 },
    { userId: 'u2', email: 'cgp2@cabinet.fr', requests: 76, tokensIn: 30_000, tokensOut: 17_000, costUsd: 0.345 },
    { userId: 'u3', email: 'ops@strickin.fr', requests: 62, tokensIn: 26_000, tokensOut: 14_000, costUsd: 0.288 },
    { userId: 'u4', email: 'assureur@mutuelle.fr', requests: 41, tokensIn: 19_000, tokensOut: 9_000, costUsd: 0.192 },
    { userId: 'u5', email: 'demo@strickin.fr', requests: 28, tokensIn: 12_000, tokensOut: 6_500, costUsd: 0.133 },
  ],
};

// ─── Small UI primitives ─────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  hint,
  Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: typeof Brain;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-4 flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
        style={{ background: accent }}
      >
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[10px] uppercase tracking-widest text-ink-3">
          {label}
        </p>
        <p className="font-display text-xl font-bold text-ink mt-0.5 tabular-nums">
          {value}
        </p>
        {hint && (
          <p className="font-body text-[11px] text-ink-3 mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AIUsagePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function load() {
      if (!USE_REAL_API) {
        setStats(DEMO_STATS);
        setIsDemo(true);
        setLoading(false);
        return;
      }
      try {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('accessToken')
            : null;
        const res = await fetch(`${API_BASE}/admin/ai-usage`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`);
        }
        const data = (await res.json()) as Stats;
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur réseau');
        setStats(DEMO_STATS);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const formatted = useMemo(() => {
    if (!stats) return null;
    return {
      cost: `$${stats.totalCostUsd.toFixed(2)}`,
      requests: stats.totalRequests.toLocaleString('fr-FR'),
      tokens: (stats.totalTokensIn + stats.totalTokensOut).toLocaleString('fr-FR'),
      errorRate: `${(stats.errorRate * 100).toFixed(1)}%`,
      cacheRate: `${(stats.cacheHitRate * 100).toFixed(0)}%`,
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Brain}
        title="Consommation IA"
        subtitle={`Fenêtre ${stats?.windowDays ?? 7} jours — appels Claude, coûts, erreurs et cache.`}
      />

      {isDemo && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 text-amber-900 px-4 py-3 font-body text-sm">
          Mode démo activé — données fictives. Définissez
          <code className="mx-1 px-1 py-0.5 rounded bg-amber-100 font-mono text-[12px]">
            NEXT_PUBLIC_USE_REAL_API=true
          </code>
          et authentifiez-vous en tant que <strong>SUPER_ADMIN</strong> pour charger les chiffres réels.
        </div>
      )}

      {error && !isDemo && (
        <div className="rounded-lg border border-rose-300/60 bg-rose-50 text-rose-900 px-4 py-3 font-body text-sm">
          {error}
        </div>
      )}

      {loading || !stats ? (
        <div className="font-body text-sm text-ink-3">Chargement…</div>
      ) : (
        <>
          {/* ── KPI row ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard
              label="Requêtes"
              value={formatted!.requests}
              Icon={Brain}
              accent="#3B1FA8"
            />
            <KpiCard
              label="Coût cumulé"
              value={formatted!.cost}
              hint="USD (Claude 3.5 Sonnet)"
              Icon={DollarSign}
              accent="#00B894"
            />
            <KpiCard
              label="Tokens (in + out)"
              value={formatted!.tokens}
              Icon={Gauge}
              accent="#6C4FE0"
            />
            <KpiCard
              label="Taux d'erreur"
              value={formatted!.errorRate}
              Icon={AlertTriangle}
              accent="#D4A017"
            />
            <KpiCard
              label="Cache hit rate"
              value={formatted!.cacheRate}
              Icon={Users}
              accent="#1A0A3E"
            />
          </div>

          {/* ── Requests per day ────────────────────────────────────────── */}
          <section className="rounded-xl border border-border/60 bg-surface p-4">
            <h3 className="font-display text-sm font-bold text-ink mb-3">
              Requêtes par jour
            </h3>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.daily}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="requests" fill="#3B1FA8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Cost over time ──────────────────────────────────────────── */}
          <section className="rounded-xl border border-border/60 bg-surface p-4">
            <h3 className="font-display text-sm font-bold text-ink mb-3">
              Coût cumulé (USD)
            </h3>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.daily.reduce<Daily[]>((acc, d, idx) => {
                    const running = idx === 0 ? d.costUsd : acc[idx - 1].costUsd + d.costUsd;
                    acc.push({ ...d, costUsd: Number(running.toFixed(4)) });
                    return acc;
                  }, [])}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toFixed(4)}`, 'Coût']}
                  />
                  <Line
                    type="monotone"
                    dataKey="costUsd"
                    stroke="#00B894"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#00B894' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Top users ──────────────────────────────────────────────── */}
          <section className="rounded-xl border border-border/60 bg-surface p-4">
            <h3 className="font-display text-sm font-bold text-ink mb-3">
              Top 10 utilisateurs (par coût)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-ink-3 border-b border-border/50">
                    <th className="py-2 pr-4">Utilisateur</th>
                    <th className="py-2 pr-4 text-right">Requêtes</th>
                    <th className="py-2 pr-4 text-right">Tokens in</th>
                    <th className="py-2 pr-4 text-right">Tokens out</th>
                    <th className="py-2 text-right">Coût (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topUsers.map((u) => (
                    <tr
                      key={u.userId}
                      className={cn(
                        'border-b border-border/30 last:border-b-0',
                        'hover:bg-surface-2',
                      )}
                    >
                      <td className="py-2 pr-4 font-medium text-ink">
                        {u.email ?? u.userId}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {u.requests.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-ink-3">
                        {u.tokensIn.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-ink-3">
                        {u.tokensOut.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2 text-right tabular-nums font-semibold">
                        ${u.costUsd.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
