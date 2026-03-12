import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get detailed database state
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        videoUrl: true,
        isPublished: true,
        isFeatured: true,
        createdAt: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const categories = await prisma.category.findMany({
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            articles: true
          }
        }
      }
    })

    // Check for broken image paths
    const brokenImages = articles.filter(article => 
      article.coverImage && (
        article.coverImage.startsWith('/uploads/') ||
        article.coverImage.startsWith('uploads/') ||
        article.coverImage.includes('localhost')
      )
    ).map(article => ({
      title: article.title,
      slug: article.slug,
      coverImage: article.coverImage
    }))

    // Check for missing slugs or broken URLs
    const routingIssues = articles.filter(article => 
      !article.slug || 
      article.slug.includes(' ') || 
      article.slug.length === 0
    ).map(article => ({
      title: article.title,
      slug: article.slug,
      id: article.id
    }))

    return NextResponse.json({
      success: true,
      database: {
        totalArticles: articles.length,
        publishedArticles: articles.filter(a => a.isPublished).length,
        featuredArticles: articles.filter(a => a.isFeatured).length,
        totalCategories: categories.length
      },
      issues: {
        brokenImagePaths: brokenImages.length,
        routingProblems: routingIssues.length,
        brokenImages: brokenImages.slice(0, 5), // First 5 examples
        routingIssues: routingIssues.slice(0, 5) // First 5 examples
      },
      sampleArticles: articles.slice(0, 3).map(article => ({
        title: article.title,
        slug: article.slug,
        coverImage: article.coverImage,
        videoUrl: article.videoUrl,
        category: article.category?.name
      })),
      categories: categories
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
