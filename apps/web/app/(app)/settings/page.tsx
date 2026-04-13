'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/cn';

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
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40 focus-visible:ring-offset-2',
        enabled
          ? 'bg-gradient-to-r from-[#3B1FA8] to-[#5B3FD4] shadow-md shadow-violet/20'
          : 'bg-ink-3/20',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out',
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="group relative bg-white/90 backdrop-blur-md rounded-xl border border-white/60 ring-1 ring-black/[0.03] overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet/5">
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accentColor }}
      />
      <div className="px-6 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: `${accentColor}12` }}
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
    <div className="flex items-center justify-between py-3.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <span className="text-ink-3 shrink-0">{icon}</span>
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
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Display preferences
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  // Security
  const [twoFa, setTwoFa] = useState(false);

  // Confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportData = () => {
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'SUPPRIMER') {
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
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
              Parametres
            </h1>
            <p className="text-sm text-ink-3 font-body mt-0.5">
              Gerez vos preferences et la securite de votre compte.
            </p>
          </div>
        </div>
        <div className="gradient-bar h-[2px] rounded-full mt-5 opacity-60" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* ── Notifications ────────────────────────────────────── */}
        <SectionCard
          icon={<Bell size={16} className="text-[#3B1FA8]" />}
          title="Notifications"
          description="Configurez vos preferences de notification."
          accentColor="#3B1FA8"
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

        {/* ── Display ──────────────────────────────────────────── */}
        <SectionCard
          icon={<Palette size={16} className="text-[#5B3FD4]" />}
          title="Affichage"
          description="Personnalisez l'apparence de l'application."
          accentColor="#5B3FD4"
        >
          <SettingRow
            icon={<Palette size={14} />}
            label="Theme"
            description="Basculez entre le mode clair et sombre via le toggle dans la sidebar."
          >
            <span className="text-[11px] text-ink-3 font-body font-medium bg-surface-2 px-3 py-1.5 rounded-lg">
              Via sidebar
            </span>
          </SettingRow>

          <SettingRow
            icon={<Globe size={14} />}
            label="Langue"
            description="Choisissez la langue de l'interface."
          >
            <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5">
              <button
                onClick={() => setLanguage('fr')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-[12px] font-semibold font-body transition-all duration-200',
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
                  'px-3 py-1.5 rounded-md text-[12px] font-semibold font-body transition-all duration-200',
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

        {/* ── Security ─────────────────────────────────────────── */}
        <SectionCard
          icon={<Shield size={16} className="text-[#00B894]" />}
          title="Securite"
          description="Protegez votre compte avec des parametres de securite avances."
          accentColor="#00B894"
        >
          <SettingRow
            icon={<Lock size={14} />}
            label="Changer le mot de passe"
            description="Modifiez votre mot de passe actuel."
          >
            <button
              className={cn(
                'h-8 px-4 rounded-lg border border-border/80 bg-white/80 backdrop-blur-sm',
                'text-[12px] font-semibold font-body text-ink-2 flex items-center gap-1.5',
                'hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md hover:shadow-violet/10',
                'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
              )}
            >
              Modifier
              <ChevronRight size={13} />
            </button>
          </SettingRow>

          <SettingRow
            icon={<Smartphone size={14} />}
            label="Authentification a deux facteurs"
            description="Ajoutez une couche de securite supplementaire avec la 2FA."
          >
            <div className="flex items-center gap-2">
              {twoFa && (
                <span className="text-[10px] font-bold text-[#00B894] bg-[#00B894]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Actif
                </span>
              )}
              <Toggle enabled={twoFa} onToggle={() => setTwoFa(!twoFa)} />
            </div>
          </SettingRow>
        </SectionCard>

        {/* ── Data ─────────────────────────────────────────────── */}
        <SectionCard
          icon={<Database size={16} className="text-[#D4A017]" />}
          title="Donnees"
          description="Exportez ou supprimez vos donnees personnelles."
          accentColor="#D4A017"
        >
          <SettingRow
            icon={<Download size={14} />}
            label="Exporter mes donnees"
            description="Telechargez une copie de toutes vos donnees au format JSON."
          >
            <button
              onClick={handleExportData}
              className={cn(
                'h-8 px-4 rounded-lg border',
                'text-[12px] font-semibold font-body flex items-center gap-1.5',
                'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                exportSuccess
                  ? 'border-[#00B894] bg-[#00B894]/10 text-[#00B894]'
                  : 'border-border/80 bg-white/80 backdrop-blur-sm text-ink-2 hover:border-violet hover:text-violet hover:bg-violet-ghost hover:shadow-md hover:shadow-violet/10',
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

          <div className="pt-3.5">
            <div className="flex items-start gap-3">
              <span className="text-ink-3 shrink-0 mt-0.5">
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
                      'mt-3 h-8 px-4 rounded-lg border border-[#E8334A]/30',
                      'text-[12px] font-semibold font-body text-[#E8334A] flex items-center gap-1.5',
                      'hover:bg-[#E8334A]/5 hover:border-[#E8334A]/50 hover:shadow-md hover:shadow-[#E8334A]/10',
                      'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
                    )}
                  >
                    <Trash2 size={13} />
                    Supprimer le compte
                  </button>
                ) : (
                  <div className="mt-3 p-4 rounded-lg bg-[#E8334A]/5 border border-[#E8334A]/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={14} className="text-[#E8334A]" />
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
                          'h-8 px-3 rounded-lg border border-border/80 bg-white text-[12px] font-mono font-body text-ink',
                          'focus:outline-none focus:ring-2 focus:ring-[#E8334A]/30 focus:border-[#E8334A]/50',
                          'placeholder:text-ink-3/40 w-32',
                        )}
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'SUPPRIMER'}
                        className={cn(
                          'h-8 px-4 rounded-lg text-[12px] font-semibold font-body transition-all duration-200',
                          deleteConfirmText === 'SUPPRIMER'
                            ? 'bg-[#E8334A] text-white shadow-md shadow-[#E8334A]/20 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-ink-3/10 text-ink-3/40 cursor-not-allowed',
                        )}
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="h-8 px-3 rounded-lg text-[12px] font-semibold font-body text-ink-3 hover:text-ink transition-colors"
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
      </div>
    </div>
  );
}
