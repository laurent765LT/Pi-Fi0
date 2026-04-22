'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Brain,
  Target,
  Package,
  FileCheck2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { ToastContainer, useToast } from '@/components/ui/toast';
import {
  useClientsStore,
  type ClientObjective,
  type FamilySituation,
  type InvestmentHorizon,
  type LossTolerance,
  type MarketKnowledge,
  type ProductExperience,
} from '@/stores/clients-store';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import {
  DEFAULT_CGP_INFO,
  downloadAllDocuments,
  type GeneratorProduct,
} from '@/lib/regulatory/document-generator';

import {
  Step1ClientInfo,
  validateStep1,
  type Step1Errors,
  type Step1Values,
} from './steps/Step1ClientInfo';
import {
  Step2InvestorProfile,
  validateStep2,
  type Step2Errors,
  type Step2Values,
} from './steps/Step2InvestorProfile';
import {
  Step3Objectives,
  validateStep3,
  type Step3Errors,
  type Step3Values,
} from './steps/Step3Objectives';
import {
  Step4Products,
  validateStep4,
  type Step4Errors,
  type Step4Values,
} from './steps/Step4Products';
import { Step5Recap } from './steps/Step5Recap';

// ─── Types ──────────────────────────────────────────────────────────────────

type StepIndex = 0 | 1 | 2 | 3 | 4;

interface StepMeta {
  label: string;
  icon: LucideIcon;
}

const STEPS: StepMeta[] = [
  { label: 'Informations', icon: User },
  { label: 'Profil', icon: Brain },
  { label: 'Objectifs', icon: Target },
  { label: 'Produits', icon: Package },
  { label: 'R\u00e9capitulatif', icon: FileCheck2 },
];

// ─── Initial state ──────────────────────────────────────────────────────────

const INITIAL_STEP1: Step1Values = {
  firstName: '',
  lastName: '',
  birthDate: '',
  familySituation: 'celibataire' as FamilySituation,
  profession: '',
  revenuesAnnuel: 0,
};

const INITIAL_STEP2: Step2Values = {
  marketKnowledge: 'basique' as MarketKnowledge,
  productExperience: 'aucune' as ProductExperience,
  lossTolerance: 10 as LossTolerance,
  investmentHorizon: '3a5ans' as InvestmentHorizon,
};

const INITIAL_STEP3: Step3Values = {
  objectives: [] as ClientObjective[],
};

const INITIAL_STEP4: Step4Values = {
  proposedProducts: [] as string[],
};

// ─── Component ──────────────────────────────────────────────────────────────

