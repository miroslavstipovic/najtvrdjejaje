const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

// Simple script to seed Vercel PostgreSQL database
async function seedVercelDatabase() {
  console.log('🌱 Starting Vercel database seeding...');
  
  // Use the Vercel DATABASE_URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to Vercel database');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@videoportal.com' },
      update: {},
      create: {
        email: 'admin@videoportal.com',
        password: hashedPassword,
        name: 'Portal Admin',
      },
    });
    console.log('👤 Admin user ready:', admin.email);

    // Create categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Latest tech news and reviews' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and celebrity news' },
      { name: 'Sports', slug: 'sports', description: 'Sports news and highlights' },
      { name: 'News', slug: 'news', description: 'Breaking news and current events' },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category,
      });
    }
    console.log('📝 Categories created');

    // Create sample articles
    const techCategory = await prisma.category.findUnique({
      where: { slug: 'technology' }
    });

    if (techCategory) {
      await prisma.article.upsert({
        where: { slug: 'welcome-to-our-video-portal' },
        update: {},
        create: {
          title: 'Welcome to Our Video Portal',
          slug: 'welcome-to-our-video-portal',
          content: 'This is our featured story that showcases the power of video storytelling.',
          excerpt: 'Discover amazing video content on our new portal',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoType: 'youtube',
          isPublished: true,
          isFeatured: true,
          categoryId: techCategory.id,
        },
      });
      console.log('📰 Sample article created');
    }

    // Create site settings
    const siteSettings = [
      { key: 'site_name', value: 'Video Story Portal' },
      { key: 'site_description', value: 'Your destination for video stories and news' },
      { key: 'contact_email', value: 'admin@videoportal.com' },
      { key: 'footer_about', value: 'Your destination for engaging video stories and news content.' },
      { key: 'copyright_text', value: '© 2025 Video Portal. All rights reserved.' },
    ];

    for (const setting of siteSettings) {
      await prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }
    console.log('⚙️ Site settings configured');

    console.log('✅ Vercel database seeding completed!');
    console.log('📧 Admin login: admin@videoportal.com / admin123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedVercelDatabase()
    .then(() => {
      console.log('🎉 Database ready for production!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedVercelDatabase };
