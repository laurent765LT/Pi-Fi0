/**
 * Color tokens — single source of truth for Strick'in palette.
 *
 * These values are mirrored in `apps/web/tailwind.config.ts` and
 * `apps/web/app/globals.css`. If you change a value here, update those too.
 *
 * The palette is organised in three layers:
 *   1. Brand scales — violet, cobalt (primary accents)
 *   2. Semantic scales — teal (success), gold (warning), red (danger)
 *   3. Neutral scales — ink (text), surface (backgrounds), border
 *   4. Editorial "redesign" namespace — flatter palette used for the
 *      newer editorial layouts (see `.btn-primary-new`, `.card-new`, ...).
 */

export const colors = {
  /** Primary brand: violet */
  violet: {
    DEFAULT: '#3B1FA8',
    dark: '#270F7A',
    mid: '#5535C4',
    light: '#7B5FE0',
    pale: '#EDE8FF',
    ghost: '#F7F5FF',
  },

  /** Secondary brand: cobalt */
  cobalt: {
    DEFAULT: '#0A2799',
    mid: '#1A3FCC',
    light: '#3D63F5',
    pale: '#E4EAFF',
  },

  /** Text — "ink" scale from darkest (1) to lightest (4) */
  ink: {
    DEFAULT: '#1A0A3E',
    2: '#3D2C6E',
    3: '#7B6FA0',
    4: '#A99EC4',
  },

  /** Backgrounds */
  surface: {
    DEFAULT: '#FAFAF8',
    2: '#F4F3EF',
    3: '#EEEDEA',
  },

  /** Borders */
  border: {
    DEFAULT: '#E2DFF5',
    2: '#CCC8EA',
    subtle: '#F0EEF8',
  },

  /** Semantic: success */
  teal: {
    DEFAULT: '#00B894',
    light: '#E6FAF5',
  },

  /** Semantic: warning */
  gold: {
    DEFAULT: '#D4A017',
    light: '#FFF8E7',
  },

  /** Semantic: danger */
  red: {
    DEFAULT: '#E8334A',
    light: '#FFF0F2',
  },

  /**
   * Editorial redesign palette — flatter, warmer neutrals used for the
   * newer marketing / dashboard layouts. Kept as a separate namespace
   * so the legacy and editorial looks can coexist.
   */
  redesign: {
    white: '#FFFFFF',
    offWhite: '#FCFCFB',
    surface: '#F5F4F1',
    surface2: '#EFEDE8',
    border: '#ECEAE4',
    borderStrong: '#D8D5CE',
    textPrimary: '#1A1815',
    textSecondary: '#5C5955',
    textTertiary: '#A8A59E',
    accent: '#3B1FA8',
    accentHover: '#2D178A',
    accentLight: '#F0ECFA',
    accentSubtle: '#F8F6FE',
    success: '#2D7A4E',
    successBg: '#F3F7F4',
    warning: '#A66A12',
    warningBg: '#FAF7F1',
    danger: '#B33636',
    dangerBg: '#FAF3F3',
    info: '#2E5AA8',
    infoBg: '#F2F5FA',
    goldNew: '#B8902A',
  },
} as const;

/**
 * Dark-mode overrides applied to the root palette when `.dark` is active.
 * Mirror of the `.dark { ... }` block in `apps/web/app/globals.css`.
 */
export const darkColors = {
  bg: '#0F0A1E',
  bg2: '#1A1230',
  surface: '#1E1636',
  ink: {
    DEFAULT: '#F0ECF8',
    2: '#C4BBD9',
    3: '#8E82A8',
  },
  border: {
    DEFAULT: '#2D2347',
    2: '#3D3360',
  },
} as const;

/**
 * Brand gradients used across buttons, CTAs and heroes.
 */
export const gradients = {
  violet: 'linear-gradient(135deg, #270F7A 0%, #3B1FA8 40%, #5535C4 70%, #1A3FCC 100%)',
  bar: 'linear-gradient(90deg, #270F7A, #3B1FA8, #5535C4, #1A3FCC, #3D63F5)',
  card: 'linear-gradient(135deg, rgba(59,31,168,0.02) 0%, rgba(61,99,245,0.02) 100%)',
  shine:
    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
  textViolet: 'linear-gradient(135deg, #3B1FA8 0%, #5535C4 50%, #1A3FCC 100%)',
} as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

export type ColorScale = keyof typeof colors;
export type ColorToken = typeof colors;
export type DarkColorToken = typeof darkColors;
export type GradientToken = keyof typeof gradients;
