import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { getErrorInfo } from '@/lib/error-handler'

interface ImportData {
  articles: any[]
  categories: any[]
  media?: any[]
  articleMedia?: any[]
  siteSettings?: any[]
  admins?: any[]
}

export async function POST() {
  try {
    console.log('🚀 Force setup: Starting production database import...')
    
    // First check if tables exist
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection successful')
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      return NextResponse.json({
        error: 'Database connection failed',
        message: errorInfo.message,
        suggestion: 'Make sure DATABASE_URL is set correctly and database is accessible'
      }, { status: 500 })
    }
    
    // Check current state
    let currentCounts
    try {
      currentCounts = {
        articles: await prisma.article.count(),
        categories: await prisma.category.count()
      }
      console.log(`📊 Current database state:`)
      console.log(`  - Articles: ${currentCounts.articles}`)
      console.log(`  - Categories: ${currentCounts.categories}`)
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      return NextResponse.json({
        error: 'Database table access failed',
        message: errorInfo.message,
        suggestion: 'Database tables might not exist. Check if migrations have been run.'
      }, { status: 500 })
    }
    
    // Load export data
    const exportPath = path.join(process.cwd(), 'production-export.json')
    
    let exportData: ImportData
    try {
      const fileContent = fs.readFileSync(exportPath, 'utf8')
      exportData = JSON.parse(fileContent)
      console.log(`📋 Export file loaded:`)
      console.log(`  - Articles to import: ${exportData.articles?.length || 0}`)
      console.log(`  - Categories to import: ${exportData.categories?.length || 0}`)
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      return NextResponse.json({
        error: 'Failed to read export file',
        message: errorInfo.message,
        suggestion: 'Make sure production-export.json exists in the project root'
      }, { status: 500 })
    }
    
    const imported = {
      categories: 0,
      articles: 0,
      errors: [] as string[]
    }
    
    // Import categories first
    console.log('📂 Importing categories...')
    for (const category of exportData.categories || []) {
      try {
        // Use upsert to handle duplicates gracefully
        const result = await prisma.category.upsert({
          where: { slug: category.slug },
          update: {
            name: category.name,
            description: category.description,
            coverImage: category.coverImage,
            updatedAt: new Date()
          },
          create: {
            name: category.name,
            slug: category.slug,
            description: category.description,
            coverImage: category.coverImage,
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt)
          }
        })
        imported.categories++
        console.log(`✅ Created/Updated category: ${category.name} (ID: ${result.id})`)
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        const errorMsg = `Failed to import category ${category.name}: ${errorInfo.message}`
        imported.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }
    
    // Import articles
    console.log('📄 Importing articles...')
    for (const article of exportData.articles || []) {
      try {
        // Use upsert to handle duplicates gracefully
        const result = await prisma.article.upsert({
          where: { slug: article.slug },
          update: {
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            videoUrl: article.videoUrl,
            videoType: article.videoType,
            coverImage: article.coverImage,
            isPublished: article.isPublished,
            isFeatured: article.isFeatured,
            categoryId: article.categoryId,
            updatedAt: new Date()
          },
          create: {
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            videoUrl: article.videoUrl,
            videoType: article.videoType,
            coverImage: article.coverImage,
            isPublished: article.isPublished,
            isFeatured: article.isFeatured,
            categoryId: article.categoryId,
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt)
          }
        })
        imported.articles++
        
        const status = article.isFeatured ? '⭐ FEATURED' : article.isPublished ? '✅ PUBLISHED' : '📝 DRAFT'
        console.log(`${status} Article: ${article.title} (ID: ${result.id})`)
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        const errorMsg = `Failed to import article ${article.title}: ${errorInfo.message}`
        imported.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }
    
    // Final verification
    const finalCounts = {
      articles: await prisma.article.count(),
      categories: await prisma.category.count(),
      published: await prisma.article.count({ where: { isPublished: true } }),
      featured: await prisma.article.count({ where: { isFeatured: true } })
    }
    
    console.log('🎉 Import completed!')
    console.log(`📊 Final Database State:`)
    console.log(`  ✅ Categories: ${finalCounts.categories}`)
    console.log(`  ✅ Articles: ${finalCounts.articles}`)
    console.log(`  📰 Published: ${finalCounts.published}`)
    console.log(`  ⭐ Featured: ${finalCounts.featured}`)
    
    if (imported.errors.length > 0) {
      console.log(`⚠️ Errors encountered: ${imported.errors.length}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Production database setup completed!',
      imported: {
        categories: imported.categories,
        articles: imported.articles,
        errors: imported.errors.length
      },
      database: finalCounts,
      ready: {
        hasContent: finalCounts.articles > 0,
        hasPublished: finalCounts.published > 0,
        hasFeatured: finalCounts.featured > 0,
        homepageReady: finalCounts.featured > 0
      },
      errors: imported.errors.length > 0 ? imported.errors : undefined
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Setup failed:', errorInfo.message)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Setup failed',
        message: errorInfo.message,
        stack: errorInfo.stack
      },
      { status: 500 }
    )
  }
}
