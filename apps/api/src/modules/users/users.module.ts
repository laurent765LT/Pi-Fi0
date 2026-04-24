import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
// PrismaService is already provided by the @Global() PrismaModule imported
// at the root (see app.module.ts), so we don't need to import it here.
import { RegisterUserHandler } from './application/commands/register-user/register-user.handler';
import { UpdateUserProfileHandler } from './application/commands/update-user-profile/update-user-profile.handler';
import { GetCurrentUserHandler } from './application/queries/get-current-user/get-current-user.handler';
import { GetUserByIdHandler } from './application/queries/get-user-by-id/get-user-by-id.handler';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import {
  PASSWORD_HASHER,
  USER_EVENT_PUBLISHER,
} from './application/ports';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { InMemoryUserEventPublisher } from './infrastructure/events/in-memory-event-publisher';
import { UsersController } from './presentation/users.controller';
import { UsersAdminController } from './presentation/users.admin.controller';

/**
 * Users bounded context — Clean Architecture reference module.
 *
 * Layout:
 *   - domain/         pure business rules (no framework deps)
 *   - application/    use cases (commands + queries + ports)
 *   - infrastructure/ technical adapters (Prisma, Argon2, event bus)
 *   - presentation/   HTTP controllers
 *
 * Read `README.md` in this directory before adding code. The dependency
 * rule (domain -> nobody, application -> domain, infra -> domain +
 * application, presentation -> application) is STRICTLY enforced — every
 * PR review checks it.
 *
 * DI tokens:
 *   - `USER_REPOSITORY`      -> PrismaUserRepository
 *   - `PASSWORD_HASHER`      -> Argon2PasswordHasher
 *   - `USER_EVENT_PUBLISHER` -> InMemoryUserEventPublisher (swap later)
 */
@Module({
  imports: [AuthModule],
  controllers: [UsersController, UsersAdminController],
  providers: [
    // Application: use cases
    RegisterUserHandler,
    UpdateUserProfileHandler,
    GetCurrentUserHandler,
    GetUserByIdHandler,

    // Infrastructure: port implementations
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: USER_EVENT_PUBLISHER, useClass: InMemoryUserEventPublisher },
  ],
  exports: [
    // Expose the repository + register handler so the auth module (or
    // future modules) can share the same user persistence without
    // re-implementing it.
    USER_REPOSITORY,
    RegisterUserHandler,
  ],
})
export class UsersModule {}
