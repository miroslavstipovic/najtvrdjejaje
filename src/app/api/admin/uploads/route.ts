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

// Get all uploaded files (now from database)
export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all articles with cover images to show uploaded files
    const articlesWithImages = await prisma.article.findMany({
      where: {
        coverImage: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const files = articlesWithImages.map(article => ({
      filename: `article-${article.id}-image`,
      url: article.coverImage,
      articleId: article.id,
      articleTitle: article.title,
      size: 0, // Can't determine size from base64
      created: article.createdAt,
      modified: article.updatedAt,
    }))

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Get uploads error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch uploads' },
      { status: 500 }
    )
  }
}

// Delete uploaded file (now removes from articles)
export async function DELETE(request: NextRequest) {
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

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: parseInt(articleId) },
      select: {
        id: true,
        title: true,
        coverImage: true
      }
    })

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 404 }
      )
    }

    if (!article.coverImage) {
      return NextResponse.json(
        { message: 'Article has no cover image to delete' },
        { status: 400 }
      )
    }

    // Remove cover image from article
    await prisma.article.update({
      where: { id: parseInt(articleId) },
      data: { coverImage: null }
    })

    return NextResponse.json({ 
      message: 'Cover image removed successfully',
      articleId: parseInt(articleId),
      articleTitle: article.title
    })
  } catch (error) {
    console.error('Delete upload error:', error)
    return NextResponse.json(
      { message: 'Failed to remove cover image' },
      { status: 500 }
    )
  }
}
