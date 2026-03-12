import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  return NextResponse.json({ message: 'Use POST method to set up database' });
}

export async function POST() {
  try {
    console.log('🔧 Starting database setup...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if admin already exists
    console.log('🔍 Checking for existing admin...');
    const existingAdmin = await prisma.admin.findFirst();
    
    if (!existingAdmin) {
      console.log('👤 Creating admin user...');
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.admin.create({
        data: {
          email: 'admin@videoportal.com',
          password: hashedPassword,
          name: 'Administrator'
        }
      });
      console.log('✅ Admin user created successfully');

      // Create sample categories
      const techCategory = await prisma.category.create({
        data: {
          name: 'Technology',
          slug: 'technology',
          description: 'Latest technology news and tutorials',
          coverImage: '/uploads/tech-cover.jpg'
        }
      });

      const newsCategory = await prisma.category.create({
        data: {
          name: 'News',
          slug: 'news',
          description: 'Current events and breaking news',
          coverImage: '/uploads/news-cover.jpg'
        }
      });

      // Create sample article
      await prisma.article.create({
        data: {
          title: 'Welcome to Video Story Portal',
          slug: 'welcome-video-story-portal',
          content: 'Welcome to our amazing video story portal! This is a sample article to get you started.',
          excerpt: 'Welcome to our video story portal with great content.',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoType: 'youtube',
          coverImage: '/uploads/welcome-cover.jpg',
          isPublished: true,
          isFeatured: true,
          categoryId: techCategory.id
        }
      });

      // Create site settings
      await prisma.siteSettings.createMany({
        data: [
          { key: 'site_title', value: 'Video Story Portal' },
          { key: 'site_description', value: 'Your premier destination for video stories' },
          { key: 'site_logo', value: '/logo.png' },
          { key: 'contact_email', value: 'admin@videoportal.com' }
        ]
      });
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    console.log('✅ Database setup completed successfully');
    return NextResponse.json({ 
      message: 'Database setup complete!',
      admin: 'admin@videoportal.com / admin123',
      status: 'success'
    });
  } catch (error) {
    console.error('❌ Database setup error:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to set up database';
    let errorDetails = '';
    
    // Type guard for error object
    const err = error as any;
    
    if (err?.code === 'P1001') {
      errorMessage = 'Cannot connect to database server';
      errorDetails = 'Check if DATABASE_URL environment variable is set correctly';
    } else if (err?.code === 'P1012') {
      errorMessage = 'Database URL validation error';
      errorDetails = 'The DATABASE_URL format is invalid';
    } else if (err?.message) {
      errorDetails = err.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: err?.code || 'UNKNOWN',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
