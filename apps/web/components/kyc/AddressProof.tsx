'use client';

// ─── components/kyc/AddressProof.tsx ─────────────────────────────────────────
// Upload PDF/image de justificatif de domicile + validation <3 mois.

import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import {
  ADDRESS_PROOF_TYPE_LABELS,
  type AddressProofType,
} from '@/stores/kyc-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AddressProofValue {
  type: AddressProofType;
  issueDate: string; // ISO yyyy-mm-dd
  fileName: string;
}

interface AddressProofProps {
  onChange: (value: AddressProofValue | null) => void;
  initial?: AddressProofValue;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AddressProof({ onChange, initial }: AddressProofProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [type, setType] = useState<AddressProofType>(
    initial?.type ?? 'facture',
  );
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? '');
  const [fileName, setFileName] = useState(initial?.fileName ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Notify parent
  useEffect(() => {
    if (!fileName || !issueDate) {
      onChange(null);
      return;
    }
    onChange({ type, issueDate, fileName });
  }, [type, issueDate, fileName, onChange]);

  const handleFile = (f: File) => {
    setFile(f);
    setFileName(f.name);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setFileName('');
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // Date validation
  const dateOk = (() => {
    if (!issueDate) return null;
    const d = new Date(issueDate);
    if (Number.isNaN(d.getTime())) return false;
    const months = monthsBetween(d, new Date());
    return months <= 3 && months >= 0;
  })();

  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="flex flex-col gap-4">
      {/* Type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[13px] font-semibold text-ink-2">
          Type de justificatif
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(Object.keys(ADDRESS_PROOF_TYPE_LABELS) as AddressProofType[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'h-10 rounded-md border text-xs font-body font-semibold transition-colors px-3',
                  type === t
                    ? 'border-violet bg-violet-pale text-violet'
                    : 'border-border bg-white text-ink-3 hover:border-violet/40',
                )}
                aria-pressed={type === t}
              >
                {ADDRESS_PROOF_TYPE_LABELS[t]}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Upload zone / preview */}
      {previewUrl ? (
        <div className="rounded-xl border border-border overflow-hidden bg-white">
          <div className="bg-surface p-4 flex items-center justify-center min-h-[180px]">
            {isPdf ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="w-full h-[260px] rounded"
                aria-label="Aperçu PDF"
              >
                <div className="text-center">
                  <FileText size={28} className="text-ink-3 mx-auto" />
                  <p className="text-xs text-ink-3 mt-1">
                    Aperçu PDF non disponible
                  </p>
                </div>
              </object>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Aperçu du justificatif"
                className="max-h-[260px] rounded shadow-xs"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-ink-3 shrink-0" />
              <span className="font-body text-[12.5px] text-ink truncate">
                {fileName}
              </span>
            </div>
            <Button variant="muted" size="sm" onClick={reset}>
              <RotateCcw size={12} /> Remplacer
            </Button>
          </div>
        </div>
      ) : (
        <label
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors',
            dragOver
              ? 'border-violet bg-violet-pale/50'
              : 'border-border bg-surface hover:border-violet/40 hover:bg-violet-pale/20',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <Upload size={22} className="text-violet" />
          <p className="font-body text-[13px] font-semibold text-ink text-center">
            Téléversez votre justificatif
          </p>
          <p className="font-body text-[11px] text-ink-3 text-center">
            PDF, JPG ou PNG — document de moins de 3 mois
          </p>
        </label>
      )}

      {/* Issue date */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="address-issue"
          className="font-body text-[13px] font-semibold text-ink-2"
        >
          Date d&apos;émission du document
        </label>
        <input
          id="address-issue"
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          className="h-9 rounded-md bg-surface-2 border border-border-2 px-3 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-violet"
        />
        {dateOk === true && (
          <p className="font-body text-xs text-teal font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> Document récent (&lt;3 mois)
          </p>
        )}
        {dateOk === false && (
          <p className="font-body text-xs text-red font-medium flex items-center gap-1">
            <AlertCircle size={12} /> Document trop ancien : il doit dater de
            moins de 3 mois.
          </p>
        )}
      </div>
    </div>
  );
}
