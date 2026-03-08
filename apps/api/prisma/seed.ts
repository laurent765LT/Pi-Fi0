import { PrismaClient, ProductStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Strick'in database...");

  // ── Organizations ─────────────────────────────────────────────────────────
  const adminOrg = await prisma.organization.upsert({
    where: { slug: 'strickin' },
    update: {},
    create: {
      name: "Strick'in",
      type: 'ADMIN',
      slug: 'strickin',
      settings: {},
    },
  });

  const cardiffOrg = await prisma.organization.upsert({
    where: { slug: 'cardiff' },
    update: {},
    create: {
      name: 'Cardiff (BNP Paribas Cardif)',
      type: 'INSURER',
      slug: 'cardiff',
      settings: {
        acceptedPayoffTypes: ['AUTOCALL_PHOENIX', 'AUTOCALL_COUPON', 'CAPITAL_PROTECTED', 'CONDITIONAL_RATE'],
        minMaturityYears: 1,
        maxMaturityYears: 12,
      },
    },
  });

  const celentiaOrg = await prisma.organization.upsert({
    where: { slug: 'celentia' },
    update: {},
    create: {
      name: 'Celentia',
      type: 'INSURER',
      slug: 'celentia',
      settings: {
        acceptedPayoffTypes: ['AUTOCALL_PHOENIX', 'CAPITAL_PROTECTED'],
        minMaturityYears: 2,
        maxMaturityYears: 10,
      },
    },
  });

  const brokerOrg = await prisma.organization.upsert({
    where: { slug: 'cabinet-demo' },
    update: {},
    create: {
      name: 'Cabinet Demo CGP',
      type: 'BROKER',
      slug: 'cabinet-demo',
      settings: {},
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await argon2.hash('Strickin2025!');

  await prisma.user.upsert({
    where: { email: 'admin@strickin.com' },
    update: {},
    create: {
      email: 'admin@strickin.com',
      passwordHash,
      firstName: 'Paul-Adrien',
      lastName: 'Desplechin',
      role: 'SUPER_ADMIN',
      orgId: adminOrg.id,
      onboardingStatus: 'ACTIVE',
    },
  });

  const cgpUser = await prisma.user.upsert({
    where: { email: 'cgp@demo.com' },
    update: {},
    create: {
      email: 'cgp@demo.com',
      passwordHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'VIEWER',
      orgId: brokerOrg.id,
      oriasNumber: '12345678',
      oriasValidUntil: new Date('2026-12-31'),
      rcpInsurer: 'AXA',
      rcpAmount: 1_500_000,
      onboardingStatus: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'assureur@cardiff.fr' },
    update: {},
    create: {
      email: 'assureur@cardiff.fr',
      passwordHash,
      firstName: 'Delphine',
      lastName: 'Martin',
      role: 'ORG_ADMIN',
      orgId: cardiffOrg.id,
      onboardingStatus: 'ACTIVE',
    },
  });

  // ── Products ──────────────────────────────────────────────────────────────
  // Mix of original French products + Julius Baer-inspired products

  const productsData = [
    // === Original French products ===
    {
      isin: 'FR0014013A96', name: 'M Rendement 13', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'BNP Paribas Issuance B.V.', guarantorName: 'BNP Paribas',
      underlyingName: 'Euro Stoxx 50', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 85, couponPct: 7, maxGainPct: 170, sri: 7 as const,
      maturityDate: new Date('2035-12-17'), entryFeePct: 5.06, status: 'ACTIVE',
      description: 'Autocall Phoenix sur Euro Stoxx 50 avec coupon conditionnel de 7% p.a.',
    },
    {
      isin: 'FR0014012O42', name: 'M Rendement OR', payoffType: 'CAPITAL_PROTECTED' as const,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge Gold Shares EUR PR Index', underlyingYahoo: 'GC=F',
      barrierCapPct: 90, autocallBarrierPct: null, couponPct: null, maxGainPct: 121, sri: 2 as const,
      maturityDate: new Date('2028-12-29'), entryFeePct: 2.50, status: 'ACTIVE',
      description: 'Capital protege a 90% indexe sur l\'or.',
    },
    {
      isin: 'FR0014013AB5', name: 'M Rendement Mixte', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'BNP Paribas Issuance B.V.', guarantorName: 'BNP Paribas',
      underlyingName: 'Euro Stoxx 50', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 3, maxGainPct: 150, sri: 4 as const,
      maturityDate: new Date('2035-12-17'), entryFeePct: 5.93, status: 'ACTIVE',
      description: 'Autocall avec coupon fixe de 3% sur Euro Stoxx 50.',
    },
    {
      isin: 'FR0014011938', name: 'M Equilibre CT', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'EUR EURIBOR 12 Months', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.15, maxGainPct: 6.15, sri: 2 as const,
      maturityDate: new Date('2037-10-05'), entryFeePct: 8.18, status: 'ACTIVE',
      description: 'Taux conditionnel indexe sur Euribor 12 mois.',
    },

    // === Julius Baer-inspired products (adapted to EUR market) ===
    {
      isin: 'CH1523731987', name: 'JB Autocallable BRC (50%) on adidas AG', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'adidas AG', underlyingYahoo: 'ADS.DE',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 8.0, maxGainPct: 8.0, sri: 6 as const,
      maturityDate: new Date('2029-09-19'), entryFeePct: 1.0, status: 'ACTIVE',
      description: '8.00% p.a. Autocallable Barrier Reverse Convertible (50%) on adidas AG.',
    },
    {
      isin: 'CH1531492234', name: 'JB 100% Capital Protection on Airbnb', payoffType: 'CAPITAL_PROTECTED' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Airbnb Inc', underlyingYahoo: 'ABNB',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: 35, sri: 3 as const,
      maturityDate: new Date('2029-03-19'), entryFeePct: 1.5, status: 'ACTIVE',
      description: '100% Capital Protection Note with Barrier on Airbnb.',
    },
    {
      isin: 'CH1523732407', name: 'JB BRC (65%) on Apple Inc', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Apple Inc', underlyingYahoo: 'AAPL',
      barrierCapPct: 65, autocallBarrierPct: null, couponPct: 9.2, maxGainPct: 9.2, sri: 5 as const,
      maturityDate: new Date('2029-06-12'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '9.20% p.a. Barrier Reverse Convertible (65%) on Apple Inc. Sustainable investment.',
    },
    {
      isin: 'CH1537300290', name: 'JB Credit Linked Note on ArcelorMittal (USD)', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'ArcelorMittal SA', underlyingYahoo: 'MT',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.2, maxGainPct: 5.2, sri: 3 as const,
      maturityDate: new Date('2033-03-18'), entryFeePct: 0, status: 'ACTIVE',
      description: '7Y USD 5.20% p.a. Credit Linked Note on ArcelorMittal SA.',
    },
    {
      isin: 'CH1525120486', name: 'JB Autocallable BRC (80%) on Autoneum', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Autoneum Holding AG', underlyingYahoo: 'AUTN.SW',
      barrierCapPct: 80, autocallBarrierPct: 100, couponPct: 11.25, maxGainPct: 11.25, sri: 5 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '11.25% p.a. Autocallable BRC (80%) on Autoneum Holding AG.',
    },
    {
      isin: 'CH1525120387', name: 'JB BRC (70%) on Avolta AG', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Avolta AG', underlyingYahoo: 'AVOL.SW',
      barrierCapPct: 70, autocallBarrierPct: null, couponPct: 7.25, maxGainPct: 7.25, sri: 4 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '7.25% p.a. BRC (70%) on Avolta AG. Sustainable investment.',
    },
    {
      isin: 'CH1515545684', name: 'JB Multi BRC (58%) Swiss Re / Zurich / Swiss Life / AXA', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Swiss Re, Zurich Insurance, Swiss Life, AXA', underlyingYahoo: 'SREN.SW',
      barrierCapPct: 58, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0, status: 'ACTIVE',
      description: '10.00% p.a. Callable Multi BRC (58%) on Swiss Re, Zurich, Swiss Life, AXA.',
    },
    {
      isin: 'CH1515545403', name: 'JB Multi BRC (50%) BNP / ING / Santander / UBS', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'BNP Paribas, ING Groep, Santander, UBS', underlyingYahoo: 'BNP.PA',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 13.2, maxGainPct: 13.2, sri: 6 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0, status: 'ACTIVE',
      description: '13.20% p.a. Callable Multi BRC (50%) on BNP, ING, Santander, UBS.',
    },
    {
      isin: 'CH1541534462', name: 'JB Multi BRC (60%) SMI / DAX / S&P 500 / Nikkei', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'SMI, DAX, S&P 500, Nikkei 225', underlyingYahoo: '^GDAXI',
      barrierCapPct: 60, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5 as const,
      maturityDate: new Date('2029-09-20'), entryFeePct: 0, status: 'ACTIVE',
      description: '10.00% p.a. Callable Multi BRC (60%) on SMI, DAX, S&P 500, Nikkei 225.',
    },
    {
      isin: 'CH1525120452', name: 'JB BRC (70%) on EFG International AG', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'EFG International AG', underlyingYahoo: 'EFGN.SW',
      barrierCapPct: 70, autocallBarrierPct: null, couponPct: 6.25, maxGainPct: 6.25, sri: 4 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '6.25% p.a. BRC (70%) on EFG International AG. Sustainable investment.',
    },
    {
      isin: 'CH1515545445', name: 'JB Multi BRC (57%) Shell / Eni / Repsol / Total', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Shell, Eni, Repsol, TotalEnergies', underlyingYahoo: 'SHEL.L',
      barrierCapPct: 57, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0, status: 'ACTIVE',
      description: '10.00% p.a. Callable Multi BRC (57%) on Shell, Eni, Repsol, TotalEnergies.',
    },
    {
      isin: 'CH1525120544', name: 'JB BRC (80%) on Forbo Holding AG', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Forbo Holding AG', underlyingYahoo: 'FORN.SW',
      barrierCapPct: 80, autocallBarrierPct: null, couponPct: 10.0, maxGainPct: 10.0, sri: 4 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '10.00% p.a. BRC (80%) on Forbo Holding AG.',
    },
    {
      isin: 'CH1525120569', name: 'JB Callable BRC (80%) on Holcim Ltd', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Holcim Ltd', underlyingYahoo: 'HOLN.SW',
      barrierCapPct: 80, autocallBarrierPct: 100, couponPct: 11.0, maxGainPct: 11.0, sri: 5 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '11.00% p.a. Callable BRC (80%) on Holcim Ltd.',
    },
    {
      isin: 'CH1531491897', name: 'JB BRC (50%) on Newmont Corp', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Newmont Corp', underlyingYahoo: 'NEM',
      barrierCapPct: 50, autocallBarrierPct: null, couponPct: 12.5, maxGainPct: 12.5, sri: 6 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '12.50% p.a. BRC (50%) on Newmont Corp.',
    },
    {
      isin: 'CH1515545486', name: 'JB Multi BRC (59%) Novartis / Roche / Sanofi / Sandoz', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Novartis, Roche, Sanofi, Sandoz', underlyingYahoo: 'NOVN.SW',
      barrierCapPct: 59, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0, status: 'ACTIVE',
      description: '10.00% p.a. Callable Multi BRC (59%) on Novartis, Roche, Sanofi, Sandoz.',
    },
    {
      isin: 'CH1525120460', name: 'JB Callable BRC (80%) on Novartis AG', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Novartis AG', underlyingYahoo: 'NOVN.SW',
      barrierCapPct: 80, autocallBarrierPct: 100, couponPct: 7.5, maxGainPct: 7.5, sri: 4 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '7.50% p.a. Callable BRC (80%) on Novartis AG. Sustainable investment.',
    },
    {
      isin: 'CH1515545742', name: 'JB Multi BRC (50%) Partners Group / UBS / Swissquote', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Partners Group, UBS, Swissquote', underlyingYahoo: 'PGHN.SW',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 11.8, maxGainPct: 11.8, sri: 6 as const,
      maturityDate: new Date('2029-06-16'), entryFeePct: 0, status: 'ACTIVE',
      description: '11.80% p.a. Callable Multi BRC (50%) on Partners Group, UBS, Swissquote.',
    },
    {
      isin: 'CH1531492317', name: 'JB 100% Capital Protection Twin-Win on SAP SE', payoffType: 'CAPITAL_PROTECTED' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'SAP SE', underlyingYahoo: 'SAP.DE',
      barrierCapPct: 80, autocallBarrierPct: null, couponPct: null, maxGainPct: 40, sri: 3 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 1.0, status: 'ACTIVE',
      description: '100% Capital Protection Note With Twin-Win on SAP SE.',
    },
    {
      isin: 'CH1531492002', name: 'JB Autocallable BRC (50%) on TSMC', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Taiwan Semiconductor Manufacturing', underlyingYahoo: 'TSM',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 16.0, maxGainPct: 16.0, sri: 7 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '16.00% p.a. Autocallable BRC (50%) on TSMC.',
    },
    {
      isin: 'CH1523732100', name: 'JB 100% Capital Protection on Coca-Cola', payoffType: 'CAPITAL_PROTECTED' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'The Coca-Cola Co', underlyingYahoo: 'KO',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: 25, sri: 2 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 1.0, status: 'ACTIVE',
      description: '100% Capital Protection Note with Barrier on Coca-Cola.',
    },
    {
      isin: 'CH1523732381', name: 'JB Callable BRC (50%) on Walt Disney', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Walt Disney Co', underlyingYahoo: 'DIS',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 8.0, maxGainPct: 8.0, sri: 6 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '8.00% p.a. Callable BRC (50%) on Walt Disney Co.',
    },
    {
      isin: 'CH1525120494', name: 'JB BRC (60%) on UBS Group AG', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'UBS Group AG', underlyingYahoo: 'UBSG.SW',
      barrierCapPct: 60, autocallBarrierPct: null, couponPct: 6.0, maxGainPct: 6.0, sri: 4 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '6.00% p.a. BRC (60%) on UBS Group AG.',
    },
    {
      isin: 'CH1531492168', name: 'JB 100% Capital Protection Twin-Win on UniCredit', payoffType: 'CAPITAL_PROTECTED' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'UniCredit SpA', underlyingYahoo: 'UCG.MI',
      barrierCapPct: 80, autocallBarrierPct: null, couponPct: null, maxGainPct: 45, sri: 3 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 1.0, status: 'ACTIVE',
      description: '100% Capital Protection Note With Twin-Win on UniCredit SpA.',
    },
    {
      isin: 'CH1531492259', name: 'JB Callable BRC (75%) on Unilever', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Unilever PLC', underlyingYahoo: 'ULVR.L',
      barrierCapPct: 75, autocallBarrierPct: 100, couponPct: 8.2, maxGainPct: 8.2, sri: 4 as const,
      maturityDate: new Date('2029-06-19'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '8.20% p.a. Callable BRC (75%) on Unilever PLC.',
    },
    {
      isin: 'CH1537300407', name: 'JB Credit Linked Note on Volkswagen (USD)', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Volkswagen AG', underlyingYahoo: 'VOW3.DE',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.15, maxGainPct: 5.15, sri: 3 as const,
      maturityDate: new Date('2033-03-18'), entryFeePct: 0, status: 'ACTIVE',
      description: '7Y USD 5.15% p.a. Credit Linked Note on Volkswagen AG.',
    },
    {
      isin: 'CH1537300415', name: 'JB Credit Linked Note on Volkswagen (EUR)', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Volkswagen AG', underlyingYahoo: 'VOW3.DE',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 4.0, maxGainPct: 4.0, sri: 3 as const,
      maturityDate: new Date('2033-03-18'), entryFeePct: 0, status: 'ACTIVE',
      description: '7Y EUR 4.00% p.a. Credit Linked Note on Volkswagen AG.',
    },
    {
      isin: 'CH1525120510', name: 'JB BRC (75%) on Zurich Insurance', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Julius Baer', guarantorName: null,
      underlyingName: 'Zurich Insurance Group AG', underlyingYahoo: 'ZURN.SW',
      barrierCapPct: 75, autocallBarrierPct: null, couponPct: 5.75, maxGainPct: 5.75, sri: 3 as const,
      maturityDate: new Date('2029-06-17'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '5.75% p.a. BRC (75%) on Zurich Insurance Group AG. Sustainable investment.',
    },

    // === Additional Marex-inspired products ===
    {
      isin: 'XS2876543210', name: 'Marex Phoenix DAX 17M', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Marex Financial Products', guarantorName: null,
      underlyingName: 'DAX', underlyingYahoo: '^GDAXI',
      barrierCapPct: 65, autocallBarrierPct: 100, couponPct: 9.5, maxGainPct: 9.5, sri: 5 as const,
      maturityDate: new Date('2027-08-15'), entryFeePct: 1.0, status: 'ACTIVE',
      description: 'Autocallable Phoenix sur DAX, Barriere 65%, Coupon 9.5% p.a., Maturite 17 mois.',
    },
    {
      isin: 'XS2876543211', name: 'Marex Snowball AAPL 12M', payoffType: 'AUTOCALL_COUPON' as const,
      issuerName: 'Marex Financial Products', guarantorName: null,
      underlyingName: 'Apple Inc', underlyingYahoo: 'AAPL',
      barrierCapPct: 60, autocallBarrierPct: 100, couponPct: 10.0, maxGainPct: 10.0, sri: 5 as const,
      maturityDate: new Date('2027-03-12'), entryFeePct: 0.5, status: 'ACTIVE',
      description: 'Snowball Autocallable sur Apple, Barriere 60%, Coupon 10% p.a., 12 mois.',
    },
    {
      isin: 'XS2876543212', name: 'Marex BRC (55%) on NVIDIA', payoffType: 'BARRIER_NOTE' as const,
      issuerName: 'Marex Financial Products', guarantorName: null,
      underlyingName: 'NVIDIA Corp', underlyingYahoo: 'NVDA',
      barrierCapPct: 55, autocallBarrierPct: null, couponPct: 14.0, maxGainPct: 14.0, sri: 7 as const,
      maturityDate: new Date('2027-09-19'), entryFeePct: 0.5, status: 'ACTIVE',
      description: '14.00% p.a. BRC (55%) on NVIDIA Corp.',
    },

    // === SG products ===
    {
      isin: 'FR0014015001', name: 'SG Phoenix Euro Stoxx Banks', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'Euro Stoxx Banks', underlyingYahoo: '^SX7E',
      barrierCapPct: 50, autocallBarrierPct: 90, couponPct: 12.0, maxGainPct: 12.0, sri: 6 as const,
      maturityDate: new Date('2036-03-15'), entryFeePct: 4.5, status: 'ACTIVE',
      description: 'Phoenix Autocall sur Euro Stoxx Banks, coupon 12% p.a.',
    },
    {
      isin: 'FR0014015002', name: 'SG Capital Protege MSCI World', payoffType: 'CAPITAL_PROTECTED' as const,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'MSCI World', underlyingYahoo: 'URTH',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: 30, sri: 2 as const,
      maturityDate: new Date('2031-06-30'), entryFeePct: 3.0, status: 'ACTIVE',
      description: 'Capital protege 100% sur MSCI World, participation 130%.',
    },
  ];

  const createdProducts: any[] = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { isin: p.isin },
      update: {},
      create: {
        isin: p.isin,
        name: p.name,
        payoffType: p.payoffType,
        issuerName: p.issuerName,
        guarantorName: p.guarantorName,
        underlyingName: p.underlyingName,
        underlyingYahoo: p.underlyingYahoo,
        barrierCapPct: p.barrierCapPct,
        autocallBarrierPct: p.autocallBarrierPct,
        couponPct: p.couponPct,
        maxGainPct: p.maxGainPct,
        sri: p.sri,
        maturityDate: p.maturityDate,
        entryFeePct: p.entryFeePct,
        description: p.description,
        status: p.status as ProductStatus,
        orgId: adminOrg.id,
      },
    });
    createdProducts.push(product);
  }

  console.log(`Created ${createdProducts.length} products`);

  // ── Shelves (for first 8 products) ────────────────────────────────────────
  const shelfConfigs = [
    { idx: 0, org: cardiffOrg.id, target: 10_000_000, closing: '2026-06-30' },
    { idx: 1, org: cardiffOrg.id, target: 5_000_000, closing: '2026-05-15' },
    { idx: 2, org: celentiaOrg.id, target: 8_000_000, closing: '2026-07-15' },
    { idx: 3, org: cardiffOrg.id, target: 15_000_000, closing: '2026-09-01' },
    { idx: 4, org: cardiffOrg.id, target: 2_000_000, closing: '2026-04-30' },
    { idx: 5, org: celentiaOrg.id, target: 3_000_000, closing: '2026-05-30' },
    { idx: 6, org: cardiffOrg.id, target: 5_000_000, closing: '2026-06-15' },
    { idx: 7, org: celentiaOrg.id, target: 4_000_000, closing: '2026-08-01' },
  ];

  const createdShelves: any[] = [];
  for (const sc of shelfConfigs) {
    if (createdProducts[sc.idx]) {
      const shelf = await prisma.shelf.upsert({
        where: { id: `shelf-${createdProducts[sc.idx].isin}` },
        update: {},
        create: {
          id: `shelf-${createdProducts[sc.idx].isin}`,
          productId: createdProducts[sc.idx].id,
          orgId: sc.org,
          status: 'OPEN',
          targetAmount: sc.target,
          surbookingPct: 15,
          closingDate: new Date(sc.closing),
        },
      });
      createdShelves.push(shelf);
    }
  }

  // ── Demo Commitments ──────────────────────────────────────────────────────
  const commitmentData = [
    { shelfIdx: 0, amount: 250_000, status: 'CONFIRMED' as const },
    { shelfIdx: 0, amount: 500_000, status: 'PENDING' as const },
    { shelfIdx: 1, amount: 100_000, status: 'CONFIRMED' as const },
    { shelfIdx: 2, amount: 350_000, status: 'CONFIRMED' as const },
    { shelfIdx: 3, amount: 1_000_000, status: 'PENDING' as const },
    { shelfIdx: 4, amount: 75_000, status: 'CONFIRMED' as const },
    { shelfIdx: 5, amount: 200_000, status: 'WAITING' as const },
  ];

  for (let i = 0; i < commitmentData.length; i++) {
    const cd = commitmentData[i]!;
    const shelf = createdShelves[cd.shelfIdx];
    if (shelf) {
      await prisma.commitment.upsert({
        where: { id: `commit-demo-${i + 1}` },
        update: {},
        create: {
          id: `commit-demo-${i + 1}`,
          shelfId: shelf.id,
          userId: cgpUser.id,
          orgId: brokerOrg.id,
          amount: cd.amount,
          status: cd.status,
          rank: cd.status === 'WAITING' ? i + 1 : null,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log(`Products: ${createdProducts.length}`);
  console.log(`Shelves: ${createdShelves.length}`);
  console.log(`Commitments: ${commitmentData.length}`);
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:    admin@strickin.com / Strickin2025!');
  console.log('  CGP:      cgp@demo.com / Strickin2025!');
  console.log('  Assureur: assureur@cardiff.fr / Strickin2025!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
