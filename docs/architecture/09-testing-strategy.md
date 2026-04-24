# 09 — Strategie de tests

**Audience** : tous les contributeurs.
**Prerequisites** : Vitest, notions de tests E2E.

---

## 1. Pyramide

```
             ┌────────────┐
             │    E2E     │   10 %   (Playwright)
             │ Playwright │
             └────────────┘
           ┌────────────────┐
           │  Integration   │ 20 %   (Supertest + Prisma test DB)
           │   Supertest    │
           └────────────────┘
         ┌────────────────────┐
         │       Unit         │ 70 % (Vitest)
         │      Vitest        │
         └────────────────────┘
```

**Principes :**
- Beaucoup de **unit** rapides (ms par test).
- Un nombre raisonnable d'**integration** qui traversent plusieurs layers.
- Peu d'**E2E** mais qui couvrent les parcours critiques utilisateur.

Pourquoi cette forme : les tests unit tournent en secondes sur chaque PR
et restent la premiere ligne de defense. Les E2E sont lents et fragiles,
on en fait juste assez pour verifier les flows utilisateur reels.

## 2. Unit tests — Vitest

### 2.1 Cible

- **Domain layer backend** (entities, value objects, errors) : 100 %.
- **Use cases backend** (commands, queries) : 100 % sur les branches
  interessantes.
- **Helpers front** (`features/*/lib/`) : 100 %.
- **Composants purs** (stateless, sans fetch) : happy path + edge cases.

### 2.2 Outils

- `vitest` sur web et api.
- `@testing-library/react` pour composants.
- `vi.mock()` pour les dependances (TanStack, fetch).

### 2.3 Exemple backend — value object

```ts
// apps/api/src/modules/users/domain/value-objects/email.vo.test.ts
import { describe, it, expect } from 'vitest';
import { Email } from './email.vo';
import { InvalidEmailError } from '../errors/invalid-email.error';

describe('Email', () => {
  it('accepts a valid email', () => {
    const email = Email.create('jean.dupont@example.com');
    expect(email.value).toBe('jean.dupont@example.com');
  });

  it('lowercases the local part', () => {
    const email = Email.create('Jean.Dupont@Example.COM');
    expect(email.value).toBe('jean.dupont@example.com');
  });

  it('rejects a malformed email', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailError);
  });

  it('rejects an empty string', () => {
    expect(() => Email.create('')).toThrow(InvalidEmailError);
  });
});
```

### 2.4 Exemple backend — command handler

```ts
// apps/api/src/modules/users/application/commands/register-user/register-user.handler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { RegisterUserHandler } from './register-user.handler';

const makeDeps = () => ({
  users: {
    findByEmail: vi.fn().mockResolvedValue(null),
    save: vi.fn(),
  },
  hasher: { hash: vi.fn().mockResolvedValue('hashed') },
  events: { publish: vi.fn() },
});

describe('RegisterUserHandler', () => {
  it('creates a user and publishes UserRegistered', async () => {
    const deps = makeDeps();
    const handler = new RegisterUserHandler(deps.users, deps.hasher, deps.events);
    const result = await handler.execute({
      email: 'new@example.com',
      password: 'verysecure1234',
      firstName: 'Jean',
      lastName: 'Dupont',
    });

    expect(deps.users.save).toHaveBeenCalledOnce();
    expect(deps.events.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'user.registered' }),
    );
    expect(result.id).toMatch(/^[a-z0-9]+$/);
  });

  it('throws ConflictError when email exists', async () => {
    const deps = makeDeps();
    deps.users.findByEmail.mockResolvedValue({ id: 'existing' });
    const handler = new RegisterUserHandler(deps.users, deps.hasher, deps.events);

    await expect(handler.execute({
      email: 'existing@example.com',
      password: 'verysecure1234',
      firstName: 'x',
      lastName: 'y',
    })).rejects.toThrowError(/already registered/i);
  });
});
```

### 2.5 Exemple frontend — hook

