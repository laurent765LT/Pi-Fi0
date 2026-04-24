// ═══════════════════════════════════════════════════════════════════════════════
// STRICK'IN — Prisma seed script (idempotent)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Idempotency: every upsert uses a natural unique key (email, isin, siren,
// orias, contractNumber, idempotencyKey) or a deterministic id, so re-running
// this script never duplicates data.
//
// Sprint 1 T1.2 additions (required by the spec):
//  - 3 pilote CGPs (emails pilote1..3@cabinet-demo.fr, password Pilote2026!)
//  - 1 Insurer "Cardif Demo" with 3 Envelopes
//  - 1 Issuer "BNP Demo" with 10 structured Products (ISINs FR001401xxxx)
//  - 5 Clients per CGP (15 total) with 2 Contracts each
//  - 30 active Positions distributed across contracts
// ═══════════════════════════════════════════════════════════════════════════════

import {
  PrismaClient,
  ProductStatus,
  PayoffType,
  ContractType,
  CgpStatus,
  EnvelopeStatus,
  KYCStatus,
  UserRole,
  OnboardingStatus,
  type Prisma,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

/**
 * Build deterministic stable IDs for seeded rows so re-running the script
 * always hits the same rows (where a natural unique key isn't available).
 */
function stableId(prefix: string, key: string): string {
  return `${prefix}_${key}`;
}

async function main(): Promise<void> {
  console.log("Seeding Strick'in database...");

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY CORE — Organizations, admin/assureur/cgp demo users
  // ═══════════════════════════════════════════════════════════════════════════

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

  const legacyPasswordHash = await hashPassword('Strickin2025!');

  await prisma.user.upsert({
    where: { email: 'admin@strickin.com' },
    update: {},
    create: {
      email: 'admin@strickin.com',
      passwordHash: legacyPasswordHash,
      firstName: 'Paul-Adrien',
      lastName: 'Desplechin',
      role: UserRole.SUPER_ADMIN,
      orgId: adminOrg.id,
      onboardingStatus: OnboardingStatus.ACTIVE,
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  const legacyCgpUser = await prisma.user.upsert({
    where: { email: 'cgp@demo.com' },
    update: {},
    create: {
      email: 'cgp@demo.com',
      passwordHash: legacyPasswordHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.VIEWER,
      orgId: brokerOrg.id,
      oriasNumber: '12345678',
      oriasValidUntil: new Date('2026-12-31'),
      rcpInsurer: 'AXA',
      rcpAmount: 1_500_000,
      onboardingStatus: OnboardingStatus.ACTIVE,
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  await prisma.user.upsert({
    where: { email: 'assureur@cardiff.fr' },
    update: {},
    create: {
      email: 'assureur@cardiff.fr',
      passwordHash: legacyPasswordHash,
      firstName: 'Delphine',
      lastName: 'Martin',
      role: UserRole.ORG_ADMIN,
      orgId: cardiffOrg.id,
      onboardingStatus: OnboardingStatus.ACTIVE,
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SPRINT 1 T1.2 — PRODUCTION DEMO DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1) Pilote password (shared across the three pilote CGPs) ───────────────
  const pilotePasswordHash = await hashPassword('Pilote2026!');

  // ── 2) 3 pilote CGPs (User + Cgp) ──────────────────────────────────────────
  type PiloteSpec = {
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    siren: string;
    oriasNumber: string;
    rcpInsurer: string;
    rcpAmount: number;
  };

  const piloteSpecs: PiloteSpec[] = [
    {
      email: 'pilote1@cabinet-demo.fr',
      firstName: 'Claire',
      lastName: 'Lefebvre',
      companyName: 'Cabinet Lefebvre Patrimoine',
      siren: '812345001',
      oriasNumber: '21000101',
      rcpInsurer: 'MMA',
      rcpAmount: 2_000_000,
    },
    {
      email: 'pilote2@cabinet-demo.fr',
      firstName: 'Marc',
      lastName: 'Bernard',
      companyName: 'Bernard Conseil & Finance',
      siren: '812345002',
      oriasNumber: '21000102',
      rcpInsurer: 'AXA',
      rcpAmount: 1_500_000,
    },
    {
      email: 'pilote3@cabinet-demo.fr',
      firstName: 'Sophie',
      lastName: 'Durand',
      companyName: 'Durand Wealth Management',
      siren: '812345003',
      oriasNumber: '21000103',
      rcpInsurer: 'Allianz',
      rcpAmount: 2_500_000,
    },
  ];

  const piloteCgps: { user: { id: string; email: string }; cgp: { id: string; companyName: string } }[] = [];

  for (const spec of piloteSpecs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: UserRole.CGP,
        onboardingStatus: OnboardingStatus.ACTIVE,
        kycStatus: KYCStatus.VERIFIED,
        oriasNumber: spec.oriasNumber,
        rcpInsurer: spec.rcpInsurer,
        rcpAmount: spec.rcpAmount,
      },
      create: {
        email: spec.email,
        passwordHash: pilotePasswordHash,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: UserRole.CGP,
        orgId: brokerOrg.id,
        oriasNumber: spec.oriasNumber,
        oriasValidUntil: new Date('2027-12-31'),
        rcpInsurer: spec.rcpInsurer,
        rcpAmount: spec.rcpAmount,
        onboardingStatus: OnboardingStatus.ACTIVE,
        kycStatus: KYCStatus.VERIFIED,
      },
    });

    const cgp = await prisma.cgp.upsert({
      where: { userId: user.id },
      update: {
        companyName: spec.companyName,
        siren: spec.siren,
        oriasNumber: spec.oriasNumber,
        rcpInsurer: spec.rcpInsurer,
        rcpAmount: spec.rcpAmount,
        status: CgpStatus.ACTIVE,
      },
      create: {
        userId: user.id,
        companyName: spec.companyName,
        siren: spec.siren,
        oriasNumber: spec.oriasNumber,
        rcpInsurer: spec.rcpInsurer,
        rcpAmount: spec.rcpAmount,
        rcpValidUntil: new Date('2027-12-31'),
        status: CgpStatus.ACTIVE,
      },
    });

    piloteCgps.push({
      user: { id: user.id, email: user.email },
      cgp: { id: cgp.id, companyName: cgp.companyName },
    });
  }

  console.log(`Created/updated ${piloteCgps.length} pilote CGPs`);

  // ── 3) 1 Insurer "Cardif Demo" ─────────────────────────────────────────────
  const cardifDemo = await prisma.insurer.upsert({
    where: { name: 'Cardif Demo' },
    update: {
      legalName: 'BNP Paribas Cardif (Demo)',
      isActive: true,
    },
    create: {
      name: 'Cardif Demo',
      legalName: 'BNP Paribas Cardif (Demo)',
      siren: '732028154',
      logoUrl: 'https://logo.demo/cardif.svg',
      apiBaseUrl: 'https://api.demo.cardif.fr',
      apiCredentials: { mode: 'demo', keyRef: 'vault://cardif-demo/api' },
      isActive: true,
    },
  });

  // ── 4) 1 Issuer "BNP Demo" ─────────────────────────────────────────────────
  const bnpDemo = await prisma.issuer.upsert({
    where: { name: 'BNP Demo' },
    update: {
      legalName: 'BNP Paribas Issuance (Demo)',
      isActive: true,
    },
    create: {
      name: 'BNP Demo',
      legalName: 'BNP Paribas Issuance (Demo)',
      lei: '549300DTSGE1SBM38L41',
      logoUrl: 'https://logo.demo/bnp.svg',
      apiBaseUrl: 'https://api.demo.bnp.fr',
      apiCredentials: { mode: 'demo', keyRef: 'vault://bnp-demo/api' },
      isActive: true,
    },
  });

  // ── 5) 10 structured Products issued by BNP Demo ───────────────────────────
  type ProductSpec = {
    isin: string;
    name: string;
    payoffType: PayoffType;
    underlying: string;
    underlyingYahoo: string;
    couponPct: number | null;
    barrierCapPct: number;
    maxGainPct: number;
    sri: number;
    maturityDate: Date;
    entryFeePct: number;
    autocallBarrierPct: number | null;
    description: string;
  };

  const bnpProductSpecs: ProductSpec[] = [
    {
      isin: 'FR0014010001',
      name: 'BNP Demo Autocall Eurostoxx 1',
      payoffType: PayoffType.AUTOCALL_PHOENIX,
      underlying: 'Euro Stoxx 50',
      underlyingYahoo: '^STOXX50E',
      couponPct: 7.5,
      barrierCapPct: 50,
      maxGainPct: 150,
      sri: 6,
      maturityDate: new Date('2034-06-30'),
      entryFeePct: 3.0,
      autocallBarrierPct: 100,
      description: 'Autocall Phoenix 10 ans sur Euro Stoxx 50, coupon conditionnel 7.5%, barrière 50%.',
    },
    {
      isin: 'FR0014010002',
      name: 'BNP Demo Phoenix CAC 40',
      payoffType: PayoffType.AUTOCALL_PHOENIX,
      underlying: 'CAC 40',
      underlyingYahoo: '^FCHI',
      couponPct: 8.0,
      barrierCapPct: 55,
      maxGainPct: 160,
      sri: 6,
      maturityDate: new Date('2034-09-30'),
      entryFeePct: 2.5,
      autocallBarrierPct: 100,
      description: 'Phoenix Autocall 10 ans sur CAC 40, coupon conditionnel 8%, barrière 55%.',
    },
    {
      isin: 'FR0014010003',
      name: 'BNP Demo Autocall Coupon Mémoire Stoxx',
      payoffType: PayoffType.AUTOCALL_COUPON,
      underlying: 'Euro Stoxx 50',
      underlyingYahoo: '^STOXX50E',
      couponPct: 6.5,
      barrierCapPct: 60,
      maxGainPct: 130,
      sri: 5,
      maturityDate: new Date('2033-12-15'),
      entryFeePct: 3.5,
      autocallBarrierPct: 95,
      description: 'Autocall avec coupon mémoire 6.5% sur Euro Stoxx 50, barrière 60%, 9 ans.',
    },
    {
      isin: 'FR0014010004',
      name: 'BNP Demo Capital Protégé MSCI World',
      payoffType: PayoffType.CAPITAL_PROTECTED,
      underlying: 'MSCI World',
      underlyingYahoo: 'URTH',
      couponPct: null,
      barrierCapPct: 100,
      maxGainPct: 140,
      sri: 2,
      maturityDate: new Date('2031-05-31'),
      entryFeePct: 2.0,
      autocallBarrierPct: null,
      description: 'Capital protégé 100% sur MSCI World, participation 140% à la hausse, 6 ans.',
    },
    {
      isin: 'FR0014010005',
      name: 'BNP Demo Capital Protégé Gold',
      payoffType: PayoffType.CAPITAL_PROTECTED,
      underlying: 'LBMA Gold EUR',
      underlyingYahoo: 'GC=F',
      couponPct: null,
      barrierCapPct: 100,
      maxGainPct: 120,
      sri: 2,
      maturityDate: new Date('2031-03-15'),
      entryFeePct: 2.5,
      autocallBarrierPct: null,
      description: 'Capital protégé 100% indexé sur l\'or, participation 120%, 6 ans.',
    },
    {
      isin: 'FR0014010006',
      name: 'BNP Demo Phoenix SX5E Worst-of',
      payoffType: PayoffType.AUTOCALL_PHOENIX,
      underlying: 'Euro Stoxx 50 Worst-of',
      underlyingYahoo: '^STOXX50E',
      couponPct: 9.5,
      barrierCapPct: 45,
      maxGainPct: 190,
      sri: 7,
      maturityDate: new Date('2034-11-30'),
      entryFeePct: 4.0,
      autocallBarrierPct: 100,
      description: 'Phoenix Autocall Worst-of sur indices européens, coupon 9.5%, barrière 45%.',
    },
    {
      isin: 'FR0014010007',
      name: 'BNP Demo Autocall Nasdaq 100',
      payoffType: PayoffType.AUTOCALL_PHOENIX,
      underlying: 'Nasdaq 100',
      underlyingYahoo: '^NDX',
      couponPct: 7.0,
      barrierCapPct: 55,
      maxGainPct: 140,
      sri: 6,
      maturityDate: new Date('2033-10-31'),
      entryFeePct: 3.0,
      autocallBarrierPct: 100,
      description: 'Autocall Phoenix 8 ans sur Nasdaq 100, coupon conditionnel 7%, barrière 55%.',
    },
    {
      isin: 'FR0014010008',
      name: 'BNP Demo Reverse Convertible Total',
      payoffType: PayoffType.REVERSE,
      underlying: 'TotalEnergies',
      underlyingYahoo: 'TTE.PA',
      couponPct: 10.0,
      barrierCapPct: 65,
      maxGainPct: 10,
      sri: 5,
      maturityDate: new Date('2027-04-30'),
      entryFeePct: 2.0,
      autocallBarrierPct: null,
      description: 'Reverse Convertible 2 ans sur TotalEnergies, coupon fixe 10%, barrière 65%.',
    },
    {
      isin: 'FR0014010009',
      name: 'BNP Demo Reverse Sanofi',
      payoffType: PayoffType.REVERSE,
      underlying: 'Sanofi',
      underlyingYahoo: 'SAN.PA',
      couponPct: 9.0,
      barrierCapPct: 70,
      maxGainPct: 9,
      sri: 5,
      maturityDate: new Date('2027-06-30'),
      entryFeePct: 2.0,
      autocallBarrierPct: null,
      description: 'Reverse Convertible 18 mois sur Sanofi, coupon fixe 9%, barrière 70%.',
    },
    {
      isin: 'FR0014010010',
      name: 'BNP Demo Capital Protégé Eurostoxx',
      payoffType: PayoffType.CAPITAL_PROTECTED,
      underlying: 'Euro Stoxx 50',
      underlyingYahoo: '^STOXX50E',
      couponPct: null,
      barrierCapPct: 100,
      maxGainPct: 125,
      sri: 2,
      maturityDate: new Date('2032-02-28'),
      entryFeePct: 2.5,
      autocallBarrierPct: null,
      description: 'Capital protégé 100% sur Euro Stoxx 50, participation 125%, 7 ans.',
    },
  ];

  const bnpProducts: { id: string; isin: string }[] = [];

  for (const spec of bnpProductSpecs) {
    const product = await prisma.product.upsert({
      where: { isin: spec.isin },
      update: {
        name: spec.name,
        payoffType: spec.payoffType,
        underlyingName: spec.underlying,
        underlyingYahoo: spec.underlyingYahoo,
        couponPct: spec.couponPct,
        barrierCapPct: spec.barrierCapPct,
        autocallBarrierPct: spec.autocallBarrierPct,
        maxGainPct: spec.maxGainPct,
        sri: spec.sri,
        maturityDate: spec.maturityDate,
        entryFeePct: spec.entryFeePct,
        description: spec.description,
        status: ProductStatus.LIVE,
        issuerId: bnpDemo.id,
        issuerName: 'BNP Demo',
        guarantorName: 'BNP Paribas',
      },
      create: {
        isin: spec.isin,
        name: spec.name,
        payoffType: spec.payoffType,
        issuerName: 'BNP Demo',
        guarantorName: 'BNP Paribas',
        underlyingName: spec.underlying,
        underlyingYahoo: spec.underlyingYahoo,
        couponPct: spec.couponPct,
        barrierCapPct: spec.barrierCapPct,
        autocallBarrierPct: spec.autocallBarrierPct,
        maxGainPct: spec.maxGainPct,
        sri: spec.sri,
        maturityDate: spec.maturityDate,
        entryFeePct: spec.entryFeePct,
        description: spec.description,
        status: ProductStatus.LIVE,
        issuerId: bnpDemo.id,
        orgId: adminOrg.id,
      },
    });
    bnpProducts.push({ id: product.id, isin: product.isin });
  }

  console.log(`Created/updated ${bnpProducts.length} BNP Demo products`);

  // ── 6) 3 Envelopes (Cardif Demo allocating to first 3 BNP products) ───────
  const envelopeConfigs: { productIdx: number; amount: number }[] = [
    { productIdx: 0, amount: 10_000_000 },
    { productIdx: 1, amount: 7_500_000 },
    { productIdx: 2, amount: 5_000_000 },
  ];

  let envelopeCount = 0;
  for (const cfg of envelopeConfigs) {
    const product = bnpProducts[cfg.productIdx];
    if (!product) continue;
    await prisma.envelope.upsert({
      where: {
        insurerId_productId: {
          insurerId: cardifDemo.id,
          productId: product.id,
        },
      },
      update: {
        allocatedAmount: cfg.amount,
        status: EnvelopeStatus.OPEN,
      },
      create: {
        insurerId: cardifDemo.id,
        productId: product.id,
        allocatedAmount: cfg.amount,
        consumedAmount: 0,
        status: EnvelopeStatus.OPEN,
      },
    });
    envelopeCount += 1;
  }

  console.log(`Created/updated ${envelopeCount} envelopes (Cardif Demo)`);

  // ── 7) 5 Clients per CGP (15 total) + 2 Contracts each ────────────────────
  const clientFirstNames = ['Alice', 'Bruno', 'Camille', 'David', 'Emma'];
  const clientLastNames = ['Moreau', 'Petit', 'Robert', 'Fournier', 'Girard'];

  type SeededClient = {
    id: string;
    cgpId: string;
    firstName: string;
    lastName: string;
    contracts: { id: string; type: ContractType }[];
  };

  const seededClients: SeededClient[] = [];

  for (let pIdx = 0; pIdx < piloteCgps.length; pIdx++) {
    const pilote = piloteCgps[pIdx]!;
    const cgpCode = pIdx + 1;

    for (let cIdx = 0; cIdx < 5; cIdx++) {
      const firstName = clientFirstNames[cIdx]!;
      const lastName = clientLastNames[cIdx]!;
      const clientEmail = `client${cgpCode}-${cIdx + 1}@demo-clients.fr`;

      const client = await prisma.client.upsert({
        where: { email: clientEmail },
        update: {
          cgpId: pilote.cgp.id,
          kycStatus: KYCStatus.VERIFIED,
        },
        create: {
          cgpId: pilote.cgp.id,
          firstName,
          lastName,
          birthDate: new Date(1965 + cIdx * 3, cIdx, 15 + cIdx),
          email: clientEmail,
          phone: `+33 6 ${String(cgpCode).padStart(2, '0')} ${String(cIdx + 1).padStart(2, '0')} 11 22`,
          kycStatus: KYCStatus.VERIFIED,
          encryptedData: {
            addressRef: `vault://clients/${clientEmail}/address`,
            taxIdRef: `vault://clients/${clientEmail}/tax-id`,
          } satisfies Prisma.InputJsonValue,
        },
      });

      // 2 contracts per client: AV + CAPI (variety)
      const contractSpecs: { suffix: string; type: ContractType; value: number }[] = [
        { suffix: 'AV', type: ContractType.AV, value: 150_000 + cIdx * 25_000 + pIdx * 10_000 },
        { suffix: 'CAPI', type: ContractType.CAPI, value: 75_000 + cIdx * 12_500 + pIdx * 5_000 },
      ];

      const seededContracts: { id: string; type: ContractType }[] = [];

      for (const csp of contractSpecs) {
        const contractNumber = `CT-CGP${cgpCode}-${cIdx + 1}-${csp.suffix}`;
        const contract = await prisma.contract.upsert({
          where: { contractNumber },
          update: {
            clientId: client.id,
            insurerId: cardifDemo.id,
            type: csp.type,
            currentValue: csp.value,
          },
          create: {
            clientId: client.id,
            insurerId: cardifDemo.id,
            contractNumber,
            type: csp.type,
            currentValue: csp.value,
          },
        });
        seededContracts.push({ id: contract.id, type: csp.type });
      }

      seededClients.push({
        id: client.id,
        cgpId: pilote.cgp.id,
        firstName,
        lastName,
        contracts: seededContracts,
      });
    }
  }

  console.log(`Created/updated ${seededClients.length} clients (5 per CGP x 3)`);
  console.log(`Created/updated ${seededClients.length * 2} contracts (2 per client)`);

  // ── 8) 30 active Positions distributed across clients/products ────────────
  // Deterministic allocation: client k (0..14) gets 2 positions across the
  // BNP product universe using a round-robin offset. This yields exactly 30
  // positions (15 clients x 2 contracts -> 1 position per contract-product
  // mapping => 30 rows).
  let positionCount = 0;
  for (let k = 0; k < seededClients.length; k++) {
    const client = seededClients[k]!;
    for (let p = 0; p < client.contracts.length; p++) {
      const contract = client.contracts[p]!;
      const product = bnpProducts[(k + p * 3) % bnpProducts.length]!;
      const quantity = 50 + ((k * 7 + p * 3) % 50);
      const averagePrice = 990 + ((k * 3 + p * 11) % 50);

      const positionStableId = stableId('pos', `${contract.id}-${product.id}`);

      await prisma.position.upsert({
        where: { id: positionStableId },
        update: {
          quantity,
          averagePrice,
        },
        create: {
          id: positionStableId,
          contractId: contract.id,
          productId: product.id,
          clientId: client.id,
          quantity,
          averagePrice,
          openedAt: new Date(2025, (k + p) % 12, 1 + (k % 27)),
        },
      });
      positionCount += 1;
    }
  }

  console.log(`Created/updated ${positionCount} positions`);

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY DEMO DATA (MeilleurTaux KIDs, shelves, commitments, etc.)
  // ═══════════════════════════════════════════════════════════════════════════

  // Real MeilleurTaux Placement structured products — preserved for demo pages.
  const legacyProductsData: Array<{
    isin: string;
    name: string;
    payoffType: PayoffType;
    issuerName: string;
    guarantorName: string;
    underlyingName: string;
    underlyingYahoo: string;
    barrierCapPct: number;
    autocallBarrierPct: number | null;
    couponPct: number | null;
    maxGainPct: number | null;
    sri: number;
    maturityDate: Date;
    entryFeePct: number;
    description: string;
  }> = [
    {
      isin: 'FR0014013A96', name: 'M Rendement 13', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'BNP Paribas Issuance B.V.', guarantorName: 'BNP Paribas',
      underlyingName: 'Euro Stoxx 50', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 85, couponPct: 7, maxGainPct: 170, sri: 7,
      maturityDate: new Date('2035-12-17'), entryFeePct: 5.06,
      description: 'Autocall Phoenix sur Euro Stoxx 50 avec coupon conditionnel de 7% p.a.',
    },
    {
      isin: 'FR0014012O42', name: 'M Rendement OR', payoffType: PayoffType.CAPITAL_PROTECTED,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge Gold Shares EUR PR Index', underlyingYahoo: 'GC=F',
      barrierCapPct: 90, autocallBarrierPct: null, couponPct: null, maxGainPct: 121, sri: 2,
      maturityDate: new Date('2028-12-29'), entryFeePct: 2.50,
      description: 'Capital protege a 90% indexe sur l\'or.',
    },
    {
      isin: 'FR0014013AB5', name: 'M Rendement Mixte', payoffType: PayoffType.AUTOCALL_COUPON,
      issuerName: 'BNP Paribas Issuance B.V.', guarantorName: 'BNP Paribas',
      underlyingName: 'Euro Stoxx 50', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: 3, maxGainPct: 150, sri: 4,
      maturityDate: new Date('2035-12-17'), entryFeePct: 5.93,
      description: 'Autocall avec coupon fixe de 3% sur Euro Stoxx 50.',
    },
    {
      isin: 'FR0014011938', name: 'M Equilibre CT', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'EUR EURIBOR 12 Months', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.15, maxGainPct: 6.15, sri: 2,
      maturityDate: new Date('2037-10-05'), entryFeePct: 8.18,
      description: 'Taux conditionnel indexe sur Euribor 12 mois.',
    },
    {
      isin: 'FR0014010O28', name: 'M Ambition 10', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge Europe Leaders 20 EW Decrement 50 Points GTR Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 90, couponPct: null, maxGainPct: 100, sri: 6,
      maturityDate: new Date('2035-09-18'), entryFeePct: 3.50,
      description: 'Autocallable si performance >= -10%. Montant d\'interet croissant de 10% a 100%. Barriere a 50%.',
    },
    {
      isin: 'FR1459AB8533', name: 'M Ambition 9', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: 'Morningstar Eurozone 50 Decrement 50 Point GR EUR', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6,
      maturityDate: new Date('2035-07-11'), entryFeePct: 6.50,
      description: 'Autocallable sur Morningstar Eurozone 50 Decrement. Gain max 2000EUR pour 1000EUR investis. Barriere a 50%.',
    },
    {
      isin: 'FR001400TTR3', name: 'M Equilibre 7', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'EUR CMS 10 ans', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
      maturityDate: new Date('2037-07-05'), entryFeePct: 7.50,
      description: 'Coupon conditionnel de 6% p.a. indexe sur EUR CMS 10 ans. Capital integralement protege a maturite.',
    },
    {
      isin: 'FR001400YQC1', name: 'Selection Souverainete Europe', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge Europe Aerospace & Defense 10 EW Decrement 50 Points GTR Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 105, sri: 6,
      maturityDate: new Date('2035-06-04'), entryFeePct: 3.50,
      description: 'Autocallable thematique Defense europeenne. Montant d\'interet croissant de 10.5% a 105%. Barriere a 50%.',
    },
    {
      isin: 'FR001400TTS1', name: 'M Equilibre 6', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'EUR CMS 10 ans', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
      maturityDate: new Date('2037-05-05'), entryFeePct: 7.50,
      description: 'Coupon conditionnel de 6% p.a. indexe sur EUR CMS 10 ans. Capital integralement protege a maturite.',
    },
    {
      isin: 'FR001400X1S6', name: 'M Ambition 8', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'Natixis Structured Issuance', guarantorName: 'BPCE',
      underlyingName: 'iEdge ESG Transatlantic EW 20 Decrement 50 Points GTR Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 92, couponPct: null, maxGainPct: 90, sri: 5,
      maturityDate: new Date('2035-04-30'), entryFeePct: 3.50,
      description: 'Autocallable ESG Transatlantique si performance >= -7.5%. Montant d\'interet croissant de 9% a 90%. Barriere a 50%.',
    },
    {
      isin: 'FRSG00015LJ6', name: 'G Equilibre', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'SG Issuer', guarantorName: 'Societe Generale',
      underlyingName: 'Taux EUR CMS 10 ans', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: null, maxGainPct: 0, sri: 2,
      maturityDate: new Date('2037-01-19'), entryFeePct: 3.00,
      description: 'Placement dynamique risque de type taux. Capital protege a echeance. Distribution Generali. Duree 12 ans.',
    },
    {
      isin: 'FR1459AB4847', name: 'M Equilibre 5', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 5.00, maxGainPct: 5.00, sri: 2,
      maturityDate: new Date('2037-03-02'), entryFeePct: 6.50,
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 50EUR/titre si taux <= 3.10%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB3252', name: 'M Equilibre 4', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
      maturityDate: new Date('2036-12-31'), entryFeePct: 6.50,
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 60EUR/titre si taux <= 3.20%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB3245', name: 'M Equilibre 3', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
      maturityDate: new Date('2036-10-31'), entryFeePct: 6.10,
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 60EUR/titre si taux <= 3.20%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB3237', name: 'M Equilibre 2', payoffType: PayoffType.CONDITIONAL_RATE,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: '10 Year EUR ICE Swap Rate', underlyingYahoo: 'EURIBOR12M',
      barrierCapPct: 100, autocallBarrierPct: null, couponPct: 6.00, maxGainPct: 6.00, sri: 2,
      maturityDate: new Date('2036-09-01'), entryFeePct: 4.00,
      description: 'Phoenix lie au 10Y EUR ICE Swap Rate. Coupon 60EUR/titre si taux <= 3.20%. Capital protege 100%.',
    },
    {
      isin: 'FR1459AB2999', name: 'M Ambition DVEUR', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'Goldman Sachs Finance Corp International Ltd', guarantorName: 'Goldman Sachs',
      underlyingName: 'FEDERAL OPTIMAL SELECT-DVEUR', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 50, autocallBarrierPct: 100, couponPct: null, maxGainPct: 100, sri: 6,
      maturityDate: new Date('2034-07-05'), entryFeePct: 5.00,
      description: 'Autocallable 10 ans lie a FEDERAL OPTIMAL SELECT-DVEUR. Gain max 100% (2000EUR pour 1000EUR). Barriere a 50%.',
    },
    {
      isin: 'FR1459AB0274', name: 'M Rendement 12', payoffType: PayoffType.AUTOCALL_PHOENIX,
      issuerName: 'Goldman Sachs International', guarantorName: 'Goldman Sachs',
      underlyingName: 'S&P Eurozone 50 Net Zero 2050 Paris-Aligned Select 50 Point Decrement Index', underlyingYahoo: '^STOXX50E',
      barrierCapPct: 30, autocallBarrierPct: 100, couponPct: null, maxGainPct: 60, sri: 6,
      maturityDate: new Date('2034-04-19'), entryFeePct: 5.00,
      description: 'Autocallable ESG sur S&P Eurozone 50 Net Zero 2050 Paris-Aligned. Gain max 60%. Barriere tres basse a 30%.',
    },
  ];

  const legacyCreatedProducts: { id: string; isin: string }[] = [];
  for (const p of legacyProductsData) {
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
        status: ProductStatus.ACTIVE,
        orgId: adminOrg.id,
      },
    });
    legacyCreatedProducts.push({ id: product.id, isin: product.isin });
  }

  console.log(`Created/updated ${legacyCreatedProducts.length} legacy MeilleurTaux products`);

  // Shelves for first 12 legacy products
  const shelfConfigs: { idx: number; org: string; target: number; closing: string }[] = [
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

  const createdShelves: { id: string }[] = [];
  for (const sc of shelfConfigs) {
    const p = legacyCreatedProducts[sc.idx];
    if (!p) continue;
    const shelf = await prisma.shelf.upsert({
      where: { id: `shelf-${p.isin}` },
      update: {},
      create: {
        id: `shelf-${p.isin}`,
        productId: p.id,
        orgId: sc.org,
        status: 'OPEN',
        targetAmount: sc.target,
        surbookingPct: 15,
        closingDate: new Date(sc.closing),
      },
    });
    createdShelves.push({ id: shelf.id });
  }

  // Demo commitments on legacy cgpUser
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
    if (!shelf) continue;
    await prisma.commitment.upsert({
      where: { id: `commit-demo-${i + 1}` },
      update: {},
      create: {
        id: `commit-demo-${i + 1}`,
        shelfId: shelf.id,
        userId: legacyCgpUser.id,
        orgId: brokerOrg.id,
        amount: cd.amount,
        status: cd.status,
        rank: cd.status === 'WAITING' ? i + 1 : null,
      },
    });
  }

  // Legacy issuer profiles for the pricing simulator
  const issuerProfiles = [
    { name: 'BNP Paribas CIB', shortName: 'BNPP', fundingSpread: 0.004, volMarkup: 0.005, structuringMargin: 0.012, distributionFriendliness: 0.8, couponAggressiveness: 0.65, protectionAggressiveness: 0.6, barrierPreference: 60, maxMaturityMonths: 144, minTicket: 100_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON'], unsupportedStructures: [] as string[], rejectionProbability: 0.05, quoteDelayMs: 1500, commentStyle: 'aggressive' },
    { name: 'Goldman Sachs International', shortName: 'GS', fundingSpread: 0.005, volMarkup: 0.008, structuringMargin: 0.018, distributionFriendliness: 0.6, couponAggressiveness: 0.7, protectionAggressiveness: 0.45, barrierPreference: 55, maxMaturityMonths: 120, minTicket: 250_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'CAPPED_PARTICIPATION', 'DIGITAL_PAYOFF'], unsupportedStructures: ['CREDIT_LINKED_NOTE'] as string[], rejectionProbability: 0.15, quoteDelayMs: 3000, commentStyle: 'aggressive' },
    { name: 'Marex Financial Products', shortName: 'MAREX', fundingSpread: 0.007, volMarkup: 0.006, structuringMargin: 0.010, distributionFriendliness: 0.85, couponAggressiveness: 0.55, protectionAggressiveness: 0.5, barrierPreference: 60, maxMaturityMonths: 60, minTicket: 50_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON', 'COUPON_EXPRESS'], unsupportedStructures: ['CAPITAL_PROTECTED_NOTE', 'CREDIT_LINKED_NOTE'] as string[], rejectionProbability: 0.08, quoteDelayMs: 2000, commentStyle: 'neutral' },
    { name: 'Société Générale CIB', shortName: 'SG', fundingSpread: 0.0045, volMarkup: 0.004, structuringMargin: 0.013, distributionFriendliness: 0.75, couponAggressiveness: 0.6, protectionAggressiveness: 0.55, barrierPreference: 65, maxMaturityMonths: 144, minTicket: 100_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON', 'CREDIT_LINKED_NOTE', 'COUPON_EXPRESS'], unsupportedStructures: [] as string[], rejectionProbability: 0.06, quoteDelayMs: 1800, commentStyle: 'neutral' },
    { name: 'Citigroup Global Markets', shortName: 'CITI', fundingSpread: 0.005, volMarkup: 0.007, structuringMargin: 0.016, distributionFriendliness: 0.65, couponAggressiveness: 0.5, protectionAggressiveness: 0.55, barrierPreference: 60, maxMaturityMonths: 120, minTicket: 200_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'CAPPED_PARTICIPATION'], unsupportedStructures: ['CREDIT_LINKED_NOTE'] as string[], rejectionProbability: 0.12, quoteDelayMs: 2500, commentStyle: 'conservative' },
    { name: 'J.P. Morgan Securities', shortName: 'JPM', fundingSpread: 0.004, volMarkup: 0.009, structuringMargin: 0.020, distributionFriendliness: 0.55, couponAggressiveness: 0.75, protectionAggressiveness: 0.4, barrierPreference: 50, maxMaturityMonths: 120, minTicket: 500_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'DIGITAL_PAYOFF', 'CAPPED_PARTICIPATION'], unsupportedStructures: ['CREDIT_LINKED_NOTE', 'COUPON_EXPRESS'] as string[], rejectionProbability: 0.18, quoteDelayMs: 3500, commentStyle: 'aggressive' },
    { name: 'UBS AG London Branch', shortName: 'UBS', fundingSpread: 0.0055, volMarkup: 0.005, structuringMargin: 0.014, distributionFriendliness: 0.7, couponAggressiveness: 0.55, protectionAggressiveness: 0.6, barrierPreference: 65, maxMaturityMonths: 120, minTicket: 100_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'CAPITAL_PROTECTED_NOTE', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'BONUS_CERTIFICATE'], unsupportedStructures: [] as string[], rejectionProbability: 0.10, quoteDelayMs: 2000, commentStyle: 'conservative' },
    { name: 'Barclays Bank PLC', shortName: 'BARC', fundingSpread: 0.006, volMarkup: 0.006, structuringMargin: 0.015, distributionFriendliness: 0.7, couponAggressiveness: 0.5, protectionAggressiveness: 0.5, barrierPreference: 60, maxMaturityMonths: 96, minTicket: 150_000, supportedStructures: ['AUTOCALL', 'PHOENIX_AUTOCALL', 'REVERSE_CONVERTIBLE', 'BARRIER_REVERSE_CONVERTIBLE', 'MEMORY_COUPON'], unsupportedStructures: ['CAPITAL_PROTECTED_NOTE', 'CREDIT_LINKED_NOTE'] as string[], rejectionProbability: 0.10, quoteDelayMs: 2200, commentStyle: 'neutral' },
  ];

  for (const ip of issuerProfiles) {
    await prisma.issuerProfile.upsert({
      where: { name: ip.name },
      update: {},
      create: ip,
    });
  }

  // Legacy commission rules
  const commissionRulesData = [
    { id: 'cr-global-entry', commissionType: 'ENTRY_FEE' as const, ratePct: 5.0, splitPlatformPct: 30, splitDistributorPct: 70, isActive: true },
    { id: 'cr-global-mgmt', commissionType: 'MANAGEMENT_FEE' as const, ratePct: 1.0, splitPlatformPct: 25, splitDistributorPct: 75, isActive: true },
    { id: 'cr-global-dist', commissionType: 'DISTRIBUTION_FEE' as const, ratePct: 2.0, splitPlatformPct: 20, splitDistributorPct: 80, isActive: true },
    { id: 'cr-cardiff-entry', commissionType: 'ENTRY_FEE' as const, ratePct: 4.5, splitPlatformPct: 35, splitDistributorPct: 65, orgId: cardiffOrg.id, isActive: true },
    { id: 'cr-cardiff-trailer', commissionType: 'TRAILER_FEE' as const, ratePct: 0.5, splitPlatformPct: 20, splitDistributorPct: 80, orgId: cardiffOrg.id, isActive: true },
    { id: 'cr-celentia-entry', commissionType: 'ENTRY_FEE' as const, ratePct: 3.5, splitPlatformPct: 40, splitDistributorPct: 60, orgId: celentiaOrg.id, isActive: true },
  ];

  for (const cr of commissionRulesData) {
    await prisma.commissionRule.upsert({
      where: { id: cr.id },
      update: {},
      create: cr,
    });
  }

  // Legacy insurer rules
  const insurerRulesData = [
    { id: 'ir-cardiff-main', orgId: cardiffOrg.id, ruleName: 'Regles Cardiff principales', allowedPayoffTypes: ['AUTOCALL_PHOENIX', 'AUTOCALL_COUPON', 'CAPITAL_PROTECTED', 'CONDITIONAL_RATE'], allowedIssuers: [] as string[], maxSri: 6, minBarrierPct: 50, maxMaturityMonths: 144, maxEntryFeePct: 8, maxManagementFeePct: 2.5, minNominal: 1000, allowedCurrencies: ['EUR'], isActive: true, priority: 1 },
    { id: 'ir-celentia-main', orgId: celentiaOrg.id, ruleName: 'Regles Celentia principales', allowedPayoffTypes: ['AUTOCALL_PHOENIX', 'CAPITAL_PROTECTED'], allowedIssuers: [] as string[], maxSri: 5, minBarrierPct: 60, maxMaturityMonths: 120, maxEntryFeePct: 6, maxManagementFeePct: 2.0, minNominal: 5000, allowedCurrencies: ['EUR'], isActive: true, priority: 1 },
  ];

  for (const ir of insurerRulesData) {
    await prisma.insurerRule.upsert({
      where: { id: ir.id },
      update: {},
      create: ir,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('');
  console.log('Seed completed successfully.');
  console.log('');
  console.log('Sprint 1 production data:');
  console.log(`  Pilote CGPs:       ${piloteCgps.length}`);
  console.log(`  Insurers:          1 (Cardif Demo)`);
  console.log(`  Envelopes:         ${envelopeCount}`);
  console.log(`  Issuers:           1 (BNP Demo)`);
  console.log(`  BNP Demo products: ${bnpProducts.length}`);
  console.log(`  Clients:           ${seededClients.length}`);
  console.log(`  Contracts:         ${seededClients.length * 2}`);
  console.log(`  Positions:         ${positionCount}`);
  console.log('');
  console.log('Legacy demo data:');
  console.log(`  MT Products:       ${legacyCreatedProducts.length}`);
  console.log(`  Shelves:           ${createdShelves.length}`);
  console.log(`  Commitments:       ${commitmentData.length}`);
  console.log(`  Issuer Profiles:   ${issuerProfiles.length}`);
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:    admin@strickin.com / Strickin2025!');
  console.log('  CGP demo: cgp@demo.com / Strickin2025!');
  console.log('  Assureur: assureur@cardiff.fr / Strickin2025!');
  console.log('  Pilote 1: pilote1@cabinet-demo.fr / Pilote2026!');
  console.log('  Pilote 2: pilote2@cabinet-demo.fr / Pilote2026!');
  console.log('  Pilote 3: pilote3@cabinet-demo.fr / Pilote2026!');
}

main()
  .catch((e: unknown) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
