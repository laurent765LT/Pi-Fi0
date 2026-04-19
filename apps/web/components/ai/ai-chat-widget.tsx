'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Brain, X, Send, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

// ---- Types -----------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  chips?: string[];
}

// ---- MIF2 compliance guard -------------------------------------------------

const MIF2_KEYWORDS = ['acheter', 'vendre', 'investir', 'conseil personnalisé'];

function checkMIF2(lower: string): { text: string; chips: string[] } | null {
  const triggered = MIF2_KEYWORDS.some((kw) => lower.includes(kw));
  if (!triggered) return null;
  return {
    text: "**Avertissement MIF II / DDA** : Je suis un assistant d'information et ne suis pas habilité a fournir des conseils en investissement personnalisés. Les informations fournies ne constituent ni une recommandation d'achat ou de vente, ni un conseil personnalisé au sens de la directive MIF II (2014/65/UE).\n\nPour toute decision d'investissement, veuillez consulter votre conseiller en gestion de patrimoine (CGP) qui evaluera votre profil de risque, vos objectifs et votre situation financiere.\n\nJe peux neanmoins vous fournir des informations factuelles sur les produits de notre catalogue.",
    chips: ['Voir le catalogue', 'Informations sur un produit', 'Comprendre les risques'],
  };
}

// ---- Intelligent local response engine -------------------------------------

function formatProductCard(p: typeof DEMO_PRODUCTS[number]): string {
  const coupon = p.couponPct ? `${p.couponPct}% p.a.` : (p.maxGainPct ? `gain max ${p.maxGainPct}%` : 'N/A');
  const barrier = p.barrierCapPct != null ? `${p.barrierCapPct}%` : 'N/A';
  return `• **${p.name}** (${p.isin}) — ${p.payoffType.replace(/_/g, ' ')}\n  Emetteur : ${p.issuerName} | SRI ${p.sri}/7 | Barriere ${barrier} | ${coupon}`;
}

