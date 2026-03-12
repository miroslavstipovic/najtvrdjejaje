import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { put } from '@vercel/blob'
import { processAvatarImage } from '@/lib/imageProcessor'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: number; email: string }
  } catch {
    return null
  }
}

// POST - Upload competitor profile image
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'Nije odabrana datoteka' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Neispravan tip datoteke. Dozvoljeno: PNG, JPEG, WebP' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'Datoteka je prevelika. Maksimalna veličina je 10MB' },
        { status: 400 }
      )
    }

    // Get file buffer
    const bytes = await file.arrayBuffer()
    const originalBuffer = Buffer.from(bytes)
    const originalSize = originalBuffer.length

    console.log(`📥 Received competitor image: ${(originalSize / 1024).toFixed(1)}KB`)

    // Process/compress image using avatar processor (400x400, cover fit)
    const processedBuffer = await processAvatarImage(originalBuffer, originalSize)

    // Generate filename with timestamp
    const filename = `competitors/competitor-${Date.now()}.jpg`

    // Upload to Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    const compressionPercent = Math.round((1 - processedBuffer.length / originalSize) * 100)
    console.log(`✅ Competitor image uploaded to Vercel Blob: ${(processedBuffer.length / 1024).toFixed(1)}KB (${compressionPercent}% reduction)`)

    return NextResponse.json({
      message: 'Slika uspješno uploadana',
      url: blob.url,
      originalSize,
      compressedSize: processedBuffer.length,
      compressionPercent,
    })
  } catch (error) {
    console.error('Upload competitor image error:', error)
    return NextResponse.json(
      { message: 'Greška pri uploadu slike' },
      { status: 500 }
    )
  }
}
