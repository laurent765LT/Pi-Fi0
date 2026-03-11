'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Zap, ExternalLink, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
  products?: any[];
  actions?: ChatAction[];
  disclaimer?: boolean;
  timestamp: Date;
}

interface ChatAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline';
}

type IntentType = 'PRODUCT_SEARCH' | 'RISK_INFO' | 'ADVICE_REQUEST' | 'GENERAL' | 'COMPARISON';

// ─── MIF2 Guards ──────────────────────────────────────────────────────────────

const MIF2_KEYWORDS = [
  'acheter', 'vendre', 'investir', 'conseil', 'recommandation',
  'meilleur placement', 'que faire', 'quel produit choisir',
  'dois-je', 'faut-il', 'est-ce que je devrais',
];

const MIF2_DISCLAIMER = "Je suis un assistant d'information. Je ne fournis aucun conseil en investissement personnalis\u00e9 au sens de la directive MIF2. Pour tout conseil adapt\u00e9 \u00e0 votre situation, consultez votre conseiller financier.";

function detectIntent(text: string): IntentType {
  const lower = text.toLowerCase();
  if (MIF2_KEYWORDS.some((kw) => lower.includes(kw))) return 'ADVICE_REQUEST';
  if (lower.includes('compar') || lower.includes('versus') || lower.includes(' vs ')) return 'COMPARISON';
  if (lower.includes('risque') || lower.includes('sri') || lower.includes('barri\u00e8re') || lower.includes('perte')) return 'RISK_INFO';
  if (lower.includes('produit') || lower.includes('isin') || lower.includes('autocall') || lower.includes('coupon') || lower.includes('capital prot')) return 'PRODUCT_SEARCH';
  return 'GENERAL';
}

function isMif2Blocked(intent: IntentType): boolean {
  return intent === 'ADVICE_REQUEST';
}

// ─── Example prompts ──────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  { text: 'Produits SRI \u2264 3 sur indices europ\u00e9ens', icon: '📊' },
  { text: 'Produits capital prot\u00e9g\u00e9 disponibles', icon: '🛡️' },
  { text: 'Qu\u2019est-ce qui ferme bient\u00f4t\u00a0?', icon: '⏰' },
  { text: 'Comparer M Equilibre 5 et M Equilibre 7', icon: '⚖️' },
];

// ─── Mini Product Card ────────────────────────────────────────────────────────

