# `lib/api/` — Typed HTTP client + resource modules

Sprint 1 T1.4 (Vagues A + B). This folder hosts the Strick'in frontend's
unified API layer: one HTTP client, one resource module per domain, and a
shared type surface. TanStack Query hooks in `apps/web/hooks/use-*` wrap each
resource with demo-mode fallbacks.

## Layout

```
lib/api/
├── client.ts              ← fetch wrapper, token + 401 refresh, ApiError
├── types.ts               ← User, CGP, Product, Insurer, Issuer…
├── resources/
│   ├── users.ts           ← GET/PATCH /users/me
│   ├── cgps.ts            ← GET/PATCH /cgps/me
│   ├── products.ts        ← GET /products, GET /products/:id
│   ├── insurers.ts        ← GET /insurers
│   └── issuers.ts         ← GET /issuers
└── README.md              ← this file
```

> The legacy `lib/api.ts` (single-class `ApiClient` with demo fallbacks) is
> preserved until Sprint 2 finishes migrating every domain. New code should
> NOT add methods there; add a resource module here instead.

## HTTP client (`client.ts`)

```ts
import { apiClient } from '@/lib/api/client';

const user = await apiClient.get<User>('/users/me');
await apiClient.patch<User>('/users/me', { firstName: 'Paul' });
await apiClient.post<Session>('/auth/login', { email, password });
```

### Configuration

| Concern       | Source                                         |
|---------------|------------------------------------------------|
| Base URL      | `process.env.NEXT_PUBLIC_API_URL` (`/api/v1`)  |
| Auth cookie   | `NEXT_PUBLIC_AUTH_COOKIE_NAME` (`strickin_access`) |
| Feature flag  | `NEXT_PUBLIC_USE_REAL_API=true`                |

### Behaviour

- Adds `Authorization: Bearer …` automatically from:
  1. An in-memory token set via `apiClient.setToken(access, refresh)`; or
  2. The `strickin_access` cookie.
- On `401`, calls `POST /auth/refresh` once (concurrent 401s are coalesced)
  and retries the original request. Bypassed with `skipAuthRefresh: true`.
- Throws `ApiError { status, code?, message, details? }` on non-2xx.
- Default timeout 30s (`AbortController`).

## Resource modules (`resources/*.ts`)

Each resource is a plain object of typed functions:

```ts
// resources/users.ts
export const usersApi = {
  me:        () => apiClient.get<User>('/users/me'),
  updateMe:  (patch) => apiClient.patch<User>('/users/me', patch),
};
```

Resources never know about TanStack Query or demo mode — they are pure wire.

## TanStack Query hooks (`apps/web/hooks/use-*`)

Each hook implements the **feature-flag + demo-fallback** pattern:

```ts
export function useProducts(filters) {
  const realApi = useRealApi();      // reads NEXT_PUBLIC_USE_REAL_API
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      if (realApi) return productsApi.list(filters);
      return api.getProducts(filters);   // legacy demo fallback
    },
    staleTime: 5 * 60_000,
  });
}
```

| Hook                     | Resource call                 | Fallback source                    | staleTime |
|--------------------------|-------------------------------|------------------------------------|-----------|
| `useAuth()`              | `POST /auth/login` + store    | Zustand `useAuthStore.login`       | —         |
| `useUserProfile()`       | `GET /users/me`               | `useAuthStore.user`                | 60 s      |
| `useUpdateUserProfile()` | `PATCH /users/me`             | Merges into `useAuthStore`         | —         |
| `useCGPProfile()`        | `GET /cgps/me`                | `localStorage['strickin-cgp-profile']` | 60 s  |
| `useUpdateCGPProfile()`  | `PATCH /cgps/me`              | Writes back to localStorage        | —         |
| `useProducts(filters)`   | `GET /products?…`             | `DEMO_PRODUCTS` (legacy client)    | 5 min     |
| `useProduct(id)`         | `GET /products/:id`           | `DEMO_PRODUCTS.find(…)`            | 5 min     |
| `useInsurers()`          | `GET /insurers`               | Inlined `DEMO_INSURERS`            | 5 min     |
| `useIssuers()`           | `GET /issuers`                | Inlined `DEMO_ISSUERS`             | 5 min     |

## Migration status

### Vague A — user-centric (done in T1.4)

- [x] `useAuthStore` → `useAuth()` (adapter; store kept `@deprecated`)
- [x] `useUserProfileStore` → `useUserProfile()` / `useUpdateUserProfile()`
  (the Zustand store was never actually built — the hook is the first
  implementation)
- [x] `useCGPProfileStore` → `useCGPProfile()` / `useUpdateCGPProfile()`

### Vague B — catalog reads (done in T1.4)

- [x] `useProductCatalogStore` → enhanced existing `useProducts()` hook
- [x] `useInsurerStore` → `useInsurers()`
- [x] `useIssuerStore` → `useIssuers()`

### Vague C — writes (Sprint 1, follow-up)

- [ ] `useClientStore`, `useContractStore`, `usePortfolioStore`, `useRFQStore`

### Sprint 2

- [ ] All remaining Zustand stores (notifications, events, commentary, SMA,
  secondary pricing, academy, signatures, alerts, jurisdictions, filters,
  commissions, clients-consolidated, emissions, KYB, KYC, compare, locale,
  market-data, rfq-history, theme).

Each of those store files has a `// TODO: migrate Sprint 2` marker.

## Feature-flag matrix

| `NEXT_PUBLIC_USE_REAL_API` | Behaviour                                              |
|----------------------------|--------------------------------------------------------|
| `false` (default)          | All hooks use local demo/fallback data, no network.    |
| `true`                     | Hooks call `apiClient.*` against `NEXT_PUBLIC_API_URL` (expects NestJS live). |

Set it in `.env.local`. Per the task brief, it stays `false` until the NestJS
auth endpoints ship.

## Testing drop-in compatibility

The 50-page app imports used by Vagues A/B were rewritten to pull from
`useAuth()`, `useUserProfile()`, etc. — but the return shape is the same, so
no component refactor was required. Search for remaining references with:

```
rg "useAuthStore\(|useUserProfileStore|useCGPProfileStore|useProductCatalogStore|useInsurerStore|useIssuerStore" apps/web
```

A handful of `useAuthStore.setState(...)` and `useAuthStore.getState()` sites
remain on purpose (register page + `/demo` auto-login + the new hooks that
bridge into the store) and are annotated inline.
