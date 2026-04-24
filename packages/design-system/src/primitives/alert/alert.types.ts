import type { HTMLAttributes, ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  /** Optional custom icon — if omitted, a default SVG per variant is used. */
  icon?: ReactNode;
  /** When set, renders a dismiss (X) button that invokes this callback. */
  onDismiss?: () => void;
  children?: ReactNode;
}
