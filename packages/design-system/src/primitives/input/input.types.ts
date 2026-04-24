import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible text label rendered above the input. */
  label?: string;
  /** Helper text rendered below the input. Hidden when `error` is set. */
  hint?: string;
  /** Error message. When present, switches styling to the danger state. */
  error?: string;
}
