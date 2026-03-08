'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
      }}
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg px-8 py-10 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded-md bg-violet flex items-center justify-center shadow-violet">
              <Zap size={20} className="text-white" strokeWidth={2.5} />
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

            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-pale border border-border text-[11px] font-semibold text-violet tracking-wide">
              <span
                className="w-1.5 h-1.5 rounded-full bg-violet inline-block"
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

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

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
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </Button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/40 text-xs font-body mt-6">
          Accès réservé aux partenaires institutionnels agréés
        </p>
      </div>
    </div>
  );
}
