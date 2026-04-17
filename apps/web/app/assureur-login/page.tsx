'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Lock, ArrowRight, Building2, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/cn';

const DEMO_ASSUREUR = {
  email: 'cardif@demo.com',
  password: 'Strickin2025!',
};

export default function AssureurLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [shake, setShake] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/assureur/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Identifiants incorrects. Veuillez réessayer.';
      setError(message);
      // Trigger shake animation, clear password, focus email
      setShake(true);
      setPassword('');
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 50);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_ASSUREUR.email);
    setPassword(DEMO_ASSUREUR.password);
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#1A0A3E] via-[#2D1B69] to-[#0A2799]">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-cobalt-light/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Card */}
        <div className="bg-white/95 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet to-[#0A2799] shadow-lg shadow-violet/30">
                <Zap size={20} className="text-white" strokeWidth={2.5} />
              </span>
              <span className="font-display font-extrabold text-[22px] leading-none tracking-tight">
                <span className="text-ink dark:text-white">Strick</span>
                <span className="text-violet">&lsquo;in</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Building2 size={13} className="text-ink-3" />
              <p className="text-[12px] font-semibold tracking-wider uppercase text-ink-3 font-body">
                Espace Assureur
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-[24px] font-display font-bold text-ink dark:text-white mb-1">Bienvenue</h1>
            <p className="text-[14px] font-body text-ink-3">Accédez à votre espace assureur</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className={cn('flex flex-col gap-4', shake && 'animate-shake')}>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-ink-2 font-body">Email</label>
              <input
                ref={emailInputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full h-11 rounded-xl px-4 text-[14px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="relative">
              <label className="block text-[13px] font-semibold mb-1.5 text-ink-2 font-body">Mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl px-4 pr-11 text-[14px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-ink-3 hover:text-ink transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p
                role="alert"
                className="font-body text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-12 rounded-xl text-white font-display font-bold text-[14px] flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-violet to-[#0A2799] shadow-lg shadow-violet/25 hover:shadow-xl hover:shadow-violet/30 hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Connexion en cours...
                </span>
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <Link
              href="/assureur-register"
              className="w-full h-10 rounded-xl font-body font-semibold text-[13px] flex items-center justify-center border border-border/60 text-ink-3 hover:bg-ink/5 transition-all duration-200 mt-1"
            >
              Créer un compte assureur
            </Link>
          </form>

          {/* ---- Demo credentials collapsible ---- */}
          <div className="border-t border-border pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-[11px] font-medium font-body text-ink-3 hover:text-ink-2 transition-colors"
            >
              <span>Compte démo</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
              />
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: showDemo ? '120px' : '0',
                opacity: showDemo ? 1 : 0,
              }}
            >
              <div className="flex flex-col gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={fillDemo}
                  className="group flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-[11px] font-body bg-ink/[0.03] hover:bg-ink/[0.06] border border-transparent hover:border-border/60 transition-all duration-150"
                >
                  <div>
                    <span className="font-semibold text-ink">Assureur</span>
                    <span className="text-ink-2 ml-2">{DEMO_ASSUREUR.email}</span>
                  </div>
                  <span className="text-violet opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold uppercase tracking-wider">
                    Remplir
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex items-center justify-center gap-2">
            <Lock size={12} className="text-white/40" />
            <p className="text-[11px] text-white/40 font-body">
              Connexion sécurisée · MIF2/DDA conforme
            </p>
          </div>
          <Link
            href="/login"
            className="text-[11px] font-body font-medium text-white/50 hover:text-white/80 transition-colors underline underline-offset-2"
          >
            Vous êtes CGP ?
          </Link>
        </div>
      </div>
    </div>
  );
}
