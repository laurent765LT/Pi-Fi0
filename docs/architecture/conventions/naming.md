# Conventions — Naming

Les noms que l'on choisit sont des interfaces publiques. Un bon nom
economise des commentaires et de la navigation.

---

## 1. Fichiers

### 1.1 Kebab-case par defaut

```
login-form.tsx
auth.service.ts
rfq-screener-page.tsx
use-auth.ts
```

### 1.2 Exception : composants React

On peut choisir PascalCase **si** on est coherent sur l'ensemble du
projet. Dans Strick'in, on reste **kebab-case** partout (y compris les
composants) — l'import nomme PascalCase est explicite :

```ts
// fichier : login-form.tsx
export function LoginForm() { /* ... */ }

// import
import { LoginForm } from './login-form';
```

Raison : kebab-case marche quel que soit le file system (Linux case-sensitive,
macOS case-insensitive) et evite les renommages accidentels.

### 1.3 Suffixes conventionnels

| Suffixe | Utilite |
| --- | --- |
| `.service.ts` | Service NestJS injecte. |
| `.controller.ts` | Controller NestJS. |
| `.module.ts` | Module NestJS. |
| `.dto.ts` | DTO (class-validator). |
| `.entity.ts` | Entity domain. |
| `.vo.ts` | Value Object domain. |
| `.repository.ts` | Repository interface. |
| `.handler.ts` | Command / query handler. |
| `.command.ts` / `.query.ts` | Types des commands / queries. |
| `.event.ts` | Event domain. |
| `.guard.ts` | Guard NestJS. |
| `.strategy.ts` | Strategie Passport. |
| `.pipe.ts` | Pipe NestJS. |
| `.interceptor.ts` | Interceptor NestJS. |
| `.filter.ts` | Exception filter NestJS. |
| `.test.ts` / `.spec.ts` | Test unit / integration. |
| `.test.tsx` | Test React. |
| `.api.ts` | Layer infra frontend (fetch wrappers). |
| `.store.ts` | Store Zustand. |
| `.errors.ts` | Collection d'errors custom. |
| `.types.ts` | Types internes a un dossier. |

## 2. Dossiers

### 2.1 Toujours kebab-case

```
apps/web/features/auth/
apps/api/src/modules/users/
apps/api/src/modules/users/application/commands/register-user/
```

### 2.2 Noms au singulier pour les concepts, pluriel pour les collections

```
features/auth/              (concept)
features/auth/components/   (collection de composants)
features/auth/hooks/        (collection de hooks)

modules/users/              (collection d'entites — le BC gere "les users")
modules/users/domain/entities/    (collection d'entities)
```

Regle pragmatique : si le dossier contient plusieurs fichiers du meme type
conceptuel, le dossier est au pluriel.

## 3. Variables

### 3.1 camelCase

```ts
const currentUser = getUser();
const refreshToken = generateToken();
const isAuthenticated = !!token;
```

### 3.2 Verbes pour les fonctions, noms pour les variables

```ts
// fonction
function getUserById(id: string): Promise<User | null> { /* ... */ }

// variable
const user = await getUserById(id);
```

### 3.3 Abreviations deconseillees

Preferer la forme longue sauf acronymes metier (RFQ, ISIN, KID, SRI) :

```ts
// MAUVAIS
const usr = getUsr();
const auth = authenticateUser();

// BON
const user = getUser();
const authenticatedUser = authenticateUser();

// ACCEPTE (acronyme metier)
const rfq = getRfq();
const isin = product.isin;
```

## 4. Constants

### 4.1 SCREAMING_SNAKE_CASE pour les constants literales

```ts
const MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_PAGE_SIZE = 20;
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';
```

### 4.2 camelCase pour les constants computes / complexes

```ts
const logger = createLogger({ /* ... */ });
const apiClient = createApiClient({ /* ... */ });
```

Regle : si c'est une valeur de config stable au runtime et utilisable en
switch / comparaison = SCREAMING_SNAKE. Si c'est un "objet que tu utilises",
camelCase.

## 5. Types et interfaces

### 5.1 PascalCase

