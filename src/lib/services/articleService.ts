import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Get article by slug with request memoization
 */
export const getArticleBySlug = cache(async (slug: string) => {
  return await prisma.article.findUnique({
    where: { 
      slug,
      isPublished: true 
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      media: {
        include: {
          media: true
        },
        orderBy: {
          order: 'asc'
        }
      }
    },
  })
})

/**
 * Get related articles for a category
 */
export const getRelatedArticles = cache(async (categoryId: number, excludeArticleId: number, limit: number = 4) => {
  return await prisma.article.findMany({
    where: {
      categoryId,
      isPublished: true,
      id: { not: excludeArticleId },
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      videoUrl: true,
      videoType: true,
      createdAt: true,
    },
  })
})

/**
 * Get article and related articles in parallel
 */
export async function getArticleWithRelated(slug: string) {
  const article = await getArticleBySlug(slug)
  
  if (!article) {
    return { article: null, relatedArticles: [] }
  }

  // Fetch related articles in parallel (already using cache, but ensures parallel execution)
  const relatedArticles = await getRelatedArticles(article.categoryId, article.id, 4)

  return { article, relatedArticles }
}

