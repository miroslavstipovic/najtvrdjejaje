import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch (error) {
    return 0
  }
}

async function copyImageToPublic(sourcePath: string, filename: string): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'media')
  
  // Ensure directory exists
  await fs.mkdir(publicDir, { recursive: true })
  
  // Generate unique filename to avoid conflicts
  const ext = path.extname(filename)
  const nameWithoutExt = path.basename(filename, ext)
  const uniqueFilename = `${nameWithoutExt}-${Date.now()}${ext}`
  
  const destinationPath = path.join(publicDir, uniqueFilename)
  const publicUrl = `/uploads/media/${uniqueFilename}`
  
  await fs.copyFile(sourcePath, destinationPath)
  
  return publicUrl
}

async function createMediaRecord(filename: string, originalName: string, url: string, size: number): Promise<number> {
  const media = await prisma.media.create({
    data: {
      filename,
      originalName,
      url,
      type: 'image',
      mimeType: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
      size
    }
  })
  
  return media.id
}

async function importRemainingPictures() {
  console.log('🔄 Processing remaining articles with /pictures/ references...')
  
  try {
    // Get articles that still reference /pictures/ folder
    const articles = await prisma.article.findMany({
      where: {
        coverImage: {
          contains: '/pictures/'
        }
      },
      select: {
        id: true,
        title: true,
        coverImage: true
      }
    })

    console.log(`📊 Found ${articles.length} articles still referencing /pictures/ folder`)
    
    let processed = 0
    let errors = 0

    for (const article of articles) {
      try {
        if (!article.coverImage) continue
        
        // Extract filename from current path
        const filename = path.basename(article.coverImage)
        const sourcePath = path.join(process.cwd(), 'pictures', filename)
        
        // Check if source file exists
        try {
          await fs.access(sourcePath)
        } catch (error) {
          console.log(`⚠️  File not found: ${filename} for article ${article.id}`)
          continue
        }

        console.log(`📷 Processing article ${article.id}: ${filename}`)
        
        // Copy image to public directory
        const publicUrl = await copyImageToPublic(sourcePath, filename)
        
        // Create media record
        const size = await getFileSize(sourcePath)
        const mediaId = await createMediaRecord(filename, filename, publicUrl, size)
        
        // Update article
        await prisma.article.update({
          where: { id: article.id },
          data: { coverImage: publicUrl }
        })
        
        // Create article-media relationship (check if it doesn't exist first)
        const existingRelation = await prisma.articleMedia.findFirst({
          where: { articleId: article.id }
        })
        
        if (!existingRelation) {
          await prisma.articleMedia.create({
            data: {
              articleId: article.id,
              mediaId,
              order: 0
            }
          })
        }
        
        console.log(`✅ Updated article ${article.id}: ${publicUrl}`)
        processed++
        
      } catch (error) {
        console.error(`❌ Failed to process article ${article.id}:`, error)
        errors++
      }
    }

    console.log()
    console.log('🎉 Remaining pictures import completed!')
    console.log(`  - Successfully processed: ${processed}`)
    console.log(`  - Errors: ${errors}`)
    
    // Final statistics
    const updatedArticles = await prisma.article.findMany({
      select: {
        id: true,
        coverImage: true
      }
    })
    
    const withNewImages = updatedArticles.filter(a => a.coverImage?.includes('/uploads/media/'))
    const withOldImages = updatedArticles.filter(a => a.coverImage?.includes('/pictures/'))
    const withoutImages = updatedArticles.filter(a => !a.coverImage)
    
    console.log()
    console.log('📈 Final Statistics:')
    console.log(`  - Articles with new images (/uploads/media/): ${withNewImages.length}`)
    console.log(`  - Articles with old images (/pictures/): ${withOldImages.length}`)
    console.log(`  - Articles without images: ${withoutImages.length}`)
    console.log(`  - Total articles: ${updatedArticles.length}`)

  } catch (error) {
    console.error('💥 Error during remaining import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  importRemainingPictures()
    .then(() => {
      console.log('✅ Remaining pictures import script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Remaining pictures import script failed:', error)
      process.exit(1)
    })
}
