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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, description, order } = await request.json()
    const resolvedParams = await params
    const categoryId = parseInt(resolvedParams.id)

    // If only updating order, skip name validation
    if (order !== undefined && !name) {
      const category = await prisma.category.update({
        where: { id: categoryId },
        data: { order: parseInt(order) },
        include: {
          _count: {
            select: {
              articles: true,
            },
          },
        },
      })
      return NextResponse.json(category)
    }

    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      )
    }

    // Generate new slug if name changed
    let updateData: any = { 
      name, 
      description: description !== undefined ? (description || null) : undefined,
    }
    
    if (order !== undefined) {
      updateData.order = parseInt(order)
    }
    
    if (name !== existingCategory.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

      // Check if new slug already exists
      const slugExists = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: categoryId },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { message: 'A category with this name already exists' },
          { status: 400 }
        )
      }

      updateData.slug = slug
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Category update error:', error)
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
    const categoryId = parseInt(resolvedParams.id)

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has articles
    if (existingCategory._count.articles > 0) {
      return NextResponse.json(
        { message: 'Cannot delete category with articles. Please move or delete all articles first.' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
