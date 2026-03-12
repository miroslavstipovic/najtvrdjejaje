-- AlterTable - Add locationId column if it doesn't exist
ALTER TABLE "public"."articles" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;

-- CreateIndex (if not exists) - only if the column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'locationid'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'articles' 
        AND indexname = 'articles_locationId_idx'
    ) THEN
        CREATE INDEX "articles_locationId_idx" ON "public"."articles"("locationId");
    END IF;
END $$;

-- AddForeignKey (only if locations table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'locations'
    ) AND NOT EXISTS (
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
