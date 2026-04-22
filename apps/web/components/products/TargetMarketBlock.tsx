'use client';

import { useMemo } from 'react';
import {
  BookOpen,
  Briefcase,
  Coins,
  Gauge,
  Target as TargetIcon,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  DIMENSION_LABELS,
  LABELS,
  type ClientProfile,
  type DimensionKey,
  type TargetMarket,
} from '@/lib/suitability/target-market-schema';
import {
  computeSuitability,
  mockTargetMarketForProduct,
  DEFAULT_CLIENT_PROFILE,
} from '@/lib/suitability/matching-engine';
import { TargetMarketBadge } from './TargetMarketBadge';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TargetMarketBlockProps {
  productId: string;
  /** Target Market positif explicite ; a defaut, un mock deterministe est genere. */
  targetMarket?: TargetMarket;
  /** Profil client a confronter au Target Market ; si non fourni, aucun badge d'adequation n'est affiche. */
  clientProfile?: ClientProfile | null;
  /** Nom affiche du client (pour libelle uniquement). */
  clientName?: string;
  /** SRI produit 1-7 — influence les valeurs acceptables du mock Target Market. */
  productSri?: number;
  /** Maturite produit en annees — resserre l'horizon acceptable. */
  productMinYears?: number;
  className?: string;
}

type DimensionSpec = {
  key: DimensionKey;
  icon: typeof BookOpen;
  tint: string;
  /** Valeurs du Target Market formatees pour affichage. */
  values: string[];
  /** Valeur du client selectionnee (ou tableau d'objectifs). */
  clientValue?: string[] | null;
};

// ─── Helpers de formatage ───────────────────────────────────────────────────

