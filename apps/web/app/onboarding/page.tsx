'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Upload, Building2, FileText, Shield, User, Briefcase, Eye,
  Clock, AlertCircle, File as FileIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/cn';

// ─── Step Config ──────────────────────────────────────────────────────────────

type StepKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const STEP_META: { num: StepKey; label: string; icon: React.ElementType }[] = [
  { num: 1, label: 'Profil', icon: User },
  { num: 2, label: 'Statut', icon: Briefcase },
  { num: 3, label: 'ORIAS', icon: Shield },
  { num: 4, label: 'RCP', icon: FileText },
  { num: 5, label: 'KYC', icon: Eye },
  { num: 6, label: 'Société', icon: Building2 },
  { num: 7, label: 'Documents', icon: Upload },
  { num: 8, label: 'Validation', icon: CheckCircle2 },
];

type StepStatus = 'active' | 'done' | 'pending';

const DRAFT_KEY = 'strickin-onboarding-draft';

// ─── Draft Saved Indicator ───────────────────────────────────────────────────

function DraftIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-[10px] font-body text-teal transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
      )}
    >
      <CheckCircle2 size={10} />
      <span>Brouillon sauvegard&eacute;</span>
    </div>
  );
}

// ─── Estimated Time ──────────────────────────────────────────────────────────

