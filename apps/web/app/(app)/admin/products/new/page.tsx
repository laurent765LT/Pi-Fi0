'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  FilePlus2,
  Info,
  Package,
  Percent,
  Shield,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYOFF_OPTIONS = [
  { value: 'AUTOCALL_PHOENIX', label: 'Autocall Phoenix' },
  { value: 'AUTOCALL_COUPON', label: 'Autocall Coupon' },
  { value: 'CAPITAL_PROTECTED', label: 'Capital Protege' },
  { value: 'CONDITIONAL_RATE', label: 'Taux Conditionnel' },
  { value: 'BARRIER_NOTE', label: 'Barrier Note' },
];

const ISSUER_OPTIONS = [
  { value: 'BNP Paribas', label: 'BNP Paribas' },
  { value: 'Natixis', label: 'Natixis' },
  { value: 'Goldman Sachs', label: 'Goldman Sachs' },
  { value: 'SG Issuer', label: 'SG Issuer' },
  { value: 'Marex', label: 'Marex' },
];

const ASSUREUR_OPTIONS = [
  { value: 'Generali', label: 'Generali' },
  { value: 'Cardiff', label: 'Cardiff' },
  { value: 'Spirica', label: 'Spirica' },
  { value: 'Apicil', label: 'Apicil' },
  { value: 'Suravenir', label: 'Suravenir' },
  { value: 'SwissLife', label: 'SwissLife' },
];

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protege',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const PAYOFF_BADGE_VARIANT: Record<string, 'violet' | 'cobalt' | 'teal' | 'gold'> = {
  AUTOCALL_PHOENIX: 'violet',
  AUTOCALL_COUPON: 'cobalt',
  CAPITAL_PROTECTED: 'teal',
  CONDITIONAL_RATE: 'cobalt',
  BARRIER_NOTE: 'gold',
};

const SRI_COLORS: Record<number, string> = {
  1: '#00B894',
  2: '#00B894',
  3: '#6FCF97',
  4: '#F2C94C',
  5: '#F2994A',
  6: '#EB5757',
  7: '#E8334A',
};

const STEPS = [
  { id: 1, label: 'Informations', icon: Info },
  { id: 2, label: 'Financier', icon: Percent },
  { id: 3, label: 'Enveloppe', icon: Wallet },
  { id: 4, label: 'Confirmation', icon: Check },
];

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------

interface ProductForm {
  // Step 1
  name: string;
  isin: string;
  payoffType: string;
  issuer: string;
  underlying: string;
  sri: number;
  // Step 2
  coupon: string;
  barrier: string;
  maxGain: string;
  maturity: string;
  entryFees: string;
  // Step 3
  targetAmount: string;
  closingDate: string;
  assureurs: string[];
}

