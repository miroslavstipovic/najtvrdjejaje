import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { put, del } from '@vercel/blob'
import { processLogoImage, processFaviconImage } from '@/lib/imageProcessor'

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

// GET - Get current branding settings (public)
export async function GET() {
  try {
    const [logoSetting, faviconSetting, siteNameSetting] = await Promise.all([
      prisma.siteSettings.findUnique({ where: { key: 'logo_url' } }),
      prisma.siteSettings.findUnique({ where: { key: 'favicon_url' } }),
      prisma.siteSettings.findUnique({ where: { key: 'site_name' } }),
    ])

    return NextResponse.json({
      logoUrl: logoSetting?.value || null,
      faviconUrl: faviconSetting?.value || '/favicon.ico',
      siteName: siteNameSetting?.value || 'Najtvrđe Jaje',
    })
  } catch (error) {
    console.error('Get branding error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch branding settings' },
      { status: 500 }
    )
  }
}

// POST - Upload logo or favicon (admin only)
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string // 'logo' or 'favicon'

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    if (!type || !['logo', 'favicon'].includes(type)) {
      return NextResponse.json({ message: 'Invalid type. Must be "logo" or "favicon"' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/ico']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Allowed: PNG, JPEG, WebP, SVG, ICO' }, { status: 400 })
    }

    // Get file buffer
    const bytes = await file.arrayBuffer()
    const originalBuffer = Buffer.from(bytes)
    const originalSize = originalBuffer.length

    console.log(`📥 Received ${type}: ${(originalSize / 1024).toFixed(1)}KB`)

    // Process/compress image based on type
    let processedBuffer: Buffer
    let ext: string
    
    if (type === 'logo') {
      processedBuffer = await processLogoImage(originalBuffer, originalSize)
      ext = 'png'
    } else {
      processedBuffer = await processFaviconImage(originalBuffer, originalSize)
      ext = 'png'
    }

    // Generate filename for Vercel Blob
    const filename = `branding/${type}-${Date.now()}.${ext}`

    // Upload to Vercel Blob
    const blob = await put(filename, processedBuffer, {
      access: 'public',
      contentType: 'image/png',
    })
    
    console.log(`✅ ${type} uploaded to Vercel Blob: ${(processedBuffer.length / 1024).toFixed(1)}KB (${Math.round((1 - processedBuffer.length / originalSize) * 100)}% reduction)`)

    // Use Vercel Blob URL
    const publicUrl = blob.url

    // Save to database
    const settingKey = type === 'logo' ? 'logo_url' : 'favicon_url'
    await prisma.siteSettings.upsert({
      where: { key: settingKey },
      update: { value: publicUrl },
      create: { key: settingKey, value: publicUrl },
    })

    return NextResponse.json({
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`,
      url: publicUrl,
    })
  } catch (error) {
    console.error('Upload branding error:', error)
    return NextResponse.json(
      { message: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE - Remove logo or favicon (admin only)
export async function DELETE(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type } = await request.json()

    if (!type || !['logo', 'favicon'].includes(type)) {
      return NextResponse.json({ message: 'Invalid type. Must be "logo" or "favicon"' }, { status: 400 })
    }

    const settingKey = type === 'logo' ? 'logo_url' : 'favicon_url'
    
    // Delete from database (set to null/default)
    await prisma.siteSettings.upsert({
      where: { key: settingKey },
      update: { value: type === 'favicon' ? '/favicon.ico' : '' },
      create: { key: settingKey, value: type === 'favicon' ? '/favicon.ico' : '' },
    })

    return NextResponse.json({
      message: `${type === 'logo' ? 'Logo' : 'Favicon'} removed successfully`,
    })
  } catch (error) {
    console.error('Delete branding error:', error)
    return NextResponse.json(
      { message: 'Failed to remove branding' },
      { status: 500 }
    )
  }
}
