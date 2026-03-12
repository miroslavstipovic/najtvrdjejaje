'use client'

import dynamic from 'next/dynamic'

// Dynamically import StoryMap with no SSR to avoid window is not defined error with Leaflet
const StoryMap = dynamic(() => import('./StoryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] sm:h-[700px] lg:h-[800px] rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Učitavanje mape...</p>
      </div>
    </div>
  ),
})

interface LocationData {
  id: number
  name: string
  latitude: number
  longitude: number
  description: string | null
  youtubeUrl: string | null
  articleId: number | null
  iconUrl: string | null
  article?: {
    id: number
    title: string
    slug: string
    excerpt: string | null
    coverImage: string | null
    videoUrl: string | null
    videoType: string | null
    category: {
      name: string
    }
  }
}

interface MapWrapperProps {
  locations: LocationData[]
}

export default function MapWrapper({ locations }: MapWrapperProps) {
  return <StoryMap locations={locations} />
}


