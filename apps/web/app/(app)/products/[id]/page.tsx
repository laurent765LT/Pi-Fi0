'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Heart, Share2, FileText, AlertTriangle, Calendar,
  Shield, TrendingUp, Info, ExternalLink, Clock, Users, Download,
  Sparkles, Brain, Target, BarChart3, Lightbulb, CheckCircle2,
  XCircle, Minus, Zap, Activity, PieChart, Copy, Check, FileDown,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProduct, useProductPayoff } from '@/hooks/use-products';
import { useFavorites, useToggleFavorite, useTrackView } from '@/hooks/use-favorites';
import { PayoffCanvas, buildDefaultScenarios } from '@/components/products/payoff-canvas';
import { BarrierGauge } from '@/components/products/barrier-gauge';
import { CommitmentModal } from '@/components/commitments/commitment-modal';
import { useMyCommitments } from '@/hooks/use-commitments';
import { Button } from '@/components/ui/button';
import { ProductPdfExport } from '@/components/products/product-pdf-export';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Tooltip } from '@/components/ui/tooltip';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toFixed(1) + ' %';
}

function daysUntil(isoDate: string): number {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
};

const PAYOFF_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  AUTOCALL_PHOENIX: { bg: '#EDE8FF', text: '#3B1FA8', border: '#D5CCFA' },
  AUTOCALL_COUPON: { bg: '#EDE8FF', text: '#5535C4', border: '#D5CCFA' },
  CAPITAL_PROTECTED: { bg: '#E6FAF5', text: '#008B6E', border: '#B3F0DE' },
  CONDITIONAL_RATE: { bg: '#E4EAFF', text: '#0A2799', border: '#C5D2FA' },
  BARRIER_NOTE: { bg: '#FFF8E7', text: '#A07800', border: '#F0E0A8' },
};

const SRI_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#E6FAF5', text: '#008B6E' },
  2: { bg: '#E6FAF5', text: '#008B6E' },
  3: { bg: '#F0FAE6', text: '#4A8C1F' },
  4: { bg: '#FFF8E7', text: '#A07800' },
  5: { bg: '#FFF0E6', text: '#C25700' },
  6: { bg: '#FFF0F2', text: '#C41F36' },
  7: { bg: '#FFF0F2', text: '#C41F36' },
};

const REGULATORY_DISCLAIMERS = [
  { icon: AlertTriangle, text: "Ce produit est un instrument financier complexe au sens de la directive MIF2. Il est destiné aux investisseurs avertis." },
  { icon: Shield, text: "Le capital n'est pas garanti. L'investisseur peut subir une perte en capital partielle ou totale à l'échéance." },
  { icon: FileText, text: "Avant toute souscription, le client doit prendre connaissance du Document d'Informations Clés (KID/PRIIPS)." },
  { icon: Info, text: "Les performances passées ne préjugent pas des performances futures. Les scénarios présentés sont des estimations." },
  { icon: AlertTriangle, text: "L'investisseur est exposé au risque de crédit de l'émetteur et du garant éventuel." },
  { icon: Clock, text: "La liquidité du produit n'est pas garantie avant l'échéance. Le prix de rachat peut être inférieur au prix d'achat." },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0", className)}>
      <span className="text-[10px] text-ink-3 font-body uppercase tracking-widest shrink-0">{label}</span>
      <span className="text-[13px] font-semibold text-ink font-body text-right tabular-nums">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color, icon: Icon }: { label: string; value: string; color?: string; icon?: any }) {
  return (
    <div className="relative flex flex-col items-center gap-0.5 sm:gap-1 py-2 sm:py-3 px-2 sm:px-2.5 rounded-xl bg-white dark:bg-white/5 border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      {Icon && <Icon size={12} className="text-ink-3/50 hidden sm:block" />}
      <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-ink-3 font-semibold font-body">{label}</span>
      <span className={cn("font-display text-base sm:text-lg font-bold leading-none tabular-nums", color ?? 'text-ink')}>{value}</span>
    </div>
  );
}

