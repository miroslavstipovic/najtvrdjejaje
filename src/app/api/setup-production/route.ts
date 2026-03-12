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
    console.log('🚀 Starting production database import...')
    
    // Check if we already have data
    const existingArticles = await prisma.article.count()
    if (existingArticles > 0) {
      return NextResponse.json({
        message: 'Database already has content. Import skipped.',
        articlesCount: existingArticles
      })
    }
    
    // Load export data
    const exportPath = path.join(process.cwd(), 'production-export.json')
    
    let exportData: ImportData
    try {
      const fileContent = fs.readFileSync(exportPath, 'utf8')
      exportData = JSON.parse(fileContent)
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      throw new Error(`Failed to read export file: ${errorInfo.message}`)
    }
    
    console.log(`📊 Import data loaded:`)
    console.log(`  - Articles: ${exportData.articles?.length || 0}`)
    console.log(`  - Categories: ${exportData.categories?.length || 0}`)
    
    const imported = {
      categories: 0,
      articles: 0
    }
    
    // Import categories first
    console.log('📂 Importing categories...')
    for (const category of exportData.categories || []) {
      try {
        const existing = await prisma.category.findUnique({
          where: { slug: category.slug }
        })
        
        if (!existing) {
          await prisma.category.create({
            data: {
              name: category.name,
              slug: category.slug,
              description: category.description,
              coverImage: category.coverImage,
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt)
            }
          })
          imported.categories++
          console.log(`✅ Created category: ${category.name}`)
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import category ${category.name}:`, errorInfo.message)
      }
    }
    
    // Import articles
    console.log('📄 Importing articles...')
    for (const article of exportData.articles || []) {
      try {
        const existing = await prisma.article.findUnique({
          where: { slug: article.slug }
        })
        
        if (!existing) {
          await prisma.article.create({
            data: {
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
            console.log(`⭐ Created featured article: ${article.title}`)
          } else {
            console.log(`✅ Created article: ${article.title}`)
          }
        }
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        console.error(`❌ Failed to import article ${article.title}:`, errorInfo.message)
      }
    }
    
    console.log('🎉 Import completed!')
    console.log(`📊 Import Summary:`)
    console.log(`  ✅ Categories: ${imported.categories}`)
    console.log(`  ✅ Articles: ${imported.articles}`)
    
    return NextResponse.json({
      success: true,
      message: 'Production database import completed successfully!',
      imported: imported
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Import failed:', errorInfo.message)
    
    return NextResponse.json(
      { 
        error: 'Import failed',
        message: errorInfo.message
      },
      { status: 500 }
    )
  }
}
