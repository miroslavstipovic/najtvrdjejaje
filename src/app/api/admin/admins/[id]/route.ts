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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = verifyAdminToken(request)
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const resolvedParams = await params
  const id = Number(resolvedParams.id)
  try {
    const { name, email, password } = await request.json()
    const data: any = {}
    if (name) data.name = name
    if (email) data.email = email
    if (password) data.password = await bcrypt.hash(password, 10)
    const admin = await prisma.admin.update({ where: { id }, data })
    return NextResponse.json({ id: admin.id, name: admin.name, email: admin.email })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update admin' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = verifyAdminToken(request)
  if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const resolvedParams = await params
  const id = Number(resolvedParams.id)
  try {
    await prisma.admin.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete admin' }, { status: 500 })
  }
}


