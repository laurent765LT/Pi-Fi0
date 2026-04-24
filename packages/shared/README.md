# @strickin/shared

Shared contracts for the Strick'in platform — the **single source of truth**
for domain types, API request/response payloads, domain events, catalogue
constants, pure utilities, and runtime Zod schemas.

This package is consumed by:

- `apps/web`  — Next.js front-end (TanStack Query hooks, forms).
- `apps/api`  — NestJS back-end (DTOs, validation pipes, event emitters).
- `apps/cli`  — operational CLI (scripts, data checks).
- (future) a mobile app or B2B partner SDK.

## Philosophy

1. **Zero framework dependency**. Nothing imports React, Next.js, NestJS, Prisma, or the browser DOM.
2. **Contracts, not logic**. The package only holds type declarations, enum-like objects, catalogue constants, deterministic pure functions, and Zod schemas. Anything with side effects or framework hooks belongs in `apps/*`.
3. **Mirror, don't duplicate**. Domain types mirror `apps/api/prisma/schema.prisma`. If you edit a model, update the matching file in `src/domain/`.
4. **Browser-safe**. Every module must parse and evaluate in a modern browser bundler.

## Layout

```
src/
  domain/       Entities, value objects, enums (PascalCase types)
  api/          HTTP DTOs, response envelopes, error class + codes
  events/       Typed domain events emitted by the backend
  constants/    Shared catalogue values (scales, labels, palettes)
  utils/        Pure formatters, validators, type guards
  schemas/      Zod schemas for runtime validation
  index.ts      Public root — re-exports + v1 aliases
```

## Usage

Prefer sub-path imports — they're tree-shakeable:

```ts
import type { Product, UserRole } from '@strickin/shared/domain';
import type { CreateRfqDto, PagedResponse } from '@strickin/shared/api';
import { COMMITMENT_SCALES, PAYOFF_LABELS } from '@strickin/shared/constants';
import { formatEuros, isValidIsin } from '@strickin/shared/utils';
import { RegisterSchema } from '@strickin/shared/schemas';
```

For backwards compatibility with v1 code paths, the root import still works:

```ts
import { PayoffType, COMMITMENT_SCALES, AuthResponse } from '@strickin/shared';
```

### Defining a domain event

```ts
import type { DomainEvent } from '@strickin/shared/events';

type PaymentFailedEvent = DomainEvent<
  'payment.failed',
  { orderId: string; reason: string }
>;
```

### Validating a request with Zod

```ts
// apps/api/src/products/products.controller.ts
import { CreateProductSchema } from '@strickin/shared/schemas';

@Post()
create(@Body() raw: unknown) {
  const dto = CreateProductSchema.parse(raw);
  return this.products.create(dto);
}
```

## Conventions

### Naming

| Concept     | Convention                            | Example                       |
|-------------|---------------------------------------|-------------------------------|
| Entity      | PascalCase                            | `User`, `Product`, `Rfq`      |
| Enum-like   | PascalCase value + type               | `UserRole`, `ProductStatus`   |
| DTO         | `<Action><Resource>Dto`               | `CreateProductDto`            |
| Event       | `<Subject><PastVerb>Event`            | `UserRegisteredEvent`         |
| Guard       | `is<Type>`                            | `isUser`, `isCGP`             |

### Enums

We prefer `as const` objects over TypeScript `enum`:

```ts
export const KYCStatus = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type KYCStatus = (typeof KYCStatus)[keyof typeof KYCStatus];
```

Benefits:
- Tree-shakeable (no runtime artefact when only the type is used).
- Simpler interop with Prisma's string enums.
- `Object.values(KYCStatus)` works directly.

### Types vs interfaces

- `interface` for entities and DTOs (extensible).
- `type` for unions, utility types, and computed types.

### Required JSDoc

Every entity must document its source of truth:

```ts
/**
 * Structured product instance.
 * Source of truth: apps/api/prisma/schema.prisma#Product
 *
 * @property isin - ISIN (unique, 12 chars).
 * @property sri  - Synthetic Risk Indicator 1-7 (PRIIPs scale).
 */
export interface Product { /* … */ }
```

## Versioning

This package uses semver:

- **Patch**: new optional fields, new utility functions, bug fixes.
- **Minor**: new entities, new enums, new DTOs.
- **Major**: breaking changes to existing types (renames, removals, required-field changes).

Changelog lives at `CHANGELOG.md`. Keep entries concise and scoped.

## Adding a new type

1. Pick the right folder: `domain/` for entities, `api/` for wire types, `events/` for events, `constants/` for palettes/labels, `utils/` for pure helpers, `schemas/` for Zod.
2. Add a new file (one entity per file). Add JSDoc.
3. Add an `export *` line to the folder's `index.ts`.
4. If the new type is essential at the root, re-export via `src/index.ts`.
5. Add tests for utilities and schemas.

## Testing

```bash
npm run test --workspace=packages/shared
```

Unit tests (Vitest) live next to the code as `*.spec.ts`. Only pure
utilities and schemas require tests — type-only files don't.

## Building

```bash
npm run build --workspace=packages/shared
```

Outputs typed `.d.ts` + JS to `dist/`. The root `main` and `exports` fields
point to `src/` to let consumers benefit from source maps and direct TypeScript
resolution in the monorepo.

## Do not

- Import from `react`, `next`, `@nestjs/*`, `@prisma/client`, or any DOM type.
- Export default exports — use named exports only (better for tree-shaking and refactoring).
- Put runtime logic in `domain/`. Use `utils/` for that.
- Mutate frozen catalogues (`COMMITMENT_SCALES`, `PAYOFF_LABELS`). Add a new key instead.
