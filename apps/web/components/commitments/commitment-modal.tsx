'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useCreateCommitment } from '@/hooks/use-commitments';
import { cn } from '@/lib/cn';
import { FileText, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractType = 'ASSURANCE_VIE' | 'CTO' | 'PEA';

interface CommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelfId: string;
  productName: string;
  productIsin?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AMOUNTS = [
  { label: '10k', value: 10_000 },
  { label: '25k', value: 25_000 },
  { label: '50k', value: 50_000 },
  { label: '100k', value: 100_000 },
  { label: '250k', value: 250_000 },
  { label: '500k', value: 500_000 },
  { label: '1M', value: 1_000_000 },
  { label: '5M', value: 5_000_000 },
  { label: '10M', value: 10_000_000 },
];

const CONTRACT_TYPES: { value: ContractType; label: string; description: string }[] = [
  { value: 'ASSURANCE_VIE', label: 'Assurance-Vie', description: 'Contrat multisupport' },
  { value: 'CTO', label: 'CTO', description: 'Compte-Titres Ordinaire' },
  { value: 'PEA', label: 'PEA', description: 'Plan d\u2019\u00c9pargne en Actions' },
];

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCustomAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00a0]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommitmentModal({
  isOpen,
  onClose,
  shelfId,
  productName,
  productIsin,
}: CommitmentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [contractType, setContractType] = useState<ContractType>('ASSURANCE_VIE');
  const [kidAcknowledged, setKidAcknowledged] = useState(false);
  const [success, setSuccess] = useState(false);
  const { mutate: createCommitment, isPending, error } = useCreateCommitment();

  const effectiveAmount = useCustom ? parseCustomAmount(customAmount) : selectedAmount;
  const canConfirm = effectiveAmount && effectiveAmount >= 1000 && kidAcknowledged;

  function handleConfirm() {
    if (!effectiveAmount || !kidAcknowledged) return;
    createCommitment(
      { shelfId, amount: effectiveAmount },
      {
        onSuccess: () => {
          setSuccess(true);
        },
      },
    );
  }

  function handleClose() {
    setSelectedAmount(null);
    setCustomAmount('');
    setUseCustom(false);
    setContractType('ASSURANCE_VIE');
    setKidAcknowledged(false);
    setSuccess(false);
    onClose();
  }

  function selectPreset(value: number) {
    setSelectedAmount(value);
    setUseCustom(false);
    setCustomAmount('');
  }

  function enableCustom() {
    setUseCustom(true);
    setSelectedAmount(null);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Marque d'int\u00e9r\u00eat"
      maxWidth="max-w-lg"
    >
      {success ? (
        /* ── Success state ──────────────────────────────────────────── */
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle2 size={28} className="text-teal" />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-ink text-base mb-1">
              Marque d&apos;int\u00e9r\u00eat enregistr\u00e9e
            </p>
            <p className="text-sm text-ink-3 font-body">
              Votre marque d&apos;int\u00e9r\u00eat de{' '}
              <span className="font-semibold text-ink">
                {formatAmount(effectiveAmount!)}
              </span>{' '}
              en{' '}
              <span className="font-semibold text-ink">
                {CONTRACT_TYPES.find((c) => c.value === contractType)?.label}
              </span>{' '}
              sur{' '}
              <span className="font-semibold text-ink">{productName}</span> a
              bien \u00e9t\u00e9 transmise.
            </p>
          </div>
          <Button variant="outline" size="md" onClick={handleClose} className="mt-2">
            Fermer
          </Button>
        </div>
      ) : (
        /* ── Selection state ────────────────────────────────────────── */
        <div className="flex flex-col gap-4">
          {/* Product name */}
          <div className="rounded-md bg-surface-2 px-3 py-2">
            <p className="text-xs text-ink-3 font-body uppercase tracking-widest mb-0.5">
              Produit
            </p>
            <p className="text-sm font-semibold text-ink font-body line-clamp-2">
              {productName}
            </p>
            {productIsin && (
              <p className="text-[10px] font-mono text-ink-3 mt-0.5">{productIsin}</p>
            )}
          </div>

          {/* Contract type selection */}
          <div>
            <p className="text-xs text-ink-3 font-body uppercase tracking-widest mb-2">
              Type de contrat
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CONTRACT_TYPES.map(({ value, label, description }) => {
                const isSelected = contractType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContractType(value)}
                    className={cn(
                      'flex flex-col items-center rounded-md border px-2 py-2.5',
                      'text-center transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1',
                      isSelected
                        ? 'border-violet bg-violet-pale text-violet'
                        : 'border-border bg-white text-ink-2 hover:border-violet/50 hover:bg-violet-pale/50',
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="text-sm font-semibold font-body">{label}</span>
                    <span className="text-[10px] font-body text-ink-3 mt-0.5">{description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount selection */}
          <div>
            <p className="text-xs text-ink-3 font-body uppercase tracking-widest mb-2">
              Montant indicatif
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {AMOUNTS.map(({ label, value }) => {
                const isSelected = !useCustom && selectedAmount === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectPreset(value)}
                    className={cn(
                      'flex items-center justify-center rounded-md border px-3 py-2',
                      'text-sm font-semibold font-body transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1',
                      isSelected
                        ? 'border-violet bg-violet text-white shadow-violet'
                        : 'border-border bg-white text-ink-2 hover:border-violet/50 hover:text-violet hover:bg-violet-pale',
                    )}
                    aria-pressed={isSelected}
                    aria-label={`S\u00e9lectionner ${formatAmount(value)}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Custom amount */}
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={enableCustom}
                className={cn(
                  'text-xs font-body font-semibold transition-colors',
                  useCustom ? 'text-violet' : 'text-ink-3 hover:text-violet',
                )}
              >
                Montant libre :
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex. 75 000"
                  value={customAmount}
                  onFocus={enableCustom}
                  onChange={(e) => {
                    setCustomAmount(e.target.value.replace(/[^\d\s,. ]/g, ''));
                    setUseCustom(true);
                    setSelectedAmount(null);
                  }}
                  className={cn(
                    'w-full h-8 rounded-md border px-3 pr-8 text-sm font-body text-ink',
                    'placeholder:text-ink-3/60 transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet',
                    useCustom ? 'border-violet bg-violet-pale/30' : 'border-border bg-white',
                  )}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-3 font-body">\u20ac</span>
              </div>
            </div>

            {effectiveAmount !== null && effectiveAmount > 0 && (
              <p className="mt-2 text-center text-xs text-ink-3 font-body">
                Montant s\u00e9lectionn\u00e9 :{' '}
                <span className="font-semibold text-violet">
                  {formatAmount(effectiveAmount)}
                </span>
              </p>
            )}

            {useCustom && customAmount && parseCustomAmount(customAmount) !== null && parseCustomAmount(customAmount)! < 1000 && (
              <p className="mt-1 text-center text-[11px] text-red font-body flex items-center justify-center gap-1">
                <AlertTriangle size={11} />
                Montant minimum : 1 000 \u20ac
              </p>
            )}
          </div>

          {/* KID acknowledgment */}
          <label
            className={cn(
              'flex items-start gap-3 rounded-md border px-3 py-3 cursor-pointer transition-all duration-150',
              kidAcknowledged
                ? 'border-teal bg-teal/5'
                : 'border-border bg-surface-2 hover:border-violet/40',
            )}
          >
            <input
              type="checkbox"
              checked={kidAcknowledged}
              onChange={(e) => setKidAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-violet focus:ring-violet accent-violet"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink font-body flex items-center gap-1.5">
                <FileText size={12} className="text-violet shrink-0" />
                Document d&apos;Informations Cl\u00e9s (KID)
              </p>
              <p className="text-[11px] text-ink-3 font-body mt-0.5 leading-relaxed">
                Je confirme avoir lu et compris le KID de ce produit structur\u00e9, ainsi que
                les risques associ\u00e9s \u00e0 cet investissement.
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red/10 px-3 py-2 text-sm text-red font-body">
              {(error as Error).message ?? 'Une erreur est survenue. Veuillez r\u00e9essayer.'}
            </p>
          )}

          {/* Disclaimer */}
          <div className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[11px] text-ink-3 font-body leading-relaxed">
            <div className="flex items-start gap-2">
              <Shield size={12} className="text-ink-3 shrink-0 mt-0.5" />
              <p>
                Cette marque d&apos;int\u00e9r\u00eat ne constitue pas un engagement ferme de
                souscription. Elle sera transmise \u00e0 nos \u00e9quipes pour traitement. La
                souscription d\u00e9finitive sera formalis\u00e9e ult\u00e9rieurement selon les
                proc\u00e9dures r\u00e9glementaires en vigueur (MIF2 / DDA).
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="muted" size="md" onClick={handleClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!canConfirm || isPending}
            >
              {isPending ? 'Envoi en cours\u2026' : "Confirmer la marque d\u2019int\u00e9r\u00eat"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
