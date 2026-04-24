# 04 — Packages partages

**Audience** : tout dev qui importe `@strickin/shared` ou
`@strickin/design-system`.
**Prerequisites** : npm workspaces.

---

## 1. Inventaire

| Package | Dossier | Role |
| --- | --- | --- |
| `@strickin/shared` | `packages/shared/` | Types domain, enums, DTOs, schemas Zod, utils purs cross-workspace. |
| `@strickin/design-system` | `packages/design-system/` | Design tokens, primitives UI (types), patterns, utilitaires de styling. |

Ces packages sont consommes par `apps/web`, `apps/api` et a terme
`apps/cli` + un futur `apps/mobile`. Ils sont **versionnes ensemble avec
le monorepo** (pas de publication npm — references par `workspace:*`).

## 2. `@strickin/shared`

### 2.1 Pourquoi

Pour partager entre frontend et backend :

- Les **enums** (UserRole, OrgType, ProductStatus, PayoffType, ...).
- Les **shapes** de DTOs echangees au fil de l'HTTP (LoginDto, AuthResponse,
  ProductSummary, RfqSummary, CommitmentSummary, MarketQuote).
- Des **constantes metier** (COMMITMENT_SCALES, SRI_COLORS, PAYOFF_LABELS).
- Des **helpers purs** (formatters EUR, parsers ISIN, validateurs target
  market) — aucune dependance a React, Next, NestJS.

### 2.2 Structure

```
packages/shared/
  package.json
  tsconfig.json
  src/
    index.ts                  # barrel
    domain/                   # types metier individuels
      cgp.ts
      client.ts
      contract.ts
      envelope.ts
      esg.ts
      insurer.ts
      issuer.ts
      order.ts
      position.ts
      product.ts
      rfq.ts
      signature.ts
      target-market.ts
      user.ts
```

Le `src/index.ts` re-exporte tout, mais les consommateurs peuvent
aussi importer un sous-fichier :

```ts
import type { RfqSummary } from '@strickin/shared'; // global
// ou, pour tree-shaking plus efficace (Sprint 2 — sub-paths exports)
import type { RfqSummary } from '@strickin/shared/domain/rfq';
```

### 2.3 Regles d'evolution

- **Aucune dependance runtime** autre que Zod (quand necessaire).
- **Pas de code qui assume Node ou Browser** (pas de `process.env`, pas de
  `window`).
- **Additive only par defaut** — ajouter un champ optionnel ne casse rien.
  Retirer ou renommer un champ = breaking change.
- **Enums seulement** (pas de class) — les enums doivent etre serialisables
  tel quel en JSON. Pour les value objects riches, ils vivent dans le
  backend (`apps/api/src/modules/<bc>/domain/value-objects/`).

### 2.4 Gestion des breaking changes

Meme si on ne publie pas sur npm, on traite les breaking changes avec
rigueur :

1. Ouvrir une PR dediee "breaking : shared/X renamed Y".
2. Rechercher tous les consommateurs (`grep -r "from '@strickin/shared'" apps/`).
3. Mettre a jour dans le meme commit.
4. Ajouter une note dans la description PR avec `BREAKING CHANGE:` pour
   le changelog.

Exception : changer une string en enum est **breaking** (le wire level
change). Toujours faire en deux temps : deprecier, puis supprimer au
sprint suivant.

### 2.5 Consumer

**Frontend** :
```ts
import { ProductStatus, type ProductSummary } from '@strickin/shared';
```

**Backend** :
```ts
import { ProductStatus, type LoginDto } from '@strickin/shared';
```

**CLI** :
```ts
import { type RfqSummary } from '@strickin/shared';
```

Le `package.json` declare `"main": "./src/index.ts"` et `"types":
"./src/index.ts"` — TypeScript resout directement le source, pas de build
step. Le build prod se fait par app (Next, Nest) via leur propre bundler.

## 3. `@strickin/design-system`

### 3.1 Pourquoi

Un design system partage garantit :

- **Coherence visuelle** entre web, futur mobile et interfaces admin.
- **Maintenance centralisee** des tokens (colors, spacing, typography).
- **Patterns documentes** — une seule facon de faire une Table, un Modal,
  une Form.

### 3.2 Structure

```
packages/design-system/
  package.json
  tsconfig.json
  src/
    index.ts                  # barrel
    tokens/
      colors.ts
      typography.ts
      spacing.ts
      shadows.ts
      radii.ts
      animations.ts
      index.ts
    primitives/               # types des composants bas niveau
      index.ts
    patterns/                 # types des patterns (forms, tables)
      index.ts
    utils/
      cn.ts                   # clsx + tailwind-merge
      index.ts
```

