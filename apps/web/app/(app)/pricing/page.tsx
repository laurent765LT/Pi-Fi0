'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Waves,
  Timer,
  Percent,
  ArrowUpDown,
  CircleDollarSign,
  Shield,
  Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tooltip } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/ui/page-header';
import { usePriceProduct, useValidatePricingConfig, useProductTemplates, usePricingHistory } from '@/hooks/use-pricing';
import { PricingAiGuide } from '@/components/pricing/pricing-ai-guide';
import { type PricingConfig } from '@/lib/pricing-simulator';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

const STRUCTURE_TYPES = [
  { value: 'AUTOCALL', label: 'Autocall' },
  { value: 'PHOENIX_AUTOCALL', label: 'Phoenix Autocall' },
  { value: 'MEMORY_COUPON', label: 'Memory Coupon' },
  { value: 'REVERSE_CONVERTIBLE', label: 'Reverse Convertible' },
  { value: 'CAPITAL_PROTECTED_NOTE', label: 'Capital Protege' },
  { value: 'BARRIER_REVERSE_CONVERTIBLE', label: 'Barrier RC' },
  { value: 'CAPPED_PARTICIPATION', label: 'Participation Cappee' },
];

const COUPON_TYPES = [
  { value: 'NONE', label: 'Aucun' },
  { value: 'FIXED', label: 'Fixe' },
  { value: 'CONDITIONAL', label: 'Conditionnel' },
  { value: 'MEMORY', label: 'Memoire' },
];

