'use client';

import { useMemo, useState } from 'react';
import { Package, Search, Check, AlertCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Step4Values {
  proposedProducts: string[];
}

export type Step4Errors = Partial<Record<keyof Step4Values, string>>;

interface Step4Props {
  values: Step4Values;
  errors: Step4Errors;
  onChange: <K extends keyof Step4Values>(key: K, value: Step4Values[K]) => void;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export function validateStep4(v: Step4Values): Step4Errors {
  const errors: Step4Errors = {};
  if (!v.proposedProducts || v.proposedProducts.length === 0) {
    errors.proposedProducts = 'S\u00e9lectionnez au moins un produit.';
  }
  return errors;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const PAYOFF_LABEL: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Prot\u00e9g\u00e9',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const PAYOFF_VARIANT: Record<string, 'violet' | 'cobalt' | 'teal' | 'gold' | 'red' | 'muted'> = {
  AUTOCALL_PHOENIX: 'violet',
  AUTOCALL_COUPON: 'cobalt',
  CAPITAL_PROTECTED: 'teal',
  CONDITIONAL_RATE: 'gold',
  BARRIER_NOTE: 'red',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function Step4Products({ values, errors, onChange }: Step4Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_PRODUCTS;
    return DEMO_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.isin.toLowerCase().includes(q) ||
        (p.issuerName?.toLowerCase().includes(q) ?? false) ||
        (p.underlyingName?.toLowerCase().includes(q) ?? false),
    );
  }, [query]);

  const toggle = (id: string) => {
    const current = values.proposedProducts ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange('proposedProducts', next);
  };

  const count = values.proposedProducts?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Package size={16} className="text-[#3B1FA8]" />
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">
            Produits propos\u00e9s
          </h2>
        </div>
        <p className="font-body text-sm text-ink-3">
          S\u00e9lectionnez les produits structur\u00e9s \u00e0 recommander au client
          depuis le catalogue Strick\u2019in.
        </p>
      </div>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
        />
        <Input
          placeholder="Rechercher un produit, ISIN, \u00e9metteur..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {errors.proposedProducts && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red/5 border border-red/20">
          <AlertCircle size={14} className="text-red" />
          <p className="font-body text-xs text-red font-medium">
            {errors.proposedProducts}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
        {filtered.map((p) => {
          const selected = values.proposedProducts?.includes(p.id) ?? false;
          const payoffLabel = PAYOFF_LABEL[p.payoffType] ?? p.payoffType;
          const payoffVariant = PAYOFF_VARIANT[p.payoffType] ?? 'muted';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              aria-pressed={selected}
              className={cn(
                'group relative text-left rounded-xl border bg-white dark:bg-white/5',
                'p-4 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
                selected
                  ? 'border-[#3B1FA8] shadow-md bg-[#F8F6FF] dark:bg-[#3B1FA8]/10'
                  : 'border-border hover:border-[#3B1FA8]/40 hover:shadow-sm',
              )}
            >
              {selected && (
                <span
                  className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3B1FA8]"
                  aria-hidden="true"
                >
                  <Check size={14} strokeWidth={3} className="text-white" />
                </span>
              )}

              <div className="flex items-start justify-between gap-3 mb-2 pr-8">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[14px] font-bold text-ink dark:text-white leading-tight truncate">
                    {p.name}
                  </h3>
                  <p className="font-mono text-[10.5px] text-ink-3 mt-0.5">{p.isin}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                <Badge variant={payoffVariant} size="sm">
                  {payoffLabel}
                </Badge>
                <Badge variant="muted" size="sm">
                  SRI {p.sri ?? '\u2014'}
                </Badge>
              </div>

              <p className="font-body text-[11.5px] text-ink-3 line-clamp-2 leading-snug">
                {p.description ?? '\u2014'}
              </p>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1 text-[10.5px] text-ink-3">
                  <Shield size={10} />
                  <span>Barri\u00e8re {p.barrierCapPct ?? '\u2014'}%</span>
                </div>
                <span className="text-ink-3/40">\u00b7</span>
                <span className="text-[10.5px] text-ink-3 truncate">
                  {p.issuerName}
                </span>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="font-body text-sm text-ink-3">
              Aucun produit ne correspond \u00e0 votre recherche.
            </p>
          </div>
        )}
      </div>

      <p className="font-body text-xs text-ink-3 border-t border-border/50 pt-3">
        {count} produit{count > 1 ? 's' : ''} s\u00e9lectionn\u00e9{count > 1 ? 's' : ''}
        {' '}sur {DEMO_PRODUCTS.length} disponibles.
      </p>
    </div>
  );
}
