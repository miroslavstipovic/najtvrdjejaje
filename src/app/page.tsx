import { Suspense } from 'react'
import FeaturedStory from '@/components/FeaturedStory'
import CategoriesSection from '@/components/CategoriesSection'
import HomepageAd from '@/components/HomepageAd'
import FeaturedStorySkeleton from '@/components/skeletons/FeaturedStorySkeleton'
import CategoriesSectionSkeleton from '@/components/skeletons/CategoriesSectionSkeleton'
import { getHomepageData } from '@/lib/services/homepageService'

interface FeaturedArticle {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  videoUrl: string | null
  videoType: string | null
  coverImage: string | null
  isPublished: boolean
  isFeatured: boolean
  categoryId: number
  createdAt: Date
  updatedAt: Date
  category: {
    id: number
    name: string
    slug: string
    description: string | null
    coverImage: string | null
    createdAt: Date
    updatedAt: Date
  }
}

interface CategoryArticle {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  videoUrl: string | null
  videoType: string | null
  coverImage: string | null
  isPublished: boolean
  isFeatured: boolean
  categoryId: number
  createdAt: Date
  updatedAt: Date
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  createdAt: Date
  updatedAt: Date
  articles: CategoryArticle[]
  _count: {
    articles: number
  }
}

// Enable ISR (Incremental Static Regeneration) - revalidate every 60 seconds
export const revalidate = 60

export default async function HomePage() {
  let featuredArticle: FeaturedArticle | null = null
  let categories: Category[] = []

  if (process.env.PRISMA_POSTGRES) {
    try {
      // Use optimized service with parallel fetching
      // This fetches featured article, categories, articles, and counts in parallel
      const { featuredArticle: featured, categories: cats } = await getHomepageData()
      featuredArticle = featured as FeaturedArticle | null
      categories = cats as Category[]
    } catch (error) {
      console.warn('Failed to load homepage data:', error)
    }
  }

  return (
    <div className="space-y-0">
      {/* Featured Story Section with Suspense */}
      <Suspense fallback={<FeaturedStorySkeleton />}>
        {featuredArticle ? (
          <FeaturedStory article={featuredArticle} />
        ) : null}
      </Suspense>

      {/* Ad between featured and categories */}
      <div className="container-custom">
        <HomepageAd />
      </div>

      {/* Categories Section with Suspense */}
      <Suspense fallback={<CategoriesSectionSkeleton />}>
        <CategoriesSection categories={categories} />
      </Suspense>
    </div>
  )
}
