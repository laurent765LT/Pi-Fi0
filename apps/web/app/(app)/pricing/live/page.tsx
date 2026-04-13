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

const LOGO_COLORS: Record<string, { bg: string; text: string }> = {
  BNP: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  SG: { bg: 'bg-red-100', text: 'text-red-700' },
  NAT: { bg: 'bg-violet-pale', text: 'text-violet' },
  GS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  BARC: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
};

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
  const colors = LOGO_COLORS[quote.issuerLogo] ?? { bg: 'bg-surface-2', text: 'text-ink-2' };

  if (quote.status === 'waiting') {
    return (
      <div className="bg-white rounded-xl border border-border/80 p-5 flex items-center gap-4 opacity-50">
        <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
          <span className={cn('font-display text-xs font-bold', colors.text)}>{quote.issuerLogo}</span>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-semibold text-ink-2">{quote.issuerName}</p>
          <p className="font-body text-[11px] text-ink-3 mt-0.5">En attente de connexion…</p>
        </div>
        <Clock size={16} className="text-ink-3 animate-pulse" />
      </div>
    );
  }

  if (quote.status === 'connecting') {
    return (
      <div className="bg-white rounded-xl border border-violet/30 p-5 flex items-center gap-4 animate-pulse">
        <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
          <span className={cn('font-display text-xs font-bold', colors.text)}>{quote.issuerLogo}</span>
        </div>
        <div className="flex-1">
          <p className="font-body text-sm font-semibold text-ink">{quote.issuerName}</p>
          <p className="font-body text-[11px] text-violet mt-0.5">Calcul de la cotation en cours…</p>
        </div>
        <Loader2 size={16} className="text-violet animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 transition-all duration-300 hover:shadow-md',
        isBest ? 'border-teal shadow-sm ring-1 ring-teal/20' : 'border-border/80',
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo + rank */}
        <div className="flex flex-col items-center gap-1.5">
          <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
            <span className={cn('font-display text-xs font-bold', colors.text)}>{quote.issuerLogo}</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-ink-3">#{rank}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-body text-sm font-semibold text-ink">{quote.issuerName}</p>
            {isBest && (
              <span className="inline-flex items-center gap-1 bg-teal/10 text-teal text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Trophy size={10} />
                Meilleure offre
              </span>
            )}
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-body block">Prix</span>
              <span className="font-display text-lg font-bold text-ink">{quote.price.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-body block">Spread</span>
              <span className="font-mono text-sm font-semibold text-ink-2">{quote.spread.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-body block">Frais</span>
              <span className="font-mono text-sm font-semibold text-ink-2">{quote.fraisEntree.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-body block">Score</span>
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', quote.score >= 70 ? 'bg-teal' : quote.score >= 40 ? 'bg-gold' : 'bg-red')}
                    style={{ width: `${quote.score}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-bold text-ink-2">{quote.score}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
            <span className="text-[10px] font-body text-ink-3">
              <Clock size={10} className="inline mr-1" />
              Livraison {quote.delaiLivraison}
            </span>
            <span className="text-[10px] font-body text-ink-3">
              <Shield size={10} className="inline mr-1" />
              {quote.conditionsSpeciales}
            </span>
          </div>
        </div>

        {/* Select button */}
        <Button
          variant={isBest ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onSelect(quote)}
          className="shrink-0 self-center"
        >
          Sélectionner
          <ChevronRight size={13} className="ml-1" />
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
  const productName = searchParams.get('name') ?? 'Mon Produit Structuré';

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

  if (selectedQuote) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-2xl border border-teal/30 shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-teal" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2">Offre sélectionnée</h2>
          <p className="font-body text-sm text-ink-3 mb-6">
            Vous avez sélectionné l&apos;offre de <span className="font-semibold text-ink">{selectedQuote.issuerName}</span> à{' '}
            <span className="font-semibold text-violet">{selectedQuote.price.toFixed(2)}%</span> pour{' '}
            <span className="font-semibold text-ink">{productName}</span>.
          </p>

          <div className="grid grid-cols-3 gap-4 bg-surface-2 rounded-xl p-4 mb-6">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 block">Prix</span>
              <span className="font-display text-lg font-bold text-violet">{selectedQuote.price.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 block">Spread</span>
              <span className="font-mono text-sm font-semibold">{selectedQuote.spread.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-widest text-ink-3 block">Livraison</span>
              <span className="font-mono text-sm font-semibold">{selectedQuote.delaiLivraison}</span>
            </div>
          </div>

          <p className="text-[11px] text-ink-3 font-body italic mb-6">
            Cette sélection est simulée. En production, elle déclencherait le processus de confirmation avec l&apos;émetteur.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="md" onClick={() => setSelectedQuote(null)}>
              Revenir aux cotations
            </Button>
            <Button variant="primary" size="md" asChild>
              <Link href="/pricing">Nouveau pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-violet font-body font-semibold transition-colors mb-3">
          <ArrowLeft size={13} />
          Retour au Pricing Engine
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[28px] font-bold text-ink leading-tight">
              Consultation Émetteurs
            </h1>
            <p className="text-sm text-ink-3 font-body mt-1">
              Cotations en temps réel pour <span className="font-semibold text-ink">{productName}</span> — Fair Value : <span className="font-mono font-semibold text-violet">{fairValue.toFixed(2)}%</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-border/80 rounded-lg px-3 py-2">
              <div className={cn('w-2 h-2 rounded-full', allReceived ? 'bg-teal' : 'bg-gold animate-pulse')} />
              <span className="text-[11px] font-mono font-semibold text-ink-2">
                {receivedQuotes.length}/{quotes.length} reçues
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-3">
              <Clock size={12} />
              {elapsedSeconds}s
            </div>
          </div>
        </div>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet to-teal transition-all duration-700 ease-out"
            style={{ width: `${(receivedQuotes.length / Math.max(quotes.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Quotes */}
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

      {/* Summary when all received */}
      {allReceived && (
        <div className="mt-6 bg-gradient-to-r from-violet-pale to-[#E6FAF5] rounded-xl border border-violet/20 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center">
            <Zap size={18} className="text-violet" />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-ink">Toutes les cotations ont été reçues</p>
            <p className="font-body text-[11px] text-ink-3 mt-0.5">
              Meilleure offre : <span className="font-semibold text-teal">{sortedReceived[0]?.issuerName}</span> à{' '}
              <span className="font-mono font-semibold text-violet">{sortedReceived[0]?.price.toFixed(2)}%</span> (score {sortedReceived[0]?.score}/100)
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => handleSelect(sortedReceived[0]!)}>
            <Trophy size={14} className="mr-1.5" />
            Sélectionner la meilleure
          </Button>
        </div>
      )}
    </div>
  );
}
