// ─── AMF / ACPR report HTML templates ────────────────────────────────────────
// Each function produces a standalone printable HTML document. The layout
// mirrors the conventions of AMF regulatory reports : institutional header,
// data tables, summary block and signature/date block. HTML-to-PDF is done
// via window.print() (native browser dialog), identical to portfolio-pdf.ts.

import {
  aggregateClientTypology,
  aggregateRetrocessions,
  aggregateVolumesByIssuer,
  computeTargetMarketCompliance,
  listAMLIncidents,
} from './aggregations';

// ─── Shared helpers ──────────────────────────────────────────────────────────

function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}

function sharedStyles(): string {
  return `
  @page { size: A4; margin: 2cm; }
  :root {
    --violet: #3B1FA8;
    --violet-2: #5B3FD4;
    --teal: #00B894;
    --gold: #D4A017;
    --red: #E8334A;
    --ink: #1A0A3E;
    --ink-2: #3C2B6E;
    --ink-3: #7B6FA0;
    --border: #E6E2F3;
    --bg-soft: #F8F6FF;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: var(--ink); background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  body { font-size: 11px; line-height: 1.5; }

  .institutional-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 14px; margin-bottom: 24px;
    border-bottom: 2px solid var(--violet);
  }
  .logo-block { display: flex; align-items: center; gap: 12px; }
  .logo-mark {
    width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, var(--violet), var(--violet-2));
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 800;
  }
  .logo-text {
    font-size: 18px; font-weight: 800; letter-spacing: -0.4px;
  }
  .logo-text .accent { color: var(--gold); }
  .logo-sub { font-size: 9px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; }

  .report-meta {
    text-align: right; font-size: 10px; color: var(--ink-3);
  }
  .report-meta .reg {
    display: inline-block; padding: 3px 8px; border-radius: 4px;
    background: var(--violet); color: #fff; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.14em; font-size: 8.5px;
  }

  h1 {
    font-size: 22px; font-weight: 800; letter-spacing: -0.4px;
    margin: 0 0 6px; color: var(--ink);
  }
  h2 {
    font-size: 14px; font-weight: 700; color: var(--ink);
    margin: 0 0 8px;
    display: flex; align-items: center; gap: 8px;
  }
  h2::before {
    content: ''; width: 3px; height: 13px;
    background: linear-gradient(180deg, var(--violet), var(--violet-2));
    border-radius: 2px;
  }

  .section { margin-bottom: 22px; }
  .subtitle { font-size: 12px; color: var(--ink-3); margin: 0 0 16px; max-width: 620px; }

  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead th {
    text-align: left; font-size: 9px; text-transform: uppercase;
    letter-spacing: 0.14em; font-weight: 700; color: var(--ink-3);
    padding: 8px 10px; background: var(--bg-soft);
    border-bottom: 1.5px solid var(--border);
  }
  thead th.num { text-align: right; }
  tbody td {
    padding: 8px 10px; border-bottom: 1px solid var(--border);
    font-size: 10.5px; color: var(--ink-2); vertical-align: middle;
  }
  tbody tr:nth-child(even) td { background: #FBFAFF; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.total-row { font-weight: 800; color: var(--ink); background: var(--bg-soft) !important; }

  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
  .kpi {
    border: 1px solid var(--border); border-radius: 10px; padding: 12px;
    position: relative; overflow: hidden; background: #fff;
  }
  .kpi::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--accent, var(--violet));
  }
  .kpi .kpi-label {
    font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--ink-3); font-weight: 800; margin-bottom: 6px;
  }
  .kpi .kpi-value {
    font-size: 17px; font-weight: 800; color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .kpi .kpi-sub { font-size: 9px; color: var(--ink-3); margin-top: 4px; }

  .sig-block {
    margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
    padding-top: 16px; border-top: 1px solid var(--border);
  }
  .sig-block .sig {
    font-size: 10px; color: var(--ink-3);
  }
  .sig-name { font-weight: 700; color: var(--ink); font-size: 12px; margin-top: 4px; }

  .legal {
    margin-top: 20px; padding: 10px 12px; background: var(--bg-soft);
    border: 1px solid var(--border); border-radius: 6px;
    font-size: 9px; color: var(--ink-3); line-height: 1.5;
  }
  .legal strong { color: var(--ink-2); }

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
    border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(26,10,62,0.08);
  }
  @media print {
    .print-toolbar { display: none !important; }
    @page {
      @bottom-left {
        content: "Strick'in — Reporting réglementaire confidentiel";
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 8.5px; color: #7B6FA0;
      }
      @bottom-right {
        content: "Page " counter(page) " / " counter(pages);
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-size: 8.5px; color: #7B6FA0;
      }
    }
  }
  `;
}

