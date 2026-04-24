/**
 * Deterministic formatters used across front + back.
 *
 * All formatters are pure functions — no browser-only APIs, no i18n state.
 * The `Intl` API is used with explicit `fr-FR` locale to avoid drift between
 * environments.
 */

/**
 * Format an EUR amount using French conventions.
 *
 * @example
 * formatEuros(10_000)                   // "10 000 €"
 * formatEuros(1_234.56, { precision: 2 })  // "1 234,56 €"
 */
export function formatEuros(
  amount: number,
  opts: { precision?: number } = {},
): string {
  const precision = opts.precision ?? 0;
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  return formatter.format(amount);
}

/**
 * Format a fractional value as a percentage.
 *
 * By default, the input is already expressed in percent points (e.g. `12.5`
 * renders as `12,5 %`). Pass `fromRatio: true` to convert a 0-1 ratio.
 *
 * @example
 * formatPct(12.5)                        // "12,5 %"
 * formatPct(0.125, { fromRatio: true })  // "12,5 %"
 */
export function formatPct(
  value: number,
  opts: { decimals?: number; fromRatio?: boolean } = {},
): string {
  const decimals = opts.decimals ?? 1;
  const percent = opts.fromRatio === true ? value * 100 : value;
  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(percent)} %`;
}

/**
 * Format an ISO date string / Date into `dd/MM/yyyy`.
 *
 * Invalid input returns an empty string (callers must treat the empty string
 * as "no date").
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });
  return formatter.format(date);
}

/**
 * Format an ISIN with space separators for readability.
 *
 * @example
 * formatIsin('FR0014010028') // "FR 0014 0100 28"
 */
export function formatIsin(isin: string): string {
  const clean = isin.replace(/\s+/g, '').toUpperCase();
  if (clean.length !== 12) {
    return clean;
  }
  return `${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(6, 10)} ${clean.slice(10, 12)}`;
}

/**
 * Format a number of basis points.
 *
 * @example
 * formatBps(25) // "25 bps"
 */
export function formatBps(bps: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(bps)} bps`;
}

/**
 * Format a SIREN (9 digits) with spaces: `123 456 789`.
 */
export function formatSiren(siren: string): string {
  const clean = siren.replace(/\D/g, '');
  if (clean.length !== 9) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
}
