# Sprint 1 — Final report

> Template — fill in at sprint close. Keep it factual, short, no fluff.

## Dates

Sprint window: **20XX-XX-XX → 20XX-XX-XX** (XX days)

## Team

- Paul-Adrien Desplechin — founder, full-stack
- (Claude Code agents as implementation assists)

---

## Tasks completed

- [ ] **T1.1** — Cloud provisioning (Supabase · Upstash · Anthropic · Sentry · Railway)
- [ ] **T1.2** — Prisma schema + initial migration applied in production
- [ ] **T1.3** — JWT auth (register / login / refresh / logout) live
- [ ] **T1.4** — Store migration A + B + C (products, favorites, recommendations)
- [ ] **T1.5** — Claude API integration with Redis caching
- [ ] **T1.6** — Monitoring (Sentry web + api · structured logs · `/health` `/ready`)
- [ ] **T1.7** — Seed data (17 products, 3 orgs, 5 users)
- [ ] **T1.8** — Documentation (README, architecture, runbook, infra, `.env.example`)

## Tasks deferred

- (list what slipped to Sprint 2 + why, one line each)

---

## Costs incurred (first 30 days)

| Service    | Plan          | Cost   | Notes                                            |
| ---------- | ------------- | ------ | ------------------------------------------------ |
| Supabase   | Free          | 0 €    | Pauses after 7 d idle (restart via dashboard)    |
| Anthropic  | Pay-as-you-go | … $    | Starting credit 500$ / cap `ANTHROPIC_MONTHLY_BUDGET_USD` |
| Upstash    | Free          | 0 €    | 10 k commands/day free — monitor `/admin/system-health` |
| Sentry     | Developer     | 0 €    | 5 k events/mo · 50 replays/mo                    |
| Railway    | Hobby         | 5 $    | $5/mo · $0.000231/min past 500h                  |
| Vercel     | Hobby         | 0 €    | 100 GB bandwidth/mo free                         |
| **Total**  |               | **≈ X €/mo** |                                              |

## Credits / discounts claimed

- Anthropic research credits: …
- Supabase GitHub Student Pack: n/a
- Sentry bootstrapper plan: not applied for

---

## Accesses created (to transfer before Sprint 2)

| Service     | Identifier                                   | Admin email                         |
| ----------- | -------------------------------------------- | ----------------------------------- |
| Supabase    | project `wdkzzbndfulkjclyulxf` (eu-west-1)   | paulad1.desplechin@gmail.com        |
| Railway     | project `strickin-api`                       | paulad1.desplechin@gmail.com        |
| Vercel      | org `strickin`, project `web`                | paulad1.desplechin@gmail.com        |
| Sentry      | org `strickin` (projects `strickin` + `strickin-api`) | paulad1.desplechin@gmail.com |
| Upstash     | DB `rested-ladybug-72557`                    | paulad1.desplechin@gmail.com        |
| Anthropic   | workspace `Strick'in`                        | paulad1.desplechin@gmail.com        |
| Resend      | account                                      | paulad1.desplechin@gmail.com        |
| GitHub      | org `strickin`                               | paulad1.desplechin@gmail.com        |

Invite links for read-only reviewers (send to investors / partners before Sprint 2 kickoff): **TBD**.

---

## Metrics

- Test coverage (api): …%
- Test coverage (web): …%
- Lighthouse score (prod): …
- p95 latency `/v1/products`: … ms
- p95 latency `/v1/ai/chat`: … ms
- Error rate (Sentry, past 7 days): …

---

## Sprint 2 priorities

- [ ] **Commercial** — sign BNP Paribas contract (**blocks T2.1** — first
      issuer feed)
- [ ] **Infra** — set up Doppler secrets vault + wire both apps
- [ ] **Infra** — migrate Upstash Redis to `eu-west` region
- [ ] **CI/CD** — GitHub Actions: lint · typecheck · build · test · deploy
- [ ] **Perf** — enable `@sentry/profiling-node` once volume justifies it
- [ ] **Compliance** — complete ISO 27001 gap analysis
- [ ] **Docs** — write `docs/api-contract.md` (source of truth for the
      distributor integration)

---

## Retro notes

### What went well
- 

### What went poorly
- 

### Action items carried to Sprint 2
- [ ] <owner> — <task> — due <date>
