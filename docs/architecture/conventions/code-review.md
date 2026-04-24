# Conventions — Code review

Un code review n'est pas un lieu de combat d'ego. C'est un mechanism pour
diffuser la connaissance et maintenir la coherence.

---

## 1. Obligations auteur

### 1.1 Avant d'ouvrir la PR

- [ ] `tsc --noEmit` passe sur tous les workspaces touches.
- [ ] Tests passent (`npm test --workspaces --if-present`).
- [ ] `npm run lint` passe.
- [ ] Le build passe (`npm run build` sur web/api touches).
- [ ] Les migrations Prisma sont rollbackables (additive-only au minimum).
- [ ] Pas de secrets en clair (`.env`, tokens, cles API).

### 1.2 Description PR

Template minimal :

```md
## Context
Pourquoi ce change.

## Changes
- Bullet 1
- Bullet 2

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual test : <steps>

## Screenshots (UI)
<si UI>

## Migration notes
<si DB ou breaking change>
```

### 1.3 Taille

- **PRs < 300 lignes ajoutees** sont reviewables en 30 min.
- **PRs > 1000 lignes** → reflechis a decouper.

Exception : refactor mecanique (renommage auto) ou migration generee.

## 2. Obligations reviewer

### 2.1 SLA

- Review dans **1 jour ouvre**.
- Si tu es OOO → assigner explicitement un autre reviewer.

### 2.2 Priorite

1. **Correctness** — le code fait-il ce qu'il pretend ?
2. **Securite** — auth / authz / injection / PII.
3. **Architecture** — respect des layers, separation concerns.
4. **Tests** — couverture et pertinence.
5. **Lisibilite** — noms, structure.
6. **Performance** — seulement si on suspecte un probleme chaud.
7. **Style** — normalement gere par Prettier / eslint (donc pas a
   commenter).

### 2.3 Ton

- Question plutot qu'ordre : "que se passe-t-il si X est null ici ?" >
  "tu as oublie un check".
- Explicite la raison : "a eviter car <raison>" > "pas bon".
- **Nit** pour les points mineurs (style / preference).
- **Required** pour ce qui doit changer avant merge.

## 3. Checklist review

### 3.1 Architecture

- [ ] Le code respecte la dependency rule (Clean Arch backend) ?
- [ ] Le code respecte la regle no-cross-feature (frontend) ?
- [ ] Les layers sont corrects (presentation/application/domain/infra) ?
- [ ] Pas de leak d'infra dans le domaine (Prisma type, HTTP types dans
      une entity) ?

### 3.2 TypeScript

- [ ] Pas de `any` ni `@ts-ignore`.
- [ ] Inputs externes valides via Zod / class-validator.
- [ ] Types exports ont une JSDoc pertinente.
- [ ] Unions discriminees quand etat exclusif.

### 3.3 Tests

- [ ] Tests unitaires pour la logique metier.
- [ ] Tests integration pour les flows HTTP critiques.
- [ ] Tests couvrent le happy path + au moins 2 edge cases.
- [ ] Pas de test qui assume un ordre d'execution.
- [ ] Pas de `sleep` / `setTimeout` dans les tests.

### 3.4 Securite

- [ ] Pas de PII dans les logs.
- [ ] Pas de secret en clair (grep des tokens / cles).
- [ ] Les endpoints protected ont le bon guard (JwtAuthGuard, RolesGuard,
      OrgIsolationGuard).
