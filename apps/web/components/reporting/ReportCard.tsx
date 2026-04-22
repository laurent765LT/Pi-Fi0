'use client';

import { useState } from 'react';
import { Download, Eye, FileText, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export interface ReportCardProps {
  id: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  metricSub?: string;
  icon: LucideIcon;
  accent: string;
  lastGeneratedAt?: string | null;
  /** Generate & return the HTML — opens a new tab for printing. */
  onGenerate: () => string;
  /** Optional preview HTML (same HTML used for PDF). */
  onPreview?: () => string;
  className?: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function ReportCard({
  title,
  description,
  metric,
  metricLabel,
  metricSub,
  icon: Icon,
  accent,
  lastGeneratedAt,
  onGenerate,
  onPreview,
  className,
}: ReportCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const handleGenerate = () => {
    const html = onGenerate();
    if (typeof window === 'undefined') return;
    const w = window.open('', '_blank', 'noopener');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const handlePreview = () => {
    const html = (onPreview ?? onGenerate)();
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          'group relative rounded-2xl overflow-hidden',
          'bg-white dark:bg-white/5 border border-border/60',
          'shadow-sm hover:shadow-md transition-all duration-200',
          className,
        )}
      >
        {/* Top accent */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
          }}
          aria-hidden="true"
        />

        <div className="p-5 flex flex-col gap-4 h-full">
          {/* Icon + title */}
          <div className="flex items-start gap-3">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
                boxShadow: `inset 0 0 0 1px ${accent}20`,
              }}
            >
              <Icon size={20} style={{ color: accent }} />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[15px] font-bold text-ink leading-snug">
                {title}
              </h3>
              <p className="text-[12px] text-ink-3 font-body mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Metric */}
          <div
            className="rounded-xl p-4 border"
            style={{
              borderColor: `${accent}30`,
              background: `${accent}06`,
            }}
          >
            <p
              className="text-[9px] uppercase tracking-widest font-bold mb-1"
              style={{ color: accent }}
            >
              {metricLabel}
            </p>
            <p className="font-display text-[24px] font-extrabold text-ink tabular-nums leading-none">
              {metric}
            </p>
            {metricSub && (
              <p className="text-[11px] text-ink-3 font-body mt-1">
                {metricSub}
              </p>
            )}
          </div>

          {/* Last generated */}
          <div className="flex items-center gap-2 text-[11px] text-ink-3 font-body">
            <FileText size={12} />
            <span>
              Dernière génération :{' '}
              <strong className="text-ink-2">
                {lastGeneratedAt ? formatDate(lastGeneratedAt) : 'Jamais'}
              </strong>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <Button
              variant="muted"
              size="sm"
              className="flex-1"
              onClick={handlePreview}
            >
              <Eye size={13} />
              Aperçu
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleGenerate}
            >
              <Download size={13} />
              Générer PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Aperçu · ${title}`}
        maxWidth="max-w-4xl"
      >
        <div className="rounded-lg border border-border bg-surface-2 overflow-hidden">
          <iframe
            title={`Aperçu ${title}`}
            srcDoc={previewHtml}
            className="w-full h-[70vh] bg-white"
            sandbox="allow-same-origin"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-3">
          <Button variant="muted" size="sm" onClick={() => setPreviewOpen(false)}>
            Fermer
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setPreviewOpen(false);
              handleGenerate();
            }}
          >
            <Download size={13} />
            Télécharger en PDF
          </Button>
        </div>
      </Modal>
    </>
  );
}
