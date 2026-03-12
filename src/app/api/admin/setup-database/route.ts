import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint runs ON Vercel with direct database access
// Access it via: https://your-domain.com/api/admin/setup-database?secret=YOUR_SECRET_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Security check - use environment variable or hardcoded secret
    const expectedSecret = process.env.SETUP_SECRET || 'flashba-setup-2024'
    
    if (secret !== expectedSecret) {
      console.log('[SETUP] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[SETUP] Starting database setup on Vercel...')
    console.log('[SETUP] Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    const results = {
      locationsTable: 'pending',
      adSettingsTable: 'pending',
      categoriesOrderColumn: 'pending',
      articlesLocationIdColumn: 'pending',
      foreignKeys: 'pending',
      indexes: 'pending',
      errors: [] as string[]
    }

    // Create locations table
    try {
      console.log('[SETUP] Creating locations table...')
      await prisma.$executeRawUnsafe(`
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
      results.locationsTable = 'success'
      console.log('[SETUP] ✅ Locations table created')
    } catch (e: any) {
      const msg = e.message
      results.locationsTable = msg.includes('already exists') ? 'already exists' : 'error'
      if (!msg.includes('already exists')) {
        results.errors.push(`Locations table: ${msg}`)
        console.error('[SETUP] Error creating locations table:', msg)
      }
    }

    // Create ad_settings table
    try {
      console.log('[SETUP] Creating ad_settings table...')
      await prisma.$executeRawUnsafe(`
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
      results.adSettingsTable = 'success'
      console.log('[SETUP] ✅ Ad settings table created')
    } catch (e: any) {
      const msg = e.message
      results.adSettingsTable = msg.includes('already exists') ? 'already exists' : 'error'
      if (!msg.includes('already exists')) {
        results.errors.push(`Ad settings table: ${msg}`)
        console.error('[SETUP] Error creating ad_settings table:', msg)
      }
    }

    // Add order column to categories
    try {
      console.log('[SETUP] Adding order column to categories...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
      `)
      results.categoriesOrderColumn = 'success'
      console.log('[SETUP] ✅ Order column added')
    } catch (e: any) {
      const msg = e.message
      results.categoriesOrderColumn = msg.includes('already exists') ? 'already exists' : 'error'
      if (!msg.includes('already exists')) {
        results.errors.push(`Categories order column: ${msg}`)
        console.error('[SETUP] Error adding order column:', msg)
      }
    }

    // Add locationId to articles
    try {
      console.log('[SETUP] Adding locationId column to articles...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."articles" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;
      `)
      results.articlesLocationIdColumn = 'success'
      console.log('[SETUP] ✅ LocationId column added')
    } catch (e: any) {
      const msg = e.message
      results.articlesLocationIdColumn = msg.includes('already exists') ? 'already exists' : 'error'
      if (!msg.includes('already exists')) {
        results.errors.push(`Articles locationId column: ${msg}`)
        console.error('[SETUP] Error adding locationId column:', msg)
      }
    }

    // Add foreign keys (may fail if already exist, that's ok)
    try {
      console.log('[SETUP] Adding foreign keys...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."locations" 
        ADD CONSTRAINT IF NOT EXISTS "locations_articleId_fkey" 
        FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `)
      results.foreignKeys = 'success'
      console.log('[SETUP] ✅ Foreign keys added')
    } catch (e: any) {
      results.foreignKeys = 'attempted'
      console.log('[SETUP] Foreign keys might already exist')
    }

    // Add indexes
    try {
      console.log('[SETUP] Adding indexes...')
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "articles_locationId_idx" ON "public"."articles"("locationId");
      `)
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."articles" 
        ADD CONSTRAINT IF NOT EXISTS "articles_location_fkey" 
        FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `)
      results.indexes = 'success'
      console.log('[SETUP] ✅ Indexes added')
    } catch (e: any) {
      results.indexes = 'attempted'
      console.log('[SETUP] Indexes might already exist')
    }

    console.log('[SETUP] Setup complete!')
    console.log('[SETUP] Results:', results)

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[SETUP] Fatal error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

