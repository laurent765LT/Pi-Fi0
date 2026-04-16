'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Trophy,
  Zap,
  Building2,
  TrendingUp,
  Shield,
  ChevronRight,
  Sparkles,
  Radio,
  Signal,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { generateIssuerQuotes, getQuoteDelay, type IssuerQuote } from '@/lib/pricing-simulator';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────

type QuoteStatus = 'waiting' | 'connecting' | 'received';

interface LiveQuote extends IssuerQuote {
  status: QuoteStatus;
}

// ─── Issuer logo colors ─────────────────────────────────────────────────────

const LOGO_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  BNP: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  SG: { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-200 dark:ring-red-800' },
  NAT: { bg: 'bg-violet-pale dark:bg-violet/20', text: 'text-violet dark:text-violet-light', ring: 'ring-violet/20 dark:ring-violet/40' },
  GS: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800' },
  BARC: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-400', ring: 'ring-cyan-200 dark:ring-cyan-800' },
};

// ─── Status indicator dot ───────────────────────────────────────────────────

function StatusDot({ status }: { status: QuoteStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'connecting' && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet/60 opacity-75" />
      )}
      <span
        className={cn(
          'relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-500',
          status === 'waiting' && 'bg-ink-3/40 dark:bg-ink-3/30',
          status === 'connecting' && 'bg-violet',
          status === 'received' && 'bg-teal',
        )}
      />
    </span>
  );
}

// ─── Score bar with color ───────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-teal' : score >= 40 ? 'bg-gold' : 'bg-red';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-surface-2 dark:bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-mono text-[11px] font-bold text-ink-2 dark:text-ink-2 tabular-nums">
        {score}
      </span>
    </div>
  );
}