export function ClientWizard() {
  const router = useRouter();
  const createDossier = useClientsStore((s) => s.create);
  const { toasts, success, error: toastError, dismiss } = useToast();

  const [step, setStep] = useState<StepIndex>(0);
  const [step1, setStep1] = useState<Step1Values>(INITIAL_STEP1);
  const [step2, setStep2] = useState<Step2Values>(INITIAL_STEP2);
  const [step3, setStep3] = useState<Step3Values>(INITIAL_STEP3);
  const [step4, setStep4] = useState<Step4Values>(INITIAL_STEP4);

  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});
  const [step3Errors, setStep3Errors] = useState<Step3Errors>({});
  const [step4Errors, setStep4Errors] = useState<Step4Errors>({});

  const [generating, setGenerating] = useState(false);

  // ── Per-step validity (drives Next button enabled state) ──
  const step1Valid = useMemo(
    () => Object.keys(validateStep1(step1)).length === 0,
    [step1],
  );
  const step2Valid = useMemo(
    () => Object.keys(validateStep2(step2)).length === 0,
    [step2],
  );
  const step3Valid = useMemo(
    () => Object.keys(validateStep3(step3)).length === 0,
    [step3],
  );
  const step4Valid = useMemo(
    () => Object.keys(validateStep4(step4)).length === 0,
    [step4],
  );

  const currentStepValid =
    (step === 0 && step1Valid) ||
    (step === 1 && step2Valid) ||
    (step === 2 && step3Valid) ||
    (step === 3 && step4Valid) ||
    step === 4;

  // ── Handlers ────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 0) {
      const e = validateStep1(step1);
      setStep1Errors(e);
      if (Object.keys(e).length > 0) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      const e = validateStep2(step2);
      setStep2Errors(e);
      if (Object.keys(e).length > 0) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      const e = validateStep3(step3);
      setStep3Errors(e);
      if (Object.keys(e).length > 0) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      const e = validateStep4(step4);
      setStep4Errors(e);
      if (Object.keys(e).length > 0) return;
      setStep(4);
      return;
    }
  };

  const handlePrevious = () => {
    if (step > 0) setStep((s) => (s - 1) as StepIndex);
  };

  const handleGenerate = () => {
    setGenerating(true);
    try {
      // 1. Persist the dossier
      const dossier = createDossier({
        firstName: step1.firstName.trim(),
        lastName: step1.lastName.trim(),
        birthDate: step1.birthDate,
        familySituation: step1.familySituation,
        profession: step1.profession.trim(),
        revenuesAnnuel: step1.revenuesAnnuel,
        marketKnowledge: step2.marketKnowledge,
        productExperience: step2.productExperience,
        lossTolerance: step2.lossTolerance,
        investmentHorizon: step2.investmentHorizon,
        objectives: step3.objectives,
        proposedProducts: step4.proposedProducts,
      });

      // 2. Resolve product metadata for the generator
      const products: GeneratorProduct[] = DEMO_PRODUCTS.filter((p) =>
        dossier.proposedProducts.includes(p.id),
      ).map((p) => ({
        id: p.id,
        isin: p.isin,
        name: p.name,
        payoffType: p.payoffType,
        sri: p.sri,
        maturityDate: p.maturityDate,
        underlyingName: p.underlyingName,
      }));

      // 3. Open documents
      const result = downloadAllDocuments(dossier, DEFAULT_CGP_INFO, products);
      if (result.blocked) {
        toastError(
          "Les fen\u00eatres ont \u00e9t\u00e9 bloqu\u00e9es. Autorisez les pop-ups pour le site Strick'in.",
        );
        return;
      }
      success('Dossier cr\u00e9\u00e9 et documents g\u00e9n\u00e9r\u00e9s.');

      // 4. Navigate to the detail page after a tiny delay so the user
      //    sees the toast and the windows have a chance to open.
      setTimeout(() => {
        router.push(`/dossiers-clients/${dossier.id}`);
      }, 600);
    } catch (err) {
      toastError('Erreur lors de la g\u00e9n\u00e9ration du dossier.');
    } finally {
      // Reset the button after the async windows are spawned
      setTimeout(() => setGenerating(false), 800);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Active step */}
      <div className="rounded-2xl border border-border bg-white dark:bg-white/[0.03] p-5 md:p-7 shadow-xs">
        {step === 0 && (
          <Step1ClientInfo
            values={step1}
            errors={step1Errors}
            onChange={(k, v) => {
              setStep1((prev) => ({ ...prev, [k]: v }));
              if (step1Errors[k]) {
                setStep1Errors((prev) => {
                  const next = { ...prev };
                  delete next[k];
                  return next;
                });
              }
            }}
          />
        )}
        {step === 1 && (
          <Step2InvestorProfile
            values={step2}
            errors={step2Errors}
            onChange={(k, v) => {
              setStep2((prev) => ({ ...prev, [k]: v }));
              if (step2Errors[k]) {
                setStep2Errors((prev) => {
                  const next = { ...prev };
                  delete next[k];
                  return next;
                });
              }
            }}
          />
        )}
        {step === 2 && (
          <Step3Objectives
            values={step3}
            errors={step3Errors}
            onChange={(k, v) => {
              setStep3((prev) => ({ ...prev, [k]: v }));
              if (step3Errors[k]) {
                setStep3Errors((prev) => {
                  const next = { ...prev };
                  delete next[k];
                  return next;
                });
              }
            }}
          />
        )}
        {step === 3 && (
          <Step4Products
            values={step4}
            errors={step4Errors}
            onChange={(k, v) => {
              setStep4((prev) => ({ ...prev, [k]: v }));
              if (step4Errors[k]) {
                setStep4Errors((prev) => {
                  const next = { ...prev };
                  delete next[k];
                  return next;
                });
              }
            }}
          />
        )}
        {step === 4 && (
          <Step5Recap
            step1={step1}
            step2={step2}
            step3={step3}
            step4={step4}
            onGenerate={handleGenerate}
            generating={generating}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 0}
        >
          <ArrowLeft size={14} />
          Pr\u00e9c\u00e9dent
        </Button>

        <div className="flex items-center gap-1.5">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                idx === step
                  ? 'w-6 bg-[#3B1FA8]'
                  : idx < step
                    ? 'w-1.5 bg-[#00B894]'
                    : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>

        {step < 4 ? (
          <Button onClick={handleNext} disabled={!currentStepValid}>
            Suivant
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => router.push('/dossiers-clients')}>
            Annuler
          </Button>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ─── Step indicator (polished, responsive) ──────────────────────────────────

function StepIndicator({ current }: { current: StepIndex }) {
  return (
    <ol className="flex items-stretch gap-0 relative">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isActive = idx === current;
        const isDone = idx < current;
        const isLast = idx === STEPS.length - 1;

        return (
          <li
            key={s.label}
            className={cn(
              'flex-1 flex items-center relative',
              isLast ? 'justify-end md:justify-start' : '',
            )}
          >
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 shrink-0',
                  isActive &&
                    'bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] text-white shadow-md shadow-[#3B1FA8]/30 scale-105',
                  isDone && 'bg-[#00B894] text-white',
                  !isActive && !isDone && 'bg-surface-2 text-ink-3 border border-border',
                )}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`\u00c9tape ${idx + 1} : ${s.label}`}
              >
                {isDone ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <Icon size={14} strokeWidth={2} />
                )}
              </div>
              <span
                className={cn(
                  'hidden sm:block font-body text-[11px] font-semibold text-center leading-tight truncate max-w-full px-1',
                  isActive
                    ? 'text-[#3B1FA8] dark:text-[#C9BCFF]'
                    : isDone
                      ? 'text-[#00B894]'
                      : 'text-ink-3',
                )}
              >
                {s.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-1 transition-all duration-200 -mt-5 sm:-mt-7',
                  isDone ? 'bg-[#00B894]' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
