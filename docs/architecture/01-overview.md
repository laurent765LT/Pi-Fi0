# 01 — Vue d'ensemble

**Audience** : tous les contributeurs, devs et non-devs.
**Prerequisites** : aucun. C'est le point d'entree.

---

## 1. Produit

Strick'in est une **marketplace B2B de produits structures** qui connecte :

- **Emetteurs** — BNP Paribas, Natixis, Goldman Sachs, SG Issuer, Marex.
- **Distributeurs** — CGPs (Conseillers en Gestion de Patrimoine) et
  compagnies d'assurance-vie francaises.

Le workflow se compose de trois phases digitalisees :

1. **Pricing / RFQ** — un CGP emet un Request-For-Quote, plusieurs emetteurs
   proposent des quotes, le CGP accepte la meilleure.
2. **Souscription** — le contrat est prepare, les positions sont
   enregistrees, la signature electronique (DocuSign) valide l'envelope.
3. **Suivi** — reporting portefeuille, alertes autocall, barriers, coupons.

Le tout instrumente par une couche IA (Anthropic Claude) qui assiste
l'analyse sous-jacents, l'ESG scoring et les recommandations produit.

## 2. Contraintes reglementaires

| Regime | Impact sur l'archi |
| --- | --- |
| **MiFID II** | Target market par produit ; aucun conseil personnalise automatise → `aiGuard()` bloque les prompts qui demandent recommandation a un client nomme. |
| **DDA** | Insurance Distribution Directive — le module `commissions` doit separer retrocession courtier / conseil honoraire. |
| **PRIIPs** | Le KID (Key Information Document) est attache au produit ; expose via `/api/v1/products/:id/kid`. |
| **RGPD** | Les donnees client (IBAN, CNI, coordonnees) ne quittent pas l'UE. PII masquee dans Sentry (`beforeSend`). Pas de PII dans les logs structures. |
| **LCB-FT** | KYC (`OnboardingStatus` : PENDING → DOCS_UPLOADED → VERIFIED → ACTIVE) obligatoire avant toute souscription. |

Ces contraintes justifient plusieurs choix (Supabase EU, Sentry Frankfurt,
PII guard sur Claude, target market dans le schema Prisma).

## 3. Contraintes techniques

- **TypeScript strict** partout (pas de `any`).
- **Disponibilite** — cible 99.9% post-GA. Pre-GA, degradation gracieuse
  avec cache Redis + fallback in-memory.
- **Latence API** — p95 < 500 ms en lecture pure, < 1200 ms avec appel
  Anthropic (cache hit), < 2500 ms cache miss.
- **Performances front** — LCP < 2.5 s, CLS < 0.1, INP < 200 ms
  (Web Vitals mesures via `web-vitals`).
- **Audit trail** — chaque action de change state (login, order,
  envelope, pricing) ecrit un `AuditLog` (conservation 5 ans, exigence
  AMF).

## 4. Stack + justification

| Couche | Techno | Raison |
| --- | --- | --- |
| Frontend | **Next.js 14 App Router** | RSC pour SEO des pages publiques + streaming, React 18 concurrent mode. Voir [ADR 0002](./decisions/0002-nextjs-app-router.md). |
| Langage | **TypeScript 5.3 strict** | Pattern matching sur unions discriminees ; elimine 80 % des bugs a la compilation. |
| State client | **Zustand + persist** | Moins de boilerplate que Redux, compatible RSC. Voir [ADR 0003](./decisions/0003-zustand-with-persist.md). |
| Data fetching | **TanStack Query** | Cache + devtools + mutations optimistes. Voir [ADR 0004](./decisions/0004-tanstack-query-over-swr.md). |
| Styling | **Tailwind + design tokens** | Coherence avec `@strickin/design-system`, dark mode first-class. |
| Backend | **NestJS 10** | Module system + DI native, ecosysteme OpenAPI, decorators pour rate limit / guards. |
| ORM | **Prisma 5** | Schema declaratif versionne, migrations rollbackables, type safety end-to-end. Voir [ADR 0005](./decisions/0005-prisma-over-typeorm.md). |
| DB | **Postgres 16 (Supabase)** | SQL + JSONB + RLS (prepare multi-tenant). Voir [ADR 0012](./decisions/0012-supabase-over-managed-postgres.md). |
| Cache / queue | **Redis 7 (Upstash)** | Cache AI + sessions + BullMQ pour jobs async. Voir [ADR 0011](./decisions/0011-upstash-redis-over-selfhosted.md). |
| Auth | **JWT HS256 + Argon2id** | Stateless, rate-limit friendly, Argon2id resistant GPU. Voir [ADR 0008](./decisions/0008-argon2id-over-bcrypt.md) et [ADR 0009](./decisions/0009-jwt-refresh-rotation.md). |
| IA | **Anthropic Claude 3.5 Sonnet** | Qualite reasoning + residency EU possible + compliance. Voir [ADR 0013](./decisions/0013-claude-api-over-openai.md). |
| Monitoring | **Sentry (web + api)** | Stack trace + replay + release health. Voir [ADR 0010](./decisions/0010-sentry-over-logrocket.md). |
| Hosting | **Vercel (web) + Railway (api)** | Deploy-on-push, previews PR, cout maitrise pre-PMF. |

