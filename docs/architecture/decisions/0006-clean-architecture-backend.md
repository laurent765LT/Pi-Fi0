# ADR 0006 — Clean Architecture + DDD (backend)

## Status
Accepted — 2026-04-10

## Context

L'API Strick'in grandit rapidement : auth, produits, commitments, pricing,
RFQ, webhooks, AI, notifications. Les fichiers `*.service.ts` atteignent
500+ lignes et melangent validation, business logic, acces DB et appels
HTTP externes.

Symptomes :
- Tests unitaires impossibles sans mocker Prisma integral.
- Logique metier disseminee (partiellement dans services, partiellement
  dans controllers, partiellement dans triggers DB).
- Quand un dev change une regle metier, il doit modifier 3 endroits.
- Pas de frontiere claire entre le "domain" et "l'infrastructure".

Ces symptomes sont classiques quand un backend grandit sans structure
explicite. Les patterns eprouves :
- **Clean Architecture** (Robert C. Martin).
- **Hexagonal / Ports & Adapters** (Alistair Cockburn).
- **DDD tactical patterns** (Eric Evans).

## Decision

Adopter **Clean Architecture + DDD tactical patterns** pour tous les
nouveaux modules backend, et migrer progressivement les modules existants.

Chaque bounded context (`users`, `auth`, `products`, `rfq`, ...) vit
dans `apps/api/src/modules/<bc>/` et est partage en 4 layers :

```
modules/<bc>/
  domain/                # entities, value objects, events, errors, repo interfaces
  application/           # commands, queries, DTOs, mappers
  infrastructure/        # Prisma, Redis, external clients — implements domain ports
  presentation/          # NestJS controllers
```

**Regles non-negociables** :
1. Le domaine ne depend de **rien** (pas de Prisma, pas d'HTTP, pas de
   framework).
2. L'application depend du domaine via interfaces (`UserRepository`).
3. L'infrastructure implemente les interfaces du domaine.
4. La presentation appelle l'application, jamais le domaine ou
   l'infrastructure directement.

Strategy de migration :

- **Sprint 1** : pilote `users/` en Clean Arch.
- **Sprint 2** : migrer `auth/` et `products/`.
- **Sprint 2-3** : migrer `rfq/`, `commitments/`.
- **Sprint 3-4** : migrer le reste (`webhooks/`, `notifications/`, `ai/`).

## Consequences

### Positives
- **Testabilite** — les use cases sont testable avec des mocks de
  repositories (pas besoin de Postgres).
- **Clartee** — un dev qui ouvre `modules/users/domain/` voit les concepts
  metier sans bruit technique.
- **Evolution** — changer d'ORM, de provider d'email, de queue n'impacte
  que l'infrastructure.
- **Discipline DDD** — les value objects (`Email`, `Isin`, `Money`)
  encapsulent les invariants et evitent les bugs de validation disseminee.
- **CQRS light** — separation commands / queries lisible dans l'arborescence.
- **Event-driven** — les events domaine (`UserRegisteredEvent`) sont des
  plain objects ; faciles a outbox-ier (Sprint 2).

### Negatives
- **Plus de fichiers** — un use case simple = 3-5 fichiers (command,
  handler, dto, mapper, test). Acceptable pour les modules metier
  complexes, overkill pour du pur CRUD.
- **Courbe d'apprentissage** — les nouveaux devs doivent comprendre les
  layers et la dependency rule.
- **Mappers a maintenir** — entity ↔ DTO ↔ Prisma model, trois shapes a
  synchroniser.
- **Migration progressive** — pendant 2-3 sprints, le repo a deux styles
  en parallele (legacy vs Clean Arch).

### Neutres
- Les modules tres simples (health, debug) peuvent rester flat.
- On n'applique **pas** full CQRS avec event sourcing ou separate read
  models — c'est la version "light" (commands et queries distinctes mais
  meme DB).

## Alternatives considered

- **Continuer l'architecture flat**
  - Rapide a ecrire, connu de tous.
  - Degenere quand le domain grandit.
  - **Rejette** — on a deja des services > 500 lignes.
- **Hexagonal strict (Cockburn)**
  - Concepts identiques (ports / adapters).
  - Moins de materiel pedagogique qu'autour de "Clean Arch".
  - **Choix du nom** plus que du pattern — on reprend les memes idees
    sous la terminologie de Uncle Bob, plus populaire.
- **Onion Architecture**
  - Variante de Clean Arch.
  - **Rejette** — meme chose avec un autre dessin.
- **CQRS + Event Sourcing full**
  - Puissant mais complexe, necessite un event store (EventStoreDB).
  - **Rejette** — overkill pre-GA.

## Related
- [ADR 0005 — Prisma](./0005-prisma-over-typeorm.md) — Prisma reste dans
  `infrastructure/persistence/`.
- [ADR 0007 — Feature-based frontend](./0007-feature-based-frontend.md) —
  pendant symetrique cote frontend.
- [docs/architecture/03-backend-architecture.md](../03-backend-architecture.md)
