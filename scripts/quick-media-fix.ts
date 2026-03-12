#!/usr/bin/env tsx

/**
 * Quick Media Fix Script
 * Fixes common issues with migrated WordPress content
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function quickMediaFix() {
  try {
    console.log('🔧 Starting quick media fixes...\n')
    
    // Get all articles
    const articles = await prisma.article.findMany()
    
    let videosFixed = 0
    let contentCleaned = 0
    let imagesAdded = 0
    
    for (const article of articles) {
      let updated = false
      let updates: any = {}
      
      // 1. Fix YouTube URLs (remove extra characters)
      if (article.videoUrl) {
        const cleanVideoUrl = article.videoUrl
          .replace(/nn$/, '')  // Remove trailing 'nn'
          .replace(/\s+$/, '') // Remove trailing spaces
          .trim()
        
        if (cleanVideoUrl !== article.videoUrl) {
          updates.videoUrl = cleanVideoUrl
          updated = true
          videosFixed++
        }
      }
      
      // 2. Extract YouTube URL from content if not already set
      if (!article.videoUrl && article.content) {
        const youtubeMatch = article.content.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i)
        if (youtubeMatch) {
          updates.videoUrl = youtubeMatch[0]
          updates.videoType = 'youtube'
          updated = true
          videosFixed++
        }
      }
      
      // 3. Clean up content formatting
      if (article.content) {
        const cleanedContent = article.content
          // Fix paragraph tags
          .replace(/n<p>/g, '\n\n')
          .replace(/<\/p>n/g, '\n\n')
          .replace(/<p>/g, '\n\n')
          .replace(/<\/p>/g, '\n\n')
          // Remove extra 'n' characters
          .replace(/nn+/g, '\n\n')
          // Clean up YouTube URLs in content
          .replace(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)nn/g, '')
          // Remove extra whitespace
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .trim()
        
        if (cleanedContent !== article.content) {
          updates.content = cleanedContent
          updated = true
          contentCleaned++
        }
      }
      
      // 4. Add placeholder cover image if none exists
      if (!article.coverImage) {
        // Use a placeholder image service
        const placeholderImage = `https://picsum.photos/800/450?random=${article.id}`
        updates.coverImage = placeholderImage
        updated = true
        imagesAdded++
      }
      
      // Update article if changes were made
      if (updated) {
        await prisma.article.update({
          where: { id: article.id },
          data: updates
        })
        
        console.log(`✅ Fixed: ${article.title}`)
        if (updates.videoUrl) console.log(`   📺 Video: ${updates.videoUrl}`)
        if (updates.coverImage) console.log(`   🖼️  Image: ${updates.coverImage}`)
      }
    }
    
    console.log('\n📊 Quick Fix Statistics:')
    console.log('========================')
    console.log(`Videos fixed: ${videosFixed}`)
    console.log(`Content cleaned: ${contentCleaned}`)
    console.log(`Images added: ${imagesAdded}`)
    console.log('\n✅ Quick fixes completed!')
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

quickMediaFix().catch(console.error)
