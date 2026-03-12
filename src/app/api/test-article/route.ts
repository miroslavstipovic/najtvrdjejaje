import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const categoryCount = await prisma.category.count()
    const adminCount = await prisma.admin.count()
    
    return NextResponse.json({
      message: 'API is working',
      database: 'connected',
      categories: categoryCount,
      admins: adminCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      message: 'API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Test POST received:', body)
    
    return NextResponse.json({
      message: 'Test POST successful',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test POST error:', error)
    return NextResponse.json({
      message: 'Test POST failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
