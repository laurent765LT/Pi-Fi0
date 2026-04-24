import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { EmailAlreadyTakenError } from '../../../domain/errors/email-already-taken.error';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { Email } from '../../../domain/value-objects/email.vo';
import {
  PASSWORD_HASHER,
  type IPasswordHasher,
} from '../../ports/password-hasher.port';
import {
  USER_EVENT_PUBLISHER,
  type IUserEventPublisher,
} from '../../ports/event-publisher.port';
import { UserMapper } from '../../mappers/user.mapper';
import type { UserResponseDto } from '../../dtos/user-response.dto';
import type { RegisterUserCommand } from './register-user.command';

/**
 * RegisterUser use case.
 *
 * Flow:
 *   1. parse & validate the email through the `Email` VO,
 *   2. refuse if the email is already taken (409 upstream),
 *   3. hash the password (infrastructure port),
 *   4. build the aggregate via `User.create()` — this also raises
 *      `UserRegisteredEvent`,
 *   5. persist + dispatch events.
 *
 * Returns the public DTO; no password hash leaks out.
 */
@Injectable()
export class RegisterUserHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(USER_EVENT_PUBLISHER)
    private readonly events: IUserEventPublisher,
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<UserResponseDto> {
    const email = Email.of(cmd.email);

    if (await this.users.exists(email)) {
      throw new EmailAlreadyTakenError(email);
    }

    const passwordHash = await this.hasher.hash(cmd.password);

    const user = User.create({
      email,
      firstName: cmd.firstName.trim(),
      lastName: cmd.lastName.trim(),
      role: cmd.role ?? 'CGP',
      orgId: cmd.orgId,
      kycStatus: 'PENDING',
      passwordHash,
    });

    await this.users.save(user);
    await this.events.publish(user.pullDomainEvents());

    return UserMapper.toResponseDto(user);
  }
}
