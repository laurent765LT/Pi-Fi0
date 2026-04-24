# Conventions — TypeScript

Le typage est notre premiere ligne de defense. On impose strict, on
interdit `any`, on force l'explicite.

---

## 1. Flags stricts obligatoires

`tsconfig.base.json` (racine monorepo) :

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

Chaque workspace etend ce fichier via `"extends": "../../tsconfig.base.json"`.

### 1.1 Rationnel par flag

| Flag | Raison |
| --- | --- |
| `strict: true` | Active tous les strict checks de base. |
| `noImplicitAny` | Force a typer explicitement tout parametre. |
| `noUncheckedIndexedAccess` | `arr[0]` devient `T \| undefined`. Evite les `Cannot read undefined`. |
| `noImplicitOverride` | Force `override` keyword sur methode heritee. |
| `exactOptionalPropertyTypes` | `{ foo?: string }` interdit `foo: undefined` explicite. |

## 2. `any` interdit

### 2.1 Toujours `unknown` + narrow

```ts
// MAUVAIS
function process(input: any) {
  return input.foo.bar;
}

// BON
function process(input: unknown) {
  if (isValidInput(input)) {
    return input.foo.bar;
  }
  throw new Error('Invalid input');
}

function isValidInput(input: unknown): input is { foo: { bar: string } } {
  return (
    typeof input === 'object' &&
    input !== null &&
    'foo' in input &&
    typeof (input as { foo: unknown }).foo === 'object'
  );
}
```

### 2.2 Zod pour les inputs externes

Au lieu de type guards manuels, on utilise Zod pour les inputs non-trusted
(JSON requetes, localStorage, responses API non-types) :

```ts
import { z } from 'zod';

const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

type RegisterInput = z.infer<typeof registerInputSchema>;

function register(raw: unknown): void {
  const input = registerInputSchema.parse(raw); // throws si invalide
  // ... input est typed RegisterInput
}
```

### 2.3 Exception tolere : tests

Dans les tests, on peut utiliser `as any` pour forcer un narrow sans
ecrire un type guard complet :

```ts
// acceptable en test
const mockUser = { id: 'x', email: 'y' } as any;
```

**Jamais en prod.**

## 3. `@ts-ignore` interdit

Toujours `@ts-expect-error` avec un commentaire expliquant :

```ts
// MAUVAIS
// @ts-ignore
const x = libraryWithBadTypes.foo();

// BON
// @ts-expect-error — la lib expose `foo` mais oublie la signature ; issue
// https://github.com/lib/issues/123
const x = libraryWithBadTypes.foo();
```

Pourquoi :
- `@ts-expect-error` casse le build si l'erreur disparait (lib patchee,
  code refactore). `@ts-ignore` ne dit rien.
- Force a expliquer le choix en commentaire.

## 4. `type` vs `interface`

### 4.1 Regle

- **`type`** : unions, intersections, mapped types, conditional types.
- **`interface`** : objets extensibles, class contracts.

```ts
// type — union discriminee
type Result =
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

// interface — objet extensible, pattern OO
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

class PrismaUserRepository implements UserRepository { /* ... */ }
```

### 4.2 En pratique

Les deux marchent dans 95 % des cas. On choisit selon ce qui exprime
le mieux l'intention. La seule difference observable :
- `interface` peut etre declare plusieurs fois (merge automatique).
- `type` ne peut pas.

Pour un repo interne controlle, l'absence de declaration merging n'est pas
un avantage — donc on prefere souvent `type` par defaut.

## 5. `as const` vs `enum`

### 5.1 Preferer `as const`

```ts
// Preferred
export const USER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'CGP'] as const;
export type UserRole = typeof USER_ROLES[number];
```

