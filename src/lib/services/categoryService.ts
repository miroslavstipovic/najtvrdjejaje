import { cache } from 'react'
import { prisma } from '@/lib/prisma'

const ARTICLES_PER_PAGE = 12

/**
 * Get category by slug with request memoization
 */
export const getCategoryBySlug = cache(async (slug: string) => {
  return await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          articles: {
            where: { isPublished: true }
          }
        }
      }
    },
  })
})

/**
 * Get articles for a category with pagination
 */
export const getCategoryArticles = cache(async (categoryId: number, page: number = 1) => {
  const skip = (page - 1) * ARTICLES_PER_PAGE

  return await prisma.article.findMany({
    where: {
      categoryId,
      isPublished: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take: ARTICLES_PER_PAGE,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      videoUrl: true,
      videoType: true,
      coverImage: true,
      createdAt: true,
      isFeatured: true,
    },
  })
})

/**
 * Get category with articles in parallel
 */
export async function getCategoryWithArticles(slug: string, page: number = 1) {
  const category = await getCategoryBySlug(slug)
  
  if (!category) {
    return { category: null, articles: [], totalPages: 0 }
  }

  // Fetch articles in parallel (already using cache, but ensures parallel execution)
  const articles = await getCategoryArticles(category.id, page)
  
  const totalArticles = category._count.articles
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)

  return { category, articles, totalPages, totalArticles }
}

