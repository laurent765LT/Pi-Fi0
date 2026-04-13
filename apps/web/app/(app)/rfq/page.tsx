'use client';

import { useState, useMemo } from 'react';
import {
  FileSearch,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  Building2,
  Trophy,
  Star,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Filter,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useCreateRfq,
  useSendRfq,
  useRfq,
  useRfqList,
  useSelectQuote,
  useIssuers,
} from '@/hooks/use-rfq';
import { useProductTemplates } from '@/hooks/use-pricing';

// ─── Constants ──────────────────────────────────────────────────────────────

const STRUCTURE_TYPES = [
  { value: 'AUTOCALL', label: 'Autocall' },
  { value: 'PHOENIX_AUTOCALL', label: 'Phoenix Autocall' },
  { value: 'MEMORY_COUPON', label: 'Memory Coupon' },
  { value: 'REVERSE_CONVERTIBLE', label: 'Reverse Convertible' },
  { value: 'CAPITAL_PROTECTED_NOTE', label: 'Capital Protege' },
  { value: 'BARRIER_REVERSE_CONVERTIBLE', label: 'Barrier RC' },
  { value: 'CAPPED_PARTICIPATION', label: 'Participation Cappee' },
];

const RFQ_MODES = [
  { value: 'MAX_COUPON_AT_PAR', label: 'Coupon max au pair', desc: 'Maximiser le coupon avec prix = 100%' },
  { value: 'BEST_PRICE_FOR_TARGET_COUPON', label: 'Meilleur prix pour coupon cible', desc: 'Fixer le coupon, optimiser le prix' },
  { value: 'STRONGEST_PROTECTION', label: 'Protection maximale', desc: 'Maximiser la protection du capital' },
  { value: 'ISSUER_COMPETITION', label: 'Competition emetteurs', desc: 'Comparer les offres sur des parametres identiques' },
  { value: 'CLIENT_MANDATE', label: 'Mandat client', desc: 'Cahier des charges specifique client' },
];

const UNDERLYINGS = [
  { ticker: '^STOXX50E', name: 'Euro Stoxx 50', type: 'INDEX', spot: 5000, vol: 0.18, div: 0.025 },
  { ticker: '^FCHI', name: 'CAC 40', type: 'INDEX', spot: 7500, vol: 0.20, div: 0.028 },
  { ticker: '^GDAXI', name: 'DAX', type: 'INDEX', spot: 18000, vol: 0.17, div: 0.022 },
  { ticker: '^GSPC', name: 'S&P 500', type: 'INDEX', spot: 5200, vol: 0.15, div: 0.015 },
  { ticker: 'URTH', name: 'MSCI World', type: 'INDEX', spot: 130, vol: 0.15, div: 0.018 },
  { ticker: 'BNP.PA', name: 'BNP Paribas', type: 'SINGLE_STOCK', spot: 60, vol: 0.28, div: 0.06 },
  { ticker: 'SAN.PA', name: 'Sanofi', type: 'SINGLE_STOCK', spot: 95, vol: 0.22, div: 0.035 },
];

