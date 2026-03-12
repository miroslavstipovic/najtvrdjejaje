#!/usr/bin/env tsx

/**
 * WordPress to Prisma Migration Script
 * This script parses the WordPress SQL export and migrates data to the new video portal schema
 */

import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs'
import path from 'path'
import { getErrorInfo } from './utils/error-handler'

const prisma = new PrismaClient()

interface WordPressPost {
  ID: number
  post_author: number
  post_date: string
  post_date_gmt: string
  post_content: string
  post_title: string
  post_excerpt: string
  post_status: string
  post_name: string
  post_type: string
  post_modified: string
}

interface WordPressTerm {
  term_id: number
  name: string
  slug: string
}

interface WordPressPostMeta {
  post_id: number
  meta_key: string
  meta_value: string
}

interface WordPressTermRelationship {
  object_id: number
  term_taxonomy_id: number
}

interface WordPressTermTaxonomy {
  term_taxonomy_id: number
  term_id: number
  taxonomy: string
  description: string
}

interface MigrationStats {
  postsProcessed: number
  postsImported: number
  categoriesProcessed: number
  categoriesImported: number
  errors: string[]
}

class WordPressMigrator {
  private stats: MigrationStats = {
    postsProcessed: 0,
    postsImported: 0,
    categoriesProcessed: 0,
    categoriesImported: 0,
    errors: []
  }

  async migrate(sqlFilePath: string) {
    try {
      console.log('🚀 Starting WordPress to Prisma migration...\n')
      
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
      
      // Extract data from SQL
      console.log('📊 Extracting data from SQL export...')
      const posts = this.extractPosts(sqlContent)
      const terms = this.extractTerms(sqlContent)
      const postMeta = this.extractPostMeta(sqlContent)
      const termTaxonomy = this.extractTermTaxonomy(sqlContent)
      const termRelationships = this.extractTermRelationships(sqlContent)
      
      console.log(`Found ${posts.length} posts, ${terms.length} terms`)
      
      // Create categories first
      console.log('\n📁 Creating categories...')
      const categoryMap = await this.createCategories(terms, termTaxonomy)
      
      // Create articles
      console.log('\n📰 Creating articles...')
      await this.createArticles(posts, postMeta, termRelationships, categoryMap)
      
      // Print statistics
      this.printStats()
      
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      console.error('❌ Migration failed:', errorInfo.message)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private extractPosts(sqlContent: string): WordPressPost[] {
    const posts: WordPressPost[] = []
    
    // Find INSERT statements for wp2x_posts
    const postInsertRegex = /INSERT INTO `wp2x_posts`[\s\S]*?;/g
    const matches = sqlContent.match(postInsertRegex)
    
    if (!matches) return posts
    
    for (const match of matches) {
      // Extract VALUES part
      const valuesMatch = match.match(/VALUES\s*([\s\S]*?)$/)
      if (!valuesMatch) continue
      
      const valuesStr = valuesMatch[1]
      
      // Parse individual post records - this is simplified, real parsing would be more robust
      const recordRegex = /\(([^)]+(?:\([^)]*\))*[^)]*)\)/g
      let recordMatch
      
      while ((recordMatch = recordRegex.exec(valuesStr)) !== null) {
        try {
          const values = this.parseValues(recordMatch[1])
          
          if (values.length >= 23) {
            const post: WordPressPost = {
              ID: parseInt(values[0]) || 0,
              post_author: parseInt(values[1]) || 0,
              post_date: this.cleanValue(values[2]),
              post_date_gmt: this.cleanValue(values[3]),
              post_content: this.cleanValue(values[4]),
              post_title: this.cleanValue(values[5]),
              post_excerpt: this.cleanValue(values[6]),
              post_status: this.cleanValue(values[7]),
              post_name: this.cleanValue(values[11]),
              post_type: this.cleanValue(values[20]),
              post_modified: this.cleanValue(values[14])
            }
            
            // Only include published posts
            if (post.post_status === 'publish' && post.post_type === 'post') {
              posts.push(post)
            }
          }
        } catch (error) {
          const errorInfo = getErrorInfo(error)
          this.stats.errors.push(`Error parsing post record: ${errorInfo.message}`)
        }
      }
    }
    
