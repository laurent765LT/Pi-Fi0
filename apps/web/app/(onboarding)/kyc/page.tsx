'use client';

// ─── /(onboarding)/kyc — Wizard KYC 4 étapes ─────────────────────────────────

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  Home as HomeIcon,
  ShieldAlert,
  ClipboardList,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { IdentityScanner, type IdentityExtraction } from '@/components/kyc/IdentityScanner';
import { AddressProof, type AddressProofValue } from '@/components/kyc/AddressProof';
import { PEPScreening } from '@/components/kyc/PEPScreening';
import { useKYCStore, type PEPStatus } from '@/stores/kyc-store';

// ─── Step meta ──────────────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4;

const STEPS: { num: StepKey; label: string; icon: LucideIcon }[] = [
  { num: 1, label: 'Identité', icon: CreditCard },
  { num: 2, label: 'Domicile', icon: HomeIcon },
  { num: 3, label: 'Screening', icon: ShieldAlert },
  { num: 4, label: 'LCB-FT', icon: ClipboardList },
];

// ─── LCB-FT Questionnaire ───────────────────────────────────────────────────

interface AMLAnswer {
  key: string;
  label: string;
  value: string;
}

const AML_QUESTIONS: { key: string; label: string; options: string[] }[] = [
  {
    key: 'origin',
    label: 'Origine des fonds investis',
    options: [
      'Épargne personnelle',
      'Revenus professionnels',
      'Cession d\u2019actifs',
      'Donation / Succession',
      'Autre',
    ],
  },
  {
    key: 'destination',
    label: 'Destination finale des capitaux',
    options: [
      'Placement long terme',
      'Préparation retraite',
      'Transmission patrimoniale',
      'Optimisation fiscale',
    ],
  },
  {
    key: 'volume',
    label: 'Volume annuel d\u2019opérations prévu',
    options: [
      'Moins de 50 000 €',
      '50 000 € - 250 000 €',
      '250 000 € - 1 M€',
      'Plus d\u20191 M€',
    ],
  },
  {
    key: 'cash',
    label: 'Utilisation d\u2019espèces ou crypto-actifs',
    options: ['Jamais', 'Rarement', 'Occasionnellement', 'Fréquemment'],
  },
  {
    key: 'risk',
    label: 'Profil de risque LCB-FT auto-déclaré',
    options: ['Faible', 'Modéré', 'Élevé'],
  },
];

