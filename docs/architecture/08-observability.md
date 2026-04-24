# 08 — Observabilite

**Audience** : tous les devs, SRE, on-call.
**Prerequisites** : notions de logs structures, tracing, metrics.

---

## 1. Les trois piliers

1. **Errors / exceptions** : Sentry.
2. **Logs structures** : stdout JSON (shipped Railway / Vercel).
3. **Metrics / traces** : Sentry Performance + custom counters in-app.

Le tout correle par un **request ID** present dans chaque log, chaque
exception Sentry et chaque reponse HTTP (`X-Request-Id`).

## 2. Sentry

### 2.1 Deux projets Sentry

| Projet | Scope |
| --- | --- |
| `strickin` (web) | Next.js, incluant SSR + client + edge middleware. |
| `strickin-api` (api) | NestJS (Node). |

### 2.2 Sample rates

| Type | Sample rate | Raison |
| --- | --- | --- |
| Errors | 100 % | On ne veut pas rater un bug. |
| Traces (performance) | 20 % | Reduction du cout + visibilite des endpoints lents. |
| Session replay (web) | 10 % des sessions ; **100 % des sessions avec erreur** | Debug UX sans exploser le quota. |

### 2.3 PII masking

Obligatoire. Toutes les donnees sensibles sont masquees avant envoi :

```ts
// apps/web/sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend(event) {
    // Strip body of any request that is a password / token endpoint
    if (event.request?.url?.includes('/auth/')) {
      delete event.request.data;
    }
    // Mask email in user identity
    if (event.user?.email) {
      event.user.email = maskEmail(event.user.email);
    }
    return event;
  },
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,       // on mask a la main les elements sensibles
      blockAllMedia: true,
      mask: ['[data-pii]'],     // elements annotes dans le JSX
    }),
  ],
});
```

Annotations dans le code :
```tsx
<input name="iban" data-pii="true" />
<div data-pii="true">{user.email}</div>
```

### 2.4 Data region

Sentry EU (`de.sentry.io`) — Frankfurt. Conforme RGPD.

### 2.5 Release health

Chaque deploy cree une **release Sentry** avec la SHA git :

```
release: strickin-web@<git-sha>
release: strickin-api@<git-sha>
```

Cela permet :
- Detection de regression (nouvelle release = nouvelle error).
- Source map upload (web).
- Stack traces non-minified (api).

Configure via `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT_WEB` /
`SENTRY_PROJECT_API` en build time (Vercel / Railway env vars).

## 3. Logs structures

### 3.1 Format

JSON one-line par log, ecrit sur `stdout` :

```json
{"level":"info","time":1713945600000,"requestId":"req_01H...","userId":"clk1...","orgId":"clk2...","msg":"user.login.success","method":"POST","path":"/api/v1/auth/login","durationMs":145}
```

Keys minimales obligatoires :
- `level` — `debug | info | warn | error`
- `time` — epoch ms
- `msg` — dot-notation stable (`user.login.success`, `rfq.create.failed`)
- `requestId` — correlation cross-service

Keys contextuelles :
- `userId`, `orgId` si connu.
- `method`, `path`, `statusCode`, `durationMs` pour HTTP.
- `error.name`, `error.message`, `error.stack` si `level=error`.
- Tout ajout doit respecter l'interdiction PII.

### 3.2 Implementation

NestJS : un logger Pino-compatible dans `apps/api/src/common/logging/`.

```ts
this.logger.info({ userId, orgId }, 'user.login.success');
```

Next.js : `console.log(JSON.stringify(...))` cote server components + un
wrapper `apps/web/lib/logger.ts` pour les route handlers.

Jamais :
```ts
console.log(`User ${user.email} logged in`); // texte + PII
```

Toujours :
```ts
logger.info({ userId: user.id }, 'user.login.success');
```

### 3.3 Interdiction PII

Les champs suivants ne doivent **jamais** apparaitre dans les logs :
- email (sauf masque)
- password / passwordHash
- IBAN / RIB
- CNI / numero de passport
- numero de carte
- adresse postale complete

Validation manuelle en code review + test regex CI (Sprint 2).

### 3.4 Destination

- Railway agrege stdout + UI de recherche.
- Vercel agrege stdout par fonction serverless.
- Sprint 2 : ship vers un backend dedie (Grafana Loki ou Axiom) pour
  retention 90 jours.

## 4. Request correlation

### 4.1 Generation

Chaque request :
1. Si le header `X-Request-Id` est present (client fourni), on le reutilise.
2. Sinon, on genere un `req_<cuid>` au debut du request lifecycle.

### 4.2 Propagation

- Injecte dans `AsyncLocalStorage` (Node) ou context React (Next RSC).
- Inclus dans tous les logs via le logger context.
- Inclus dans le payload Sentry (`tags.request_id`).
- Inclus dans la reponse HTTP (`X-Request-Id`).
- Inclus dans les reponses d'erreur (RFC 7807, champ `requestId`).

