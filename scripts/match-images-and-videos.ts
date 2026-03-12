#!/usr/bin/env tsx

/**
 * Match Images and Videos Script
 * This script matches pictures from the pictures folder to articles
 * and moves YouTube URLs from content to video URL field
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'
import { getErrorInfo } from './utils/error-handler'

const prisma = new PrismaClient()

interface ImageMatch {
  articleId: number
  articleTitle: string
  imagePath: string
  imageResolution: string
  matchReason: string
}

interface VideoMatch {
  articleId: number
  articleTitle: string
  videoUrl: string
  extractedFrom: string
}

class ImageVideoMatcher {
  private imageMatches: ImageMatch[] = []
  private videoMatches: VideoMatch[] = []
  private picturesDir = path.join(process.cwd(), 'pictures')

  async processArticles() {
    try {
      console.log('🎯 Starting image and video matching...\n')
      
      // Get all articles
      const articles = await prisma.article.findMany({
        orderBy: { createdAt: 'asc' }
      })
      
      // Get all picture files
      const pictureFiles = this.getAllPictureFiles()
      
      console.log(`📊 Found ${articles.length} articles and ${pictureFiles.length} picture files\n`)
      
      // Process each article
      for (const article of articles) {
        await this.processArticle(article, pictureFiles)
      }
      
      // Apply matches
      await this.applyMatches()
      
      // Print results
      this.printResults()
      
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      console.error('❌ Processing failed:', errorInfo.message)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private getAllPictureFiles(): string[] {
    if (!fs.existsSync(this.picturesDir)) {
      console.log('❌ Pictures directory not found')
      return []
    }
    
    return fs.readdirSync(this.picturesDir)
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
  }

  private async processArticle(article: any, pictureFiles: string[]) {
    // 1. Extract YouTube URLs from content
    this.extractVideoUrls(article)
    
    // 2. Match images based on article title and content
    this.matchImages(article, pictureFiles)
  }

  private extractVideoUrls(article: any) {
    if (!article.content) return
    
    // Multiple patterns for YouTube URL extraction
    const youtubePatterns = [
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:[&\w=]*)?/gi,
      /https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(?:\?[&\w=]*)?/gi,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/gi
    ]
    
    for (const pattern of youtubePatterns) {
      const matches = article.content.match(pattern)
      if (matches && matches.length > 0) {
        // Get the first YouTube URL found
        const videoUrl = matches[0].replace(/nn$/, '').trim()
        
        this.videoMatches.push({
          articleId: article.id,
          articleTitle: article.title,
          videoUrl: videoUrl,
          extractedFrom: 'content'
        })
        break // Only take the first video URL found
      }
    }
  }

  private matchImages(article: any, pictureFiles: string[]) {
    const title = article.title.toLowerCase()
    const content = article.content ? article.content.toLowerCase() : ''
    
    // Define keyword mappings for better matching
    const keywordMappings = {
      // Specific character/person names
      'emin': ['emin'],
      'brko': ['brko'],
      'dernek': ['dernek', 'der'],
      'ilija': ['ilija'],
      'jozo': ['jozo'],
      'kaktus': ['kaktus'],
      'mago': ['mago', 'mađioničar'],
      'bager': ['bager'],
      'krevet': ['krevet', 'kućice'],
      'kuca': ['kuća', 'kuca', 'blaženka', 'vlado'],
      'face_brodice': ['brodice', 'face'],
      'jackye': ['jackye'],
      'kaminoska': ['kaminoska', 'prikolica']
    }
    
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
      const titleWords = title.split(/\s+/).filter((word: string) => word.length > 3)
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
      const highestResImage = this.findHighestResolution(bestMatch.file, pictureFiles)
      
      this.imageMatches.push({
        articleId: article.id,
        articleTitle: article.title,
        imagePath: `/pictures/${highestResImage}`,
        imageResolution: this.getImageResolution(highestResImage),
        matchReason: bestMatch.reason
      })
    }
  }

  private findHighestResolution(baseFileName: string, allFiles: string[]): string {
    // Extract base name without resolution suffix
    const baseName = baseFileName.replace(/(-\d+x\d+)?(\.[^.]+)$/, '')
    const extension = path.extname(baseFileName)
    
    // Find all versions of this image
    const versions = allFiles.filter(file => 
      file.startsWith(baseName) && file.endsWith(extension)
    )
    
    // Sort by resolution (highest first)
    versions.sort((a, b) => {
      const resA = this.getResolutionValue(a)
      const resB = this.getResolutionValue(b)
      return resB - resA
    })
    
    return versions[0] || baseFileName
  }

  private getResolutionValue(fileName: string): number {
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

  private getImageResolution(fileName: string): string {
    const match = fileName.match(/-(\d+x\d+)/)
    return match ? match[1] : 'original'
  }

  private async applyMatches() {
    console.log('💾 Applying matches to database...\n')
    
    // Apply image matches
    for (const match of this.imageMatches) {
      try {
        await prisma.article.update({
          where: { id: match.articleId },
          data: { coverImage: match.imagePath }
        })
        
        console.log(`🖼️  ${match.articleTitle}`)
        console.log(`   Image: ${match.imagePath} (${match.imageResolution})`)
        console.log(`   Reason: ${match.matchReason}\n`)
        
      } catch (error) {
        console.log(`❌ Failed to update image for: ${match.articleTitle}`)
      }
    }
    
    // Apply video matches
    for (const match of this.videoMatches) {
      try {
        // Clean the content by removing the YouTube URL
        const article = await prisma.article.findUnique({
          where: { id: match.articleId },
          select: { content: true }
        })
        
        if (article) {
          const cleanedContent = article.content
            .replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]+(?:[&\w=]*)?/gi, '')
            .replace(/https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+(?:\?[&\w=]*)?/gi, '')
            .replace(/youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/gi, '')
            .replace(/nn+/g, '\n\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim()
          
          await prisma.article.update({
            where: { id: match.articleId },
            data: { 
              videoUrl: match.videoUrl,
              videoType: 'youtube',
              content: cleanedContent
            }
          })
          
          console.log(`📺 ${match.articleTitle}`)
          console.log(`   Video: ${match.videoUrl}`)
          console.log(`   Moved from: ${match.extractedFrom}\n`)
        }
        
      } catch (error) {
        console.log(`❌ Failed to update video for: ${match.articleTitle}`)
      }
    }
  }

  private printResults() {
    console.log('\n📊 Matching Results:')
    console.log('====================')
    console.log(`Images matched: ${this.imageMatches.length}`)
    console.log(`Videos extracted: ${this.videoMatches.length}`)
    
    if (this.imageMatches.length === 0) {
      console.log('\n💡 No images were matched. This could mean:')
      console.log('- Article titles don\'t match image filenames')
      console.log('- Need to add more keyword mappings')
      console.log('- Images might need different naming convention')
    }
    
    if (this.videoMatches.length === 0) {
      console.log('\n💡 No YouTube URLs found in article content')
    }
    
    console.log('\n✅ Image and video matching completed!')
  }
}

async function main() {
  const matcher = new ImageVideoMatcher()
  await matcher.processArticles()
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { ImageVideoMatcher }
