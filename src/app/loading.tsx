import FeaturedStorySkeleton from '@/components/skeletons/FeaturedStorySkeleton'
import CategoriesSectionSkeleton from '@/components/skeletons/CategoriesSectionSkeleton'

export default function Loading() {
  return (
    <div className="space-y-0">
      <FeaturedStorySkeleton />
      <div className="container-custom py-8">
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
      <CategoriesSectionSkeleton />
    </div>
  )
}
