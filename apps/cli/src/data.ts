// ─── Strick'in CLI — Embedded Demo Data ──────────────────────────────────────
// Real structured product data from MeilleurTaux KIDs, used by CLI commands.
// Mirrors apps/web/lib/demo-data.ts for standalone operation.

export type PayoffType = 'AUTOCALL_PHOENIX' | 'AUTOCALL_COUPON' | 'CAPITAL_PROTECTED' | 'CONDITIONAL_RATE' | 'BARRIER_NOTE';

export interface Product {
  id: string;
  isin: string;
  name: string;
  payoffType: PayoffType;
  issuerName: string;
  underlyingYahoo: string;
  underlyingName: string;
  barrierCapPct: number;
  autocallBarrierPct: number | null;
  couponPct: number | null;
  maxGainPct: number | null;
  sri: number;
  maturityDate: string;
  entryFeePct: number;
  status: string;
  description: string;
  fillPct: number;
  targetAmount: number;
  shelfClosingDate: string;
  createdAt: string;
  interestedCount: number;
  totalEngaged: number;
  compatibleInsurers: string[];
  observationDates?: string[];
}

export interface Commitment {
  id: string;
  shelfId: string;
  amount: number;
  status: string;
  productName: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  productName: string;
  type: string;
  ratePct: number;
  amount: number;
  status: string;
  period: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod-001', isin: 'FR0014013A96', name: 'M Rendement 13', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'BNP Paribas Issuance B.V.', underlyingYahoo: '^STOXX50E',
    underlyingName: 'Euronext Eurozone Sector Selection D50P',
    barrierCapPct: 50, autocallBarrierPct: 85, couponPct: null, maxGainPct: 170, sri: 7,
    maturityDate: '2035-12-17', entryFeePct: 5.06, status: 'ACTIVE',
    description: 'Autocall Phoenix indexé sur Euronext Eurozone Sector Selection D50P. Remboursement anticipé si cours ≥ 85% du niveau initial.',
    fillPct: 62, targetAmount: 10_000_000, shelfClosingDate: '2026-04-15',
    createdAt: '2026-02-15T10:00:00Z', interestedCount: 18, totalEngaged: 6_200_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Spirica'],
    observationDates: ['2026-12-02', '2027-12-02', '2028-12-04', '2029-12-03', '2030-12-02'],
  },
  {
    id: 'prod-002', isin: 'FR0014012O42', name: 'M Rendement OR', payoffType: 'CAPITAL_PROTECTED',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: 'GC=F',
    underlyingName: 'iEdge Gold Shares EUR PR Index',
    barrierCapPct: 90, autocallBarrierPct: null, couponPct: null, maxGainPct: 121, sri: 2,
    maturityDate: '2028-12-29', entryFeePct: 2.50, status: 'ACTIVE',
    description: 'Capital protégé à 90% indexé sur l\'or. Performance plafonnée à 121% du Montant Nominal.',
    fillPct: 44, targetAmount: 5_000_000, shelfClosingDate: '2026-05-30',
    createdAt: '2026-03-01T09:00:00Z', interestedCount: 12, totalEngaged: 2_200_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Apicil', 'Suravenir'],
  },
  {
    id: 'prod-003', isin: 'FR0014013AB5', name: 'M Rendement Mixte', payoffType: 'AUTOCALL_COUPON',
    issuerName: 'BNP Paribas Issuance B.V.', underlyingYahoo: '^STOXX50E',
    underlyingName: 'Euronext Eurozone Sector Selection D50P',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 3, maxGainPct: 150, sri: 4,
    maturityDate: '2035-12-17', entryFeePct: 5.93, status: 'ACTIVE',
    description: 'Autocall avec coupon fixe de 3%. Taux de sortie croissant de 5% à 45%. Barrière à 50%.',
    fillPct: 35, targetAmount: 8_000_000, shelfClosingDate: '2026-06-15',
    createdAt: '2026-03-16T14:00:00Z', interestedCount: 8, totalEngaged: 2_800_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Spirica'],
  },
  {
    id: 'prod-004', isin: 'FR0014011938', name: 'M Equilibre CT', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.15, maxGainPct: 6.15, sri: 2,
    maturityDate: '2037-10-05', entryFeePct: 8.18, status: 'ACTIVE',
    description: 'Coupon conditionnel de 6.15% p.a. indexé sur EUR CMS 10 ans. Capital intégralement protégé à maturité.',
    fillPct: 85, targetAmount: 15_000_000, shelfClosingDate: '2026-04-05',
    createdAt: '2026-01-20T08:00:00Z', interestedCount: 32, totalEngaged: 12_750_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Spirica', 'Apicil', 'Suravenir'],
  },
  {
    id: 'prod-005', isin: 'FR0014010O28', name: 'M Ambition 10', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: '^STOXX50E',
    underlyingName: 'iEdge Europe Leaders 20 EW Decrement 50 Points GTR Index',
    barrierCapPct: 50, autocallBarrierPct: 90, couponPct: null, maxGainPct: 100, sri: 6,
    maturityDate: '2035-09-18', entryFeePct: 3.50, status: 'ACTIVE',
    description: 'Autocallable si performance ≥ -10%. Montant d\'intérêt croissant de 10% à 100%. Barrière à 50%.',
    fillPct: 28, targetAmount: 6_000_000, shelfClosingDate: '2026-07-01',
    createdAt: '2026-02-05T11:00:00Z', interestedCount: 6, totalEngaged: 1_680_000,
    compatibleInsurers: ['Generali Vie', 'Spirica'],
  },
  {
    id: 'prod-006', isin: 'FR1459AB8533', name: 'M Ambition 9', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: '^STOXX50E',
    underlyingName: 'Morningstar Eurozone 50 Decrement 50 Point GR EUR',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6,
    maturityDate: '2035-07-11', entryFeePct: 6.50, status: 'ACTIVE',
    description: 'Autocallable sur Morningstar Eurozone 50 Decrement. Gain max 2000€ pour 1000€ investis.',
    fillPct: 55, targetAmount: 4_000_000, shelfClosingDate: '2026-06-01',
    createdAt: '2026-02-20T10:00:00Z', interestedCount: 14, totalEngaged: 2_200_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Apicil'],
  },
  {
    id: 'prod-007', isin: 'FR001400TTR3', name: 'M Equilibre 7', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2037-07-05', entryFeePct: 7.50, status: 'ACTIVE',
    description: 'Coupon conditionnel de 6% p.a. indexé sur EUR CMS 10 ans. Capital protégé à maturité.',
    fillPct: 72, targetAmount: 8_000_000, shelfClosingDate: '2026-05-15',
    createdAt: '2026-01-10T09:00:00Z', interestedCount: 22, totalEngaged: 5_760_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Spirica', 'Apicil', 'Suravenir'],
  },
  {
    id: 'prod-008', isin: 'FR001400YQC1', name: 'Sélection Souveraineté Europe', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: '^STOXX50E',
    underlyingName: 'iEdge Europe Aerospace & Defense 10 EW Decrement 50 Points GTR Index',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 105, sri: 6,
    maturityDate: '2035-06-04', entryFeePct: 3.50, status: 'ACTIVE',
    description: 'Autocallable thématique Défense européenne. Montant d\'intérêt croissant de 10.5% à 105%.',
    fillPct: 92, targetAmount: 12_000_000, shelfClosingDate: '2026-03-30',
    createdAt: '2026-03-18T15:00:00Z', interestedCount: 45, totalEngaged: 11_040_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Spirica', 'Suravenir'],
  },
  {
    id: 'prod-009', isin: 'FR001400TTS1', name: 'M Equilibre 6', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2037-05-05', entryFeePct: 7.50, status: 'ACTIVE',
    description: 'Coupon conditionnel de 6% p.a. indexé sur EUR CMS 10 ans. Capital protégé à maturité.',
    fillPct: 41, targetAmount: 8_000_000, shelfClosingDate: '2026-05-01',
    createdAt: '2026-01-15T10:00:00Z', interestedCount: 10, totalEngaged: 3_280_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Spirica', 'Apicil', 'Suravenir'],
  },
  {
    id: 'prod-010', isin: 'FR001400X1S6', name: 'M Ambition 8', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: '^STOXX50E',
    underlyingName: 'iEdge ESG Transatlantic EW 20 Decrement 50 Points GTR Index',
    barrierCapPct: 50, autocallBarrierPct: 92, couponPct: null, maxGainPct: 90, sri: 5,
    maturityDate: '2035-04-30', entryFeePct: 3.50, status: 'ACTIVE',
    description: 'Autocallable ESG Transatlantique. Montant d\'intérêt croissant de 9% à 90%. Barrière à 50%.',
    fillPct: 33, targetAmount: 5_000_000, shelfClosingDate: '2026-06-30',
    createdAt: '2026-03-19T08:00:00Z', interestedCount: 5, totalEngaged: 1_650_000,
    compatibleInsurers: ['Generali Vie', 'Spirica'],
  },
  {
    id: 'prod-011', isin: 'FRSG00015LJ6', name: 'G Equilibre', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'Taux EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: null, sri: 2,
    maturityDate: '2037-01-19', entryFeePct: 3.00, status: 'ACTIVE',
    description: 'Placement dynamique risqué de type taux. Capital protégé à l\'échéance. Distribution Generali.',
    fillPct: 67, targetAmount: 10_000_000, shelfClosingDate: '2026-04-20',
    createdAt: '2025-12-01T09:00:00Z', interestedCount: 19, totalEngaged: 6_700_000,
    compatibleInsurers: ['Generali Vie'],
  },
  {
    id: 'prod-012', isin: 'FR1459AB4847', name: 'M Equilibre 5', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.00, maxGainPct: 5.00, sri: 2,
    maturityDate: '2037-03-02', entryFeePct: 6.50, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 50€/titre si taux ≤ 3.10%. Capital protégé 100%.',
    fillPct: 78, targetAmount: 7_000_000, shelfClosingDate: '2026-04-10',
    createdAt: '2026-02-01T10:00:00Z', interestedCount: 25, totalEngaged: 5_460_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Apicil'],
  },
  {
    id: 'prod-013', isin: 'FR1459AB3252', name: 'M Equilibre 4', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2036-12-31', entryFeePct: 6.50, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 60€/titre si taux ≤ 3.20%. Capital protégé 100%.',
    fillPct: 50, targetAmount: 6_000_000, shelfClosingDate: '2026-05-15',
    createdAt: '2026-01-25T09:00:00Z', interestedCount: 11, totalEngaged: 3_000_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Apicil'],
  },
  {
    id: 'prod-014', isin: 'FR1459AB3245', name: 'M Equilibre 3', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2036-10-31', entryFeePct: 6.10, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 60€/titre si taux ≤ 3.20%. Capital protégé 100%.',
    fillPct: 45, targetAmount: 6_000_000, shelfClosingDate: '2026-05-20',
    createdAt: '2026-01-28T10:00:00Z', interestedCount: 9, totalEngaged: 2_700_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Apicil'],
  },
  {
    id: 'prod-015', isin: 'FR1459AB3237', name: 'M Equilibre 2', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2036-09-01', entryFeePct: 4.00, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 60€/titre si taux ≤ 3.20%. Capital protégé 100%.',
    fillPct: 38, targetAmount: 5_000_000, shelfClosingDate: '2026-06-01',
    createdAt: '2026-02-10T09:00:00Z', interestedCount: 7, totalEngaged: 1_900_000,
    compatibleInsurers: ['Generali Vie', 'Cardiff Vie', 'Apicil'],
  },
  {
    id: 'prod-016', isin: 'FR1459AB2999', name: 'M Ambition DVEUR', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: '^STOXX50E',
    underlyingName: 'FEDERAL OPTIMAL SELECT-DVEUR',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6,
    maturityDate: '2034-07-05', entryFeePct: 5.00, status: 'ACTIVE',
    description: 'Autocallable avec barrière 10 ans lié à FEDERAL OPTIMAL SELECT-DVEUR. Gain max 100%.',
    fillPct: 22, targetAmount: 4_000_000, shelfClosingDate: '2026-07-15',
    createdAt: '2026-02-18T11:00:00Z', interestedCount: 4, totalEngaged: 880_000,
    compatibleInsurers: ['Generali Vie', 'Apicil'],
  },
  {
    id: 'prod-017', isin: 'FR1459AB0274', name: 'M Rendement 12', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Goldman Sachs International', underlyingYahoo: '^STOXX50E',
    underlyingName: 'S&P Eurozone 50 Net Zero 2050 Paris-Aligned Select 50 Point Decrement Index',
    barrierCapPct: 30, autocallBarrierPct: 100, couponPct: null, maxGainPct: 60, sri: 6,
    maturityDate: '2034-04-19', entryFeePct: 5.00, status: 'ACTIVE',
    description: 'Autocallable ESG sur S&P Eurozone 50 Net Zero 2050 Paris-Aligned. Gain max 60%. Barrière à 30%.',
    fillPct: 15, targetAmount: 3_000_000, shelfClosingDate: '2026-08-01',
    createdAt: '2026-03-20T09:00:00Z', interestedCount: 3, totalEngaged: 450_000,
    compatibleInsurers: ['Generali Vie', 'Spirica'],
  },
];

