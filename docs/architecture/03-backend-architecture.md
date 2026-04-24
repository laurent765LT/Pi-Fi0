# 03 — Architecture backend

**Audience** : devs backend, reviewers PR sur `apps/api/`.
**Prerequisites** : NestJS (DI, modules), Prisma, notions de DDD.

---

## 1. Philosophie : Clean Architecture + DDD

L'API Strick'in est organisee autour de **bounded contexts** (au sens DDD)
exposes sous forme de modules NestJS. Chaque module applique une
**Clean Architecture** a quatre layers :

```
  ┌────────────────────────┐
  │     presentation       │  ← controllers HTTP (NestJS)
  └───────────┬────────────┘
              │  depend sur
              ▼
  ┌────────────────────────┐
  │     application        │  ← use cases (commands / queries)
  └───────────┬────────────┘
              │  depend sur (interfaces)
              ▼
  ┌────────────────────────┐
  │        domain          │  ← entities, value objects, events, repos-interface
  └───────────▲────────────┘
              │  implemente
  ┌───────────┴────────────┐
  │    infrastructure      │  ← Prisma, Redis, Anthropic, Resend
  └────────────────────────┘
```

**Regle d'or (Dependency Rule)** : les fleches pointent **toujours vers le
domaine**. Le domaine ne sait rien de Prisma ni d'HTTP. L'infrastructure
implemente les interfaces du domaine. La presentation orchestre les use
cases.

La decision est actee dans [ADR 0006](./decisions/0006-clean-architecture-backend.md).

## 2. Carte du territoire

```
apps/api/src/
  main.ts                      # bootstrap NestJS
  app.module.ts                # module racine
  common/                      # cross-cutting (Prisma, Redis, guards, filters)
    prisma.service.ts
    redis.service.ts
    filters/                   # exception filters (RFC 7807)
    guards/                    # org-isolation, roles
    interceptors/              # logging, tracing
    logging/                   # Pino-like structured logger
    health.controller.ts
    sentry.init.ts
  auth/                        # module legacy (pre-Clean Arch)
  products/                    # module legacy
  modules/                     # modules Clean Arch (pilote : users)
    users/                     # pilote Sprint 1
      domain/
      application/
      infrastructure/
      presentation/
      users.module.ts
  ai/                          # LLM integration (Anthropic)
  pricing/                     # moteur de pricing RFQ
  commitments/                 # souscription et orders
  webhooks/                    # entrees externes (DocuSign, Stripe)
  notifications/               # email (Resend), push
  ...
```

La direction Sprint 1 → Sprint 3 : migrer chaque module de l'ancien format
(fichier `foo.service.ts` + `foo.controller.ts`) vers `modules/foo/` avec
les quatre layers. Le module `users` est le pilote.

## 3. Structure d'un module Clean Arch

```
apps/api/src/modules/<bc>/
  <bc>.module.ts                  # NestJS @Module — wire tout
  domain/
    entities/
      user.entity.ts              # classe avec comportements (pas anemique)
    value-objects/
      email.vo.ts                 # Email.create() valide
      password-hash.vo.ts
    events/
      user-registered.event.ts    # plain object serialisable
    errors/
      invalid-credentials.error.ts
    repositories/
      user.repository.ts          # INTERFACE (abstract class ou type)
  application/
    commands/                     # Write use cases
      register-user/
        register-user.command.ts  # input DTO typed
        register-user.handler.ts  # implementation
        register-user.spec.ts
      login-user/
    queries/                      # Read use cases
      get-user-by-id/
        get-user-by-id.query.ts
        get-user-by-id.handler.ts
    dtos/
      user.dto.ts                 # shape HTTP
    mappers/
      user.mapper.ts              # Entity ↔ DTO ↔ Prisma
  infrastructure/
    persistence/
      prisma-user.repository.ts   # implemente UserRepository
    external/
      resend-email.client.ts      # implemente EmailSender (interface domain)
    events/
      in-memory-event-bus.ts
  presentation/
    users.controller.ts           # public API
    users.admin.controller.ts     # admin-only endpoints
```

## 4. Dependency Rule — flux concret

### 4.1 Fleches autorisees

```
presentation  ──►  application
application   ──►  domain
infrastructure ──►  domain    (implemente les ports)
infrastructure ──►  application (uniquement pour adapters inverse, ex: event handlers)
```

### 4.2 Fleches interdites

```
domain        ──X──►  application
domain        ──X──►  infrastructure
domain        ──X──►  presentation
application   ──X──►  infrastructure   (utiliser interfaces du domain)
application   ──X──►  presentation
```

### 4.3 Exemple interdit

```ts
// ❌ Dans domain/entities/user.entity.ts
import { PrismaClient } from '@prisma/client'; // INTERDIT
```

### 4.4 Exemple autorise

```ts
// ✓ Dans application/commands/register-user/register-user.handler.ts
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { EmailSender } from '../../../domain/ports/email-sender';

export class RegisterUserHandler {
  constructor(
    private readonly users: UserRepository,
    private readonly email: EmailSender,
  ) {}
  // ...
}
```

