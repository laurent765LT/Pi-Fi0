'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wallet, Check, Copy, LogOut, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/modal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalletProvider = 'metamask' | 'ledger' | 'fireblocks';

export interface WalletConnection {
  provider: WalletProvider;
  address: string;
  connectedAt: string;
}

interface WalletConnectMockProps {
  /** Called when a wallet is connected (address, provider) */
  onConnect?: (connection: WalletConnection) => void;
  /** Called when the user disconnects */
  onDisconnect?: () => void;
  /** Optional classes applied to the top-level wrapper */
  className?: string;
  /** Renders the button variant as compact (smaller height) */
  compact?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'strickin-wallet-mock';
const MOCK_ADDRESS = '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8FD3F4';

const PROVIDER_META: Record<WalletProvider, { label: string; emoji: string; description: string }> = {
  metamask: {
    label: 'MetaMask',
    emoji: '🦊',
    description: 'Wallet navigateur le plus populaire',
  },
  ledger: {
    label: 'Ledger',
    emoji: '🔐',
    description: 'Wallet hardware sécurisé',
  },
  fireblocks: {
    label: 'Fireblocks',
    emoji: '🔥',
    description: 'Solution de custody institutionnelle',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadConnection(): WalletConnection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'address' in parsed &&
      'provider' in parsed &&
      typeof (parsed as { address: unknown }).address === 'string' &&
      typeof (parsed as { provider: unknown }).provider === 'string'
    ) {
      return parsed as WalletConnection;
    }
    return null;
  } catch {
    return null;
  }
}

function saveConnection(conn: WalletConnection): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conn));
  } catch {
    /* ignore */
  }
}

function clearConnection(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function truncate(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WalletConnectMock({
  onConnect,
  onDisconnect,
  className,
  compact = false,
}: WalletConnectMockProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [connecting, setConnecting] = useState<WalletProvider | null>(null);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConnection(loadConnection());
    setHydrated(true);
  }, []);

  const handleSelectProvider = useCallback(
    (provider: WalletProvider) => {
      if (connecting) return;
      setConnecting(provider);
      // Simulate 2s connection flow
      window.setTimeout(() => {
        const newConn: WalletConnection = {
          provider,
          address: MOCK_ADDRESS,
          connectedAt: new Date().toISOString(),
        };
        saveConnection(newConn);
        setConnection(newConn);
        setConnecting(null);
        setModalOpen(false);
        onConnect?.(newConn);
      }, 2000);
    },
    [connecting, onConnect],
  );

  const handleDisconnect = useCallback(() => {
    clearConnection();
    setConnection(null);
    onDisconnect?.();
  }, [onDisconnect]);

  const handleCopy = useCallback(() => {
    if (!connection) return;
    void navigator.clipboard
      .writeText(connection.address)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* ignore */
      });
  }, [connection]);

  // Render nothing until hydrated to avoid SSR mismatch
  if (!hydrated) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-border/40 bg-white/50 dark:bg-white/5',
          compact ? 'h-8 px-3' : 'h-10 px-4',
          className,
        )}
        aria-hidden="true"
      >
        <Wallet size={14} className="text-ink-3/50" />
        <span className="text-[12px] font-body text-ink-3/50">&nbsp;</span>
      </div>
    );
  }

  // Connected state
  if (connection) {
    const meta = PROVIDER_META[connection.provider];
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-[#3B1FA8]/20',
          'bg-gradient-to-r from-[#3B1FA8]/5 to-[#7B5FE0]/5',
          compact ? 'h-8 px-3' : 'h-10 px-4',
          className,
        )}
      >
        <span aria-hidden="true" className="text-[14px]">
          {meta.emoji}
        </span>
        <code className="font-mono font-semibold text-[12px] text-[#3B1FA8] tabular-nums select-all">
          {truncate(connection.address)}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copier l'adresse du wallet"
          className={cn(
            'p-1 rounded-md transition-colors',
            copied ? 'text-teal' : 'text-ink-3/60 hover:text-ink-2 hover:bg-white/40',
          )}
        >
          {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          aria-label="Déconnecter le wallet"
          className="p-1 rounded-md text-ink-3/60 hover:text-[#E8334A] hover:bg-[#E8334A]/10 transition-colors"
        >
          <LogOut size={12} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl font-body font-semibold',
          'bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] text-white',
          'shadow-md shadow-violet/20 hover:shadow-lg hover:shadow-violet/30',
          'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
          compact ? 'h-8 px-3.5 text-[12px]' : 'h-10 px-5 text-[13px]',
          className,
        )}
      >
        <Wallet size={compact ? 13 : 15} />
        Connect Wallet
      </button>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!connecting) setModalOpen(false);
        }}
        title="Connecter un wallet"
      >
        <p className="text-[12px] text-ink-3 font-body mb-4 leading-relaxed">
          Sélectionnez le portefeuille de votre choix pour signer les transactions
          sur la blockchain Canton.
        </p>
        <div className="space-y-2">
          {(Object.keys(PROVIDER_META) as WalletProvider[]).map((provider) => {
            const meta = PROVIDER_META[provider];
            const isBusy = connecting === provider;
            return (
              <button
                key={provider}
                type="button"
                onClick={() => handleSelectProvider(provider)}
                disabled={!!connecting}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border text-left',
                  'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40',
                  isBusy
                    ? 'border-[#3B1FA8]/40 bg-[#3B1FA8]/5'
                    : 'border-border/40 bg-white/60 hover:border-[#3B1FA8]/30 hover:bg-[#3B1FA8]/3 hover:scale-[1.01]',
                  connecting && !isBusy && 'opacity-40 cursor-not-allowed',
                )}
              >
                <span className="text-[22px]" aria-hidden="true">
                  {meta.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-semibold text-ink leading-tight">
                    {meta.label}
                  </p>
                  <p className="text-[11px] text-ink-3 font-body mt-0.5">
                    {meta.description}
                  </p>
                </div>
                {isBusy ? (
                  <Loader2 size={16} className="animate-spin text-[#3B1FA8]" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3/50">
                    Mock
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-ink-3/60 font-body mt-4 text-center">
          Mode démo — aucune transaction blockchain réelle n&apos;est effectuée.
        </p>
      </Modal>
    </>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWalletConnection(): WalletConnection | null {
  const [conn, setConn] = useState<WalletConnection | null>(null);

  useEffect(() => {
    setConn(loadConnection());
    const handler = () => setConn(loadConnection());
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
    return undefined;
  }, []);

  return conn;
}