    return posts
  }

  private extractTerms(sqlContent: string): WordPressTerm[] {
    const terms: WordPressTerm[] = []
    
    const termInsertRegex = /INSERT INTO `wp2x_terms`[\s\S]*?;/g
    const matches = sqlContent.match(termInsertRegex)
    
    if (!matches) return terms
    
    for (const match of matches) {
      const valuesMatch = match.match(/VALUES\s*([\s\S]*?)$/)
      if (!valuesMatch) continue
      
      const recordRegex = /\(([^)]+)\)/g
      let recordMatch
      
      while ((recordMatch = recordRegex.exec(valuesMatch[1])) !== null) {
        try {
          const values = this.parseValues(recordMatch[1])
          
          if (values.length >= 4) {
            terms.push({
              term_id: parseInt(values[0]) || 0,
              name: this.cleanValue(values[1]),
              slug: this.cleanValue(values[2])
            })
          }
        } catch (error) {
          const errorInfo = getErrorInfo(error)
          this.stats.errors.push(`Error parsing term: ${errorInfo.message}`)
        }
      }
    }
    
    return terms
  }

  private extractPostMeta(sqlContent: string): WordPressPostMeta[] {
    const postMeta: WordPressPostMeta[] = []
    
    const metaInsertRegex = /INSERT INTO `wp2x_postmeta`[\s\S]*?;/g
    const matches = sqlContent.match(metaInsertRegex)
    
    if (!matches) return postMeta
    
    for (const match of matches) {
      const valuesMatch = match.match(/VALUES\s*([\s\S]*?)$/)
      if (!valuesMatch) continue
      
      const recordRegex = /\(([^)]+(?:\([^)]*\))*[^)]*)\)/g
      let recordMatch
      
      while ((recordMatch = recordRegex.exec(valuesMatch[1])) !== null) {
        try {
          const values = this.parseValues(recordMatch[1])
          
          if (values.length >= 4) {
            postMeta.push({
              post_id: parseInt(values[1]) || 0,
              meta_key: this.cleanValue(values[2]),
              meta_value: this.cleanValue(values[3])
            })
          }
        } catch (error) {
          const errorInfo = getErrorInfo(error)
          this.stats.errors.push(`Error parsing post meta: ${errorInfo.message}`)
        }
      }
    }
    
    return postMeta
  }

  private extractTermTaxonomy(sqlContent: string): WordPressTermTaxonomy[] {
    const termTaxonomy: WordPressTermTaxonomy[] = []
    
    const taxonomyInsertRegex = /INSERT INTO `wp2x_term_taxonomy`[\s\S]*?;/g
    const matches = sqlContent.match(taxonomyInsertRegex)
    
    if (!matches) return termTaxonomy
    
    for (const match of matches) {
      const valuesMatch = match.match(/VALUES\s*([\s\S]*?)$/)
      if (!valuesMatch) continue
      
      const recordRegex = /\(([^)]+)\)/g
      let recordMatch
      
      while ((recordMatch = recordRegex.exec(valuesMatch[1])) !== null) {
        try {
          const values = this.parseValues(recordMatch[1])
          
          if (values.length >= 5) {
            termTaxonomy.push({
              term_taxonomy_id: parseInt(values[0]) || 0,
              term_id: parseInt(values[1]) || 0,
              taxonomy: this.cleanValue(values[2]),
              description: this.cleanValue(values[3])
            })
          }
        } catch (error) {
          const errorInfo = getErrorInfo(error)
          this.stats.errors.push(`Error parsing term taxonomy: ${errorInfo.message}`)
        }
      }
    }
    
    return termTaxonomy
  }

  private extractTermRelationships(sqlContent: string): WordPressTermRelationship[] {
    const relationships: WordPressTermRelationship[] = []
    
    const relationshipInsertRegex = /INSERT INTO `wp2x_term_relationships`[\s\S]*?;/g
    const matches = sqlContent.match(relationshipInsertRegex)
    
    if (!matches) return relationships
    
    for (const match of matches) {
      const valuesMatch = match.match(/VALUES\s*([\s\S]*?)$/)
      if (!valuesMatch) continue
      
      const recordRegex = /\(([^)]+)\)/g
      let recordMatch
      
      while ((recordMatch = recordRegex.exec(valuesMatch[1])) !== null) {
        try {
          const values = this.parseValues(recordMatch[1])
          
          if (values.length >= 3) {
            relationships.push({
              object_id: parseInt(values[0]) || 0,
              term_taxonomy_id: parseInt(values[1]) || 0
            })
          }
        } catch (error) {
          const errorInfo = getErrorInfo(error)
          this.stats.errors.push(`Error parsing term relationship: ${errorInfo.message}`)
        }
      }
    }
    
    return relationships
  }

  private parseValues(valuesStr: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''
    let escapeNext = false
    
    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i]
      
      if (escapeNext) {
        current += char
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (!inQuotes && (char === "'" || char === '"')) {
        inQuotes = true
        quoteChar = char
        continue
      }
      
      if (inQuotes && char === quoteChar) {
        inQuotes = false
        quoteChar = ''
        continue
      }
      
      if (!inQuotes && char === ',') {
        values.push(current.trim())
        current = ''
        continue
      }
      
      current += char
    }
    
    if (current.trim()) {
      values.push(current.trim())
    }
    
    return values
  }

  private cleanValue(value: string): string {
    if (!value || value === 'NULL') return ''
    
    // Remove quotes and decode HTML entities
    return value
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8230;/g, '...')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }

  private async createCategories(
    terms: WordPressTerm[], 
    termTaxonomy: WordPressTermTaxonomy[]
  ): Promise<Map<number, number>> {
    const categoryMap = new Map<number, number>()
    
    // Filter categories from taxonomy
    const categories = termTaxonomy.filter(tt => tt.taxonomy === 'category')
    
    for (const taxonomy of categories) {
      const term = terms.find(t => t.term_id === taxonomy.term_id)
      if (!term) continue
      
      this.stats.categoriesProcessed++
      
      try {
        // Skip default "Uncategorized" category
        if (term.slug === 'uncategorized') continue
        
        const category = await prisma.category.upsert({
          where: { slug: term.slug },
          update: {
            name: term.name,
            description: taxonomy.description || null
          },
          create: {
            name: term.name,
            slug: term.slug,
            description: taxonomy.description || null
          }
        })
        
        categoryMap.set(taxonomy.term_taxonomy_id, category.id)
        this.stats.categoriesImported++
        
        console.log(`✅ Category: ${term.name} (${term.slug})`)
        
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        this.stats.errors.push(`Error creating category ${term.name}: ${errorInfo.message}`)
        console.log(`❌ Failed to create category: ${term.name}`)
      }
    }
    
    // Create default category if none exist
    if (categoryMap.size === 0) {
      const defaultCategory = await prisma.category.upsert({
        where: { slug: 'general' },
        update: {},
        create: {
          name: 'General',
          slug: 'general',
          description: 'General articles'
        }
      })
      categoryMap.set(0, defaultCategory.id)
    }
    
    return categoryMap
  }

  private async createArticles(
    posts: WordPressPost[],
    postMeta: WordPressPostMeta[],
    termRelationships: WordPressTermRelationship[],
    categoryMap: Map<number, number>
  ) {
    for (const post of posts) {
      this.stats.postsProcessed++
      
      try {
        // Find category for this post
        const relationship = termRelationships.find(tr => tr.object_id === post.ID)
        let categoryId = Array.from(categoryMap.values())[0] // Default to first category
        
        if (relationship && categoryMap.has(relationship.term_taxonomy_id)) {
          categoryId = categoryMap.get(relationship.term_taxonomy_id)!
        }
        
        // Find featured image
        const featuredImageMeta = postMeta.find(
          pm => pm.post_id === post.ID && pm.meta_key === '_thumbnail_id'
        )
        
        // Extract YouTube URL from content
        const youtubeMatch = post.post_content.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i)
        const videoUrl = youtubeMatch ? `https://www.youtube.com/watch?v=${youtubeMatch[1]}` : null
        
        // Clean content - remove WordPress blocks and shortcodes
        const cleanContent = this.cleanWordPressContent(post.post_content)
        
        // Generate excerpt if not provided
        const excerpt = post.post_excerpt || this.generateExcerpt(cleanContent)
        
        const article = await prisma.article.upsert({
          where: { slug: post.post_name },
          update: {
            title: post.post_title,
            content: cleanContent,
            excerpt: excerpt,
            videoUrl: videoUrl,
            videoType: videoUrl ? 'youtube' : null,
            categoryId: categoryId,
            isPublished: true,
            createdAt: new Date(post.post_date),
            updatedAt: new Date(post.post_modified)
          },
          create: {
            title: post.post_title,
            slug: post.post_name,
            content: cleanContent,
            excerpt: excerpt,
            videoUrl: videoUrl,
            videoType: videoUrl ? 'youtube' : null,
            categoryId: categoryId,
            isPublished: true,
            createdAt: new Date(post.post_date),
            updatedAt: new Date(post.post_modified)
          }
        })
        
        this.stats.postsImported++
        console.log(`✅ Article: ${post.post_title}`)
        
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        this.stats.errors.push(`Error creating article ${post.post_title}: ${errorInfo.message}`)
        console.log(`❌ Failed to create article: ${post.post_title}`)
      }
    }
  }

  private cleanWordPressContent(content: string): string {
    return content
      // Remove WordPress block comments
      .replace(/<!-- wp:[^>]+ -->/g, '')
      .replace(/<!-- \/wp:[^>]+ -->/g, '')
      // Remove WordPress shortcodes
      .replace(/\[\/?\w+[^\]]*\]/g, '')
      // Clean up HTML
      .replace(/<figure[^>]*>/g, '')
      .replace(/<\/figure>/g, '')
      .replace(/<div[^>]*wp-block-embed__wrapper[^>]*>/g, '')
      .replace(/<\/div>/g, '')
      // Convert YouTube embeds to simple links
      .replace(/https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(&[^<\s]*)?/g, 
        'https://www.youtube.com/watch?v=$1')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  private generateExcerpt(content: string, maxLength: number = 200): string {
    // Strip HTML tags and get plain text
    const plainText = content
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (plainText.length <= maxLength) return plainText
    
    return plainText.substring(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  private printStats() {
    console.log('\n📊 Migration Statistics:')
    console.log('========================')
    console.log(`Posts processed: ${this.stats.postsProcessed}`)
    console.log(`Posts imported: ${this.stats.postsImported}`)
    console.log(`Categories processed: ${this.stats.categoriesProcessed}`)
    console.log(`Categories imported: ${this.stats.categoriesImported}`)
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors (${this.stats.errors.length}):`)
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }
    
    console.log('\n✅ Migration completed!')
  }
}

async function main() {
  const sqlFilePath = process.argv[2] || 'flashba_wp621.sql'
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL file not found: ${sqlFilePath}`)
    console.log('Usage: tsx scripts/migrate-from-wordpress.ts [path-to-sql-file]')
    process.exit(1)
  }
  
  const migrator = new WordPressMigrator()
  await migrator.migrate(sqlFilePath)
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { WordPressMigrator }
