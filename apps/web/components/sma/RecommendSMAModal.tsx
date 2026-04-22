'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, FileText, Shield, AlertTriangle, Users, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useConsolidatedClientsStore } from '@/stores/clients-consolidated-store';
import { SMA_STRATEGY_LABELS, type SMA } from '@/stores/sma-store';

interface RecommendSMAModalProps {
  isOpen: boolean;
  onClose: () => void;
  sma: SMA;
}

const CONTRACT_TYPES = [
  { value: 'ASSURANCE_VIE', label: 'Assurance-Vie', description: 'Contrat multisupport' },
  { value: 'CTO', label: 'CTO', description: 'Compte-Titres Ordinaire' },
  { value: 'PEA', label: 'PEA', description: "Plan d'Épargne en Actions" },
] as const;
type ContractType = typeof CONTRACT_TYPES[number]['value'];

const INSURER_OPTIONS = [
  'Generali Vie',
  'Cardiff Vie',
  'Spirica',
  'Apicil',
  'Suravenir',
  'Autre',
] as const;

const AMOUNTS = [
  { label: '25k', value: 25_000 },
  { label: '50k', value: 50_000 },
  { label: '100k', value: 100_000 },
  { label: '250k', value: 250_000 },
  { label: '500k', value: 500_000 },
  { label: '1M', value: 1_000_000 },
];

