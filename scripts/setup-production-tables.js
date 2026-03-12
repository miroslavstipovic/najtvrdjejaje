/**
 * Production Database Setup Script
 * 
 * This script connects to your production database and creates missing tables.
 * 
 * Usage:
 * 1. Make sure your .env or .env.local has DATABASE_URL set to production
 * 2. Run: node scripts/setup-production-tables.js
 */

const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting production database setup...\n')

  try {
    // Create locations table
    console.log('📍 Creating locations table...')
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
    console.log('✅ Locations table created (or already exists)\n')

    // Create ad_settings table
    console.log('💰 Creating ad_settings table...')
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
    console.log('✅ Ad settings table created (or already exists)\n')

    // Add order column to categories
    console.log('📑 Adding order column to categories...')
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
      `)
      console.log('✅ Order column added to categories\n')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Order column already exists\n')
      } else {
        throw e
      }
    }

    // Add locationId to articles
    console.log('📄 Adding locationId column to articles...')
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."articles" ADD COLUMN IF NOT EXISTS "locationId" INTEGER;
      `)
      console.log('✅ LocationId column added to articles\n')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  LocationId column already exists\n')
      } else {
        throw e
      }
    }

    // Add foreign keys and indexes
    console.log('🔗 Adding foreign keys and indexes...')
    
    // Foreign key for locations.articleId
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."locations" 
        ADD CONSTRAINT "locations_articleId_fkey" 
        FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `)
      console.log('✅ Foreign key locations -> articles added')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Foreign key locations -> articles already exists')
      } else {
        console.log('⚠️  Could not add foreign key (might already exist):', e.message)
      }
    }

    // Index for articles.locationId
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "articles_locationId_idx" ON "public"."articles"("locationId");
      `)
      console.log('✅ Index on articles.locationId created')
    } catch (e) {
      console.log('ℹ️  Index might already exist')
    }

    // Foreign key for articles.locationId
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."articles" 
        ADD CONSTRAINT "articles_location_fkey" 
        FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
      `)
      console.log('✅ Foreign key articles -> locations added\n')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Foreign key articles -> locations already exists\n')
      } else {
        console.log('⚠️  Could not add foreign key (might already exist):', e.message, '\n')
      }
    }

    console.log('🎉 Production database setup completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Redeploy your application on Vercel')
    console.log('2. All features should now work correctly!\n')

  } catch (error) {
    console.error('❌ Error setting up database:')
    console.error(error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