```ts
type AuthUser = { /* ... */ };
interface LoginCredentials { /* ... */ }
class Email { /* ... */ }
```

### 5.2 Pas de prefixe `I`

**Jamais** de `IUser`, `IUserRepository`. TypeScript distingue types et
values ; le `I` est un heritage Java / C# qui bruite.

```ts
// MAUVAIS
interface IUserRepository { /* ... */ }
class UserRepositoryImpl implements IUserRepository { /* ... */ }

// BON
interface UserRepository { /* ... */ }
class PrismaUserRepository implements UserRepository { /* ... */ }
```

## 6. Enums

### 6.1 PascalCase + valeurs SCREAMING

```ts
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  CGP = 'CGP',
}
```

### 6.2 Preferer `as const`

```ts
// Preferred
const USER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'CGP'] as const;
type UserRole = typeof USER_ROLES[number];

// Enum — ok pour les cas ou un run-time object aide (tree-shaking, Prisma)
export enum UserRole { /* ... */ }
```

Voir [`typescript.md`](./typescript.md) pour le rationnel.

## 7. Event handlers

### 7.1 `handle<Action>` cote composant

```tsx
function LoginForm() {
  const handleSubmit = (e: FormEvent) => { /* ... */ };
  const handleChange = (e: ChangeEvent) => { /* ... */ };

  return <form onSubmit={handleSubmit} />;
}
```

### 7.2 `on<Action>` cote prop

```tsx
interface ButtonProps {
  onClick: () => void;
  onFocus?: () => void;
}
```

Ce pattern reflete la convention React (`onClick` prop, `handleClick`
implementation).

## 8. Booleans

### 8.1 Prefixes

- `is` : etat actuel (`isAuthenticated`, `isLoading`, `isEmpty`).
- `has` : possession (`hasError`, `hasChildren`).
- `should` : intention / comportement conditionnel (`shouldAutoFocus`).
- `can` : permission / capacite (`canEdit`, `canDelete`).
- `will` : futur (`willRedirect`).

### 8.2 Formes negatives deconseillees

```ts
// MAUVAIS
const isNotLoading = false;
if (!isNotLoading) { /* double negation = cerveau explose */ }

// BON
const isLoading = true;
if (isLoading) { /* ... */ }
```

## 9. Noms DB vs noms code

Prisma gere le mapping :

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

- **Tables** : `snake_case` pluriel SQL (`users`, `refresh_tokens`).
- **Colonnes** : `snake_case` SQL (`created_at`, `password_hash`).
- **Model Prisma** : PascalCase singulier.
- **Champs Prisma** : camelCase.

Consequence : le dev manipule toujours du JS camelCase, la DB est SQL-friendly.

## 10. Commits et branches

Voir [`commits.md`](./commits.md) pour Conventional Commits.

Branches : `<type>/<short-description>` :
```
feat/user-registration
fix/login-race-condition
chore/upgrade-prisma-5.9
refactor/auth-clean-architecture
docs/architecture-hub
```

## 11. URLs API

Voir [`../06-api-contracts.md`](../06-api-contracts.md).

Resume :
- Paths en kebab-case : `/rfq-screener`.
- Collection plural : `/products`, `/orders`.
- Query params camelCase : `?sortBy=createdAt&sortOrder=desc`.

## 12. Exceptions acceptables

Certaines librairies imposent leurs conventions. Dans ce cas, on suit
la lib :

- Prisma : `@@map` et `@map` pour snake_case DB.
- NestJS : suffixes `.service.ts`, `.controller.ts` (officiel).
- TanStack Query : clefs en array (`['foo', 'bar']`).

## 13. Checklist review

- [ ] Fichier en kebab-case.
- [ ] Variable en camelCase, non abregee.
- [ ] Type/interface en PascalCase sans prefixe `I`.
- [ ] Boolean avec prefixe (`is*`, `has*`, `should*`, `can*`).
- [ ] Constant literal en SCREAMING_SNAKE si primitive / flag.
- [ ] Pas de mot vague (`data`, `info`, `manager`, `handler` nu).
