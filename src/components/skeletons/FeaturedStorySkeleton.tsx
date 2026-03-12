export default function FeaturedStorySkeleton() {
  return (
    <section className="bg-gradient-to-br from-primary-25 via-primary-50 to-blue-50">
      <div className="container-custom py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Video/Image Skeleton */}
          <div className="order-2 lg:order-1">
            <div className="card shadow-lg overflow-hidden">
              <div className="w-full h-56 sm:h-64 lg:h-80 bg-gray-200 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="order-1 lg:order-2 space-y-4 lg:space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Button */}
            <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}

