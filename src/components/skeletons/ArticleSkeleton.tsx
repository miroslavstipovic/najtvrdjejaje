export default function ArticleSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-5">
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Article Content Skeleton */}
      <article className="container-custom py-10 sm:py-14 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-10 sm:mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-4/5 bg-gray-200 rounded animate-pulse" />
            </div>
            
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Video/Image Skeleton */}
          <div className="mb-10 sm:mb-12">
            <div className="card shadow-lg">
              <div className="w-full h-64 sm:h-96 lg:h-[500px] bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-3 mb-10 sm:mb-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}

