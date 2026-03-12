import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs/promises'
import path from 'path'
import { getErrorInfo } from './utils/error-handler'

const prisma = new PrismaClient()

interface ImportData {
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

async function importToProductionDB() {
  console.log('🚀 Starting production database import...')
  
  // Load export data
  const exportPath = path.join(process.cwd(), 'production-export.json')
  const mappingPath = path.join(process.cwd(), 'image-url-mapping.json')
  
  try {
    console.log('📂 Loading export data...')
    const exportDataRaw = await fs.readFile(exportPath, 'utf-8')
    const exportData: ImportData = JSON.parse(exportDataRaw)
    
    console.log('🔗 Loading image URL mapping...')
    const mappingDataRaw = await fs.readFile(mappingPath, 'utf-8')
    const imageMapping: Record<string, string> = JSON.parse(mappingDataRaw)
    
    console.log(`📊 Import data loaded:`)
    console.log(`  - Articles: ${exportData.totalCounts.articles}`)
    console.log(`  - Categories: ${exportData.totalCounts.categories}`)
    console.log(`  - Media: ${exportData.totalCounts.media}`)
    console.log(`  - Image mappings: ${Object.keys(imageMapping).length}`)

    // Check if production DB is empty
    const existingArticles = await prisma.article.count()
    if (existingArticles > 0) {
      console.log(`⚠️  Production database already has ${existingArticles} articles`)
      console.log('   This script will skip existing records to avoid duplicates')
    }

    let imported = {
      categories: 0,
      articles: 0,
      media: 0,
      articleMedia: 0,
      siteSettings: 0
    }

    // Import categories first
    console.log('\n📂 Importing categories...')
    for (const category of exportData.categories) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: category.slug }
        })
        
        if (!existing) {
          await prisma.category.create({
            data: {
              name: category.name,
              slug: category.slug,
              description: category.description,
              coverImage: category.coverImage,
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt)
            }
          })
          imported.categories++
          console.log(`✅ Created category: ${category.name}`)
        } else {
          console.log(`⏭️  Category exists: ${category.name}`)
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import category ${category.name}:`, errorInfo.message)
      }
    }

    // Import media with updated URLs
    console.log('\n📷 Importing media records...')
    for (const media of exportData.media) {
      try {
        const existing = await prisma.media.findFirst({
          where: { originalName: media.originalName }
        })
        
        if (!existing) {
          // Update URL if we have a mapping
          const newUrl = imageMapping[media.url] || media.url
          
          await prisma.media.create({
            data: {
              filename: media.filename,
              originalName: media.originalName,
              url: newUrl, // Use Vercel Blob URL
              type: media.type,
              mimeType: media.mimeType,
              size: media.size,
              createdAt: new Date(media.createdAt),
              updatedAt: new Date(media.updatedAt)
            }
          })
          imported.media++
          console.log(`✅ Created media: ${media.originalName} -> ${newUrl}`)
        } else {
          console.log(`⏭️  Media exists: ${media.originalName}`)
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import media ${media.originalName}:`, errorInfo.message)
      }
    }

    // Import articles with updated image URLs
    console.log('\n📝 Importing articles...')
    for (const article of exportData.articles) {
      try {
        const existing = await prisma.article.findUnique({
          where: { slug: article.slug }
        })
        
        if (!existing) {
          // Update coverImage URL if we have a mapping
          const coverImage = article.coverImage && imageMapping[article.coverImage] 
            ? imageMapping[article.coverImage] 
            : article.coverImage

          await prisma.article.create({
            data: {
              title: article.title,
              slug: article.slug,
              content: article.content,
              excerpt: article.excerpt,
              coverImage, // Use Vercel Blob URL
              videoUrl: article.videoUrl,
              videoType: article.videoType,
              isPublished: article.isPublished,
              isFeatured: article.isFeatured,
              categoryId: article.categoryId,
              createdAt: new Date(article.createdAt),
              updatedAt: new Date(article.updatedAt)
            }
          })
          imported.articles++
          console.log(`✅ Created article: ${article.title.substring(0, 50)}...`)
          if (coverImage !== article.coverImage) {
            console.log(`   🔗 Updated image: ${article.coverImage} -> ${coverImage}`)
          }
        } else {
          console.log(`⏭️  Article exists: ${article.title.substring(0, 50)}...`)
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import article ${article.title}:`, errorInfo.message)
      }
    }

    // Import article-media relationships
    console.log('\n🔗 Importing article-media relationships...')
    for (const relationship of exportData.articleMedia) {
      try {
        const existing = await prisma.articleMedia.findFirst({
          where: {
            articleId: relationship.articleId,
            mediaId: relationship.mediaId
          }
        })
        
        if (!existing) {
          await prisma.articleMedia.create({
            data: {
              articleId: relationship.articleId,
              mediaId: relationship.mediaId,
              order: relationship.order,
              createdAt: new Date(relationship.createdAt)
              // Note: ArticleMedia model doesn't have updatedAt field according to Prisma schema
            }
          })
          imported.articleMedia++
          console.log(`✅ Created relationship: Article ${relationship.articleId} <-> Media ${relationship.mediaId}`)
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import relationship:`, errorInfo.message)
      }
    }

    // Import site settings
    console.log('\n⚙️ Importing site settings...')
    for (const setting of exportData.siteSettings) {
      try {
        const existing = await prisma.siteSettings.findUnique({
          where: { key: setting.key }
        })
        
        if (!existing) {
          await prisma.siteSettings.create({
            data: {
              key: setting.key,
              value: setting.value
              // Note: SiteSettings model doesn't have createdAt/updatedAt fields according to Prisma schema
            }
          })
          imported.siteSettings++
          console.log(`✅ Created setting: ${setting.key}`)
        } else {
          // Update existing setting
          await prisma.siteSettings.update({
            where: { key: setting.key },
            data: {
              value: setting.value
              // Note: SiteSettings model doesn't have updatedAt field according to Prisma schema
            }
          })
          console.log(`🔄 Updated setting: ${setting.key}`)
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import setting ${setting.key}:`, errorInfo.message)
      }
    }

    console.log('\n🎉 Import completed!')
    console.log(`📊 Import Summary:`)
    console.log(`  ✅ Categories: ${imported.categories}`)
    console.log(`  ✅ Articles: ${imported.articles}`)
    console.log(`  ✅ Media records: ${imported.media}`)
    console.log(`  ✅ Article-Media relationships: ${imported.articleMedia}`)
    console.log(`  ✅ Site settings: ${imported.siteSettings}`)

    // Verify final counts
    const finalCounts = {
      categories: await prisma.category.count(),
      articles: await prisma.article.count(),
      media: await prisma.media.count(),
      articleMedia: await prisma.articleMedia.count(),
      siteSettings: await prisma.siteSettings.count()
    }

    console.log(`\n📈 Final Database Counts:`)
    console.log(`  - Categories: ${finalCounts.categories}`)
    console.log(`  - Articles: ${finalCounts.articles}`)
    console.log(`  - Media: ${finalCounts.media}`)
    console.log(`  - Relationships: ${finalCounts.articleMedia}`)
    console.log(`  - Settings: ${finalCounts.siteSettings}`)

  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Import failed:', errorInfo.message)
    if (errorInfo.stack) {
      console.error('Stack trace:', errorInfo.stack)
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  importToProductionDB()
    .then(() => {
      console.log('✅ Import script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      const errorInfo = getErrorInfo(error)
      console.error('💥 Import script failed:', errorInfo.message)
      process.exit(1)
    })
}

export { importToProductionDB }