## 5. Commands vs Queries (CQRS light)

On applique une separation **conceptuelle** (pas de lib externe type CQRS) :

### 5.1 Commands

- Mutation d'etat.
- Un command handler = une transaction DB.
- Retourne l'id de l'entite creee / modifiee (pas la lecture).
- Publie les events apres succes (outbox pattern Sprint 2).

```ts
// application/commands/register-user/register-user.handler.ts
export class RegisterUserHandler {
  async execute(cmd: RegisterUserCommand): Promise<{ id: string }> {
    return await this.prisma.$transaction(async (tx) => {
      const email = Email.create(cmd.email);
      const hash = await PasswordHash.fromPlain(cmd.password);
      const user = User.register({ email, hash, /* ... */ });
      await this.users.save(user, tx);
      await this.eventBus.publish(new UserRegisteredEvent(user.id));
      return { id: user.id };
    });
  }
}
```

### 5.2 Queries

- Lecture pure, pas de side effect.
- Peut denormaliser (join, projection), skip les entities du domaine.
- Peut utiliser Prisma directement si la projection n'est pas modelisable
  par les entities.

```ts
// application/queries/get-user-profile/get-user-profile.handler.ts
export class GetUserProfileHandler {
  async execute(q: GetUserProfileQuery): Promise<UserProfileDto> {
    const row = await this.prisma.user.findUnique({
      where: { id: q.userId },
      include: { org: true, kycStatus: true },
    });
    if (!row) throw new UserNotFoundError(q.userId);
    return UserProfileMapper.fromPersistence(row);
  }
}
```

## 6. Event-driven

### 6.1 Events domaine

Plain objects serialisables :

```ts
// domain/events/user-registered.event.ts
export class UserRegisteredEvent {
  static readonly TYPE = 'user.registered';
  readonly type = UserRegisteredEvent.TYPE;
  constructor(
    readonly userId: string,
    readonly occurredAt: Date = new Date(),
  ) {}
}
```

### 6.2 Publication

Les commands handlers publient via un `EventBus` (interface dans
`domain/ports/`, implementation dans `infrastructure/events/`). En Sprint 1,
l'impl est in-memory synchrone ; en Sprint 2, BullMQ + outbox table.

### 6.3 Handlers

Ils vivent dans `infrastructure/events/` et s'abonnent au bus. Ils peuvent
appeler d'autres services applicatifs (cross-module). C'est le seul endroit
ou un module peut en declencher un autre sans violer la dependency rule.

## 7. Transaction boundaries

### 7.1 Regle

**Un use case = une transaction.** Le command handler ouvre la transaction
via `prisma.$transaction(...)` et la passe au repository. Le repository
accepte optionnellement un `tx` pour composer dans une transaction externe.

```ts
// infrastructure/persistence/prisma-user.repository.ts
async save(user: User, tx?: Prisma.TransactionClient): Promise<void> {
  const client = tx ?? this.prisma;
  await client.user.upsert({
    where: { id: user.id },
    create: this.mapper.toPersistence(user),
    update: this.mapper.toPersistence(user),
  });
}
```

### 7.2 Transactions longues

Si un use case cross-module necessite une transaction qui sort du handler
(ex : RFQ cree une Envelope chez DocuSign), utiliser un **saga** ou le
pattern **outbox** plutot qu'une transaction distribuee. Sprint 2 ajoutera
la table `OutboxEvent` qui est publiee par un worker BullMQ.

## 8. Modules NestJS

### 8.1 Wiring DI

```ts
// modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { UsersController } from './presentation/users.controller';
import { RegisterUserHandler } from './application/commands/register-user/register-user.handler';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    RegisterUserHandler,
    {
      provide: 'UserRepository',
      useClass: PrismaUserRepository,
    },
  ],
  exports: ['UserRepository'],
})
export class UsersModule {}
```

### 8.2 Tokens d'injection

Pour les interfaces du domaine, on injecte par **string token** (NestJS n'a
pas d'interfaces a l'exec). Convention : le nom de l'interface.

```ts
constructor(@Inject('UserRepository') private readonly users: UserRepository) {}
```

Alternative : `abstract class` utilisee comme token et comme interface.

## 9. Exemple complet : module `users`

### 9.1 Diagramme

```
┌──────────────────────────────────────────────────────────────┐
│                    presentation                              │
│  POST /api/v1/users  →  UsersController.create()             │
│  GET  /api/v1/users/:id  →  UsersController.findById()       │
└───────────────────┬─────────────────────────────┬────────────┘
                    │                             │
                    ▼                             ▼
┌─────────────────────────────────┐  ┌─────────────────────────┐
│         application             │  │       application       │
│  RegisterUserHandler            │  │  GetUserByIdHandler     │
│  (command)                      │  │  (query)                │
└───┬──────────────┬──────────────┘  └──────┬──────────────────┘
    │              │                         │
    │              ▼                         ▼
    │    ┌───────────────────────┐   ┌───────────────────────┐
    │    │  domain (entities)    │   │  domain (entities)    │
    │    │  User.register()      │   │  (lecture directe par │
    │    │  Email.create()       │   │   le handler)         │
    │    │  PasswordHash.from()  │   │                       │
    │    └───────────┬───────────┘   └───────────────────────┘
    │                │
    │                │ UserRepository.save(user)
    │                ▼
    │    ┌────────────────────────────────┐
    └───▶│      infrastructure            │
         │  PrismaUserRepository          │
         │  ResendEmailClient             │
         │  InMemoryEventBus              │
         └────────────────┬───────────────┘
                          ▼
                   ┌──────────────┐
                   │  Postgres    │
                   └──────────────┘
```

