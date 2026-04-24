# ADR 0004 — TanStack Query plutot que SWR

## Status
Accepted — 2026-03-08

## Context

Le frontend fait beaucoup de lectures serveur : liste produits, detail
produit, quotes, portfolio, audit logs. On veut :

- **Cache** cote client pour UX reactif.
- **Revalidation** automatique (focus, reconnection, interval).
- **Mutations** avec optimistic updates.
- **Invalidation** ciblee (cle hierarchique).
- **Devtools** pour debugger le cache.

Deux leaders de l'ecosysteme React : **SWR** (Vercel) et **TanStack Query**
(anciennement React Query, Tanner Linsley).

## Decision

Utiliser **TanStack Query 5** (`@tanstack/react-query`) pour toutes les
lectures et mutations serveur.

```ts
const { data, error, isLoading } = useQuery({
  queryKey: productKeys.detail(id),
  queryFn: () => productApi.getById(id),
});

const mutation = useMutation({
  mutationFn: (input) => productApi.create(input),
  onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
});
```

Chaque feature expose ses `queryKey` factory :

```ts
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (f: ProductFilters) => [...productKeys.lists(), f] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};
```

## Consequences

### Positives
- **Devtools** — extensions navigateur + composant in-app excellent pour
  voir le cache, les queries en flight, le dispatcher d'invalidation.
- **Mutations avec `onMutate` / `onSuccess` / `onError`** — patterns
  optimistic updates simple.
- **Query keys hierarchiques** — invalidation partielle triviale
  (`invalidateQueries({ queryKey: ['products'] })` invalide toutes les
  listes et details).
- **Prefetching** — cote server pour RSC : `queryClient.prefetchQuery` +
  hydrate cote client.
- **Retry / backoff** configurables par query.
- **`placeholderData` + `keepPreviousData`** — UX sans flash lors des
  changements de pagination.
- **Typing superieur** — TS infer les types correctement avec query keys
  tupled.

### Negatives
- **Bundle size** — ~13 kB gzipped (vs SWR ~5 kB). Negligeable a notre
  echelle.
- **Courbe d'apprentissage** — plus d'API (queries, mutations, queryClient,
  prefetch, hydrate, invalidate, ...).
- **Config globale** — besoin d'un `<QueryClientProvider>` en root.

### Neutres
- Le code TanStack Query est plus verbeux que SWR, mais ca rend explicite
  ce qui se passe.

## Alternatives considered

- **SWR**
  - Plus leger, API minimaliste (`useSWR`).
  - Invalidation moins ergonomic (pas de query key hierarchiques).
  - Mutations moins riches (pas de `onSettled` etc).
  - **Rejette** — manque de flexibilite pour nos besoins complexes
    (optimistic updates sur RFQ, invalidation cascade apres un accept).
- **Apollo Client**
  - Necessite GraphQL, qu'on n'a pas (REST JSON, voir
    [06-api-contracts.md](../06-api-contracts.md)).
  - **Rejette**.
- **useEffect manual fetch + useState**
  - Re-implementer le cache, le dedup, le retry, l'invalidation, la
    revalidation on focus.
  - **Rejette** — reinvention lourde avec bugs garantis.
- **RSC only / pas de client cache**
  - Server Components qui fetchent tout. Le router Next.js a un cache.
  - **Rejette** — les donnees user-specific (dashboard, portfolio) ne
    beneficient pas du cache server, et les mutations interactives ont
    besoin de cache client.

## Related
- [ADR 0002 — Next.js App Router](./0002-nextjs-app-router.md)
- [ADR 0003 — Zustand](./0003-zustand-with-persist.md)
- [docs/architecture/02-frontend-architecture.md#7-tanstack-query-conventions](../02-frontend-architecture.md)