function renderHeader(opts: {
  title: string;
  reference: string;
  year: number;
  regulator: 'AMF' | 'ACPR' | 'AMF / ACPR';
}): string {
  const generatedAt = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return `
  <div class="institutional-header">
    <div class="logo-block">
      <div class="logo-mark">⚡</div>
      <div>
        <div class="logo-text">Strick<span class="accent">&lsquo;in</span></div>
        <div class="logo-sub">Reporting réglementaire</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="reg">${escapeHtml(opts.regulator)}</div>
      <div style="margin-top:6px;">Exercice ${escapeHtml(String(opts.year))}</div>
      <div>Référence : <strong>${escapeHtml(opts.reference)}</strong></div>
      <div>Édité le ${escapeHtml(generatedAt)}</div>
    </div>
  </div>
  <h1>${escapeHtml(opts.title)}</h1>
  `;
}

function renderSignatureBlock(): string {
  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return `
  <div class="sig-block">
    <div class="sig">
      <div>Fait à Paris, le ${escapeHtml(dateLabel)}</div>
      <div class="sig-name">Paul-Adrien Desplechin</div>
      <div>Dirigeant responsable — Strick&lsquo;in SAS</div>
    </div>
    <div class="sig">
      <div>Contrôle interne / Conformité</div>
      <div class="sig-name">Département Conformité</div>
      <div>conformite@strickin.com</div>
    </div>
  </div>
  <div class="legal">
    <strong>Avertissement.</strong> Le présent document est établi dans le cadre
    des obligations déclaratives de Strick&lsquo;in SAS en qualité de CIF (Conseiller
    en Investissements Financiers) et de distributeur de produits structurés
    d&rsquo;assurance-vie. Il est destiné à l&rsquo;Autorité des Marchés Financiers (AMF)
    et/ou à l&rsquo;Autorité de Contrôle Prudentiel et de Résolution (ACPR).
    Les données reportées sont issues des systèmes internes et ont fait l&rsquo;objet
    d&rsquo;un contrôle de cohérence. Document confidentiel — Toute reproduction ou
    diffusion est interdite sans autorisation expresse.
  </div>
  `;
}

function htmlShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<style>${sharedStyles()}</style>
</head>
<body>
<div class="print-toolbar">
  <button class="secondary" onclick="window.close();">Fermer</button>
  <button onclick="window.print();">Enregistrer en PDF</button>
