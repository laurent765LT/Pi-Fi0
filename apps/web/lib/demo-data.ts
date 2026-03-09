// ─── Demo Mode Data ──────────────────────────────────────────────────────────
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
  {
    id: 'prod-001', isin: 'FR0014013A96', name: 'M Rendement 13', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'BNP Paribas Issuance B.V.', underlyingYahoo: '^STOXX50E', underlyingName: 'Euro Stoxx 50',
    barrierCapPct: 50, autocallBarrierPct: 85, couponPct: 7, maxGainPct: 170, sri: 7,
    maturityDate: '2035-12-17', entryFeePct: 5.06, status: 'ACTIVE', description: 'Autocall Phoenix sur Euro Stoxx 50 avec coupon conditionnel de 7% p.a.',
    fillPct: 62, targetAmount: 10_000_000,
  },
  {
    id: 'prod-002', isin: 'FR0014012O42', name: 'M Rendement OR', payoffType: 'CAPITAL_PROTECTED',
    issuerName: 'Natixis Structured Issuance', underlyingYahoo: 'GC=F', underlyingName: 'iEdge Gold Shares EUR PR Index',
    barrierCapPct: 90, autocallBarrierPct: null, couponPct: null, maxGainPct: 121, sri: 2,
    maturityDate: '2028-12-29', entryFeePct: 2.50, status: 'ACTIVE', description: 'Capital protege a 90% indexe sur l\'or.',
    fillPct: 44, targetAmount: 5_000_000,
  },
  {
    id: 'prod-003', isin: 'FR0014013AB5', name: 'M Rendement Mixte', payoffType: 'AUTOCALL_COUPON',
    issuerName: 'BNP Paribas Issuance B.V.', underlyingYahoo: '^STOXX50E', underlyingName: 'Euro Stoxx 50',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 3, maxGainPct: 150, sri: 4,
    maturityDate: '2035-12-17', entryFeePct: 5.93, status: 'ACTIVE', description: 'Autocall avec coupon fixe de 3% sur Euro Stoxx 50.',
    fillPct: 35, targetAmount: 8_000_000,
  },
  {
    id: 'prod-004', isin: 'FR0014011938', name: 'M Equilibre CT', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'SG Issuer', underlyingYahoo: 'EURIBOR12M', underlyingName: 'EUR EURIBOR 12 Months',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.15, maxGainPct: 6.15, sri: 2,
    maturityDate: '2037-10-05', entryFeePct: 8.18, status: 'ACTIVE', description: 'Taux conditionnel indexe sur Euribor 12 mois.',
    fillPct: 85, targetAmount: 15_000_000,
  },
  {
    id: 'prod-005', isin: 'CH1523731987', name: 'JB Autocallable BRC (50%) on adidas AG', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Julius Baer', underlyingYahoo: 'ADS.DE', underlyingName: 'adidas AG',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 8.0, maxGainPct: 8.0, sri: 6,
    maturityDate: '2029-09-19', entryFeePct: 1.0, status: 'ACTIVE', description: '8.00% p.a. Autocallable BRC (50%) on adidas AG.',
    fillPct: 28, targetAmount: 2_000_000,
  },
  {
    id: 'prod-006', isin: 'CH1531492234', name: 'JB 100% Capital Protection on Airbnb', payoffType: 'CAPITAL_PROTECTED',
    issuerName: 'Julius Baer', underlyingYahoo: 'ABNB', underlyingName: 'Airbnb Inc',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: 35, sri: 3,
    maturityDate: '2029-03-19', entryFeePct: 1.5, status: 'ACTIVE', description: '100% Capital Protection Note with Barrier on Airbnb.',
    fillPct: 55, targetAmount: 3_000_000,
  },
  {
    id: 'prod-007', isin: 'CH1523732407', name: 'JB BRC (65%) on Apple Inc', payoffType: 'BARRIER_NOTE',
    issuerName: 'Julius Baer', underlyingYahoo: 'AAPL', underlyingName: 'Apple Inc',
    barrierCapPct: 65, autocallBarrierPct: null, couponPct: 9.2, maxGainPct: 9.2, sri: 5,
    maturityDate: '2029-06-12', entryFeePct: 0.5, status: 'ACTIVE', description: '9.20% p.a. BRC (65%) on Apple Inc.',
    fillPct: 72, targetAmount: 5_000_000,
  },
  {
    id: 'prod-008', isin: 'CH1537300290', name: 'JB Credit Linked Note on ArcelorMittal', payoffType: 'CONDITIONAL_RATE',
    issuerName: 'Julius Baer', underlyingYahoo: 'MT', underlyingName: 'ArcelorMittal SA',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.2, maxGainPct: 5.2, sri: 3,
    maturityDate: '2033-03-18', entryFeePct: 0, status: 'ACTIVE', description: '7Y USD 5.20% p.a. Credit Linked Note on ArcelorMittal SA.',
    fillPct: 18, targetAmount: 4_000_000,
  },
  {
    id: 'prod-009', isin: 'CH1525120486', name: 'JB Autocallable BRC (80%) on Autoneum', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Julius Baer', underlyingYahoo: 'AUTN.SW', underlyingName: 'Autoneum Holding AG',
    barrierCapPct: 80, autocallBarrierPct: 100, couponPct: 11.25, maxGainPct: 11.25, sri: 5,
    maturityDate: '2029-06-17', entryFeePct: 0.5, status: 'ACTIVE', description: '11.25% p.a. Autocallable BRC (80%) on Autoneum.',
    fillPct: 41, targetAmount: 2_000_000,
  },
  {
    id: 'prod-010', isin: 'CH1515545684', name: 'JB Multi BRC (58%) Swiss Re / Zurich / Swiss Life / AXA', payoffType: 'AUTOCALL_COUPON',
    issuerName: 'Julius Baer', underlyingYahoo: 'SREN.SW', underlyingName: 'Swiss Re, Zurich Insurance, Swiss Life, AXA',
    barrierCapPct: 58, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5,
    maturityDate: '2029-06-17', entryFeePct: 0, status: 'ACTIVE', description: '10.00% p.a. Callable Multi BRC (58%) on Swiss Re, Zurich, Swiss Life, AXA.',
    fillPct: 67, targetAmount: 5_000_000,
  },
  {
    id: 'prod-011', isin: 'XS2876543212', name: 'Marex BRC (55%) on NVIDIA', payoffType: 'BARRIER_NOTE',
    issuerName: 'Marex Financial Products', underlyingYahoo: 'NVDA', underlyingName: 'NVIDIA Corp',
    barrierCapPct: 55, autocallBarrierPct: null, couponPct: 14.0, maxGainPct: 14.0, sri: 7,
    maturityDate: '2027-09-19', entryFeePct: 0.5, status: 'ACTIVE', description: '14.00% p.a. BRC (55%) on NVIDIA Corp.',
    fillPct: 92, targetAmount: 3_000_000,
  },
  {
    id: 'prod-012', isin: 'FR0014015001', name: 'SG Phoenix Euro Stoxx Banks', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'SG Issuer', underlyingYahoo: '^SX7E', underlyingName: 'Euro Stoxx Banks',
    barrierCapPct: 50, autocallBarrierPct: 90, couponPct: 12.0, maxGainPct: 12.0, sri: 6,
    maturityDate: '2036-03-15', entryFeePct: 4.5, status: 'ACTIVE', description: 'Phoenix Autocall sur Euro Stoxx Banks, coupon 12% p.a.',
    fillPct: 33, targetAmount: 8_000_000,
  },
  {
    id: 'prod-013', isin: 'CH1531492002', name: 'JB Autocallable BRC (50%) on TSMC', payoffType: 'AUTOCALL_PHOENIX',
    issuerName: 'Julius Baer', underlyingYahoo: 'TSM', underlyingName: 'Taiwan Semiconductor',
    barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 16.0, maxGainPct: 16.0, sri: 7,
    maturityDate: '2029-06-19', entryFeePct: 0.5, status: 'ACTIVE', description: '16.00% p.a. Autocallable BRC (50%) on TSMC.',
    fillPct: 78, targetAmount: 4_000_000,
  },
  {
    id: 'prod-014', isin: 'FR0014015002', name: 'SG Capital Protege MSCI World', payoffType: 'CAPITAL_PROTECTED',
    issuerName: 'SG Issuer', underlyingYahoo: 'URTH', underlyingName: 'MSCI World',
    barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: 30, sri: 2,
    maturityDate: '2031-06-30', entryFeePct: 3.0, status: 'ACTIVE', description: 'Capital protege 100% sur MSCI World, participation 130%.',
    fillPct: 50, targetAmount: 10_000_000,
  },
  {
    id: 'prod-015', isin: 'XS2876543211', name: 'Marex Snowball AAPL 12M', payoffType: 'AUTOCALL_COUPON',
    issuerName: 'Marex Financial Products', underlyingYahoo: 'AAPL', underlyingName: 'Apple Inc',
    barrierCapPct: 60, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5,
    maturityDate: '2027-03-12', entryFeePct: 0.5, status: 'ACTIVE', description: 'Snowball Autocallable sur Apple, Barriere 60%, Coupon 10% p.a., 12 mois.',
    fillPct: 15, targetAmount: 2_000_000,
  },
];

