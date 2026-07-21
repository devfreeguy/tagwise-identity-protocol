-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "identity_status" AS ENUM ('active', 'blocked');

-- CreateTable
CREATE TABLE "identities" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "bump" SMALLINT NOT NULL,
    "display_name" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "preferred_token" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "merchant" BOOLEAN NOT NULL DEFAULT false,
    "status" "identity_status" NOT NULL DEFAULT 'active',
    "last_applied_slot" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_state" (
    "id" TEXT NOT NULL,
    "last_processed_slot" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identities_tag_key" ON "identities"("tag");

-- CreateIndex
CREATE INDEX "identities_owner_idx" ON "identities"("owner");

-- CreateIndex
CREATE INDEX "identities_status_idx" ON "identities"("status");
