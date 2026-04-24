/**
 * Port through which application handlers hash and verify passwords.
 * The concrete implementation (Argon2) lives in infrastructure so that the
 * domain & application layers stay free of native crypto dependencies.
 */
export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('IPasswordHasher');
