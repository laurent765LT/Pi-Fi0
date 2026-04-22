'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Download,
  Archive,
  FileSignature,
  User,
  Brain,
  Target,
  Package,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ToastContainer, useToast } from '@/components/ui/toast';
import {
  useClientsStore,
  FAMILY_SITUATION_LABELS,
  MARKET_KNOWLEDGE_LABELS,
  PRODUCT_EXPERIENCE_LABELS,
  LOSS_TOLERANCE_LABELS,
  INVESTMENT_HORIZON_LABELS,
  OBJECTIVE_LABELS,
  STATUS_LABELS,
  type ClientDossier,
  type DossierStatus,
} from '@/stores/clients-store';
import { DEMO_PRODUCTS } from '@/lib/demo-data';
import {
  DEFAULT_CGP_INFO,
  downloadSingleDocument,
  type GeneratorProduct,
} from '@/lib/regulatory/document-generator';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<DossierStatus, 'gold' | 'teal' | 'muted'> = {
  brouillon: 'gold',
  signe: 'teal',
  archive: 'muted',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '\u2014';
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Document card ──────────────────────────────────────────────────────────

interface DocumentCardProps {
  kind: 'lettre' | 'der' | 'rapport';
  title: string;
  description: string;
  badge: string;
  accent: string;
  onDownload: () => void;
}

function DocumentCard({ title, description, badge, accent, onDownload }: DocumentCardProps) {
  return (
    <div
      className="group relative rounded-xl border bg-white dark:bg-white/[0.03] overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ borderColor: `${accent}33` }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}80)` }}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
              boxShadow: `inset 0 0 0 1px ${accent}20`,
            }}
          >
            <FileText size={20} style={{ color: accent }} strokeWidth={2} />
          </div>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              background: `${accent}15`,
              color: accent,
            }}
          >
            {badge}
          </span>
        </div>

        <h3 className="font-display text-[15px] font-bold text-ink dark:text-white leading-tight mb-1.5">
          {title}
        </h3>
        <p className="font-body text-[12px] text-ink-3 dark:text-white/60 leading-relaxed mb-4 min-h-[38px]">
          {description}
        </p>

        <Button onClick={onDownload} size="sm" className="w-full">
          <Download size={13} />
          T\u00e9l\u00e9charger (PDF)
        </Button>
      </div>
    </div>
  );
}

