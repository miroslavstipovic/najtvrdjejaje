import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This is a one-time setup endpoint to create missing tables
export async function GET(request: NextRequest) {
  try {
    // Security check - require a secret token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // Use environment variable or a secret string
    const expectedToken = process.env.SETUP_SECRET || 'setup-2024-secret-key'
    
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Run the SQL commands directly
    await prisma.$executeRawUnsafe(`
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
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
      );
    `)

    await prisma.$executeRawUnsafe(`
      -- Create ad_settings table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "public"."ad_settings" (
          "id" SERIAL NOT NULL,
          "enabledOnHomepage" BOOLEAN NOT NULL DEFAULT true,
          "enabledOnArticles" BOOLEAN NOT NULL DEFAULT true,
          "enabledOnCategories" BOOLEAN NOT NULL DEFAULT true,
          "adsenseClientId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "ad_settings_pkey" PRIMARY KEY ("id")
      );
    `)

    // Add order column to categories
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
      `)
    } catch (e) {
      console.log('Order column might already exist:', e)
    }

    // Add locationId to articles
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."articles" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;
      `)
    } catch (e) {
      console.log('LocationId column might already exist:', e)
    }

    // Add foreign key for locations
    try {
      await prisma.$executeRawUnsafe(`
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
      `)
    } catch (e) {
      console.log('Foreign key might already exist:', e)
    }

    // Add index for articles.locationId
    try {
      await prisma.$executeRawUnsafe(`
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
      `)
    } catch (e) {
      console.log('Index might already exist:', e)
    }

    // Add foreign key for articles.locationId
    try {
      await prisma.$executeRawUnsafe(`
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
      `)
    } catch (e) {
      console.log('Articles location foreign key might already exist:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!',
      details: {
        locationsTable: 'Created or already exists',
        adSettingsTable: 'Created or already exists',
        categoriesOrderColumn: 'Added or already exists',
        articlesLocationIdColumn: 'Added or already exists',
        foreignKeys: 'Added or already exist',
        indexes: 'Added or already exist'
      }
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to setup tables',
        message: error.message,
        details: error
      },
      { status: 500 }
    )
  }
}