### 4.3 Utilisation pour debug

Un user signale un bug → il donne le `X-Request-Id` de sa requete (visible
dans la devtools) → on retrouve instantanement :
- Les logs API lies.
- L'event Sentry (filtrer par `request_id`).
- La trace Sentry si echantillonee.

## 5. Health endpoints

### 5.1 `GET /health`

**Liveness probe.** Toujours 200 si le process tourne :

```json
{ "status": "ok", "uptimeSeconds": 3600 }
```

Utilise par Railway pour decider si le container est alive.

### 5.2 `GET /ready`

**Readiness probe.** 200 si l'API peut servir du trafic :

```json
{
  "status": "ok",
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "redis": { "status": "ok", "latencyMs": 8 },
    "anthropic": { "status": "ok" }
  }
}
```

Chaque check :
- **database** : `SELECT 1` via Prisma.
- **redis** : `ping`.
- **anthropic** : validation du format de la cle API (pas de round-trip —
  on ne veut pas depenser des tokens a chaque readiness check).

Si un check echoue → 503 avec le status des autres. Le load balancer sort
le pod du pool.

### 5.3 `GET /health/deep` (Sprint 2)

Une version qui fait un round-trip complet par dependance. Scheduled tous
les 5 min depuis un cron, pas a chaque requete.

## 6. Metrics custom

### 6.1 AIInteraction

Chaque appel Anthropic est logge dans la table `AIInteraction` :

| Champ | Utilite |
| --- | --- |
| `userId`, `orgId` | Facturation interne par client. |
| `model` | Version Claude utilisee. |
| `promptTokens`, `completionTokens` | Cout. |
| `latencyMs` | Performance. |
| `cacheHit` | Efficacite du cache. |
| `requestId` | Correlation avec la request HTTP du user. |

Exploration via un dashboard SQL (Supabase dashboard ou Metabase Sprint 3).

### 6.2 Counter hits par endpoint

Sprint 2 : expose un `/metrics` endpoint Prometheus avec :
- `http_requests_total{method,path,status}`.
- `http_request_duration_seconds_bucket{method,path}`.
- `ai_cache_hits_total{service}`.

Scrape par Grafana Cloud ou un Prometheus self-hosted.

## 7. Alerting

### 7.1 Sprint 1 (manuel)

- Email Sentry sur issue **new** ou **regressed** avec filtre level=error.
- Dashboard Sentry passe en revue tous les matins.

### 7.2 Sprint 2 (PagerDuty)

Alertes critiques :

| Alerte | Threshold | Severity |
| --- | --- | --- |
| API error rate > 2 % 5-min | 5 min sustained | P2 |
| API latency p95 > 2s | 10 min sustained | P2 |
| `/ready` down | 1 min | P1 |
| AI budget > 90 % | Daily check | P3 |
| DB CPU > 90 % | 5 min | P2 |
| Login success rate < 90 % | 5 min | P1 |

Integration Sentry → PagerDuty via webhook.

### 7.3 Non-critique (Slack)

- Deploy success / failure → #deploys.
- New issue Sentry → #eng-alerts.
- Release note auto depuis les commits → #eng-releases.

## 8. Dashboards

### 8.1 Admin dashboard

Route : `/admin/system-health`. Accessible aux `ORG_ADMIN` et
`SUPER_ADMIN`. Affiche :
- Statut des checks `/ready`.
- Nombre d'erreurs Sentry 24h.
- Cout Anthropic 24h / 30j.
- Nombre de logins 24h.
- Nombre de RFQs ouvertes / quotes recues.

### 8.2 Sentry

- **Issues** par projet.
- **Performance** — p50, p95, p99 par transaction.
- **Replays** des sessions avec erreurs.

### 8.3 Supabase dashboard

- `pg_stat_statements` pour les requetes lentes.
- Taille DB, connections actives.

## 9. Principes operationnels

1. **Un bug sans log structure ne s'est jamais passe.** Chaque feature
   critique emet au moins un log structure a chaque etape.
2. **Un log sans `requestId` est un log oublie.** Toujours propager.
3. **Jamais de PII dans un log, JAMAIS.** Masquer avant `logger.info()`.
4. **Un alert qui spam = un alert qu'on ignore.** Threshold ajustes a la
   volee.
5. **Release versionnee** pour detecter le "when did it break".

## 10. Fichiers de reference

- Sentry web : `apps/web/sentry.client.config.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts`
- Sentry api : `apps/api/src/common/sentry.init.ts`
- Health controller : `apps/api/src/common/health.controller.ts`
- Logger : `apps/api/src/common/logging/`
- Interceptors : `apps/api/src/common/interceptors/`
