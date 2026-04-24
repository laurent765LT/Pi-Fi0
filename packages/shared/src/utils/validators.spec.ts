import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidIsin,
  isValidLei,
  isValidOrias,
  isValidPassword,
  isValidSiren,
  isValidSiret,
} from './validators';

describe('isValidIsin', () => {
  it('accepts well-known ISINs with valid checksums', () => {
    expect(isValidIsin('US0378331005')).toBe(true); // Apple Inc.
    expect(isValidIsin('FR0000131104')).toBe(true); // BNP Paribas
    expect(isValidIsin('DE0005140008')).toBe(true); // Deutsche Bank
  });

  it('rejects malformed or bad-checksum strings', () => {
    expect(isValidIsin('US0378331000')).toBe(false); // wrong check digit
    expect(isValidIsin('FR001401002')).toBe(false);  // too short
    expect(isValidIsin('FR0014010028X')).toBe(false); // too long
    expect(isValidIsin('')).toBe(false);
    expect(isValidIsin(null as unknown as string)).toBe(false);
  });

  it('accepts lowercase input', () => {
    expect(isValidIsin('us0378331005')).toBe(true);
  });
});

describe('isValidOrias', () => {
  it('requires exactly 8 digits', () => {
    expect(isValidOrias('12345678')).toBe(true);
    expect(isValidOrias('1234567')).toBe(false);
    expect(isValidOrias('123456789')).toBe(false);
    expect(isValidOrias('1234abcd')).toBe(false);
  });
});

describe('isValidSiren / isValidSiret', () => {
  it('validates the Luhn checksum', () => {
    // 552100554 is INSEE's famous "La Poste" example.
    expect(isValidSiren('552100554')).toBe(true);
    expect(isValidSiren('552100555')).toBe(false);
  });

  it('accepts spaces in input', () => {
    expect(isValidSiren('552 100 554')).toBe(true);
  });

  it('validates SIRET via Luhn on 14 digits', () => {
    expect(isValidSiret('55210055400005')).toBe(true);
    expect(isValidSiret('55210055400017')).toBe(false);
    expect(isValidSiret('552100554')).toBe(false); // SIREN length
  });
});

describe('isValidLei', () => {
  it('accepts a valid LEI (checked via mod-97-10)', () => {
    // Apple Inc. LEI
    expect(isValidLei('HWUPKR0MPOU8FGXBT394')).toBe(true);
  });

  it('rejects bad length / charset', () => {
    expect(isValidLei('short')).toBe(false);
    expect(isValidLei('HWUPKR0MPOU8FGXBT395')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts typical addresses', () => {
    expect(isValidEmail('paul@strickin.io')).toBe(true);
    expect(isValidEmail('jane.doe+tag@example.co.uk')).toBe(true);
  });

  it('rejects invalid addresses', () => {
    expect(isValidEmail('no-at-symbol.example.com')).toBe(false);
    expect(isValidEmail('double..dot@example.com')).toBe(false);
    expect(isValidEmail('nodomain@')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('requires 12+ chars with upper, digit, special', () => {
    expect(isValidPassword('Pilote2026!x')).toBe(true);
    expect(isValidPassword('short1A!')).toBe(false); // too short
    expect(isValidPassword('nouppercase1!')).toBe(false);
    expect(isValidPassword('NOLOWERCASE1!')).toBe(true); // policy doesn't require lower
    expect(isValidPassword('NoSpecials1234')).toBe(false);
  });
});
