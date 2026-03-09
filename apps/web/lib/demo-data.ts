// ─── Demo Mode Data ──────────────────────────────────────────────────────────
// Real product data extracted from MeilleurTaux Placement structured product KIDs
// Used when the backend API is unavailable (e.g., Vercel-only deployment)

export const DEMO_USERS: Record<string, { id: string; email: string; firstName: string; lastName: string; role: string; orgId: string; password: string }> = {
  'admin@strickin.com': {
    id: 'demo-admin-001',
    email: 'admin@strickin.com',
    firstName: 'Paul-Adrien',
    lastName: 'Desplechin',
    role: 'SUPER_ADMIN',
    orgId: 'org-admin',
    password: 'Strickin2025!',
  },
  'cgp@demo.com': {
    id: 'demo-cgp-001',
    email: 'cgp@demo.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'VIEWER',
    orgId: 'org-broker',
    password: 'Strickin2025!',
  },
  'assureur@cardiff.fr': {
    id: 'demo-assureur-001',
    email: 'assureur@cardiff.fr',
    firstName: 'Delphine',
    lastName: 'Martin',
    role: 'ORG_ADMIN',
    orgId: 'org-cardiff',
    password: 'Strickin2025!',
  },
};

export const DEMO_PRODUCTS = [
  // ─── 0 · MT3 · M Rendement 13 ─────────────────────────────────────────────
  {
    id: 'prod-001', isin: 'FR0014013A96', name: 'M Rendement 13', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'BNP Paribas Issuance B.V.', underlyingYahoo: '^STOXX50E',
    underlyingName: 'Euronext Eurozone Sector Selection D50P',
    barrierCapPct: 50, autocallBarrierPct: 85, couponPct: null, maxGainPct: 170, sri: 7,
    maturityDate: '2035-12-17', entryFeePct: 5.06, status: 'ACTIVE',
    description: 'Autocall Phoenix indexé sur Euronext Eurozone Sector Selection D50P. Remboursement anticipé si cours ≥ 85% du niveau initial. Taux de sortie croissant de 7% à 63%. Barrière à 50%.',
    fillPct: 62, targetAmount: 10_000_000, shelfClosingDate: '2026-04-15',
    observationDates: ['2026-12-02', '2027-12-02', '2028-12-04', '2029-12-03', '2030-12-02', '2031-12-02', '2032-12-02', '2033-12-02', '2034-12-04'],
  },
  // ─── 1 · MT4 · M Rendement OR ─────────────────────────────────────────────
  {
    id: 'prod-002', isin: 'FR0014012O42', name: 'M Rendement OR', payoffType: 'CAPITAL_PROTECTED',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: 'GC=F',
    underlyingName: 'iEdge Gold Shares EUR PR Index',
    barrierCapPct: 90, autocallBarrierPct: null, couponPct: null, maxGainPct: 121, sri: 2,
    maturityDate: '2028-12-29', entryFeePct: 2.50, status: 'ACTIVE',
    description: 'Capital protégé à 90% indexé sur l\'or (iEdge Gold Shares EUR PR Index). Performance plafonnée à 121% du Montant Nominal. Durée 3 ans.',
    fillPct: 44, targetAmount: 5_000_000,
  },
  // ─── 2 · MT5 · M Rendement Mixte ──────────────────────────────────────────
  {
    id: 'prod-003', isin: 'FR0014013AB5', name: 'M Rendement Mixte', payoffType: 'AUTOCALL_COUPON',
    issuerName: 'BNP Paribas Issuance B.V.', underlyingYahoo: '^STOXX50E',
    underlyingName: 'Euronext Eurozone Sector Selection D50P',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 3, maxGainPct: 150, sri: 4,
    maturityDate: '2035-12-17', entryFeePct: 5.93, status: 'ACTIVE',
    description: 'Autocall avec coupon fixe de 3% de la Valeur Nominale Courante. Taux de sortie croissant de 5% à 45%. Barrière de protection à 50%.',
    fillPct: 35, targetAmount: 8_000_000,
    observationDates: ['2026-12-16', '2027-12-16', '2028-12-18', '2029-12-17', '2030-12-16', '2031-12-16', '2032-12-16', '2033-12-16', '2034-12-18'],
  },
  // ─── 3 · MT6 · M Equilibre CT ─────────────────────────────────────────────
  {
    id: 'prod-004', isin: 'FR0014011938', name: 'M Equilibre CT', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.15, maxGainPct: 6.15, sri: 2,
    maturityDate: '2037-10-05', entryFeePct: 8.18, status: 'ACTIVE',
    description: 'Coupon conditionnel de 6.15% p.a. indexé sur EUR CMS 10 ans. Capital intégralement protégé à maturité. Barrière de coupon à 2.4%.',
    fillPct: 85, targetAmount: 15_000_000,
    observationDates: ['2026-09-28', '2027-09-27', '2028-09-25', '2029-09-24', '2030-09-27', '2031-09-26', '2032-09-27', '2033-09-26', '2034-09-25', '2035-09-24', '2036-09-26'],
  },
  // ─── 4 · MT7 · M Ambition 10 ──────────────────────────────────────────────
  {
    id: 'prod-005', isin: 'FR0014010O28', name: 'M Ambition 10', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: '^STOXX50E',
    underlyingName: 'iEdge Europe Leaders 20 EW Decrement 50 Points GTR Index',
    barrierCapPct: 50, autocallBarrierPct: 90, couponPct: null, maxGainPct: 100, sri: 6,
    maturityDate: '2035-09-18', entryFeePct: 3.50, status: 'ACTIVE',
    description: 'Autocallable si performance ≥ -10%. Montant d\'intérêt par période croissant de 10% à 100%. Barrière à 50%. Sous-jacent iEdge Europe Leaders 20.',
    fillPct: 28, targetAmount: 6_000_000,
  },
  // ─── 5 · MT8 · M Ambition 9 ───────────────────────────────────────────────
  {
    id: 'prod-006', isin: 'FR1459AB8533', name: 'M Ambition 9', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: '^STOXX50E',
    underlyingName: 'Morningstar Eurozone 50 Decrement 50 Point GR EUR',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6,
    maturityDate: '2035-07-11', entryFeePct: 6.50, status: 'ACTIVE',
    description: 'Autocallable sur Morningstar Eurozone 50 Decrement. Gain max 2000€ pour 1000€ investis si cours ≥ 60% à maturité. Barrière à 50%.',
    fillPct: 55, targetAmount: 4_000_000,
  },
  // ─── 6 · MT9 · M Equilibre 7 ──────────────────────────────────────────────
  {
    id: 'prod-007', isin: 'FR001400TTR3', name: 'M Equilibre 7', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2037-07-05', entryFeePct: 7.50, status: 'ACTIVE',
    description: 'Coupon conditionnel de 6% p.a. indexé sur EUR CMS 10 ans. Capital intégralement protégé à maturité. Durée 12 ans 2 mois.',
    fillPct: 72, targetAmount: 8_000_000,
    observationDates: ['2026-06-29', '2027-06-28', '2028-06-27', '2029-06-27', '2030-06-27', '2031-06-27', '2032-06-28', '2033-06-27', '2034-06-27', '2035-06-27', '2036-06-27'],
  },
  // ─── 7 · MT10 · Sélection Souveraineté Europe ─────────────────────────────
  {
    id: 'prod-008', isin: 'FR001400YQC1', name: 'Sélection Souveraineté Europe', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: '^STOXX50E',
    underlyingName: 'iEdge Europe Aerospace & Defense 10 EW Decrement 50 Points GTR Index',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 105, sri: 6,
    maturityDate: '2035-06-04', entryFeePct: 3.50, status: 'ACTIVE',
    description: 'Autocallable thématique Défense européenne. Montant d\'intérêt croissant de 10.5% à 105%. Barrière à 50%. Sous-jacent Aerospace & Defense.',
    fillPct: 92, targetAmount: 12_000_000,
  },
  // ─── 8 · MT11 · M Equilibre 6 ─────────────────────────────────────────────
  {
    id: 'prod-009', isin: 'FR001400TTS1', name: 'M Equilibre 6', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2037-05-05', entryFeePct: 7.50, status: 'ACTIVE',
    description: 'Coupon conditionnel de 6% p.a. indexé sur EUR CMS 10 ans. Capital intégralement protégé à maturité. Durée 12 ans 2 mois.',
    fillPct: 41, targetAmount: 8_000_000,
    observationDates: ['2026-04-27', '2027-04-28', '2028-04-27', '2029-04-26', '2030-04-25', '2031-04-28', '2032-04-28', '2033-04-28', '2034-04-27', '2035-04-27', '2036-04-25'],
  },
  // ─── 9 · MT12 · M Ambition 8 ──────────────────────────────────────────────
  {
    id: 'prod-010', isin: 'FR001400X1S6', name: 'M Ambition 8', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: '^STOXX50E',
    underlyingName: 'iEdge ESG Transatlantic EW 20 Decrement 50 Points GTR Index',
    barrierCapPct: 50, autocallBarrierPct: 92, couponPct: null, maxGainPct: 90, sri: 5,
    maturityDate: '2035-04-30', entryFeePct: 3.50, status: 'ACTIVE',
    description: 'Autocallable ESG Transatlantique si performance ≥ -7.5%. Montant d\'intérêt croissant de 9% à 90%. Barrière à 50%.',
    fillPct: 33, targetAmount: 5_000_000,
  },
  // ─── 10 · MT13 · G Equilibre ──────────────────────────────────────────────
  {
    id: 'prod-011', isin: 'FRSG00015LJ6', name: 'G Equilibre', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M',
    underlyingName: 'Taux EUR CMS 10 ans',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: null, sri: 2,
    maturityDate: '2037-01-19', entryFeePct: 3.00, status: 'ACTIVE',
    description: 'Placement dynamique risqué de type taux. Capital protégé à l\'échéance ou en cas de remboursement anticipé automatique. Durée 12 ans. Distribution Generali.',
    fillPct: 67, targetAmount: 10_000_000,
  },
  // ─── 11 · MT14 · M Equilibre 5 ────────────────────────────────────────────
  {
    id: 'prod-012', isin: 'FR1459AB4847', name: 'M Equilibre 5', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.00, maxGainPct: 5.00, sri: 2,
    maturityDate: '2037-03-02', entryFeePct: 6.50, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 50€/titre si taux ≤ 3.10%. Remboursement anticipé si taux ≤ 2.30%. Capital protégé 100%.',
    fillPct: 78, targetAmount: 7_000_000,
    observationDates: ['2027-02-22', '2028-02-21', '2029-02-21', '2030-02-21', '2031-02-21', '2032-02-23', '2033-02-21', '2034-02-21', '2035-02-21', '2036-02-21', '2037-02-23'],
  },
  // ─── 12 · MT15 · M Equilibre 4 ────────────────────────────────────────────
  {
    id: 'prod-013', isin: 'FR1459AB3252', name: 'M Equilibre 4', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2036-12-31', entryFeePct: 6.50, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 60€/titre si taux ≤ 3.20%. Remboursement anticipé si taux ≤ 2.40%. Capital protégé 100%.',
    fillPct: 50, targetAmount: 6_000_000,
    observationDates: ['2026-12-22', '2027-12-24', '2028-12-21', '2029-12-20', '2030-12-20', '2031-12-22', '2032-12-24', '2033-12-23', '2034-12-21', '2035-12-20'],
  },
  // ─── 13 · MT17 · M Equilibre 3 ────────────────────────────────────────────
  {
    id: 'prod-014', isin: 'FR1459AB3245', name: 'M Equilibre 3', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2036-10-31', entryFeePct: 6.10, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 60€/titre si taux ≤ 3.20%. Remboursement anticipé si taux ≤ 2.40%. Capital protégé 100%.',
    fillPct: 45, targetAmount: 6_000_000,
    observationDates: ['2026-10-26', '2027-10-25', '2028-10-24', '2029-10-24', '2030-10-24', '2031-10-24', '2032-10-25', '2033-10-24', '2034-10-24', '2035-10-24'],
  },
  // ─── 14 · MT18 · M Equilibre 2 ────────────────────────────────────────────
  {
    id: 'prod-015', isin: 'FR1459AB3237', name: 'M Equilibre 2', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: 'EURIBOR12M',
    underlyingName: '10 Year EUR ICE Swap Rate',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
    maturityDate: '2036-09-01', entryFeePct: 4.00, status: 'ACTIVE',
    description: 'Phoenix lié au 10Y EUR ICE Swap Rate. Coupon 60€/titre si taux ≤ 3.20%. Remboursement anticipé si taux ≤ 2.40%. Capital protégé 100%.',
    fillPct: 38, targetAmount: 5_000_000,
    observationDates: ['2026-08-24', '2027-08-24', '2028-08-24', '2029-08-24', '2030-08-26', '2031-08-25', '2032-08-24', '2033-08-24', '2034-08-24', '2035-08-24'],
  },
  // ─── 15 · MT19/MT20 · M Ambition DVEUR ────────────────────────────────────
  {
    id: 'prod-016', isin: 'FR1459AB2999', name: 'M Ambition DVEUR', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Goldman Sachs Finance Corp International Ltd', underlyingYahoo: '^STOXX50E',
    underlyingName: 'FEDERAL OPTIMAL SELECT-DVEUR',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6,
    maturityDate: '2034-07-05', entryFeePct: 5.00, status: 'ACTIVE',
    description: 'Autocallable avec barrière de 10 ans lié à FEDERAL OPTIMAL SELECT-DVEUR. Gain max 100% (2000€ pour 1000€ investis). Barrière à 50%.',
    fillPct: 22, targetAmount: 4_000_000,
  },
  // ─── 16 · MT21 · M Rendement 12 ───────────────────────────────────────────
  {
    id: 'prod-017', isin: 'FR1459AB0274', name: 'M Rendement 12', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Goldman Sachs International', underlyingYahoo: '^STOXX50E',
    underlyingName: 'S&P Eurozone 50 Net Zero 2050 Paris-Aligned Select 50 Point Decrement Index',
    barrierCapPct: 30, autocallBarrierPct: 100, couponPct: null, maxGainPct: 60, sri: 6,
    maturityDate: '2034-04-19', entryFeePct: 5.00, status: 'ACTIVE',
    description: 'Autocallable ESG sur S&P Eurozone 50 Net Zero 2050 Paris-Aligned. Gain max 60% (1600€ pour 1000€ investis). Barrière très basse à 30%.',
    fillPct: 15, targetAmount: 3_000_000,
  },
];

