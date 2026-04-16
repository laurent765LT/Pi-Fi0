'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Brain,
  Send,
  AlertTriangle,
  TrendingUp,
  Shield,
  Clock,
  Droplets,
  Target,
  Zap,
  Info,
  ChevronRight,
  Activity,
  Calendar,
  Sparkles,
  ArrowRight,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMyCommitments } from '@/hooks/use-commitments';
import { useProducts } from '@/hooks/use-products';
import { DEMO_PRODUCTS, DEMO_COMMITMENTS, DEMO_RECOMMENDATIONS } from '@/lib/demo-data';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
}

interface AlertItem {
  id: string;
  priority: 'URGENT' | 'ACTION' | 'OPPORTUNITE' | 'INFO';
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SubScore {
  label: string;
  key: string;
  score: number;
  color: string;
  barColor: string;
  explanation: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'observation' | 'closing' | 'coupon' | 'maturity';
  productName: string;
  description: string;
  action: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function daysBetween(d1: string, d2: string) {
  return Math.ceil(
    (new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ---------------------------------------------------------------------------
// Portfolio Analysis Engine
// ---------------------------------------------------------------------------

function computePortfolioAnalysis() {
  const commitments = DEMO_COMMITMENTS;
  const products = DEMO_PRODUCTS;

  // Map commitments to products
  const portfolioProducts = commitments
    .map((c) => {
      const product = products.find((p) => p.name === c.productName);
      return product ? { ...c, product } : null;
    })
    .filter(Boolean) as (typeof commitments[0] & { product: typeof products[0] })[];

  const totalAmount = portfolioProducts.reduce((s, c) => s + c.amount, 0);

  // --- Diversification score ---
  const payoffCounts: Record<string, number> = {};
  const issuerCounts: Record<string, number> = {};
  portfolioProducts.forEach((c) => {
    payoffCounts[c.product.payoffType] = (payoffCounts[c.product.payoffType] || 0) + c.amount;
    issuerCounts[c.product.issuerName] = (issuerCounts[c.product.issuerName] || 0) + c.amount;
  });
  const payoffHHI = Object.values(payoffCounts).reduce(
    (s, v) => s + (v / totalAmount) ** 2,
    0,
  );
  const issuerHHI = Object.values(issuerCounts).reduce(
    (s, v) => s + (v / totalAmount) ** 2,
    0,
  );
  const diversificationScore = Math.round(
    Math.max(20, 100 - (payoffHHI + issuerHHI) * 50),
  );

  // --- Risk score ---
  const weightedSRI =
    portfolioProducts.reduce((s, c) => s + c.product.sri * c.amount, 0) /
    totalAmount;
  const avgBarrier =
    portfolioProducts.reduce(
      (s, c) => s + (c.product.barrierCapPct ?? 100) * c.amount,
      0,
    ) / totalAmount;
  const riskScore = Math.round(
    Math.min(95, Math.max(30, 100 - weightedSRI * 5 + (avgBarrier - 50) * 0.5)),
  );

  // --- Yield score ---
  const avgCoupon =
    portfolioProducts.reduce(
      (s, c) => s + (c.product.couponPct ?? c.product.maxGainPct ?? 0) * c.amount,
      0,
    ) / totalAmount;
  const yieldScore = Math.round(Math.min(95, Math.max(30, avgCoupon * 1.2 + 20)));

  // --- Timing score ---
  const now = new Date().toISOString().slice(0, 10);
  const upcomingEvents = products
    .flatMap((p) =>
      (p.observationDates ?? []).map((d) => ({ date: d, product: p })),
    )
    .filter((e) => e.date > now)
    .sort((a, b) => a.date.localeCompare(b.date));
  const timingScore = Math.round(
    Math.min(95, 60 + upcomingEvents.slice(0, 5).length * 4),
  );

  // --- Liquidity score ---
  const maxConcentration = Math.max(
    ...portfolioProducts.map((c) => c.amount / totalAmount),
  );
  const liquidityScore = Math.round(
    Math.max(30, 100 - maxConcentration * 50 - portfolioProducts.length * 1),
  );

  // --- Global score ---
  const globalScore = Math.round(
    diversificationScore * 0.2 +
      riskScore * 0.25 +
      yieldScore * 0.2 +
      timingScore * 0.15 +
      liquidityScore * 0.2,
  );

  return {
    totalAmount,
    globalScore,
    diversificationScore,
    riskScore,
    yieldScore,
    timingScore,
    liquidityScore,
    portfolioProducts,
    payoffCounts,
    issuerCounts,
    weightedSRI,
    avgBarrier,
    avgCoupon,
    maxConcentration,
    upcomingEvents,
    commitments,
    products,
  };
}

// ---------------------------------------------------------------------------
// Chat Response Engine (local, no API)
// ---------------------------------------------------------------------------

function generateAgentResponse(input: string, analysis: ReturnType<typeof computePortfolioAnalysis>): string {
  const lower = input.toLowerCase();
  const {
    totalAmount,
    globalScore,
    diversificationScore,
    riskScore,
    yieldScore,
    weightedSRI,
    avgBarrier,
    avgCoupon,
    maxConcentration,
    portfolioProducts,
    payoffCounts,
    issuerCounts,
    upcomingEvents,
    commitments,
    products,
  } = analysis;

  // --- RISK ---
  if (lower.match(/risque|risk|sri|danger|perte/)) {
    const phoenixPct = ((payoffCounts['AUTOCALL_PHOENIX'] ?? 0) / totalAmount * 100).toFixed(1);
    return `Analyse de risque de votre portefeuille :\n\n` +
      `- Score de risque global : ${riskScore}/100\n` +
      `- SRI moyen pondere : ${weightedSRI.toFixed(1)}/7\n` +
      `- Barriere moyenne : ${avgBarrier.toFixed(0)}%\n` +
      `- Exposition Autocall Phoenix : ${phoenixPct}% du portefeuille\n\n` +
      `Recommandation : ${weightedSRI > 4 ? 'Votre profil est relativement agressif. Envisagez d\'ajouter des produits Capital Protege (SRI 2) pour equilibrer.' : 'Votre profil de risque est equilibre. Maintenez cette allocation.'}`;
  }

  // --- DIVERSIFICATION ---
  if (lower.match(/diversif|concentration|repartit|alloc/)) {
    const payoffBreakdown = Object.entries(payoffCounts)
      .map(([k, v]) => `  - ${k.replace(/_/g, ' ')}: ${formatAmount(v)} (${(v / totalAmount * 100).toFixed(1)}%)`)
      .join('\n');
    const issuerBreakdown = Object.entries(issuerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `  - ${k}: ${formatAmount(v)} (${(v / totalAmount * 100).toFixed(1)}%)`)
      .join('\n');
    return `Analyse de diversification :\n\n` +
      `Score : ${diversificationScore}/100\n` +
      `Concentration max : ${(maxConcentration * 100).toFixed(1)}% sur une seule position\n\n` +
      `Par type de payoff :\n${payoffBreakdown}\n\n` +
      `Top 3 emetteurs :\n${issuerBreakdown}\n\n` +
      `${maxConcentration > 0.3 ? 'Attention : concentration elevee. Diversifiez vers d\'autres types de produits.' : 'Bonne diversification entre emetteurs et payoffs.'}`;
  }

  // --- YIELD ---
  if (lower.match(/rendement|coupon|performance|gain|profit/)) {
    const topYield = products
      .filter((p) => !commitments.find((c) => c.productName === p.name))
      .sort((a, b) => (b.couponPct ?? b.maxGainPct ?? 0) - (a.couponPct ?? a.maxGainPct ?? 0))
      .slice(0, 3);
    return `Analyse de rendement :\n\n` +
      `- Score rendement : ${yieldScore}/100\n` +
      `- Coupon/gain moyen pondere : ${avgCoupon.toFixed(2)}%\n` +
      `- Montant total engage : ${formatAmount(totalAmount)}\n\n` +
      `Produits a rendement superieur disponibles :\n` +
      topYield.map((p) => `  - ${p.name} : ${p.couponPct ?? p.maxGainPct}% (${p.payoffType.replace(/_/g, ' ')})`).join('\n') +
      `\n\nConseil : ${avgCoupon < 6 ? 'Votre rendement moyen est en dessous du marche. Explorez les produits Autocall pour booster la performance.' : 'Bon rendement moyen. Restez vigilant sur le couple rendement/risque.'}`;
  }

  // --- CALENDAR ---
  if (lower.match(/echeance|maturite|calendrier|date|observation|prochain/)) {
    const next5 = upcomingEvents.slice(0, 5);
    if (next5.length === 0) {
      return 'Aucune date d\'observation a venir dans les prochaines semaines.';
    }
    return `Prochaines echeances de votre portefeuille :\n\n` +
      next5.map((e) => `  - ${formatDate(e.date)} : ${e.product.name} (observation${e.product.autocallBarrierPct ? `, seuil autocall ${e.product.autocallBarrierPct}%` : ''})`).join('\n') +
      `\n\nPensez a verifier les niveaux de sous-jacent avant chaque date d'observation. Un franchissement de barriere peut entrainer un remboursement anticipe.`;
  }

  // --- OPTIMIZE ---
  if (lower.match(/optimis|amelior|conseil|suggest|recommand/)) {
    const recs = DEMO_RECOMMENDATIONS.slice(0, 3);
    return `Recommandations pour optimiser votre portefeuille :\n\n` +
      recs.map((r, i) => `${i + 1}. ${r.product.name} (score ${r.score}/100)\n   ${r.reason}`).join('\n\n') +
      `\n\nStrategie globale : ${diversificationScore < 70 ? 'Priorite a la diversification' : riskScore < 70 ? 'Reduisez l\'exposition aux produits agressifs' : 'Maintenez votre allocation et surveillez les echeances.'}`;
  }

  // --- PRODUCTS ---
  if (lower.match(/produit|ajouter|catalogue|nouveau/)) {
    const notOwned = products
      .filter((p) => !commitments.find((c) => c.productName === p.name))
      .slice(0, 4);
    return `Produits disponibles non presents dans votre portefeuille :\n\n` +
      notOwned.map((p) => `  - ${p.name} | ${p.payoffType.replace(/_/g, ' ')} | SRI ${p.sri} | ${p.couponPct ?? p.maxGainPct}% | Barriere ${p.barrierCapPct}%`).join('\n') +
      `\n\nPour souscrire, rendez-vous dans le catalogue produits ou contactez votre structureur.`;
  }

  // --- STATUS ---
  if (lower.match(/pending|attente|statut|engag/)) {
    const pending = commitments.filter((c) => c.status === 'PENDING');
    const waiting = commitments.filter((c) => c.status === 'WAITING');
    return `Etat de vos engagements :\n\n` +
      `- Confirmes : ${commitments.filter((c) => c.status === 'CONFIRMED').length} (${formatAmount(commitments.filter((c) => c.status === 'CONFIRMED').reduce((s, c) => s + c.amount, 0))})\n` +
      `- En attente (PENDING) : ${pending.length} (${formatAmount(pending.reduce((s, c) => s + c.amount, 0))})\n` +
      `- En traitement (WAITING) : ${waiting.length} (${formatAmount(waiting.reduce((s, c) => s + c.amount, 0))})\n\n` +
      `${pending.length > 0 ? `Action requise : ${pending.length} engagement(s) en attente depuis plus de 30 jours. Relancez ou annulez pour maintenir un portefeuille propre.` : 'Tous vos engagements sont a jour.'}`;
  }

  // --- DEFAULT: PORTFOLIO SUMMARY ---
  return `Resume de votre portefeuille :\n\n` +
    `- Score global : ${globalScore}/100\n` +
    `- Montant total : ${formatAmount(totalAmount)}\n` +
    `- Nombre de positions : ${portfolioProducts.length}\n` +
    `- SRI moyen : ${weightedSRI.toFixed(1)}/7\n` +
    `- Rendement moyen : ${avgCoupon.toFixed(2)}%\n` +
    `- Concentration max : ${(maxConcentration * 100).toFixed(1)}%\n\n` +
    `Posez-moi une question specifique sur votre risque, diversification, rendement, echeances ou optimisation.`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#00B894' : score >= 60 ? '#D4A017' : '#E8334A';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink">{score}</span>
        <span className="text-[10px] text-ink-3 font-body">/100</span>
      </div>
    </div>
  );
}

function SubScoreBar({ sub }: { sub: SubScore }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-2 font-body">{sub.label}</span>
        <span className="text-xs font-bold font-mono" style={{ color: sub.color }}>
          {sub.score}/100
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${sub.score}%`,
            background: sub.barColor,
          }}
        />
      </div>
      <p className="text-[10px] text-ink-3 font-body leading-tight">{sub.explanation}</p>
    </div>
  );
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const priorityStyles: Record<string, { badge: 'red' | 'gold' | 'teal' | 'cobalt'; border: string; bg: string }> = {
    URGENT: { badge: 'red', border: 'border-red/30', bg: 'bg-red-light/40' },
    ACTION: { badge: 'gold', border: 'border-gold/30', bg: 'bg-gold-light/40' },
    OPPORTUNITE: { badge: 'teal', border: 'border-teal/30', bg: 'bg-teal-light/40' },
    INFO: { badge: 'cobalt', border: 'border-cobalt/30', bg: 'bg-cobalt-pale/40' },
  };

  const style = priorityStyles[alert.priority];

  return (
    <div
      className={cn(
        'p-3 rounded-lg border backdrop-blur-sm transition-all hover:shadow-sm',
        style.border,
        style.bg,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{alert.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={style.badge} size="sm">
              {alert.priority}
            </Badge>
            <span className="text-xs font-semibold text-ink font-body truncate">
              {alert.title}
            </span>
          </div>
          <p className="text-[11px] text-ink-3 font-body leading-relaxed">
            {alert.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  icon,
  title,
  description,
  action,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-white/60 backdrop-blur-sm hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-pale flex items-center justify-center shrink-0 group-hover:bg-violet group-hover:text-white transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-ink font-body mb-1">{title}</h4>
          <p className="text-[11px] text-ink-3 font-body leading-relaxed mb-3">
            {description}
          </p>
          <Link href={href}>
            <Button variant="ghost" size="sm">
              {action}
              <ArrowRight size={12} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const typeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    observation: {
      color: '#3B1FA8',
      icon: <Target size={12} className="text-violet" />,
    },
    closing: {
      color: '#E8334A',
      icon: <XCircle size={12} className="text-red" />,
    },
    coupon: {
      color: '#00B894',
      icon: <TrendingUp size={12} className="text-teal" />,
    },
    maturity: {
      color: '#D4A017',
      icon: <Calendar size={12} className="text-gold" />,
    },
  };

  const config = typeConfig[event.type];

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex flex-col items-center">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${config.color}15` }}
        >
          {config.icon}
        </div>
        <div className="w-px h-full bg-border mt-1" />
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-ink font-mono">
            {formatDate(event.date)}
          </span>
          <Badge variant="muted" size="sm">
            {event.type}
          </Badge>
        </div>
        <p className="text-xs font-semibold text-ink-2 font-body">
          {event.productName}
        </p>
        <p className="text-[10px] text-ink-3 font-body">{event.description}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function PortfolioAgentPage() {
  const user = useAuthStore((s) => s.user);
  const analysis = useMemo(() => computePortfolioAnalysis(), []);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: `Bonjour${user?.firstName ? ` ${user.firstName}` : ''} ! Je suis votre Agent Portfolio IA.\n\nVotre portefeuille a un score de sante de ${analysis.globalScore}/100. ${analysis.globalScore >= 75 ? 'Bonne situation globale.' : 'Quelques points d\'attention a examiner.'}\n\nComment puis-je vous aider ?`,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Simulate agent thinking with a small delay
    setTimeout(() => {
      const response = generateAgentResponse(text, analysis);
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 600);
  }, [chatInput, analysis]);

  // Suggestion chips
  const suggestions = [
    'Quel est mon risque global ?',
    'Dois-je diversifier ?',
    'Prochaines echeances ?',
    'Optimiser mon rendement',
  ];

  // Sub-scores
  const subScores: SubScore[] = [
    {
      label: 'Diversification',
      key: 'diversification',
      score: analysis.diversificationScore,
      color: analysis.diversificationScore >= 70 ? '#00B894' : analysis.diversificationScore >= 50 ? '#D4A017' : '#E8334A',
      barColor: analysis.diversificationScore >= 70
        ? 'linear-gradient(90deg, #00B894, #00D4AA)'
        : analysis.diversificationScore >= 50
          ? 'linear-gradient(90deg, #D4A017, #F0C040)'
          : 'linear-gradient(90deg, #E8334A, #FF6B7A)',
      explanation: `Repartition entre ${Object.keys(analysis.payoffCounts).length} types de payoff et ${Object.keys(analysis.issuerCounts).length} emetteurs`,
    },
    {
      label: 'Risque',
      key: 'risque',
      score: analysis.riskScore,
      color: analysis.riskScore >= 70 ? '#00B894' : analysis.riskScore >= 50 ? '#D4A017' : '#E8334A',
      barColor: analysis.riskScore >= 70
        ? 'linear-gradient(90deg, #00B894, #00D4AA)'
        : 'linear-gradient(90deg, #D4A017, #F0C040)',
      explanation: `SRI moyen ${analysis.weightedSRI.toFixed(1)}/7 | Barriere moyenne ${analysis.avgBarrier.toFixed(0)}%`,
    },
    {
      label: 'Rendement',
      key: 'rendement',
      score: analysis.yieldScore,
      color: analysis.yieldScore >= 70 ? '#00B894' : analysis.yieldScore >= 50 ? '#D4A017' : '#E8334A',
      barColor: analysis.yieldScore >= 70
        ? 'linear-gradient(90deg, #3B1FA8, #7B5FE0)'
        : 'linear-gradient(90deg, #D4A017, #F0C040)',
      explanation: `Coupon/gain moyen pondere : ${analysis.avgCoupon.toFixed(2)}% p.a.`,
    },
    {
      label: 'Timing',
      key: 'timing',
      score: analysis.timingScore,
      color: analysis.timingScore >= 70 ? '#00B894' : '#D4A017',
      barColor: 'linear-gradient(90deg, #0A2799, #3D63F5)',
      explanation: `${analysis.upcomingEvents.slice(0, 30).length} dates d'observation dans les 12 prochains mois`,
    },
    {
      label: 'Liquidite',
      key: 'liquidite',
      score: analysis.liquidityScore,
      color: analysis.liquidityScore >= 70 ? '#00B894' : analysis.liquidityScore >= 50 ? '#D4A017' : '#E8334A',
      barColor: analysis.liquidityScore >= 70
        ? 'linear-gradient(90deg, #00B894, #00D4AA)'
        : 'linear-gradient(90deg, #E8334A, #FF6B7A)',
      explanation: `Concentration max : ${(analysis.maxConcentration * 100).toFixed(1)}% sur une position`,
    },
  ];

  // Alerts computed from data
  const alerts: AlertItem[] = useMemo(() => {
    const items: AlertItem[] = [];

    // URGENT: barrier proximity
    const phoenixProducts = analysis.portfolioProducts.filter(
      (c) => c.product.payoffType === 'AUTOCALL_PHOENIX',
    );
    if (phoenixProducts.length > 0) {
      items.push({
        id: 'alert-barrier',
        priority: 'URGENT',
        title: `Barriere de ${phoenixProducts[0].product.name}`,
        description: `Barriere a ${phoenixProducts[0].product.barrierCapPct}% du niveau initial. Produit SRI ${phoenixProducts[0].product.sri} avec exposition de ${formatAmount(phoenixProducts[0].amount)}. Surveillez le sous-jacent.`,
        icon: <AlertTriangle size={16} className="text-red" />,
      });
    }

    // ACTION: pending commitments
    const pending = analysis.commitments.filter((c) => c.status === 'PENDING');
    if (pending.length > 0) {
      items.push({
        id: 'alert-pending',
        priority: 'ACTION',
        title: `${pending.length} engagement(s) PENDING`,
        description: `${formatAmount(pending.reduce((s, c) => s + c.amount, 0))} en attente de confirmation depuis la souscription. Relancez ou annulez pour maintenir votre portefeuille a jour.`,
        icon: <Clock size={16} className="text-gold" />,
      });
    }

    // OPPORTUNITE: recommend a product
    const topRec = DEMO_RECOMMENDATIONS[0];
    if (topRec) {
      items.push({
        id: 'alert-opportunity',
        priority: 'OPPORTUNITE',
        title: `${topRec.product.name} — score ${topRec.score}/100`,
        description: topRec.reason,
        icon: <Sparkles size={16} className="text-teal" />,
      });
    }

    // INFO: upcoming observations
    const next30Days = analysis.upcomingEvents.filter(
      (e) => daysBetween(e.date, new Date().toISOString().slice(0, 10)) <= 30,
    );
    if (next30Days.length > 0) {
      items.push({
        id: 'alert-dates',
        priority: 'INFO',
        title: `${next30Days.length} date(s) d'observation`,
        description: `Prochaine : ${formatDate(next30Days[0].date)} pour ${next30Days[0].product.name}. Verifiez les niveaux de sous-jacent avant chaque echeance.`,
        icon: <Info size={16} className="text-cobalt" />,
      });
    }

    return items;
  }, [analysis]);

  // Timeline events
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const now = new Date().toISOString().slice(0, 10);
    const events: TimelineEvent[] = [];

    // Observation dates
    analysis.upcomingEvents.slice(0, 4).forEach((e) => {
      events.push({
        id: `obs-${e.date}-${e.product.id}`,
        date: e.date,
        type: 'observation',
        productName: e.product.name,
        description: `Date d'observation${e.product.autocallBarrierPct ? ` (seuil autocall ${e.product.autocallBarrierPct}%)` : ''}`,
        action: 'Verifier le niveau du sous-jacent',
      });
    });

    // Shelf closings
    analysis.products
      .filter((p) => p.shelfClosingDate && p.shelfClosingDate > now)
      .sort((a, b) => (a.shelfClosingDate ?? '').localeCompare(b.shelfClosingDate ?? ''))
      .slice(0, 2)
      .forEach((p) => {
        events.push({
          id: `closing-${p.id}`,
          date: p.shelfClosingDate ?? '',
          type: 'closing',
          productName: p.name,
          description: `Cloture de la collecte (${p.fillPct}% rempli)`,
          action: 'Souscrire avant la cloture',
        });
      });

    return events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [analysis]);

  // --- RENDER ---
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
      {/* ================================================================ */}
      {/*  LEFT PANEL — Agent Analysis Dashboard                          */}
      {/* ================================================================ */}
      <div className="flex-1 lg:w-2/3 overflow-y-auto pr-1 pb-6 custom-scrollbar">
        {/* Header */}
        <PageHeader
          icon={Brain}
          title="Agent Portfolio IA"
          subtitle="Votre conseiller intelligent pour optimiser votre portefeuille"
          accentFrom="#3B1FA8"
          accentTo="#7B5FE0"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-light border border-teal/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal" />
            </span>
            <span className="text-xs font-semibold text-teal font-body">
              Agent actif
            </span>
          </div>
        </PageHeader>

        {/* ─── Portfolio Health Score ──────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white/70 backdrop-blur-md shadow-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-violet" />
            <h2 className="font-display text-lg font-bold text-ink">
              Score de sante du portefeuille
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Ring */}
            <div className="shrink-0">
              <ScoreRing score={analysis.globalScore} size={130} />
              <p className="text-center text-[10px] text-ink-3 font-body mt-2">
                Score global
              </p>
            </div>

            {/* Sub-scores */}
            <div className="flex-1 w-full space-y-3">
              {subScores.map((sub) => (
                <SubScoreBar key={sub.key} sub={sub} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── AI Alerts ──────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-violet" />
            <h2 className="font-display text-lg font-bold text-ink">
              Alertes intelligentes
            </h2>
            <Badge variant="red" size="sm">
              {alerts.filter((a) => a.priority === 'URGENT').length} urgent
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>

        {/* ─── Portfolio Optimization Suggestions ─────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-violet" />
            <h2 className="font-display text-lg font-bold text-ink">
              Suggestions d'optimisation
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SuggestionCard
              icon={<PieChart size={16} className="text-violet" />}
              title="Reduire la concentration"
              description={`Autocall Phoenix represente ${((analysis.payoffCounts['AUTOCALL_PHOENIX'] ?? 0) / analysis.totalAmount * 100).toFixed(0)}% de votre portefeuille. Diversifiez vers d'autres structures.`}
              action="Voir le catalogue"
              href="/products?payoffType=CAPITAL_PROTECTED"
            />
            <SuggestionCard
              icon={<Shield size={16} className="text-violet" />}
              title="Ajouter un Capital Protege"
              description={`Equilibrez votre profil de risque (SRI moyen ${analysis.weightedSRI.toFixed(1)}) avec un produit capital protege SRI 2.`}
              action="Decouvrir"
              href="/products?payoffType=CAPITAL_PROTECTED"
            />
            <SuggestionCard
              icon={<TrendingUp size={16} className="text-violet" />}
              title="Booster le rendement"
              description={`Rendement moyen de ${analysis.avgCoupon.toFixed(2)}%. Des produits a 6%+ sont disponibles avec un risque maitrise.`}
              action="Explorer"
              href="/products"
            />
          </div>
        </div>

        {/* ─── Upcoming Events Timeline ───────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white/70 backdrop-blur-md shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-violet" />
            <h2 className="font-display text-lg font-bold text-ink">
              Prochains evenements
            </h2>
          </div>
          <div className="space-y-0">
            {timelineEvents.length > 0 ? (
              timelineEvents.map((event) => (
                <TimelineItem key={event.id} event={event} />
              ))
            ) : (
              <p className="text-sm text-ink-3 font-body py-4 text-center">
                Aucun evenement a venir
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  RIGHT PANEL — AI Chat                                          */}
      {/* ================================================================ */}
      <div className="lg:w-[380px] flex flex-col rounded-2xl border border-border overflow-hidden shadow-lg bg-white/80 backdrop-blur-md">
        {/* Chat Header */}
        <div
          className="px-4 py-3 flex items-center gap-3 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1A0A3E 0%, #3B1FA8 60%, #5535C4 100%)',
          }}
        >
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">
              Agent IA
            </h3>
            <p className="text-[10px] text-white/60 font-body">
              Analyse en temps reel
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
            </span>
            <span className="text-[10px] text-teal font-body font-semibold">
              En ligne
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gradient-to-b from-surface/50 to-white/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'agent' && (
                <div className="w-7 h-7 rounded-full bg-violet flex items-center justify-center shrink-0 mt-0.5">
                  <Brain size={14} className="text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] font-body leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-violet text-white rounded-br-sm'
                    : 'bg-white/80 backdrop-blur-sm text-ink-2 border border-border/50 rounded-bl-sm shadow-xs',
                )}
              >
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
                <div
                  className={cn(
                    'text-[9px] mt-1.5',
                    msg.role === 'user' ? 'text-white/50' : 'text-ink-4',
                  )}
                >
                  {msg.timestamp.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border/40 bg-surface/30">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setChatInput(s);
                  setTimeout(() => {
                    const userMsg: ChatMessage = {
                      id: `user-${Date.now()}`,
                      role: 'user',
                      content: s,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, userMsg]);
                    setTimeout(() => {
                      const response = generateAgentResponse(s, analysis);
                      const agentMsg: ChatMessage = {
                        id: `agent-${Date.now()}`,
                        role: 'agent',
                        content: response,
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, agentMsg]);
                    }, 600);
                    setChatInput('');
                  }, 100);
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-body font-medium bg-violet-pale text-violet border border-violet/15 hover:bg-violet hover:text-white transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 border-t border-border/50 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Posez votre question..."
              className="flex-1 px-3 py-2 text-sm font-body text-ink bg-surface-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-violet/30 focus:border-violet/50 placeholder:text-ink-4 transition-all"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={sendMessage}
              disabled={!chatInput.trim()}
              className="shrink-0 w-8 h-8 !p-0 rounded-lg"
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="text-[9px] text-ink-4 font-body mt-1.5 text-center">
            Analyse locale — vos donnees restent privees
          </p>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 31, 168, 0.15);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 31, 168, 0.3);
        }
      `}</style>
    </div>
  );
}
