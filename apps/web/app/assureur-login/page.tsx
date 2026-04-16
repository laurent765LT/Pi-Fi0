'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Lock, ArrowRight, Building2 } from 'lucide-react';

export default function AssureurLoginPage() {
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Set auth cookie for middleware
    const userData = {
      user: { id: 'demo-assureur-001', email: 'cardif@demo.com', firstName: 'Delphine', lastName: 'Martin', role: 'ORG_ADMIN', orgId: 'org-insurer' },
      token: 'demo-token-assureur-' + Date.now(),
      refreshToken: 'demo-refresh',
      isDemo: true,
    };
    document.cookie = `strickin-auth=${encodeURIComponent(JSON.stringify({ state: userData }))};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
    router.push('/assureur/dashboard');
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
          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-ink-3 font-body">Email</label>
              <input
                type="email"
                defaultValue="cardif@demo.com"
                className="w-full h-11 rounded-xl px-4 text-[14px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
                readOnly
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 text-ink-3 font-body">Mot de passe</label>
              <input
                type="password"
                defaultValue="demo2026"
                className="w-full h-11 rounded-xl px-4 text-[14px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
                readOnly
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl text-white font-display font-bold text-[14px] flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-violet to-[#0A2799] shadow-lg shadow-violet/25 hover:shadow-xl hover:shadow-violet/30 hover:scale-[1.01] transition-all duration-200"
            >
              Se connecter
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                const userData = {
                  user: { id: 'demo-assureur-001', email: 'cardif@demo.com', firstName: 'Delphine', lastName: 'Martin', role: 'ORG_ADMIN', orgId: 'org-insurer' },
                  token: 'demo-token-assureur-' + Date.now(),
                  refreshToken: 'demo-refresh',
                  isDemo: true,
                };
                document.cookie = `strickin-auth=${encodeURIComponent(JSON.stringify({ state: userData }))};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
                router.push('/assureur/dashboard');
              }}
              className="w-full h-11 rounded-xl font-body font-semibold text-[14px] flex items-center justify-center gap-2 border border-border/60 text-violet hover:bg-violet/5 transition-all duration-200"
            >
              Utiliser le compte démo
            </button>

            <Link
              href="/assureur-register"
              className="w-full h-10 rounded-xl font-body font-semibold text-[13px] flex items-center justify-center border border-border/60 text-ink-3 hover:bg-ink/5 transition-all duration-200 mt-1"
            >
              Créer un compte assureur
            </Link>
          </form>
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
