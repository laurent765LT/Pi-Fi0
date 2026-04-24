# 02 — Architecture frontend

**Audience** : devs frontend, reviewers PR sur `apps/web/`.
**Prerequisites** : Next.js App Router, React 18, TanStack Query.

---

## 1. Philosophie : feature-based

Le frontend Strick'in est organise autour des **features metier**, pas autour
des types techniques. Une feature est une tranche verticale qui possede :

- Son UI (components).
- Sa logique d'orchestration (hooks).
- Ses appels API (api).
- Son etat client (store).
- Sa logique metier pure (lib).

C'est le pendant frontend de la **Clean Architecture** backend (voir
[`03-backend-architecture.md`](./03-backend-architecture.md)).

La decision est actee dans [ADR 0007](./decisions/0007-feature-based-frontend.md).

## 2. Carte du territoire

```
apps/web/
  app/                       # Next.js App Router (routes uniquement)
    (app)/                   # Layout groupe "app logue"
      dashboard/
      portfolio/
      ...
    (onboarding)/            # Flows d'inscription / KYC
    api/                     # Route handlers Next (proxy / webhooks rares)
    login/page.tsx           # Fine — delegue a la feature auth
    register/page.tsx
    layout.tsx
    providers.tsx            # QueryClient + Sentry + i18n
  features/                  # Code metier (vertical slices)
    auth/                    # Feature pilote — modele de reference
    onboarding/              # (planifie Sprint 2)
    rfq/                     # (planifie Sprint 2)
    portfolio/               # (planifie Sprint 3)
  shared/                    # Cross-feature (pas d'import depuis features/)
    components/              # Button, Card, Table (re-exports DS)
    hooks/                   # useDebounce, useMediaQuery, ...
    lib/                     # Helpers purs (formatters, parsers)
    types/                   # Types utilises par plusieurs features
  lib/                       # API client, i18n, demo data (legacy — migre progressivement)
  stores/                    # Zustand stores globaux (legacy)
  components/                # Composants legacy non encore feature-ises
  middleware.ts              # Auth cookie guard (Next.js middleware)
  sentry.client.config.ts
  sentry.server.config.ts
```

L'objectif Sprint 2 est de passer 100 % des composants sous `features/` et
de vider `components/` + `stores/` + `lib/` de leur contenu legacy.

## 3. Anatomie d'une feature

```
features/<domain>/
  index.ts              # API publique de la feature (barrel export)
  components/           # Presentation — pure UI
    login-form/
      login-form.tsx
      login-form.test.tsx
      index.ts
  hooks/                # Application — orchestration (TanStack Query, effets)
    use-login.ts
    use-auth.ts
  api/                  # Infrastructure — fetch HTTP
    auth.api.ts
    auth.api.types.ts   # Wire-level types (DTO)
    index.ts
  store/                # Client state (Zustand quand strictement necessaire)
    auth.store.ts
    index.ts
  lib/                  # Domaine pur — pas de React, pas de fetch
    auth.types.ts
    auth.errors.ts
    password-rules.ts
    index.ts
  tests/                # Tests trans-dossier (integration feature)
```

### 3.1 Regle d'or : `index.ts` est l'API publique

Le reste du monde importe **uniquement** depuis `@/features/auth` :

```ts
// BON
import { useAuth, LoginForm, selectIsAuthenticated } from '@/features/auth';

// MAUVAIS — couple le consumer a la structure interne
import { useAuth } from '@/features/auth/hooks/use-auth';
import { LoginForm } from '@/features/auth/components/login-form/login-form';
```

Cela permet de reorganiser l'interieur sans casser les consommateurs.

## 4. Regles d'imports

### 4.1 Matrice de dependance

```
                        ┌─── components
                        │         │
                        │         ▼
                        │     hooks ─────┐
                        │         │       │
                        │         ▼       │
                        │       api       │
                        │         │       │
                        │         ▼       │
                        └────── lib ◀─────┘
                                  │
                                store (optionnel)
```

