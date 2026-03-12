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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = verifyAdminToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    if (!location) {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Location fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = verifyAdminToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { name, latitude, longitude, description, youtubeUrl, articleId, iconUrl } = await request.json()

    // Validate if provided
    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      return NextResponse.json(
        { message: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      return NextResponse.json(
        { message: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude)
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude)
    if (description !== undefined) updateData.description = description || null
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl || null
    if (articleId !== undefined) updateData.articleId = articleId || null
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl || null

    const location = await prisma.location.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    })

    return NextResponse.json(location)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      )
    }
    console.error('Location update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = verifyAdminToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Delete location (onDelete: SetNull will handle articles)
    await prisma.location.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { message: 'Location not found' },
        { status: 404 }
      )
    }
    console.error('Location deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

