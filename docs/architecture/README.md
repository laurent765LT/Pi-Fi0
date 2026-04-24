# Strick'in — Architecture

Documentation d'architecture de la plateforme B2B Strick'in.
Dernière mise a jour : Sprint 1 (2026-04).

Ce hub regroupe la vision, les flux, les conventions et les decisions (ADRs)
qui gouvernent le code de Strick'in. Il est versionne avec le code — chaque
PR qui change un flux ou une dependance doit mettre a jour le doc concerne.

---

## Audience

- **Devs** rejoignant le projet : commencer par [`01-overview.md`](./01-overview.md).
- **Lead / reviewer** : [`decisions/`](./decisions/) + [`conventions/code-review.md`](./conventions/code-review.md).
- **SRE / on-call** : [`runbook-incidents.md`](../runbook-incidents.md) (racine `docs/`).
- **Product / compliance** : [`07-authentication.md`](./07-authentication.md), [`05-data-layer.md`](./05-data-layer.md).

## Prerequisites

- Connaissance generale de Next.js App Router, NestJS, Prisma, TypeScript strict.
- Avoir lu le [README racine](../../README.md) pour le setup local.

---

## Vue d'ensemble

```
 ┌────────────────────────┐   HTTPS    ┌──────────────────────────┐
 │ Vercel — Next.js 14    │──────────▶│ Railway — NestJS 10       │
 │ apps/web               │            │ apps/api                  │
 │ React 18 + TanStack Q  │            │ Clean Architecture + DDD  │
 │ Zustand persist        │            │ Prisma ORM                │
 └────────────────────────┘            └────┬────────────┬────────┬┘
                                            │            │        │
                              Prisma/pgbouncer           │        │ fetch
                                            ▼            ▼        ▼
                                ┌───────────────┐ ┌──────────┐ ┌──────────┐
                                │ Supabase      │ │ Upstash  │ │ Anthropic│
                                │ Postgres 16   │ │ Redis 7  │ │ Claude   │
                                │ eu-west-1     │ │ us-west  │ │ API      │
                                └───────────────┘ └──────────┘ └──────────┘

                         ┌────────────────────────────────────┐
                         │ Sentry (errors + replay + traces)  │
                         │ strickin (web) · strickin-api (api)│
                         └────────────────────────────────────┘
```

---

## Table des matieres

### Fondations

| Doc | Description |
| --- | --- |
| [`01-overview.md`](./01-overview.md) | Vision produit, stack, contraintes reglementaires, principes directeurs. |
| [`02-frontend-architecture.md`](./02-frontend-architecture.md) | Feature-based + layering dans `apps/web/features/`. |
| [`03-backend-architecture.md`](./03-backend-architecture.md) | Clean Architecture + DDD dans `apps/api/src/modules/`. |
| [`04-shared-packages.md`](./04-shared-packages.md) | `@strickin/shared` et `@strickin/design-system`. |

### Infra & run

| Doc | Description |
| --- | --- |
| [`05-data-layer.md`](./05-data-layer.md) | Postgres (Supabase), Prisma, Redis (Upstash), migrations, backups. |
| [`06-api-contracts.md`](./06-api-contracts.md) | REST, status codes, DTOs, pagination, versioning, erreurs RFC 7807. |
| [`07-authentication.md`](./07-authentication.md) | JWT + Argon2id, refresh rotation, cookies, rate limiting. |
| [`08-observability.md`](./08-observability.md) | Sentry, logs structures, `/health`, `/ready`, metrics. |
| [`09-testing-strategy.md`](./09-testing-strategy.md) | Vitest, Supertest, Playwright, cibles de coverage. |
| [`10-deployment.md`](./10-deployment.md) | Vercel, Railway, migrations, rollback, CI/CD. |

### Conventions

| Doc | Description |
| --- | --- |
| [`conventions/naming.md`](./conventions/naming.md) | Fichiers, dossiers, variables, types, booleans. |
| [`conventions/typescript.md`](./conventions/typescript.md) | Strict flags, `any` interdit, `as const` vs `enum`. |
| [`conventions/commits.md`](./conventions/commits.md) | Conventional Commits + commitlint. |
| [`conventions/code-review.md`](./conventions/code-review.md) | Checklist PR imposee. |

