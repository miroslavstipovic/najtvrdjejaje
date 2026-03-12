-- AlterTable
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "homepageAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleContentAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleBottomAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "articleSidebarAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryTopAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "categoryInlineAdSlot" TEXT;

