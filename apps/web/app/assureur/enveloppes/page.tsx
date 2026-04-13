'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Users, Clock, ArrowUpRight } from 'lucide-react';
import {
  ENVELOPPES, ENGAGEMENTS, getProduit, getEngagements,
  formatMontant, formatDateFR, formatDateShortFR,
  STATUT_ENVELOPPE, STATUT_ENGAGEMENT,
} from '@/lib/mock-data-assureur';

function EnveloppeTable() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-[12px] overflow-hidden" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Produit</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Statut</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Remplissage</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Confirmé / Cible</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Surbooking</th>
            <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Distributeurs</th>
            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Clôture</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {ENVELOPPES.map((env) => {
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
                    className="flex items-center cursor-pointer transition-colors hover:bg-gray-50 px-4 py-3.5"
                    style={{ borderBottom: '1px solid #F3F4F6' }}
                    onClick={() => setExpandedId(isExpanded ? null : env.id)}
                  >
                    {/* Produit */}
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-medium" style={{ color: '#111827' }}>{produit.nom}</p>
                      <p className="text-[11px] font-mono" style={{ color: '#9CA3AF' }}>{produit.isin}</p>
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
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                          <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: barColor }} />
                        </div>
                        <span className="text-[11px] font-mono font-semibold w-8 text-right" style={{ color: '#4B5563' }}>{fillPct.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Confirmé / Cible */}
                    <div className="w-[160px] text-right">
                      <span className="font-semibold font-mono" style={{ color: '#111827' }}>{formatMontant(env.montantConfirme)}</span>
                      <span style={{ color: '#9CA3AF' }}> / {formatMontant(env.montantCible)}</span>
                    </div>

                    {/* Surbooking */}
                    <div className="w-[80px] text-center">
                      <span className="font-mono" style={{ color: '#4B5563' }}>{env.surbookingPct}%</span>
                    </div>

                    {/* Distributeurs */}
                    <div className="w-[90px] text-center">
                      <span className="flex items-center justify-center gap-1" style={{ color: '#4B5563' }}>
                        <Users size={12} /> {env.nbInteresses}
                      </span>
                    </div>

                    {/* Clôture */}
                    <div className="w-[120px] text-right">
                      <span style={{ color: daysLeft > 0 && daysLeft <= 30 ? '#DC2626' : '#4B5563' }}>
                        {formatDateShortFR(env.dateCloture)}
                      </span>
                    </div>

                    {/* Expand */}
                    <div className="w-[40px] text-center">
                      {isExpanded ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} /> : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 py-4" style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[12px] font-bold" style={{ color: '#111827' }}>
                          Engagements ({engagements.length})
                        </h4>
                        <Link href={`/assureur/produits/${env.produitId}`} className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-80" style={{ color: '#3B28CC' }}>
                          Fiche produit <ArrowUpRight size={10} />
                        </Link>
                      </div>

                      {engagements.length === 0 ? (
                        <p className="text-[12px] py-4 text-center" style={{ color: '#9CA3AF' }}>Aucun engagement.</p>
                      ) : (
                        <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                <th className="px-3 py-2 text-left font-semibold" style={{ color: '#9CA3AF' }}>Distributeur</th>
                                <th className="px-3 py-2 text-right font-semibold" style={{ color: '#9CA3AF' }}>Montant</th>
                                <th className="px-3 py-2 text-center font-semibold" style={{ color: '#9CA3AF' }}>Statut</th>
                                <th className="px-3 py-2 text-right font-semibold" style={{ color: '#9CA3AF' }}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {engagements.map((eng) => {
                                const st = STATUT_ENGAGEMENT[eng.statut];
                                return (
                                  <tr key={eng.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    <td className="px-3 py-2 font-medium" style={{ color: '#111827' }}>{eng.distributeur}</td>
                                    <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: '#111827' }}>{formatMontant(eng.montant)}</td>
                                    <td className="px-3 py-2 text-center">
                                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: st.bg, color: st.text }}>
                                        {st.label}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono" style={{ color: '#9CA3AF' }}>{formatDateShortFR(eng.date)}</td>
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
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1" style={{ color: '#111827' }}>Enveloppes</h1>
        <p className="text-[14px]" style={{ color: '#9CA3AF' }}>Gestion des enveloppes et suivi des bookings en temps réel</p>
      </div>
      <EnveloppeTable />
    </div>
  );
}
