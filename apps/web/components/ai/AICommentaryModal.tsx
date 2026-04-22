'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCommentaryStore,
  type ClientProfile,
  type CommentaryParagraph,
  type CommentaryTone,
} from '@/stores/commentary-store';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Minimal product shape required by the commentary modal. */
export interface CommentaryProduct {
  id: string;
  name: string;
  isin?: string | null;
  payoffType: string;
  couponPct?: number | null;
  barrierCapPct?: number | null;
  barrierPct?: number | null;
  underlyingYahoo?: string | null;
  underlyingName?: string | null;
  sri?: number | null;
  maturityDate?: string | null;
}

interface AICommentaryModalProps {
  product: CommentaryProduct;
  open: boolean;
  onClose: () => void;
}

interface ApiResponse {
  paragraphs?: CommentaryParagraph[];
  source?: 'claude' | 'demo';
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROFILE_OPTIONS: { value: ClientProfile; label: string; hint: string }[] = [
  { value: 'prudent', label: 'Prudent', hint: 'Priorité à la préservation du capital' },
  { value: 'equilibre', label: 'Équilibré', hint: 'Équilibre rendement / risque' },
  { value: 'dynamique', label: 'Dynamique', hint: 'Recherche de performance' },
];

const TONE_OPTIONS: { value: CommentaryTone; label: string; hint: string }[] = [
  { value: 'professionnel', label: 'Professionnel', hint: 'Registre institutionnel' },
  { value: 'pedagogique', label: 'Pédagogique', hint: 'Accessible au client final' },
  { value: 'technique', label: 'Technique', hint: 'Vocabulaire financier précis' },
];

const OBJECTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Retraite', label: 'Retraite' },
  { value: 'Transmission', label: 'Transmission' },
  { value: 'Revenus', label: 'Revenus' },
  { value: 'Croissance', label: 'Croissance' },
  { value: 'Fiscalité', label: 'Fiscalité' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function paragraphsToPlainText(
  paragraphs: CommentaryParagraph[],
  productName: string,
): string {
  const header = `Commentaire client — ${productName}\n\n`;
  const body = paragraphs
    .map((p) => `${p.title}\n${'-'.repeat(Math.min(p.title.length, 60))}\n${p.body}`)
    .join('\n\n');
  return header + body;
}

function buildHtmlDocument(
  paragraphs: CommentaryParagraph[],
  productName: string,
): string {
  const css = `
    body { font-family: 'Georgia', 'Times New Roman', serif; padding: 48px; color: #1a1a2e; max-width: 780px; margin: 0 auto; line-height: 1.6; }
    h1 { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 22px; color: #3B1FA8; border-bottom: 2px solid #3B1FA8; padding-bottom: 12px; margin-bottom: 24px; }
    h2 { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 15px; color: #3B1FA8; margin-top: 28px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    p { font-size: 13px; text-align: justify; margin: 0 0 12px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ccc; font-size: 10px; color: #666; font-style: italic; }
    @media print { body { padding: 20mm; } }
  `;
  const body = paragraphs
    .map(
      (p) =>
        `<h2>${escapeHtml(p.title)}</h2><p>${escapeHtml(p.body)}</p>`,
    )
    .join('\n');
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Commentaire client — ${escapeHtml(productName)}</title>
  <style>${css}</style>
</head>
<body>
  <h1>Commentaire client — ${escapeHtml(productName)}</h1>
  ${body}
  <div class="footer">Document généré le ${today} — Strick'in. Ce document est à caractère informatif et ne constitue pas un conseil en investissement.</div>
</body>
</html>`;
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function ParagraphSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-4 space-y-2.5">
      <Skeleton className="h-3.5 w-2/5 rounded" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-[95%] rounded" />
        <Skeleton className="h-3 w-[88%] rounded" />
        <Skeleton className="h-3 w-[70%] rounded" />
      </div>
    </div>
  );
}

// ─── Form Sub-components ─────────────────────────────────────────────────────

function ProfileSelect({
  value,
  onChange,
}: {
  value: ClientProfile;
  onChange: (v: ClientProfile) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PROFILE_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative text-left px-3 py-2.5 rounded-lg border transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40',
              active
                ? 'border-[#3B1FA8] bg-[#3B1FA8]/5 dark:bg-[#3B1FA8]/15'
                : 'border-border/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-[#3B1FA8]/40',
            )}
          >
            <p
              className={cn(
                'text-[12px] font-body font-semibold',
                active ? 'text-[#3B1FA8] dark:text-[#C9BCFF]' : 'text-ink dark:text-white',
              )}
            >
              {opt.label}
            </p>
            <p className="text-[10px] text-ink-3 dark:text-white/45 leading-tight mt-0.5">
              {opt.hint}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ObjectivesGroup({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (obj: string) => {
    if (value.includes(obj)) onChange(value.filter((v) => v !== obj));
    else onChange([...value, obj]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {OBJECTIVE_OPTIONS.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            aria-pressed={checked}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-body font-medium',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]/40',
              checked
                ? 'border-[#00B894] bg-[#00B894]/10 text-[#00B894] dark:text-[#5AE0BE]'
                : 'border-border/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] text-ink-2 dark:text-white/60 hover:border-[#00B894]/50',
            )}
          >
            {checked && <Check size={11} strokeWidth={2.5} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToneRadio({
  value,
  onChange,
}: {
  value: CommentaryTone;
  onChange: (v: CommentaryTone) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TONE_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <label
            key={opt.value}
            className={cn(
              'relative flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border cursor-pointer',
              'transition-all duration-150',
              active
                ? 'border-[#D4A017] bg-[#D4A017]/8 dark:bg-[#D4A017]/12'
                : 'border-border/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-[#D4A017]/40',
            )}
          >
            <input
              type="radio"
              name="commentary-tone"
              value={opt.value}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              className={cn(
                'text-[12px] font-body font-semibold',
                active
                  ? 'text-[#8C6B0F] dark:text-[#EBCD74]'
                  : 'text-ink dark:text-white',
              )}
            >
              {opt.label}
            </span>
            <span className="text-[10px] text-ink-3 dark:text-white/45 leading-tight">
              {opt.hint}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function AICommentaryModal({ product, open, onClose }: AICommentaryModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [clientProfile, setClientProfile] = React.useState<ClientProfile>('equilibre');
  const [objectives, setObjectives] = React.useState<string[]>([]);
  const [tone, setTone] = React.useState<CommentaryTone>('professionnel');
  const [loading, setLoading] = React.useState(false);
  const [paragraphs, setParagraphs] = React.useState<CommentaryParagraph[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const firstFocusableRef = React.useRef<HTMLButtonElement>(null);

  const addCommentary = useCommentaryStore((s) => s.add);

  // Mount guard for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Body scroll lock + focus management
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the first actionable button after a tick so the portal has mounted
    const t = window.setTimeout(() => firstFocusableRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  // ESC to close + focus trap
  React.useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  // Reset output state whenever the modal re-opens for a new product
  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setCopied(false);
    setSaved(false);
    setToast(null);
  }, [open, product.id]);

  // Auto-clear the small inline toast
  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = React.useCallback((msg: string) => setToast(msg), []);

  // Handlers
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const buildRequestPayload = React.useCallback(() => {
    const barrierPct =
      product.barrierPct != null
        ? product.barrierPct
        : product.barrierCapPct != null
          ? product.barrierCapPct
          : undefined;
    return {
      productId: product.id,
      productName: product.name,
      payoffType: product.payoffType,
      isin: product.isin ?? product.id,
      couponPct: product.couponPct ?? undefined,
      barrierPct,
      underlyingName: product.underlyingName ?? product.underlyingYahoo ?? undefined,
      sri: product.sri ?? undefined,
      maturityDate: product.maturityDate ?? undefined,
      clientProfile,
      objectives,
      tone,
    };
  }, [product, clientProfile, objectives, tone]);

  const handleGenerate = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setParagraphs(null);
    setCopied(false);
    setSaved(false);

    const startedAt = Date.now();
    try {
      const res = await fetch('/api/ai/commentary/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildRequestPayload()),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.paragraphs || data.paragraphs.length === 0) {
        throw new Error(data.error ?? 'Impossible de générer le commentaire.');
      }

      // Ensure the skeleton is visible ~3s for perceived quality
      const elapsed = Date.now() - startedAt;
      if (elapsed < 3000) {
        await new Promise((r) => window.setTimeout(r, 3000 - elapsed));
      }
      setParagraphs(data.paragraphs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [buildRequestPayload]);

  const handleCopy = React.useCallback(async () => {
    if (!paragraphs) return;
    const text = paragraphsToPlainText(paragraphs, product.name);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Commentaire copié dans le presse-papiers.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Copie impossible.');
    }
  }, [paragraphs, product.name, showToast]);

  const handleDownloadDocx = React.useCallback(() => {
    if (!paragraphs) return;
    const text = paragraphsToPlainText(paragraphs, product.name);
    // Pseudo-docx: Word opens plain text with .docx extension; sufficient for a v1 demo.
    const blob = new Blob([text], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = product.name.replace(/[^\w\d-]+/g, '-').toLowerCase();
    a.download = `commentaire-${safeName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Fichier .docx téléchargé.');
  }, [paragraphs, product.name, showToast]);

  const handleDownloadPdf = React.useCallback(() => {
    if (!paragraphs) return;
    const html = buildHtmlDocument(paragraphs, product.name);
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      showToast('Impossible d\u2019ouvrir la fenêtre d\u2019impression.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    window.setTimeout(() => {
      try {
        win.print();
      } catch {
        // Silent: some browsers block print() until user gesture
      }
    }, 400);
  }, [paragraphs, product.name, showToast]);

