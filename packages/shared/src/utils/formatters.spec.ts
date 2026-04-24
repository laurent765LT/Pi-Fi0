import { describe, expect, it } from 'vitest';
import {
  formatBps,
  formatDate,
  formatEuros,
  formatIsin,
  formatPct,
  formatSiren,
} from './formatters';

// The Intl implementation renders narrow non-breaking spaces (U+202F) in
// modern Node versions. Normalise to regular whitespace before asserting so
// the tests stay readable and robust across Node versions.
const ns = (s: string): string => s.replace(/\s/g, ' ');

describe('formatEuros', () => {
  it('formats integer amounts without decimals by default', () => {
    expect(ns(formatEuros(10_000))).toBe('10 000 €');
  });

  it('respects the precision option', () => {
    expect(ns(formatEuros(1234.5, { precision: 2 }))).toBe('1 234,50 €');
  });

  it('renders zero as 0 €', () => {
    expect(ns(formatEuros(0))).toBe('0 €');
  });
});

describe('formatPct', () => {
  it('renders percent-points by default', () => {
    expect(ns(formatPct(12.5))).toBe('12,5 %');
  });

  it('converts from ratio when asked', () => {
    expect(ns(formatPct(0.125, { fromRatio: true }))).toBe('12,5 %');
  });

  it('respects the decimals option', () => {
    expect(ns(formatPct(7, { decimals: 0 }))).toBe('7 %');
  });
});

describe('formatDate', () => {
  it('renders a parseable ISO date', () => {
    expect(formatDate('2026-03-19T00:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns an empty string on invalid input', () => {
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatIsin', () => {
  it('groups a 12-char ISIN in 4 blocks', () => {
    expect(formatIsin('FR0014010028')).toBe('FR 0014 0100 28');
  });

  it('returns the clean uppercase string when length is wrong', () => {
    expect(formatIsin('abc')).toBe('ABC');
  });
});

describe('formatBps', () => {
  it('renders a bps suffix', () => {
    expect(ns(formatBps(25))).toBe('25 bps');
    expect(ns(formatBps(1200))).toBe('1 200 bps');
  });
});

describe('formatSiren', () => {
  it('formats a SIREN as 3-3-3 digit groups', () => {
    expect(formatSiren('123456789')).toBe('123 456 789');
  });

  it('returns the cleaned input when length is wrong', () => {
    expect(formatSiren('abc12')).toBe('12');
  });
});
