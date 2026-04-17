// ─── Portfolio PDF Report Generator ─────────────────────────────────────────
// Generates a printable HTML report styled like an A4 PDF for the client's
// portfolio. The report includes a cover page, client info, KPIs, portfolio
// overview, allocation breakdown, upcoming events, risk analysis and a MIF2
// regulatory disclaimer.

export interface PortfolioReportUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  [key: string]: unknown;
}

export interface PortfolioReportStats {
  total: number;
  confirmed: number;
  waiting: number;
  cancelled: number;
}

export interface PortfolioReportAnalytics {
  totalValue: number;
  avgCoupon: number;
  nextEvent: string | null;
  avgSri: number;
  closestBarrier: { name: string; distance: number } | null;
  shortestMaturity: string | null;
  longestMaturity: string | null;
}

export interface PortfolioReportInput {
  commitments: any[];
  products: any[];
  user: PortfolioReportUser | null;
  stats: PortfolioReportStats;
  analytics: PortfolioReportAnalytics;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmé',
  WAITING: 'En attente',
  PENDING: 'En cours',
  REVIEW: 'En examen',
  CANCELLED: 'Annulé',
};

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: '#00B894',
  WAITING: '#D4A017',
  PENDING: '#3B1FA8',
  REVIEW: '#D4A017',
  CANCELLED: '#E8334A',
};

const PAYOFF_LABELS: Record<string, string> = {
  AUTOCALL_PHOENIX: 'Autocall Phoenix',
  AUTOCALL_COUPON: 'Autocall Coupon',
  CAPITAL_PROTECTED: 'Capital Protégé',
  CONDITIONAL_RATE: 'Taux Conditionnel',
  BARRIER_NOTE: 'Barrier Note',
  AUTRE: 'Autre',
};

const PAYOFF_COLORS: Record<string, string> = {
  AUTOCALL_PHOENIX: '#3B1FA8',
  AUTOCALL_COUPON: '#5B3FD4',
  CAPITAL_PROTECTED: '#00B894',
  CONDITIONAL_RATE: '#D4A017',
  BARRIER_NOTE: '#E8334A',
  AUTRE: '#7B6FA0',
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

function formatPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '--';
  return v.toFixed(1) + '%';
}

/** Escape user-supplied values before embedding them in raw HTML. */
function escapeHtml(value: unknown): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Main entry point ───────────────────────────────────────────────────────

