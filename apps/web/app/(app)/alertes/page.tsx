'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  Plus,
  Trash2,
  Package,
  Zap,
  AlertTriangle,
  TrendingUp,
  Shield,
  Activity,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { ToastContainer, useToast } from '@/components/ui/toast';
import {
  useAlertsStore,
  type AlertMetric,
  type AlertCondition,
  type PriceAlert,
} from '@/stores/alerts-store';
import { DEMO_PRODUCTS } from '@/lib/demo-data';

// ─── Constants ────────────────────────────────────────────────────────────────

const METRIC_CONFIG: Record<AlertMetric, { label: string; icon: LucideIcon; unit: string; color: string }> = {
  coupon: { label: 'Coupon', icon: TrendingUp, unit: '%', color: '#00B894' },
  barriere: { label: 'Barrière', icon: Shield, unit: '%', color: '#3B1FA8' },
  gainMax: { label: 'Gain max', icon: Activity, unit: '%', color: '#D4A017' },
  sri: { label: 'SRI', icon: AlertTriangle, unit: '/7', color: '#E8334A' },
  maturite: { label: 'Maturité', icon: Calendar, unit: ' ans', color: '#5535C4' },
};

const CONDITION_CONFIG: Record<AlertCondition, { label: string; longLabel: string; symbol: string }> = {
  gte: { label: '≥', longLabel: 'Supérieur ou égal à', symbol: '≥' },
  lte: { label: '≤', longLabel: 'Inférieur ou égal à', symbol: '≤' },
  eq: { label: '=', longLabel: 'Égal à', symbol: '=' },
};

const METRIC_OPTIONS = (Object.keys(METRIC_CONFIG) as AlertMetric[]).map((key) => ({
  value: key,
  label: METRIC_CONFIG[key].label,
}));

