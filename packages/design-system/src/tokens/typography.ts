/**
 * Typography tokens.
 *
 * Three type families:
 *   - display: Syne (headings, hero text)
 *   - body: DM Sans (paragraphs, UI labels)
 *   - mono: JetBrains Mono / DM Mono (numbers, ISINs, code)
 *
 * The sans stack (Inter + DM Sans fallback) is kept for legacy surfaces
 * that referenced `font-sans` in Tailwind.
 */

export const fontFamilies = {
  sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
  display: ['Syne', 'Inter', 'sans-serif'],
  body: ['DM Sans', 'sans-serif'],
  mono: ['JetBrains Mono', 'DM Mono', 'ui-monospace', 'monospace'],
} as const;

/**
 * Font sizes in px. Designed for the financial / dashboard use-case where
 * dense typography (11–13px body) dominates.
 */
export const fontSizes = {
  '2xs': '10px',
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '28px',
  '5xl': '32px',
  '6xl': '40px',
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.8,
} as const;

export const letterSpacings = {
  tight: '-0.025em',
  normal: '0em',
  wide: '0.05em',
  wider: '0.1em',
  widest: '0.25em',
} as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

export type FontFamilyToken = keyof typeof fontFamilies;
export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
export type LineHeightToken = keyof typeof lineHeights;
export type LetterSpacingToken = keyof typeof letterSpacings;
