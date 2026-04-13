'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Upload, Building2, FileText, Shield, User, Briefcase, Eye,
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
}

function Step1Profile({ onNext }: Step1Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
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
          Renseignez vos coordonnées pour créer votre profil.
        </p>
      </div>

      <Input
        label="Prénom *"
        placeholder="Jean"
        value={firstName}
        onChange={(e) => { setFirstName(e.target.value); setError(null); }}
        required
      />
      <Input
        label="Nom *"
        placeholder="Dupont"
        value={lastName}
        onChange={(e) => { setLastName(e.target.value); setError(null); }}
        required
      />
      <Input
        label="Téléphone"
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
}

function Step3Orias({ onNext, onBack }: Step3Props) {
  const [oriasNumber, setOriasNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oriasNumber.length !== 8 || !/^\d{8}$/.test(oriasNumber)) {
      setError('Le numéro ORIAS doit contenir exactement 8 chiffres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.uploadOrias(oriasNumber);
      setSuccess(true);
      setTimeout(() => onNext(oriasNumber), 600);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de vérifier le numéro ORIAS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Vérification ORIAS</h2>
        <p className="font-body text-sm text-ink-3">
          Renseignez votre numéro ORIAS à 8 chiffres pour valider votre inscription.
        </p>
      </div>

      <Input
        label="Numéro ORIAS"
        placeholder="12345678"
        value={oriasNumber}
        onChange={(e) => { setOriasNumber(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(null); }}
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
          <span className="font-body text-sm font-medium text-[#007A63]">ORIAS validé !</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack} disabled={loading}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading || success || oriasNumber.length !== 8}>
          {loading ? 'Vérification…' : success ? 'Validé !' : 'Vérifier'}
        </Button>
      </div>
    </form>
  );
}

// ─── Step 4: RCP Insurance ────────────────────────────────────────────────────

interface Step4Props {
  onNext: () => void;
  onBack: () => void;
}

function Step4Rcp({ onNext, onBack }: Step4Props) {
  const [insurer, setInsurer] = useState('');
  const [amount, setAmount] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (!insurer.trim()) { setError('Veuillez indiquer le nom de votre assureur.'); return; }
    if (isNaN(amountNum) || amountNum <= 0) { setError('Veuillez entrer un montant de garantie valide.'); return; }
    setError(null);
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
          Renseignez votre Responsabilité Civile Professionnelle.
        </p>
      </div>

      <Input
        label="Nom de l'assureur *"
        placeholder="Ex. AXA, Allianz, Generali…"
        value={insurer}
        onChange={(e) => { setInsurer(e.target.value); setError(null); }}
        disabled={loading || success}
        required
      />
      <Input
        label="N\u00b0 de police"
        placeholder="Ex. POL-2024-123456"
        value={policyNumber}
        onChange={(e) => setPolicyNumber(e.target.value)}
        disabled={loading || success}
      />
      <Input
        label="Montant de couverture (€) *"
        placeholder="Ex. 1 500 000"
        value={amount}
        onChange={(e) => { setAmount(e.target.value.replace(/[^\d\s,. ]/g, '')); setError(null); }}
        hint="Montant minimum réglementaire : 500 000 €"
        error={error ?? undefined}
        disabled={loading || success}
        inputMode="decimal"
      />

      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[#D6F7EF] border border-[#A3EDD9]">
          <CheckCircle2 size={16} className="text-teal shrink-0" />
          <span className="font-body text-sm font-medium text-[#007A63]">RCP enregistrée !</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="muted" size="md" onClick={onBack} disabled={loading}>
          <ChevronLeft size={14} /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={loading || success || !insurer || !amount}>
          {loading ? 'Enregistrement…' : success ? 'Enregistré !' : 'Valider'}
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

function Step7Documents({ onNext, onBack }: Step7Props) {
  const [uploads, setUploads] = useState<Record<string, string>>({});

  const handleFileSelect = (key: string) => {
    // In demo mode, simulate file selection
    setUploads((prev) => ({ ...prev, [key]: `${key}_document.pdf` }));
  };

  const requiredDone = DOC_SLOTS.filter((d) => d.required).every((d) => uploads[d.key]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="font-display font-bold text-xl text-ink mb-1">Documents</h2>
        <p className="font-body text-sm text-ink-3">
          Téléchargez les documents nécessaires à votre dossier.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {DOC_SLOTS.map(({ key, label, hint, required }) => {
          const uploaded = !!uploads[key];
          return (
            <div
              key={key}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-150',
                uploaded ? 'border-teal bg-teal/5' : 'border-border bg-white',
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                uploaded ? 'bg-teal/10' : 'bg-surface-2',
              )}>
                {uploaded ? (
                  <CheckCircle2 size={16} className="text-teal" />
                ) : (
                  <Upload size={14} className="text-ink-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-ink flex items-center gap-1">
                  {label}
                  {required && <span className="text-red text-[10px]">*</span>}
                </p>
                <p className="font-body text-[10px] text-ink-3 truncate">
                  {uploaded ? uploads[key] : hint}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleFileSelect(key)}
                className={cn(
                  'text-xs font-body font-semibold px-3 py-1.5 rounded-md transition-all duration-150',
                  uploaded
                    ? 'text-teal bg-teal/10 hover:bg-teal/20'
                    : 'text-violet bg-violet-pale hover:bg-violet-pale/80',
                )}
              >
                {uploaded ? 'Remplacer' : 'Charger'}
              </button>
            </div>
          );
        })}
      </div>

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

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<StepKey>(1);
  const [oriasNumber, setOriasNumber] = useState('');
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', phone: '' });
  const [profStatus, setProfStatus] = useState<ProfStatus | null>(null);

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

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Step content */}
          {step === 1 && (
            <Step1Profile onNext={(data) => { setProfileData(data); setStep(2); }} />
          )}
          {step === 2 && (
            <Step2Status onNext={(s) => { setProfStatus(s); setStep(3); }} onBack={() => setStep(1)} />
          )}
          {step === 3 && (
            <Step3Orias onNext={(orias) => { setOriasNumber(orias); setStep(4); }} onBack={() => setStep(2)} />
          )}
          {step === 4 && (
            <Step4Rcp onNext={() => setStep(5)} onBack={() => setStep(3)} />
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
          Étape {step} sur 8 — Processus d&apos;intégration réglementaire
        </p>
      </div>
    </div>
  );
}
