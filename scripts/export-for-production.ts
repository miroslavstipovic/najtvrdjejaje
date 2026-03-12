import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface ExportData {
  articles: any[]
  categories: any[]
  media: any[]
  articleMedia: any[]
  siteSettings: any[]
  admins: any[]
  exportedAt: string
  totalCounts: {
    articles: number
    categories: number
    media: number
    articleMedia: number
    siteSettings: number
    admins: number
  }
}

async function exportForProduction() {
  console.log('🚀 Starting production data export...')
  
  try {
    // Export all articles
    console.log('📝 Exporting articles...')
    const articles = await prisma.article.findMany({
      orderBy: { id: 'asc' }
    })

    // Export all categories
    console.log('📂 Exporting categories...')
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' }
    })

    // Export all media
    console.log('📷 Exporting media records...')
    const media = await prisma.media.findMany({
      orderBy: { id: 'asc' }
    })

    // Export article-media relationships
    console.log('🔗 Exporting article-media relationships...')
    const articleMedia = await prisma.articleMedia.findMany({
      orderBy: { articleId: 'asc' }
    })

    // Export site settings
    console.log('⚙️ Exporting site settings...')
    const siteSettings = await prisma.siteSettings.findMany()

    // Export admins (without passwords for security)
    console.log('👤 Exporting admin accounts...')
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
        // Exclude password hash
      }
    })

    const exportData: ExportData = {
      articles,
      categories,
      media,
      articleMedia,
      siteSettings,
      admins,
      exportedAt: new Date().toISOString(),
      totalCounts: {
        articles: articles.length,
        categories: categories.length,
        media: media.length,
        articleMedia: articleMedia.length,
        siteSettings: siteSettings.length,
        admins: admins.length
      }
    }

    // Save to file
    const exportPath = path.join(process.cwd(), 'production-export.json')
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2))

    console.log('\n🎉 Export completed successfully!')
    console.log(`📊 Export Summary:`)
    console.log(`  - Articles: ${exportData.totalCounts.articles}`)
    console.log(`  - Categories: ${exportData.totalCounts.categories}`)
    console.log(`  - Media records: ${exportData.totalCounts.media}`)
    console.log(`  - Article-Media relationships: ${exportData.totalCounts.articleMedia}`)
    console.log(`  - Site settings: ${exportData.totalCounts.siteSettings}`)
    console.log(`  - Admin accounts: ${exportData.totalCounts.admins}`)
    console.log(`  - Export file: ${exportPath}`)
    
    // Show articles with images
    const articlesWithImages = articles.filter(a => a.coverImage)
    console.log(`\n📷 Articles with images: ${articlesWithImages.length}`)
    
    // Show sample of articles
    console.log(`\n📝 Sample articles:`)
    articles.slice(0, 5).forEach(article => {
      console.log(`  ${article.id}: ${article.title.substring(0, 50)}...`)
      if (article.coverImage) {
        console.log(`     🖼️  Image: ${article.coverImage}`)
      }
      if (article.videoUrl) {
        console.log(`     🎬  Video: ${article.videoUrl}`)
      }
    })

    return exportData
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  exportForProduction()
    .then(() => {
      console.log('✅ Export script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Export script failed:', error)
      process.exit(1)
    })
}

export { exportForProduction }
