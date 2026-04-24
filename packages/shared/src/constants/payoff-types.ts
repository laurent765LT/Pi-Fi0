/**
 * Display labels and colour palette for {@link PayoffType}.
 *
 * FR labels are the canonical surface in the UI. When adding a new payoff,
 * both records MUST be updated — the Record type makes this a compile error.
 */

import { PayoffType } from '../domain/product';

export const PAYOFF_LABELS: Record<PayoffType, string> = {
  [PayoffType.AUTOCALL_PHOENIX]: 'Autocall Phoenix',
  [PayoffType.AUTOCALL_COUPON]: 'Autocall Coupon',
  [PayoffType.CAPITAL_PROTECTED]: 'Capital Protégé',
  [PayoffType.CONDITIONAL_RATE]: 'Taux Conditionnel',
  [PayoffType.BARRIER_NOTE]: 'Barrier Note',
  [PayoffType.REVERSE]: 'Reverse Convertible',
  [PayoffType.CUSTOM]: 'Sur Mesure',
};

export const PAYOFF_COLORS: Record<PayoffType, string> = {
  [PayoffType.AUTOCALL_PHOENIX]: '#3B1FA8',
  [PayoffType.AUTOCALL_COUPON]: '#5535C4',
  [PayoffType.CAPITAL_PROTECTED]: '#00B894',
  [PayoffType.CONDITIONAL_RATE]: '#1A3FCC',
  [PayoffType.BARRIER_NOTE]: '#D4A017',
  [PayoffType.REVERSE]: '#C0392B',
  [PayoffType.CUSTOM]: '#7B6FA0',
};
