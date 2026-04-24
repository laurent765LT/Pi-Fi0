import { describe, expect, it } from 'vitest';
import { LoginSchema, RefreshSchema, RegisterSchema } from './auth.schema';

describe('RegisterSchema', () => {
  it('accepts a well-formed payload', () => {
    const parsed = RegisterSchema.parse({
      email: 'paul@strickin.io',
      password: 'Pilote2026!x',
      firstName: 'Paul',
      lastName: 'Adrien',
      role: 'CGP',
    });
    expect(parsed.email).toBe('paul@strickin.io');
  });

  it('rejects a weak password', () => {
    expect(() =>
      RegisterSchema.parse({
        email: 'paul@strickin.io',
        password: 'short',
        firstName: 'Paul',
        lastName: 'Adrien',
      }),
    ).toThrow();
  });

  it('rejects an invalid role', () => {
    expect(() =>
      RegisterSchema.parse({
        email: 'paul@strickin.io',
        password: 'Pilote2026!x',
        firstName: 'Paul',
        lastName: 'Adrien',
        role: 'HACKER',
      }),
    ).toThrow();
  });

  it('makes role optional', () => {
    const parsed = RegisterSchema.parse({
      email: 'paul@strickin.io',
      password: 'Pilote2026!x',
      firstName: 'Paul',
      lastName: 'Adrien',
    });
    expect(parsed.role).toBeUndefined();
  });
});

describe('LoginSchema', () => {
  it('accepts any non-empty password', () => {
    const parsed = LoginSchema.parse({
      email: 'paul@strickin.io',
      password: 'x',
    });
    expect(parsed.email).toBe('paul@strickin.io');
  });
});

describe('RefreshSchema', () => {
  it('allows an empty body (token comes from cookie)', () => {
    expect(RefreshSchema.parse({}).refreshToken).toBeUndefined();
  });

  it('accepts a token in the body', () => {
    expect(RefreshSchema.parse({ refreshToken: 'abc' }).refreshToken).toBe('abc');
  });
});