function EstimatedTime() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-xs font-body text-ink-3">
      <Clock size={12} className="text-ink-3" />
      <span>Temps estim&eacute; : ~5 minutes</span>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps = 8 }: { currentStep: StepKey; totalSteps?: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEP_META.slice(0, totalSteps).map(({ num, label, icon: Icon }, i) => {
        const status: StepStatus =
          currentStep > num ? 'done' : currentStep === num ? 'active' : 'pending';
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                  status === 'done'
                    ? 'bg-teal text-white'
                    : status === 'active'
                    ? 'bg-violet text-white shadow-violet'
                    : 'bg-white border-2 border-border text-ink-3',
                )}
              >
                {status === 'done' ? (
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                ) : (
                  <Icon size={12} strokeWidth={2} />
                )}
              </div>
              <span
                className={cn(
                  'text-[8px] font-body font-semibold uppercase tracking-wider whitespace-nowrap',
                  status === 'active' ? 'text-violet' : status === 'done' ? 'text-teal' : 'text-ink-3',
                )}
              >
                {label}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={cn(
                  'h-px w-6 mx-1 mt-[-16px] transition-colors duration-300',
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

// ─── Step 1: Profile Info ─────────────────────────────────────────────────────

interface Step1Props {
  onNext: (data: { firstName: string; lastName: string; phone: string }) => void;
  onChange?: (data: { firstName: string; lastName: string; phone: string }) => void;
  initial?: { firstName: string; lastName: string; phone: string };
}

function Step1Profile({ onNext, onChange, initial }: Step1Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: boolean; lastName?: boolean }>({});

  // Notify parent of changes for draft saving
  useEffect(() => {
    onChange?.({ firstName, lastName, phone });
  }, [firstName, lastName, phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { firstName?: boolean; lastName?: boolean } = {};
    if (!firstName.trim()) errors.firstName = true;
    if (!lastName.trim()) errors.lastName = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    onNext({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Vos informations</h2>
        <p className="font-body text-sm text-ink-3">
          Renseignez vos coordonn&eacute;es pour cr&eacute;er votre profil.
        </p>
      </div>

      <Input
        label="Pr&eacute;nom *"
        placeholder="Jean"
        value={firstName}
        onChange={(e) => { setFirstName(e.target.value); setError(null); setFieldErrors((p) => ({ ...p, firstName: false })); }}
        required
        error={fieldErrors.firstName ? 'Le pr\u00e9nom est requis.' : undefined}
      />
      <Input
        label="Nom *"
        placeholder="Dupont"
        value={lastName}
        onChange={(e) => { setLastName(e.target.value); setError(null); setFieldErrors((p) => ({ ...p, lastName: false })); }}
        required
        error={fieldErrors.lastName ? 'Le nom est requis.' : undefined}
      />
      <Input
        label="T&eacute;l&eacute;phone"
        placeholder="+33 6 12 34 56 78"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        type="tel"
      />

      {error && (
        <p role="alert" className="text-xs text-red font-body bg-red/8 rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full">
        Continuer <ChevronRight size={16} />
      </Button>
    </form>
  );
}

// ─── Step 2: Professional Status ──────────────────────────────────────────────

type ProfStatus = 'CGP' | 'COURTIER' | 'BANQUIER_PRIVE' | 'FAMILY_OFFICE';

const PROF_STATUSES: { value: ProfStatus; label: string; description: string }[] = [
  { value: 'CGP', label: 'CGP', description: 'Conseiller en Gestion de Patrimoine' },
  { value: 'COURTIER', label: 'Courtier', description: 'Courtier en assurances' },
  { value: 'BANQUIER_PRIVE', label: 'Banquier privé', description: 'Banque privée / Wealth Management' },
  { value: 'FAMILY_OFFICE', label: 'Family Office', description: 'Gestion de patrimoine familial' },
];

interface Step2Props {
  onNext: (status: ProfStatus) => void;
  onBack: () => void;
}

function Step2Status({ onNext, onBack }: Step2Props) {
  const [selected, setSelected] = useState<ProfStatus | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Statut professionnel</h2>
        <p className="font-body text-sm text-ink-3">
          Sélectionnez votre activité principale.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {PROF_STATUSES.map(({ value, label, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-150',
              selected === value
                ? 'border-violet bg-violet-pale text-violet'
                : 'border-border bg-white text-ink-2 hover:border-violet/50 hover:bg-violet-pale/30',
            )}
          >
            <Briefcase size={16} className={selected === value ? 'text-violet' : 'text-ink-3'} />
            <div>
              <p className="font-body text-sm font-semibold">{label}</p>
              <p className="font-body text-[11px] text-ink-3">{description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={!selected}
          onClick={() => selected && onNext(selected)}
        >
          Continuer <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: ORIAS ────────────────────────────────────────────────────────────

interface Step3Props {
  onNext: (oriasNumber: string) => void;
  onBack: () => void;
  onChange?: (oriasNumber: string) => void;
  initial?: string;
}

function Step3Orias({ onNext, onBack, onChange, initial }: Step3Props) {
  const [oriasNumber, setOriasNumber] = useState(initial ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  // Real-time format validation
  const formatError =
    touched && oriasNumber.length > 0 && (oriasNumber.length !== 8 || !/^\d{8}$/.test(oriasNumber))
      ? 'Le num\u00e9ro ORIAS doit contenir exactement 8 chiffres.'
      : null;

  useEffect(() => {
    onChange?.(oriasNumber);
  }, [oriasNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (oriasNumber.length !== 8 || !/^\d{8}$/.test(oriasNumber)) {
      setError('Le num\u00e9ro ORIAS doit contenir exactement 8 chiffres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.uploadOrias(oriasNumber);
      setSuccess(true);
      setTimeout(() => onNext(oriasNumber), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de v\u00e9rifier le num\u00e9ro ORIAS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">V&eacute;rification ORIAS</h2>
        <p className="font-body text-sm text-ink-3">
          Renseignez votre num&eacute;ro ORIAS &agrave; 8 chiffres pour valider votre inscription.
        </p>
      </div>

      <Input
        label="Num&eacute;ro ORIAS"
        placeholder="12345678"
        value={oriasNumber}
        onChange={(e) => { setOriasNumber(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(null); setTouched(true); }}
        onBlur={() => setTouched(true)}
        hint={!formatError && !error ? '8 chiffres, sans espaces' : undefined}
        error={error ?? formatError ?? undefined}
        disabled={loading || success}
        maxLength={8}
        inputMode="numeric"
        pattern="\d{8}"
      />

      {/* Digit count indicator */}
      {!success && oriasNumber.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full bg-surface-2 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                oriasNumber.length === 8 ? 'bg-teal' : 'bg-violet',
              )}
              style={{ width: `${(oriasNumber.length / 8) * 100}%` }}
            />
          </div>
          <span className={cn('text-[10px] font-mono', oriasNumber.length === 8 ? 'text-teal' : 'text-ink-3')}>
            {oriasNumber.length}/8
          </span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#D6F7EF] border border-[#A3EDD9]">
          <CheckCircle2 size={16} className="text-teal shrink-0" />
          <span className="font-body text-sm font-medium text-[#007A63]">ORIAS valid&eacute; !</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack} disabled={loading}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading || success || oriasNumber.length !== 8}>
          {loading ? 'V\u00e9rification\u2026' : success ? 'Valid\u00e9 !' : 'V\u00e9rifier'}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 4: RCP Insurance ────────────────────────────────────────────────────

interface Step4Props {
  onNext: () => void;
  onBack: () => void;
  onChange?: (data: { insurer: string; amount: string; policyNumber: string }) => void;
  initial?: { insurer: string; amount: string; policyNumber: string };
}

function Step4Rcp({ onNext, onBack, onChange, initial }: Step4Props) {
  const [insurer, setInsurer] = useState(initial?.insurer ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [policyNumber, setPolicyNumber] = useState(initial?.policyNumber ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ insurer?: boolean; amount?: boolean }>({});

  // Parse numeric amount for warning check
  const amountNum = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
  const amountTooLow = !isNaN(amountNum) && amountNum > 0 && amountNum < 500000;

  useEffect(() => {
    onChange?.({ insurer, amount, policyNumber });
  }, [insurer, amount, policyNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { insurer?: boolean; amount?: boolean } = {};
    if (!insurer.trim()) errors.insurer = true;
    if (isNaN(amountNum) || amountNum <= 0) errors.amount = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(errors.insurer ? 'Veuillez indiquer le nom de votre assureur.' : 'Veuillez entrer un montant de garantie valide.');
      return;
    }
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await api.uploadRcp(insurer.trim(), amountNum);
      setSuccess(true);
      setTimeout(() => onNext(), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'assurance RCP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Assurance RCP</h2>
        <p className="font-body text-sm text-ink-3">
          Renseignez votre Responsabilit&eacute; Civile Professionnelle.
        </p>
      </div>

      <Input
        label="Nom de l&rsquo;assureur *"
        placeholder="Ex. AXA, Allianz, Generali\u2026"
        value={insurer}
        onChange={(e) => { setInsurer(e.target.value); setError(null); setFieldErrors((p) => ({ ...p, insurer: false })); }}
        disabled={loading || success}
        required
        error={fieldErrors.insurer ? 'Le nom de l\u2019assureur est requis.' : undefined}
      />
      <Input
        label="N\u00b0 de police"
        placeholder="Ex. POL-2024-123456"
        value={policyNumber}
        onChange={(e) => setPolicyNumber(e.target.value)}
        disabled={loading || success}
      />
      <Input
        label="Montant de couverture (\u20ac) *"
        placeholder="Ex. 1 500 000"
        value={amount}
        onChange={(e) => { setAmount(e.target.value.replace(/[^\d\s,. ]/g, '')); setError(null); setFieldErrors((p) => ({ ...p, amount: false })); }}
        hint={!fieldErrors.amount && !error ? 'Montant minimum r\u00e9glementaire : 500 000 \u20ac' : undefined}
        error={fieldErrors.amount ? 'Le montant de garantie est requis.' : error ?? undefined}
        disabled={loading || success}
        inputMode="decimal"
      />

      {/* Warning if amount is below 500k */}
      {amountTooLow && !success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-amber-50 border border-amber-200">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span className="font-body text-xs font-medium text-amber-700">
            Attention : le montant minimum r&eacute;glementaire est de 500 000 &euro;. Votre couverture semble insuffisante.
          </span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#D6F7EF] border border-[#A3EDD9]">
          <CheckCircle2 size={16} className="text-teal shrink-0" />
          <span className="font-body text-sm font-medium text-[#007A63]">RCP enregistr&eacute;e !</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack} disabled={loading}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading || success || !insurer || !amount}>
          {loading ? 'Enregistrement\u2026' : success ? 'Enregistr\u00e9 !' : 'Valider'}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 5: KYC ──────────────────────────────────────────────────────────────

interface Step5Props {
  onNext: () => void;
  onBack: () => void;
}

function Step5Kyc({ onNext, onBack }: Step5Props) {
  const [birthDate, setBirthDate] = useState('');
  const [nationality, setNationality] = useState('FR');
  const [taxResidence, setTaxResidence] = useState('FR');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Identité (KYC)</h2>
        <p className="font-body text-sm text-ink-3">
          Informations requises pour la conformité réglementaire.
        </p>
      </div>

      <Input
        label="Date de naissance"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-body font-semibold text-ink-2">Nationalité</label>
        <select
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-3 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet"
        >
          <option value="FR">France</option>
          <option value="BE">Belgique</option>
          <option value="CH">Suisse</option>
          <option value="LU">Luxembourg</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-body font-semibold text-ink-2">Résidence fiscale</label>
        <select
          value={taxResidence}
          onChange={(e) => setTaxResidence(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-3 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet"
        >
          <option value="FR">France</option>
          <option value="BE">Belgique</option>
          <option value="CH">Suisse</option>
          <option value="LU">Luxembourg</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={!birthDate}>
          Continuer <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 6: Company Info ─────────────────────────────────────────────────────

interface Step6Props {
  onNext: () => void;
  onBack: () => void;
}

function Step6Company({ onNext, onBack }: Step6Props) {
  const [companyName, setCompanyName] = useState('');
  const [siren, setSiren] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Société</h2>
        <p className="font-body text-sm text-ink-3">
          Informations sur votre structure professionnelle.
        </p>
      </div>

      <Input
        label="Raison sociale *"
        placeholder="Ex. Cabinet Dupont Patrimoine"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      />
      <Input
        label="SIREN"
        placeholder="123 456 789"
        value={siren}
        onChange={(e) => setSiren(e.target.value.replace(/\D/g, '').slice(0, 9))}
        maxLength={9}
        inputMode="numeric"
        hint="9 chiffres"
      />
      <Input
        label="Adresse du siège"
        placeholder="12 rue de la Paix, 75002 Paris"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={!companyName.trim()}>
          Continuer <ChevronRight size={16} />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 7: Document Upload ──────────────────────────────────────────────────

interface Step7Props {
  onNext: () => void;
  onBack: () => void;
}

interface DocSlot {
  key: string;
  label: string;
  hint: string;
  required: boolean;
}

const DOC_SLOTS: DocSlot[] = [
  { key: 'id', label: "Pièce d'identité", hint: 'CNI ou passeport en cours de validité', required: true },
  { key: 'kbis', label: 'Kbis ou équivalent', hint: 'Moins de 3 mois', required: true },
  { key: 'rcp_cert', label: 'Attestation RCP', hint: 'Certificat de votre assureur', required: true },
  { key: 'rib', label: 'RIB professionnel', hint: 'IBAN au nom de la société', required: false },
];

interface UploadedFile {
  name: string;
  size: string;
  progress: number; // 0-100
  done: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function Step7Documents({ onNext, onBack }: Step7Props) {
  const [uploads, setUploads] = useState<Record<string, UploadedFile>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (key: string, file?: File) => {
    if (file) {
      // Real file selected
      const entry: UploadedFile = {
        name: file.name,
        size: formatFileSize(file.size),
        progress: 0,
        done: false,
      };
      setUploads((prev) => ({ ...prev, [key]: entry }));
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploads((prev) => ({
            ...prev,
            [key]: { ...prev[key], progress: 100, done: true },
          }));
        } else {
          setUploads((prev) => ({
            ...prev,
            [key]: { ...prev[key], progress: Math.min(progress, 95) },
          }));
        }
      }, 300);
    } else {
      // Trigger hidden file input
      fileInputRefs.current[key]?.click();
    }
  };

  const requiredDone = DOC_SLOTS.filter((d) => d.required).every((d) => uploads[d.key]?.done);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Documents</h2>
        <p className="font-body text-sm text-ink-3">
          T&eacute;l&eacute;chargez les documents n&eacute;cessaires &agrave; votre dossier.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {DOC_SLOTS.map(({ key, label, hint, required }) => {
          const upload = uploads[key];
          const uploaded = upload?.done;
          const uploading = upload && !upload.done;
          return (
            <div
              key={key}
              className={cn(
                'rounded-lg border px-4 py-3 transition-all duration-150',
                uploaded ? 'border-teal bg-teal/5' : 'border-border bg-white',
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                  uploaded ? 'bg-teal/10' : 'bg-surface-2',
                )}>
                  {uploaded ? (
                    <CheckCircle2 size={16} className="text-teal" />
                  ) : uploading ? (
                    <div className="w-4 h-4 border-2 border-violet border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={14} className="text-ink-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-ink flex items-center gap-1">
                    {label}
                    {required && <span className="text-red text-[10px]">*</span>}
                  </p>
                  {upload ? (
                    <p className="font-body text-[10px] text-ink-3 truncate flex items-center gap-1">
                      <FileIcon size={9} className="shrink-0" />
                      {upload.name} ({upload.size})
                    </p>
                  ) : (
                    <p className="font-body text-[10px] text-ink-3 truncate">{hint}</p>
                  )}
                </div>

                {/* Hidden real file input */}
                <input
                  ref={(el) => { fileInputRefs.current[key] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(key, file);
                    e.target.value = ''; // Reset so same file can be re-selected
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleFileSelect(key)}
                  disabled={!!uploading}
                  className={cn(
                    'text-xs font-body font-semibold px-3 py-1.5 rounded-md transition-all duration-150',
                    uploaded
                      ? 'text-teal bg-teal/10 hover:bg-teal/20'
                      : uploading
                      ? 'text-ink-3 bg-surface-2 cursor-not-allowed'
                      : 'text-violet bg-violet-pale hover:bg-violet-pale/80',
                  )}
                >
                  {uploaded ? 'Remplacer' : uploading ? 'Envoi\u2026' : 'Charger'}
                </button>
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet transition-all duration-300 ease-out"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="font-body text-[10px] text-ink-3 text-center">
        Formats accept&eacute;s : PDF, JPG, PNG
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button variant="primary" size="lg" className="flex-1" disabled={!requiredDone} onClick={onNext}>
          Continuer <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 8: Confirmation ─────────────────────────────────────────────────────

interface Step8Props {
  oriasNumber: string;
  profileData: { firstName: string; lastName: string };
  profStatus: ProfStatus | null;
  onComplete: () => Promise<void>;
  onBack: () => void;
}

function Step8Confirmation({ oriasNumber, profileData, profStatus, onComplete, onBack }: Step8Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const docSummary = [
    { label: 'Identité', value: `${profileData.firstName} ${profileData.lastName}`, ok: true },
    { label: 'Statut', value: PROF_STATUSES.find((s) => s.value === profStatus)?.label ?? '—', ok: !!profStatus },
    { label: 'Numéro ORIAS', value: oriasNumber || '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', ok: !!oriasNumber },
    { label: 'Assurance RCP', value: 'Documents transmis', ok: true },
    { label: 'KYC', value: 'Complet', ok: true },
    { label: 'Documents', value: 'Téléchargés', ok: true },
  ];

  const handleComplete = async () => {
    if (!accepted) return;
    setError(null);
    setLoading(true);
    try {
      await onComplete();
    } catch {
      setError('Une erreur est survenue lors de la finalisation.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Finalisation</h2>
        <p className="font-body text-sm text-ink-3">
          Vérifiez les informations avant d&apos;accéder à la plateforme.
        </p>
      </div>

      {/* Document summary */}
      <div className="bg-surface-2 rounded-lg border border-border overflow-hidden">
        {docSummary.map((doc, i) => (
          <div
            key={doc.label}
            className={cn(
              'flex items-center justify-between px-4 py-2.5',
              i > 0 ? 'border-t border-border' : '',
            )}
          >
            <div className="flex items-center gap-2">
              {doc.ok ? (
                <CheckCircle2 size={14} className="text-teal shrink-0" />
              ) : (
                <XCircle size={14} className="text-red shrink-0" />
              )}
              <span className="font-body text-sm font-medium text-ink">{doc.label}</span>
            </div>
            <span className="font-mono text-xs text-ink-3">{doc.value}</span>
          </div>
        ))}
      </div>

      {/* Terms acceptance */}
      <label className="flex items-start gap-3 rounded-md border border-border bg-white px-3 py-3 cursor-pointer hover:border-violet/40 transition-all">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-violet"
        />
        <p className="font-body text-[11px] text-ink-3 leading-relaxed">
          J&apos;accepte les <span className="text-violet font-semibold">Conditions Générales d&apos;Utilisation</span> et
          la <span className="text-violet font-semibold">Politique de Confidentialité</span> de Strick&apos;in.
          Je certifie l&apos;exactitude des informations fournies.
        </p>
      </label>

      {/* Info note */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-violet-pale border border-[#C9BCFF]">
        <span className="w-1.5 h-1.5 rounded-full bg-violet mt-1.5 shrink-0" />
        <p className="font-body text-xs text-violet leading-relaxed">
          Votre dossier fera l&apos;objet d&apos;une vérification par nos équipes
          de conformité. Accès immédiat avec fonctionnalités limitées,
          étendu après validation.
        </p>
      </div>

      {error && (
        <p role="alert" className="font-body text-xs font-medium text-red bg-red/8 border border-red/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack} disabled={loading}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button variant="primary" size="lg" disabled={loading || !accepted} onClick={handleComplete} className="flex-1">
          <span className="flex items-center gap-2">
            {loading ? 'Finalisation…' : 'Accéder à la plateforme'}
            {!loading && <ChevronRight size={16} />}
          </span>
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Draft Types ─────────────────────────────────────────────────────────────

interface OnboardingDraft {
  step: StepKey;
  profileData: { firstName: string; lastName: string; phone: string };
  profStatus: ProfStatus | null;
  oriasNumber: string;
  rcpData: { insurer: string; amount: string; policyNumber: string };
}

function loadDraft(): OnboardingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Load draft from localStorage on mount
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draft = useRef<OnboardingDraft | null>(null);

  const [step, setStep] = useState<StepKey>(1);
  const [oriasNumber, setOriasNumber] = useState('');
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' });
  const [profStatus, setProfStatus] = useState<ProfStatus | null>(null);
  const [rcpData, setRcpData] = useState({ insurer: '', amount: '', policyNumber: '' });

  // Draft-saved indicator
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      draft.current = saved;
      setStep(saved.step);
      setProfileData(saved.profileData);
      setProfStatus(saved.profStatus);
      setOriasNumber(saved.oriasNumber);
      setRcpData(saved.rcpData);
    }
    setDraftLoaded(true);
  }, []);

  // Save draft whenever form state changes
  const saveDraft = useCallback(() => {
    const draftState: OnboardingDraft = {
      step,
      profileData,
      profStatus,
      oriasNumber,
      rcpData,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftState));
    } catch {
      // localStorage might be full or unavailable, silently ignore
    }
    // Flash the saved indicator
    setShowDraftSaved(true);
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => setShowDraftSaved(false), 2000);
  }, [step, profileData, profStatus, oriasNumber, rcpData]);

  useEffect(() => {
    if (!draftLoaded) return;
    saveDraft();
  }, [step, profileData, profStatus, oriasNumber, rcpData, draftLoaded, saveDraft]);

  const handleComplete = async () => {
    await api.completeOnboarding();
    // Clear draft on successful completion
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    router.replace('/dashboard');
  };

  // Wait for draft load to avoid flash of wrong step
  if (!draftLoaded) return null;

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

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg px-7 py-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className="w-9 h-9 rounded-md bg-violet flex items-center justify-center shadow-violet">
              <Zap size={18} className="text-white" strokeWidth={2.5} />
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

          {/* Estimated time + draft indicator */}
          <div className="flex items-center justify-between">
            <EstimatedTime />
            <DraftIndicator visible={showDraftSaved} />
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Step content */}
          {step === 1 && (
            <Step1Profile
              initial={profileData}
              onChange={(data) => setProfileData(data)}
              onNext={(data) => { setProfileData(data); setStep(2); }}
            />
          )}
          {step === 2 && (
            <Step2Status onNext={(s) => { setProfStatus(s); setStep(3); }} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <Step3Orias
              initial={oriasNumber}
              onChange={(orias) => setOriasNumber(orias)}
              onNext={(orias) => { setOriasNumber(orias); setStep(4); }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4Rcp
              initial={rcpData}
              onChange={(data) => setRcpData(data)}
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <Step5Kyc onNext={() => setStep(6)} onBack={() => setStep(4)} />
          )}
          {step === 6 && (
            <Step6Company onNext={() => setStep(7)} onBack={() => setStep(5)} />
          )}
          {step === 7 && (
            <Step7Documents onNext={() => setStep(8)} onBack={() => setStep(6)} />
          )}
          {step === 8 && (
            <Step8Confirmation
              oriasNumber={oriasNumber}
              profileData={profileData}
              profStatus={profStatus}
              onComplete={handleComplete}
              onBack={() => setStep(7)}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs font-body mt-6">
          &Eacute;tape {step} sur 8 &mdash; Processus d&apos;int&eacute;gration r&eacute;glementaire
        </p>
      </div>
    </div>
  );
}
