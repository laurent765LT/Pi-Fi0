'use client';

import { useState, useMemo } from 'react';
import { Users, TrendingUp, Calendar, ArrowUpDown, Search, ChevronUp, ChevronDown, MapPin, Mail } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  ENGAGEMENTS, formatMontant, formatDateShortFR,
  STATUT_ENGAGEMENT, COLLECTE_MENSUELLE, DISTRIBUTEURS_INFO,
} from '@/lib/mock-data-assureur';

interface DistributeurSummary {
  nom: string;
  cabinet: string;
  ville: string;
  email: string;
  nbEngagements: number;
  volumeTotal: number;
  dernierEngagement: string;
  statut: 'Actif' | 'En attente';
}

type SortField = 'nom' | 'volumeTotal' | 'nbEngagements' | 'dernierEngagement';
type SortDirection = 'asc' | 'desc';

export default function DistributeursPage() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('volumeTotal');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [statusFilter, setStatusFilter] = useState<'' | 'Actif' | 'En attente'>('');

  const distributeurs = useMemo<DistributeurSummary[]>(() => {
    const map = new Map<string, { count: number; total: number; lastDate: string; hasConfirmed: boolean }>();
    for (const eng of ENGAGEMENTS) {
      const existing = map.get(eng.distributeur);
      if (existing) {
        existing.count++;
        existing.total += eng.montant;
        if (eng.date > existing.lastDate) existing.lastDate = eng.date;
        if (eng.statut === 'CONFIRME') existing.hasConfirmed = true;
      } else {
        map.set(eng.distributeur, {
          count: 1,
          total: eng.montant,
          lastDate: eng.date,
          hasConfirmed: eng.statut === 'CONFIRME',
        });
      }
    }
    return Array.from(map.entries())
      .map(([nom, data]) => {
        const info = DISTRIBUTEURS_INFO[nom];
        return {
          nom: info?.nom ?? nom,
          cabinet: info?.cabinet ?? nom,
          ville: info?.ville ?? '---',
          email: info?.email ?? '---',
          nbEngagements: data.count,
          volumeTotal: data.total,
          dernierEngagement: data.lastDate,
          statut: data.hasConfirmed ? 'Actif' as const : 'En attente' as const,
        };
      });
  }, []);

  const filtered = useMemo(() => {
    let result = distributeurs;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.nom.toLowerCase().includes(q) ||
          d.cabinet.toLowerCase().includes(q) ||
          d.ville.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter((d) => d.statut === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'nom':
          cmp = a.cabinet.localeCompare(b.cabinet);
          break;
        case 'volumeTotal':
          cmp = a.volumeTotal - b.volumeTotal;
          break;
        case 'nbEngagements':
          cmp = a.nbEngagements - b.nbEngagements;
          break;
        case 'dernierEngagement':
          cmp = a.dernierEngagement.localeCompare(b.dernierEngagement);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [distributeurs, search, sortField, sortDir, statusFilter]);

  const totalActifs = distributeurs.filter((d) => d.statut === 'Actif').length;
  const totalEngagements = ENGAGEMENTS.length;
  const volumeCeMois = COLLECTE_MENSUELLE[COLLECTE_MENSUELLE.length - 1]?.montant ?? 0;

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={10} className="text-ink-4 ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="text-violet ml-1" />
      : <ChevronDown size={10} className="text-violet ml-1" />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-display font-bold text-ink dark:text-white mb-1">Distributeurs</h1>
        <p className="text-[14px] font-body text-ink-3 dark:text-ink-4">Suivi des cabinets CGP et courtiers actifs sur vos produits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'Distributeurs actifs', value: totalActifs, sub: `${distributeurs.length} au total` },
          { icon: TrendingUp, label: 'Engagements', value: totalEngagements, sub: 'toutes enveloppes' },
          { icon: Calendar, label: 'Volume ce mois', value: formatMontant(volumeCeMois), sub: undefined },
          { icon: MapPin, label: 'Villes', value: new Set(distributeurs.map((d) => d.ville)).size, sub: 'implantations' },
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
            placeholder="Rechercher par nom, cabinet, ville..."
            className="w-full h-9 rounded-md pl-9 pr-3 text-[13px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white placeholder:text-ink-4 focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'Actif' | 'En attente')}
          className="h-9 rounded-md px-3 text-[13px] font-body cursor-pointer border border-border/60 bg-white dark:bg-white/5 text-ink-2 dark:text-ink-4 focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="Actif">Actif</option>
          <option value="En attente">En attente</option>
        </select>
        <span className="text-[12px] font-body text-ink-3 dark:text-ink-4 ml-auto">
          <span className="font-semibold text-ink dark:text-white">{filtered.length}</span> distributeur{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-surface dark:bg-white/5 border-b border-border/60">
              <th
                className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 cursor-pointer select-none hover:text-violet transition-colors"
                onClick={() => handleSort('nom')}
              >
                <span className="inline-flex items-center">Nom / Cabinet <SortIcon field="nom" /></span>
              </th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">
                Ville
              </th>
              <th
                className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 cursor-pointer select-none hover:text-violet transition-colors"
                onClick={() => handleSort('nbEngagements')}
              >
                <span className="inline-flex items-center justify-center">Nb engagements <SortIcon field="nbEngagements" /></span>
              </th>
              <th
                className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 cursor-pointer select-none hover:text-violet transition-colors"
                onClick={() => handleSort('volumeTotal')}
              >
                <span className="inline-flex items-center justify-end">Volume engage <SortIcon field="volumeTotal" /></span>
              </th>
              <th
                className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3 cursor-pointer select-none hover:text-violet transition-colors"
                onClick={() => handleSort('dernierEngagement')}
              >
                <span className="inline-flex items-center justify-end">Dernier eng. <SortIcon field="dernierEngagement" /></span>
              </th>
              <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.cabinet} className="hover:bg-violet/[0.04] transition-colors border-b border-border/40">
                <td className="px-4 py-3.5">
                  <div>
                    <span className="font-medium text-ink dark:text-white block">{d.nom}</span>
                    <span className="text-[11px] text-ink-3 dark:text-white/40">{d.cabinet}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 text-ink-2 dark:text-ink-3 text-[12px]">
                    <MapPin size={11} className="text-ink-4" /> {d.ville}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center font-mono font-semibold text-ink-2 dark:text-ink-3">
                  {d.nbEngagements}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-semibold text-ink dark:text-white">
                  {formatMontant(d.volumeTotal)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-ink-3 dark:text-white/40">
                  {formatDateShortFR(d.dernierEngagement)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: d.statut === 'Actif' ? '#D1FAE5' : '#FEF3C7',
                      color: d.statut === 'Actif' ? '#059669' : '#D97706',
                    }}
                  >
                    {d.statut}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-3 dark:text-white/40 text-[13px]">
                  Aucun distributeur ne correspond a votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
