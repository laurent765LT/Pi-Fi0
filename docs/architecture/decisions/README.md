# Architecture Decision Records (ADRs)

On documente chaque decision architecturale structurante sous forme d'ADR.
Format : **Michael Nygard** (simple et eprouve).

---

## Template

Copier `0000-template.md` (ou le snippet ci-dessous) pour creer un
nouvel ADR. Incrementer le numero (4 chiffres, zero-padded). Ne jamais
renumeroter un ADR existant.

```md
# ADR <NNNN> — <Titre court>

## Status
Accepted | Proposed | Deprecated | Superseded by ADR-<MMMM>

## Context
Quel est le probleme / la decision a prendre ? Quel est le systeme actuel ?
Quelles forces en presence (business, technique, organisation) ?

## Decision
Qu'a-t-on decide ? Ecrit a l'imperatif : "Nous utiliserons X".

## Consequences
### Positives
- ...
### Negatives
- ...
### Neutres
- ...

## Alternatives considered
- **Option A** : avantages / inconvenients.
- **Option B** : avantages / inconvenients.

## Related
- [ADR-XXXX — ...](./XXXX-...)
- [doc/architecture/YY-...md](../YY-...)
```

---

## Principes

1. **Une decision = un ADR**. Si un changement porte plusieurs decisions
   distinctes, c'est plusieurs ADRs.
2. **Immutable**. On ne modifie pas un ADR accepte. Pour le revenir sur
   une decision, on cree un nouvel ADR qui **supersede** l'ancien.
3. **Daté**. Chaque ADR porte la date de decision (premiere ligne "Status").
4. **Ecrit au bon moment**. Un ADR s'ecrit **avant** le merge du change
   architectural (PR dediee ou PR de l'implementation).
5. **Accessible**. Un ADR doit etre lisible par un nouveau dev en 5 min.
   Pas de jargon non-explique.

---

## Index

| # | Titre | Statut | Domain |
| --- | --- | --- | --- |
| [0001](./0001-monorepo-npm-workspaces.md) | Monorepo npm workspaces | Accepted | Tooling |
| [0002](./0002-nextjs-app-router.md) | Next.js 14 App Router | Accepted | Frontend |
| [0003](./0003-zustand-with-persist.md) | Zustand + persist middleware | Accepted | Frontend |
| [0004](./0004-tanstack-query-over-swr.md) | TanStack Query plutot que SWR | Accepted | Frontend |
| [0005](./0005-prisma-over-typeorm.md) | Prisma ORM plutot que TypeORM | Accepted | Backend |
| [0006](./0006-clean-architecture-backend.md) | Clean Architecture + DDD (backend) | Accepted | Backend |
| [0007](./0007-feature-based-frontend.md) | Feature-based (frontend) | Accepted | Frontend |
| [0008](./0008-argon2id-over-bcrypt.md) | Argon2id plutot que bcrypt | Accepted | Security |
| [0009](./0009-jwt-refresh-rotation.md) | JWT avec rotation refresh token | Accepted | Security |
| [0010](./0010-sentry-over-logrocket.md) | Sentry plutot que LogRocket | Accepted | Observability |
| [0011](./0011-upstash-redis-over-selfhosted.md) | Upstash Redis plutot que self-hosted | Accepted | Infra |
| [0012](./0012-supabase-over-managed-postgres.md) | Supabase plutot que RDS / Neon | Accepted | Data |
| [0013](./0013-claude-api-over-openai.md) | Claude API plutot qu'OpenAI | Accepted | AI |
| [0014](./0014-feature-flag-strategy.md) | Strategie feature flags | Accepted | Operations |

---

## Process

### Creer un nouvel ADR

1. Ouvrir une PR dediee : `docs/architecture-adr-NNNN-titre`.
2. Copier le template.
3. Remplir les sections. Etre **concis** et **factuel**.
4. Statut initial : `Proposed`.
5. Review par le tech lead + un stakeholder du domaine concerne.
6. Si accepte : changer en `Accepted` et merger.
7. Si implementation : referencer l'ADR dans le commit d'implementation.

### Deprecier / remplacer

1. Creer un nouvel ADR avec statut `Accepted` et le superseding reasoning.
2. Editer l'ancien : statut `Superseded by ADR-NNNN`, conserver le
   contenu historique.
3. Ne jamais **supprimer** un ADR — l'historique est valuable.

### Quand ouvrir un ADR

- Choix de librairie structurante (ORM, UI framework, lib d'auth).
- Choix de pattern (Clean Arch, feature-based, CQRS).
- Choix de provider cloud (Supabase, Upstash, Vercel, Railway).
- Strategie de securite (hash password, auth flow).
- Strategie de deploy (environnements, rollback).
- Format de contrat API (REST vs GraphQL, versioning).

### Quand NE PAS ouvrir un ADR

- Choix mineur qui peut etre change localement sans impact large.
- Preference de style (Prettier / eslint conventions — vont dans
  [`../conventions/`](../conventions/)).
- Implementation technique d'un ADR deja accepte.
