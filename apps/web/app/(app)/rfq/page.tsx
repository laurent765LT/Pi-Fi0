'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { ToastContainer, useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
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
  { value: 'CAPITAL_PROTECTED_NOTE', label: 'Capital Protégé' },
  { value: 'BARRIER_REVERSE_CONVERTIBLE', label: 'Barrier RC' },
  { value: 'CAPPED_PARTICIPATION', label: 'Participation Cappée' },
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

function safeJsonParse<T = any>(value: unknown, fallback: T | null = null): T | null {
  if (typeof value !== 'string') return value as T;
  try { return JSON.parse(value); } catch { return fallback; }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RfqPage() {
  useEffect(() => { document.title = "RFQ Screener | Strick'in"; }, []);
  const [tab, setTab] = useState<'create' | 'list' | 'detail'>('list');
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);

  return (
    <div className="animate-fade-in min-h-screen">
      <PageHeader
        icon={FileSearch}
        title="RFQ Screener"
        subtitle="Envoyez vos demandes de cotation et comparez les offres des emetteurs"
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
      >
        <button
          onClick={() => setTab('create')}
          className={cn(
            'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
            'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
            'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
          )}
        >
          <Plus size={16} />
          Nouvelle RFQ
        </button>
      </PageHeader>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-white/60 dark:bg-white/5 backdrop-blur-sm p-1 rounded-xl border border-border/60 w-fit">
        {[
          { key: 'list', label: 'Mes RFQs' },
          { key: 'create', label: 'Nouvelle RFQ' },
          ...(selectedRfqId ? [{ key: 'detail', label: 'Detail' }] : []),
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={cn(
              'relative inline-flex items-center gap-1.5 px-4 py-2 rounded-lg',
              'font-body text-[13px] font-semibold transition-all duration-200',
              tab === t.key
                ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20'
                : 'text-ink-3 hover:text-ink hover:bg-white/80 dark:hover:bg-white/10',
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
      <div className="flex items-center gap-3 mb-5 bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Filter size={14} className="text-[#3B1FA8]" />
          <span className="font-semibold font-body text-[12px] uppercase tracking-wider">Filtre</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={cn(
            'h-9 px-3 rounded-lg border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
            'text-[13px] font-body text-ink',
            'hover:border-violet/40 focus:border-violet focus:ring-2 focus:ring-violet/15 focus:shadow-md',
            'transition-all duration-200 outline-none',
          )}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className={cn(
            'ml-auto h-9 px-4 rounded-lg border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
            'text-[12px] font-semibold font-body text-ink-2 inline-flex items-center gap-1.5',
            'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md hover:shadow-violet/10',
            'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
          )}
        >
          <RefreshCw size={13} />
          Rafraichir
        </button>
      </div>

      {rfqs.length === 0 ? (
        <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-border/60 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-40" style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4, #3D63F5)' }} />
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#5B3FD4]/5 flex items-center justify-center mb-4">
              <FileSearch size={28} className="text-ink-3/40" />
            </div>
            <p className="text-ink-3 font-body text-sm font-medium">Aucune RFQ trouvee</p>
            <p className="text-ink-3/60 font-body text-xs mt-1">Creez votre premiere demande de cotation</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((rfq: any) => {
            const st = STATUS_STYLES[rfq.status] ?? STATUS_STYLES.DRAFT;
            const StIcon = st.icon;
            const config = safeJsonParse(rfq.productConfig);
            const structLabel = STRUCTURE_TYPES.find((s) => s.value === config?.structureType)?.label ?? config?.structureType ?? '—';
            const quoteCount = rfq._count?.quotes ?? rfq.quotes?.length ?? 0;

            return (
              <button
                key={rfq.id}
                onClick={() => onView(rfq.id)}
                className={cn(
                  'group w-full text-left bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60',
                  'ring-1 ring-black/[0.03] overflow-hidden',
                  'p-4 transition-all duration-200',
                  'hover:shadow-lg hover:shadow-violet/5 hover:-translate-y-0.5 hover:border-violet/40',
                  'relative before:absolute before:inset-y-0 before:left-0 before:w-1',
                  'before:bg-gradient-to-b before:from-[#3B1FA8] before:to-[#5B3FD4]',
                  'before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-200 before:rounded-l-xl',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider', st.variant)}>
                      <StIcon size={11} />
                      {st.label}
                    </span>
                    <span className="font-body text-[13px] font-semibold text-ink truncate">
                      {config?.name ?? 'RFQ sans nom'}
                    </span>
                    <span className="hidden sm:inline-block font-body text-xs text-ink-3 bg-surface-2/60 px-2 py-0.5 rounded-md">
                      {structLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {quoteCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-body text-ink-2 bg-surface-2/60 px-2 py-0.5 rounded-md">
                        <Building2 size={12} />
                        {quoteCount} cotation{quoteCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-ink-3">
                      {fmtDate(rfq.createdAt)}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-ink-3 group-hover:text-violet group-hover:translate-x-0.5 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Quick summary row */}
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-ink-3 font-body">
                  {config?.nominal && (
                    <span className="bg-surface-2/50 px-2 py-0.5 rounded-md font-medium">{fmtCcy(config.nominal, config.currency ?? 'EUR')}</span>
                  )}
                  {config?.underlying?.ticker && (
                    <span className="bg-surface-2/50 px-2 py-0.5 rounded-md font-mono text-[10px]">{config.underlying.ticker}</span>
                  )}
                  {rfq.mode && (
                    <span className="bg-[#3B1FA8]/5 text-[#3B1FA8] px-2 py-0.5 rounded-md text-[10px] font-medium">
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
    const config = safeJsonParse(tpl.config);
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

  const steps = ['Produit', 'Contraintes', 'Émetteurs', 'Récapitulatif'];

  return (
    <div>
      {/* ── Stepper ─────────────────────────────── */}
      <div className="flex items-center gap-2 mb-8 bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 p-3 shadow-sm">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-body font-semibold transition-all duration-200',
                i === step
                  ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20'
                  : i < step
                    ? 'bg-[#3B1FA8]/8 text-[#3B1FA8] ring-1 ring-[#3B1FA8]/15'
                    : 'bg-surface-2/60 text-ink-3 hover:bg-surface-2',
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                  i === step ? 'bg-white/20' : i < step ? 'bg-[#3B1FA8]/10' : 'bg-white/60',
                )}
              >
                {i < step ? <CheckCircle2 size={12} /> : i + 1}
              </span>
              {s}
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-6 h-px transition-colors duration-200',
                i < step ? 'bg-[#3B1FA8]/30' : 'bg-border/60',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Product ─────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Templates */}
          {Array.isArray((templates as any)?.data ?? templates) && (
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-5 shadow-sm">
              <label className="block text-[10px] font-body font-bold text-ink-3 uppercase tracking-[0.2em] mb-3">
                Charger un template
              </label>
              <div className="flex flex-wrap gap-2">
                {((templates as any)?.data ?? templates as any[])?.map((tpl: any) => (
                  <button
                    key={tpl.id}
                    onClick={() => loadTemplate(tpl)}
                    className={cn(
                      'px-3 py-2 rounded-lg border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
                      'text-[12px] font-body font-medium text-ink-2',
                      'hover:border-violet/40 hover:bg-violet-ghost hover:text-violet hover:shadow-md hover:shadow-violet/10',
                      'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    )}
                  >
                    <Copy size={10} className="inline mr-1.5 -mt-0.5" />
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-60" style={{ background: '#3B1FA8' }} />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <PremiumField label="Nom du produit">
                  <input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="premium-input"
                    placeholder="Phoenix Autocall Euro Stoxx 50"
                  />
                </PremiumField>
                <PremiumField label="Type de structure">
                  <select
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
                    className="premium-input"
                  >
                    {STRUCTURE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </PremiumField>
                <PremiumField label="Devise">
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="premium-input">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="CHF">CHF</option>
                  </select>
                </PremiumField>
                <PremiumField label="Nominal">
                  <input
                    type="number"
                    value={nominal}
                    onChange={(e) => setNominal(Number(e.target.value))}
                    className="premium-input"
                  />
                </PremiumField>
              </div>

              {/* Underlying */}
              <PremiumField label="Sous-jacent">
                <div className="grid grid-cols-3 gap-2">
                  {UNDERLYINGS.map((u, i) => (
                    <button
                      key={u.ticker}
                      onClick={() => setSelectedUnderlying(i)}
                      className={cn(
                        'text-left p-3 rounded-xl border transition-all duration-200 text-xs font-body',
                        i === selectedUnderlying
                          ? 'border-[#3B1FA8] bg-[#3B1FA8]/5 text-[#3B1FA8] ring-1 ring-[#3B1FA8]/20 shadow-md shadow-violet/10'
                          : 'border-border/60 bg-white/60 dark:bg-white/5 hover:border-violet/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet/5',
                      )}
                    >
                      <div className="font-semibold text-[12px]">{u.name}</div>
                      <div className="text-ink-3 text-[10px] mt-1 font-mono">{u.ticker} | Vol {fmtPct(u.vol, 0)}</div>
                    </button>
                  ))}
                </div>
              </PremiumField>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <PremiumField label="Date de strike">
                  <input type="date" value={strikeDate} onChange={(e) => setStrikeDate(e.target.value)} className="premium-input" />
                </PremiumField>
                <PremiumField label="Date de maturite">
                  <input type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className="premium-input" />
                </PremiumField>
              </div>

              {/* Payoff params */}
              <div className="grid grid-cols-3 gap-4">
                <PremiumField label="Type de coupon">
                  <select value={couponType} onChange={(e) => setCouponType(e.target.value)} className="premium-input">
                    <option value="NONE">Aucun</option>
                    <option value="FIXED">Fixe</option>
                    <option value="CONDITIONAL">Conditionnel</option>
                    <option value="MEMORY">Memoire</option>
                  </select>
                </PremiumField>
                <PremiumField label="Coupon (%)">
                  <input
                    type="number"
                    step="0.01"
                    value={(couponRate * 100).toFixed(2)}
                    onChange={(e) => setCouponRate(Number(e.target.value) / 100)}
                    className="premium-input"
                  />
                </PremiumField>
                <PremiumField label="Barriere coupon (%)">
                  <input
                    type="number"
                    step="1"
                    value={(couponBarrier * 100).toFixed(0)}
                    onChange={(e) => setCouponBarrier(Number(e.target.value) / 100)}
                    className="premium-input"
                  />
                </PremiumField>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <PremiumField label="Autocall">
                  <label className="flex items-center gap-2.5 h-10 px-4 rounded-lg border border-border/60 bg-white/80 dark:bg-white/10">
                    <input
                      type="checkbox"
                      checked={autocallEnabled}
                      onChange={(e) => setAutocallEnabled(e.target.checked)}
                      className="accent-[#3B1FA8] w-4 h-4"
                    />
                    <span className="text-[13px] font-body font-medium text-ink">Actif</span>
                  </label>
                </PremiumField>
                {autocallEnabled && (
                  <PremiumField label="Barrière autocall (%)">
                    <input
                      type="number"
                      step="1"
                      value={(autocallBarrier * 100).toFixed(0)}
                      onChange={(e) => setAutocallBarrier(Number(e.target.value) / 100)}
                      className="premium-input"
                    />
                  </PremiumField>
                )}
                <PremiumField label="Barriere protection (%)">
                  <input
                    type="number"
                    step="1"
                    value={(protectionBarrier * 100).toFixed(0)}
                    onChange={(e) => setProtectionBarrier(Number(e.target.value) / 100)}
                    className="premium-input"
                  />
                </PremiumField>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(1)} className={cn(
              'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
              'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
              'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Constraints ─────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-6 shadow-sm">
            <PremiumField label="Mode de consultation">
              <div className="grid grid-cols-1 gap-2">
                {RFQ_MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setRfqMode(m.value)}
                    className={cn(
                      'text-left p-4 rounded-xl border transition-all duration-200',
                      rfqMode === m.value
                        ? 'border-[#3B1FA8] bg-gradient-to-r from-[#3B1FA8]/5 to-[#5B3FD4]/3 ring-1 ring-[#3B1FA8]/20 shadow-md shadow-violet/10'
                        : 'border-border/60 bg-white/60 dark:bg-white/5 hover:border-violet/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet/5',
                    )}
                  >
                    <div className="font-body text-[13px] font-semibold text-ink">{m.label}</div>
                    <div className="font-body text-[11px] text-ink-3 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </PremiumField>

            {rfqMode === 'BEST_PRICE_FOR_TARGET_COUPON' && (
              <div className="mt-5">
                <PremiumField label="Coupon cible (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={targetCoupon != null ? (targetCoupon * 100).toFixed(1) : ''}
                    onChange={(e) => setTargetCoupon(Number(e.target.value) / 100)}
                    className="premium-input"
                    placeholder="ex: 8.0"
                  />
                </PremiumField>
              </div>
            )}

            {rfqMode === 'STRONGEST_PROTECTION' && (
              <div className="mt-5">
                <PremiumField label="Protection minimale (%)">
                  <input
                    type="number"
                    step="1"
                    value={minProtection != null ? (minProtection * 100).toFixed(0) : ''}
                    onChange={(e) => setMinProtection(Number(e.target.value) / 100)}
                    className="premium-input"
                    placeholder="ex: 50"
                  />
                </PremiumField>
              </div>
            )}
          </div>

          {/* Scoring weights */}
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-body font-bold text-ink-3 uppercase tracking-[0.2em]">
                Poids du scoring
              </label>
              <span className={cn(
                'text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg',
                totalWeight === 100 ? 'bg-[#00B894]/10 text-[#00B894]' : 'bg-red/10 text-red',
              )}>
                {totalWeight}%
              </span>
            </div>
            {totalWeight !== 100 && (
              <p className="text-xs text-red font-body mb-3 flex items-center gap-1.5 bg-red/5 px-3 py-2 rounded-lg border border-red/10">
                <AlertTriangle size={12} />
                Le total doit etre 100%
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                    className="premium-input text-center"
                    min={0}
                    max={100}
                  />
                  <div className="text-[10px] font-body text-ink-3 mt-1.5 font-medium">{w.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-6 shadow-sm">
            <PremiumField label="Note client (optionnel)">
              <textarea
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                className="premium-input min-h-[80px] resize-y"
                placeholder="Instructions specifiques pour les emetteurs..."
              />
            </PremiumField>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className={cn(
              'h-10 px-5 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
              'font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-2',
              'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md',
              'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              Precedent
            </button>
            <button onClick={() => setStep(2)} className={cn(
              'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
              'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
              'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Issuers ─────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] p-5 shadow-sm">
            <p className="font-body text-[13px] text-ink-3">
              Sélectionnez les émetteurs à solliciter. Laissez vide pour envoyer à tous.
            </p>
          </div>

          {issuers.length === 0 ? (
            <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-border/60 overflow-hidden">
              <div className="flex flex-col items-center justify-center py-14">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#5B3FD4]/5 flex items-center justify-center mb-4">
                  <Building2 size={24} className="text-ink-3/40" />
                </div>
                <p className="text-sm text-ink-3 font-body font-medium">Aucun emetteur configure</p>
                <p className="text-xs text-ink-3/60 font-body mt-1">Executez le seed pour charger les profils emetteurs</p>
              </div>
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
                      'group relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border ring-1 ring-black/[0.03]',
                      'p-5 transition-all duration-200 overflow-hidden',
                      isSelected
                        ? 'border-[#3B1FA8] bg-[#3B1FA8]/3 ring-[#3B1FA8]/20 shadow-md shadow-violet/10'
                        : isExcluded
                          ? 'border-red/30 bg-[#FDE8EB]/30 opacity-60'
                          : 'border-border/60 hover:border-violet/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet/5',
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#3B1FA8] to-[#5B3FD4] rounded-l-xl" />
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-body text-[13px] font-semibold text-ink">{issuer.name}</div>
                        <div className="font-body text-[10px] text-ink-3 mt-0.5">
                          {issuer.legalEntity ?? ''} | Min: {fmtCcy(issuer.minTicketSize ?? 0)}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleIssuer(issuer.id)}
                          className={cn(
                            'p-2 rounded-lg text-xs transition-all duration-200',
                            isSelected
                              ? 'bg-[#3B1FA8] text-white shadow-md shadow-violet/20'
                              : 'bg-surface-2/60 text-ink-3 hover:bg-violet-ghost hover:text-violet hover:shadow-sm',
                          )}
                          title="Selectionner"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleExcluded(issuer.id)}
                          className={cn(
                            'p-2 rounded-lg text-xs transition-all duration-200',
                            isExcluded
                              ? 'bg-red text-white shadow-md shadow-red/20'
                              : 'bg-surface-2/60 text-ink-3 hover:bg-[#FDE8EB] hover:text-red hover:shadow-sm',
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
                        <span key={st} className="px-2 py-0.5 rounded-md bg-surface-2/60 text-[9px] font-body font-medium text-ink-3">
                          {STRUCTURE_TYPES.find((s) => s.value === st)?.label ?? st}
                        </span>
                      ))}
                      {(issuer.structureTypes as string[])?.length > 3 && (
                        <span className="text-[9px] text-ink-3 font-medium">+{issuer.structureTypes.length - 3}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-3 font-body font-medium">
                      <span className="bg-surface-2/40 px-2 py-0.5 rounded-md">Funding: {issuer.fundingSpread ? `+${(issuer.fundingSpread * 10000).toFixed(0)}bps` : '—'}</span>
                      <span className="bg-surface-2/40 px-2 py-0.5 rounded-md">Max: {issuer.maxMaturityMonths ? `${issuer.maxMaturityMonths}m` : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className={cn(
              'h-10 px-5 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
              'font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-2',
              'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md',
              'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              Precedent
            </button>
            <button onClick={() => setStep(3)} className={cn(
              'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
              'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
              'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              Suivant <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ─────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-80" style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4, #3D63F5)' }} />
            <div className="p-6">
              <h3 className="font-display text-lg font-bold text-ink mb-5 flex items-center gap-2">
                <span className="inline-block w-1 h-5 rounded-full bg-gradient-to-b from-[#3B1FA8] to-[#5B3FD4]" />
                Recapitulatif de la RFQ
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Produit', value: productName || 'Sans nom' },
                  { label: 'Structure', value: STRUCTURE_TYPES.find((s) => s.value === structureType)?.label ?? '—' },
                  { label: 'Sous-jacent', value: UNDERLYINGS[selectedUnderlying]?.name ?? '—' },
                  { label: 'Nominal', value: fmtCcy(nominal, currency) },
                  { label: 'Coupon', value: `${couponType} ${fmtPct(couponRate)}` },
                  { label: 'Protection', value: `${fmtPct(protectionBarrier)} (${barrierMonitoring})` },
                  { label: 'Mode', value: RFQ_MODES.find((m) => m.value === rfqMode)?.label ?? '—' },
                  { label: 'Maturite', value: `${fmtDate(strikeDate)} — ${fmtDate(maturityDate)}` },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-surface-2/40 rounded-lg border border-border/30">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-ink-3 font-bold block mb-1">{item.label}</span>
                    <span className="text-[13px] font-semibold text-ink font-body">{item.value}</span>
                  </div>
                ))}
              </div>

              {selectedIssuers.length > 0 && (
                <div className="mt-5 pt-5 border-t border-border/40">
                  <span className="text-[10px] font-body font-bold text-ink-3 uppercase tracking-[0.2em]">Emetteurs selectionnes</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIssuers.map((id) => {
                      const issuer = issuers.find((i: any) => i.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B1FA8]/5 text-[#3B1FA8] text-[11px] font-body font-semibold border border-[#3B1FA8]/10">
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
                  <span className="text-[10px] font-body text-ink-3 font-bold uppercase tracking-wider">Exclus : </span>
                  {excludedIssuers.map((id) => {
                    const issuer = issuers.find((i: any) => i.id === id);
                    return (
                      <span key={id} className="text-[11px] text-red font-body font-medium mr-2">{issuer?.name ?? id}</span>
                    );
                  })}
                </div>
              )}

              {clientNote && (
                <div className="mt-4 p-4 bg-surface-2/40 rounded-lg text-[13px] font-body text-ink-2 border border-border/30">
                  <span className="font-semibold text-ink-3 text-[10px] uppercase tracking-wider block mb-1">Note</span>
                  {clientNote}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className={cn(
              'h-10 px-5 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
              'font-body text-[13px] font-semibold text-ink-2 inline-flex items-center gap-2',
              'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md',
              'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
            )}>
              Precedent
            </button>
            <button
              onClick={handleCreate}
              disabled={createRfq.isPending}
              className={cn(
                'h-10 px-6 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
                'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
                'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              )}
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
  const { toasts, error: toastError, dismiss } = useToast();

  const rfq: any = (rfqData as any)?.data ?? rfqData;
  const config = rfq ? safeJsonParse(rfq.productConfig) : null;
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
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la RFQ");
    }
  };

  const handleSelect = async (quoteId: string) => {
    try {
      await selectQuote.mutateAsync({ rfqId, quoteId });
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erreur lors de la selection de la cotation');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── RFQ Header ─────────────────────────────── */}
      <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-80" style={{ background: 'linear-gradient(90deg, #3B1FA8, #5B3FD4, #3D63F5)' }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider', st.variant)}>
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
                className={cn(
                  'p-2.5 rounded-lg border border-border/60 text-ink-3',
                  'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-sm',
                  'transition-all duration-200',
                )}
              >
                <RefreshCw size={14} />
              </button>
              {canSend && (
                <button
                  onClick={handleSend}
                  disabled={sendRfq.isPending}
                  className={cn(
                    'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2',
                    'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20',
                    'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCell label="Structure" value={STRUCTURE_TYPES.find((s) => s.value === config?.structureType)?.label ?? '—'} />
            <SummaryCell label="Sous-jacent" value={config?.underlying?.name ?? '—'} />
            <SummaryCell label="Nominal" value={config?.nominal ? fmtCcy(config.nominal, config.currency) : '—'} />
            <SummaryCell label="Mode" value={RFQ_MODES.find((m) => m.value === rfq.mode)?.label ?? rfq.mode ?? '—'} />
          </div>

          {(rfq.status === 'RFQ_SENT' || rfq.status === 'PARTIALLY_QUOTED') && (
            <div className="mt-5 p-3.5 bg-gradient-to-r from-[#D4A017]/10 to-[#D4A017]/5 border border-[#D4A017]/20 rounded-xl flex items-center gap-2 text-[13px] font-body text-[#9B7210] shadow-sm">
              <Loader2 size={14} className="animate-spin" />
              Cotations en cours de generation... Rafraichissement automatique toutes les 3s.
            </div>
          )}
        </div>
      </div>

      {/* ── Quotes Comparison ─────────────────────── */}
      {sortedQuotes.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#3B1FA8]/8">
              <BarChart3 size={16} className="text-[#3B1FA8]" />
            </div>
            Cotations ({sortedQuotes.length})
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {sortedQuotes.map((q: any, idx: number) => {
              const result = safeJsonParse(q.pricingResult);
              const issuer = q.issuer ?? q.issuerProfile;
              const isWinner = idx === 0;
              const isSelected = q.status === 'ACCEPTED';
              const isDeclined = q.status === 'DECLINED';

              return (
                <div
                  key={q.id}
                  className={cn(
                    'relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border ring-1 ring-black/[0.03]',
                    'p-5 transition-all duration-200 overflow-hidden',
                    isSelected
                      ? 'border-[#007A63] ring-[#007A63]/20 bg-[#D6F7EF]/10 shadow-md shadow-[#007A63]/10'
                      : isDeclined
                        ? 'border-border/60 opacity-50'
                        : isWinner
                          ? 'border-[#3B1FA8] ring-[#3B1FA8]/20 shadow-lg shadow-violet/10 bg-gradient-to-r from-[#3B1FA8]/3 to-transparent'
                          : 'border-border/60 hover:border-violet/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet/5',
                  )}
                >
                  {isWinner && !isSelected && !isDeclined && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full" style={{ background: 'linear-gradient(90deg, #D4A017, #F0D98A, #D4A017)' }} />
                  )}

                  <div className="flex items-start justify-between">
                    {/* Issuer info */}
                    <div className="flex items-center gap-3">
                      {isWinner && !isSelected && !isDeclined && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A017] to-[#F0D98A] flex items-center justify-center shadow-md shadow-[#D4A017]/20">
                          <Trophy size={16} className="text-white" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="w-10 h-10 rounded-xl bg-[#007A63] flex items-center justify-center shadow-md shadow-[#007A63]/20">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      )}
                      {!isWinner && !isSelected && (
                        <div className="w-10 h-10 rounded-xl bg-surface-2/60 flex items-center justify-center text-[12px] font-bold text-ink-3 font-display">
                          #{idx + 1}
                        </div>
                      )}
                      <div>
                        <div className="font-body text-[13px] font-bold text-ink">
                          {issuer?.name ?? 'Émetteur inconnu'}
                        </div>
                        <div className="font-body text-[10px] text-ink-3">
                          {issuer?.legalEntity ?? ''}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      {isWinner && !isSelected && !isDeclined ? (
                        <div className="font-display text-2xl font-extrabold bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] bg-clip-text text-transparent">
                          {q.totalScore != null ? q.totalScore.toFixed(1) : '—'}
                        </div>
                      ) : (
                        <div className="font-display text-2xl font-extrabold text-ink">
                          {q.totalScore != null ? q.totalScore.toFixed(1) : '—'}
                        </div>
                      )}
                      <div className="text-[10px] font-body text-ink-3 uppercase tracking-[0.15em] font-bold">Score</div>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-border/40">
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
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      {Object.entries(safeJsonParse(q.scoreBreakdown, {}) ?? {}).map(
                        ([key, val]) => (
                          <div key={key} className="flex items-center gap-1 text-[10px] font-body text-ink-3 bg-surface-2/40 px-2 py-0.5 rounded-md">
                            <span className="capitalize">{key}:</span>
                            <span className="font-semibold text-ink-2">{(val as number).toFixed(1)}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  {/* Comment */}
                  {q.comment && (
                    <div className="mt-3 p-3 bg-surface-2/40 rounded-xl text-[12px] font-body text-ink-2 italic border border-border/30">
                      &ldquo;{q.comment}&rdquo;
                    </div>
                  )}

                  {/* Actions */}
                  {canSelect && !isSelected && !isDeclined && (
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={() => handleSelect(q.id)}
                        disabled={selectQuote.isPending}
                        className={cn(
                          'h-10 px-5 rounded-xl font-body text-[13px] font-semibold inline-flex items-center gap-2 transition-all duration-200',
                          isWinner
                            ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20 hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-surface-2/60 text-ink-2 hover:bg-violet-ghost hover:text-violet hover:-translate-y-0.5 hover:shadow-md border border-border/60',
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
                    <div className="mt-5 p-3 bg-gradient-to-r from-[#D6F7EF] to-[#E8FCF5] border border-[#A3EDD9]/60 rounded-xl text-center text-[13px] font-body font-semibold text-[#007A63] shadow-sm">
                      <CheckCircle2 size={14} className="inline -mt-0.5 mr-1.5" />
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
        <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-border/60 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4A017]/10 to-[#D4A017]/5 flex items-center justify-center mb-4">
              <Clock size={28} className="text-ink-3/40" />
            </div>
            <p className="text-ink-3 font-body text-sm font-medium">En attente des cotations...</p>
          </div>
        </div>
      )}

      {sortedQuotes.length === 0 && (rfq.status === 'DRAFT' || rfq.status === 'INTERNALLY_PRICED') && (
        <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-border/60 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3B1FA8]/10 to-[#5B3FD4]/5 flex items-center justify-center mb-4">
              <Send size={28} className="text-ink-3/40" />
            </div>
            <p className="text-ink-3 font-body text-sm font-medium">Envoyez la RFQ pour recevoir des cotations</p>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════════════════════════════════════

function PremiumField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body">
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3.5 bg-surface-2/40 backdrop-blur-sm rounded-xl border border-border/30 hover:shadow-sm hover:bg-surface-2/60 transition-all duration-200">
      <div className="text-[10px] font-body font-bold text-ink-3 uppercase tracking-[0.15em]">{label}</div>
      <div className="text-[13px] font-body font-semibold text-ink mt-1">{value}</div>
    </div>
  );
}

function MetricCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center p-3 rounded-xl bg-surface-2/30 hover:bg-surface-2/50 transition-all duration-200 border border-transparent hover:border-border/30">
      <div className={cn('font-display text-lg font-bold', accent ? 'text-[#3B1FA8]' : 'text-ink')}>
        {value}
      </div>
      <div className="text-[10px] font-body text-ink-3 uppercase tracking-[0.15em] font-bold mt-0.5">{label}</div>
    </div>
  );
}
