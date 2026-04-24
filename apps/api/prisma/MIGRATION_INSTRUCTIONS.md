# Migration Instructions — Strick'in API (Sprint 1 T1.2)

This document lists the **manual commands** you must run once the rest of the
Sprint 1 code has landed in order to apply the consolidated Prisma schema
(`apps/api/prisma/schema.prisma`) and seed the demo data.

The schema has already been validated (`npx prisma validate`) and formatted
(`npx prisma format`) — this doc only covers **applying** it against the
Supabase database.

## 0. Prerequisites

1. `.env.local` at the repo root must contain valid `DATABASE_URL` (pooled,
   port 6543 with `?pgbouncer=true`) and `DIRECT_URL` (direct, port 5432).
   The direct URL is used by Prisma migrations.
2. From the **repo root**, install deps if not done yet:
   ```bash
   npm install
   ```
3. Make sure you are pointing at the intended Supabase project. Migrations
   are destructive operations in preview/staging — double-check the host
   before running.

All commands below are to be run from the `apps/api/` directory unless
otherwise stated:

```bash
cd apps/api
```

## 1. Generate the Prisma Client (safe, local only)

```bash
npx prisma generate
```

This only regenerates TypeScript types in `node_modules/@prisma/client`. No
DB connection required.

## 2. Apply the migration to the database

### Option A — Fresh DB (preferred for dev/preview)

If the DB is empty or you are happy to reset it:

```bash
npx prisma migrate dev --name add_production_schema
```

This will:
- Diff the schema against the existing migration history.
- Create a new migration folder `prisma/migrations/<timestamp>_add_production_schema/`.
- Apply it using `DIRECT_URL`.
- Regenerate the Prisma Client.

If Prisma asks to reset because the local schema drifted, answer `y` **only
if the data is disposable**.

### Option B — Existing Supabase DB you cannot reset

If the Supabase DB already contains data you want to keep (legacy rows,
other pilot data) and Prisma refuses a straight `migrate dev`, you have two
sub-options:

**B.1 — Sync the schema without creating a migration file (fastest, no
history):**

```bash
npx prisma db push
```

This forces the DB to match `schema.prisma`, skipping the migration journal.
Use this only on preview/pilot environments; production should always keep
a migration history.

**B.2 — Generate a migration then deploy it:**

```bash
# 1) Generate a SQL diff against the current DB state without applying:
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/manual_sprint1_diff.sql

# 2) Review the SQL by hand (VERY important — check for destructive DROPs).
#    Adjust if needed.

# 3) Apply the reviewed migration:
npx prisma migrate deploy
```

## 3. Seed the database

Once the schema is applied, run the seed script (idempotent — safe to re-run):

```bash
npm run db:seed
```

Internally this runs `ts-node prisma/seed.ts`, which will upsert:

- **3 pilote CGPs** (`pilote1..3@cabinet-demo.fr` / password `Pilote2026!`)
- **1 Insurer** "Cardif Demo" with **3 Envelopes**
- **1 Issuer** "BNP Demo" with **10 structured products** (ISINs `FR001401xxxx`)
- **15 Clients** (5 per CGP) with **30 Contracts** (2 each) and **30 Positions**
- Plus the legacy demo data (MT products, organizations, shelves,
  commissions, issuer profiles…) for backwards compatibility with existing
  Next.js demo routes.

## 4. Verification queries (optional)

After seed, sanity-check with:

```bash
npx prisma studio
```

Or from `psql`:

```sql
SELECT count(*) FROM cgps;              -- expected: 3
SELECT count(*) FROM insurers;          -- expected: 1
SELECT count(*) FROM issuers;           -- expected: 1
SELECT count(*) FROM envelopes;         -- expected: 3
SELECT count(*) FROM clients;           -- expected: 15
SELECT count(*) FROM contracts;         -- expected: 30
SELECT count(*) FROM positions;         -- expected: 30
SELECT count(*) FROM products
  WHERE "issuerId" IS NOT NULL;         -- expected: 10 (BNP Demo issuer)
```

## 5. Notes on schema choices

- Legacy models (`Organization`, `Shelf`, `Commitment`, `RfqRequest`,
  `RfqQuote`, `IssuerProfile`, `ProductTemplate`…) are **kept** to preserve
  compatibility with existing Next.js API routes and the NestJS pricing
  simulator.
- Sprint 1 spec `RFQ`/`RFQQuote` are modelled as Prisma models `Rfq` and
  `IssuerRfqQuote` (SQL tables `rfqs` and `issuer_rfq_quotes`) to avoid
  collision with the legacy pricing-engine `RfqRequest`/`RfqQuote`.
- `User.role` (`UserRole` enum) was **extended**, not replaced:
  `SUPER_ADMIN, ORG_ADMIN, MANAGER, VIEWER, CGP, INSURER_ADMIN,
  ISSUER_ADMIN, PLATFORM_ADMIN`. Legacy values remain so the existing admin
  and demo users keep working.
- `onDelete: Restrict` is the default. Exceptions documented in the schema
  top-of-file comment. No `Cascade` on financial records (`Position`,
  `Order`, `Contract`).

## 6. Troubleshooting

**"Environment variable not found: DIRECT_URL"**
→ You're not loading `.env.local`. Either `export`-set the vars in your
   shell, or prefix the command:

```bash
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate dev ...
```

**"The database schema is not empty"** when running `migrate dev`
→ Either accept the reset prompt (dev only) or switch to the
   `migrate diff` / `migrate deploy` flow (Option B.2 above).

**"P3005: The database schema is not empty and no baseline migration exists"**
→ Run once:

```bash
npx prisma migrate resolve --applied 20260308145805_init
```

then retry `migrate dev`.
