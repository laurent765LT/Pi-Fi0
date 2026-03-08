// ── Enums ────────────────────────────────────────────────────────────────────

export enum OrgType {
  INSURER = 'INSURER',
  BROKER = 'BROKER',
  ADMIN = 'ADMIN',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

export enum OnboardingStatus {
  PENDING = 'PENDING',
  DOCS_UPLOADED = 'DOCS_UPLOADED',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum PayoffType {
  AUTOCALL_PHOENIX = 'AUTOCALL_PHOENIX',
  AUTOCALL_COUPON = 'AUTOCALL_COUPON',
  CAPITAL_PROTECTED = 'CAPITAL_PROTECTED',
  CONDITIONAL_RATE = 'CONDITIONAL_RATE',
  BARRIER_NOTE = 'BARRIER_NOTE',
  CUSTOM = 'CUSTOM',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  MATURED = 'MATURED',
  RECALLED = 'RECALLED',
}

export enum ShelfStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum CommitmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  CANCELLED = 'CANCELLED',
}

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface ProductSummary {
  id: string;
  isin: string;
  name: string;
  payoffType: PayoffType;
  issuerName: string;
  underlyingYahoo: string;
  barrierCapPct: number;
  autocallBarrierPct: number | null;
  couponPct: number | null;
  maxGainPct: number;
  sri: number;
  maturityDate: string;
  entryFeePct: number;
  status: ProductStatus;
}

export interface ShelfSummary {
  id: string;
  productId: string;
  status: ShelfStatus;
  targetAmount: number;
  surbookingPct: number;
  closingDate: string;
  fillPct: number;
  confirmedAmount: number;
}

export interface CommitmentSummary {
  id: string;
  shelfId: string;
  userId: string;
  amount: number;
  status: CommitmentStatus;
  rank: number | null;
  createdAt: string;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  timestamp: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    orgId: string;
    orgType: OrgType;
  };
}

// ── Commitment amount scales ─────────────────────────────────────────────────

export const COMMITMENT_SCALES = [
  { label: '10k', value: 10_000 },
  { label: '25k', value: 25_000 },
  { label: '50k', value: 50_000 },
  { label: '100k', value: 100_000 },
  { label: '250k', value: 250_000 },
  { label: '500k', value: 500_000 },
  { label: '1M', value: 1_000_000 },
  { label: '5M', value: 5_000_000 },
  { label: '10M', value: 10_000_000 },
] as const;

// ── SRI Colors ───────────────────────────────────────────────────────────────

export const SRI_COLORS: Record<number, string> = {
  1: '#00B894',
  2: '#00B894',
  3: '#6FCF97',
  4: '#F2C94C',
  5: '#F2994A',
  6: '#EB5757',
  7: '#E8334A',
};

// ── PayoffType labels ────────────────────────────────────────────────────────

export const PAYOFF_LABELS: Record<PayoffType, string> = {
  [PayoffType.AUTOCALL_PHOENIX]: 'Autocall Phoenix',
  [PayoffType.AUTOCALL_COUPON]: 'Autocall Coupon',
  [PayoffType.CAPITAL_PROTECTED]: 'Capital Protégé',
  [PayoffType.CONDITIONAL_RATE]: 'Taux Conditionnel',
  [PayoffType.BARRIER_NOTE]: 'Barrier Note',
  [PayoffType.CUSTOM]: 'Sur Mesure',
};

export const PAYOFF_COLORS: Record<PayoffType, string> = {
  [PayoffType.AUTOCALL_PHOENIX]: '#3B1FA8',
  [PayoffType.AUTOCALL_COUPON]: '#5535C4',
  [PayoffType.CAPITAL_PROTECTED]: '#00B894',
  [PayoffType.CONDITIONAL_RATE]: '#1A3FCC',
  [PayoffType.BARRIER_NOTE]: '#D4A017',
  [PayoffType.CUSTOM]: '#7B6FA0',
};
