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

interface FeaturedStoryProps {
  article: {
    id: number
    title: string
    slug: string
    content: string
    excerpt: string | null
    videoUrl: string | null
    videoType: string | null
    coverImage: string | null
    category: {
      name: string
      slug: string
    }
  }
}

export default function FeaturedStory({ article }: FeaturedStoryProps) {
  return (
    <section className="bg-gradient-to-br from-primary-50 via-cream-100 to-gold-50">
      <div className="container-custom py-8 sm:py-12 lg:py-16">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Video Section - Left */}
          <div className="order-2 lg:order-1">
            {article.videoUrl && isValidVideoUrl(article.videoUrl) ? (
              <div className="card shadow-lg border-2 border-gold-200">
                <VideoPlayer 
                  url={article.videoUrl} 
                  type={article.videoType || 'youtube'} 
                />
              </div>
            ) : article.coverImage ? (
              <div className="card shadow-lg overflow-hidden border-2 border-gold-200">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  width="600"
                  height="400"
                  className="w-full h-56 sm:h-64 lg:h-80 object-cover"
                  fetchPriority="high"
                />
              </div>
            ) : (
              <div className="card bg-cream-200 flex items-center justify-center h-56 sm:h-64 lg:h-80 border-2 border-gold-200">
                <p className="text-primary-400 text-base">🥚 Nema dostupnog medija</p>
              </div>
            )}
          </div>

          {/* Text Content - Right */}
          <div className="order-1 lg:order-2 space-y-4 lg:space-y-6">
            {/* Badges Row - Category + Featured */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                href={`/category/${article.category.slug}`}
                className="inline-flex items-center bg-primary-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-primary-700 transition-all shadow-soft hover:shadow-md"
              >
                {article.category.name}
              </Link>
              <span className="inline-flex items-center bg-gold-400 text-primary-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-soft">
                🏆 Istaknuta
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-800 leading-tight">
              {article.title}
            </h1>

            {/* Excerpt or Content Preview */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-700 leading-normal">
              {article.excerpt || article.content.substring(0, 200) + '...'}
            </p>

            {/* Read More Button */}
            <div className="pt-2">
              <Link 
                href={`/article/${article.slug}`}
                className="btn-primary"
              >
                Pročitaj cijelu priču
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