function formatEur(amount: number): string {
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

export function RecommendSMAModal({ isOpen, onClose, sma }: RecommendSMAModalProps) {
  const clients = useConsolidatedClientsStore((s) => s.clients);
  const [clientId, setClientId] = useState<string>(clients[0]?.id ?? '');
  const [contractType, setContractType] = useState<ContractType>('ASSURANCE_VIE');
  const [insurer, setInsurer] = useState<string>('Generali Vie');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [confirmKid, setConfirmKid] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const effectiveAmount = useCustom ? parseCustomAmount(customAmount) : selectedAmount;
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  );
  const canConfirm =
    !!clientId &&
    !!effectiveAmount &&
    effectiveAmount >= sma.ticketMin &&
    confirmRisk &&
    confirmKid;

  function handleSubmit() {
    if (!canConfirm) return;
    // eslint-disable-next-line no-console
    console.info('[sma] recommend', {
      smaId: sma.id,
      clientId,
      amount: effectiveAmount,
      contractType,
      insurer,
    });
    setSubmitted(true);
  }

  function handleClose() {
    setClientId(clients[0]?.id ?? '');
    setContractType('ASSURANCE_VIE');
    setInsurer('Generali Vie');
    setSelectedAmount(null);
    setCustomAmount('');
    setUseCustom(false);
    setConfirmRisk(false);
    setConfirmKid(false);
    setSubmitted(false);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recommander ce SMA à un client"
      maxWidth="max-w-lg"
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
            <CheckCircle2 size={28} className="text-teal" />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-ink dark:text-white text-base mb-1">
              Recommandation enregistrée
            </p>
            <p className="text-sm text-ink-3 dark:text-white/60 font-body">
              Une recommandation de{' '}
              <span className="font-semibold text-ink dark:text-white">
                {formatEur(effectiveAmount ?? 0)}
              </span>{' '}
              sur{' '}
              <span className="font-semibold text-ink dark:text-white">
                {sma.name}
              </span>{' '}
              a été transmise pour{' '}
              <span className="font-semibold text-ink dark:text-white">
                {selectedClient
                  ? `${selectedClient.firstName} ${selectedClient.lastName}`
                  : 'le client sélectionné'}
              </span>
              .
            </p>
          </div>
          <Button variant="outline" size="md" onClick={handleClose} className="mt-2">
            Fermer
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* SMA summary */}
          <div className="rounded-md bg-surface-2 dark:bg-white/5 px-3 py-2.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-violet-pale dark:bg-violet/20 flex items-center justify-center shrink-0">
              <Layers size={16} className="text-violet dark:text-[#C9BCFF]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-widest font-body font-bold text-ink-3 dark:text-white/40">
                SMA
              </p>
              <p className="text-sm font-semibold font-body text-ink dark:text-white truncate">
                {sma.name}
              </p>
              <p className="text-[11px] font-body text-ink-3 dark:text-white/40">
                {SMA_STRATEGY_LABELS[sma.strategy]} — Ticket min. {formatEur(sma.ticketMin)}
              </p>
            </div>
          </div>

          {/* Client selector */}
          <div>
            <p className="text-xs text-ink-3 dark:text-white/50 font-body uppercase tracking-widest mb-2">
              Client
            </p>
            {clients.length === 0 ? (
              <p className="text-xs font-body text-ink-3 italic">
                Aucun client consolidé — créez-en un depuis Clients.
              </p>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={cn(
                  'w-full h-9 rounded-md border border-border dark:border-white/10 bg-white dark:bg-white/5 px-3',
                  'text-sm font-body text-ink dark:text-white cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet',
                )}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — {c.contracts.length} contrat{c.contracts.length > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Contract type */}
          <div>
            <p className="text-xs text-ink-3 dark:text-white/50 font-body uppercase tracking-widest mb-2">
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
                      'flex flex-col items-center rounded-md border px-2 py-2.5 text-center transition-all',
                      isSelected
                        ? 'border-violet bg-violet-pale dark:bg-violet/10 text-violet'
                        : 'border-border dark:border-white/10 bg-white dark:bg-white/5 text-ink-2 dark:text-white/80 hover:border-violet/50',
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="text-sm font-semibold font-body">{label}</span>
                    <span className="text-[10px] font-body text-ink-3 dark:text-white/40 mt-0.5">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Insurer */}
          <div>
            <p className="text-xs text-ink-3 dark:text-white/50 font-body uppercase tracking-widest mb-2">
              Assureur enveloppe
            </p>
            <select
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              className={cn(
                'w-full h-9 rounded-md border border-border dark:border-white/10 bg-white dark:bg-white/5 px-3',
                'text-sm font-body text-ink dark:text-white cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet',
              )}
            >
              {INSURER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs text-ink-3 dark:text-white/50 font-body uppercase tracking-widest mb-2">
              Montant
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AMOUNTS.map(({ label, value }) => {
                const isSelected = !useCustom && selectedAmount === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(value);
                      setUseCustom(false);
                      setCustomAmount('');
                    }}
                    className={cn(
                      'flex items-center justify-center rounded-md border px-2 py-2 text-sm font-semibold font-body transition-all',
                      isSelected
                        ? 'border-violet bg-violet text-white shadow-violet'
                        : 'border-border dark:border-white/10 bg-white dark:bg-white/5 text-ink-2 dark:text-white/80 hover:border-violet/50 hover:text-violet',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder={`Montant libre — min. ${formatEur(sma.ticketMin)}`}
                value={customAmount}
                onFocus={() => {
                  setUseCustom(true);
                  setSelectedAmount(null);
                }}
                onChange={(e) => {
                  setCustomAmount(e.target.value.replace(/[^\d\s,. ]/g, ''));
                  setUseCustom(true);
                  setSelectedAmount(null);
                }}
                className={cn(
                  'w-full h-9 rounded-md border px-3 text-sm font-body',
                  'focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet',
                  useCustom
                    ? 'border-violet bg-violet-pale/30 dark:bg-violet/10'
                    : 'border-border dark:border-white/10 bg-white dark:bg-white/5',
                )}
              />
            </div>
            {effectiveAmount !== null && effectiveAmount !== undefined && effectiveAmount < sma.ticketMin && (
              <p className="mt-1 text-[11px] text-red font-body flex items-center gap-1">
                <AlertTriangle size={11} />
                Le montant doit être supérieur ou égal à {formatEur(sma.ticketMin)}
              </p>
            )}
          </div>

          {/* Confirmations */}
          <label
            className={cn(
              'flex items-start gap-3 rounded-md border px-3 py-3 cursor-pointer transition-all',
              confirmRisk
                ? 'border-teal bg-teal/5'
                : 'border-border dark:border-white/10 bg-surface-2 dark:bg-white/5 hover:border-violet/40',
            )}
          >
            <input
              type="checkbox"
              checked={confirmRisk}
              onChange={(e) => setConfirmRisk(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-violet"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink dark:text-white font-body flex items-center gap-1.5">
                <Shield size={12} className="text-violet shrink-0" />
                Profil de risque du client vérifié
              </p>
              <p className="text-[11px] text-ink-3 dark:text-white/50 font-body mt-0.5 leading-relaxed">
                Je confirme que le profil de risque, l&rsquo;horizon et la capacité de perte du client sont adéquats avec ce SMA.
              </p>
            </div>
          </label>

          <label
            className={cn(
              'flex items-start gap-3 rounded-md border px-3 py-3 cursor-pointer transition-all',
              confirmKid
                ? 'border-teal bg-teal/5'
                : 'border-border dark:border-white/10 bg-surface-2 dark:bg-white/5 hover:border-violet/40',
            )}
          >
            <input
              type="checkbox"
              checked={confirmKid}
              onChange={(e) => setConfirmKid(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-violet"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink dark:text-white font-body flex items-center gap-1.5">
                <FileText size={12} className="text-violet shrink-0" />
                Documentation remise et KID de référence
              </p>
              <p className="text-[11px] text-ink-3 dark:text-white/50 font-body mt-0.5 leading-relaxed">
                Je confirme avoir présenté le document d&rsquo;informations clés (KID) et le mandat de gestion.
              </p>
            </div>
          </label>

          {/* Disclaimer */}
          <div className="rounded-md border border-border dark:border-white/10 bg-surface-2 dark:bg-white/5 px-3 py-2.5 text-[11px] text-ink-3 dark:text-white/50 font-body leading-relaxed">
            <div className="flex items-start gap-2">
              <Users size={12} className="text-ink-3 dark:text-white/40 shrink-0 mt-0.5" />
              <p>
                Cette recommandation sera formalisée par lettre de mission signée (DDA) et le suivi portefeuille sera intégré dans la consolidation client.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="muted" size="md" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!canConfirm}
            >
              Transmettre la recommandation
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
