-- CreateTable
CREATE TABLE IF NOT EXISTS "locations" (
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

-- CreateTable
CREATE TABLE IF NOT EXISTS "ad_settings" (
    "id" SERIAL NOT NULL,
    "enabledOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "enabledOnArticles" BOOLEAN NOT NULL DEFAULT true,
    "enabledOnCategories" BOOLEAN NOT NULL DEFAULT true,
    "adsenseClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_settings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable  
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "articles_locationId_idx" ON "articles"("locationId");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "articles" ADD CONSTRAINT "articles_location_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

