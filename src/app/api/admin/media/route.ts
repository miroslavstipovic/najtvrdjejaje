import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getErrorInfo } from '@/lib/error-handler'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

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

// GET - List all media files
export async function GET(request: NextRequest) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // 'image' or 'video'
    
    const skip = (page - 1) * limit
    
    const where = type ? { type } : {}
    
    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { articles: true }
          }
        }
      }),
      prisma.media.count({ where })
    ])

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Error fetching media:', errorInfo.message)
    return NextResponse.json(
      { message: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

// POST - Upload new media file
export async function POST(request: NextRequest) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `media/${uuidv4()}.${fileExtension}`

    try {
      // Upload to Vercel Blob
      console.log('📤 Uploading to Vercel Blob storage...')
      const blob = await put(uniqueFilename, file, {
        access: 'public',
      })
      const fileUrl = blob.url
      console.log('✅ File uploaded to Vercel Blob:', blob.url)

      // Save to database
      const media = await prisma.media.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          url: fileUrl,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          mimeType: file.type,
          size: file.size
        }
      })

      return NextResponse.json({
        message: 'File uploaded successfully',
        media
      })
    } catch (uploadError) {
      const errorInfo = getErrorInfo(uploadError)
      console.error('Upload error:', errorInfo.message)
      return NextResponse.json(
        { message: 'Failed to upload file: ' + errorInfo.message },
        { status: 500 }
      )
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Error uploading media:', errorInfo.message)
    return NextResponse.json(
      { message: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
