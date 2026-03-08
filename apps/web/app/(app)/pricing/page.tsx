'use client';

import { useState } from 'react';
import {
  Calculator,
  History,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Sliders,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingRequest {
  id: string;
  quotationDate: string;
  pricingId: string;
  notional: number;
  currency: string;
  productType: string;
  ticker: string;
  maturity: string;
  capitalProtection: number;
  coupon: number;
  parameter: string;
  result: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_HISTORY: PricingRequest[] = [
  {
    id: '1',
    quotationDate: '2025-10-17',
    pricingId: '219982',
    notional: 1000000,
    currency: 'EUR',
    productType: 'Phoenix',
    ticker: 'SX5E',
    maturity: '10Y',
    capitalProtection: 50,
    coupon: 7.5,
    parameter: 'Reoffer',
    result: null,
    status: 'PENDING',
  },
  {
    id: '2',
    quotationDate: '2025-10-17',
    pricingId: '219980',
    notional: 1000000,
    currency: 'EUR',
    productType: 'Phoenix',
    ticker: 'SX5E',
    maturity: '6Y',
    capitalProtection: 50,
    coupon: 8.2,
    parameter: 'Reoffer',
    result: '2.3%',
    status: 'COMPLETED',
  },
  {
    id: '3',
    quotationDate: '2025-09-28',
    pricingId: '218445',
    notional: 500000,
    currency: 'EUR',
    productType: 'Autocall',
    ticker: 'CAC 40',
    maturity: '8Y',
    capitalProtection: 60,
    coupon: 6.0,
    parameter: 'Coupon',
    result: '6.8%',
    status: 'COMPLETED',
  },
  {
    id: '4',
    quotationDate: '2025-09-15',
    pricingId: '217990',
    notional: 2000000,
    currency: 'EUR',
    productType: 'Capital Protégé',
    ticker: 'MSCI World',
    maturity: '5Y',
    capitalProtection: 100,
    coupon: 3.5,
    parameter: 'Participation',
    result: '120%',
    status: 'COMPLETED',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Range Slider Component ──────────────────────────────────────────────────

function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  unit = '',
  step = 1,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  unit?: string;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet font-body">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-ink-2 min-w-[40px]">
          {value[0]}{unit}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          className="flex-1 h-1 bg-border rounded-full appearance-none cursor-pointer accent-violet"
        />
        <span className="text-[11px] font-mono text-ink-2 min-w-[40px] text-right">
          {value[1]}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          className="flex-1 h-1 bg-border rounded-full appearance-none cursor-pointer accent-violet"
        />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [tab, setTab] = useState<'generator' | 'history'>('generator');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Generator form state
  const [productType, setProductType] = useState('');
  const [underlying, setUnderlying] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [maturityMonths, setMaturityMonths] = useState<[number, number]>([72, 120]);
  const [capitalProtection, setCapitalProtection] = useState<[number, number]>([50, 50]);
  const [coupon, setCoupon] = useState<[number, number]>([7, 7]);
  const [notional, setNotional] = useState<[number, number]>([1000000, 1000000]);

  const selectCls = cn(
    'w-full h-9 rounded-lg border border-border/80 bg-white px-3 text-[12px] font-body text-ink',
    'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet',
    'transition-all duration-150 cursor-pointer',
  );

  return (
    <div className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
          Pricing
        </h1>
        <p className="text-sm text-ink-3 font-body mt-1">
          Générez des pricings et consultez l&apos;historique de vos demandes.
        </p>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg border border-border/80 p-1 w-fit">
        <button
          onClick={() => setTab('generator')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold font-body transition-all duration-200',
            tab === 'generator'
              ? 'bg-violet text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-surface-2',
          )}
        >
          <Calculator size={14} />
          Pricing Generator
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold font-body transition-all duration-200',
            tab === 'history'
              ? 'bg-violet text-white shadow-sm'
              : 'text-ink-3 hover:text-ink hover:bg-surface-2',
          )}
        >
          <History size={14} />
          Historique
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex gap-6">
        {/* ── Sidebar Filters ─────────────────────────────────────── */}
        <div
          className={cn(
            'shrink-0 transition-all duration-300',
            sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden',
          )}
        >
          <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-violet-ghost">
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-violet" />
                <span className="text-[12px] font-bold text-ink font-body">Filtres</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-ink-3 hover:text-ink transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-5">
              {/* Product Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet font-body">
                  Type de produit
                </label>
                <select value={productType} onChange={(e) => setProductType(e.target.value)} className={selectCls}>
                  <option value="">Tous les types</option>
                  <option value="phoenix">Phoenix</option>
                  <option value="autocall">Autocall</option>
                  <option value="capital_protected">Capital Protégé</option>
                  <option value="reverse_convertible">Reverse Convertible</option>
                </select>
              </div>

              {/* Underlying */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet font-body">
                  Sous-jacent
                </label>
                <select value={underlying} onChange={(e) => setUnderlying(e.target.value)} className={selectCls}>
                  <option value="">Tous</option>
                  <option value="SX5E">Euro Stoxx 50</option>
                  <option value="CAC">CAC 40</option>
                  <option value="SPX">S&P 500</option>
                  <option value="MSCI">MSCI World</option>
                </select>
              </div>

              {/* Currency */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet font-body">
                  Devise
                </label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>

              <div className="h-px bg-border/60" />

              {/* Notional */}
              <RangeSlider
                label="Notionnel"
                min={100000}
                max={10000000}
                step={100000}
                value={notional}
                onChange={setNotional}
                unit="€"
              />

              {/* Maturity */}
              <RangeSlider
                label="Maturité (mois)"
                min={12}
                max={180}
                step={6}
                value={maturityMonths}
                onChange={setMaturityMonths}
              />

              {/* Capital Protection */}
              <RangeSlider
                label="Protection du capital"
                min={0}
                max={100}
                step={5}
                value={capitalProtection}
                onChange={setCapitalProtection}
                unit="%"
              />

              {/* Coupon */}
              <RangeSlider
                label="Coupon"
                min={0}
                max={20}
                step={0.5}
                value={coupon}
                onChange={setCoupon}
                unit="%"
              />

              <div className="h-px bg-border/60" />

              {/* Submit */}
              <button
                className={cn(
                  'w-full h-10 rounded-lg bg-violet text-white text-[13px] font-semibold font-body',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200 hover:bg-violet-dark active:scale-[0.98]',
                  'shadow-sm hover:shadow-md',
                )}
              >
                <Calculator size={14} />
                Lancer le pricing
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar toggle (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              'shrink-0 w-10 h-10 rounded-lg border border-border/80 bg-white',
              'flex items-center justify-center text-ink-3 hover:text-violet hover:border-violet',
              'transition-all duration-150 self-start',
            )}
          >
            <Sliders size={16} />
          </button>
        )}

        {/* ── Main Content ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {tab === 'generator' ? (
            /* ── Generator ──────────────────────────────────────── */
            <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-ink">
                  Résultats de pricing
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-3 font-body flex items-center gap-1">
                    <Clock size={11} />
                    Dernière mise à jour : —
                  </span>
                </div>
              </div>

              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet-ghost flex items-center justify-center">
                  <Calculator size={28} className="text-violet/40" />
                </div>
                <p className="text-sm text-ink-3 font-body text-center max-w-xs">
                  Configurez vos paramètres dans le panneau de filtres puis lancez le pricing pour obtenir des résultats.
                </p>
                <p className="text-[11px] text-ink-3/60 font-body">
                  Les résultats seront affichés dans ce tableau.
                </p>
              </div>
            </div>
          ) : (
            /* ── History ────────────────────────────────────────── */
            <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <History size={15} className="text-violet" />
                  Historique des pricings
                </h2>
                <button
                  className={cn(
                    'h-8 px-3 rounded-lg border border-border/80 bg-white text-ink-3',
                    'text-[11px] font-medium font-body flex items-center gap-1.5',
                    'hover:text-violet hover:border-violet transition-all',
                  )}
                >
                  <Download size={12} />
                  Export
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[13px] font-body">
                  <thead>
                    <tr className="border-b border-border/60" style={{ background: 'rgba(237,232,255,0.3)' }}>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Pricing ID</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Notionnel</th>
                      <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Devise</th>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Type</th>
                      <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Ticker</th>
                      <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Maturité</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Protection</th>
                      <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Coupon</th>
                      <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Résultat</th>
                      <th className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_HISTORY.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/40 last:border-0 hover:bg-violet-ghost/40 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-ink-2 whitespace-nowrap">{formatDate(p.quotationDate)}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-violet font-semibold cursor-pointer hover:underline">{p.pricingId}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAmount(p.notional)}</td>
                        <td className="px-4 py-3 text-center text-ink-3">{p.currency}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-violet-pale text-violet">
                            {p.productType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-2">{p.ticker}</td>
                        <td className="px-4 py-3 text-center text-ink-2">{p.maturity}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{p.capitalProtection}%</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-teal font-semibold">{p.coupon}%</td>
                        <td className="px-4 py-3 text-center font-mono tabular-nums font-semibold">
                          {p.result ?? <span className="text-ink-3">N/A</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold',
                              p.status === 'COMPLETED' && 'bg-teal-light text-teal',
                              p.status === 'PENDING' && 'bg-gold-light text-gold',
                              p.status === 'FAILED' && 'bg-red-light text-red',
                            )}
                          >
                            {p.status === 'COMPLETED' ? 'Terminé' : p.status === 'PENDING' ? 'En cours' : 'Échoué'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] text-ink-3 font-body">
                  {MOCK_HISTORY.length} résultat{MOCK_HISTORY.length > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-violet text-white text-[11px] font-bold">1</span>
                  <span className="text-[11px] text-ink-3 font-body mx-1">sur 1</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
