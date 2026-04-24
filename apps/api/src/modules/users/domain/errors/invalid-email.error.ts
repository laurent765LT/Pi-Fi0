/**
 * Domain error thrown when a raw string fails Email validation.
 *
 * Domain errors are framework-free — they are pure TypeScript classes and
 * the infrastructure / presentation layer is responsible for translating
 * them into HTTP status codes (see `presentation/errors-to-http.ts` or
 * the NestJS exception filter).
 */
export class InvalidEmailError extends Error {
  readonly code = 'USERS_INVALID_EMAIL';

  constructor(raw: string) {
    super(`"${raw}" is not a valid email address.`);
    this.name = 'InvalidEmailError';
  }
}
