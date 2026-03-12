'use client'

import { useEffect, useState } from 'react'
import AdSense from './AdSense'

interface AdSettings {
  enabledOnHomepage: boolean
  enabledOnArticles: boolean
  enabledOnCategories: boolean
  categoryTopAdSlot: string | null
  categoryInlineAdSlot: string | null
}

interface CategoryAdProps {
  position: 'top' | 'inline'
  index?: number
}

export default function CategoryAd({ position, index }: CategoryAdProps) {
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

  if (loading || !settings?.enabledOnCategories) {
    return null
  }

  // Show inline ad only every 6 articles
  if (position === 'inline' && index !== undefined && (index + 1) % 6 !== 0) {
    return null
  }

  // Get slot ID from database settings
  const slotId = position === 'top' 
    ? settings.categoryTopAdSlot
    : settings.categoryInlineAdSlot

  // Don't render if no slot ID configured for this position
  if (!slotId) {
    return null
  }

  return (
    <div className={position === 'inline' ? 'col-span-full my-6' : 'my-6'}>
      <AdSense 
        adSlot={slotId}
        adFormat="horizontal"
        fullWidthResponsive={true}
      />
    </div>
  )
}

