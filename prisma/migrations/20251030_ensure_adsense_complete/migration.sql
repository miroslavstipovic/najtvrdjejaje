-- Comprehensive AdSense Setup Migration
-- This migration ensures the ad_settings table exists with all required columns
-- and creates default settings if none exist

-- Create ad_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ad_settings" (
    "id" SERIAL NOT NULL,
    "enabledOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "enabledOnArticles" BOOLEAN NOT NULL DEFAULT true,
    "enabledOnCategories" BOOLEAN NOT NULL DEFAULT true,
    "adsenseClientId" TEXT,
    "homepageAdSlot" TEXT,
    "articleContentAdSlot" TEXT,
    "articleBottomAdSlot" TEXT,
    "articleSidebarAdSlot" TEXT,
    "categoryTopAdSlot" TEXT,
    "categoryInlineAdSlot" TEXT,
    "mapSidebarAdSlot" TEXT,
    "mapBottomAdSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_settings_pkey" PRIMARY KEY ("id")
);

-- Add columns if they don't exist (for existing tables)
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "homepageAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleContentAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleBottomAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleSidebarAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryTopAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryInlineAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "mapSidebarAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "mapBottomAdSlot" TEXT;

-- Insert default settings if table is empty
INSERT INTO "ad_settings" (
    "enabledOnHomepage",
    "enabledOnArticles",
    "enabledOnCategories",
    "adsenseClientId",
    "createdAt",
    "updatedAt"
)
SELECT 
    true,
    true,
    true,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ad_settings");

-- Success message (PostgreSQL comment)
COMMENT ON TABLE "ad_settings" IS 'AdSense configuration table - auto-created on deployment';

