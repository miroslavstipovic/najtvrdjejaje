import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify admin still exists in database
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin not found' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