### 9.2 Flow register

```
1. POST /api/v1/users { email, password }
2. UsersController.create() → appelle RegisterUserHandler.execute(cmd)
3. Handler :
   a. Email.create(cmd.email)  [throws InvalidEmailError]
   b. await Password.assertPolicy(cmd.password)
   c. PasswordHash.fromPlain(cmd.password) via argon2
   d. User.register({ email, hash, ... })
   e. prisma.$transaction(async tx => {
        await users.save(user, tx);
        await bus.publish(new UserRegisteredEvent(user.id));
      })
4. Event handler (infra/events) → ResendEmailClient.sendWelcome(user.email)
5. Reponse 201 { id, email }
```

## 10. Conventions de nommage

| Concept | Nom | Exemple |
| --- | --- | --- |
| Entity | PascalCase sans suffixe | `User`, `Product`, `Order` |
| Value Object | PascalCase, souvent suffixe metier | `Email`, `Isin`, `Money` |
| Command | VerbeNomCommand | `RegisterUserCommand` |
| Command handler | VerbeNomHandler | `RegisterUserHandler` |
| Query | VerbNomQuery | `GetUserByIdQuery` |
| Repository interface | NomRepository | `UserRepository` |
| Repository impl | PrismaNomRepository | `PrismaUserRepository` |
| Event | SujetActionEvent | `UserRegisteredEvent` |
| Error | SujetErreurError | `InvalidCredentialsError` |
| DTO | NomDto | `UserDto` |
| Mapper | NomMapper | `UserMapper` |

## 11. Erreurs et exceptions

### 11.1 Erreurs domaine

Extension de `Error` :

```ts
// domain/errors/invalid-credentials.error.ts
export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() {
    super('Invalid email or password');
  }
}
```

### 11.2 Mapping vers HTTP

Un filtre NestJS global (`common/filters/domain-exception.filter.ts`)
convertit chaque erreur domaine en reponse RFC 7807 :

```json
{
  "type": "https://strickin.dev/errors/invalid-credentials",
  "title": "Invalid email or password",
  "status": 401,
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2026-04-24T10:00:00Z",
  "requestId": "abc-123"
}
```

Voir [`06-api-contracts.md`](./06-api-contracts.md).

## 12. Anti-patterns

### 12.1 Controller obese

Anti-pattern :
```ts
@Post()
async create(@Body() dto: CreateUserDto) {
  const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw new ConflictException();
  const hash = await argon2.hash(dto.password);
  const user = await this.prisma.user.create({ data: { /* ... */ } });
  await this.resend.emails.send({ /* ... */ });
  return user;
}
```

Le controller fait du domain, de l'infra, et du metier. Ingerable a tester.

### 12.2 Entite anemique

Anti-pattern : une classe `User` qui n'est qu'un sac de getters/setters
sans aucun comportement. Le metier (`register()`, `changePassword()`,
`deactivate()`) vit dans un service externe.

Bon : les invariants vivent dans l'entite. Impossible d'avoir un `User`
dans un etat invalide.

### 12.3 Repository qui retourne du Prisma type

Anti-pattern :
```ts
interface UserRepository {
  findById(id: string): Promise<Prisma.User | null>; // leak Prisma dans le domain
}
```

Bon :
```ts
interface UserRepository {
  findById(id: string): Promise<User | null>; // entity domain
}
```

## 13. Migration progressive

Plan Sprint 1 → Sprint 3 :

| Module | Sprint 1 | Sprint 2 | Sprint 3 |
| --- | --- | --- | --- |
| `users` | **Clean Arch (pilote)** | — | — |
| `auth` | Legacy | Clean Arch | — |
| `products` | Legacy | Clean Arch | — |
| `rfq` | Pricing legacy | Clean Arch (nouveau) | — |
| `commitments` | Legacy | — | Clean Arch |
| `webhooks` | Legacy | — | Clean Arch |

Pour chaque migration, on crree un nouveau `modules/<bc>/`, on copie la
logique, on ajoute des tests, on supprime l'ancien une fois la parite
validee.

## 14. Fichiers de reference

- Pilote Clean Arch : `apps/api/src/modules/users/`
- Legacy : `apps/api/src/auth/auth.service.ts`, `apps/api/src/products/`
- Prisma module : `apps/api/src/common/prisma.module.ts`
- Exception filter : `apps/api/src/common/filters/`
- Guards : `apps/api/src/common/guards/`
