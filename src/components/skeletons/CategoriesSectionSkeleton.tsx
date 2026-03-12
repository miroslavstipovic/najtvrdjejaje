export default function CategoriesSectionSkeleton() {
  return (
    <section className="container-custom py-8 sm:py-12 lg:py-16">
      {/* Section Header Skeleton */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-3" />
        <div className="h-5 w-96 bg-gray-200 rounded animate-pulse mx-auto max-w-2xl" />
      </div>

      {/* Categories Skeleton */}
      <div className="space-y-10 lg:space-y-14">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-5 lg:space-y-6">
            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
            </div>

            {/* Articles Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3].map((j) => (
                <div key={j} className="card">
                  {/* Image Skeleton */}
                  <div className="w-full h-44 sm:h-48 bg-gray-200 animate-pulse rounded-t-lg" />
                  
                  {/* Content Skeleton */}
                  <div className="px-4 pt-2 pb-4 lg:px-5 lg:pt-3 lg:pb-5">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-full bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

