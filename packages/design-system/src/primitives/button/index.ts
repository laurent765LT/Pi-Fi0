/**
 * Button primitive — public API.
 *
 * The runtime implementation currently lives in
 * `apps/web/components/ui/button.tsx`. During the migration phase we only
 * expose the type contract here; once the component is physically moved
 * into this package it will also export the component itself.
 *
 * See the README's "Migration roadmap" for the step-by-step plan.
 */
export type { ButtonProps, ButtonVariant, ButtonSize } from './button.types';