### 3.3 Sub-path imports

`package.json` declare les exports granulaires pour tree-shaking :

```jsonc
{
  "exports": {
    ".": "./src/index.ts",
    "./tokens": "./src/tokens/index.ts",
    "./tokens/colors": "./src/tokens/colors.ts",
    "./utils": "./src/utils/index.ts",
    "./primitives": "./src/primitives/index.ts",
    "./patterns": "./src/patterns/index.ts"
  }
}
```

Consommation :
```ts
import { colors } from '@strickin/design-system/tokens/colors';
import { cn } from '@strickin/design-system/utils';
```

### 3.4 Role des "primitives" et "patterns"

- **Primitives** = types + specs des composants atomiques (Button, Input,
  Checkbox, Avatar). L'implementation concrete vit dans `apps/web/shared/
  components/` et consomme les tokens.
- **Patterns** = types + specs des assemblages courants (DataTable,
  FormLayout, WizardSteps).

Note : on ne publie pas les composants React dans le package. On publie
les **specs typees** + tokens ; les implementations restent dans `apps/web`
et `apps/mobile`. Ca evite le probleme React 18 / React Native / SSR
cross-workspace, tout en forcant les equipes a consommer le meme vocabulaire.

### 3.5 Dependances

- `clsx` — concat de classNames conditionnelles.
- `tailwind-merge` — dedup des classes Tailwind conflictuelles.
- `react` et `react-dom` sont en **peerDependencies optionnelles** —
  le package reste utilisable depuis `apps/cli` (pure Node) sans React.

### 3.6 Tailwind integration

Les tokens Tailwind du frontend (`apps/web/tailwind.config.ts`) **importent**
les tokens du design system pour garder une source unique de verite.

```ts
// apps/web/tailwind.config.ts (extrait)
import { colors } from '@strickin/design-system/tokens/colors';
import { spacing } from '@strickin/design-system/tokens/spacing';

export default {
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        surface: colors.surface,
      },
      spacing,
    },
  },
};
```

## 4. Flow de modification d'un package partage

### 4.1 Ajouter un type dans `@strickin/shared`

1. Creer le fichier `packages/shared/src/domain/<nom>.ts`.
2. Re-exporter depuis `packages/shared/src/index.ts`.
3. Les consumers (web, api) voient immediatement le type grace a la
   resolution TypeScript directe (pas de build intermediaire).
4. `npm run build` a la racine pour valider que rien n'est casse.

### 4.2 Ajouter un token dans `@strickin/design-system`

1. Creer / modifier le fichier dans `packages/design-system/src/tokens/`.
2. Re-exporter depuis `tokens/index.ts`.
3. Mettre a jour `apps/web/tailwind.config.ts` si le token est utilise en
   classe Tailwind.
4. Documenter l'usage dans `patterns/` si c'est un token lie a un pattern
   (ex : couleur de warning standardisee).

## 5. Regles de proprete

- **Pas de code Node-only** dans les deux packages (ni `fs`, ni `crypto`,
  ni `process`).
- **Pas de code browser-only** non plus (ni `window`, ni `document`).
- **Pas de logique metier** dans `design-system` (c'est du visuel pur).
- **Pas de tokens visuels** dans `shared` (ca reste metier).

## 6. Testing

- `@strickin/shared` : les types sont testes indirectement par leurs
  consumers. Les helpers (formatters, parsers) ont des tests unitaires
  Vitest dans le meme dossier (`foo.ts` + `foo.test.ts`).
- `@strickin/design-system` : les utils (`cn`) ont des tests Vitest. Les
  tokens sont typechecke par TS uniquement.

## 7. Roadmap

| Sprint | Action |
| --- | --- |
| 1 | `@strickin/shared` operationnel, domain types consolides. Pilote `@strickin/design-system` (tokens + utils). |
| 2 | `@strickin/shared` : ajouter les Zod schemas pour validation cote frontend. |
| 2 | `@strickin/design-system` : publier les specs primitives (Button, Input, Select). |
| 3 | `apps/mobile` commence a consommer `@strickin/design-system`. |
| 4 | Evaluer une extraction npm privee si l'archi mobile prend de l'ampleur. |

## 8. Fichiers de reference

- `packages/shared/src/index.ts`
- `packages/shared/src/domain/`
- `packages/design-system/src/index.ts`
- `packages/design-system/package.json` (sub-path exports)
- `apps/web/tailwind.config.ts` (consumer tokens)
