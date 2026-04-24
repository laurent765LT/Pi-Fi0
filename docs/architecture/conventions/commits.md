# Conventions — Commits

On applique **Conventional Commits**. Automatique via commitlint.

---

## 1. Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Exemples :

```
feat(auth): add password strength indicator
fix(pricing): correct autocall coupon edge case at barrier
refactor(users): migrate to clean architecture
docs(architecture): add ADR 0008 on argon2id
chore(deps): bump prisma to 5.9.1
test(rfq): add integration test for quote acceptance
perf(products): add composite index on (issuer, status)
```

## 2. Types

| Type | Utilise quand |
| --- | --- |
| `feat` | Nouvelle fonctionnalite visible user. |
| `fix` | Correction d'un bug. |
| `chore` | Maintenance (deps, config, tooling) sans changement user. |
| `refactor` | Restructuration sans changement de comportement. |
| `test` | Ajout / modification de tests. |
| `docs` | Doc seulement. |
| `perf` | Amelioration de performance. |
| `style` | Formatting (whitespace, semicolons) — rare, on a Prettier auto. |
| `build` | Changement du build system. |
| `ci` | GitHub Actions, workflows. |
| `revert` | Revert d'un commit precedent. |

## 3. Scopes

Le scope est optionnel mais encourage. Liste courante :

- `auth`
- `users`
- `products`
- `pricing`
- `rfq`
- `commitments`
- `ai`
- `webhooks`
- `notifications`
- `portfolio`
- `admin`
- `ui`
- `deps`
- `ci`
- `docs`
- `infra`
- `db` (pour les migrations Prisma)

Pour des changes qui couvrent plusieurs scopes :
```
refactor: migrate users + auth to clean arch (phase 2)
```

Pas de scope.

## 4. Subject

- Imperatif, present (`add`, `fix`, pas `added`, `fixing`).
- Minuscule initiale (apres le scope).
- Pas de point final.
- Max 72 caracteres.

Exemples :

```
feat(auth): add password reset flow         ✓
feat(auth): added password reset flow       ✗ (passe)
feat(auth): Add password reset flow.        ✗ (majuscule + point)
```

## 5. Body (optionnel)

Quand le subject ne suffit pas. Explique **pourquoi** plutot que quoi.

```
fix(pricing): round autocall coupon to 2 decimals

The legacy path used toFixed(2) via string conversion which would
truncate 0.155 to 0.15 instead of rounding to 0.16.

Switched to a proper Math.round(value * 100) / 100 approach
matching our `amount_cents` convention for money.
```

## 6. Footer

### 6.1 Breaking change

```
feat(api): replace /products/search with POST /products/query

BREAKING CHANGE: clients must migrate from GET /products/search?q=...
to POST /products/query with a body. See migration guide in
docs/architecture/06-api-contracts.md#versioning.
```

### 6.2 Closes issue

```
fix(auth): prevent race condition on refresh token rotation

Closes #142
```

### 6.3 Co-authors

```
feat(dashboard): add AI interaction cost widget

Co-authored-by: Hugo Olt <hugo@strickin.fr>
```

## 7. Regles de PR

### 7.1 Un commit = une idee

Prefer **small, atomic** commits. Un commit qui melange refactor + fix
+ feat est un commit qu'on peut pas `revert` proprement.

### 7.2 Rebase before merge

On privilegie l'historique lineaire. Avant de merge :

```bash
git fetch origin
git rebase origin/main
# resoudre les conflits
git push --force-with-lease
```

Et on merge **rebase + merge** dans GitHub (pas squash, sauf si la PR
a des commits WIP intermediaires).

### 7.3 PR title = commit message

Quand la PR est squash (rare), le PR title devient le commit message.
Doit donc respecter le format ci-dessus.

## 8. commitlint

Config `.commitlintrc.json` (a ajouter Sprint 2) :

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", [
      "feat", "fix", "chore", "refactor", "test", "docs", "perf",
      "style", "build", "ci", "revert"
    ]],
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 100]
  }
}
```

Hook via `husky` + `lint-staged` :
- Pre-commit : prettier + eslint --fix sur staged files.
- Commit-msg : commitlint.

Un commit qui ne respecte pas le format est rejete en local.

## 9. Exemples complets

### 9.1 Feature

```
feat(rfq): allow CGP to request quotes from multiple issuers in one RFQ

Previously the UX required creating one RFQ per issuer. The new flow
lets the CGP tick checkboxes of target issuers and dispatches the RFQ
to all of them in parallel. Each issuer response creates a separate
IssuerRfqQuote row.

- Backend: new RfqDispatchService
- Frontend: updated CreateRfqForm with multi-select

Closes #87
```

### 9.2 Fix

```
fix(auth): reject refresh tokens whose user is deactivated

We were issuing new access tokens for users with UserStatus=DEACTIVATED,
which allowed zombie sessions to persist up to 15 minutes after a
deactivation.

Added a UserStatus check in TokenService.refresh() before signing.
Tests cover both ACTIVE and DEACTIVATED cases.
```

### 9.3 Refactor

```
refactor(users): migrate to clean architecture

Phase 1 of the pilot migration. Moves users module from flat service +
controller to the domain/application/infrastructure/presentation
layering documented in docs/architecture/03-backend-architecture.md.

No behavior change — all existing tests still pass.
```

### 9.4 Breaking

```
feat(api): version all auth endpoints under /api/v1/auth

BREAKING CHANGE: endpoints previously available at /auth/* now live at
/api/v1/auth/*. The old paths return 404. Update NEXT_PUBLIC_API_URL
consumers accordingly. Mobile / CLI clients must bump their base URL.
```

## 10. Anti-patterns

### 10.1 Commit fourre-tout

```
chore: misc changes               ✗
chore: work                        ✗
chore: wip                         ✗
```

### 10.2 Chore pour masquer une feature

```
chore: add payment integration     ✗  (c'est un feat)
```

### 10.3 Fix pour masquer un refactor

```
fix: reorganize auth folder        ✗  (c'est un refactor)
```

### 10.4 Trop de scopes

```
feat(auth,users,api): add registration flow  ✗
```

Preferer un commit par scope ou pas de scope si vraiment transverse.

## 11. Historique

L'historique git est une doc de projet. Un `git log --oneline` bien ecrit
raconte l'evolution du produit. On ne reecrit pas l'histoire sur `main`
(pas de `push --force` sur main), sauf incident de securite documente.
