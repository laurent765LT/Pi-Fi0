# Strick'in — Infrastructure inventory

Single source of truth for every cloud service the platform depends on.
Update whenever a new service is provisioned or a quota is hit.

| Owner (Sprint 1) | Paul-Adrien Desplechin · `paulad1.desplechin@gmail.com` |

---

## 1. Supabase — PostgreSQL 16

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://supabase.com/dashboard/project/wdkzzbndfulkjclyulxf     |
| Project ID   | `wdkzzbndfulkjclyulxf`                                          |
| Region       | `aws-eu-west-1` (Ireland)                                       |
| Plan         | Free tier                                                       |
| Quotas       | 500 MB DB · 5 GB bandwidth/mo · 2 GB file storage · auto-pause 7d |
| Backups      | Daily (retained 7 days on free; upgrade to Pro for 30 d)        |
| Connection   | Pooled (pgbouncer) on `:6543` · direct on `:5432` for migrations |
| Owner        | paulad1.desplechin@gmail.com                                    |
| Invite link  | Send from dashboard → Settings → Team                            |
| SLA          | Best-effort on free; 99.9% on Pro                               |

Secrets: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Upstash — Redis 7

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://console.upstash.com                                     |
| DB name      | `rested-ladybug-72557`                                          |
| Region       | `us-west-1` (**migration to eu-west planned for Sprint 2**)     |
| Plan         | Free tier                                                       |
| Quotas       | 10 000 commands/day · 256 MB max · 3 days eviction              |
| Connection   | `rediss://` (TLS) + REST endpoint                               |
| Owner        | paulad1.desplechin@gmail.com                                    |

Secrets: `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

---

## 3. Anthropic — Claude API

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://console.anthropic.com                                   |
| Workspace    | `Strick'in`                                                     |
| Model        | `claude-3-5-sonnet-20241022`                                    |
| Plan         | Pay-as-you-go                                                   |
| Monthly cap  | `ANTHROPIC_MONTHLY_BUDGET_USD=500`                              |
| Alert at     | `ANTHROPIC_ALERT_THRESHOLD_USD=400` (80%)                       |
| Data region  | Global (request-level latency ~300 ms from EU)                  |
| Owner        | paulad1.desplechin@gmail.com                                    |

Secrets: `ANTHROPIC_API_KEY`.

---

## 4. Sentry — error monitoring

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://strickin.sentry.io                                      |
| Org slug     | `strickin`                                                      |
| Projects     | `strickin` (web) · `strickin-api` (backend)                     |
| Plan         | Developer (free)                                                |
| Quotas       | 5 000 errors/mo · 10 k transactions/mo · 50 replays/mo          |
| Data region  | `de.sentry.io` (EU — Frankfurt)                                 |
| Retention    | 30 days                                                         |
| Owner        | paulad1.desplechin@gmail.com                                    |

Secrets: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN_API`, `SENTRY_AUTH_TOKEN`.

---

## 5. Vercel — web hosting

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://vercel.com/strickin/web                                 |
| Team         | `strickin`                                                      |
| Project      | `web`                                                           |
| Plan         | Hobby (free)                                                    |
| Region       | `cdg1` (Paris, auto)                                            |
| Domains      | `strickin-web-web.vercel.app` (default) · custom domain TBD     |
| Quotas       | 100 GB bandwidth · 100 h build · 500 GB edge runtime            |
| Owner        | paulad1.desplechin@gmail.com                                    |

Env vars to set in Vercel (project settings → Environment Variables):
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`,
`SENTRY_ORG`, `SENTRY_PROJECT_WEB`, `FEATURE_SENTRY_ENABLED`.

---

## 6. Railway — API hosting

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://railway.app (project `strickin-api`)                    |
| Plan         | Hobby ($5/mo)                                                   |
| Region       | `europe-west4` (Netherlands)                                    |
| Service      | `api` — Dockerfile based (`apps/api/Dockerfile`)                |
| Dependencies | Supabase (Postgres) · Upstash (Redis) · Anthropic               |
| Owner        | paulad1.desplechin@gmail.com                                    |

Env vars to set in Railway: all variables in `apps/api/.env.example`.

Release command:
```
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

---

## 7. Resend — transactional email (optional)

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Dashboard    | https://resend.com                                              |
| Plan         | Free (100 emails/day, 3 k/month)                                |
| Domain       | `strickin.fr` (DKIM + SPF pending)                              |
| Use          | Weekly KPI reports · password reset emails                      |
| Owner        | paulad1.desplechin@gmail.com                                    |

Secrets: `RESEND_API_KEY`.

---

## 8. GitHub — source + CI

| Field        | Value                                                           |
| ------------ | --------------------------------------------------------------- |
| Org          | `strickin` (private)                                            |
| Repos        | `strickin` (monorepo)                                           |
| Protection   | `main` branch · PR required · squash merge · 1 reviewer (self)  |
| Secrets      | `SENTRY_AUTH_TOKEN`, `VERCEL_TOKEN`, `RAILWAY_TOKEN` (Sprint 2) |
| Owner        | paulad1.desplechin@gmail.com                                    |

---

## Access transfer protocol (when onboarding a teammate)

1. Create a Google Workspace alias (`<firstname>@strickin.fr`).
2. Invite them to each service at the lowest privilege that unblocks them:
   - Supabase: **Developer** (read schema + query logs, no DDL)
   - Sentry: **Member**
   - Vercel: **Developer**
   - Railway: **Collaborator**
3. Add them to the 1Password shared vault `Strick'in — Sprint 1`.
4. Tick a box on this doc:

   | Name | Email | Services added | Date |
   | ---- | ----- | -------------- | ---- |
   |      |       |                |      |

---

## Upgrade thresholds — when to move off free tiers

| Service   | Signal                                                   |
| --------- | -------------------------------------------------------- |
| Supabase  | DB > 400 MB · OR > 3 concurrent users at peak            |
| Upstash   | > 7 500 commands/day for 3 consecutive days              |
| Sentry    | > 4 000 errors/mo for 2 consecutive months               |
| Vercel    | > 80 GB bandwidth/mo · OR first paying customer          |
| Railway   | > 500 compute-hours/mo                                   |
| Anthropic | Sustained > 400 $/mo spend                               |