// ─── Step indicator ────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: StepKey }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map(({ num, label, icon: Icon }, i) => {
        const status =
          currentStep > num ? 'done' : currentStep === num ? 'active' : 'pending';
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                  status === 'done'
                    ? 'bg-teal text-white'
                    : status === 'active'
                      ? 'bg-violet text-white shadow-violet'
                      : 'bg-white border-2 border-border text-ink-3',
                )}
              >
                {status === 'done' ? (
                  <CheckCircle2 size={15} strokeWidth={2.5} />
                ) : (
                  <Icon size={13} />
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-body font-bold uppercase tracking-wider hidden sm:block',
                  status === 'active'
                    ? 'text-violet'
                    : status === 'done'
                      ? 'text-teal'
                      : 'text-ink-3',
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 sm:mt-[-16px] mx-1 transition-colors duration-300',
                  currentStep > num ? 'bg-teal' : 'bg-border',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function KYCWizardPage() {
  const router = useRouter();
  const addRecord = useKYCStore((s) => s.add);

  const [step, setStep] = useState<StepKey>(1);
  const [identity, setIdentity] = useState<IdentityExtraction | null>(null);
  const [address, setAddress] = useState<AddressProofValue | null>(null);
  const [pep, setPep] = useState<{ status: PEPStatus; amlScore: number } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const amlScore = useMemo(() => {
    if (!pep) return 0;
    let s = 10;
    if (pep.status === 'pep') s += 55;
    if (pep.status === 'sanctioned') s += 90;
    if (answers.cash === 'Fréquemment') s += 20;
    if (answers.cash === 'Occasionnellement') s += 10;
    if (answers.volume === 'Plus d\u20191 M€') s += 15;
    if (answers.risk === 'Élevé') s += 10;
    return Math.min(100, s);
  }, [pep, answers]);

  const allAnswered = AML_QUESTIONS.every((q) => !!answers[q.key]);

  const handleComplete = async () => {
    if (!identity || !address || !pep) return;
    setSubmitting(true);
    try {
      addRecord({
        firstName: identity.firstName,
        lastName: identity.lastName,
        birthDate: identity.birthDate,
        idDocumentType: identity.documentType,
        idDocumentNumber: identity.documentNumber,
        addressProofType: address.type,
        pepStatus: pep.status,
        amlScore,
        idDocumentFileName: identity.fileName,
        addressProofFileName: address.fileName,
        amlQuestionnaire: answers,
      });
      await new Promise((r) => setTimeout(r, 600));
      router.replace('/dashboard?kyc=success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
      }}
    >
      <div className="relative w-full max-w-2xl">
        <div className="bg-white dark:bg-ink rounded-xl shadow-lg px-5 sm:px-8 py-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-violet text-white flex items-center justify-center shadow-violet">
              <Shield size={18} />
            </div>
            <h1 className="font-display font-extrabold text-xl text-ink">
              Vérification d&apos;identité
            </h1>
            <p className="font-body text-sm text-ink-3">
              Parcours KYC automatisé — OCR, screening PEP, LCB-FT
            </p>
          </div>

          <StepIndicator currentStep={step} />

          {/* Step 1 */}
          {step === 1 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Pièce d&apos;identité"
                subtitle="Nous lisons automatiquement votre document grâce à l&apos;OCR."
              />
              <IdentityScanner onExtracted={setIdentity} />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  disabled={!identity}
                  onClick={() => setStep(2)}
                >
                  Continuer <ChevronRight size={14} />
                </Button>
              </div>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Justificatif de domicile"
                subtitle="Facture, quittance ou avis d&apos;imposition de moins de 3 mois."
              />
              <AddressProof onChange={setAddress} />
              <div className="flex items-center justify-between gap-2">
                <Button variant="muted" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} /> Retour
                </Button>
                <Button
                  variant="primary"
                  disabled={!address}
                  onClick={() => setStep(3)}
                >
                  Continuer <ChevronRight size={14} />
                </Button>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Screening PEP & sanctions"
                subtitle="Consultation des listes OFAC, UE, ONU et PPE."
              />
              <PEPScreening
                initial={
                  identity
                    ? {
                        firstName: identity.firstName,
                        lastName: identity.lastName,
                        birthDate: identity.birthDate,
                      }
                    : undefined
                }
                onComplete={(res) =>
                  setPep({
                    status: res.status,
                    amlScore:
                      res.status === 'sanctioned'
                        ? 95
                        : res.status === 'pep'
                          ? 65
                          : 15,
                  })
                }
              />
              <div className="flex items-center justify-between gap-2">
                <Button variant="muted" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} /> Retour
                </Button>
                <Button
                  variant="primary"
                  disabled={!pep}
                  onClick={() => setStep(4)}
                >
                  Continuer <ChevronRight size={14} />
                </Button>
              </div>
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Questionnaire LCB-FT"
                subtitle="5 questions courtes pour documenter votre profil."
              />

              <div className="flex flex-col gap-3">
                {AML_QUESTIONS.map((q) => (
                  <div
                    key={q.key}
                    className="rounded-lg border border-border bg-surface p-3"
                  >
                    <p className="font-body text-[13px] font-semibold text-ink mb-2">
                      {q.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((p) => ({ ...p, [q.key]: opt }))
                          }
                          className={cn(
                            'text-xs font-body font-semibold px-3 py-1.5 rounded-md border transition-colors',
                            answers[q.key] === opt
                              ? 'border-violet bg-violet-pale text-violet'
                              : 'border-border bg-white text-ink-3 hover:border-violet/40',
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-violet/30 bg-violet-pale/40 p-3 text-[12px] font-body text-ink">
                <p>
                  Score AML calculé : <strong>{amlScore}/100</strong>
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button variant="muted" onClick={() => setStep(3)}>
                  <ChevronLeft size={14} /> Retour
                </Button>
                <Button
                  variant="primary"
                  disabled={!allAnswered || submitting}
                  loading={submitting}
                  onClick={handleComplete}
                >
                  {!submitting && <CheckCircle2 size={14} />}
                  Soumettre le dossier KYC
                </Button>
              </div>
            </section>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-white/60 text-xs font-body">
          <Zap size={12} /> Strick&apos;in — parcours conforme AMLD 5
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="font-display font-bold text-lg text-ink leading-tight">
        {title}
      </h2>
      <p className="font-body text-[12.5px] text-ink-3 mt-0.5">{subtitle}</p>
    </div>
  );
}

// Mark answers unused warning suppression helper (unused interface references)
export type { AMLAnswer };
