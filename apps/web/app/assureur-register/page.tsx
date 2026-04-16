'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const COBALT = '#1E3A5F';
const COBALT_LIGHT = '#2A5080';
const COBALT_DARK = '#152D4A';

const INSURER_SUGGESTIONS = [
  'Generali',
  'BNP Paribas Cardif',
  'Spirica',
  'Apicil',
  'Suravenir',
  'SwissLife',
  'Autre',
];

const PRODUCT_TYPES = [
  'Autocall Phoenix',
  'Capital Protege',
  'Taux Conditionnel',
  'Barrier Note',
];

const VOLUME_OPTIONS = [
  { value: '<10M', label: '< 10 M\u20ac' },
  { value: '10-50M', label: '10 \u2013 50 M\u20ac' },
  { value: '50-100M', label: '50 \u2013 100 M\u20ac' },
  { value: '100M+', label: '100 M\u20ac +' },
];

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface FormData {
  // Step 1
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle: string;
  // Step 2
  companyName: string;
  acprNumber: string;
  productTypes: string[];
  annualVolume: string;
  // Step 3
  acceptTerms: boolean;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  jobTitle: '',
  companyName: '',
  acprNumber: '',
  productTypes: [],
  annualVolume: '',
  acceptTerms: false,
};

/* -------------------------------------------------------------------------- */
/*  Password strength                                                          */
/* -------------------------------------------------------------------------- */

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Faible', color: '#EF4444' };
  if (score <= 2) return { score, label: 'Moyen', color: '#F59E0B' };
  if (score <= 3) return { score, label: 'Bon', color: '#3B82F6' };
  return { score, label: 'Fort', color: '#10B981' };
}

