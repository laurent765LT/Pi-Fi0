/**
 * API contracts — DTOs for request/response payloads.
 *
 * These types are the single source of truth for wire-level shapes exchanged
 * between apps/web and apps/api. Prefer extending a DTO over duplicating it.
 */

export * from './pagination';
export * from './errors';
export * from './auth';
export * from './users';
export * from './products';
export * from './rfq';
export * from './ai';
