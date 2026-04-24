'use client';

// ─── <RegisterForm /> — reusable single-step register form ───────────────────
// Minimal flat form (email, names, password). The multi-step /register page
// wraps its own validation — this component is for embedded flows where a
// compact one-page inscription is enough.

import * as React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useAuth } from '../../hooks/use-auth';
import { PasswordStrength } from '../password-strength';
import { checkPassword } from '../../lib/password-rules';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  /** Default role for the new account. */
  defaultRole?: string;
  /** Default orgId (e.g. pre-created tenant). */
  defaultOrgId?: string;
}

export function RegisterForm({
  onSuccess,
  onError,
  className,
  defaultRole = 'VIEWER',
  defaultOrgId = '',
}: RegisterFormProps): React.ReactElement {
  const { register } = useAuth();

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pw = checkPassword(password);
    if (!pw.valid) {
      setError(pw.violations[0] ?? 'Mot de passe trop faible.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        firstName,
        lastName,
        role: defaultRole,
        orgId: defaultOrgId,
      });
      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de créer le compte. Veuillez réessayer.";
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
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prénom"
          placeholder="Jean"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          disabled={loading}
        />
        <Input
          label="Nom"
          placeholder="Dupont"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          disabled={loading}
        />
      </div>

      <Input
        label="Email professionnel"
        type="email"
        placeholder="jean.dupont@cabinet.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        disabled={loading}
      />

      <div className="relative">
        <Input
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min. 8 caractères"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
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
            <EyeOff size={16} strokeWidth={1.8} />
          ) : (
            <Eye size={16} strokeWidth={1.8} />
          )}
        </button>
      </div>

      <PasswordStrength password={password} />

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
        disabled={loading || !email || !password || !firstName || !lastName}
        className="w-full font-bold text-[15px]"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Création en cours...
          </span>
        ) : (
          'Créer mon compte'
        )}
      </Button>
    </form>
  );
}