export const DEMO_COMMITMENTS = [
  { id: 'c1', shelfId: 's1', amount: 250_000, status: 'CONFIRMED', productName: 'M Rendement 13', createdAt: '2026-02-15' },
  { id: 'c2', shelfId: 's1', amount: 500_000, status: 'PENDING', productName: 'M Rendement 13', createdAt: '2026-03-01' },
  { id: 'c3', shelfId: 's2', amount: 100_000, status: 'CONFIRMED', productName: 'M Rendement OR', createdAt: '2026-02-20' },
  { id: 'c4', shelfId: 's3', amount: 350_000, status: 'CONFIRMED', productName: 'M Rendement Mixte', createdAt: '2026-01-10' },
  { id: 'c5', shelfId: 's4', amount: 1_000_000, status: 'PENDING', productName: 'M Equilibre CT', createdAt: '2026-03-05' },
  { id: 'c6', shelfId: 's5', amount: 75_000, status: 'CONFIRMED', productName: 'M Ambition 10', createdAt: '2026-02-28' },
  { id: 'c7', shelfId: 's8', amount: 200_000, status: 'WAITING', productName: 'Sélection Souveraineté Europe', createdAt: '2026-03-08' },
  { id: 'c8', shelfId: 's7', amount: 500_000, status: 'CONFIRMED', productName: 'M Equilibre 7', createdAt: '2026-02-10' },
  { id: 'c9', shelfId: 's12', amount: 300_000, status: 'PENDING', productName: 'M Equilibre 5', createdAt: '2026-03-07' },
];

