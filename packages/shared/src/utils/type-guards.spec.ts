import { describe, expect, it } from 'vitest';
import { UserRole } from '../domain/user';
import {
  isCGP,
  isInsurer,
  isIssuer,
  isProduct,
  isUser,
  isUserPublic,
  isUserRole,
} from './type-guards';

const validUser = {
  id: 'u1',
  email: 'paul@strickin.io',
  firstName: 'Paul',
  lastName: 'Adrien',
  role: UserRole.CGP,
};

const validProduct = {
  id: 'p1',
  isin: 'FR0014010028',
  name: 'Autocall Demo',
  payoffType: 'AUTOCALL_PHOENIX',
};

describe('type-guards', () => {
  it('narrows objects that match the minimal shape', () => {
    expect(isUser(validUser)).toBe(true);
    expect(isUserPublic(validUser)).toBe(true);
    expect(isProduct(validProduct)).toBe(true);
    expect(isCGP({
      id: 'c1',
      userId: 'u1',
      companyName: 'ACME Patrimoine',
      siren: '552100554',
      oriasNumber: '12345678',
    })).toBe(true);
    expect(isInsurer({ id: 'i1', name: 'Cardif' })).toBe(true);
    expect(isIssuer({ id: 'j1', name: 'BNP' })).toBe(true);
  });

  it('rejects non-objects or wrong shapes', () => {
    expect(isUser(null)).toBe(false);
    expect(isUser(undefined)).toBe(false);
    expect(isUser('nope')).toBe(false);
    expect(isUser({})).toBe(false);
    expect(isProduct({ id: 'p1', isin: 'FR001' })).toBe(false);
  });

  it('narrows a role string to UserRole', () => {
    expect(isUserRole('CGP')).toBe(true);
    expect(isUserRole('PLATFORM_ADMIN')).toBe(true);
    expect(isUserRole('hacker')).toBe(false);
    expect(isUserRole(42)).toBe(false);
  });
});
