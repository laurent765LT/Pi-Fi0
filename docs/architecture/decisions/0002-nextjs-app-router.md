# ADR 0002 — Next.js 14 App Router

## Status
Accepted — 2026-03-08

## Context

Le frontend Strick'in doit :

- Servir des pages publiques (marketing, login, register) avec bon SEO et
  TTFB faible (CGPs sont sensibles au temps de chargement).
- Rendre des dashboards authentifies avec beaucoup d'interactivite
  (tableaux de produits, pricing, RFQ).
- Permettre du server-side rendering quand c'est pertinent et du client
  rendering sans friction.
- Etre hebergeable sans devops ad-hoc (Vercel-native ideal).
- Supporter l'i18n (FR par defaut, EN Sprint 2).

Deux paradigmes disponibles dans Next.js 14 :
- **Pages Router** — mature, patterns etablis depuis 2016.
- **App Router** — stable depuis Next 13.4 (mai 2023), supporte React
  Server Components + streaming.

## Decision

Utiliser **Next.js 14 App Router** pour `apps/web`.

Structure :
```
apps/web/app/
  (app)/                # route group pour pages protected
    dashboard/
    portfolio/
  (onboarding)/         # route group KYC
  api/                  # route handlers (proxy rare, webhooks)
  login/page.tsx
  register/page.tsx
  layout.tsx            # root layout
  providers.tsx         # QueryClient + Sentry + i18n (client)
```

## Consequences

### Positives
- **React Server Components** — pages publiques servies avec zero JS client
  (LCP < 2s cible).
- **Streaming** — UX rapide grace au `<Suspense>` + loading.tsx.
- **Colocation** — `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`,
  `not-found.tsx` dans le meme dossier.
- **Middleware edge** — auth cookie check avant meme le rendering (voir
  `apps/web/middleware.ts`).
- **Deploy Vercel-native** — pas de config custom.
- **Route groups `(folder)`** — organise sans impacter l'URL.

### Negatives
- **Courbe d'apprentissage** — Server Components vs Client Components
  necessite de la rigueur (`'use client'` obligatoire).
- **Debugging moins mature** — stack traces RSC parfois opaques.
- **Certaines libs mal compatibles** — historiquement Zustand, TanStack
  Query, autres clients-only. On a contourne via un `providers.tsx` client.
- **Complexite cache** — le cache de Next (`fetch` cached / revalidate)
  est puissant mais subtil. On desactive pour les data user-specifiques.

### Neutres
- On perd la compat avec quelques patterns `getServerSideProps`.
- Le `middleware.ts` edge-runtime a des limites (pas de Node APIs).

## Alternatives considered

- **Next.js Pages Router**
  - Plus mature, plus de docs StackOverflow.
  - Pas de RSC, bundle JS plus gros.
  - **Rejette** — on aurait un legacy dans 18 mois.
- **Remix**
  - Excellente DX, bonne philosophie (web standards).
  - Ecosysteme moins fourni, hosting moins "zero-config" hors Fly.io.
  - **Rejette** — Vercel integration superior pour Next.
- **Astro**
  - Excellent pour du quasi-static (blog, docs).
  - Pas adapte a un SaaS tres interactif.
  - **Rejette** — notre produit est une app, pas un site.
- **Vite + React SPA**
  - Simple, rapide.
  - Perd le SEO pour les pages publiques, pas de SSR out-of-the-box.
  - **Rejette** — important pour le marketing de Strick'in.
- **Nuxt 3**
  - Vue plutot que React. Equipe React-native.
  - **Rejette** — pas de valeur a changer de framework UI.

## Related
- [ADR 0003 — Zustand](./0003-zustand-with-persist.md) — etat client
  compatible RSC.
- [ADR 0004 — TanStack Query](./0004-tanstack-query-over-swr.md) — fetch
  cote client.
- [ADR 0007 — Feature-based frontend](./0007-feature-based-frontend.md)
- [docs/architecture/02-frontend-architecture.md](../02-frontend-architecture.md)
