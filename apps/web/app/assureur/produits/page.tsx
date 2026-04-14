'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  PRODUITS, ENVELOPPES, formatMontant, formatDateShortFR,
  TYPE_LABELS, TYPE_COLORS, SRI_COLORS, getEnveloppe,
} from '@/lib/mock-data-assureur';

type TypeFilter = '' | 'AUTOCALL_PHOENIX' | 'AUTOCALL_COUPON' | 'CAPITAL_PROTEGE' | 'TAUX_CONDITIONNEL';

export default function ProduitsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [sriFilter, setSriFilter] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return PRODUITS.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.nom.toLowerCase().includes(q) && !p.isin.toLowerCase().includes(q)) return false;
      }
      if (typeFilter && p.type !== typeFilter) return false;
      if (sriFilter !== null && p.sri !== sriFilter) return false;
      return true;
    });
  }, [search, typeFilter, sriFilter]);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold font-display mb-1 text-ink dark:text-white">
          Catalogue produits
        </h1>
        <p className="text-[14px] font-body text-ink-3 dark:text-ink-4">
          Produits structurés disponibles à la distribution
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/60 p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3 dark:text-ink-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, ISIN..."
            className="w-full h-9 rounded-md pl-9 pr-3 text-[13px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white placeholder:text-ink-4 focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="h-9 rounded-md px-3 text-[13px] font-body cursor-pointer border border-border/60 bg-white dark:bg-white/5 text-ink-2 dark:text-ink-4 focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-[12px] font-body mr-1 text-ink-3 dark:text-ink-4">SRI :</span>
          {[null, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={String(n)}
              onClick={() => setSriFilter(n)}
              className={cn(
                'h-7 min-w-7 px-1.5 rounded-sm text-[11px] font-semibold font-body transition-all',
                sriFilter === n
                  ? 'bg-violet text-white shadow-sm'
                  : 'bg-surface-2 dark:bg-white/5 text-ink-2 dark:text-ink-4 hover:bg-surface-3 dark:hover:bg-white/10'
              )}
            >
              {n === null ? 'Tous' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[12px] font-body mb-4 text-ink-3 dark:text-ink-4">
        <span className="font-semibold text-ink dark:text-white">{filtered.length}</span> produit{filtered.length > 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const typeStyle = TYPE_COLORS[p.type];
          const sriStyle = SRI_COLORS[p.sri];
          const env = getEnveloppe(p.id);
          const fillPct = env ? Math.min(100, (env.montantConfirme / (env.montantCible * (1 + env.surbookingPct / 100))) * 100) : 0;
          const daysLeft = env ? Math.ceil((new Date(env.dateCloture).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

          return (
            <Link
              key={p.id}
              href={`/assureur/produits/${p.id}`}
              className="group relative flex flex-col bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg overflow-hidden border border-border/60 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Gradient accent bar */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold font-body"
                    style={{ background: typeStyle.bg, color: typeStyle.text }}
                  >
                    {TYPE_LABELS[p.type]}
                  </span>
                  <span
                    className="inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold font-mono"
                    style={{ background: sriStyle.bg, color: sriStyle.text }}
                  >
                    SRI {p.sri}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <p className="text-[14px] font-semibold font-body leading-snug text-ink dark:text-white group-hover:opacity-80 transition-opacity">
                    {p.nom}
                  </p>
                  <p className="text-[11px] font-body mt-0.5 text-ink-3 dark:text-ink-4">
                    {p.emetteur} · {p.sousJacent}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 rounded-md p-3 bg-surface dark:bg-white/[0.03]">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold font-body text-ink-3 dark:text-ink-4">
                      {p.couponPct ? 'Coupon' : 'Gain max'}
                    </span>
                    <span className="text-[15px] font-bold font-body text-ink dark:text-white">
                      {p.couponPct ? `${p.couponPct}%` : p.gainMaxPct ? `${p.gainMaxPct}%` : '---'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold font-body text-ink-3 dark:text-ink-4">Barrière</span>
                    <span className={cn(
                      'text-[15px] font-bold font-body',
                      p.barrierePct ? 'text-red' : 'text-ink dark:text-white'
                    )}>
                      {p.barrierePct ? `${p.barrierePct}%` : '---'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold font-body text-ink-3 dark:text-ink-4">Maturité</span>
                    <span className="text-[12px] font-semibold font-body text-ink dark:text-white">
                      {new Date(p.maturite).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Enveloppe progress */}
                {env && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-body mb-1">
                      <span className="text-ink-2 dark:text-ink-3">Enveloppe</span>
                      <span className="font-mono text-ink-3 dark:text-ink-4">
                        {fillPct.toFixed(0)}% · {formatMontant(env.montantConfirme)}/{formatMontant(env.montantCible)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-surface-2 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet transition-all duration-700"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-body text-ink-3 dark:text-ink-4">
                      <span className="flex items-center gap-1"><Users size={10} /> {env.nbInteresses} intéressés</span>
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className={cn(
                          'flex items-center gap-1',
                          daysLeft <= 30 ? 'text-red' : 'text-ink-3 dark:text-ink-4'
                        )}>
                          <Clock size={10} /> J-{daysLeft}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 flex items-center justify-between border-t border-border/40 bg-surface/50 dark:bg-white/[0.02]">
                <span className="text-[11px] font-semibold font-body text-violet dark:text-violet-light transition-opacity group-hover:opacity-80">
                  Voir détails
                </span>
                <ArrowUpRight size={14} className="text-violet/50 dark:text-violet-light/50" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
