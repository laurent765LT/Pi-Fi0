'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  Eye,
  Briefcase,
  Save,
  Check,
  Pencil,
  Shield,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/ui/page-header';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROFILE_STORAGE_KEY = 'strickin-profile';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORG_ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  VIEWER: 'CGP',
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SUPER_ADMIN: { bg: 'linear-gradient(135deg, #3B1FA8 0%, #5B3FD4 100%)', text: '#FFFFFF', border: '#3B1FA8' },
  ORG_ADMIN: { bg: 'linear-gradient(135deg, rgba(59,31,168,0.12) 0%, rgba(85,53,196,0.18) 100%)', text: '#3B1FA8', border: '#C9BCFF' },
  MANAGER: { bg: 'linear-gradient(135deg, rgba(0,184,148,0.1) 0%, rgba(0,184,148,0.18) 100%)', text: '#007A63', border: '#A3EDD9' },
  VIEWER: { bg: 'linear-gradient(135deg, rgba(61,99,245,0.1) 0%, rgba(61,99,245,0.18) 100%)', text: '#1A3FCC', border: '#B8C8FF' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'ST';
}

// ---------------------------------------------------------------------------
// Editable Field
// ---------------------------------------------------------------------------

function EditableField({
  icon,
  label,
  value,
  onChange,
  readonly = false,
  type = 'text',
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readonly?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-semibold font-body flex items-center gap-1.5">
        <span className="text-ink-3/60">{icon}</span>
        {label}
        {readonly && (
          <span className="text-[8px] bg-surface-2/80 text-ink-3 px-1.5 py-0.5 rounded-full font-bold tracking-wider normal-case border border-border/30">
            Lecture seule
          </span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readonly}
        placeholder={placeholder}
        className={cn(
          'h-10 px-4 rounded-xl border text-[13px] font-body text-ink transition-all duration-200',
          'focus:outline-none',
          readonly
            ? 'bg-surface-2/40 border-border/30 text-ink-2 cursor-not-allowed'
            : 'bg-white/80 dark:bg-white/10 border-border/60 hover:border-violet/40 focus:border-[#3B1FA8] focus:ring-2 focus:ring-[#3B1FA8]/15 focus:shadow-md focus:shadow-violet/5',
          'placeholder:text-ink-3/40',
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Stat
// ---------------------------------------------------------------------------

function ActivityStat({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accentColor: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/30 ring-1 ring-black/[0.02] transition-all duration-200 hover:shadow-md hover:shadow-violet/5 hover:-translate-y-0.5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{ background: `${accentColor}10` }}
      >
        {icon}
      </div>
      <span className="font-display text-xl font-bold text-ink leading-none tracking-tight">{value}</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-ink-3 font-bold font-body">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  useEffect(() => { document.title = "Mon Profil | Strick'in"; }, []);
  const user = useAuthStore((s) => s.user);
  const u = user as any;

  const [firstName, setFirstName] = useState(() => {
    if (typeof window === 'undefined') return u?.firstName ?? '';
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored).firstName ?? u?.firstName ?? '';
    } catch {}
    return u?.firstName ?? '';
  });
  const [lastName, setLastName] = useState(() => {
    if (typeof window === 'undefined') return u?.lastName ?? '';
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored).lastName ?? u?.lastName ?? '';
    } catch {}
    return u?.lastName ?? '';
  });
  const [phone, setPhone] = useState(() => {
    if (typeof window === 'undefined') return u?.phone ?? '+33 6 12 34 56 78';
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored).phone ?? u?.phone ?? '+33 6 12 34 56 78';
    } catch {}
    return u?.phone ?? '+33 6 12 34 56 78';
  });
  const [company, setCompany] = useState(() => {
    if (typeof window === 'undefined') return u?.company ?? 'Mon Cabinet CGP';
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored).company ?? u?.company ?? 'Mon Cabinet CGP';
    } catch {}
    return u?.company ?? 'Mon Cabinet CGP';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const email = u?.email ?? 'utilisateur@strickin.com';
  const roleKey = u?.role ?? 'VIEWER';
  const roleLabel = ROLE_LABELS[roleKey] ?? roleKey;
  const roleColor = ROLE_COLORS[roleKey] ?? ROLE_COLORS.VIEWER;
  const initials = getInitials(firstName, lastName, email);
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email;

  const handleSave = () => {
    const profileData = { firstName, lastName, phone, company };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    } catch {}
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={User}
        title="Mon Profil"
        subtitle="Consultez et modifiez vos informations personnelles."
        accentFrom="#3B1FA8"
        accentTo="#5B3FD4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        {/* ── Left column: Avatar + Info Card ─────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6 stagger-children">
          {/* Avatar Card */}
          <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-violet/5">
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-80"
              style={{ background: 'linear-gradient(90deg, #3B1FA8 0%, #5B3FD4 50%, #3D63F5 100%)' }}
            />

            {/* Gradient header background */}
            <div
              className="h-24 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(59,31,168,0.08) 0%, rgba(85,53,196,0.04) 50%, rgba(61,99,245,0.06) 100%)',
              }}
            >
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-[#1A0A3E]"
                  style={{
                    background: 'linear-gradient(135deg, #3B1FA8 0%, #5B3FD4 50%, #3D63F5 100%)',
                  }}
                >
                  <span className="font-display font-bold text-2xl text-white leading-none">
                    {initials}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-14 pb-6 px-6 text-center">
              <h2 className="font-display text-lg font-bold text-ink leading-tight">{displayName}</h2>
              <p className="text-[12px] text-ink-3 font-body mt-1">{email}</p>

              {/* Role Badge */}
              <div className="mt-3 flex justify-center">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 rounded-xl border shadow-sm"
                  style={{
                    background: roleColor.bg,
                    color: roleColor.text,
                    borderColor: roleColor.border,
                  }}
                >
                  <Shield size={10} />
                  {roleLabel}
                </span>
              </div>

              {/* Member since */}
              <div className="mt-5 pt-4 border-t border-border/30">
                <div className="flex items-center justify-center gap-2 text-ink-3">
                  <Calendar size={13} />
                  <span className="text-[11px] font-body">
                    Membre depuis <span className="font-semibold text-ink-2">janvier 2024</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-60"
              style={{ background: '#00B894' }}
            />
            <div className="px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#00B894]/8">
                  <Activity size={14} className="text-[#00B894]" />
                </div>
                <h3 className="font-display text-[14px] font-bold text-ink">Activite</h3>
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <ActivityStat
                icon={<Clock size={16} className="text-[#3B1FA8]" />}
                label="Derniere connexion"
                value="Auj."
                accentColor="#3B1FA8"
              />
              <ActivityStat
                icon={<Eye size={16} className="text-[#3D63F5]" />}
                label="Produits vus"
                value={47}
                accentColor="#3D63F5"
              />
              <ActivityStat
                icon={<Briefcase size={16} className="text-[#00B894]" />}
                label="Engagements"
                value={12}
                accentColor="#00B894"
              />
            </div>
          </div>
        </div>

        {/* ── Right column: Editable fields ───────────────────── */}
        <div className="lg:col-span-2">
          <div className="relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-violet/5">
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-60"
              style={{ background: '#3B1FA8' }}
            />

            {/* Card header */}
            <div className="px-6 py-5 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: 'rgba(59,31,168,0.08)' }}
                >
                  <Pencil size={15} className="text-[#3B1FA8]" />
                </div>
                <div>
                  <h2 className="font-display text-[15px] font-bold text-ink leading-tight">
                    Informations personnelles
                  </h2>
                  <p className="text-[11px] text-ink-3 font-body mt-0.5">
                    Modifiez vos coordonnees et informations de contact.
                  </p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={cn(
                    'h-9 px-4 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
                    'text-[12px] font-semibold font-body text-ink-2 flex items-center gap-2',
                    'hover:border-[#3B1FA8] hover:text-[#3B1FA8] hover:bg-[#3B1FA8]/3 hover:shadow-md hover:shadow-violet/10',
                    'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                  )}
                >
                  <Pencil size={13} />
                  Modifier
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="h-9 px-4 rounded-xl text-[12px] font-semibold font-body text-ink-3 hover:text-ink transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    className={cn(
                      'h-9 px-5 rounded-xl text-[12px] font-semibold font-body text-white flex items-center gap-2',
                      'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] shadow-md shadow-violet/20',
                      'hover:shadow-lg hover:shadow-violet/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    )}
                  >
                    <Save size={13} />
                    Enregistrer
                  </button>
                </div>
              )}
            </div>

            {/* Saved success banner */}
            {saved && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00B894]/8 border border-[#00B894]/15">
                <Check size={14} className="text-[#00B894]" />
                <span className="text-[12px] font-semibold font-body text-[#007A63]">
                  Vos informations ont ete enregistrees avec succes.
                </span>
              </div>
            )}

            {/* Fields */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <EditableField
                  icon={<User size={10} />}
                  label="Prenom"
                  value={firstName}
                  onChange={setFirstName}
                  readonly={!isEditing}
                  placeholder="Votre prenom"
                />
                <EditableField
                  icon={<User size={10} />}
                  label="Nom"
                  value={lastName}
                  onChange={setLastName}
                  readonly={!isEditing}
                  placeholder="Votre nom"
                />
                <EditableField
                  icon={<Mail size={10} />}
                  label="Email"
                  value={email}
                  readonly
                  type="email"
                />
                <EditableField
                  icon={<Phone size={10} />}
                  label="Telephone"
                  value={phone}
                  onChange={setPhone}
                  readonly={!isEditing}
                  type="tel"
                  placeholder="+33 6 XX XX XX XX"
                />
                <div className="md:col-span-2">
                  <EditableField
                    icon={<Building2 size={10} />}
                    label="Societe / Cabinet"
                    value={company}
                    onChange={setCompany}
                    readonly={!isEditing}
                    placeholder="Nom de votre societe"
                  />
                </div>
              </div>

              {/* Extra info section */}
              <div className="mt-6 pt-5 border-t border-border/30">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-ink-3 font-bold mb-4">
                  Informations du compte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-2/30 border border-border/20">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold font-body">
                      Identifiant
                    </span>
                    <span className="font-mono text-[11px] text-ink-2 truncate">
                      {u?.id ?? 'demo-001'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-2/30 border border-border/20">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold font-body">
                      Organisation
                    </span>
                    <span className="font-body text-[12px] text-ink-2 font-medium">
                      {u?.orgId ?? 'ORG-001'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-surface-2/30 border border-border/20">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-ink-3 font-semibold font-body">
                      Role
                    </span>
                    <span className="font-body text-[12px] text-ink-2 font-medium">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
