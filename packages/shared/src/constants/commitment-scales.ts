/**
 * Canonical commitment-amount scale used across UI quick-picks and seed data.
 *
 * These are the ONLY default buttons surfaced in the UI; custom amounts remain
 * possible server-side but must comply with the min / max allowed per Insurer
 * rule (see `InsurerRule.minNominal`).
 */

export interface CommitmentScale {
  /** Short human label (e.g. `10k`, `1M`). */
  readonly label: string;
  /** Raw EUR amount. */
  readonly value: number;
}

export const COMMITMENT_SCALES = [
  { label: '10k', value: 10_000 },
  { label: '25k', value: 25_000 },
  { label: '50k', value: 50_000 },
  { label: '100k', value: 100_000 },
  { label: '250k', value: 250_000 },
  { label: '500k', value: 500_000 },
  { label: '1M', value: 1_000_000 },
  { label: '5M', value: 5_000_000 },
  { label: '10M', value: 10_000_000 },
] as const satisfies readonly CommitmentScale[];

export type CommitmentScaleLabel = (typeof COMMITMENT_SCALES)[number]['label'];
