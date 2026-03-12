import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorInfo } from '@/lib/error-handler'

export async function GET() {
  try {
    console.log('🔍 Checking production database contents...')
    
    const dbInfo = {
      articles: {
        total: 0,
        published: 0,
        featured: 0,
        sample: [] as any[]
      },
      categories: {
        total: 0,
        sample: [] as any[]
      },
      error: null as string | null
    }
    
    // Check articles
    try {
      dbInfo.articles.total = await prisma.article.count()
      dbInfo.articles.published = await prisma.article.count({ 
        where: { isPublished: true } 
      })
      dbInfo.articles.featured = await prisma.article.count({ 
        where: { isFeatured: true } 
      })
      
      if (dbInfo.articles.total > 0) {
        dbInfo.articles.sample = await prisma.article.findMany({
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            isPublished: true,
            isFeatured: true,
            createdAt: true,
            category: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      }
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      dbInfo.error = `Articles query failed: ${errorInfo.message}`
    }
    
    // Check categories
    try {
      dbInfo.categories.total = await prisma.category.count()
      
      if (dbInfo.categories.total > 0) {
        dbInfo.categories.sample = await prisma.category.findMany({
          take: 5,
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                articles: {
                  where: { isPublished: true }
                }
              }
            }
          }
        })
      }
    } catch (error) {
      const errorInfo = getErrorInfo(error)
      if (!dbInfo.error) {
        dbInfo.error = `Categories query failed: ${errorInfo.message}`
      }
    }
    
    console.log('Database check results:', dbInfo)
    
    return NextResponse.json({
      success: true,
      database: dbInfo,
      summary: {
        isEmpty: dbInfo.articles.total === 0 && dbInfo.categories.total === 0,
        hasContent: dbInfo.articles.total > 0,
        hasPublishedContent: dbInfo.articles.published > 0,
        hasFeaturedContent: dbInfo.articles.featured > 0,
        readyForHomepage: dbInfo.articles.featured > 0
      }
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Database check failed:', errorInfo.message)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Database check failed',
        message: errorInfo.message,
        database: null
      },
      { status: 500 }
    )
  }
}
