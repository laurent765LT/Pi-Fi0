'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Users, Clock, ArrowUpRight, Search, Layers, TrendingUp, Percent } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  ENVELOPPES, ENGAGEMENTS, getProduit, getEngagements,
  formatMontant, formatDateFR, formatDateShortFR,
  STATUT_ENVELOPPE, STATUT_ENGAGEMENT,
} from '@/lib/mock-data-assureur';

type StatutFilter = '' | 'OUVERT' | 'PLEIN' | 'FERME';

function EnveloppeTable({ search, statusFilter }: { search: string; statusFilter: StatutFilter }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEnveloppes = useMemo(() => {
    return ENVELOPPES.filter((env) => {
      if (statusFilter && env.statut !== statusFilter) return false;
      if (search) {
        const produit = getProduit(env.produitId);
        if (!produit) return false;
        const q = search.toLowerCase();
        if (
          !produit.nom.toLowerCase().includes(q) &&
          !produit.isin.toLowerCase().includes(q) &&
          !env.id.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [search, statusFilter]);

  return (
    <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <table className="w-full text-[13px] font-body">
        <thead>
          <tr className="bg-surface dark:bg-white/5 border-b border-border/60">
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Produit</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Statut</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Remplissage</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Confirme / Cible</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Surbooking</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Distributeurs</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Cloture</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {filteredEnveloppes.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-ink-3 dark:text-white/40 text-[13px]">
                Aucune enveloppe ne correspond aux filtres selectionnes.
              </td>
            </tr>
          )}
          {filteredEnveloppes.map((env) => {
            const produit = getProduit(env.produitId);
            if (!produit) return null;
            const maxAmount = env.montantCible * (1 + env.surbookingPct / 100);
            const fillPct = Math.min(100, (env.montantConfirme / maxAmount) * 100);
            const statut = STATUT_ENVELOPPE[env.statut];
            const isExpanded = expandedId === env.id;
            const engagements = getEngagements(env.id);
            const daysLeft = Math.ceil((new Date(env.dateCloture).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            let barColor = '#3B28CC';
            if (env.montantConfirme > env.montantCible) barColor = '#DC2626';
            else if (fillPct > 85) barColor = '#EA580C';
            else if (fillPct > 50) barColor = '#2563EB';

            return (
              <tr key={env.id} className="group">
                <td colSpan={8} className="p-0">
                  {/* Main row */}
                  <div
                    className="flex items-center cursor-pointer transition-colors hover:bg-violet/[0.04] px-4 py-3.5 border-b border-border/40"
                    onClick={() => setExpandedId(isExpanded ? null : env.id)}
                  >
                    {/* Produit */}
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-medium text-ink dark:text-white">{produit.nom}</p>
                      <p className="text-[11px] font-mono text-ink-3">{produit.isin}</p>
                    </div>

                    {/* Statut */}
                    <div className="w-[90px] text-center">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: statut.bg, color: statut.text }}>
                        {statut.label}
                      </span>
                    </div>

                    {/* Remplissage */}
                    <div className="w-[140px] px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-border/40">
                          <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: barColor }} />
                        </div>
                        <span className="text-[11px] font-mono font-semibold w-8 text-right text-ink-2">{fillPct.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Confirme / Cible */}
                    <div className="w-[160px] text-right">
                      <span className="font-semibold font-mono text-ink dark:text-white">{formatMontant(env.montantConfirme)}</span>
                      <span className="text-ink-3"> / {formatMontant(env.montantCible)}</span>
                    </div>

                    {/* Surbooking */}
                    <div className="w-[80px] text-center">
                      <span className="font-mono text-ink-2">{env.surbookingPct}%</span>
                    </div>

                    {/* Distributeurs */}
                    <div className="w-[90px] text-center">
                      <span className="flex items-center justify-center gap-1 text-ink-2">
                        <Users size={12} /> {env.nbInteresses}
                      </span>
                    </div>

                    {/* Cloture */}
                    <div className="w-[120px] text-right">
                      <span className={cn(
                        'font-body',
                        daysLeft > 0 && daysLeft <= 30 ? 'text-red-600' : 'text-ink-2'
                      )}>
                        {formatDateShortFR(env.dateCloture)}
                      </span>
                    </div>

                    {/* Expand */}
                    <div className="w-[40px] text-center">
                      {isExpanded ? <ChevronUp size={14} className="text-ink-3" /> : <ChevronDown size={14} className="text-ink-3" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 py-4 bg-surface dark:bg-white/[0.02] border-b border-border/60">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[12px] font-display font-bold text-ink dark:text-white">
                          Engagements ({engagements.length})
                        </h4>
                        <Link href={`/assureur/produits/${env.produitId}`} className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-80 text-violet">
                          Fiche produit <ArrowUpRight size={10} />
                        </Link>
                      </div>

                      {engagements.length === 0 ? (
                        <p className="text-[12px] py-4 text-center text-ink-3">Aucun engagement.</p>
                      ) : (
                        <div className="rounded-lg overflow-hidden border border-border/60">
                          <table className="w-full text-[12px] font-body">
                            <thead>
                              <tr className="bg-surface dark:bg-white/5 border-b border-border/60">
                                <th className="px-3 py-2 text-left font-semibold text-ink-3">Distributeur</th>
                                <th className="px-3 py-2 text-right font-semibold text-ink-3">Montant</th>
                                <th className="px-3 py-2 text-center font-semibold text-ink-3">Statut</th>
                                <th className="px-3 py-2 text-right font-semibold text-ink-3">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {engagements.map((eng) => {
                                const st = STATUT_ENGAGEMENT[eng.statut];
                                return (
                                  <tr key={eng.id} className="border-b border-border/40 hover:bg-violet/[0.04] transition-colors">
                                    <td className="px-3 py-2 font-medium text-ink dark:text-white">{eng.distributeur}</td>
                                    <td className="px-3 py-2 text-right font-mono font-semibold text-ink dark:text-white">{formatMontant(eng.montant)}</td>
                                    <td className="px-3 py-2 text-center">
                                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: st.bg, color: st.text }}>
                                        {st.label}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono text-ink-3">{formatDateShortFR(eng.date)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function EnveloppesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatutFilter>('');

  const totalEnveloppes = ENVELOPPES.length;
  const openEnveloppes = ENVELOPPES.filter((e) => e.statut === 'OUVERT').length;
  const totalVolume = ENVELOPPES.reduce((s, e) => s + e.montantConfirme, 0);
  const avgFill = ENVELOPPES.length > 0
    ? ENVELOPPES.reduce((sum, env) => {
        const maxAmount = env.montantCible * (1 + env.surbookingPct / 100);
        return sum + Math.min(100, (env.montantConfirme / maxAmount) * 100);
      }, 0) / ENVELOPPES.length
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-display font-bold text-ink dark:text-white mb-1">Enveloppes</h1>
        <p className="text-[14px] font-body text-ink-3 dark:text-ink-4">Gestion des enveloppes et suivi des bookings en temps reel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Layers, label: 'Total enveloppes', value: totalEnveloppes, sub: `${openEnveloppes} ouvertes` },
          { icon: TrendingUp, label: 'Volume confirme', value: formatMontant(totalVolume), sub: undefined },
          { icon: Percent, label: 'Taux remplissage moy.', value: `${avgFill.toFixed(0)}%`, sub: undefined },
          { icon: Users, label: 'Distributeurs', value: new Set(ENGAGEMENTS.map((e) => e.distributeur)).size, sub: `${ENGAGEMENTS.length} engagements` },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="relative overflow-hidden group bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm p-5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-9 h-9 bg-gradient-to-br from-violet/10 to-cobalt/10 rounded-lg flex items-center justify-center mb-3">
              <Icon size={16} className="text-violet" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold block font-body text-ink-3 dark:text-white/40">{label}</span>
            <span className="text-[20px] font-display font-bold text-ink dark:text-white">{value}</span>
            {sub && <span className="text-[11px] block font-body text-ink-3 dark:text-white/40">{sub}</span>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/60 p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3 dark:text-ink-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par produit, ISIN..."
            className="w-full h-9 rounded-md pl-9 pr-3 text-[13px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white placeholder:text-ink-4 focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {([
            { value: '' as StatutFilter, label: 'Toutes' },
            { value: 'OUVERT' as StatutFilter, label: 'Ouvertes' },
            { value: 'PLEIN' as StatutFilter, label: 'Pleines' },
            { value: 'FERME' as StatutFilter, label: 'Fermees' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                'h-8 px-3 rounded-md text-[12px] font-semibold font-body transition-all',
                statusFilter === opt.value
                  ? 'bg-violet text-white shadow-sm'
                  : 'bg-surface-2 dark:bg-white/5 text-ink-2 dark:text-ink-4 hover:bg-surface-3 dark:hover:bg-white/10',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <EnveloppeTable search={search} statusFilter={statusFilter} />
    </div>
  );
}
