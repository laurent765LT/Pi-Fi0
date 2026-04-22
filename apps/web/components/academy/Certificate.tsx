'use client';

import { Download, Printer } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

interface CertificateProps {
  /** Full learner name */
  learnerName: string;
  /** Course title */
  courseTitle: string;
  /** Date the certificate was earned (ISO string) */
  earnedAt: string;
  /** Unique serial (stable string) */
  serialNumber: string;
  /** Duration in minutes (optional) */
  durationMinutes?: number;
  className?: string;
}

// ─── HTML generator ─────────────────────────────────────────────────────────
// Generates a standalone printable HTML document that the browser can save as
// PDF via the native print dialog. Mirrors the pattern used in
// lib/portfolio-pdf.ts.

function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCertificateHtml(input: {
  learnerName: string;
  courseTitle: string;
  earnedAt: string;
  serialNumber: string;
  durationMinutes?: number;
}): string {
  const { learnerName, courseTitle, earnedAt, serialNumber, durationMinutes } =
    input;
  const dateLabel = new Date(earnedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const durationLabel = durationMinutes
    ? `${Math.round(durationMinutes / 60)}h ${durationMinutes % 60 ? `${durationMinutes % 60}min` : ''}`.trim()
    : '—';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Attestation — ${escapeHtml(courseTitle)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  :root {
    --violet: #3B1FA8;
    --violet-2: #5B3FD4;
    --teal: #00B894;
    --gold: #D4A017;
    --ink: #1A0A3E;
    --ink-2: #3C2B6E;
    --ink-3: #7B6FA0;
    --bg-soft: #F8F6FF;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: var(--ink);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { background: #fff; }

  .cert {
    position: relative;
    width: 29.7cm; height: 21cm;
    padding: 48px 60px;
    background:
      radial-gradient(ellipse 60% 40% at 15% 15%, rgba(59,31,168,0.10), transparent 70%),
      radial-gradient(ellipse 60% 40% at 85% 85%, rgba(0,184,148,0.08), transparent 70%),
      #fff;
    border: 14px solid transparent;
    border-image: linear-gradient(135deg, var(--violet), var(--gold), var(--teal)) 1;
  }

  .brand-row { display: flex; align-items: center; gap: 12px; }
  .brand-logo {
    width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, var(--violet), var(--violet-2));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800;
  }
  .brand-name {
    font-weight: 800; font-size: 22px; letter-spacing: -0.5px;
  }
  .brand-name .accent { color: var(--gold); }

  .stamp {
    position: absolute; top: 40px; right: 60px;
    width: 110px; height: 110px; border-radius: 50%;
    background: linear-gradient(135deg, rgba(212,160,23,0.14), rgba(212,160,23,0.05));
    border: 2px dashed var(--gold);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: var(--gold); font-size: 10px; font-weight: 800;
    letter-spacing: 0.18em; text-transform: uppercase;
    transform: rotate(-10deg);
  }
  .stamp-big { font-size: 16px; letter-spacing: 0.1em; margin: 3px 0; }

  .eyebrow {
    margin-top: 56px;
    font-size: 11px; font-weight: 800;
    color: var(--ink-3); letter-spacing: 0.32em; text-transform: uppercase;
  }

  h1 {
    font-size: 48px; font-weight: 800; letter-spacing: -1px;
    margin: 8px 0 20px;
    background: linear-gradient(90deg, var(--violet), var(--violet-2));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }

  .line { color: var(--ink-2); font-size: 14px; margin-bottom: 10px; }

  .learner {
    margin: 18px 0 4px;
    font-size: 42px; font-weight: 800; letter-spacing: -0.5px;
    color: var(--ink);
  }

  .underline {
    width: 340px; height: 2px; border-radius: 1px;
    background: linear-gradient(90deg, var(--violet), var(--gold));
    margin-bottom: 26px;
  }

  .course-title {
    font-size: 22px; font-weight: 700; color: var(--violet);
    margin: 8px 0 24px;
  }

  .meta-grid {
    position: absolute;
    bottom: 60px; left: 60px; right: 60px;
    display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 48px;
    align-items: flex-end;
  }

  .meta-item .label {
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--ink-3); font-weight: 700; margin-bottom: 4px;
  }
  .meta-item .value {
    font-size: 13px; color: var(--ink); font-weight: 600;
  }
  .meta-item .value.mono {
    font-family: 'SFMono-Regular', Menlo, monospace; font-size: 11px;
  }

  .sig-block {
    border-top: 1.5px solid var(--ink-2);
    padding-top: 6px;
  }
  .sig-name { font-size: 13px; font-weight: 700; color: var(--ink); }
  .sig-role { font-size: 10px; color: var(--ink-3); margin-top: 2px; }

  .footer-band {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 8px;
    background: linear-gradient(90deg, var(--violet) 0%, var(--teal) 50%, var(--gold) 100%);
  }

  .print-toolbar {
    position: fixed; top: 16px; right: 16px; z-index: 100; display: flex; gap: 8px;
  }
  .print-toolbar button {
    font-family: inherit; font-size: 12px; font-weight: 600;
    padding: 8px 14px; border-radius: 8px; border: 0; cursor: pointer;
    color: #fff; background: linear-gradient(135deg, var(--violet), var(--violet-2));
    box-shadow: 0 6px 18px rgba(59,31,168,0.3);
  }
  .print-toolbar button.secondary {
    background: #fff; color: var(--ink-2);
    border: 1px solid #E6E2F3; box-shadow: 0 2px 8px rgba(26,10,62,0.08);
  }
  @media print {
    .print-toolbar { display: none !important; }
    body { background: #fff; }
  }
</style>
</head>
<body>
<div class="print-toolbar">
  <button class="secondary" onclick="window.close();">Fermer</button>
  <button onclick="window.print();">Enregistrer en PDF</button>
</div>
<div class="cert">
  <div class="brand-row">
    <div class="brand-logo">⚡</div>
    <div class="brand-name">Strick<span class="accent">&lsquo;in</span> Academy</div>
  </div>

  <div class="stamp">
    <span>Strick&lsquo;in</span>
    <span class="stamp-big">DPC</span>
    <span>Certifié</span>
  </div>

  <div class="eyebrow">Attestation de formation</div>
  <h1>Certificat de réussite</h1>
  <p class="line">Nous certifions par la présente que</p>

  <div class="learner">${escapeHtml(learnerName)}</div>
  <div class="underline"></div>

  <p class="line">a suivi avec succès l&rsquo;ensemble du parcours</p>
  <div class="course-title">${escapeHtml(courseTitle)}</div>

  <p class="line" style="max-width:620px;">
    Ce parcours, dispensé par Strick&lsquo;in Academy, répond aux exigences
    de Développement Professionnel Continu (DPC) pour les conseillers
    en gestion de patrimoine distribuant des produits structurés.
  </p>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="label">Numéro d&rsquo;attestation</div>
      <div class="value mono">${escapeHtml(serialNumber)}</div>
      <div class="label" style="margin-top:12px;">Durée validée</div>
      <div class="value">${escapeHtml(durationLabel)}</div>
    </div>
    <div class="meta-item">
      <div class="label">Délivré le</div>
      <div class="value">${escapeHtml(dateLabel)}</div>
    </div>
    <div class="meta-item sig-block">
      <div class="sig-name">Paul-Adrien Desplechin</div>
      <div class="sig-role">CEO — Strick&lsquo;in SAS</div>
    </div>
  </div>

  <div class="footer-band"></div>
</div>
</body>
</html>`;
}

function openInNewWindow(html: string): void {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'noopener');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ─── React component (preview card + export) ───────────────────────────────

export function Certificate({
  learnerName,
  courseTitle,
  earnedAt,
  serialNumber,
  durationMinutes,
  className,
}: CertificateProps) {
  const dateLabel = new Date(earnedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const durationLabel = durationMinutes
    ? `${Math.round(durationMinutes / 60)}h ${durationMinutes % 60 ? `${durationMinutes % 60}min` : ''}`.trim()
    : '—';

  const handleExport = () => {
    openInNewWindow(
      buildCertificateHtml({
        learnerName,
        courseTitle,
        earnedAt,
        serialNumber,
        durationMinutes,
      }),
    );
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden border-[3px] bg-white shadow-lg',
        className,
      )}
      style={{
        borderImage: 'linear-gradient(135deg, #3B1FA8, #D4A017, #00B894) 1',
        borderStyle: 'solid',
      }}
    >
      {/* Decorative gradient */}
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 10% 10%, rgba(59,31,168,0.10), transparent 70%), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(0,184,148,0.08), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B1FA8] to-[#5535C4] flex items-center justify-center shadow-md">
              <svg
                width="15"
                height="15"
                viewBox="0 0 14 14"
                fill="none"
                className="text-white"
                aria-hidden="true"
              >
                <path d="M7 1.5L2 7.5h4l-1 5 5-6h-4l1-5z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display font-extrabold text-base tracking-tight text-ink">
              Strick<span className="text-[#D4A017]">&lsquo;in</span> Academy
            </span>
          </div>

          <div
            className="w-20 h-20 rounded-full border-2 border-dashed border-[#D4A017] flex flex-col items-center justify-center text-[#D4A017]"
            style={{ transform: 'rotate(-8deg)' }}
          >
            <span className="text-[8px] font-black uppercase tracking-widest">
              DPC
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Certifié
            </span>
          </div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-3 mb-1">
          Attestation de formation
        </p>
        <h2 className="font-display text-[26px] sm:text-[32px] font-extrabold bg-gradient-to-r from-[#3B1FA8] to-[#5535C4] bg-clip-text text-transparent mb-3 leading-tight">
          Certificat de réussite
        </h2>

        <p className="text-[13px] text-ink-2 font-body mb-1">
          Nous certifions que
        </p>
        <p className="font-display text-[22px] sm:text-[26px] font-extrabold text-ink leading-tight">
          {learnerName}
        </p>
        <div
          className="mt-1 h-[2px] w-48 rounded-full mb-4"
          style={{
            background:
              'linear-gradient(90deg, #3B1FA8 0%, #D4A017 50%, #00B894 100%)',
          }}
        />

        <p className="text-[13px] text-ink-2 font-body mb-1">
          a suivi avec succès le parcours
        </p>
        <p className="font-display text-[16px] sm:text-[18px] font-bold text-[#3B1FA8] mb-5">
          {courseTitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink-3 mb-1">
              Numéro
            </p>
            <p className="font-mono text-[11px] text-ink font-semibold">
              {serialNumber}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink-3 mb-1">
              Délivré le
            </p>
            <p className="font-body text-[12px] text-ink font-semibold">
              {dateLabel}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-ink-3 mb-1">
              Durée
            </p>
            <p className="font-body text-[12px] text-ink font-semibold">
              {durationLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="h-[1.5px] w-40 bg-ink-2 mb-1" />
            <p className="text-[12px] font-bold text-ink">
              Paul-Adrien Desplechin
            </p>
            <p className="text-[10px] text-ink-3">CEO — Strick&lsquo;in SAS</p>
          </div>
          <div className="flex gap-2">
            <Button variant="muted" size="sm" onClick={() => window.print()}>
              <Printer size={13} />
              Imprimer
            </Button>
            <Button variant="primary" size="sm" onClick={handleExport}>
              <Download size={13} />
              Exporter en PDF
            </Button>
          </div>
        </div>

        {/* Bottom gradient band */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[6px]"
          style={{
            background:
              'linear-gradient(90deg, #3B1FA8 0%, #00B894 50%, #D4A017 100%)',
          }}
        />
      </div>
    </div>
  );
}
