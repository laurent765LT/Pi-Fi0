# @strickin/design-system

Shared design tokens, primitive type contracts, patterns, and utilities for
the Strick'in product surface.

> **Status:** `v0.1.0` — façade phase.
> Tokens are authoritative. Primitive/pattern runtime implementations
> still live in `apps/web/components/ui/*`. Types are already canonical.

---

## Philosophy

The design system is built as a **pyramid of decisions**:

```
┌──────────────────────┐
│      Patterns        │  ← composite UI blocks (PageHeader, EmptyState, DataTable…)
├──────────────────────┤
│      Primitives      │  ← atomic UI (Button, Card, Badge, Input…)
├──────────────────────┤
│        Tokens        │  ← raw values (colors, spacing, radii, shadows…)
└──────────────────────┘
```

- **Tokens** are platform-agnostic TypeScript constants. Zero dependency
  on React, Tailwind, or the DOM. Safe to consume from a future React
  Native app, a Node script, or a Figma exporter.
- **Primitives** expose a shared **type contract** (`ButtonProps`,
  `CardProps`, etc.). The runtime implementation can live in the web app
  today and be lifted into this package later without breaking callers.
- **Patterns** combine several primitives into ready-to-use blocks
  (`PageHeader`, `EmptyState`, `DataTable`, `TermTooltip`).

---

## Installation

Already wired as a workspace dependency:

```jsonc
// apps/web/package.json
"dependencies": {
  "@strickin/design-system": "*"
}
```

```bash
npm install
```

## Usage

### Tokens (platform-agnostic)

```ts
import { colors, spacing, radii, shadows } from '@strickin/design-system/tokens';

const buttonStyle = {
  backgroundColor: colors.violet.DEFAULT,
  padding: spacing[3],
  borderRadius: radii.md,
  boxShadow: shadows.md,
};
```

### Utilities

```ts
import { cn } from '@strickin/design-system/utils';

cn('px-2 py-1', isActive && 'bg-violet text-white');
```

### Primitive types (today)

```ts
import type { ButtonProps, BadgeVariant } from '@strickin/design-system';
import { Button } from '@/components/ui/button'; // runtime still here
```

### After migration (tomorrow)

```ts
import { Button, Badge, type ButtonProps } from '@strickin/design-system';
```

---

## Package layout

```
packages/design-system/
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
└── src/
    ├── index.ts                    # Root barrel — re-exports everything
    ├── tokens/                     # Platform-agnostic constants
    │   ├── colors.ts
    │   ├── typography.ts
    │   ├── spacing.ts
    │   ├── shadows.ts
    │   ├── radii.ts
    │   └── animations.ts
    ├── primitives/                 # Atomic UI contracts
    │   ├── button/
    │   ├── card/
    │   ├── badge/
    │   ├── input/
    │   ├── select/
    │   ├── checkbox/
    │   ├── modal/
    │   ├── toast/
    │   ├── tooltip/
    │   ├── dropdown/
    │   ├── tabs/
    │   ├── skeleton/
    │   ├── pagination/
    │   ├── breadcrumb/
    │   ├── avatar/
    │   └── alert/
    ├── patterns/                   # Composite UI contracts
    │   ├── page-header/
    │   ├── empty-state/
    │   ├── data-table/
    │   └── term-tooltip/
    └── utils/
        └── cn.ts
```

---

## Adding a new primitive

1. Create `src/primitives/<name>/<name>.types.ts`
   - Export a `<Name>Props` interface.
   - If the component has variants, export a `<Name>Variant` union.
2. Create `src/primitives/<name>/index.ts` that re-exports the types.
3. Add `export type { ... } from './<name>';` to
   `src/primitives/index.ts`.
4. If the runtime lives in `apps/web/components/ui/<name>.tsx`, make sure
   the component imports its props from `@strickin/design-system` going
   forward (see the migration roadmap below).

---

## Migration roadmap — moving components into the package

The goal is to make the existing web components (`apps/web/components/ui/*`)
comply with the types defined here, then physically relocate them.

### Phase 1 — Types only (DONE ✅)

- Package created with tokens, primitive types, pattern types, and `cn`.
- No component moved, no existing import broken.

### Phase 2 — Align props (one component at a time)

For each primitive:

1. Update the runtime component to import its props from
   `@strickin/design-system`:
   ```ts
   // apps/web/components/ui/button.tsx
   import type { ButtonProps, ButtonVariant, ButtonSize }
     from '@strickin/design-system';
   ```
2. Remove the local `interface ButtonProps` declaration.
3. Commit — no visual change expected.

### Phase 3 — Lift the runtime

Once every consumer imports types from `@strickin/design-system`:

1. Move `apps/web/components/ui/button.tsx` →
   `packages/design-system/src/primitives/button/button.tsx`.
2. Update `src/primitives/button/index.ts` to export the component:
   ```ts
   export { Button } from './button';
   export type { ButtonProps, ButtonVariant, ButtonSize }
     from './button.types';
   ```
3. In `apps/web/components/ui/button.tsx`, leave only a re-export shim:
   ```ts
   export { Button } from '@strickin/design-system';
   ```
4. Swap consumer imports over time from
   `@/components/ui/button` → `@strickin/design-system`.
5. Delete the shim once no consumer references it.

### Phase 4 — Mobile parity

When the React Native app is introduced:

- Split primitive runtimes into `.web.tsx` + `.native.tsx` variants.
- Keep a single `<name>.types.ts` as the shared contract.
- Metro's platform resolver picks the correct file automatically.

---

## Dark mode strategy

The web app ships dark mode via Tailwind's `class` strategy (`.dark` on
`<html>`). Dark overrides are applied through CSS variables in
`apps/web/app/globals.css`.

For programmatic access (dynamic theming, canvas rendering, PDF export),
use the `darkColors` export:

```ts
import { colors, darkColors } from '@strickin/design-system/tokens';

const textColor = isDark ? darkColors.ink.DEFAULT : colors.ink.DEFAULT;
```

When a new token is added, mirror it in both `colors` and `darkColors` if
it differs between the two themes.

---

## Constraints

- **TypeScript strict mode.** No `any` — use `unknown` or narrow types.
- **No circular deps.** Primitives never import from patterns.
- **Tokens must stay framework-free.** No `react`, no `tailwindcss`, no
  `next/*` in `src/tokens/`.
- **Non-destructive.** Adding types here must never break an existing
  import in `apps/web`.

---

## Typecheck

```bash
npm run typecheck --workspace=packages/design-system
```

---

## Related

- [`apps/web/tailwind.config.ts`](../../apps/web/tailwind.config.ts) —
  Tailwind mirror of the color/shadow/radius tokens.
- [`apps/web/app/globals.css`](../../apps/web/app/globals.css) — CSS
  variables consumed by legacy surfaces + animation keyframes.
- [`apps/web/components/ui/`](../../apps/web/components/ui/) — current
  runtime implementations.
