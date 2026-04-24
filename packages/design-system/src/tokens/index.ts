/**
 * Design tokens — single source of truth for all visual values.
 *
 * Tokens are plain TypeScript constants. They do NOT depend on React,
 * Tailwind, or any platform-specific API, so they can be consumed by:
 *   - the Next.js app (via Tailwind + className)
 *   - a future React Native app (via StyleSheet)
 *   - Node scripts (e.g. a Figma exporter)
 */

export {
  colors,
  darkColors,
  gradients,
  type ColorScale,
  type ColorToken,
  type DarkColorToken,
  type GradientToken,
} from './colors';

export {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  type FontFamilyToken,
  type FontSizeToken,
  type FontWeightToken,
  type LineHeightToken,
  type LetterSpacingToken,
} from './typography';

export {
  spacing,
  spacingPx,
  containers,
  type SpacingToken,
  type ContainerToken,
} from './spacing';

export {
  shadows,
  inkShadows,
  type ShadowToken,
  type InkShadowToken,
} from './shadows';

export { radii, type RadiusToken } from './radii';

export {
  durations,
  easings,
  animations,
  staggerDelays,
  type DurationToken,
  type EasingToken,
  type AnimationToken,
} from './animations';
