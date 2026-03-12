import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all articles with their status
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        isFeatured: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Get what the homepage would show
    const featuredArticle = await prisma.article.findFirst({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      select: {
        id: true,
        title: true,
        isFeatured: true,
        isPublished: true
      }
    })

    const categoriesWithArticles = await prisma.category.findMany({
      include: {
        articles: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            title: true,
            coverImage: true
          },
          take: 3
        },
        _count: {
          select: {
            articles: {
              where: {
                isPublished: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      status: 'success',
      debug_info: {
        total_articles: articles.length,
        published_articles: articles.filter(a => a.isPublished).length,
        featured_articles: articles.filter(a => a.isFeatured).length,
        articles_with_images: articles.filter(a => a.coverImage).length,
        homepage_featured: featuredArticle,
        all_articles: articles,
        categories_data: categoriesWithArticles.map(cat => ({
          name: cat.name,
          article_count: cat._count.articles,
          sample_articles: cat.articles
        }))
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch debug info',
      error: (error as any)?.message
    }, { status: 500 })
  }
}

// Test endpoint to fix common issues
export async function POST() {
  try {
    // 1. Ensure at least one article is published and featured
    const publishedArticles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: 'desc' },
      take: 1
    })

    if (publishedArticles.length === 0) {
      // Publish the most recent article
      const latestArticle = await prisma.article.findFirst({
        orderBy: { createdAt: 'desc' }
      })

      if (latestArticle) {
        await prisma.article.update({
          where: { id: latestArticle.id },
          data: { isPublished: true, isFeatured: true }
        })
      }
    } else {
      // Make sure at least one published article is featured
      const featuredCount = await prisma.article.count({
        where: { isPublished: true, isFeatured: true }
      })

      if (featuredCount === 0) {
        await prisma.article.update({
          where: { id: publishedArticles[0].id },
          data: { isFeatured: true }
        })
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Fixed common article issues'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fix issues',
      error: (error as any)?.message
    }, { status: 500 })
  }
}
