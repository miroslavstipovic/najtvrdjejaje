'use client'

import { useEffect, useRef, useState } from 'react'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  fullWidthResponsive?: boolean
  className?: string
}

export default function AdSense({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidthResponsive = true,
  className = ''
}: AdSenseProps) {
  const [clientId, setClientId] = useState<string | null>(null)
  const adRef = useRef<HTMLDivElement>(null)
  const [adLoaded, setAdLoaded] = useState(false)
  const [adError, setAdError] = useState<string | null>(null)
  const [isLoadingClientId, setIsLoadingClientId] = useState(true)

  // Fetch client ID from API (since it's stored in database)
  useEffect(() => {
    // First try environment variable (faster)
    const envClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
    if (envClientId) {
      setClientId(envClientId)
      setIsLoadingClientId(false)
      return
    }

    // Fetch from database via public API if not in env
    // Note: We need to get client ID from the meta tag in the document head
    // because it's set server-side in layout.tsx
    const metaTag = document.querySelector('meta[name="google-adsense-account"]')
    if (metaTag) {
      const content = metaTag.getAttribute('content')
      if (content) {
        setClientId(content)
        setIsLoadingClientId(false)
        return
      }
    }

    // If not found in meta tag, client ID is not configured
    console.warn('AdSense Client ID not configured. Please set it in Admin > AdSense or in .env.local')
    setIsLoadingClientId(false)
  }, [])

  useEffect(() => {
    // Only load ads if client ID is set
    if (!clientId || isLoadingClientId) {
      return
    }

    // Check if ad slot is a placeholder (common issue)
    if (adSlot.match(/^[0-9]{10}$/) && (
      adSlot === '1234567890' || 
      adSlot === '0987654321' || 
      adSlot === '1122334455' ||
      adSlot === '2233445566' ||
      adSlot === '3344556677' ||
      adSlot === '4455667788'
    )) {
      setAdError('⚠️ Using placeholder ad slot ID. Please replace with real AdSense slot ID from Google.')
      console.error('AdSense Error: Placeholder ad slot detected:', adSlot)
      return
    }

    const checkContainerSize = (): boolean => {
      if (!adRef.current) return false
      
      const rect = adRef.current.getBoundingClientRect()
      const isVisible = rect.width > 0 && rect.height > 0
      
      // Check if element is actually visible (not hidden by CSS)
      const style = window.getComputedStyle(adRef.current)
      const isDisplayed = style.display !== 'none' && style.visibility !== 'hidden'
      
      return isVisible && isDisplayed
    }

    const loadAd = () => {
      try {
        // Check if adsbygoogle is available
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle
          
          if (adsbygoogle) {
            // Verify container has dimensions before loading ad
            if (!checkContainerSize()) {
              // Container not ready, retry after a delay
              setTimeout(loadAd, 200)
              return
            }
            
            // Push ad to queue
            adsbygoogle.push({})
            setAdLoaded(true)
            if (process.env.NODE_ENV === 'development') {
              console.log('AdSense ad loaded for slot:', adSlot)
            }
          } else {
            // If adsbygoogle not available, try again after a delay
            if (process.env.NODE_ENV === 'development') {
              console.warn('adsbygoogle not yet available, retrying...')
            }
            setTimeout(loadAd, 300)
          }
        }
      } catch (error) {
        // Silently handle errors in production, log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('AdSense error:', error)
        }
        setAdError('Ad loading failed')
      }
    }

    // Use Intersection Observer to load ad only when container is visible
    if (typeof window !== 'undefined' && adRef.current && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && checkContainerSize()) {
              // Container is visible and has dimensions, load ad
              setTimeout(loadAd, 100)
              observer.disconnect()
            }
          })
        },
        {
          rootMargin: '50px', // Start loading slightly before it's visible
          threshold: 0.1
        }
      )

      observer.observe(adRef.current)

      // Fallback: Load after 2 seconds if observer doesn't trigger
      const fallbackTimer = setTimeout(() => {
        if (checkContainerSize()) {
          loadAd()
        }
        observer.disconnect()
      }, 2000)

      return () => {
        observer.disconnect()
        clearTimeout(fallbackTimer)
      }
    } else {
      // Fallback for browsers without IntersectionObserver
      // Load ad after ensuring container is ready
      const timer = setTimeout(() => {
        if (checkContainerSize()) {
          loadAd()
        } else {
          // Retry if container not ready
          setTimeout(loadAd, 200)
        }
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [clientId, adSlot, isLoadingClientId])

  // Don't render if still loading client ID
  if (isLoadingClientId) {
    return null
  }

  // Don't render if no client ID
  if (!clientId) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
          <p className="text-gray-500 text-sm">
            📢 Ad Space (Development Mode)
            <br />
            <span className="text-xs">Configure NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Show error if placeholder detected
  if (adError) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg p-8 text-center ${className}`}>
          <p className="text-yellow-700 text-sm">
            {adError}
            <br />
            <span className="text-xs mt-2 block">
              Go to Google AdSense → Ads → By ad unit → Create new ad unit
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={className} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
      {process.env.NODE_ENV === 'development' && !adLoaded && (
        <div className="text-xs text-gray-400 text-center mt-2">
          Loading AdSense (Slot: {adSlot})...
        </div>
      )}
    </div>
  )
}

