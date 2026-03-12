/**
 * Check which database we're connected to
 */

const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('\n🔍 Checking database connection...\n')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET')
    
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT current_database() as database, current_user as user`
    console.log('\n✅ Connected to database:', result[0])
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log('\n📋 Tables in database:')
    tables.forEach(t => console.log('  -', t.table_name))
    
    const hasLocations = tables.some(t => t.table_name === 'locations')
    const hasAdSettings = tables.some(t => t.table_name === 'ad_settings')
    
    console.log('\n📊 Required tables:')
    console.log('  - locations:', hasLocations ? '✅ EXISTS' : '❌ MISSING')
    console.log('  - ad_settings:', hasAdSettings ? '✅ EXISTS' : '❌ MISSING')
    
    if (!hasLocations || !hasAdSettings) {
      console.log('\n⚠️  Missing tables detected!')
      console.log('This appears to be your LOCAL database.')
      console.log('\nTo run against PRODUCTION:')
      console.log('1. Get your production DATABASE_URL from Vercel')
      console.log('2. Run: $env:DATABASE_URL="production-url"; node scripts/check-database.js')
    } else {
      console.log('\n✅ All required tables exist!')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