export const DEMO_COMMITMENTS = [
  { id: 'c1', shelfId: 's1', amount: 250_000, status: 'CONFIRMED', productName: 'M Rendement 13', createdAt: '2026-02-15' },
  { id: 'c2', shelfId: 's1', amount: 500_000, status: 'PENDING', productName: 'M Rendement 13', createdAt: '2026-03-01' },
  { id: 'c3', shelfId: 's2', amount: 100_000, status: 'CONFIRMED', productName: 'M Rendement OR', createdAt: '2026-02-20' },
  { id: 'c4', shelfId: 's3', amount: 350_000, status: 'CONFIRMED', productName: 'M Rendement Mixte', createdAt: '2026-01-10' },
  { id: 'c5', shelfId: 's4', amount: 1_000_000, status: 'PENDING', productName: 'M Equilibre CT', createdAt: '2026-03-05' },
  { id: 'c6', shelfId: 's5', amount: 75_000, status: 'CONFIRMED', productName: 'JB BRC adidas', createdAt: '2026-02-28' },
  { id: 'c7', shelfId: 's6', amount: 200_000, status: 'WAITING', productName: 'JB Capital Airbnb', createdAt: '2026-03-08' },
];

export const DEMO_RECOMMENDATIONS = [
  { productId: 'prod-007', score: 92, reason: 'Profil de risque adapte (SRI 5). Rendement attractif de 9.2%. Type de produit correspondant a vos preferences.', product: DEMO_PRODUCTS[6] },
  { productId: 'prod-009', score: 87, reason: 'Rendement attractif de 11.25%. Protection solide a 80%.', product: DEMO_PRODUCTS[8] },
  { productId: 'prod-011', score: 81, reason: 'Nouveau produit non encore consulte. Rendement attractif de 14.0%.', product: DEMO_PRODUCTS[10] },
  { productId: 'prod-006', score: 75, reason: 'Protection 100% du capital. Profil de risque adapte (SRI 3).', product: DEMO_PRODUCTS[5] },
];

export const DEMO_FAVORITES = [
  { productId: 'prod-001', product: DEMO_PRODUCTS[0] },
  { productId: 'prod-007', product: DEMO_PRODUCTS[6] },
  { productId: 'prod-011', product: DEMO_PRODUCTS[10] },
];

export const DEMO_RECENT_VIEWS = [
  { productId: 'prod-001', product: DEMO_PRODUCTS[0], viewedAt: '2026-03-09T10:30:00Z' },
  { productId: 'prod-007', product: DEMO_PRODUCTS[6], viewedAt: '2026-03-09T09:15:00Z' },
  { productId: 'prod-013', product: DEMO_PRODUCTS[12], viewedAt: '2026-03-08T16:45:00Z' },
  { productId: 'prod-006', product: DEMO_PRODUCTS[5], viewedAt: '2026-03-08T14:20:00Z' },
];

export const DEMO_COMMISSION_SUMMARY = {
  totalGross: 48_750,
  totalPlatform: 15_600,
  totalDistributor: 33_150,
  count: 5,
  byType: {
    ENTRY_FEE: { gross: 35_000, count: 3 },
    MANAGEMENT_FEE: { gross: 8_750, count: 1 },
    TRAILER_FEE: { gross: 5_000, count: 1 },
  },
};
