'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Radio,
  Send,
  Loader2,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Building2,
  Zap,
  History,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRfqHistoryStore, type RfqSnapshot } from '@/stores/rfq-history-store';
import type { PricingResponse } from '@/lib/issuers/IssuerPricingAdapter';

// ─── Local types ────────────────────────────────────────────────────────────

type ProductType =
  | 'AUTOCALL_PHOENIX'
  | 'AUTOCALL_COUPON'
  | 'CAPITAL_PROTECTED'
  | 'CONDITIONAL_RATE'
  | 'BARRIER_NOTE';

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'AUTOCALL_PHOENIX', label: 'Autocall Phoenix' },
  { value: 'AUTOCALL_COUPON', label: 'Autocall Coupon' },
  { value: 'CAPITAL_PROTECTED', label: 'Capital protégé' },
  { value: 'CONDITIONAL_RATE', label: 'Taux conditionnel' },
  { value: 'BARRIER_NOTE', label: 'Barrier Note' },
];

const UNDERLYINGS = [
  { ticker: '^STOXX50E', label: 'Euro Stoxx 50' },
  { ticker: '^FCHI', label: 'CAC 40' },
  { ticker: '^GDAXI', label: 'DAX' },
  { ticker: '^GSPC', label: 'S&P 500' },
  { ticker: 'BNP.PA', label: 'BNP Paribas' },
  { ticker: 'SAN.PA', label: 'Sanofi' },
];

