import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
  }
}

// Set featured article (only one can be featured at a time)
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { articleId } = await request.json()

    if (!articleId) {
      return NextResponse.json(
        { message: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: parseInt(articleId) },
    })

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      )
    }

    if (!article.isPublished) {
      return NextResponse.json(
        { message: 'Only published articles can be featured' },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Remove featured from all articles
      prisma.article.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      }),
      // Set new featured article
      prisma.article.update({
        where: { id: parseInt(articleId) },
        data: { isFeatured: true },
      }),
    ])

    return NextResponse.json({ 
      message: 'Featured article updated successfully',
      articleId: parseInt(articleId)
    })
  } catch (error) {
    console.error('Featured article update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove featured status from all articles
export async function DELETE(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.article.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    })

    return NextResponse.json({ 
      message: 'All featured articles removed successfully'
    })
  } catch (error) {
    console.error('Remove featured error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get current featured article
export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const featuredArticle = await prisma.article.findFirst({
      where: { 
        isFeatured: true,
        isPublished: true 
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      featuredArticle: featuredArticle || null
    })
  } catch (error) {
    console.error('Get featured article error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
