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
      let fileUrl: string
      
      // Check if Vercel Blob is configured
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN
      
      if (blobToken) {
        try {
          console.log('📍 Uploading location icon to Vercel Blob...')
          const blob = await put(uniqueFilename, file, {
            access: 'public',
            addRandomSuffix: false,
          })
          fileUrl = blob.url
          console.log('✅ Icon uploaded to Vercel Blob:', blob.url)
        } catch (blobError) {
          const errorInfo = getErrorInfo(blobError)
          console.error('❌ Vercel Blob upload failed:', errorInfo.message)
          throw new Error(`Vercel Blob upload failed: ${errorInfo.message}`)
        }
      } else {
        console.log('⚠️ BLOB_READ_WRITE_TOKEN not configured, using local storage fallback')
        
        // Fallback: Save to local public directory
        const fs = await import('fs/promises')
        const path = await import('path')
        
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'location-icons')
        
        // Ensure upload directory exists
        try {
          await fs.mkdir(uploadDir, { recursive: true })
        } catch (mkdirError) {
          console.log('Upload directory already exists or created')
        }
        
        const localFilePath = path.join(uploadDir, uniqueFilename.split('/').pop() || `${uuidv4()}.png`)
        const buffer = Buffer.from(await file.arrayBuffer())
        await fs.writeFile(localFilePath, buffer)
        
        // Create URL for local file
        fileUrl = `/uploads/location-icons/${path.basename(localFilePath)}`
        console.log('✅ Icon saved locally:', fileUrl)
      }

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
        
        // Don't fail the request if deletion fails - it might already be deleted
        return NextResponse.json({
          message: 'Icon deletion attempted (may already be deleted)',
          warning: errorInfo.message
        })
      }
    } else if (iconUrl.startsWith('/uploads/location-icons/')) {
      // Handle local file deletion
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        
        const fileName = iconUrl.split('/').pop()
        const filePath = path.join(process.cwd(), 'public', 'uploads', 'location-icons', fileName || '')
        
        await fs.unlink(filePath)
        console.log('✅ Local icon file deleted:', filePath)
        
        return NextResponse.json({
          message: 'Icon deleted successfully'
        })
      } catch (fsError) {
        const errorInfo = getErrorInfo(fsError)
        console.error('❌ Failed to delete local file:', errorInfo.message)
        
        return NextResponse.json({
          message: 'Icon deletion attempted (may already be deleted)',
          warning: errorInfo.message
        })
      }
    } else {
      // External URL - can't delete
      return NextResponse.json({
        message: 'Cannot delete external URL. Only uploaded icons can be deleted.'
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