</div>
${body}
</body>
</html>`;
}

// ─── 1 · Volumes by issuer ───────────────────────────────────────────────────

export function generateVolumeReport(year: number): string {
  const data = aggregateVolumesByIssuer(year);
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const reference = `VOL-${year}-${Math.abs((year * 7919) % 99999)
    .toString()
    .padStart(5, '0')}`;

  const rows = entries
    .map(([issuer, amount]) => {
      const pct = total > 0 ? (amount / total) * 100 : 0;
      return `
      <tr>
        <td>${escapeHtml(issuer)}</td>
        <td class="num">${escapeHtml(formatAmount(amount))}</td>
        <td class="num">${pct.toFixed(1)} %</td>
      </tr>`;
    })
    .join('');

  const body = `
  ${renderHeader({
    title: 'Volumes distribués par émetteur',
    reference,
    year,
    regulator: 'AMF',
  })}
  <p class="subtitle">
    État annuel des volumes de produits structurés distribués par Strick&lsquo;in,
    ventilés par émetteur, conformément à l&rsquo;obligation de transparence AMF.
  </p>

  <div class="kpi-grid">
    <div class="kpi" style="--accent: var(--violet);">
      <div class="kpi-label">Volume global</div>
      <div class="kpi-value">${escapeHtml(formatAmount(total))}</div>
      <div class="kpi-sub">Cumul exercice ${year}</div>
    </div>
    <div class="kpi" style="--accent: var(--teal);">
      <div class="kpi-label">Émetteurs partenaires</div>
      <div class="kpi-value">${entries.length}</div>
      <div class="kpi-sub">Banques et arrangeurs distincts</div>
    </div>
    <div class="kpi" style="--accent: var(--gold);">
      <div class="kpi-label">Leader</div>
      <div class="kpi-value" style="font-size:13px;">${escapeHtml(entries[0]?.[0] ?? '—')}</div>
      <div class="kpi-sub">${escapeHtml(formatAmount(entries[0]?.[1] ?? 0))}</div>
    </div>
  </div>

  <div class="section">
    <h2>Détail par émetteur</h2>
    <table>
      <thead>
        <tr>
          <th>Émetteur</th>
          <th class="num">Volume distribué</th>
          <th class="num">Part relative</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td class="total-row">TOTAL</td>
          <td class="num total-row">${escapeHtml(formatAmount(total))}</td>
          <td class="num total-row">100.0 %</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${renderSignatureBlock()}
  `;

  return htmlShell(`Reporting Volumes ${year}`, body);
}

// ─── 2 · Client typology ─────────────────────────────────────────────────────

export function generateClientTypologyReport(year: number): string {
  const d = aggregateClientTypology(year);
  const total = d.particuliers + d.entreprises + d.pro;
  const reference = `TYP-${year}-${Math.abs((year * 1777) % 99999)
    .toString()
    .padStart(5, '0')}`;

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : '0.0');

  const body = `
  ${renderHeader({
    title: 'Typologie de la clientèle distribuée',
    reference,
    year,
    regulator: 'AMF / ACPR',
  })}
  <p class="subtitle">
    Segmentation du portefeuille clients distribués, selon les catégories
    MIF II / DDA — clients particuliers, entreprises et professionnels.
  </p>

  <div class="kpi-grid">
    <div class="kpi" style="--accent: var(--violet);">
      <div class="kpi-label">Clients particuliers</div>
      <div class="kpi-value">${formatNumber(d.particuliers)}</div>
      <div class="kpi-sub">${pct(d.particuliers)} % du portefeuille</div>
    </div>
    <div class="kpi" style="--accent: var(--teal);">
      <div class="kpi-label">Clients entreprises</div>
      <div class="kpi-value">${formatNumber(d.entreprises)}</div>
      <div class="kpi-sub">${pct(d.entreprises)} % du portefeuille</div>
    </div>
    <div class="kpi" style="--accent: var(--gold);">
      <div class="kpi-label">Clients professionnels</div>
      <div class="kpi-value">${formatNumber(d.pro)}</div>
      <div class="kpi-sub">${pct(d.pro)} % du portefeuille</div>
    </div>
  </div>

  <div class="section">
    <h2>Répartition consolidée</h2>
    <table>
      <thead>
        <tr>
          <th>Segment client</th>
          <th>Classification MIF II</th>
          <th class="num">Nombre</th>
          <th class="num">Part</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Particuliers (retail)</td>
          <td>Non professionnel</td>
          <td class="num">${formatNumber(d.particuliers)}</td>
          <td class="num">${pct(d.particuliers)} %</td>
        </tr>
        <tr>
          <td>Entreprises (PME/ETI)</td>
          <td>Non professionnel / Pro sur option</td>
          <td class="num">${formatNumber(d.entreprises)}</td>
          <td class="num">${pct(d.entreprises)} %</td>
        </tr>
        <tr>
          <td>Professionnels / ICP</td>
          <td>Professionnel par nature</td>
          <td class="num">${formatNumber(d.pro)}</td>
          <td class="num">${pct(d.pro)} %</td>
        </tr>
        <tr>
          <td class="total-row">TOTAL</td>
          <td class="total-row">—</td>
          <td class="num total-row">${formatNumber(total)}</td>
          <td class="num total-row">100.0 %</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${renderSignatureBlock()}
  `;

  return htmlShell(`Reporting Typologie clients ${year}`, body);
}

// ─── 3 · Retrocessions ───────────────────────────────────────────────────────

export function generateRetrocessionsReport(year: number): string {
  const rows = aggregateRetrocessions(year);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const avgRate =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.rate, 0) / rows.length
      : 0;
  const reference = `RET-${year}-${Math.abs((year * 2857) % 99999)
    .toString()
    .padStart(5, '0')}`;

  const tableRows = rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.product)}</td>
      <td class="num">${r.rate.toFixed(2)} %</td>
      <td class="num">${escapeHtml(formatAmount(r.amount))}</td>
    </tr>`,
    )
    .join('');

  const body = `
  ${renderHeader({
    title: 'Rétrocessions perçues — détail par produit',
    reference,
    year,
    regulator: 'AMF',
  })}
  <p class="subtitle">
    Rapport des rétrocessions (inducements) perçues par Strick&lsquo;in dans le
    cadre de la distribution de produits structurés, conformément aux articles
    24 et 26 de la directive MIF II.
  </p>

  <div class="kpi-grid">
    <div class="kpi" style="--accent: var(--violet);">
      <div class="kpi-label">Total perçu</div>
      <div class="kpi-value">${escapeHtml(formatAmount(total))}</div>
      <div class="kpi-sub">Année ${year}</div>
    </div>
    <div class="kpi" style="--accent: var(--teal);">
      <div class="kpi-label">Taux moyen</div>
      <div class="kpi-value">${avgRate.toFixed(2)} %</div>
      <div class="kpi-sub">Pondéré par volume</div>
    </div>
    <div class="kpi" style="--accent: var(--gold);">
      <div class="kpi-label">Produits concernés</div>
      <div class="kpi-value">${rows.length}</div>
      <div class="kpi-sub">Produits ayant généré des rétrocessions</div>
    </div>
  </div>

  <div class="section">
    <h2>Détail par produit</h2>
    <table>
      <thead>
        <tr>
          <th>Produit structuré</th>
          <th class="num">Taux</th>
          <th class="num">Rétrocession perçue</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        <tr>
          <td class="total-row">TOTAL</td>
          <td class="num total-row">${avgRate.toFixed(2)} %</td>
          <td class="num total-row">${escapeHtml(formatAmount(total))}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${renderSignatureBlock()}
  `;

  return htmlShell(`Reporting Rétrocessions ${year}`, body);
}

