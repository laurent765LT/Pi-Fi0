'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ClipboardCheck, Search, ArrowUpDown, Check, X,
  TrendingUp, Clock, CheckCircle2, Euro,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { ToastContainer, useToast } from '@/components/ui/toast';
import {
  ENGAGEMENTS, ENVELOPPES, PRODUITS,
  formatMontant, formatMontantFull, formatDateShortFR,
  STATUT_ENGAGEMENT,
  type Engagement,
} from '@/lib/mock-data-assureur';

// ─── Types ──────────────────────────────────────────────────────────────────

type EngagementStatut = Engagement['statut'] | 'REJETE';
type TabKey = 'en_attente' | 'tous' | 'confirmes' | 'rejetes';
type SortKey = 'date' | 'montant' | 'statut';
type SortDir = 'asc' | 'desc';

// Extended statut config (adding REJETE to the existing mock config)
const STATUT_CONFIG: Record<EngagementStatut, { bg: string; text: string; label: string }> = {
  CONFIRME: { bg: '#D1FAE5', text: '#059669', label: 'Confirme' },
  EN_ATTENTE: { bg: '#FEF3C7', text: '#D97706', label: 'En attente' },
  LISTE_ATTENTE: { bg: '#DBEAFE', text: '#2563EB', label: 'Liste d\'attente' },
  REJETE: { bg: '#FEE2E2', text: '#DC2626', label: 'Rejete' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveProductName(enveloppeId: string): string {
  const env = ENVELOPPES.find((e) => e.id === enveloppeId);
  if (!env) return '—';
  const produit = PRODUITS.find((p) => p.id === env.produitId);
  return produit?.nom ?? '—';
}

// ─── Reject Modal ───────────────────────────────────────────────────────────

function RejectModal({
  engagementId,
  distributeur,
  onConfirm,
  onCancel,
}: {
  engagementId: string;
  distributeur: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-ink rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
        {/* Header accent */}
        <div className="h-[3px] bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />

        <div className="p-6">
          <h3 className="font-display font-bold text-[18px] text-ink dark:text-white mb-1">
            Rejeter l&apos;engagement
          </h3>
          <p className="text-[13px] text-ink-3 font-body mb-5">
            Vous etes sur le point de rejeter l&apos;engagement de <strong className="text-ink dark:text-white">{distributeur}</strong>.
            Veuillez indiquer le motif du refus.
          </p>

          <label className="block text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-3 font-body mb-1.5">
            Motif du refus
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex: Depassement du plafond de surbooking, documentation incomplete..."
            className="w-full rounded-lg border border-border/60 bg-surface dark:bg-white/5 text-[13px] font-body text-ink dark:text-white placeholder:text-ink-4 p-3 resize-none focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none transition-all"
          />

          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={onCancel}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold font-body text-ink-2 hover:bg-surface-2 dark:hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim()}
              className={cn(
                'h-9 px-5 rounded-lg text-[13px] font-semibold font-body text-white transition-all shadow-sm',
                reason.trim()
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                  : 'bg-red-300 cursor-not-allowed',
              )}
            >
              Confirmer le rejet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Validate Modal ─────────────────────────────────────────────────

function ValidateModal({
  distributeur,
  montant,
  onConfirm,
  onCancel,
}: {
  distributeur: string;
  montant: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-ink rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-teal via-emerald-400 to-cyan-400" />
        <div className="p-6">
          <h3 className="font-display font-bold text-[18px] text-ink dark:text-white mb-1">
            Valider l&apos;engagement
          </h3>
          <p className="text-[13px] text-ink-3 font-body mb-5">
            Confirmez-vous la validation de l&apos;engagement de{' '}
            <strong className="text-ink dark:text-white">{distributeur}</strong> pour un montant de{' '}
            <strong className="text-ink dark:text-white">{formatMontantFull(montant)}</strong> ?
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="h-9 px-4 rounded-lg text-[13px] font-semibold font-body text-ink-2 hover:bg-surface-2 dark:hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="h-9 px-5 rounded-lg text-[13px] font-semibold font-body text-white bg-teal hover:bg-teal/90 shadow-sm shadow-teal/20 transition-all"
            >
              Confirmer la validation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function EngagementsPage() {
  // Status overrides — local state replaces mock statuses
  const [statusOverrides, setStatusOverrides] = useState<Record<string, EngagementStatut>>({});
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>('en_attente');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Modals
  const [validateTarget, setValidateTarget] = useState<Engagement | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Engagement | null>(null);

  // Toast
  const { toasts, success, error: toastError, dismiss } = useToast();

  // ── Derive effective statuses ──
  const getEffectiveStatut = useCallback(
    (eng: Engagement): EngagementStatut => statusOverrides[eng.id] ?? eng.statut,
    [statusOverrides],
  );

  // ── Actions ──
  const handleValidate = useCallback(
    (eng: Engagement) => {
      setStatusOverrides((prev) => ({ ...prev, [eng.id]: 'CONFIRME' }));
      setValidateTarget(null);
      success(`Engagement ${eng.id} valide`, { title: 'Engagement valide' });
    },
    [success],
  );

  const handleReject = useCallback(
    (eng: Engagement, reason: string) => {
      setStatusOverrides((prev) => ({ ...prev, [eng.id]: 'REJETE' }));
      setRejectReasons((prev) => ({ ...prev, [eng.id]: reason }));
      setRejectTarget(null);
      toastError(`Engagement ${eng.id} rejete`, { title: 'Engagement rejete' });
    },
    [toastError],
  );

  // ── Sort toggle ──
  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey],
  );

  // ── Filtered + sorted engagements ──
  const engagements = useMemo(() => {
    let list = ENGAGEMENTS.map((eng) => ({
      ...eng,
      effectiveStatut: getEffectiveStatut(eng),
      productName: resolveProductName(eng.enveloppeId),
    }));

    // Tab filter
    if (activeTab === 'en_attente') {
      list = list.filter((e) => e.effectiveStatut === 'EN_ATTENTE' || e.effectiveStatut === 'LISTE_ATTENTE');
    } else if (activeTab === 'confirmes') {
      list = list.filter((e) => e.effectiveStatut === 'CONFIRME');
    } else if (activeTab === 'rejetes') {
      list = list.filter((e) => e.effectiveStatut === 'REJETE');
    }
    // 'tous' = no filter

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.distributeur.toLowerCase().includes(q) ||
          e.productName.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortKey === 'montant') {
        cmp = a.montant - b.montant;
      } else if (sortKey === 'statut') {
        const order: Record<EngagementStatut, number> = { EN_ATTENTE: 0, LISTE_ATTENTE: 1, CONFIRME: 2, REJETE: 3 };
        cmp = (order[a.effectiveStatut] ?? 99) - (order[b.effectiveStatut] ?? 99);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [activeTab, search, sortKey, sortDir, getEffectiveStatut]);

  // ── KPI computations ──
  const allWithStatut = useMemo(
    () => ENGAGEMENTS.map((e) => ({ ...e, effectiveStatut: getEffectiveStatut(e) })),
    [getEffectiveStatut],
  );

  const totalEngagements = allWithStatut.length;
  const pendingCount = allWithStatut.filter((e) => e.effectiveStatut === 'EN_ATTENTE' || e.effectiveStatut === 'LISTE_ATTENTE').length;
  const confirmedCount = allWithStatut.filter((e) => e.effectiveStatut === 'CONFIRME').length;
  const totalVolume = allWithStatut.reduce((s, e) => s + e.montant, 0);

  // ── Tab config ──
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'en_attente', label: 'En attente', count: pendingCount },
    { key: 'tous', label: 'Tous', count: totalEngagements },
    { key: 'confirmes', label: 'Confirmes', count: confirmedCount },
    { key: 'rejetes', label: 'Rejetes', count: allWithStatut.filter((e) => e.effectiveStatut === 'REJETE').length },
  ];

  // ── Sortable header ──
  function SortHeader({ label, sortId }: { label: string; sortId: SortKey }) {
    const isActive = sortKey === sortId;
    return (
      <button
        onClick={() => toggleSort(sortId)}
        className={cn(
          'inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-semibold transition-colors',
          isActive ? 'text-violet' : 'text-ink-3 hover:text-ink-2',
        )}
      >
        {label}
        <ArrowUpDown size={10} className={isActive ? 'text-violet' : 'text-ink-4'} />
      </button>
    );
  }

  return (
    <div>
      <PageHeader
        icon={ClipboardCheck}
        title="Gestion des engagements"
        subtitle="Validation, suivi et historique des engagements CGP"
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: TrendingUp,
            label: 'Total engagements',
            value: totalEngagements,
            accent: 'from-violet/10 to-cobalt/10',
            iconColor: 'text-violet',
          },
          {
            icon: Clock,
            label: 'En attente de validation',
            value: pendingCount,
            accent: 'from-amber-100 to-amber-50',
            iconColor: 'text-amber-600',
          },
          {
            icon: CheckCircle2,
            label: 'Confirmes',
            value: confirmedCount,
            accent: 'from-teal/10 to-emerald-100',
            iconColor: 'text-teal',
          },
          {
            icon: Euro,
            label: 'Volume total',
            value: formatMontant(totalVolume),
            accent: 'from-violet/10 to-cobalt/10',
            iconColor: 'text-violet',
          },
        ].map(({ icon: Icon, label, value, accent, iconColor }) => (
          <div
            key={label}
            className="relative overflow-hidden group bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm p-5"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet/60 to-teal/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br', accent)}>
              <Icon size={16} className={iconColor} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold block font-body text-ink-3 dark:text-white/40">
              {label}
            </span>
            <span className="text-[20px] font-display font-bold text-ink dark:text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-lg border border-border/60 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'h-8 px-3 rounded-md text-[12px] font-semibold font-body transition-all flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-violet text-white shadow-sm'
                  : 'bg-surface-2 dark:bg-white/5 text-ink-2 dark:text-ink-4 hover:bg-surface-3 dark:hover:bg-white/10',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1',
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-ink/5 dark:bg-white/10 text-ink-3 dark:text-white/50',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[360px] sm:ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3 dark:text-ink-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par CGP, produit..."
            className="w-full h-9 rounded-md pl-9 pr-3 text-[13px] font-body border border-border/60 bg-white dark:bg-white/5 text-ink dark:text-white placeholder:text-ink-4 focus:ring-2 focus:ring-violet/30 focus:border-violet/50 transition-all outline-none"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <table className="w-full text-[13px] font-body">
          <thead>
            <tr className="bg-surface dark:bg-white/5 border-b border-border/60">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">CGP</th>
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">Produit</th>
              <th className="px-4 py-3 text-right">
                <SortHeader label="Montant" sortId="montant" />
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader label="Date" sortId="date" />
              </th>
              <th className="px-4 py-3 text-center">
                <SortHeader label="Statut" sortId="statut" />
              </th>
              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {engagements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink-3 dark:text-white/40 text-[13px]">
                  Aucun engagement ne correspond aux filtres selectionnes.
                </td>
              </tr>
            )}
            {engagements.map((eng) => {
              const statut = eng.effectiveStatut;
              const cfg = STATUT_CONFIG[statut];
              const rejectedReason = rejectReasons[eng.id];

              return (
                <tr
                  key={eng.id}
                  className="border-b border-border/40 hover:bg-violet/[0.03] transition-colors"
                >
                  {/* CGP */}
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-ink dark:text-white">{eng.distributeur}</p>
                    <p className="text-[11px] text-ink-3 font-mono">{eng.id}</p>
                  </td>

                  {/* Produit */}
                  <td className="px-4 py-3.5">
                    <p className="text-ink dark:text-white">{eng.productName}</p>
                  </td>

                  {/* Montant */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono font-semibold text-ink dark:text-white">
                      {formatMontantFull(eng.montant)}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-mono text-ink-2">{formatDateShortFR(eng.date)}</span>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: cfg.bg, color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                    {statut === 'REJETE' && rejectedReason && (
                      <p className="text-[10px] text-red-400 mt-1 max-w-[160px] mx-auto truncate" title={rejectedReason}>
                        {rejectedReason}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    {(statut === 'EN_ATTENTE' || statut === 'LISTE_ATTENTE') && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setValidateTarget(eng)}
                          className="h-7 px-3 rounded-md text-[11px] font-semibold font-body text-white bg-teal hover:bg-teal/90 shadow-sm shadow-teal/20 transition-all flex items-center gap-1"
                        >
                          <Check size={12} />
                          Valider
                        </button>
                        <button
                          onClick={() => setRejectTarget(eng)}
                          className="h-7 px-3 rounded-md text-[11px] font-semibold font-body text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all flex items-center gap-1"
                        >
                          <X size={12} />
                          Rejeter
                        </button>
                      </div>
                    )}
                    {statut === 'CONFIRME' && (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal/10">
                        <Check size={14} className="text-teal" />
                      </span>
                    )}
                    {statut === 'REJETE' && (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50">
                        <X size={14} className="text-red-500" />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}
      {validateTarget && (
        <ValidateModal
          distributeur={validateTarget.distributeur}
          montant={validateTarget.montant}
          onConfirm={() => handleValidate(validateTarget)}
          onCancel={() => setValidateTarget(null)}
        />
      )}

      {rejectTarget && (
        <RejectModal
          engagementId={rejectTarget.id}
          distributeur={rejectTarget.distributeur}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
