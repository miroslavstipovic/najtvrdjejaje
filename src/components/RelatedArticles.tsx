'use client'

import Link from 'next/link'

interface RelatedArticle {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  videoUrl: string | null
  videoType: string | null
  createdAt: Date
}

interface RelatedArticlesProps {
  articles: RelatedArticle[]
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) {
    return null
  }

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match?.[1] || ''
  }

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-20 lg:py-24">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-10 sm:mb-12">
            Povezani članci
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {articles.map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/article/${relatedArticle.slug}`}
                className="group card-interactive"
              >
                <div className="relative overflow-hidden">
                  {relatedArticle.videoUrl && relatedArticle.videoType === 'youtube' ? (
                    // Show YouTube thumbnail if video exists
                    <div className="relative">
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(relatedArticle.videoUrl)}/maxresdefault.jpg`}
                        alt={relatedArticle.title}
                        className="w-full h-52 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Fallback to cover image if YouTube thumbnail fails
                          if (relatedArticle.coverImage) {
                            (e.target as HTMLImageElement).src = relatedArticle.coverImage
                          }
                        }}
                      />
                      {/* YouTube play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-4 group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-lg">
                          <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : relatedArticle.coverImage ? (
                    // Show cover image if no video
                    <img
                      src={relatedArticle.coverImage}
                      alt={relatedArticle.title}
                      className="w-full h-52 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    // Placeholder if no image or video
                    <div className="w-full h-52 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 lg:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-3 line-clamp-2 leading-snug">
                    {relatedArticle.title}
                  </h3>
                  {relatedArticle.excerpt && (
                    <p className="text-gray-600 line-clamp-3 mb-5 leading-relaxed">
                      {relatedArticle.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm sm:text-base text-gray-500">
                      {new Date(relatedArticle.createdAt).toLocaleDateString('hr-HR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <span className="inline-flex items-center text-primary-600 text-sm sm:text-base font-medium group-hover:text-primary-700 group-hover:gap-2 transition-all">
                      Pročitaj više
                      <svg className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