export const DEMO_RECOMMENDATIONS = [
  { productId: 'prod-008', score: 95, reason: 'Thématique Défense européenne en forte demande. Rendement croissant jusqu\'à 105%. Profil Autocall adapté.', product: DEMO_PRODUCTS[7] },
  { productId: 'prod-007', score: 90, reason: 'Capital protégé 100%. Coupon conditionnel 6% p.a. Indexé sur taux EUR CMS 10 ans. SRI 2.', product: DEMO_PRODUCTS[6] },
  { productId: 'prod-012', score: 87, reason: 'Capital protégé 100%. Coupon 5% p.a. Goldman Sachs. Taux ≤ 3.10%. SRI 2 faible risque.', product: DEMO_PRODUCTS[11] },
  { productId: 'prod-005', score: 82, reason: 'Rendement croissant de 10% à 100%. iEdge Europe Leaders 20. Barrière 50%.', product: DEMO_PRODUCTS[4] },
  { productId: 'prod-017', score: 78, reason: 'ESG Net Zero 2050 Paris-Aligned. Barrière très basse 30%. Gain max 60%.', product: DEMO_PRODUCTS[16] },
];

export const DEMO_FAVORITES = [
  { productId: 'prod-001', product: DEMO_PRODUCTS[0] },
  { productId: 'prod-007', product: DEMO_PRODUCTS[6] },
  { productId: 'prod-008', product: DEMO_PRODUCTS[7] },
  { productId: 'prod-012', product: DEMO_PRODUCTS[11] },
];

