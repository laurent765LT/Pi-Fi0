# ADR 0012 — Supabase plutot que RDS / Neon

## Status
Accepted — 2026-03-08

## Context

On a besoin d'une instance **Postgres managee** pour le backend. Criteres :

- **Residency EU** obligatoire (RGPD, donnees CGPs et clients).
- **Managed** — pas d'equipe SRE dediee.
- **Plan gratuit** pour le demarrage pre-PMF.
- **Compatible Prisma** (voir [ADR 0005](./0005-prisma-over-typeorm.md)).
- **Connection pooling** (pgbouncer) — eviter les "too many connections".
- **Backup auto** + point-in-time recovery quand on upgrade.
- **Dashboard SQL** pour operations ad-hoc.

Candidats : **Supabase**, **Neon**, **AWS RDS**, **Railway Postgres**,
**Azure Postgres**.

## Decision

Utiliser **Supabase** (Postgres 16) comme DB principale.

| Champ | Valeur |
| --- | --- |
| Projet | `wdkzzbndfulkjclyulxf` |
| Region | `aws-eu-west-1` (Ireland) |
| Plan | Free tier (500 MB DB, 5 GB bandwidth) |
| Pooler | pgbouncer transaction mode sur `:6543` |
| Direct | `:5432` pour migrations Prisma |

On utilise Supabase **uniquement pour Postgres** a ce stade :
- Pas d'Auth Supabase (on a notre propre JWT, voir [ADR 0009](./0009-jwt-refresh-rotation.md)).
- Pas de Supabase Storage (l'API gere les uploads via Resend / S3 plus
  tard).
- Pas de Supabase Edge Functions (on a NestJS sur Railway).
- Pas de Realtime (pas de use case temps reel pre-Sprint 4).

Row-Level Security : **active Sprint 4** quand on fera du vrai multi-tenant
par organisation.

## Consequences

### Positives
- **EU data residency** — Ireland, clair pour RGPD.
- **Dashboard SQL inclus** — pas besoin de pgAdmin ou DBeaver pour les
  operations rapides.
- **pgbouncer inclus** — configurer un pooler externe serait un hassle.
- **Backups quotidiens** gratuits (retention 7j, Pro donne 30j + PITR).
- **Gratuit pour demarrer** — 500 MB DB suffit pre-PMF.
- **Migration lisse vers Pro** ($25/mo) quand les quotas sautent — pas
  de refactor.
- **Ecosysteme Supabase** — on peut adopter progressivement Storage,
  Realtime, Edge Functions si besoin.

### Negatives
- **Pause auto apres 7 jours d'inactivite** (free tier) — un projet dormi
  necessite un reveil manuel. Pas un probleme en dev actif.
- **Quota bandwidth** — 5 GB/mois free. A watcher si on push beaucoup
  de seed data ou si on fait des restores.
- **Vendor lock-in** mesure — Postgres standard, pas de proprietary
  features. Migration vers RDS / Neon possible.
- **Region fixe** — une fois cree, on ne peut pas changer de region sans
  recreer le projet.

### Neutres
- Supabase Auth est tentante mais on l'evite pour garder le controle du
  flow d'onboarding B2B (KYC, roles custom).
- L'extension `pg_stat_statements` est dispo pour profiling SQL — utilisee
  en [08-observability.md](../08-observability.md).

## Alternatives considered

- **Neon**
  - Postgres serverless avec branching.
  - Free tier sympa.
  - Au moment de la decision (mars 2026) : moins d'EU regions, plus
    jeune, Prisma compat OK mais moins documentee.
  - Plus adapte pour des workflow branching DB (dev ephemera).
  - **Rejette** — Supabase plus etabli a ce stade.
- **AWS RDS**
  - Gold standard managed Postgres.
  - Plus cher, pas de free tier >12 mois.
  - Setup VPC plus complexe (Railway ne vit pas dans le meme VPC).
  - **Rejette** — overkill pour Sprint 1.
- **Railway Postgres plugin**
  - Co-localise avec le backend, latence minimale.
  - Pas de backup automatique robuste.
  - Quotas storage limites.
  - **Rejette** — manque la robustesse backup.
- **Azure Postgres**
  - OK si on etait sur Azure.
  - **Rejette** — on n'est pas sur Azure.
- **Self-hosted sur VPS (Hetzner / DigitalOcean)**
  - Controle total, tres pas cher.
  - SRE charge : patch PG, backups, monitoring, HA.
  - **Rejette** — pas d'equipe SRE.

## Related
- [ADR 0005 — Prisma](./0005-prisma-over-typeorm.md)
- [ADR 0011 — Upstash Redis](./0011-upstash-redis-over-selfhosted.md)
- [docs/architecture/05-data-layer.md](../05-data-layer.md)
- [docs/infra.md#1-supabase-postgresql-16](../../infra.md)
