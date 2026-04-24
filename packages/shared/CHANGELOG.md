# Changelog

All notable changes to `@strickin/shared` are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-04-24

### Added

- Sub-path exports: `@strickin/shared/domain`, `/api`, `/events`, `/constants`, `/utils`, `/schemas`.
- **Domain layer** mirroring `apps/api/prisma/schema.prisma`:
  - `User`, `Cgp`, `Insurer`, `Issuer`, `Product` (+ `RiskMetrics`), `Envelope`
    (+ legacy `Shelf`), `Client`, `Contract`, `Position`, `Rfq` (+
    `IssuerRfqQuote`), `Order` (+ legacy `Commitment`), `Signature`,
    `AuditLog`, `AIInteraction`.
  - Cross-cutting types: `ESGScore` / `SFDRClassification`, PRIIPs
    `TargetMarket` (InvestorCategory, KnowledgeExperience, LossBearingCapacity,
    RiskTolerance, InvestmentObjective), `AuditAction`.
- **API contracts**: `RegisterDto` / `LoginDto` / `RefreshDto`,
  `AuthResponseDto`, `MeResponseDto`, `UpdateUserDto`, `CreateProductDto` /
  `UpdateProductDto` / `ProductFilters` / `ListProductsResponse`, RFQ CRUD DTOs
  (`CreateRfqDto`, `SendRfqDto`, `SubmitQuoteDto`, `AcceptQuoteDto`, …), AI
  chat + portfolio DTOs, `PagedResponse<T>` / `CursorPagedResponse<T>`,
  `ApiError` class + `ErrorCode` enum.
- **Domain events**: `DomainEvent<T,D,V>` envelope with user lifecycle,
  commitment/order, RFQ, signature, and KYC events. `AnyDomainEvent` union
  type for exhaustive switches.
- **Constants**: `COMMITMENT_SCALES`, `PAYOFF_LABELS` / `PAYOFF_COLORS`
  (updated with REVERSE), `SRI_COLORS` / `SRI_LABELS`, `SFDR_LABELS` /
  `SFDR_DESCRIPTIONS` / `SFDR_COLORS`, `REGULATORY_REFERENCES`,
  `REGULATORY_DISCLAIMERS`.
- **Utilities**:
  - Formatters: `formatEuros`, `formatPct`, `formatDate`, `formatIsin`,
    `formatBps`, `formatSiren`.
  - Validators: `isValidIsin` (Luhn ISIN), `isValidOrias`, `isValidSiren`,
    `isValidSiret`, `isValidLei` (mod-97-10), `isValidEmail`,
    `isValidPassword` (`PASSWORD_REGEX`).
  - Type guards: `isUser`, `isUserPublic`, `isCGP`, `isInsurer`, `isIssuer`,
    `isProduct`, `isUserRole`.
- **Zod schemas** for auth (`RegisterSchema`, `LoginSchema`, `RefreshSchema`),
  products (`CreateProductSchema`, `UpdateProductSchema`,
  `ProductFiltersSchema`) and RFQ (`CreateRfqSchema`, `SendRfqSchema`,
  `SubmitQuoteSchema`, `AcceptQuoteSchema`, …).
- **Vitest** setup and unit tests for formatters, validators, type guards and
  the auth schema.
- README and this changelog.

### Changed

- Enum-like exports (`UserRole`, `PayoffType`, `ProductStatus`, …) migrated
  from TypeScript `enum` to `as const` objects. Runtime access (`PayoffType.AUTOCALL_PHOENIX`) is preserved; types continue to be `PayoffType = 'AUTOCALL_PHOENIX' | ...`.
- `PayoffType` gained `REVERSE`. `ProductStatus` gained `LIVE` and `PAUSED`.
  `CommitmentStatus` gained `REVIEW`. All additions are non-breaking.
- `package.json` now exports multiple sub-paths; the root import keeps every
  legacy name exported.

### Backwards compatibility

- `import { ... } from '@strickin/shared'` continues to work for every value
  and type exposed by v0.1 (`PayoffType`, `ProductStatus`, `UserRole`,
  `OnboardingStatus`, `OrgType`, `CommitmentStatus`, `ShelfStatus`,
  `ProductSummary`, `ShelfSummary`, `CommitmentSummary`, `MarketQuote`,
  `LoginDto`, `AuthResponse`, `COMMITMENT_SCALES`, `SRI_COLORS`,
  `PAYOFF_LABELS`, `PAYOFF_COLORS`).
- The legacy `AuthResponse` shape (with `orgType`) is re-exported as an alias
  of `LegacyAuthResponse` to avoid breaking v1 callers.

## [0.1.0] — 2025-03-08

- Initial flat package with enums, ProductSummary, ShelfSummary,
  CommitmentSummary, MarketQuote, LoginDto, AuthResponse, and a minimum set
  of constants (COMMITMENT_SCALES, SRI_COLORS, PAYOFF_LABELS, PAYOFF_COLORS).
