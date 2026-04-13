'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowUpRight, Users, Clock } from 'lucide-react';
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
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-1" style={{ color: '#111827' }}>Catalogue produits</h1>
        <p className="text-[14px]" style={{ color: '#9CA3AF' }}>Produits structurés disponibles à la distribution</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[12px] p-4 mb-6 flex items-center gap-3 flex-wrap" style={{ border: '1px solid #E5E7EB' }}>
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9CA3AF' }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, ISIN..."
            className="w-full h-9 rounded-[8px] pl-9 pr-3 text-[13px]"
            style={{ border: '1px solid #E5E7EB', color: '#111827' }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="h-9 rounded-[8px] px-3 text-[13px] cursor-pointer"
          style={{ border: '1px solid #E5E7EB', color: '#4B5563' }}
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-[12px] mr-1" style={{ color: '#9CA3AF' }}>SRI :</span>
          {[null, 1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={String(n)}
              onClick={() => setSriFilter(n)}
              className="h-7 min-w-7 px-1.5 rounded-[6px] text-[11px] font-semibold transition-all"
              style={{
                background: sriFilter === n ? '#3B28CC' : '#F3F4F6',
                color: sriFilter === n ? '#FFFFFF' : '#4B5563',
              }}
            >
              {n === null ? 'Tous' : n}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-[12px] mb-4" style={{ color: '#9CA3AF' }}>
        <span className="font-semibold" style={{ color: '#111827' }}>{filtered.length}</span> produit{filtered.length > 1 ? 's' : ''}
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
              className="group flex flex-col bg-white rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
              style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            >
              <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-[6px] px-2 py-0.5 text-[10px] font-semibold" style={{ background: typeStyle.bg, color: typeStyle.text }}>
                    {TYPE_LABELS[p.type]}
                  </span>
                  <span className="inline-flex items-center rounded-[6px] px-2 py-0.5 text-[10px] font-bold font-mono" style={{ background: sriStyle.bg, color: sriStyle.text }}>
                    SRI {p.sri}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <p className="text-[14px] font-semibold leading-snug group-hover:opacity-80 transition-opacity" style={{ color: '#111827' }}>
                    {p.nom}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>
                    {p.emetteur} · {p.sousJacent}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 rounded-[8px] p-3" style={{ background: '#F9FAFB' }}>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#9CA3AF' }}>
                      {p.couponPct ? 'Coupon' : 'Gain max'}
                    </span>
                    <span className="text-[15px] font-bold" style={{ color: '#111827' }}>
                      {p.couponPct ? `${p.couponPct}%` : p.gainMaxPct ? `${p.gainMaxPct}%` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#9CA3AF' }}>Barrière</span>
                    <span className="text-[15px] font-bold" style={{ color: p.barrierePct ? '#DC2626' : '#111827' }}>
                      {p.barrierePct ? `${p.barrierePct}%` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#9CA3AF' }}>Maturité</span>
                    <span className="text-[12px] font-semibold" style={{ color: '#111827' }}>
                      {new Date(p.maturite).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Enveloppe progress */}
                {env && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span style={{ color: '#4B5563' }}>Enveloppe</span>
                      <span className="font-mono" style={{ color: '#9CA3AF' }}>
                        {fillPct.toFixed(0)}% · {formatMontant(env.montantConfirme)}/{formatMontant(env.montantCible)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fillPct}%`, background: '#3B28CC' }} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: '#9CA3AF' }}>
                      <span className="flex items-center gap-1"><Users size={10} /> {env.nbInteresses} intéressés</span>
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className="flex items-center gap-1" style={{ color: daysLeft <= 30 ? '#DC2626' : '#9CA3AF' }}>
                          <Clock size={10} /> J-{daysLeft}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                <span className="text-[11px] font-semibold transition-opacity group-hover:opacity-80" style={{ color: '#3B28CC' }}>
                  Voir détails
                </span>
                <ArrowUpRight size={14} style={{ color: '#3B28CC', opacity: 0.5 }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