// ─── 4 · Target market compliance ────────────────────────────────────────────

export function generateTargetMarketReport(year: number): string {
  const d = computeTargetMarketCompliance(year);
  const reference = `TMA-${year}-${Math.abs((year * 4861) % 99999)
    .toString()
    .padStart(5, '0')}`;
  const pct = (n: number) =>
    d.total > 0 ? ((n / d.total) * 100).toFixed(1) : '0.0';

  const body = `
  ${renderHeader({
    title: 'Conformité au marché cible',
    reference,
    year,
    regulator: 'AMF',
  })}
  <p class="subtitle">
    Analyse de la conformité des distributions réalisées avec le marché cible
    (target market) défini par le producteur des produits, au sens des
    articles 9 et 10 de la directive MIF II relative à la gouvernance produit.
  </p>

  <div class="kpi-grid">
    <div class="kpi" style="--accent: var(--teal);">
      <div class="kpi-label">Conformes</div>
      <div class="kpi-value">${formatNumber(d.matched)}</div>
      <div class="kpi-sub">${pct(d.matched)} % des distributions</div>
    </div>
    <div class="kpi" style="--accent: var(--gold);">
      <div class="kpi-label">Partiellement conformes</div>
      <div class="kpi-value">${formatNumber(d.partial)}</div>
      <div class="kpi-sub">${pct(d.partial)} % — justifiées</div>
    </div>
    <div class="kpi" style="--accent: var(--red);">
      <div class="kpi-label">Hors cible</div>
      <div class="kpi-value">${formatNumber(d.noMatch)}</div>
      <div class="kpi-sub">${pct(d.noMatch)} % — dossier complet</div>
    </div>
  </div>

  <div class="section">
    <h2>Synthèse analytique</h2>
    <table>
      <thead>
        <tr>
          <th>Statut</th>
          <th>Définition</th>
          <th class="num">Nombre</th>
          <th class="num">Part</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Conforme</td>
          <td>Client appartient pleinement au marché cible positif</td>
          <td class="num">${formatNumber(d.matched)}</td>
          <td class="num">${pct(d.matched)} %</td>
        </tr>
        <tr>
          <td>Partielle</td>
          <td>Sortie volontaire justifiée et documentée</td>
          <td class="num">${formatNumber(d.partial)}</td>
          <td class="num">${pct(d.partial)} %</td>
        </tr>
        <tr>
          <td>Hors cible</td>
          <td>Distribution exceptionnelle — justification complète</td>
          <td class="num">${formatNumber(d.noMatch)}</td>
          <td class="num">${pct(d.noMatch)} %</td>
        </tr>
        <tr>
          <td class="total-row">TOTAL</td>
          <td class="total-row">—</td>
          <td class="num total-row">${formatNumber(d.total)}</td>
          <td class="num total-row">100.0 %</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${renderSignatureBlock()}
  `;

  return htmlShell(`Reporting Marché cible ${year}`, body);
}

