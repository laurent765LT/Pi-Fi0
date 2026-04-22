'use client';

// ─── components/kyc/IdentityScanner.tsx ──────────────────────────────────────
// Upload drag-and-drop OU webcam. Analyse OCR (mock) + affichage du résultat.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  Camera,
  FileImage,
  Loader2,
  CheckCircle2,
  RotateCcw,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatConfidence, type OCRIdentityResult } from '@/lib/kyc/ocr-engine';
import {
  ID_DOCUMENT_TYPE_LABELS,
  type IdDocumentType,
} from '@/stores/kyc-store';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface IdentityExtraction extends OCRIdentityResult {
  documentType: IdDocumentType;
  fileName: string;
}

interface IdentityScannerProps {
  onExtracted: (result: IdentityExtraction) => void;
  initialDocumentType?: IdDocumentType;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function IdentityScanner({
  onExtracted,
  initialDocumentType = 'cni',
}: IdentityScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [docType, setDocType] = useState<IdDocumentType>(initialDocumentType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRIdentityResult | null>(null);
  const [webcamOn, setWebcamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup webcam
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ─── File handlers ───────────────────────────────────────────────────

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }, [previewUrl]);

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  // ─── Webcam handlers ─────────────────────────────────────────────────

  const startWebcam = async () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Webcam indisponible sur cet appareil.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setWebcamOn(true);
      // microtask to ensure videoRef is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => void 0);
        }
      }, 50);
    } catch {
      setError('Autorisation caméra refusée.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setWebcamOn(false);
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const snapshot = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        handleFile(snapshot);
        stopWebcam();
      },
      'image/jpeg',
      0.92,
    );
  };

  // ─── OCR analyse ─────────────────────────────────────────────────────

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/kyc/ocr', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? 'OCR indisponible');
      }
      const data = (await res.json()) as OCRIdentityResult;
      setResult(data);
      onExtracted({ ...data, documentType: docType, fileName: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur pendant la lecture.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setResult(null);
    setError(null);
  };

  // ─── Render ──────────────────────────────────────────────────────────

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const confidenceVariant =
    confidencePct >= 90 ? 'teal' : confidencePct >= 75 ? 'gold' : 'red';

  return (
    <div className="flex flex-col gap-4">
      {/* Document type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[13px] font-semibold text-ink-2">
          Type de document
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ID_DOCUMENT_TYPE_LABELS) as IdDocumentType[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDocType(t)}
                className={cn(
                  'h-9 rounded-md border text-xs font-body font-semibold transition-colors',
                  docType === t
                    ? 'border-violet bg-violet-pale text-violet'
                    : 'border-border bg-white text-ink-3 hover:border-violet/40',
                )}
                aria-pressed={docType === t}
              >
                {ID_DOCUMENT_TYPE_LABELS[t]}
              </button>
            ),
          )}
        </div>
      </div>

      {webcamOn ? (
        // ─── Webcam view ────────────────────────────────────────────────
        <div className="rounded-xl border border-border overflow-hidden bg-ink">
          <video
            ref={videoRef}
            className="w-full h-auto max-h-[360px] object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-t border-border">
            <Button variant="muted" onClick={stopWebcam}>
              <X size={13} /> Annuler
            </Button>
            <Button variant="primary" onClick={captureFromWebcam}>
              <Camera size={13} /> Capturer
            </Button>
          </div>
        </div>
      ) : previewUrl ? (
        // ─── Preview + analyze ──────────────────────────────────────────
        <div className="rounded-xl border border-border overflow-hidden bg-white">
          <div className="bg-surface p-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Aperçu du document"
              className="max-h-[260px] rounded-md shadow-xs"
            />
          </div>
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <FileImage size={14} className="text-ink-3 shrink-0" />
              <span className="font-body text-[12.5px] text-ink truncate">
                {file?.name}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="muted" size="sm" onClick={reset}>
                <RotateCcw size={12} /> Recommencer
              </Button>
              {!result && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={loading}
                  onClick={analyze}
                >
                  {loading ? 'Analyse…' : 'Analyser'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ─── Drag & drop zone ───────────────────────────────────────────
        <div className="flex flex-col gap-3">
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
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
            <Upload size={24} className="text-violet" />
            <p className="font-body text-[13px] font-semibold text-ink text-center">
              Déposez votre pièce d&apos;identité ici
            </p>
            <p className="font-body text-[11px] text-ink-3 text-center">
              JPG, PNG ou PDF (max. 10 Mo)
            </p>
          </label>
          <div className="flex items-center justify-center text-[10px] uppercase tracking-widest text-ink-3 font-bold">
            <div className="flex-1 h-px bg-border" />
            <span className="px-2">OU</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <Button variant="outline" onClick={startWebcam}>
            <Camera size={14} /> Capturer avec la webcam
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red/25 bg-red/8 px-3 py-2"
        >
          <AlertCircle size={14} className="text-red shrink-0 mt-0.5" />
          <p className="font-body text-xs text-red font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-teal/40 bg-teal/5 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal" />
              <span className="font-display font-bold text-[14px] text-ink">
                Identité extraite
              </span>
            </div>
            <Badge variant={confidenceVariant} size="md">
              Confiance {formatConfidence(result.confidence)}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Prénom" value={result.firstName} readOnly />
            <Input label="Nom" value={result.lastName} readOnly />
            <Input
              label="Date de naissance"
              value={result.birthDate}
              readOnly
              type="date"
            />
            <Input
              label="N° du document"
              value={result.documentNumber}
              readOnly
            />
          </div>
          {result.expiryDate && (
            <p className="font-body text-[11px] text-ink-3">
              Valide jusqu&apos;au{' '}
              <span className="font-semibold text-ink">
                {new Date(result.expiryDate).toLocaleDateString('fr-FR')}
              </span>
            </p>
          )}
        </div>
      )}

      {loading && !result && (
        <div className="flex items-center gap-2 rounded-md bg-violet-pale/40 px-3 py-2">
          <Loader2 size={14} className="animate-spin text-violet" />
          <span className="font-body text-xs text-violet font-medium">
            Lecture OCR en cours…
          </span>
        </div>
      )}
    </div>
  );
}
