import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: number }
  } catch {
    return null
  }
}

// DELETE - Remove media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const mediaId = parseInt(id)

    if (isNaN(mediaId)) {
      return NextResponse.json({ message: 'Invalid media ID' }, { status: 400 })
    }

    // Check if media exists and is not used in any articles
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    })

    if (!media) {
      return NextResponse.json({ message: 'Media not found' }, { status: 404 })
    }

    if (media._count.articles > 0) {
      return NextResponse.json(
        { message: 'Cannot delete media that is used in articles' },
        { status: 400 }
      )
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId }
    })

    return NextResponse.json({ message: 'Media deleted successfully' })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { message: 'Failed to delete media' },
      { status: 500 }
    )
  }
}