export function generatePortfolioReport(input: PortfolioReportInput): string {
  const { commitments = [], products = [], user, stats, analytics } = input;

  const productMap = new Map<string, any>();
  for (const p of products) {
    if (p?.id) productMap.set(p.id, p);
  }

  const generatedAt = new Date();
  const generatedAtLabel = generatedAt.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const generatedTimeLabel = generatedAt.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const firstName = escapeHtml(user?.firstName ?? '');
  const lastName = escapeHtml(user?.lastName ?? '');
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Client Strick\'in';
  const email = escapeHtml(user?.email ?? '—');
  const company = escapeHtml((user?.company as string | undefined) ?? '—');

  // ── Allocation breakdown by payoff ────────────────────────────────────────
  const payoffMap = new Map<string, { amount: number; count: number }>();
  let allocTotal = 0;
  for (const c of commitments) {
    if (c.status === 'CANCELLED') continue;
    const product = productMap.get(c.shelfId) || productMap.get(c.productId);
    const payoff = product?.payoffType ?? 'AUTRE';
    const amount = c.amount ?? 0;
    allocTotal += amount;
    const entry = payoffMap.get(payoff) ?? { amount: 0, count: 0 };
    entry.amount += amount;
    entry.count += 1;
    payoffMap.set(payoff, entry);
  }
  const allocations = Array.from(payoffMap.entries())
    .map(([name, data]) => ({
      name,
      label: PAYOFF_LABELS[name] ?? name,
      color: PAYOFF_COLORS[name] ?? '#7B6FA0',
      amount: data.amount,
      count: data.count,
      pct: allocTotal > 0 ? (data.amount / allocTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ── Upcoming events (next 5) ──────────────────────────────────────────────
  const now = new Date();
  type EventRow = { date: Date; dateIso: string; label: string; productName: string; type: string };
  const events: EventRow[] = [];
  for (const c of commitments) {
    if (c.status === 'CANCELLED') continue;
    const product = productMap.get(c.shelfId) || productMap.get(c.productId);
    if (!product) continue;
    const productName = c.productName ?? product.name ?? '--';

    if (Array.isArray(product.observationDates)) {
      for (const d of product.observationDates) {
        const dt = new Date(d);
        if (!Number.isNaN(dt.getTime()) && dt > now) {
          events.push({
            date: dt,
            dateIso: d,
            label: 'Date d\'observation',
            productName,
            type: 'observation',
          });
        }
      }
    }
    if (product.shelfClosingDate) {
      const dt = new Date(product.shelfClosingDate);
      if (!Number.isNaN(dt.getTime()) && dt > now) {
        events.push({
          date: dt,
          dateIso: product.shelfClosingDate,
          label: 'Date de clôture',
          productName,
          type: 'closing',
        });
      }
    }
    if (product.maturityDate) {
      const dt = new Date(product.maturityDate);
      if (!Number.isNaN(dt.getTime()) && dt > now) {
        events.push({
          date: dt,
          dateIso: product.maturityDate,
          label: 'Maturité',
          productName,
          type: 'maturity',
        });
      }
    }
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  const upcomingEvents = events.slice(0, 5);

  // ── Risk analysis ─────────────────────────────────────────────────────────
  const activeCount = commitments.filter((c: any) => c.status !== 'CANCELLED').length;
  const topAlloc = allocations[0];
  const concentration = allocations.length > 0 && allocTotal > 0
    ? (topAlloc.amount / allocTotal) * 100
    : 0;

  // ── KPI values ────────────────────────────────────────────────────────────
  const totalEngaged = stats.total ?? 0;
  const confirmedCount = stats.confirmed ?? 0;
  const waitingCount = stats.waiting ?? 0;
  const cancelledCount = stats.cancelled ?? 0;

  // ── Portfolio rows ────────────────────────────────────────────────────────
  const portfolioRows = commitments.map((c: any) => {
    const product = productMap.get(c.shelfId) || productMap.get(c.productId);
    return {
      name: c.productName ?? product?.name ?? '--',
      isin: c.isin || product?.isin || '--',
      amount: c.amount ?? 0,
      status: c.status ?? '--',
      date: c.createdAt ?? null,
      sri: product?.sri ?? null,
      coupon: product?.couponPct ?? null,
      barrier: product?.barrierCapPct ?? null,
    };
  });

  // ── HTML composition ──────────────────────────────────────────────────────
  const portfolioTableRows = portfolioRows.length > 0
    ? portfolioRows
        .map(
          (row) => `
          <tr>
            <td class="col-name">${escapeHtml(row.name)}</td>
            <td class="col-isin"><span class="mono">${escapeHtml(row.isin)}</span></td>
            <td class="col-amount num">${escapeHtml(formatAmount(row.amount))}</td>
            <td class="col-sri num">${escapeHtml(row.sri != null ? String(row.sri) : '--')}</td>
            <td class="col-coupon num">${escapeHtml(formatPct(row.coupon))}</td>
            <td class="col-status">
              <span class="status-pill" style="background:${STATUS_COLOR[row.status] ?? '#7B6FA0'}15;color:${STATUS_COLOR[row.status] ?? '#7B6FA0'};">
                ${escapeHtml(STATUS_LABEL[row.status] ?? row.status)}
              </span>
            </td>
            <td class="col-date">${escapeHtml(formatShortDate(row.date))}</td>
          </tr>`,
        )
        .join('')
    : `
          <tr>
            <td colspan="7" class="empty-row">Aucun engagement enregistré.</td>
          </tr>`;

  const allocationRows = allocations.length > 0
    ? allocations
        .map(
          (a) => `
          <tr>
            <td class="col-alloc-name">
              <span class="alloc-dot" style="background:${a.color};"></span>
              ${escapeHtml(a.label)}
            </td>
            <td class="col-alloc-count num">${a.count}</td>
            <td class="col-alloc-amount num">${escapeHtml(formatAmount(a.amount))}</td>
            <td class="col-alloc-pct num">
              <div class="alloc-bar">
                <div class="alloc-bar-fill" style="width:${Math.min(100, a.pct).toFixed(1)}%;background:${a.color};"></div>
              </div>
              <span class="alloc-pct-label">${a.pct.toFixed(1)}%</span>
            </td>
          </tr>`,
        )
        .join('')
    : `
          <tr>
            <td colspan="4" class="empty-row">Aucune allocation active.</td>
          </tr>`;

  const eventRows = upcomingEvents.length > 0
    ? upcomingEvents
        .map((e) => {
          const daysUntil = Math.max(
            0,
            Math.round((e.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          );
          return `
          <tr>
            <td class="col-evt-date">${escapeHtml(formatShortDate(e.dateIso))}</td>
            <td class="col-evt-delay num">J+${daysUntil}</td>
            <td class="col-evt-type">
              <span class="evt-tag evt-tag-${e.type}">${escapeHtml(e.label)}</span>
            </td>
            <td class="col-evt-name">${escapeHtml(e.productName)}</td>
          </tr>`;
        })
        .join('')
    : `
          <tr>
            <td colspan="4" class="empty-row">Aucun événement à venir.</td>
          </tr>`;

  const closestBarrierLabel = analytics?.closestBarrier
    ? `${escapeHtml(analytics.closestBarrier.name)} <span class="risk-sub">(${analytics.closestBarrier.distance.toFixed(1)} pts)</span>`
    : '—';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Rapport Portfolio — ${fullName}</title>
<style>
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
    margin: 0;
    padding: 0;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: var(--ink);
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-size: 11px;
    line-height: 1.5;
  }

  .page {
    position: relative;
    width: 100%;
    min-height: 27cm;
    padding: 0;
    page-break-after: always;
  }

  .page:last-child { page-break-after: auto; }

  h1, h2, h3, h4 {
    margin: 0;
    font-weight: 700;
    color: var(--ink);
  }

  h1 { font-size: 28px; letter-spacing: -0.5px; }
  h2 { font-size: 16px; letter-spacing: -0.2px; }
  h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--ink-2); }

  p { margin: 0 0 6px; }

  .mono { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 10px; }
  .num { font-variant-numeric: tabular-nums; text-align: right; }

  /* ── Cover page ─────────────────────────────────────────────────────── */

  .cover {
    position: relative;
    background: linear-gradient(135deg, var(--violet) 0%, var(--violet-2) 60%, #7B5FDC 100%);
    color: #fff;
    padding: 48px 44px 36px;
    border-radius: 18px;
    overflow: hidden;
    margin-bottom: 28px;
  }

  .cover::before {
    content: '';
    position: absolute;
    top: -60%; right: -10%;
    width: 380px; height: 380px;
    background: radial-gradient(circle, rgba(212,160,23,0.25), transparent 60%);
    border-radius: 50%;
  }

  .cover::after {
    content: '';
    position: absolute;
    bottom: -40%; left: -10%;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(0,184,148,0.22), transparent 60%);
    border-radius: 50%;
  }

  .cover-inner { position: relative; z-index: 1; }

  .brand-mark {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    font-weight: 800;
    font-size: 22px;
    letter-spacing: -0.5px;
    margin-bottom: 28px;
  }

  .brand-mark .brand-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--gold);
    margin-right: 6px;
  }

  .brand-mark .brand-accent { color: var(--gold); font-size: 22px; }

  .cover h1 {
    color: #fff;
    font-size: 34px;
    line-height: 1.1;
    margin-bottom: 10px;
  }

  .cover .cover-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 32px;
    max-width: 460px;
  }

  .cover-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.18);
  }

  .cover-meta-item .label {
    display: block;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.65);
    margin-bottom: 4px;
    font-weight: 600;
  }

  .cover-meta-item .value {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
  }

  /* ── Section blocks ────────────────────────────────────────────────── */

  .section {
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1.5px solid var(--border);
  }

  .section-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-header h2::before {
    content: '';
    width: 3px;
    height: 14px;
    background: linear-gradient(180deg, var(--violet), var(--violet-2));
    border-radius: 2px;
  }

  .section-header .section-meta {
    font-size: 10px;
    color: var(--ink-3);
    font-weight: 500;
  }

  /* ── KPI grid ──────────────────────────────────────────────────────── */

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .kpi {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    background: #fff;
    position: relative;
    overflow: hidden;
  }

  .kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--kpi-accent, var(--violet));
  }

  .kpi .kpi-label {
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-weight: 700;
    color: var(--ink-3);
    margin-bottom: 8px;
  }

  .kpi .kpi-value {
    font-size: 18px;
    font-weight: 800;
    color: var(--ink);
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }

  .kpi .kpi-sub {
    font-size: 9px;
    color: var(--ink-3);
    margin-top: 4px;
  }

  .kpi.kpi-violet { --kpi-accent: var(--violet); }
  .kpi.kpi-teal   { --kpi-accent: var(--teal); }
  .kpi.kpi-gold   { --kpi-accent: var(--gold); }
  .kpi.kpi-red    { --kpi-accent: var(--red); }

  /* ── Client info card ──────────────────────────────────────────────── */

  .client-card {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 24px;
    margin-bottom: 20px;
  }

  .client-card .field .label {
    display: block;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--ink-3);
    font-weight: 700;
    margin-bottom: 3px;
  }

  .client-card .field .value {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
  }

  /* ── Tables ────────────────────────────────────────────────────────── */

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }

  thead th {
    text-align: left;
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-weight: 700;
    color: var(--ink-3);
    padding: 8px 10px;
    background: var(--bg-soft);
    border-bottom: 1.5px solid var(--border);
  }

  thead th.num { text-align: right; }

  tbody td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    font-size: 10.5px;
    color: var(--ink-2);
    vertical-align: middle;
  }

  tbody tr:nth-child(even) td { background: #FBFAFF; }

  .col-name { font-weight: 600; color: var(--ink); max-width: 170px; }
  .col-isin { color: var(--ink-3); }

  .status-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .empty-row {
    text-align: center;
    color: var(--ink-3);
    padding: 20px !important;
    font-style: italic;
  }

  /* ── Allocation bars ───────────────────────────────────────────────── */

  .alloc-dot {
    display: inline-block;
    width: 9px; height: 9px;
    border-radius: 2px;
    margin-right: 8px;
    vertical-align: middle;
  }

  .col-alloc-pct {
    min-width: 140px;
    white-space: nowrap;
  }

  .alloc-bar {
    display: inline-block;
    width: 100px;
    height: 6px;
    background: #EFEAF9;
    border-radius: 3px;
    overflow: hidden;
    vertical-align: middle;
    margin-right: 8px;
  }

  .alloc-bar-fill {
    height: 100%;
    border-radius: 3px;
  }

  .alloc-pct-label {
    font-weight: 700;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    font-size: 10.5px;
  }

  /* ── Event tags ────────────────────────────────────────────────────── */

  .evt-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  .evt-tag-observation { background: rgba(59,31,168,0.1); color: var(--violet); }
  .evt-tag-closing     { background: rgba(212,160,23,0.15); color: var(--gold); }
  .evt-tag-maturity    { background: rgba(0,184,148,0.12); color: var(--teal); }

  /* ── Risk panels ───────────────────────────────────────────────────── */

  .risk-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .risk-card {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    background: #fff;
  }

  .risk-card .risk-label {
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-weight: 700;
    color: var(--ink-3);
    margin-bottom: 8px;
  }

  .risk-card .risk-value {
    font-size: 16px;
    font-weight: 800;
    color: var(--ink);
    line-height: 1.2;
  }

  .risk-card .risk-sub {
    font-size: 9px;
    color: var(--ink-3);
    font-weight: 500;
  }

  .risk-card .risk-foot {
    font-size: 9px;
    color: var(--ink-3);
    margin-top: 6px;
  }

  .sri-scale {
    display: flex;
    gap: 3px;
    margin-top: 8px;
  }

  .sri-dot {
    flex: 1;
    height: 6px;
    border-radius: 2px;
    background: #EFEAF9;
  }

  .sri-dot.sri-on-low  { background: var(--teal); }
  .sri-dot.sri-on-mid  { background: var(--gold); }
  .sri-dot.sri-on-high { background: var(--red); }

  /* ── Disclaimer ───────────────────────────────────────────────────── */

  .disclaimer {
    margin-top: 30px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-soft);
    font-size: 9px;
    color: var(--ink-3);
    line-height: 1.55;
  }

  .disclaimer strong { color: var(--ink-2); }

  /* ── Footer (page numbering on print) ──────────────────────────────── */

  .footer {
    position: running(footer);
    display: flex;
    justify-content: space-between;
    font-size: 8.5px;
    color: var(--ink-3);
    padding-top: 6px;
    margin-top: 18px;
    border-top: 1px solid var(--border);
  }

  .footer .brand { font-weight: 700; color: var(--ink-2); }

  @page {
    @bottom-left {
      content: "Strick'in — Rapport Portfolio confidentiel";
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 8.5px;
      color: #7B6FA0;
    }
    @bottom-right {
      content: "Page " counter(page) " / " counter(pages);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 8.5px;
      color: #7B6FA0;
    }
  }

  /* ── Print toolbar (hidden when printing) ──────────────────────────── */

  .print-toolbar {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
    display: flex;
    gap: 8px;
  }

  .print-toolbar button {
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    padding: 8px 14px;
    border-radius: 8px;
    border: 0;
    cursor: pointer;
    color: #fff;
    background: linear-gradient(135deg, var(--violet), var(--violet-2));
    box-shadow: 0 6px 18px rgba(59,31,168,0.3);
  }

  .print-toolbar button.secondary {
    background: #fff;
    color: var(--ink-2);
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px rgba(26,10,62,0.08);
  }

  @media print {
    .print-toolbar { display: none !important; }
    .page { page-break-after: always; }
    body { font-size: 10.5px; }
    .cover { margin-bottom: 24px; }
    a { color: inherit; text-decoration: none; }
  }
