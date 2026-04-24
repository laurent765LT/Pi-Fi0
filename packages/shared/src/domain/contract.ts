/**
 * Contract domain types.
 *
 * Source of truth: apps/api/prisma/schema.prisma#Contract
 *
 * A Contract is a life-insurance (AV), capitalisation (CAPI), securities
 * account (CTO) or share savings plan (PEA) agreement between a Client and
 * an Insurer. Positions on structured Products are held inside a Contract.
 */

/** Supported contract wrappers. */
export const ContractType = {
  AV: 'AV',
  CAPI: 'CAPI',
  CTO: 'CTO',
  PEA: 'PEA',
} as const;
export type ContractType = (typeof ContractType)[keyof typeof ContractType];

/**
 * Contract aggregate.
 *
 * @property contractNumber - Unique reference assigned by the Insurer (legal).
 * @property currentValue - Latest mark-to-market value in EUR.
 */
export interface Contract {
  id: string;
  clientId: string;
  insurerId: string;
  contractNumber: string;
  type: ContractType;
  currentValue: number;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Short projection used in Client dashboards. */
export interface ContractSummary {
  id: string;
  contractNumber: string;
  type: ContractType;
  currentValue: number;
  openedAt: string;
  closedAt: string | null;
}

/** Input used when a CGP registers a new Contract for a Client. */
export type CreateContractInput = Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;
