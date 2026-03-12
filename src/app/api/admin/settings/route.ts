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

export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await prisma.siteSettings.findMany({
      orderBy: {
        key: 'asc',
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settingsData = await request.json()

    if (!Array.isArray(settingsData)) {
      return NextResponse.json(
        { message: 'Settings data must be an array' },
        { status: 400 }
      )
    }

    // Update each setting
    const updatedSettings = []
    
    for (const setting of settingsData) {
      const { key, value } = setting
      
      if (!key || value === undefined) {
        continue
      }

      const updatedSetting = await prisma.siteSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
      
      updatedSettings.push(updatedSetting)
    }

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings 
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
