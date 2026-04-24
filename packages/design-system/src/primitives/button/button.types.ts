import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * Visual variants available for Button.
 *
 * - `primary`  — solid violet, main CTA
 * - `cobalt`   — solid cobalt, secondary CTA (data/analytics context)
 * - `outline`  — transparent w/ violet border, low-emphasis CTA
 * - `ghost`    — violet-tinted background, very low emphasis
 * - `teal`     — success / confirm actions
 * - `danger`   — destructive / error actions
 * - `muted`    — disabled-looking surface buttons (filters, tags)
 */
export type ButtonVariant =
  | 'primary'
  | 'cobalt'
  | 'outline'
  | 'ghost'
  | 'teal'
  | 'danger'
  | 'muted';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When true, show a spinner and disable the button. */
  loading?: boolean;
  /**
   * When true, the Button renders its child element directly, merging its
   * own props onto it. Useful for rendering a `<Link>` as a button.
   */
  asChild?: boolean;
  children?: ReactNode;
}
