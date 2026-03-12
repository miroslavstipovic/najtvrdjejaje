-- Add AdSense slot ID columns to ad_settings table for Vercel deployment
-- Run this on your Vercel Postgres database

ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "homepageAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleContentAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleBottomAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleSidebarAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryTopAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryInlineAdSlot" TEXT;

-- Check the result
SELECT * FROM "ad_settings";

