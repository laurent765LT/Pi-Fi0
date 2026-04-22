'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Check,
  Wallet as WalletIcon,
  Package,
  Coins,
  PenLine,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { WalletConnectMock, type WalletConnection } from './WalletConnectMock';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenizedProduct {
  id: string;
  name: string;
  isin: string;
  minTicket: number;
  network: string;
}

interface SettlementResult {
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  settlementMs: number;
  timestamp: string;
}

type StepId = 1 | 2 | 3 | 4 | 5;

interface StepMeta {
  id: StepId;
  title: string;
  description: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: TokenizedProduct[] = [
  {
    id: 'tok-001',
    name: 'M Rendement 13 · Tokenized',
    isin: 'FR0014013A96',
    minTicket: 100,
    network: 'Canton',
  },
  {
    id: 'tok-002',
    name: 'M Rendement OR · Tokenized',
    isin: 'FR0014012O42',
    minTicket: 50,
    network: 'Canton',
  },
  {
    id: 'tok-003',
    name: 'M Ambition 10 · Tokenized',
    isin: 'FR0014010O28',
    minTicket: 100,
    network: 'Canton',
  },
];

const STEPS: StepMeta[] = [
  { id: 1, title: 'Connexion wallet', description: 'Connectez un portefeuille compatible' },
  { id: 2, title: 'Sélection produit', description: 'Choisissez un produit tokenisé' },
  { id: 3, title: 'Montant', description: 'Saisissez le montant à souscrire' },
  { id: 4, title: 'Signature', description: 'Signez la transaction on-chain' },
  { id: 5, title: 'Confirmation', description: 'Règlement instantané confirmé' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let out = '0x';
  for (let i = 0; i < 64; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function truncateHash(hash: string): string {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnChainSettlementFlow() {
  const [step, setStep] = useState<StepId>(1);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [productId, setProductId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [result, setResult] = useState<SettlementResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedProduct = useMemo(
    () => MOCK_PRODUCTS.find((p) => p.id === productId) ?? null,
    [productId],
  );

  const handleConnect = useCallback((conn: WalletConnection) => {
    setConnection(conn);
    setStep(2);
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnection(null);
    setStep(1);
    setProductId('');
    setAmount('');
    setResult(null);
  }, []);

  const handleSelectProduct = useCallback((id: string) => {
    setProductId(id);
    if (id) setStep(3);
  }, []);

  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value);
      if (!selectedProduct) return;
      const num = Number(value);
      if (!value.trim()) {
        setAmountError(null);
        return;
      }
      if (Number.isNaN(num) || num <= 0) {
        setAmountError('Montant invalide');
      } else if (num < selectedProduct.minTicket) {
        setAmountError(`Ticket min. ${formatEuro(selectedProduct.minTicket)}`);
      } else {
        setAmountError(null);
      }
    },
    [selectedProduct],
  );

  const canSign =
    step >= 3 &&
    !amountError &&
    amount.trim() !== '' &&
    selectedProduct !== null &&
    !signing;

  const handleSign = useCallback(() => {
    if (!canSign) return;
    setSigning(true);
    setStep(4);
    const startTs = performance.now();
    window.setTimeout(() => {
      const elapsed = performance.now() - startTs;
      setResult({
        txHash: generateTxHash(),
        blockNumber: 18_420_000 + Math.floor(Math.random() * 10_000),
        gasUsed: 21_000 + Math.floor(Math.random() * 50_000),
        settlementMs: Math.max(2800, Math.floor(elapsed + 200)),
        timestamp: new Date().toISOString(),
      });
      setSigning(false);
      setStep(5);
    }, 3000);
  }, [canSign]);

  const handleCopyHash = useCallback(() => {
    if (!result) return;
    void navigator.clipboard
      .writeText(result.txHash)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* ignore */
      });
  }, [result]);

  const handleReset = useCallback(() => {
    setStep(connection ? 2 : 1);
    setProductId('');
    setAmount('');
    setAmountError(null);
    setSigning(false);
    setResult(null);
    setCopied(false);
  }, [connection]);

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-white/80 dark:bg-white/5 backdrop-blur-md',
        'shadow-lg shadow-violet/5 overflow-hidden',
      )}
    >
      {/* Gradient accent top strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#3B1FA8] via-[#5535C4] to-[#7B5FE0]" />

      {/* Timeline header */}
      <div className="px-5 py-5 border-b border-border/40">
        <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto">
          {STEPS.map((meta, idx) => {
            const isActive = meta.id === step;
            const isDone = meta.id < step;
            return (
              <div
                key={meta.id}
                className="flex items-center gap-1.5 sm:gap-3 shrink-0"
              >
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0',
                    'text-[11px] sm:text-[12px] font-display font-bold transition-all duration-200',
                    isDone
                      ? 'bg-gradient-to-br from-[#3B1FA8] to-[#7B5FE0] text-white shadow-md shadow-violet/30'
                      : isActive
                        ? 'bg-[#3B1FA8]/10 text-[#3B1FA8] ring-2 ring-[#3B1FA8]/30 ring-offset-2'
                        : 'bg-ink-3/10 text-ink-3/60',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : meta.id}
                </div>
                <span
                  className={cn(
                    'hidden sm:inline font-body text-[11px] font-semibold whitespace-nowrap',
                    isDone || isActive ? 'text-ink' : 'text-ink-3/50',
                  )}
                >
                  {meta.title}
                </span>
                {idx < STEPS.length - 1 && (
                  <span
                    className={cn(
                      'w-4 sm:w-6 h-[2px] shrink-0',
                      isDone ? 'bg-[#3B1FA8]' : 'bg-ink-3/15',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="p-5 space-y-5">
        {/* Step 1 — Connect wallet */}
        <section
          className={cn(
            'rounded-xl border p-4 transition-all duration-200',
            step === 1
              ? 'border-[#3B1FA8]/30 bg-[#3B1FA8]/3'
              : 'border-border/30 bg-white/40 dark:bg-white/[0.02]',
          )}
          aria-labelledby="step-1-label"
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center',
                step >= 2 ? 'bg-[#3B1FA8]/15 text-[#3B1FA8]' : 'bg-ink-3/10 text-ink-3',
              )}
            >
              <WalletIcon size={14} />
            </div>
            <h3
              id="step-1-label"
              className="font-display font-bold text-[13px] text-ink"
            >
              1. Connectez votre wallet
            </h3>
          </div>
          <div className="pl-9">
            <WalletConnectMock
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </section>

        {/* Step 2 — Select product */}
        {step >= 2 && (
          <section
            className={cn(
              'rounded-xl border p-4 transition-all duration-200 animate-fade-in',
              step === 2
                ? 'border-[#3B1FA8]/30 bg-[#3B1FA8]/3'
                : 'border-border/30 bg-white/40 dark:bg-white/[0.02]',
            )}
            aria-labelledby="step-2-label"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center',
                  step >= 3 ? 'bg-[#3B1FA8]/15 text-[#3B1FA8]' : 'bg-ink-3/10 text-ink-3',
                )}
              >
                <Package size={14} />
              </div>
              <h3
                id="step-2-label"
                className="font-display font-bold text-[13px] text-ink"
              >
                2. Choisissez un produit tokenisé
              </h3>
            </div>
            <div className="pl-9">
              <label htmlFor="onchain-product" className="sr-only">
                Produit tokenisé
              </label>
              <select
                id="onchain-product"
                value={productId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                className={cn(
                  'w-full h-10 px-3 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10',
                  'text-[13px] font-body text-ink dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-[#3B1FA8]/30 focus:border-[#3B1FA8]/40',
                )}
              >
                <option value="">— Sélectionner un produit —</option>
                {MOCK_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.isin}) · min {formatEuro(p.minTicket)}
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* Step 3 — Amount */}
        {step >= 3 && selectedProduct && (
          <section
            className={cn(
              'rounded-xl border p-4 transition-all duration-200 animate-fade-in',
              step === 3
                ? 'border-[#3B1FA8]/30 bg-[#3B1FA8]/3'
                : 'border-border/30 bg-white/40 dark:bg-white/[0.02]',
            )}
            aria-labelledby="step-3-label"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center',
                  step >= 4 ? 'bg-[#3B1FA8]/15 text-[#3B1FA8]' : 'bg-ink-3/10 text-ink-3',
                )}
              >
                <Coins size={14} />
              </div>
              <h3
                id="step-3-label"
                className="font-display font-bold text-[13px] text-ink"
              >
                3. Montant à souscrire
              </h3>
            </div>
            <div className="pl-9 space-y-2">
              <div className="relative">
                <input
                  type="number"
                  min={selectedProduct.minTicket}
                  step={1}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={`Ex. ${selectedProduct.minTicket}`}
                  aria-invalid={!!amountError}
                  aria-describedby={amountError ? 'amount-error' : undefined}
                  className={cn(
                    'w-full h-10 px-3 pr-10 rounded-xl border bg-white/80 dark:bg-white/10',
                    'text-[13px] font-mono font-semibold text-ink dark:text-white tabular-nums',
                    'focus:outline-none focus:ring-2',
                    amountError
                      ? 'border-[#E8334A]/40 focus:ring-[#E8334A]/20 focus:border-[#E8334A]/50'
                      : 'border-border/60 focus:ring-[#3B1FA8]/30 focus:border-[#3B1FA8]/40',
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-3 font-body">
                  EUR
                </span>
              </div>
              {amountError ? (
                <p
                  id="amount-error"
                  role="alert"
                  className="text-[11px] text-[#E8334A] font-body"
                >
                  {amountError}
                </p>
              ) : (
                <p className="text-[11px] text-ink-3 font-body">
                  Ticket minimum : {formatEuro(selectedProduct.minTicket)} · Micro-unitarisation activée
                </p>
              )}
            </div>
          </section>
        )}

        {/* Step 4 — Sign (button always visible when canSign or signing) */}
        {step >= 3 && selectedProduct && step < 5 && (
          <section
            className={cn(
              'rounded-xl border p-4 transition-all duration-200',
              step === 4
                ? 'border-[#3B1FA8]/30 bg-[#3B1FA8]/3'
                : 'border-border/30 bg-white/40 dark:bg-white/[0.02]',
            )}
            aria-labelledby="step-4-label"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center',
                  step >= 5 ? 'bg-[#3B1FA8]/15 text-[#3B1FA8]' : 'bg-ink-3/10 text-ink-3',
                )}
              >
                <PenLine size={14} />
              </div>
              <h3
                id="step-4-label"
                className="font-display font-bold text-[13px] text-ink"
              >
                4. Signer la transaction
              </h3>
            </div>
            <div className="pl-9">
              <button
                type="button"
                onClick={handleSign}
                disabled={!canSign}
                className={cn(
                  'w-full h-12 rounded-xl font-display font-bold text-[14px]',
                  'flex items-center justify-center gap-2 transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
                  canSign
                    ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white shadow-lg shadow-violet/30 hover:scale-[1.01] active:scale-[0.99]'
                    : signing
                      ? 'bg-[#3B1FA8]/80 text-white cursor-wait'
                      : 'bg-ink-3/10 text-ink-3/40 cursor-not-allowed',
                )}
              >
                {signing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signature en cours...
                  </>
                ) : (
                  <>
                    <PenLine size={16} />
                    Signer la transaction
                  </>
                )}
              </button>
              {!canSign && !signing && (
                <p className="text-[11px] text-ink-3 font-body mt-2 text-center">
                  Complétez les étapes précédentes pour continuer.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Step 5 — Success */}
        {step === 5 && result && selectedProduct && connection && (
          <section
            className="rounded-xl border border-[#00B894]/25 bg-[#00B894]/5 p-4 animate-fade-in"
            aria-labelledby="step-5-label"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#00B894]/15 text-[#00B894]">
                <CheckCircle2 size={16} />
              </div>
              <h3
                id="step-5-label"
                className="font-display font-bold text-[13px] text-[#00B894]"
              >
                5. Règlement confirmé
              </h3>
            </div>
            <div className="pl-9 space-y-3">
              <p className="text-[12px] text-ink-2 font-body">
                Votre souscription de{' '}
                <strong>{formatEuro(Number(amount))}</strong> sur{' '}
                <strong>{selectedProduct.name}</strong> a été réglée instantanément
                sur la blockchain Canton.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Metric
                  label="Tx Hash"
                  value={truncateHash(result.txHash)}
                  mono
                  action={
                    <>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        aria-label="Copier le hash de transaction"
                        className={cn(
                          'p-1 rounded-md transition-colors',
                          copied ? 'text-teal' : 'text-ink-3/60 hover:text-ink-2',
                        )}
                      >
                        {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
                      </button>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        aria-label="Voir sur l'explorateur blockchain"
                        className="p-1 rounded-md text-ink-3/60 hover:text-[#3B1FA8] transition-colors"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </>
                  }
                />
                <Metric
                  label="Block"
                  value={`#${result.blockNumber.toLocaleString('fr-FR')}`}
                  mono
                />
                <Metric
                  label="Gas utilisé"
                  value={result.gasUsed.toLocaleString('fr-FR')}
                  mono
                />
                <Metric
                  label="Temps de règlement"
                  value={`Réglé en ${(result.settlementMs / 1000).toFixed(1)} secondes`}
                  highlight
                />
              </div>

              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  'inline-flex items-center gap-2 h-8 px-4 rounded-xl',
                  'bg-white/80 dark:bg-white/10 border border-border/40',
                  'text-[12px] font-body font-semibold text-ink-2',
                  'hover:border-[#3B1FA8]/30 hover:text-[#3B1FA8]',
                  'transition-all duration-200',
                )}
              >
                <RefreshCcw size={12} />
                Nouvelle transaction
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface MetricProps {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  action?: React.ReactNode;
}

function Metric({ label, value, mono = false, highlight = false, action }: MetricProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        highlight
          ? 'border-[#00B894]/25 bg-white/90 dark:bg-white/5'
          : 'border-border/40 bg-white/60 dark:bg-white/[0.03]',
      )}
    >
      <p className="text-[9px] uppercase tracking-widest text-ink-3/60 font-semibold font-body mb-0.5">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'text-[12px] font-semibold truncate',
            mono ? 'font-mono tabular-nums' : 'font-body',
            highlight ? 'text-[#00B894]' : 'text-ink',
          )}
        >
          {value}
        </span>
        {action}
      </div>
    </div>
  );
}
