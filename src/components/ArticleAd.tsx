'use client'

import { useEffect, useState } from 'react'
import AdSense from './AdSense'

interface AdSettings {
  enabledOnHomepage: boolean
  enabledOnArticles: boolean
  enabledOnCategories: boolean
  articleContentAdSlot: string | null
  articleBottomAdSlot: string | null
  articleSidebarAdSlot: string | null
}

interface ArticleAdProps {
  position: 'sidebar' | 'content' | 'bottom'
}

export default function ArticleAd({ position }: ArticleAdProps) {
  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ads/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading || !settings?.enabledOnArticles) {
    return null
  }

  // Map positions to their slot IDs from database
  const slotId = position === 'content' 
    ? settings.articleContentAdSlot
    : position === 'bottom'
    ? settings.articleBottomAdSlot
    : settings.articleSidebarAdSlot

  // Don't render if no slot ID configured for this position
  if (!slotId) {
    return null
  }

  const adFormats = {
    sidebar: 'vertical' as const,
    content: 'horizontal' as const,
    bottom: 'auto' as const,
  }

  return (
    <div className="my-6">
      <AdSense 
        adSlot={slotId}
        adFormat={adFormats[position]}
        fullWidthResponsive={true}
      />
    </div>
  )
}