- [ ] Les inputs externes (body, query, params) sont valides avant usage.
- [ ] Les requetes SQL raw (rares) sont parametrees (pas de concat).
- [ ] Les redirections externes sont whitelistees (pas d'open redirect).
- [ ] Les downloads / uploads de fichiers ont des types MIME valides.

### 3.5 Accessibilite (UI)

- [ ] `aria-label` / `aria-describedby` quand pas de texte visible.
- [ ] Focus ring visible (`:focus-visible` Tailwind).
- [ ] Contraste minimum 4.5:1 (AA).
- [ ] Formulaires : `<label>` associe chaque input.
- [ ] Navigation clavier fonctionnelle.
- [ ] `<img>` avec alt (ou `alt=""` si decoratif).

### 3.6 UI / UX

- [ ] Dark mode respecte (classes `dark:*` utilisees).
- [ ] Responsive (mobile / tablet / desktop) test visuel.
- [ ] Loading states visibles.
- [ ] Error states visibles (pas de fallback silencieux).
- [ ] Empty states (quand il n'y a rien a afficher).

### 3.7 Donnees / DB

- [ ] Migration Prisma testee en dev (`prisma migrate dev`).
- [ ] Migration n'est pas destructive (ou documente le downtime prevu).
- [ ] Nouveaux champs ont un default ou sont optionnels.
- [ ] Index pertinents ajoutes.
- [ ] Pas de N+1 (utiliser `include` Prisma).
- [ ] Transactions `$transaction` la ou necessaire (write multi-table).

### 3.8 API

- [ ] DTO valide via class-validator.
- [ ] Status codes corrects (201 create, 204 delete, 422 validation, ...).
- [ ] Erreurs au format RFC 7807.
- [ ] Rate limit si endpoint public.
- [ ] Swagger annotations a jour.
- [ ] Version URL (`/api/v1/...`).

### 3.9 Feature flags

- [ ] Feature risquee derriere un flag ?
- [ ] Flag documente (nom + description + owner).
- [ ] Valeur par defaut = off en prod pour les nouvelles features.

### 3.10 Observabilite

- [ ] Logs structures (pas `console.log`).
- [ ] Request ID propage.
- [ ] Pas de PII dans les logs.
- [ ] Erreur domaine capturee proprement (throw + filtre centralise).
- [ ] Sentry context enriched si utile (user, org, requestId).

### 3.11 Documentation

- [ ] README / doc feature mis a jour si comportement change.
- [ ] Commentaires pour le "pourquoi" (pas le "quoi").
- [ ] ADR cree si decision architecturale structurante.

## 4. Labels PR

| Label | Quand |
| --- | --- |
| `breaking-change` | Changement qui casse les consumers. |
| `needs-migration` | La PR contient une migration Prisma. |
| `security` | Review securite obligatoire. |
| `performance` | Review perf obligatoire. |
| `ux` | Review design obligatoire. |
| `wip` | Pas pret a merge. |
| `blocked` | Bloque par autre chose (documenter en description). |
| `e2e` | Run Playwright E2E (opt-in sur PR). |

## 5. Approbation

- **1 approbation** minimum pour merge sur `main`.
- **2 approbations** pour : breaking changes, migrations non-trivial,
  refactor > 500 lignes, code de securite (auth, paiement).
- L'auteur ne peut pas self-approuver.

## 6. Que faire quand on est en desaccord

1. **Discuter dans les threads PR** en premier.
2. Si blocage : call rapide (15 min async ou meet).
3. Si toujours blocage : escalader au tech lead, decision tranchee.
4. **Ecrire un ADR** si la decision a valeur de precedent.

On ne merge jamais un code approuve sous pression. Mais on ne bloque pas
non plus ad vitam sur un point de style.

## 7. Merge strategy

- **Rebase + merge** par defaut (historique lineaire).
- **Squash** uniquement si la PR a des commits WIP intermediaires. Le
  message de squash doit respecter Conventional Commits.
- **Create a merge commit** uniquement pour des merges de release
  branches exceptionnels.

Voir [`commits.md`](./commits.md).

## 8. Apres le merge

- Supprimer la branche distante (option GitHub "delete branch").
- Verifier le deploy (Vercel / Railway statuts).
- Verifier `/ready` (api).
- Verifier pas de nouvelle erreur Sentry dans la 15 min qui suit.

## 9. Anti-patterns reviewer

- **Bikeshedding** : passer 20 min sur le nom d'une variable. On a
  Prettier + conventions. Si un nom te choque, une phrase "nit: `x` plus
  parlant que `data`" suffit.
- **Demande de refactor hors scope** : "pendant que tu y es, pourrais-tu
  aussi refaire X et Y". Non. Ouvre un ticket.
- **Approval sans lire** : c'est pire que refuser. Si t'as pas le temps,
  dit-le, re-assigne.
- **Refuser sans proposer** : "c'est mal fait" sans alternative.

## 10. Anti-patterns auteur

- **PR sans description** : le reviewer doit deviner.
- **PR avec 50 fichiers et 3 scopes differents** : impossible a reviewer.
- **Ignorer les commentaires** : soit tu resouds, soit tu explique pourquoi
  tu resouds pas.
- **Forcer un merge "pour avancer"** : les regles sont les regles.
