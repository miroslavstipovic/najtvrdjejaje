#!/usr/bin/env tsx

/**
 * Import Images to Media System
 * This script imports high-resolution images from the pictures folder
 * into the media system and connects them to their respective articles
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface ImageMatch {
  articleId: number
  articleTitle: string
  imagePath: string
  imageFile: string
  matchReason: string
}

async function importImagesToMedia() {
  console.log('🎯 Starting image import to media system...\n')
  
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
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        coverImage: true
      }
    })
    
    console.log(`📰 Found ${articles.length} articles`)
    
    // Define keyword mappings for better matching
    const keywordMappings = {
      // Specific character/person names
      'emin': ['emin'],
      'brko': ['brko'],
      'dernek': ['dernek', 'der'],
      'ilija': ['ilija'],
      'jozo': ['jozo', 'joza'],
      'kaktus': ['kaktus'],
      'mago': ['mago', 'mađioničar'],
      'bager': ['bager'],
      'krevet': ['krevet', 'kućice'],
      'kuca': ['kuća', 'kuca', 'blaženka', 'vlado'],
      'face_brodice': ['brodice', 'face'],
      'jackye': ['jackye'],
      'kaminoska': ['kaminoska', 'prikolica'],
      'solari': ['solar', 'elektrane'],
      'zvonko': ['zvonko', 'josip']
    }
    
    const imageMatches: ImageMatch[] = []
    
    // Process each article to find matching images
    for (const article of articles) {
      const title = article.title.toLowerCase()
      const content = article.content ? article.content.toLowerCase() : ''
      
      // Find matching images
      const matchedImages: { file: string, score: number, reason: string }[] = []
      
      for (const file of pictureFiles) {
        const fileName = file.toLowerCase()
        let score = 0
        let reasons: string[] = []
        
        // Check direct keyword matches
        for (const [key, keywords] of Object.entries(keywordMappings)) {
          if (fileName.includes(key)) {
            for (const keyword of keywords) {
              if (title.includes(keyword) || content.includes(keyword)) {
                score += 10
                reasons.push(`${key} keyword match`)
                break
              }
            }
          }
        }
        
        // Check for partial matches in title
        const titleWords = title.split(/\s+/).filter(word => word.length > 3)
        for (const word of titleWords) {
          if (fileName.includes(word)) {
            score += 5
            reasons.push(`title word: ${word}`)
          }
        }
        
        if (score > 0) {
          matchedImages.push({
            file: file,
            score: score,
            reason: reasons.join(', ')
          })
        }
      }
      
      // Sort by score and get the best match
      if (matchedImages.length > 0) {
        matchedImages.sort((a, b) => b.score - a.score)
        const bestMatch = matchedImages[0]
        
        // Find the highest resolution version of this image
        const highestResImage = findHighestResolution(bestMatch.file, pictureFiles)
        
        imageMatches.push({
          articleId: article.id,
          articleTitle: article.title,
          imagePath: path.join(picturesDir, highestResImage),
          imageFile: highestResImage,
          matchReason: bestMatch.reason
        })
      }
    }
    
    console.log(`\n🎯 Found ${imageMatches.length} image matches`)
    
    // Import images to media system and connect to articles
    let importedCount = 0
    
    for (const match of imageMatches) {
      try {
        console.log(`\n🔧 Processing: ${match.articleTitle}`)
        console.log(`   Image: ${match.imageFile}`)
        console.log(`   Reason: ${match.matchReason}`)
        
        // Check if image file exists
        if (!fs.existsSync(match.imagePath)) {
          console.log(`   ❌ Image file not found: ${match.imagePath}`)
          continue
        }
        
        // Get file stats
        const stats = fs.statSync(match.imagePath)
        const fileSize = stats.size
        
        // Determine MIME type
        const ext = path.extname(match.imageFile).toLowerCase()
        const mimeType = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        }[ext] || 'image/jpeg'
        
        // Create media record
        const media = await prisma.media.create({
          data: {
            filename: match.imageFile,
            originalName: match.imageFile,
            url: `/pictures/${match.imageFile}`,
            type: 'image',
            mimeType: mimeType,
            size: fileSize
          }
        })
        
        console.log(`   ✅ Created media record (ID: ${media.id})`)
        
        // Check if article already has this media
        const existingConnection = await prisma.articleMedia.findFirst({
          where: {
            articleId: match.articleId,
            mediaId: media.id
          }
        })
        
        if (!existingConnection) {
          // Connect media to article
          await prisma.articleMedia.create({
            data: {
              articleId: match.articleId,
              mediaId: media.id,
              order: 0
            }
          })
          
          console.log(`   ✅ Connected to article`)
        } else {
          console.log(`   ℹ️  Already connected to article`)
        }
        
        // Update article cover image if it doesn't have one or has a placeholder
        const article = await prisma.article.findUnique({
          where: { id: match.articleId },
          select: { coverImage: true }
        })
        
        if (!article?.coverImage || article.coverImage.includes('picsum.photos')) {
          await prisma.article.update({
            where: { id: match.articleId },
            data: { coverImage: `/pictures/${match.imageFile}` }
          })
          
          console.log(`   ✅ Updated cover image`)
        }
        
        importedCount++
        
      } catch (error) {
        console.log(`   ❌ Failed to process: ${error}`)
      }
    }
    
    console.log(`\n🎉 Import completed!`)
    console.log(`📊 Images imported: ${importedCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function findHighestResolution(baseFileName: string, allFiles: string[]): string {
  // Extract base name without resolution suffix
  const baseName = baseFileName.replace(/(-\d+x\d+)?(\.[^.]+)$/, '')
  const extension = path.extname(baseFileName)
  
  // Find all versions of this image
  const versions = allFiles.filter(file => 
    file.startsWith(baseName) && file.endsWith(extension)
  )
  
  // Sort by resolution (highest first)
  versions.sort((a, b) => {
    const resA = getResolutionValue(a)
    const resB = getResolutionValue(b)
    return resB - resA
  })
  
  return versions[0] || baseFileName
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

// Run the import
importImagesToMedia().catch(console.error)