## 5. Principes architecturaux directeurs

### 5.1 Domain-first design

Le code metier precede le code technique. On modelise d'abord les entites
domaine (`Product`, `Rfq`, `Order`) avec leurs invariants (un Order ne peut
etre confirme qu'apres une Envelope signee), **puis** on decide du SGBD,
du client HTTP, du stockage. Les entites vivent dans
`apps/api/src/modules/<bc>/domain/entities/` et ne dependent que de types.

### 5.2 Separation of concerns

Chaque module backend est partage en quatre layers distincts :
`domain` / `application` / `infrastructure` / `presentation`.
Chaque feature frontend est partagee en :
`components` / `hooks` / `api` / `store` / `lib`.
Voir [`02-frontend-architecture.md`](./02-frontend-architecture.md) et
[`03-backend-architecture.md`](./03-backend-architecture.md).

### 5.3 Feature cohesion

> Things that change together, live together.

Un changement de l'UX de login ne devrait modifier que
`apps/web/features/auth/`. Un changement du hash argon2 ne devrait modifier
que `apps/api/src/modules/auth/domain/` + une migration. **Pas de
cross-feature imports**.

### 5.4 Dependency inversion

Le domaine definit des interfaces (`UserRepository`), l'infrastructure les
implemente (`PrismaUserRepository`). Les use cases depend de l'interface,
jamais du Prisma Client directement. Cela permet :

- Tests unitaires rapides (mock du repository).
- Remplacement de Prisma par un autre ORM sans toucher au domaine.
- Interdire a un dev d'appeler directement `prisma.user.findMany()`
  dans un controller.

### 5.5 Type safety absolue

- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`.
- Interdiction de `any` — utiliser `unknown` + type guards (`zod` pour
  input validation, class-validator cote NestJS).
- Pas de `@ts-ignore` — uniquement `@ts-expect-error` avec un commentaire
  explicite.
- Voir [`conventions/typescript.md`](./conventions/typescript.md).

### 5.6 Progressive enhancement via feature flags

Toute feature risquee (changement de prix, nouveau workflow RFQ, changement
de provider IA) est derriere un flag lu depuis la config. Voir
[ADR 0014](./decisions/0014-feature-flag-strategy.md). Les flags vivent
dans `apps/api/src/common/feature-flags.ts` et sont exposes par
`/api/v1/flags` pour le front.

## 6. Ce que ce doc n'est PAS

- Pas un tutoriel Next.js / NestJS / Prisma. On suppose une familiarite de
  base.
- Pas un runbook operationnel. Pour l'operations : [`runbook-incidents.md`](../runbook-incidents.md).
- Pas une specification fonctionnelle. Les specs vivent dans
  `Strickin_Specifications_V2.docx` a la racine du repo.

## 7. Qui edite quoi

| Doc | Owner principal | Review |
| --- | --- | --- |
| `01-overview.md`, `02/03/04` | Tech lead | Lead + Product |
| `05-data-layer.md` | Backend lead | Tech lead |
| `06-api-contracts.md` | Backend lead | Frontend lead |
| `07-authentication.md` | Backend lead + Security | Tech lead |
| `08-observability.md` | SRE | Tech lead |
| `conventions/*` | Tech lead | Tous |
| `decisions/*` | Auteur du changement | Tech lead (approbation explicite) |
| `diagrams/*` | Tech lead | — |
