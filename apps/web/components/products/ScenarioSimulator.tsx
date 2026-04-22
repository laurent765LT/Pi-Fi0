'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Gamepad2, Download, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  SCENARIO_PRESETS,
  simulatePresets,
  simulateScenario,
  type ScenarioPresetKey,
  type ScenarioProductInput,
  type ScenarioResult,
} from '@/lib/pricing/monte-carlo-light';
import { ScenarioSlider } from './ScenarioSlider';

interface ScenarioSimulatorProps {
  product: {
    id?: string;
    name?: string;
    isin?: string;
    couponPct?: number | null;
    barrierCapPct?: number | null;
    autocallBarrierPct?: number | null;
    maturityDate?: string;
    sri?: number;
  };
  className?: string;
  /** Optional investment baseline used for €-denominated metrics. Default: 100 000 €. */
  investBase?: number;
}

function yearsUntil(iso?: string): number {
  if (!iso) return 5;
  const years = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);
  return Math.max(0.5, Math.min(15, years));
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPct(n: number, digits = 1): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

function toneFromMove(value: number): 'positive' | 'neutral' | 'negative' {
  if (value <= -15) return 'negative';
  if (value >= 10) return 'positive';
  return 'neutral';
}

export function ScenarioSimulator({ product, className, investBase = 100_000 }: ScenarioSimulatorProps) {
  const reduced = usePrefersReducedMotion();
  const [spotMove, setSpotMove] = useState<number>(0);
  const [, startTransition] = useTransition();

  // Signed product input — derived from the incoming product shape.
  const productInput: ScenarioProductInput = useMemo(
    () => ({
      couponPct: product.couponPct ?? 0,
      barrierPct: product.barrierCapPct ?? 50,
      maturityYears: yearsUntil(product.maturityDate),
      sri: product.sri ?? 4,
      autocallBarrierPct: product.autocallBarrierPct ?? null,
    }),
    [product.couponPct, product.barrierCapPct, product.maturityDate, product.sri, product.autocallBarrierPct],
  );

  // Scale metrics to the user's invest base. monte-carlo-light returns €/100k.
  const scale = investBase / 100_000;

  const [result, setResult] = useState<ScenarioResult>(() => simulateScenario(productInput, 0));

  // Recompute with useTransition so slider stays responsive.
  useEffect(() => {
    startTransition(() => {
      setResult(simulateScenario(productInput, spotMove));
    });
  }, [spotMove, productInput]);

  const presets = useMemo(() => simulatePresets(productInput), [productInput]);

  const handlePreset = (key: ScenarioPresetKey) => {
    const preset = SCENARIO_PRESETS.find((p) => p.key === key);
    if (preset) setSpotMove(preset.spotMove);
  };

  const handleExport = () => {
    const productName = product.name ?? 'Produit structur\u00e9';
    const isin = product.isin ?? '';
    const rows = SCENARIO_PRESETS.map((p) => {
      const r = presets[p.key];
      return {
        label: p.label,
        spot: p.spotMove,
        value: r.productValue.toFixed(1),
        autocall: r.autocallProbability.toFixed(0),
        coupon: Math.round(r.expectedCoupon * scale),
        loss: Math.round(r.capitalLoss * scale),
        barrier: r.barrierBreached ? 'Oui' : 'Non',
      };
    });

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${productName} — Simulateur de sc\u00e9narios</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 32px; max-width: 820px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px 0; color: #3B1FA8; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 18px; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; margin-right: 6px; background: #EDE8FF; color: #3B1FA8; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; }
  th, td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #ececf2; text-align: left; }
  th { background: #F7F5FF; color: #3B1FA8; text-transform: uppercase; font-size: 10px; letter-spacing: 1.5px; }
  td.num { font-family: 'JetBrains Mono', ui-monospace, monospace; text-align: right; }
  td.breach { color: #C41F36; font-weight: 600; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; line-height: 1.5; }
  .bar { height: 3px; background: linear-gradient(90deg, #3B1FA8, #5535C4, #00B894); border-radius: 2px; margin-bottom: 14px; }
</style>
</head>
<body>
<div class="bar"></div>
<h1>${productName} — Simulateur de sc\u00e9narios</h1>
<div class="subtitle">${isin ? `ISIN ${isin} &middot; ` : ''}Horizon ${productInput.maturityYears.toFixed(1)} an(s) &middot; SRI ${productInput.sri}/7</div>
<span class="pill">Barri\u00e8re ${productInput.barrierPct}%</span>
${productInput.autocallBarrierPct != null ? `<span class="pill">Autocall ${productInput.autocallBarrierPct}%</span>` : ''}
${productInput.couponPct > 0 ? `<span class="pill">Coupon ${productInput.couponPct.toFixed(2)}%</span>` : ''}

<table>
  <thead>
    <tr>
      <th>Sc\u00e9nario</th>
      <th>Choc spot</th>
      <th>Valeur estim.</th>
      <th>Proba. autocall</th>
      <th>Coupon attendu</th>
      <th>Perte potentielle</th>
      <th>Barri\u00e8re touch\u00e9e</th>
    </tr>
  </thead>
  <tbody>
    ${rows
      .map(
        (r) => `
      <tr>
        <td><strong>${r.label}</strong></td>
        <td class="num">${r.spot >= 0 ? '+' : ''}${r.spot}%</td>
        <td class="num">${r.value}%</td>
        <td class="num">${r.autocall}%</td>
        <td class="num">${new Intl.NumberFormat('fr-FR').format(r.coupon)} \u20ac</td>
        <td class="num">${new Intl.NumberFormat('fr-FR').format(r.loss)} \u20ac</td>
        <td class="${r.barrier === 'Oui' ? 'breach' : ''}">${r.barrier}</td>
      </tr>`,
      )
      .join('')}
  </tbody>
</table>

<div class="footer">
  Simulation r\u00e9alis\u00e9e par Strick&apos;in le ${new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}.<br/>
  Base d&apos;investissement : ${new Intl.NumberFormat('fr-FR').format(investBase)} \u20ac &middot;
  Simulation Monte Carlo l\u00e9g\u00e8re (1000 trajectoires, GBM, volatilit\u00e9 d\u00e9duite du SRI).<br/>
  Les r\u00e9sultats sont indicatifs et ne constituent pas un conseil en investissement.
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (product.name ?? 'scenarios').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.href = url;
    a.download = `${safeName}_scenarios.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const productValueEuro = (result.productValue / 100) * investBase;
  const lossEuro = Math.round(result.capitalLoss * scale);
  const couponEuro = Math.round(result.expectedCoupon * scale);
  const tone = toneFromMove(spotMove);

  return (
    <section
      className={cn(
        'rounded-2xl border border-border/60 dark:border-white/10 bg-white dark:bg-white/[0.04] shadow-sm overflow-hidden',
        className,
      )}
      aria-labelledby="scenario-simulator-title"
    >
      {/* Header */}
      <header
        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 dark:border-white/8"
        style={{
          background: 'linear-gradient(135deg, rgba(59,31,168,0.08) 0%, rgba(61,99,245,0.05) 100%)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-cobalt flex items-center justify-center shadow-sm">
            <Gamepad2 size={16} className="text-white" aria-hidden />
          </span>
          <div>
            <h3 id="scenario-simulator-title" className="font-display text-sm font-bold text-ink dark:text-white">
              Simulateur de sc\u00e9narios
            </h3>
            <p className="text-[11px] text-ink-3 dark:text-white/45 font-body">
              Simulez l&apos;\u00e9volution du produit selon diff\u00e9rents sc\u00e9narios de march\u00e9.
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold font-body',
            'border-violet/30 bg-white/70 dark:bg-white/5 text-violet dark:text-violet-light',
            'transition-colors hover:bg-violet/10 hover:border-violet/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet/30',
          )}
        >
          <Download size={12} />
          Exporter les sc\u00e9narios
        </button>
      </header>

      {/* Preset buttons */}
      <div className="px-4 pt-4 flex flex-wrap gap-1.5">
        {SCENARIO_PRESETS.map((preset) => {
          const isActive = Math.abs(preset.spotMove - spotMove) < 0.5;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePreset(preset.key)}
              aria-pressed={isActive}
              title={preset.description}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold font-body transition-all duration-200',
                isActive
                  ? 'bg-violet text-white border-violet shadow-sm'
                  : 'border-border/60 dark:border-white/10 bg-white dark:bg-white/5 text-ink-2 dark:text-white/70 hover:border-violet/40 hover:text-violet dark:hover:text-violet-light',
              )}
            >
              {preset.key === 'stress' && <AlertTriangle size={11} />}
              {preset.key === 'baisse' && <TrendingDown size={11} />}
              {preset.key === 'stable' && <Minus size={11} />}
              {preset.key === 'hausse' && <TrendingUp size={11} />}
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Slider */}
      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-ink-3 dark:text-white/50 font-semibold font-body">
            Variation du sous-jacent
          </span>
          <span
            className={cn(
              'font-display text-lg font-extrabold tabular-nums',
              tone === 'positive' ? 'text-teal' : tone === 'negative' ? 'text-red' : 'text-ink dark:text-white',
            )}
            aria-live="polite"
          >
            {formatPct(spotMove, 0)}
          </span>
        </div>
        <ScenarioSlider
          value={spotMove}
          onChange={setSpotMove}
          barrier={productInput.barrierPct}
          autocall={productInput.autocallBarrierPct != null ? productInput.autocallBarrierPct - 100 : null}
        />
      </div>

      {/* Result grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
        {/* Big product value */}
        <div
          className={cn(
            'rounded-xl border p-4 flex flex-col gap-2',
            result.barrierBreached
              ? 'border-red/40 bg-red/5 dark:bg-red/10'
              : 'border-violet/30 bg-violet-ghost dark:bg-violet/10',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-ink-3 dark:text-white/50 font-body">
              Valeur du produit
            </span>
            {result.barrierBreached ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red text-white text-[9px] font-bold px-2 py-[1px] uppercase tracking-wider">
                <AlertTriangle size={10} /> Barri\u00e8re
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 text-teal text-[9px] font-bold px-2 py-[1px] uppercase tracking-wider">
                <Zap size={10} /> Prot\u00e9g\u00e9
              </span>
            )}
          </div>
          <p
            className={cn(
              'font-display text-[40px] font-extrabold leading-none tabular-nums',
              result.barrierBreached ? 'text-red' : 'text-violet dark:text-violet-light',
              !reduced && 'transition-[color,opacity] duration-300',
            )}
            aria-live="polite"
          >
            {result.productValue.toFixed(1)}
            <span className="text-[18px] font-bold opacity-50 ml-1">%</span>
          </p>
          <p className="text-[11px] font-body text-ink-3 dark:text-white/50">
            Soit environ{' '}
            <span className="font-mono font-semibold text-ink dark:text-white tabular-nums">
              {formatEuro(productValueEuro)}
            </span>{' '}
            pour {formatEuro(investBase)} invest.
          </p>
        </div>

        {/* Autocall probability */}
        <MetricCard
          label="Probabilit\u00e9 d'autocall"
          helper="Au prochain point d'observation."
          value={`${result.autocallProbability.toFixed(0)}%`}
          tone={result.autocallProbability >= 50 ? 'positive' : 'neutral'}
          progress={result.autocallProbability}
        />

        {/* Expected coupon */}
        <MetricCard
          label="Coupon attendu"
          helper={`Pour ${formatEuro(investBase)} invest.`}
          value={formatEuro(couponEuro)}
          tone={couponEuro > 0 ? 'positive' : 'neutral'}
        />

        {/* Capital loss */}
        <MetricCard
          label="Perte potentielle"
          helper="Estimation moyenne sur 1000 trajectoires."
          value={formatEuro(lossEuro)}
          tone={lossEuro > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Disclaimer */}
      <footer className="px-4 pb-3">
        <p className="text-[9px] font-body text-ink-3/70 dark:text-white/35 italic leading-relaxed">
          Simulation p\u00e9dagogique par Monte Carlo (1000 trajectoires, mouvement brownien g\u00e9om\u00e9trique,
          volatilit\u00e9 d\u00e9duite du SRI, taux sans risque 3 %). Les r\u00e9sultats sont indicatifs et ne
          pr\u00e9jugent pas des performances futures. Avant toute souscription, consultez le KID/PRIIPS.
        </p>
      </footer>
    </section>
  );
}

function MetricCard({
  label,
  helper,
  value,
  tone,
  progress,
}: {
  label: string;
  helper?: string;
  value: string;
  tone: 'positive' | 'neutral' | 'negative';
  progress?: number;
}) {
  const toneColor = {
    positive: 'text-teal dark:text-[#00D4AA]',
    neutral: 'text-ink dark:text-white',
    negative: 'text-red dark:text-[#FF8090]',
  }[tone];
  const barColor = {
    positive: 'from-teal/80 to-teal',
    neutral: 'from-violet/60 to-violet',
    negative: 'from-red/80 to-red',
  }[tone];
  return (
    <div className="rounded-xl border border-border/60 dark:border-white/10 bg-surface-2/50 dark:bg-white/[0.02] p-4 flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-3 dark:text-white/50 font-body">
        {label}
      </span>
      <span
        className={cn('font-display text-[24px] font-extrabold leading-none tabular-nums transition-colors', toneColor)}
        aria-live="polite"
      >
        {value}
      </span>
      {helper && <span className="text-[10px] font-body text-ink-3 dark:text-white/40">{helper}</span>}
      {progress != null && (
        <div
          className="mt-1 h-1.5 w-full rounded-full bg-surface-3 dark:bg-white/10 overflow-hidden"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-300', barColor)}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
