import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterUserHandler } from './register-user.handler';
import type { RegisterUserCommand } from './register-user.command';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import type { IPasswordHasher } from '../../ports/password-hasher.port';
import type { IUserEventPublisher } from '../../ports/event-publisher.port';
import { EmailAlreadyTakenError } from '../../../domain/errors/email-already-taken.error';
import { InvalidEmailError } from '../../../domain/errors/invalid-email.error';
import { User } from '../../../domain/entities/user.entity';

/**
 * Unit tests for RegisterUserHandler.
 *
 * The handler is a perfect example of why Clean Architecture pays off:
 *   - no Nest DI, no Prisma, no argon2;
 *   - the three ports (repository, hasher, event publisher) are trivially
 *     replaced with `vi.fn()` — the test is ~25 lines of setup and tells
 *     the story of each branch.
 */

function makeRepo(): IUserRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByEmailWithPassword: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

function makeHasher(): IPasswordHasher {
  return {
    hash: vi.fn().mockResolvedValue('hashed-secret-0123456789'),
    verify: vi.fn().mockResolvedValue(true),
  };
}

function makePublisher(): IUserEventPublisher {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
  };
}

const BASE_CMD: RegisterUserCommand = {
  email: 'Jane@Example.FR',
  password: 'Sup3r!StrongPass1',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'CGP',
  orgId: 'org_1',
};

describe('RegisterUserHandler', () => {
  let repo: IUserRepository;
  let hasher: IPasswordHasher;
  let publisher: IUserEventPublisher;
  let handler: RegisterUserHandler;

  beforeEach(() => {
    repo = makeRepo();
    hasher = makeHasher();
    publisher = makePublisher();
    handler = new RegisterUserHandler(repo, hasher, publisher);
  });

  it('creates the user and returns the mapped DTO when email is new', async () => {
    const result = await handler.execute(BASE_CMD);

    expect(result.email).toBe('jane@example.fr'); // normalised through Email VO
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Doe');
    expect(result.fullName).toBe('Jane Doe');
    expect(result.role).toBe('CGP');
    expect(result.kycStatus).toBe('PENDING');
    // ID + timestamps are generated — just assert they exist.
    expect(result.id).toBeTruthy();
    expect(new Date(result.createdAt).toString()).not.toBe('Invalid Date');

    expect(hasher.hash).toHaveBeenCalledWith('Sup3r!StrongPass1');
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = (repo.save as unknown as { mock: { calls: [User][] } }).mock
      .calls[0]?.[0] as User;
    expect(saved).toBeInstanceOf(User);
    expect(saved.passwordHash).toBe('hashed-secret-0123456789');
  });

  it('publishes the accumulated domain events exactly once', async () => {
    await handler.execute(BASE_CMD);
    expect(publisher.publish).toHaveBeenCalledTimes(1);
    const args = (publisher.publish as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0];
    expect(args?.[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'user.registered' }),
      ]),
    );
  });

  it('does not leak the password hash in the response DTO', async () => {
    const result = await handler.execute(BASE_CMD);
    expect(result as unknown as Record<string, unknown>).not.toHaveProperty(
      'passwordHash',
    );
  });

  it('throws EmailAlreadyTakenError when the email is taken', async () => {
    repo.exists = vi.fn().mockResolvedValue(true);
    await expect(handler.execute(BASE_CMD)).rejects.toBeInstanceOf(
      EmailAlreadyTakenError,
    );
    expect(repo.save).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('propagates InvalidEmailError from the Email value object', async () => {
    await expect(
      handler.execute({ ...BASE_CMD, email: 'not-an-email' }),
    ).rejects.toBeInstanceOf(InvalidEmailError);
    expect(hasher.hash).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('defaults the role to CGP when not provided', async () => {
    const result = await handler.execute({
      ...BASE_CMD,
      role: undefined,
    });
    expect(result.role).toBe('CGP');
  });
});
