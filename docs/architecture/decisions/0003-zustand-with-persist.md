# ADR 0003 — Zustand + persist middleware

## Status
Accepted — 2026-03-08

## Context

Le frontend a besoin d'un store client pour quelques cas cibles :

- **Auth** : user + token persistes entre navigations et rechargements.
- **Demo mode** : comptes fictifs + flag isDemo.
- **Panier futur** : commitments selectionnes avant confirmation.
- **Preferences UI** : theme, langue, filtres persistants.

Contraintes :
- Compatible **App Router** (client components uniquement).
- Minimal boilerplate.
- Support de **persistance** (localStorage).
- TypeScript strict.

**Important** : on ne met **pas** les donnees serveur dans le store. Celles-ci
vivent dans TanStack Query (voir [ADR 0004](./0004-tanstack-query-over-swr.md)).

## Decision

Utiliser **Zustand** avec le middleware `persist` pour l'etat client-only.

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'strickin-auth',
      partialize: (state) => ({ user, token, refreshToken, isDemo }),
    },
  ),
);
```

Regles :
- **Pas de fetch** dans le store — le store orchestre, il n'est pas un
  client HTTP.
- **Selectors stables exportes** (`selectIsAuthenticated`) — evite les
  rerenders.
- **`partialize`** obligatoire pour ne persister que ce qui est necessaire
  (pas les tokens sensibles en prod post-sprint-2).

## Consequences

### Positives
- **Boilerplate minimum** — `create` + hook, c'est tout.
- **Hooks only** — pas de `<Provider>` a mettre dans le tree, pas de
  Context.
- **Selectors** — granularite fine des re-renders.
- **Persist built-in** — localStorage sans code custom.
- **TypeScript first** — types inferes correctement.

### Negatives
- **Pas de devtools integres Redux-style** — il y a un middleware devtools
  mais moins riche que Redux DevTools.
- **SSR / RSC warnings** — localStorage n'existe pas cote serveur, on doit
  skipper la lecture SSR (`persist` gere mais affiche un warning parfois).
- **Facile a mal utiliser** — un dev peut mettre une fonction async qui
  fetch, coupler store + HTTP. Le guideline (voir `02-frontend-architecture.md`)
  interdit ce pattern.

### Neutres
- On migre si on a besoin d'un vrai time-travel debugger ou d'un workflow
  "saga" complexe.
- La cookie `strickin-auth` ecrit en // du store n'est pas geree par
  Zustand — c'est un hack temporaire pour que le middleware Next.js lise
  l'etat auth (localStorage indispo cote middleware edge). A remplacer
  par du server-side state Sprint 2.

## Alternatives considered

- **Redux Toolkit**
  - Ecosysteme mature, DevTools riche, RTK Query.
  - **Rejette** — trop de boilerplate pour notre scope. On aurait un
    store massif uniquement pour des donnees simples.
- **Jotai**
  - Atoms bas-niveau, tres flexible.
  - **Rejette** — philosophie "atomique" trop granulaire pour ce qu'on a
    a stocker ; courbe d'apprentissage superieure.
- **React Context + useReducer**
  - Built-in, pas de dep.
  - **Rejette** — re-renders du tree entier des qu'une valeur change. Pas
    de persist natif.
- **Valtio**
  - Proxy-based, tres ergonomic.
  - **Rejette** — moins d'adoption, DX differente.
- **TanStack Query pour l'auth**
  - On pourrait utiliser le queryClient comme store.
  - **Rejette** — TanStack Query est prevu pour du server state, pas de
    l'etat user UI (auth tokens, demo mode).

## Related
- [ADR 0002 — Next.js App Router](./0002-nextjs-app-router.md)
- [ADR 0004 — TanStack Query](./0004-tanstack-query-over-swr.md)
- [docs/architecture/02-frontend-architecture.md#6-zustand-quand-et-comment](../02-frontend-architecture.md)
