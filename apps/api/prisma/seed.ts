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

  // ── Issuer Profiles (Simulated) ───────────────────────────────────────────
  const issuerProfiles = [
    {
      name: 'BNP Paribas CIB',
      shortName: 'BNPP',
      fundingSpread: 0.004,
      volMarkup: 0.005,
      structuringMargin: 0.012,
      distributionFriendliness: 0.8,
      couponAggressiveness: 0.65,
      protectionAggressiveness: 0.6,
      barrierPreference: 60,
      maxMaturityMonths: 144,
      minTicket: 100000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON'],
      unsupportedStructures: [] as string[],
      rejectionProbability: 0.05,
      quoteDelayMs: 1500,
      commentStyle: 'aggressive',
    },
    {
      name: 'Goldman Sachs International',
      shortName: 'GS',
      fundingSpread: 0.005,
      volMarkup: 0.008,
      structuringMargin: 0.018,
      distributionFriendliness: 0.6,
      couponAggressiveness: 0.7,
      protectionAggressiveness: 0.45,
      barrierPreference: 55,
      maxMaturityMonths: 120,
      minTicket: 250000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'CAPPED_PARTICIPATION', 'DIGITAL_PAYOFF'],
      unsupportedStructures: ['CREDIT_LINKED_NOTE'] as string[],
      rejectionProbability: 0.15,
      quoteDelayMs: 3000,
      commentStyle: 'aggressive',
    },
    {
      name: 'Marex Financial Products',
      shortName: 'MAREX',
      fundingSpread: 0.007,
      volMarkup: 0.006,
      structuringMargin: 0.010,
      distributionFriendliness: 0.85,
      couponAggressiveness: 0.55,
      protectionAggressiveness: 0.5,
      barrierPreference: 60,
      maxMaturityMonths: 60,
      minTicket: 50000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON', 'COUPON_EXPRESS'],
      unsupportedStructures: ['CAPITAL_PROTECTED_NOTE', 'CREDIT_LINKED_NOTE'] as string[],
      rejectionProbability: 0.08,
      quoteDelayMs: 2000,
      commentStyle: 'neutral',
    },
    {
      name: 'Société Générale CIB',
      shortName: 'SG',
      fundingSpread: 0.0045,
      volMarkup: 0.004,
      structuringMargin: 0.013,
      distributionFriendliness: 0.75,
      couponAggressiveness: 0.6,
      protectionAggressiveness: 0.55,
      barrierPreference: 65,
      maxMaturityMonths: 144,
      minTicket: 100000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON', 'CREDIT_LINKED_NOTE', 'COUPON_EXPRESS'],
      unsupportedStructures: [] as string[],
      rejectionProbability: 0.06,
      quoteDelayMs: 1800,
      commentStyle: 'neutral',
    },
    {
      name: 'Citigroup Global Markets',
      shortName: 'CITI',
      fundingSpread: 0.005,
      volMarkup: 0.007,
      structuringMargin: 0.016,
      distributionFriendliness: 0.65,
      couponAggressiveness: 0.5,
      protectionAggressiveness: 0.55,
      barrierPreference: 60,
      maxMaturityMonths: 120,
      minTicket: 200000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'CAPPED_PARTICIPATION'],
      unsupportedStructures: ['CREDIT_LINKED_NOTE'] as string[],
      rejectionProbability: 0.12,
      quoteDelayMs: 2500,
      commentStyle: 'conservative',
    },
    {
      name: 'J.P. Morgan Securities',
      shortName: 'JPM',
      fundingSpread: 0.004,
      volMarkup: 0.009,
      structuringMargin: 0.020,
      distributionFriendliness: 0.55,
      couponAggressiveness: 0.75,
      protectionAggressiveness: 0.4,
      barrierPreference: 50,
      maxMaturityMonths: 120,
      minTicket: 500000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'DIGITAL_PAYOFF', 'CAPPED_PARTICIPATION'],
      unsupportedStructures: ['CREDIT_LINKED_NOTE', 'COUPON_EXPRESS'] as string[],
      rejectionProbability: 0.18,
      quoteDelayMs: 3500,
      commentStyle: 'aggressive',
    },
    {
      name: 'UBS AG London Branch',
      shortName: 'UBS',
      fundingSpread: 0.0055,
      volMarkup: 0.005,
      structuringMargin: 0.014,
      distributionFriendliness: 0.7,
      couponAggressiveness: 0.55,
      protectionAggressiveness: 0.6,
      barrierPreference: 65,
      maxMaturityMonths: 120,
      minTicket: 100000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'BONUS_CERTIFICATE'],
      unsupportedStructures: [] as string[],
      rejectionProbability: 0.10,
      quoteDelayMs: 2000,
      commentStyle: 'conservative',
    },
    {
      name: 'Barclays Bank PLC',
      shortName: 'BARC',
      fundingSpread: 0.006,
      volMarkup: 0.006,
      structuringMargin: 0.015,
      distributionFriendliness: 0.7,
      couponAggressiveness: 0.5,
      protectionAggressiveness: 0.5,
      barrierPreference: 60,
      maxMaturityMonths: 96,
      minTicket: 150000,
      supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON'],
      unsupportedStructures: ['CAPITAL_PROTECTED_NOTE', 'CREDIT_LINKED_NOTE'] as string[],
      rejectionProbability: 0.10,
      quoteDelayMs: 2200,
      commentStyle: 'neutral',
    },
  ];

  for (const ip of issuerProfiles) {
    await prisma.issuerProfile.upsert({
      where: { name: ip.name },
      update: {},
      create: ip,
    });
  }
  console.log(`Created ${issuerProfiles.length} issuer profiles`);

  // ── Commission Rules ───────────────────────────────────────────────────────
  const commissionRulesData = [
    // Global default rules (no org/product specificity = lowest priority)
    {
      id: 'cr-global-entry',
      commissionType: 'ENTRY_FEE' as const,
      ratePct: 5.0,
      splitPlatformPct: 30,
      splitDistributorPct: 70,
      isActive: true,
    },
    {
      id: 'cr-global-mgmt',
      commissionType: 'MANAGEMENT_FEE' as const,
      ratePct: 1.0,
      splitPlatformPct: 25,
      splitDistributorPct: 75,
      isActive: true,
    },
    {
      id: 'cr-global-dist',
      commissionType: 'DISTRIBUTION_FEE' as const,
      ratePct: 2.0,
      splitPlatformPct: 20,
      splitDistributorPct: 80,
      isActive: true,
    },
    // Cardiff-specific rules
    {
      id: 'cr-cardiff-entry',
      commissionType: 'ENTRY_FEE' as const,
      ratePct: 4.5,
      splitPlatformPct: 35,
      splitDistributorPct: 65,
      orgId: cardiffOrg.id,
      isActive: true,
    },
    {
      id: 'cr-cardiff-trailer',
      commissionType: 'TRAILER_FEE' as const,
      ratePct: 0.5,
      splitPlatformPct: 20,
      splitDistributorPct: 80,
      orgId: cardiffOrg.id,
      isActive: true,
    },
    // Celentia-specific rules
    {
      id: 'cr-celentia-entry',
      commissionType: 'ENTRY_FEE' as const,
      ratePct: 3.5,
      splitPlatformPct: 40,
      splitDistributorPct: 60,
      orgId: celentiaOrg.id,
      isActive: true,
    },
  ];

  for (const cr of commissionRulesData) {
    await prisma.commissionRule.upsert({
      where: { id: cr.id },
      update: {},
      create: cr as any,
    });
  }
  console.log(`Created ${commissionRulesData.length} commission rules`);

  // ── Insurer Rules ──────────────────────────────────────────────────────────
  const insurerRulesData = [
    // Cardiff — broad acceptance, standard limits
    {
      id: 'ir-cardiff-main',
      orgId: cardiffOrg.id,
      ruleName: 'Regles Cardiff principales',
      allowedPayoffTypes: ['AUTOCALL_PHOENIX', 'AUTOCALL_COUPON', 'CAPITAL_PROTECTED', 'CONDITIONAL_RATE'],
      allowedIssuers: [],
      maxSri: 6,
      minBarrierPct: 50,
      maxMaturityMonths: 144,
      maxEntryFeePct: 8,
      maxManagementFeePct: 2.5,
      minNominal: 1000,
      allowedCurrencies: ['EUR'],
      isActive: true,
      priority: 1,
    },
    // Celentia — stricter rules
    {
      id: 'ir-celentia-main',
      orgId: celentiaOrg.id,
      ruleName: 'Regles Celentia principales',
      allowedPayoffTypes: ['AUTOCALL_PHOENIX', 'CAPITAL_PROTECTED'],
      allowedIssuers: [],
      maxSri: 5,
      minBarrierPct: 60,
      maxMaturityMonths: 120,
      maxEntryFeePct: 6,
      maxManagementFeePct: 2.0,
      minNominal: 5000,
      allowedCurrencies: ['EUR'],
      isActive: true,
      priority: 1,
    },
  ];

  for (const ir of insurerRulesData) {
    await prisma.insurerRule.upsert({
      where: { id: ir.id },
      update: {},
      create: ir as any,
    });
  }
  console.log(`Created ${insurerRulesData.length} insurer rules`);

  // ── Product Templates ───────────────────────────────────────────────────
  const templates = [
    {
      name: 'Phoenix Autocall — Euro Stoxx 50',
      description: 'Autocall Phoenix classique sur indice européen, coupon conditionnel 7-9%, barrière 60%, maturité 5-8 ans.',
      structureType: 'PHOENIX_AUTOCALL' as const,
      isDefault: true,
      config: {
        structureType: 'PHOENIX_AUTOCALL',
        currency: 'EUR',
        nominalAmount: 1000000,
        denomination: 1000,
        minimumSubscription: 1000,
        issuePriceTarget: 100,
        underlying: {
          ticker: '^STOXX50E',
          name: 'Euro Stoxx 50',
          type: 'INDEX',
          currency: 'EUR',
          spot: 5000,
          strikeLevel: 5000,
          volatility: 0.18,
          dividendYield: 0.025,
          repoOrBorrowCost: 0,
        },
        payoff: {
          strike: 1.0,
          participationUp: 0,
          participationDown: 1.0,
          couponType: 'CONDITIONAL',
          couponRate: 0.08,
          couponFrequency: 'QUARTERLY',
          couponBarrier: 0.60,
          couponMemory: true,
          autocallEnabled: true,
          autocallBarrier: 1.0,
          autocallStepDown: [],
          protectionType: 'BARRIER',
          protectionBarrier: 0.60,
          capitalGuaranteeLevel: 0,
          knockInLevel: 0.60,
          knockOutLevel: 0,
          barrierMonitoring: 'EUROPEAN',
          cap: 0,
          floor: 0,
          digitalTrigger: 0,
          cashSettlement: true,
        },
        market: {
          riskFreeRate: 0.03,
          discountCurve: [0.03],
          fundingSpread: 0.005,
          issuerSpread: 0.01,
          structuringMargin: 0.015,
          distributionFee: 0.02,
          executionCost: 0.005,
        },
        mcPaths: 10000,
        mcSeed: 42,
        observationFrequency: 'DAILY',
      },
    },
    {
      name: 'Capital Protégé 100% — MSCI World',
      description: 'Protection 100% du capital sur MSCI World, participation 100-150% à la hausse, maturité 5 ans.',
      structureType: 'CAPITAL_PROTECTED_NOTE' as const,
      isDefault: true,
      config: {
        structureType: 'CAPITAL_PROTECTED_NOTE',
        currency: 'EUR',
        nominalAmount: 1000000,
        denomination: 1000,
        minimumSubscription: 1000,
        issuePriceTarget: 100,
        underlying: {
          ticker: 'URTH',
          name: 'MSCI World',
          type: 'INDEX',
          currency: 'EUR',
          spot: 130,
          strikeLevel: 130,
          volatility: 0.15,
          dividendYield: 0.018,
          repoOrBorrowCost: 0,
        },
        payoff: {
          strike: 1.0,
          participationUp: 1.3,
          participationDown: 0,
          couponType: 'NONE',
          couponRate: 0,
          couponFrequency: 'ANNUAL',
          couponBarrier: 0,
          couponMemory: false,
          autocallEnabled: false,
          autocallBarrier: 0,
          autocallStepDown: [],
          protectionType: 'FULL',
          protectionBarrier: 1.0,
          capitalGuaranteeLevel: 1.0,
          knockInLevel: 0,
          knockOutLevel: 0,
          barrierMonitoring: 'EUROPEAN',
          cap: 0.30,
          floor: 0,
          digitalTrigger: 0,
          cashSettlement: true,
        },
        market: {
          riskFreeRate: 0.03,
          discountCurve: [0.03],
          fundingSpread: 0.004,
          issuerSpread: 0.008,
          structuringMargin: 0.015,
          distributionFee: 0.015,
          executionCost: 0.005,
        },
        mcPaths: 10000,
        mcSeed: 42,
        observationFrequency: 'MONTHLY',
      },
    },
    {
      name: 'Reverse Convertible — Single Stock',
      description: 'BRC sur action individuelle, coupon fixe 8-12%, barrière 60-70%, maturité 12-18 mois.',
      structureType: 'REVERSE_CONVERTIBLE' as const,
      isDefault: true,
      config: {
        structureType: 'REVERSE_CONVERTIBLE',
        currency: 'EUR',
        nominalAmount: 500000,
        denomination: 1000,
        minimumSubscription: 1000,
        issuePriceTarget: 100,
        underlying: {
          ticker: 'SAN.PA',
          name: 'Sanofi SA',
          type: 'SINGLE_STOCK',
          currency: 'EUR',
          spot: 95,
          strikeLevel: 95,
          volatility: 0.22,
          dividendYield: 0.035,
          repoOrBorrowCost: 0.002,
        },
        payoff: {
          strike: 1.0,
          participationUp: 0,
          participationDown: 1.0,
          couponType: 'FIXED',
          couponRate: 0.10,
          couponFrequency: 'QUARTERLY',
          couponBarrier: 0,
          couponMemory: false,
          autocallEnabled: false,
          autocallBarrier: 0,
          autocallStepDown: [],
          protectionType: 'BARRIER',
          protectionBarrier: 0.65,
          capitalGuaranteeLevel: 0,
          knockInLevel: 0.65,
          knockOutLevel: 0,
          barrierMonitoring: 'EUROPEAN',
          cap: 0,
          floor: 0,
          digitalTrigger: 0,
          cashSettlement: true,
        },
        market: {
          riskFreeRate: 0.03,
          discountCurve: [0.03],
          fundingSpread: 0.006,
          issuerSpread: 0.01,
          structuringMargin: 0.012,
          distributionFee: 0.015,
          executionCost: 0.005,
        },
        mcPaths: 10000,
        mcSeed: 42,
        observationFrequency: 'DAILY',
      },
    },
    {
      name: 'Autocall Step-Down — CAC 40',
      description: 'Autocall avec step-down progressif (100%, 95%, 90%...), coupon mémoire 8%, barrière 50%, 10 ans.',
      structureType: 'AUTOCALL' as const,
      isDefault: true,
      config: {
        structureType: 'AUTOCALL',
        currency: 'EUR',
        nominalAmount: 2000000,
        denomination: 1000,
        minimumSubscription: 1000,
        issuePriceTarget: 100,
        underlying: {
          ticker: '^FCHI',
          name: 'CAC 40',
          type: 'INDEX',
          currency: 'EUR',
          spot: 7500,
          strikeLevel: 7500,
          volatility: 0.20,
          dividendYield: 0.028,
          repoOrBorrowCost: 0,
        },
        payoff: {
          strike: 1.0,
          participationUp: 0,
          participationDown: 1.0,
          couponType: 'MEMORY',
          couponRate: 0.08,
          couponFrequency: 'SEMI_ANNUAL',
          couponBarrier: 0.60,
          couponMemory: true,
          autocallEnabled: true,
          autocallBarrier: 1.0,
          autocallStepDown: [1.0, 1.0, 0.95, 0.95, 0.90, 0.90, 0.85, 0.85, 0.80, 0.80],
          protectionType: 'BARRIER',
          protectionBarrier: 0.50,
          capitalGuaranteeLevel: 0,
          knockInLevel: 0.50,
          knockOutLevel: 0,
          barrierMonitoring: 'EUROPEAN',
          cap: 0,
          floor: 0,
          digitalTrigger: 0,
          cashSettlement: true,
        },
        market: {
          riskFreeRate: 0.03,
          discountCurve: [0.03],
          fundingSpread: 0.005,
          issuerSpread: 0.01,
          structuringMargin: 0.015,
          distributionFee: 0.025,
          executionCost: 0.005,
        },
        mcPaths: 10000,
        mcSeed: 42,
        observationFrequency: 'DAILY',
      },
    },
    {
      name: 'Worst-of Basket Phoenix — Banking',
      description: 'Phoenix Autocall Worst-of sur panier bancaire (BNP, SG, UniCredit), coupon 12%, barrière 50%.',
      structureType: 'PHOENIX_AUTOCALL' as const,
      isDefault: true,
      config: {
        structureType: 'PHOENIX_AUTOCALL',
        currency: 'EUR',
        nominalAmount: 1000000,
        denomination: 1000,
        minimumSubscription: 1000,
        issuePriceTarget: 100,
        underlying: {
          ticker: 'BNP.PA',
          name: 'BNP Paribas (worst-of basket lead)',
          type: 'SINGLE_STOCK',
          currency: 'EUR',
          spot: 60,
          strikeLevel: 60,
          volatility: 0.28,
          dividendYield: 0.06,
          repoOrBorrowCost: 0.003,
        },
        payoff: {
          strike: 1.0,
          participationUp: 0,
          participationDown: 1.0,
          couponType: 'CONDITIONAL',
          couponRate: 0.12,
          couponFrequency: 'QUARTERLY',
          couponBarrier: 0.50,
          couponMemory: false,
          autocallEnabled: true,
          autocallBarrier: 1.0,
          autocallStepDown: [],
          protectionType: 'BARRIER',
          protectionBarrier: 0.50,
          capitalGuaranteeLevel: 0,
          knockInLevel: 0.50,
          knockOutLevel: 0,
          barrierMonitoring: 'CONTINUOUS',
          cap: 0,
          floor: 0,
          digitalTrigger: 0,
          cashSettlement: true,
        },
        market: {
          riskFreeRate: 0.03,
          discountCurve: [0.03],
          fundingSpread: 0.006,
          issuerSpread: 0.012,
          structuringMargin: 0.015,
          distributionFee: 0.02,
          executionCost: 0.005,
        },
        mcPaths: 10000,
        mcSeed: 42,
        observationFrequency: 'DAILY',
      },
    },
  ];

  for (const tpl of templates) {
    await prisma.productTemplate.upsert({
      where: { id: `tpl-${tpl.structureType}-default` },
      update: {},
      create: {
        id: `tpl-${tpl.structureType}-default`,
        name: tpl.name,
        description: tpl.description,
        structureType: tpl.structureType,
        config: tpl.config,
        isDefault: tpl.isDefault,
      },
    });
  }
  console.log(`Created ${templates.length} product templates`);

  console.log('');
  console.log('Seed completed successfully!');
  console.log('');
  console.log(`Products: ${createdProducts.length}`);
  console.log(`Shelves: ${createdShelves.length}`);
  console.log(`Commitments: ${commitmentData.length}`);
  console.log(`Issuer Profiles: ${issuerProfiles.length}`);
  console.log(`Product Templates: ${templates.length}`);
  console.log(`Commission Rules: ${commissionRulesData.length}`);
  console.log(`Insurer Rules: ${insurerRulesData.length}`);
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
