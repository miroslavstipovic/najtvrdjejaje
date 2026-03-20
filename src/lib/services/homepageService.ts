import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Get featured article with request memoization
 */
export const getFeaturedArticle = cache(async () => {
  return await prisma.article.findFirst({
    where: {
      isPublished: true,
      isFeatured: true,
    },
    include: {
      category: true,
    },
  })
})

/**
 * Get all categories with request memoization
 */
export const getCategories = cache(async () => {
  return await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      order: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      order: 'asc',
    },
  })
})

/**
 * Get articles for a specific category
 */
export const getCategoryArticles = cache(async (categoryId: number, limit: number = 3) => {
  return await prisma.article.findMany({
    where: {
      categoryId,
      isPublished: true,
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      videoUrl: true,
      videoType: true,
      coverImage: true,
      isPublished: true,
      isFeatured: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
    },
  })
})

/**
 * Get article count for a category
 */
export const getCategoryArticleCount = cache(async (categoryId: number) => {
  return await prisma.article.count({
    where: {
      categoryId,
      isPublished: true,
    },
  })
})

/**
 * Get published competitions for homepage display
 */
export const getHomepageCompetitions = cache(async () => {
  return await prisma.competition.findMany({
    where: { isPublished: true },
    orderBy: { startDate: 'desc' },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      startDate: true,
      endDate: true,
      location: true,
      status: true,
      tournamentType: true,
      coverImage: true,
      numberOfGroups: true,
      _count: {
        select: { matches: true, rankings: true },
      },
      rankings: {
        orderBy: { position: 'asc' },
        take: 3,
        select: {
          position: true,
          wins: true,
          losses: true,
          eggsBroken: true,
          weightedPoints: true,
          competitor: {
            select: { id: true, name: true, slug: true, profileImage: true },
          },
        },
      },
    },
  })
})

/**
 * Get homepage data with optimized parallel fetching
 */
export async function getHomepageData() {
  const [featuredArticle, categories, competitions] = await Promise.all([
    getFeaturedArticle(),
    getCategories(),
    getHomepageCompetitions(),
  ])

  // Step 2: Fetch all category data in parallel (articles + counts)
  // This is more efficient than sequential fetching
  const categoryDataPromises = categories.map(async (category) => {
    // Fetch articles and count in parallel for each category
    const [articles, articleCount] = await Promise.all([
      getCategoryArticles(category.id, 3),
      getCategoryArticleCount(category.id),
    ])

    return {
      ...category,
      articles,
      _count: {
        articles: articleCount,
      },
    }
  })

  // Step 3: Wait for all category data in parallel
  const categoryData = await Promise.all(categoryDataPromises)

  return {
    featuredArticle,
    categories: categoryData,
    competitions,
  }
}

/**
 * Get featured article separately (for Suspense streaming)
 */
export async function getFeaturedArticleData() {
  return await getFeaturedArticle()
}

/**
 * Get categories data separately (for Suspense streaming)
 */
export async function getCategoriesData() {
  const categories = await getCategories()
  
  // Fetch all category data in parallel
  const categoryData = await Promise.all(
    categories.map(async (category) => {
      const [articles, articleCount] = await Promise.all([
        getCategoryArticles(category.id, 3),
        getCategoryArticleCount(category.id),
      ])

      return {
        ...category,
        articles,
        _count: {
          articles: articleCount,
        },
      }
    })
  )

  return categoryData
}

