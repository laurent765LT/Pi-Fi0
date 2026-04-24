import { randomUUID } from 'node:crypto';

/**
 * Opaque identifier for a User aggregate.
 *
 * We wrap the raw string in a value object so that code cannot accidentally
 * mix a user id with, say, an order id or an organization id — the type
 * system forces an explicit conversion.
 *
 * The underlying value is whatever the persistence layer uses (Prisma's
 * `@default(cuid())` in our case, but we also accept UUIDs / other
 * opaque strings when reconstituting from an external source).
 */
export class UserId {
  private constructor(public readonly value: string) {}

  /** Generate a fresh id (UUID v4) for a new aggregate. */
  static generate(): UserId {
    return new UserId(randomUUID());
  }

  /** Wrap an existing persisted id. Validates it is a non-empty string. */
  static of(raw: string): UserId {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      throw new Error('UserId cannot be empty.');
    }
    return new UserId(raw);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
