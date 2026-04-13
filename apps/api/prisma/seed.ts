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
  // Real MeilleurTaux Placement structured products from KIDs (MT3–MT21)

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

    // === MeilleurTaux Placement products (MT7–MT21) ===
    {
      isin: 'FR0014010O28', name: 'M Ambition 10', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge Europe Leaders 20 EW Decrement 50 Points GTR Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 90, couponPct: null, maxGainPct: 100, sri: 6 as const,
      maturityDate: new Date('2035-09-18'), entryFeePct: 3.50, status: 'ACTIVE',
      description: 'Autocallable si performance >= -10%. Montant d\'interet croissant de 10% a 100%. Barriere a 50%.',
    },
    {
      isin: 'FR1459AB8533', name: 'M Ambition 9', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: 'Morningstar Eurozone 50 Decrement 50 Point GR EUR', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6 as const,
      maturityDate: new Date('2035-07-11'), entryFeePct: 6.50, status: 'ACTIVE',
      description: 'Autocallable sur Morningstar Eurozone 50 Decrement. Gain max 2000EUR pour 1000EUR investis. Barriere a 50%.',
    },
    {
      isin: 'FR001400TTR3', name: 'M Equilibre 7', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'EUR CMS 10 ans', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2 as const,
      maturityDate: new Date('2037-07-05'), entryFeePct: 7.50, status: 'ACTIVE',
      description: 'Coupon conditionnel de 6% p.a. indexe sur EUR CMS 10 ans. Capital integralement protege a maturite.',
    },
    {
      isin: 'FR001400YQC1', name: 'Selection Souverainete Europe', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge Europe Aerospace & Defense 10 EW Decrement 50 Points GTR Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 105, sri: 6 as const,
      maturityDate: new Date('2035-06-04'), entryFeePct: 3.50, status: 'ACTIVE',
      description: 'Autocallable thematique Defense europeenne. Montant d\'interet croissant de 10.5% a 105%. Barriere a 50%.',
    },
    {
      isin: 'FR001400TTS1', name: 'M Equilibre 6', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'EUR CMS 10 ans', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2 as const,
      maturityDate: new Date('2037-05-05'), entryFeePct: 7.50, status: 'ACTIVE',
      description: 'Coupon conditionnel de 6% p.a. indexe sur EUR CMS 10 ans. Capital integralement protege a maturite.',
    },
    {
      isin: 'FR001400X1S6', name: 'M Ambition 8', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge ESG Transatlantic EW 20 Decrement 50 Points GTR Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 92, couponPct: null, maxGainPct: 90, sri: 5 as const,
      maturityDate: new Date('2035-04-30'), entryFeePct: 3.50, status: 'ACTIVE',
      description: 'Autocallable ESG Transatlantique si performance >= -7.5%. Montant d\'interet croissant de 9% a 90%. Barriere a 50%.',
    },
    {
      isin: 'FRSG00015LJ6', name: 'G Equilibre', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'Taux EUR CMS 10 ans', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: null, sri: 2 as const,
      maturityDate: new Date('2037-01-19'), entryFeePct: 3.00, status: 'ACTIVE',
      description: 'Placement dynamique risque de type taux. Capital protege a echeance. Distribution Generali. Duree 12 ans.',
    },
    {
      isin: 'FR1459AB4847', name: 'M Equilibre 5', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.00, maxGainPct: 5.00, sri: 2 as const,
      maturityDate: new Date('2037-03-02'), entryFeePct: 6.50, status: 'ACTIVE',
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 50EUR/titre si taux <= 3.10%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB3252', name: 'M Equilibre 4', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2 as const,
      maturityDate: new Date('2036-12-31'), entryFeePct: 6.50, status: 'ACTIVE',
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 60EUR/titre si taux <= 3.20%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB3245', name: 'M Equilibre 3', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2 as const,
      maturityDate: new Date('2036-10-31'), entryFeePct: 6.10, status: 'ACTIVE',
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 60EUR/titre si taux <= 3.20%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB3237', name: 'M Equilibre 2', payoffType: 'CONDITIONAL_RATE' as const,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2 as const,
      maturityDate: new Date('2036-09-01'), entryFeePct: 4.00, status: 'ACTIVE',
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 60EUR/titre si taux <= 3.20%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB2999', name: 'M Ambition DVEUR', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: 'FEDERAL OPTIMAL SELECT-DVEUR', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6 as const,
      maturityDate: new Date('2034-07-05'), entryFeePct: 5.00, status: 'ACTIVE',
      description: 'Autocallable 10 ans lie a FEDERAL OPTIMAL SELECT-DVEUR. Gain max 100% (2000EUR pour 1000EUR). Barriere a 50%.',
    },
    {
      isin: 'FR1459AB0274', name: 'M Rendement 12', payoffType: 'AUTOCALL_PHOENIX' as const,
      issuerName: 'Goldman Sachs International', guarantorName: 'Goldman Sachs',
      underlyingName: 'S&P Eurozone 50 Net Zero 2050 Paris-Aligned Select 50 Point Decrement Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 30, autocallBarrierPct: 100, couponPct: null, maxGainPct: 60, sri: 6 as const,
      maturityDate: new Date('2034-04-19'), entryFeePct: 5.00, status: 'ACTIVE',
      description: 'Autocallable ESG sur S&P Eurozone 50 Net Zero 2050 Paris-Aligned. Gain max 60%. Barriere tres basse a 30%.',
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
        maxGainPct: p.maxGainPct ?? 0,
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

  // ── Shelves (for first 12 products) ───────────────────────────────────────
  const shelfConfigs = [
    { idx: 0, org: cardiffOrg.id, target: 10_000_000, closing: '2026-06-30' },
    { idx: 1, org: cardiffOrg.id, target: 5_000_000, closing: '2026-05-15' },
    { idx: 2, org: celentiaOrg.id, target: 8_000_000, closing: '2026-07-15' },
    { idx: 3, org: cardiffOrg.id, target: 15_000_000, closing: '2026-09-01' },
    { idx: 4, org: cardiffOrg.id, target: 6_000_000, closing: '2026-05-30' },
    { idx: 5, org: celentiaOrg.id, target: 4_000_000, closing: '2026-06-15' },
    { idx: 6, org: cardiffOrg.id, target: 8_000_000, closing: '2026-07-01' },
    { idx: 7, org: celentiaOrg.id, target: 12_000_000, closing: '2026-08-01' },
    { idx: 8, org: cardiffOrg.id, target: 8_000_000, closing: '2026-07-15' },
    { idx: 9, org: celentiaOrg.id, target: 5_000_000, closing: '2026-06-30' },
    { idx: 10, org: cardiffOrg.id, target: 10_000_000, closing: '2026-08-15' },
    { idx: 11, org: celentiaOrg.id, target: 7_000_000, closing: '2026-09-15' },
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
