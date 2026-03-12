import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database content...')
    
    const articleCount = await prisma.article.count()
    const categoryCount = await prisma.category.count()
    const adminCount = await prisma.admin.count()
    const mediaCount = await prisma.media.count()
    
    console.log('\n📊 Database Statistics:')
    console.log(`Articles: ${articleCount}`)
    console.log(`Categories: ${categoryCount}`)
    console.log(`Admins: ${adminCount}`)
    console.log(`Media: ${mediaCount}`)
    
    if (categoryCount > 0) {
      console.log('\n📂 Categories:')
      const categories = await prisma.category.findMany()
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`)
      })
    }
    
    if (articleCount > 0) {
      console.log('\n📄 Sample Articles:')
      const articles = await prisma.article.findMany({ take: 5 })
      articles.forEach(article => {
        console.log(`  - ${article.title} (published: ${article.isPublished})`)
      })
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDatabase()
