# Strick'in — Incident Runbook

Playbooks for the five most likely production incidents. Keep this document
short, sharp, and actionable — it will be read at 2 AM.

> Always start by checking `/admin/system-health` (logged in as a super admin)
> and the Sentry "strickin-api" project.

| On-call owner | Paul-Adrien Desplechin — `paulad1.desplechin@gmail.com` |
| ------------- | ------------------------------------------------------- |
| Escalation    | Founder (same person during Sprint 1).                   |
| Status page   | Not yet — tracked in Sprint 2.                           |

---

## Scenario A — Supabase Postgres down

### Symptoms
- Sentry `strickin-api` floods with `PrismaClientUnknownRequestError`
- `GET /ready` returns `{ services.db: { status: 'down' } }`
- Web app: 500s on most reads, login broken.

### Detect
```bash
curl -s https://strickin-api.up.railway.app/ready | jq .services.db
```

### Actions (in order)

1. Open the Supabase dashboard:
   https://supabase.com/dashboard/project/wdkzzbndfulkjclyulxf
2. Check **Project Health** → connection pool usage, CPU, disk.
3. If pool is saturated: restart the pooler
   (Settings → Database → Connection Pooling → Restart).
4. If CPU pegged: check **Logs → Postgres** for slow queries. Cancel
   offenders with `pg_terminate_backend(pid)`.
5. If the project is Paused (free tier idles after 7d): click "Restore"
   from the dashboard and wait ~2 min.
6. Post incident update in Linear (channel: `#ops`) within 15 min.

### Contacts
- Supabase support: https://supabase.com/support (Pro plan email SLA 24 h)
- Escalation: founder

### Post-mortem template
Duration · root cause · impact · detection gap · action items (owner + due).

---

## Scenario B — Anthropic Claude API quota exceeded

### Symptoms
- Every `/api/v1/ai/*` returns 503
- Sentry: repeated `Claude API error: 429`
- Chat widget shows "AI service temporarily unavailable"

### Detect
```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":5,"messages":[{"role":"user","content":"ping"}]}'
# → 429 overloaded_error
```

### Actions

1. Log into https://console.anthropic.com → **Settings → Limits**.
2. If monthly cap reached: increase the budget or request a limit raise
   (same page). Usually takes < 10 min for developer plans.
3. While waiting, set `FEATURE_AI_CLAUDE_REAL=false` via Railway env vars
   + redeploy. The `AiService` falls back to Perplexity automatically.
4. As a last resort, set `NEXT_PUBLIC_USE_REAL_API=false` on the web and
   redeploy — chat falls back to the demo responses in `lib/demo-data.ts`.
5. Once quota restored, revert the flags.

### Prevention
- `ANTHROPIC_ALERT_THRESHOLD_USD` triggers a Slack hook at 80% of the
  monthly budget (see `apps/api/src/ai/budget.service.ts`).
- TTL-cached responses (Redis) shave ~40% of calls.

---

## Scenario C — Vercel deploy broken

### Symptoms
- Latest deploy shows red build icon in Vercel
- New commits don't reach `app.strickin.com`
- OR the site loads but shows `Application error: a client-side exception`

### Actions

1. Open https://vercel.com/strickin/web/deployments
2. Click the failing deploy → **View Build Logs**.
3. If the error is reproducible locally, fix + push. Otherwise:
4. **Rollback**: on the previous passing deploy, click
   **… → Promote to Production**. Takes ~15 s.
5. Always test the preview deployment (every PR gets one) before hitting
   merge — this prevents 95% of incidents here.

### Rollback without UI
```bash
vercel ls --prod
vercel promote <deployment-url> --prod
```

---

## Scenario D — Auth broken (all users logged out)

### Symptoms
- Every user gets 401 on signed-in routes
- Login works, but next request fails
- Sentry: `JsonWebTokenError: invalid signature`

### Root causes
- `JWT_ACCESS_SECRET` was rotated on Railway
- Clock drift between API nodes
- Redis blacklist wiped while tokens still valid

### Actions

1. Check Railway env: did someone rotate `JWT_ACCESS_SECRET`?
   ```bash
   railway variables --service api | grep JWT
   ```
   If yes and you need to keep the new secret, accept the forced logout.
   If unintentional, restore the previous value and restart.

2. **Force logout all users (intentional)**:
   - Rotate `JWT_ACCESS_SECRET` AND `JWT_REFRESH_SECRET` on Railway.
   - Purge the Redis refresh-token store:
     ```bash
     redis-cli --tls -u "$REDIS_URL" SCAN 0 MATCH 'auth:refresh:*' | \
       xargs -n100 redis-cli --tls -u "$REDIS_URL" DEL
     ```
   - Redeploy the API.
   - Users will need to log back in.

3. **Clock drift**: Railway containers should be NTP-synced automatically,
   but if `new Date()` in logs is skewed > 30 s, restart the container.

---

## Scenario E — Prisma migration failed mid-release

### Symptoms
- `prisma migrate deploy` exits with a failed migration
- API refuses to boot: `P3009: migrate found failed migrations`

### Actions

1. Inspect the failed migration:
   ```bash
   npx prisma migrate status --schema=apps/api/prisma/schema.prisma
   ```
2. **Mark as rolled back** (tells Prisma to ignore it on next boot):
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name> \
     --schema=apps/api/prisma/schema.prisma
   ```
3. If the migration partially wrote schema changes, manually reverse them
   via `psql`:
   ```bash
   psql "$DIRECT_URL" -f ./apps/api/prisma/migrations/<ts>_<name>/down.sql
   ```
   (We don't auto-generate `down.sql` yet — write one manually for each
   destructive migration before deploy.)
4. Fix the SQL locally, re-run `prisma migrate dev`, commit, redeploy.

### Prevention
- Always test migrations against a staging Supabase clone first.
- For destructive changes, split into two deploys: additive first
  (e.g. `ADD COLUMN … DEFAULT …`), then remove in a subsequent release.

---

## Post-mortem template

```
# Post-mortem — <incident title>

Date:         2026-MM-DD
Duration:     <start> → <end> (total Xh)
Severity:     SEV-1 | SEV-2 | SEV-3
Author:       <name>

## Impact
- Users affected:
- Data loss:
- Customer-visible symptoms:

## Timeline
- 14:00 UTC — detection (source: Sentry alert / customer report / …)
- 14:03 UTC — triage begins
- 14:15 UTC — root cause identified
- 14:40 UTC — fix deployed
- 14:45 UTC — incident resolved

## Root cause
<One paragraph — what actually broke.>

## What went well
- 

## What went poorly
- 

## Action items
- [ ] <owner> — <task> — due <date>
- [ ] <owner> — <task> — due <date>
```