function formatKnowledge(values: TargetMarket['knowledge']): string[] {
  return values.map((v) => LABELS.knowledge[v]);
}
function formatExperience(values: TargetMarket['experience']): string[] {
  return values.map((v) => LABELS.experience[v]);
}
function formatLossCapacity(values: TargetMarket['lossCapacity']): string[] {
  return values.map((v) => LABELS.lossCapacity[v]);
}
function formatRiskTolerance(values: TargetMarket['riskTolerance']): string[] {
  return values.map((v) => LABELS.riskTolerance[v]);
}
function formatObjectives(values: TargetMarket['objectives']): string[] {
  return values.map((v) => LABELS.objectives[v]);
}
function formatHorizons(values: TargetMarket['horizons']): string[] {
  return values.map((v) => LABELS.horizons[v]);
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Bloc complet "Marche cible (Target Market PRIIPs)" affichant les six
 * dimensions du TM avec, le cas echeant, le score d'adequation du client
 * selectionne et l'etat par dimension (matchee / non matchee).
 */
export function TargetMarketBlock({
  productId,
  targetMarket,
  clientProfile,
  clientName,
  productSri,
  productMinYears,
  className,
}: TargetMarketBlockProps) {
  const tm = useMemo<TargetMarket>(
    () =>
      targetMarket
        ?? mockTargetMarketForProduct(productId, {
          ...(productSri != null ? { sri: productSri } : {}),
          ...(productMinYears != null ? { minYears: productMinYears } : {}),
        }),
    [productId, targetMarket, productSri, productMinYears],
  );

  const client = clientProfile ?? null;

  const result = useMemo(
    () => (client ? computeSuitability(tm, client) : null),
    [tm, client],
  );

  const dimensions: DimensionSpec[] = useMemo(
    () => [
      {
        key: 'knowledge',
        icon: BookOpen,
        tint: 'text-violet',
        values: formatKnowledge(tm.knowledge),
        clientValue: client ? [LABELS.knowledge[client.knowledge]] : null,
      },
      {
        key: 'experience',
        icon: Briefcase,
        tint: 'text-cobalt',
        values: formatExperience(tm.experience),
        clientValue: client ? [LABELS.experience[client.experience]] : null,
      },
      {
        key: 'lossCapacity',
        icon: Coins,
        tint: 'text-red',
        values: formatLossCapacity(tm.lossCapacity),
        clientValue: client ? [LABELS.lossCapacity[client.lossCapacity]] : null,
      },
      {
        key: 'riskTolerance',
        icon: Gauge,
        tint: 'text-gold',
        values: formatRiskTolerance(tm.riskTolerance),
        clientValue: client ? [LABELS.riskTolerance[client.riskTolerance]] : null,
      },
      {
        key: 'objectives',
        icon: TargetIcon,
        tint: 'text-teal',
        values: formatObjectives(tm.objectives),
        clientValue: client
          ? client.objectives.map((o) => LABELS.objectives[o])
          : null,
      },
      {
        key: 'horizon',
        icon: CalendarClock,
        tint: 'text-violet',
        values: formatHorizons(tm.horizons),
        clientValue: client ? [LABELS.horizons[client.horizon]] : null,
      },
    ],
    [tm, client],
  );

  return (
    <section
      aria-labelledby="target-market-title"
      className={cn(
        'rounded-2xl border border-border/60 bg-white dark:bg-white/5 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-border/50 bg-gradient-to-r from-violet/[0.04] to-teal/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10 text-violet"
          >
            <Users size={15} />
          </span>
          <div>
            <h3
              id="target-market-title"
              className="font-display text-sm font-bold text-ink"
            >
              Marché cible (Target Market PRIIPs)
            </h3>
            <p className="mt-0.5 text-[11px] font-body text-ink-3 leading-snug">
              Dimensions positives MiFID II définies par le producteur.
              {clientName ? ` Comparaison avec le profil de ${clientName}.` : ''}
            </p>
          </div>
        </div>
        {result && (
          <TargetMarketBadge result={result} />
        )}
      </header>

      {/* Grid des dimensions */}
      <div className="grid grid-cols-1 gap-2.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {dimensions.map((d) => (
          <DimensionCard
            key={d.key}
            spec={d}
            matchStatus={result ? result.dimensions[d.key].match : null}
          />
        ))}
      </div>

      {/* Footer pedagogique */}
      {result && (
        <footer className="border-t border-border/40 bg-surface-2/40 px-4 py-3 dark:bg-white/[0.02]">
          <p className="text-[10px] font-body text-ink-3 leading-relaxed">
            Le score d&apos;adéquation est calculé sur 6 dimensions pondérées
            équitablement (≈ 16,7 pts chacune). Un score ≥ 75% traduit une
            adéquation complète, entre 50% et 74% une adéquation partielle
            nécessitant une analyse complémentaire, et &lt; 50% un inadéquation
            manifeste. Cette information est indicative et ne remplace pas le
            questionnaire AMF ni l&apos;avis du CGP.
          </p>
        </footer>
      )}
    </section>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function DimensionCard({
  spec,
  matchStatus,
}: {
  spec: DimensionSpec;
  matchStatus: boolean | null;
}) {
  const Icon = spec.icon;

  const borderClass =
    matchStatus === true
      ? 'border-teal/30 bg-teal/[0.04]'
      : matchStatus === false
        ? 'border-red/30 bg-red/[0.04]'
        : 'border-border/60 bg-surface-2/30 dark:bg-white/[0.02]';

  const statusIcon =
    matchStatus === true ? (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal"
        aria-label={`Dimension ${DIMENSION_LABELS[spec.key]} alignée`}
      >
        <CheckCircle2 size={10} aria-hidden="true" /> Aligné
      </span>
    ) : matchStatus === false ? (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-red/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red"
        aria-label={`Dimension ${DIMENSION_LABELS[spec.key]} non alignée`}
      >
        <XCircle size={10} aria-hidden="true" /> Écart
      </span>
    ) : null;

  return (
    <article
      className={cn(
        'relative flex flex-col gap-2 rounded-xl border p-3 transition-colors',
        borderClass,
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={cn('shrink-0', spec.tint)} aria-hidden="true" />
          <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-ink-3">
            {DIMENSION_LABELS[spec.key]}
          </span>
        </div>
        {statusIcon}
      </header>

      <ul className="flex flex-wrap gap-1" aria-label={`Valeurs acceptées pour ${DIMENSION_LABELS[spec.key]}`}>
        {spec.values.map((v) => {
          const highlighted = spec.clientValue?.includes(v) ?? false;
          return (
            <li key={v}>
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-body',
                  highlighted
                    ? 'border-violet/40 bg-violet/10 text-violet font-semibold'
                    : 'border-border/60 bg-white text-ink-2 dark:bg-white/5 dark:text-ink-2',
                )}
              >
                {v}
              </span>
            </li>
          );
        })}
      </ul>

      {spec.clientValue && spec.clientValue.length > 0 && (
        <p className="mt-0.5 text-[10px] font-body text-ink-3">
          <span className="font-semibold text-ink-2">Client : </span>
          <span className="font-mono tabular-nums">
            {spec.clientValue.join(', ')}
          </span>
        </p>
      )}
    </article>
  );
}

// ─── Export utilitaires ─────────────────────────────────────────────────────

export { DEFAULT_CLIENT_PROFILE };

export default TargetMarketBlock;
