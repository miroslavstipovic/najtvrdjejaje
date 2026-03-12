import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function cleanHardcodedImages() {
  try {
    console.log('🔍 Searching for articles with hardcoded images...')
    
    // Find articles with hardcoded image tags
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { content: { contains: '<img' } },
          { content: { contains: 'flash.ba/wp-content/uploads' } },
          { content: { contains: '<figure' } },
          { content: { contains: '<figcaption' } }
        ]
      },
      select: {
        id: true,
        title: true,
        content: true
      }
    })

    console.log(`📊 Found ${articles.length} articles with potential hardcoded images`)

    if (articles.length === 0) {
      console.log('✅ No articles with hardcoded images found!')
      return
    }

    // Process each article
    for (const article of articles) {
      console.log(`\n🔧 Processing: ${article.title} (ID: ${article.id})`)
      
      let cleanedContent = article.content
      let changesCount = 0

      // Remove img tags with flash.ba URLs
      const imgRegex = /<img[^>]*src="https?:\/\/flash\.ba\/wp-content\/uploads\/[^"]*"[^>]*>/gi
      const imgMatches = cleanedContent.match(imgRegex)
      if (imgMatches) {
        console.log(`  📸 Found ${imgMatches.length} hardcoded image(s)`)
        cleanedContent = cleanedContent.replace(imgRegex, '')
        changesCount += imgMatches.length
      }

      // Remove figure tags
      const figureRegex = /<figure[^>]*>[\s\S]*?<\/figure>/gi
      const figureMatches = cleanedContent.match(figureRegex)
      if (figureMatches) {
        console.log(`  🖼️ Found ${figureMatches.length} figure tag(s)`)
        cleanedContent = cleanedContent.replace(figureRegex, '')
        changesCount += figureMatches.length
      }

      // Remove standalone figcaption tags
      const figcaptionRegex = /<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi
      const figcaptionMatches = cleanedContent.match(figcaptionRegex)
      if (figcaptionMatches) {
        console.log(`  📝 Found ${figcaptionMatches.length} figcaption tag(s)`)
        cleanedContent = cleanedContent.replace(figcaptionRegex, '')
        changesCount += figcaptionMatches.length
      }

      // Remove any other img tags
      const otherImgRegex = /<img[^>]*>/gi
      const otherImgMatches = cleanedContent.match(otherImgRegex)
      if (otherImgMatches) {
        console.log(`  🖼️ Found ${otherImgMatches.length} other image tag(s)`)
        cleanedContent = cleanedContent.replace(otherImgRegex, '')
        changesCount += otherImgMatches.length
      }

      // Clean up extra whitespace and empty lines
      cleanedContent = cleanedContent
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple empty lines to double
        .replace(/^\s+|\s+$/g, '') // Trim start and end
        .replace(/\s+$/gm, '') // Remove trailing spaces from lines

      if (changesCount > 0) {
        // Update the article
        await prisma.article.update({
          where: { id: article.id },
          data: { content: cleanedContent }
        })
        console.log(`  ✅ Cleaned ${changesCount} element(s) from article`)
      } else {
        console.log(`  ℹ️ No changes needed for this article`)
      }
    }

    console.log('\n🎉 Cleanup completed!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanHardcodedImages()
