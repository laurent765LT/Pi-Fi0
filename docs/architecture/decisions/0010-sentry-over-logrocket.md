# ADR 0010 — Sentry plutot que LogRocket

## Status
Accepted — 2026-03-08

## Context

On a besoin d'un outil de **monitoring frontend + backend** avec :

- Capture automatique des erreurs JS (uncaught, promises rejected).
- Capture des exceptions backend Node.
- Stack traces avec source maps (prod minified).
- Correlation request ID cross-service.
- Session replay (UX debugging).
- Performance tracing (optionnel).
- **Residency EU** (compliance RGPD — voir [01-overview.md](../01-overview.md)).

Candidats : **Sentry**, **LogRocket**, **Datadog**, **Honeybadger**,
**Bugsnag**.

## Decision

Utiliser **Sentry** (organization `strickin`, EU region `de.sentry.io`)
avec deux projects :

- `strickin` — Next.js (web), client + SSR + edge.
- `strickin-api` — NestJS (api).

Sample rates :
- Errors : 100 %.
- Traces (performance) : 20 %.
- Session replay : 10 % des sessions, **100 % des sessions avec erreur**.

PII masking via `beforeSend` hook + Replay `mask: ['[data-pii]']`.

Source maps upload a chaque build (via `SENTRY_AUTH_TOKEN`).

Release versionnee sur chaque deploy (git SHA).

## Consequences

### Positives
- **Gratuit** jusqu'au plan Developer (5k errors/mo, 10k transactions,
  50 replays). Suffisant pre-PMF.
- **EU data region** — Frankfurt. RGPD compliant.
- **Excellent DX** — SDK Next.js officiel avec tout pre-configure.
- **Session replay** — UX debugging sans screen recording user.
- **Release health** — regression detection apres deploy.
- **Integrations** — Slack, PagerDuty, Linear (bug report auto).
- **Performance profiling** (optionnel, Sprint 2 avec `@sentry/profiling-node`).

### Negatives
- **Sample rate obligatoire** — a 100 % de traces on exploserait le quota
  gratuit. On accepte de rater 80 % du fil performance.
- **PII leak possible** — si on oublie un `beforeSend`, une IBAN peut
  leak. Discipline code review + tests.
- **Vendor lock-in** partiel — SDK Sentry specifique. Migration vers un
  autre outil necessiterait de reconfigurer les integrations.
- **Volume errors sur free** — 5k/mois peut etre atteint tot si un bug
  spam. Rate limiting client-side via `ignoreErrors` + `beforeSend`.

### Neutres
- On peut upgrader au plan Team ($26/mo) quand le volume le demande.
- Le plan Business ($80/mo) inclut SSO SAML — a considerer Sprint 5.

## Alternatives considered

- **LogRocket**
  - Session replay superieur (sauveguarde tout par defaut).
  - Pas de backend error tracking natif → besoin d'un 2e outil.
  - Plus cher a notre scale.
  - **Rejette** — pas de couverture backend.
- **Datadog RUM + APM**
  - Stack unifiee metrics + logs + traces + errors.
  - Prix : premium, out of budget pre-PMF.
  - **Rejette pour Sprint 1**, revisiter Sprint 5+.
- **Honeybadger**
  - Simple, pas cher.
  - Moins d'ecosysteme d'integrations.
  - **Rejette** — moins mature sur Next.js SSR.
- **Bugsnag**
  - Similaire a Sentry, historique plus long.
  - Prix moins competitif, moins d'activite open source.
  - **Rejette** — Sentry a meilleur SDK Next.js.
- **Rollbar**
  - OK, moins populaire ces annees.
  - **Rejette**.

## Related
- [docs/architecture/08-observability.md](../08-observability.md)
- [apps/web/sentry.client.config.ts](../../../apps/web/sentry.client.config.ts)
- [apps/api/src/common/sentry.init.ts](../../../apps/api/src/common/sentry.init.ts)
- [docs/infra.md#4-sentry](../../infra.md)
