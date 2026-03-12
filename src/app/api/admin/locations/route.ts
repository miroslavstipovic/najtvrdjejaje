import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    return decoded
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const decoded = verifyAdminToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const locations = await prisma.location.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Locations fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const decoded = verifyAdminToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, latitude, longitude, description, youtubeUrl, articleId, iconUrl } = await request.json()

    if (!name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { message: 'Name, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Validate that either youtubeUrl or articleId is provided
    if (!youtubeUrl && !articleId) {
      return NextResponse.json(
        { message: 'Either YouTube URL or Article ID must be provided' },
        { status: 400 }
      )
    }

    // Validate latitude and longitude ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { message: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { message: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: description || null,
        youtubeUrl: youtubeUrl || null,
        articleId: articleId || null,
        iconUrl: iconUrl || null,
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Location creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

