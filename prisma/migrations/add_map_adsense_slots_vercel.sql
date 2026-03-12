-- Add map ad slot fields to ad_settings table
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "mapSidebarAdSlot" TEXT;
ALTER TABLE "ad_settings" ADD COLUMN IF NOT EXISTS "mapBottomAdSlot" TEXT;
