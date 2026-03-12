export default function CategorySkeleton() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="bg-white shadow-soft">
        <div className="container-custom py-5">
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Category Header Skeleton */}
      <div className="bg-gradient-to-br from-primary-25 to-blue-50">
        <div className="container-custom py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="h-12 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>

      {/* Articles Grid Skeleton */}
      <div className="container-custom py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              {/* Image Skeleton */}
              <div className="w-full h-52 sm:h-56 bg-gray-200 animate-pulse rounded-t-lg" />
              
              {/* Content Skeleton */}
              <div className="px-6 pb-6 lg:px-8 lg:pb-8">
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-6 w-full bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-5" />
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

