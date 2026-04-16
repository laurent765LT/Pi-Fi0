'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  ShieldCheck,
  Phone,
  Building2,
  Mail,
  Lock,
  MapPin,
  Hash,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  orias: string;
  city: string;
  phone: string;
  acceptCgu: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  company?: string;
  orias?: string;
  phone?: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORIAS_RE = /^\d{8}$/;
const PHONE_RE = /^[\d\s+()-]{6,20}$/;

function getPasswordStrength(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  weak: { label: 'Faible', color: '#E74C3C', width: '33%' },
  medium: { label: 'Moyen', color: '#F39C12', width: '66%' },
  strong: { label: 'Fort', color: '#00B894', width: '100%' },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* ─── Steps metadata ─────────────────────────────────────────────────────── */

const STEPS = [
  { number: 1, label: 'Informations personnelles', icon: User },
  { number: 2, label: 'Informations professionnelles', icon: Briefcase },
  { number: 3, label: 'Confirmation', icon: ShieldCheck },
] as const;

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s);

  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    orias: '',
    city: '',
    phone: '',
    acceptCgu: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Field updater ── */
  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({ ...prev, [key]: true }));
    },
    [],
  );

  /* ── Validation ── */
  const validate = useCallback(
    (currentStep: number): FormErrors => {
      const e: FormErrors = {};

      if (currentStep >= 1) {
        if (!form.firstName.trim()) e.firstName = 'Le prenom est requis';
        if (!form.lastName.trim()) e.lastName = 'Le nom est requis';
        if (!form.email.trim()) e.email = "L'email est requis";
        else if (!EMAIL_RE.test(form.email)) e.email = 'Email invalide';
        if (!form.password) e.password = 'Le mot de passe est requis';
        else if (form.password.length < 8) e.password = '8 caracteres minimum';
        else if (!/[A-Z]/.test(form.password))
          e.password = 'Doit contenir une majuscule';
        else if (!/\d/.test(form.password))
          e.password = 'Doit contenir un chiffre';
        if (!form.confirmPassword)
          e.confirmPassword = 'Veuillez confirmer le mot de passe';
        else if (form.password !== form.confirmPassword)
          e.confirmPassword = 'Les mots de passe ne correspondent pas';
      }

      if (currentStep >= 2) {
        if (!form.company.trim()) e.company = 'Le nom de societe est requis';
        if (form.orias && !ORIAS_RE.test(form.orias))
          e.orias = "Le numero ORIAS doit contenir 8 chiffres";
        if (form.phone && !PHONE_RE.test(form.phone))
          e.phone = "Numero de telephone invalide";
      }

      return e;
    },
    [form],
  );

  const currentErrors = useMemo(() => validate(step), [validate, step]);

  const isStepValid = useCallback(
    (s: number): boolean => {
      const e = validate(s);
      if (s === 1) {
        return !e.firstName && !e.lastName && !e.email && !e.password && !e.confirmPassword;
      }
      if (s === 2) {
        return !e.company && !e.orias && !e.phone;
      }
      return true;
    },
    [validate],
  );

  /* ── Navigation ── */
  const handleNext = () => {
    // Mark all step-1 fields as touched
    if (step === 1) {
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        confirmPassword: true,
      });
    }
    if (step === 2) {
      setTouched((prev) => ({ ...prev, company: true, orias: true, phone: true }));
    }

    setErrors(validate(step));

    if (isStepValid(step)) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  /* ── Password strength ── */
  const pwStrength = form.password ? getPasswordStrength(form.password) : null;
  const strengthInfo = pwStrength ? strengthConfig[pwStrength] : null;

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.acceptCgu) {
      setGlobalError('Veuillez accepter les CGU pour continuer.');
      return;
    }

    setErrors(validate(3));
    if (!isStepValid(1) || !isStepValid(2)) {
      setGlobalError('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    setLoading(true);
    setGlobalError(null);

    try {
      // Simulate slight delay for UX
      await new Promise((r) => setTimeout(r, 800));

      const userId = 'user-' + Date.now();
      const orgSlug = slugify(form.company);
      const orgId = 'org-' + orgSlug;
      const token = 'demo-token-registered-' + Date.now();

      // Store in localStorage registered users list
      const existingRaw = localStorage.getItem('strickin-registered-users');
      const existing: unknown[] = existingRaw ? JSON.parse(existingRaw) : [];
      existing.push({
        id: userId,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        company: form.company,
        orias: form.orias,
        city: form.city,
        phone: form.phone,
        role: 'VIEWER',
        orgId,
        registeredAt: new Date().toISOString(),
      });
      localStorage.setItem('strickin-registered-users', JSON.stringify(existing));

      // Set auth state via zustand store (same pattern as login)
      const userData = {
        user: {
          id: userId,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          role: 'VIEWER',
          orgId,
        },
        token,
        refreshToken: 'demo-refresh-registered',
        isDemo: true,
      };

      // Write directly to zustand persisted store (like auth-store login does)
      api.setToken(token);
      useAuthStore.setState(userData);

      // Set cookie for middleware
      document.cookie = `strickin-auth=${encodeURIComponent(
        JSON.stringify({ state: userData }),
      )};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;

      router.replace('/onboarding');
    } catch {
      setGlobalError("Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Render helpers ── */

  const fieldError = (key: keyof FormErrors) =>
    touched[key] ? currentErrors[key] : undefined;

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
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(0, 184, 148, 0.5); }
          70% { box-shadow: 0 0 0 5px rgba(0, 184, 148, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 184, 148, 0); }
        }
        @keyframes strength-fill {
          from { width: 0; }
        }
      `}</style>

      <div
        className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
        }}
      >
        {/* ── Floating gradient orbs ── */}
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

        {/* Subtle radial texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />

        <div
          className="relative w-full max-w-[480px]"
          style={{
            animation: mounted
              ? 'card-entrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* ── Glass Card ── */}
          <div
            className="rounded-2xl shadow-2xl px-8 py-8 flex flex-col gap-6 border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)' }}
              >
                <Zap size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl leading-tight text-ink">
                  Strick<span className="text-violet-mid">&lsquo;in</span>
                </h1>
                <p className="font-body text-sm text-ink-2 mt-0.5">
                  Inscription CGP
                </p>
              </div>
            </div>

            {/* ── Step Indicator ── */}
            <div className="flex items-center justify-center gap-0">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon;
                const isActive = step === s.number;
                const isCompleted = step > s.number;

                return (
                  <div key={s.number} className="flex items-center">
                    {/* Step circle */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                          isCompleted &&
                            'bg-[#00B894] text-white shadow-md shadow-[#00B894]/30',
                          isActive &&
                            'text-white shadow-lg shadow-violet/30',
                          !isActive &&
                            !isCompleted &&
                            'bg-ink/[0.06] text-ink-3 border border-border',
                        )}
                        style={
                          isActive
                            ? {
                                background:
                                  'linear-gradient(135deg, #3B1FA8 0%, #5535C4 100%)',
                              }
                            : undefined
                        }
                      >
                        {isCompleted ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <StepIcon size={16} strokeWidth={2} />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-semibold font-body whitespace-nowrap transition-colors duration-200',
                          isActive ? 'text-violet' : isCompleted ? 'text-[#00B894]' : 'text-ink-3',
                        )}
                      >
                        {s.label}
                      </span>
                    </div>

                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div className="flex items-center px-2 -mt-4">
                        <div
                          className={cn(
                            'h-[2px] w-8 rounded-full transition-colors duration-300',
                            step > s.number ? 'bg-[#00B894]' : 'bg-ink/10',
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Step Content ── */}
            <div className="min-h-[280px]">
              {/* ──────── STEP 1 ──────── */}
              {step === 1 && (
                <div
                  className="flex flex-col gap-3.5"
                  style={{ animation: 'slide-in-right 0.35s ease-out' }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input
                        label="Prenom"
                        placeholder="Jean"
                        value={form.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        error={fieldError('firstName')}
                        className={cn(
                          fieldError('firstName') && 'border-red focus:ring-red',
                        )}
                      />
                      <User
                        size={14}
                        className="absolute right-3 top-[34px] text-ink-3 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="relative">
                      <Input
                        label="Nom"
                        placeholder="Dupont"
                        value={form.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        error={fieldError('lastName')}
                        className={cn(
                          fieldError('lastName') && 'border-red focus:ring-red',
                        )}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Input
                      label="Email professionnel"
                      type="email"
                      placeholder="jean.dupont@cabinet.fr"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      error={fieldError('email')}
                      autoComplete="email"
                    />
                    <Mail
                      size={14}
                      className="absolute right-3 top-[34px] text-ink-3 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Input
                      label="Mot de passe"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 caracteres"
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      error={fieldError('password')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[34px] text-ink-2 hover:text-ink transition-colors"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={16} strokeWidth={1.8} />
                      ) : (
                        <Eye size={16} strokeWidth={1.8} />
                      )}
                    </button>
                    <p className="text-[10px] text-ink-3 font-body mt-1">
                      Min. 8 caracteres, 1 majuscule, 1 chiffre
                    </p>
                  </div>

                  {/* Password strength */}
                  {form.password && strengthInfo && (
                    <div className="flex items-center gap-2 -mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-ink/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: strengthInfo.width,
                            background: strengthInfo.color,
                            animation: 'strength-fill 0.4s ease-out',
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-bold font-body uppercase tracking-wider"
                        style={{ color: strengthInfo.color }}
                      >
                        {strengthInfo.label}
                      </span>
                    </div>
                  )}

                  {/* Confirm password */}
                  <div className="relative">
                    <Input
                      label="Confirmer le mot de passe"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Retapez le mot de passe"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      error={fieldError('confirmPassword')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-[34px] text-ink-2 hover:text-ink transition-colors"
                      tabIndex={-1}
                      aria-label={
                        showConfirm
                          ? 'Masquer la confirmation'
                          : 'Afficher la confirmation'
                      }
                    >
                      {showConfirm ? (
                        <EyeOff size={16} strokeWidth={1.8} />
                      ) : (
                        <Eye size={16} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ──────── STEP 2 ──────── */}
              {step === 2 && (
                <div
                  className="flex flex-col gap-3.5"
                  style={{ animation: 'slide-in-right 0.35s ease-out' }}
                >
                  <div className="relative">
                    <Input
                      label="Nom du cabinet / societe"
                      placeholder="Cabinet Patrimoine & Co"
                      value={form.company}
                      onChange={(e) => updateField('company', e.target.value)}
                      error={fieldError('company')}
                    />
                    <Building2
                      size={14}
                      className="absolute right-3 top-[34px] text-ink-3 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="Numero ORIAS"
                      placeholder="12345678"
                      value={form.orias}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                        updateField('orias', val);
                      }}
                      error={fieldError('orias')}
                      hint="8 chiffres - facultatif a cette etape"
                    />
                    <Hash
                      size={14}
                      className="absolute right-3 top-[34px] text-ink-3 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="Ville"
                      placeholder="Paris"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                    <MapPin
                      size={14}
                      className="absolute right-3 top-[34px] text-ink-3 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="Telephone professionnel"
                      type="tel"
                      placeholder="+33 1 23 45 67 89"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      error={fieldError('phone')}
                      hint="Facultatif"
                    />
                    <Phone
                      size={14}
                      className="absolute right-3 top-[34px] text-ink-3 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}

              {/* ──────── STEP 3 ──────── */}
              {step === 3 && (
                <div
                  className="flex flex-col gap-4"
                  style={{ animation: 'slide-in-right 0.35s ease-out' }}
                >
                  <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-2">
                    Recapitulatif
                  </p>

                  <div className="rounded-lg bg-ink/[0.03] border border-border/60 p-4 flex flex-col gap-2.5">
                    {/* Personal info */}
                    <div className="flex items-start gap-3">
                      <User size={14} className="text-violet mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[13px] font-semibold text-ink">
                          {form.firstName} {form.lastName}
                        </p>
                        <p className="font-body text-xs text-ink-2 truncate">
                          {form.email}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-border/40" />

                    {/* Professional info */}
                    <div className="flex items-start gap-3">
                      <Building2 size={14} className="text-violet mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[13px] font-semibold text-ink">
                          {form.company}
                        </p>
                        {form.orias && (
                          <p className="font-body text-xs text-ink-2">
                            ORIAS : {form.orias}
                          </p>
                        )}
                      </div>
                    </div>

                    {(form.city || form.phone) && (
                      <>
                        <div className="h-px bg-border/40" />
                        <div className="flex items-start gap-3">
                          <MapPin size={14} className="text-violet mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {form.city && (
                              <p className="font-body text-xs text-ink-2">{form.city}</p>
                            )}
                            {form.phone && (
                              <p className="font-body text-xs text-ink-2">{form.phone}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="h-px bg-border/40" />

                    {/* Role badge */}
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-[#00B894] flex-shrink-0" />
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00B894]/10 text-[10px] font-bold font-body text-[#00B894] uppercase tracking-wider">
                        CGP - Acces Viewer
                      </span>
                    </div>
                  </div>

                  {/* CGU Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={form.acceptCgu}
                        onChange={(e) => updateField('acceptCgu', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
                          form.acceptCgu
                            ? 'border-violet bg-violet'
                            : 'border-ink/20 bg-white group-hover:border-violet/40',
                        )}
                      >
                        {form.acceptCgu && (
                          <Check size={13} className="text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    <span className="font-body text-xs text-ink-2 leading-relaxed">
                      J&apos;accepte les{' '}
                      <span className="text-violet font-semibold hover:underline cursor-pointer">
                        Conditions Generales d&apos;Utilisation
                      </span>{' '}
                      et la{' '}
                      <span className="text-violet font-semibold hover:underline cursor-pointer">
                        Politique de Confidentialite
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* ── Global Error ── */}
            {globalError && (
              <p
                role="alert"
                className="font-body text-xs font-medium text-red bg-red/8 border border-red/20 rounded-md px-3 py-2 -mt-2"
              >
                {globalError}
              </p>
            )}

            {/* ── Navigation Buttons ── */}
            <div className="flex items-center gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={handleBack}
                  className="flex-shrink-0"
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  Retour
                </Button>
              )}

              <div className="flex-1" />

              {step < 3 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  className="font-bold text-[15px] shadow-lg shadow-violet/25 min-w-[140px]"
                  style={{
                    background:
                      'linear-gradient(135deg, #3B1FA8 0%, #5535C4 60%, #6B47E0 100%)',
                  }}
                >
                  Suivant
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading || !form.acceptCgu}
                  className="font-bold text-[15px] shadow-lg shadow-violet/25 min-w-[180px]"
                  style={{
                    background:
                      'linear-gradient(135deg, #3B1FA8 0%, #5535C4 60%, #6B47E0 100%)',
                  }}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Creation...
                    </span>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Creer mon compte
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* ── Footer Links ── */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <Link
                href="/login"
                className="font-body text-sm text-white/70 hover:text-white transition-colors"
              >
                Deja un compte ?{' '}
                <span className="font-semibold text-white/90 underline underline-offset-2">
                  Se connecter
                </span>
              </Link>
              <span className="hidden sm:inline text-white/30">|</span>
              <Link
                href="/assureur-register"
                className="font-body text-sm text-white/70 hover:text-white transition-colors"
              >
                Vous etes assureur ?{' '}
                <span className="font-semibold text-[#00B894]/80 underline underline-offset-2">
                  Inscription assureur
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {['Produits structures', 'MIF2', 'PRIIPs'].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-body tracking-wide text-white/60 border border-white/15 bg-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-center text-white/35 text-[11px] font-body">
              Acces reserve aux Conseillers en Gestion de Patrimoine
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
