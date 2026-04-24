import type { ReactNode } from 'react';

export interface TermTooltipProps {
  /** The term the tooltip defines (e.g. "SRI", "Barrière"). */
  term: string;
  /** Plain-text definition shown in the bubble. */
  definition: string;
  /**
   * Custom trigger content. Defaults to rendering the term itself as text.
   * Use this slot when the trigger already contains the term formatted
   * (e.g. inside a heading).
   */
  children?: ReactNode;
}

/**
 * Glossary record shared across the app.
 * Keys are French terms; values are the definitions shown in the tooltip.
 */
export type FinancialGlossary = Record<string, string>;
