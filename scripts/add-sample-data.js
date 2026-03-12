const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function addSampleData() {
  try {
    console.log('🌱 Adding sample data...')

    // Create admin user if none exists
    const adminCount = await prisma.admin.count()
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await prisma.admin.create({
        data: {
          email: 'admin@flash.ba',
          password: hashedPassword,
          name: 'Flash.ba Admin',
        }
      })
      console.log('👤 Created admin user: admin@flash.ba / admin123')
    } else {
      console.log('👤 Admin user already exists')
    }

    // Create categories if none exist
    const categoryCount = await prisma.category.count()
    if (categoryCount === 0) {
      const categories = [
        { name: 'Technology', slug: 'technology', description: 'Latest tech news' },
        { name: 'Entertainment', slug: 'entertainment', description: 'Movies and shows' },
        { name: 'News', slug: 'news', description: 'Breaking news' },
        { name: 'Sports', slug: 'sports', description: 'Sports updates' }
      ]

      for (const cat of categories) {
        await prisma.category.create({ data: cat })
        console.log(`📂 Created category: ${cat.name}`)
      }
    } else {
      console.log('📂 Categories already exist')
    }

    console.log('✅ Sample data ready!')
    console.log('🔑 You can now login at: http://localhost:3001/admin')
    console.log('📧 Email: admin@flash.ba')
    console.log('🔒 Password: admin123')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleData()
