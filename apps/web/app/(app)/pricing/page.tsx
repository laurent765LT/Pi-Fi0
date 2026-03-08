'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Calculator,
  History,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  Sliders,
  Clock,
  ArrowRight,
  Play,
  FileText,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity,
  Target,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePriceProduct, useValidatePricingConfig, useProductTemplates, usePricingHistory } from '@/hooks/use-pricing';

// ─── Types ───────────────────────────────────────────────────────────────────

const STRUCTURE_TYPES = [
  { value: 'AUTOCALL', label: 'Autocall' },
  { value: 'PHOENIX_AUTOCALL', label: 'Phoenix Autocall' },
  { value: 'MEMORY_COUPON', label: 'Memory Coupon' },
  { value: 'REVERSE_CONVERTIBLE', label: 'Reverse Convertible' },
  { value: 'CAPITAL_PROTECTED_NOTE', label: 'Capital Protégé' },
  { value: 'BARRIER_REVERSE_CONVERTIBLE', label: 'Barrier RC' },
  { value: 'CAPPED_PARTICIPATION', label: 'Participation Cappée' },
];

const COUPON_TYPES = [
  { value: 'NONE', label: 'Aucun' },
  { value: 'FIXED', label: 'Fixe' },
  { value: 'CONDITIONAL', label: 'Conditionnel' },
  { value: 'MEMORY', label: 'Mémoire' },
];

const BARRIER_TYPES = [
  { value: 'EUROPEAN', label: 'Européenne' },
  { value: 'CONTINUOUS', label: 'Continue' },
  { value: 'DAILY_CLOSE', label: 'Close journalier' },
];

