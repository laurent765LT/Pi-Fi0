# Changelog

All notable changes to `@strickin/design-system` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-04-24

### Added

- Initial package scaffolding.
- **Tokens** (`src/tokens/`):
  - `colors` — brand (violet, cobalt), semantic (teal, gold, red),
    neutral (ink, surface, border), and editorial `redesign` palette.
  - `darkColors` — dark-mode overrides.
  - `gradients` — named brand gradients.
  - `typography` — font families, sizes (2xs…6xl), weights, line-heights,
    letter-spacings.
  - `spacing` — 4px-based scale + `spacingPx` for React Native.
  - `containers` — layout max-widths.
  - `shadows` + `inkShadows` — violet-tinted and neutral elevations.
  - `radii` — 3px → 32px + `full`.
  - `animations` — durations, easings, named animation presets,
    stagger delays.
- **Primitive type contracts** (`src/primitives/`):
  - `Button` (7 variants × 3 sizes, `loading`, `asChild`)
  - `Card` (+ `CardHeader`, `CardTitle`, `CardDescription`,
    `CardContent`, `CardFooter`)
  - `Badge`, `Input`, `Select`, `Checkbox`, `Modal`, `Toast`,
    `Tooltip`, `Dropdown`, `Tabs`, `Skeleton`, `Pagination`,
    `Breadcrumb`, `Avatar`, `Alert`
  - `UseToastReturn` — typed shape for the `useToast` hook.
- **Pattern type contracts** (`src/patterns/`):
  - `PageHeader` (+ reusable `IconComponent` signature)
  - `EmptyState`
  - `DataTable` (generic `DataTableProps<TRow>` + column, sort types)
  - `TermTooltip` (+ `FinancialGlossary` shape)
- **Utilities** (`src/utils/`):
  - `cn(...inputs)` — class-name merger powered by `clsx` + `tailwind-merge`.
- Documentation (`README.md`) with philosophy, layout, migration roadmap
  (Phase 1–4), and dark-mode strategy.
- Wired as an npm workspace dependency of `apps/web`.

### Notes

- No runtime components are shipped in this release. Every primitive and
  pattern still renders from `apps/web/components/ui/*`. This release is
  the **façade phase** — the contract is fixed so that future moves can
  happen without breaking callers.
- Tokens are mirrored in `apps/web/tailwind.config.ts` and
  `apps/web/app/globals.css`. Keep those in sync until the tokens are
  generated from this package.
