import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { getErrorInfo } from '@/lib/error-handler'

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

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
        { message: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFilename = `articles/${uuidv4()}.${fileExtension}`

    try {
      // Upload to Vercel Blob
      console.log('🔄 Uploading to Vercel Blob:', uniqueFilename)
      const blob = await put(uniqueFilename, file, {
        access: 'public',
      })
      console.log('✅ Blob upload successful:', blob.url)

      // Create Media record in database
      const mediaRecord = await prisma.media.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          url: blob.url,
          type: 'image',
          mimeType: file.type,
          size: file.size,
        }
      })
      console.log('✅ Media record created:', mediaRecord.id)

      return NextResponse.json({
        message: 'File uploaded successfully',
        imageUrl: blob.url,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        mediaId: mediaRecord.id // Return the database ID for association
      })
    } catch (blobError) {
      const blobErrorInfo = getErrorInfo(blobError)
      console.error('💥 Blob upload error:', blobErrorInfo.message)
      
      // Check if it's a token issue
      if (blobErrorInfo.message?.includes('No token found')) {
        return NextResponse.json({
          message: 'Vercel Blob token missing. Please configure BLOB_READ_WRITE_TOKEN environment variable.',
          error: 'BLOB_TOKEN_MISSING'
        }, { status: 500 })
      }
      
      try {
        // Fallback to base64 if Vercel Blob fails
        console.log('🔄 Falling back to base64 storage...')
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataUrl = `data:${mimeType};base64,${base64}`

        // Create Media record with base64 data
        const mediaRecord = await prisma.media.create({
          data: {
            filename: file.name,
            originalName: file.name,
            url: dataUrl,
            type: 'image',
            mimeType: file.type,
            size: file.size,
          }
        })
        console.log('✅ Media record created (fallback):', mediaRecord.id)

        return NextResponse.json({
          message: 'File uploaded successfully (fallback to base64)',
          imageUrl: dataUrl,
          filename: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          mediaId: mediaRecord.id,
          fallback: true
        })
      } catch (fallbackError) {
        const fallbackErrorInfo = getErrorInfo(fallbackError)
        console.error('💥 Fallback also failed:', fallbackErrorInfo.message)
        throw blobError // Throw original error
      }
    }

  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('Upload error:', errorInfo.message)
    return NextResponse.json(
      { 
        message: 'Upload failed. Please try again.',
        error: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
      },
      { status: 500 }
    )
  }
}
