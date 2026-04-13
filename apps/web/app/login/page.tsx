'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@strickin.com', password: 'admin123' },
  { label: 'CGP', email: 'cgp@demo.com', password: 'cgp123' },
  { label: 'Assureur', email: 'assureur@cardiff.fr', password: 'assureur123' },
];

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Identifiants incorrects. Veuillez réessayer.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(80px, -60px) scale(1.1); }
          50% { transform: translate(-40px, -120px) scale(0.95); }
          75% { transform: translate(-80px, 40px) scale(1.05); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-100px, 50px) scale(1.08); }
          50% { transform: translate(60px, 100px) scale(0.92); }
          75% { transform: translate(90px, -70px) scale(1.04); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(70px, 80px) scale(1.06); }
          66% { transform: translate(-90px, -50px) scale(0.97); }
        }
        @keyframes float-orb-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-60px, -90px) scale(1.12); }
          40% { transform: translate(50px, -30px) scale(0.94); }
          60% { transform: translate(100px, 60px) scale(1.03); }
          80% { transform: translate(-30px, 80px) scale(1.08); }
        }
        @keyframes card-entrance {
          from {
            opacity: 0;
            transform: translateY(32px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse-dot {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.6);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(0, 184, 148, 0);
          }
        }
      `}</style>

      <div
        className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
        }}
      >
        {/* ---- Floating gradient orbs ---- */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            top: '10%',
            left: '15%',
            background: 'radial-gradient(circle, #5535C4 0%, transparent 70%)',
            animation: 'float-orb-1 18s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{
            top: '55%',
            right: '10%',
            background: 'radial-gradient(circle, #00B894 0%, transparent 70%)',
            animation: 'float-orb-2 22s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            bottom: '5%',
            left: '5%',
            background: 'radial-gradient(circle, #3B1FA8 0%, transparent 70%)',
            animation: 'float-orb-3 20s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[260px] h-[260px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            top: '5%',
            right: '20%',
            background: 'radial-gradient(circle, #1A0A3E 0%, transparent 70%)',
            animation: 'float-orb-4 25s ease-in-out infinite',
          }}
          aria-hidden="true"
        />

        {/* Subtle grain / radial texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />

        <div
          className="relative w-full max-w-sm"
          style={{
            animation: mounted ? 'card-entrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* ---- Glass Card ---- */}
          <div
            className="rounded-2xl shadow-2xl px-8 py-10 flex flex-col gap-8 border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              {/* Logo mark */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)' }}
              >
                <Zap size={22} className="text-white" strokeWidth={2.5} />
              </div>

              {/* Logotype */}
              <div>
                <h1 className="font-display font-extrabold text-2xl leading-tight text-ink">
                  Strick<span className="text-violet-mid">&lsquo;in</span>
                </h1>
                <p className="font-body text-sm text-ink-2 mt-0.5">
                  Plateforme B2B de distribution
                </p>
              </div>

              {/* Badge with pulsing dot */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-pale border border-border text-[11px] font-semibold text-violet tracking-wide">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{
                    background: '#00B894',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }}
                  aria-hidden="true"
                />
                100&nbsp;% ind&eacute;pendante
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Input
                label="Adresse e-mail"
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />

              {/* Password field with visibility toggle */}
              <div className="relative">
                <Input
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-ink-2 hover:text-ink transition-colors"
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
                  className="font-body text-xs font-medium text-red bg-red/8 border border-red/20 rounded-md px-3 py-2"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !email || !password}
                className="w-full mt-1"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Connexion en cours...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            {/* ---- Demo credentials collapsible ---- */}
            <div className="border-t border-border pt-4 -mt-2">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between text-xs font-semibold font-body text-ink-2 hover:text-ink transition-colors"
              >
                <span>Comptes demo</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: showDemo ? '200px' : '0',
                  opacity: showDemo ? 1 : 0,
                }}
              >
                <div className="flex flex-col gap-1.5 mt-3">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillDemo(account)}
                      className="group flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-body bg-violet-pale/50 hover:bg-violet-pale border border-transparent hover:border-violet/20 transition-all duration-150"
                    >
                      <div>
                        <span className="font-semibold text-ink">{account.label}</span>
                        <span className="text-ink-2 ml-2">{account.email}</span>
                      </div>
                      <span className="text-violet opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold uppercase tracking-wider">
                        Remplir
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ---- Footer ---- */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="flex items-center gap-2">
              {['Produits structurés', 'MIF2', 'PRIIPs'].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-body tracking-wide text-white/60 border border-white/15 bg-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-center text-white/35 text-[11px] font-body">
              Acc&egrave;s r&eacute;serv&eacute; aux partenaires institutionnels agr&eacute;&eacute;s
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
