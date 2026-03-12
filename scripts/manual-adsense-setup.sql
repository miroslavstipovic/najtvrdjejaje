-- Quick AdSense Setup SQL
-- Run this directly in your database if migrations don't work
-- This is a safe, idempotent script (can run multiple times)

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ad_settings" (
    "id" SERIAL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add any missing columns (safe - won't fail if column exists)
DO $$ 
BEGIN
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "homepageAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleContentAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleBottomAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleSidebarAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryTopAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryInlineAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "mapSidebarAdSlot" TEXT;
    ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "mapBottomAdSlot" TEXT;
END $$;

-- Step 3: Insert default row if table is empty
INSERT INTO "ad_settings" (
    "enabledOnHomepage",
    "enabledOnArticles",
    "enabledOnCategories",
    "createdAt",
    "updatedAt"
)
SELECT 
    true,
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "ad_settings");

-- Step 4: Verify setup
SELECT 
    id,
    "enabledOnHomepage",
    "enabledOnArticles",
    "enabledOnCategories",
    "adsenseClientId",
    "homepageAdSlot",
    "createdAt"
FROM "ad_settings";

-- Success! You should see one row in the result
-- If you see a row, the table is ready to use

