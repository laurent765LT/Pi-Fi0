/**
 * SRI (Synthetic Risk Indicator, PRIIPs) colour scale.
 *
 * The 1-7 scale is regulatory: the UI must use the same colour for the same
 * level across every screen. Keep this palette in sync with the design system.
 */

export type SriLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const SRI_COLORS: Record<SriLevel, string> = {
  1: '#00B894',
  2: '#00B894',
  3: '#6FCF97',
  4: '#F2C94C',
  5: '#F2994A',
  6: '#EB5757',
  7: '#E8334A',
};

export const SRI_LABELS: Record<SriLevel, string> = {
  1: 'Risque très faible',
  2: 'Risque faible',
  3: 'Risque modéré',
  4: 'Risque intermédiaire',
  5: 'Risque élevé',
  6: 'Risque très élevé',
  7: 'Risque extrême',
};
