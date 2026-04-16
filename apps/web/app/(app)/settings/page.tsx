'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Mail,
  BarChart3,
  Palette,
  Globe,
  Shield,
  Lock,
  Smartphone,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  ChevronRight,
  Settings,
  Search,
  Monitor,
  RefreshCcw,
  QrCode,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocaleStore } from '@/stores/locale-store';

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function Toggle({
  enabled,
  onToggle,
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
        enabled
          ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] shadow-md shadow-violet/20'
          : 'bg-ink-3/15 dark:bg-ink-3/25',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
          enabled ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section Card
// ---------------------------------------------------------------------------

function SectionCard({
  icon,
  title,
  description,
  children,
  accentColor = '#3B1FA8',
  sectionId,
  highlighted = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  accentColor?: string;
  sectionId?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      id={sectionId}
      className={cn(
        'group relative bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 ring-1 ring-black/[0.03] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet/5 hover:border-[#3B1FA8]/20 focus-within:ring-2 focus-within:ring-[#3B1FA8]/20',
        highlighted && 'ring-2 ring-[#3B1FA8]/40 shadow-lg shadow-[#3B1FA8]/10 border-[#3B1FA8]/30',
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[3px] rounded-b-full transition-opacity duration-200',
          highlighted ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
        )}
        style={{ background: accentColor }}
      />
      <div className="px-6 py-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: `${accentColor}10` }}
          >
            {icon}
          </div>
          <div>
            <h2 className="font-display text-[15px] font-bold text-ink leading-tight">{title}</h2>
            <p className="text-[11px] text-ink-3 font-body mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setting Row
// ---------------------------------------------------------------------------

function SettingRow({
  icon,
  label,
  description,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border/20 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="text-ink-3/70 shrink-0">{icon}</span>
        )}
        <div className="min-w-0">
          <p className="font-body text-[13px] font-semibold text-ink leading-tight">{label}</p>
          {description && (
            <p className="text-[11px] text-ink-3 font-body mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Destructive Action with Two-Step Confirmation
// ---------------------------------------------------------------------------

function DestructiveAction({
  icon,
  label,
  description,
  confirmMessage,
  buttonLabel,
  onConfirm,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  confirmMessage: string;
  buttonLabel: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border/20 last:border-0">
      <span className="text-ink-3/70 shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13px] font-semibold text-ink leading-tight">{label}</p>
        <p className="text-[11px] text-ink-3 font-body mt-0.5">{description}</p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className={cn(
              'mt-3 h-8 px-4 rounded-xl border border-[#E8334A]/20',
              'text-[12px] font-semibold font-body text-[#E8334A] flex items-center gap-1.5',
              'hover:bg-[#E8334A]/5 hover:border-[#E8334A]/40 hover:shadow-md hover:shadow-[#E8334A]/10',
              'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8334A]/40 focus-visible:ring-offset-2',
            )}
          >
            {icon}
            {buttonLabel}
          </button>
        ) : (
          <div className="mt-3 p-4 rounded-xl bg-[#E8334A]/3 border border-[#E8334A]/15 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#E8334A]/10">
                <AlertTriangle size={12} className="text-[#E8334A]" />
              </div>
              <span className="text-[12px] font-bold text-[#E8334A] font-body">
                {confirmMessage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onConfirm();
                  setConfirming(false);
                }}
                className={cn(
                  'h-8 px-4 rounded-xl text-[12px] font-semibold font-body transition-all duration-200',
                  'bg-[#E8334A] text-white shadow-md shadow-[#E8334A]/20 hover:scale-[1.02] active:scale-[0.98]',
                )}
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="h-8 px-3 rounded-xl text-[12px] font-semibold font-body text-ink-3 hover:text-ink transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo Sessions Data
// ---------------------------------------------------------------------------

const DEMO_SESSIONS = [
  {
    id: 'sess-1',
    device: 'desktop' as const,
    browser: 'Chrome',
    ip: '192.168.1.42',
    location: 'Paris, FR',
    lastActivity: 'il y a 5 min',
    current: true,
  },
  {
    id: 'sess-2',
    device: 'mobile' as const,
    browser: 'Safari',
    ip: '192.168.1.87',
    location: 'Lyon, FR',
    lastActivity: 'il y a 2h',
    current: false,
  },
  {
    id: 'sess-3',
    device: 'desktop' as const,
    browser: 'Firefox',
    ip: '10.0.0.15',
    location: 'Marseille, FR',
    lastActivity: 'il y a 1j',
    current: false,
  },
];

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------

const SETTINGS_STORAGE_KEY = 'strickin-settings';

interface AppSettings {
  emailNotifs: boolean;
  pushNotifs: boolean;
  weeklyReport: boolean;
  language: 'fr' | 'en';
  twoFa: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  emailNotifs: true,
  pushNotifs: false,
  weeklyReport: true,
  language: 'fr',
  twoFa: false,
};

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

// ---------------------------------------------------------------------------
// Section definitions for search
// ---------------------------------------------------------------------------

const SECTION_DEFS = [
  { id: 'section-notifications', title: 'Notifications', keywords: 'notifications email push rapport hebdomadaire alertes' },
  { id: 'section-affichage', title: 'Affichage', keywords: 'affichage theme langue sombre clair personnaliser' },
  { id: 'section-securite', title: 'Securite', keywords: 'securite mot de passe password 2fa authentification deux facteurs' },
  { id: 'section-sessions', title: 'Sessions actives', keywords: 'sessions actives connexion deconnecter appareil navigateur' },
  { id: 'section-donnees', title: 'Donnees', keywords: 'donnees exporter supprimer compte reinitialiser json telechargement' },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(() => loadSettings().emailNotifs);
  const [pushNotifs, setPushNotifs] = useState(() => loadSettings().pushNotifs);
  const [weeklyReport, setWeeklyReport] = useState(() => loadSettings().weeklyReport);

  // Display preferences — synced with global locale store
  const { locale, setLocale } = useLocaleStore();
  const [language, setLanguageLocal] = useState<'fr' | 'en'>(() => loadSettings().language);
  const setLanguage = (lang: 'fr' | 'en') => {
    setLanguageLocal(lang);
    setLocale(lang);
  };
  // Sync on mount if locale store differs
  useEffect(() => {
    if (locale !== language) setLanguageLocal(locale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Security
  const [twoFa, setTwoFa] = useState(() => loadSettings().twoFa);

  // Confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Sessions
  const [sessions, setSessions] = useState(DEMO_SESSIONS);
  const [logoutAllConfirming, setLogoutAllConfirming] = useState(false);

  useEffect(() => {
    saveSettings({ emailNotifs, pushNotifs, weeklyReport, language, twoFa });
  }, [emailNotifs, pushNotifs, weeklyReport, language, twoFa]);

  const matchingSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTION_DEFS.map((s) => s.id);
    const q = searchQuery.toLowerCase();
    return SECTION_DEFS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q),
    ).map((s) => s.id);
  }, [searchQuery]);

  const isSectionVisible = (id: string) => matchingSections.includes(id);
  const isSectionHighlighted = (id: string) => searchQuery.trim() !== '' && matchingSections.includes(id);

  const handleExportData = () => {
    const data = {
      settings: { emailNotifs, pushNotifs, weeklyReport, language, twoFa },
      exportedAt: new Date().toISOString(),
      platform: 'Strick\'in',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strickin-export.json';
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'SUPPRIMER') {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const handleLogoutAll = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    setLogoutAllConfirming(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{
              background: 'linear-gradient(135deg, #3B1FA8 0%, #5B3FD4 100%)',
            }}
          >
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-[28px] font-bold leading-tight bg-gradient-to-r from-[#3B1FA8] via-[#1A0A3E] to-[#3B1FA8] bg-clip-text text-transparent">
              Paramètres
            </h1>
            <p className="text-sm text-ink-3 font-body mt-0.5">
              Gerez vos preferences et la securite de votre compte.
            </p>
          </div>
        </div>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un parametre..."
            className={cn(
              'w-full h-9 pl-9 pr-4 rounded-xl border border-border/60 bg-white/80 dark:bg-white/5 backdrop-blur-sm',
              'text-[13px] font-body text-ink dark:text-white placeholder:text-ink-3/40',
              'focus:outline-none focus:ring-2 focus:ring-[#3B1FA8]/20 focus:border-[#3B1FA8]/40',
              'transition-all duration-200',
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3/50 hover:text-ink transition-colors"
            >
              <span className="text-[11px] font-body font-medium">Effacer</span>
            </button>
          )}
        </div>
        {searchQuery && matchingSections.length === 0 && (
          <p className="text-[11px] text-ink-3 font-body mt-2">
            Aucune section ne correspond a &quot;{searchQuery}&quot;
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* -- Notifications ------------------------------------------------ */}
        {isSectionVisible('section-notifications') && (
          <SectionCard
            icon={<Bell size={16} className="text-[#3B1FA8]" />}
            title="Notifications"
            description="Configurez vos preferences de notification."
            accentColor="#3B1FA8"
            sectionId="section-notifications"
            highlighted={isSectionHighlighted('section-notifications')}
          >
            <SettingRow
              icon={<Mail size={14} />}
              label="Notifications par email"
              description="Recevez les alertes produits et mises a jour par email."
            >
              <Toggle enabled={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} />
            </SettingRow>

            <SettingRow
              icon={<BellRing size={14} />}
              label="Notifications push"
              description="Activez les notifications push dans votre navigateur."
            >
              <Toggle enabled={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} />
            </SettingRow>

            <SettingRow
              icon={<BarChart3 size={14} />}
              label="Rapport hebdomadaire"
              description="Recevez un resume de votre activite chaque lundi."
            >
              <Toggle enabled={weeklyReport} onToggle={() => setWeeklyReport(!weeklyReport)} />
            </SettingRow>
          </SectionCard>
        )}

        {/* -- Display ----------------------------------------------------- */}
        {isSectionVisible('section-affichage') && (
          <SectionCard
            icon={<Palette size={16} className="text-[#5B3FD4]" />}
            title="Affichage"
            description="Personnalisez l'apparence de l'application."
            accentColor="#5B3FD4"
            sectionId="section-affichage"
            highlighted={isSectionHighlighted('section-affichage')}
          >
            <SettingRow
              icon={<Palette size={14} />}
              label="Theme"
              description="Basculez entre le mode clair et sombre via le toggle dans la sidebar."
            >
              <span className="text-[11px] text-ink-3 font-body font-medium bg-surface-2/40 border border-border/20 px-3 py-1.5 rounded-xl">
                Via sidebar
              </span>
            </SettingRow>

            <SettingRow
              icon={<Globe size={14} />}
              label="Langue"
              description="Choisissez la langue de l'interface."
            >
              <div className="flex items-center gap-1 bg-surface-2/40 border border-border/20 rounded-xl p-0.5">
                <button
                  onClick={() => setLanguage('fr')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-[12px] font-semibold font-body transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-1',
                    language === 'fr'
                      ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20'
                      : 'text-ink-3 hover:text-ink',
                  )}
                >
                  FR
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-[12px] font-semibold font-body transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-1',
                    language === 'en'
                      ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] text-white shadow-md shadow-violet/20'
                      : 'text-ink-3 hover:text-ink',
                  )}
                >
                  EN
                </button>
              </div>
            </SettingRow>
          </SectionCard>
        )}

        {/* -- Security ---------------------------------------------------- */}
        {isSectionVisible('section-securite') && (
          <SectionCard
            icon={<Shield size={16} className="text-[#00B894]" />}
            title="Securite"
            description="Protegez votre compte avec des parametres de securite avances."
            accentColor="#00B894"
            sectionId="section-securite"
            highlighted={isSectionHighlighted('section-securite')}
          >
            <SettingRow
              icon={<Lock size={14} />}
              label="Changer le mot de passe"
              description="Modifiez votre mot de passe actuel."
            >
              <button
                onClick={() => {
                  const msg = 'Pour modifier votre mot de passe, un email de reinitialisation vous sera envoye a votre adresse email.';
                  window.alert(msg);
                }}
                className={cn(
                  'h-8 px-4 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm',
                  'text-[12px] font-semibold font-body text-ink-2 flex items-center gap-1.5',
                  'hover:border-[#3B1FA8] hover:text-[#3B1FA8] hover:bg-[#3B1FA8]/3 hover:shadow-md hover:shadow-violet/10',
                  'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
                )}
              >
                Modifier
                <ChevronRight size={13} />
              </button>
            </SettingRow>

            {/* 2FA Section */}
            <div className="py-3.5 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-ink-3/70 shrink-0">
                    <Shield size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-[13px] font-semibold text-ink leading-tight">
                      Authentification a deux facteurs
                    </p>
                    <p className="text-[11px] text-ink-3 font-body mt-0.5">
                      Ajoutez une couche de securite supplementaire avec la 2FA.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 ml-4">
                  {twoFa && (
                    <span className="text-[10px] font-bold text-[#00B894] bg-[#00B894]/8 px-2.5 py-1 rounded-lg uppercase tracking-wider border border-[#00B894]/10">
                      Actif
                    </span>
                  )}
                  <Toggle enabled={twoFa} onToggle={() => setTwoFa(!twoFa)} />
                </div>
              </div>

              {/* 2FA expanded content */}
              {twoFa && (
                <div className="mt-4 ml-8 space-y-4 animate-fade-in">
                  {/* QR Code placeholder */}
                  <div className="p-4 rounded-xl bg-[#00B894]/3 border border-[#00B894]/15">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#00B894]/10">
                        <QrCode size={12} className="text-[#00B894]" />
                      </div>
                      <span className="text-[12px] font-bold text-[#00B894] font-body">
                        Scanner le QR Code
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-28 rounded-xl bg-white dark:bg-white/10 border-2 border-dashed border-[#00B894]/30 flex items-center justify-center">
                        <div className="text-center">
                          <QrCode size={32} className="text-[#00B894]/40 mx-auto mb-1" />
                          <span className="text-[9px] text-ink-3/60 font-body">QR Code</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-ink-2 font-body leading-relaxed">
                          Scannez ce QR code avec votre application d&apos;authentification
                          (Google Authenticator, Authy, etc.) pour configurer la verification
                          en deux etapes.
                        </p>
                        <div className="mt-2 p-2 rounded-lg bg-white/60 dark:bg-white/5 border border-border/30">
                          <p className="text-[10px] text-ink-3 font-body mb-0.5">Cle manuelle :</p>
                          <code className="text-[11px] font-mono font-bold text-[#3B1FA8] select-all">
                            JBSW Y3DP EHPK 3PXP
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recovery codes */}
                  <div className="p-4 rounded-xl bg-[#D4A017]/3 border border-[#D4A017]/15">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#D4A017]/10">
                        <KeyRound size={12} className="text-[#D4A017]" />
                      </div>
                      <span className="text-[12px] font-bold text-[#D4A017] font-body">
                        Codes de recuperation
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-2 font-body mb-2 leading-relaxed">
                      Conservez ces codes en lieu sur. Ils vous permettront de vous connecter
                      si vous perdez l&apos;acces a votre application d&apos;authentification.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['A7K2-M9X4', 'B3P8-Q5R2', 'C6W1-T4N7', 'D9L5-V8J3'].map((code) => (
                        <span
                          key={code}
                          className="text-[11px] font-mono font-semibold text-ink-2 bg-white/60 dark:bg-white/5 border border-border/20 px-2.5 py-1.5 rounded-lg text-center select-all"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* -- Sessions actives ------------------------------------------- */}
        {isSectionVisible('section-sessions') && (
          <SectionCard
            icon={<Monitor size={16} className="text-[#3D63F5]" />}
            title="Sessions actives"
            description="Gerez les appareils connectes a votre compte."
            accentColor="#3D63F5"
            sectionId="section-sessions"
            highlighted={isSectionHighlighted('section-sessions')}
          >
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                    session.current
                      ? 'bg-[#3B1FA8]/3 border-[#3B1FA8]/15'
                      : 'bg-white/50 dark:bg-white/[0.02] border-border/30 hover:border-border/50',
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      session.current ? 'bg-[#3B1FA8]/10' : 'bg-ink-3/5',
                    )}
                  >
                    {session.device === 'mobile' ? (
                      <Smartphone
                        size={14}
                        className={session.current ? 'text-[#3B1FA8]' : 'text-ink-3/60'}
                      />
                    ) : (
                      <Monitor
                        size={14}
                        className={session.current ? 'text-[#3B1FA8]' : 'text-ink-3/60'}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-[12px] font-semibold text-ink leading-tight">
                        {session.browser} &middot; {session.ip} &middot; {session.location}
                      </p>
                      {session.current && (
                        <span className="text-[9px] font-bold text-[#00B894] bg-[#00B894]/8 px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#00B894]/10">
                          Session actuelle
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-3 font-body mt-0.5">
                      Derniere activite : {session.lastActivity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Disconnect all sessions */}
            <div className="mt-4 pt-3.5 border-t border-border/20">
              {!logoutAllConfirming ? (
                <button
                  onClick={() => setLogoutAllConfirming(true)}
                  className={cn(
                    'h-8 px-4 rounded-xl border border-[#E8334A]/20',
                    'text-[12px] font-semibold font-body text-[#E8334A] flex items-center gap-1.5',
                    'hover:bg-[#E8334A]/5 hover:border-[#E8334A]/40 hover:shadow-md hover:shadow-[#E8334A]/10',
                    'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8334A]/40 focus-visible:ring-offset-2',
                  )}
                >
                  <LogOut size={13} />
                  Deconnecter toutes les sessions
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-[#E8334A]/3 border border-[#E8334A]/15 animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#E8334A]/10">
                      <AlertTriangle size={12} className="text-[#E8334A]" />
                    </div>
                    <span className="text-[12px] font-bold text-[#E8334A] font-body">
                      Etes-vous sur ?
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-2 font-body mb-3">
                    Toutes les autres sessions seront deconnectees. Vous resterez connecte sur cette session.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLogoutAll}
                      className={cn(
                        'h-8 px-4 rounded-xl text-[12px] font-semibold font-body transition-all duration-200',
                        'bg-[#E8334A] text-white shadow-md shadow-[#E8334A]/20 hover:scale-[1.02] active:scale-[0.98]',
                      )}
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setLogoutAllConfirming(false)}
                      className="h-8 px-3 rounded-xl text-[12px] font-semibold font-body text-ink-3 hover:text-ink transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* -- Data -------------------------------------------------------- */}
        {isSectionVisible('section-donnees') && (
          <SectionCard
            icon={<Database size={16} className="text-[#D4A017]" />}
            title="Donnees"
            description="Exportez ou supprimez vos donnees personnelles."
            accentColor="#D4A017"
            sectionId="section-donnees"
            highlighted={isSectionHighlighted('section-donnees')}
          >
            <SettingRow
              icon={<Download size={14} />}
              label="Exporter mes donnees"
              description="Telechargez une copie de toutes vos donnees au format JSON."
            >
              <button
                onClick={handleExportData}
                className={cn(
                  'h-8 px-4 rounded-xl border',
                  'text-[12px] font-semibold font-body flex items-center gap-1.5',
                  'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40 focus-visible:ring-offset-2',
                  exportSuccess
                    ? 'border-[#00B894]/20 bg-[#00B894]/8 text-[#00B894]'
                    : 'border-border/60 bg-white/80 dark:bg-white/10 backdrop-blur-sm text-ink-2 hover:border-[#3B1FA8] hover:text-[#3B1FA8] hover:bg-[#3B1FA8]/3 hover:shadow-md hover:shadow-violet/10',
                )}
              >
                {exportSuccess ? (
                  <>
                    <Check size={13} />
                    Exporte !
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    Exporter
                  </>
                )}
              </button>
            </SettingRow>

            {/* Reset action with two-step confirmation */}
            <DestructiveAction
              icon={<RefreshCcw size={14} />}
              label="Reinitialiser les parametres"
              description="Restaure tous les parametres par defaut."
              confirmMessage="Etes-vous sur ? Tous vos parametres seront reinitialises."
              buttonLabel="Reinitialiser"
              onConfirm={() => {
                setEmailNotifs(true);
                setPushNotifs(false);
                setWeeklyReport(true);
                setLanguage('fr');
                setTwoFa(false);
                saveSettings(DEFAULT_SETTINGS);
              }}
            />

            {/* Delete account with existing flow */}
            <div className="pt-3.5">
              <div className="flex items-start gap-3">
                <span className="text-ink-3/70 shrink-0 mt-0.5">
                  <Trash2 size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] font-semibold text-ink leading-tight">
                    Supprimer mon compte
                  </p>
                  <p className="text-[11px] text-ink-3 font-body mt-0.5">
                    Cette action est irreversible. Toutes vos donnees seront supprimees.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className={cn(
                        'mt-3 h-8 px-4 rounded-xl border border-[#E8334A]/20',
                        'text-[12px] font-semibold font-body text-[#E8334A] flex items-center gap-1.5',
                        'hover:bg-[#E8334A]/5 hover:border-[#E8334A]/40 hover:shadow-md hover:shadow-[#E8334A]/10',
                        'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8334A]/40 focus-visible:ring-offset-2',
                      )}
                    >
                      <Trash2 size={13} />
                      Supprimer le compte
                    </button>
                  ) : (
                    <div className="mt-3 p-4 rounded-xl bg-[#E8334A]/3 border border-[#E8334A]/15 animate-fade-in">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#E8334A]/10">
                          <AlertTriangle size={12} className="text-[#E8334A]" />
                        </div>
                        <span className="text-[12px] font-bold text-[#E8334A] font-body">
                          Confirmation requise
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-2 font-body mb-3">
                        Tapez <span className="font-mono font-bold text-[#E8334A]">SUPPRIMER</span> pour confirmer la suppression definitive de votre compte.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="SUPPRIMER"
                          className={cn(
                            'h-8 px-3 rounded-xl border border-border/60 bg-white/80 dark:bg-white/10 text-[12px] font-mono font-body text-ink',
                            'focus:outline-none focus:ring-2 focus:ring-[#E8334A]/20 focus:border-[#E8334A]/40',
                            'placeholder:text-ink-3/40 w-32 transition-all duration-200',
                          )}
                        />
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'SUPPRIMER'}
                          className={cn(
                            'h-8 px-4 rounded-xl text-[12px] font-semibold font-body transition-all duration-200',
                            deleteConfirmText === 'SUPPRIMER'
                              ? 'bg-[#E8334A] text-white shadow-md shadow-[#E8334A]/20 hover:scale-[1.02] active:scale-[0.98]'
                              : 'bg-ink-3/8 text-ink-3/40 cursor-not-allowed',
                          )}
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          className="h-8 px-3 rounded-xl text-[12px] font-semibold font-body text-ink-3 hover:text-ink transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
