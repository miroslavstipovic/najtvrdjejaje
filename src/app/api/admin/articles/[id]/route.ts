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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const article = await prisma.article.findUnique({
      where: { id: parseInt(resolvedParams.id) },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!article) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Article fetch error:', error)
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
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const resolvedParams = await params
    const articleId = parseInt(resolvedParams.id)

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!existingArticle) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 })
    }

    // If setting as featured, remove featured from other articles
    if (data.isFeatured && !existingArticle.isFeatured) {
      await prisma.article.updateMany({
        where: { 
          isFeatured: true,
          id: { not: articleId }
        },
        data: { isFeatured: false },
      })
    }

    // If updating title, generate new slug
    let updateData = { ...data }
    if (data.title && data.title !== existingArticle.title) {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

      // Check if new slug already exists
      const slugExists = await prisma.article.findFirst({
        where: {
          slug,
          id: { not: articleId },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { message: 'An article with this title already exists' },
          { status: 400 }
        )
      }

      updateData.slug = slug
    }

    // Handle locationId
    if (data.locationId !== undefined) {
      updateData.locationId = data.locationId ? parseInt(data.locationId) : null
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Article update error:', error)
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
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const articleId = parseInt(resolvedParams.id)

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
    })

    if (!existingArticle) {
      return NextResponse.json({ message: 'Article not found' }, { status: 404 })
    }

    await prisma.article.delete({
      where: { id: articleId },
    })

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Article deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
