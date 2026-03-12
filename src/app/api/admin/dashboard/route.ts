import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decodedToken = verifyToken(token)
    
    if (!decodedToken) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify admin still exists
    const admin = await prisma.admin.findUnique({
      where: { id: decodedToken.adminId },
    })

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 401 }
      )
    }

    // Get dashboard stats
    const [
      totalArticles,
      publishedArticles,
      totalCategories,
      totalAdmins
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { isPublished: true } }),
      prisma.category.count(),
      prisma.admin.count(),
    ])

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
      stats: {
        totalArticles,
        publishedArticles,
        totalCategories,
        totalAdmins,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
