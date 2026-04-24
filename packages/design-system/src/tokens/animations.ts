/**
 * Animation & motion tokens.
 *
 * Used by Tailwind's `animation`/`keyframes` extension and by components
 * that apply transitions programmatically. Reduced-motion fallback is
 * handled via a global `@media (prefers-reduced-motion: reduce)` rule
 * in `apps/web/app/globals.css`.
 */

export const durations = {
  fastest: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '800ms',
} as const;

export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
} as const;

/**
 * Named animations — mirror of `tailwind.config.ts#animation`.
 * Consumers use Tailwind's `animate-<name>` class; this enum is provided
 * for programmatic access (e.g. framer-motion variants, React Native).
 */
export const animations = {
  fadeIn: { duration: '400ms', easing: 'cubic-bezier(0, 0, 0.2, 1)' },
  slideUp: { duration: '400ms', easing: 'cubic-bezier(0, 0, 0.2, 1)' },
  slideInRight: { duration: '300ms', easing: 'cubic-bezier(0, 0, 0.2, 1)' },
  scaleIn: { duration: '200ms', easing: 'cubic-bezier(0, 0, 0.2, 1)' },
  pulseSubtle: { duration: '2000ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  shimmer: { duration: '1500ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  counter: { duration: '600ms', easing: 'cubic-bezier(0, 0, 0.2, 1)' },
} as const;

/**
 * Stagger delays used by list/grid reveals (see `.stagger-children`).
 * Exposed as a numeric array so callers can pick the delay by index.
 */
export const staggerDelays = [0, 60, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440] as const;

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

export type DurationToken = keyof typeof durations;
export type EasingToken = keyof typeof easings;
export type AnimationToken = keyof typeof animations;
