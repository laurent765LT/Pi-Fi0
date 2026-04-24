# ADR 0014 — Strategie de feature flags

## Status
Accepted — 2026-04-10

## Context

Strick'in va introduire des features risquees (nouveau moteur de pricing,
changements de workflow RFQ, changement de provider IA, extensions
regulatoires). On veut :

- Deployer en continu sans attendre la completion d'une feature.
- Activer / desactiver une feature sans nouveau deploy.
- Faire du canary release (1 %, 10 %, 50 %, 100 %).
- Rollback rapide en cas de probleme.
- Feature flags visibles en audit trail.

Candidats :
- **LaunchDarkly** — leader du marche, premium.
- **Flagsmith** — open source + cloud, moins cher.
- **Vercel Edge Config** — integration Next native.
- **Custom simple** — table DB + env vars.

## Decision

**Approche par etages, progressive** :

### Niveau 1 (Sprint 1, actuel) — Env vars + static flags

Flags statiques dans `apps/api/src/common/feature-flags.ts` :

```ts
export const featureFlags = {
  USE_CLEAN_ARCH_USERS: true,
  USE_REAL_RFQ_ENGINE: false,
  ENABLE_AI_RECOMMENDATIONS: process.env.ENABLE_AI_RECO === 'true',
  DEMO_MODE: process.env.NEXT_PUBLIC_USE_REAL_API === 'false',
} as const;
```

Exposes au frontend via `GET /api/v1/flags` (auth obligatoire).

Changes via deploy (toggle env var Railway + redeploy).

### Niveau 2 (Sprint 2) — DB-backed flags

Table `FeatureFlag(key, enabled, rolloutPercent, targetOrgIds, createdAt)`.

Evaluation server-side :
```ts
await flags.isEnabled('feature-key', { userId, orgId });
```

Permet rollouts par organisation et par pourcentage. Change via admin
UI `/admin/feature-flags`.

### Niveau 3 (Sprint 4+) — Managed provider

Si le nombre de flags depasse ~20 avec des rollouts complexes, migrer
vers **Flagsmith** (cloud EU) ou **LaunchDarkly**.

## Consequences

### Positives
- **Deploy continu** — une feature en cours de dev ne bloque pas le merge.
- **Kill switch** — en cas d'incident, off via env var sans redeploy
  (Niveau 2+).
- **A/B testing** — rollout par pourcentage (Niveau 2+).
- **Scoping** — activer pour un org pilote (Niveau 2+).
- **Audit trail** — les changes de flag loggent dans `AuditLog` (Niveau 2+).

### Negatives
- **Flags dead weight** — si on oublie de cleanup un flag apres rollout
  complet, il traine dans le code. Regle : chaque flag a un owner + une
  date expiration dans `FEATURE_FLAGS.md`.
- **Complexite code** — `if (flags.isEnabled(...))` a plusieurs endroits
  rend le flow moins lineaire.
- **Latence** (Niveau 2+) — evaluation flag = 1 query DB. Mitigation :
  cache memoire de 30s.
- **Niveau 1 limite** — pas de granularite. Un flag est on/off pour tout
  le monde. OK pour la plupart des cas pre-PMF.

### Neutres
- La strategy evolue avec la taille de l'equipe et le nombre de features
  en vol simultane.

## Regles d'hygiene

1. **Un flag a un ticket** — cree dans le backlog avec criteria de
   suppression ("quand X users actifs sur la nouvelle UX").
2. **Un flag a un owner** — dans `FEATURE_FLAGS.md` (Sprint 2).
3. **Un flag a une date** — revue trimestrielle : flags > 6 mois sans
   change = suspicious.
4. **Flag = boolean** par defaut. Si un flag a besoin de variants
   multiples, c'est une config, pas un flag.
5. **Flag = **business decision**, pas **technical detail**. On ne met
   pas un flag pour chaque refactor.

## Alternatives considered

- **LaunchDarkly directement Sprint 1**
  - Premium, $10+/mo et scale rapidement.
  - **Rejette** — overkill pour 3 flags initiaux.
- **Flagsmith directement Sprint 1**
  - Cloud EU, open source option self-hosted.
  - **Rejette pour Sprint 1**, planifie Sprint 4 si besoin.
- **Pas de flags, deploy seulement**
  - Simple.
  - Pas de kill switch, rollbacks plus lents.
  - **Rejette** — les features risquees necessitent un kill switch.
- **Branching git long-lived**
  - On merge quand c'est fini, pas besoin de flag.
  - Merge conflicts massifs, integration delayed.
  - **Rejette** — on prefere trunk-based + flags.

## Related
- [ADR 0006 — Clean Architecture backend](./0006-clean-architecture-backend.md)
  — flag `USE_CLEAN_ARCH_USERS` pendant la migration.
- [docs/architecture/10-deployment.md](../10-deployment.md)
- [docs/architecture/01-overview.md#56-progressive-enhancement-via-feature-flags](../01-overview.md)
