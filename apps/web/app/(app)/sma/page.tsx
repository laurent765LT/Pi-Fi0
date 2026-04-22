'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layers, Wallet, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import {
  useSMAStore,
  SMA_STRATEGY_LABELS,
  type SMAStrategy,
} from '@/stores/sma-store';
import { SMACard } from '@/components/sma/SMACard';

const ALL_STRATEGIES: SMAStrategy[] = ['income', 'growth', 'total-return'];

function formatEurShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M\u00A0€`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k\u00A0€`;
  }
  return `${amount.toFixed(0)}\u00A0€`;
}

function KpiTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 rounded-xl border border-border/60 dark:border-white/10 p-3.5',
        'bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'shadow-card hover:shadow-card-hover transition-all duration-200',
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-70"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
      />
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
        style={{ background: `${accent}14` }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest font-body text-ink-3 dark:text-white/50 font-bold">
          {label}
        </div>
        <div className="font-display text-xl font-bold text-ink dark:text-white leading-tight tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

export default function SMAMarketplacePage() {
  useEffect(() => {
    document.title = "Marketplace SMA | Strick'in";
  }, []);

  const smas = useSMAStore((s) => s.smas);
  const [strategyFilter, setStrategyFilter] = useState<SMAStrategy[]>([]);

  const filtered = useMemo(
    () =>
      strategyFilter.length === 0
        ? smas
        : smas.filter((s) => strategyFilter.includes(s.strategy)),
    [smas, strategyFilter],
  );

  // Stats
  const totalAUM = smas.reduce((acc, s) => acc + s.aum, 0);
  const nSMAs = smas.length;
  const avgYtd =
    smas.length === 0
      ? 0
      : smas.reduce((a, s) => a + s.performance.ytd, 0) / smas.length;

  function toggleStrategy(strat: SMAStrategy) {
    setStrategyFilter((prev) =>
      prev.includes(strat) ? prev.filter((s) => s !== strat) : [...prev, strat],
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        icon={Layers}
        title="Marketplace SMA"
        subtitle="Portefeuilles de produits structurés gérés professionnellement — tickets accessibles dès 25 000 €."
      />

      {/* Intro card */}
      <div className="rounded-xl border border-violet/20 bg-gradient-to-br from-violet-pale/70 to-white dark:from-violet/10 dark:to-white/[0.02] p-5">
        <p className="text-sm font-body text-ink-2 dark:text-white/80 leading-relaxed max-w-3xl">
          Les <strong>Separately Managed Accounts</strong> permettent à vos clients d&apos;accéder à des
          portefeuilles diversifiés de produits structurés, gérés en architecture ouverte par des
          professionnels. Tickets à partir de <strong>25 000 €</strong>, frais de gestion entre 15 et 20 bps,
          composition transparente et rebalancement trimestriel.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiTile
          icon={<Wallet size={16} className="text-violet" />}
          label="AUM total"
          value={formatEurShort(totalAUM)}
          accent="#3B1FA8"
        />
        <KpiTile
          icon={<Users size={16} className="text-cobalt" />}
          label="Nombre de SMA"
          value={nSMAs}
          accent="#0A2799"
        />
        <KpiTile
          icon={<TrendingUp size={16} className="text-teal" />}
          label="Perf. moyenne YTD"
          value={`${avgYtd >= 0 ? '+' : ''}${avgYtd.toFixed(2)}%`}
          accent="#00B894"
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-body uppercase tracking-widest font-bold text-ink-3 dark:text-white/50 mr-1">
          Stratégie
        </span>
        {ALL_STRATEGIES.map((strat) => {
          const active = strategyFilter.includes(strat);
          return (
            <button
              key={strat}
              type="button"
              onClick={() => toggleStrategy(strat)}
              aria-pressed={active}
              className={cn(
                'h-7 px-3 rounded-full text-[11px] font-body font-semibold border transition-all',
                active
                  ? 'bg-violet text-white border-violet shadow-xs'
                  : 'bg-white dark:bg-white/5 text-ink-2 dark:text-white/70 border-border dark:border-white/10 hover:border-violet/50',
              )}
            >
              {SMA_STRATEGY_LABELS[strat]}
            </button>
          );
        })}
        {strategyFilter.length > 0 && (
          <button
            type="button"
            onClick={() => setStrategyFilter([])}
            className="h-7 px-2.5 rounded-full text-[11px] font-body font-semibold text-violet hover:bg-violet-pale"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* SMA cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border dark:border-white/10 py-12 text-center">
            <Layers size={24} className="mx-auto text-ink-3 dark:text-white/30 mb-2" />
            <p className="text-sm font-body text-ink-2 dark:text-white/60">
              Aucun SMA ne correspond au filtre sélectionné.
            </p>
          </div>
        ) : (
          filtered.map((sma) => <SMACard key={sma.id} sma={sma} />)
        )}
      </div>
    </div>
  );
}
