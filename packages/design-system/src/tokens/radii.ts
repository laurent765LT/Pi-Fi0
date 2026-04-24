/**
 * Border radius tokens.
 *
 * Kept small & editorial by default: we prefer 6–14px corners over
 * the "pill everything" trend.
 */

export const radii = {
  none: '0px',
  xs: '3px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
} as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

export type RadiusToken = keyof typeof radii;
