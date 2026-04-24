# ADR 0007 — Feature-based frontend

## Status
Accepted — 2026-04-10

## Context

Le frontend `apps/web` commence a souffrir d'une organisation par
**type de code** plutot que par **feature metier** :

```
apps/web/
  components/   # tous les composants de toutes les features
  hooks/        # tous les hooks
  stores/       # tous les Zustand stores
  lib/          # API client + utils
```

Symptomes :
- Pour comprendre la feature "auth", un nouveau dev doit ouvrir 4 dossiers
  (`components/login-form.tsx`, `hooks/use-auth.ts`, `stores/auth-store.ts`,
  `lib/api/auth.ts`).
- Pour supprimer une feature, il faut traquer tous les fichiers disperses.
- Les imports cross-feature sont faciles et invisibles ("hook qui import
  d'un store d'une autre feature").
- Le coupling augmente avec la taille du repo.

Le frontend grandit : auth, onboarding, products, rfq, portfolio,
commitments, pricing, notifications, admin. 8+ features a venir.

## Decision

Reorganiser `apps/web/` autour de **features metier** verticales :

```
apps/web/
  app/                     # Next.js App Router (routes seulement)
  features/                # features metier (vertical slices)
    auth/                  # pilote
      components/
      hooks/
      api/
      store/
      lib/
      index.ts             # API publique
    onboarding/
    rfq/
    portfolio/
  shared/                  # cross-feature (components, hooks, lib, types)
  lib/                     # legacy (migration progressive)
  stores/                  # legacy
  components/              # legacy
```

Chaque feature possede :
- **`components/`** — UI presentation.
- **`hooks/`** — orchestration (TanStack Query, effets).
- **`api/`** — fetch HTTP vers `/api/v1/<feature>/*`.
- **`store/`** — Zustand quand necessaire (client state persistant).
- **`lib/`** — domain logic pur (types, errors, rules).
- **`index.ts`** — barrel, unique API publique.

Regles :
1. Une feature n'importe **jamais** d'une autre feature. Pour partager,
   promouvoir dans `shared/`.
2. L'import passe toujours par `@/features/<name>` (l'`index.ts`).
3. Dependency rule interne : `components → hooks → api/store → lib`.

Strategy de migration :

- **Sprint 1** : pilote `features/auth/`.
- **Sprint 2** : `features/onboarding/`, `features/rfq/`.
- **Sprint 3** : `features/portfolio/`, `features/products/`.
- **Sprint 3-4** : migrer le reste + vider `components/`, `stores/`, `lib/`
  legacy.

## Consequences

### Positives
- **Onboarding dev** — pour comprendre une feature, un dossier.
- **Couplage visible** — tenter d'importer `features/rfq` depuis
  `features/auth` saute aux yeux en review.
- **Suppression facile** — une feature = un dossier, `rm -rf`.
- **Parallel work** — deux devs travaillent sur deux features sans
  conflit de fichiers.
- **Test colocalise** — `login-form.test.tsx` a cote de `login-form.tsx`.
- **Symmetric avec Clean Arch backend** (ADR 0006) — pedagogique.

### Negatives
- **Duplication initiale** — deux features qui ont besoin d'un utilitaire
  similaire le dupliquent jusqu'a promotion dans `shared/`.
- **Migration progressive** — pendant 2-3 sprints, deux organisations
  coexistent.
- **Discipline requise** — facile de ceder et faire un import cross-feature
  "juste pour cette fois".

### Neutres
- Le dossier `shared/` risque de grossir. A auditer regulierement (on
  promeut un utilitaire en `shared/` seulement quand > 2 consumers).
- Certains composants tres horizontaux (Table, Modal, Button) vivront
  dans `@strickin/design-system` ou `shared/components/`.

## Alternatives considered

- **Garder l'organisation par type**
  - Familiaire.
  - Degenere avec la taille. Pas d'isolation.
  - **Rejette**.
- **Atomic design (atoms / molecules / organisms / templates / pages)**
  - Convient pour un design system, pas pour un SaaS metier.
  - **Rejette** — cree des frictions quand on veut modifier la feature "RFQ"
    (molecule RFQ pour widget, organism pour section, ...).
- **One folder per route (Next.js convention)**
  - L'`app/` dossier porte la logique.
  - **Rejette** — couple l'URL a l'organisation code. Si l'URL change,
    le dossier aussi.

## Related
- [ADR 0002 — Next.js App Router](./0002-nextjs-app-router.md)
- [ADR 0003 — Zustand](./0003-zustand-with-persist.md)
- [ADR 0004 — TanStack Query](./0004-tanstack-query-over-swr.md)
- [ADR 0006 — Clean Architecture backend](./0006-clean-architecture-backend.md)
- [docs/architecture/02-frontend-architecture.md](../02-frontend-architecture.md)
