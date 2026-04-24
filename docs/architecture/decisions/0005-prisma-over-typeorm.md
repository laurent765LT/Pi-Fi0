# ADR 0005 — Prisma ORM plutot que TypeORM

## Status
Accepted — 2026-03-08

## Context

Le backend NestJS doit parler a Postgres. On a besoin d'un ORM / query
builder qui coche les cases :

- **Type safety** — les queries renvoient des types TypeScript stricts
  sans declaration manuelle.
- **Migrations versionnees** — rollbackables, diff-based.
- **DX** — schema lisible en diff de PR.
- **Performance** — pas d'overhead N+1 magique.
- **Ecosysteme NestJS-compatible**.

Deux candidats principaux en 2026 : **Prisma** et **TypeORM**. Aussi
considere : Kysely, Drizzle.

## Decision

Utiliser **Prisma 5** comme ORM / query builder officiel pour `apps/api`.

```
apps/api/prisma/
  schema.prisma               # source de verite
  migrations/
    20260308145805_init/
    20260424120000_add_kyc_status/
  seed.ts
```

Config :
- `generator client { provider = "prisma-client-js" }`
- `datasource db { provider = "postgresql" }`
- `DATABASE_URL` pointe sur le pooler Supabase (pgbouncer `:6543`).
- `DIRECT_URL` pointe sur le direct Supabase (`:5432`) pour migrations.

## Consequences

### Positives
- **Type-safe queries** — `prisma.user.findMany({ where: { email }})`
  renvoie `User[]` strictement type.
- **Schema DSL** — fichier `.prisma` lisible, facile a review en diff.
- **`prisma migrate`** — migrations named, versionnees, reviewees en PR.
  `migrate dev` pour local, `migrate deploy` pour prod.
- **Prisma Studio** — UI de browse / edit pour la DB, tres utile dev.
- **Introspection** — `prisma db pull` pour importer un schema existant
  si besoin.
- **Outbox pattern** supportable via `prisma.$transaction`.
- **Relations expliques** — `include` et `select` sont obvious, pas
  d'auto-eager fetch.

### Negatives
- **Query client pesant** — ~50 MB en node_modules (generated code
  important).
- **Pas de heritage de models** — on ne peut pas avoir une table abstraite
  partagee entre sous-classes (solution : fields duplicates + discriminateur).
- **Migrations pas parfaitement ACID** — le fichier SQL est applique
  commande par commande. Pour des migrations complexes on orchestre
  manuellement.
- **Limitations JSON** — pas de type inference sur les colonnes `Json`
  (on utilise Zod pour valider a l'entree).
- **Couplage au generator** — si on veut changer d'ORM, on reecrit tout
  (mais c'est attendu avec n'importe quel ORM).

### Neutres
- Prisma a des abstractions (`$queryRaw`, `$executeRaw`) pour fallback
  sur SQL quand l'ORM ne suffit pas.
- Le client Prisma est singleton — on l'injecte via `PrismaService` NestJS.

## Alternatives considered

- **TypeORM**
  - Plus ancien, plus de patterns documentes.
  - Active Record + Data Mapper support.
  - Type safety **moins bonne** — queries complex renvoient du `any`
    par defaut.
  - Migrations moins ergonomic (timestamp auto-generes fragiles).
  - Bugs recurrents avec les relations (auto-load).
  - **Rejette** — trop de foot-guns.
- **Kysely**
  - Query builder type-safe, leger.
  - Pas de migrations built-in (utiliser `kysely-migrator` ou autre).
  - Pas de schema DSL.
  - **Rejette** — aurait demande plus de glue code.
- **Drizzle**
  - Tres proche de Kysely, schema en TS pur.
  - Ecosysteme jeune (2024-2025), moins d'integrations matures.
  - **Rejette pour Sprint 1** — revisiter Sprint 4.
- **Supabase JS client**
  - Simple, PostgREST, RLS-friendly.
  - **Rejette** — on veut la logique metier cote API (NestJS), pas cote
    DB via RLS policies complexes. Supabase client reserve au frontend
    pour quelques cas (storage).

## Related
- [ADR 0012 — Supabase](./0012-supabase-over-managed-postgres.md)
- [ADR 0006 — Clean Architecture backend](./0006-clean-architecture-backend.md)
  — Prisma reste confine a `infrastructure/persistence/`.
- [docs/architecture/05-data-layer.md](../05-data-layer.md)
