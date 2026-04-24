/**
 * Shadow tokens.
 *
 * Two families:
 *   - violet-tinted (default) — elevations tinted with the brand violet
 *     so cards feel coherent with the palette.
 *   - neutral (ink) — used for the editorial redesign where the violet
 *     tint would be too expressive.
 */

export const shadows = {
  xs: '0 1px 2px rgba(59,31,168,0.04)',
  sm: '0 2px 8px rgba(59,31,168,0.06)',
  md: '0 4px 16px rgba(59,31,168,0.08)',
  lg: '0 8px 32px rgba(59,31,168,0.12)',
  xl: '0 16px 48px rgba(59,31,168,0.16)',
  violet: '0 4px 20px rgba(59,31,168,0.28)',
  innerGlow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
  card: '0 1px 3px rgba(59,31,168,0.04), 0 4px 12px rgba(59,31,168,0.03)',
  cardHover:
    '0 4px 12px rgba(59,31,168,0.06), 0 12px 28px rgba(59,31,168,0.08)',
  glow: '0 0 20px rgba(59,31,168,0.12)',
} as const;

/** Neutral ink-tinted shadows (editorial redesign). */
export const inkShadows = {
  xs: '0 1px 2px rgba(26, 10, 62, 0.04)',
  sm: '0 1px 3px rgba(26, 10, 62, 0.06), 0 1px 2px rgba(26, 10, 62, 0.04)',
  md: '0 4px 6px -1px rgba(26, 10, 62, 0.06), 0 2px 4px -2px rgba(26, 10, 62, 0.04)',
  lg: '0 10px 15px -3px rgba(26, 10, 62, 0.06), 0 4px 6px -4px rgba(26, 10, 62, 0.04)',
  xl: '0 20px 25px -5px rgba(26, 10, 62, 0.06), 0 8px 10px -6px rgba(26, 10, 62, 0.04)',
} as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

export type ShadowToken = keyof typeof shadows;
export type InkShadowToken = keyof typeof inkShadows;
