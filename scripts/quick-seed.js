const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function quickSeed() {
  try {
    console.log('🌱 Quick seeding database...')

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    try {
      await prisma.admin.create({
        data: {
          email: 'admin@flash.ba',
          password: hashedPassword,
          name: 'Flash.ba Admin',
        }
      })
      console.log('👤 Created admin user: admin@flash.ba')
    } catch (e) {
      console.log('👤 Admin user already exists')
    }

    // Create categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Latest tech news' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Movies and shows' },
      { name: 'News', slug: 'news', description: 'Breaking news' },
      { name: 'Sports', slug: 'sports', description: 'Sports updates' }
    ]

    for (const cat of categories) {
      try {
        await prisma.category.create({ data: cat })
        console.log(`📂 Created category: ${cat.name}`)
      } catch (e) {
        console.log(`📂 Category ${cat.name} already exists`)
      }
    }

    // Get first category for articles
    const firstCategory = await prisma.category.findFirst()
    
    if (firstCategory) {
      // Create sample articles
      const articles = [
        {
          title: 'Welcome to Our New Media System',
          slug: 'welcome-new-media-system',
          content: `Welcome to our enhanced video story portal!

We've implemented a new media management system that allows you to:

• Upload and organize images through our media library
• Add photo galleries to articles  
• Manage all media files in one place
• Display videos first, followed by photo galleries

Try the new system by going to Admin > Media to upload images, then create articles with photo galleries!`,
          excerpt: 'Introducing our new media management system',
          categoryId: firstCategory.id,
          isPublished: true,
          isFeatured: true
        },
        {
          title: 'How to Use the Media Library',
          slug: 'media-library-guide',
          content: `Learn how to use our new media library:

1. Go to Admin > Media
2. Click "Upload Files" to add images
3. When creating articles, use "Add Photos" to select images
4. Photos appear in a gallery at the end of articles

The system supports multiple image uploads and creates beautiful photo galleries automatically.`,
          excerpt: 'Guide to using the new media library features',
          categoryId: firstCategory.id,
          isPublished: true,
          isFeatured: false
        }
      ]

      for (const article of articles) {
        try {
          await prisma.article.create({ data: article })
          console.log(`📰 Created article: ${article.title}`)
        } catch (e) {
          console.log(`📰 Article ${article.title} already exists`)
        }
      }
    }

    console.log('✅ Quick seed completed!')
    console.log('🔑 Login at http://localhost:3001/admin')
    console.log('📧 Email: admin@flash.ba')
    console.log('🔒 Password: admin123')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickSeed()