const ISSUER_COLORS: Record<string, string> = {
  BNP: '#009E60',
  SG: '#E60028',
  NATX: '#8B27B7',
  GS: '#7B6FA0',
  MRX: '#1F4788',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtPct(v: number, digits = 2) {
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtLatency(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface LiveRfqDispatcherProps {
  className?: string;
}

export function LiveRfqDispatcher({ className }: LiveRfqDispatcherProps) {
  const snapshots = useRfqHistoryStore((s) => s.snapshots);
  const addSnapshot = useRfqHistoryStore((s) => s.add);
  const getPreviousCoupon = useRfqHistoryStore((s) => s.getPreviousCoupon);
  const clearHistory = useRfqHistoryStore((s) => s.clear);

  // Form state
  const [productType, setProductType] = useState<ProductType>('AUTOCALL_PHOENIX');
  const [underlying, setUnderlying] = useState<string>('^STOXX50E');
  const [notional, setNotional] = useState<number>(1_000_000);
  const [maturityYears, setMaturityYears] = useState<number>(5);
  const [barrier, setBarrier] = useState<number>(0.6);
  const [targetCoupon, setTargetCoupon] = useState<string>('');

  // Live dispatch state
  const [isDispatching, setIsDispatching] = useState(false);
  const [responses, setResponses] = useState<PricingResponse[]>([]);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleDispatch = async () => {
    setErrorMsg(null);
    setResponses([]);
    setIsDispatching(true);
    setCurrentSnapshotId(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const request = {
      productType,
      underlying,
      notional,
      maturityYears,
      targetCoupon: targetCoupon ? Number(targetCoupon) / 100 : undefined,
      barrier,
    };

    try {
      const res = await fetch('/api/rfq/dispatch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { responses: PricingResponse[] };
      setResponses(data.responses);

      const snap = addSnapshot({
        request,
        responses: data.responses,
      });
      setCurrentSnapshotId(snap.id);
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsDispatching(false);
    }
  };

  const bestCoupon = useMemo(() => {
    const success = responses.filter((r) => r.status === 'success');
    if (success.length === 0) return null;
    return Math.max(...success.map((r) => r.indicativeCoupon));
  }, [responses]);

  const recentSnapshots = snapshots.slice(0, 5);

  return (
    <div className={cn('space-y-5', className)}>
      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-80"
          style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4, #3D63F5)' }}
        />
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B1FA8] to-[#5B3FD4] flex items-center justify-center shadow-md shadow-violet/20">
              <Radio size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">Consultation live</h3>
              <p className="text-[11px] font-body text-ink-3">
                Dispatch parallèle vers 5 émetteurs mocks · réponse en ~1.5-3.5s
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Field label="Type de produit">
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="premium-input"
                disabled={isDispatching}
              >
                {PRODUCT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Sous-jacent">
              <select
                value={underlying}
                onChange={(e) => setUnderlying(e.target.value)}
                className="premium-input"
                disabled={isDispatching}
              >
                {UNDERLYINGS.map((u) => (
                  <option key={u.ticker} value={u.ticker}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nominal (EUR)">
              <input
                type="number"
                value={notional}
                onChange={(e) => setNotional(Number(e.target.value))}
                className="premium-input"
                min={100_000}
                step={100_000}
                disabled={isDispatching}
              />
            </Field>

            <Field label="Maturité (années)">
              <input
                type="number"
                value={maturityYears}
                onChange={(e) => setMaturityYears(Number(e.target.value))}
                className="premium-input"
                min={1}
                max={15}
                step={0.5}
                disabled={isDispatching}
              />
            </Field>

            <Field label="Barrière (%)">
              <input
                type="number"
                value={(barrier * 100).toFixed(0)}
                onChange={(e) => setBarrier(Math.max(0, Math.min(1, Number(e.target.value) / 100)))}
                className="premium-input"
                min={10}
                max={100}
                step={5}
                disabled={isDispatching}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Field label="Coupon cible (% optionnel)" inline>
                <input
                  type="number"
                  value={targetCoupon}
                  onChange={(e) => setTargetCoupon(e.target.value)}
                  className="premium-input w-28"
                  placeholder="ex: 8.00"
                  step="0.1"
                  disabled={isDispatching}
                />
              </Field>
            </div>

            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className={cn(
                'h-11 px-6 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
                'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
                'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              )}
            >
              {isDispatching ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Consultation en cours
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Lancer la consultation
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red/5 border border-red/20 rounded-lg text-[12px] font-body text-red flex items-center gap-2">
              <XCircle size={14} />
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Responses ─────────────────────────────────────────────────────── */}
      {(isDispatching || responses.length > 0) && (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#3B1FA8]" />
              <h3 className="font-display text-sm font-bold text-ink">
                Cotations émetteurs ({responses.length}/5)
              </h3>
            </div>
            {bestCoupon != null && (
              <span className="text-[11px] font-body font-semibold text-ink-2 bg-[#D4A017]/10 border border-[#D4A017]/20 px-3 py-1 rounded-full">
                Meilleur coupon · {fmtPct(bestCoupon)}
              </span>
            )}
          </div>

          <div className="divide-y divide-border/30">
            {isDispatching && responses.length === 0 && (
              <div className="p-6 flex items-center justify-center gap-2 text-ink-3 font-body text-sm">
                <Loader2 size={16} className="animate-spin text-violet" />
                Envoi aux émetteurs...
              </div>
            )}

            {responses.map((response) => (
              <IssuerRow
                key={response.requestId}
                response={response}
                isBest={response.status === 'success' && response.indicativeCoupon === bestCoupon}
                previousCoupon={getPreviousCoupon(
                  response.issuerShort,
                  underlying,
                  currentSnapshotId ?? undefined,
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────────── */}
      {recentSnapshots.length > 0 && (
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[#3B1FA8]" />
              <h3 className="font-display text-sm font-bold text-ink">
                Historique ({snapshots.length})
              </h3>
            </div>
            <button
              onClick={clearHistory}
              className="text-[11px] font-body font-medium text-ink-3 hover:text-red transition-colors"
            >
              Effacer
            </button>
          </div>
          <div className="divide-y divide-border/30">
            {recentSnapshots.map((snap) => (
              <HistoryRow key={snap.id} snapshot={snap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Field({
  label,
  children,
  inline,
}: {
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', inline && 'flex-row items-center gap-2')}>
      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body">
        {label}
      </label>
      {children}
    </div>
  );
}

function IssuerRow({
  response,
  isBest,
  previousCoupon,
}: {
  response: PricingResponse;
  isBest: boolean;
  previousCoupon: number | null;
}) {
  const color = ISSUER_COLORS[response.issuerShort] ?? '#3B1FA8';
  const isSuccess = response.status === 'success';

  // Price trend vs previous coupon
  const trend = previousCoupon != null && isSuccess
    ? response.indicativeCoupon > previousCoupon + 0.0001
      ? 'up'
      : response.indicativeCoupon < previousCoupon - 0.0001
        ? 'down'
        : 'flat'
    : null;

  const trendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? '#00B894' : trend === 'down' ? '#E8334A' : '#7B6FA0';
  const trendDelta =
    previousCoupon != null && isSuccess ? (response.indicativeCoupon - previousCoupon) * 10000 : null;

  return (
    <div
      className={cn(
        'px-6 py-4 grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 transition-colors',
        isBest && 'bg-[#D4A017]/5',
        response.status === 'error' && 'opacity-60',
        response.status === 'timeout' && 'opacity-70',
      )}
    >
      {/* Issuer badge */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 font-display font-bold text-[11px] text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
      >
        {response.issuerShort}
      </div>

      {/* Issuer info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-body text-[13px] font-bold text-ink">{response.issuer}</span>
          {isBest && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#9B7210] bg-[#FDF3D6] border border-[#F0D98A] rounded-full px-2 py-0.5">
              <Trophy size={10} />
              Meilleur coupon
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px] font-body text-ink-3">
          <StatusPill status={response.status} />
          <span className="font-mono text-[10px]">{response.requestId}</span>
        </div>
      </div>

      {/* Coupon */}
      <div className="text-right">
        <div className="text-[10px] uppercase font-body font-bold text-ink-3 tracking-[0.15em]">
          Coupon
        </div>
        <div
          className={cn(
            'font-display text-xl font-extrabold',
            isBest ? 'text-[#3B1FA8]' : isSuccess ? 'text-ink' : 'text-ink-3',
          )}
        >
          {isSuccess ? fmtPct(response.indicativeCoupon) : '—'}
        </div>
        {trend && trendDelta != null && Math.abs(trendDelta) > 0 && (
          <div
            className="inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold font-body"
            style={{ color: trendColor }}
            title="Tendance vs cotation précédente"
          >
            {(() => {
              const TrendIcon = trendIcon;
              return <TrendIcon size={10} />;
            })()}
            {trendDelta > 0 ? '+' : ''}
            {trendDelta.toFixed(0)}bps
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-right">
        <div className="text-[10px] uppercase font-body font-bold text-ink-3 tracking-[0.15em]">
          Prix
        </div>
        <div
          className={cn(
            'font-display text-base font-bold',
            isSuccess ? 'text-ink' : 'text-ink-3',
          )}
        >
          {isSuccess ? response.indicativePrice.toFixed(2) : '—'}
        </div>
      </div>

      {/* Latency */}
      <div className="text-right">
        <div className="text-[10px] uppercase font-body font-bold text-ink-3 tracking-[0.15em]">
          Latence
        </div>
        <span
          className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold',
            response.latencyMs < 2000
              ? 'bg-[#D6F7EF] text-[#007A63] border border-[#A3EDD9]'
              : response.latencyMs < 3000
                ? 'bg-[#FDF3D6] text-[#9B7210] border border-[#F0D98A]'
                : 'bg-[#FDE8EB] text-red border border-[#F8B4BC]',
          )}
        >
          {fmtLatency(response.latencyMs)}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: 'success' | 'timeout' | 'error' }) {
  const config: Record<typeof status, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    success: {
      label: 'OK',
      className: 'bg-[#D6F7EF] text-[#007A63] border-[#A3EDD9]',
      icon: CheckCircle2,
    },
    timeout: {
      label: 'Timeout',
      className: 'bg-[#FDF3D6] text-[#9B7210] border-[#F0D98A]',
      icon: Clock,
    },
    error: {
      label: 'Erreur',
      className: 'bg-[#FDE8EB] text-red border-[#F8B4BC]',
      icon: XCircle,
    },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-bold border',
        c.className,
      )}
    >
      <Icon size={9} />
      {c.label}
    </span>
  );
}

function HistoryRow({ snapshot }: { snapshot: RfqSnapshot }) {
  const successCount = snapshot.responses.filter((r) => r.status === 'success').length;
  const bestCoupon = snapshot.responses
    .filter((r) => r.status === 'success')
    .reduce((best, r) => Math.max(best, r.indicativeCoupon), 0);
  const avgLatency =
    snapshot.responses.reduce((sum, r) => sum + r.latencyMs, 0) / snapshot.responses.length;

  return (
    <div className="px-6 py-3 grid grid-cols-4 gap-4 items-center text-[12px] font-body">
      <div>
        <div className="font-mono text-[10px] text-ink-3">
          {new Date(snapshot.createdAt).toLocaleTimeString('fr-FR')}
        </div>
        <div className="text-ink font-medium">
          {snapshot.request.underlying} · {snapshot.request.maturityYears}y
        </div>
      </div>
      <div>
        <span className="text-ink-3 text-[10px] uppercase tracking-wider font-semibold block">
          Réponses
        </span>
        <span className="text-ink font-semibold">
          {successCount}/{snapshot.responses.length}
        </span>
      </div>
      <div>
        <span className="text-ink-3 text-[10px] uppercase tracking-wider font-semibold block">
          Meilleur
        </span>
        <span className="text-ink font-semibold">
          {bestCoupon > 0 ? fmtPct(bestCoupon) : '—'}
        </span>
      </div>
      <div>
        <span className="text-ink-3 text-[10px] uppercase tracking-wider font-semibold block">
          Latence moy.
        </span>
        <span className="text-ink font-semibold">{fmtLatency(Math.round(avgLatency))}</span>
      </div>
    </div>
  );
}
