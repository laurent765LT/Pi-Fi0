'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Mic, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  products?: any[];
  timestamp: Date;
}

// ─── Example prompts ──────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  'SRI \u2264 3 sur indices europ\u00e9ens',
  'Produits capital prot\u00e9g\u00e9',
  'Qu\u2019est-ce qui ferme bient\u00f4t\u00a0?',
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
      {product.maxGainPct != null && (
        <div className="mt-1">
          <span className="font-body text-xs font-bold text-gold">
            +{product.maxGainPct.toFixed(1)}%
          </span>
          <span className="font-body text-[10px] text-ink-3"> gain max</span>
        </div>
      )}
    </a>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex flex-col gap-2',
        isUser ? 'items-end' : 'items-start',
      )}
    >
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

      {/* Inline product cards if bot returned products */}
      {!isUser && message.products && message.products.length > 0 && (
        <div className="w-full flex flex-col gap-1.5">
          {message.products.map((p: any) => (
            <MiniProductCard key={p.id} product={p} />
          ))}
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
      setIsTyping(true);

      try {
        const response = await api.chat(text.trim());

        const botMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: response.reply,
          products: response.products ?? [],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'bot',
          text: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
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

  const handlePrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-xl shadow-lg border border-border overflow-hidden"
          style={{ width: 380, height: 500 }}
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
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-sm text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-100"
              aria-label="Fermer l'assistant"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {isEmpty ? (
              /* Empty state with example prompts */
              <div className="flex flex-col h-full items-center justify-center gap-5 text-center">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-violet-pale flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={22} className="text-violet" />
                  </div>
                  <p className="font-body text-sm font-semibold text-ink">
                    Comment puis-je vous aider ?
                  </p>
                  <p className="font-body text-xs text-ink-3 mt-1">
                    Posez une question sur les produits, les risques ou les opportunités.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePrompt(prompt)}
                      className="w-full text-left px-3.5 py-2.5 rounded-md border border-border bg-surface-2 hover:bg-violet-pale hover:border-violet font-body text-sm text-ink-2 hover:text-violet transition-all duration-150"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {messages.map((msg) => (
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
                placeholder="Posez votre question…"
                disabled={isTyping}
                className="flex-1 h-9 px-3 rounded-md bg-surface-2 border border-border-2 font-body text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet transition-all duration-150 disabled:opacity-50"
              />
              <button
                type="button"
                className="h-9 w-9 flex items-center justify-center rounded-md bg-surface-2 border border-border text-ink-3 hover:text-violet hover:bg-violet-pale hover:border-violet transition-all duration-150"
                title="Microphone (bientôt disponible)"
                disabled
              >
                <Mic size={15} strokeWidth={2} />
              </button>
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
        <div
          className={cn(
            'transition-transform duration-200',
            isOpen ? 'rotate-0' : 'rotate-0',
          )}
        >
          {isOpen ? (
            <X size={22} strokeWidth={2.5} />
          ) : (
            <MessageCircle size={22} strokeWidth={2} />
          )}
        </div>
      </button>
    </>
  );
}
