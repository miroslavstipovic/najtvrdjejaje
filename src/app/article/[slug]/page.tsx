import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import VideoPlayer from '@/components/VideoPlayer'
import ArticleActions from '@/components/ArticleActions'
import ImageGallery from '@/components/ImageGallery'
import RelatedArticles from '@/components/RelatedArticles'
import ShareButtons from '@/components/ShareButtons'
import ArticleAd from '@/components/ArticleAd'
import { getErrorInfo } from '@/lib/error-handler'
import { getArticleBySlug, getRelatedArticles } from '@/lib/services/articleService'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

// Enable ISR caching - revalidate every 5 minutes
export const revalidate = 300

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  
  // Fetch article and related articles in parallel for better performance
  let article
  let relatedArticles: any[] = []
  
  try {
    // Fetch article first (needed to get categoryId for related articles)
    article = await getArticleBySlug(slug)

    if (!article) {
      notFound()
    }

    // Fetch related articles in parallel (using Promise.all for true parallelism)
    // Even though getRelatedArticles uses cache, Promise.all ensures parallel execution
    const relatedArticlesPromise = getRelatedArticles(article.categoryId, article.id, 4)
    
    // Wait for related articles
    relatedArticles = await relatedArticlesPromise
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Database error fetching article data:', errorInfo.message)
    notFound()
  }

  if (!article) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-5">
          <nav className="flex" aria-label="Navigacijski put">
            <ol className="inline-flex items-center space-x-2 md:space-x-3 flex-wrap">
              <li className="inline-flex items-center">
                <Link 
                  href="/" 
                  className="inline-flex items-center text-sm sm:text-base font-medium text-gray-700 hover:text-primary-600 transition-colors tap-target"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                  </svg>
                  Početna
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link 
                    href={`/category/${article.category.slug}`}
                    className="ml-1 text-sm sm:text-base font-medium text-gray-700 hover:text-primary-600 md:ml-2 transition-colors"
                  >
                    {article.category.name}
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm sm:text-base font-medium text-gray-500 md:ml-2 line-clamp-1">
                    {article.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Article Content */}
      <article className="container-custom py-10 sm:py-14 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-10 sm:mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Link
                href={`/category/${article.category.slug}`}
                className="badge-primary px-4 py-2 text-sm sm:text-base min-h-[44px]"
              >
                {article.category.name}
              </Link>
              {article.isFeatured && (
                <span className="badge-warning px-4 py-2 text-sm sm:text-base">
                  ⭐ Istaknuta priča
                </span>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center text-sm sm:text-base text-gray-500">
              <time dateTime={article.createdAt.toString()}>
                {new Date(article.createdAt).toLocaleDateString('hr-HR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>

          {/* Video Section - Always first if available */}
          {article.videoUrl && (
            <div className="mb-10 sm:mb-12">
              <div className="card shadow-lg">
                <VideoPlayer 
                  url={article.videoUrl} 
                  type={article.videoType || 'youtube'} 
                />
              </div>
            </div>
          )}

          {/* Cover Image - Show if no video and cover image exists */}
          {!article.videoUrl && article.coverImage && (
            <div className="mb-10 sm:mb-12">
              <div className="card shadow-lg overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-72 sm:h-96 lg:h-[500px] object-cover"
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-10 sm:mb-12">
            <div className="whitespace-pre-line text-gray-900 text-base sm:text-lg leading-relaxed">
              {article.content}
            </div>
          </div>

          {/* Ad between content and gallery */}
          <ArticleAd position="content" />

          {/* Photo Gallery - Show at the end if there are media images */}
          <ImageGallery mediaItems={article.media || []} />

          {/* Share Buttons */}
          <ShareButtons 
            url={`/article/${article.slug}`}
            title={article.title}
            description={article.excerpt || article.content.substring(0, 200)}
          />

          {/* Share/Actions */}
          <ArticleActions 
            title={article.title}
            lastUpdated={article.updatedAt.toString()}
          />
        </div>
      </article>

      {/* Ad before related articles */}
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <ArticleAd position="bottom" />
        </div>
      </div>

      {/* Related Articles */}
      <RelatedArticles articles={relatedArticles} />
    </div>
  )
}

// Static generation disabled - using dynamic rendering
// export async function generateStaticParams() {
//   // Skip static generation during build if no database URL
//   if (!process.env.PRISMA_POSTGRES) {
//     return []
//   }

//   try {
//     const articles = await prisma.article.findMany({
//       where: { isPublished: true },
//       select: { slug: true },
//     })

//     return articles.map((article) => ({
//       slug: article.slug,
//     }))
//   } catch (error) {
//     console.warn('Failed to generate static params:', error)
//     return []
//   }
// }

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params
  
  // Skip metadata generation during build if no database URL
  if (!process.env.PRISMA_POSTGRES) {
    return {
      title: 'Najtvrđe Jaje',
      description: 'Video stories and articles',
    }
  }

  try {
    // Use cached article service for metadata generation
    const article = await getArticleBySlug(slug)
    
    if (!article) {
      return {
        title: 'Article Not Found',
      }
    }

    return {
      title: article.title,
      description: article.excerpt || article.title,
      openGraph: {
        title: article.title,
        description: article.excerpt || article.title,
        images: article.coverImage ? [{ url: article.coverImage }] : [],
      },
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.warn('Failed to generate metadata:', errorInfo.message)
    return {
      title: 'Najtvrđe Jaje',
      description: 'Video stories and articles',
    }
  }
}
