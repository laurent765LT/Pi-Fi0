-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('INSURER', 'BROKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'DOCS_UPLOADED', 'VERIFIED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PayoffType" AS ENUM ('AUTOCALL_PHOENIX', 'AUTOCALL_COUPON', 'CAPITAL_PROTECTED', 'CONDITIONAL_RATE', 'BARRIER_NOTE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'MATURED', 'RECALLED');

-- CreateEnum
CREATE TYPE "ShelfStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITING', 'CANCELLED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "orgId" TEXT NOT NULL,
    "oriasNumber" TEXT,
    "oriasValidUntil" TIMESTAMP(3),
    "rcpInsurer" TEXT,
    "rcpAmount" DOUBLE PRECISION,
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "isin" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payoffType" "PayoffType" NOT NULL,
    "issuerName" TEXT NOT NULL,
    "guarantorName" TEXT,
    "underlyingName" TEXT NOT NULL,
    "underlyingYahoo" TEXT NOT NULL,
    "initialPrice" DOUBLE PRECISION,
    "barrierCapPct" DOUBLE PRECISION NOT NULL,
    "autocallBarrierPct" DOUBLE PRECISION,
    "couponPct" DOUBLE PRECISION,
    "maxGainPct" DOUBLE PRECISION NOT NULL,
    "sri" INTEGER NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "observationDates" TIMESTAMP(3)[],
    "entryFeePct" DOUBLE PRECISION NOT NULL,
    "managementFeePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reference" TEXT,
    "kidUrl" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_metrics" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "volatility1Y" DOUBLE PRECISION,
    "sharpeRatio" DOUBLE PRECISION,
    "maxDrawdown" DOUBLE PRECISION,
    "mcSimulations" INTEGER,
    "mcScenarios" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orgId" TEXT,
    "status" "ShelfStatus" NOT NULL DEFAULT 'OPEN',
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "surbookingPct" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commitments" (
    "id" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'PENDING',
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_isin_key" ON "products"("isin");

-- CreateIndex
CREATE UNIQUE INDEX "risk_metrics_productId_key" ON "risk_metrics"("productId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_metrics" ADD CONSTRAINT "risk_metrics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "shelves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