</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" class="secondary" onclick="window.close();">Fermer</button>
    <button type="button" onclick="window.print();">Imprimer / Enregistrer en PDF</button>
  </div>

  <!-- ── Page 1 : Cover + KPIs + Client info + Portfolio ───────────── -->
  <section class="page">
    <div class="cover">
      <div class="cover-inner">
        <div class="brand-mark">
          <span class="brand-dot"></span>
          Strick<span class="brand-accent">'</span>in
        </div>
        <h1>Rapport Portfolio</h1>
        <p class="cover-subtitle">
          Synthèse personnalisée de vos engagements en produits structurés,
          allocation, risques et échéances à venir.
        </p>
        <div class="cover-meta">
          <div class="cover-meta-item">
            <span class="label">Client</span>
            <span class="value">${fullName}</span>
          </div>
          <div class="cover-meta-item">
            <span class="label">Société</span>
            <span class="value">${company || '—'}</span>
          </div>
          <div class="cover-meta-item">
            <span class="label">Date du rapport</span>
            <span class="value">${escapeHtml(generatedAtLabel)} — ${escapeHtml(generatedTimeLabel)}</span>
          </div>
          <div class="cover-meta-item">
            <span class="label">Référence</span>
            <span class="value mono">STK-${generatedAt.getTime().toString(36).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Informations client</h2>
      </div>
      <div class="client-card">
        <div class="field">
          <span class="label">Nom</span>
          <span class="value">${fullName}</span>
        </div>
        <div class="field">
          <span class="label">Email</span>
          <span class="value">${email}</span>
        </div>
        <div class="field">
          <span class="label">Société</span>
          <span class="value">${company || '—'}</span>
        </div>
        <div class="field">
          <span class="label">Date de génération</span>
          <span class="value">${escapeHtml(generatedAtLabel)}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Synthèse exécutive</h2>
        <span class="section-meta">${activeCount} engagement${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi kpi-violet">
          <div class="kpi-label">Total engagé</div>
          <div class="kpi-value">${escapeHtml(formatAmount(totalEngaged))}</div>
          <div class="kpi-sub">${commitments.length} engagement${commitments.length > 1 ? 's' : ''}</div>
        </div>
        <div class="kpi kpi-teal">
          <div class="kpi-label">Confirmés</div>
          <div class="kpi-value">${confirmedCount}</div>
          <div class="kpi-sub">Positions exécutées</div>
        </div>
        <div class="kpi kpi-gold">
          <div class="kpi-label">En attente</div>
          <div class="kpi-value">${waitingCount}</div>
          <div class="kpi-sub">En cours de validation</div>
        </div>
        <div class="kpi kpi-red">
          <div class="kpi-label">Annulés</div>
          <div class="kpi-value">${cancelledCount}</div>
          <div class="kpi-sub">Retirés du portefeuille</div>
        </div>
      </div>
      <div class="kpi-grid">
        <div class="kpi kpi-violet">
          <div class="kpi-label">Coupon moyen</div>
          <div class="kpi-value">${escapeHtml(formatPct(analytics?.avgCoupon))}</div>
          <div class="kpi-sub">Rendement facial pondéré</div>
        </div>
        <div class="kpi kpi-teal">
          <div class="kpi-label">SRI moyen</div>
          <div class="kpi-value">${analytics?.avgSri ? analytics.avgSri.toFixed(1) : '--'} <span style="font-size:11px;color:var(--ink-3);font-weight:600;">/ 7</span></div>
          <div class="kpi-sub">Indicateur de risque synthétique</div>
        </div>
        <div class="kpi kpi-gold">
          <div class="kpi-label">Prochaine échéance</div>
          <div class="kpi-value" style="font-size:13px;">${escapeHtml(formatShortDate(analytics?.nextEvent))}</div>
          <div class="kpi-sub">Date d'observation / clôture</div>
        </div>
        <div class="kpi kpi-violet">
          <div class="kpi-label">Types de payoff</div>
          <div class="kpi-value">${allocations.length}</div>
          <div class="kpi-sub">Diversification structurelle</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Vue d'ensemble du portefeuille</h2>
        <span class="section-meta">${commitments.length} ligne${commitments.length > 1 ? 's' : ''}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>ISIN</th>
            <th class="num">Montant</th>
            <th class="num">SRI</th>
            <th class="num">Coupon</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${portfolioTableRows}
        </tbody>
      </table>
    </div>
  </section>

  <!-- ── Page 2 : Allocation + Events + Risk + Disclaimer ──────────── -->
  <section class="page">
    <div class="section">
      <div class="section-header">
        <h2>Répartition par type de payoff</h2>
        <span class="section-meta">Total : ${escapeHtml(formatAmount(allocTotal))}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Type de payoff</th>
            <th class="num">Nb produits</th>
            <th class="num">Montant</th>
            <th class="num">Répartition</th>
          </tr>
        </thead>
        <tbody>${allocationRows}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Prochaines échéances</h2>
        <span class="section-meta">5 événements à venir</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th class="num">Délai</th>
            <th>Type</th>
            <th>Produit</th>
          </tr>
        </thead>
        <tbody>${eventRows}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Analyse des risques</h2>
        <span class="section-meta">Indicateurs pondérés du portefeuille</span>
      </div>
      <div class="risk-grid">
        <div class="risk-card">
          <div class="risk-label">SRI moyen</div>
          <div class="risk-value">${analytics?.avgSri ? analytics.avgSri.toFixed(1) : '--'} <span class="risk-sub">/ 7</span></div>
          <div class="sri-scale">
            ${[1, 2, 3, 4, 5, 6, 7]
              .map((lvl) => {
                const sri = analytics?.avgSri ?? 0;
                const on = sri >= lvl;
                let cls = 'sri-on-low';
                if (lvl >= 5) cls = 'sri-on-high';
                else if (lvl >= 3) cls = 'sri-on-mid';
                return `<div class="sri-dot ${on ? cls : ''}"></div>`;
              })
              .join('')}
          </div>
          <div class="risk-foot">Échelle réglementaire PRIIPs (1 : faible, 7 : élevé)</div>
        </div>
        <div class="risk-card">
          <div class="risk-label">Barrière la plus proche</div>
          <div class="risk-value" style="font-size:13px;">${closestBarrierLabel}</div>
          <div class="risk-foot">Distance spot / barrière de protection</div>
        </div>
        <div class="risk-card">
          <div class="risk-label">Concentration max</div>
          <div class="risk-value">${concentration.toFixed(1)}%</div>
          <div class="risk-foot">${topAlloc ? escapeHtml(topAlloc.label) : '—'} — plus grande allocation</div>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>Avertissement réglementaire (MIF II / PRIIPs).</strong>
      Ce document est généré à titre purement informatif à partir des données enregistrées
      dans votre espace Strick'in. Il ne constitue en aucun cas un conseil en investissement,
      une recommandation personnalisée, une offre ou une sollicitation d'achat ou de vente de
      produits financiers au sens de la directive 2014/65/UE (MIF II). Les produits structurés
      présentés sont des instruments complexes pouvant entraîner une perte en capital partielle
      ou totale. Les performances passées ne préjugent pas des performances futures. Avant toute
      décision d'investissement, il appartient au client de prendre connaissance du Document
      d'Informations Clés (DIC / KID) et du prospectus de l'émetteur, et de s'assurer de
      l'adéquation du produit à sa situation financière, ses objectifs et son horizon de
      placement. Strick'in décline toute responsabilité quant à l'utilisation des informations
      figurant dans ce rapport. Rapport confidentiel, destiné au seul usage de son
      destinataire.
    </div>
  </section>

  <script>
    // Print toolbar keeps rendering in print mode unless explicitly hidden.
    // The @media print rule handles that; we just wire the buttons.
  </script>
</body>
</html>`;
}