```ts
// apps/web/features/auth/hooks/use-login.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogin } from './use-login';
import * as authApi from '../api/auth.api';

vi.mock('../api/auth.api');

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe('useLogin', () => {
  it('calls authApi.login and stores token on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'tok',
      refreshToken: 'rtok',
      user: { id: 'u1', email: 'u@example.com' } as any,
    });
    const { result } = renderHook(() => useLogin(), { wrapper });
    result.current.mutate({ email: 'u@example.com', password: 'x' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

### 2.6 Coverage target

- **Modules critiques** (auth, pricing, commitments, webhooks) : **80 %**.
- **Reste** : 60 %.
- Measure via `vitest --coverage`.

On ne force pas le coverage a 100 % artificiellement — quelques branches
defensives (fallback errors) peuvent rester non-testees si peu de valeur.

## 3. Integration tests — Supertest

### 3.1 Cible

- Flows HTTP end-to-end cote api : POST /auth/login qui passe par le
  middleware + guard + service + Prisma contre une DB test.
- Les webhooks (receive → validation HMAC → write DB).

### 3.2 Setup

- DB test : un Postgres local dedie (docker-compose), reset entre chaque
  suite.
- Prisma : utilise `DATABASE_URL` qui pointe vers la DB test.
- Pre-suite : `prisma migrate deploy` + seed minimal.

### 3.3 Exemple

```ts
// apps/api/test/auth.integration.test.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    prisma = mod.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  it('registers then logs in', async () => {
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'int@example.com',
        password: 'verysecure1234',
        firstName: 'Jean',
        lastName: 'Dupont',
      })
      .expect(201);

    expect(reg.body.accessToken).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'int@example.com', password: 'verysecure1234' })
      .expect(200);

    expect(login.body.user.email).toBe('int@example.com');
  });
});
```

### 3.4 Externes mockes

Pour les tests integration, on mocke les externes **network** mais pas la
DB :
- Anthropic → mock via intercepteur HTTP.
- Resend → mock le transport.
- Supabase storage → mock si utilise.

## 4. E2E — Playwright

### 4.1 Cible

5 parcours critiques :

1. **Login → dashboard** (CGP).
2. **Registration → email confirme → dashboard**.
3. **Cree une RFQ → recoit des quotes → accepte**.
4. **Browse produits → ajoute aux favoris → vue detail produit**.
5. **Logout → redirect login**.

Sprint 2 ajoute : onboarding KYC end-to-end, parcours assureur.

### 4.2 Config

`apps/web/playwright.config.ts` execute sur 3 browsers :
- Chromium
- Firefox
- WebKit (Safari)

Par defaut sur preview Vercel de la PR. En local : `npm run test:e2e`
apres `npm run dev`.

### 4.3 Exemple

```ts
// apps/web/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('CGP logs in and sees dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('cgp@demo.strickin.fr');
  await page.getByLabel(/mot de passe/i).fill('demo1234');
  await page.getByRole('button', { name: /se connecter/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/tableau de bord/i);
});
```

### 4.4 Donnees de test

- Demo mode (`NEXT_PUBLIC_USE_REAL_API=false`) pour E2E simple.
- Backend de staging connecte a une DB de test pour E2E full.

### 4.5 Flakiness

Un test flaky est un test casse. Quand un test Playwright flake :
1. Reproduire localement avec `--repeat-each=10`.
2. Ajouter un `await expect(...).toBeVisible()` avant l'action (pas de
   `setTimeout`).
3. Si non-reproductible → quarantaine (`test.skip`) + ticket.

## 5. Tests et CI

Le pipeline GitHub Actions (Sprint 2) execute :

```
1. npm ci
2. npm run lint --workspaces
3. npm run typecheck (tsc --noEmit)
4. npm run test  (Vitest unit + integration)
5. npm run build --workspaces
6. npm run test:e2e (only on main branch after deploy)
```

Un test qui echoue bloque le merge.

Pour les PRs, seules les etapes 1-5 tournent (pas d'E2E sur chaque PR
sauf si label `e2e`).

## 6. Conventions

### 6.1 Nommage

- `foo.test.ts` pour les unit tests.
- `foo.integration.test.ts` pour les integration.
- `foo.spec.ts` pour les E2E (convention Playwright).

### 6.2 AAA pattern

```ts
it('does X when Y', () => {
  // Arrange
  const input = { /* ... */ };
  // Act
  const result = sut.execute(input);
  // Assert
  expect(result).toBe(/* ... */);
});
```

### 6.3 Un test = un assert (idealement)

Plusieurs `expect()` acceptables si tous dans le meme AAA. Si le test a
plusieurs paths → plusieurs tests.

### 6.4 Pas de logique dans les tests

- Pas de `if`/`switch` dans un test.
- Pas de loop `for` qui execute N assertions → utiliser `it.each()`.

## 7. Anti-patterns

### 7.1 Mock du repository dans les integration tests

Si on mocke Prisma dans un test integration, c'est un unit test deguise.
Integration = vraie DB.

### 7.2 Snapshot tests sur du gros JSON

Brittle. Preferer assertions ciblees :
```ts
expect(response.body.user.email).toBe(...)
// plutot que
expect(response.body).toMatchSnapshot()
```

### 7.3 Test qui depend de l'ordre

Chaque test doit pouvoir tourner seul. Utiliser `beforeEach` pour reset.

### 7.4 `waitForTimeout(1000)`

Jamais de sleep fixe dans un test. Toujours `waitFor(() => condition)`.

## 8. Performance

- Unit tests : < 10s total par workspace.
- Integration tests : < 2 min total.
- E2E : < 5 min total (3 browsers x 5 scenarios en parallele).

## 9. Fichiers de reference

- Config Vitest API : `apps/api/vitest.config.ts`
- Config Vitest web : `apps/web/vitest.config.ts`
- Config Playwright : `apps/web/playwright.config.ts`
- Exemples tests : `apps/api/src/auth/auth.service.spec.ts`,
  `apps/web/features/auth/tests/`
