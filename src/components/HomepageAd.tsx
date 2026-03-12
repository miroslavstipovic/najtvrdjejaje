'use client'

import { useEffect, useState } from 'react'
import AdSense from './AdSense'

interface AdSettings {
  enabledOnHomepage: boolean
  enabledOnArticles: boolean
  enabledOnCategories: boolean
  homepageAdSlot: string | null
}

export default function HomepageAd() {
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

  if (loading || !settings?.enabledOnHomepage || !settings?.homepageAdSlot) {
    return null
  }

  return (
    <div className="my-8 sm:my-12 min-h-[250px]">
      <AdSense 
        adSlot={settings.homepageAdSlot}
        adFormat="horizontal"
        fullWidthResponsive={true}
      />
    </div>
  )
}