function MiniProductCard({ product }: { product: any }) {
  return (
    <a
      href={`/products/${product.id}`}
      className="block bg-white border border-border rounded-md px-3 py-2.5 hover:border-violet hover:shadow-xs transition-all duration-150 no-underline"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-body text-xs font-semibold text-ink leading-snug line-clamp-1">
          {product.name ?? product.isin ?? 'Produit'}
        </span>
        {product.sri != null && (
          <span className="font-body text-[10px] font-bold text-ink-3 shrink-0">
            SRI {product.sri}
          </span>
        )}
      </div>
      {product.isin && (
        <span className="font-mono text-[10px] text-ink-3">{product.isin}</span>
      )}
      <div className="flex items-center gap-3 mt-1.5">
        {product.maxGainPct != null && (
          <span className="font-body text-xs">
            <span className="font-bold text-teal">+{product.maxGainPct.toFixed(0)}%</span>
            <span className="text-ink-3 text-[10px]"> gain</span>
          </span>
        )}
        {product.barrierCapPct != null && (
          <span className="font-body text-xs">
            <span className="font-bold text-red">{product.barrierCapPct}%</span>
            <span className="text-ink-3 text-[10px]"> barr.</span>
          </span>
        )}
      </div>
    </a>
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function ActionButtons({ actions }: { actions: ChatAction[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {actions.map((action, i) => (
        action.href ? (
          <a
            key={i}
            href={action.href}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold font-body transition-all duration-150 no-underline',
              action.variant === 'primary'
                ? 'bg-violet text-white hover:bg-violet-dark'
                : 'border border-violet text-violet bg-white hover:bg-violet-pale',
            )}
          >
            {action.label}
            <ExternalLink size={10} />
          </a>
        ) : (
          <button
            key={i}
            onClick={action.onClick}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold font-body transition-all duration-150',
              action.variant === 'primary'
                ? 'bg-violet text-white hover:bg-violet-dark'
                : 'border border-violet text-violet bg-white hover:bg-violet-pale',
            )}
          >
            {action.label}
          </button>
        )
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-gold/10 border border-gold/30">
        <Shield size={14} className="text-gold shrink-0 mt-0.5" />
        <p className="font-body text-[11px] text-ink-2 leading-relaxed">{message.text}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] px-3 py-2 rounded-lg font-body text-sm leading-relaxed',
          isUser
            ? 'bg-violet text-white rounded-br-xs'
            : 'bg-surface-2 text-ink border border-border rounded-bl-xs',
        )}
      >
        {message.text}
      </div>

      {/* Inline product cards */}
      {!isUser && message.products && message.products.length > 0 && (
        <div className="w-full flex flex-col gap-1.5">
          {message.products.map((p: any) => (
            <MiniProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Action buttons */}
      {!isUser && message.actions && message.actions.length > 0 && (
        <ActionButtons actions={message.actions} />
      )}

      {/* MIF2 disclaimer on bot messages */}
      {!isUser && message.disclaimer && (
        <div className="flex items-start gap-1.5 max-w-[85%]">
          <AlertTriangle size={10} className="text-gold shrink-0 mt-0.5" />
          <p className="font-body text-[9px] text-ink-3 leading-relaxed italic">
            Information g\u00e9n\u00e9rale, ne constitue pas un conseil en investissement (MIF2).
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-surface-2 border border-border rounded-lg rounded-bl-xs px-3 py-2.5 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Chat Widget ─────────────────────────────────────────────────────────────

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasShownDisclaimer, setHasShownDisclaimer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Show MIF2 disclaimer on first open
  useEffect(() => {
    if (isOpen && !hasShownDisclaimer && messages.length === 0) {
      setHasShownDisclaimer(true);
      setMessages([
        {
          id: 'system-disclaimer',
          role: 'system',
          text: MIF2_DISCLAIMER,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, hasShownDisclaimer, messages.length]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');

      const intent = detectIntent(text);

      // MIF2 guard: block advice requests
      if (isMif2Blocked(intent)) {
        const blockedMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: "Je ne peux pas fournir de conseil en investissement personnalis\u00e9. Cependant, je peux vous pr\u00e9senter des produits correspondant \u00e0 vos crit\u00e8res ou vous expliquer leurs caract\u00e9ristiques.",
          disclaimer: true,
          actions: [
            { label: 'Voir tous les produits', href: '/products', variant: 'primary' },
            { label: 'Produits capital prot\u00e9g\u00e9', href: '/products?payoffType=CAPITAL_PROTECTED', variant: 'outline' },
          ],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, blockedMsg]);
        return;
      }

      setIsTyping(true);

      try {
        const response = await api.chat(text.trim());

        const actions: ChatAction[] = [];
        if (response.products && response.products.length > 0) {
          actions.push({ label: 'Voir tous les r\u00e9sultats', href: '/products', variant: 'outline' });
        }
        if (intent === 'COMPARISON') {
          actions.push({ label: 'Ouvrir le comparateur', href: '/products', variant: 'outline' });
        }

        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: response.reply,
          products: response.products ?? [],
          actions: actions.length > 0 ? actions : undefined,
          disclaimer: intent === 'RISK_INFO' || intent === 'PRODUCT_SEARCH',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: "D\u00e9sol\u00e9, je n'ai pas pu traiter votre demande. Veuillez r\u00e9essayer.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const isEmpty = messages.length <= 1; // Only the system disclaimer

  return (
    <>
      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-xl shadow-lg border border-border overflow-hidden"
          style={{ width: 390, height: 520 }}
          role="dialog"
          aria-label="Assistant Strick'in"
          aria-modal="false"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-violet flex items-center justify-center">
                <Zap size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-ink leading-none">
                  Assistant Strick&apos;in
                </p>
                <p className="font-body text-[10px] text-teal font-medium mt-0.5 leading-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" />
                  En ligne
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-body text-ink-3 bg-surface-2 rounded-full px-2 py-0.5">
                <Shield size={8} />
                MIF2
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-100"
                aria-label="Fermer l'assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {/* System disclaimer always shows */}
            {messages.filter((m) => m.role === 'system').map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isEmpty ? (
              /* Empty state with example prompts */
              <div className="flex flex-col items-center justify-center gap-4 text-center flex-1">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-violet-pale flex items-center justify-center mx-auto mb-2.5">
                    <MessageCircle size={20} className="text-violet" />
                  </div>
                  <p className="font-body text-sm font-semibold text-ink">
                    Comment puis-je vous aider ?
                  </p>
                  <p className="font-body text-xs text-ink-3 mt-1">
                    Recherchez des produits, comparez les risques ou explorez les opportunit\u00e9s.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  {EXAMPLE_PROMPTS.map(({ text, icon }) => (
                    <button
                      key={text}
                      onClick={() => sendMessage(text)}
                      className="w-full text-left px-3 py-2.5 rounded-md border border-border bg-white hover:bg-violet-pale hover:border-violet font-body text-sm text-ink-2 hover:text-violet transition-all duration-150 flex items-center gap-2"
                    >
                      <span className="text-base">{icon}</span>
                      <span className="flex-1">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages (non-system) */
              <>
                {messages.filter((m) => m.role !== 'system').map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-border bg-white shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question\u2026"
                disabled={isTyping}
                className="flex-1 h-9 px-3 rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-150 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="h-9 w-9 flex items-center justify-center rounded-md bg-violet text-white hover:bg-violet-dark disabled:opacity-40 disabled:pointer-events-none shadow-xs hover:shadow-violet transition-all duration-150"
                aria-label="Envoyer"
              >
                <Send size={15} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Floating button ────────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
          'transition-all duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
          isOpen
            ? 'bg-ink text-white hover:bg-ink-2 scale-95'
            : 'bg-violet text-white hover:bg-violet-dark hover:shadow-violet scale-100 hover:scale-105',
        )}
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        aria-expanded={isOpen}
      >
        <div className={cn('transition-transform duration-200', isOpen ? 'rotate-0' : 'rotate-0')}>
          {isOpen ? (
            <X size={22} strokeWidth={2.5} />
          ) : (
            <MessageCircle size={22} strokeWidth={2} />
          )}
        </div>

        {/* Notification dot */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-teal rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
}
