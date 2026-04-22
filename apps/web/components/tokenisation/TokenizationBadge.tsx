'use client';

import { Link2 } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TokenNetwork = 'canton' | 'ethereum' | 'polygon' | 'sg-forge';

interface TokenizationBadgeProps {
  network: TokenNetwork;
  /** Size variant — defaults to md */
  size?: 'sm' | 'md';
  /** Optional extra classes */
  className?: string;
}

// ─── Network metadata ────────────────────────────────────────────────────────

const NETWORK_META: Record<TokenNetwork, { label: string; short: string }> = {
  canton: { label: 'Tokenized on Canton', short: 'Canton' },
  ethereum: { label: 'Tokenized on Ethereum', short: 'Ethereum' },
  polygon: { label: 'Tokenized on Polygon', short: 'Polygon' },
  'sg-forge': { label: 'Issued via SG-FORGE', short: 'SG-FORGE' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TokenizationBadge({
  network,
  size = 'md',
  className,
}: TokenizationBadgeProps) {
  const meta = NETWORK_META[network];
  const isSmall = size === 'sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold text-white shrink-0',
        'bg-gradient-to-r from-[#3B1FA8] via-[#5535C4] to-[#7B5FE0]',
        'shadow-sm shadow-violet/20',
        isSmall ? 'px-2 py-[2px] text-[9px]' : 'px-2.5 py-[3px] text-[10px]',
        className,
      )}
      title={meta.label}
      role="status"
      aria-label={meta.label}
    >
      <Link2 size={isSmall ? 9 : 10} aria-hidden="true" />
      <span className="uppercase tracking-wider">
        {isSmall ? meta.short : meta.label}
      </span>
    </span>
  );
}
