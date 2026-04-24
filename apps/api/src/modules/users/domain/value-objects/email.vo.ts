import { InvalidEmailError } from '../errors/invalid-email.error';

/**
 * Immutable email value object.
 *
 * Guarantees:
 *   - the wrapped string has already been validated against a basic RFC
 *     5322 shape (enough for our needs — we rely on mailbox verification
 *     at the infrastructure/email layer for real deliverability);
 *   - the stored value is lower-cased and trimmed so equality is
 *     case-insensitive (Gmail treats locals as case-insensitive in
 *     practice, and our DB unique index is case-sensitive).
 */
export class Email {
  private constructor(public readonly value: string) {}

  /**
   * Parses a raw user-supplied string. Throws `InvalidEmailError` when
   * the input fails validation.
   */
  static of(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();
    if (!Email.isValid(trimmed)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(trimmed);
  }

  /**
   * Pure predicate — does NOT throw. Useful in `exists()` guards.
   */
  static isValid(candidate: string): boolean {
    if (candidate.length < 3 || candidate.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