const CONDITION_OPTIONS = (Object.keys(CONDITION_CONFIG) as AlertCondition[]).map((key) => ({
  value: key,
  label: CONDITION_CONFIG[key].longLabel,
  description: CONDITION_CONFIG[key].symbol,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Alert Card ──────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onToggle,
  onRemove,
}: {
  alert: PriceAlert;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const metricConf = METRIC_CONFIG[alert.metric];
  const condConf = CONDITION_CONFIG[alert.condition];
  const Icon = metricConf.icon;

  return (
    <div
      className={cn(
        'group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-white dark:bg-white/5 shadow-sm transition-all duration-200',
        alert.enabled
          ? 'border-border/60 hover:border-violet/40 hover:shadow-md'
          : 'border-border/40 opacity-60',
      )}
    >
      {/* Left accent line */}
      {alert.enabled && (
        <span
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: `linear-gradient(180deg, ${metricConf.color} 0%, ${metricConf.color}80 100%)` }}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
        style={{
          background: `linear-gradient(135deg, ${metricConf.color}18 0%, ${metricConf.color}08 100%)`,
          boxShadow: `inset 0 0 0 1px ${metricConf.color}20`,
        }}
      >
        <Icon size={18} style={{ color: metricConf.color }} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-display text-[15px] font-bold text-ink leading-tight">
            {metricConf.label}
            <span className="text-ink-3 font-normal mx-1.5 text-[13px]">{condConf.symbol}</span>
            <span className="tabular-nums">
              {alert.threshold}
              {metricConf.unit}
            </span>
          </h3>
          {alert.triggered && (
            <Badge variant="gold" size="sm">
              Déclenchée
            </Badge>
          )}
          {!alert.enabled && (
            <Badge variant="muted" size="sm">
              Désactivée
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[12px] font-body text-ink-3">
          {alert.productName ? (
            <span className="inline-flex items-center gap-1">
              <Package size={11} />
              {alert.productName}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Zap size={11} />
              Tous les produits
            </span>
          )}
          <span className="text-ink-3/60">•</span>
          <span>Créée {formatRelativeTime(alert.createdAt)}</span>
          {alert.triggered && alert.triggeredAt && (
            <>
              <span className="text-ink-3/60">•</span>
              <span className="text-gold font-semibold">Déclenchée {formatRelativeTime(alert.triggeredAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={alert.enabled}
          aria-label={alert.enabled ? 'Désactiver l\u2019alerte' : 'Activer l\u2019alerte'}
          onClick={() => onToggle(alert.id)}
          className={cn(
            'relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2',
            alert.enabled ? 'bg-violet' : 'bg-surface-2 border border-border',
          )}
        >
          <span
            className={cn(
              'inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
              alert.enabled ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>

        {/* Remove */}
        <button
          type="button"
          aria-label="Supprimer l'alerte"
          onClick={() => onRemove(alert.id)}
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-md text-ink-3',
            'hover:bg-red/10 hover:text-red transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red',
          )}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Create Alert Modal ──────────────────────────────────────────────────────

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId?: string;
    productName?: string;
    metric: AlertMetric;
    condition: AlertCondition;
    threshold: number;
  }) => void;
  initialProductId?: string;
  initialProductName?: string;
}

function CreateAlertModal({
  isOpen,
  onClose,
  onSubmit,
  initialProductId,
  initialProductName,
}: CreateAlertModalProps) {
  const [metric, setMetric] = useState<AlertMetric>('coupon');
  const [condition, setCondition] = useState<AlertCondition>('gte');
  const [threshold, setThreshold] = useState<string>('7');
  const [productId, setProductId] = useState<string>(initialProductId ?? '');
  const [error, setError] = useState<string | null>(null);

  // Reset on open to sync with props changes (e.g. querystring preselect)
  useEffect(() => {
    if (isOpen) {
      setMetric('coupon');
      setCondition('gte');
      setThreshold('7');
      setProductId(initialProductId ?? '');
      setError(null);
    }
  }, [isOpen, initialProductId]);

  const productOptions = useMemo(
    () => [
      { value: '', label: 'Tous les produits', description: 'Alerte globale sur le catalogue' },
      ...DEMO_PRODUCTS.map((p) => ({
        value: p.id,
        label: p.name,
        description: p.isin,
      })),
    ],
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(threshold);
    if (!Number.isFinite(num)) {
      setError('Veuillez saisir un nombre valide.');
      return;
    }
    if (metric === 'sri' && (num < 1 || num > 7)) {
      setError('Le SRI doit être compris entre 1 et 7.');
      return;
    }
    if (metric !== 'sri' && num < 0) {
      setError('La valeur doit être positive.');
      return;
    }

    const selectedProduct = productId
      ? DEMO_PRODUCTS.find((p) => p.id === productId)
      : null;

    onSubmit({
      productId: productId || undefined,
      productName: selectedProduct?.name ?? initialProductName,
      metric,
      condition,
      threshold: num,
    });
  };

  const metricConf = METRIC_CONFIG[metric];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer une alerte" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Metric */}
        <Select
          label="Métrique"
          value={metric}
          onChange={(v) => {
            setMetric(v as AlertMetric);
            setError(null);
          }}
          options={METRIC_OPTIONS}
        />

        {/* Condition */}
        <Select
          label="Condition"
          value={condition}
          onChange={(v) => setCondition(v as AlertCondition)}
          options={CONDITION_OPTIONS}
        />

        {/* Threshold */}
        <Input
          label={`Seuil (${metricConf.unit.trim() || 'valeur'})`}
          type="number"
          inputMode="decimal"
          step={metric === 'sri' ? '1' : '0.1'}
          min={metric === 'sri' ? 1 : 0}
          max={metric === 'sri' ? 7 : undefined}
          value={threshold}
          onChange={(e) => {
            setThreshold(e.target.value);
            setError(null);
          }}
          hint={
            metric === 'sri'
              ? 'Indicateur synthétique de risque entre 1 et 7.'
              : metric === 'maturite'
                ? 'Durée en années jusqu\u2019à l\u2019échéance.'
                : 'Exprimé en pourcentage.'
          }
          error={error ?? undefined}
        />

        {/* Product */}
        <Select
          label="Produit (optionnel)"
          value={productId}
          onChange={setProductId}
          options={productOptions}
          searchable
        />

        {/* Preview */}
        <div
          className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3"
          aria-live="polite"
        >
          <metricConf.icon size={16} style={{ color: metricConf.color }} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold font-body">
              Aperçu
            </p>
            <p className="font-display text-sm font-bold text-ink mt-0.5">
              {metricConf.label}{' '}
              <span className="text-ink-3 font-normal">{CONDITION_CONFIG[condition].symbol}</span>{' '}
              <span className="tabular-nums">
                {threshold || 0}
                {metricConf.unit}
              </span>
            </p>
            <p className="text-[11px] text-ink-3 font-body mt-0.5 truncate">
              {productId
                ? `Sur ${DEMO_PRODUCTS.find((p) => p.id === productId)?.name ?? 'produit sélectionné'}`
                : 'Sur tous les produits du catalogue'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="muted" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary">
            <Bell size={14} />
            Créer l&rsquo;alerte
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertesPage() {
  const searchParams = useSearchParams();
  const alerts = useAlertsStore((s) => s.alerts);
  const addAlert = useAlertsStore((s) => s.add);
  const removeAlert = useAlertsStore((s) => s.remove);
  const toggleAlert = useAlertsStore((s) => s.toggle);
  const clearAll = useAlertsStore((s) => s.clearAll);

  const { toasts, success, dismiss } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.title = "Alertes | Strick'in";
  }, []);

  // Pre-open modal if query string provides a product context
  const preselectProductId = searchParams.get('product') ?? undefined;
  const preselectProductName = searchParams.get('productName') ?? undefined;

  useEffect(() => {
    if (preselectProductId) {
      setModalOpen(true);
    }
  }, [preselectProductId]);

  const activeCount = alerts.filter((a) => a.enabled).length;
  const triggeredCount = alerts.filter((a) => a.triggered).length;

  const handleSubmit = (data: {
    productId?: string;
    productName?: string;
    metric: AlertMetric;
    condition: AlertCondition;
    threshold: number;
  }) => {
    addAlert(data);
    setModalOpen(false);
    success('Alerte créée', { title: 'Configuration enregistrée' });
  };

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          icon={Bell}
          title="Mes alertes"
          subtitle="Soyez notifié dès qu'une opportunité correspond à vos critères."
        >
          {alerts.length > 0 && (
            <Button variant="muted" size="sm" onClick={clearAll}>
              <Trash2 size={13} />
              Tout effacer
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} />
            Créer une alerte
          </Button>
        </PageHeader>

        {/* Summary */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-white dark:bg-white/5 p-4">
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold font-body">Total</span>
              <span className="font-display text-2xl font-bold text-ink tabular-nums">{alerts.length}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-white dark:bg-white/5 p-4">
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold font-body">Actives</span>
              <span className="font-display text-2xl font-bold text-teal tabular-nums">{activeCount}</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-white dark:bg-white/5 p-4">
              <span className="text-[9px] uppercase tracking-widest text-ink-3 font-semibold font-body">Déclenchées</span>
              <span className="font-display text-2xl font-bold text-gold tabular-nums">{triggeredCount}</span>
            </div>
          </div>
        )}

        {/* List */}
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-white dark:bg-white/5">
            <EmptyState
              icon={Bell}
              title="Aucune alerte configurée"
              description="Créez votre première alerte pour être notifié des opportunités."
              actionLabel="Créer une alerte"
              onAction={() => setModalOpen(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={toggleAlert}
                onRemove={removeAlert}
              />
            ))}
          </div>
        )}
      </main>

      <CreateAlertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialProductId={preselectProductId}
        initialProductName={preselectProductName}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
