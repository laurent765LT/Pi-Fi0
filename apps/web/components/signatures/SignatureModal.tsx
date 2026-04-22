'use client';

// ─── components/signatures/SignatureModal.tsx ────────────────────────────────
// Modal plein écran pour créer une demande de signature électronique.
// Sections : Signataires → Type de signature → Message personnel → Succès.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PenTool,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  X,
  User as UserIcon,
  ShieldCheck,
  Lock,
  ScrollText,
  FileCheck2,
  ArrowRight,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SIGNATURE_LEVEL_LABELS,
  SIGNATURE_LEVEL_DESCRIPTIONS,
  SIGNER_ROLE_LABELS,
  DOCUMENT_TYPE_LABELS,
  type SignatureLevel,
  type SignatureDocumentType,
  type SignerRole,
  type SignatureRequest,
} from '@/lib/yousign/types';
import { useSignaturesStore } from '@/stores/signatures-store';

// ─── Local form types ───────────────────────────────────────────────────────

interface SignerDraft {
  id: string; // local-only, regenerated on save
  firstName: string;
  lastName: string;
  email: string;
  role: SignerRole;
  order: number;
}

function localId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  documentName: string;
  documentType: SignatureDocumentType;
  documentHtml?: string;
  /** Pré-remplir des signataires (ex. CGP + Client depuis un dossier) */
  defaultSigners?: Array<Omit<SignerDraft, 'id'>>;
  /** Appel après succès, typiquement pour afficher un toast parent */
  onCreated?: (req: SignatureRequest) => void;
}

