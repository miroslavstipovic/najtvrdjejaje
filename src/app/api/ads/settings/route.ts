import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorInfo } from '@/lib/error-handler'

// Public endpoint to get ad settings (no auth required)
export async function GET() {
  try {
    const adSettings = await prisma.adSettings.findFirst({
      select: {
        enabledOnHomepage: true,
        enabledOnArticles: true,
        enabledOnCategories: true,
        homepageAdSlot: true,
        articleContentAdSlot: true,
        articleBottomAdSlot: true,
        articleSidebarAdSlot: true,
        categoryTopAdSlot: true,
        categoryInlineAdSlot: true,
        mapSidebarAdSlot: true,
        mapBottomAdSlot: true,
        // Don't expose client ID publicly (it's already in env)
      },
    })

    // Return default values if no settings exist
    if (!adSettings) {
      return NextResponse.json({
        enabledOnHomepage: true,
        enabledOnArticles: true,
        enabledOnCategories: true,
        homepageAdSlot: null,
        articleContentAdSlot: null,
        articleBottomAdSlot: null,
        articleSidebarAdSlot: null,
        categoryTopAdSlot: null,
        categoryInlineAdSlot: null,
        mapSidebarAdSlot: null,
        mapBottomAdSlot: null,
      })
    }

    return NextResponse.json(adSettings)
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Fetch public ad settings error:', errorInfo.message)
    
    // Return defaults on error to prevent site breakage
    return NextResponse.json({
      enabledOnHomepage: false,
      enabledOnArticles: false,
      enabledOnCategories: false,
      homepageAdSlot: null,
      articleContentAdSlot: null,
      articleBottomAdSlot: null,
      articleSidebarAdSlot: null,
      categoryTopAdSlot: null,
      categoryInlineAdSlot: null,
      mapSidebarAdSlot: null,
      mapBottomAdSlot: null,
    })
  }
}

