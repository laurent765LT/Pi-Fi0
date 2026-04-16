'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  Info,
  Percent,
  Save,
  Settings2,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { useProduct } from '@/hooks/use-products';

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

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'CLOSED', label: 'Cloture' },
  { value: 'MATURED', label: 'Mature' },
];

const STATUS_BADGE_VARIANT: Record<string, 'violet' | 'cobalt' | 'teal' | 'gold'> = {
  DRAFT: 'cobalt',
  ACTIVE: 'teal',
  CLOSED: 'gold',
  MATURED: 'violet',
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

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------

interface EditProductForm {
  name: string;
  isin: string;
  payoffType: string;
  issuer: string;
  underlying: string;
  sri: number;
  coupon: string;
  barrier: string;
  maxGain: string;
  maturity: string;
  entryFees: string;
  status: string;
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
// Loading skeleton
// ---------------------------------------------------------------------------

function EditSkeleton() {
  return (
    <main className="w-full animate-fade-in">
      <div className="inline-flex items-center gap-1.5 mb-4">
        <div className="w-20 h-4 rounded bg-surface-2 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-surface-2 animate-pulse" />
        <div>
          <div className="w-56 h-7 rounded bg-surface-2 animate-pulse" />
          <div className="w-40 h-4 rounded bg-surface-2 animate-pulse mt-1.5" />
        </div>
      </div>
      <div className="h-[2px] rounded-full mb-8 bg-surface-2 animate-pulse" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/90 dark:bg-white/5 border border-border/60 rounded-xl p-6"
          >
            <div className="w-48 h-5 rounded bg-surface-2 animate-pulse mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="w-24 h-3 rounded bg-surface-2 animate-pulse mb-2" />
                  <div className="w-full h-9 rounded-md bg-surface-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Product not found
// ---------------------------------------------------------------------------

function ProductNotFound() {
  return (
    <main className="w-full animate-fade-in">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-ink-3 hover:text-[#3B1FA8] transition-colors mb-4"
      >
        <ChevronLeft size={14} />
        Retour aux produits
      </Link>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#E8334A]/10 flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-[#E8334A]" />
        </div>
        <h1 className="font-display text-xl font-bold text-ink dark:text-white mb-2">
          Produit introuvable
        </h1>
        <p className="font-body text-sm text-ink-3 mb-6 text-center max-w-md">
          Le produit demande n&apos;existe pas ou a ete supprime.
          Verifiez l&apos;identifiant et reessayez.
        </p>
        <Link href="/admin/products">
          <Button variant="primary" size="md">
            <ArrowLeft size={14} />
            Retour au catalogue
          </Button>
        </Link>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toasts, success, dismiss } = useToast();
  const { data: product, isLoading } = useProduct(params.id);

  const [form, setForm] = useState<EditProductForm>({
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
    status: 'DRAFT',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EditProductForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // --- Pre-fill form from product data ---
  useEffect(() => {
    if (product && !initialized) {
      setForm({
        name: product.name ?? '',
        isin: product.isin ?? '',
        payoffType: product.payoffType ?? '',
        issuer: product.issuerName ?? '',
        underlying: product.underlyingName ?? '',
        sri: product.sri ?? 4,
        coupon: product.couponPct != null ? String(product.couponPct) : '',
        barrier: product.barrierCapPct != null ? String(product.barrierCapPct) : '',
        maxGain: product.maxGainPct != null ? String(product.maxGainPct) : '',
        maturity: product.maturityDate ? product.maturityDate.slice(0, 10) : '',
        entryFees: product.entryFeePct != null ? String(product.entryFeePct) : '',
        status: product.status ?? 'DRAFT',
      });
      setInitialized(true);
    }
  }, [product, initialized]);

  // --- Field updater ---
  const updateField = useCallback(
    <K extends keyof EditProductForm>(key: K, value: EditProductForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
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
  const validate = useCallback((): boolean => {
    const errs: Partial<Record<keyof EditProductForm, string>> = {};

    if (!form.name.trim()) errs.name = 'Le nom est requis';
    if (!form.isin.trim()) {
      errs.isin = "L'ISIN est requis";
    } else if (!/^[A-Z]{2}\d{10}$/.test(form.isin.trim().toUpperCase())) {
      errs.isin = 'Format invalide (ex: FR0000000000)';
    }
    if (!form.payoffType) errs.payoffType = 'Le type de payoff est requis';
    if (!form.issuer) errs.issuer = "L'emetteur est requis";
    if (!form.underlying.trim()) errs.underlying = 'Le sous-jacent est requis';
    if (!form.status) errs.status = 'Le statut est requis';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  // --- Submit ---
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSubmitting(false);
    success('Produit mis a jour avec succes !', {
      title: 'Modification enregistree',
    });
    setTimeout(() => {
      router.push('/admin/products');
    }, 1200);
  }, [validate, router, success]);

  // --- Loading state ---
  if (isLoading) {
    return <EditSkeleton />;
  }

  // --- Product not found ---
  if (!product) {
    return <ProductNotFound />;
  }

  // =======================================================================
  // Render
  // =======================================================================

  return (
    <main className="w-full animate-fade-in">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* -- Back link --------------------------------------------------- */}
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-ink-3 hover:text-[#3B1FA8] transition-colors mb-4"
      >
        <ChevronLeft size={14} />
        Retour aux produits
      </Link>

      {/* -- Header ------------------------------------------------------ */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B1FA8] to-[#1A0A3E] flex items-center justify-center shadow-sm shadow-[#3B1FA8]/20">
          <Pencil size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white truncate">
            Modifier {product.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="font-body text-sm text-ink-3">
              Modifier les informations du produit
            </p>
            {product.isin && (
              <span className="font-mono text-xs font-medium bg-surface-2 px-2 py-0.5 rounded border border-border text-ink-3">
                {product.isin}
              </span>
            )}
          </div>
        </div>
      </div>
      <div
        className="h-[2px] rounded-full mb-8"
        style={{
          background:
            'linear-gradient(90deg, #3B1FA8, #00B894 40%, #D4A017 70%, transparent)',
        }}
      />

      {/* -- Form sections ----------------------------------------------- */}
      <div className="space-y-6">
        {/* ============================================================= */}
        {/* Card 1: Informations generales                                */}
        {/* ============================================================= */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-border/60 bg-surface-2/30">
            <h2 className="font-display text-base font-bold text-ink dark:text-white flex items-center gap-2">
              <Info size={16} className="text-[#3B1FA8]" />
              Informations generales
            </h2>
            <p className="font-body text-xs text-ink-3 mt-1">
              Identite et classification du produit structure.
            </p>
          </div>
          <div className="p-6">
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
          </div>
        </div>

        {/* ============================================================= */}
        {/* Card 2: Parametres financiers                                 */}
        {/* ============================================================= */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-border/60 bg-surface-2/30">
            <h2 className="font-display text-base font-bold text-ink dark:text-white flex items-center gap-2">
              <Percent size={16} className="text-[#00B894]" />
              Parametres financiers
            </h2>
            <p className="font-body text-xs text-ink-3 mt-1">
              Coupon, barrieres et maturite du produit.
            </p>
          </div>
          <div className="p-6">
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
          </div>
        </div>

        {/* ============================================================= */}
        {/* Card 3: Statut & Gestion                                      */}
        {/* ============================================================= */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-border/60 bg-surface-2/30">
            <h2 className="font-display text-base font-bold text-ink dark:text-white flex items-center gap-2">
              <Settings2 size={16} className="text-[#D4A017]" />
              Statut & Gestion
            </h2>
            <p className="font-body text-xs text-ink-3 mt-1">
              Cycle de vie du produit.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Statut */}
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Statut du produit</FieldLabel>
                <Select
                  value={form.status}
                  onChange={(val) => updateField('status', val)}
                  options={STATUS_OPTIONS}
                  placeholder="Selectionnez un statut..."
                  error={errors.status}
                />
              </div>

              {/* Current status badge preview */}
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Apercu</FieldLabel>
                <div className="flex items-center h-9">
                  {form.status && (
                    <Badge variant={STATUS_BADGE_VARIANT[form.status] ?? 'cobalt'}>
                      {STATUS_OPTIONS.find((o) => o.value === form.status)?.label ??
                        form.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Footer actions ---------------------------------------------- */}
      <div className="mt-8 flex items-center justify-between gap-4 pb-8">
        <Link href="/admin/products">
          <Button variant="outline" size="md">
            <ArrowLeft size={14} />
            Annuler
          </Button>
        </Link>
        <Button
          variant="teal"
          size="lg"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          <Save size={16} />
          Enregistrer les modifications
        </Button>
      </div>
    </main>
  );
}
