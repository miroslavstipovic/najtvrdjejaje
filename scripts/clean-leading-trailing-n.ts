import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

interface CleanupResult {
  id: number
  title: {
    original: string
    cleaned: string
    changed: boolean
  }
  content: {
    original: string
    cleaned: string
    changed: boolean
  }
  excerpt: {
    original: string | null
    cleaned: string | null
    changed: boolean
  }
}

function cleanText(text: string | null): { cleaned: string | null; changed: boolean } {
  if (!text || typeof text !== 'string') {
    return { cleaned: text, changed: false }
  }

  const originalText = text
  let cleanedText = text

  // Remove 'n' from the start
  while (cleanedText.startsWith('n') && cleanedText.length > 1) {
    cleanedText = cleanedText.substring(1)
  }

  // Remove 'n' from the end
  while (cleanedText.endsWith('n') && cleanedText.length > 1) {
    cleanedText = cleanedText.slice(0, -1)
  }

  // Trim whitespace
  cleanedText = cleanedText.trim()

  return {
    cleaned: cleanedText,
    changed: originalText !== cleanedText
  }
}

async function cleanupArticles() {
  console.log('🔄 Starting article text cleanup...')
  console.log('📋 This script will remove the letter "n" from the beginning and end of:')
  console.log('   - Article titles')
  console.log('   - Article content')
  console.log('   - Article excerpts')
  console.log()

  try {
    // Fetch all articles
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true
      }
    })

    console.log(`📊 Found ${articles.length} articles to process`)
    console.log()

    const results: CleanupResult[] = []
    let totalChanges = 0

    for (const article of articles) {
      const titleResult = cleanText(article.title)
      const contentResult = cleanText(article.content)
      const excerptResult = cleanText(article.excerpt)

      const hasChanges = titleResult.changed || contentResult.changed || excerptResult.changed

      if (hasChanges) {
        totalChanges++
        
        const result: CleanupResult = {
          id: article.id,
          title: {
            original: article.title,
            cleaned: titleResult.cleaned || '',
            changed: titleResult.changed
          },
          content: {
            original: article.content,
            cleaned: contentResult.cleaned || '',
            changed: contentResult.changed
          },
          excerpt: {
            original: article.excerpt,
            cleaned: excerptResult.cleaned,
            changed: excerptResult.changed
          }
        }

        results.push(result)

        console.log(`📝 Article ${article.id}:`)
        if (titleResult.changed) {
          console.log(`   📌 Title: "${article.title}" → "${titleResult.cleaned}"`)
        }
        if (excerptResult.changed) {
          console.log(`   📄 Excerpt: "${article.excerpt}" → "${excerptResult.cleaned}"`)
        }
        if (contentResult.changed) {
          const originalLength = article.content.length
          const newLength = contentResult.cleaned?.length || 0
          console.log(`   📝 Content: ${originalLength} chars → ${newLength} chars`)
        }
        console.log()
      }
    }

    if (totalChanges === 0) {
      console.log('✅ No articles need cleaning. All articles are already clean!')
      return
    }

    console.log(`🎯 Found ${totalChanges} articles that need cleaning`)
    console.log()

    // Ask for confirmation (in production, you might want to add a --force flag)
    console.log('🔧 Starting database updates...')

    let updatedCount = 0

    for (const result of results) {
      try {
        await prisma.article.update({
          where: { id: result.id },
          data: {
            ...(result.title.changed && { title: result.title.cleaned }),
            ...(result.content.changed && { content: result.content.cleaned }),
            ...(result.excerpt.changed && { excerpt: result.excerpt.cleaned })
          }
        })

        updatedCount++
        console.log(`✅ Updated article ${result.id}`)
      } catch (error) {
        console.error(`❌ Failed to update article ${result.id}:`, error)
      }
    }

    console.log()
    console.log('🎉 Cleanup completed!')
    console.log(`📊 Statistics:`)
    console.log(`   - Total articles processed: ${articles.length}`)
    console.log(`   - Articles with changes: ${totalChanges}`)
    console.log(`   - Successfully updated: ${updatedCount}`)
    console.log(`   - Failed updates: ${totalChanges - updatedCount}`)

  } catch (error) {
    console.error('💥 Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export the function for potential reuse
export { cleanupArticles, cleanText }

// Run the script if called directly
if (require.main === module) {
  cleanupArticles()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}
