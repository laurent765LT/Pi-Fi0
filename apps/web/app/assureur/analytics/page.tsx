'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Target, Banknote, Award } from 'lucide-react';
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
    </div>
  );
}
