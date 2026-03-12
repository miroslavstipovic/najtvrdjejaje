import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function analyzeCurrentImages() {
  console.log('🔍 Analyzing current article images...')
  
  try {
    // Get all articles with their current image information
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        coverImage: true,
        content: true
      },
      orderBy: { id: 'asc' }
    })

    console.log(`📊 Total articles: ${articles.length}`)
    
    const withImages = articles.filter(a => a.coverImage)
    const withoutImages = articles.filter(a => !a.coverImage)
    
    console.log(`🖼️ Articles with coverImage: ${withImages.length}`)
    console.log(`❌ Articles without coverImage: ${withoutImages.length}`)
    console.log()
    
    if (withImages.length > 0) {
      console.log('📝 Current coverImage values:')
      withImages.slice(0, 15).forEach(article => {
        console.log(`  ${article.id}: ${article.title.substring(0, 50)}...`)
        console.log(`     -> ${article.coverImage}`)
      })
      
      if (withImages.length > 15) {
        console.log(`     ... and ${withImages.length - 15} more`)
      }
    }
    
    console.log()
    console.log('🔍 Sample articles without images:')
    withoutImages.slice(0, 10).forEach(article => {
      console.log(`  ${article.id}: ${article.title.substring(0, 60)}...`)
    })
    
    if (withoutImages.length > 10) {
      console.log(`     ... and ${withoutImages.length - 10} more without images`)
    }
    
    // Check if any articles reference pictures folder
    const pictureReferences = articles.filter(a => 
      a.coverImage?.includes('/pictures/') || 
      a.coverImage?.includes('pictures/') ||
      a.content?.includes('/pictures/') ||
      a.content?.includes('pictures/')
    )
    
    console.log()
    console.log(`🔗 Articles referencing 'pictures' folder: ${pictureReferences.length}`)
    if (pictureReferences.length > 0) {
      pictureReferences.slice(0, 5).forEach(article => {
        console.log(`  ${article.id}: ${article.title.substring(0, 40)}...`)
        if (article.coverImage?.includes('pictures')) {
          console.log(`     coverImage: ${article.coverImage}`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Error analyzing articles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the analysis
analyzeCurrentImages()
  .then(() => {
    console.log('✅ Analysis completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error)
    process.exit(1)
  })
