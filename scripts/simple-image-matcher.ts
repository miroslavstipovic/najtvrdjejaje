#!/usr/bin/env tsx

/**
 * Simple Image and Video Matcher
 * Matches pictures to articles and moves YouTube URLs to video field
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function matchImagesAndVideos() {
  console.log('🎯 Starting simple image and video matching...')
  
  try {
    // Check pictures directory
    const picturesDir = path.join(process.cwd(), 'pictures')
    console.log(`📁 Pictures directory: ${picturesDir}`)
    
    if (!fs.existsSync(picturesDir)) {
      console.log('❌ Pictures directory not found!')
      return
    }
    
    const pictureFiles = fs.readdirSync(picturesDir)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
    
    console.log(`📊 Found ${pictureFiles.length} picture files`)
    
    // Get all articles
    const articles = await prisma.article.findMany()
    console.log(`📰 Found ${articles.length} articles`)
    
    let imagesMatched = 0
    let videosExtracted = 0
    
    // Process each article
    for (const article of articles) {
      let updated = false
      let updates: any = {}
      
      // 1. Extract YouTube URL from content if not already set
      if (!article.videoUrl && article.content) {
        const youtubeMatch = article.content.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i)
        if (youtubeMatch) {
          const videoUrl = youtubeMatch[0].replace(/nn$/, '').trim()
          
          // Clean content by removing YouTube URL
          const cleanedContent = article.content
            .replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(?:[&\w=]*)?/gi, '')
            .replace(/nn+/g, '\n\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim()
          
          updates.videoUrl = videoUrl
          updates.videoType = 'youtube'
          updates.content = cleanedContent
          updated = true
          videosExtracted++
          
          console.log(`📺 Extracted video from: ${article.title}`)
          console.log(`   Video: ${videoUrl}`)
        }
      }
      
      // 2. Match images based on keywords
      if (article.coverImage && article.coverImage.includes('picsum.photos')) {
        const matchedImage = findMatchingImage(article, pictureFiles)
        if (matchedImage) {
          updates.coverImage = `/pictures/${matchedImage}`
          updated = true
          imagesMatched++
          
          console.log(`🖼️  Matched image for: ${article.title}`)
          console.log(`   Image: ${matchedImage}`)
        }
      }
      
      // Update article if changes were made
      if (updated) {
        await prisma.article.update({
          where: { id: article.id },
          data: updates
        })
      }
    }
    
    console.log('\n📊 Results:')
    console.log(`Images matched: ${imagesMatched}`)
    console.log(`Videos extracted: ${videosExtracted}`)
    console.log('✅ Matching completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function findMatchingImage(article: any, pictureFiles: string[]): string | null {
  const title = article.title.toLowerCase()
  const content = article.content ? article.content.toLowerCase() : ''
  
  // Define keyword mappings
  const keywordMappings = {
    'emin': ['emin'],
    'brko': ['brko'],
    'dernek': ['dernek', 'đurđevdanski'],
    'ilija': ['ilija'],
    'jozo': ['jozo', 'joza'],
    'kaktus': ['kaktus'],
    'mago': ['mago', 'mađioničar'],
    'bager': ['bager'],
    'krevet': ['krevet', 'kućice'],
    'kuca': ['kuća', 'kuca', 'blaženka', 'vlado'],
    'face_brodice': ['brodice'],
    'jackye': ['jackye'],
    'kaminoska': ['kaminoska', 'prikolica']
  }
  
  // Find matching images
  for (const [imageKey, keywords] of Object.entries(keywordMappings)) {
    for (const keyword of keywords) {
      if (title.includes(keyword) || content.includes(keyword)) {
        // Find the highest resolution version of this image
        const matchingFiles = pictureFiles.filter(file => 
          file.toLowerCase().includes(imageKey.toLowerCase())
        )
        
        if (matchingFiles.length > 0) {
          // Sort by resolution (find highest)
          matchingFiles.sort((a, b) => {
            const resA = getResolutionValue(a)
            const resB = getResolutionValue(b)
            return resB - resA
          })
          
          return matchingFiles[0]
        }
      }
    }
  }
  
  return null
}

function getResolutionValue(fileName: string): number {
  const match = fileName.match(/-(\d+)x(\d+)/)
  if (match) {
    return parseInt(match[1]) * parseInt(match[2])
  }
  
  // If no resolution in filename, assume it's the original (highest)
  if (!fileName.includes('-')) {
    return 999999
  }
  
  return 0
}

// Run the function
matchImagesAndVideos().catch(console.error)