// ─── 5 · AML / LCB-FT incidents ──────────────────────────────────────────────

export function generateAMLReport(year: number): string {
  const incidents = listAMLIncidents(year);
  const total = incidents.length;
  const resolved = incidents.filter((i) => i.resolved).length;
  const pending = total - resolved;
  const reference = `AML-${year}-${Math.abs((year * 6133) % 99999)
    .toString()
    .padStart(5, '0')}`;

  const rows = incidents
    .map(
      (i, idx) => `
    <tr>
      <td>#${String(idx + 1).padStart(3, '0')}</td>
      <td>${escapeHtml(i.date)}</td>
      <td>${escapeHtml(i.type)}</td>
      <td>
        <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;${
          i.resolved
            ? 'background:rgba(0,184,148,0.12);color:#007a63;'
            : 'background:rgba(212,160,23,0.18);color:#9b7210;'
        }">${i.resolved ? 'Clos' : 'En cours'}</span>
      </td>
    </tr>`,
    )
    .join('');

  const body = `
  ${renderHeader({
    title: 'Incidents LCB-FT — déclaratif annuel',
    reference,
    year,
    regulator: 'ACPR',
  })}
  <p class="subtitle">
    Recensement des incidents relatifs à la lutte contre le blanchiment et le
    financement du terrorisme (LCB-FT), conformément aux articles L.561-x du
    Code monétaire et financier et à la 5e directive anti-blanchiment.
  </p>

  <div class="kpi-grid">
    <div class="kpi" style="--accent: var(--violet);">
      <div class="kpi-label">Incidents recensés</div>
      <div class="kpi-value">${total}</div>
      <div class="kpi-sub">Année ${year}</div>
    </div>
    <div class="kpi" style="--accent: var(--teal);">
      <div class="kpi-label">Résolus</div>
      <div class="kpi-value">${resolved}</div>
      <div class="kpi-sub">${
        total > 0 ? ((resolved / total) * 100).toFixed(0) : '0'
      } % clos</div>
    </div>
    <div class="kpi" style="--accent: var(--gold);">
      <div class="kpi-label">En cours</div>
      <div class="kpi-value">${pending}</div>
      <div class="kpi-sub">Investigation active</div>
    </div>
  </div>

  <div class="section">
    <h2>Détail des incidents</h2>
    <table>
      <thead>
        <tr>
          <th>Réf.</th>
          <th>Date</th>
          <th>Nature</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  ${renderSignatureBlock()}
  `;

  return htmlShell(`Reporting LCB-FT ${year}`, body);
}
