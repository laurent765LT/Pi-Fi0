/**
 * @strickin/design-system — shared design tokens, primitive types,
 * patterns, and utilities.
 *
 * Import from sub-paths when possible to keep bundle size tight:
 *   - `@strickin/design-system/tokens`   — tokens only (no React dep)
 *   - `@strickin/design-system/utils`    — `cn` and other helpers
 *   - `@strickin/design-system/primitives` — type contracts for primitives
 *   - `@strickin/design-system/patterns`   — type contracts for patterns
 *
 * The root export below re-bundles everything for convenience.
 */

export * from './tokens';
export * from './primitives';
export * from './patterns';
export * from './utils';