const UNDERLYINGS = [
  { ticker: '^STOXX50E', name: 'Euro Stoxx 50', type: 'INDEX', spot: 5000, vol: 0.18, div: 0.025 },
  { ticker: '^FCHI', name: 'CAC 40', type: 'INDEX', spot: 7500, vol: 0.20, div: 0.028 },
  { ticker: '^GDAXI', name: 'DAX', type: 'INDEX', spot: 18000, vol: 0.17, div: 0.022 },
  { ticker: '^GSPC', name: 'S&P 500', type: 'INDEX', spot: 5200, vol: 0.15, div: 0.015 },
  { ticker: 'URTH', name: 'MSCI World', type: 'INDEX', spot: 130, vol: 0.15, div: 0.018 },
  { ticker: 'BNP.PA', name: 'BNP Paribas', type: 'SINGLE_STOCK', spot: 60, vol: 0.28, div: 0.06 },
  { ticker: 'SAN.PA', name: 'Sanofi', type: 'SINGLE_STOCK', spot: 95, vol: 0.22, div: 0.035 },
  { ticker: 'AAPL', name: 'Apple Inc', type: 'SINGLE_STOCK', spot: 190, vol: 0.25, div: 0.005 },
  { ticker: 'NVDA', name: 'NVIDIA', type: 'SINGLE_STOCK', spot: 500, vol: 0.45, div: 0.001 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [tab, setTab] = useState<'builder' | 'history'>('builder');
  const [step, setStep] = useState(0); // 0=structure, 1=payoff, 2=market, 3=results

  // Template
  const { data: templates } = useProductTemplates();

  // Pricing
  const priceProduct = usePriceProduct();
  const validateConfig = useValidatePricingConfig();
  const { data: historyData } = usePricingHistory(20, 0);

  // ── Form state ────────────────────────────────────────────────────────────
  const [structureType, setStructureType] = useState('PHOENIX_AUTOCALL');
  const [productName, setProductName] = useState('Mon Produit Structuré');
  const [currency, setCurrency] = useState('EUR');
  const [nominal, setNominal] = useState(1000000);
  const [selectedUnderlying, setSelectedUnderlying] = useState(0);

  // Schedule
  const today = new Date().toISOString().split('T')[0]!;
  const mat5y = new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0]!;
  const [strikeDate, setStrikeDate] = useState(today);
  const [maturityDate, setMaturityDate] = useState(mat5y);

  // Payoff
  const [couponType, setCouponType] = useState('CONDITIONAL');
  const [couponRate, setCouponRate] = useState(8);
  const [couponBarrier, setCouponBarrier] = useState(60);
  const [couponMemory, setCouponMemory] = useState(true);
  const [autocallEnabled, setAutocallEnabled] = useState(true);
  const [autocallBarrier, setAutocallBarrier] = useState(100);
  const [protectionBarrier, setProtectionBarrier] = useState(60);
  const [barrierMonitoring, setBarrierMonitoring] = useState('EUROPEAN');
  const [cap, setCap] = useState(0);
  const [participationUp, setParticipationUp] = useState(100);

  // Market
  const [riskFreeRate, setRiskFreeRate] = useState(3.0);
  const [fundingSpread, setFundingSpread] = useState(0.5);
  const [structuringMargin, setStructuringMargin] = useState(1.5);
  const [distributionFee, setDistributionFee] = useState(2.0);
  const [mcPaths, setMcPaths] = useState(10000);

  // Result
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // ── Build config ──────────────────────────────────────────────────────────
  const underlying = UNDERLYINGS[selectedUnderlying]!;

  const buildConfig = useCallback(() => ({
    productName,
    structureType,
    currency,
    nominalAmount: nominal,
    denomination: 1000,
    minimumSubscription: 1000,
    issuePriceTarget: 100,
    underlying: {
      ticker: underlying.ticker,
      name: underlying.name,
      type: underlying.type,
      currency: 'EUR',
      spot: underlying.spot,
      strikeLevel: underlying.spot,
      volatility: underlying.vol,
      dividendYield: underlying.div,
      repoOrBorrowCost: 0,
    },
    schedule: {
      tradeDate: strikeDate,
      pricingDate: strikeDate,
      issueDate: strikeDate,
      strikeDate,
      initialFixingDate: strikeDate,
      maturityDate,
      finalValuationDate: maturityDate,
      finalSettlementDate: maturityDate,
      couponObservationDates: [],
      couponPaymentDates: [],
      autocallObservationDates: [],
      autocallPaymentDates: [],
      dayCountConvention: 'ACT/365',
      businessDayConvention: 'MODIFIED_FOLLOWING',
    },
    payoff: {
      strike: 1.0,
      participationUp: participationUp / 100,
      participationDown: 1.0,
      couponType,
      couponRate: couponRate / 100,
      couponFrequency: 'QUARTERLY',
      couponBarrier: couponBarrier / 100,
      couponMemory,
      autocallEnabled,
      autocallBarrier: autocallBarrier / 100,
      autocallStepDown: [],
      protectionType: protectionBarrier > 0 ? 'BARRIER' : 'NONE',
      protectionBarrier: protectionBarrier / 100,
      capitalGuaranteeLevel: structureType === 'CAPITAL_PROTECTED_NOTE' ? 1.0 : 0,
      knockInLevel: protectionBarrier / 100,
      knockOutLevel: 0,
      barrierMonitoring,
      cap: cap / 100,
      floor: 0,
      digitalTrigger: 0,
      cashSettlement: true,
    },
    market: {
      riskFreeRate: riskFreeRate / 100,
      discountCurve: [riskFreeRate / 100],
      fundingSpread: fundingSpread / 100,
      issuerSpread: 0.01,
      structuringMargin: structuringMargin / 100,
      distributionFee: distributionFee / 100,
      executionCost: 0.005,
    },
    mcPaths,
    mcSeed: 42,
    observationFrequency: 'DAILY',
  }), [productName, structureType, currency, nominal, underlying, strikeDate, maturityDate, couponType, couponRate, couponBarrier, couponMemory, autocallEnabled, autocallBarrier, protectionBarrier, barrierMonitoring, cap, participationUp, riskFreeRate, fundingSpread, structuringMargin, distributionFee, mcPaths]);

  // ── Launch pricing ────────────────────────────────────────────────────────
  const handlePrice = async () => {
    const config = buildConfig();
    const valResult = await validateConfig.mutateAsync(config);
    setValidationErrors(valResult.errors);

    if (!valResult.valid) {
      setStep(3);
      return;
    }

    const result = await priceProduct.mutateAsync({ config, saveRun: true });
    setPricingResult(result);
    setValidationErrors(result.validation);
    setStep(3);
  };

  // ── Load template ─────────────────────────────────────────────────────────
  const loadTemplate = (tpl: any) => {
    const c = tpl.config;
    setStructureType(c.structureType);
    setProductName(tpl.name);
    setCurrency(c.currency);
    setNominal(c.nominalAmount);
    setCouponType(c.payoff.couponType);
    setCouponRate(c.payoff.couponRate * 100);
    setCouponBarrier(c.payoff.couponBarrier * 100);
    setCouponMemory(c.payoff.couponMemory);
    setAutocallEnabled(c.payoff.autocallEnabled);
    setAutocallBarrier(c.payoff.autocallBarrier * 100);
    setProtectionBarrier(c.payoff.protectionBarrier * 100);
    setBarrierMonitoring(c.payoff.barrierMonitoring);
    setCap(c.payoff.cap * 100);
    setParticipationUp(c.payoff.participationUp * 100);
    setRiskFreeRate(c.market.riskFreeRate * 100);
    setFundingSpread(c.market.fundingSpread * 100);
    setStructuringMargin(c.market.structuringMargin * 100);
    setDistributionFee(c.market.distributionFee * 100);
    setMcPaths(c.mcPaths);
  };

  const inputCls = cn(
    'w-full h-9 rounded-lg border border-border/80 bg-white px-3 text-[12px] font-body text-ink',
    'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet transition-all duration-150',
  );

  const selectCls = cn(inputCls, 'cursor-pointer');

  const labelCls = 'text-[10px] uppercase tracking-[0.2em] font-bold text-violet font-body';

  return (
    <div className="animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
          Pricing Engine
        </h1>
        <p className="text-sm text-ink-3 font-body mt-1">
          Construisez, pricez et analysez des produits structurés. Lancez des RFQ simulées multi-émetteurs.
        </p>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* ── Tab navigation ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg border border-border/80 p-1 w-fit">
        <button
          onClick={() => setTab('builder')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold font-body transition-all duration-200',
            tab === 'builder' ? 'bg-violet text-white shadow-sm' : 'text-ink-3 hover:text-ink hover:bg-surface-2',
          )}
        >
          <Calculator size={14} />
          Product Builder
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold font-body transition-all duration-200',
            tab === 'history' ? 'bg-violet text-white shadow-sm' : 'text-ink-3 hover:text-ink hover:bg-surface-2',
          )}
        >
          <History size={14} />
          Historique
        </button>
      </div>

      {tab === 'builder' ? (
        <div className="flex gap-6">
          {/* ── Left: Multi-step Form ─────────────────────────── */}
          <div className="w-[420px] shrink-0 flex flex-col gap-4">
            {/* Steps indicator */}
            <div className="flex items-center gap-0 bg-white rounded-xl border border-border/80 p-2">
              {['Structure', 'Payoff', 'Marché', 'Résultats'].map((label, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold font-body transition-all',
                    step === i
                      ? 'bg-violet text-white shadow-sm'
                      : step > i
                        ? 'text-teal hover:bg-teal-light'
                        : 'text-ink-3 hover:bg-surface-2',
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold',
                    step === i ? 'bg-white/20' : step > i ? 'bg-teal/20' : 'bg-surface-2',
                  )}>
                    {step > i ? '✓' : i + 1}
                  </span>
                  {label}
                </button>
              ))}
            </div>

            {/* Templates */}
            {step === 0 && templates && templates.length > 0 && (
              <div className="bg-white rounded-xl border border-border/80 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-violet" />
                  <span className="text-[12px] font-bold text-ink font-body">Templates</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl: any) => (
                    <button
                      key={tpl.id}
                      onClick={() => loadTemplate(tpl)}
                      className="px-3 py-1.5 rounded-lg border border-border/80 bg-violet-ghost text-[11px] font-medium text-violet hover:bg-violet-pale transition-all"
                    >
                      {tpl.name.split('—')[0]?.trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 0: Structure */}
            {step === 0 && (
              <div className="bg-white rounded-xl border border-border/80 p-5 flex flex-col gap-4">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Sliders size={14} className="text-violet" />
                  Structure du Produit
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Nom du produit</label>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Type de structure</label>
                  <select value={structureType} onChange={(e) => setStructureType(e.target.value)} className={selectCls}>
                    {STRUCTURE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Devise</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="CHF">CHF</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Nominal</label>
                    <input type="number" value={nominal} onChange={(e) => setNominal(Number(e.target.value))} className={inputCls} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Sous-jacent</label>
                  <select value={selectedUnderlying} onChange={(e) => setSelectedUnderlying(Number(e.target.value))} className={selectCls}>
                    {UNDERLYINGS.map((u, i) => (
                      <option key={u.ticker} value={i}>{u.name} ({u.ticker})</option>
                    ))}
                  </select>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] text-ink-3 font-mono">Spot: {underlying.spot}</span>
                    <span className="text-[10px] text-ink-3 font-mono">Vol: {(underlying.vol * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-ink-3 font-mono">Div: {(underlying.div * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Date de strike</label>
                    <input type="date" value={strikeDate} onChange={(e) => setStrikeDate(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Maturité</label>
                    <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <button onClick={() => setStep(1)} className="w-full h-10 rounded-lg bg-violet text-white text-[13px] font-semibold font-body flex items-center justify-center gap-2 transition-all hover:bg-violet-dark active:scale-[0.98] mt-2">
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Step 1: Payoff */}
            {step === 1 && (
              <div className="bg-white rounded-xl border border-border/80 p-5 flex flex-col gap-4">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Target size={14} className="text-violet" />
                  Payoff & Barrières
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Type de coupon</label>
                  <select value={couponType} onChange={(e) => setCouponType(e.target.value)} className={selectCls}>
                    {COUPON_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                {couponType !== 'NONE' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>Coupon (%/an)</label>
                        <input type="number" step="0.5" value={couponRate} onChange={(e) => setCouponRate(Number(e.target.value))} className={inputCls} />
                      </div>
                      {(couponType === 'CONDITIONAL' || couponType === 'MEMORY') && (
                        <div className="flex flex-col gap-1.5">
                          <label className={labelCls}>Barrière coupon (%)</label>
                          <input type="number" step="5" value={couponBarrier} onChange={(e) => setCouponBarrier(Number(e.target.value))} className={inputCls} />
                        </div>
                      )}
                    </div>
                    {couponType === 'MEMORY' && (
                      <label className="flex items-center gap-2 text-[12px] font-body text-ink-2 cursor-pointer">
                        <input type="checkbox" checked={couponMemory} onChange={(e) => setCouponMemory(e.target.checked)} className="accent-violet" />
                        Effet mémoire sur les coupons
                      </label>
                    )}
                  </>
                )}

                <div className="h-px bg-border/60" />

                <label className="flex items-center gap-2 text-[12px] font-body text-ink-2 cursor-pointer">
                  <input type="checkbox" checked={autocallEnabled} onChange={(e) => setAutocallEnabled(e.target.checked)} className="accent-violet" />
                  Autocall activé
                </label>
                {autocallEnabled && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Barrière autocall (%)</label>
                    <input type="number" step="5" value={autocallBarrier} onChange={(e) => setAutocallBarrier(Number(e.target.value))} className={inputCls} />
                  </div>
                )}

                <div className="h-px bg-border/60" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Barrière protection (%)</label>
                    <input type="number" step="5" value={protectionBarrier} onChange={(e) => setProtectionBarrier(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Monitoring</label>
                    <select value={barrierMonitoring} onChange={(e) => setBarrierMonitoring(e.target.value)} className={selectCls}>
                      {BARRIER_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Participation hausse (%)</label>
                    <input type="number" step="10" value={participationUp} onChange={(e) => setParticipationUp(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Cap (%)</label>
                    <input type="number" step="5" value={cap} onChange={(e) => setCap(Number(e.target.value))} className={inputCls} placeholder="0 = pas de cap" />
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => setStep(0)} className="flex-1 h-10 rounded-lg border border-border/80 text-ink-3 text-[13px] font-semibold font-body hover:bg-surface-2 transition-all">
                    Retour
                  </button>
                  <button onClick={() => setStep(2)} className="flex-1 h-10 rounded-lg bg-violet text-white text-[13px] font-semibold font-body flex items-center justify-center gap-2 transition-all hover:bg-violet-dark active:scale-[0.98]">
                    Suivant <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Market */}
            {step === 2 && (
              <div className="bg-white rounded-xl border border-border/80 p-5 flex flex-col gap-4">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <Activity size={14} className="text-violet" />
                  Paramètres de Marché
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Taux sans risque (%)</label>
                    <input type="number" step="0.25" value={riskFreeRate} onChange={(e) => setRiskFreeRate(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Spread funding (%)</label>
                    <input type="number" step="0.1" value={fundingSpread} onChange={(e) => setFundingSpread(Number(e.target.value))} className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Marge structuration (%)</label>
                    <input type="number" step="0.25" value={structuringMargin} onChange={(e) => setStructuringMargin(Number(e.target.value))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Frais distribution (%)</label>
                    <input type="number" step="0.25" value={distributionFee} onChange={(e) => setDistributionFee(Number(e.target.value))} className={inputCls} />
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Simulations Monte Carlo</label>
                  <select value={mcPaths} onChange={(e) => setMcPaths(Number(e.target.value))} className={selectCls}>
                    <option value={1000}>1 000 (rapide)</option>
                    <option value={5000}>5 000 (standard)</option>
                    <option value={10000}>10 000 (recommandé)</option>
                    <option value={50000}>50 000 (précis)</option>
                  </select>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => setStep(1)} className="flex-1 h-10 rounded-lg border border-border/80 text-ink-3 text-[13px] font-semibold font-body hover:bg-surface-2 transition-all">
                    Retour
                  </button>
                  <button
                    onClick={handlePrice}
                    disabled={priceProduct.isPending}
                    className={cn(
                      'flex-1 h-10 rounded-lg bg-violet text-white text-[13px] font-semibold font-body flex items-center justify-center gap-2 transition-all hover:bg-violet-dark active:scale-[0.98]',
                      priceProduct.isPending && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    {priceProduct.isPending ? (
                      <><Loader2 size={14} className="animate-spin" /> Pricing en cours...</>
                    ) : (
                      <><Play size={14} /> Lancer le Pricing</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Results summary (left side) */}
            {step === 3 && pricingResult?.result && (
              <div className="bg-white rounded-xl border border-border/80 p-5 flex flex-col gap-3">
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-teal" />
                  Résumé
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-violet-ghost rounded-lg p-3 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-ink-3 font-body">Fair Value</span>
                    <p className="font-display text-xl font-bold text-violet">{pricingResult.result.fairValue}%</p>
                  </div>
                  <div className="bg-teal-light rounded-lg p-3 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-ink-3 font-body">Prix d&apos;émission</span>
                    <p className="font-display text-xl font-bold text-teal">{pricingResult.result.issuePrice}%</p>
                  </div>
                </div>

                <div className="text-[11px] text-ink-3 font-mono flex items-center gap-2">
                  <Clock size={11} />
                  Calculé en {pricingResult.result.computeTimeMs}ms ({mcPaths.toLocaleString()} paths)
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => setStep(0)} className="flex-1 h-9 rounded-lg border border-border/80 text-ink-3 text-[12px] font-semibold font-body hover:bg-surface-2 transition-all">
                    Nouveau pricing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Results Panel ──────────────────────────── */}
          <div className="flex-1 min-w-0">
            {step < 3 || !pricingResult?.result ? (
              <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                  <h2 className="font-display text-sm font-bold text-ink">Résultats de pricing</h2>
                </div>
                <div className="p-12 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-violet-ghost flex items-center justify-center">
                    <Calculator size={28} className="text-violet/40" />
                  </div>
                  <p className="text-sm text-ink-3 font-body text-center max-w-xs">
                    Configurez votre produit puis lancez le pricing pour voir les résultats ici.
                  </p>
                  {validationErrors.filter((e: any) => e.severity === 'ERROR').length > 0 && (
                    <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-500" />
                        <span className="text-[12px] font-bold text-red-700">Erreurs de validation</span>
                      </div>
                      {validationErrors.filter((e: any) => e.severity === 'ERROR').map((e: any, i: number) => (
                        <p key={i} className="text-[11px] text-red-600 font-body ml-5">• {e.message}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Validation warnings */}
                {validationErrors.filter((e: any) => e.severity === 'WARNING').length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span className="text-[12px] font-bold text-amber-800">Avertissements</span>
                    </div>
                    {validationErrors.filter((e: any) => e.severity === 'WARNING').map((e: any, i: number) => (
                      <p key={i} className="text-[11px] text-amber-700 font-body ml-5">• {e.message}</p>
                    ))}
                  </div>
                )}

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Rendement attendu', value: `${pricingResult.result.expectedReturn}%`, icon: <TrendingUp size={14} className="text-teal" />, bg: 'bg-teal-light' },
                    { label: 'Prob. Autocall', value: `${(pricingResult.result.riskSummary.probAutocall * 100).toFixed(1)}%`, icon: <Zap size={14} className="text-violet" />, bg: 'bg-violet-ghost' },
                    { label: 'Prob. Perte', value: `${(pricingResult.result.riskSummary.probCapitalLoss * 100).toFixed(1)}%`, icon: <ShieldCheck size={14} className="text-gold" />, bg: 'bg-gold-light' },
                    { label: 'VaR 95%', value: `${pricingResult.result.riskSummary.valueAtRisk95.toFixed(1)}%`, icon: <AlertTriangle size={14} className="text-red-500" />, bg: 'bg-red-50' },
                  ].map((m, i) => (
                    <div key={i} className={cn('rounded-xl border border-border/80 p-4 flex flex-col gap-2', m.bg)}>
                      {m.icon}
                      <span className="text-[10px] uppercase tracking-wider text-ink-3 font-body">{m.label}</span>
                      <span className="font-display text-lg font-bold text-ink">{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Cost breakdown */}
                <div className="bg-white rounded-xl border border-border/80 p-5">
                  <h3 className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-2">
                    <BarChart3 size={14} className="text-violet" />
                    Décomposition des coûts
                  </h3>
                  <div className="grid grid-cols-5 gap-4">
                    {Object.entries(pricingResult.result.costBreakdown).map(([key, val]: [string, any]) => (
                      <div key={key} className="text-center">
                        <span className="text-[10px] uppercase tracking-wider text-ink-3 font-body block">
                          {key === 'structuringMargin' ? 'Structuration' :
                            key === 'distributionFee' ? 'Distribution' :
                            key === 'executionCost' ? 'Exécution' :
                            key === 'hedgingCost' ? 'Hedging' : 'Total'}
                        </span>
                        <span className={cn('font-mono text-sm font-bold', key === 'totalCost' ? 'text-violet' : 'text-ink-2')}>
                          {typeof val === 'number' ? val.toFixed(2) : val}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scenario table */}
                <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/60">
                    <h3 className="font-display text-sm font-bold text-ink">Scénarios (Spot Shocks)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] font-body">
                      <thead>
                        <tr className="border-b border-border/60" style={{ background: 'rgba(237,232,255,0.3)' }}>
                          <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-ink-3">Choc</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-ink-3">Spot</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-ink-3">Redemption</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-ink-3">Coupons</th>
                          <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-ink-3">Total Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingResult.result.scenarioTable.map((s: any, i: number) => (
                          <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-violet-ghost/40 transition-colors">
                            <td className="px-3 py-2 font-mono">
                              <span className={cn(
                                'font-semibold',
                                s.spotShock > 0 ? 'text-teal' : s.spotShock < 0 ? 'text-red-500' : 'text-ink',
                              )}>
                                {s.spotShock > 0 ? '+' : ''}{(s.spotShock * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-ink-2">{s.spotLevel}</td>
                            <td className="px-3 py-2 text-right font-mono">{s.redemption}%</td>
                            <td className="px-3 py-2 text-right font-mono text-teal">{s.totalCoupons}%</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">
                              <span className={s.totalReturn >= 0 ? 'text-teal' : 'text-red-500'}>
                                {s.totalReturn >= 0 ? '+' : ''}{s.totalReturn}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Model info */}
                <div className="bg-white rounded-xl border border-border/80 p-5 text-[11px] text-ink-3 font-body">
                  <p className="font-bold text-ink-2 mb-1">Modèle: {pricingResult.result.modelUsed}</p>
                  <p className="mb-1">Hypothèses: {pricingResult.result.assumptions.join(' · ')}</p>
                  <p>Limitations: {pricingResult.result.modelLimitations.join(' · ')}</p>
                  <p className="mt-2 text-[10px] text-ink-4 italic">
                    SIMULATED PRICING — For educational/analytical purposes only. Not a binding offer.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── History Tab ────────────────────────────────────────── */
        <div className="bg-white rounded-xl border border-border/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
              <History size={15} className="text-violet" />
              Historique des pricings
            </h2>
          </div>
          {historyData?.runs?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] font-body">
                <thead>
                  <tr className="border-b border-border/60" style={{ background: 'rgba(237,232,255,0.3)' }}>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-ink-3">Date</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-ink-3">Fair Value</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-ink-3">Prix émission</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-ink-3">Coupon</th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-ink-3">Modèle</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-ink-3">Temps</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.runs.map((r: any) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-violet-ghost/40 transition-colors">
                      <td className="px-4 py-3 text-ink-2">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-violet">{r.fairValue}%</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-teal">{r.issuePrice}%</td>
                      <td className="px-4 py-3 text-right font-mono">{r.indicativeCoupon ? `${r.indicativeCoupon}%` : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-violet-pale text-violet">
                          {r.modelUsed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-3">{r.computeTimeMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-ink-3 font-body">
              Aucun pricing dans l&apos;historique. Lancez votre premier pricing !
            </div>
          )}
        </div>
      )}
    </div>
  );
}
