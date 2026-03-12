#!/usr/bin/env tsx

/**
 * Export Local Database Data
 * This script exports all data from your local development database
 * to JSON files that can be imported to your production database.
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface ExportData {
  admins: any[]
  categories: any[]
  articles: any[]
  siteSettings: any[]
  metadata: {
    exportDate: string
    totalRecords: number
  }
}

async function exportData() {
  try {
    console.log('🚀 Starting local database export...\n')

    // Create exports directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true })
    }

    // Export all data
    console.log('📊 Exporting data...')
    
    const [admins, categories, articles, siteSettings] = await Promise.all([
      prisma.admin.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      prisma.category.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      prisma.article.findMany({
        include: {
          category: true
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.siteSettings.findMany({
        orderBy: { key: 'asc' }
      })
    ])

    const exportData: ExportData = {
      admins,
      categories,
      articles,
      siteSettings,
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: admins.length + categories.length + articles.length + siteSettings.length
      }
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `local-data-export-${timestamp}.json`
    const filepath = path.join(exportDir, filename)

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2))

    // Create a latest export symlink/copy
    const latestPath = path.join(exportDir, 'latest-export.json')
    fs.writeFileSync(latestPath, JSON.stringify(exportData, null, 2))

    // Print summary
    console.log('✅ Export completed successfully!\n')
    console.log('📋 Export Summary:')
    console.log(`   📁 File: ${filepath}`)
    console.log(`   👤 Admins: ${admins.length}`)
    console.log(`   📂 Categories: ${categories.length}`)
    console.log(`   📰 Articles: ${articles.length}`)
    console.log(`   ⚙️  Settings: ${siteSettings.length}`)
    console.log(`   📊 Total Records: ${exportData.metadata.totalRecords}`)
    console.log(`   📅 Export Date: ${exportData.metadata.exportDate}\n`)

    // Create individual exports for easier handling
    const individualExports = {
      admins: { data: admins, filename: `admins-${timestamp}.json` },
      categories: { data: categories, filename: `categories-${timestamp}.json` },
      articles: { data: articles, filename: `articles-${timestamp}.json` },
      siteSettings: { data: siteSettings, filename: `site-settings-${timestamp}.json` }
    }

    for (const [type, export_] of Object.entries(individualExports)) {
      const individualPath = path.join(exportDir, export_.filename)
      fs.writeFileSync(individualPath, JSON.stringify(export_.data, null, 2))
      console.log(`   📄 ${type}: ${individualPath}`)
    }

    console.log('\n🎉 All data exported successfully!')
    console.log('📝 Next steps:')
    console.log('   1. Set up your online database')
    console.log('   2. Run the import script with your export file')
    console.log('   3. Migrate uploaded files if any')

  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  exportData()
}

export { exportData }
