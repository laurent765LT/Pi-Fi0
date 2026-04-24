# Strick'in

B2B SaaS platform for distributing structured products to French CGPs
(Conseillers en Gestion de Patrimoine) and life-insurance carriers. Connects
issuers (BNP Paribas, Natixis, Goldman Sachs, SG Issuer, Marex) to
distributors through a fully digital, MiFID II / DDA-compliant workflow.

---

## Stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| Frontend (web)   | Next.js 14 · React 18 · TypeScript · Tailwind CSS      |
| Backend (API)    | NestJS 10 · Prisma ORM · PostgreSQL 16                 |
| Queue / Cache    | Redis 7 · BullMQ 5                                     |
| Auth             | JWT · Passport · Argon2                                |
| AI               | Anthropic Claude (primary) · Perplexity (fallback)     |
| Monitoring       | Sentry (web + api) · structured JSON logs              |
| Mobile (demo)    | React Native / Expo                                    |
| CLI (agent-first)| TypeScript · Commander.js · JSON output                |
| Hosting          | Vercel (web) · Railway (api) · Supabase (Postgres)     |
| Package manager  | npm workspaces                                         |

---

## Architecture

```
  ┌──────────────────────────┐          ┌───────────────────────────┐
  │  Vercel — Next.js (web)  │──HTTPS──▶│  Railway — NestJS (api)   │
  │  strickin-web.vercel.app │          │  strickin-api.railway     │
  └──────────────────────────┘          └──┬────────────────┬────────┘
             │                             │                │
             │                   ┌─────────▼──────┐  ┌──────▼─────────┐
             │                   │   PostgreSQL   │  │     Redis      │
             │                   │   (Supabase)   │  │   (Upstash)    │
             │                   └────────────────┘  └────────────────┘
             │                             │
             │                    ┌────────▼─────────┐
             │                    │ Anthropic Claude │
             │                    └──────────────────┘
             │
             └────────────────▶  Sentry (web project + api project)
```

- Frontend and backend are deployed independently.
- The API is the sole writer to Postgres; the web app calls it through
  `NEXT_PUBLIC_API_URL`.
- Anthropic Claude calls are cached in Redis (`ai:*` namespace).
- Sentry runs with source maps uploaded at build (web) and unminified stacks
  (api).

See [`docs/architecture.md`](./docs/architecture.md) for auth / AI / cache
flows, and [`docs/runbook-incidents.md`](./docs/runbook-incidents.md) for
on-call playbooks.

---

## Prerequisites

- Node.js ≥ 20 (`nvm use 20` recommended)
- npm ≥ 10
- Accounts and credentials for:
  - Supabase (Postgres) — project `wdkzzbndfulkjclyulxf` in `eu-west-1`
  - Upstash (Redis) — DB `rested-ladybug-72557`
  - Anthropic (Claude API)
  - Sentry — org `strickin`, projects `strickin` (web) + `strickin-api`
  - Vercel (deploys web)
  - Railway (deploys api)

---

## Setup (local)

```bash
# 1. Clone
git clone https://github.com/strickin/strickin.git
cd strickin

# 2. Env vars
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Edit both with the Supabase / Upstash / Anthropic / Sentry values from
# 1Password (vault "Strick'in — Sprint 1")

# 3. Install
npm install

# 4. Generate Prisma client
npx prisma generate --schema=apps/api/prisma/schema.prisma

# 5. Seed demo data (17 products, 3 orgs, 5 users)
npm run db:seed

# 6. Run web + api concurrently
npm run dev
# → web:  http://localhost:3000
# → api:  http://localhost:4000/api/v1
# → docs: http://localhost:4000/api/docs (Swagger)
```

### Demo mode (no backend)

Set `NEXT_PUBLIC_USE_REAL_API=false` in `apps/web/.env.local` and run only
`npm run dev:web`. All mutations go to `localStorage`; auth uses the three
built-in demo accounts.

---

## Scripts (root)

| Command              | What it does                                     |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Runs web + api concurrently                      |
| `npm run dev:web`    | Just the Next.js dev server                      |
| `npm run dev:api`    | Just the NestJS dev server                       |
| `npm run build`      | Builds shared → api → web                        |
| `npm run build:api`  | `nest build` in apps/api                         |
| `npm run build:web`  | `next build` in apps/web                         |
| `npm run db:migrate` | `prisma migrate dev` against `DATABASE_URL`      |
| `npm run db:seed`    | `ts-node prisma/seed.ts`                         |
| `npm run db:studio`  | Opens Prisma Studio                              |
| `npm run lint`       | Runs the workspace lints                         |
| `npm run cli`        | Runs the agent-first CLI (`apps/cli`)            |
| `npm run docker:dev` | `docker compose up -d` (local dev stack)         |

---

## Deployment

### Web → Vercel

- Framework: Next.js (auto-detected)
- Root: `apps/web`
- Build: `next build` (default)
- Env vars: every `NEXT_PUBLIC_*` plus `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
  `SENTRY_PROJECT_WEB`.
- Git-driven: push to `main` → production, PRs → preview deployments.

### API → Railway

- Dockerfile: `apps/api/Dockerfile`
- Root: `apps/api`
- Env vars: every variable in `apps/api/.env.example`.
- Release command: `npx prisma migrate deploy`
- Start: `node dist/main`

### Database migrations

Run once per release, BEFORE the API rollout:

```bash
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

Rollbacks: see [`docs/runbook-incidents.md#scenario-e`](./docs/runbook-incidents.md).

---

## Monitoring

- **Sentry (web):** https://strickin.sentry.io/projects/strickin/
- **Sentry (api):** https://strickin.sentry.io/projects/strickin-api/
- **Uptime:** `GET /health` (liveness, always 200 when the API is up)
- **Readiness:** `GET /ready` (checks DB + Redis + Anthropic key)
- **Admin dashboard:** `/admin/system-health` (signed-in ORG_ADMIN or SUPER_ADMIN)

---

## Further reading

- [`docs/architecture.md`](./docs/architecture.md) — component & flow diagrams
- [`docs/runbook-incidents.md`](./docs/runbook-incidents.md) — on-call playbooks
- [`docs/infra.md`](./docs/infra.md) — cloud service inventory
- [`docs/sprint-1-report.md`](./docs/sprint-1-report.md) — sprint retrospective template

---

## License

Proprietary — © 2025-2026 Strick'in SAS. All rights reserved.