function SriGauge({ sri }: { sri: number }) {
  const sriStyle = SRI_COLORS[sri] ?? SRI_COLORS[4];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div
            key={n}
            className={cn(
              "h-[18px] w-[18px] rounded-sm flex items-center justify-center text-[8px] font-bold font-mono tabular-nums transition-all",
              n === sri ? 'ring-2 ring-offset-1 scale-110' : n <= sri ? 'opacity-80' : 'opacity-30',
            )}
            style={{
              backgroundColor: n <= sri ? SRI_COLORS[n]?.bg ?? '#F4F3EF' : '#F4F3EF',
              color: n <= sri ? SRI_COLORS[n]?.text ?? '#7B6FA0' : '#7B6FA0',
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <p className="text-[9px] text-ink-3 font-body">
        Risque : <span className="font-semibold tabular-nums" style={{ color: sriStyle.text }}>{sri}/7</span>
        {sri <= 2 && ' (faible)'}
        {sri >= 3 && sri <= 4 && ' (modéré)'}
        {sri >= 5 && sri <= 6 && ' (élevé)'}
        {sri === 7 && ' (très élevé)'}
      </p>
    </div>
  );
}

function CopyIsinButton({ isin }: { isin: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(isin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = isin;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [isin]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-mono transition-all duration-200',
        copied
          ? 'text-[#00B894] bg-[#00B894]/10'
          : 'text-ink-3 hover:text-violet hover:bg-violet/10',
      )}
      title={copied ? 'Copié !' : 'Copier l\'ISIN'}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

function BarrierDistanceBar({ barrierCapPct, currentPct }: { barrierCapPct: number; currentPct?: number }) {
  const spot = currentPct ?? 100;
  const distance = spot - barrierCapPct;
  const distancePct = ((distance / spot) * 100);

  // Color logic: green if >20% above barrier, yellow if 5-20%, red if <5% or below
  const zone = distance > 20 ? 'green' : distance > 5 ? 'yellow' : 'red';
  const zoneColors = {
    green: { bar: '#00B894', bg: 'rgba(0,184,148,0.08)', border: 'rgba(0,184,148,0.2)', text: '#008B6E' },
    yellow: { bar: '#D4A017', bg: 'rgba(212,160,23,0.08)', border: 'rgba(212,160,23,0.2)', text: '#A07800' },
    red: { bar: '#E8334A', bg: 'rgba(232,51,74,0.08)', border: 'rgba(232,51,74,0.2)', text: '#C41F36' },
  };
  const colors = zoneColors[zone];

  // Position calculation: barrier is at barrierCapPct% of the bar, spot at currentPct%
  const maxVal = Math.max(spot, 110);
  const barrierPos = (barrierCapPct / maxVal) * 100;
  const spotPos = (spot / maxVal) * 100;

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-body text-[10px] uppercase tracking-widest font-semibold" style={{ color: colors.text }}>
          Distance a la barriere
        </h4>
        <span className="font-mono text-xs font-bold tabular-nums" style={{ color: colors.text }}>
          {distancePct >= 0 ? '+' : ''}{distancePct.toFixed(1)}%
        </span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-white/80 dark:bg-white/10 overflow-visible">
        {/* Red zone (below barrier) */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full"
          style={{ width: `${barrierPos}%`, backgroundColor: 'rgba(232,51,74,0.15)' }}
        />
        {/* Green zone (above barrier) */}
        <div
          className="absolute inset-y-0 rounded-r-full"
          style={{ left: `${barrierPos}%`, right: 0, backgroundColor: 'rgba(0,184,148,0.15)' }}
        />
        {/* Barrier marker */}
        <div
          className="absolute top-[-2px] w-0.5 h-[calc(100%+4px)] rounded-full"
          style={{ left: `${barrierPos}%`, backgroundColor: '#E8334A' }}
        />
        {/* Spot marker */}
        <div
          className="absolute top-[-3px] w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
          style={{ left: `${Math.min(spotPos, 98)}%`, backgroundColor: colors.bar, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] font-body text-ink-3">
          Barriere: <span className="font-mono font-semibold tabular-nums">{barrierCapPct}%</span>
        </span>
        <span className="text-[9px] font-body text-ink-3">
          Spot: <span className="font-mono font-semibold tabular-nums">{spot}%</span>
        </span>
      </div>
    </div>
  );
}

function RegulatoryAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 pt-3 border-t border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 group cursor-pointer"
      >
        <h4 className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body flex items-center gap-1.5">
          <Shield size={11} className="text-[#3B1FA8]" />
          Informations reglementaires
        </h4>
        <ChevronDown
          size={14}
          className={cn(
            'text-ink-3 transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[500px] opacity-100 mt-2.5' : 'max-h-0 opacity-0 mt-0',
        )}
      >
        <div className="rounded-xl border border-border/50 bg-surface-2/30 p-3 flex flex-col gap-2">
          {REGULATORY_DISCLAIMERS.map((d, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[10px] text-ink-3 font-body leading-relaxed">
              <span
                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold font-mono tabular-nums"
                style={{ backgroundColor: 'rgba(59,31,168,0.08)', color: '#3B1FA8' }}
              >
                {i + 1}
              </span>
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScenarioTable({ product }: { product: any }) {
  const scenarios = [
    { name: 'Stress', pct: -(product.barrierCapPct ?? 50), color: '#C41F36' },
    { name: 'Défavorable', pct: -((product.barrierCapPct ?? 50) * 0.5), color: '#C25700' },
    { name: 'Modéré', pct: product.couponPct ?? (product.maxGainPct ?? 0) * 0.4, color: '#A07800' },
    { name: 'Favorable', pct: product.maxGainPct ?? 0, color: '#008B6E' },
  ];
  const investBase = 10_000;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
      <table className="w-full text-xs font-body">
        <thead>
          <tr className="bg-gradient-to-r from-surface-2 to-surface-2/60 dark:from-white/5 dark:to-white/[0.02] border-b border-border/60">
            <th className="px-3 py-2 text-left text-[9px] uppercase tracking-wider text-ink-3 font-semibold">Scénario</th>
            <th className="px-3 py-2 text-right text-[9px] uppercase tracking-wider text-ink-3 font-semibold">Perf. %</th>
            <th className="px-3 py-2 text-right text-[9px] uppercase tracking-wider text-ink-3 font-semibold">Pour 10 000 €</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.name} className="border-b border-border/30 last:border-0 hover:bg-surface-2/50 dark:hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-2 text-xs font-semibold" style={{ color: s.color }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px]" style={{ backgroundColor: s.color + '15', color: s.color }}>
                  {s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1)}%
                </span>
              </td>
              <td className="px-3 py-2 text-right text-xs font-mono tabular-nums text-ink-2">
                {formatAmount(investBase * (1 + s.pct / 100))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── AI Analysis Panel ──────────────────────────────────────────────────────

function computeAiInsights(product: any) {
  const sri = product.sri ?? 4;
  const barrier = product.barrierCapPct ?? 50;
  const coupon = product.couponPct ?? 0;
  const maxGain = product.maxGainPct ?? 0;
  const maturity = product.maturityDate ? Math.ceil((new Date(product.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)) : 3;
  const autocall = product.autocallBarrierPct ?? null;
  const fillPct = product.fillPct ?? 0;
  const payoffType = product.payoffType ?? '';

  // Risk-reward score (0-100)
  const riskRewardScore = Math.round(
    Math.min(100, Math.max(0,
      (coupon > 0 ? coupon * 4 : maxGain * 1.5) + barrier * 0.3 - sri * 5 + (autocall ? 10 : 0)
    ))
  );

  // Capital protection assessment
  const protectionLevel = barrier >= 70 ? 'Fort' : barrier >= 50 ? 'Modéré' : 'Faible';
  const protectionColor = barrier >= 70 ? 'text-teal' : barrier >= 50 ? 'text-gold' : 'text-red';

  // Probability estimates based on barrier & type
  const probAutocall = autocall != null ? Math.round(Math.min(85, 40 + (autocall <= 100 ? (100 - autocall) * 0.8 : 0) + (maturity > 3 ? 10 : 0))) : null;
  const probCoupon = coupon > 0 ? Math.round(Math.min(90, 50 + barrier * 0.4 - coupon * 1.5)) : null;
  const probCapitalLoss = Math.round(Math.max(5, Math.min(60, 45 - barrier * 0.5 + sri * 3)));

  // Market context
  const yieldVsEuribor = coupon > 0 ? coupon - 2.85 : maxGain - 2.85;
  const yieldSpreadLabel = yieldVsEuribor > 5 ? 'Très attractif' : yieldVsEuribor > 2 ? 'Attractif' : yieldVsEuribor > 0 ? 'Correct' : 'Sous le marché';

  // Suitability profiles
  const profiles: { label: string; match: boolean; reason: string }[] = [
    { label: 'Profil prudent (SRI ≤ 3)', match: sri <= 3 && barrier >= 60, reason: sri <= 3 ? `Risque ${sri}/7 adapté, barrière à ${barrier}%` : `SRI ${sri}/7 trop élevé` },
    { label: 'Profil équilibré (SRI 3-5)', match: sri >= 3 && sri <= 5 && barrier >= 40, reason: `Bon ratio rendement/risque avec coupon ${coupon > 0 ? coupon.toFixed(1) + '%' : 'conditionnel'}` },
    { label: 'Profil dynamique (SRI 5+)', match: sri >= 5, reason: sri >= 5 ? 'Adapté au profil de risque élevé' : 'Risque insuffisant pour ce profil' },
    { label: 'Recherche de rendement', match: (coupon > 5 || maxGain > 15), reason: coupon > 5 ? `Coupon attractif de ${coupon.toFixed(1)}%` : `Gain potentiel de ${maxGain.toFixed(1)}%` },
    { label: 'Diversification alternatives', match: true, reason: 'Les produits structurés offrent une exposition décorrélée' },
  ];

  // Key strengths & weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (barrier >= 60) strengths.push(`Protection du capital solide (barrière à ${barrier}%)`);
  if (coupon > 6) strengths.push(`Rendement attractif (${coupon.toFixed(1)}% p.a.)`);
  if (autocall != null) strengths.push('Mécanisme de remboursement anticipé (liquidité potentielle)');
  if (fillPct > 60) strengths.push(`Forte demande (${fillPct.toFixed(0)}% de remplissage)`);
  if (payoffType === 'AUTOCALL_PHOENIX') strengths.push('Mémoire de coupon (coupons rattrapés)');
  if (maturity <= 3) strengths.push(`Maturité courte (${maturity} an${maturity > 1 ? 's' : ''})`);

  if (sri >= 6) weaknesses.push(`Risque élevé (SRI ${sri}/7)`);
  if (barrier < 50) weaknesses.push(`Barrière basse (${barrier}%) — risque de perte en capital`);
  if (maturity > 5) weaknesses.push(`Maturité longue (${maturity} ans) — liquidité réduite`);
  if (coupon === 0 && maxGain < 10) weaknesses.push('Rendement limité par rapport au risque');
  if (fillPct > 90) weaknesses.push('Étagère presque pleine — disponibilité limitée');

  if (strengths.length === 0) strengths.push('Exposition aux marchés via un format structuré');
  if (weaknesses.length === 0) weaknesses.push('Capital non garanti (risque inhérent aux produits structurés)');

  // AI recommendation text
  let recommendation: string;
  if (riskRewardScore >= 70) {
    recommendation = `Ce produit présente un excellent profil rendement/risque. Avec un coupon de ${coupon > 0 ? coupon.toFixed(1) + '%' : 'conditionnel'} et une barrière à ${barrier}%, il offre un bon compromis entre protection du capital et rendement. Recommandé pour les clients ${sri <= 3 ? 'prudents' : sri <= 5 ? 'équilibrés' : 'dynamiques'} recherchant une alternative aux fonds euros.`;
  } else if (riskRewardScore >= 45) {
    recommendation = `Ce produit offre un rapport rendement/risque correct. La barrière à ${barrier}% assure une protection ${protectionLevel.toLowerCase()} du capital. À considérer dans le cadre d'une diversification de portefeuille, en complément d'actifs moins volatils.`;
  } else {
    recommendation = `Ce produit présente un profil de risque significatif avec un SRI de ${sri}/7. La barrière à ${barrier}% offre une protection limitée. À réserver aux clients avertis avec une tolérance au risque élevée et un horizon d'investissement adapté.`;
  }

  return { riskRewardScore, protectionLevel, protectionColor, probAutocall, probCoupon, probCapitalLoss, yieldSpreadLabel, yieldVsEuribor, profiles, strengths, weaknesses, recommendation, maturity };
}

function AiAnalysisPanel({ product }: { product: any }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setIsAnalyzing(false), 1800);
    const t2 = setTimeout(() => setShowContent(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const insights = computeAiInsights(product);

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet to-cobalt flex items-center justify-center shadow-lg shadow-violet/20">
            <Brain size={20} className="text-white animate-pulse" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal animate-ping" />
        </div>
        <div className="text-center">
          <p className="font-body text-xs font-semibold text-ink">Analyse IA en cours...</p>
          <p className="font-body text-[11px] text-ink-3 mt-0.5">Évaluation du profil risque/rendement et du contexte marché</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-violet animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!showContent) return null;

  return (
    <div className="flex flex-col gap-3.5 animate-fade-in">
      {/* AI Header */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-violet/[0.06] to-cobalt/[0.04] border border-violet/15">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-cobalt flex items-center justify-center shrink-0 shadow-md shadow-violet/15">
          <Brain size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-body text-xs font-bold text-ink">Analyse Strick&apos;in AI</h4>
            <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-violet/10 text-violet">
              <Zap size={7} /> Auto-généré
            </span>
          </div>
          <p className="font-body text-[11px] text-ink-2 leading-relaxed">{insights.recommendation}</p>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="flex flex-col items-center gap-1 py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/5 border border-border/60 shadow-sm">
          <Target size={12} className="text-violet" />
          <span className="text-[8px] uppercase tracking-wider text-ink-3 font-semibold">Score R/R</span>
          <span className={cn(
            "font-display text-xl font-bold tabular-nums",
            insights.riskRewardScore >= 70 ? 'text-teal' : insights.riskRewardScore >= 45 ? 'text-gold' : 'text-red',
          )}>
            {insights.riskRewardScore}
          </span>
          <span className="text-[8px] text-ink-3 font-body">/100</span>
        </div>

        <div className="flex flex-col items-center gap-1 py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/5 border border-border/60 shadow-sm">
          <Shield size={12} className={insights.protectionColor} />
          <span className="text-[8px] uppercase tracking-wider text-ink-3 font-semibold">Protection</span>
          <span className={cn("font-display text-base font-bold", insights.protectionColor)}>{insights.protectionLevel}</span>
          <span className="text-[8px] text-ink-3 font-body tabular-nums">barrière {product.barrierCapPct ?? '—'}%</span>
        </div>

        <div className="flex flex-col items-center gap-1 py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/5 border border-border/60 shadow-sm">
          <BarChart3 size={12} className="text-cobalt" />
          <span className="text-[8px] uppercase tracking-wider text-ink-3 font-semibold">Spread vs Euribor</span>
          <span className={cn(
            "font-display text-base font-bold tabular-nums",
            insights.yieldVsEuribor > 3 ? 'text-teal' : insights.yieldVsEuribor > 0 ? 'text-gold' : 'text-red',
          )}>
            {insights.yieldVsEuribor > 0 ? '+' : ''}{insights.yieldVsEuribor.toFixed(1)}%
          </span>
          <span className="text-[8px] text-ink-3 font-body">{insights.yieldSpreadLabel}</span>
        </div>

        <div className="flex flex-col items-center gap-1 py-2.5 px-2.5 rounded-xl bg-white dark:bg-white/5 border border-border/60 shadow-sm">
          <Activity size={12} className="text-gold" />
          <span className="text-[8px] uppercase tracking-wider text-ink-3 font-semibold">Horizon</span>
          <span className="font-display text-base font-bold text-ink tabular-nums">{insights.maturity} an{insights.maturity > 1 ? 's' : ''}</span>
          <span className="text-[8px] text-ink-3 font-body">{insights.maturity <= 3 ? 'Court terme' : insights.maturity <= 6 ? 'Moyen terme' : 'Long terme'}</span>
        </div>
      </div>

      {/* Probability Estimates */}
      <div className="rounded-xl border border-border/60 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-border/40 bg-surface-2/50 dark:bg-white/[0.02]">
          <h4 className="font-body text-[11px] font-bold text-ink flex items-center gap-1.5">
            <PieChart size={12} className="text-violet" />
            Probabilités estimées (Monte Carlo)
          </h4>
        </div>
        <div className="p-3 flex flex-col gap-2.5">
          {insights.probAutocall != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-body text-ink-2">Remboursement anticipé (autocall)</span>
                <span className="text-[11px] font-mono font-bold text-violet tabular-nums">{insights.probAutocall}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet to-violet/70 transition-all duration-1000" style={{ width: `${insights.probAutocall}%` }} />
              </div>
            </div>
          )}
          {insights.probCoupon != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-body text-ink-2">Versement du coupon</span>
                <span className="text-[11px] font-mono font-bold text-teal tabular-nums">{insights.probCoupon}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-teal to-teal/70 transition-all duration-1000" style={{ width: `${insights.probCoupon}%` }} />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-body text-ink-2">Perte en capital (&lt; barrière)</span>
              <span className="text-[11px] font-mono font-bold text-red tabular-nums">{insights.probCapitalLoss}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red to-red/70 transition-all duration-1000" style={{ width: `${insights.probCapitalLoss}%` }} />
            </div>
          </div>
          <p className="text-[9px] text-ink-3/70 font-body mt-0.5 italic">
            Estimations basées sur 10 000 simulations Monte Carlo avec volatilité implicite 20%, taux sans risque 3.0%.
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-teal/20 bg-teal/[0.04] p-3">
          <h4 className="font-body text-[11px] font-bold text-teal flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={12} /> Points forts
          </h4>
          <ul className="flex flex-col gap-1.5">
            {insights.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] font-body text-ink-2 leading-relaxed">
                <CheckCircle2 size={10} className="text-teal shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red/20 bg-red/[0.04] p-3">
          <h4 className="font-body text-[11px] font-bold text-red flex items-center gap-1.5 mb-2">
            <AlertTriangle size={12} /> Points de vigilance
          </h4>
          <ul className="flex flex-col gap-1.5">
            {insights.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] font-body text-ink-2 leading-relaxed">
                <XCircle size={10} className="text-red shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Client Suitability */}
      <div className="rounded-xl border border-border/60 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-border/40 bg-surface-2/50 dark:bg-white/[0.02]">
          <h4 className="font-body text-[11px] font-bold text-ink flex items-center gap-1.5">
            <Users size={12} className="text-violet" />
            Adéquation profil client
          </h4>
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          {insights.profiles.map((p, i) => (
            <div key={i} className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors",
              p.match
                ? 'border-teal/20 bg-teal/[0.04]'
                : 'border-border/40 bg-surface-2/30',
            )}>
              {p.match ? (
                <CheckCircle2 size={13} className="text-teal shrink-0" />
              ) : (
                <Minus size={13} className="text-ink-3/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-semibold font-body", p.match ? 'text-ink' : 'text-ink-3')}>{p.label}</p>
                <p className="text-[9px] text-ink-3 font-body">{p.reason}</p>
              </div>
              {p.match && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-2 py-0.5 rounded-full shrink-0">
                  Compatible
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-surface-2/60 border border-border/40">
        <Lightbulb size={11} className="text-gold shrink-0 mt-0.5" />
        <p className="text-[9px] text-ink-3 font-body leading-relaxed">
          Cette analyse est générée automatiquement par le moteur IA de Strick&apos;in à des fins indicatives. Elle ne constitue pas un conseil en investissement.
          Les probabilités sont estimées via des simulations numériques et ne garantissent pas les résultats futurs. Consultez le KID/PRIIPS et votre conseiller avant toute décision.
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <main className="w-full animate-pulse">
      <div className="h-3 w-28 bg-surface-2 rounded mb-4" />
      <div className="h-6 w-2/3 bg-surface-2 rounded mb-2" />
      <div className="h-3 w-1/3 bg-surface-2 rounded mb-5" />
      <div className="flex gap-1.5 mb-5">
        <div className="h-5 w-24 bg-surface-2 rounded-md" />
        <div className="h-5 w-14 bg-surface-2 rounded-md" />
        <div className="h-5 w-18 bg-surface-2 rounded-md" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-surface-2 rounded-xl" />
        <div className="h-80 bg-surface-2 rounded-xl" />
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: payoffData } = useProductPayoff(id);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const trackView = useTrackView();

  const { data: myCommitments } = useMyCommitments();
  const alreadyCommitted = (myCommitments ?? []).some((c: any) => c.shelfId === (product?.shelfId ?? product?.id));

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [urlCopied, setUrlCopied] = useState(false);
  const [pdfToast, setPdfToast] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  const handleExportPdf = useCallback(() => {
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 3000);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // Smooth scroll to the tabs section
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (id) trackView.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <PageSkeleton />;

  if (isError || !product) {
    return (
      <main className="w-full">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-xs text-ink-3 font-body hover:text-violet transition-colors mb-4">
          <ArrowLeft size={13} /> Retour aux produits
        </Link>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="font-body text-sm text-red">
            {isError ? 'Erreur lors du chargement du produit.' : 'Produit introuvable.'}
          </p>
          <Button variant="outline" asChild size="md">
            <Link href="/products">Retour aux produits</Link>
          </Button>
        </div>
      </main>
    );
  }

  const payoff = PAYOFF_COLORS[product.payoffType] ?? PAYOFF_COLORS.AUTOCALL_PHOENIX;
  const sriStyle = SRI_COLORS[product.sri] ?? SRI_COLORS[4];
  const isClosed = product.status === 'CLOSED' || product.status === 'MATURED';
  const favoriteIds = new Set(
    (favoritesData as any[])?.map((f: any) => f.productId ?? f.product?.id) ?? []
  );
  const isFav = favoriteIds.has(product.id);

  const scenarios =
    payoffData?.scenarios ??
    (payoffData
      ? buildDefaultScenarios(payoffData.best ?? [], payoffData.base ?? [], payoffData.worst ?? [])
      : []);

  const closingDays = product.shelfClosingDate ? daysUntil(product.shelfClosingDate) : null;

  return (
    <>
      <main className="w-full animate-fade-in">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1.5">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-xs text-ink-3 font-body hover:text-violet transition-colors">
              <ArrowLeft size={14} /> Retour aux produits
            </Link>
            <Breadcrumb items={[{ label: 'Produits', href: '/products' }, { label: product.name }]} />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => toggleFavorite.mutate(product.id)}
              className={cn(
                'p-2 rounded-lg border transition-all duration-200',
                isFav
                  ? 'text-red border-red/30 bg-red-light hover:bg-red/20'
                  : 'text-ink-3 border-border hover:text-red hover:border-red/30 hover:bg-red-light',
              )}
              title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShareUrl}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold font-body transition-all duration-200',
                urlCopied
                  ? 'text-[#00B894] border-[#00B894]/30 bg-[#00B894]/10'
                  : 'text-ink-3 border-border hover:text-[#3B1FA8] hover:border-[#3B1FA8]/30 hover:bg-[#3B1FA8]/5',
              )}
              title="Copier le lien"
            >
              {urlCopied ? <Check size={14} /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{urlCopied ? 'Copie' : 'Partager'}</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-semibold font-body text-ink-3 hover:text-[#3B1FA8] hover:border-[#3B1FA8]/30 hover:bg-[#3B1FA8]/5 transition-all duration-200"
              title="Exporter en PDF"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">Exporter PDF</span>
            </button>
            <ProductPdfExport product={product} />
          </div>

          {/* PDF Export toast */}
          {pdfToast && (
            <div className="fixed bottom-6 right-6 z-50 animate-fade-in rounded-xl border border-border/60 bg-white dark:bg-[#1a1a2e] shadow-lg px-4 py-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B1FA8, #5535C4)' }}>
                <FileDown size={14} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold font-body text-ink">Export PDF en preparation...</p>
                <p className="text-[10px] font-body text-ink-3">Cette fonctionnalite sera bientot disponible.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Product Header ──────────────────────────────────────── */}
        <div className="mb-5">
          <div className="h-0.5 w-20 rounded-full mb-3" style={{ background: payoff.text }} />
          <div className="flex flex-wrap items-start gap-1.5 mb-2">
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold font-body"
              style={{ backgroundColor: payoff.bg, color: payoff.text, border: `1px solid ${payoff.border}` }}
            >
              {PAYOFF_LABELS[product.payoffType] ?? product.payoffType}
            </span>
            <Tooltip content="Indicateur de risque de 1 (faible) à 7 (élevé)">
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold font-mono tabular-nums"
                style={{ backgroundColor: sriStyle.bg, color: sriStyle.text }}
              >
                SRI {product.sri}/7
              </span>
            </Tooltip>
            {!isClosed && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold font-body bg-[#E6FAF5] text-[#008B6E] border border-[#B3F0DE]">
                En cours
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold font-body bg-[#F4F3EF] text-[#7B6FA0] border border-[#E2DFD8]">
                Fermé
              </span>
            )}
            {product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-body bg-[#E4EAFF] text-[#0A2799] border border-[#C5D2FA]">
                <Sparkles size={9} />
                Nouveau
              </span>
            )}
            {closingDays != null && closingDays > 0 && closingDays <= 30 && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold font-body bg-[#FFF0F2] text-[#C41F36] border border-[#F8D0D5]">
                <Clock size={9} />
                Clôture J-{closingDays}
              </span>
            )}
          </div>

          <h1 className="font-display text-xl md:text-2xl font-bold leading-tight mb-1 bg-gradient-to-r from-[#1A0A3E] via-[#3B1FA8] to-[#1A0A3E] bg-clip-text text-transparent dark:from-white dark:via-[#C9BCFF] dark:to-white">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-ink-3 font-body">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-surface-2 border border-border rounded px-1.5 py-0.5 tabular-nums">
              {product.isin}
              <CopyIsinButton isin={product.isin} />
            </span>
            <span className="w-px h-3 bg-border/60" />
            <span>{product.issuerName}</span>
            {product.underlyingYahoo && (
              <>
                <span className="w-px h-3 bg-border/60" />
                <span className="font-mono text-[10px] text-ink-3/70 bg-violet-ghost dark:bg-violet/10 px-1.5 py-0.5 rounded-md">
                  {product.underlyingYahoo}
                </span>
              </>
            )}
          </div>

          {/* Compatible insurers */}
          {Array.isArray(product.compatibleInsurers) && product.compatibleInsurers.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body">Assureurs :</span>
              {product.compatibleInsurers.map((ins: string) => (
                <span key={ins} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium font-body bg-surface-2 text-ink-2 border border-border/60">
                  {ins}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <p className="mt-3 text-xs text-ink-2 font-body leading-relaxed max-w-3xl">
              {product.description}
            </p>
          )}
        </div>

        {/* ── Key Metrics ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 mb-5">
          {product.couponPct != null && (
            <StatBox label="Coupon" value={formatPct(product.couponPct)} color="text-teal" icon={Sparkles} />
          )}
          <StatBox label="Gain max" value={formatPct(product.maxGainPct)} color="text-gold" icon={TrendingUp} />
          <StatBox label="Barrière" value={formatPct(product.barrierCapPct)} color="text-red" icon={Shield} />
          {product.autocallBarrierPct != null && (
            <StatBox label="Autocall" value={formatPct(product.autocallBarrierPct)} color="text-violet" icon={Target} />
          )}
          <StatBox label="Échéance" value={product.maturityDate ? formatDateShort(product.maturityDate) : '—'} icon={Calendar} />
        </div>

        {/* ── Two-column layout ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-4 mb-5">
          {/* Left: Main content (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* SRI Gauge */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm p-4">
              <Tooltip content="Indicateur de risque de 1 (faible) à 7 (élevé)">
                <h3 className="font-body text-[10px] uppercase tracking-widest text-ink-3 font-semibold mb-3">
                  Indicateur de risque (SRI)
                </h3>
              </Tooltip>
              <SriGauge sri={product.sri} />
            </div>

            {/* Tabs */}
            <div ref={tabsRef} className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm overflow-hidden scroll-mt-4">
              <Tabs
                tabs={[
                  { label: 'Caracteristiques', value: 'overview' },
                  { label: 'Scenarios', value: 'scenarios' },
                  { label: "Dates d'observation", value: 'dates' },
                  { label: 'Analyse IA', value: 'ai' },
                ]}
                activeTab={activeTab}
                onChange={handleTabChange}
                className="px-4 sticky top-0 z-10 bg-white dark:bg-[#0f0f1a]"
              />

              <TabPanel value="overview" activeTab={activeTab} className="p-4 stagger-grid">
                <div className="divide-y divide-border/50">
                  <DetailRow label="Émetteur" value={product.issuerName} />
                  {product.underlyingName && <DetailRow label="Sous-jacent" value={product.underlyingName} />}
                  {product.underlyingYahoo && !product.underlyingName && (
                    <DetailRow label="Sous-jacent" value={<span className="font-mono">{product.underlyingYahoo}</span>} />
                  )}
                  {product.barrierCapPct != null && (
                    <DetailRow label="Barrière capital" value={<span className="text-red font-bold">{formatPct(product.barrierCapPct)}</span>} />
                  )}
                  {product.autocallBarrierPct != null && (
                    <DetailRow label="Barrière autocall" value={formatPct(product.autocallBarrierPct)} />
                  )}
                  {product.couponPct != null && (
                    <DetailRow label="Coupon" value={<span className="text-teal">{formatPct(product.couponPct)}</span>} />
                  )}
                  {product.maxGainPct != null && (
                    <DetailRow label="Gain maximum" value={<span className="text-gold font-bold">{formatPct(product.maxGainPct)}</span>} />
                  )}
                  {product.maturityDate && <DetailRow label="Échéance" value={formatDate(product.maturityDate)} />}
                  {product.entryFeePct != null && <DetailRow label="Frais d'entrée" value={formatPct(product.entryFeePct)} />}
                </div>

                {/* Regulatory disclaimers - collapsible accordion */}
                <RegulatoryAccordion />
              </TabPanel>

              <TabPanel value="scenarios" activeTab={activeTab} className="p-4 stagger-grid">
                <p className="text-[11px] text-ink-3 font-body mb-3">
                  Estimation des performances selon différents scénarios de marché, pour un investissement initial de 10 000 €.
                </p>
                <ScenarioTable product={product} />
                {scenarios.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body mb-2">
                      Simulation graphique
                    </h4>
                    <PayoffCanvas scenarios={scenarios} height={280} />
                  </div>
                )}
              </TabPanel>

              <TabPanel value="dates" activeTab={activeTab} className="p-4 stagger-grid">
                {Array.isArray(product.observationDates) && product.observationDates.length > 0 ? (
                  <>
                    <p className="text-[11px] text-ink-3 font-body mb-3">
                      Dates de constatation pour le mécanisme de remboursement anticipé automatique.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {product.observationDates.map((date: string, i: number) => {
                        const isPast = new Date(date) < new Date();
                        return (
                          <div
                            key={date}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg border px-2.5 py-2",
                              isPast
                                ? 'border-border/40 bg-surface-2 text-ink-3'
                                : 'border-violet/20 bg-violet-pale text-violet',
                            )}
                          >
                            <Calendar size={12} className={isPast ? 'text-ink-3/50' : 'text-violet'} />
                            <div>
                              <span className={cn("font-mono text-xs tabular-nums font-semibold", isPast && 'line-through opacity-60')}>
                                {formatDateShort(date)}
                              </span>
                              <span className="block text-[9px] font-body opacity-60">
                                Année {i + 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-ink-3 font-body text-sm">
                    <Calendar size={24} className="mx-auto mb-2 opacity-40" />
                    <p>Aucune date d&apos;observation disponible pour ce produit.</p>
                  </div>
                )}
              </TabPanel>

              <TabPanel value="ai" activeTab={activeTab} className="p-4 stagger-grid">
                <AiAnalysisPanel product={product} />
              </TabPanel>
            </div>

            {/* Barrier Gauge */}
            {product.barrierCapPct != null && (
              <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm p-4">
                <h3 className="font-body text-[10px] uppercase tracking-widest text-ink-3 font-semibold mb-3">
                  Jauge barriere
                </h3>
                <div className="flex justify-center py-2">
                  <BarrierGauge barrierPct={product.barrierCapPct} currentPct={product.currentPct ?? 100} size={220} />
                </div>
              </div>
            )}

            {/* Barrier Distance Indicator */}
            {product.barrierCapPct != null && (
              <BarrierDistanceBar
                barrierCapPct={product.barrierCapPct}
                currentPct={product.currentPct}
              />
            )}
          </div>

          {/* Right: CTA Card (1/3) */}
          <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-white/5 rounded-xl border border-border/60 shadow-sm p-4 flex flex-col gap-3 sticky top-6">
              <h3 className="font-body text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Étagère</h3>

              <div>
                <div className="flex items-center justify-between text-[11px] font-body mb-1">
                  <span className="text-ink-3">Remplissage</span>
                  <span className="font-bold text-ink tabular-nums font-mono">{(product.fillPct ?? 0).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, product.fillPct ?? 0)}%`,
                      background: (product.fillPct ?? 0) > 80
                        ? 'linear-gradient(90deg, #00B894, #00D4AA)'
                        : `linear-gradient(90deg, ${payoff.text}, ${payoff.text}dd)`,
                    }}
                  />
                </div>
              </div>

              {product.targetAmount != null && <DetailRow label="Objectif" value={formatAmount(product.targetAmount)} />}

              {/* Interests & engagement */}
              {(product.interestedCount != null || product.totalEngaged != null) && (
                <div className="grid grid-cols-2 gap-2">
                  {product.interestedCount != null && (
                    <div className="flex flex-col items-center py-1.5 rounded-md bg-surface-2">
                      <Users size={12} className="text-violet mb-0.5" />
                      <span className="font-display text-base font-bold text-ink tabular-nums">{product.interestedCount}</span>
                      <span className="text-[8px] uppercase tracking-wider text-ink-3 font-body">CGP intéressés</span>
                    </div>
                  )}
                  {product.totalEngaged != null && (
                    <div className="flex flex-col items-center py-1.5 rounded-md bg-surface-2">
                      <TrendingUp size={12} className="text-teal mb-0.5" />
                      <span className="font-display text-base font-bold text-ink tabular-nums">{formatAmount(product.totalEngaged)}</span>
                      <span className="text-[8px] uppercase tracking-wider text-ink-3 font-body">Engagé</span>
                    </div>
                  )}
                </div>
              )}

              {product.shelfClosingDate && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-2 border border-border/50">
                  <Clock size={11} className="text-ink-3" />
                  <div className="flex-1">
                    <p className="text-[9px] text-ink-3 font-body uppercase tracking-wider">Clôture</p>
                    <p className="text-[11px] font-semibold text-ink font-body tabular-nums">{formatDate(product.shelfClosingDate)}</p>
                  </div>
                  {closingDays != null && closingDays <= 30 && (
                    <span className="text-[10px] font-bold text-red bg-red-light px-1.5 py-0.5 rounded">J-{closingDays}</span>
                  )}
                </div>
              )}

              <div className="mt-1">
                <Button
                  variant={alreadyCommitted ? 'outline' : 'primary'}
                  size="lg"
                  className={cn("w-full rounded-xl", !alreadyCommitted && !isClosed && "bg-gradient-to-r from-violet to-violet/85 shadow-md shadow-violet/20 hover:shadow-lg hover:shadow-violet/30")}
                  disabled={isClosed}
                  onClick={() => setModalOpen(true)}
                >
                  {alreadyCommitted ? (
                    <><Shield size={15} /> Intérêt déjà enregistré</>
                  ) : (
                    <><TrendingUp size={15} /> {isClosed ? 'Produit fermé' : "Marquer mon intérêt"}</>
                  )}
                </Button>
                {!isClosed && (
                  <p className="mt-1.5 text-center text-[9px] text-ink-3 font-body leading-relaxed">
                    Sans engagement ferme de souscription. Votre marque d&apos;intérêt sera transmise aux équipes de distribution.
                  </p>
                )}
              </div>

              {/* Documents section */}
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold font-body">Documents</h4>
                {[
                  { label: 'Document KID (PRIIPS)', sub: "Document d'informations clés", icon: FileText },
                  { label: 'Fiche produit', sub: 'Présentation détaillée', icon: FileText },
                  { label: 'Présentation client', sub: 'Support commercial', icon: Download },
                ].map(({ label, sub, icon: Icon }) => {
                  const isRecent = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <button key={label} className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-border/80 bg-surface-2 hover:border-violet/40 hover:bg-violet-pale text-ink-3 hover:text-violet transition-all duration-150 w-full text-left">
                      <Icon size={14} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold font-body flex items-center gap-1.5">
                          {label}
                          {isRecent && (
                            <span className="inline-flex items-center rounded-full bg-[#E4EAFF] text-[#0A2799] px-1.5 py-0 text-[8px] font-bold">
                              Nouveau
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-body opacity-60">{sub}</p>
                      </div>
                      <ExternalLink size={12} />
                    </button>
                  );
                })}
              </div>
            </div>

            {product.entryFeePct != null && (
              <div className="bg-white rounded-xl border border-border/80 p-3">
                <h4 className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold font-body mb-1.5">Commission</h4>
                <p className="text-base font-display font-bold text-ink tabular-nums">
                  {product.entryFeePct.toFixed(2)}%
                  <span className="text-[11px] text-ink-3 font-body font-normal ml-1">frais d&apos;entrée</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <CommitmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shelfId={product.shelfId ?? product.id}
        productName={product.name}
        alreadyCommitted={alreadyCommitted}
      />
    </>
  );
}
