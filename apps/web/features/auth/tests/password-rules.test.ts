import { describe, it, expect } from 'vitest';
import {
  checkPassword,
  getPasswordRegex,
  PASSWORD_RULES,
} from '../lib/password-rules';

describe('password-rules — checkPassword', () => {
  it('rejects an empty string with all violations', () => {
    const result = checkPassword('');
    expect(result.valid).toBe(false);
    expect(result.strength).toBe(0);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('rejects a password below minimum length', () => {
    const result = checkPassword('Ab1');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain(
      `${PASSWORD_RULES.minLength} caractères minimum`,
    );
  });

  it('rejects a password missing an uppercase letter', () => {
    const result = checkPassword('abcdef12');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('Doit contenir une majuscule');
  });

  it('rejects a password missing a digit', () => {
    const result = checkPassword('Abcdefgh');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('Doit contenir un chiffre');
  });

  it('scores a minimally-acceptable password as weak-to-medium', () => {
    const result = checkPassword('Abcdef12');
    expect(result.valid).toBe(true);
    // length + casing + digit = 3
    expect(result.strength).toBe(3);
  });

  it('scores a long password without specials as strong', () => {
    const result = checkPassword('StrongPass1234');
    expect(result.valid).toBe(true);
    expect(result.strength).toBe(4);
  });

  it('scores a password with special char as strongest', () => {
    const result = checkPassword('Abcdef12!');
    expect(result.valid).toBe(true);
    expect(result.strength).toBe(4);
  });

  it('getPasswordRegex accepts valid passwords and rejects invalid ones', () => {
    const rx = getPasswordRegex();
    expect(rx.test('Abcdef12')).toBe(true);
    expect(rx.test('abcdef12')).toBe(false); // no uppercase
    expect(rx.test('ABCDEF12')).toBe(false); // no lowercase
    expect(rx.test('Abcdefgh')).toBe(false); // no digit
    expect(rx.test('Ab1')).toBe(false); // too short
  });
});
