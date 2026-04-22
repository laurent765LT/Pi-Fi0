import { DEMO_COMMITMENTS, DEMO_PRODUCTS } from '@/lib/demo-data';

// ─── Reporting aggregations ───────────────────────────────────────────────────
// All functions are deterministic (seeded by the product/commitment data and
// the requested year) and return mock values suitable for a demo AMF/ACPR
// report.

// Helper: pseudo-random deterministic factor from a year + key
function yearFactor(year: number, key: string): number {
  const h = (year + key.length) * 9301 + 49297;
  const seed = Array.from(key).reduce((a, c) => a + c.charCodeAt(0), h);
  // value between 0.7 and 1.3
  return 0.7 + (Math.abs(Math.sin(seed)) * 0.6);
}

// ─── Volumes by issuer ────────────────────────────────────────────────────────

export function aggregateVolumesByIssuer(year: number): Record<string, number> {
  const byIssuer = new Map<string, number>();
  for (const product of DEMO_PRODUCTS) {
    const issuer = product.issuerName ?? 'Émetteur non renseigné';
    const totalEngaged = (product.totalEngaged ?? 0) * yearFactor(year, issuer);
    byIssuer.set(issuer, (byIssuer.get(issuer) ?? 0) + totalEngaged);
  }
  const result: Record<string, number> = {};
  for (const [k, v] of byIssuer.entries()) {
    result[k] = Math.round(v);
  }
  return result;
}

// ─── Client typology ──────────────────────────────────────────────────────────

export function aggregateClientTypology(year: number): {
  particuliers: number;
  entreprises: number;
  pro: number;
} {
  // Derive a client count from commitments, split by weighting
  const base = DEMO_COMMITMENTS.length * 40; // approx 360
  const factor = yearFactor(year, 'typology');
  const total = Math.round(base * factor);
  // Realistic French CGP split
  const particuliers = Math.round(total * 0.68);
  const entreprises = Math.round(total * 0.17);
  const pro = Math.max(0, total - particuliers - entreprises);
  return { particuliers, entreprises, pro };
}

// ─── Retrocessions ────────────────────────────────────────────────────────────

export function aggregateRetrocessions(
  year: number,
): Array<{ product: string; amount: number; rate: number }> {
  const rows: Array<{ product: string; amount: number; rate: number }> = [];
  for (const p of DEMO_PRODUCTS.slice(0, 12)) {
    const engaged = (p.totalEngaged ?? 0) * yearFactor(year, p.id);
    // Synthetic rate: blend of entryFee, between 0.5% and 3.5%
    const rate = Math.max(0.5, Math.min(3.5, (p.entryFeePct ?? 2) * 0.55));
    const amount = Math.round(engaged * (rate / 100));
    rows.push({
      product: p.name,
      amount,
      rate: Math.round(rate * 100) / 100,
    });
  }
  // Sort descending by amount
  rows.sort((a, b) => b.amount - a.amount);
  return rows;
}

// ─── Target market compliance ─────────────────────────────────────────────────

export function computeTargetMarketCompliance(year: number): {
  matched: number;
  partial: number;
  noMatch: number;
  total: number;
} {
  // Based on # of commitments, with a mock split
  const total = Math.round(DEMO_COMMITMENTS.length * 28 * yearFactor(year, 'tm'));
  const matched = Math.round(total * 0.87);
  const partial = Math.round(total * 0.10);
  const noMatch = Math.max(0, total - matched - partial);
  return { matched, partial, noMatch, total };
}

// ─── AML / LCB-FT incidents ───────────────────────────────────────────────────

const INCIDENT_TYPES = [
  'Seuil déclaration espèces',
  'Opération atypique signalée',
  'Contrôle PEP renforcé',
  'Liste de sanctions — revue',
  'Origine des fonds à justifier',
  'KYC non conforme',
  'Suspicion de blanchiment',
];

export function listAMLIncidents(
  year: number,
): Array<{ date: string; type: string; resolved: boolean }> {
  const count = Math.max(3, Math.round(8 * yearFactor(year, 'aml')));
  const incidents: Array<{ date: string; type: string; resolved: boolean }> = [];
  for (let i = 0; i < count; i++) {
    const month = 1 + ((i * 2 + (year % 12)) % 12);
    const day = 1 + ((i * 7 + year) % 27);
    const type = INCIDENT_TYPES[i % INCIDENT_TYPES.length];
    incidents.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      type,
      resolved: i % 4 !== 0, // 75% resolved
    });
  }
  // sort by date ascending
  incidents.sort((a, b) => (a.date < b.date ? -1 : 1));
  return incidents;
}

// ─── Summaries (for cards) ────────────────────────────────────────────────────

export function getVolumesSummary(year: number): {
  total: number;
  issuers: number;
  leader: { name: string; amount: number } | null;
} {
  const byIssuer = aggregateVolumesByIssuer(year);
  const entries = Object.entries(byIssuer);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const leader = entries.sort((a, b) => b[1] - a[1])[0] ?? null;
  return {
    total,
    issuers: entries.length,
    leader: leader ? { name: leader[0], amount: leader[1] } : null,
  };
}

export function getRetrocessionsSummary(year: number): {
  total: number;
  avgRate: number;
  products: number;
} {
  const rows = aggregateRetrocessions(year);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const avgRate =
    rows.length > 0
      ? Math.round(
          (rows.reduce((s, r) => s + r.rate, 0) / rows.length) * 100,
        ) / 100
      : 0;
  return { total, avgRate, products: rows.length };
}
