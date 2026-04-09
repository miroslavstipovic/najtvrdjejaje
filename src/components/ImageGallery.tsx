'use client'

import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'

interface MediaItem {
  id: number
  media: {
    id: number
    url: string
    originalName: string
    type: string
  }
}

interface ImageGalleryProps {
  mediaItems: MediaItem[]
}

export default function ImageGallery({ mediaItems }: ImageGalleryProps) {
  const imageItems = mediaItems.filter(mediaItem => mediaItem.media.type === 'image')
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  if (imageItems.length === 0) {
    return null
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsOpen(true)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsOpen(false)
    document.body.style.overflow = 'unset'
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? imageItems.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === imageItems.length - 1 ? 0 : prevIndex + 1
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') closeLightbox()
  }

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrevious(),
    trackMouse: true,
    preventScrollOnSwipe: true,
  })

  return (
    <>
      <div className="mt-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Foto galerija</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {imageItems.map((mediaItem, index) => (
            <div 
              key={mediaItem.id} 
              className="card overflow-hidden cursor-pointer group relative aspect-square"
              onClick={() => openLightbox(index)}
            >
              <img
                src={mediaItem.media.url}
                alt={mediaItem.media.originalName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          {...swipeHandlers}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation Arrows */}
          {imageItems.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
                aria-label="Previous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
                aria-label="Next"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image Container */}
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-8">
            {/* Swipe Hint (Mobile Only) */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 sm:hidden bg-black bg-opacity-70 text-white text-xs px-4 py-2 rounded-full animate-pulse">
              ← Swipe to navigate →
            </div>
            
            {/* Main Image */}
            <div 
              className="relative max-w-7xl max-h-[70vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageItems[currentIndex].media.url}
                alt={imageItems[currentIndex].media.originalName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Image Counter */}
            <div className="mt-4 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {currentIndex + 1} / {imageItems.length}
            </div>

            {/* Thumbnail Strip */}
            {imageItems.length > 1 && (
              <div 
                className="mt-6 max-w-full overflow-x-auto px-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-2 justify-center min-w-max">
                  {imageItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all ${
                        index === currentIndex 
                          ? 'ring-2 ring-primary-500 opacity-100 scale-110' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.media.url}
                        alt={item.media.originalName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
