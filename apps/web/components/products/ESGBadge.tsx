'use client';

import { Leaf, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { mockESGForProduct } from '@/lib/esg/scoring-engine';
import { SFDR_LABELS } from '@/lib/esg/sfdr-schema';

interface ESGBadgeProps {
  productId: string;
  /** Render a slightly smaller version suitable for dense listings. */
  compact?: boolean;
  /** Optional click handler — e.g. to scroll to the ESG block on the detail page. */
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

function getTone(
  score: number,
  isEsg: boolean,
): { bg: string; text: string; border: string; iconColor: string } {
  if (!isEsg) {
    return {
      bg: 'bg-surface-2 dark:bg-white/[0.06]',
      text: 'text-ink-3 dark:text-white/60',
      border: 'border-border/60 dark:border-white/10',
      iconColor: 'text-ink-3',
    };
  }
  if (score >= 80) {
    return {
      bg: 'bg-teal/10 dark:bg-teal/15',
      text: 'text-[#008B6E] dark:text-[#00D4AA]',
      border: 'border-teal/30 dark:border-teal/25',
      iconColor: 'text-[#00B894]',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-[#E6FAF5] dark:bg-teal/10',
      text: 'text-[#008B6E] dark:text-[#00D4AA]',
      border: 'border-teal/20 dark:border-teal/20',
      iconColor: 'text-[#00B894]',
    };
  }
  return {
    bg: 'bg-gold-light dark:bg-gold/10',
    text: 'text-[#A07800] dark:text-gold',
    border: 'border-gold/25 dark:border-gold/25',
    iconColor: 'text-gold',
  };
}

export function ESGBadge({ productId, compact = false, onClick, className }: ESGBadgeProps) {
  const esg = mockESGForProduct(productId);
  const isEsg = esg.sfdr === 'art8' || esg.sfdr === 'art9';
  const tone = getTone(esg.overallScore, isEsg);
  const sfdrInfo = SFDR_LABELS[esg.sfdr];

  const Icon = isEsg ? Leaf : Circle;

  const Wrapper: React.ElementType = onClick ? 'button' : 'span';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={
        isEsg
          ? `Score ESG ${esg.overallScore} sur 100, classification ${sfdrInfo.fullLabel}`
          : `Produit classique ${sfdrInfo.fullLabel}`
      }
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold font-body tabular-nums',
        'transition-colors duration-200',
        compact ? 'px-2 py-[2px] text-[10px]' : 'px-2.5 py-[3px] text-[11px]',
        tone.bg,
        tone.text,
        tone.border,
        onClick && 'cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet/30',
        className,
      )}
    >
      <Icon
        size={compact ? 10 : 11}
        className={cn(
          tone.iconColor,
          isEsg && esg.overallScore >= 80 && 'drop-shadow-[0_0_2px_rgba(0,184,148,0.4)]',
        )}
        aria-hidden
        fill={isEsg ? 'currentColor' : 'none'}
        strokeWidth={isEsg ? 2 : 2.5}
      />
      {isEsg ? (
        <>
          <span className="font-mono">ESG {esg.overallScore}/100</span>
          <span className="opacity-40" aria-hidden>
            &middot;
          </span>
          <span className="uppercase tracking-wider text-[9px] font-bold">
            SFDR {sfdrInfo.label}
          </span>
        </>
      ) : (
        <span className="uppercase tracking-wider text-[10px] font-bold">{sfdrInfo.label}</span>
      )}
    </Wrapper>
  );
}
