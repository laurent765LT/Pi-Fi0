/**
 * Password value object.
 *
 * The domain layer never sees a plain-text password — it only ever manages
 * an already-hashed representation. The *hashing algorithm* (Argon2 in our
 * case) is an infrastructure concern; the domain only carries the opaque
 * hash string and knows how to compare it through a supplied verifier.
 *
 * To construct one from a raw plain-text password, use the application-
 * layer `PasswordHasher` port (see `application/ports/password-hasher.port.ts`).
 * Callers that load a user from persistence use `Password.fromHash()`.
 */
export class Password {
  private constructor(public readonly hash: string) {}

  /**
   * Reconstitute from a stored hash (e.g. a Prisma row). The hash is
   * assumed to have been produced by the application-layer hasher.
   */
  static fromHash(hash: string): Password {
    if (!hash || hash.length < 10) {
      throw new Error('Password hash looks invalid.');
    }
    return new Password(hash);
  }

  /**
   * Basic plain-text policy check. This is the canonical domain rule — the
   * DTO validator mirrors it but the ultimate source of truth lives here.
   */
  static isStrongEnough(plain: string): boolean {
    // at least 12 chars, 1 uppercase, 1 digit, 1 of !@#$%^&*
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/.test(
      plain,
    );
  }

  toString(): string {
    return this.hash;
  }
}
