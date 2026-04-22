'use client';

// ─── /(onboarding)/kyb — Wizard KYB 4 étapes ─────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Building2,
  FileText,
  Users,
  ShieldAlert,
  Shield,
  Info,
  AlertTriangle,
  XCircle,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import {
  SireneAutocomplete,
  type SireneData,
} from '@/components/kyb/SireneAutocomplete';
import { RBEViewer } from '@/components/kyb/RBEViewer';
import {
  useKYBStore,
  type KYBBeneficiaire,
  type ScreeningResult,
  SCREENING_RESULT_LABELS,
} from '@/stores/kyb-store';

// ─── Step meta ──────────────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4;

const STEPS: { num: StepKey; label: string; icon: LucideIcon }[] = [
  { num: 1, label: 'SIREN', icon: Building2 },
  { num: 2, label: 'Kbis', icon: FileText },
  { num: 3, label: 'Bénéficiaires', icon: Users },
  { num: 4, label: 'BODACC', icon: ShieldAlert },
];

const SCREENING_VARIANT: Record<ScreeningResult, BadgeVariant> = {
  clear: 'teal',
  warning: 'gold',
  sanction: 'red',
};

const SCREENING_ICON: Record<ScreeningResult, LucideIcon> = {
  clear: CheckCircle2,
  warning: AlertTriangle,
  sanction: XCircle,
};

interface RBEData {
  beneficiairesEffectifs: KYBBeneficiaire[];
  screeningResult: ScreeningResult;
  bodaccAnnouncements: Array<{ date: string; type: string; summary: string }>;
}

// ─── Indicator ──────────────────────────────────────────────────────────────

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
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
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
                  'h-px w-8 sm:mt-[-16px] mx-1',
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

