import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const decoded = verifyAdminToken(request)
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const admins = await prisma.admin.findMany({
    select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ admins })
}

export async function POST(request: NextRequest) {
  const decoded = verifyAdminToken(request)
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { name, email, password } = await request.json()
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email and password are required' }, { status: 400 })
    }
    const hashed = await bcrypt.hash(password, 10)
    const admin = await prisma.admin.create({ data: { name, email, password: hashed } })
    return NextResponse.json({ id: admin.id, name: admin.name, email: admin.email })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
    }
    return NextResponse.json({ message: 'Failed to create admin' }, { status: 500 })
  }
}


