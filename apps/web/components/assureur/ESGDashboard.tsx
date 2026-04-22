'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Leaf, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { mockESGForProduct, buildESGSummaries } from '@/lib/esg/scoring-engine';
import { SFDR_LABELS, type SFDRClassification } from '@/lib/esg/sfdr-schema';
import { detectGreenwashing } from '@/lib/esg/greenwashing-detector';

interface ESGDashboardProps {
  products: ReadonlyArray<{ id: string; name: string }>;
  /** Optional list of envelopes used to group products by envelope/shelf. */
  envelopes?: ReadonlyArray<{ id: string; name: string; productIds: string[] }>;
  className?: string;
}

const SFDR_ORDER: SFDRClassification[] = ['art9', 'art8', 'art6', 'non-esg'];

export function ESGDashboard({ products, envelopes, className }: ESGDashboardProps) {
  // ─── Aggregates ────────────────────────────────────────────────────────────
  const summaries = useMemo(() => buildESGSummaries(products), [products]);

  const total = summaries.length || 1;

  const esgShare = useMemo(() => {
    const esgCount = summaries.filter((s) => s.esg.sfdr === 'art8' || s.esg.sfdr === 'art9').length;
    return (esgCount / total) * 100;
  }, [summaries, total]);

  const sfdrBreakdown = useMemo(() => {
    const counters: Record<SFDRClassification, number> = {
      art9: 0,
      art8: 0,
      art6: 0,
      'non-esg': 0,
    };
    for (const s of summaries) counters[s.esg.sfdr]++;
    return SFDR_ORDER.map((key) => ({
      key,
      label: SFDR_LABELS[key].label,
      fullLabel: SFDR_LABELS[key].fullLabel,
      color: SFDR_LABELS[key].color,
      value: counters[key],
      pct: (counters[key] / total) * 100,
    }));
  }, [summaries, total]);

  const avgScore = useMemo(() => {
    if (summaries.length === 0) return 0;
    const sum = summaries.reduce((acc, s) => acc + s.esg.overallScore, 0);
    return sum / summaries.length;
  }, [summaries]);

  // Envelopes scoring (if provided) — else synth a single global "Portefeuille"
  const envelopeScores = useMemo(() => {
    if (!envelopes || envelopes.length === 0) {
      return [
        {
          id: 'all',
          name: 'Portefeuille global',
          avg: avgScore,
          count: summaries.length,
        },
      ];
    }
    return envelopes.map((env) => {
      const relevant = summaries.filter((s) => env.productIds.includes(s.productId));
      const avg = relevant.length === 0 ? 0 : relevant.reduce((a, s) => a + s.esg.overallScore, 0) / relevant.length;
      return { id: env.id, name: env.name, avg, count: relevant.length };
    });
  }, [envelopes, summaries, avgScore]);

  // Quarterly evolution — deterministic demo timeline derived from current average.
  const quarterlyEvolution = useMemo(() => {
    const round = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
    const base = avgScore;
    return [
      { label: 'T2 24', score: round(base - 9.2), coverage: round(esgShare - 14) },
      { label: 'T3 24', score: round(base - 6.4), coverage: round(esgShare - 10) },
      { label: 'T4 24', score: round(base - 3.1), coverage: round(esgShare - 6) },
      { label: 'T1 25', score: round(base - 1.2), coverage: round(esgShare - 3) },
      { label: 'T2 25', score: round(base + 1.1), coverage: round(esgShare - 1) },
      { label: 'T3 25', score: round(base + 2.3), coverage: round(esgShare + 1) },
      { label: 'T4 25', score: round(base + 3.1), coverage: round(esgShare + 2.5) },
      { label: 'T1 26', score: round(base + 4.2), coverage: round(esgShare + 4) },
    ];
  }, [avgScore, esgShare]);

  const top5Esg = useMemo(
    () =>
      [...summaries]
        .filter((s) => s.esg.sfdr === 'art8' || s.esg.sfdr === 'art9')
        .sort((a, b) => b.esg.overallScore - a.esg.overallScore)
        .slice(0, 5),
    [summaries],
  );

  const top5NonEsg = useMemo(
    () =>
      [...summaries]
        .filter((s) => s.esg.sfdr === 'non-esg' || s.esg.sfdr === 'art6')
        .sort((a, b) => a.esg.overallScore - b.esg.overallScore)
        .slice(0, 5),
    [summaries],
  );

  const greenwashingCount = useMemo(
    () => summaries.filter((s) => detectGreenwashing(s.esg) != null).length,
    [summaries],
  );

  return (
    <section className={cn('flex flex-col gap-4', className)}>
      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Leaf size={16} className="text-teal" fill="currentColor" strokeWidth={1.8} />}
          label="Part ESG"
          value={`${esgShare.toFixed(0)}%`}
          sub={`${Math.round((esgShare / 100) * summaries.length)} / ${summaries.length} produits`}
          tone={esgShare >= 50 ? 'positive' : 'neutral'}
        />
        <KpiCard
          icon={<Award size={16} className="text-violet" />}
          label="Score moyen"
          value={`${avgScore.toFixed(0)}/100`}
          sub="Moyenne pond\u00e9r\u00e9e des produits"
          tone={avgScore >= 60 ? 'positive' : 'neutral'}
        />
        <KpiCard
          icon={<TrendingUp size={16} className="text-teal" />}
          label="SFDR Art. 9"
          value={`${sfdrBreakdown.find((b) => b.key === 'art9')?.value ?? 0}`}
          sub="Produits investissement durable"
          tone="positive"
        />
        <KpiCard
          icon={<AlertCircle size={16} className="text-red" />}
          label="Alertes greenwashing"
          value={`${greenwashingCount}`}
          sub="Produits n\u00e9cessitant vigilance"
          tone={greenwashingCount > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Row: SFDR pie + envelope bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DashboardCard
          title="R\u00e9partition SFDR"
          subtitle="Classification r\u00e9glementaire des produits"
        >
          <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
            <div className="h-[200px]" role="img" aria-label="R\u00e9partition SFDR en camembert">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sfdrBreakdown}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {sfdrBreakdown.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(value: number, _name, props) => [
                      `${value} produit${value > 1 ? 's' : ''}`,
                      props.payload.fullLabel,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-col gap-1.5 pr-1">
              {sfdrBreakdown.map((b) => (
                <li key={b.key} className="flex items-center gap-2 text-[11px] font-body">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: b.color }}
                    aria-hidden
                  />
                  <span className="font-semibold text-ink dark:text-white min-w-[70px]">{b.label}</span>
                  <span className="text-ink-3 dark:text-white/45 font-mono tabular-nums">
                    {b.value} ({b.pct.toFixed(0)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Score ESG par enveloppe"
          subtitle="Moyenne des scores pond\u00e9r\u00e9e"
        >
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={envelopeScores} margin={{ top: 6, right: 8, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,117,164,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7B6FA0' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7B6FA0' }} />
                <RTooltip formatter={(value: number) => [`${value.toFixed(0)}/100`, 'Score ESG']} />
                <Bar dataKey="avg" fill="#3B1FA8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>

      {/* Quarterly evolution */}
      <DashboardCard
        title="\u00c9volution trimestrielle"
        subtitle="Progression du score moyen et de la couverture ESG"
      >
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={quarterlyEvolution} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,117,164,0.15)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7B6FA0' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7B6FA0' }} />
              <RTooltip
                formatter={(value: number, name: string) => {
                  const label = name === 'score' ? 'Score ESG moyen' : 'Couverture ESG (%)';
                  return [`${value}`, label];
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: '#7B6FA0' }}
                formatter={(value) => (value === 'score' ? 'Score ESG moyen' : 'Couverture ESG (%)')}
              />
              <Line type="monotone" dataKey="score" stroke="#3B1FA8" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="coverage" stroke="#00B894" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      {/* Top 5 lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <TopProductsCard
          title="Top 5 produits ESG"
          subtitle="Meilleurs scores — leaders durabilit\u00e9"
          icon={<TrendingUp size={14} className="text-teal" />}
          tone="positive"
          items={top5Esg.map((s) => ({
            id: s.productId,
            name: s.productName,
            score: s.esg.overallScore,
            sfdr: s.esg.sfdr,
          }))}
        />
        <TopProductsCard
          title="Top 5 produits \u00e0 surveiller"
          subtitle="Scores les plus bas / non-ESG"
          icon={<TrendingDown size={14} className="text-red" />}
          tone="negative"
          items={top5NonEsg.map((s) => ({
            id: s.productId,
            name: s.productName,
            score: s.esg.overallScore,
            sfdr: s.esg.sfdr,
          }))}
        />
      </div>
    </section>
  );
}

// ─── Presentational helpers ─────────────────────────────────────────────────

function DashboardCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border/60 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm p-4">
      <header className="mb-3">
        <h3 className="font-body text-[13px] font-bold text-ink dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-ink-3 dark:text-white/45 font-body mt-0.5">{subtitle}</p>
        )}
      </header>
      {children}
    </article>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: 'positive' | 'neutral' | 'negative';
}) {
  const toneClass = {
    positive: 'text-teal dark:text-[#00D4AA]',
    neutral: 'text-ink dark:text-white',
    negative: 'text-red dark:text-[#FF8090]',
  }[tone];
  return (
    <div className="rounded-xl border border-border/60 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 dark:text-white/45 font-body">
          {label}
        </span>
        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet/10 to-teal/10 flex items-center justify-center">
          {icon}
        </span>
      </div>
      <div className={cn('font-display text-[22px] font-extrabold leading-none tabular-nums', toneClass)}>
        {value}
      </div>
      {sub && <span className="text-[11px] text-ink-3 dark:text-white/40 font-body">{sub}</span>}
    </div>
  );
}

function TopProductsCard({
  title,
  subtitle,
  icon,
  items,
  tone,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: 'positive' | 'negative';
  items: {
    id: string;
    name: string;
    score: number;
    sfdr: SFDRClassification;
  }[];
}) {
  const barColor = tone === 'positive' ? '#00B894' : '#E8334A';
  return (
    <DashboardCard title={title} subtitle={subtitle}>
      {items.length === 0 ? (
        <p className="text-[11px] text-ink-3 dark:text-white/45 font-body italic">Aucun produit \u00e9ligible.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, idx) => {
            const sfdrInfo = SFDR_LABELS[item.sfdr];
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 dark:border-white/5 bg-surface-2/40 dark:bg-white/[0.02] px-2.5 py-2"
              >
                <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold tabular-nums text-ink-3 dark:text-white/50 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold font-body text-ink dark:text-white truncate flex items-center gap-1.5">
                    {icon}
                    {item.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${sfdrInfo.color}1A`,
                        color: sfdrInfo.color,
                        border: `1px solid ${sfdrInfo.color}33`,
                      }}
                    >
                      SFDR {sfdrInfo.label}
                    </span>
                    <div
                      className="flex-1 h-1.5 rounded-full bg-surface-3 dark:bg-white/10 overflow-hidden max-w-[120px]"
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.score}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${item.score}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[13px] font-bold tabular-nums text-ink dark:text-white">
                  {item.score}
                  <span className="text-[9px] opacity-50 ml-0.5">/100</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}

// Re-export so callers that want to compute things on the fly can still do so.
export { mockESGForProduct };