export default function KYBWizardPage() {
  const router = useRouter();
  const addRecord = useKYBStore((s) => s.add);

  const [step, setStep] = useState<StepKey>(1);
  const [sirene, setSirene] = useState<SireneData | null>(null);
  const [rbe, setRbe] = useState<RBEData | null>(null);
  const [rbeLoading, setRbeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch RBE data when entering step 3
  useEffect(() => {
    if (step !== 3 || !sirene) return;
    if (rbe) return;
    let cancelled = false;
    const run = async () => {
      setRbeLoading(true);
      try {
        const res = await fetch(`/api/kyb/rbe?siren=${sirene.siren}`);
        if (!res.ok) throw new Error('RBE indisponible');
        const data = (await res.json()) as RBEData & { siren: string };
        if (!cancelled) setRbe(data);
      } catch {
        // keep null
      } finally {
        if (!cancelled) setRbeLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, sirene, rbe]);

  const handleComplete = async () => {
    if (!sirene || !rbe) return;
    setSubmitting(true);
    try {
      addRecord({
        siren: sirene.siren,
        denomination: sirene.denomination,
        formeJuridique: sirene.formeJuridique,
        capital: sirene.capital,
        adresse: sirene.adresse,
        dirigeants: sirene.dirigeants,
        beneficiairesEffectifs: rbe.beneficiairesEffectifs,
        kbisDate: sirene.kbisDate,
        screeningResult: rbe.screeningResult,
      });
      await new Promise((r) => setTimeout(r, 500));
      router.replace('/dashboard?kyb=success');
    } finally {
      setSubmitting(false);
    }
  };

  const ScreenIcon = rbe ? SCREENING_ICON[rbe.screeningResult] : Info;

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
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-lg bg-violet text-white flex items-center justify-center shadow-violet">
              <Shield size={18} />
            </div>
            <h1 className="font-display font-extrabold text-xl text-ink">
              Vérification entreprise
            </h1>
            <p className="font-body text-sm text-ink-3">
              Parcours KYB automatisé — SIRENE, Kbis, RBE, BODACC
            </p>
          </div>

          <StepIndicator currentStep={step} />

          {/* Step 1 */}
          {step === 1 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Identification SIREN"
                subtitle="Renseignez le SIREN — les informations sont pré-remplies depuis la base SIRENE."
              />
              <SireneAutocomplete onLoaded={setSirene} />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  disabled={!sirene}
                  onClick={() => setStep(2)}
                >
                  Continuer <ChevronRight size={14} />
                </Button>
              </div>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && sirene && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Extrait Kbis"
                subtitle="Récupération automatique via Infogreffe (mock démo)."
              />
              <div className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="bg-gradient-to-r from-violet-pale to-transparent px-4 py-3 border-b border-border flex items-center gap-2">
                  <FileText size={16} className="text-violet" />
                  <h3 className="font-display font-bold text-[14px] text-ink">
                    Kbis — {sirene.denomination}
                  </h3>
                  <span className="ml-auto text-[10px] font-mono text-ink-3">
                    SIREN {sirene.siren}
                  </span>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                  <Row label="Dénomination" value={sirene.denomination} />
                  <Row label="Forme juridique" value={sirene.formeJuridique} />
                  <Row
                    label="Capital social"
                    value={new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(sirene.capital)}
                  />
                  <Row
                    label="Date du Kbis"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={11} className="text-ink-3" />
                        {new Date(sirene.kbisDate).toLocaleDateString('fr-FR')}
                      </span>
                    }
                  />
                  <Row
                    label="Adresse du siège"
                    value={sirene.adresse}
                    className="sm:col-span-2"
                  />
                  <Row
                    label="Dirigeant(s)"
                    value={sirene.dirigeants
                      .map((d) => `${d.prenom} ${d.nom} — ${d.fonction}`)
                      .join(', ')}
                    className="sm:col-span-2"
                  />
                </dl>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button variant="muted" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} /> Retour
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Continuer <ChevronRight size={14} />
                </Button>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && sirene && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Bénéficiaires effectifs"
                subtitle="Source : Registre des Bénéficiaires Effectifs (INPI)."
              />
              <RBEViewer
                siren={sirene.siren}
                beneficiaires={rbe?.beneficiairesEffectifs ?? []}
                loading={rbeLoading}
              />
              <div className="flex items-center justify-between gap-2">
                <Button variant="muted" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} /> Retour
                </Button>
                <Button
                  variant="primary"
                  disabled={!rbe}
                  onClick={() => setStep(4)}
                >
                  Continuer <ChevronRight size={14} />
                </Button>
              </div>
            </section>
          )}

          {/* Step 4 */}
          {step === 4 && rbe && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title="BODACC & sanctions"
                subtitle="Croisement des annonces BODACC et des listes de sanctions internationales."
              />
              <div
                className={cn(
                  'rounded-xl border p-4 flex flex-col gap-3',
                  rbe.screeningResult === 'clear' && 'border-teal/40 bg-teal/5',
                  rbe.screeningResult === 'warning' &&
                    'border-[#F0D98A] bg-[#FDF3D6]/60',
                  rbe.screeningResult === 'sanction' &&
                    'border-red/30 bg-red/5',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScreenIcon
                      size={18}
                      className={cn(
                        rbe.screeningResult === 'clear' && 'text-teal',
                        rbe.screeningResult === 'warning' && 'text-[#9B7210]',
                        rbe.screeningResult === 'sanction' && 'text-red',
                      )}
                    />
                    <span className="font-display font-bold text-[14px] text-ink">
                      {SCREENING_RESULT_LABELS[rbe.screeningResult]}
                    </span>
                  </div>
                  <Badge variant={SCREENING_VARIANT[rbe.screeningResult]} size="md">
                    {rbe.bodaccAnnouncements.length} annonce
                    {rbe.bodaccAnnouncements.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                {rbe.bodaccAnnouncements.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {rbe.bodaccAnnouncements.map((a, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-border bg-white px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-body text-[12px] font-semibold text-ink">
                            {a.type}
                          </span>
                          <span className="font-mono text-[10px] text-ink-3">
                            {new Date(a.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-ink-2 mt-0.5">
                          {a.summary}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-[12px] text-ink-2">
                    Aucune annonce BODACC signalée. Les bénéficiaires effectifs
                    n&apos;apparaissent sur aucune liste internationale de
                    sanctions.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button variant="muted" onClick={() => setStep(3)}>
                  <ChevronLeft size={14} /> Retour
                </Button>
                <Button
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                  onClick={handleComplete}
                >
                  {!submitting && <CheckCircle2 size={14} />}
                  Soumettre le dossier KYB
                </Button>
              </div>
            </section>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-white/60 text-xs font-body">
          <Zap size={12} /> Strick&apos;in — KYB conforme AMLD 5
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-widest text-ink-3 font-bold">
        {label}
      </dt>
      <dd className="font-body text-[12.5px] font-semibold text-ink mt-0.5">
        {value}
      </dd>
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
