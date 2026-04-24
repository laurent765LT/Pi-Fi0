/**
 * Narrowing type guards for domain entities.
 *
 * These live outside `domain/*` because they carry structural runtime checks,
 * whereas domain files are pure type declarations.
 */

import type { Cgp } from '../domain/cgp';
import type { Insurer } from '../domain/insurer';
import type { Issuer } from '../domain/issuer';
import type { Product } from '../domain/product';
import type { User, UserPublic } from '../domain/user';
import { UserRole } from '../domain/user';

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const hasString = (v: Record<string, unknown>, k: string): boolean =>
  typeof v[k] === 'string';

export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  return (
    hasString(value, 'id') &&
    hasString(value, 'email') &&
    hasString(value, 'firstName') &&
    hasString(value, 'lastName') &&
    hasString(value, 'role')
  );
}

export function isUserPublic(value: unknown): value is UserPublic {
  if (!isObject(value)) return false;
  return (
    hasString(value, 'id') &&
    hasString(value, 'email') &&
    hasString(value, 'firstName') &&
    hasString(value, 'lastName')
  );
}

export function isCGP(value: unknown): value is Cgp {
  if (!isObject(value)) return false;
  return (
    hasString(value, 'id') &&
    hasString(value, 'userId') &&
    hasString(value, 'companyName') &&
    hasString(value, 'siren') &&
    hasString(value, 'oriasNumber')
  );
}

export function isInsurer(value: unknown): value is Insurer {
  if (!isObject(value)) return false;
  return hasString(value, 'id') && hasString(value, 'name');
}

export function isIssuer(value: unknown): value is Issuer {
  if (!isObject(value)) return false;
  return hasString(value, 'id') && hasString(value, 'name');
}

export function isProduct(value: unknown): value is Product {
  if (!isObject(value)) return false;
  return (
    hasString(value, 'id') &&
    hasString(value, 'isin') &&
    hasString(value, 'name') &&
    hasString(value, 'payoffType')
  );
}

/** Narrow a role string to the {@link UserRole} enum. */
export function isUserRole(value: unknown): value is UserRole {
  if (typeof value !== 'string') return false;
  return Object.values(UserRole).includes(value as UserRole);
}
