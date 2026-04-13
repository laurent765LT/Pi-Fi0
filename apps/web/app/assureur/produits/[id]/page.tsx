'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Shield, Clock, Users, TrendingUp, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  PRODUITS, ENVELOPPES, ENGAGEMENTS, getProduit, getEnveloppe, getEngagements,
  formatMontant, formatMontantFull, formatDateFR, formatDateShortFR,
  TYPE_LABELS, TYPE_COLORS, SRI_COLORS, STATUT_ENGAGEMENT,
} from '@/lib/mock-data-assureur';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
      <span className="text-[11px] uppercase tracking-[0.15em] font-semibold shrink-0" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-[13px] font-semibold text-right" style={{ color: '#111827' }}>{value}</span>
    </div>
  );
}

export default function ProduitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'caract' | 'dates' | 'scenarios'>('caract');

  const produit = getProduit(id);
  if (!produit) {
    return (
      <div className="text-center py-24">
        <p className="text-[14px]" style={{ color: '#DC2626' }}>Produit introuvable.</p>
        <Link href="/assureur/produits" className="text-[13px] font-semibold mt-2 inline-block" style={{ color: '#3B28CC' }}>Retour au catalogue</Link>
      </div>
    );
  }

  const env = getEnveloppe(id);
  const engagements = env ? getEngagements(env.id) : [];
  const typeStyle = TYPE_COLORS[produit.type];
  const sriStyle = SRI_COLORS[produit.sri];
  const maxAmount = env ? env.montantCible * (1 + env.surbookingPct / 100) : 0;
  const fillPct = env ? Math.min(100, (env.montantConfirme / maxAmount) * 100) : 0;
  const daysLeft = env ? Math.ceil((new Date(env.dateCloture).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  let barColor = '#3B28CC';
  if (env && env.montantConfirme > env.montantCible) barColor = '#DC2626';
  else if (fillPct > 85) barColor = '#EA580C';
  else if (fillPct > 50) barColor = '#2563EB';

  const scenarios = [
    { name: 'Stress', pct: -(produit.barrierePct ?? 50), color: '#DC2626' },
    { name: 'Défavorable', pct: -((produit.barrierePct ?? 50) * 0.5), color: '#EA580C' },
    { name: 'Modéré', pct: produit.couponPct ?? (produit.gainMaxPct ?? 0) * 0.4, color: '#D97706' },
    { name: 'Favorable', pct: produit.gainMaxPct ?? produit.couponPct ?? 0, color: '#059669' },
  ];

  const tabs = [
    { key: 'caract' as const, label: 'Caractéristiques' },
    { key: 'dates' as const, label: "Dates d'observation" },
    { key: 'scenarios' as const, label: 'Scénarios' },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <Link href="/assureur/produits" className="inline-flex items-center gap-1.5 text-[13px] mb-5 hover:opacity-80 transition-opacity" style={{ color: '#9CA3AF' }}>
        <ArrowLeft size={14} /> Retour au catalogue
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center rounded-[6px] px-2.5 py-1 text-[11px] font-semibold" style={{ background: typeStyle.bg, color: typeStyle.text }}>
            {TYPE_LABELS[produit.type]}
          </span>
          <span className="inline-flex items-center rounded-[6px] px-2.5 py-1 text-[11px] font-bold font-mono" style={{ background: sriStyle.bg, color: sriStyle.text }}>
            SRI {produit.sri} · {sriStyle.label}
          </span>
          <span className="inline-flex items-center rounded-[6px] px-2.5 py-1 text-[11px] font-semibold" style={{ background: '#D1FAE5', color: '#059669' }}>
            {produit.status === 'ACTIF' ? 'Actif' : 'Fermé'}
          </span>
        </div>
        <h1 className="text-[28px] font-bold mb-1" style={{ color: '#111827' }}>{produit.nom}</h1>
        <div className="flex items-center gap-3 text-[13px]" style={{ color: '#9CA3AF' }}>
          <span className="font-mono text-[12px] px-2 py-0.5 rounded" style={{ background: '#F3F4F6' }}>{produit.isin}</span>
          <span>{produit.emetteur} / {produit.garant}</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: produit.couponPct ? 'Coupon' : 'Gain max', value: produit.couponPct ? `+${produit.couponPct}%/an` : produit.gainMaxPct ? `+${produit.gainMaxPct}%` : '—' },
          { label: 'Barrière', value: produit.barrierePct ? `${produit.barrierePct}%` : 'N/A' },
          { label: 'Rappel', value: produit.rappelPct ? `${produit.rappelPct}%` : 'N/A' },
          { label: 'Maturité', value: new Date(produit.maturite).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[12px] p-4 text-center" style={{ border: '1px solid #E5E7EB' }}>
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold block mb-1" style={{ color: '#9CA3AF' }}>{label}</span>
            <span className="text-[18px] font-bold" style={{ color: '#111827' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tabs */}
          <div className="bg-white rounded-[12px] overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex" style={{ borderBottom: '1px solid #E5E7EB' }}>
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="px-5 py-3 text-[13px] font-medium transition-colors"
                  style={{
                    color: activeTab === key ? '#3B28CC' : '#9CA3AF',
                    borderBottom: activeTab === key ? '2px solid #3B28CC' : '2px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'caract' && (
                <div>
                  <DetailRow label="Émetteur" value={produit.emetteur} />
                  <DetailRow label="Garant" value={produit.garant} />
                  <DetailRow label="Sous-jacent" value={produit.sousJacent} />
                  {produit.barrierePct != null && <DetailRow label="Barrière capital" value={<span style={{ color: '#DC2626' }}>{produit.barrierePct}%</span>} />}
                  {produit.rappelPct != null && <DetailRow label="Barrière de rappel" value={`${produit.rappelPct}%`} />}
                  {produit.couponPct != null && <DetailRow label="Coupon" value={<span style={{ color: '#059669' }}>{produit.couponPct}% p.a.</span>} />}
                  {produit.gainMaxPct != null && <DetailRow label="Gain maximum" value={`+${produit.gainMaxPct}%`} />}
                  {produit.protectionCapitalPct != null && <DetailRow label="Protection capital" value={`${produit.protectionCapitalPct}%`} />}
                  <DetailRow label="Maturité" value={formatDateFR(produit.maturite)} />
                  <DetailRow label="Frais d'entrée" value={`${produit.fraisEntree}%`} />
                  <DetailRow label="SRI" value={<span style={{ color: sriStyle.text }}>{produit.sri}/7 ({sriStyle.label})</span>} />
                </div>
              )}

              {activeTab === 'dates' && (
                produit.datesObservation.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {produit.datesObservation.map((date, i) => {
                      const isPast = new Date(date) < new Date();
                      return (
                        <div key={date} className="flex items-center gap-2 rounded-[8px] px-3 py-2.5" style={{ border: '1px solid #E5E7EB', background: isPast ? '#F9FAFB' : '#EEF0FD', opacity: isPast ? 0.5 : 1 }}>
                          <Calendar size={12} style={{ color: isPast ? '#9CA3AF' : '#3B28CC' }} />
                          <div>
                            <span className="font-mono text-[12px] font-semibold" style={{ color: '#111827', textDecoration: isPast ? 'line-through' : 'none' }}>
                              {formatDateShortFR(date)}
                            </span>
                            <span className="block text-[9px]" style={{ color: '#9CA3AF' }}>Année {i + 1}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center py-10 text-[13px]" style={{ color: '#9CA3AF' }}>Pas de dates d&apos;observation pour ce produit.</p>
                )
              )}

              {activeTab === 'scenarios' && (
                <div>
                  <p className="text-[12px] mb-4" style={{ color: '#9CA3AF' }}>
                    Estimation des performances pour un investissement de 10 000 €.
                  </p>
                  <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Scénario</th>
                          <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Perf. %</th>
                          <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Pour 10 000 €</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map((s) => (
                          <tr key={s.name} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td className="px-4 py-2.5 font-semibold" style={{ color: s.color }}>{s.name}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: s.color }}>
                              {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1)}%
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono" style={{ color: '#4B5563' }}>
                              {formatMontantFull(10_000 * (1 + s.pct / 100))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {produit.description && (
            <div className="bg-white rounded-[12px] p-5" style={{ border: '1px solid #E5E7EB' }}>
              <h3 className="text-[13px] font-bold mb-3" style={{ color: '#111827' }}>Mécanisme du produit</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: '#4B5563' }}>{produit.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Enveloppe card */}
          {env && (
            <div className="bg-white rounded-[12px] p-5 sticky top-6" style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-4" style={{ color: '#9CA3AF' }}>
                Enveloppe {env.id}
              </h3>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span style={{ color: '#4B5563' }}>{fillPct.toFixed(0)}%</span>
                  <span className="font-mono" style={{ color: '#9CA3AF' }}>{formatMontant(env.montantConfirme)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${fillPct}%`, background: barColor }} />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-[13px] mb-4">
                <div className="flex justify-between">
                  <span style={{ color: '#9CA3AF' }}>Confirmé</span>
                  <span className="font-semibold" style={{ color: '#059669' }}>{formatMontant(env.montantConfirme)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#9CA3AF' }}>En attente</span>
                  <span className="font-semibold" style={{ color: '#D97706' }}>{formatMontant(env.montantAttente)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#9CA3AF' }}>Cible</span>
                  <span className="font-semibold" style={{ color: '#111827' }}>{formatMontant(env.montantCible)} (+{env.surbookingPct}% surb.)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2.5 px-3 rounded-[8px] mb-4" style={{ background: '#F9FAFB' }}>
                <Users size={14} style={{ color: '#3B28CC' }} />
                <span className="text-[13px] font-semibold" style={{ color: '#111827' }}>{env.nbInteresses} distributeurs intéressés</span>
              </div>

              {daysLeft !== null && daysLeft > 0 && (
                <div className="flex items-center gap-2 py-2.5 px-3 rounded-[8px] mb-4"
                  style={{ background: daysLeft <= 30 ? '#FEE2E2' : '#F9FAFB' }}
                >
                  <Clock size={14} style={{ color: daysLeft <= 30 ? '#DC2626' : '#9CA3AF' }} />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Clôture</p>
                    <p className="text-[13px] font-semibold" style={{ color: '#111827' }}>{formatDateFR(env.dateCloture)}</p>
                  </div>
                  {daysLeft <= 30 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#DC2626', color: '#FFFFFF' }}>
                      J-{daysLeft}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={() => alert('Fonctionnalité disponible en production')}
                className="w-full h-10 rounded-[12px] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#3B28CC' }}
              >
                Gérer l&apos;enveloppe
              </button>
            </div>
          )}

          {/* Commission + Docs */}
          <div className="bg-white rounded-[12px] p-5" style={{ border: '1px solid #E5E7EB' }}>
            <DetailRow label="Commission" value={`${(produit.fraisEntree * 0.1).toFixed(1)}% entry fee`} />
            <div className="mt-3 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#9CA3AF' }}>Documents</span>
              {['KID (PRIIPS)', 'Fiche produit'].map((doc) => (
                <button key={doc} className="flex items-center gap-2 px-3 py-2 rounded-[8px] w-full text-left transition-colors hover:bg-gray-50" style={{ border: '1px solid #E5E7EB' }}>
                  <FileText size={14} style={{ color: '#9CA3AF' }} />
                  <span className="flex-1 text-[12px] font-medium" style={{ color: '#4B5563' }}>{doc}</span>
                  <ExternalLink size={12} style={{ color: '#9CA3AF' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