| De          | Peut importer          | Ne PEUT PAS importer       |
| ----------- | ---------------------- | -------------------------- |
| components  | hooks, lib, types      | api (passer par un hook)   |
| hooks       | api, store, lib, types | components                 |
| api         | lib, types             | hooks, components, store   |
| store       | lib, types             | hooks, components, api     |
| lib         | (rien dans la feature) | tout le reste              |

### 4.2 Regle cross-feature : JAMAIS

```ts
// INTERDIT
// Dans apps/web/features/rfq/hooks/use-rfq.ts
import { useAuth } from '@/features/auth/hooks/use-auth';
```

Une feature ne doit jamais importer d'une autre feature. Si deux features
ont besoin du meme morceau (un composant Button, un hook useDebounce, un
type User), deplacer dans `shared/`.

Exception tolere : le composant de page (`app/**/page.tsx`) peut composer
plusieurs features.

### 4.3 Couches externes

```
@/features/auth  ──►  @/shared     ──►  @strickin/shared   ──►  @strickin/design-system
                                                                    (tokens, utils)
```

Les imports remontent toujours la chaine (jamais descendre).

## 5. Exemple complet : feature `auth`

### 5.1 Structure deployee (Sprint 1 pilote)

```
apps/web/features/auth/
  index.ts                       # export publique
  api/
    auth.api.ts                  # fetch wrapper sur /api/v1/auth/*
    auth.api.types.ts            # types des DTOs
    index.ts
  components/
    auth-guard/                  # HOC composant (redirect si pas logue)
    login-form/
    password-strength/
    register-form/
  hooks/
    use-auth.ts                  # hook principal — wrapper du store + query
    use-login.ts                 # mutation login via TanStack Query
  lib/
    auth.types.ts                # AuthUser, LoginCredentials, AuthResponse
    auth.errors.ts               # InvalidCredentialsError, ...
    password-rules.ts            # contraintes password (longueur, classes)
    index.ts
  store/
    auth.store.ts                # Zustand persist (legacy + demo mode)
    index.ts
  tests/
```

### 5.2 Diagramme de dependances

```
┌──────────────────────────────────────────────────────┐
│  app/login/page.tsx                                  │
└─────────────┬────────────────────────────────────────┘
              │ import { LoginForm, useAuth } from '@/features/auth'
              ▼
┌──────────────────────────────────────────────────────┐
│  features/auth/index.ts  (barrel)                    │
└───┬──────────┬──────────┬──────────┬─────────────────┘
    ▼          ▼          ▼          ▼
components   hooks       api       store
    │          │          │          │
    │          │          │          │
    ▼          ▼          ▼          ▼
                    lib (password-rules, auth.types)
                    │
                    ▼
            @strickin/shared (UserRole, OrgType)
            @strickin/design-system (tokens)
```

### 5.3 Flow complet : login

```
1. user soumet LoginForm (components)
2. LoginForm appelle useLogin() (hooks)
3. useLogin est un useMutation TanStack qui appelle authApi.login() (api)
4. authApi fait POST /api/v1/auth/login avec credentials
5. on success → store.setUser() + navigation redirect
6. useAuth() selectors exposent l'etat aux autres composants
```

## 6. Zustand : quand et comment

### 6.1 Quand

- Etat **client-only** partage entre composants deconnectes dans l'arbre
  (user courant, panier, theme).
- Etat qui doit survivre a un remount (persist middleware).

### 6.2 Quand NE PAS utiliser Zustand

- Donnees qui viennent du serveur → **TanStack Query** (cache + revalidation).
- Etat local a un composant → `useState` / `useReducer`.
- Etat UI temporaire (modale ouverte, dropdown) → `useState` ou colocaliser
  dans le composant parent.

### 6.3 Forme canonique

```ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (credentials) => { /* ... */ },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'strickin-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

// Selectors stables — evite rerenders sur changements non-lies
export const selectIsAuthenticated = (s: AuthState) =>
  s.token !== null && s.user !== null;
```

Le store est une boite noire : les composants l'appellent via des selectors
stables, pas via `useAuthStore()` qui retournerait l'etat entier.

## 7. TanStack Query : conventions

### 7.1 Query keys

Format tuple hierarchique :

```ts
// BON
['products', 'list', { issuer: 'BNP' }]
['products', 'detail', productId]
['rfq', 'list', { status: 'open' }]

// MAUVAIS
'products-list-BNP'      // impossible a invalider partiellement
```

### 7.2 Helpers par feature

Chaque feature expose son propre factory de keys :

```ts
// features/rfq/api/rfq.keys.ts
export const rfqKeys = {
  all: ['rfq'] as const,
  lists: () => [...rfqKeys.all, 'list'] as const,
  list: (filters: RfqFilters) => [...rfqKeys.lists(), filters] as const,
  details: () => [...rfqKeys.all, 'detail'] as const,
  detail: (id: string) => [...rfqKeys.details(), id] as const,
};
```

### 7.3 Mutations + invalidation

```ts
export function useCreateRfq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRfqInput) => rfqApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rfqKeys.lists() });
    },
  });
}
```

## 8. Server Components vs Client Components

| Regle | Raison |
| --- | --- |
| Par defaut : **Server Components** | Meilleur TTFB, moins de JS envoye. |
| `'use client'` en haut d'un fichier | Declarer explicitement. Obligatoire des qu'on utilise `useState`, `useEffect`, Zustand, TanStack Query. |
| Pages publiques (login, register, marketing) | Server Components + islands de client. |
| Pages authentifiees avec etat | Root layout logue = server + providers client. |

**Pattern d'isolation** : un composant client reste le plus petit possible ;
les parents restent serveurs :

```tsx
// app/rfq/page.tsx (Server Component)
import { RfqListClient } from '@/features/rfq';

export default async function RfqPage() {
  // pre-fetch cote serveur si auth cookie dispo
  return <RfqListClient />;
}
```

## 9. Anti-patterns

### 9.1 Colonne infinie de `useEffect`

Anti-pattern :
```tsx
useEffect(() => {
  fetch('/api/...').then(setData);
}, []);
```

Bon :
```tsx
const { data } = useQuery({ queryKey, queryFn });
```

### 9.2 Store qui fait du fetch

Anti-pattern :
```ts
// Zustand store
login: async (credentials) => {
  const response = await fetch('/auth/login', { body: JSON.stringify(credentials) });
  // ... contact direct avec HTTP
}
```

Bon : le store delegue a la couche `api/` de la feature. Le store orchestre,
il ne parle pas HTTP.

### 9.3 Import relatif qui traverse la feature

Anti-pattern :
```ts
import { something } from '../../../other-feature/lib/whatever';
```

Bon :
```ts
import { something } from '@/shared/lib/whatever';
// ou promouvoir dans @strickin/shared
```

### 9.4 Oubli du `'use client'`

Erreur explicite a build-time ("You're importing a client component") →
ajouter la directive en haut du fichier.

## 10. Tests

- Unit (colocalise) : `login-form.test.tsx` a cote de `login-form.tsx`.
- Integration (feature) : `features/auth/tests/`.
- E2E (Playwright) : `apps/web/e2e/` — teste les routes.

Voir [`09-testing-strategy.md`](./09-testing-strategy.md) pour la pyramide
complete.

## 11. Fichiers de reference

- Feature pilote : `apps/web/features/auth/`
- Barrel exemple : `apps/web/features/auth/index.ts`
- Store legacy avec doc `@deprecated` : `apps/web/features/auth/store/auth.store.ts`
- Middleware Next : `apps/web/middleware.ts`