/* -------------------------------------------------------------------------- */
/*  Slug helper                                                                */
/* -------------------------------------------------------------------------- */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AssureurRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---- Helpers ---- */

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleProduct = (product: string) => {
    setForm((prev) => ({
      ...prev,
      productTypes: prev.productTypes.includes(product)
        ? prev.productTypes.filter((p) => p !== product)
        : [...prev.productTypes, product],
    }));
  };

  const pwStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  /* ---- Filtered suggestions ---- */
  const filteredSuggestions = INSURER_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(form.companyName.toLowerCase()),
  );

  /* ---- Validation ---- */

  function validateStep1(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'Requis';
    if (!form.lastName.trim()) errs.lastName = 'Requis';
    if (!form.email.trim()) errs.email = 'Requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Email invalide';
    if (!form.password) errs.password = 'Requis';
    else if (form.password.length < 8)
      errs.password = '8 caracteres minimum';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.companyName.trim()) errs.companyName = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.acceptTerms) errs.acceptTerms = 'Vous devez accepter les CGU';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ---- Navigation ---- */

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  }

  /* ---- Submit ---- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const companySlug = slugify(form.companyName);
    const orgId = 'org-insurer-' + companySlug;
    const token = 'demo-token-assureur-' + Date.now();

    // 1. Store in localStorage
    const existing = JSON.parse(localStorage.getItem('strickin-registered-insurers') || '[]');
    existing.push({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      jobTitle: form.jobTitle,
      companyName: form.companyName,
      acprNumber: form.acprNumber,
      productTypes: form.productTypes,
      annualVolume: form.annualVolume,
      registeredAt: new Date().toISOString(),
    });
    localStorage.setItem('strickin-registered-insurers', JSON.stringify(existing));

    // 2. Auto-login
    const userData = {
      user: {
        id: 'insurer-' + Date.now(),
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: 'ORG_ADMIN',
        orgId,
      },
      token,
      refreshToken: 'demo-refresh',
      isDemo: true,
    };

    // 3. Set cookie
    document.cookie = `strickin-auth=${encodeURIComponent(
      JSON.stringify({ state: userData }),
    )};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;

    // 4. Redirect
    router.push('/assureur/dashboard');
  }

  /* ---- Step indicator ---- */

  const steps = [
    { num: 1, label: 'Contact' },
    { num: 2, label: 'Organisme' },
    { num: 3, label: 'Confirmation' },
  ];

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
          0% { box-shadow: 0 0 0 0 rgba(30, 58, 95, 0.5); }
          70% { box-shadow: 0 0 0 5px rgba(30, 58, 95, 0); }
          100% { box-shadow: 0 0 0 0 rgba(30, 58, 95, 0); }
        }
      `}</style>

      <div
        className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COBALT_DARK} 0%, ${COBALT} 40%, ${COBALT_LIGHT} 70%, #0F2B52 100%)`,
        }}
      >
        {/* ---- Floating gradient orbs ---- */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            top: '10%',
            left: '15%',
            background: `radial-gradient(circle, ${COBALT_LIGHT} 0%, transparent 70%)`,
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
            background: `radial-gradient(circle, ${COBALT_DARK} 0%, transparent 70%)`,
            animation: 'float-orb-3 20s ease-in-out infinite',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[260px] h-[260px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            top: '5%',
            right: '20%',
            background: 'radial-gradient(circle, #0A1628 0%, transparent 70%)',
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
            animation: mounted ? 'card-entrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* ---- Glass Card ---- */}
          <div
            className="rounded-2xl shadow-2xl px-8 py-8 flex flex-col gap-6 border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${COBALT} 0%, ${COBALT_LIGHT} 100%)` }}
              >
                <Zap size={22} className="text-white" strokeWidth={2.5} />
              </div>

              <div>
                <h1 className="font-display font-extrabold text-2xl leading-tight text-ink">
                  Strick<span style={{ color: COBALT }}>&lsquo;in</span>
                </h1>
                <p className="font-body text-sm text-ink-2 mt-0.5">
                  Plateforme B2B de distribution
                </p>
              </div>

              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide"
                style={{
                  backgroundColor: `${COBALT}10`,
                  borderColor: `${COBALT}25`,
                  color: COBALT,
                }}
              >
                <Building2 size={12} />
                Espace Assureur
              </span>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num < step) setStep(s.num);
                    }}
                    disabled={s.num > step}
                    className="flex items-center gap-1.5 transition-all duration-200"
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200"
                      style={{
                        background: step >= s.num ? COBALT : 'transparent',
                        color: step >= s.num ? '#fff' : '#9CA3AF',
                        border: step >= s.num ? 'none' : '1.5px solid #D1D5DB',
                      }}
                    >
                      {step > s.num ? <Check size={12} strokeWidth={3} /> : s.num}
                    </span>
                    <span
                      className="text-[11px] font-semibold font-body hidden sm:inline"
                      style={{ color: step >= s.num ? COBALT : '#9CA3AF' }}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className="w-8 h-[1.5px] rounded-full"
                      style={{ background: step > s.num ? COBALT : '#D1D5DB' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) handleNext();
                else handleSubmit(e);
              }}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* ========== STEP 1 ========== */}
              {step === 1 && (
                <>
                  <div className="flex gap-3">
                    <Input
                      label="Prenom"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={(e) => set('firstName', e.target.value)}
                      error={errors.firstName}
                      disabled={loading}
                    />
                    <Input
                      label="Nom"
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={(e) => set('lastName', e.target.value)}
                      error={errors.lastName}
                      disabled={loading}
                    />
                  </div>

                  <Input
                    label="Email professionnel"
                    type="email"
                    placeholder="vous@assureur.fr"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={errors.email}
                    autoComplete="email"
                    disabled={loading}
                  />

                  {/* Password */}
                  <div className="relative">
                    <Input
                      label="Mot de passe"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8 caracteres minimum"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      error={errors.password}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[34px] text-ink-2 hover:text-ink transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {form.password.length > 0 && (
                    <div className="flex items-center gap-2 -mt-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(pwStrength.score / 5) * 100}%`,
                            background: pwStrength.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold font-body"
                        style={{ color: pwStrength.color }}
                      >
                        {pwStrength.label}
                      </span>
                    </div>
                  )}

                  {/* Confirm password */}
                  <div className="relative">
                    <Input
                      label="Confirmer le mot de passe"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Retapez votre mot de passe"
                      value={form.confirmPassword}
                      onChange={(e) => set('confirmPassword', e.target.value)}
                      error={errors.confirmPassword}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-[34px] text-ink-2 hover:text-ink transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                    >
                      {showConfirm ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                    </button>
                  </div>

                  <Input
                    label="Fonction / Poste"
                    placeholder="Directeur distribution, Responsable produits..."
                    value={form.jobTitle}
                    onChange={(e) => set('jobTitle', e.target.value)}
                    disabled={loading}
                  />
                </>
              )}

              {/* ========== STEP 2 ========== */}
              {step === 2 && (
                <>
                  {/* Company name with suggestions */}
                  <div className="relative">
                    <Input
                      label="Nom de l'organisme assureur"
                      placeholder="Commencez a taper..."
                      value={form.companyName}
                      onChange={(e) => {
                        set('companyName', e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      error={errors.companyName}
                      disabled={loading}
                    />
                    {showSuggestions && form.companyName.length === 0 && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-lg border border-border shadow-lg overflow-hidden">
                        {INSURER_SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm font-body text-ink hover:bg-gray-50 transition-colors"
                            onMouseDown={() => {
                              set('companyName', s);
                              setShowSuggestions(false);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {showSuggestions && form.companyName.length > 0 && filteredSuggestions.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-lg border border-border shadow-lg overflow-hidden">
                        {filteredSuggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm font-body text-ink hover:bg-gray-50 transition-colors"
                            onMouseDown={() => {
                              set('companyName', s);
                              setShowSuggestions(false);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Input
                    label="Numero ACPR (optionnel)"
                    placeholder="Ex: 12345678"
                    value={form.acprNumber}
                    onChange={(e) => set('acprNumber', e.target.value)}
                    disabled={loading}
                  />

                  {/* Product types - multi-select checkboxes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold uppercase tracking-wide text-ink-2">
                      Types de produits distribues
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRODUCT_TYPES.map((product) => {
                        const checked = form.productTypes.includes(product);
                        return (
                          <button
                            key={product}
                            type="button"
                            onClick={() => toggleProduct(product)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-[13px] font-body transition-all duration-150"
                            style={{
                              borderColor: checked ? COBALT : '#E5E7EB',
                              background: checked ? `${COBALT}08` : 'transparent',
                              color: checked ? COBALT : '#6B7280',
                            }}
                          >
                            <span
                              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150"
                              style={{
                                background: checked ? COBALT : 'transparent',
                                border: checked ? 'none' : '1.5px solid #D1D5DB',
                              }}
                            >
                              {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                            </span>
                            {product}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Annual volume */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-xs font-bold uppercase tracking-wide text-ink-2">
                      Volume annuel estime
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {VOLUME_OPTIONS.map((opt) => {
                        const selected = form.annualVolume === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set('annualVolume', opt.value)}
                            className="px-3 py-2 rounded-lg border text-[13px] font-body font-medium transition-all duration-150 text-center"
                            style={{
                              borderColor: selected ? COBALT : '#E5E7EB',
                              background: selected ? `${COBALT}08` : 'transparent',
                              color: selected ? COBALT : '#6B7280',
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ========== STEP 3 ========== */}
              {step === 3 && (
                <>
                  {/* Summary */}
                  <div
                    className="rounded-xl p-4 flex flex-col gap-3 text-sm font-body border"
                    style={{ background: `${COBALT}06`, borderColor: `${COBALT}15` }}
                  >
                    <h3 className="font-display font-bold text-ink text-[15px]">
                      Recapitulatif
                    </h3>

                    <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-[13px]">
                      <span className="text-ink-3 font-medium">Nom</span>
                      <span className="text-ink">{form.firstName} {form.lastName}</span>

                      <span className="text-ink-3 font-medium">Email</span>
                      <span className="text-ink">{form.email}</span>

                      {form.jobTitle && (
                        <>
                          <span className="text-ink-3 font-medium">Fonction</span>
                          <span className="text-ink">{form.jobTitle}</span>
                        </>
                      )}

                      <span className="text-ink-3 font-medium">Organisme</span>
                      <span className="text-ink font-semibold">{form.companyName}</span>

                      {form.acprNumber && (
                        <>
                          <span className="text-ink-3 font-medium">ACPR</span>
                          <span className="text-ink">{form.acprNumber}</span>
                        </>
                      )}

                      {form.productTypes.length > 0 && (
                        <>
                          <span className="text-ink-3 font-medium">Produits</span>
                          <span className="text-ink">{form.productTypes.join(', ')}</span>
                        </>
                      )}

                      {form.annualVolume && (
                        <>
                          <span className="text-ink-3 font-medium">Volume</span>
                          <span className="text-ink">
                            {VOLUME_OPTIONS.find((v) => v.value === form.annualVolume)?.label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CGU checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <button
                      type="button"
                      onClick={() => set('acceptTerms', !form.acceptTerms)}
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-150"
                      style={{
                        background: form.acceptTerms ? COBALT : 'transparent',
                        border: form.acceptTerms ? 'none' : '1.5px solid #D1D5DB',
                      }}
                    >
                      {form.acceptTerms && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-[13px] font-body text-ink-2 leading-snug">
                      J&apos;accepte les{' '}
                      <span style={{ color: COBALT }} className="font-semibold cursor-pointer hover:underline">
                        Conditions Generales d&apos;Utilisation
                      </span>{' '}
                      et la{' '}
                      <span style={{ color: COBALT }} className="font-semibold cursor-pointer hover:underline">
                        Politique de Confidentialite
                      </span>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="font-body text-xs text-red font-medium -mt-2">
                      {errors.acceptTerms}
                    </p>
                  )}
                </>
              )}

              {/* ---- Action buttons ---- */}
              <div className="flex gap-3 mt-1">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="muted"
                    size="lg"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-shrink-0"
                  >
                    <ChevronLeft size={16} />
                    Retour
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="submit"
                    variant="cobalt"
                    size="lg"
                    className="w-full font-bold text-[15px] shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COBALT_DARK} 0%, ${COBALT} 60%, ${COBALT_LIGHT} 100%)`,
                    }}
                  >
                    Continuer
                    <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="cobalt"
                    size="lg"
                    disabled={loading || !form.acceptTerms}
                    className="w-full font-bold text-[15px] shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COBALT_DARK} 0%, ${COBALT} 60%, ${COBALT_LIGHT} 100%)`,
                    }}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Creation en cours...
                      </span>
                    ) : (
                      <>
                        Creer mon compte assureur
                        <Shield size={16} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* ---- Links ---- */}
            <div className="border-t border-border pt-4 -mt-1 flex flex-col items-center gap-2 text-[13px] font-body">
              <p className="text-ink-3">
                Deja inscrit ?{' '}
                <Link
                  href="/assureur-login"
                  className="font-semibold hover:underline transition-colors"
                  style={{ color: COBALT }}
                >
                  Se connecter
                </Link>
              </p>
              <p className="text-ink-3">
                Vous etes CGP ?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-violet hover:underline transition-colors"
                >
                  Inscription CGP
                </Link>
              </p>
            </div>
          </div>

          {/* ---- Footer ---- */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="flex items-center gap-2">
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
              Acces reserve aux organismes assureurs agrees
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
