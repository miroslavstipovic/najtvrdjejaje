import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🔍 Checking database setup...')
    
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Check if admin exists
    const adminCount = await prisma.admin.count()
    console.log(`👤 Admins in database: ${adminCount}`)
    
    // Check if categories exist
    const categoryCount = await prisma.category.count()
    console.log(`📂 Categories in database: ${categoryCount}`)
    
    // Create admin if none exists
    if (adminCount === 0) {
      console.log('Creating admin user...')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.admin.create({
        data: {
          email: 'admin@flash.ba',
          password: hashedPassword,
          name: 'Flash.ba Admin',
        }
      })
      console.log('✅ Admin user created')
    }
    
    // Create categories if none exist
    if (categoryCount === 0) {
      console.log('Creating categories...')
      const categories = [
        { name: 'Technology', slug: 'technology', description: 'Tech news and updates' },
        { name: 'News', slug: 'news', description: 'Latest news' },
        { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment content' },
        { name: 'Sports', slug: 'sports', description: 'Sports updates' }
      ]
      
      for (const cat of categories) {
        await prisma.category.create({ data: cat })
        console.log(`✅ Created category: ${cat.name}`)
      }
    }
    
    // Final counts
    const finalAdminCount = await prisma.admin.count()
    const finalCategoryCount = await prisma.category.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database setup complete',
      data: {
        admins: finalAdminCount,
        categories: finalCategoryCount,
        loginInfo: {
          email: 'admin@flash.ba',
          password: 'admin123'
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