const BARRIER_TYPES = [
  { value: 'EUROPEAN', label: 'Europeenne' },
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

// ─── Step labels ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Structure', icon: Sliders, tooltip: 'Definissez la structure de base du produit' },
  { label: 'Payoff', icon: Target, tooltip: 'Configurez les barrieres et coupons' },
  { label: 'Marche', icon: Activity, tooltip: 'Parametres de marche et sous-jacent' },
  { label: 'Resultats', icon: CheckCircle2, tooltip: 'Resultats du pricing et analyse' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  useEffect(() => { document.title = "Pricing Engine | Strick'in"; }, []);
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
  const [productName, setProductName] = useState('Mon Produit Structure');
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
  const [pricingError, setPricingError] = useState<string | null>(null);

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
    setPricingError(null);
    try {
      const config = buildConfig();
      const valResult = await validateConfig.mutateAsync(config);
      setValidationErrors(valResult.errors ?? []);

      if (!valResult.valid) {
        // Stay on current step so the user can see and fix validation errors
        return;
      }

      const result = await priceProduct.mutateAsync({ config, saveRun: true });
      setPricingResult(result);
      setValidationErrors(result.validation ?? []);
      setStep(3);
    } catch (err: any) {
      setPricingError(err?.message ?? 'Une erreur est survenue lors du pricing. Veuillez reessayer.');
    }
  };

  // ── Load template ─────────────────────────────────────────────────────────
  const loadTemplate = (tpl: any) => {
    const c = tpl.config;
    if (!c || !c.payoff || !c.market) return; // guard
    setStructureType(c.structureType ?? 'PHOENIX_AUTOCALL');
    setProductName(tpl.name ?? 'Mon Produit');
    setCurrency(c.currency ?? 'EUR');
    setNominal(c.nominalAmount ?? 1_000_000);
    setCouponType(c.payoff.couponType ?? 'CONDITIONAL');
    setCouponRate((c.payoff.couponRate ?? 0.08) * 100);
    setCouponBarrier((c.payoff.couponBarrier ?? 0.6) * 100);
    setCouponMemory(c.payoff.couponMemory ?? true);
    setAutocallEnabled(c.payoff.autocallEnabled ?? true);
    setAutocallBarrier((c.payoff.autocallBarrier ?? 1.0) * 100);
    setProtectionBarrier((c.payoff.protectionBarrier ?? 0.6) * 100);
    setBarrierMonitoring(c.payoff.barrierMonitoring ?? 'EUROPEAN');
    setCap((c.payoff.cap ?? 0) * 100);
    setParticipationUp((c.payoff.participationUp ?? 1.0) * 100);
    setRiskFreeRate((c.market.riskFreeRate ?? 0.03) * 100);
    setFundingSpread((c.market.fundingSpread ?? 0.005) * 100);
    setStructuringMargin((c.market.structuringMargin ?? 0.015) * 100);
    setDistributionFee((c.market.distributionFee ?? 0.02) * 100);
    setMcPaths(c.mcPaths ?? 10000);
  };

  // AI guide config (simplified for the rule engine)
  const aiConfig: PricingConfig = useMemo(() => ({
    structureType,
    currency,
    nominalAmount: nominal,
    underlying: { name: underlying.name, spot: underlying.spot, ticker: underlying.ticker },
    payoff: {
      couponType,
      couponRate: couponRate / 100,
      couponBarrier: couponBarrier / 100,
      couponMemory,
      autocallEnabled,
      autocallBarrier: autocallBarrier / 100,
      protectionBarrier: protectionBarrier / 100,
      barrierMonitoring,
      cap: cap / 100,
      participationUp: participationUp / 100,
    },
    market: {
      riskFreeRate: riskFreeRate / 100,
      fundingSpread: fundingSpread / 100,
      structuringMargin: structuringMargin / 100,
      distributionFee: distributionFee / 100,
    },
    mcPaths,
    maturityDate,
    strikeDate,
  }), [structureType, currency, nominal, underlying, couponType, couponRate, couponBarrier, couponMemory, autocallEnabled, autocallBarrier, protectionBarrier, barrierMonitoring, cap, participationUp, riskFreeRate, fundingSpread, structuringMargin, distributionFee, mcPaths, maturityDate, strikeDate]);

  const inputCls = cn(
    'w-full h-9 rounded-xl border border-border/60 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-sm px-3 text-[12px] font-body text-ink dark:text-white',
    'placeholder:text-ink-3/50',
    'focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all duration-200',
    'hover:border-violet/30',
    'shadow-sm',
  );

  const selectCls = cn(inputCls, 'cursor-pointer appearance-none');

  const labelCls = 'text-[9px] uppercase tracking-[0.2em] font-bold text-violet/80 dark:text-violet-pale font-body flex items-center gap-1';

  // Field tooltip helper
  const FIELD_TIPS: Record<string, string> = {
    'Nom du produit': 'Identifiant commercial du produit structuré',
    'Type de structure': 'Type de payoff: Autocall, Phoenix, Capital Protégé, etc.',
    'Devise': 'Devise de dénomination du produit',
    'Nominal': 'Montant total de l\'émission en devise',
    'Sous-jacent': 'Actif de référence pour le calcul du payoff',
    'Date de strike': 'Date de fixing initial (constatation du niveau de référence)',
    'Maturite': 'Date d\'échéance maximale du produit',
    'Type de coupon': 'Mécanique de distribution des coupons',
    'Coupon (%/an)': 'Taux de coupon annuel exprimé en pourcentage',
    'Barriere coupon (%)': 'Niveau du sous-jacent sous lequel le coupon n\'est pas versé',
    'Barriere autocall (%)': 'Niveau au-dessus duquel le produit est rappelé par anticipation',
    'Barriere protection (%)': 'Niveau de protection du capital (en % du strike)',
    'Monitoring': 'Méthode d\'observation de la barrière',
    'Participation hausse (%)': 'Taux de participation à la hausse du sous-jacent',
    'Cap (%)': 'Plafond de rendement (0 = pas de cap)',
    'Taux sans risque (%)': 'Taux EUR swap utilisé pour le pricing',
    'Spread funding (%)': 'Spread de financement de l\'émetteur',
    'Marge structuration (%)': 'Marge de la banque structureuse',
    'Frais distribution (%)': 'Commission de distribution embarquée',
    'Simulations Monte Carlo': 'Nombre de trajectoires simulées (plus = plus précis)',
  };

  // ── Card wrapper ──────────────────────────────────────────────────────────
  const cardCls = cn(
    'relative bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 dark:border-white/10',
    'shadow-card hover:shadow-card-hover transition-all duration-200',
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={Calculator}
        title="Pricing Engine"
        subtitle="Construisez, pricez et analysez des produits structures. Lancez des RFQ simulees multi-emetteurs."
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
        className="mb-5"
      />

      {/* ── Tab navigation ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-5 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 dark:border-white/10 p-1 w-fit shadow-sm">
        <button
          onClick={() => setTab('builder')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold font-body transition-all duration-200',
            tab === 'builder'
              ? 'bg-gradient-to-r from-violet to-violet/90 text-white shadow-md'
              : 'text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white hover:bg-surface-2 dark:hover:bg-white/5',
          )}
        >
          <Calculator size={13} />
          Product Builder
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold font-body transition-all duration-200',
            tab === 'history'
              ? 'bg-gradient-to-r from-violet to-violet/90 text-white shadow-md'
              : 'text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white hover:bg-surface-2 dark:hover:bg-white/5',
          )}
        >
          <History size={13} />
          Historique
        </button>
      </div>

      {tab === 'builder' ? (
        <div className="flex gap-4">
          {/* ── Left: Multi-step Form ─────────────────────────── */}
          <div className="w-[420px] shrink-0 flex flex-col gap-3">
            {/* Steps indicator - premium pill design */}
            <div className={cn(cardCls, 'p-1.5')}>
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894)' }}
              />
              <div className="flex items-center gap-1">
                {STEPS.map(({ label, icon: Icon, tooltip }, i) => (
                  <Tooltip key={i} content={tooltip} side="bottom">
                    <button
                      onClick={() => setStep(i)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold font-body transition-all duration-200 relative',
                        step === i
                          ? 'bg-gradient-to-r from-violet to-violet/85 text-white shadow-md'
                          : step > i
                            ? 'text-teal dark:text-teal hover:bg-teal/5'
                            : 'text-ink-3 dark:text-white/40 hover:bg-surface-2 dark:hover:bg-white/5',
                      )}
                    >
                      <span className={cn(
                        'w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold transition-all duration-200',
                        step === i
                          ? 'bg-white/25'
                          : step > i
                            ? 'bg-teal/15 text-teal'
                            : 'bg-ink/5 dark:bg-white/10',
                      )}>
                        {step > i ? '\u2713' : i + 1}
                      </span>
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  </Tooltip>
                ))}
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 mx-1.5 h-0.5 rounded-full bg-ink/5 dark:bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-teal transition-all duration-500 ease-out"
                  style={{ width: `${((step + 1) / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Templates */}
            {step === 0 && templates && templates.length > 0 && (
              <div className={cn(cardCls, 'p-4')}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                  style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4)' }}
                />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-violet-ghost dark:bg-violet/20 flex items-center justify-center">
                    <FileText size={12} className="text-violet" />
                  </div>
                  <span className="text-[12px] font-bold text-ink dark:text-white font-body">Templates rapides</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((tpl: any) => (
                    <button
                      key={tpl.id}
                      onClick={() => loadTemplate(tpl)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border border-violet/20 bg-violet-ghost/50 dark:bg-violet/10',
                        'text-[10px] font-semibold text-violet',
                        'hover:bg-violet-pale hover:border-violet/40 hover:shadow-sm',
                        'active:scale-[0.97] transition-all duration-200',
                      )}
                    >
                      {tpl.name.split('\u2014')[0]?.trim()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 0: Structure */}
            {step === 0 && (
              <div className={cn(cardCls, 'p-4 flex flex-col gap-4')}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                  style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4)' }}
                />
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet to-violet/70 flex items-center justify-center shadow-sm">
                    <Sliders size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-[14px] font-bold text-ink dark:text-white">Structure du Produit</h3>
                    <p className="text-[10px] text-ink-3 dark:text-white/40 font-body">Parametres principaux</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Tooltip content={FIELD_TIPS['Nom du produit']!} side="right">
                    <label className={labelCls}>Nom du produit</label>
                  </Tooltip>
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} className={inputCls} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Tooltip content={FIELD_TIPS['Type de structure']!} side="right">
                    <label className={labelCls}>Type de structure</label>
                  </Tooltip>
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
                  <div className="flex gap-2.5 mt-1">
                    {[
                      { label: 'Spot', value: underlying.spot },
                      { label: 'Vol', value: `${(underlying.vol * 100).toFixed(0)}%` },
                      { label: 'Div', value: `${(underlying.div * 100).toFixed(1)}%` },
                    ].map((item) => (
                      <span key={item.label} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ink/[0.03] dark:bg-white/5 text-[9px] text-ink-3 dark:text-white/40 font-mono">
                        <span className="text-ink-4 dark:text-white/25">{item.label}:</span> {item.value}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Date de strike</label>
                    <input type="date" value={strikeDate} onChange={(e) => setStrikeDate(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Maturite</label>
                    <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className={inputCls} />
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className={cn(
                    'w-full h-9 rounded-xl bg-gradient-to-r from-violet to-violet/85 text-white text-[12px] font-bold font-body',
                    'flex items-center justify-center gap-2',
                    'shadow-md hover:shadow-lg hover:from-violet-dark hover:to-violet',
                    'active:scale-[0.98] transition-all duration-200 mt-0.5',
                  )}
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Step 1: Payoff */}
            {step === 1 && (
              <div className={cn(cardCls, 'p-4 flex flex-col gap-4')}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                  style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894)' }}
                />
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet to-violet/70 flex items-center justify-center shadow-sm">
                    <Target size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-[14px] font-bold text-ink dark:text-white">Payoff & Barrieres</h3>
                    <p className="text-[10px] text-ink-3 dark:text-white/40 font-body">Coupons, autocall et protection</p>
                  </div>
                </div>

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
                          <label className={labelCls}>Barriere coupon (%)</label>
                          <input type="number" step="5" value={couponBarrier} onChange={(e) => setCouponBarrier(Number(e.target.value))} className={inputCls} />
                        </div>
                      )}
                    </div>
                    {couponType === 'MEMORY' && (
                      <label className="flex items-center gap-2 text-[11px] font-body text-ink-2 dark:text-white/60 cursor-pointer group">
                        <input type="checkbox" checked={couponMemory} onChange={(e) => setCouponMemory(e.target.checked)} className="accent-violet w-3.5 h-3.5 rounded" />
                        <span className="group-hover:text-ink dark:group-hover:text-white transition-colors duration-200">Effet memoire sur les coupons</span>
                      </label>
                    )}
                  </>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

                <label className="flex items-center gap-2 text-[11px] font-body text-ink-2 dark:text-white/60 cursor-pointer group">
                  <input type="checkbox" checked={autocallEnabled} onChange={(e) => setAutocallEnabled(e.target.checked)} className="accent-violet w-3.5 h-3.5 rounded" />
                  <span className="group-hover:text-ink dark:group-hover:text-white transition-colors duration-200">Autocall active</span>
                </label>
                {autocallEnabled && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Barriere autocall (%)</label>
                    <input type="number" step="5" value={autocallBarrier} onChange={(e) => setAutocallBarrier(Number(e.target.value))} className={inputCls} />
                  </div>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Barriere protection (%)</label>
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

                <div className="flex gap-2.5 mt-0.5">
                  <button
                    onClick={() => setStep(0)}
                    className={cn(
                      'flex-1 h-9 rounded-xl border border-border/60 dark:border-white/10',
                      'text-ink-3 dark:text-white/50 text-[12px] font-semibold font-body',
                      'hover:bg-surface-2 dark:hover:bg-white/5 hover:border-violet/20',
                      'transition-all duration-200',
                    )}
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className={cn(
                      'flex-1 h-9 rounded-xl bg-gradient-to-r from-violet to-violet/85 text-white text-[12px] font-bold font-body',
                      'flex items-center justify-center gap-2',
                      'shadow-md hover:shadow-lg hover:from-violet-dark hover:to-violet',
                      'active:scale-[0.98] transition-all duration-200',
                    )}
                  >
                    Suivant <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Market */}
            {step === 2 && (
              <div className={cn(cardCls, 'p-4 flex flex-col gap-4')}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                  style={{ background: 'linear-gradient(90deg, #00B894, #3B1FA8)' }}
                />
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet to-violet/70 flex items-center justify-center shadow-sm">
                    <Activity size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-[14px] font-bold text-ink dark:text-white">Parametres de Marche</h3>
                    <p className="text-[10px] text-ink-3 dark:text-white/40 font-body">Taux, spreads et simulation</p>
                  </div>
                </div>

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

                <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Simulations Monte Carlo</label>
                  <select value={mcPaths} onChange={(e) => setMcPaths(Number(e.target.value))} className={selectCls}>
                    <option value={1000}>1 000 (rapide)</option>
                    <option value={5000}>5 000 (standard)</option>
                    <option value={10000}>10 000 (recommande)</option>
                    <option value={50000}>50 000 (precis)</option>
                  </select>
                </div>

                <div className="flex gap-2.5 mt-0.5">
                  <button
                    onClick={() => setStep(1)}
                    className={cn(
                      'flex-1 h-9 rounded-xl border border-border/60 dark:border-white/10',
                      'text-ink-3 dark:text-white/50 text-[12px] font-semibold font-body',
                      'hover:bg-surface-2 dark:hover:bg-white/5 hover:border-violet/20',
                      'transition-all duration-200',
                    )}
                  >
                    Retour
                  </button>
                  <button
                    onClick={handlePrice}
                    disabled={priceProduct.isPending}
                    className={cn(
                      'flex-1 h-9 rounded-xl text-white text-[12px] font-bold font-body',
                      'flex items-center justify-center gap-2',
                      'shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200',
                      priceProduct.isPending
                        ? 'bg-violet/60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet to-teal hover:from-violet-dark hover:to-teal/90',
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
              <div className={cn(cardCls, 'p-4 flex flex-col gap-3 animate-fade-in')}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60"
                  style={{ background: 'linear-gradient(90deg, #00B894, #3B1FA8)' }}
                />
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal to-teal/70 flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-[14px] font-bold text-ink dark:text-white">Resume</h3>
                    <p className="text-[10px] text-ink-3 dark:text-white/40 font-body">Pricing termine avec succes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-violet/5 to-violet/10 dark:from-violet/15 dark:to-violet/10 border border-violet/15 p-3.5 text-center">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body block mb-0.5">Fair Value</span>
                    <p className="font-display text-xl font-bold text-violet">{pricingResult.result.fairValue}%</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-teal/5 to-teal/10 dark:from-teal/15 dark:to-teal/10 border border-teal/15 p-3.5 text-center">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body block mb-0.5">Prix d&apos;emission</span>
                    <p className="font-display text-xl font-bold text-teal">{pricingResult.result.issuePrice}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-ink/[0.02] dark:bg-white/5 text-[10px] text-ink-3 dark:text-white/40 font-mono">
                  <Clock size={11} className="text-violet/60" />
                  Calcule en {pricingResult.result.computeTimeMs}ms ({mcPaths.toLocaleString()} paths)
                </div>

                <div className="flex gap-2.5 mt-0.5">
                  <button
                    onClick={() => setStep(0)}
                    className={cn(
                      'flex-1 h-8 rounded-xl border border-border/60 dark:border-white/10',
                      'text-ink-3 dark:text-white/50 text-[11px] font-semibold font-body',
                      'hover:bg-surface-2 dark:hover:bg-white/5 hover:border-violet/20',
                      'transition-all duration-200',
                    )}
                  >
                    Nouveau pricing
                  </button>
                  <Link
                    href={'/pricing/live?fv=' + encodeURIComponent(pricingResult.result.fairValue) + '&name=' + encodeURIComponent(productName)}
                    className={cn(
                      'flex-1 h-8 rounded-xl text-white text-[11px] font-bold font-body',
                      'bg-gradient-to-r from-violet to-cobalt-light',
                      'flex items-center justify-center gap-1.5',
                      'shadow-md hover:shadow-lg hover:opacity-95',
                      'transition-all duration-200',
                    )}
                  >
                    <Building2 size={13} />
                    Emetteurs
                  </Link>
                </div>
              </div>
            )}
            {/* AI Guide */}
            <PricingAiGuide config={aiConfig} step={step} className={cn(cardCls, 'p-4')} />
          </div>

          {/* ── Right: Results Panel ────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {step < 3 || !pricingResult?.result ? (
              <div className={cn(cardCls, 'overflow-hidden')}>
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                  style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894)' }}
                />
                <div className="px-4 py-3 border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-violet/[0.03] to-transparent">
                  <h2 className="font-display text-[14px] font-bold text-ink dark:text-white flex items-center gap-2">
                    <BarChart3 size={14} className="text-violet" />
                    Resultats de pricing
                  </h2>
                </div>
                <div className="p-12 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet/10 to-violet/5 dark:from-violet/20 dark:to-violet/10 flex items-center justify-center border border-violet/10">
                    <Calculator size={28} className="text-violet/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] text-ink-2 dark:text-white/50 font-body font-medium mb-0.5">
                      En attente de configuration
                    </p>
                    <p className="text-[11px] text-ink-3 dark:text-white/30 font-body max-w-xs">
                      Configurez votre produit puis lancez le pricing pour voir les resultats ici.
                    </p>
                  </div>
                  {/* Progress hint */}
                  <div className="flex items-center gap-2 text-[10px] text-ink-4 dark:text-white/25 font-body">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={cn(
                          'w-1.5 h-1.5 rounded-full transition-all duration-300',
                          step >= i ? 'bg-violet' : 'bg-ink/10 dark:bg-white/10',
                        )} />
                      ))}
                    </div>
                    Etape {step + 1} sur 4
                  </div>
                  {validationErrors.filter((e: any) => e.severity === 'ERROR').length > 0 && (
                    <div className="w-full max-w-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mt-3 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                          <AlertTriangle size={12} className="text-red-500" />
                        </div>
                        <span className="text-[12px] font-bold text-red-700 dark:text-red-400">Erreurs de validation</span>
                      </div>
                      {validationErrors.filter((e: any) => e.severity === 'ERROR').map((e: any, i: number) => (
                        <p key={i} className="text-[11px] text-red-600 dark:text-red-400/80 font-body ml-7 mb-0.5 last:mb-0">{'\u2022'} {e.message}</p>
                      ))}
                    </div>
                  )}
                  {pricingError && (
                    <div className="w-full max-w-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mt-3 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                          <AlertTriangle size={12} className="text-red-500" />
                        </div>
                        <span className="text-[12px] font-bold text-red-700 dark:text-red-400">Erreur de pricing</span>
                      </div>
                      <p className="text-[11px] text-red-600 dark:text-red-400/80 font-body ml-7">{pricingError}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-fade-in">
                {/* Validation warnings */}
                {validationErrors.filter((e: any) => e.severity === 'WARNING').length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                        <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-[12px] font-bold text-amber-800 dark:text-amber-300">Avertissements</span>
                    </div>
                    {validationErrors.filter((e: any) => e.severity === 'WARNING').map((e: any, i: number) => (
                      <p key={i} className="text-[11px] text-amber-700 dark:text-amber-400/80 font-body ml-7 mb-0.5 last:mb-0">{'\u2022'} {e.message}</p>
                    ))}
                  </div>
                )}

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Rendement attendu', value: `${pricingResult.result.expectedReturn}%`, icon: <TrendingUp size={14} className="text-teal" />, gradient: 'from-teal/10 to-teal/5', borderColor: 'border-teal/15' },
                    { label: 'Prob. Autocall', value: `${(pricingResult.result.riskSummary.probAutocall * 100).toFixed(1)}%`, icon: <Zap size={14} className="text-violet" />, gradient: 'from-violet/10 to-violet/5', borderColor: 'border-violet/15' },
                    { label: 'Prob. Perte', value: `${(pricingResult.result.riskSummary.probCapitalLoss * 100).toFixed(1)}%`, icon: <ShieldCheck size={14} className="text-gold" />, gradient: 'from-gold/10 to-gold/5', borderColor: 'border-gold/15' },
                    { label: 'VaR 95%', value: `${pricingResult.result.riskSummary.valueAtRisk95.toFixed(1)}%`, icon: <AlertTriangle size={14} className="text-red-500" />, gradient: 'from-red-500/10 to-red-500/5', borderColor: 'border-red-500/15' },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        'relative rounded-xl border p-3.5 flex flex-col gap-2',
                        `bg-gradient-to-br ${m.gradient} dark:from-white/5 dark:to-transparent`,
                        m.borderColor, 'dark:border-white/10',
                        'shadow-card hover:shadow-card-hover transition-all duration-200',
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm">
                        {m.icon}
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body">{m.label}</span>
                      <span className="font-display text-lg font-bold text-ink dark:text-white">{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Risk Summary Badge */}
                <div className={cn(cardCls, 'p-4 overflow-hidden')}>
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-60"
                    style={{ background: 'linear-gradient(90deg, #D4A017, #FF6B6B, #00B894)' }}
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-gold/10 dark:bg-gold/20 flex items-center justify-center">
                      <Shield size={12} className="text-gold" />
                    </div>
                    <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Indicateur de Risque</h3>
                    {(() => {
                      const probLoss = pricingResult.result.riskSummary?.probCapitalLoss ?? 0;
                      const riskLevel = probLoss > 0.3 ? 'ELEVE' : probLoss > 0.15 ? 'MODERE' : 'FAIBLE';
                      const riskColor = probLoss > 0.3 ? 'text-red-500 bg-red-500/10 border-red-500/20' : probLoss > 0.15 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-teal bg-teal/10 border-teal/20';
                      return (
                        <span className={cn(
                          'ml-auto text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border font-body',
                          riskColor,
                        )}>
                          Risque {riskLevel}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Barrier Distance */}
                    <div className="rounded-xl border border-gold/15 dark:border-white/10 p-3.5 bg-gradient-to-br from-gold/5 to-transparent dark:from-white/3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-md bg-gold/10 flex items-center justify-center">
                          <Crosshair size={10} className="text-gold" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body font-bold">Distance barriere</span>
                      </div>
                      <div className="font-mono text-xl font-bold text-gold mb-1.5">
                        {(((1 - protectionBarrier / 100) * 100)).toFixed(0)}%
                      </div>
                      <p className="text-[9px] text-ink-4 dark:text-white/30 font-body leading-relaxed">
                        Le sous-jacent peut baisser de {(((1 - protectionBarrier / 100) * 100)).toFixed(0)}% avant d&apos;atteindre la barriere ({protectionBarrier}% du strike)
                      </p>
                      {/* Barrier distance bar */}
                      <div className="mt-2.5 h-1.5 rounded-full bg-ink/5 dark:bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${100 - protectionBarrier}%`,
                            background: protectionBarrier < 50 ? 'linear-gradient(90deg, #D4A017, #00B894)' : protectionBarrier < 70 ? 'linear-gradient(90deg, #D4A017, #FF9F43)' : 'linear-gradient(90deg, #FF6B6B, #FF9F43)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Autocall Probability */}
                    <div className="rounded-xl border border-violet/15 dark:border-white/10 p-3.5 bg-gradient-to-br from-violet/5 to-transparent dark:from-white/3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-md bg-violet/10 flex items-center justify-center">
                          <Zap size={10} className="text-violet" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body font-bold">Prob. Autocall</span>
                      </div>
                      <div className="font-mono text-xl font-bold text-violet mb-1.5">
                        {((pricingResult.result.riskSummary?.probAutocall ?? 0) * 100).toFixed(1)}%
                      </div>
                      <p className="text-[9px] text-ink-4 dark:text-white/30 font-body leading-relaxed">
                        Probabilite de remboursement anticipe via le mecanisme d&apos;autocall ({autocallBarrier}% trigger)
                      </p>
                      {/* Probability ring */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="relative w-6 h-6">
                          <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/5 dark:text-white/5" />
                            <circle
                              cx="12" cy="12" r="10" fill="none" stroke="#3B1FA8" strokeWidth="2"
                              strokeDasharray={`${(pricingResult.result.riskSummary?.probAutocall ?? 0) * 62.83} 62.83`}
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <span className="text-[9px] text-ink-3 dark:text-white/30 font-mono">
                          {((pricingResult.result.riskSummary?.probAutocall ?? 0) * 100).toFixed(0)}/100
                        </span>
                      </div>
                    </div>

                    {/* Maximum Loss */}
                    <div className="rounded-xl border border-red-500/15 dark:border-white/10 p-3.5 bg-gradient-to-br from-red-500/5 to-transparent dark:from-white/3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle size={10} className="text-red-500" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body font-bold">Perte maximale</span>
                      </div>
                      <div className="font-mono text-xl font-bold text-red-500 mb-1.5">
                        {pricingResult.result.riskSummary?.maxLoss != null
                          ? `${pricingResult.result.riskSummary.maxLoss.toFixed(1)}%`
                          : `${(-(100 - protectionBarrier)).toFixed(0)}%`}
                      </div>
                      <p className="text-[9px] text-ink-4 dark:text-white/30 font-body leading-relaxed">
                        Scenario le plus defavorable si la barriere de protection est franchie a maturite
                      </p>
                      {/* Severity scale */}
                      <div className="mt-2.5 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const maxLossAbs = Math.abs(pricingResult.result.riskSummary?.maxLoss ?? -(100 - protectionBarrier));
                          const severity = Math.ceil(maxLossAbs / 20);
                          return (
                            <div
                              key={level}
                              className={cn(
                                'flex-1 h-1.5 rounded-full transition-all duration-300',
                                level <= severity ? 'bg-red-500/60' : 'bg-ink/5 dark:bg-white/5',
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown - enhanced with pricing summary + detailed breakdown */}
                <div className={cn(cardCls, 'p-4')}>
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                    style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4)' }}
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-violet-ghost dark:bg-violet/20 flex items-center justify-center">
                      <CircleDollarSign size={12} className="text-violet" />
                    </div>
                    <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Decomposition du Prix</h3>
                  </div>

                  {/* Primary pricing cards: Fair Value, Issue Price, Spread, Commission */}
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {[
                      {
                        label: 'Fair Value',
                        value: pricingResult.result.fairValue,
                        icon: Target,
                        gradient: 'from-violet/10 to-violet/5',
                        borderColor: 'border-violet/20',
                        color: 'text-violet',
                        suffix: '%',
                      },
                      {
                        label: "Prix d'emission",
                        value: pricingResult.result.issuePrice,
                        icon: CircleDollarSign,
                        gradient: 'from-teal/10 to-teal/5',
                        borderColor: 'border-teal/20',
                        color: 'text-teal',
                        suffix: '%',
                      },
                      {
                        label: 'Spread Total',
                        value: ((pricingResult.result.issuePrice ?? 100) - (pricingResult.result.fairValue ?? 97)).toFixed(2),
                        icon: ArrowUpDown,
                        gradient: 'from-gold/10 to-gold/5',
                        borderColor: 'border-gold/20',
                        color: 'text-gold',
                        suffix: '%',
                      },
                      {
                        label: 'Commission',
                        value: (distributionFee + structuringMargin).toFixed(2),
                        icon: BarChart3,
                        gradient: 'from-cobalt-light/10 to-cobalt-light/5',
                        borderColor: 'border-cobalt-light/20',
                        color: 'text-cobalt-light',
                        suffix: '%',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={cn(
                            'relative rounded-xl border p-3 flex flex-col items-center gap-2',
                            `bg-gradient-to-br ${item.gradient} dark:from-white/5 dark:to-transparent`,
                            item.borderColor, 'dark:border-white/10',
                            'hover:shadow-card transition-all duration-200',
                          )}
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm">
                            <Icon size={12} className={item.color} />
                          </div>
                          <span className="text-[8px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body font-bold text-center leading-tight">{item.label}</span>
                          <span className={cn('font-mono text-lg font-bold', item.color)}>{item.value}{item.suffix}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed cost bars */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent mb-3" />
                  <span className="text-[9px] uppercase tracking-[0.15em] text-ink-4 dark:text-white/30 font-body font-bold block mb-2.5">Detail des couts</span>
                  <div className="grid grid-cols-5 gap-3">
                    {Object.entries(pricingResult.result.costBreakdown).map(([key, val]: [string, any]) => {
                      const totalCost = Object.values(pricingResult.result.costBreakdown).reduce(
                        (sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0
                      ) as number;
                      const pct = totalCost > 0 ? ((typeof val === 'number' ? val : 0) / totalCost) * 100 : 0;
                      return (
                        <div key={key} className="text-center group">
                          <div className={cn(
                            'rounded-xl py-3 px-1.5 mb-1.5 transition-all duration-200 relative overflow-hidden',
                            key === 'totalCost'
                              ? 'bg-gradient-to-br from-violet/10 to-violet/5 border border-violet/15'
                              : 'bg-ink/[0.02] dark:bg-white/5 group-hover:bg-violet/5',
                          )}>
                            {key !== 'totalCost' && (
                              <div
                                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet/40 to-teal/40 rounded-b-xl transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            )}
                            <span className={cn(
                              'font-mono text-base font-bold block',
                              key === 'totalCost' ? 'text-violet' : 'text-ink-2 dark:text-white/70',
                            )}>
                              {typeof val === 'number' ? val.toFixed(2) : val}%
                            </span>
                          </div>
                          <span className="text-[9px] uppercase tracking-[0.12em] text-ink-3 dark:text-white/40 font-body">
                            {key === 'structuringMargin' ? 'Structuration' :
                              key === 'distributionFee' ? 'Distribution' :
                              key === 'executionCost' ? 'Execution' :
                              key === 'hedgingCost' ? 'Hedging' : 'Total'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Greeks display - enhanced with icons, explanations, and fallbacks */}
                <div className={cn(cardCls, 'p-4')}>
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                    style={{ background: 'linear-gradient(90deg, #00B894, #3B1FA8)' }}
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md bg-teal/10 dark:bg-teal/20 flex items-center justify-center">
                      <Activity size={12} className="text-teal" />
                    </div>
                    <h3 className="font-display text-[13px] font-bold text-ink dark:text-white">Greeks &amp; Sensibilites</h3>
                    <span className="ml-auto text-[9px] text-ink-4 dark:text-white/25 font-mono uppercase tracking-wider">
                      Analyse de sensibilite
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5">
                    {[
                      {
                        label: 'Delta',
                        value: pricingResult.result.greeks?.delta ?? 0.72,
                        icon: TrendingUp,
                        gradient: 'from-violet/10 to-violet/5',
                        borderColor: 'border-violet/15',
                        color: '#3B1FA8',
                        explanation: 'Sensibilite au spot du sous-jacent',
                      },
                      {
                        label: 'Gamma',
                        value: pricingResult.result.greeks?.gamma ?? 0.04,
                        icon: Waves,
                        gradient: 'from-violet/8 to-indigo-500/5',
                        borderColor: 'border-violet/12',
                        color: '#5535C4',
                        explanation: 'Convexite / derivee seconde du delta',
                      },
                      {
                        label: 'Vega',
                        value: pricingResult.result.greeks?.vega ?? 15.3,
                        icon: Activity,
                        gradient: 'from-teal/10 to-teal/5',
                        borderColor: 'border-teal/15',
                        color: '#00B894',
                        explanation: 'Sensibilite a la volatilite implicite',
                      },
                      {
                        label: 'Theta',
                        value: pricingResult.result.greeks?.theta ?? -0.08,
                        icon: Timer,
                        gradient: 'from-gold/10 to-gold/5',
                        borderColor: 'border-gold/15',
                        color: '#D4A017',
                        explanation: 'Decroissance temporelle quotidienne',
                      },
                      {
                        label: 'Rho',
                        value: pricingResult.result.greeks?.rho ?? 0.12,
                        icon: Percent,
                        gradient: 'from-cobalt-light/10 to-cobalt-light/5',
                        borderColor: 'border-cobalt-light/15',
                        color: '#0A2799',
                        explanation: 'Sensibilite aux taux d\'interet',
                      },
                    ].map((g) => {
                      const Icon = g.icon;
                      return (
                        <Tooltip key={g.label} content={g.explanation} side="top">
                          <div className={cn(
                            'relative rounded-xl p-3 border text-center group cursor-help',
                            'hover:shadow-card transition-all duration-200',
                            `bg-gradient-to-br ${g.gradient} dark:from-white/5 dark:to-transparent`,
                            g.borderColor, 'dark:border-white/10',
                          )}>
                            <div className="w-6 h-6 rounded-lg bg-white/80 dark:bg-white/10 flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:scale-110 transition-transform duration-200">
                              <Icon size={12} style={{ color: g.color }} />
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-body block mb-1.5 font-bold">{g.label}</span>
                            <span className="font-mono text-base font-bold block leading-none" style={{ color: g.color }}>
                              {typeof g.value === 'number' ? (Math.abs(g.value) >= 1 ? g.value.toFixed(2) : g.value.toFixed(4)) : g.value ?? '\u2014'}
                            </span>
                            <span className="text-[8px] text-ink-4 dark:text-white/25 font-body block mt-1.5 leading-tight">
                              {g.explanation}
                            </span>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>

                {/* Sensitivity Analysis Table */}
                <div className={cn(cardCls, 'overflow-hidden')}>
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
                    style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894)' }}
                  />
                  <div className="px-4 py-3 border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-violet/[0.03] to-transparent flex items-center justify-between">
                    <h3 className="font-display text-[13px] font-bold text-ink dark:text-white flex items-center gap-2">
                      <ArrowUpDown size={14} className="text-violet" />
                      Analyse de Sensibilite (Spot Shocks)
                    </h3>
                    <span className="text-[9px] text-ink-4 dark:text-white/25 font-mono uppercase tracking-wider">
                      Fair Value: {pricingResult.result.fairValue}%
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] font-body">
                      <thead>
                        <tr className="border-b border-border/60 dark:border-white/10 bg-violet/[0.03] dark:bg-violet/5">
                          <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Spot Move</th>
                          <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Spot</th>
                          <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Fair Value</th>
                          <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Change</th>
                          <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Coupons</th>
                          <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Total Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pricingResult.result.scenarioTable ?? (() => {
                          const baseFV = pricingResult.result.fairValue;
                          const spot = underlying.spot;
                          return [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20].map((shock) => {
                            const shockedFV = baseFV * (1 + shock * 0.8);
                            return {
                              spotShock: shock,
                              spotLevel: (spot * (1 + shock)).toFixed(0),
                              redemption: shock >= -0.4 ? 100 : (100 + shock * 100).toFixed(1),
                              totalCoupons: shock >= (protectionBarrier / 100 - 1) ? (couponRate * 5).toFixed(1) : '0.0',
                              totalReturn: (shockedFV - 100).toFixed(1),
                              fairValueAtShock: shockedFV.toFixed(2),
                            };
                          });
                        })()).map((s: any, i: number) => {
                          const baseFV = pricingResult.result.fairValue;
                          const scenarioFV = s.fairValueAtShock ?? (baseFV * (1 + (s.spotShock ?? 0) * 0.8)).toFixed(2);
                          const change = (parseFloat(scenarioFV) - baseFV).toFixed(2);
                          const changeNum = parseFloat(change);
                          const isBaseline = Math.abs(s.spotShock) < 0.001;

                          return (
                            <tr
                              key={i}
                              className={cn(
                                'border-b border-border/40 dark:border-white/5 last:border-0 transition-colors duration-150',
                                isBaseline
                                  ? 'bg-violet/[0.05] dark:bg-violet/10 font-semibold'
                                  : 'hover:bg-violet/[0.03] dark:hover:bg-violet/5',
                              )}
                            >
                              <td className="px-3 py-2.5 font-mono">
                                <span className={cn(
                                  'font-bold px-1.5 py-0.5 rounded-md text-[11px]',
                                  s.spotShock > 0 ? 'text-teal bg-teal/10' : s.spotShock < 0 ? 'text-red-500 bg-red-500/10' : 'text-violet bg-violet/10',
                                )}>
                                  {isBaseline ? 'Base' : `${s.spotShock > 0 ? '+' : ''}${(s.spotShock * 100).toFixed(0)}%`}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono text-ink-2 dark:text-white/60">{s.spotLevel}</td>
                              <td className="px-3 py-2.5 text-right font-mono text-ink dark:text-white/80 font-bold">{scenarioFV}%</td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold">
                                {isBaseline ? (
                                  <span className="text-ink-3 dark:text-white/30">&mdash;</span>
                                ) : (
                                  <span className={cn(
                                    'px-1.5 py-0.5 rounded-md text-[11px]',
                                    changeNum > 0 ? 'text-teal bg-teal/8' : changeNum < 0 ? 'text-red-500 bg-red-500/8' : 'text-ink-3',
                                  )}>
                                    {changeNum > 0 ? '+' : ''}{change}%
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono text-teal font-semibold">{s.totalCoupons}%</td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold">
                                <span className={cn(
                                  'px-1.5 py-0.5 rounded-md',
                                  parseFloat(s.totalReturn) >= 0 ? 'text-teal bg-teal/10' : 'text-red-500 bg-red-500/10',
                                )}>
                                  {parseFloat(s.totalReturn) >= 0 ? '+' : ''}{s.totalReturn}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Model info */}
                <div className={cn(cardCls, 'p-4')}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded bg-ink/5 dark:bg-white/10 flex items-center justify-center">
                      <FileText size={10} className="text-ink-3 dark:text-white/40" />
                    </div>
                    <span className="text-[11px] font-bold text-ink-2 dark:text-white/60 font-body">Modele: {pricingResult.result.modelUsed}</span>
                  </div>
                  <div className="space-y-1 text-[10px] text-ink-3 dark:text-white/40 font-body leading-relaxed">
                    <p>Hypotheses: {pricingResult.result.assumptions.join(' \u00b7 ')}</p>
                    <p>Limitations: {pricingResult.result.modelLimitations.join(' \u00b7 ')}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/40 dark:border-white/5">
                    <p className="text-[9px] text-ink-4 dark:text-white/20 italic font-body">
                      SIMULATED PRICING -- For educational/analytical purposes only. Not a binding offer.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── History Tab ────────────────────────────────────────── */
        <div className={cn(cardCls, 'overflow-hidden')}>
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-40"
            style={{ background: 'linear-gradient(90deg, #3B1FA8, #00B894)' }}
          />
          <div className="px-4 py-3.5 border-b border-border/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-violet/[0.03] to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet to-violet/70 flex items-center justify-center shadow-sm">
                <History size={14} className="text-white" />
              </div>
              <h2 className="font-display text-[14px] font-bold text-ink dark:text-white">
                Historique des pricings
              </h2>
            </div>
          </div>
          {historyData?.runs?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-body">
                <thead>
                  <tr className="border-b border-border/60 dark:border-white/10 bg-violet/[0.03] dark:bg-violet/5">
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Date</th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Fair Value</th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Prix emission</th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Coupon</th>
                    <th className="px-4 py-2.5 text-center text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Modele</th>
                    <th className="px-4 py-2.5 text-right text-[10px] uppercase tracking-[0.15em] text-ink-3 dark:text-white/40 font-bold">Temps</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyData?.runs ?? []).map((r: any) => (
                    <tr key={r?.id} className="border-b border-border/40 dark:border-white/5 last:border-0 hover:bg-violet/[0.03] dark:hover:bg-violet/5 transition-colors duration-150">
                      <td className="px-4 py-2.5 text-ink-2 dark:text-white/60">{r?.createdAt ? formatDate(r.createdAt) : '\u2014'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-mono font-bold text-violet">{r?.fairValue ?? '\u2014'}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-mono font-bold text-teal">{r?.issuePrice ?? '\u2014'}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-2 dark:text-white/60">{r?.indicativeCoupon ? `${r.indicativeCoupon}%` : '\u2014'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold bg-violet/10 dark:bg-violet/20 text-violet border border-violet/15">
                          {r?.modelUsed ?? '\u2014'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-3 dark:text-white/40 text-[11px]">{r?.computeTimeMs ?? '\u2014'}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet/10 to-violet/5 dark:from-violet/20 dark:to-violet/10 flex items-center justify-center border border-violet/10">
                <History size={24} className="text-violet/30" />
              </div>
              <div className="text-center">
                <p className="text-[13px] text-ink-2 dark:text-white/50 font-body font-medium mb-0.5">
                  Aucun historique
                </p>
                <p className="text-[11px] text-ink-3 dark:text-white/30 font-body">
                  Lancez votre premier pricing pour le voir apparaitre ici.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
