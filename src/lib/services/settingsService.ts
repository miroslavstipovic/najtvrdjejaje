import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

/**
 * Get site settings with request memoization (cache per request)
 * Uses React cache() to deduplicate requests within the same render
 */
export const getSiteSettings = cache(async () => {
  if (!process.env.DATABASE_URL) {
    return { 
      faviconHref: '/favicon.ico', 
      adsenseClientId: null,
      logoUrl: null,
      siteName: 'Najtvrđe Jaje',
    }
  }

  try {
    const [faviconSetting, logoSetting, siteNameSetting, adSettings] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { key: 'favicon_url' } }),
      prisma.siteSettings.findUnique({ where: { key: 'logo_url' } }),
      prisma.siteSettings.findUnique({ where: { key: 'site_name' } }),
      prisma.adSettings.findFirst({ select: { adsenseClientId: true } }),
    ])

    return {
      faviconHref: faviconSetting?.value || '/favicon.ico',
      logoUrl: logoSetting?.value || null,
      siteName: siteNameSetting?.value || 'Najtvrđe Jaje',
      adsenseClientId: adSettings?.adsenseClientId || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null,
    }
  } catch (error) {
    console.warn('Failed to load settings:', error)
    return {
      faviconHref: '/favicon.ico',
      logoUrl: null,
      siteName: 'Najtvrđe Jaje',
      adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null,
    }
  }
})

/**
 * Get cached site settings with ISR (revalidate every 5 minutes)
 * Uses unstable_cache for cross-request caching
 */
export const getCachedSiteSettings = unstable_cache(
  async () => {
    if (!process.env.DATABASE_URL) {
      return { 
        faviconHref: '/favicon.ico', 
        adsenseClientId: null,
        logoUrl: null,
        siteName: 'Najtvrđe Jaje',
      }
    }

    try {
      const [faviconSetting, logoSetting, siteNameSetting, adSettings] = await Promise.all([
        prisma.siteSettings.findUnique({ where: { key: 'favicon_url' } }),
        prisma.siteSettings.findUnique({ where: { key: 'logo_url' } }),
        prisma.siteSettings.findUnique({ where: { key: 'site_name' } }),
        prisma.adSettings.findFirst({ select: { adsenseClientId: true } }),
      ])

      return {
        faviconHref: faviconSetting?.value || '/favicon.ico',
        logoUrl: logoSetting?.value || null,
        siteName: siteNameSetting?.value || 'Najtvrđe Jaje',
        adsenseClientId: adSettings?.adsenseClientId || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null,
      }
    } catch (error) {
      console.warn('Failed to load cached settings:', error)
      return {
        faviconHref: '/favicon.ico',
        logoUrl: null,
        siteName: 'Najtvrđe Jaje',
        adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || null,
      }
    }
  },
  ['site-settings'],
  { revalidate: 300 } // 5 minutes
)

/**
 * Get branding settings only (logo and site name)
 */
export const getBrandingSettings = cache(async () => {
  if (!process.env.DATABASE_URL) {
    return { 
      logoUrl: null,
      siteName: 'Najtvrđe Jaje',
    }
  }

  try {
    const [logoSetting, siteNameSetting] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { key: 'logo_url' } }),
      prisma.siteSettings.findUnique({ where: { key: 'site_name' } }),
    ])

    return {
      logoUrl: logoSetting?.value || null,
      siteName: siteNameSetting?.value || 'Najtvrđe Jaje',
    }
  } catch (error) {
    console.warn('Failed to load branding settings:', error)
    return {
      logoUrl: null,
      siteName: 'Najtvrđe Jaje',
    }
  }
})
