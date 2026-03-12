-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

