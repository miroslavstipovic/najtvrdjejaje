import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getErrorInfo } from '@/lib/error-handler'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    return null
  }
}

// GET: Fetch ad settings
export async function GET(request: NextRequest) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get or create ad settings (only one row should exist)
    let adSettings = await prisma.adSettings.findFirst()
    
    if (!adSettings) {
      // Create default settings if none exist
      adSettings = await prisma.adSettings.create({
        data: {
          enabledOnHomepage: true,
          enabledOnArticles: true,
          enabledOnCategories: true,
          adsenseClientId: null,
        },
      })
    }

    return NextResponse.json({ settings: adSettings })
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Failed to fetch ad settings:', errorInfo.message)
    
    return NextResponse.json(
      { message: 'Failed to fetch ad settings', error: errorInfo.message },
      { status: 500 }
    )
  }
}

// POST: Update ad settings
export async function POST(request: NextRequest) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      enabledOnHomepage, 
      enabledOnArticles, 
      enabledOnCategories, 
      adsenseClientId,
      homepageAdSlot,
      articleContentAdSlot,
      articleBottomAdSlot,
      articleSidebarAdSlot,
      categoryTopAdSlot,
      categoryInlineAdSlot,
      mapSidebarAdSlot,
      mapBottomAdSlot
    } = body

    // Validate AdSense Client ID format if provided
    if (adsenseClientId && adsenseClientId.trim() !== '') {
      const clientIdPattern = /^ca-pub-\d{16}$/
      if (!clientIdPattern.test(adsenseClientId.trim())) {
        return NextResponse.json(
          { message: 'Invalid AdSense Client ID format. Should be: ca-pub-XXXXXXXXXXXXXXXX' },
          { status: 400 }
        )
      }
    }
    
    // Get existing settings
    const existingSettings = await prisma.adSettings.findFirst()

    let adSettings
    if (existingSettings) {
      // Update existing settings
      adSettings = await prisma.adSettings.update({
        where: { id: existingSettings.id },
        data: {
          enabledOnHomepage: enabledOnHomepage ?? existingSettings.enabledOnHomepage,
          enabledOnArticles: enabledOnArticles ?? existingSettings.enabledOnArticles,
          enabledOnCategories: enabledOnCategories ?? existingSettings.enabledOnCategories,
          adsenseClientId: adsenseClientId?.trim() || null,
          homepageAdSlot: homepageAdSlot?.trim() || null,
          articleContentAdSlot: articleContentAdSlot?.trim() || null,
          articleBottomAdSlot: articleBottomAdSlot?.trim() || null,
          articleSidebarAdSlot: articleSidebarAdSlot?.trim() || null,
          categoryTopAdSlot: categoryTopAdSlot?.trim() || null,
          categoryInlineAdSlot: categoryInlineAdSlot?.trim() || null,
          mapSidebarAdSlot: mapSidebarAdSlot?.trim() || null,
          mapBottomAdSlot: mapBottomAdSlot?.trim() || null,
        },
      })
    } else {
      // Create new settings
      adSettings = await prisma.adSettings.create({
        data: {
          enabledOnHomepage: enabledOnHomepage ?? true,
          enabledOnArticles: enabledOnArticles ?? true,
          enabledOnCategories: enabledOnCategories ?? true,
          adsenseClientId: adsenseClientId?.trim() || null,
          homepageAdSlot: homepageAdSlot?.trim() || null,
          articleContentAdSlot: articleContentAdSlot?.trim() || null,
          articleBottomAdSlot: articleBottomAdSlot?.trim() || null,
          articleSidebarAdSlot: articleSidebarAdSlot?.trim() || null,
          categoryTopAdSlot: categoryTopAdSlot?.trim() || null,
          categoryInlineAdSlot: categoryInlineAdSlot?.trim() || null,
          mapSidebarAdSlot: mapSidebarAdSlot?.trim() || null,
          mapBottomAdSlot: mapBottomAdSlot?.trim() || null,
        },
      })
    }

    return NextResponse.json({ 
      message: 'Ad settings updated successfully',
      settings: adSettings 
    })
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Failed to update ad settings:', errorInfo.message)
    
    return NextResponse.json(
      { message: 'Failed to update ad settings', error: errorInfo.message },
      { status: 500 }
    )
  }
}
