'use client';

// ─── <LoginForm /> — reusable credentials form ───────────────────────────────
// Encapsulates the email/password field layout + eye-toggle + submit logic.
// `/login/page.tsx` keeps its own bespoke decoration (gradient, demo list,
// etc.) so this component is aimed at:
//   - a future re-auth modal
//   - embedded login flows (e.g. in the onboarding wizard)
//   - tests
//
// Uses `useAuth().login` so behaviour stays identical to the existing flow
// — demo mode seeds the Zustand store, real-API mode hits `/auth/login`.

import * as React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useAuth } from '../../hooks/use-auth';

export interface LoginFormProps {
  /** Fired on successful login. Receives no arguments. */
  onSuccess?: () => void;
  /** Fired on any login failure. Receives the thrown error. */
  onError?: (error: Error) => void;
  /** Optional extra className on the `<form>` element. */
  className?: string;
  /** Optional label for the primary button. Defaults to "Se connecter". */
  submitLabel?: string;
  /** Pre-fill the email field (useful for re-auth flows). */
  defaultEmail?: string;
}

export function LoginForm({
  onSuccess,
  onError,
  className,
  submitLabel = 'Se connecter',
  defaultEmail = '',
}: LoginFormProps): React.ReactElement {
  const { login } = useAuth();

  const [email, setEmail] = React.useState(defaultEmail);
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Identifiants incorrects. Veuillez réessayer.';
      setError(message);
      if (err instanceof Error) onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-4', className)}
      noValidate
    >
      <Input
        label="Adresse e-mail"
        type="email"
        placeholder="vous@exemple.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        disabled={loading}
      />

      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-[34px] text-ink-2 hover:text-ink transition-colors"
          tabIndex={-1}
          aria-label={
            showPassword
              ? 'Masquer le mot de passe'
              : 'Afficher le mot de passe'
          }
        >
          {showPassword ? (
            <EyeOff size={18} strokeWidth={1.8} />
          ) : (
            <Eye size={18} strokeWidth={1.8} />
          )}
        </button>
      </div>

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
        className="w-full mt-1 font-bold text-[15px]"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Connexion en cours...
          </span>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
