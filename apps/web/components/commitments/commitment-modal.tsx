'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useCreateCommitment } from '@/hooks/use-commitments';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelfId: string;
  productName: string;
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

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommitmentModal({
  isOpen,
  onClose,
  shelfId,
  productName,
}: CommitmentModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const { mutate: createCommitment, isPending, error } = useCreateCommitment();

  function handleConfirm() {
    if (!selectedAmount) return;
    createCommitment(
      { shelfId, amount: selectedAmount },
      {
        onSuccess: () => {
          setSuccess(true);
        },
      },
    );
  }

  function handleClose() {
    // Reset state on close
    setSelectedAmount(null);
    setSuccess(false);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Marque d'intérêt"
      maxWidth="max-w-lg"
    >
      {success ? (
        /* ── Success state ──────────────────────────────────────────── */
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 14l5.5 5.5L22 9"
                stroke="#00B894"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-ink text-base mb-1">
              Marque d&apos;intérêt enregistrée
            </p>
            <p className="text-sm text-ink-3 font-body">
              Votre marque d&apos;intérêt de{' '}
              <span className="font-semibold text-ink">
                {formatAmount(selectedAmount!)}
              </span>{' '}
              sur{' '}
              <span className="font-semibold text-ink">{productName}</span> a
              bien été transmise.
            </p>
          </div>
          <Button variant="outline" size="md" onClick={handleClose} className="mt-2">
            Fermer
          </Button>
        </div>
      ) : (
        /* ── Selection state ────────────────────────────────────────── */
        <div className="flex flex-col gap-5">
          {/* Product name */}
          <div className="rounded-md bg-surface-2 px-3 py-2">
            <p className="text-xs text-ink-3 font-body uppercase tracking-widest mb-0.5">
              Produit
            </p>
            <p className="text-sm font-semibold text-ink font-body line-clamp-2">
              {productName}
            </p>
          </div>

          {/* Amount selection */}
          <div>
            <p className="text-xs text-ink-3 font-body uppercase tracking-widest mb-3">
              Montant indicatif
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {AMOUNTS.map(({ label, value }) => {
                const isSelected = selectedAmount === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedAmount(value)}
                    className={cn(
                      'flex items-center justify-center rounded-md border px-3 py-2',
                      'text-sm font-semibold font-body transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1',
                      isSelected
                        ? 'border-violet bg-violet text-white shadow-violet'
                        : 'border-border bg-white text-ink-2 hover:border-violet/50 hover:text-violet hover:bg-violet-pale',
                    )}
                    aria-pressed={isSelected}
                    aria-label={`Sélectionner ${formatAmount(value)}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {selectedAmount !== null && (
              <p className="mt-2 text-center text-xs text-ink-3 font-body">
                Montant sélectionné :{' '}
                <span className="font-semibold text-violet">
                  {formatAmount(selectedAmount)}
                </span>
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red/10 px-3 py-2 text-sm text-red font-body">
              {(error as Error).message ?? 'Une erreur est survenue. Veuillez réessayer.'}
            </p>
          )}

          {/* Disclaimer */}
          <p className="rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[11px] text-ink-3 font-body leading-relaxed">
            Cette marque d&apos;intérêt ne constitue pas un engagement ferme de
            souscription. Elle sera transmise à nos équipes pour traitement. La
            souscription définitive sera formalisée ultérieurement selon les
            procédures réglementaires en vigueur.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="muted" size="md" onClick={handleClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!selectedAmount || isPending}
            >
              {isPending ? 'Envoi en cours\u2026' : "Confirmer la marque d\u2019intérêt"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
