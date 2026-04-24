/**
 * Raised when a query or command targets a user id / email that does not
 * resolve to any record. Presentation maps this to a 404.
 */
export class UserNotFoundError extends Error {
  readonly code = 'USERS_NOT_FOUND';

  constructor(identifier: string) {
    super(`User "${identifier}" could not be found.`);
    this.name = 'UserNotFoundError';
  }
}
