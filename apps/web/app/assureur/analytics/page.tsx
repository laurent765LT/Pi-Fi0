'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Target, Banknote, Award, Brain, AlertTriangle, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import {
  ENGAGEMENTS,
  ENVELOPPES,
  PRODUITS,
  DISTRIBUTEURS_INFO,
  TYPE_LABELS,
  TYPE_COLORS,
  formatMontant,
  formatMontantFull,
} from '@/lib/mock-data-assureur';

// ─── Helpers ────────────────────────────────────────────────────────────────

function pct(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

const MEDAL: Record<number, string> = { 1: '\u{1F947}', 2: '\u{1F948}', 3: '\u{1F949}' };

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl p-5 flex flex-col gap-3 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet/10 to-cobalt/10">
        {icon}
      </div>
      <div>
        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-ink-3 dark:text-white/40 font-body">
          {label}
        </span>
        <div className="text-[22px] font-bold mt-0.5 font-display text-ink dark:text-white">
          {value}
        </div>
        {sub && (
          <span className="text-[12px] text-ink-3 dark:text-white/40 font-body">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden',
      className,
    )}>
      <div className="px-5 py-4 border-b border-border/40">
        <h3 className="text-[15px] font-bold text-ink dark:text-white font-display">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  // ── Enrich engagements with envelope + product refs ──
  const enriched = useMemo(() => {
    return ENGAGEMENTS.map((eng) => {
      const env = ENVELOPPES.find((e) => e.id === eng.enveloppeId);
      const produit = env ? PRODUITS.find((p) => p.id === env.produitId) : undefined;
      return { ...eng, enveloppe: env, produit };
    });
  }, []);

  // ── 1. KPI computations ──
  const kpis = useMemo(() => {
    const confirmed = enriched.filter((e) => e.statut === 'CONFIRME');
    const volumeTotal = confirmed.reduce((s, e) => s + e.montant, 0);
    const tauxConversion = enriched.length > 0
      ? (confirmed.length / enriched.length) * 100
      : 0;
    const ticketMoyen = confirmed.length > 0
      ? volumeTotal / confirmed.length
      : 0;
    const distributeursActifs = new Set(enriched.map((e) => e.distributeur)).size;

    return { volumeTotal, tauxConversion, ticketMoyen, distributeursActifs, confirmedCount: confirmed.length, totalCount: enriched.length };
  }, [enriched]);

  // ── 2. Volume par mois (last 6 months from data) ──
  const monthlyData = useMemo(() => {
    const buckets: Record<string, { confirmed: number; pending: number }> = {};

    for (const eng of enriched) {
      const mk = monthKey(eng.date);
      if (!buckets[mk]) buckets[mk] = { confirmed: 0, pending: 0 };
      if (eng.statut === 'CONFIRME') {
        buckets[mk].confirmed += eng.montant;
      } else {
        buckets[mk].pending += eng.montant;
      }
    }

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, vals]) => ({
        key,
        label: monthLabel(key),
        ...vals,
        total: vals.confirmed + vals.pending,
      }));
  }, [enriched]);

  const maxMonthly = useMemo(
    () => Math.max(...monthlyData.map((m) => m.total), 1),
    [monthlyData],
  );

  // ── 3. Top distributeurs ──
  const topDistributeurs = useMemo(() => {
    const map: Record<string, { volume: number; confirmed: number; total: number }> = {};

    for (const eng of enriched) {
      if (!map[eng.distributeur]) map[eng.distributeur] = { volume: 0, confirmed: 0, total: 0 };
      map[eng.distributeur].total += 1;
      if (eng.statut === 'CONFIRME') {
        map[eng.distributeur].volume += eng.montant;
        map[eng.distributeur].confirmed += 1;
      }
    }

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        info: DISTRIBUTEURS_INFO[name],
        volume: data.volume,
        nbEngagements: data.total,
        tauxConversion: data.total > 0 ? (data.confirmed / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [enriched]);

  // ── 4. Repartition par produit ──
  const productBreakdown = useMemo(() => {
    const map: Record<string, { nom: string; volume: number }> = {};

    for (const eng of enriched) {
      const pId = eng.produit?.id ?? 'unknown';
      const pNom = eng.produit?.nom ?? 'Inconnu';
      if (!map[pId]) map[pId] = { nom: pNom, volume: 0 };
      map[pId].volume += eng.montant;
    }

    const items = Object.values(map).sort((a, b) => b.volume - a.volume);
    const total = items.reduce((s, i) => s + i.volume, 0);
    const maxVol = Math.max(...items.map((i) => i.volume), 1);

    return items.map((item) => ({
      ...item,
      pct: total > 0 ? (item.volume / total) * 100 : 0,
      barPct: (item.volume / maxVol) * 100,
    }));
  }, [enriched]);

  // ── 5. Performance par type de payoff ──
  const payoffBreakdown = useMemo(() => {
    const map: Record<string, number> = {};

    for (const eng of enriched) {
      const type = eng.produit?.type ?? 'INCONNU';
      map[type] = (map[type] ?? 0) + eng.montant;
    }

    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const items = Object.entries(map)
      .map(([type, volume]) => ({
        type,
        label: TYPE_LABELS[type] ?? type,
        volume,
        pct: total > 0 ? (volume / total) * 100 : 0,
        colors: TYPE_COLORS[type] ?? { bg: '#F3F4F6', text: '#6B7280' },
      }))
      .sort((a, b) => b.volume - a.volume);

    return { items, total };
  }, [enriched]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <PageHeader
        icon={BarChart3}
        title="Analytics & Performance"
        subtitle="Vue d'ensemble de la performance de distribution"
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<Banknote size={16} className="text-violet" />}
          label="Volume total distribue"
          value={formatMontant(kpis.volumeTotal)}
          sub={`${kpis.confirmedCount} engagements confirmes`}
        />
        <KpiCard
          icon={<Target size={16} className="text-cobalt" />}
          label="Taux de conversion"
          value={`${kpis.tauxConversion.toFixed(1)}%`}
          sub={`${kpis.confirmedCount} / ${kpis.totalCount} engagements`}
        />
        <KpiCard
          icon={<TrendingUp size={16} className="text-teal" />}
          label="Ticket moyen"
          value={formatMontant(kpis.ticketMoyen)}
          sub="par engagement confirme"
        />
        <KpiCard
          icon={<Users size={16} className="text-violet" />}
          label="Distributeurs actifs"
          value={kpis.distributeursActifs}
          sub="cabinets participants"
        />
      </div>

      {/* Volume par mois - CSS bar chart */}
      <Section title="Volume par mois" className="mb-8">
        <div className="flex items-end gap-3 h-[220px]">
          {monthlyData.map((m) => {
            const confirmedH = (m.confirmed / maxMonthly) * 100;
            const pendingH = (m.pending / maxMonthly) * 100;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                {/* Amount label */}
                <span className="text-[10px] font-semibold text-ink-3 dark:text-white/40 font-body whitespace-nowrap">
                  {formatMontant(m.total)}
                </span>
                {/* Stacked bars */}
                <div className="w-full max-w-[48px] flex flex-col-reverse rounded-t-md overflow-hidden">
                  {/* Confirmed (teal) at bottom */}
                  <div
                    className="w-full bg-teal transition-all duration-500"
                    style={{ height: `${confirmedH * 1.8}px` }}
                  />
                  {/* Pending (amber) on top */}
                  {m.pending > 0 && (
                    <div
                      className="w-full bg-amber-400 transition-all duration-500"
                      style={{ height: `${pendingH * 1.8}px` }}
                    />
                  )}
                </div>
                {/* Month label */}
                <span className="text-[11px] font-medium text-ink-3 dark:text-white/50 font-body capitalize">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-teal" />
            <span className="text-[11px] text-ink-3 dark:text-white/50 font-body">Confirme</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-[11px] text-ink-3 dark:text-white/50 font-body">En attente</span>
          </div>
        </div>
      </Section>

      {/* Top distributeurs table */}
      <Section title="Top distributeurs" className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] font-body">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40 w-12">#</th>
                <th className="text-left px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Nom du CGP</th>
                <th className="text-left px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Cabinet</th>
                <th className="text-right px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Volume engage</th>
                <th className="text-center px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Nb engagements</th>
                <th className="text-center px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40">Taux conversion</th>
              </tr>
            </thead>
            <tbody>
              {topDistributeurs.map((d, i) => {
                const rank = i + 1;
                return (
                  <tr
                    key={d.name}
                    className="border-b border-border/20 last:border-0 hover:bg-violet/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-3 py-3 font-display font-bold text-[15px]">
                      {MEDAL[rank] ? (
                        <span className="text-[18px]">{MEDAL[rank]}</span>
                      ) : (
                        <span className="text-ink-3 dark:text-white/40">{rank}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-ink dark:text-white">
                      {d.info?.nom ?? d.name}
                    </td>
                    <td className="px-3 py-3 text-ink-2 dark:text-white/70">
                      {d.info?.cabinet ?? d.name}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-ink dark:text-white">
                      {formatMontantFull(d.volume)}
                    </td>
                    <td className="px-3 py-3 text-center text-ink-2 dark:text-white/70">
                      {d.nbEngagements}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={d.tauxConversion >= 80 ? 'teal' : d.tauxConversion >= 50 ? 'gold' : 'red'} size="md">
                        {d.tauxConversion.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Bottom 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repartition par produit - horizontal bars */}
        <Section title="Repartition par produit">
          <div className="flex flex-col gap-4">
            {productBreakdown.map((item) => (
              <div key={item.nom}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-ink dark:text-white font-body">
                    {item.nom}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono font-semibold text-ink dark:text-white">
                      {formatMontant(item.volume)}
                    </span>
                    <span className="text-[11px] text-ink-3 dark:text-white/40 font-body">
                      {item.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet to-cobalt transition-all duration-700 ease-out"
                    style={{ width: `${item.barPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Performance par type de payoff - stacked horizontal bar */}
        <Section title="Performance par type de payoff">
          {/* Visual stacked bar */}
          <div className="h-10 w-full rounded-lg overflow-hidden flex mb-5">
            {payoffBreakdown.items.map((item) => (
              <div
                key={item.type}
                className="h-full transition-all duration-500 first:rounded-l-lg last:rounded-r-lg"
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.colors.text,
                }}
                title={`${item.label}: ${item.pct.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Legend list */}
          <div className="flex flex-col gap-3">
            {payoffBreakdown.items.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.colors.text }}
                  />
                  <span className="text-[13px] font-medium text-ink dark:text-white font-body">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-mono font-semibold text-ink dark:text-white">
                    {formatMontant(item.volume)}
                  </span>
                  <Badge
                    variant="muted"
                    size="md"
                  >
                    {item.pct.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink-3 dark:text-white/40 font-body uppercase tracking-wider">
              Total
            </span>
            <span className="text-[14px] font-mono font-bold text-ink dark:text-white">
              {formatMontantFull(payoffBreakdown.total)}
            </span>
          </div>
        </Section>
      </div>

      {/* ─── Predictions IA ─────────────────────────────────────────────── */}
      <div className="mt-10 rounded-2xl p-[2px] bg-gradient-to-r from-violet via-cobalt to-teal">
        <div className="rounded-[14px] bg-white dark:bg-ink p-6 space-y-8">
          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet to-cobalt text-white">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold font-display text-ink dark:text-white">
                Predictions IA
              </h2>
              <p className="text-[12px] text-ink-3 dark:text-white/40 font-body">
                Analyse predictive et alertes intelligentes
              </p>
            </div>
          </div>

          {/* 1. Forecast Card */}
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
              <Brain size={15} className="text-violet" />
              <h3 className="text-[15px] font-bold text-ink dark:text-white font-display">
                Previsions du trimestre suivant
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Forecast metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Volume attendu Q2 2026', value: '4.2M EUR', trend: '+18% vs Q1' },
                  { label: 'Nombre de CGPs actifs prevu', value: '45', trend: '+12' },
                  { label: 'Taux de conversion estime', value: '72%', trend: '+4pts' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border/40 p-4 flex flex-col gap-2 bg-gradient-to-br from-white to-surface-1 dark:from-white/5 dark:to-white/[0.02]"
                  >
                    <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40 font-body">
                      {item.label}
                    </span>
                    <div className="flex items-end gap-2">
                      <span className="text-[22px] font-bold font-display text-ink dark:text-white">
                        {item.value}
                      </span>
                      <Badge variant="teal" size="md">
                        {item.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart Q4 -> Q1 -> Q2(prevision) */}
              <div className="mt-2">
                <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 dark:text-white/40 font-body mb-3 block">
                  Evolution trimestrielle
                </span>
                <div className="flex items-end gap-4 h-[120px]">
                  {[
                    { label: 'Q4 2025', value: 2.8, max: 4.2, forecast: false },
                    { label: 'Q1 2026', value: 3.6, max: 4.2, forecast: false },
                    { label: 'Q2 2026', value: 4.2, max: 4.2, forecast: true },
                  ].map((q) => {
                    const barH = (q.value / q.max) * 100;
                    return (
                      <div key={q.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[11px] font-semibold text-ink-3 dark:text-white/40 font-body">
                          {q.value}M
                        </span>
                        <div
                          className={cn(
                            'w-full max-w-[56px] rounded-t-md transition-all duration-500',
                            q.forecast
                              ? 'border-2 border-dashed border-violet bg-violet/10'
                              : 'bg-gradient-to-t from-violet to-cobalt',
                          )}
                          style={{ height: `${barH * 0.9}px` }}
                        />
                        <span className={cn(
                          'text-[11px] font-medium font-body',
                          q.forecast
                            ? 'text-violet font-semibold'
                            : 'text-ink-3 dark:text-white/50',
                        )}>
                          {q.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-violet to-cobalt" />
                    <span className="text-[11px] text-ink-3 dark:text-white/50 font-body">Realise</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm border-2 border-dashed border-violet bg-violet/10" />
                    <span className="text-[11px] text-ink-3 dark:text-white/50 font-body">Prevision IA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. AI Risk Alerts */}
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red" />
              <h3 className="text-[15px] font-bold text-ink dark:text-white font-display">
                Alertes IA
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {/* HAUTE */}
              <div className="rounded-lg border-l-4 border-l-red border border-border/40 p-4 bg-[#FDE8EB]/30 dark:bg-red/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="red" size="sm">HAUTE</Badge>
                      <span className="text-[11px] text-ink-3 dark:text-white/40 font-body">Remplissage enveloppe</span>
                    </div>
                    <p className="text-[13px] font-medium text-ink dark:text-white font-body">
                      Enveloppe M Rendement 13 a 92% de remplissage — cloture dans 5 jours
                    </p>
                  </div>
                  <button className="text-[11px] font-semibold text-red hover:text-red/80 font-body whitespace-nowrap transition-colors">
                    Voir details &rarr;
                  </button>
                </div>
              </div>

              {/* MOYENNE */}
              <div className="rounded-lg border-l-4 border-l-[#9B7210] border border-border/40 p-4 bg-[#FDF3D6]/30 dark:bg-[#9B7210]/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="gold" size="sm">MOYENNE</Badge>
                      <span className="text-[11px] text-ink-3 dark:text-white/40 font-body">Engagement CGP</span>
                    </div>
                    <p className="text-[13px] font-medium text-ink dark:text-white font-body">
                      2 CGPs n&apos;ont pas confirme leurs engagements depuis 7 jours
                    </p>
                  </div>
                  <button className="text-[11px] font-semibold text-[#9B7210] hover:text-[#9B7210]/80 font-body whitespace-nowrap transition-colors">
                    Relancer &rarr;
                  </button>
                </div>
              </div>

              {/* INFO */}
              <div className="rounded-lg border-l-4 border-l-cobalt border border-border/40 p-4 bg-cobalt-pale/30 dark:bg-cobalt/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="cobalt" size="sm">INFO</Badge>
                      <span className="text-[11px] text-ink-3 dark:text-white/40 font-body">Opportunite marche</span>
                    </div>
                    <p className="text-[13px] font-medium text-ink dark:text-white font-body">
                      Nouveau produit Capital Protege avec forte demande detectee sur le marche
                    </p>
                  </div>
                  <button className="text-[11px] font-semibold text-cobalt hover:text-cobalt/80 font-body whitespace-nowrap transition-colors">
                    Explorer &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. AI Scoring Summary */}
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
              <Star size={15} className="text-violet" />
              <h3 className="text-[15px] font-bold text-ink dark:text-white font-display">
                Score de performance IA
              </h3>
            </div>
            <div className="p-5 space-y-5">
              {/* Global score */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet to-cobalt flex items-center justify-center">
                  <span className="text-[24px] font-bold font-display text-white">84</span>
                </div>
                <div>
                  <span className="text-[13px] font-medium text-ink dark:text-white font-body">
                    Score global
                  </span>
                  <div className="text-[11px] text-ink-3 dark:text-white/40 font-body">
                    sur 100 — Excellent
                  </div>
                  <div className="w-[200px] h-2 rounded-full overflow-hidden bg-surface-2 dark:bg-white/10 mt-1.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet to-cobalt transition-all duration-700 ease-out"
                      style={{ width: '84%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Reactivite', score: 92, color: 'from-teal to-teal' },
                  { label: 'Competitivite prix', score: 78, color: 'from-cobalt to-cobalt' },
                  { label: 'Couverture produits', score: 85, color: 'from-violet to-violet' },
                  { label: 'Satisfaction CGP', score: 81, color: 'from-violet to-cobalt' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-ink dark:text-white font-body">
                        {item.label}
                      </span>
                      <span className="text-[12px] font-mono font-bold text-ink dark:text-white">
                        {item.score}/100
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10">
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                          item.color,
                        )}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