Raisons :
- Tree-shakeable (l'array est inline).
- Pas de run-time surprise (les enums TS generent un object runtime
  surprising).
- Serialisable en JSON sans conversion.
- Plus facile a manipuler (Array.map, filter, includes).

### 5.2 Exception : Prisma

Prisma genere des enums TypeScript a partir du schema. On les utilise
tels quels :

```ts
import { UserRole } from '@prisma/client';
```

### 5.3 Exception : compatibilite cross-workspace

Dans `@strickin/shared`, on publie des enums TS classiques pour garantir
la valeur **string** est stable :

```ts
export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}
```

## 6. `readonly` par defaut

### 6.1 Parametres

```ts
// BON
function sumAmounts(amounts: ReadonlyArray<number>): number {
  return amounts.reduce((a, b) => a + b, 0);
}

// MAUVAIS — le callee pourrait mutate l'input
function sumAmounts(amounts: number[]): number { /* ... */ }
```

### 6.2 Classes

```ts
class User {
  constructor(
    readonly id: string,
    readonly email: Email,
    private _passwordHash: PasswordHash,
  ) {}
}
```

### 6.3 Const assertions

```ts
const config = {
  apiUrl: 'https://strickin-api.railway.app',
  version: 'v1',
} as const;
// type: { readonly apiUrl: 'https://...'; readonly version: 'v1' }
```

## 7. Unions discriminees

Pour representer des etats mutuellement exclusifs, toujours une union
discriminee (pas des booleans multiples) :

```ts
// MAUVAIS
interface State {
  isLoading: boolean;
  isSuccess: boolean;
  data?: User;
  error?: Error;
}
// Permet : { isLoading: true, isSuccess: true, data: ..., error: ... }
// Non-sense.

// BON
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

L'exhaustiveness check avec `switch` devient trivial :

```ts
function render(state: State): JSX.Element {
  switch (state.status) {
    case 'idle':    return <Idle />;
    case 'loading': return <Loading />;
    case 'success': return <Result data={state.data} />;
    case 'error':   return <ErrorBanner error={state.error} />;
  }
}
```

## 8. `never` pour exhaustiveness

```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

function render(state: State): JSX.Element {
  switch (state.status) {
    case 'idle':    return <Idle />;
    case 'loading': return <Loading />;
    case 'success': return <Result data={state.data} />;
    case 'error':   return <ErrorBanner error={state.error} />;
    default: return assertNever(state);
  }
}
```

Si un jour un nouveau variant apparait dans l'union, TypeScript hurle.

## 9. Types utilitaires courants

| Utilitaire | Utilite |
| --- | --- |
| `Partial<T>` | Rend tous les champs optionnels. |
| `Required<T>` | Inverse. |
| `Pick<T, K>` | Selection de champs. |
| `Omit<T, K>` | Exclusion de champs. |
| `Readonly<T>` | Tous en readonly. |
| `Record<K, V>` | Map (cle K, valeur V). |
| `NonNullable<T>` | Exclut null et undefined. |
| `Awaited<T>` | Unwrap une Promise. |
| `ReturnType<T>` | Type de retour. |
| `Parameters<T>` | Tuple des parametres. |

### 9.1 Pattern : DTO derive

```ts
type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

// Reponse API — sans passwordHash, avec timestamps serialisees
type UserDto = Omit<User, 'passwordHash' | 'createdAt'> & {
  createdAt: string;
};
```

## 10. Imports

### 10.1 `import type` pour les types

```ts
// BON — n'emet pas de JS runtime
import type { User } from './user';

// MAUVAIS — peut creer un import runtime inutile
import { User } from './user';
```

Avec `verbatimModuleSyntax` (en preview), TS force a separer. On adopte
progressivement.

### 10.2 Ordre

```ts
// 1. Lib externes
import { useMemo } from 'react';
import { z } from 'zod';

// 2. Packages monorepo
import type { User } from '@strickin/shared';
import { cn } from '@strickin/design-system/utils';

// 3. Chemins absolus (alias @)
import { api } from '@/lib/api';
import type { AuthState } from '@/features/auth';

// 4. Chemins relatifs
import { useLogin } from './use-login';
import type { LoginFormProps } from './login-form.types';
```

## 11. Erreurs typees

Erreurs domaine extends `Error` avec un discriminant `code` :

```ts
export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS';
  readonly status = 401;
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export type KnownError =
  | InvalidCredentialsError
  | EmailAlreadyRegisteredError
  | TokenReuseError;

function isKnownError(e: unknown): e is KnownError {
  return e instanceof Error && 'code' in e;
}
```

## 12. Narrowing custom

```ts
function isString(x: unknown): x is string {
  return typeof x === 'string';
}

function isNonEmpty<T>(arr: readonly T[]): arr is readonly [T, ...T[]] {
  return arr.length > 0;
}
```

Plus sur et reutilisable qu'un cast.

## 13. Generics

### 13.1 Nomme les generics quand c'est clair

```ts
// MAUVAIS
function get<T>(key: string): T { /* ... */ }

// BON
function get<Value>(key: string): Value { /* ... */ }
```

### 13.2 Contraintes explicites

```ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## 14. Checklist PR

- [ ] `tsc --noEmit` passe sur tous les workspaces.
- [ ] Aucun `any`, aucun `@ts-ignore`.
- [ ] Les unions d'etats sont discriminees.
- [ ] Les inputs externes (JSON requetes, localStorage) passent par Zod.
- [ ] Les types export publics ont des JSDoc.
- [ ] Les types partages vont dans `@strickin/shared` plutot que dupliques.
