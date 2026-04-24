/**
 * PRIIPs / MIF II Target Market domain types.
 *
 * Source: ESMA MIF II product governance guidelines and PRIIPs RTS.
 * Not persisted on Product today — shared as a contract for DDA / KID flows.
 */

/** Investor category (retail / professional / eligible counterparty). */
export const InvestorCategory = {
  RETAIL: 'RETAIL',
  PROFESSIONAL: 'PROFESSIONAL',
  ELIGIBLE_COUNTERPARTY: 'ELIGIBLE_COUNTERPARTY',
} as const;
export type InvestorCategory = (typeof InvestorCategory)[keyof typeof InvestorCategory];

/** Knowledge & experience level of the target investor. */
export const KnowledgeExperience = {
  BASIC: 'BASIC',
  INFORMED: 'INFORMED',
  ADVANCED: 'ADVANCED',
} as const;
export type KnowledgeExperience =
  (typeof KnowledgeExperience)[keyof typeof KnowledgeExperience];

/** Financial capacity to bear losses. */
export const LossBearingCapacity = {
  NO_LOSS: 'NO_LOSS',
  LIMITED: 'LIMITED',
  SIGNIFICANT: 'SIGNIFICANT',
  TOTAL: 'TOTAL',
} as const;
export type LossBearingCapacity =
  (typeof LossBearingCapacity)[keyof typeof LossBearingCapacity];

/** Risk tolerance mapped to the PRIIPs 1-7 SRI scale. */
export const RiskTolerance = {
  SRI_1: 'SRI_1',
  SRI_2: 'SRI_2',
  SRI_3: 'SRI_3',
  SRI_4: 'SRI_4',
  SRI_5: 'SRI_5',
  SRI_6: 'SRI_6',
  SRI_7: 'SRI_7',
} as const;
export type RiskTolerance = (typeof RiskTolerance)[keyof typeof RiskTolerance];

/** Investment objective of the target investor. */
export const InvestmentObjective = {
  CAPITAL_PRESERVATION: 'CAPITAL_PRESERVATION',
  INCOME: 'INCOME',
  GROWTH: 'GROWTH',
  SPECULATION: 'SPECULATION',
  HEDGING: 'HEDGING',
} as const;
export type InvestmentObjective =
  (typeof InvestmentObjective)[keyof typeof InvestmentObjective];

/**
 * Full PRIIPs target-market profile attached to a Product.
 *
 * @property holdingPeriodMonths - Recommended minimum holding period.
 */
export interface TargetMarket {
  investorCategories: InvestorCategory[];
  knowledge: KnowledgeExperience;
  lossBearing: LossBearingCapacity;
  riskTolerance: RiskTolerance;
  objectives: InvestmentObjective[];
  holdingPeriodMonths: number;
  /** Free-text negative target market (who should NOT buy). */
  negativeTargetMarket: string[];
}
