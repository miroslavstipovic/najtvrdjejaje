#!/usr/bin/env tsx

/**
 * Import Data to Production Database
 * This script imports data from exported JSON files to your production database.
 * Make sure your DATABASE_URL points to your production database.
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface ImportData {
  admins: any[]
  categories: any[]
  articles: any[]
  siteSettings: any[]
  metadata?: {
    exportDate: string
    totalRecords: number
  }
}

async function importData(exportFilePath?: string) {
  try {
    console.log('🚀 Starting production database import...\n')

    // Determine import file
    let importPath: string
    if (exportFilePath) {
      importPath = exportFilePath
    } else {
      // Use latest export
      const exportsDir = path.join(process.cwd(), 'exports')
      importPath = path.join(exportsDir, 'latest-export.json')
    }

    if (!fs.existsSync(importPath)) {
      console.error('❌ Export file not found:', importPath)
      console.log('💡 Run the export script first: tsx scripts/export-local-data.ts')
      process.exit(1)
    }

    console.log('📂 Reading export file:', importPath)
    const importData: ImportData = JSON.parse(fs.readFileSync(importPath, 'utf8'))

    console.log('📊 Import Summary:')
    console.log(`   👤 Admins: ${importData.admins.length}`)
    console.log(`   📂 Categories: ${importData.categories.length}`)
    console.log(`   📰 Articles: ${importData.articles.length}`)
    console.log(`   ⚙️  Settings: ${importData.siteSettings.length}`)
    if (importData.metadata) {
      console.log(`   📅 Export Date: ${importData.metadata.exportDate}`)
    }
    console.log()

    // Confirm before proceeding
    console.log('⚠️  WARNING: This will overwrite existing data in your production database!')
    console.log('🔗 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') || 'Not set')
    console.log()

    // In a real scenario, you'd want to prompt for confirmation
    // For automation, we'll proceed with a safety check
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not set. Please configure your production database URL.')
      process.exit(1)
    }

    console.log('🔄 Starting import process...\n')

    // 1. Import Categories first (referenced by articles)
    console.log('📂 Importing categories...')
    const categoryMapping: { [oldId: number]: number } = {}
    
    for (const category of importData.categories) {
      const { id, ...categoryData } = category
      const imported = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData
      })
      categoryMapping[id] = imported.id
      console.log(`   ✓ ${categoryData.name} (${categoryData.slug})`)
    }

    // 2. Import Site Settings
    console.log('\n⚙️  Importing site settings...')
    for (const setting of importData.siteSettings) {
      await prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      })
      console.log(`   ✓ ${setting.key}`)
    }

    // 3. Import Admins
    console.log('\n👤 Importing admins...')
    for (const admin of importData.admins) {
      const { id, password, ...adminData } = admin
      
      // Re-hash password for security (in case export contains hashed passwords)
      let hashedPassword = password
      if (!password.startsWith('$2a$') && !password.startsWith('$2b$')) {
        // If password is not already hashed, hash it
        hashedPassword = await bcrypt.hash(password, 10)
      }

      await prisma.admin.upsert({
        where: { email: adminData.email },
        update: { ...adminData, password: hashedPassword },
        create: { ...adminData, password: hashedPassword }
      })
      console.log(`   ✓ ${adminData.email} (${adminData.name})`)
    }

    // 4. Import Articles (with updated category references)
    console.log('\n📰 Importing articles...')
    for (const article of importData.articles) {
      const { id, category, categoryId, ...articleData } = article
      
      // Map old category ID to new category ID
      const newCategoryId = categoryMapping[categoryId]
      if (!newCategoryId) {
        console.warn(`   ⚠️  Skipping article "${articleData.title}" - category not found`)
        continue
      }

      await prisma.article.upsert({
        where: { slug: articleData.slug },
        update: { ...articleData, categoryId: newCategoryId },
        create: { ...articleData, categoryId: newCategoryId }
      })
      console.log(`   ✓ ${articleData.title} (${articleData.slug})`)
    }

    console.log('\n✅ Import completed successfully!')
    console.log('\n📋 Final Summary:')
    
    // Get final counts
    const [finalAdmins, finalCategories, finalArticles, finalSettings] = await Promise.all([
      prisma.admin.count(),
      prisma.category.count(),
      prisma.article.count(),
      prisma.siteSettings.count()
    ])

    console.log(`   👤 Total Admins: ${finalAdmins}`)
    console.log(`   📂 Total Categories: ${finalCategories}`)
    console.log(`   📰 Total Articles: ${finalArticles}`)
    console.log(`   ⚙️  Total Settings: ${finalSettings}`)

    console.log('\n🎉 Your local data has been successfully migrated to production!')
    console.log('\n📝 Next steps:')
    console.log('   1. Test your production application')
    console.log('   2. Update admin passwords if needed')
    console.log('   3. Migrate uploaded files (images/videos)')
    console.log('   4. Update any hardcoded URLs or paths')

  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Command line usage
const exportFile = process.argv[2]
if (require.main === module) {
  importData(exportFile)
}

export { importData }
