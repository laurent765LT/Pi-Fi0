# ADR 0001 — Monorepo npm workspaces

## Status
Accepted — 2026-03-08

## Context

Strick'in est compose de plusieurs artefacts :

- `apps/web` — Next.js frontend.
- `apps/api` — NestJS backend.
- `apps/cli` — outil CLI (pilote agents, scripting).
- `packages/shared` — types / utils cross-app.
- `packages/design-system` — tokens UI + specs (futur mobile).

Plusieurs equipes (frontend, backend, ops, mobile a venir) contribuent en
parallele. On a besoin de :

- Partager des types (enums, DTOs) entre web et api **sans dupliquer**.
- Garder les changes atomiques (PR qui touche schema backend + consumer
  frontend).
- Publier des releases coordonnees.
- Un workflow de CI qui comprend tous les workspaces.

## Decision

Utiliser **npm workspaces** avec un seul `package.json` racine declarant :

```json
{
  "workspaces": ["apps/api", "apps/web", "apps/cli", "packages/shared"]
}
```

Pas de `turbo`, pas de `nx`, pas de `pnpm`, pas de `lerna` a ce stade.

Tous les workspaces utilisent la meme version de Node (20) et le meme
TypeScript (5.3.x).

## Consequences

### Positives
- **Zero-config** — npm workspace est built-in depuis Node 16.
- **Atomic PRs** — un change de schema Prisma + usage cote frontend peut
  vivre dans une seule PR.
- **Type-safety cross-workspace** — `@strickin/shared` resout en source TS,
  les types sont partages sans build intermediaire.
- **Compatibilite Vercel / Railway** — les deux comprennent nativement
  npm workspaces (root-install + subdir build).

### Negatives
- **Pas de cache de build cross-workspace** (ce qu'apporte turbo). On vit
  avec : les builds sont rapides pre-PMF (~30s).
- **Lint / test unifies** = run sequentiel sans turbo. On script via
  `npm run ... --workspaces`.
- **Hoisting surprise** — npm hoist agressivement les deps communes au
  root. Quelques deps deliberement dupliquees (`typescript` different par
  workspace).

### Neutres
- On peut migrer vers pnpm ou turbo plus tard si un pain point apparait.
  Les `package.json` sont compatibles.
- Les noms `@strickin/*` reservent le scope pour une eventuelle publication
  npm future (interne ou publique).

## Alternatives considered

- **pnpm workspaces**
  - Plus rapide, meilleure isolation.
  - Inconvenient : Vercel support moins mature au moment de la decision ;
    Railway necessite un custom install command.
  - **Rejette** pour garder le deploy zero-config.
- **Turborepo sur npm / pnpm**
  - Cache build / remote cache, graphe d'execution parallele.
  - Overkill pour 3 workspaces + 2 packages.
  - **Rejette pour Sprint 1**, a reconsiderer quand on aura 10+ workspaces.
- **Nx**
  - Ecosysteme riche mais complexity (generators, configs, plugins).
  - **Rejette** — on n'a pas besoin de scaffolding auto.
- **Multi-repo**
  - Un repo par app.
  - **Rejette** — penalise les changes cross-layer, complexifie CI et
    release pre-GA.

## Related
- [ADR 0005 — Prisma](./0005-prisma-over-typeorm.md) — shared schema
  cross-workspace.
- [ADR 0007 — Feature-based frontend](./0007-feature-based-frontend.md)
- [docs/architecture/04-shared-packages.md](../04-shared-packages.md)
