import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getErrorInfo } from '@/lib/error-handler'

export async function POST() {
  try {
    console.log('🔐 Creating admin account...')
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.count()
    if (existingAdmin > 0) {
      return NextResponse.json({
        success: false,
        message: 'Admin account already exists',
        existing: existingAdmin
      })
    }
    
    // Create admin account
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@flash.ba',
        password: hashedPassword,
        name: 'Flash.ba Administrator'
      }
    })
    
    console.log('✅ Admin account created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully!',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      },
      loginInfo: {
        email: 'admin@flash.ba',
        password: 'admin123',
        loginUrl: '/admin'
      }
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Failed to create admin:', errorInfo.message)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin account',
      message: errorInfo.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const adminCount = await prisma.admin.count()
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      success: true,
      adminCount,
      admins,
      needsSetup: adminCount === 0
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    return NextResponse.json({
      success: false,
      error: errorInfo.message
    }, { status: 500 })
  }
}
