import Link from 'next/link'
import VideoPlayer from './VideoPlayer'

// Helper function to validate video URLs
function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Check for invalid YouTube URLs
  if (url === 'https://www.youtube.com/' || url === 'https://youtube.com/' || url === 'www.youtube.com') {
    return false
  }
  
  // Check if it's a valid YouTube video URL
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    return videoIdRegex.test(url)
  }
  
  // Check if it's a valid Vimeo URL
  if (url.includes('vimeo.com')) {
    const vimeoRegex = /vimeo\.com\/(\d+)/
    return vimeoRegex.test(url)
  }
  
  return false
}

interface Article {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  videoUrl: string | null
  videoType: string | null
  coverImage: string | null
  isFeatured: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  articles: Article[]
  _count: {
    articles: number
  }
}

interface CategoriesSectionProps {
  categories: Category[]
}

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="container-custom py-8 sm:py-12 lg:py-16">
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-800 mb-3">
          Istražite kategorije
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-normal">
          Otkrijte sjajan sadržaj u različitim kategorijama
        </p>
      </div>

      {/* Categories Grid */}
      <div className="space-y-10 lg:space-y-14">
        {categories.map((category) => (
          <div key={category.id} className="space-y-5 lg:space-y-6">
            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-l-4 border-gold-500 pl-4">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-700">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm sm:text-base text-gray-600 leading-normal">{category.description}</p>
                )}
                <p className="text-xs sm:text-sm text-gold-600 font-medium">
                  {category._count.articles} članaka
                </p>
              </div>
              
              <Link 
                href={`/category/${category.slug}`}
                className="btn-secondary text-xs sm:text-sm whitespace-nowrap self-start sm:self-auto"
              >
                Pogledaj sve
              </Link>
            </div>

            {/* Articles Grid */}
            {category.articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {category.articles.map((article) => (
                  <div key={article.id} className="card-interactive">
                    {/* Article Media */}
                    <div className="relative mb-4 overflow-hidden rounded-t-lg">
                      {article.videoUrl && isValidVideoUrl(article.videoUrl) ? (
                        <div className="h-44 sm:h-48 mb-0">
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
                          height="192"
                          className="w-full h-44 sm:h-48 object-cover block"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-44 sm:h-48 bg-gradient-to-br from-cream-200 to-gold-100 flex items-center justify-center">
                          <span className="text-4xl">🥚</span>
                        </div>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="px-4 pt-2 pb-4 lg:px-5 lg:pt-3 lg:pb-5">
                      {/* Featured Badge (if applicable) */}
                      {article.isFeatured && (
                        <div className="mb-2">
                          <span className="badge-gold px-2 py-0.5 text-xs">
                            🏆 Istaknuta
                          </span>
                        </div>
                      )}
                      
                      <h4 className="text-base sm:text-lg font-semibold text-primary-800 mb-2 line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-normal">
                        {article.excerpt || article.content.substring(0, 100) + '...'}
                      </p>
                      
                      <Link 
                        href={`/article/${article.slug}`}
                        className="inline-flex items-center text-primary-600 hover:text-gold-600 font-medium transition-colors text-sm group"
                      >
                        Pročitaj više
                        <svg
                          className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
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
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-cream-200 rounded-2xl border border-gold-200">
                <p className="text-primary-500 text-lg">🥚 Nema dostupnih članaka u ovoj kategoriji.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
