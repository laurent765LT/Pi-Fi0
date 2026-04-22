'use client';

import { useMemo } from 'react';
import {
  Leaf,
  Users,
  Scale,
  ShieldCheck,
  Flame,
  Info,
  CircleOff,
} from 'lucide-react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/cn';
import { mockESGForProduct } from '@/lib/esg/scoring-engine';
import {
  EXCLUSION_LABELS,
  SFDR_LABELS,
  getScoreLevel,
  type ESGData,
  type ExclusionKey,
} from '@/lib/esg/sfdr-schema';

interface ESGDetailBlockProps {
  productId: string;
  className?: string;
  id?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#00B894';
  if (score >= 60) return '#2D7A4E';
  if (score >= 40) return '#D4A017';
  return '#E8334A';
}

function scoreLabel(score: number): string {
  const level = getScoreLevel(score);
  return {
    excellent: 'Excellent',
    good: 'Bon',
    average: 'Moyen',
    low: 'Faible',
  }[level];
}

function SubScoreBar({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  const color = scoreColor(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-3 dark:text-white/50 font-semibold font-body">
          <Icon size={12} style={{ color }} />
          {label}
        </span>
        <span
          className="font-mono text-[13px] font-bold tabular-nums"
          style={{ color }}
        >
          {value}
          <span className="opacity-50 text-[10px] ml-0.5">/100</span>
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2 dark:bg-white/10"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={`${label} ${value} sur 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

function OverallScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const data = [{ name: 'score', value: score, fill: color }];
  return (
    <div className="relative w-[160px] h-[160px]" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: 'rgba(125, 117, 164, 0.12)' }}
            dataKey="value"
            cornerRadius={8}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-display text-[38px] font-extrabold tabular-nums leading-none"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-3 dark:text-white/50 mt-1">
          sur 100
        </span>
      </div>
    </div>
  );
}

