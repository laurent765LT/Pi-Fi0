'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

// ─── Step Indicator ───────────────────────────────────────────────────────────

type StepStatus = 'active' | 'done' | 'pending';

interface StepDotProps {
  step: number;
  status: StepStatus;
  label: string;
}

function StepDot({ step, status, label }: StepDotProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={[
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all duration-300',
          status === 'done'
            ? 'bg-teal text-white'
            : status === 'active'
            ? 'bg-violet text-white shadow-violet'
            : 'bg-white border-2 border-border text-ink-3',
        ].join(' ')}
      >
        {status === 'done' ? (
          <CheckCircle2 size={16} strokeWidth={2.5} />
        ) : (
          step
        )}
      </div>
      <span
        className={[
          'text-[10px] font-body font-semibold uppercase tracking-widest whitespace-nowrap',
          status === 'active'
            ? 'text-violet'
            : status === 'done'
            ? 'text-teal'
            : 'text-ink-3',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps: { label: string; num: 1 | 2 | 3 }[] = [
    { num: 1, label: 'ORIAS' },
    { num: 2, label: 'RCP' },
    { num: 3, label: 'Finalisation' },
  ];

  return (
    <div className="flex items-start justify-center gap-0">
      {steps.map(({ num, label }, i) => {
        const status: StepStatus =
          currentStep > num ? 'done' : currentStep === num ? 'active' : 'pending';
        return (
          <div key={num} className="flex items-center">
            <StepDot step={num} status={status} label={label} />
            {i < steps.length - 1 && (
              <div
                className={[
                  'h-px w-12 mx-2 mt-[-18px] transition-colors duration-300',
                  currentStep > num ? 'bg-teal' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: ORIAS ────────────────────────────────────────────────────────────

interface Step1Props {
  onNext: (oriasNumber: string) => void;
}

function Step1Orias({ onNext }: Step1Props) {
  const [oriasNumber, setOriasNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oriasNumber.length !== 8 || !/^\d{8}$/.test(oriasNumber)) {
      setError("Le numéro ORIAS doit contenir exactement 8 chiffres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.uploadOrias(oriasNumber);
      setSuccess(true);
      setTimeout(() => onNext(oriasNumber), 800);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de vérifier le numéro ORIAS. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">
          Vérification ORIAS
        </h2>
        <p className="font-body text-sm text-ink-3">
          Renseignez votre numéro ORIAS à 8 chiffres pour valider votre
          inscription auprès du registre des intermédiaires.
        </p>
      </div>

      <Input
        label="Numéro ORIAS"
        placeholder="12345678"
        value={oriasNumber}
        onChange={(e) => {
          setOriasNumber(e.target.value.replace(/\D/g, '').slice(0, 8));
          setError(null);
        }}
        hint="8 chiffres, sans espaces"
        error={error ?? undefined}
        disabled={loading || success}
        maxLength={8}
        inputMode="numeric"
        pattern="\d{8}"
      />

      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#D6F7EF] border border-[#A3EDD9]">
          <CheckCircle2 size={16} className="text-teal shrink-0" />
          <span className="font-body text-sm font-medium text-[#007A63]">
            Numéro ORIAS validé avec succès !
          </span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading || success || oriasNumber.length !== 8}
        className="w-full"
      >
        {loading ? 'Vérification en cours…' : success ? 'Validé !' : 'Vérifier'}
      </Button>
    </form>
  );
}

// ─── Step 2: RCP ──────────────────────────────────────────────────────────────

interface Step2Props {
  onNext: () => void;
}

function Step2Rcp({ onNext }: Step2Props) {
  const [insurer, setInsurer] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (!insurer.trim()) {
      setError("Veuillez indiquer le nom de votre assureur.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Veuillez entrer un montant de garantie valide.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.uploadRcp(insurer.trim(), amountNum);
      setSuccess(true);
      setTimeout(() => onNext(), 800);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'enregistrer l'assurance RCP. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">
          Assurance RCP
        </h2>
        <p className="font-body text-sm text-ink-3">
          Renseignez les informations de votre assurance Responsabilité Civile
          Professionnelle pour compléter votre dossier réglementaire.
        </p>
      </div>

      <Input
        label="Nom de l'assureur"
        placeholder="Ex. AXA, Allianz, Generali…"
        value={insurer}
        onChange={(e) => {
          setInsurer(e.target.value);
          setError(null);
        }}
        disabled={loading || success}
        required
      />

      <Input
        label="Montant de couverture (€)"
        placeholder="Ex. 1 500 000"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value.replace(/[^\d\s,. ]/g, ''));
          setError(null);
        }}
        hint="Montant minimum réglementaire : 500 000 €"
        error={error ?? undefined}
        disabled={loading || success}
        inputMode="decimal"
      />

      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#D6F7EF] border border-[#A3EDD9]">
          <CheckCircle2 size={16} className="text-teal shrink-0" />
          <span className="font-body text-sm font-medium text-[#007A63]">
            Assurance RCP enregistrée avec succès !
          </span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading || success || !insurer || !amount}
        className="w-full"
      >
        {loading ? 'Enregistrement…' : success ? 'Enregistré !' : 'Valider'}
      </Button>
    </form>
  );
}

// ─── Step 3: Confirmation ─────────────────────────────────────────────────────

interface Step3Props {
  oriasNumber: string;
  onComplete: () => Promise<void>;
}

function Step3Confirmation({ oriasNumber, onComplete }: Step3Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docSummary = [
    {
      label: 'Numéro ORIAS',
      value: oriasNumber || '••••••••',
      ok: true,
    },
    {
      label: 'Assurance RCP',
      value: 'Documents transmis',
      ok: true,
    },
  ];

  const handleComplete = async () => {
    setError(null);
    setLoading(true);
    try {
      await onComplete();
    } catch {
      setError("Une erreur est survenue lors de la finalisation.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">
          Finalisation
        </h2>
        <p className="font-body text-sm text-ink-3">
          Votre dossier est complet. Vérifiez les informations ci-dessous avant
          d&apos;accéder à la plateforme.
        </p>
      </div>

      {/* Document summary */}
      <div className="bg-surface-2 rounded-lg border border-border overflow-hidden">
        {docSummary.map((doc, i) => (
          <div
            key={doc.label}
            className={[
              'flex items-center justify-between px-4 py-3',
              i > 0 ? 'border-t border-border' : '',
            ].join(' ')}
          >
            <div className="flex items-center gap-2.5">
              {doc.ok ? (
                <CheckCircle2 size={16} className="text-teal shrink-0" />
              ) : (
                <XCircle size={16} className="text-red shrink-0" />
              )}
              <span className="font-body text-sm font-medium text-ink">
                {doc.label}
              </span>
            </div>
            <span className="font-mono text-xs text-ink-3">{doc.value}</span>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-violet-pale border border-[#C9BCFF]">
        <span className="w-1.5 h-1.5 rounded-full bg-violet mt-1.5 shrink-0" />
        <p className="font-body text-xs text-violet leading-relaxed">
          Votre dossier fera l&apos;objet d&apos;une vérification par nos équipes
          de conformité. Vous pouvez accéder à la plateforme dès maintenant avec
          un accès limité, qui sera étendu une fois votre dossier validé.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="font-body text-xs font-medium text-red bg-red/8 border border-red/20 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        disabled={loading}
        onClick={handleComplete}
        className="w-full"
      >
        <span className="flex items-center gap-2">
          {loading ? 'Finalisation…' : 'Accéder à la plateforme'}
          {!loading && <ChevronRight size={16} />}
        </span>
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [oriasNumber, setOriasNumber] = useState('');

  const handleStep1Done = (orias: string) => {
    setOriasNumber(orias);
    setStep(2);
  };

  const handleStep2Done = () => {
    setStep(3);
  };

  const handleComplete = async () => {
    await api.completeOnboarding();
    router.replace('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background:
          'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
      }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-md bg-violet flex items-center justify-center shadow-violet">
              <Zap size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl leading-tight text-ink">
                Strick<span className="text-violet-mid">&lsquo;in</span>
              </h1>
              <p className="font-body text-sm text-ink-3 mt-0.5">
                {user
                  ? `Bienvenue, ${(user as { name?: string }).name ?? user.email}`
                  : 'Configuration de votre compte'}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Step content */}
          {step === 1 && <Step1Orias onNext={handleStep1Done} />}
          {step === 2 && <Step2Rcp onNext={handleStep2Done} />}
          {step === 3 && (
            <Step3Confirmation
              oriasNumber={oriasNumber}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs font-body mt-6">
          Étape {step} sur 3 — Processus d&apos;intégration réglementaire
        </p>
      </div>
    </div>
  );
}
