'use client';

import { useState, useEffect, useRef } from 'react';
import { Layers, BarChart3, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─── Slides ──────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: Layers,
    color: '#3B28CC',
    bg: 'from-violet/10 to-violet-pale',
    title: 'Découvrez les produits structurés sélectionnés pour vous',
    description:
      'Parcourez notre catalogue de produits structurés, filtrez par type, risque ou émetteur, et marquez votre intérêt en quelques clics.',
  },
  {
    icon: BarChart3,
    color: '#0A2799',
    bg: 'from-cobalt-pale/40 to-blue-50',
    title: 'Suivez vos positions et vos demandes en temps réel',
    description:
      'Consultez vos engagements, suivez le statut de vos demandes et ne manquez aucun événement : clôtures, observations, coupons.',
  },
  {
    icon: Sparkles,
    color: '#00B894',
    bg: 'from-teal/10 to-emerald-50',
    title: "Utilisez l'assistant IA pour trouver le bon produit",
    description:
      "Notre assistant intelligent vous aide à rechercher, comparer et analyser les produits structurés adaptés aux besoins de vos clients.",
  },
];

const STORAGE_KEY = 'strickin_onboarding_done';

// ─── Component ──────────────────────────────────────────────────────────────

export function WelcomeSlides() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function animateToStep(nextStep: number, dir: 'next' | 'prev') {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    timeoutRef.current = setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 280);
  }

  function handleComplete() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setVisible(false);
  }

  function handleNext() {
    if (step === SLIDES.length - 1) {
      handleComplete();
    } else {
      animateToStep(step + 1, 'next');
    }
  }

  function handlePrev() {
    if (step > 0) animateToStep(step - 1, 'prev');
  }

  if (!visible) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <>
      <style jsx global>{`
        @keyframes ws-float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(60px, -40px) scale(1.1); }
          50% { transform: translate(-30px, -80px) scale(0.95); }
          75% { transform: translate(-60px, 30px) scale(1.05); }
        }
        @keyframes ws-float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-70px, 40px) scale(1.08); }
          50% { transform: translate(40px, 70px) scale(0.92); }
          75% { transform: translate(60px, -50px) scale(1.04); }
        }
        @keyframes ws-float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, 60px) scale(1.06); }
          66% { transform: translate(-60px, -40px) scale(0.97); }
        }
        @keyframes ws-pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 31, 168, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(59, 31, 168, 0); }
        }
        @keyframes ws-card-entrance {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes ws-icon-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes ws-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
        style={{
          animation: 'ws-backdrop-in 0.4s ease-out forwards',
        }}
      >
        {/* ---- Dark gradient backdrop ---- */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(26,10,62,0.85) 0%, rgba(59,31,168,0.75) 50%, rgba(26,10,62,0.9) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* ---- Floating gradient orbs (matching login page) ---- */}
        <div
          className="absolute w-[320px] h-[320px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{
            top: '8%',
            left: '10%',
            background: 'radial-gradient(circle, #5535C4 0%, transparent 70%)',
            animation: 'ws-float-orb-1 18s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[280px] h-[280px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            bottom: '10%',
            right: '8%',
            background: 'radial-gradient(circle, #00B894 0%, transparent 70%)',
            animation: 'ws-float-orb-2 22s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[240px] h-[240px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            top: '50%',
            left: '55%',
            background: 'radial-gradient(circle, #3B1FA8 0%, transparent 70%)',
            animation: 'ws-float-orb-3 20s ease-in-out infinite',
          }}
          aria-hidden="true"
        />

        {/* Subtle radial texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.04) 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />

        {/* ---- Glass Card ---- */}
        <div
          className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow:
              '0 25px 60px -12px rgba(26, 10, 62, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
            animation: 'ws-card-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Slide content with transition */}
          <div className="relative overflow-hidden">
            <div
              className={cn(
                'flex flex-col items-center text-center px-8 pt-12 pb-8 transition-all duration-300 ease-out',
              )}
              style={{
                opacity: animating ? 0 : 1,
                transform: animating
                  ? `translateX(${direction === 'next' ? '-24px' : '24px'})`
                  : 'translateX(0)',
              }}
            >
              {/* Icon with gradient circle background */}
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center mb-7 shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${slide.color} 0%, ${slide.color}CC 50%, ${slide.color}88 100%)`,
                  animation: 'ws-icon-breathe 3s ease-in-out infinite',
                }}
              >
                {/* Outer glow ring */}
                <div
                  className="absolute inset-[-4px] rounded-full opacity-30"
                  style={{
                    background: `linear-gradient(135deg, ${slide.color}40 0%, transparent 60%)`,
                    filter: 'blur(6px)',
                  }}
                  aria-hidden="true"
                />
                <Icon size={34} className="text-white relative z-10" strokeWidth={1.8} />
              </div>

              {/* Step label */}
              <span
                className="inline-block mb-3 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase"
                style={{
                  background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
                  color: 'white',
                  opacity: 0.85,
                }}
              >
                {step + 1} / {SLIDES.length}
              </span>

              <h2 className="font-display text-2xl font-bold leading-snug mb-4 max-w-sm"
                style={{ color: '#1A0A3E' }}
              >
                {slide.title}
              </h2>
              <p className="font-body text-[15px] text-ink-2 leading-relaxed max-w-md">
                {slide.description}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="px-8 py-5 flex items-center justify-between border-t border-ink/5">
            {/* Animated progress dots */}
            <div className="flex items-center gap-2.5">
              {SLIDES.map((_, i) => {
                const isCurrent = i === step;
                const isPast = i < step;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (i !== step) animateToStep(i, i > step ? 'next' : 'prev');
                    }}
                    className="relative flex items-center justify-center"
                    style={{ width: 18, height: 18 }}
                    aria-label={`Slide ${i + 1}`}
                  >
                    {/* Pulsing ring for current */}
                    {isCurrent && (
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          animation: 'ws-pulse-ring 2s ease-in-out infinite',
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        'block rounded-full transition-all duration-400 ease-out',
                        isCurrent
                          ? 'w-3 h-3'
                          : isPast
                            ? 'w-2.5 h-2.5'
                            : 'w-2 h-2',
                      )}
                      style={{
                        background: isCurrent
                          ? 'linear-gradient(135deg, #3B1FA8 0%, #00B894 100%)'
                          : isPast
                            ? 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)'
                            : '#CBD5E1',
                        boxShadow: isCurrent
                          ? '0 0 8px rgba(59, 31, 168, 0.4)'
                          : 'none',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="h-10 px-3.5 rounded-xl border border-ink/10 text-ink-3 hover:text-ink hover:border-ink/20 hover:bg-ink/[0.03] transition-all duration-200 font-body text-sm font-medium flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  Précédent
                </button>
              )}
              {!isLast && (
                <button
                  onClick={() => handleComplete()}
                  className="h-10 px-3.5 rounded-xl text-ink-3 hover:text-ink transition-all duration-200 font-body text-xs"
                >
                  Passer
                </button>
              )}
              <button
                onClick={handleNext}
                className="group relative h-10 px-6 rounded-xl text-white font-body text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 60%, #00B894 100%)',
                  boxShadow: '0 4px 16px -2px rgba(59, 31, 168, 0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px -4px rgba(59, 31, 168, 0.5), 0 0 0 1px rgba(255,255,255,0.15) inset';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    '0 4px 16px -2px rgba(59, 31, 168, 0.35)';
                }}
              >
                {isLast ? 'Commencer' : 'Suivant'}
                {isLast ? (
                  <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                ) : (
                  <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
