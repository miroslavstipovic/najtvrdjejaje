import { PrismaClient } from './src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Count articles
    const articleCount = await prisma.article.count()
    console.log(`📰 Articles in database: ${articleCount}`)
    
    // Count categories
    const categoryCount = await prisma.category.count()
    console.log(`📂 Categories in database: ${categoryCount}`)
    
    // Get featured article
    const featuredArticle = await prisma.article.findFirst({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      include: {
        category: true,
      },
    })
    
    if (featuredArticle) {
      console.log(`⭐ Featured article: "${featuredArticle.title}"`)
    } else {
      console.log('❌ No featured article found')
    }
    
    console.log('✅ Database test completed successfully')
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

