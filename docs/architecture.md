# Strick'in — Architecture

Living document describing the deployed topology and the main request flows.
Last refreshed: Sprint 1 (2026-04).

---

## 1. High-level topology

```
                   ┌──────────────────────────────────────────┐
                   │                Browser                   │
                   │  (Next.js app, signed in as CGP / admin) │
                   └────┬───────────────────────────────┬─────┘
                        │ HTTPS                         │
              assets,   │                               │ REST / JSON
              SSR HTML  │                               │ (cookie JWT)
                        ▼                               ▼
        ┌──────────────────────────┐      ┌──────────────────────────────┐
        │  Vercel — Next.js 14      │      │     Railway — NestJS 10      │
        │  apps/web                 │──►   │     apps/api                 │
        │  - Route handlers         │      │   ┌────────────────────────┐ │
        │  - Server components      │      │   │ Auth · Products ·      │ │
        │  - Sentry client/server   │      │   │ Commitments · Pricing ·│ │
        │  - NEXT_PUBLIC_API_URL    │      │   │ RFQ · AI · Webhooks …  │ │
        └──────────────────────────┘      │   └────────────────────────┘ │
                                          │   - Sentry init (SDK node)   │
                                          │   - Structured JSON logs     │
                                          │   - /health · /ready         │
                                          └──┬────────────┬─────────┬────┘
                                             │            │         │
                                  Prisma     │     ioredis│         │ fetch
                                  (pgbouncer)│            │         │
                                             ▼            ▼         ▼
                                     ┌─────────────┐ ┌─────────┐ ┌────────────┐
                                     │ PostgreSQL  │ │  Redis  │ │ Anthropic  │
                                     │ Supabase    │ │ Upstash │ │ Claude API │
                                     │ eu-west-1   │ │ us-west │ │ eu         │
                                     └─────────────┘ └─────────┘ └────────────┘

                                ┌───────────────────────────────────┐
                                │  Sentry (errors + replay + traces) │
                                │  project: strickin    (web)        │
                                │  project: strickin-api (api)       │
                                └───────────────────────────────────┘
```

Notes:
- The web app **always** talks to the NestJS API (via `NEXT_PUBLIC_API_URL`);
  there is no direct Supabase access from the browser outside of public
  Supabase JS endpoints (storage is not yet wired).
- Upstash Redis is currently hosted in `us-west-1`; migrating to an EU
  region is tracked in `docs/sprint-1-report.md`.
- Claude API endpoint is `api.anthropic.com/v1/messages`. Anthropic offers
  EU residency for customers on the appropriate plan.

---

## 2. Authentication flow

```
  Browser                        NestJS /auth              Postgres (Supabase)
  ───────                        ────────────             ────────────────────
  POST /auth/register   ────▶   Hash with argon2  ────▶   INSERT users
                        ◀────   { access, refresh }
       cookie set

  POST /auth/login      ────▶   argon2.verify     ────▶   SELECT users
                        ◀────   { access, refresh }
       cookie set

  GET /any-protected    ────▶   JwtAuthGuard
  (Bearer or cookie)              └── verify HS256
                        ◀──── 200 + payload

  on 401 (expired)      ────▶   POST /auth/refresh
                        ◀────   { access, refresh }      (refresh rotated,
                                                          old one blacklisted)

  POST /auth/logout     ────▶   Delete refresh token     → Redis blacklist
                                 + expire cookie
```

Tokens:
- Access JWT — HS256 · 15 min · carries `sub`, `orgId`, `role`.
- Refresh JWT — HS256 · 30 days · rotated on every refresh.
- Secrets: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (env).

Cookie name: `strickin_access`, `httpOnly; SameSite=Lax; Secure` in prod.

---

## 3. API request with caching

Most read endpoints follow this pattern (products, commissions, pricing, AI
analyses):

```
┌─────────┐   GET /v1/ai/analyze/AAPL    ┌─────────┐
│ Browser │ ───────────────────────────▶ │   API   │
└─────────┘                              └────┬────┘
     ▲                                        │
     │                                        │ 1. build cacheKey
     │                                        │    e.g. ai:underlying:AAPL
     │                                        │
     │                                        ▼
     │                                  ┌─────────┐
     │                                  │  Redis  │
     │                                  └────┬────┘
     │                                       │ MISS
     │                                       ▼
     │                                  ┌─────────┐
     │                                  │Anthropic│
     │                                  └────┬────┘
     │                                       │ response
     │                                       ▼
     │                                  SETEX 4h
     │                                       │
     │    200 {content, citations…}          │
     │ ◀─────────────────────────────────────┘
```

- TTL is service-specific (see `AiService`): 2 h for market sentiment, 4 h
  for underlying analysis.
- Every Anthropic call is logged in the `AIInteraction` table for cost
  accounting and rate-limiting.
- The in-memory fallback in `RedisService` means a degraded Upstash only
  slows down the API — it never takes it offline.

---

## 4. AI interaction flow

```
 CGP                  Chat UI           NestJS            Redis         Anthropic
 ───                  ───────           ───────           ─────         ─────────
  │  type question      │                 │                │               │
  │─────────────────────▶                 │                │               │
  │                     │ POST /ai/chat   │                │               │
  │                     │────────────────▶│                │               │
  │                     │                 │ cacheKey hash  │               │
  │                     │                 │────────────────▶               │
  │                     │                 │◀───────── MISS ────────────────│
  │                     │                 │                │               │
  │                     │                 │ stream request │               │
  │                     │                 │────────────────────────────────▶
  │                     │                 │                │    claude-3-5 │
  │                     │                 │◀─────────────────────── text ──│
  │                     │                 │ write AIInteraction row        │
  │                     │                 │ SETEX key 5 min                │
  │                     │ 200 { content } │                │               │
  │                     │◀────────────────│                │               │
  │◀────────────────────│                 │                │               │
```

PII guard: every user message passes through `aiGuard()` which blocks
content containing IBAN, phone, CNI or explicit personalised advice
requests (MIFID II guardrails).

---

## 5. Deployment strategy (current)

- No CI/CD pipeline yet — deploys are triggered by `git push main`.
- Vercel deploys the web app automatically; Railway redeploys the API on
  push to `main` of the `apps/api` workspace.
- Prisma migrations are run manually before each API release:

  ```bash
  DATABASE_URL=… DIRECT_URL=… npx prisma migrate deploy \
    --schema=apps/api/prisma/schema.prisma
  ```

- Sprint 2 will introduce GitHub Actions (lint · typecheck · build · test)
  before Vercel/Railway promotes.

---

## 6. Known limits (as of Sprint 1)

| # | Limit                                                           | Mitigation / owner              |
| - | --------------------------------------------------------------- | ------------------------------- |
| 1 | No CI pipeline — all deploys are manual `git push`              | Sprint 2 (GitHub Actions)       |
| 2 | Upstash Redis in `us-west-1` → ~120 ms extra latency EU ↔ US    | Sprint 2 migration to `eu-west` |
| 3 | Sentry performance profiling not enabled (no profiling-node dep)| Add pkg when needed             |
| 4 | No secret vault yet — creds live in `.env` + 1Password          | Sprint 2 Doppler integration    |
| 5 | Single region — Vercel/Supabase/Upstash all single-AZ           | Acceptable pre-GA               |
| 6 | AIInteraction table not yet partitioned                          | Partition when > 5M rows        |
| 7 | No automated backups beyond Supabase's daily retention          | Add pgBackRest pre-GA           |

Anything else to add here? Open a PR — this doc lives alongside the code.
