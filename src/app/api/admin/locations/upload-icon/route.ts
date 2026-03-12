import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { getErrorInfo } from '@/lib/error-handler'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Maximum file size for icons (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
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

// POST - Upload icon
export async function POST(request: NextRequest) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('icon') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPG, PNG, GIF, WebP, and SVG are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'png'
    const uniqueFilename = `location-icons/${uuidv4()}.${fileExtension}`

    try {
      // Upload to Vercel Blob
      console.log('📍 Uploading location icon to Vercel Blob...')
      const blob = await put(uniqueFilename, file, {
        access: 'public',
        addRandomSuffix: false,
      })
      const fileUrl = blob.url
      console.log('✅ Icon uploaded to Vercel Blob:', blob.url)

      return NextResponse.json({
        message: 'Icon uploaded successfully',
        url: fileUrl,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type
      })
    } catch (uploadError) {
      const errorInfo = getErrorInfo(uploadError)
      console.error('Upload error:', errorInfo.message)
      return NextResponse.json(
        { message: 'Failed to upload icon: ' + errorInfo.message },
        { status: 500 }
      )
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Error uploading icon:', errorInfo.message)
    return NextResponse.json(
      { message: 'Failed to upload icon' },
      { status: 500 }
    )
  }
}

// DELETE - Delete icon from Vercel Blob
export async function DELETE(request: NextRequest) {
  const decoded = verifyToken(request)
  if (!decoded) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const iconUrl = searchParams.get('url')

    if (!iconUrl) {
      return NextResponse.json(
        { message: 'Icon URL is required' },
        { status: 400 }
      )
    }

    // Check if it's a Vercel Blob URL
    if (iconUrl.includes('blob.vercel-storage.com') || iconUrl.includes('public.blob.vercel-storage.com')) {
      try {
        console.log('🗑️ Deleting icon from Vercel Blob:', iconUrl)
        await del(iconUrl)
        console.log('✅ Icon deleted from Vercel Blob')
        
        return NextResponse.json({
          message: 'Icon deleted successfully'
        })
      } catch (blobError) {
        const errorInfo = getErrorInfo(blobError)
        console.error('❌ Failed to delete from Vercel Blob:', errorInfo.message)
        
        return NextResponse.json({
          message: 'Icon deletion attempted (may already be deleted)',
          warning: errorInfo.message
        })
      }
    } else {
      return NextResponse.json({
        message: 'Cannot delete this URL. Only Vercel Blob uploads can be deleted.'
      })
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Error deleting icon:', errorInfo.message)
    return NextResponse.json(
      { message: 'Failed to delete icon' },
      { status: 500 }
    )
  }
}

