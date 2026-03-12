#!/usr/bin/env tsx

/**
 * Clean HTML Tags Script
 * Removes remaining HTML tags like </p> from article content
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function cleanHtmlTags() {
  console.log('🔍 Searching for articles with HTML tags...')
  
  try {
    // Get all articles
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        content: true
      }
    })
    
    console.log(`📊 Found ${articles.length} articles to check`)
    
    let cleanedCount = 0
    
    for (const article of articles) {
      if (!article.content) continue
      
      // Check if content has HTML tags
      const hasHtmlTags = /<[^>]+>/g.test(article.content)
      
      if (hasHtmlTags) {
        // Clean the content
        let cleanedContent = article.content
        
        // Remove common HTML tags
        cleanedContent = cleanedContent
          // Remove paragraph tags
          .replace(/<\/?p[^>]*>/gi, '')
          // Remove div tags
          .replace(/<\/?div[^>]*>/gi, '')
          // Remove span tags
          .replace(/<\/?span[^>]*>/gi, '')
          // Remove strong/bold tags but keep content
          .replace(/<\/?strong[^>]*>/gi, '')
          .replace(/<\/?b[^>]*>/gi, '')
          // Remove emphasis/italic tags but keep content
          .replace(/<\/?em[^>]*>/gi, '')
          .replace(/<\/?i[^>]*>/gi, '')
          // Remove break tags
          .replace(/<br[^>]*\/?>/gi, '\n')
          // Remove any remaining HTML tags
          .replace(/<[^>]+>/g, '')
          // Clean up extra whitespace
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .replace(/\s+/g, ' ')
          .trim()
        
        // Update the article if content changed
        if (cleanedContent !== article.content) {
          await prisma.article.update({
            where: { id: article.id },
            data: { content: cleanedContent }
          })
          
          cleanedCount++
          console.log(`🔧 Cleaned: ${article.title} (ID: ${article.id})`)
        }
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`)
    console.log(`📊 Articles cleaned: ${cleanedCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanHtmlTags().catch(console.error)
