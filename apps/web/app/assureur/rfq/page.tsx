'use client';

import { useState } from 'react';
import {
  MessageSquare, Inbox, Clock, CheckCircle2,
  Building2, Calendar, Target, Shield, Timer,
  ChevronDown, ChevronUp, Send, Check, Brain,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RfqStatus = 'PENDING' | 'QUOTED' | 'EXPIRED';
type RfqType = 'AUTOCALL_PHOENIX' | 'CAPITAL_PROTECTED' | 'BARRIER_NOTE' | 'AUTOCALL_COUPON';

interface RfqEntry {
  id: string;
  cgpName: string;
  cabinet: string;
  product: string;
  type: RfqType;
  amount: string;
  date: string;
  status: RfqStatus;
  couponTarget?: string;
  barrierTarget?: string;
  maturity?: string;
  quotedCoupon?: string;
  quotedPrice?: string;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const INITIAL_RFQS: RfqEntry[] = [
  {
    id: 'rfq-1',
    cgpName: 'Jean Dupont',
    cabinet: 'Cabinet Patrimoine Plus',
    product: 'Autocall Phoenix Euro Stoxx 50',
    type: 'AUTOCALL_PHOENIX',
    amount: '500 000\u00a0\u20ac',
    date: '2026-04-10',
    status: 'PENDING',
    couponTarget: '8%',
    barrierTarget: '60%',
    maturity: '5 ans',
  },
  {
    id: 'rfq-2',
    cgpName: 'Marie Laurent',
    cabinet: 'ML Conseil',
    product: 'Capital Protege Taux Fixe',
    type: 'CAPITAL_PROTECTED',
    amount: '1 000 000\u00a0\u20ac',
    date: '2026-04-08',
    status: 'QUOTED',
    quotedCoupon: '4.2%',
    quotedPrice: '99.5%',
  },
  {
    id: 'rfq-3',
    cgpName: 'Pierre Martin',
    cabinet: 'PGP Gestion',
    product: 'Barrier Reverse Convertible',
    type: 'BARRIER_NOTE',
    amount: '250 000\u00a0\u20ac',
    date: '2026-04-05',
    status: 'PENDING',
    couponTarget: '12%',
    barrierTarget: '55%',
    maturity: '3 ans',
  },
  {
    id: 'rfq-4',
    cgpName: 'Sophie Dubois',
    cabinet: 'Dubois & Associes',
    product: 'Phoenix Memory Coupon',
    type: 'AUTOCALL_PHOENIX',
    amount: '750 000\u00a0\u20ac',
    date: '2026-04-01',
    status: 'QUOTED',
    quotedCoupon: '9.5%',
    quotedPrice: '100.2%',
  },
  {
    id: 'rfq-5',
    cgpName: 'Thomas Richard',
    cabinet: 'TR Patrimoine',
    product: 'Autocall Euro Stoxx',
    type: 'AUTOCALL_COUPON',
    amount: '300 000\u00a0\u20ac',
    date: '2026-03-28',
    status: 'EXPIRED',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<RfqType, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  CAPITAL_PROTECTED: 'Capital Protege',
  BARRIER_NOTE: 'Barrier Note',
  AUTOCALL_COUPON: 'Autocall Coupon',
};

const STATUS_CONFIG: Record<RfqStatus, { label: string; variant: 'gold' | 'teal' | 'muted' }> = {
  PENDING: { label: 'En attente', variant: 'gold' },
  QUOTED:  { label: 'Repondue',   variant: 'teal' },
  EXPIRED: { label: 'Expiree',    variant: 'muted' },
};

function formatDateFR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// AI helpers — deterministic pseudo-suggestions based on RFQ data
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getAiSuggestion(rfq: RfqEntry) {
  const h = hashString(rfq.id + rfq.cgpName);
  const coupon = (7 + (h % 40) / 10).toFixed(1);        // 7.0 – 10.9
  const price = (99 + (h % 15) / 10).toFixed(1);         // 99.0 – 100.4
  const confidence = 70 + (h % 25);                       // 70 – 94
  return { coupon, price, confidence };
}

function getAiCgpProfile(cgpName: string) {
  const h = hashString(cgpName);
  const volumes = ['250k', '500k', '750k', '1M', '1.5M'];
  const types = ['Habitue', 'Regulier', 'Nouveau', 'Fidele', 'Occasionnel'];
  const volume = volumes[h % volumes.length];
  const profil = types[h % types.length];
  const conversion = 55 + (h % 40);                       // 55 – 94
  return { profil, volume, conversion };
}

// ---------------------------------------------------------------------------
// Inline quote form
// ---------------------------------------------------------------------------

interface QuoteFormProps {
  rfq: RfqEntry;
  onSubmit: (coupon: string, price: string, comment: string) => void;
  onCancel: () => void;
}

function QuoteForm({ rfq, onSubmit, onCancel }: QuoteFormProps) {
  const [coupon, setCoupon] = useState('');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');

  const canSubmit = coupon.trim() !== '' && price.trim() !== '';
  const aiSugg = getAiSuggestion(rfq);

  return (
    <div className="mt-4 p-4 rounded-lg border border-violet/20 bg-violet/[0.03]">
      {/* AI Suggestion Box */}
      <div className="mb-4 p-3 rounded-lg border-l-[3px] border-l-teal bg-teal/[0.05] border border-teal/15">
        <div className="flex items-center gap-1.5 mb-2">
          <Brain size={13} className="text-teal" />
          <span className="text-[11px] font-display font-bold text-teal uppercase tracking-wide">
            Suggestion IA
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] font-body">
          <div>
            <span className="text-ink-3">Coupon recommande : </span>
            <strong className="text-ink dark:text-white">{aiSugg.coupon}%</strong>
            <span className="text-ink-4 text-[10px] ml-1">(conditions de marche)</span>
          </div>
          <div>
            <span className="text-ink-3">Prix d&apos;emission suggere : </span>
            <strong className="text-ink dark:text-white">{aiSugg.price}%</strong>
          </div>
          <div>
            <span className="text-ink-3">Confiance : </span>
            <strong className={cn(
              aiSugg.confidence >= 80 ? 'text-[#059669]' : aiSugg.confidence >= 65 ? 'text-[#D97706]' : 'text-[#DC2626]',
            )}>{aiSugg.confidence}%</strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setCoupon(aiSugg.coupon); setPrice(aiSugg.price); }}
          className="mt-2 text-[11px] font-semibold font-body text-teal hover:text-teal/80 transition-colors underline underline-offset-2"
        >
          Appliquer la suggestion
        </button>
      </div>

      <h4 className="text-[12px] font-display font-bold text-ink dark:text-white mb-3">
        Soumettre une cotation
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Coupon */}
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-xs font-bold uppercase tracking-wide text-ink-2">
            Coupon propose (%)
          </label>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="ex: 8.5"
            className={cn(
              'w-full rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink',
              'px-3 h-9 placeholder:text-ink-3',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
            )}
          />
        </div>

        {/* Prix */}
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-xs font-bold uppercase tracking-wide text-ink-2">
            Prix d&apos;emission (%)
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="ex: 99.5"
            className={cn(
              'w-full rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink',
              'px-3 h-9 placeholder:text-ink-3',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
            )}
          />
        </div>
      </div>

      {/* Commentaire */}
      <div className="flex flex-col gap-1.5 mb-4">
        <label className="font-body text-xs font-bold uppercase tracking-wide text-ink-2">
          Commentaire <span className="font-normal text-ink-3">(optionnel)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Conditions, remarques..."
          className={cn(
            'w-full rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink',
            'px-3 py-2 placeholder:text-ink-3 resize-none',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-violet focus:ring-offset-0 focus:border-violet',
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={!canSubmit}
          onClick={() => onSubmit(coupon, price, comment)}
        >
          <Send size={12} />
          Envoyer la cotation
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single RFQ card
// ---------------------------------------------------------------------------

interface RfqCardProps {
  rfq: RfqEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onQuote: (coupon: string, price: string, comment: string) => void;
}

function RfqCard({ rfq, isExpanded, onToggle, onQuote }: RfqCardProps) {
  const statusCfg = STATUS_CONFIG[rfq.status];
  const aiProfile = getAiCgpProfile(rfq.cgpName);

  return (
    <div className="relative overflow-hidden group bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm">
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: rfq.status === 'PENDING'
            ? 'linear-gradient(90deg, #D4A017, #F0D98A)'
            : rfq.status === 'QUOTED'
            ? 'linear-gradient(90deg, #00B894, #A3EDD9)'
            : 'linear-gradient(90deg, #94A3B8, #CBD5E1)',
        }}
      />

      {/* Main row */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: CGP info + product */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-violet/10 to-cobalt/10">
                <Building2 size={13} className="text-violet" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink dark:text-white font-body truncate">
                  {rfq.cgpName}
                </p>
                <p className="text-[11px] text-ink-3 dark:text-white/40 font-body truncate">
                  {rfq.cabinet}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[13px] font-medium text-ink dark:text-white font-body">
                {rfq.product}
              </span>
              <Badge variant="violet" size="sm">
                {TYPE_LABELS[rfq.type]}
              </Badge>
            </div>

            {/* AI Analysis Badge */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet/[0.06] border border-violet/10">
                <Brain size={10} className="text-violet" />
                <span className="text-[10px] font-body text-ink-2 dark:text-white/60">
                  Profil CGP : <strong className="text-ink dark:text-white">{aiProfile.profil}</strong>, volume moyen <strong className="text-ink dark:text-white">{aiProfile.volume}&euro;</strong>
                </span>
              </div>
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md border',
                aiProfile.conversion >= 75
                  ? 'bg-[#D1FAE5]/50 border-[#059669]/15 text-[#059669]'
                  : aiProfile.conversion >= 60
                  ? 'bg-[#FEF3C7]/50 border-[#D97706]/15 text-[#D97706]'
                  : 'bg-[#FEE2E2]/50 border-[#DC2626]/15 text-[#DC2626]',
              )}>
                <span className="text-[10px] font-body font-semibold">
                  Probabilite de conversion : {aiProfile.conversion}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: status + amount + date */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={statusCfg.variant} size="md">
              {statusCfg.label}
            </Badge>
            <span className="text-[15px] font-display font-bold text-ink dark:text-white">
              {rfq.amount}
            </span>
            <span className="text-[11px] text-ink-3 dark:text-white/40 font-body flex items-center gap-1">
              <Calendar size={10} /> {formatDateFR(rfq.date)}
            </span>
          </div>
        </div>

        {/* Parameters row */}
        {(rfq.couponTarget || rfq.barrierTarget || rfq.maturity) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
            {rfq.couponTarget && (
              <span className="flex items-center gap-1 text-[12px] font-body text-ink-2 dark:text-ink-3">
                <Target size={11} className="text-violet" />
                Coupon cible: <strong className="text-ink dark:text-white">{rfq.couponTarget}</strong>
              </span>
            )}
            {rfq.barrierTarget && (
              <span className="flex items-center gap-1 text-[12px] font-body text-ink-2 dark:text-ink-3">
                <Shield size={11} className="text-cobalt" />
                Barriere: <strong className="text-ink dark:text-white">{rfq.barrierTarget}</strong>
              </span>
            )}
            {rfq.maturity && (
              <span className="flex items-center gap-1 text-[12px] font-body text-ink-2 dark:text-ink-3">
                <Timer size={11} className="text-teal" />
                Maturite: <strong className="text-ink dark:text-white">{rfq.maturity}</strong>
              </span>
            )}
          </div>
        )}

        {/* Quoted values for QUOTED status */}
        {rfq.status === 'QUOTED' && rfq.quotedCoupon && rfq.quotedPrice && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40">
            <span className="flex items-center gap-1.5 text-[12px] font-body text-[#007A63]">
              <Check size={13} className="text-[#007A63]" strokeWidth={2.5} />
              Coupon propose: <strong>{rfq.quotedCoupon}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-[12px] font-body text-[#007A63]">
              <Check size={13} className="text-[#007A63]" strokeWidth={2.5} />
              Prix d&apos;emission: <strong>{rfq.quotedPrice}</strong>
            </span>
          </div>
        )}

        {/* Action / expand for PENDING */}
        {rfq.status === 'PENDING' && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <button
              onClick={onToggle}
              className={cn(
                'inline-flex items-center gap-1.5 text-[12px] font-semibold font-body transition-colors',
                'text-violet hover:text-violet-dark',
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={13} /> Fermer le formulaire
                </>
              ) : (
                <>
                  <Send size={12} /> Repondre
                  <ChevronDown size={13} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Inline form */}
        {rfq.status === 'PENDING' && isExpanded && (
          <QuoteForm rfq={rfq} onSubmit={onQuote} onCancel={onToggle} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RfqPage() {
  const [rfqs, setRfqs] = useState<RfqEntry[]>(INITIAL_RFQS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toasts, success, dismiss } = useToast();

  const pendingCount = rfqs.filter((r) => r.status === 'PENDING').length;
  const quotedCount = rfqs.filter((r) => r.status === 'QUOTED').length;
  const totalThisMonth = rfqs.length;

  function handleQuote(rfqId: string, coupon: string, price: string, _comment: string) {
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === rfqId
          ? { ...r, status: 'QUOTED' as RfqStatus, quotedCoupon: `${coupon}%`, quotedPrice: `${price}%` }
          : r,
      ),
    );
    setExpandedId(null);
    success(`Cotation envoyee pour la demande ${rfqId}`, {
      title: 'Cotation soumise',
    });
  }

  return (
    <div>
      <PageHeader
        icon={MessageSquare}
        title="Demandes de cotation"
        subtitle="Repondez aux demandes de cotation envoyees par les CGP"
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: Inbox,
            label: 'RFQ recues ce mois',
            value: totalThisMonth,
            gradient: 'from-violet/10 to-cobalt/10',
            iconColor: 'text-violet',
          },
          {
            icon: Clock,
            label: 'En attente de reponse',
            value: pendingCount,
            gradient: 'from-[#FDF3D6] to-[#FEF3C7]',
            iconColor: 'text-[#9B7210]',
            valueColor: 'text-[#9B7210]',
          },
          {
            icon: CheckCircle2,
            label: 'Repondues',
            value: quotedCount,
            gradient: 'from-[#D6F7EF] to-[#D1FAE5]',
            iconColor: 'text-[#007A63]',
            valueColor: 'text-[#007A63]',
          },
        ].map(({ icon: Icon, label, value, gradient, iconColor, valueColor }) => (
          <div
            key={label}
            className="relative overflow-hidden group bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm p-5"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn('w-9 h-9 bg-gradient-to-br rounded-lg flex items-center justify-center mb-3', gradient)}>
              <Icon size={16} className={iconColor} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold block font-body text-ink-3 dark:text-white/40">
              {label}
            </span>
            <span className={cn('text-[24px] font-display font-bold', valueColor ?? 'text-ink dark:text-white')}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* RFQ list */}
      <div className="flex flex-col gap-4">
        {rfqs.map((rfq) => (
          <RfqCard
            key={rfq.id}
            rfq={rfq}
            isExpanded={expandedId === rfq.id}
            onToggle={() => setExpandedId((prev) => (prev === rfq.id ? null : rfq.id))}
            onQuote={(coupon, price, comment) => handleQuote(rfq.id, coupon, price, comment)}
          />
        ))}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
