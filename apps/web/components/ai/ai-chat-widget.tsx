'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Brain, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

// ---- Types -----------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  chips?: string[];
}

// ---- Demo response engine --------------------------------------------------

function generateDemoResponse(input: string): { text: string; chips: string[] } {
  const lower = input.toLowerCase();

  if (lower.includes('produit') || lower.includes('autocall')) {
    return {
      text: "Nous avons actuellement 34 produits structurés en souscription. Les autocalls représentent 60 % de notre catalogue, avec des coupons conditionnels allant de 6 % à 12 % p.a. Le produit phare cette semaine est le **M Rendement OR Mars 2026** (ISIN : FR00140XXXX) qui offre un coupon mémoire de 9,20 % avec une barrière de protection à -40 %. Souhaitez-vous que je filtre par type de sous-jacent ou niveau de protection ?",
      chips: ['Voir les autocalls', 'Filtrer par barrière', 'Produits capital garanti'],
    };
  }

  if (lower.includes('risque') || lower.includes('barrière') || lower.includes('barriere')) {
    return {
      text: "La barrière de protection du capital est le seuil en-dessous duquel l'investisseur subit une perte en capital. Sur notre catalogue actuel :\n\n- **12 produits** avec barrière >= -30 % (protection forte)\n- **18 produits** entre -30 % et -50 %\n- **4 produits** avec barrière < -50 %\n\nLe SRI moyen pondéré est de 4/7. Pour un profil prudent, je recommande de regarder les produits avec barrière >= -30 % et capital protégé.",
      chips: ['Produits SRI <= 3', 'Comprendre le SRI', 'Capital 100 % protégé'],
    };
  }

  if (lower.includes('euro stoxx') || lower.includes('marché') || lower.includes('marche') || lower.includes('cac')) {
    return {
      text: "L'Euro Stoxx 50 est le sous-jacent le plus utilisé dans nos produits structurés (22 produits sur 34). Points clés :\n\n- Niveau actuel : ~4 980 pts\n- Volatilité implicite 1 an : 18,2 %\n- Dividendes attendus : ~2,8 %\n\nLa volatilité actuelle offre des conditions favorables pour les émissions d'autocalls avec des coupons élevés. Nous constatons un spread de 1,5 pts au-dessus de la moyenne historique sur les rendements offerts.",
      chips: ['Produits Euro Stoxx 50', 'Autres sous-jacents', 'Historique de performance'],
    };
  }

  if (lower.includes('coupon') || lower.includes('rendement') || lower.includes('performance')) {
    return {
      text: "Voici un résumé des rendements sur notre catalogue actuel :\n\n- **Coupon moyen** : 8,4 % p.a. (conditionnel)\n- **Meilleur coupon** : 12,5 % p.a. (M Ambition 10, SRI 5)\n- **Meilleur ratio coupon/risque** : 7,8 % p.a. avec barrière -30 % (M Sérénité)\n\nLes produits avec mécanisme « mémoire » représentent 70 % du catalogue et permettent de rattraper les coupons non versés les trimestres précédents.",
      chips: ['Trier par coupon', 'Effet mémoire expliqué', 'Comparer deux produits'],
    };
  }

  if (lower.includes('comparer') || lower.includes('compare') || lower.includes('versus') || lower.includes(' vs ')) {
    return {
      text: "Pour comparer des produits, vous pouvez utiliser notre comparateur intégré accessible depuis la page Produits. Sélectionnez jusqu'à 3 produits et comparez-les sur :\n\n- Rendement potentiel et barrières\n- Sous-jacents et maturité\n- SRI et scénarios de performance\n\nVoulez-vous que je vous aide à choisir des produits à comparer selon vos critères ?",
      chips: ['Ouvrir le comparateur', 'Comparer par rendement', 'Comparer par risque'],
    };
  }

  // Default
  return {
    text: "Les produits structurés sont des instruments financiers combinant une composante obligataire et une composante dérivée. Sur Strick'in, vous pouvez explorer notre catalogue de 34 produits en souscription, comparer les caractéristiques et analyser les risques. N'hésitez pas à me poser une question précise sur un produit, un mécanisme (autocall, Phoenix, reverse convertible) ou un sous-jacent.",
    chips: ['Explorer les produits', 'Qu\'est-ce qu\'un autocall ?', 'Voir les nouveautés'],
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
    (text: string) => {
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

      // Simulate AI thinking delay
      setTimeout(() => {
        const response = generateDemoResponse(text);
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.text,
          chips: response.chips,
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 1500);
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