const INITIAL_FORM: ProductForm = {
  name: '',
  isin: '',
  payoffType: '',
  issuer: '',
  underlying: '',
  sri: 4,
  coupon: '',
  barrier: '',
  maxGain: '',
  maturity: '',
  entryFees: '',
  targetAmount: '',
  closingDate: '',
  assureurs: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEUR(value: string): string {
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(num);
}

function validateISIN(isin: string): boolean {
  return /^[A-Z]{2}\d{10}$/.test(isin);
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <nav aria-label="Etapes du formulaire" className="w-full">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isClickable = step.id < currentStep;

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-initial">
              {/* Step node */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2.5 group relative',
                  isClickable && 'cursor-pointer',
                  !isClickable && !isActive && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-300',
                    isCompleted && 'bg-gradient-to-br from-[#00B894] to-[#00A080] border-[#00B894] shadow-sm shadow-[#00B894]/20',
                    isActive && 'bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] border-[#3B1FA8] shadow-sm shadow-[#3B1FA8]/20',
                    !isCompleted && !isActive && 'bg-white dark:bg-white/5 border-border/60',
                    isClickable && 'group-hover:border-[#3B1FA8]/50 group-hover:shadow-sm',
                  )}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-white" strokeWidth={2.5} />
                  ) : (
                    <Icon
                      size={16}
                      className={cn(
                        isActive ? 'text-white' : 'text-ink-3',
                      )}
                      strokeWidth={2}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'font-body text-xs font-semibold uppercase tracking-wide whitespace-nowrap hidden sm:block transition-colors duration-200',
                    isActive && 'text-[#3B1FA8] dark:text-[#C9BCFF]',
                    isCompleted && 'text-[#00B894]',
                    !isCompleted && !isActive && 'text-ink-3',
                    isClickable && 'group-hover:text-[#3B1FA8]',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-3 hidden sm:block">
                  <div
                    className={cn(
                      'h-[2px] rounded-full transition-all duration-500',
                      isCompleted
                        ? 'bg-gradient-to-r from-[#00B894] to-[#00B894]/40'
                        : 'bg-border/60',
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Field label component
// ---------------------------------------------------------------------------

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-body text-xs font-bold uppercase tracking-wide text-ink-2 flex items-center gap-1"
    >
      {children}
      {required && <span className="text-[#E8334A]">*</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Summary Row
// ---------------------------------------------------------------------------

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-ink-3">
        {label}
      </span>
      <span
        className={cn(
          'font-body text-sm font-medium text-right',
          accent ? 'font-mono font-bold text-[#008B6E]' : 'text-ink',
        )}
      >
        {value || <span className="text-ink-3 italic">Non renseigne</span>}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminNewProductPage() {
  const router = useRouter();
  const { toasts, success, dismiss } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // --- Field updater ---
  const updateField = useCallback(
    <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Clear field error on change
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  // --- Validation ---
  const validateStep = useCallback(
    (s: number): boolean => {
      const errs: Partial<Record<keyof ProductForm, string>> = {};

      if (s === 1) {
        if (!form.name.trim()) errs.name = 'Le nom est requis';
        if (!form.isin.trim()) {
          errs.isin = "L'ISIN est requis";
        } else if (!validateISIN(form.isin.trim().toUpperCase())) {
          errs.isin = 'Format invalide (ex: FR0000000000)';
        }
        if (!form.payoffType) errs.payoffType = 'Le type de payoff est requis';
        if (!form.issuer) errs.issuer = "L'emetteur est requis";
        if (!form.underlying.trim()) errs.underlying = 'Le sous-jacent est requis';
      }

      if (s === 2) {
        if (!form.coupon.trim()) errs.coupon = 'Le coupon est requis';
        if (!form.barrier.trim()) errs.barrier = 'La barriere est requise';
        if (!form.maturity.trim()) errs.maturity = 'La maturite est requise';
      }

      if (s === 3) {
        if (!form.targetAmount.trim()) errs.targetAmount = 'Le montant cible est requis';
        if (!form.closingDate.trim()) errs.closingDate = 'La date de cloture est requise';
        if (form.assureurs.length === 0) errs.assureurs = 'Selectionnez au moins un assureur';
      }

      setErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [form],
  );

  // --- Navigation ---
  const goNext = useCallback(() => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, validateStep]);

  const goPrev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToStep = useCallback((s: number) => {
    setStep(s);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- Submit ---
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    success('Produit cree avec succes !', {
      title: 'Nouveau produit',
    });
    setTimeout(() => {
      router.push('/admin/products');
    }, 1200);
  }, [router, success]);

  // --- Assureur toggle ---
  const toggleAssureur = useCallback(
    (val: string) => {
      setForm((prev) => {
        const has = prev.assureurs.includes(val);
        return {
          ...prev,
          assureurs: has
            ? prev.assureurs.filter((a) => a !== val)
            : [...prev.assureurs, val],
        };
      });
      setErrors((prev) => {
        if (!prev.assureurs) return prev;
        const next = { ...prev };
        delete next.assureurs;
        return next;
      });
    },
    [],
  );

  // =======================================================================
  // Render
  // =======================================================================

  return (
    <main className="w-full animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* ── Back link ──────────────────────────────────────────────────────── */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-ink-3 hover:text-[#3B1FA8] transition-colors mb-4"
      >
        <ChevronLeft size={14} />
        Retour aux produits
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
          <FilePlus2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            Nouveau produit
          </h1>
          <p className="font-body text-sm text-ink-3 mt-0.5">
            Creer un nouveau produit structure pour la distribution
          </p>
        </div>
      </div>
      <div
        className="h-[2px] rounded-full mb-8"
        style={{
          background:
            'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* ── Step indicator ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <StepIndicator currentStep={step} onStepClick={goToStep} />
      </div>

      {/* ── Form card ──────────────────────────────────────────────────────── */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
        {/* Card header with step title */}
        <div className="px-6 py-4 border-b border-border/60 bg-surface-2/30">
          <h2 className="font-display text-base font-bold text-ink dark:text-white flex items-center gap-2">
            {step === 1 && (
              <>
                <Info size={16} className="text-[#3B1FA8]" />
                Informations generales
              </>
            )}
            {step === 2 && (
              <>
                <Percent size={16} className="text-[#3B1FA8]" />
                Parametres financiers
              </>
            )}
            {step === 3 && (
              <>
                <Wallet size={16} className="text-[#3B1FA8]" />
                Enveloppe (Shelf)
              </>
            )}
            {step === 4 && (
              <>
                <Check size={16} className="text-[#00B894]" />
                Confirmation
              </>
            )}
          </h2>
          <p className="font-body text-xs text-ink-3 mt-1">
            {step === 1 && 'Renseignez les informations de base du produit structure.'}
            {step === 2 && 'Definissez les parametres financiers du produit.'}
            {step === 3 && "Configurez l'enveloppe de distribution."}
            {step === 4 && 'Verifiez les informations avant la creation.'}
          </p>
        </div>

        <div className="p-6">
          {/* ── Step 1: Informations generales ──────────────────────────── */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nom du produit */}
              <div className="md:col-span-2">
                <Input
                  label="Nom du produit"
                  placeholder="Ex: Phoenix Memoire Euro Stoxx 50"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  error={errors.name}
                />
              </div>

              {/* ISIN */}
              <div>
                <Input
                  label="ISIN"
                  placeholder="XX0000000000"
                  value={form.isin}
                  onChange={(e) =>
                    updateField('isin', e.target.value.toUpperCase().slice(0, 12))
                  }
                  error={errors.isin}
                  className="font-mono"
                />
              </div>

              {/* Type de payoff */}
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Type de payoff</FieldLabel>
                <Select
                  value={form.payoffType}
                  onChange={(val) => updateField('payoffType', val)}
                  options={PAYOFF_OPTIONS}
                  placeholder="Selectionnez un type..."
                  error={errors.payoffType}
                />
              </div>

              {/* Emetteur */}
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Emetteur</FieldLabel>
                <Select
                  value={form.issuer}
                  onChange={(val) => updateField('issuer', val)}
                  options={ISSUER_OPTIONS}
                  placeholder="Selectionnez un emetteur..."
                  searchable
                  error={errors.issuer}
                />
              </div>

              {/* Sous-jacent */}
              <div>
                <Input
                  label="Sous-jacent"
                  placeholder="Ex: Euro Stoxx 50"
                  value={form.underlying}
                  onChange={(e) => updateField('underlying', e.target.value)}
                  error={errors.underlying}
                />
              </div>

              {/* SRI */}
              <div className="md:col-span-2">
                <FieldLabel>SRI (indicateur de risque)</FieldLabel>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateField('sri', n)}
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-200',
                          form.sri === n
                            ? 'text-white shadow-md scale-110'
                            : 'bg-white dark:bg-white/5 border border-border/60 text-ink-3 hover:border-[#3B1FA8]/30 hover:scale-105',
                        )}
                        style={
                          form.sri === n
                            ? { backgroundColor: SRI_COLORS[n] }
                            : undefined
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <span className="font-body text-xs text-ink-3 ml-1">
                    1 = risque faible, 7 = risque eleve
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Parametres financiers ───────────────────────────── */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Coupon */}
              <div>
                <Input
                  label="Coupon (%)"
                  placeholder="Ex: 8.5"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.coupon}
                  onChange={(e) => updateField('coupon', e.target.value)}
                  error={errors.coupon}
                  className="font-mono"
                />
              </div>

              {/* Barriere de protection */}
              <div>
                <Input
                  label="Barriere de protection (%)"
                  placeholder="Ex: 60"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={form.barrier}
                  onChange={(e) => updateField('barrier', e.target.value)}
                  error={errors.barrier}
                  className="font-mono"
                />
              </div>

              {/* Gain maximum */}
              <div>
                <Input
                  label="Gain maximum (%)"
                  placeholder="Ex: 40"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.maxGain}
                  onChange={(e) => updateField('maxGain', e.target.value)}
                  error={errors.maxGain}
                  className="font-mono"
                />
              </div>

              {/* Maturite */}
              <div>
                <Input
                  label="Maturite"
                  type="date"
                  value={form.maturity}
                  onChange={(e) => updateField('maturity', e.target.value)}
                  error={errors.maturity}
                />
              </div>

              {/* Frais d'entree */}
              <div className="md:col-span-2">
                <Input
                  label="Frais d'entree (%)"
                  placeholder="Ex: 2.0"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.entryFees}
                  onChange={(e) => updateField('entryFees', e.target.value)}
                  error={errors.entryFees}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Enveloppe (Shelf) ───────────────────────────────── */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Montant cible */}
              <div>
                <Input
                  label="Montant cible (EUR)"
                  placeholder="Ex: 5000000"
                  type="number"
                  step="1000"
                  min="0"
                  value={form.targetAmount}
                  onChange={(e) => updateField('targetAmount', e.target.value)}
                  error={errors.targetAmount}
                  className="font-mono"
                />
                {form.targetAmount && (
                  <p className="font-body text-xs text-[#008B6E] font-medium mt-1.5">
                    {formatEUR(form.targetAmount)}
                  </p>
                )}
              </div>

              {/* Date de cloture */}
              <div>
                <Input
                  label="Date de cloture"
                  type="date"
                  value={form.closingDate}
                  onChange={(e) => updateField('closingDate', e.target.value)}
                  error={errors.closingDate}
                />
              </div>

              {/* Assureurs compatibles */}
              <div className="md:col-span-2">
                <FieldLabel required>Assureurs compatibles</FieldLabel>
                {errors.assureurs && (
                  <p className="font-body text-xs text-[#E8334A] font-medium mt-1">
                    {errors.assureurs}
                  </p>
                )}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ASSUREUR_OPTIONS.map((opt) => {
                    const checked = form.assureurs.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleAssureur(opt.value)}
                        className={cn(
                          'relative flex items-center gap-2.5 p-3 rounded-lg border transition-all duration-200',
                          checked
                            ? 'bg-[#3B1FA8]/5 border-[#3B1FA8]/30 dark:bg-[#3B1FA8]/10'
                            : 'bg-white dark:bg-white/5 border-border/60 hover:border-[#3B1FA8]/20',
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onChange={() => toggleAssureur(opt.value)}
                        />
                        <span
                          className={cn(
                            'font-body text-sm font-medium',
                            checked ? 'text-[#3B1FA8]' : 'text-ink',
                          )}
                        >
                          {opt.label}
                        </span>
                        {checked && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00B894] shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirmation ────────────────────────────────────── */}
          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations generales */}
              <div className="bg-white dark:bg-white/5 border border-border/60 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#3B1FA8]/10 flex items-center justify-center">
                    <Info size={14} className="text-[#3B1FA8]" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink dark:text-white uppercase tracking-wide">
                    Informations generales
                  </h3>
                </div>
                <SummaryRow label="Nom" value={form.name} />
                <SummaryRow
                  label="ISIN"
                  value={
                    form.isin ? (
                      <span className="font-mono text-xs font-medium bg-surface-2 px-2 py-0.5 rounded border border-border">
                        {form.isin}
                      </span>
                    ) : null
                  }
                />
                <SummaryRow
                  label="Type de payoff"
                  value={
                    form.payoffType ? (
                      <Badge variant={PAYOFF_BADGE_VARIANT[form.payoffType] ?? 'violet'}>
                        {PAYOFF_LABELS[form.payoffType]}
                      </Badge>
                    ) : null
                  }
                />
                <SummaryRow label="Emetteur" value={form.issuer} />
                <SummaryRow label="Sous-jacent" value={form.underlying} />
                <SummaryRow
                  label="SRI"
                  value={
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold"
                      style={{ backgroundColor: SRI_COLORS[form.sri] ?? '#7B6FA0' }}
                    >
                      {form.sri}
                    </span>
                  }
                />
              </div>

              {/* Parametres financiers */}
              <div className="bg-white dark:bg-white/5 border border-border/60 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#00B894]/10 flex items-center justify-center">
                    <Percent size={14} className="text-[#00B894]" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink dark:text-white uppercase tracking-wide">
                    Parametres financiers
                  </h3>
                </div>
                <SummaryRow
                  label="Coupon"
                  value={form.coupon ? `${form.coupon}%` : null}
                  accent
                />
                <SummaryRow
                  label="Barriere"
                  value={form.barrier ? `${form.barrier}%` : null}
                  accent
                />
                <SummaryRow
                  label="Gain max"
                  value={form.maxGain ? `${form.maxGain}%` : null}
                  accent
                />
                <SummaryRow
                  label="Maturite"
                  value={
                    form.maturity
                      ? new Date(form.maturity).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : null
                  }
                />
                <SummaryRow
                  label="Frais d'entree"
                  value={form.entryFees ? `${form.entryFees}%` : null}
                />
              </div>

              {/* Enveloppe */}
              <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-border/60 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#D4A017]/10 flex items-center justify-center">
                    <Wallet size={14} className="text-[#D4A017]" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink dark:text-white uppercase tracking-wide">
                    Enveloppe
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <SummaryRow
                      label="Montant cible"
                      value={form.targetAmount ? formatEUR(form.targetAmount) : null}
                      accent
                    />
                    <SummaryRow
                      label="Date de cloture"
                      value={
                        form.closingDate
                          ? new Date(form.closingDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : null
                      }
                    />
                  </div>
                  <div>
                    <div className="py-2.5">
                      <span className="font-body text-xs font-semibold uppercase tracking-wide text-ink-3 block mb-2">
                        Assureurs compatibles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.assureurs.length > 0 ? (
                          form.assureurs.map((a) => (
                            <span
                              key={a}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#3B1FA8]/5 border border-[#3B1FA8]/15 font-body text-xs font-semibold text-[#3B1FA8]"
                            >
                              <Shield size={10} />
                              {a}
                            </span>
                          ))
                        ) : (
                          <span className="text-ink-3 italic text-sm">
                            Aucun assureur selectionne
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-border/60 bg-surface-2/30 flex items-center justify-between gap-4">
          <div>
            {step > 1 && (
              <Button variant="outline" size="md" onClick={goPrev}>
                <ArrowLeft size={14} />
                Retour
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-ink-3 mr-2 hidden sm:block">
              Etape {step} sur {STEPS.length}
            </span>
            {step < 4 ? (
              <Button variant="primary" size="md" onClick={goNext}>
                Suivant
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                variant="teal"
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
              >
                <Package size={16} />
                Creer le produit
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
