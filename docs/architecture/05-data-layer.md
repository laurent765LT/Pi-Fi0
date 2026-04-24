# 05 — Data layer

**Audience** : backend devs, SRE, reviewers de migrations Prisma.
**Prerequisites** : SQL, Prisma migrate, notions de Redis.

---

## 1. Panorama

```
┌─────────────────┐   single-writer   ┌──────────────────────┐
│   NestJS API    │ ──────────────── ▶│ Postgres 16 (Supabase)│
│  (apps/api)     │      Prisma       │ source of truth       │
└──────┬──────────┘                   └───────────────────────┘
       │
       │ ioredis
       ▼
┌─────────────────┐
│ Redis 7 (Upstash)│  cache AI, rate-limit, sessions futures
└──────────────────┘
```

- **Postgres est l'unique source de verite.** Tout ce qui est persistant
  pour des raisons legales ou comptables y vit.
- **Redis est un cache eviction-friendly.** Aucune donnee critique ne doit
  dependre uniquement de Redis. Le `RedisService` NestJS tombe en
  fallback in-memory si Upstash est down (degrade, pas down).
- **Aucun autre store** (pas de S3 metier, pas de DynamoDB, pas d'ES).
  L'introduction d'un store additionnel doit passer par un ADR.

## 2. Postgres — Supabase

### 2.1 Instance

| Champ | Valeur |
| --- | --- |
| Provider | Supabase |
| Region | `aws-eu-west-1` (Ireland) |
| Version | Postgres 16 |
| Connection pooler | pgbouncer (transaction mode) sur `:6543` |
| Direct connection | `:5432` pour migrations et `DIRECT_URL` |

### 2.2 Pourquoi Supabase

Voir [ADR 0012](./decisions/0012-supabase-over-managed-postgres.md).

Raisons cles :
- Residency EU (compliance RGPD).
- Dashboard SQL inclus, pas besoin d'un pgAdmin parallele.
- RLS (Row-Level Security) natif, que l'on active au sprint 4 pour le
  multi-tenant par organisation.
- Backup auto quotidien (retention 7j gratuit, 30j Pro).

### 2.3 Prisma schema

Le schema unique vit dans `apps/api/prisma/schema.prisma`. Principes :

- Ids en `cuid()` (unguessable). Pas d'integer autoinc.
- `onDelete: Restrict` par defaut (securite financiere).
- Exceptions `Cascade` explicites : RefreshToken, AuditLog, AIInteraction,
  ProductFavorite, ProductView, AiRecommendation, RiskMetrics.
  **Jamais** sur Positions / Orders / Contracts (documents legaux).
- Index explicites pour les requetes hot : `User.email` (unique),
  `Product.isin` (unique), `Rfq(status, createdAt)`, `Order.idempotencyKey`
  (unique), `AuditLog.createdAt`, `Position(contractId, clientId)`.

### 2.4 Strategie de migration

#### En dev

```bash
npx prisma migrate dev --name <description_kebab> \
  --schema=apps/api/prisma/schema.prisma
```

- Cree la migration SQL dans `apps/api/prisma/migrations/<timestamp>_<name>/`.
- Applique sur la DB de dev.
- Regenere le client Prisma.

#### En prod

```bash
DATABASE_URL=… DIRECT_URL=… npx prisma migrate deploy \
  --schema=apps/api/prisma/schema.prisma
```

**Toujours AVANT le rollout applicatif.** Le pipeline Railway execute
cette commande dans le `release command` (Dockerfile-free).

#### Backward-compat

Pour une migration avec breaking rename :

1. **Etape 1 (PR 1)** : ajouter le nouveau champ / table, migrer les
   donnees, laisser l'ancien champ en place.
2. **Etape 2 (PR 2)** : changer le code pour ecrire/lire le nouveau.
3. **Etape 3 (PR 3, sprint suivant)** : supprimer l'ancien champ.

Cela garantit qu'un rollback applicatif apres une release ne casse rien.

### 2.5 Seed

`apps/api/prisma/seed.ts` est **idempotent** :

- Utilise `prisma.*.upsert()` partout.
- Peut etre ralace plusieurs fois sans creer de doublons.
- Cree : 3 orgs (1 insurer, 1 broker, 1 admin), 5 users (super admin + CGP
  demo + insurer admin + issuer admin + viewer), 17 produits.

```bash
npm run db:seed
```

Ne pas utiliser en prod — le seed est dev-only. En prod, les donnees sont
creees par l'API via les flows reguliers (onboarding).

### 2.6 Index strategy

| Index | Utilite | Type |
| --- | --- | --- |
| `User.email` | lookup login | unique btree |
| `Product.isin` | lookup produit | unique btree |
| `Rfq(status, createdAt)` | liste RFQ ouvertes recentes | composite |
| `Position(contractId, clientId)` | lookup positions dans contrat | composite |
| `Order.idempotencyKey` | dedup creation order | unique |
| `AuditLog.createdAt` | pagination audit | btree |
| `AIInteraction(userId, createdAt)` | cout IA par user | composite (Sprint 2) |

Principes :
- On ajoute un index **seulement** quand une requete est observee lente
  (via Sentry profiling ou Supabase `pg_stat_statements`).
- On prefere les index composites (col1, col2) en ordre "le plus selectif
  d'abord".
- Les partial indexes (ex : `WHERE status = 'OPEN'`) sont candidats quand
  < 20 % des rows sont selectionnees.

### 2.7 Row-Level Security (RLS)

Non active en Sprint 1 (l'API est single-tenant ISO). Plan Sprint 4 :

- Activer RLS sur chaque table qui a un `orgId`.
- Policy `USING (orgId = current_setting('app.org_id'))`.
- L'API positionne `SET LOCAL app.org_id = '<org>'` au debut de chaque
  transaction via un middleware Prisma.
- Cela fait defense-en-profondeur : un bug de code ne permet pas de lire
  cross-tenant.

### 2.8 Backup et disaster recovery

| Scenario | Strategie |
| --- | --- |
| Data loss < 24h | Restaurer depuis backup Supabase (quotidien). RTO ~15 min. |
| Data loss > 24h | Pre-GA : acceptable. Post-GA : pgBackRest quotidien vers S3 EU + retention 30j. |
| Region Supabase down | Pre-GA : accepter le downtime. Post-GA : standby replica dans un 2e AZ. |
| Corruption logique (ex : mauvaise migration) | Rollback SQL manuel + point-in-time recovery Supabase Pro (requires upgrade). |

Voir [`runbook-incidents.md`](../runbook-incidents.md) scenarios D et E.

## 3. Redis — Upstash

### 3.1 Instance

| Champ | Valeur |
| --- | --- |
| Provider | Upstash |
| Plan | Free (Sprint 1) |
| Region | `us-west-1` — migration prevue Sprint 2 vers `eu-west` |
| Protocole | TLS `rediss://` + REST |
| Quotas | 10 000 commandes/jour, 256 MB max, 3j eviction |

### 3.2 Usages

#### Cache reponses Anthropic

Les reponses Claude sont chere (USD / token). On cache les prompts
deterministes :

| Prefix key | Exemple | TTL |
| --- | --- | --- |
| `ai:underlying:` | `ai:underlying:AAPL` | 4 h |
| `ai:market-sentiment:` | `ai:market-sentiment:CAC40` | 2 h |
| `ai:chat:` | `ai:chat:<hash(prompt)>` | 5 min |
| `ai:esg:` | `ai:esg:<isin>` | 12 h |

Cache key = prompt normalise + modele + version de systeme prompt. Un
changement de prompt invalide automatiquement le cache (hash different).

#### Refresh token blacklist

A la rotation (voir [`07-authentication.md`](./07-authentication.md)),
l'ancien refresh token est ajoute a :

```
blacklist:refresh:<jti> -> "1"  EXPIRE <refresh_ttl>
```

Toute verification refresh lit la blacklist d'abord.

#### Rate limiting

Via `@nestjs/throttler`. Storage Upstash Redis (Sprint 2 — actuellement
in-memory). Endpoints critiques :

- `POST /auth/login` : 10 / minute
- `POST /auth/register` : 5 / heure
- `POST /auth/refresh` : 30 / minute

### 3.3 Pattern degrade

`RedisService` tente un `ping` au startup. Si Upstash est injoignable, il
bascule sur un Map in-memory local avec TTL :

```ts
async get(key: string): Promise<string | null> {
  try {
    return await this.client.get(key);
  } catch {
    return this.memoryCache.get(key) ?? null;
  }
}
```

Consequence : un incident Upstash ralentit l'app (cache miss → Anthropic
systematique) mais ne la prend pas down.

### 3.4 Eviction policy

Upstash configure `allkeys-lru` par defaut. Nos TTLs sont courts (max
12 h), donc l'eviction manuelle est rarement necessaire.

## 4. Queue — BullMQ (Sprint 2)

Prepare dans `package.json` (`bullmq` installe) mais pas encore cable en
Sprint 1. Cas d'usage prevus :

- Envoi d'emails Resend asynchrones.
- Outbox pattern pour events cross-module.
- Jobs de pricing lourds.
- Jobs de reconciliation DocuSign.

Le Redis reste Upstash (meme instance que cache — deconseille en prod ;
Sprint 3 introduit une seconde instance dediee queue).

## 5. Conventions de donnees

### 5.1 Timestamps

- `createdAt` et `updatedAt` sur **toutes** les tables (convention Prisma).
- Stockes en `TIMESTAMPTZ`.
- Manipulation en UTC cote code ; conversion zone user cote presentation.

### 5.2 Soft delete

Pas de soft delete generalise. Un soft delete ad-hoc est utilise pour les
refs legales (`Contract.revokedAt` plutot que `DELETE`).

### 5.3 Normalisation

On normalise (3NF) par defaut. Denormalisation uniquement si :
- Read path a > 1000 req/s observees (mesure, pas anticipation).
- Le join est lent apres index tentatives.

Documenter l'exception dans un commentaire du schema Prisma.

### 5.4 JSON columns

Utilisees pour les payloads opaque :

- `AuditLog.payload` — JSON libre du context action.
- `Product.metadata` — fields specifiques emetteur non normalisables.

**Jamais** utilisee pour stocker un champ normalise (on cree une colonne
plutot).

## 6. Outils

| Outil | Commande | Usage |
| --- | --- | --- |
| Prisma Studio | `npm run db:studio` | Inspection / edition visuelle |
| Supabase SQL editor | dashboard | Requete ad-hoc, explain plan |
| `prisma migrate dev` | `npm run db:migrate` | Dev migrations |
| `prisma migrate deploy` | Railway release cmd | Prod migrations |
| `ts-node prisma/seed.ts` | `npm run db:seed` | Seed dev |

## 7. Fichiers de reference

- Schema : `apps/api/prisma/schema.prisma`
- Migrations : `apps/api/prisma/migrations/`
- Seed : `apps/api/prisma/seed.ts`
- Prisma service : `apps/api/src/common/prisma.service.ts`
- Redis service : `apps/api/src/common/redis.service.ts`
- Runbook incidents DB : `docs/runbook-incidents.md#scenario-d`
