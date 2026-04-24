/**
 * Domain entities and value objects.
 *
 * Every file in this folder mirrors a Prisma model (or a cross-cutting domain
 * concept like ESG / TargetMarket) as a framework-free TypeScript contract.
 *
 * Import only from here (`@strickin/shared/domain`), not from individual files.
 */

export * from './user';
export * from './cgp';
export * from './insurer';
export * from './issuer';
export * from './product';
export * from './envelope';
export * from './client';
export * from './contract';
export * from './position';
export * from './rfq';
export * from './order';
export * from './signature';
export * from './esg';
export * from './target-market';
export * from './audit';