// ─── Info row ───────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-b-0">
      <dt className="font-body text-[11.5px] text-ink-3 font-medium shrink-0 pt-[1px]">
        {label}
      </dt>
      <dd className="font-body text-[13px] font-semibold text-ink dark:text-white text-right">
        {value}
      </dd>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DossierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const { toasts, success, error: toastError, dismiss } = useToast();

  const getById = useClientsStore((s) => s.getById);
  const sign = useClientsStore((s) => s.sign);
  const archive = useClientsStore((s) => s.archive);
  const remove = useClientsStore((s) => s.remove);

  // Wait for persist rehydration on first paint
  useEffect(() => {
    setHydrated(true);
  }, []);

  const dossier: ClientDossier | undefined = hydrated ? getById(params.id) : undefined;

  const products: GeneratorProduct[] = useMemo(() => {
    if (!dossier) return [];
    return DEMO_PRODUCTS.filter((p) => dossier.proposedProducts.includes(p.id)).map((p) => ({
      id: p.id,
      isin: p.isin,
      name: p.name,
      payoffType: p.payoffType,
      sri: p.sri,
      maturityDate: p.maturityDate,
      underlyingName: p.underlyingName,
    }));
  }, [dossier]);

  if (!hydrated) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse mb-4" />
        <div className="h-96 w-full bg-surface-2/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <PageHeader
          icon={FileText}
          title="Dossier introuvable"
          subtitle="Le dossier demand\u00e9 n\u2019existe pas ou a \u00e9t\u00e9 supprim\u00e9."
        >
          <Button asChild variant="outline">
            <Link href="/dossiers-clients">
              <ArrowLeft size={14} />
              Retour
            </Link>
          </Button>
        </PageHeader>
        <EmptyState
          icon={AlertTriangle}
          title="Aucun dossier \u00e0 afficher"
          description="V\u00e9rifiez le lien utilis\u00e9 ou retournez \u00e0 la liste des dossiers clients."
          actionLabel="Voir tous les dossiers"
          actionHref="/dossiers-clients"
        />
      </div>
    );
  }

  const fullName = `${dossier.firstName} ${dossier.lastName}`.trim();

  const handleDownload = (kind: 'lettre' | 'der' | 'rapport') => {
    const ok = downloadSingleDocument(kind, dossier, DEFAULT_CGP_INFO, products);
    if (!ok) {
      toastError(
        "Les fen\u00eatres sont bloqu\u00e9es. Autorisez les pop-ups pour Strick'in.",
      );
      return;
    }
    success('Document ouvert dans un nouvel onglet.');
  };

  const handleSign = () => {
    if (dossier.status === 'signe') return;
    sign(dossier.id);
    success('Dossier marqu\u00e9 comme sign\u00e9.');
  };

  const handleArchive = () => {
    if (dossier.status === 'archive') return;
    if (!window.confirm('Archiver ce dossier ?')) return;
    archive(dossier.id);
    success('Dossier archiv\u00e9.');
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Supprimer d\u00e9finitivement le dossier de ${fullName} ?`,
      )
    ) {
      return;
    }
    remove(dossier.id);
    router.replace('/dossiers-clients');
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        icon={FileText}
        title={fullName}
        subtitle={`Dossier cr\u00e9\u00e9 le ${formatDate(dossier.createdAt)}`}
      >
        <Button asChild variant="outline">
          <Link href="/dossiers-clients">
            <ArrowLeft size={14} />
            Retour
          </Link>
        </Button>
        {dossier.status !== 'signe' && (
          <Button onClick={handleSign} variant="teal">
            <FileSignature size={14} />
            Marquer comme sign\u00e9
          </Button>
        )}
        {dossier.status !== 'archive' && (
          <Button onClick={handleArchive} variant="muted">
            <Archive size={14} />
            Archiver
          </Button>
        )}
      </PageHeader>

      {/* Status banner */}
      <div
        className={cn(
          'mb-6 rounded-xl border px-4 py-3 flex items-center gap-3',
          dossier.status === 'signe'
            ? 'bg-[#D6F7EF] border-[#A3EDD9]'
            : dossier.status === 'archive'
              ? 'bg-surface-2 border-border'
              : 'bg-[#FDF3D6] border-[#F0D98A]',
        )}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
            dossier.status === 'signe'
              ? 'bg-[#00B894] text-white'
              : dossier.status === 'archive'
                ? 'bg-ink-3 text-white'
                : 'bg-[#D4A017] text-white',
          )}
          aria-hidden="true"
        >
          {dossier.status === 'signe' ? (
            <CheckCircle2 size={16} />
          ) : dossier.status === 'archive' ? (
            <Archive size={16} />
          ) : (
            <Clock size={16} />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[13px] text-ink dark:text-white">
            Statut : {STATUS_LABELS[dossier.status]}
          </p>
          <p className="font-body text-[11.5px] text-ink-2 dark:text-white/70">
            {dossier.status === 'signe' && dossier.signedAt
              ? `Sign\u00e9 le ${formatDate(dossier.signedAt)}.`
              : dossier.status === 'archive'
                ? 'Ce dossier est archiv\u00e9 et ne peut plus \u00eatre modifi\u00e9.'
                : 'Les documents sont pr\u00eats \u00e0 \u00eatre t\u00e9l\u00e9charg\u00e9s puis sign\u00e9s.'}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[dossier.status]} size="md">
          {STATUS_LABELS[dossier.status]}
        </Badge>
      </div>

      {/* Documents section */}
      <section aria-labelledby="documents-title" className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="documents-title"
            className="font-display text-base font-bold text-ink dark:text-white"
          >
            Documents r\u00e9glementaires
          </h2>
          <span className="font-body text-xs text-ink-3">3 documents disponibles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DocumentCard
            kind="lettre"
            title="Lettre de mission"
            description="Engagement CIF/IOBSP d\u00e9finissant l\u2019\u00e9tendue du mandat de conseil et les obligations r\u00e9ciproques."
            badge="CIF"
            accent="#3B1FA8"
            onDownload={() => handleDownload('lettre')}
          />
          <DocumentCard
            kind="der"
            title="Document d\u2019Entr\u00e9e en Relation"
            description="Information pr\u00e9alable sur le cabinet, ses statuts, r\u00e9mun\u00e9rations et autorit\u00e9s de tutelle (AMF, ACPR)."
            badge="DER"
            accent="#5B3FD4"
            onDownload={() => handleDownload('der')}
          />
          <DocumentCard
            kind="rapport"
            title="Rapport d\u2019ad\u00e9quation"
            description="Analyse MIF II de l\u2019ad\u00e9quation des produits recommand\u00e9s au profil et aux objectifs du client."
            badge="MIF II"
            accent="#00B894"
            onDownload={() => handleDownload('rapport')}
          />
        </div>
      </section>

      {/* Details grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DetailsCard
          icon={User}
          title="Informations client"
          accent="#3B1FA8"
        >
          <InfoRow label="Pr\u00e9nom" value={dossier.firstName} />
          <InfoRow label="Nom" value={dossier.lastName} />
          <InfoRow
            label="Date de naissance"
            value={formatDate(dossier.birthDate)}
          />
          <InfoRow
            label="Situation familiale"
            value={FAMILY_SITUATION_LABELS[dossier.familySituation]}
          />
          <InfoRow label="Profession" value={dossier.profession || '\u2014'} />
          <InfoRow
            label="Revenus annuels"
            value={formatAmount(dossier.revenuesAnnuel)}
          />
        </DetailsCard>

        <DetailsCard icon={Brain} title="Profil d\u2019investisseur" accent="#5B3FD4">
          <InfoRow
            label="Connaissance des march\u00e9s"
            value={MARKET_KNOWLEDGE_LABELS[dossier.marketKnowledge]}
          />
          <InfoRow
            label="Exp\u00e9rience produits"
            value={PRODUCT_EXPERIENCE_LABELS[dossier.productExperience]}
          />
          <InfoRow
            label="Tol\u00e9rance aux pertes"
            value={LOSS_TOLERANCE_LABELS[dossier.lossTolerance]}
          />
          <InfoRow
            label="Horizon d\u2019investissement"
            value={INVESTMENT_HORIZON_LABELS[dossier.investmentHorizon]}
          />
        </DetailsCard>

        <DetailsCard icon={Target} title="Objectifs patrimoniaux" accent="#D4A017">
          <div className="flex flex-wrap gap-2 py-2">
            {dossier.objectives.length > 0 ? (
              dossier.objectives.map((obj) => (
                <Badge key={obj} variant="violet" size="md">
                  {OBJECTIVE_LABELS[obj]}
                </Badge>
              ))
            ) : (
              <span className="font-body text-sm text-ink-3 italic">
                Aucun objectif renseign\u00e9.
              </span>
            )}
          </div>
        </DetailsCard>

        <DetailsCard
          icon={Package}
          title={`Produits propos\u00e9s (${products.length})`}
          accent="#00B894"
        >
          <div className="flex flex-col gap-2 py-2">
            {products.length > 0 ? (
              products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-[#F8F6FF] dark:bg-white/5 border border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[12.5px] font-semibold text-ink dark:text-white truncate">
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] text-ink-3">{p.isin}</p>
                  </div>
                  <Badge variant="muted" size="sm">
                    SRI {p.sri ?? '\u2014'}
                  </Badge>
                </div>
              ))
            ) : (
              <span className="font-body text-sm text-ink-3 italic">
                Aucun produit s\u00e9lectionn\u00e9.
              </span>
            )}
          </div>
        </DetailsCard>
      </section>

      {/* Meta footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border bg-white dark:bg-white/[0.03] px-4 py-3 mb-6">
        <div className="flex items-center gap-4 flex-wrap text-[11.5px] font-body text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={11} />
            Cr\u00e9\u00e9 le {formatDate(dossier.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={11} />
            Mis \u00e0 jour le {formatDate(dossier.updatedAt)}
          </span>
          <span className="font-mono text-[10.5px] text-ink-3/70">
            {dossier.id}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md font-body text-xs font-semibold text-red hover:bg-red/10 transition-colors"
        >
          <Trash2 size={12} />
          Supprimer le dossier
        </button>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ─── Details card shell ─────────────────────────────────────────────────────

function DetailsCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof User;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white dark:bg-white/[0.03] p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/60">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
            boxShadow: `inset 0 0 0 1px ${accent}20`,
          }}
        >
          <Icon size={14} style={{ color: accent }} strokeWidth={2} />
        </div>
        <h3 className="font-display text-sm font-bold text-ink dark:text-white">
          {title}
        </h3>
      </div>
      <dl>{children}</dl>
    </div>
  );
}
