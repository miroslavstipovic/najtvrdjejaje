#!/usr/bin/env tsx

/**
 * Fix Media Migration Script
 * This script improves the WordPress migration by better handling:
 * 1. YouTube video extraction and formatting
 * 2. Featured image extraction from WordPress content
 * 3. Content cleaning and formatting
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'

const prisma = new PrismaClient()

interface MediaFixes {
  videosFixed: number
  imagesExtracted: number
  contentCleaned: number
  errors: string[]
}

class MediaMigrationFixer {
  private stats: MediaFixes = {
    videosFixed: 0,
    imagesExtracted: 0,
    contentCleaned: 0,
    errors: []
  }

  async fixMediaIssues(sqlFilePath: string) {
    try {
      console.log('🔧 Starting media migration fixes...\n')
      
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
      
      // Get all articles that need fixing
      const articles = await prisma.article.findMany({
        orderBy: { createdAt: 'asc' }
      })
      
      console.log(`📊 Found ${articles.length} articles to process...\n`)
      
      // Process each article
      for (const article of articles) {
        await this.fixArticleMedia(article, sqlContent)
      }
      
      this.printStats()
      
    } catch (error) {
      console.error('❌ Media fix failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async fixArticleMedia(article: any, sqlContent: string) {
    try {
      let updated = false
      let newVideoUrl = article.videoUrl
      let newCoverImage = article.coverImage
      let newContent = article.content

      // 1. Fix YouTube video URLs
      const improvedVideoUrl = this.extractBetterVideoUrl(article.content)
      if (improvedVideoUrl && improvedVideoUrl !== article.videoUrl) {
        newVideoUrl = improvedVideoUrl
        updated = true
        this.stats.videosFixed++
      }

      // 2. Extract featured image from WordPress content or SQL
      const extractedImage = this.extractFeaturedImage(article.content, sqlContent, article.title)
      if (extractedImage && !article.coverImage) {
        newCoverImage = extractedImage
        updated = true
        this.stats.imagesExtracted++
      }

      // 3. Improve content cleaning
      const cleanedContent = this.improveContentCleaning(article.content)
      if (cleanedContent !== article.content) {
        newContent = cleanedContent
        updated = true
        this.stats.contentCleaned++
      }

      // Update article if changes were made
      if (updated) {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            videoUrl: newVideoUrl,
            videoType: newVideoUrl ? this.getVideoType(newVideoUrl) : null,
            coverImage: newCoverImage,
            content: newContent
          }
        })

        console.log(`✅ Fixed: ${article.title}`)
        if (improvedVideoUrl) console.log(`   📺 Video: ${improvedVideoUrl}`)
        if (extractedImage) console.log(`   🖼️  Image: ${extractedImage}`)
      }

    } catch (error) {
      this.stats.errors.push(`Error fixing article ${article.title}: ${error}`)
      console.log(`❌ Failed to fix: ${article.title}`)
    }
  }

  private extractBetterVideoUrl(content: string): string | null {
    // Multiple patterns for YouTube URL extraction
    const patterns = [
      // Standard YouTube URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:[&\w=]*)?/gi,
      // YouTube short URLs
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)(?:\?[&\w=]*)?/gi,
      // Embedded YouTube URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)(?:\?[&\w=]*)?/gi,
      // YouTube URLs with additional parameters
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:&t=\d+s)?/gi
    ]

    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        // Extract video ID and create clean URL
        const match = matches[0]
        const videoIdMatch = match.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/)
        if (videoIdMatch) {
          const videoId = videoIdMatch[1]
          return `https://www.youtube.com/watch?v=${videoId}`
        }
      }
    }

    return null
  }

  private extractFeaturedImage(content: string, sqlContent: string, title: string): string | null {
    // 1. Look for images in the content
    const imgPatterns = [
      // WordPress uploads
      /https?:\/\/[^\/]+\/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi,
      // General image URLs
      /https?:\/\/[^\/]+\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi,
      // Relative image paths
      /\/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/gi
    ]

    for (const pattern of imgPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        // Return the first image found
        return matches[0]
      }
    }

    // 2. Look for images in SQL content related to this article
    const titleEscaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const articleSqlRegex = new RegExp(`'${titleEscaped}'[^;]*?(https?://[^']*\\.(jpg|jpeg|png|gif|webp))`, 'gi')
    const sqlMatch = sqlContent.match(articleSqlRegex)
    if (sqlMatch && sqlMatch.length > 0) {
      const imageMatch = sqlMatch[0].match(/https?:\/\/[^']*\.(jpg|jpeg|png|gif|webp)/gi)
      if (imageMatch) {
        return imageMatch[0]
      }
    }

    return null
  }

  private improveContentCleaning(content: string): string {
    return content
      // Remove WordPress block comments more thoroughly
      .replace(/<!--\s*wp:[^>]*-->/gi, '')
      .replace(/<!--\s*\/wp:[^>]*-->/gi, '')
      
      // Remove WordPress shortcodes
      .replace(/\[\/?\w+[^\]]*\]/g, '')
      
      // Clean up figure and div tags
      .replace(/<figure[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*>/gi, '')
      .replace(/<\/figure>/gi, '')
      .replace(/<div[^>]*class="[^"]*wp-block-embed__wrapper[^"]*"[^>]*>/gi, '')
      .replace(/<\/div>/gi, '')
      
      // Clean up paragraph tags but keep content
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '')
      
      // Convert YouTube embeds to clean links
      .replace(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(&[^<\s]*)?/g, 
        'https://www.youtube.com/watch?v=$1')
      
      // Remove extra HTML entities
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '...')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      
      // Clean up multiple spaces and newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private getVideoType(videoUrl: string): string {
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      return 'youtube'
    } else if (videoUrl.includes('vimeo.com')) {
      return 'vimeo'
    }
    return 'upload'
  }

  private printStats() {
    console.log('\n📊 Media Fix Statistics:')
    console.log('========================')
    console.log(`Videos fixed: ${this.stats.videosFixed}`)
    console.log(`Images extracted: ${this.stats.imagesExtracted}`)
    console.log(`Content cleaned: ${this.stats.contentCleaned}`)
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors (${this.stats.errors.length}):`)
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }
    
    console.log('\n✅ Media fixes completed!')
  }
}

async function main() {
  const sqlFilePath = process.argv[2] || 'flashba_wp621.sql'
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL file not found: ${sqlFilePath}`)
    console.log('Usage: tsx scripts/fix-media-migration.ts [path-to-sql-file]')
    process.exit(1)
  }
  
  const fixer = new MediaMigrationFixer()
  await fixer.fixMediaIssues(sqlFilePath)
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { MediaMigrationFixer }
