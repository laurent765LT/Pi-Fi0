import type { Email } from '../value-objects/email.vo';

/**
 * Raised by the RegisterUser use case when the requested email already
 * exists in the repository. The presentation layer maps this to a 409.
 */
export class EmailAlreadyTakenError extends Error {
  readonly code = 'USERS_EMAIL_ALREADY_TAKEN';

  constructor(email: Email) {
    super(`An account with the email ${email.toString()} already exists.`);
    this.name = 'EmailAlreadyTakenError';
  }
}