export const COMMITMENTS: Commitment[] = [
  { id: 'c1', shelfId: 'prod-001', amount: 250_000, status: 'CONFIRMED', productName: 'M Rendement 13', createdAt: '2026-02-15' },
  { id: 'c2', shelfId: 'prod-001', amount: 500_000, status: 'PENDING', productName: 'M Rendement 13', createdAt: '2026-03-01' },
  { id: 'c3', shelfId: 'prod-002', amount: 100_000, status: 'CONFIRMED', productName: 'M Rendement OR', createdAt: '2026-02-20' },
  { id: 'c4', shelfId: 'prod-003', amount: 350_000, status: 'CONFIRMED', productName: 'M Rendement Mixte', createdAt: '2026-01-10' },
  { id: 'c5', shelfId: 'prod-004', amount: 1_000_000, status: 'PENDING', productName: 'M Equilibre CT', createdAt: '2026-03-05' },
  { id: 'c6', shelfId: 'prod-005', amount: 75_000, status: 'CONFIRMED', productName: 'M Ambition 10', createdAt: '2026-02-28' },
  { id: 'c7', shelfId: 'prod-008', amount: 200_000, status: 'WAITING', productName: 'Sélection Souveraineté Europe', createdAt: '2026-03-08' },
  { id: 'c8', shelfId: 'prod-007', amount: 500_000, status: 'CONFIRMED', productName: 'M Equilibre 7', createdAt: '2026-02-10' },
  { id: 'c9', shelfId: 'prod-012', amount: 300_000, status: 'PENDING', productName: 'M Equilibre 5', createdAt: '2026-03-07' },
];