  const handleSave = React.useCallback(() => {
    if (!paragraphs) return;
    addCommentary({
      productId: product.id,
      productName: product.name,
      clientProfile,
      objectives,
      tone,
      paragraphs,
    });
    setSaved(true);
    showToast('Commentaire sauvegardé.');
    window.setTimeout(() => setSaved(false), 2500);
  }, [paragraphs, product, clientProfile, objectives, tone, addCommentary, showToast]);

  const handleRegenerate = React.useCallback(() => {
    void handleGenerate();
  }, [handleGenerate]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-commentary-title"
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto',
        'bg-ink/55 dark:bg-black/65 backdrop-blur-md',
        'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150',
      )}
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full max-w-2xl my-4 sm:my-8',
          'rounded-2xl border border-white/30 dark:border-white/10',
          'bg-white/90 dark:bg-[#15132A]/90 backdrop-blur-xl',
          'shadow-[0_20px_60px_-15px_rgba(59,31,168,0.35)] ring-1 ring-black/[0.03] dark:ring-white/[0.04]',
          'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in motion-safe:duration-150',
        )}
      >
        {/* Gradient top border */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[#3B1FA8] via-[#00B894] to-[#D4A017] opacity-80"
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-border/50 dark:border-white/8">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                'bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] shadow-md shadow-[#3B1FA8]/25',
              )}
              aria-hidden="true"
            >
              <Sparkles size={17} className="text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2
                id="ai-commentary-title"
                className="font-display font-bold text-[15px] sm:text-[16px] text-ink dark:text-white leading-snug"
              >
                Commentaire client IA
              </h2>
              <p className="font-body text-[12px] text-ink-3 dark:text-white/55 truncate">
                {product.name}
                {product.isin && (
                  <span className="font-mono text-[10px] ml-1.5 text-ink-3/80 dark:text-white/40">
                    {product.isin}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className={cn(
              'shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
              'text-ink-3 dark:text-white/55 hover:text-ink dark:hover:text-white',
              'hover:bg-surface-2 dark:hover:bg-white/[0.06] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B1FA8]',
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 space-y-5">
          {/* FORM */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-widest text-ink-3 dark:text-white/45 mb-2">
                Profil client
              </label>
              <ProfileSelect value={clientProfile} onChange={setClientProfile} />
            </div>

            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-widest text-ink-3 dark:text-white/45 mb-2">
                Objectifs patrimoniaux
              </label>
              <ObjectivesGroup value={objectives} onChange={setObjectives} />
            </div>

            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-widest text-ink-3 dark:text-white/45 mb-2">
                Ton
              </label>
              <ToneRadio value={tone} onChange={setTone} />
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="primary"
                size="md"
                loading={loading}
                onClick={() => void handleGenerate()}
                className="min-w-[160px]"
              >
                {!loading && <Sparkles size={14} />}
                {loading ? 'Génération en cours...' : 'Générer'}
              </Button>
            </div>
          </div>

          {/* OUTPUT AREA */}
          <div
            aria-live="polite"
            className="pt-4 border-t border-border/50 dark:border-white/8 space-y-3"
          >
            {loading && (
              <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in">
                <ParagraphSkeleton />
                <ParagraphSkeleton />
                <ParagraphSkeleton />
                <ParagraphSkeleton />
              </div>
            )}

            {!loading && error && (
              <div
                role="alert"
                className={cn(
                  'flex items-start gap-2 p-3.5 rounded-lg border',
                  'border-red/30 bg-red/5 dark:bg-red/10 text-red',
                )}
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div className="text-[12px] font-body leading-snug">
                  <p className="font-semibold">Erreur de génération</p>
                  <p className="text-ink-2 dark:text-white/65 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && !paragraphs && (
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-10 px-4',
                  'rounded-xl border border-dashed border-border/60 dark:border-white/10',
                  'bg-gradient-to-br from-[#3B1FA8]/3 to-[#00B894]/3 dark:from-[#3B1FA8]/8 dark:to-[#00B894]/6',
                )}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#3B1FA8]/10 dark:bg-[#3B1FA8]/20">
                  <Sparkles size={18} className="text-[#3B1FA8] dark:text-[#C9BCFF]" />
                </div>
                <p className="text-[12px] font-body text-ink-2 dark:text-white/65 text-center">
                  Configurez le profil, les objectifs et le ton, puis cliquez sur{' '}
                  <span className="font-semibold text-[#3B1FA8] dark:text-[#C9BCFF]">
                    Générer
                  </span>{' '}
                  pour obtenir un commentaire en 4 paragraphes.
                </p>
              </div>
            )}

            {!loading && paragraphs && paragraphs.length > 0 && (
              <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in">
                {paragraphs.map((p, i) => (
                  <article
                    key={`${i}-${p.title}`}
                    className={cn(
                      'rounded-xl border border-border/60 dark:border-white/10',
                      'bg-white/75 dark:bg-white/[0.03] backdrop-blur-sm',
                      'p-4 shadow-xs',
                    )}
                  >
                    <h3 className="font-display font-bold text-[13px] text-ink dark:text-white leading-snug mb-1.5 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-flex w-5 h-5 items-center justify-center rounded-md bg-[#3B1FA8]/10 dark:bg-[#3B1FA8]/20 text-[10px] font-mono font-bold text-[#3B1FA8] dark:text-[#C9BCFF]"
                      >
                        {i + 1}
                      </span>
                      {p.title}
                    </h3>
                    <p className="font-body text-[12.5px] leading-relaxed text-ink-2 dark:text-white/75 whitespace-pre-wrap">
                      {p.body}
                    </p>
                  </article>
                ))}

                {/* Action toolbar */}
                <div
                  className={cn(
                    'flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 dark:border-white/8',
                  )}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCopy()}
                    aria-label="Copier le commentaire"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copié' : 'Copier'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadDocx}
                    aria-label="Télécharger le fichier DOCX"
                  >
                    <Download size={12} /> .docx
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadPdf}
                    aria-label="Télécharger le PDF"
                  >
                    <FileText size={12} /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRegenerate}
                    aria-label="Régénérer le commentaire"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Régénérer
                  </Button>
                  <Button
                    size="sm"
                    variant="teal"
                    onClick={handleSave}
                    aria-label="Sauvegarder le commentaire"
                    className="ml-auto"
                  >
                    {saved ? <Check size={12} /> : <Save size={12} />}
                    {saved ? 'Sauvegardé' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Inline toast */}
          {toast && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                'fixed left-1/2 bottom-6 -translate-x-1/2 z-[60]',
                'rounded-lg px-3 py-2 text-[12px] font-body font-medium',
                'bg-ink text-white dark:bg-white dark:text-ink shadow-lg',
                'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2',
              )}
            >
              {toast}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] font-body text-ink-3 dark:text-white/40 leading-relaxed">
            Ce commentaire est généré à partir des paramètres renseignés. Il ne constitue
            pas un conseil en investissement personnalisé au sens de la directive MIF II.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AICommentaryModal;
