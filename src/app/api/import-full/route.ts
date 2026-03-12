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
  totalCounts?: {
    articles: number
    categories: number
  }
}

export async function GET() {
  try {
    const exportPath = path.join(process.cwd(), 'production-export.json')
    const fileExists = fs.existsSync(exportPath)
    
    if (!fileExists) {
      return NextResponse.json({
        error: 'Export file not found',
        message: 'production-export.json not found in project root'
      })
    }
    
    const fileContent = fs.readFileSync(exportPath, 'utf8')
    const exportData: ImportData = JSON.parse(fileContent)
    
    return NextResponse.json({
      success: true,
      message: 'WordPress export data ready for import',
      ready: true,
      data: {
        articles: exportData.articles?.length || 0,
        categories: exportData.categories?.length || 0,
        totalCounts: exportData.totalCounts
      }
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    return NextResponse.json({
      error: 'Failed to read export file',
      message: errorInfo.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('🚀 Importing ALL WordPress content...')
    
    // Load export data from production-export.json
    const exportPath = path.join(process.cwd(), 'production-export.json')
    
    let exportData: ImportData
    try {
      const fileContent = fs.readFileSync(exportPath, 'utf8')
      exportData = JSON.parse(fileContent)
      console.log(`📊 Found ${exportData.articles?.length || 0} articles and ${exportData.categories?.length || 0} categories to import`)
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
        await prisma.category.upsert({
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
        console.log(`✅ Category: ${category.name}`)
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        imported.errors.push(`Category ${category.name}: ${errorInfo.message}`)
      }
    }
    
    // Import articles
    console.log('📄 Importing articles...')
    let featuredCount = 0
    for (const article of exportData.articles || []) {
      try {
        await prisma.article.upsert({
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
        
        if (article.isFeatured) {
          featuredCount++
          console.log(`⭐ FEATURED: ${article.title}`)
        } else if (imported.articles % 20 === 0) {
          console.log(`📝 Imported ${imported.articles} articles...`)
        }
        
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        imported.errors.push(`Article ${article.title}: ${errorInfo.message}`)
      }
    }
    
    // Final verification
    const finalCounts = {
      articles: await prisma.article.count(),
      categories: await prisma.category.count(),
      published: await prisma.article.count({ where: { isPublished: true } }),
      featured: await prisma.article.count({ where: { isFeatured: true } })
    }
    
    console.log('🎉 Full import completed!')
    console.log(`📊 Final Database State:`)
    console.log(`  ✅ Categories: ${finalCounts.categories}`)
    console.log(`  ✅ Articles: ${finalCounts.articles}`)
    console.log(`  📰 Published: ${finalCounts.published}`)
    console.log(`  ⭐ Featured: ${finalCounts.featured}`)
    
    return NextResponse.json({
      success: true,
      message: 'All WordPress content imported successfully!',
      imported: {
        categories: imported.categories,
        articles: imported.articles,
        featured: featuredCount,
        errors: imported.errors.length
      },
      database: finalCounts,
      ready: {
        hasContent: finalCounts.articles > 0,
        hasPublished: finalCounts.published > 0,
        hasFeatured: finalCounts.featured > 0,
        homepageReady: finalCounts.featured > 0
      },
      errors: imported.errors.length > 0 ? imported.errors.slice(0, 5) : undefined
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Full import failed:', errorInfo.message)
    
    return NextResponse.json({
      success: false,
      error: 'Full import failed',
      message: errorInfo.message
    }, { status: 500 })
  }
}
