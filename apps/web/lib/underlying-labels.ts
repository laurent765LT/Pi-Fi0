// ─── Underlying ticker → human-readable label ───────────────────────────────
// Maps raw technical ticker codes (Yahoo / Bloomberg / Reuters style) to
// human-readable names for display in the UI. The raw value is preserved in
// the data layer; this helper is only applied at render time.

export const UNDERLYING_LABELS: Record<string, string> = {
  '^STOXX50E': 'Euro Stoxx 50',
  '^ST0XX50E': 'Euro Stoxx 50',
  '^FCHI': 'CAC 40',
  '^GDAXI': 'DAX',
  '^SP500': 'S&P 500',
  '^IXIC': 'Nasdaq',
  'EURIBOR12M': 'Euribor 12 mois',
  'EURIB0R12M': 'Euribor 12 mois',
  'EUR CMS 10Y': 'Euro CMS 10 ans',
  'EURCMS10Y': 'Euro CMS 10 ans',
  'GOLD': 'Or',
  'BRENT': 'Brent',
};

export function formatUnderlying(raw: string | null | undefined): string {
  if (!raw) return '';
  return UNDERLYING_LABELS[raw] ?? raw;
}
