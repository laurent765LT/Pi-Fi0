import type { HTMLAttributes, ReactNode } from 'react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** Text shown in the tooltip bubble. */
  content: string;
  /** Side relative to the trigger. Default: `top`. */
  side?: TooltipSide;
  children: ReactNode;
}
