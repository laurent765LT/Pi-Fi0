import type { User } from '../entities/user.entity';
import type { Email } from '../value-objects/email.vo';
import type { UserId } from '../value-objects/user-id.vo';

/**
 * Persistence port for the `User` aggregate.
 *
 * The domain layer declares this interface so that application handlers
 * can depend on an abstract contract. The concrete Prisma implementation
 * lives under `infrastructure/persistence/` and is wired in `users.module.ts`
 * via the `USER_REPOSITORY` injection token.
 *
 * Every method returns rich `User` aggregates or null — never Prisma rows.
 */
export interface IUserRepository {
  /** Locate by id. Returns null when the record does not exist. */
  findById(id: UserId): Promise<User | null>;

  /**
   * Locate by email (already normalised). Returns null when no record
   * matches. The returned aggregate is WITHOUT the password hash.
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Same as `findByEmail` but also loads the password hash. Reserved for
   * authentication flows — callers MUST drop the hash before returning
   * the aggregate to the presentation layer.
   */
  findByEmailWithPassword(email: Email): Promise<User | null>;

  /**
   * Persist a new or existing aggregate. Implementations use upsert
   * semantics keyed by `User.id.value`.
   */
  save(user: User): Promise<void>;

  /** Cheap existence check (indexed count). */
  exists(email: Email): Promise<boolean>;
}

/**
 * Injection token used by the Nest DI container. Application handlers
 * declare `@Inject(USER_REPOSITORY)` and receive the Prisma implementation
 * registered in `users.module.ts`.
 */
export const USER_REPOSITORY = Symbol('IUserRepository');