export function SignatureModal({
  open,
  onClose,
  documentName,
  documentType,
  documentHtml,
  defaultSigners,
  onCreated,
}: SignatureModalProps) {
  const create = useSignaturesStore((s) => s.create);

  // ─── State ─────────────────────────────────────────────────────────────
  const [signers, setSigners] = useState<SignerDraft[]>(() =>
    (defaultSigners ?? [
      { firstName: '', lastName: '', email: '', role: 'cgp', order: 1 },
      { firstName: '', lastName: '', email: '', role: 'client', order: 2 },
    ]).map((s) => ({ ...s, id: localId() })),
  );
  const [level, setLevel] = useState<SignatureLevel>('advanced');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SignatureRequest | null>(null);

  // Reset content when re-opened with different doc
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
    }
  }, [open, documentName]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const canSubmit = useMemo(() => {
    if (signers.length === 0) return false;
    return signers.every(
      (s) =>
        s.firstName.trim() &&
        s.lastName.trim() &&
        validEmail(s.email.trim()),
    );
  }, [signers]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const addSigner = () => {
    setSigners((prev) => [
      ...prev,
      {
        id: localId(),
        firstName: '',
        lastName: '',
        email: '',
        role: 'co-souscripteur',
        order: prev.length + 1,
      },
    ]);
  };

  const removeSigner = (id: string) => {
    setSigners((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, order: idx + 1 })),
    );
  };

  const updateSigner = (id: string, patch: Partial<SignerDraft>) => {
    setSigners((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await create({
        documentName,
        documentType,
        documentHtml,
        level,
        message: message.trim() || undefined,
        signers: signers.map(({ id: _id, ...rest }) => rest),
      });
      setSuccess(created);
      onCreated?.(created);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible d'envoyer la demande. Veuillez réessayer.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4 animate-in fade-in duration-150"
    >
      <div className="relative bg-white dark:bg-ink w-full sm:max-w-3xl sm:rounded-xl shadow-lg flex flex-col max-h-screen sm:max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-violet/6 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet to-violet-mid text-white flex items-center justify-center shrink-0">
              <PenTool size={16} />
            </div>
            <div className="min-w-0">
              <h2
                id="signature-modal-title"
                className="font-display font-bold text-base text-ink dark:text-white truncate"
              >
                Signature électronique
              </h2>
              <p className="font-body text-[11.5px] text-ink-3 truncate">
                {DOCUMENT_TYPE_LABELS[documentType]} — {documentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {success ? (
            <SuccessScreen request={success} onClose={onClose} />
          ) : (
            <>
              {/* Section 1: Signers */}
              <section aria-labelledby="section-signers">
                <SectionTitle
                  icon={UserIcon}
                  id="section-signers"
                  title="Signataires"
                  description="Ajoutez les personnes qui doivent signer le document, dans l'ordre voulu."
                />
                <div className="flex flex-col gap-3 mt-3">
                  {signers.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-border bg-surface p-3 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-full bg-violet text-white flex items-center justify-center text-[11px] font-bold"
                            aria-hidden="true"
                          >
                            {idx + 1}
                          </span>
                          <span className="font-body text-[11px] uppercase tracking-widest font-bold text-ink-3">
                            Signataire #{s.order}
                          </span>
                        </div>
                        {signers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSigner(s.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-red hover:bg-red/8 px-2 py-1 rounded"
                          >
                            <Trash2 size={11} />
                            Retirer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Input
                          label="Prénom"
                          value={s.firstName}
                          onChange={(e) =>
                            updateSigner(s.id, { firstName: e.target.value })
                          }
                          placeholder="Jean"
                        />
                        <Input
                          label="Nom"
                          value={s.lastName}
                          onChange={(e) =>
                            updateSigner(s.id, { lastName: e.target.value })
                          }
                          placeholder="Dupont"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Input
                          label="Email"
                          type="email"
                          value={s.email}
                          onChange={(e) =>
                            updateSigner(s.id, { email: e.target.value })
                          }
                          placeholder="jean.dupont@exemple.fr"
                          error={
                            s.email.length > 0 && !validEmail(s.email)
                              ? 'Email invalide'
                              : undefined
                          }
                        />
                        <div className="flex flex-col gap-1.5 w-full">
                          <label
                            htmlFor={`${s.id}-role`}
                            className="font-body text-[13px] font-semibold text-ink-2"
                          >
                            Rôle
                          </label>
                          <select
                            id={`${s.id}-role`}
                            value={s.role}
                            onChange={(e) =>
                              updateSigner(s.id, {
                                role: e.target.value as SignerRole,
                              })
                            }
                            className="h-9 rounded-md bg-surface-2 border border-border-2 px-3 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet"
                          >
                            {(
                              Object.keys(SIGNER_ROLE_LABELS) as SignerRole[]
                            ).map((r) => (
                              <option key={r} value={r}>
                                {SIGNER_ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSigner}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-body font-semibold text-violet hover:text-violet-dark px-3 py-1.5 rounded-md bg-violet-pale hover:bg-violet-pale/80 transition-colors"
                >
                  <Plus size={13} />
                  Ajouter un signataire
                </button>
              </section>

              {/* Section 2: Level */}
              <section aria-labelledby="section-level">
                <SectionTitle
                  icon={ShieldCheck}
                  id="section-level"
                  title="Type de signature"
                  description="Choisissez le niveau de garantie juridique."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-3">
                  {(Object.keys(SIGNATURE_LEVEL_LABELS) as SignatureLevel[]).map(
                    (lvl) => {
                      const Icon = lvl === 'qualified' ? Lock : ScrollText;
                      const active = level === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLevel(lvl)}
                          className={cn(
                            'rounded-lg border text-left p-3 transition-all',
                            active
                              ? 'border-violet bg-violet-pale shadow-xs'
                              : 'border-border bg-white hover:border-violet/40 hover:bg-violet-pale/30',
                          )}
                          aria-pressed={active}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon
                              size={14}
                              className={active ? 'text-violet' : 'text-ink-3'}
                            />
                            <span
                              className={cn(
                                'font-display font-bold text-[13px]',
                                active ? 'text-violet' : 'text-ink',
                              )}
                            >
                              {SIGNATURE_LEVEL_LABELS[lvl]}
                            </span>
                          </div>
                          <p className="font-body text-[11px] text-ink-3 leading-snug">
                            {SIGNATURE_LEVEL_DESCRIPTIONS[lvl]}
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>
              </section>

              {/* Section 3: Personal message */}
              <section aria-labelledby="section-message">
                <SectionTitle
                  icon={Info}
                  id="section-message"
                  title="Message personnel"
                  description="Accompagnez l'envoi d'un mot pour vos signataires (optionnel)."
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, merci de signer ce document avant le ..."
                  rows={4}
                  maxLength={2000}
                  className="mt-3 w-full rounded-md bg-surface-2 border border-border-2 px-3 py-2 text-sm font-body text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-violet focus:border-violet resize-y"
                />
                <p className="mt-1 text-[10.5px] font-body text-ink-3 text-right">
                  {message.length}/2000
                </p>
              </section>

              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red/25 bg-red/8 px-3 py-2 text-sm font-body text-red"
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-surface/50">
            <p className="font-body text-[11px] text-ink-3 flex items-center gap-1.5">
              <Lock size={11} />
              Chiffré bout-en-bout — conforme eIDAS
            </p>
            <div className="flex items-center gap-2">
              <Button variant="muted" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!canSubmit || submitting}
              >
                {!submitting && <PenTool size={14} />}
                Envoyer pour signature
                {!submitting && <ChevronRight size={14} />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Internal bits ──────────────────────────────────────────────────────────

function SectionTitle({
  icon: Icon,
  title,
  description,
  id,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-violet-pale text-violet flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} />
      </div>
      <div>
        <h3
          id={id}
          className="font-display font-bold text-[14px] text-ink dark:text-white leading-tight"
        >
          {title}
        </h3>
        <p className="font-body text-[11.5px] text-ink-3 mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}

function SuccessScreen({
  request,
  onClose,
}: {
  request: SignatureRequest;
  onClose: () => void;
}) {
  return (
    <div className="text-center flex flex-col items-center gap-3 py-6">
      <div className="w-14 h-14 rounded-full bg-teal/10 text-teal flex items-center justify-center">
        <CheckCircle2 size={28} />
      </div>
      <div>
        <h3 className="font-display font-bold text-lg text-ink dark:text-white">
          Demande envoyée !
        </h3>
        <p className="font-body text-sm text-ink-3 mt-1 max-w-md">
          Chaque signataire reçoit un email avec un lien sécurisé Yousign pour
          consulter et signer le document.
        </p>
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-surface/50 px-4 py-3 text-left flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-[11px] font-body text-ink-3 uppercase tracking-widest font-bold">
            Référence
          </span>
          <span className="font-mono text-[11px] text-ink">
            {request.yousignProcedureId}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] font-body text-ink-3 uppercase tracking-widest font-bold">
            Document
          </span>
          <span className="font-body text-[12px] font-semibold text-ink truncate max-w-[60%]">
            {request.documentName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] font-body text-ink-3 uppercase tracking-widest font-bold">
            Signataires
          </span>
          <span className="font-mono text-[11px] text-ink">
            {request.signers.length}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button asChild variant="outline">
          <Link href={`/signatures?highlight=${request.id}`}>
            <FileCheck2 size={14} />
            Suivre la signature
            <ArrowRight size={14} />
          </Link>
        </Button>
        <Button variant="primary" onClick={onClose}>
          Terminer
        </Button>
      </div>
    </div>
  );
}
