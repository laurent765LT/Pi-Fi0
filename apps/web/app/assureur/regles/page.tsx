'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Shield, Info, Save, Check, X, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import {
  PRODUITS,
  TYPE_LABELS,
  TYPE_COLORS,
  SRI_COLORS,
  type Produit,
} from '@/lib/mock-data-assureur';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PayoffType =
  | 'AUTOCALL_PHOENIX'
  | 'AUTOCALL_COUPON'
  | 'CAPITAL_PROTEGE'
  | 'TAUX_CONDITIONNEL'
  | 'BARRIER_NOTE';

interface Rules {
  payoffTypes: Record<PayoffType, boolean>;
  sriMax: number;
  barriereMin: number;
  maturiteMax: string;
  fraisEntreeMax: number;
  emetteurs: Record<string, boolean>;
}

interface EligibilityResult {
  produit: Produit;
  eligible: boolean;
  reasons: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYOFF_OPTIONS: { key: PayoffType; label: string }[] = [
  { key: 'AUTOCALL_PHOENIX', label: 'Autocall Phoenix' },
  { key: 'AUTOCALL_COUPON', label: 'Autocall Coupon' },
  { key: 'CAPITAL_PROTEGE', label: 'Capital Protege' },
  { key: 'TAUX_CONDITIONNEL', label: 'Taux Conditionnel' },
  { key: 'BARRIER_NOTE', label: 'Barrier Note' },
];

const MATURITE_OPTIONS = [
  { value: '3', label: '3 ans' },
  { value: '5', label: '5 ans' },
  { value: '7', label: '7 ans' },
  { value: '10', label: '10 ans' },
  { value: '12', label: '12 ans' },
  { value: 'none', label: 'Pas de limite' },
];

const EMETTEURS = [
  'BNP Paribas',
  'Natixis',
  'Goldman Sachs',
  'SG Issuer',
  'Marex',
  'Barclays',
];

const STORAGE_KEY = 'strickin-insurer-rules';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function defaultRules(): Rules {
  return {
    payoffTypes: {
      AUTOCALL_PHOENIX: true,
      AUTOCALL_COUPON: true,
      CAPITAL_PROTEGE: true,
      TAUX_CONDITIONNEL: true,
      BARRIER_NOTE: true,
    },
    sriMax: 5,
    barriereMin: 50,
    maturiteMax: '10',
    fraisEntreeMax: 5,
    emetteurs: Object.fromEntries(EMETTEURS.map((e) => [e, true])),
  };
}

function loadRules(): Rules {
  if (typeof window === 'undefined') return defaultRules();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Rules;
  } catch {
    // ignore
  }
  return defaultRules();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert maturite ISO date to years from now */
function maturiteYears(iso: string): number {
  const now = new Date();
  const mat = new Date(iso);
  return (mat.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

/** Check if a product emetteur matches any enabled emetteur */
function matchesEmetteur(emetteur: string, enabledEmetteurs: Record<string, boolean>): boolean {
  return Object.entries(enabledEmetteurs).some(
    ([name, enabled]) => enabled && emetteur.toLowerCase().includes(name.toLowerCase()),
  );
}

function checkEligibility(produit: Produit, rules: Rules): EligibilityResult {
  const reasons: string[] = [];

  // 1. Check payoff type
  if (!rules.payoffTypes[produit.type as PayoffType]) {
    reasons.push(`Type "${TYPE_LABELS[produit.type]}" non autorise`);
  }

  // 2. Check SRI
  if (produit.sri > rules.sriMax) {
    reasons.push(`SRI ${produit.sri} > maximum ${rules.sriMax}`);
  }

  // 3. Check barrier
  if (produit.barrierePct !== null && produit.barrierePct < rules.barriereMin) {
    reasons.push(`Barriere ${produit.barrierePct}% < minimum ${rules.barriereMin}%`);
  }

  // 4. Check maturity
  if (rules.maturiteMax !== 'none') {
    const years = maturiteYears(produit.maturite);
    const maxYears = parseInt(rules.maturiteMax, 10);
    if (years > maxYears) {
      reasons.push(`Maturite ${years.toFixed(1)} ans > maximum ${maxYears} ans`);
    }
  }

  // 5. Check entry fees
  if (produit.fraisEntree > rules.fraisEntreeMax) {
    reasons.push(`Frais ${produit.fraisEntree}% > maximum ${rules.fraisEntreeMax}%`);
  }

  // 6. Check emetteur
  if (!matchesEmetteur(produit.emetteur, rules.emetteurs)) {
    reasons.push(`Emetteur "${produit.emetteur}" non autorise`);
  }

  return { produit, eligible: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RuleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/60 shadow-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/40 bg-surface/50 dark:bg-white/[0.02]">
        <h3 className="text-[13px] font-semibold font-body text-ink dark:text-white">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SRIScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => {
          const colors = SRI_COLORS[n];
          const isSelected = n <= value;
          const isExact = n === value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                'h-9 min-w-9 px-2 rounded-md text-[12px] font-bold font-mono transition-all duration-200 border',
                isSelected
                  ? 'shadow-sm'
                  : 'bg-surface-2 dark:bg-white/5 text-ink-3 dark:text-ink-4 border-border/40 opacity-40',
              )}
              style={
                isSelected
                  ? { background: colors.bg, color: colors.text, borderColor: colors.text + '40' }
                  : undefined
              }
            >
              {n}
              {isExact && (
                <span className="ml-1 text-[9px] font-body font-semibold">max</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-[10px] font-body">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Faible (1-2)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Modere (3-4)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Eleve (5-7)
        </span>
      </div>
    </div>
  );
}

function ProductMiniCard({ result }: { result: EligibilityResult }) {
  const { produit, eligible, reasons } = result;
  const typeStyle = TYPE_COLORS[produit.type];
  const sriStyle = SRI_COLORS[produit.sri];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all duration-200',
        eligible
          ? 'bg-white/90 dark:bg-white/5 border-border/60 shadow-card'
          : 'bg-surface/50 dark:bg-white/[0.02] border-border/30 opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-[13px] font-semibold font-body leading-snug truncate',
              eligible ? 'text-ink dark:text-white' : 'text-ink-3 dark:text-ink-4',
            )}
          >
            {produit.nom}
          </p>
          <p className="text-[10px] font-body mt-0.5 text-ink-3 dark:text-ink-4">
            {produit.emetteur}
          </p>
        </div>
        <div className="shrink-0">
          {eligible ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold font-body bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              <Check size={10} /> Eligible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold font-body bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <X size={10} /> Exclu
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-semibold font-body"
          style={{ background: typeStyle.bg, color: typeStyle.text }}
        >
          {TYPE_LABELS[produit.type]}
        </span>
        <span
          className="inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold font-mono"
          style={{ background: sriStyle.bg, color: sriStyle.text }}
        >
          SRI {produit.sri}
        </span>
        {produit.barrierePct !== null && (
          <span className="text-[10px] font-body text-ink-3 dark:text-ink-4">
            Barriere {produit.barrierePct}%
          </span>
        )}
        <span className="text-[10px] font-body text-ink-3 dark:text-ink-4">
          Frais {produit.fraisEntree}%
        </span>
      </div>

      {!eligible && reasons.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {reasons.map((r, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 text-[10px] font-body text-red-500 dark:text-red-400"
            >
              <AlertTriangle size={10} className="shrink-0" />
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReglesEligibilitePage() {
  const { toasts, success, dismiss } = useToast();
  const [rules, setRules] = useState<Rules>(defaultRules);

  // Load from localStorage on mount
  useEffect(() => {
    setRules(loadRules());
  }, []);

  // Derive eligibility results reactively
  const results = useMemo<EligibilityResult[]>(
    () => PRODUITS.map((p) => checkEligibility(p, rules)),
    [rules],
  );

  const eligibleCount = results.filter((r) => r.eligible).length;

  // Updaters
  const togglePayoff = useCallback((key: PayoffType) => {
    setRules((prev) => ({
      ...prev,
      payoffTypes: { ...prev.payoffTypes, [key]: !prev.payoffTypes[key] },
    }));
  }, []);

  const toggleEmetteur = useCallback((name: string) => {
    setRules((prev) => ({
      ...prev,
      emetteurs: { ...prev.emetteurs, [name]: !prev.emetteurs[name] },
    }));
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    success('Regles mises a jour');
  }, [rules, success]);

  return (
    <div>
      <PageHeader icon={Shield} title="Regles d'eligibilite" />

      {/* Explanation banner */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-violet/[0.06] border border-violet/10">
        <Info size={16} className="text-violet mt-0.5 shrink-0" />
        <p className="text-[13px] font-body text-ink-2 dark:text-white/70 leading-relaxed">
          Definissez les criteres que les produits structures doivent respecter pour etre
          distribues via vos enveloppes d&apos;assurance-vie.
        </p>
      </div>

      {/* Rules editor grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Card 1: Types de payoff */}
        <RuleCard title="Types de payoff autorises">
          <div className="flex flex-col gap-2.5">
            {PAYOFF_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rules.payoffTypes[key]}
                  onClick={() => togglePayoff(key)}
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0',
                    rules.payoffTypes[key]
                      ? 'bg-violet border-violet text-white'
                      : 'bg-white dark:bg-white/5 border-border/60 group-hover:border-violet/40',
                  )}
                >
                  {rules.payoffTypes[key] && <Check size={12} strokeWidth={3} />}
                </button>
                <span
                  className={cn(
                    'text-[13px] font-body transition-colors',
                    rules.payoffTypes[key]
                      ? 'text-ink dark:text-white font-medium'
                      : 'text-ink-3 dark:text-ink-4',
                  )}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </RuleCard>

        {/* Card 2: SRI maximum */}
        <RuleCard title="SRI maximum">
          <SRIScale value={rules.sriMax} onChange={(v) => setRules((prev) => ({ ...prev, sriMax: v }))} />
        </RuleCard>

        {/* Card 3: Barriere de protection minimale */}
        <RuleCard title="Barriere de protection minimale">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rules.barriereMin}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value)));
                    setRules((prev) => ({ ...prev, barriereMin: v }));
                  }}
                  className="w-24 h-9 rounded-md px-3 pr-8 text-[13px] font-body font-semibold border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-body text-ink-3 pointer-events-none">
                  %
                </span>
              </div>
              <span className="text-[12px] font-body text-ink-3 dark:text-ink-4">
                minimum requis
              </span>
            </div>
            <p className="text-[11px] font-body text-ink-3 dark:text-ink-4 leading-relaxed">
              Les produits dont la barriere est inferieure a ce seuil seront exclus
              de la distribution.
            </p>
          </div>
        </RuleCard>

        {/* Card 4: Maturite maximale */}
        <RuleCard title="Maturite maximale">
          <div className="flex flex-wrap gap-2">
            {MATURITE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRules((prev) => ({ ...prev, maturiteMax: value }))}
                className={cn(
                  'h-9 px-4 rounded-lg text-[12px] font-semibold font-body transition-all duration-200 border',
                  rules.maturiteMax === value
                    ? 'bg-violet text-white border-violet shadow-sm shadow-violet/20'
                    : 'bg-surface-2 dark:bg-white/5 text-ink-2 dark:text-ink-4 border-border/40 hover:border-violet/30 hover:text-violet',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </RuleCard>

        {/* Card 5: Frais d'entree maximum */}
        <RuleCard title="Frais d'entree maximum">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={rules.fraisEntreeMax}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(20, Number(e.target.value)));
                  setRules((prev) => ({ ...prev, fraisEntreeMax: v }));
                }}
                className="w-24 h-9 rounded-md px-3 pr-8 text-[13px] font-body font-semibold border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-body text-ink-3 pointer-events-none">
                %
              </span>
            </div>
            <span className="text-[12px] font-body text-ink-3 dark:text-ink-4">
              maximum autorise
            </span>
          </div>
        </RuleCard>

        {/* Card 6: Emetteurs autorises */}
        <RuleCard title="Emetteurs autorises">
          <div className="grid grid-cols-2 gap-2.5">
            {EMETTEURS.map((name) => (
              <label
                key={name}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rules.emetteurs[name] ?? true}
                  onClick={() => toggleEmetteur(name)}
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0',
                    rules.emetteurs[name]
                      ? 'bg-violet border-violet text-white'
                      : 'bg-white dark:bg-white/5 border-border/60 group-hover:border-violet/40',
                  )}
                >
                  {rules.emetteurs[name] && <Check size={12} strokeWidth={3} />}
                </button>
                <span
                  className={cn(
                    'text-[13px] font-body transition-colors',
                    rules.emetteurs[name]
                      ? 'text-ink dark:text-white font-medium'
                      : 'text-ink-3 dark:text-ink-4',
                  )}
                >
                  {name}
                </span>
              </label>
            ))}
          </div>
        </RuleCard>
      </div>

      {/* Save button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-xl text-[13px] font-semibold font-body bg-gradient-to-r from-violet to-cobalt text-white shadow-md shadow-violet/20 hover:shadow-lg hover:shadow-violet/30 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Save size={14} />
          Enregistrer les regles
        </button>
      </div>

      {/* Eligible products section */}
      <div className="border-t border-border/60 pt-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[18px] font-bold font-display text-ink dark:text-white mb-1">
              Produits eligibles
            </h2>
            <p className="text-[13px] font-body text-ink-3 dark:text-ink-4">
              <span className="font-semibold text-violet">{eligibleCount}</span>{' '}
              produit{eligibleCount > 1 ? 's' : ''} sur{' '}
              <span className="font-semibold text-ink dark:text-white">{PRODUITS.length}</span>{' '}
              respectent vos criteres
            </p>
          </div>
          <Badge variant={eligibleCount === PRODUITS.length ? 'teal' : 'gold'} size="lg">
            {eligibleCount}/{PRODUITS.length}
          </Badge>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Show eligible first, then excluded */}
          {[...results]
            .sort((a, b) => (a.eligible === b.eligible ? 0 : a.eligible ? -1 : 1))
            .map((result) => (
              <ProductMiniCard key={result.produit.id} result={result} />
            ))}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
