import { notFound } from 'next/navigation'
import Link from 'next/link'
import VideoPlayer from '@/components/VideoPlayer'
import CategoryAd from '@/components/CategoryAd'
import { prisma } from '@/lib/prisma'
import { getCategoryWithArticles, getCategoryBySlug } from '@/lib/services/categoryService'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page = '1' } = await searchParams
  
  const currentPage = parseInt(page) || 1

  // Fetch category and articles using optimized service with request memoization
  const { category, articles, totalPages, totalArticles } = await getCategoryWithArticles(slug, currentPage)

  if (!category) {
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
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="ml-1 text-sm sm:text-base font-medium text-gray-500 md:ml-2">
                    {category.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-br from-primary-25 to-blue-50">
        <div className="container-custom py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-6 leading-relaxed">
                {category.description}
              </p>
            )}
            <p className="text-base sm:text-lg text-gray-500">
              {totalArticles} članaka
            </p>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container-custom py-16 sm:py-20 lg:py-24">
        {/* Ad above articles */}
        <CategoryAd position="top" />

        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
              {articles.map((article, index) => (
                <>
                  <div key={article.id} className="card-interactive">
                  {/* Article Media */}
                  <div className="relative mb-4 overflow-hidden rounded-t-lg">
                    {article.videoUrl ? (
                      <div className="h-52 sm:h-56 mb-0">
                        <VideoPlayer 
                          url={article.videoUrl} 
                          type={article.videoType || 'youtube'} 
                        />
                      </div>
                    ) : article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        width="400"
                        height="224"
                        className="w-full h-52 sm:h-56 object-cover block"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-52 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Article Content */}
                  <div className="px-6 pb-6 lg:px-8 lg:pb-8">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Link
                        href={`/category/${slug}`}
                        className="badge-primary px-3 py-1 text-xs"
                      >
                        {category.name}
                      </Link>
                      {article.isFeatured && (
                        <span className="badge-warning px-3 py-1 text-xs">
                          ⭐ Istaknuta
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                      {article.excerpt || article.content.substring(0, 150) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm sm:text-base text-gray-500">
                        {new Date(article.createdAt).toLocaleDateString('hr-HR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      
                      <Link 
                        href={`/article/${article.slug}`}
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base group transition-colors min-h-[44px]"
                      >
                        Pročitaj više
                        <svg
                          className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Show ad every 6 articles */}
                <CategoryAd position="inline" index={index} />
                </>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="relative z-0 inline-flex rounded-2xl shadow-soft overflow-hidden">
                  {currentPage > 1 && (
                    <Link
                      href={`/category/${slug}?page=${currentPage - 1}`}
                      className="relative inline-flex items-center px-5 py-3 sm:px-6 sm:py-4 border-r border-gray-200 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      Prijašnja
                    </Link>
                  )}
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/category/${slug}?page=${pageNum}`}
                      className={`relative inline-flex items-center px-5 py-3 sm:px-6 sm:py-4 border-r border-gray-200 text-sm sm:text-base font-medium transition-all min-h-[44px] ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary-600 text-white hover:bg-primary-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                  
                  {currentPage < totalPages && (
                    <Link
                      href={`/category/${slug}?page=${currentPage + 1}`}
                      className="relative inline-flex items-center px-5 py-3 sm:px-6 sm:py-4 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      Sljedeća
                    </Link>
                  )}
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-lg sm:text-xl mb-8">
              Nema pronađenih članaka u ovoj kategoriji.
            </p>
            <Link 
              href="/"
              className="btn-primary"
            >
              Pregledaj ostale kategorije
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Generate static paths for better performance
export async function generateStaticParams() {
  // Skip static generation during build if no database URL
  if (!process.env.PRISMA_POSTGRES) {
    return []
  }

  try {
    const categories = await prisma.category.findMany({
      select: { slug: true },
    })

    return categories.map((category) => ({
      slug: category.slug,
    }))
  } catch (error) {
    console.warn('Failed to generate static params:', error)
    return []
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Skip metadata generation during build if no database URL
  if (!process.env.PRISMA_POSTGRES) {
    return {
      title: 'Video Story Portal',
      description: 'Browse video stories and articles by category',
    }
  }

  try {
    // Use cached category service for metadata generation
    const category = await getCategoryBySlug(slug)

    if (!category) {
      return {
        title: 'Category Not Found',
      }
    }

    return {
      title: `${category.name} - Video Portal`,
      description: category.description || `Browse articles in ${category.name}`,
    }
  } catch (error) {
    console.warn('Failed to generate metadata:', error)
    return {
      title: 'Video Story Portal',
      description: 'Browse video stories and articles by category',
    }
  }
}