function generateLocalResponse(input: string): { text: string; chips: string[] } {
  const lower = input.toLowerCase();

  // ── MIF2 compliance check (top priority) ────────────────────────────────
  const mif2 = checkMIF2(lower);
  if (mif2) return mif2;

  // ── Help / capabilities ─────────────────────────────────────────────────
  if (lower.includes('aide') || lower.includes('comment') || lower.includes('help') || lower.includes('quoi faire')) {
    return {
      text: "Je peux vous aider sur plusieurs sujets :\n\n• **Recherche de produit** — par nom, type (autocall, capital protege) ou ISIN\n• **Analyse de risque** — barrieres, SRI, protection du capital\n• **Rendement** — coupons, gains potentiels, comparatifs\n• **Emetteurs** — filtrer par BNP, Natixis, SG, Goldman Sachs\n• **Commissions** — frais d'entree, repartition\n\nPosez-moi une question precise ou utilisez les suggestions ci-dessous.",
      chips: ['Voir les autocalls', 'Produits capital protege', 'Meilleurs coupons', 'Filtrer par emetteur'],
    };
  }

  // ── Issuer filter (BNP, Natixis, SG, Goldman) ──────────────────────────
  const issuerMap: Record<string, string> = {
    'bnp': 'BNP Paribas',
    'natixis': 'Natixis',
    'societe generale': 'SG Issuer',
    'sg': 'SG Issuer',
    'goldman': 'Goldman Sachs',
  };
  for (const [keyword, issuerMatch] of Object.entries(issuerMap)) {
    if (lower.includes(keyword)) {
      const matches = DEMO_PRODUCTS.filter((p) =>
        p.issuerName.toLowerCase().includes(issuerMatch.toLowerCase()),
      );
      if (matches.length > 0) {
        const cards = matches.slice(0, 4).map(formatProductCard).join('\n');
        return {
          text: `${matches.length} produit(s) emis par **${issuerMatch}** :\n\n${cards}${matches.length > 4 ? `\n\n... et ${matches.length - 4} autre(s). Consultez le catalogue pour la liste complete.` : ''}`,
          chips: ['Voir tous les produits', 'Comparer ces produits', 'Autre emetteur'],
        };
      }
    }
  }

  // ── Product name / ISIN search ──────────────────────────────────────────
  const productNameMatch = DEMO_PRODUCTS.filter((p) =>
    lower.includes(p.name.toLowerCase()) ||
    lower.includes(p.isin.toLowerCase()) ||
    (p.name.toLowerCase().split(' ').length > 1 && p.name.toLowerCase().split(' ').every((w) => lower.includes(w))),
  );
  if (productNameMatch.length > 0) {
    const p = productNameMatch[0];
    const coupon = p.couponPct ? `Coupon : ${p.couponPct}% p.a.` : (p.maxGainPct ? `Gain max : ${p.maxGainPct}%` : '');
    return {
      text: `**${p.name}** (${p.isin})\n\n• Type : ${p.payoffType.replace(/_/g, ' ')}\n• Emetteur : ${p.issuerName}\n• Sous-jacent : ${p.underlyingName}\n• Barriere : ${p.barrierCapPct ?? 'N/A'}% | SRI : ${p.sri}/7\n• ${coupon}\n• Maturite : ${p.maturityDate}\n• Frais d'entree : ${p.entryFeePct}%\n• Remplissage : ${p.fillPct}%\n\n${p.description}`,
      chips: ['Comparer ce produit', 'Voir le risque', 'Autres produits similaires'],
    };
  }

  // ── Product type search (autocall, phoenix, capital protege, taux) ─────
  const typeMap: Record<string, string> = {
    'autocall': 'AUTOCALL',
    'phoenix': 'PHOENIX',
    'capital protege': 'CAPITAL_PROTECTED',
    'capital garanti': 'CAPITAL_PROTECTED',
    'taux': 'CONDITIONAL_RATE',
    'reverse': 'REVERSE',
  };
  for (const [keyword, typeMatch] of Object.entries(typeMap)) {
    if (lower.includes(keyword)) {
      const matches = DEMO_PRODUCTS.filter((p) =>
        p.payoffType.toUpperCase().includes(typeMatch),
      );
      if (matches.length > 0) {
        const cards = matches.slice(0, 4).map(formatProductCard).join('\n');
        return {
          text: `${matches.length} produit(s) de type **${keyword}** dans notre catalogue :\n\n${cards}${matches.length > 4 ? `\n\n... et ${matches.length - 4} autre(s).` : ''}`,
          chips: ['Trier par rendement', 'Trier par risque', 'Voir tout le catalogue'],
        };
      }
    }
  }

  // ── Risk / SRI / barrier ────────────────────────────────────────────────
  if (lower.includes('risque') || lower.includes('sri') || lower.includes('barriere') || lower.includes('barrière') || lower.includes('protection')) {
    const lowRisk = DEMO_PRODUCTS.filter((p) => p.sri <= 3);
    const midRisk = DEMO_PRODUCTS.filter((p) => p.sri >= 4 && p.sri <= 5);
    const highRisk = DEMO_PRODUCTS.filter((p) => p.sri >= 6);
    const capitalProtected = DEMO_PRODUCTS.filter((p) => p.barrierCapPct !== null && p.barrierCapPct >= 90);
    const avgSri = (DEMO_PRODUCTS.reduce((acc, p) => acc + p.sri, 0) / DEMO_PRODUCTS.length).toFixed(1);

    return {
      text: `Analyse de risque du catalogue (${DEMO_PRODUCTS.length} produits) :\n\n• **SRI moyen** : ${avgSri}/7\n• **Risque faible** (SRI 1-3) : ${lowRisk.length} produits\n• **Risque modere** (SRI 4-5) : ${midRisk.length} produits\n• **Risque eleve** (SRI 6-7) : ${highRisk.length} produits\n• **Capital protege ≥ 90%** : ${capitalProtected.length} produits\n\nBarrieres de protection :\n${DEMO_PRODUCTS.filter((p) => p.barrierCapPct != null).slice(0, 3).map((p) => `• ${p.name} — barriere ${p.barrierCapPct}%, SRI ${p.sri}`).join('\n')}`,
      chips: ['Produits SRI ≤ 3', 'Capital 100% protege', 'Voir les barrieres'],
    };
  }

  // ── Commission / fees ───────────────────────────────────────────────────
  if (lower.includes('commission') || lower.includes('frais') || lower.includes('fee')) {
    const avgFee = (DEMO_PRODUCTS.reduce((acc, p) => acc + p.entryFeePct, 0) / DEMO_PRODUCTS.length).toFixed(2);
    const minFee = Math.min(...DEMO_PRODUCTS.map((p) => p.entryFeePct));
    const maxFee = Math.max(...DEMO_PRODUCTS.map((p) => p.entryFeePct));
    return {
      text: `Informations sur les commissions et frais :\n\n• **Frais d'entree moyens** : ${avgFee}%\n• **Fourchette** : ${minFee}% — ${maxFee}%\n• Les frais de gestion et commissions de distribution sont definis par votre cabinet\n\nProduits les moins charges :\n${DEMO_PRODUCTS.sort((a, b) => a.entryFeePct - b.entryFeePct).slice(0, 3).map((p) => `• ${p.name} — ${p.entryFeePct}%`).join('\n')}\n\nLes commissions de distribution se repartissent entre la plateforme (30-40%) et le distributeur (60-70%).`,
      chips: ['Produits faibles frais', 'Comprendre les commissions', 'Voir un produit'],
    };
  }

  // ── Yield / coupon / gain ───────────────────────────────────────────────
  if (lower.includes('rendement') || lower.includes('coupon') || lower.includes('gain') || lower.includes('performance')) {
    const withCoupon = DEMO_PRODUCTS.filter((p) => p.couponPct != null && p.couponPct > 0);
    const withGain = DEMO_PRODUCTS.filter((p) => p.maxGainPct != null && p.maxGainPct > 0);
    const bestGain = [...withGain].sort((a, b) => (b.maxGainPct ?? 0) - (a.maxGainPct ?? 0));
    const bestCoupon = [...withCoupon].sort((a, b) => (b.couponPct ?? 0) - (a.couponPct ?? 0));

    let text = `Rendements du catalogue (${DEMO_PRODUCTS.length} produits) :\n\n`;
    if (bestCoupon.length > 0) {
      text += `**Meilleurs coupons recurrents :**\n${bestCoupon.slice(0, 3).map((p) => `• ${p.name} — ${p.couponPct}% p.a. (SRI ${p.sri})`).join('\n')}\n\n`;
    }
    if (bestGain.length > 0) {
      text += `**Meilleurs gains potentiels :**\n${bestGain.slice(0, 3).map((p) => `• ${p.name} — gain max ${p.maxGainPct}% (SRI ${p.sri})`).join('\n')}`;
    }

    return {
      text,
      chips: ['Trier par coupon', 'Produits a rendement fixe', 'Comparer deux produits'],
    };
  }

  // ── General product search (produit, catalogue, liste) ─────────────────
  if (lower.includes('produit') || lower.includes('catalogue') || lower.includes('liste') || lower.includes('offre') || lower.includes('nouveaute')) {
    const recent = [...DEMO_PRODUCTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const cards = recent.slice(0, 4).map(formatProductCard).join('\n');
    return {
      text: `Notre catalogue compte **${DEMO_PRODUCTS.length} produits** en souscription :\n\n${cards}\n\nVous pouvez filtrer par type (autocall, capital protege, taux), par emetteur, ou par niveau de risque.`,
      chips: ['Voir les autocalls', 'Capital protege', 'Filtrer par emetteur', 'Trier par rendement'],
    };
  }

  // ── Comparison ──────────────────────────────────────────────────────────
  if (lower.includes('comparer') || lower.includes('compare') || lower.includes('versus') || lower.includes(' vs ')) {
    return {
      text: "Pour comparer des produits, utilisez notre comparateur integre depuis la page Produits. Selectionnez jusqu'a 3 produits et comparez-les sur :\n\n• Rendement potentiel et barrieres\n• Sous-jacents et maturite\n• SRI et scenarios de performance\n\nVoulez-vous que je vous aide a choisir des produits a comparer selon vos criteres ?",
      chips: ['Comparer par rendement', 'Comparer par risque', 'Comparer par emetteur'],
    };
  }

  // ── Market / underlying ────────────────────────────────────────────────
  if (lower.includes('euro stoxx') || lower.includes('marche') || lower.includes('marché') || lower.includes('cac') || lower.includes('sous-jacent') || lower.includes('or') || lower.includes('gold')) {
    const underlyingCounts: Record<string, number> = {};
    DEMO_PRODUCTS.forEach((p) => {
      const key = p.underlyingName.length > 30 ? p.underlyingName.slice(0, 30) + '...' : p.underlyingName;
      underlyingCounts[key] = (underlyingCounts[key] ?? 0) + 1;
    });
    const sorted = Object.entries(underlyingCounts).sort((a, b) => b[1] - a[1]);
    return {
      text: `Repartition des sous-jacents sur ${DEMO_PRODUCTS.length} produits :\n\n${sorted.slice(0, 5).map(([name, count]) => `• **${name}** — ${count} produit(s)`).join('\n')}\n\nLes indices actions avec decrement dominent notre catalogue, offrant des conditions favorables pour les structures autocall.`,
      chips: ['Produits Euro Stoxx', 'Produits Or', 'Produits Taux'],
    };
  }

  // ── Default fallback ───────────────────────────────────────────────────
  return {
    text: `Je suis l'assistant Strick'in. Notre catalogue compte **${DEMO_PRODUCTS.length} produits structures** en souscription.\n\nJe peux vous aider a :\n• Rechercher un produit par nom, type ou ISIN\n• Analyser les risques (barrieres, SRI)\n• Comparer les rendements et coupons\n• Filtrer par emetteur (BNP, Natixis, SG, Goldman)\n\nPosez-moi une question ou utilisez les suggestions ci-dessous.`,
    chips: ['Explorer les produits', 'Meilleurs rendements', 'Produits faible risque', 'Aide'],
  };
}

// ---- Typing indicator ------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-surface-2 dark:bg-ink-2 border border-border/60 dark:border-border-2/40 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-violet-mid/70 dark:bg-violet-light/50"
            style={{
              animation: 'bounce 1s ease-in-out infinite',
              animationDelay: `${i * 180}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Message bubble --------------------------------------------------------

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'items-end' : 'items-start',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] px-3.5 py-2.5 font-body text-[13px] leading-relaxed whitespace-pre-line',
          isUser
            ? 'bg-gradient-to-br from-violet to-cobalt text-white rounded-2xl rounded-br-sm'
            : 'bg-surface-2 dark:bg-ink-2 text-ink dark:text-white/90 border border-border/60 dark:border-border-2/40 rounded-2xl rounded-bl-sm',
        )}
      >
        {message.text}
      </div>
    </div>
  );
}

// ---- Quick action chip -----------------------------------------------------

function Chip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-violet/30 dark:border-violet-light/20 bg-violet-ghost/60 dark:bg-violet/10 text-violet dark:text-violet-light font-body text-[11px] font-semibold hover:bg-violet-pale dark:hover:bg-violet/20 hover:border-violet/50 transition-all duration-150 whitespace-nowrap"
    >
      <Sparkles size={10} className="shrink-0" />
      {label}
    </button>
  );
}

// ---- Main widget -----------------------------------------------------------

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasSuggestion, setHasSuggestion] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message
  const welcomeMessage: Message = {
    id: 'welcome',
    role: 'assistant',
    text: "Bonjour ! Je suis l'assistant IA de Strick'in. Je peux vous aider a :",
    chips: [
      'Trouver un produit',
      'Analyser un sous-jacent',
      'Comparer des offres',
      'Expliquer un mecanisme',
    ],
  };

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      setHasSuggestion(false);

      try {
        // Try the real AI API first
        const aiResponse = await api.aiChat(text.trim());

        // If we got a real response (not demo fallback), use it
        if (aiResponse.model !== 'demo' && aiResponse.content) {
          const botMsg: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: aiResponse.content,
            chips: ['Poser une autre question', 'Explorer les produits'],
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      } catch {
        // API failed — fall through to local engine
      }

      // Fallback: intelligent local response engine
      const response = generateLocalResponse(text);
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.text,
        chips: response.chips,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    },
    [isTyping],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const allMessages = messages.length === 0 ? [welcomeMessage] : messages;
  const lastMessage = allMessages[allMessages.length - 1];
  const visibleChips =
    !isTyping && lastMessage?.role === 'assistant' && lastMessage.chips
      ? lastMessage.chips
      : [];

  return (
    <>
      {/* ── Chat panel ────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed bottom-24 right-6 z-50 flex flex-col',
          'w-[380px] max-h-[520px]',
          'bg-white/95 dark:bg-ink/95 backdrop-blur-xl',
          'rounded-2xl shadow-2xl border border-border/60 dark:border-border-2/40',
          'overflow-hidden',
          'transition-all duration-300 ease-out origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none',
        )}
        role="dialog"
        aria-label="Assistant IA Strick'in"
        aria-modal="false"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 dark:border-border-2/30 bg-gradient-to-r from-violet/5 to-cobalt/5 dark:from-violet/10 dark:to-cobalt/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet to-cobalt flex items-center justify-center shadow-sm">
              <Brain size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-ink dark:text-white leading-none">
                Assistant Strick&apos;in IA
              </p>
              <p className="font-body text-[10px] text-teal font-medium mt-0.5 leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block animate-pulse" />
                En ligne
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-ink-3 dark:text-white/50 hover:text-ink dark:hover:text-white hover:bg-surface-2 dark:hover:bg-ink-2 transition-colors duration-100"
            aria-label="Fermer l'assistant IA"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
          {allMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isTyping && <TypingIndicator />}

          {/* Quick chips after last assistant message */}
          {visibleChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-500 delay-200">
              {visibleChips.map((chip) => (
                <Chip
                  key={chip}
                  label={chip}
                  onClick={() => sendMessage(chip)}
                />
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-3 py-3 border-t border-border/40 dark:border-border-2/30 bg-white/80 dark:bg-ink/80 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={isTyping}
              className="flex-1 h-10 px-3.5 rounded-xl bg-surface-2 dark:bg-ink-2 border border-border/60 dark:border-border-2/40 font-body text-sm text-ink dark:text-white placeholder:text-ink-3 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet/50 focus:border-violet transition-all duration-150 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-violet to-cobalt text-white disabled:opacity-40 disabled:pointer-events-none shadow-sm hover:shadow-md hover:shadow-violet/20 transition-all duration-150"
              aria-label="Envoyer"
            >
              <Send size={15} strokeWidth={2.5} />
            </button>
          </form>
          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-snug text-ink-3 dark:text-white/50 font-body">
            <AlertTriangle size={11} className="shrink-0 mt-0.5" />
            <span>
              Informations a titre indicatif. Ne constitue pas un conseil en investissement au sens MIF2.
            </span>
          </p>
        </div>
      </div>

      {/* ── Floating button ───────────────────────────────────────────────── */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasSuggestion(false);
        }}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full flex items-center justify-center',
          'transition-all duration-300 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
          isOpen
            ? 'bg-ink dark:bg-white text-white dark:text-ink hover:bg-ink-2 dark:hover:bg-surface-2 shadow-lg'
            : 'bg-gradient-to-br from-violet to-cobalt text-white shadow-lg hover:shadow-xl hover:shadow-violet/30 hover:scale-105',
        )}
        aria-label={isOpen ? "Fermer l'assistant IA" : "Ouvrir l'assistant IA"}
        aria-expanded={isOpen}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-violet to-cobalt opacity-40 animate-ping" />
        )}

        <div className="relative z-10 transition-transform duration-300">
          {isOpen ? (
            <X size={22} strokeWidth={2.5} />
          ) : (
            <Brain size={22} strokeWidth={2} />
          )}
        </div>

        {/* Notification dot */}
        {!isOpen && hasSuggestion && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-teal rounded-full border-2 border-white dark:border-ink shadow-sm flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
        )}

        {/* "IA" tooltip on hover */}
        {!isOpen && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-ink dark:bg-white text-white dark:text-ink font-body text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-sm">
            IA
          </span>
        )}
      </button>

      {/* ── Bounce keyframes (injected once) ─────────────────────────────── */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
