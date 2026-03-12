#!/usr/bin/env tsx

/**
 * Direct Image Update Script
 * Directly updates articles with matching images and extracts YouTube URLs
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

// Helper function to safely extract error information
function getErrorInfo(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    }
  }
  return {
    message: String(error),
    stack: undefined
  }
}

async function directImageUpdate() {
  console.log('🚀 Starting direct image update process...')
  console.log(`📅 Timestamp: ${new Date().toISOString()}`)
  
  try {
    // Define direct mappings based on the pictures I saw
    const imageMappings = [
      // Emin articles
      { keywords: ['emin'], image: '/pictures/emin_naslovna_1.1.2-1024x576.png' },
      
      // Dernek articles  
      { keywords: ['dernek', 'đurđevdanski', 'turbet'], image: '/pictures/dernek003_1.4.1.png' },
      
      // Brko articles
      { keywords: ['brko'], image: '/pictures/brko-original_1.6.1.png' },
      
      // Jozo articles
      { keywords: ['jozo', 'joza'], image: '/pictures/jozo_naslovna.jpg' },
      
      // Kaktus articles
      { keywords: ['kaktus'], image: '/pictures/kaktusi001.jpg' },
      
      // Mago/Mađioničar articles
      { keywords: ['mago', 'mađioničar'], image: '/pictures/mago01.jpg' },
      
      // Bager articles
      { keywords: ['bager'], image: '/pictures/bager_naslovna.jpg' },
      
      // Krevet/Kućice articles
      { keywords: ['krevet', 'kućice'], image: '/pictures/krevet.jpg' },
      
      // Kuća articles (Blaženka i Vlado)
      { keywords: ['blaženka', 'vlado', 'kuća'], image: '/pictures/kuca05.png' },
      
      // Ilija articles
      { keywords: ['ilija'], image: '/pictures/Ilija-02.jpg' },
      
      // Jackye articles
      { keywords: ['jackye'], image: '/pictures/jackye_naslovna.jpg' }
    ]
    
    // Get all articles
    console.log('📄 Fetching articles from database...')
    const articles = await prisma.article.findMany()
    console.log(`📊 Found ${articles.length} articles to process`)
    
    let imagesUpdated = 0
    let videosExtracted = 0
    
    for (const article of articles) {
      let updates: any = {}
      let shouldUpdate = false
      
      // 1. Extract YouTube URLs from content
      if (!article.videoUrl && article.content) {
        const youtubeMatch = article.content.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i)
        if (youtubeMatch) {
          const videoUrl = youtubeMatch[0].replace(/nn$/, '').trim()
          
          // Clean content
          const cleanedContent = article.content
            .replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(?:[&\w=]*)?/gi, '')
            .replace(/nn+/g, '\n\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim()
          
          updates.videoUrl = videoUrl
          updates.videoType = 'youtube'
          updates.content = cleanedContent
          shouldUpdate = true
          videosExtracted++
        }
      }
      
      // 2. Match images based on keywords
      if (article.coverImage && article.coverImage.includes('picsum.photos')) {
        const title = article.title.toLowerCase()
        const content = article.content ? article.content.toLowerCase() : ''
        
        for (const mapping of imageMappings) {
          let matched = false
          for (const keyword of mapping.keywords) {
            if (title.includes(keyword) || content.includes(keyword)) {
              updates.coverImage = mapping.image
              shouldUpdate = true
              imagesUpdated++
              matched = true
              break
            }
          }
          if (matched) break
        }
      }
      
      // Update article if needed
      if (shouldUpdate) {
        await prisma.article.update({
          where: { id: article.id },
          data: updates
        })
      }
    }
    
    // Write results to a file since terminal output isn't working
    const results = `
Image and Video Update Results:
==============================
Images updated: ${imagesUpdated}
Videos extracted: ${videosExtracted}
Total articles processed: ${articles.length}
Timestamp: ${new Date().toISOString()}
`
    
    console.log('✅ Update process completed successfully!')
    console.log(`🖼️  Images updated: ${imagesUpdated}`)
    console.log(`📺 Videos extracted: ${videosExtracted}`)
    console.log(`📝 Total articles processed: ${articles.length}`)
    
    const fs = require('fs')
    fs.writeFileSync('update-results.txt', results)
    console.log('💾 Results saved to update-results.txt')
    
    return { imagesUpdated, videosExtracted, totalArticles: articles.length }
    
  } catch (error) {
    const fs = require('fs')
    const errorInfo = getErrorInfo(error)
    const errorDetails = `Error: ${errorInfo.message}\nStack: ${errorInfo.stack || 'No stack trace available'}\nTimestamp: ${new Date().toISOString()}`
    fs.writeFileSync('update-error.txt', errorDetails)
    console.error('Deployment Error Details:', errorDetails)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
directImageUpdate()
  .then(results => {
    // Success - results written to file
  })
  .catch(error => {
    // Error written to file
  })
