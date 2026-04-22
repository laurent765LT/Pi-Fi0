'use client';

import { useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Coins,
  Shield,
  RotateCcw,
  BarChart3,
  Percent,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AMF_QUESTIONS_META,
  computeAMFSevenQuestions,
  type AMFProduct,
  type AMFQuestionMeta,
  type AMFSevenQuestions as AMFSevenQuestionsType,
} from '@/lib/products/amf-seven-questions';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AMFSevenQuestionsProps {
  product: AMFProduct;
  /** Passe les reponses pre-calculees pour eviter une double execution (PDF). */
  precomputed?: AMFSevenQuestionsType;
  className?: string;
}

const ICONS: Record<AMFQuestionMeta['key'], typeof Clock> = {
  maxDuration: Clock,
  capitalLossRisk: AlertTriangle,
  remuneration: Coins,
  issuerCreditRisk: Shield,
  earlyExit: RotateCcw,
  underlying: BarChart3,
  fees: Percent,
};

const TINTS: Record<AMFQuestionMeta['key'], { icon: string; border: string; bg: string }> = {
  maxDuration: {
    icon: 'text-violet',
    border: 'border-violet/30',
    bg: 'bg-violet/[0.05] dark:bg-violet/[0.08]',
  },
  capitalLossRisk: {
    icon: 'text-red',
    border: 'border-red/30',
    bg: 'bg-red/[0.05] dark:bg-red/[0.08]',
  },
  remuneration: {
    icon: 'text-teal',
    border: 'border-teal/30',
    bg: 'bg-teal/[0.05] dark:bg-teal/[0.08]',
  },
  issuerCreditRisk: {
    icon: 'text-cobalt',
    border: 'border-cobalt/30',
    bg: 'bg-cobalt/[0.05] dark:bg-cobalt/[0.08]',
  },
  earlyExit: {
    icon: 'text-gold',
    border: 'border-gold/30',
    bg: 'bg-gold/[0.05] dark:bg-gold/[0.08]',
  },
  underlying: {
    icon: 'text-violet',
    border: 'border-violet/30',
    bg: 'bg-violet/[0.05] dark:bg-violet/[0.08]',
  },
  fees: {
    icon: 'text-ink-2',
    border: 'border-border',
    bg: 'bg-surface-2/50 dark:bg-white/[0.04]',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Bloc AMF "7 questions" affiche en tete de la fiche produit. Responsive :
 * 2 colonnes sur mobile, 4 colonnes en tablette, 7 colonnes en desktop.
 * Chaque carte affiche un numero, un libelle et la reponse derivee du
 * produit. Les couleurs suivent la hierarchie de risque (rouge = capital,
 * violet = duree, teal = remuneration, ...).
 */
export function AMFSevenQuestions({
  product,
  precomputed,
  className,
}: AMFSevenQuestionsProps) {
  const answers = useMemo<AMFSevenQuestionsType>(
    () => precomputed ?? computeAMFSevenQuestions(product),
    [product, precomputed],
  );

  return (
    <section
      aria-labelledby="amf-seven-questions-title"
      className={cn(
        'relative overflow-hidden rounded-2xl border border-violet/20',
        'bg-gradient-to-br from-violet/[0.04] via-white to-teal/[0.03]',
        'dark:from-violet/[0.08] dark:via-white/[0.02] dark:to-teal/[0.04]',
        'shadow-sm',
        className,
      )}
    >
      {/* Bandeau superieur accent */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-violet via-cobalt to-teal"
      />

      {/* Header */}
      <header className="flex flex-col gap-1.5 border-b border-violet/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/10 text-violet"
          >
            <Info size={15} />
          </span>
          <div>
            <h2
              id="amf-seven-questions-title"
              className="font-display text-sm font-bold text-ink sm:text-base"
            >
              7 questions AMF à se poser
            </h2>
            <p className="mt-0.5 text-[11px] font-body leading-snug text-ink-3">
              Information réglementaire clé avant toute recommandation
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 self-start rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet sm:self-auto">
          AMF · Produit structuré
        </span>
      </header>

      {/* Grid des 7 questions : 2 / 4 / 7 colonnes */}
      <ol
        className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-2.5 sm:p-4 lg:grid-cols-7"
        aria-label="Liste des 7 questions AMF"
      >
        {AMF_QUESTIONS_META.map((meta) => {
          const Icon = ICONS[meta.key];
          const tint = TINTS[meta.key];
          const value = answers[meta.key];

          return (
            <li
              key={meta.key}
              className={cn(
                'group relative flex flex-col gap-1.5 rounded-xl border p-2.5 transition-shadow',
                'hover:shadow-md hover:shadow-violet/5',
                tint.border,
                tint.bg,
              )}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest',
                    tint.icon,
                  )}
                  aria-hidden="true"
                >
                  <Icon size={11} />
                  Q{meta.number}
                </span>
              </div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-ink-3 leading-tight">
                {meta.shortLabel}
              </p>
              <p
                className="text-[11px] font-body font-semibold leading-snug text-ink"
                aria-label={`${meta.longLabel} Réponse : ${value}`}
                title={meta.longLabel}
              >
                {value}
              </p>
            </li>
          );
        })}
      </ol>

      {/* Footer pedagogique */}
      <footer className="border-t border-violet/15 bg-white/60 px-4 py-2 dark:bg-white/[0.02]">
        <p className="text-[10px] font-body leading-relaxed text-ink-3">
          Synthèse non contractuelle basée sur les données du produit.
          Consultez systématiquement le <strong className="font-semibold">KID PRIIPs</strong> et
          le <strong className="font-semibold">prospectus</strong> avant toute souscription.
        </p>
      </footer>
    </section>
  );
}

export default AMFSevenQuestions;