export function ESGDetailBlock({ productId, className, id }: ESGDetailBlockProps) {
  const esg: ESGData = useMemo(() => mockESGForProduct(productId), [productId]);
  const sfdrInfo = SFDR_LABELS[esg.sfdr];
  const overallColor = scoreColor(esg.overallScore);

  const isEsgProduct = esg.sfdr === 'art8' || esg.sfdr === 'art9';

  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-border/60 dark:border-white/10',
        'bg-white dark:bg-white/[0.04] shadow-sm overflow-hidden',
        'scroll-mt-6',
        className,
      )}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 dark:border-white/8"
        style={{
          background: isEsgProduct
            ? 'linear-gradient(135deg, rgba(0,184,148,0.06) 0%, rgba(59,31,168,0.04) 100%)'
            : 'linear-gradient(135deg, rgba(125,117,164,0.04) 0%, rgba(59,31,168,0.03) 100%)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: isEsgProduct
                ? 'linear-gradient(135deg, #00B894, #008B6E)'
                : 'linear-gradient(135deg, #A8A59E, #7B6FA0)',
            }}
          >
            <Leaf size={15} className="text-white" fill="currentColor" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h3
              id={id ? `${id}-title` : undefined}
              className="font-display text-sm font-bold text-ink dark:text-white flex items-center gap-1.5"
            >
              Profil ESG
              <span className="text-[9px] font-body font-semibold uppercase tracking-widest text-ink-3 dark:text-white/40">
                (donn\u00e9es estim\u00e9es)
              </span>
            </h3>
            <p className="text-[11px] text-ink-3 dark:text-white/50 font-body truncate">
              Durabilit\u00e9, gouvernance et classification r\u00e9glementaire SFDR.
            </p>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold font-body shrink-0"
          style={{
            backgroundColor: `${sfdrInfo.color}1A`,
            color: sfdrInfo.color,
            border: `1px solid ${sfdrInfo.color}33`,
          }}
          title={sfdrInfo.fullLabel}
        >
          SFDR {sfdrInfo.label}
        </span>
      </header>

      {/* Body */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-5 p-4 sm:p-5">
        {/* Overall score */}
        <div className="flex flex-col items-center gap-2">
          <OverallScoreGauge score={esg.overallScore} />
          <p className="font-body text-xs text-ink-3 dark:text-white/50">
            Score global :{' '}
            <span className="font-semibold tabular-nums" style={{ color: overallColor }}>
              {scoreLabel(esg.overallScore)}
            </span>
          </p>
          <p className="text-[10px] font-body text-ink-3 dark:text-white/40 max-w-[200px] text-center leading-relaxed">
            Moyenne pond\u00e9r\u00e9e des piliers Environnement, Social et Gouvernance.
          </p>
        </div>

        {/* Sub-scores + indicators */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SubScoreBar label="Environnement" value={esg.subScores.environment} icon={Leaf} />
            <SubScoreBar label="Social" value={esg.subScores.social} icon={Users} />
            <SubScoreBar label="Gouvernance" value={esg.subScores.governance} icon={Scale} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IndicatorCard
              label="Alignement Taxonomie EU"
              value={`${esg.taxonomyAlignment}%`}
              tone={esg.taxonomyAlignment >= 50 ? 'positive' : esg.taxonomyAlignment >= 25 ? 'neutral' : 'negative'}
              icon={ShieldCheck}
              description="Part des activit\u00e9s align\u00e9es avec la Taxonomie europ\u00e9enne."
            />
            <IndicatorCard
              label="Exposition \u00e9nergies fossiles"
              value={`${esg.fossilFuelExposure}%`}
              tone={esg.fossilFuelExposure <= 10 ? 'positive' : esg.fossilFuelExposure <= 25 ? 'neutral' : 'negative'}
              icon={Flame}
              description="Part du sous-jacent expos\u00e9e aux \u00e9nergies fossiles."
              inverted
            />
          </div>

          {/* Exclusions */}
          <div className="rounded-xl border border-border/60 dark:border-white/10 bg-surface-2/40 dark:bg-white/[0.02] p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] uppercase tracking-widest text-ink-3 dark:text-white/50 font-semibold font-body inline-flex items-center gap-1.5">
                <CircleOff size={12} className="text-red" />
                Exclusions sectorielles
              </h4>
              <span className="text-[10px] font-mono tabular-nums text-ink-3 dark:text-white/40">
                {esg.exclusions.length} exclusion{esg.exclusions.length > 1 ? 's' : ''}
              </span>
            </div>
            {esg.exclusions.length === 0 ? (
              <p className="text-[11px] text-ink-3 dark:text-white/45 font-body italic flex items-center gap-1.5">
                <Info size={11} />
                Aucune exclusion d\u00e9clar\u00e9e pour ce produit.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5" aria-label="Liste des exclusions sectorielles">
                {esg.exclusions.map((ex: ExclusionKey) => (
                  <li
                    key={ex}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold font-body',
                      'bg-red/10 text-[#C41F36] dark:bg-red/20 dark:text-[#FF8090]',
                      'border border-red/15 dark:border-red/20',
                    )}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-red"
                      aria-hidden
                    />
                    {EXCLUSION_LABELS[ex]}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <footer className="px-4 pb-3 sm:px-5 sm:pb-4">
        <p className="text-[9px] font-body text-ink-3/70 dark:text-white/35 leading-relaxed italic">
          Ces indicateurs ESG sont \u00e9tabli\u00e9s \u00e0 partir de donn\u00e9es publiques et mod\u00e9lis\u00e9s
          par Strick&apos;in \u00e0 titre p\u00e9dagogique. Ils ne constituent pas une classification
          officielle et ne remplacent pas le Document d&apos;Informations Cl\u00e9s du produit.
        </p>
      </footer>
    </section>
  );
}

function IndicatorCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  inverted = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  tone: 'positive' | 'neutral' | 'negative';
  inverted?: boolean;
}) {
  const palettes = {
    positive: { bg: 'bg-teal/10 dark:bg-teal/15', text: 'text-[#008B6E] dark:text-[#00D4AA]', border: 'border-teal/25' },
    neutral: { bg: 'bg-gold-light dark:bg-gold/10', text: 'text-[#A07800] dark:text-gold', border: 'border-gold/25' },
    negative: { bg: 'bg-red-light dark:bg-red/10', text: 'text-[#C41F36] dark:text-[#FF8090]', border: 'border-red/25' },
  } as const;
  const palette = palettes[tone];
  return (
    <div className={cn('rounded-xl border p-3 flex flex-col gap-1', palette.bg, palette.border)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-3 dark:text-white/50 font-semibold font-body">
          <Icon size={12} className={palette.text} />
          {label}
        </span>
        <span className={cn('font-mono text-[14px] font-bold tabular-nums', palette.text)}>
          {value}
          {inverted && tone === 'positive' && (
            <span className="ml-1 text-[9px] uppercase font-body opacity-70">faible</span>
          )}
        </span>
      </div>
      <p className="text-[10px] text-ink-3 dark:text-white/45 font-body leading-relaxed">
        {description}
      </p>
    </div>
  );
}
