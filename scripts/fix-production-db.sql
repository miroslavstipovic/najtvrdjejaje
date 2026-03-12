-- Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT,
    "articleId" INTEGER,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'locations_articleId_fkey'
    ) THEN
        ALTER TABLE "public"."locations" 
        ADD CONSTRAINT "locations_articleId_fkey" 
        FOREIGN KEY ("articleId") 
        REFERENCES "public"."articles"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- Create ad_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."ad_settings" (
    "id" SERIAL NOT NULL,
    "enabledOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "enabledOnArticles" BOOLEAN NOT NULL DEFAULT true,
    "enabledOnCategories" BOOLEAN NOT NULL DEFAULT true,
    "adsenseClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_settings_pkey" PRIMARY KEY ("id")
);

-- Add order column to categories if it doesn't exist
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Add locationId to articles if it doesn't exist (already done in previous migration)
ALTER TABLE "public"."articles" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;

-- Add index and foreign key for articles.locationId if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'articles' 
        AND indexname = 'articles_locationId_idx'
    ) THEN
        CREATE INDEX "articles_locationId_idx" ON "public"."articles"("locationId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'articles_location_fkey'
    ) THEN
        ALTER TABLE "public"."articles" 
        ADD CONSTRAINT "articles_location_fkey" 
        FOREIGN KEY ("locationId") 
        REFERENCES "public"."locations"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

