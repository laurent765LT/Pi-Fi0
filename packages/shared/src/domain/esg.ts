/**
 * ESG / SFDR domain types.
 *
 * Not yet persisted by Prisma — kept as contract types shared between the
 * pricing engine (scoring) and the front-end (badges / filters).
 */

/**
 * SFDR (Sustainable Finance Disclosure Regulation) classification:
 * - ART_6: No ESG focus.
 * - ART_8: Promotes environmental / social characteristics ("light green").
 * - ART_9: Has sustainable investment as its objective ("dark green").
 */
export const SFDRClassification = {
  ART_6: 'ART_6',
  ART_8: 'ART_8',
  ART_9: 'ART_9',
  NON_ESG: 'NON_ESG',
} as const;
export type SFDRClassification = (typeof SFDRClassification)[keyof typeof SFDRClassification];

/**
 * High-level ESG score bucket for product listings.
 * Computed from underlying index / basket screens.
 */
export const ESGBucket = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  UNRATED: 'UNRATED',
} as const;
export type ESGBucket = (typeof ESGBucket)[keyof typeof ESGBucket];

/**
 * ESG score attached to a Product / Underlying.
 *
 * @property overall - Aggregate 0-100 score.
 * @property environmental - E-pillar 0-100.
 * @property social - S-pillar 0-100.
 * @property governance - G-pillar 0-100.
 * @property sfdr - SFDR regulatory classification.
 * @property principalAdverseImpacts - PAIs disclosed (free-form list).
 */
export interface ESGScore {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  bucket: ESGBucket;
  sfdr: SFDRClassification;
  principalAdverseImpacts: string[];
  ratedAt: string;
}
