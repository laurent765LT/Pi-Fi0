'use client';

import { useMemo } from 'react';
import { Users, TrendingUp, Calendar, ArrowUpDown } from 'lucide-react';
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
        <h1 className="text-[22px] font-bold mb-1" style={{ color: '#111827' }}>Distributeurs</h1>
        <p className="text-[14px]" style={{ color: '#9CA3AF' }}>Suivi des cabinets CGP et courtiers actifs sur vos produits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Users, label: 'Distributeurs actifs', value: totalActifs },
          { icon: TrendingUp, label: 'Engagements en cours', value: `${totalEngagements} engagements` },
          { icon: Calendar, label: 'Volume ce mois', value: formatMontant(volumeCeMois) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-[12px] p-5" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ background: '#EEF0FD' }}>
              <Icon size={16} style={{ color: '#3B28CC' }} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold block" style={{ color: '#9CA3AF' }}>{label}</span>
            <span className="text-[20px] font-bold" style={{ color: '#111827' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] overflow-hidden" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Cabinet</th>
              <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Engagements</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Volume total</th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Dernier engagement</th>
              <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {distributeurs.map((d) => (
              <tr key={d.nom} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td className="px-4 py-3.5">
                  <span className="font-medium" style={{ color: '#111827' }}>{d.nom}</span>
                </td>
                <td className="px-4 py-3.5 text-center font-mono font-semibold" style={{ color: '#4B5563' }}>
                  {d.nbEngagements}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: '#111827' }}>
                  {formatMontant(d.volumeTotal)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono" style={{ color: '#9CA3AF' }}>
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