### Decisions (ADRs)

| ADR | Titre | Statut |
| --- | --- | --- |
| [0001](./decisions/0001-monorepo-npm-workspaces.md) | Monorepo npm workspaces | Accepted |
| [0002](./decisions/0002-nextjs-app-router.md) | Next.js 14 App Router (vs Pages) | Accepted |
| [0003](./decisions/0003-zustand-with-persist.md) | Zustand + persist middleware | Accepted |
| [0004](./decisions/0004-tanstack-query-over-swr.md) | TanStack Query plutot que SWR | Accepted |
| [0005](./decisions/0005-prisma-over-typeorm.md) | Prisma ORM plutot que TypeORM | Accepted |
| [0006](./decisions/0006-clean-architecture-backend.md) | Clean Architecture + DDD (backend) | Accepted |
| [0007](./decisions/0007-feature-based-frontend.md) | Feature-based (frontend) | Accepted |
| [0008](./decisions/0008-argon2id-over-bcrypt.md) | Argon2id plutot que bcrypt | Accepted |
| [0009](./decisions/0009-jwt-refresh-rotation.md) | JWT avec rotation refresh token | Accepted |
| [0010](./decisions/0010-sentry-over-logrocket.md) | Sentry plutot que LogRocket | Accepted |
| [0011](./decisions/0011-upstash-redis-over-selfhosted.md) | Upstash Redis plutot que self-hosted | Accepted |
| [0012](./decisions/0012-supabase-over-managed-postgres.md) | Supabase plutot que RDS / Neon | Accepted |
| [0013](./decisions/0013-claude-api-over-openai.md) | Claude API plutot qu'OpenAI | Accepted |
| [0014](./decisions/0014-feature-flag-strategy.md) | Strategie de feature flags | Accepted |

### Diagrammes

| Fichier | Contenu |
| --- | --- |
| [`diagrams/system-overview.md`](./diagrams/system-overview.md) | Topologie complete (Mermaid). |
| [`diagrams/request-flow.md`](./diagrams/request-flow.md) | Cycle complet d'un GET authentifie (ASCII). |
| [`diagrams/auth-flow.md`](./diagrams/auth-flow.md) | Register / login / refresh / logout (Mermaid). |
| [`diagrams/deployment-topology.md`](./diagrams/deployment-topology.md) | Environnements + promotion (ASCII + Mermaid). |
| [`diagrams/data-flow-rfq.md`](./diagrams/data-flow-rfq.md) | CGP cree RFQ → dispatch → quotes → accept (Mermaid). |

---

## Comment utiliser cette doc

1. **Nouveau feature dev** : lire `01-overview.md`, puis le chapitre du layer ou tu
   touches (`02-frontend-architecture.md` ou `03-backend-architecture.md`),
   puis les ADRs directement relies.
2. **Review PR** : appliquer [`conventions/code-review.md`](./conventions/code-review.md).
3. **Mise en prod** : [`10-deployment.md`](./10-deployment.md) +
   [`runbook-incidents.md`](../runbook-incidents.md).
4. **Nouvelle decision structurante** : creer un nouvel ADR en copiant le
   template ([`decisions/README.md`](./decisions/README.md)), incrementer
   le numero, ouvrir une PR dediee.

---

## Principes non-negociables

1. **Domain-first** — le code metier (value objects, entities) precede le
   code technique (Prisma, HTTP, React).
2. **Dependency inversion** — le domaine ne depend de rien. L'infra
   implemente les interfaces du domaine, pas l'inverse.
3. **Type safety absolue** — pas de `any`, jamais. `unknown` + type guards.
4. **Feature cohesion** — ce qui change ensemble vit ensemble.
5. **Un use case = une transaction** — idempotence cote write.
6. **Observabilite par defaut** — tout flux critique est tracable dans
   Sentry et dans les logs structures.
