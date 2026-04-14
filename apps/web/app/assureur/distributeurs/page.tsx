'use client';

import { useMemo } from 'react';
import { Users, TrendingUp, Calendar, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  ENGAGEMENTS, formatMontant, formatDateShortFR,
  STATUT_ENGAGEMENT, COLLECTE_MENSUELLE,
} from '@/lib/mock-data-assureur';

interface DistributeurSummary {
  nom: string;
  nbEngagements: number;
  volumeTotal: number;
  dernierEngagement: string;
  statut: 'Actif' | 'En attente';
}

export default function DistributeursPage() {
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
      .map(([nom, data]) => ({
        nom,
        nbEngagements: data.count,
        volumeTotal: data.total,
        dernierEngagement: data.lastDate,
        statut: data.hasConfirmed ? 'Actif' as const : 'En attente' as const,
      }))
      .sort((a, b) => b.volumeTotal - a.volumeTotal);
  }, []);

  const totalActifs = distributeurs.filter((d) => d.statut === 'Actif').length;
  const totalEngagements = ENGAGEMENTS.length;
  const volumeCeMois = COLLECTE_MENSUELLE[COLLECTE_MENSUELLE.length - 1]?.montant ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-display font-bold text-ink dark:text-white mb-1">Distributeurs</h1>
        <p className="text-[14px] font-body text-ink-3">Suivi des cabinets CGP et courtiers actifs sur vos produits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Users, label: 'Distributeurs actifs', value: totalActifs },
          { icon: TrendingUp, label: 'Engagements en cours', value: `${totalEngagements} engagements` },
          { icon: Calendar, label: 'Volume ce mois', value: formatMontant(volumeCeMois) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="relative overflow-hidden group bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm p-5">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-9 h-9 bg-gradient-to-br from-violet/10 to-cobalt/10 rounded-lg flex items-center justify-center mb-3">
              <Icon size={16} className="text-violet" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold block font-body text-ink-3">{label}</span>
            <span className="text-[20px] font-display font-bold text-ink dark:text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-surface dark:bg-white/5 border-b border-border/60">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Cabinet</th>
              <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Engagements</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Volume total</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Dernier engagement</th>
              <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {distributeurs.map((d) => (
              <tr key={d.nom} className="hover:bg-violet/[0.04] transition-colors border-b border-border/40">
                <td className="px-4 py-3.5">
                  <span className="font-medium text-ink dark:text-white">{d.nom}</span>
                </td>
                <td className="px-4 py-3.5 text-center font-mono font-semibold text-ink-2">
                  {d.nbEngagements}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-semibold text-ink dark:text-white">
                  {formatMontant(d.volumeTotal)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-ink-3">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