// ─── Quote Card ─────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  rank,
  isBest,
  onSelect,
}: {
  quote: LiveQuote;
  rank: number;
  isBest: boolean;
  onSelect: (q: LiveQuote) => void;
}) {
  const colors = LOGO_COLORS[quote.issuerLogo] ?? {
    bg: 'bg-surface-2 dark:bg-white/5',
    text: 'text-ink-2',
    ring: 'ring-border/60',
  };

  /* ── Waiting state ── */
  if (quote.status === 'waiting') {
    return (
      <div className="group relative rounded-xl border border-border/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm p-5 flex items-center gap-4 opacity-60 transition-all duration-200 hover:opacity-70">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1',
            colors.bg,
            colors.ring,
          )}
        >
          <span className={cn('font-display text-xs font-bold', colors.text)}>
            {quote.issuerLogo}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-ink-2 dark:text-ink-2">
            {quote.issuerName}
          </p>
          <p className="font-body text-[11px] text-ink-3 mt-0.5 flex items-center gap-1.5">
            <StatusDot status="waiting" />
            En attente de connexion...
          </p>
        </div>
        <Clock size={16} className="text-ink-3/50 animate-pulse" />
      </div>
    );
  }

  /* ── Connecting state ── */
  if (quote.status === 'connecting') {
    return (
      <div className="group relative rounded-xl border border-violet/30 dark:border-violet/40 bg-white dark:bg-white/[0.04] backdrop-blur-sm p-5 flex items-center gap-4 transition-all duration-200 shadow-sm">
        {/* Subtle animated border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet/5 via-transparent to-violet/5 animate-pulse pointer-events-none" />
        <div
          className={cn(
            'relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1',
            colors.bg,
            colors.ring,
          )}
        >
          <span className={cn('font-display text-xs font-bold', colors.text)}>
            {quote.issuerLogo}
          </span>
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-ink dark:text-white">
            {quote.issuerName}
          </p>
          <p className="font-body text-[11px] text-violet dark:text-violet-light mt-0.5 flex items-center gap-1.5">
            <StatusDot status="connecting" />
            Calcul de la cotation en cours...
          </p>
        </div>
        <Loader2 size={16} className="relative text-violet animate-spin" />
      </div>
    );
  }

  /* ── Received state ── */
  return (
    <div
      className={cn(
        'group relative rounded-xl border p-5 transition-all duration-200',
        'bg-white dark:bg-white/[0.04] backdrop-blur-sm',
        'hover:shadow-md hover:-translate-y-[1px]',
        isBest
          ? 'border-teal/40 dark:border-teal/50 shadow-sm ring-1 ring-teal/10'
          : 'border-border/60 dark:border-white/10 shadow-sm hover:border-violet/30 dark:hover:border-violet/40',
      )}
    >
      {/* Best offer shimmer */}
      {isBest && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal/[0.03] via-transparent to-teal/[0.03] pointer-events-none" />
      )}

      <div className="relative flex items-start gap-4">
        {/* Logo + rank */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ring-1 transition-shadow duration-200 group-hover:shadow-sm',
              colors.bg,
              colors.ring,
            )}
          >
            <span className={cn('font-display text-xs font-bold', colors.text)}>
              {quote.issuerLogo}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-ink-3/70 dark:text-ink-3/50 tabular-nums">
            #{rank}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-3">
            <p className="font-body text-sm font-semibold text-ink dark:text-white">
              {quote.issuerName}
            </p>
            <StatusDot status="received" />
            {isBest && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-teal/15 to-emerald-500/10 dark:from-teal/25 dark:to-emerald-500/20 text-teal dark:text-teal text-[10px] font-bold px-2.5 py-0.5 rounded-full ring-1 ring-teal/20">
                <Trophy size={10} className="drop-shadow-sm" />
                Meilleure offre
              </span>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-body block">
                Prix
              </span>
              <span className="font-display text-lg font-bold text-ink dark:text-white tabular-nums">
                {quote.price.toFixed(2)}%
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-body block">
                Spread
              </span>
              <span className="font-mono text-sm font-semibold text-ink-2 dark:text-ink-2 tabular-nums">
                {quote.spread.toFixed(2)}%
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-body block">
                Frais
              </span>
              <span className="font-mono text-sm font-semibold text-ink-2 dark:text-ink-2 tabular-nums">
                {quote.fraisEntree.toFixed(2)}%
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 font-body block">
                Score
              </span>
              <ScoreBar score={quote.score} />
            </div>
          </div>

          {/* Details footer */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/40 dark:border-white/10">
            <span className="text-[10px] font-body text-ink-3 inline-flex items-center gap-1">
              <Clock size={10} className="opacity-60" />
              Livraison {quote.delaiLivraison}
            </span>
            <span className="text-[10px] font-body text-ink-3 inline-flex items-center gap-1">
              <Shield size={10} className="opacity-60" />
              {quote.conditionsSpeciales}
            </span>
          </div>
        </div>

        {/* Select button */}
        <Button
          variant={isBest ? 'teal' : 'outline'}
          size="sm"
          onClick={() => onSelect(quote)}
          className={cn(
            'shrink-0 self-center rounded-lg transition-all duration-200',
            isBest && 'shadow-sm hover:shadow-md',
          )}
        >
          Selectionner
          <ChevronRight size={13} className="ml-0.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PricingLivePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fairValue = parseFloat(searchParams.get('fv') ?? '96.5');
  const productName = searchParams.get('name') ?? 'Mon Produit Structure';

  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<LiveQuote | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const initialized = useRef(false);

  // Generate quotes and animate arrival
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const generated = generateIssuerQuotes(fairValue);
    const initial: LiveQuote[] = generated.map((q) => ({ ...q, status: 'waiting' as QuoteStatus }));
    setQuotes(initial);

    // Animate each quote arriving
    generated.forEach((q, i) => {
      const connectDelay = getQuoteDelay(i) * 0.4;
      const receiveDelay = getQuoteDelay(i);

      setTimeout(() => {
        setQuotes((prev) =>
          prev.map((pq) => (pq.id === q.id ? { ...pq, status: 'connecting' } : pq)),
        );
      }, connectDelay);

      setTimeout(() => {
        setQuotes((prev) =>
          prev.map((pq) => (pq.id === q.id ? { ...pq, ...q, status: 'received' } : pq)),
        );
      }, receiveDelay);
    });
  }, [fairValue]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const receivedQuotes = quotes.filter((q) => q.status === 'received');
  const sortedReceived = [...receivedQuotes].sort((a, b) => b.score - a.score);
  const bestId = sortedReceived[0]?.id;
  const allReceived = quotes.length > 0 && receivedQuotes.length === quotes.length;

  const handleSelect = useCallback((q: LiveQuote) => {
    setSelectedQuote(q);
  }, []);

  // ─── Selection confirmation view ─────────────────────────────────────────

  if (selectedQuote) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto py-12">
        <div className="relative overflow-hidden rounded-2xl border border-teal/20 dark:border-teal/30 bg-white dark:bg-white/[0.04] backdrop-blur-sm shadow-lg p-8 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] via-transparent to-violet/[0.03] pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-teal/50 to-transparent" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal/15 to-emerald-500/10 dark:from-teal/25 dark:to-emerald-500/15 flex items-center justify-center mx-auto mb-5 ring-1 ring-teal/20">
              <CheckCircle2 size={32} className="text-teal drop-shadow-sm" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink dark:text-white mb-2">
              Offre selectionnee
            </h2>
            <p className="font-body text-sm text-ink-3 mb-6 max-w-md mx-auto">
              Vous avez selectionne l&apos;offre de{' '}
              <span className="font-semibold text-ink dark:text-white">{selectedQuote.issuerName}</span> a{' '}
              <span className="font-semibold text-violet dark:text-violet-light">{selectedQuote.price.toFixed(2)}%</span>{' '}
              pour <span className="font-semibold text-ink dark:text-white">{productName}</span>.
            </p>

            <div className="grid grid-cols-3 gap-4 rounded-xl bg-surface-2/50 dark:bg-white/[0.04] border border-border/40 dark:border-white/10 p-5 mb-6">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 block font-body">
                  Prix
                </span>
                <span className="font-display text-lg font-bold text-violet dark:text-violet-light tabular-nums">
                  {selectedQuote.price.toFixed(2)}%
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 block font-body">
                  Spread
                </span>
                <span className="font-mono text-sm font-semibold text-ink-2 tabular-nums">
                  {selectedQuote.spread.toFixed(2)}%
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-[0.15em] text-ink-3 block font-body">
                  Livraison
                </span>
                <span className="font-mono text-sm font-semibold text-ink-2">
                  {selectedQuote.delaiLivraison}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-ink-3 font-body italic mb-6">
              Cette selection est simulee. En production, elle declencherait le processus de confirmation avec l&apos;emetteur.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedQuote(null)}
                className="rounded-lg"
              >
                Revenir aux cotations
              </Button>
              <Button variant="primary" size="md" className="rounded-lg" asChild>
                <Link href="/pricing">Nouveau pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main live consultation view ──────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-violet dark:hover:text-violet-light font-body font-semibold transition-colors duration-200 mb-4 group"
        >
          <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Retour au Pricing Engine
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="font-display text-[28px] font-bold text-ink dark:text-white leading-tight">
                Consultation Emetteurs
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet/10 dark:bg-violet/20">
                <Radio size={11} className={cn('text-violet', !allReceived && 'animate-pulse')} />
                <span className="text-[10px] font-body font-bold text-violet dark:text-violet-light uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
            <p className="text-sm text-ink-3 font-body">
              Cotations en temps reel pour{' '}
              <span className="font-semibold text-ink dark:text-white">{productName}</span>
              {' '}&mdash; Fair Value :{' '}
              <span className="font-mono font-semibold text-violet dark:text-violet-light tabular-nums">
                {fairValue.toFixed(2)}%
              </span>
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white dark:bg-white/[0.06] border border-border/60 dark:border-white/10 rounded-xl px-3.5 py-2 shadow-sm">
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-colors duration-500',
                  allReceived ? 'bg-teal' : 'bg-gold animate-pulse',
                )}
              />
              <span className="text-[11px] font-mono font-semibold text-ink-2 tabular-nums">
                {receivedQuotes.length}/{quotes.length} recues
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-white/[0.06] border border-border/60 dark:border-white/10 rounded-xl px-3 py-2 shadow-sm">
              <Clock size={12} className="text-ink-3" />
              <span className="text-[11px] font-mono font-semibold text-ink-3 tabular-nums">
                {elapsedSeconds}s
              </span>
            </div>
          </div>
        </div>

        <div className="gradient-bar h-[2px] rounded-full mt-6 opacity-50" />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1.5 rounded-full bg-surface-2 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet to-teal transition-all duration-700 ease-out"
            style={{ width: `${(receivedQuotes.length / Math.max(quotes.length, 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] font-mono text-ink-3/60">0%</span>
          <span className="text-[9px] font-mono text-ink-3/60">100%</span>
        </div>
      </div>

      {/* Quotes list */}
      <div className="flex flex-col gap-3">
        {quotes.map((q) => {
          const rank = q.status === 'received'
            ? sortedReceived.findIndex((s) => s.id === q.id) + 1
            : 0;
          return (
            <QuoteCard
              key={q.id}
              quote={q}
              rank={rank}
              isBest={q.id === bestId && q.status === 'received'}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      {/* Summary banner when all received */}
      {allReceived && (
        <div className="mt-6 relative overflow-hidden rounded-xl border border-violet/20 dark:border-violet/30 shadow-sm">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet/[0.06] via-transparent to-teal/[0.06] dark:from-violet/10 dark:to-teal/10 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-violet/30 via-teal/30 to-violet/30" />

          <div className="relative p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet/10 to-teal/10 dark:from-violet/20 dark:to-teal/20 flex items-center justify-center ring-1 ring-violet/10">
              <Sparkles size={18} className="text-violet dark:text-violet-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-semibold text-ink dark:text-white">
                Toutes les cotations ont ete recues
              </p>
              <p className="font-body text-[11px] text-ink-3 mt-0.5">
                Meilleure offre :{' '}
                <span className="font-semibold text-teal">{sortedReceived[0]?.issuerName}</span> a{' '}
                <span className="font-mono font-semibold text-violet dark:text-violet-light tabular-nums">
                  {sortedReceived[0]?.price.toFixed(2)}%
                </span>{' '}
                (score {sortedReceived[0]?.score}/100)
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSelect(sortedReceived[0]!)}
              className="rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Trophy size={14} className="mr-1.5" />
              Selectionner la meilleure
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
