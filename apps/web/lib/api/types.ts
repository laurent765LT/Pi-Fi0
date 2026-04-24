// ─── Shared API types ────────────────────────────────────────────────────────
// Types used by the HTTP client + TanStack Query hooks.
// Prefer importing enums/constants from `@strickin/shared` when they already
// exist there. Only add locally-scoped wire types here.

import type {
  PayoffType,
  ProductStatus,
  UserRole,
  OnboardingStatus,
} from '@strickin/shared';

// ── KYC ──────────────────────────────────────────────────────────────────────

export type KycStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

// ── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
  orgId?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  kycStatus?: KycStatus;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserUpdate = Pick<
  User,
  'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'locale'
>;

export interface CGP {
  id: string;
  userId: string;
  companyName: string;
  siren: string;
  oriasNumber: string;
  rcpInsurer: string;
  rcpAmount: number;
  status: OnboardingStatus | string;
  createdAt?: string;
  updatedAt?: string;
}

export type CGPUpdate = Partial<
  Pick<CGP, 'companyName' | 'siren' | 'oriasNumber' | 'rcpInsurer' | 'rcpAmount'>
>;

export interface Product {
  id: string;
  isin: string;
  name: string;
  payoffType: PayoffType | string;
  underlyingName: string;
  couponPct: number | null;
  barrierCapPct: number;
  maturityDate: string;
  sri: number;
  status: ProductStatus | string;
  // Extra optional fields the catalog already surfaces in demo
  issuerName?: string;
  autocallBarrierPct?: number | null;
  maxGainPct?: number | null;
  entryFeePct?: number;
  description?: string;
  underlyingYahoo?: string;
  fillPct?: number;
  targetAmount?: number;
  shelfClosingDate?: string;
  createdAt?: string;
  interestedCount?: number;
  totalEngaged?: number;
  compatibleInsurers?: string[];
  isTokenized?: boolean;
  tokenNetwork?: string;
  observationDates?: string[];
}

export interface ProductListResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number };
}

export interface ProductFilters {
  search?: string;
  payoffType?: string;
  sriMin?: number;
  sriMax?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Insurer {
  id: string;
  name: string;
  logo?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface Issuer {
  id: string;
  name: string;
  logo?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

// ── Auth wire types ──────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}