export const COMMISSIONS: Commission[] = [
  { id: 'com-1', productName: 'M Rendement 13', type: 'ENTRY_FEE', ratePct: 2.5, amount: 6_250, status: 'PAID', period: '2026-Q1' },
  { id: 'com-2', productName: 'M Rendement OR', type: 'DISTRIBUTION_FEE', ratePct: 1.0, amount: 1_000, status: 'PAID', period: '2026-Q1' },
  { id: 'com-3', productName: 'M Rendement Mixte', type: 'ENTRY_FEE', ratePct: 3.0, amount: 10_500, status: 'ACCRUED', period: '2026-Q1' },
  { id: 'com-4', productName: 'M Equilibre CT', type: 'MANAGEMENT_FEE', ratePct: 0.5, amount: 5_000, status: 'PAYABLE', period: '2026-Q1' },
  { id: 'com-5', productName: 'M Equilibre 7', type: 'TRAILER_FEE', ratePct: 0.3, amount: 1_500, status: 'PAID', period: '2026-Q1' },
  { id: 'com-6', productName: 'M Ambition 10', type: 'ENTRY_FEE', ratePct: 1.8, amount: 1_350, status: 'ACCRUED', period: '2026-Q1' },
  { id: 'com-7', productName: 'M Equilibre 5', type: 'DISTRIBUTION_FEE', ratePct: 1.2, amount: 3_600, status: 'PAYABLE', period: '2026-Q1' },
  { id: 'com-8', productName: 'Sélection Souveraineté Europe', type: 'STRUCTURING_FEE', ratePct: 0.8, amount: 1_600, status: 'PAID', period: '2026-Q1' },
];

export const ISSUERS = ['BNP Paribas', 'Natixis', 'Goldman Sachs', 'SG Issuer', 'Barclays'];
