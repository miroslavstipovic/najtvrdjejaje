import { PrismaClient } from '../src/generated/prisma'
import mysql from 'mysql2/promise'
import { getErrorInfo } from './utils/error-handler'

const prisma = new PrismaClient()

async function restoreContent() {
  try {
    console.log('🔄 Starting content restoration...')
    
    // Connect to the source database (assuming it's restored to a temp database)
    const sourceConnection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'flashba_wp621' // We'll restore the backup to this database first
    })

    console.log('📊 Fetching categories from WordPress backup...')
    
    // Get categories from WordPress backup
    const [wpCategories] = await sourceConnection.execute(`
      SELECT 
        t.term_id,
        t.name,
        t.slug,
        tt.description
      FROM wp_terms t
      JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
      WHERE tt.taxonomy = 'category' AND t.name != 'Uncategorized'
    `)

    console.log(`Found ${(wpCategories as any[]).length} categories`)

    // Create categories in new database
    for (const wpCat of wpCategories as any[]) {
      try {
        await prisma.category.create({
          data: {
            name: wpCat.name,
            slug: wpCat.slug,
            description: wpCat.description || null
          }
        })
        console.log(`✅ Created category: ${wpCat.name}`)
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.log(`⚠️ Category ${wpCat.name} already exists or error:`, errorInfo.message)
      }
    }

    console.log('📄 Fetching articles from WordPress backup...')

    // Get articles from WordPress backup
    const [wpPosts] = await sourceConnection.execute(`
      SELECT 
        p.ID,
        p.post_title,
        p.post_name,
        p.post_content,
        p.post_excerpt,
        p.post_status,
        p.post_date,
        p.post_modified,
        GROUP_CONCAT(t.name) as categories
      FROM wp_posts p
      LEFT JOIN wp_term_relationships tr ON p.ID = tr.object_id
      LEFT JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      LEFT JOIN wp_terms t ON tt.term_id = t.term_id AND tt.taxonomy = 'category'
      WHERE p.post_type = 'post' AND p.post_status = 'publish'
      GROUP BY p.ID
      ORDER BY p.post_date DESC
    `)

    console.log(`Found ${(wpPosts as any[]).length} articles`)

    // Get all categories from new database for mapping
    const newCategories = await prisma.category.findMany()
    const categoryMap = new Map(newCategories.map(cat => [cat.name, cat.id]))

    // Create articles in new database
    for (const wpPost of wpPosts as any[]) {
      try {
        // Find category ID (use first category or default to first available)
        let categoryId = newCategories[0]?.id
        if (wpPost.categories) {
          const firstCategory = wpPost.categories.split(',')[0]
          categoryId = categoryMap.get(firstCategory) || categoryId
        }

        if (!categoryId) {
          console.log(`⚠️ No category found for article: ${wpPost.post_title}`)
          continue
        }

        // Clean content from hardcoded images
        let cleanContent = wpPost.post_content || ''
        
        // Remove img tags with flash.ba URLs
        cleanContent = cleanContent.replace(/<img[^>]*src="https?:\/\/flash\.ba\/wp-content\/uploads\/[^"]*"[^>]*>/gi, '')
        
        // Remove figure tags
        cleanContent = cleanContent.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
        
        // Remove figcaption tags
        cleanContent = cleanContent.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, '')
        
        // Remove other img tags
        cleanContent = cleanContent.replace(/<img[^>]*>/gi, '')
        
        // Clean up extra whitespace
        cleanContent = cleanContent
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .replace(/^\s+|\s+$/g, '')
          .replace(/\s+$/gm, '')

        await prisma.article.create({
          data: {
            title: wpPost.post_title,
            slug: wpPost.post_name,
            content: cleanContent,
            excerpt: wpPost.post_excerpt || null,
            categoryId: categoryId,
            isPublished: true,
            isFeatured: false,
            createdAt: new Date(wpPost.post_date),
            updatedAt: new Date(wpPost.post_modified)
          }
        })
        
        console.log(`✅ Created article: ${wpPost.post_title}`)
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.log(`⚠️ Error creating article ${wpPost.post_title}:`, errorInfo.message)
      }
    }

    await sourceConnection.end()
    await prisma.$disconnect()
    
    console.log('🎉 Content restoration completed!')
    
  } catch (error) {
    console.error('❌ Error during restoration:', error)
  }
}

restoreContent()
