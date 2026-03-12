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

// GET - Get article media
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const articleId = parseInt(id)

    if (isNaN(articleId)) {
      return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 })
    }

    const articleMedia = await prisma.articleMedia.findMany({
      where: { articleId },
      include: {
        media: true
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({ media: articleMedia })
  } catch (error) {
    console.error('Error fetching article media:', error)
    return NextResponse.json(
      { message: 'Failed to fetch article media' },
      { status: 500 }
    )
  }
}

// POST - Add media to article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔄 POST /api/admin/articles/[id]/media - Starting media association')
  
  const decoded = verifyToken(request)
  if (!decoded) {
    console.log('❌ Unauthorized request')
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  console.log('✅ Token verified for admin:', decoded.adminId)

  try {
    const { id } = await params
    const articleId = parseInt(id)
    console.log('📝 Article ID:', { raw: id, parsed: articleId, isNaN: isNaN(articleId) })

    const requestBody = await request.json()
    console.log('📥 Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { mediaIds } = requestBody

    if (isNaN(articleId)) {
      console.log('❌ Invalid article ID')
      return NextResponse.json({ message: 'Invalid article ID' }, { status: 400 })
    }

    console.log('📊 Media IDs analysis:', {
      mediaIds,
      type: typeof mediaIds,
      isArray: Array.isArray(mediaIds),
      length: Array.isArray(mediaIds) ? mediaIds.length : 'N/A'
    })

    if (!Array.isArray(mediaIds)) {
      console.log('❌ Media IDs is not an array')
      return NextResponse.json({ message: 'Media IDs must be an array' }, { status: 400 })
    }

    if (mediaIds.length === 0) {
      console.log('⚠️ Empty media IDs array')
      return NextResponse.json({ message: 'Media IDs array is empty' }, { status: 400 })
    }

    // Verify article exists
    console.log('🔍 Checking if article exists...')
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })
    console.log('📄 Article found:', article ? { id: article.id, title: article.title } : 'NOT FOUND')

    if (!article) {
      console.log('❌ Article not found')
      return NextResponse.json({ message: 'Article not found' }, { status: 404 })
    }

    // Verify media IDs exist
    console.log('🔍 Verifying media IDs exist...')
    const existingMedia = await prisma.media.findMany({
      where: { id: { in: mediaIds } }
    })
    console.log('📷 Found media:', existingMedia.map(m => ({ id: m.id, filename: m.filename })))
    
    const foundIds = existingMedia.map(m => m.id)
    const missingIds = mediaIds.filter(id => !foundIds.includes(id))
    if (missingIds.length > 0) {
      console.log('❌ Some media IDs not found:', missingIds)
      return NextResponse.json({ 
        message: `Media not found: ${missingIds.join(', ')}` 
      }, { status: 400 })
    }

    // Remove existing media relationships
    console.log('🗑️ Removing existing media relationships...')
    const deletedRelations = await prisma.articleMedia.deleteMany({
      where: { articleId }
    })
    console.log('🗑️ Deleted relations:', deletedRelations.count)

    // Add new media relationships
    console.log('➕ Creating new media relationships...')
    const articleMediaData = mediaIds.map((mediaId: number, index: number) => ({
      articleId,
      mediaId,
      order: index
    }))
    console.log('📊 Article media data to create:', articleMediaData)

    const createdRelations = await prisma.articleMedia.createMany({
      data: articleMediaData
    })
    console.log('✅ Created relations:', createdRelations.count)

    // Fetch updated media
    console.log('📥 Fetching updated media relationships...')
    const updatedMedia = await prisma.articleMedia.findMany({
      where: { articleId },
      include: {
        media: true
      },
      orderBy: { order: 'asc' }
    })
    console.log('📷 Updated media count:', updatedMedia.length)

    return NextResponse.json({ 
      message: 'Article media updated successfully',
      media: updatedMedia
    })
  } catch (error) {
    console.error('💥 Exception in article media update:', error)
    return NextResponse.json(
      { 
        message: 'Failed to update article media',
        error: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove media from article
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
    const articleId = parseInt(id)
    const { mediaId } = await request.json()

    if (isNaN(articleId) || isNaN(mediaId)) {
      return NextResponse.json({ message: 'Invalid IDs' }, { status: 400 })
    }

    await prisma.articleMedia.deleteMany({
      where: { 
        articleId,
        mediaId 
      }
    })

    return NextResponse.json({ message: 'Media removed from article successfully' })
  } catch (error) {
    console.error('Error removing article media:', error)
    return NextResponse.json(
      { message: 'Failed to remove article media' },
      { status: 500 }
    )
  }
}
