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

export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const searchQuery = url.searchParams.get('search')

    // Build where clause for search
    const whereClause = searchQuery
      ? {
          title: {
            contains: searchQuery,
            mode: 'insensitive' as const,
          },
        }
      : {}

    const [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: searchQuery ? 0 : offset, // Don't paginate search results
        take: searchQuery ? 100 : limit, // Show more results for search
      }),
      prisma.article.count({ where: whereClause }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      articles,
      totalPages,
      currentPage: page,
      totalCount,
    })
  } catch (error) {
    console.error('Articles fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const requestBody = await request.json()
    console.log('Received article data:', requestBody)
    
    const {
      title,
      content,
      excerpt,
      categoryId,
      videoUrl,
      videoType,
      coverImage,
      isPublished,
      isFeatured,
      locationId,
    } = requestBody

    console.log('Validation check:', { 
      hasTitle: !!title, 
      hasContent: !!content, 
      hasCategoryId: !!categoryId,
      categoryIdType: typeof categoryId,
      categoryIdValue: categoryId
    })

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { message: 'Title, content, and category are required' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, '') // Remove special characters but keep spaces
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/(^-|-$)+/g, '') // Remove leading/trailing hyphens
      .substring(0, 100) // Limit length
    
    console.log('Generated slug:', slug, 'from title:', title)

    // Check if slug already exists
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    })

    if (existingArticle) {
      return NextResponse.json(
        { message: 'An article with this title already exists' },
        { status: 400 }
      )
    }

    // If setting as featured, remove featured from other articles
    if (isFeatured) {
      await prisma.article.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      })
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        categoryId: parseInt(categoryId),
        videoUrl,
        videoType,
        coverImage,
        isPublished: isPublished || false,
        isFeatured: isFeatured || false,
        locationId: locationId ? parseInt(locationId) : null,
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
      ...article,
      id: article.id 
    }, { status: 201 })
  } catch (error) {
    console.error('Article creation error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
