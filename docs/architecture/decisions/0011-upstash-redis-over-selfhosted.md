# ADR 0011 — Upstash Redis plutot que self-hosted

## Status
Accepted — 2026-03-08

## Context

L'API Strick'in a besoin d'un Redis pour :
- Cache des reponses Anthropic (TTL 2-12h).
- Blacklist de refresh tokens revokes.
- Rate limiting (Sprint 2, actuellement in-memory).
- Queue BullMQ (Sprint 2).

Contraintes :
- Pas d'equipe SRE dediee (on est pre-PMF, Sprint 1).
- Budget limite (free tier prefere).
- Deploy Railway (backend) — cherche quelque chose serverless-friendly.
- Residency EU souhaitee (pas bloquant pour un cache non-PII).

Candidats : **Upstash**, **Redis Cloud**, **ElastiCache**, self-hosted
(docker sur VPS, Railway plugin).

## Decision

Utiliser **Upstash Redis 7** sur le free tier, DB `rested-ladybug-72557`.

Protocole : TLS `rediss://` + API REST (utile pour les edge functions
futures).

Region actuelle : `us-west-1`. **Migration prevue Sprint 2** vers
`eu-west` pour reduire la latence et ameliorer la compliance.

Quotas free :
- 10 000 commandes/jour.
- 256 MB storage max.
- 3 jours eviction.

Fallback in-memory : `RedisService` maintient un `Map<string, Entry>`
local si Upstash est injoignable, pour ne pas take-down l'API.

## Consequences

### Positives
- **Zero ops** — pas de server a monitor / patcher.
- **Serverless pricing** — pay-per-command, free tier genereux pour un
  demarrage.
- **TLS native** + auth token rotatif.
- **REST API** — utile pour edge functions Vercel / Cloudflare.
- **Dashboard** avec metrics et data browser.
- **Backup auto** + retention.

### Negatives
- **Quotas stricts** — 10k commandes/jour free. On a observe des pics a
  3k/jour en Sprint 1. Migration au plan Pay-As-You-Go prevue Sprint 2.
- **Latence EU-US** — ~120 ms extra aujourd'hui. Acceptable pour du cache
  mais degrade le rate limiting. Migration eu-west prevue Sprint 2.
- **Pas de Redis Lua scripts avances** sur free (limite).
- **Vendor lock-in** partiel — on utilise l'API Redis standard, donc
  migrable vers Redis Cloud / self-hosted sans toucher au code. Seules
  les REST APIs specifique a Upstash seraient a reecrire.

### Neutres
- La memoire 256 MB suffit largement (on stocke du cache JSON compact).
- Si on depasse le free, $0.20 / 100 K commandes, $0.25 / GB egress. Predictable.

## Alternatives considered

- **Redis Cloud (Redis Inc.)**
  - Le "vrai" Redis managed, support premium.
  - Plus cher, pas de tier completement gratuit.
  - **Rejette** — overkill pre-PMF.
- **AWS ElastiCache**
  - Integrated avec l'ecosysteme AWS.
  - On n'a **pas** d'ecosysteme AWS (Vercel + Railway + Supabase).
  - Prix fixe (pas serverless), setup VPC.
  - **Rejette** — ne colle pas a notre stack.
- **Self-hosted sur Railway**
  - Plugin Railway Redis natif.
  - Rapide, facile.
  - On paie l'instance continue meme si inactif.
  - Pas de tier completement gratuit.
  - **Considere comme fallback** si Upstash fail, retenu comme alternative
    documentee.
- **Dragonfly**
  - Compatible Redis, meilleures perfs en single-node.
  - Plus jeune, moins adopte.
  - Disponible via Upstash Pro plan.
  - **Rejette** — pas d'urgence perf.
- **In-memory only (Map local)**
  - Zero infra.
  - Pas partage entre instances API.
  - **Rejette** — on prevoit N=2+ instances Railway en staging.

## Related
- [docs/architecture/05-data-layer.md#3-redis-upstash](../05-data-layer.md)
- [docs/infra.md#2-upstash-redis-7](../../infra.md)
- [apps/api/src/common/redis.service.ts](../../../apps/api/src/common/redis.service.ts)
