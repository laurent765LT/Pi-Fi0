-- KYCStatus + colonnes alignées sur schema.prisma (absents de 20260308145805_init).
-- SQL défensif : base Supabase déjà partiellement migrée / baselinée.

DO $$ BEGIN
    CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'kycStatus'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'clients'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'kycStatus'
    ) THEN
        ALTER TABLE "clients" ADD COLUMN "kycStatus" "KYCStatus" NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;