const STATUS_STYLES: Record<string, { label: string; variant: string; icon: any }> = {
  DRAFT: { label: 'Brouillon', variant: 'bg-surface-2/80 backdrop-blur-sm text-ink-3 border border-border/40', icon: Clock },
  INTERNALLY_PRICED: { label: 'Price interne', variant: 'bg-cobalt-pale/80 backdrop-blur-sm text-cobalt border border-cobalt/20', icon: BarChart3 },
  RFQ_SENT: { label: 'Envoyee', variant: 'bg-[#FDF3D6]/80 backdrop-blur-sm text-[#9B7210] border border-[#F0D98A]/50', icon: Send },
  PARTIALLY_QUOTED: { label: 'Cotations partielles', variant: 'bg-[#FDF3D6] text-[#9B7210]', icon: Clock },
  FULLY_QUOTED: { label: 'Cotations completes', variant: 'bg-[#D6F7EF]/80 backdrop-blur-sm text-[#007A63] border border-[#007A63]/20', icon: CheckCircle2 },
  SELECTED: { label: 'Selectionne', variant: 'bg-violet-pale/80 backdrop-blur-sm text-violet border border-violet/20', icon: Trophy },
  APPROVED: { label: 'Approuve', variant: 'bg-[#D6F7EF]/80 backdrop-blur-sm text-[#007A63] border border-[#007A63]/20', icon: ShieldCheck },
  REJECTED: { label: 'Rejete', variant: 'bg-[#FDE8EB] text-red', icon: XCircle },
  EXPIRED: { label: 'Expire', variant: 'bg-surface-2 text-ink-3', icon: Clock },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtPct(v: number, digits = 2) {
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtCcy(v: number, ccy = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: ccy, maximumFractionDigits: 0 }).format(v);
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RfqPage() {
  const [tab, setTab] = useState<'create' | 'list' | 'detail'>('list');
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-cobalt shadow-md shadow-violet/20">
              <FileSearch size={18} className="text-white" />
            </span>
            RFQ Screener
          </h1>
          <p className="font-body text-sm text-ink-3 mt-1">
            Envoyez vos demandes de cotation et comparez les offres des emetteurs
          </p>
        </div>

        <button
          onClick={() => setTab('create')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-body text-sm font-semibold transition-all duration-200',
            'bg-gradient-to-r from-violet to-cobalt text-white hover:shadow-lg hover:shadow-violet/25 hover:-translate-y-0.5 active:translate-y-0',
          )}
        >
          <Plus size={16} />
          Nouvelle RFQ
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex border-b border-border mb-6">
        {[
          { key: 'list', label: 'Mes RFQs' },
          { key: 'create', label: 'Nouvelle RFQ' },
          ...(selectedRfqId ? [{ key: 'detail', label: 'Detail' }] : []),
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              'relative inline-flex items-center gap-1.5 px-4 py-2.5',
              'font-body text-sm font-semibold transition-colors duration-150 border-b-2',
              tab === t.key
                ? 'text-violet border-violet bg-violet-pale/20'
                : 'text-ink-3 border-transparent hover:text-ink-2 hover:border-border-2 hover:bg-surface-2/50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      {tab === 'list' && (
        <RfqListTab
          onView={(id) => {
            setSelectedRfqId(id);
            setTab('detail');
          }}
        />
      )}
      {tab === 'create' && (
        <RfqCreateTab
          onCreated={(id) => {
            setSelectedRfqId(id);
            setTab('detail');
          }}
        />
      )}
      {tab === 'detail' && selectedRfqId && (
        <RfqDetailTab rfqId={selectedRfqId} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST TAB
// ═══════════════════════════════════════════════════════════════════════════

function RfqListTab({ onView }: { onView: (id: string) => void }) {
  const { data, isLoading, refetch } = useRfqList({ limit: 50 });
  const [filterStatus, setFilterStatus] = useState<string>('');

  const rfqs = useMemo(() => {
    const list = (data as any)?.data ?? (data as any) ?? [];
    if (!Array.isArray(list)) return [];
    if (!filterStatus) return list;
    return list.filter((r: any) => r.status === filterStatus);
  }, [data, filterStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-violet" />
        <span className="ml-2 font-body text-sm text-ink-3">Chargement des RFQs...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Filter size={14} />
          <span className="font-medium">Filtre :</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-border text-sm font-body bg-white/80 backdrop-blur-sm hover:border-violet/30 focus:border-violet focus:ring-2 focus:ring-violet/10 transition-all duration-200 outline-none"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-body text-ink-2 hover:bg-surface-2 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <RefreshCw size={13} />
          Rafraichir
        </button>
      </div>

      {rfqs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <FileSearch size={40} className="mx-auto text-ink-3/40 mb-3" />
          <p className="text-ink-3 font-body text-sm">Aucune RFQ trouvee</p>
          <p className="text-ink-3/60 font-body text-xs mt-1">Creez votre premiere demande de cotation</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rfqs.map((rfq: any) => {
            const st = STATUS_STYLES[rfq.status] ?? STATUS_STYLES.DRAFT;
            const StIcon = st.icon;
            const config = typeof rfq.productConfig === 'string' ? JSON.parse(rfq.productConfig) : rfq.productConfig;
            const structLabel = STRUCTURE_TYPES.find((s) => s.value === config?.structureType)?.label ?? config?.structureType ?? '—';
            const quoteCount = rfq._count?.quotes ?? rfq.quotes?.length ?? 0;

            return (
              <button
                key={rfq.id}
                onClick={() => onView(rfq.id)}
                className="w-full text-left bg-white border border-border rounded-xl p-4 hover:border-violet/40 hover:shadow-md hover:shadow-violet/10 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-violet before:to-cobalt before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-200 before:rounded-l-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider', st.variant)}>
                      <StIcon size={11} />
                      {st.label}
                    </span>
                    <span className="font-body text-sm font-semibold text-ink truncate">
                      {config?.name ?? 'RFQ sans nom'}
                    </span>
                    <span className="font-body text-xs text-ink-3">
                      {structLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {quoteCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-body text-ink-2">
                        <Building2 size={12} />
                        {quoteCount} cotation{quoteCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-xs font-body text-ink-3">
                      {fmtDate(rfq.createdAt)}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-ink-3 group-hover:text-violet transition-colors"
                    />
                  </div>
                </div>

                {/* Quick summary row */}
                <div className="flex items-center gap-4 mt-2 text-xs text-ink-3 font-body">
                  {config?.nominal && (
                    <span>{fmtCcy(config.nominal, config.currency ?? 'EUR')}</span>
                  )}
                  {config?.underlying?.ticker && (
                    <span>{config.underlying.ticker}</span>
                  )}
                  {rfq.mode && (
                    <span className="bg-surface-2 px-2 py-0.5 rounded text-[10px]">
                      {RFQ_MODES.find((m) => m.value === rfq.mode)?.label ?? rfq.mode}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE TAB
// ═══════════════════════════════════════════════════════════════════════════

function RfqCreateTab({ onCreated }: { onCreated: (id: string) => void }) {
  const createRfq = useCreateRfq();
  const { data: templates } = useProductTemplates();
  const { data: issuersData } = useIssuers();
  const issuers: any[] = Array.isArray(issuersData) ? issuersData : (issuersData as any)?.data ?? [];

  // ── Form state ─────────────────────────────────
  const [step, setStep] = useState(0); // 0=product, 1=constraints, 2=issuers, 3=review

  // Product config
  const [structureType, setStructureType] = useState('PHOENIX_AUTOCALL');
  const [productName, setProductName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [nominal, setNominal] = useState(1000000);
  const [selectedUnderlying, setSelectedUnderlying] = useState(0);

  const today = new Date().toISOString().split('T')[0]!;
  const mat5y = new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0]!;
  const [strikeDate, setStrikeDate] = useState(today);
  const [maturityDate, setMaturityDate] = useState(mat5y);

  // Payoff
  const [couponType, setCouponType] = useState('CONDITIONAL');
  const [couponRate, setCouponRate] = useState(0.08);
  const [couponBarrier, setCouponBarrier] = useState(0.60);
  const [autocallEnabled, setAutocallEnabled] = useState(true);
  const [autocallBarrier, setAutocallBarrier] = useState(1.0);
  const [protectionBarrier, setProtectionBarrier] = useState(0.60);
  const [barrierMonitoring, setBarrierMonitoring] = useState('EUROPEAN');

  // RFQ mode & constraints
  const [rfqMode, setRfqMode] = useState('MAX_COUPON_AT_PAR');
  const [targetCoupon, setTargetCoupon] = useState<number | undefined>(undefined);
  const [minProtection, setMinProtection] = useState<number | undefined>(undefined);
  const [maxMaturity, setMaxMaturity] = useState<number | undefined>(undefined);
  const [clientNote, setClientNote] = useState('');

  // Issuer selection
  const [selectedIssuers, setSelectedIssuers] = useState<string[]>([]);
  const [excludedIssuers, setExcludedIssuers] = useState<string[]>([]);

  // Scoring weights
  const [wYield, setWYield] = useState(30);
  const [wProtection, setWProtection] = useState(25);
  const [wCost, setWCost] = useState(20);
  const [wQuality, setWQuality] = useState(15);
  const [wSimplicity, setWSimplicity] = useState(10);

  // Load template
  const loadTemplate = (tpl: any) => {
    const config = typeof tpl.config === 'string' ? JSON.parse(tpl.config) : tpl.config;
    setStructureType(tpl.structureType ?? config?.structureType ?? 'PHOENIX_AUTOCALL');
    setProductName(tpl.name ?? '');
    if (config?.currency) setCurrency(config.currency);
    if (config?.nominal) setNominal(config.nominal);
    if (config?.payoff) {
      if (config.payoff.couponType) setCouponType(config.payoff.couponType);
      if (config.payoff.couponRate != null) setCouponRate(config.payoff.couponRate);
      if (config.payoff.couponBarrier != null) setCouponBarrier(config.payoff.couponBarrier);
      if (config.payoff.autocallEnabled != null) setAutocallEnabled(config.payoff.autocallEnabled);
      if (config.payoff.autocallBarrier != null) setAutocallBarrier(config.payoff.autocallBarrier);
      if (config.payoff.protectionBarrier != null) setProtectionBarrier(config.payoff.protectionBarrier);
      if (config.payoff.barrierMonitoring) setBarrierMonitoring(config.payoff.barrierMonitoring);
    }
  };

  const toggleIssuer = (id: string) => {
    setSelectedIssuers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    // If selected, make sure not excluded
    setExcludedIssuers((prev) => prev.filter((x) => x !== id));
  };

  const toggleExcluded = (id: string) => {
    setExcludedIssuers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSelectedIssuers((prev) => prev.filter((x) => x !== id));
  };

  // Build config
  const buildConfig = () => {
    const u = UNDERLYINGS[selectedUnderlying]!;
    return {
      productConfig: {
        name: productName || `RFQ ${structureType}`,
        structureType,
        currency,
        nominal,
        underlying: {
          ticker: u.ticker,
          name: u.name,
          type: u.type,
          spotPrice: u.spot,
          impliedVol: u.vol,
          dividendYield: u.div,
        },
        schedule: {
          strikeDate,
          maturityDate,
          frequency: 'QUARTERLY',
          observationDates: [],
        },
        payoff: {
          couponType,
          couponRate,
          couponBarrier,
          couponMemory: couponType === 'MEMORY',
          autocallEnabled,
          autocallBarrier,
          autocallStepDown: 0,
          protectionBarrier,
          barrierMonitoring,
          capitalGuaranteeLevel: structureType === 'CAPITAL_PROTECTED_NOTE' ? 1.0 : undefined,
          participationRate: 1.0,
          cap: undefined,
        },
        market: {
          riskFreeRate: 0.035,
          fundingSpread: 0.005,
          structuringMargin: 0.015,
          distributionFee: 0.005,
        },
        monteCarlo: {
          numPaths: 50000,
          timeStepsPerYear: 252,
          seed: 42,
        },
      },
      mode: rfqMode,
      constraints: {
        targetCoupon,
        minProtection,
        maxMaturity,
      },
      scoringWeights: {
        yield: wYield / 100,
        protection: wProtection / 100,
        cost: wCost / 100,
        quality: wQuality / 100,
        simplicity: wSimplicity / 100,
      },
      preferredIssuers: selectedIssuers.length > 0 ? selectedIssuers : undefined,
      excludedIssuers: excludedIssuers.length > 0 ? excludedIssuers : undefined,
      clientNote: clientNote || undefined,
    };
  };

  const handleCreate = async () => {
    const payload = buildConfig();
    try {
      const res = await createRfq.mutateAsync(payload);
      const id = (res as any)?.id ?? (res as any)?.data?.id;
      if (id) onCreated(id);
    } catch {
      // Error handled by react-query
    }
  };

  const totalWeight = wYield + wProtection + wCost + wQuality + wSimplicity;

  const steps = ['Produit', 'Contraintes', 'Emetteurs', 'Recapitulatif'];

  return (
    <div>
      {/* ── Stepper ─────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-semibold transition',
                i === step
                  ? 'bg-gradient-to-r from-violet to-cobalt text-white shadow-md shadow-violet/20'
                  : i < step
                    ? 'bg-violet-pale text-violet ring-1 ring-violet/20'
                    : 'bg-surface-2 text-ink-3 hover:bg-surface-2/80',
              )}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                {i < step ? <CheckCircle2 size={12} /> : i + 1}
              </span>
              {s}
            </button>
            {i < steps.length - 1 && <ArrowRight size={14} className="text-ink-3/40" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Product ─────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Templates */}
          {Array.isArray((templates as any)?.data ?? templates) && (
            <div>
              <label className="block text-xs font-body font-bold text-ink-3 uppercase tracking-wider mb-2">
                Charger un template
              </label>
              <div className="flex flex-wrap gap-2">
                {((templates as any)?.data ?? templates as any[])?.map((tpl: any) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl)}
                    className="px-3 py-1.5 rounded-md border border-border text-xs font-body font-medium text-ink-2 hover:border-violet/40 hover:bg-violet-pale/30 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                  >
                    <Copy size={10} className="inline mr-1 -mt-0.5" />
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom du produit">
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="input-field"
                placeholder="Phoenix Autocall Euro Stoxx 50"
              />
            </Field>
            <Field label="Type de structure">
              <select
                value={structureType}
                onChange={(e) => setStructureType(e.target.value)}
                className="input-field"
              >
                {STRUCTURE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Devise">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </Field>
            <Field label="Nominal">
              <input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(Number(e.target.value))}
                className="input-field"
              />
            </Field>
          </div>

          {/* Underlying */}
          <Field label="Sous-jacent">
            <div className="grid grid-cols-3 gap-2">
              {UNDERLYINGS.map((u, i) => (
                <button
                  key={u.ticker}
                  onClick={() => setSelectedUnderlying(i)}
                  className={cn(
                    'text-left p-3 rounded-lg border transition text-xs font-body',
                    i === selectedUnderlying
                      ? 'border-violet bg-violet-pale/40 text-violet ring-1 ring-violet/20 shadow-sm shadow-violet/10'
                      : 'border-border hover:border-violet/30 hover:-translate-y-0.5 hover:shadow-sm',
                  )}
                >
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-ink-3 text-[10px] mt-0.5">{u.ticker} | Vol {fmtPct(u.vol, 0)}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de strike">
              <input type="date" value={strikeDate} onChange={(e) => setStrikeDate(e.target.value)} className="input-field" />
            </Field>
            <Field label="Date de maturite">
              <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className="input-field" />
            </Field>
          </div>

          {/* Payoff params */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Type de coupon">
              <select value={couponType} onChange={(e) => setCouponType(e.target.value)} className="input-field">
                <option value="NONE">Aucun</option>
                <option value="FIXED">Fixe</option>
                <option value="CONDITIONAL">Conditionnel</option>
                <option value="MEMORY">Memoire</option>
              </select>
            </Field>
            <Field label="Coupon (%)">
              <input
                type="number"
                step="0.01"
                value={(couponRate * 100).toFixed(2)}
                onChange={(e) => setCouponRate(Number(e.target.value) / 100)}
                className="input-field"
              />
            </Field>
            <Field label="Barriere coupon (%)">
              <input
                type="number"
                step="1"
                value={(couponBarrier * 100).toFixed(0)}
                onChange={(e) => setCouponBarrier(Number(e.target.value) / 100)}
                className="input-field"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Autocall">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autocallEnabled}
                  onChange={(e) => setAutocallEnabled(e.target.checked)}
                  className="accent-violet"
                />
                <span className="text-sm font-body">Actif</span>
              </label>
            </Field>
            {autocallEnabled && (
              <Field label="Barriere autocall (%)">
                <input
                  type="number"
                  step="1"
                  value={(autocallBarrier * 100).toFixed(0)}
                  onChange={(e) => setAutocallBarrier(Number(e.target.value) / 100)}
                  className="input-field"
                />
              </Field>
            )}
            <Field label="Barriere protection (%)">
              <input
                type="number"
                step="1"
                value={(protectionBarrier * 100).toFixed(0)}
                onChange={(e) => setProtectionBarrier(Number(e.target.value) / 100)}
                className="input-field"
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(1)} className="btn-primary">
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Constraints ─────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <Field label="Mode de consultation">
            <div className="grid grid-cols-1 gap-2">
              {RFQ_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setRfqMode(m.value)}
                  className={cn(
                    'text-left p-3 rounded-lg border transition',
                    rfqMode === m.value
                      ? 'border-violet bg-gradient-to-r from-violet-pale/60 to-cobalt-pale/40 ring-1 ring-violet/20'
                      : 'border-border hover:border-violet/30 hover:-translate-y-0.5 hover:shadow-sm',
                  )}
                >
                  <div className="font-body text-sm font-semibold text-ink">{m.label}</div>
                  <div className="font-body text-xs text-ink-3 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          {rfqMode === 'BEST_PRICE_FOR_TARGET_COUPON' && (
            <Field label="Coupon cible (%)">
              <input
                type="number"
                step="0.1"
                value={targetCoupon != null ? (targetCoupon * 100).toFixed(1) : ''}
                onChange={(e) => setTargetCoupon(Number(e.target.value) / 100)}
                className="input-field"
                placeholder="ex: 8.0"
              />
            </Field>
          )}

          {rfqMode === 'STRONGEST_PROTECTION' && (
            <Field label="Protection minimale (%)">
              <input
                type="number"
                step="1"
                value={minProtection != null ? (minProtection * 100).toFixed(0) : ''}
                onChange={(e) => setMinProtection(Number(e.target.value) / 100)}
                className="input-field"
                placeholder="ex: 50"
              />
            </Field>
          )}

          {/* Scoring weights */}
          <div>
            <label className="block text-xs font-body font-bold text-ink-3 uppercase tracking-wider mb-3">
              Poids du scoring ({totalWeight}%)
            </label>
            {totalWeight !== 100 && (
              <p className="text-xs text-red font-body mb-2">
                <AlertTriangle size={12} className="inline -mt-0.5 mr-1" />
                Le total doit etre 100%
              </p>
            )}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Rendement', val: wYield, set: setWYield },
                { label: 'Protection', val: wProtection, set: setWProtection },
                { label: 'Cout', val: wCost, set: setWCost },
                { label: 'Qualite', val: wQuality, set: setWQuality },
                { label: 'Simplicite', val: wSimplicity, set: setWSimplicity },
              ].map((w) => (
                <div key={w.label} className="text-center">
                  <input
                    type="number"
                    value={w.val}
                    onChange={(e) => w.set(Number(e.target.value))}
                    className="input-field text-center"
                    min={0}
                    max={100}
                  />
                  <div className="text-[10px] font-body text-ink-3 mt-1">{w.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Field label="Note client (optionnel)">
            <textarea
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Instructions specifiques pour les emetteurs..."
            />
          </Field>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn-outline">Precedent</button>
            <button onClick={() => setStep(2)} className="btn-primary">
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Issuers ─────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <p className="font-body text-sm text-ink-3">
            Selectionnez les emetteurs a solliciter. Laissez vide pour envoyer a tous.
          </p>

          {issuers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Building2 size={32} className="mx-auto text-ink-3/40 mb-2" />
              <p className="text-sm text-ink-3 font-body">Aucun emetteur configure</p>
              <p className="text-xs text-ink-3/60 font-body">Executez le seed pour charger les profils emetteurs</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {issuers.map((issuer: any) => {
                const isSelected = selectedIssuers.includes(issuer.id);
                const isExcluded = excludedIssuers.includes(issuer.id);

                return (
                  <div
                    key={issuer.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all duration-200 relative overflow-hidden',
                      isSelected
                        ? 'border-violet bg-violet-pale/30 ring-1 ring-violet/30 shadow-md shadow-violet/10 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-violet before:to-cobalt before:rounded-l-xl'
                        : isExcluded
                          ? 'border-red/30 bg-[#FDE8EB]/30 opacity-60'
                          : 'border-border hover:border-violet/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet/5',
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-body text-sm font-semibold text-ink">{issuer.name}</div>
                        <div className="font-body text-[10px] text-ink-3">
                          {issuer.legalEntity ?? ''} | Min: {fmtCcy(issuer.minTicketSize ?? 0)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleIssuer(issuer.id)}
                          className={cn(
                            'p-1.5 rounded-md text-xs transition',
                            isSelected
                              ? 'bg-violet text-white'
                              : 'bg-surface-2 text-ink-3 hover:bg-violet-pale hover:text-violet',
                          )}
                          title="Selectionner"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleExcluded(issuer.id)}
                          className={cn(
                            'p-1.5 rounded-md text-xs transition',
                            isExcluded
                              ? 'bg-red text-white'
                              : 'bg-surface-2 text-ink-3 hover:bg-[#FDE8EB] hover:text-red',
                          )}
                          title="Exclure"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Issuer details */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(issuer.structureTypes as string[])?.slice(0, 3).map((st: string) => (
                        <span key={st} className="px-1.5 py-0.5 rounded bg-surface-2 text-[9px] font-body font-medium text-ink-3">
                          {STRUCTURE_TYPES.find((s) => s.value === st)?.label ?? st}
                        </span>
                      ))}
                      {(issuer.structureTypes as string[])?.length > 3 && (
                        <span className="text-[9px] text-ink-3">+{issuer.structureTypes.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-3 font-body">
                      <span>Funding: {issuer.fundingSpread ? `+${(issuer.fundingSpread * 10000).toFixed(0)}bps` : '—'}</span>
                      <span>Max: {issuer.maxMaturityMonths ? `${issuer.maxMaturityMonths}m` : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-outline">Precedent</button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ─────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-border/60 rounded-xl p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <span className="inline-block w-1 h-5 rounded-full bg-gradient-to-b from-violet to-cobalt"></span>
              Recapitulatif de la RFQ
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm font-body">
              <div>
                <span className="text-ink-3">Produit :</span>{' '}
                <span className="font-semibold text-ink">{productName || 'Sans nom'}</span>
              </div>
              <div>
                <span className="text-ink-3">Structure :</span>{' '}
                <span className="font-semibold text-ink">
                  {STRUCTURE_TYPES.find((s) => s.value === structureType)?.label}
                </span>
              </div>
              <div>
                <span className="text-ink-3">Sous-jacent :</span>{' '}
                <span className="font-semibold text-ink">{UNDERLYINGS[selectedUnderlying]?.name}</span>
              </div>
              <div>
                <span className="text-ink-3">Nominal :</span>{' '}
                <span className="font-semibold text-ink">{fmtCcy(nominal, currency)}</span>
              </div>
              <div>
                <span className="text-ink-3">Coupon :</span>{' '}
                <span className="font-semibold text-ink">{couponType} {fmtPct(couponRate)}</span>
              </div>
              <div>
                <span className="text-ink-3">Protection :</span>{' '}
                <span className="font-semibold text-ink">{fmtPct(protectionBarrier)} ({barrierMonitoring})</span>
              </div>
              <div>
                <span className="text-ink-3">Mode :</span>{' '}
                <span className="font-semibold text-ink">{RFQ_MODES.find((m) => m.value === rfqMode)?.label}</span>
              </div>
              <div>
                <span className="text-ink-3">Maturite :</span>{' '}
                <span className="font-semibold text-ink">{fmtDate(strikeDate)} — {fmtDate(maturityDate)}</span>
              </div>
            </div>

            {selectedIssuers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs font-body font-bold text-ink-3 uppercase tracking-wider">Emetteurs selectionnes</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedIssuers.map((id) => {
                    const issuer = issuers.find((i: any) => i.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-pale text-violet text-xs font-body font-medium">
                        <Building2 size={10} />
                        {issuer?.name ?? id}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {excludedIssuers.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-body text-ink-3">Exclus : </span>
                {excludedIssuers.map((id) => {
                  const issuer = issuers.find((i: any) => i.id === id);
                  return (
                    <span key={id} className="text-xs text-red font-body mr-2">{issuer?.name ?? id}</span>
                  );
                })}
              </div>
            )}

            {clientNote && (
              <div className="mt-4 p-3 bg-surface-2 rounded-lg text-sm font-body text-ink-2">
                <span className="font-semibold text-ink-3 text-xs uppercase">Note : </span>
                {clientNote}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-outline">Precedent</button>
            <button
              onClick={handleCreate}
              disabled={createRfq.isPending}
              className="btn-primary"
            >
              {createRfq.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              Creer la RFQ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL TAB — View RFQ + Quotes
// ═══════════════════════════════════════════════════════════════════════════

function RfqDetailTab({ rfqId }: { rfqId: string }) {
  const { data: rfqData, isLoading, refetch } = useRfq(rfqId);
  const sendRfq = useSendRfq();
  const selectQuote = useSelectQuote();

  const rfq: any = (rfqData as any)?.data ?? rfqData;
  const config = rfq ? (typeof rfq.productConfig === 'string' ? JSON.parse(rfq.productConfig) : rfq.productConfig) : null;
  const quotes: any[] = rfq?.quotes ?? [];

  if (isLoading || !rfq) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-violet" />
        <span className="ml-2 font-body text-sm text-ink-3">Chargement de la RFQ...</span>
      </div>
    );
  }

  const st = STATUS_STYLES[rfq.status] ?? STATUS_STYLES.DRAFT;
  const StIcon = st.icon;
  const canSend = rfq.status === 'DRAFT' || rfq.status === 'INTERNALLY_PRICED';
  const canSelect = rfq.status === 'FULLY_QUOTED' || rfq.status === 'PARTIALLY_QUOTED';

  // Sort quotes by score
  const sortedQuotes = [...quotes].sort((a: any, b: any) => (b.totalScore ?? 0) - (a.totalScore ?? 0));

  const handleSend = async () => {
    try {
      await sendRfq.mutateAsync(rfqId);
    } catch {
      // handled by react-query
    }
  };

  const handleSelect = async (quoteId: string) => {
    try {
      await selectQuote.mutateAsync({ rfqId, quoteId });
    } catch {
      // handled by react-query
    }
  };

  return (
    <div className="space-y-6">
      {/* ── RFQ Header ─────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-sm border border-border/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider', st.variant)}>
              <StIcon size={13} />
              {st.label}
            </span>
            <h2 className="font-display text-lg font-bold text-ink">
              {config?.name ?? 'RFQ'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-md border border-border text-ink-3 hover:bg-surface-2 transition"
            >
              <RefreshCw size={14} />
            </button>
            {canSend && (
              <button
                onClick={handleSend}
                disabled={sendRfq.isPending}
                className="btn-primary"
              >
                {sendRfq.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Envoyer aux emetteurs
              </button>
            )}
          </div>
        </div>

        {/* RFQ summary grid */}
        <div className="grid grid-cols-4 gap-4 text-sm font-body">
          <SummaryCell label="Structure" value={STRUCTURE_TYPES.find((s) => s.value === config?.structureType)?.label ?? '—'} />
          <SummaryCell label="Sous-jacent" value={config?.underlying?.name ?? '—'} />
          <SummaryCell label="Nominal" value={config?.nominal ? fmtCcy(config.nominal, config.currency) : '—'} />
          <SummaryCell label="Mode" value={RFQ_MODES.find((m) => m.value === rfq.mode)?.label ?? rfq.mode ?? '—'} />
        </div>

        {(rfq.status === 'RFQ_SENT' || rfq.status === 'PARTIALLY_QUOTED') && (
          <div className="mt-4 p-3 bg-gradient-to-r from-[#FDF3D6] to-[#FEF9E7] border border-[#F0D98A]/60 rounded-lg flex items-center gap-2 text-sm font-body text-[#9B7210] shadow-sm animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            Cotations en cours de generation... Rafraichissement automatique toutes les 3s.
          </div>
        )}
      </div>

      {/* ── Quotes Comparison ─────────────────────── */}
      {sortedQuotes.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-violet" />
            Cotations ({sortedQuotes.length})
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {sortedQuotes.map((q: any, idx: number) => {
              const result = typeof q.pricingResult === 'string' ? JSON.parse(q.pricingResult) : q.pricingResult;
              const issuer = q.issuer ?? q.issuerProfile;
              const isWinner = idx === 0;
              const isSelected = q.status === 'ACCEPTED';
              const isDeclined = q.status === 'DECLINED';

              return (
                <div
                  key={q.id}
                  className={cn(
                    'bg-white border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5',
                    isSelected
                      ? 'border-[#007A63] ring-2 ring-[#007A63]/20 bg-[#D6F7EF]/10 shadow-md shadow-[#007A63]/10'
                      : isDeclined
                        ? 'border-border opacity-50 hover:translate-y-0'
                        : isWinner
                          ? 'border-violet ring-1 ring-violet/20 shadow-lg shadow-violet/10 bg-gradient-to-r from-violet-pale/10 to-transparent'
                          : 'border-border hover:border-violet/30 hover:shadow-md hover:shadow-violet/5',
                  )}
                >
                  <div className="flex items-start justify-between">
                    {/* Issuer info */}
                    <div className="flex items-center gap-3">
                      {isWinner && !isSelected && !isDeclined && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                          <Trophy size={14} className="text-white" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-[#007A63] flex items-center justify-center">
                          <CheckCircle2 size={14} className="text-white" />
                        </div>
                      )}
                      {!isWinner && !isSelected && (
                        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-ink-3">
                          #{idx + 1}
                        </div>
                      )}
                      <div>
                        <div className="font-body text-sm font-bold text-ink">
                          {issuer?.name ?? 'Emetteur inconnu'}
                        </div>
                        <div className="font-body text-[10px] text-ink-3">
                          {issuer?.legalEntity ?? ''}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      {isWinner && !isSelected && !isDeclined ? (
                        <div className="font-display text-2xl font-extrabold bg-gradient-to-r from-violet to-cobalt bg-clip-text text-transparent">
                          {q.totalScore != null ? q.totalScore.toFixed(1) : '—'}
                        </div>
                      ) : (
                        <div className="font-display text-2xl font-extrabold text-ink">
                          {q.totalScore != null ? q.totalScore.toFixed(1) : '—'}
                        </div>
                      )}
                      <div className="text-[10px] font-body text-ink-3 uppercase tracking-wider">Score</div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-border/60">
                    <MetricCell
                      label="Prix"
                      value={result?.fairValue != null ? fmtPct(result.fairValue / 100, 2) : '—'}
                      accent={isWinner}
                    />
                    <MetricCell
                      label="Coupon"
                      value={result?.effectiveCoupon != null ? fmtPct(result.effectiveCoupon) : config?.payoff?.couponRate ? fmtPct(config.payoff.couponRate) : '—'}
                      accent={isWinner}
                    />
                    <MetricCell
                      label="Protection"
                      value={config?.payoff?.protectionBarrier ? fmtPct(config.payoff.protectionBarrier) : '—'}
                    />
                    <MetricCell
                      label="Marge emetteur"
                      value={result?.costs?.structuringMargin != null ? fmtPct(result.costs.structuringMargin) : '—'}
                    />
                    <MetricCell
                      label="P(Autocall)"
                      value={result?.autocallProbability != null ? fmtPct(result.autocallProbability) : '—'}
                    />
                  </div>

                  {/* Score breakdown */}
                  {q.scoreBreakdown && (
                    <div className="mt-3 flex items-center gap-3">
                      {Object.entries(typeof q.scoreBreakdown === 'string' ? JSON.parse(q.scoreBreakdown) : q.scoreBreakdown).map(
                        ([key, val]) => (
                          <div key={key} className="flex items-center gap-1 text-[10px] font-body text-ink-3">
                            <span className="capitalize">{key}:</span>
                            <span className="font-semibold text-ink-2">{(val as number).toFixed(1)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  {q.comment && (
                    <div className="mt-3 p-2.5 bg-surface-2 rounded-lg text-xs font-body text-ink-2 italic">
                      &ldquo;{q.comment}&rdquo;
                    </div>
                  )}

                  {/* Actions */}
                  {canSelect && !isSelected && !isDeclined && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleSelect(q.id)}
                        disabled={selectQuote.isPending}
                        className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body text-sm font-semibold transition-all',
                          isWinner
                            ? 'bg-gradient-to-r from-violet to-cobalt text-white hover:shadow-lg hover:shadow-violet/25 hover:-translate-y-0.5'
                            : 'bg-surface-2 text-ink-2 hover:bg-violet-pale hover:text-violet hover:-translate-y-0.5 hover:shadow-sm',
                        )}
                      >
                        {selectQuote.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        Selectionner cette offre
                      </button>
                    </div>
                  )}

                  {isSelected && (
                    <div className="mt-4 p-2 bg-gradient-to-r from-[#D6F7EF] to-[#E8FCF5] border border-[#A3EDD9]/60 rounded-lg text-center text-sm font-body font-semibold text-[#007A63] shadow-sm">
                      <CheckCircle2 size={14} className="inline -mt-0.5 mr-1" />
                      Offre selectionnee
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No quotes yet */}
      {sortedQuotes.length === 0 && rfq.status !== 'DRAFT' && rfq.status !== 'INTERNALLY_PRICED' && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Clock size={40} className="mx-auto text-ink-3/40 mb-3" />
          <p className="text-ink-3 font-body text-sm">En attente des cotations...</p>
        </div>
      )}

      {sortedQuotes.length === 0 && (rfq.status === 'DRAFT' || rfq.status === 'INTERNALLY_PRICED') && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Send size={40} className="mx-auto text-ink-3/40 mb-3" />
          <p className="text-ink-3 font-body text-sm">Envoyez la RFQ pour recevoir des cotations</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════════════════════════════════════

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-body font-bold text-ink-3 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-surface-2/70 backdrop-blur-sm rounded-lg border border-border/30 hover:shadow-sm transition-all duration-200">
      <div className="text-[10px] font-body font-bold text-ink-3 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-body font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}

function MetricCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center p-2 rounded-lg hover:bg-surface-2/50 transition-colors duration-200">
      <div className={cn('font-display text-lg font-bold', accent ? 'text-violet' : 'text-ink')}>
        {value}
      </div>
      <div className="text-[10px] font-body text-ink-3 uppercase tracking-wider">{label}</div>
    </div>
  );
}
