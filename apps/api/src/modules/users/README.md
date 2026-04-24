# `users` module — Clean Architecture reference

This module is the template for how every new bounded context in the
Strick'in API should be organised. The goals are:

- **Testability** — business rules run with zero framework / database
  dependencies, so unit tests are fast and trustworthy.
- **Replaceable infrastructure** — Prisma, Argon2 or the event bus can be
  swapped without touching business code.
- **Explicit contracts** — every cross-layer dependency is a named
  interface + DI token, not an implicit import.

The other existing modules (`products`, `shelves`, `commitments`, ...)
will be migrated to this layout one by one. Until then, do not mix the
two styles inside the same module.

## Layout

```
users/
|-- users.module.ts           Nest DI wiring (tokens -> classes)
|-- README.md                 this file
|-- domain/                   pure TypeScript, framework-free
|   |-- entities/             User aggregate
|   |-- value-objects/        Email, UserId, Password
|   |-- events/               UserRegisteredEvent, UserProfileUpdatedEvent
|   |-- errors/               InvalidEmailError, UserNotFoundError, ...
|   |-- repositories/         IUserRepository interface + token
|-- application/              use cases orchestrating the domain
|   |-- commands/             writes (RegisterUser, UpdateUserProfile)
|   |-- queries/              reads  (GetCurrentUser, GetUserById)
|   |-- dtos/                 inbound validation & outbound response shapes
|   |-- mappers/              User -> UserResponseDto
|   |-- ports/                IPasswordHasher, IUserEventPublisher
|-- infrastructure/           technical adapters
|   |-- persistence/          PrismaUserRepository (implements IUserRepository)
|   |-- mappers/              Prisma row <-> domain aggregate
|   |-- security/             Argon2PasswordHasher (implements IPasswordHasher)
|   |-- events/               InMemoryUserEventPublisher (implements IUserEventPublisher)
|-- presentation/             HTTP entry points
    |-- users.controller.ts       GET/PATCH /api/v1/users/me, GET /api/v1/users/:id
    |-- users.admin.controller.ts POST /api/v1/admin/users (provision)
    |-- errors-to-http.ts         domain errors -> HTTP exceptions
```

## Dependency rule

```
presentation   -->   application   -->   domain
                     ^                    ^
                     |                    |
                     +-- infrastructure --+
```

- `domain/`       can import only from `domain/`.
- `application/`  can import from `domain/` (and `@nestjs/common` for DI
                  decorators — Nest is our process model, not a domain
                  concern, so this pragmatic exception stays).
- `infrastructure/` can import from `domain/` and `application/` because
                  it *implements* the ports declared there.
- `presentation/` can import from `application/` (and from the shared
                  `auth/` module for guards / decorators).

Code that breaks this rule is a bug — the whole point of the split is
that you can mock every inbound dependency of the handler in 5 lines.

## Adding a new use case (command or query)

1. Decide whether it is a write (**command**) or a read (**query**).
2. Create `application/commands/<name>/` or `application/queries/<name>/`
   with two files:
   - `<name>.command.ts` (or `<name>.query.ts`) — the input DTO.
   - `<name>.handler.ts` — an `@Injectable()` class with one method:
     `async execute(input): Promise<Output>`.
3. If the handler needs a new outbound capability (e.g. sending an email),
   add a port under `application/ports/<port>.port.ts` with a symbol
   injection token, then implement it under `infrastructure/<area>/`.
4. Register the handler + any new providers in `users.module.ts`.
5. Write a unit test alongside the handler (`*.handler.spec.ts`) mocking
   the ports with `vi.fn()` — see `register-user.handler.spec.ts` for a
   reference.
6. Expose the handler in a controller (existing or new) under
   `presentation/`, wrapped in `withHttpErrorMapping`.

## Adding a new entity

A single bounded context usually owns one or two aggregates. If you need
a second aggregate in the users context:

1. Add a new file under `domain/entities/<name>.entity.ts` with the same
   structure as `user.entity.ts` (private constructor, static factories,
   intention-revealing methods).
2. Declare value objects in `domain/value-objects/`.
3. Add a repository interface + token in `domain/repositories/`.
4. Create the Prisma adapter in `infrastructure/persistence/`.
5. Wire it in `users.module.ts`.

When the second aggregate has a distinct lifecycle and language (e.g.
`Tenant` vs `User`), it probably belongs in its OWN module — don't
over-stuff a single bounded context.

## Errors

Domain errors are plain classes under `domain/errors/`. The controller
wraps handler calls in `withHttpErrorMapping` (see
`presentation/errors-to-http.ts`) which translates each domain error
class to the appropriate HTTP exception. Never throw
`NotFoundException` from the domain / application layer — always throw
`UserNotFoundError` and let the presentation layer decide the status.

## Events

Domain events are accumulated inside the aggregate and drained by the
application handler with `user.pullDomainEvents()` after persistence.
The handler then calls `IUserEventPublisher.publish()`. The in-memory
adapter logs events — swap it for a real transport (Nest
`EventEmitter2`, BullMQ, Kafka) by replacing the provider in
`users.module.ts`.

## Tests

Run `pnpm --filter @strickin/api test` (or `npm test` from `apps/api/`).
Every handler has a spec alongside it. The spec never spins up Nest —
it constructs the handler directly with mocked ports.
