import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function createSampleContent() {
  try {
    console.log('🔄 Creating sample content...')
    
    // Create categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Technology news and updates' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle articles and tips' },
      { name: 'Business', slug: 'business', description: 'Business news and insights' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment and media' }
    ]

    console.log('📂 Creating categories...')
    for (const cat of categories) {
      try {
        await prisma.category.create({ data: cat })
        console.log(`✅ Created category: ${cat.name}`)
      } catch (error) {
        console.log(`⚠️ Category ${cat.name} might already exist`)
      }
    }

    // Get created categories
    const createdCategories = await prisma.category.findMany()
    
    // Create sample articles
    const articles = [
      {
        title: 'Welcome to Our New Media System',
        slug: 'welcome-new-media-system',
        content: `Welcome to our enhanced video story portal! 

We've just implemented a brand new media management system that allows you to:

• Upload and organize images through our media library
• Add photo galleries to articles
• Manage all your media files in one place
• Display videos first, followed by beautiful photo galleries

This system replaces the old hardcoded image approach with a much more flexible and professional solution.

Try creating a new article and adding some photos to see how it works!`,
        excerpt: 'Introducing our new media management system with photo galleries and enhanced article display.',
        categoryId: createdCategories[0]?.id,
        isPublished: true,
        isFeatured: true
      },
      {
        title: 'How to Use the Media Library',
        slug: 'how-to-use-media-library',
        content: `Our new media library makes it easy to manage your images and create beautiful photo galleries.

**Uploading Images:**
1. Go to Admin > Media
2. Click "Upload Files"
3. Select multiple images at once
4. Images are automatically organized and stored

**Adding Photos to Articles:**
1. When creating or editing an article
2. Scroll to the "Photo Gallery" section
3. Click "Add Photos" to open the media library
4. Select the images you want to include
5. Photos will appear in a 2-column grid at the end of your article

**Managing Media:**
- View all uploaded files in the media library
- See which articles use each image
- Delete unused media files
- Preview images in full size

The system is designed to be intuitive and powerful, giving you complete control over your visual content.`,
        excerpt: 'Learn how to use our new media library and photo gallery features.',
        categoryId: createdCategories[0]?.id,
        isPublished: true,
        isFeatured: false
      },
      {
        title: 'Video and Photo Integration',
        slug: 'video-photo-integration',
        content: `Our articles now support both videos and photo galleries in a structured way:

**Display Order:**
1. **Video First** - If you add a video URL, it displays prominently at the top
2. **Cover Image** - If no video, the cover image is shown instead  
3. **Article Content** - Your main text content
4. **Photo Gallery** - Additional photos display in a beautiful 2-column grid at the end

**Video Support:**
- YouTube videos
- Vimeo videos  
- Direct video file uploads

**Photo Gallery Features:**
- Responsive 2-column layout
- Click to view full-size images
- Automatic image optimization
- Professional presentation

This creates a much more engaging and visually appealing experience for your readers.`,
        excerpt: 'Learn how videos and photos work together in our new article layout.',
        categoryId: createdCategories[1]?.id,
        isPublished: true,
        isFeatured: false
      }
    ]

    console.log('📄 Creating sample articles...')
    for (const article of articles) {
      if (article.categoryId) {
        try {
          await prisma.article.create({ data: article })
          console.log(`✅ Created article: ${article.title}`)
        } catch (error) {
          console.log(`⚠️ Article ${article.title} might already exist`)
        }
      }
    }

    // Create admin user if none exists
    const adminCount = await prisma.admin.count()
    if (adminCount === 0) {
      console.log('👤 Creating admin user...')
      // Note: In production, hash the password properly
      await prisma.admin.create({
        data: {
          email: 'admin@example.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          name: 'Admin User'
        }
      })
      console.log('✅ Created admin user (email: admin@example.com, password: password)')
    }

    await prisma.$disconnect()
    console.log('🎉 Sample content created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating sample content:', error)
  }
}

createSampleContent()