export const DEMO_RECENT_VIEWS = [
  { productId: 'prod-008', product: DEMO_PRODUCTS[7], viewedAt: '2026-03-09T10:30:00Z' },
  { productId: 'prod-007', product: DEMO_PRODUCTS[6], viewedAt: '2026-03-09T09:15:00Z' },
  { productId: 'prod-001', product: DEMO_PRODUCTS[0], viewedAt: '2026-03-08T16:45:00Z' },
  { productId: 'prod-012', product: DEMO_PRODUCTS[11], viewedAt: '2026-03-08T14:20:00Z' },
  { productId: 'prod-017', product: DEMO_PRODUCTS[16], viewedAt: '2026-03-07T11:00:00Z' },
  { productId: 'prod-005', product: DEMO_PRODUCTS[4], viewedAt: '2026-03-07T09:30:00Z' },
];

export const DEMO_COMMISSION_SUMMARY = {
  totalGross: 68_250,
  totalPlatform: 21_840,
  totalDistributor: 46_410,
  count: 9,
  accrued: {
    distributor: 46_410,
    platform: 21_840,
    total: 68_250,
  },
  byType: {
    ENTRY_FEE: { gross: 52_000, count: 5 },
    MANAGEMENT_FEE: { gross: 10_250, count: 2 },
    TRAILER_FEE: { gross: 6_000, count: 2 },
  },
};
