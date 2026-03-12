import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all articles with their featured status
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get the current featured article
    const featuredArticle = await prisma.article.findFirst({
      where: {
        isFeatured: true,
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
        isFeatured: true
      }
    })

    return NextResponse.json({
      status: 'success',
      all_articles: articles,
      featured_article: featuredArticle,
      summary: {
        total_articles: articles.length,
        published_articles: articles.filter(a => a.isPublished).length,
        featured_articles: articles.filter(a => a.isFeatured).length,
        published_and_featured: articles.filter(a => a.isFeatured && a.isPublished).length
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch featured article debug info',
      error: (error as any)?.message
    }, { status: 500 })
  }
}

// Test endpoint to set an article as featured
export async function POST() {
  try {
    // Get the first published article and make it featured
    const firstPublishedArticle = await prisma.article.findFirst({
      where: {
        isPublished: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!firstPublishedArticle) {
      return NextResponse.json({
        status: 'no_articles',
        message: 'No published articles found to feature'
      })
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Remove featured from all articles
      prisma.article.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      }),
      // Set new featured article
      prisma.article.update({
        where: { id: firstPublishedArticle.id },
        data: { isFeatured: true },
      }),
    ])

    return NextResponse.json({
      status: 'success',
      message: 'Featured article set successfully',
      featured_article: {
        id: firstPublishedArticle.id,
        title: firstPublishedArticle.title
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to set featured article',
      error: (error as any)?.message
    }, { status: 500 })
  }
}
