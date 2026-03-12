import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if tables exist
    let mediaExists = true
    let articleMediaExists = true

    try {
      await prisma.media.count()
    } catch (error) {
      mediaExists = false
    }

    try {
      await prisma.articleMedia.count()
    } catch (error) {
      articleMediaExists = false
    }

    return NextResponse.json({
      success: true,
      message: 'Database fix endpoint is ready',
      tablesExist: {
        media: mediaExists,
        articleMedia: articleMediaExists
      },
      needsFix: !mediaExists || !articleMediaExists
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('🔧 Fixing database schema - creating missing tables...')

    // Check if tables exist by trying to query them
    let mediaExists = true
    let articleMediaExists = true

    try {
      await prisma.media.count()
    } catch (error) {
      console.log('❌ Media table missing')
      mediaExists = false
    }

    try {
      await prisma.articleMedia.count()
    } catch (error) {
      console.log('❌ ArticleMedia table missing')
      articleMediaExists = false
    }

    if (mediaExists && articleMediaExists) {
      return NextResponse.json({
        success: true,
        message: 'Database schema is already correct',
        status: 'no_changes_needed'
      })
    }

    // The tables don't exist, we need to run Prisma migrations
    // Since we can't run prisma db push directly in Vercel, we'll create a raw SQL to create the tables
    
    if (!mediaExists) {
      console.log('📄 Creating media table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "media" (
          "id" SERIAL NOT NULL,
          "filename" TEXT NOT NULL,
          "originalName" TEXT NOT NULL,
          "url" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "mimeType" TEXT NOT NULL,
          "size" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          
          CONSTRAINT "media_pkey" PRIMARY KEY ("id")
        );
      `
    }

    if (!articleMediaExists) {
      console.log('🔗 Creating article_media table...')
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "article_media" (
          "id" SERIAL NOT NULL,
          "articleId" INTEGER NOT NULL,
          "mediaId" INTEGER NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "article_media_pkey" PRIMARY KEY ("id")
        );
      `

      // Create unique constraint
      await prisma.$executeRaw`
        ALTER TABLE "article_media" 
        ADD CONSTRAINT "article_media_articleId_mediaId_key" 
        UNIQUE ("articleId", "mediaId");
      `

      // Create indexes
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "article_media_articleId_idx" ON "article_media"("articleId");
      `

      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "article_media_mediaId_idx" ON "article_media"("mediaId");
      `

      // Create foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "article_media" 
        ADD CONSTRAINT "article_media_article_fkey" 
        FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `

      await prisma.$executeRaw`
        ALTER TABLE "article_media" 
        ADD CONSTRAINT "article_media_media_fkey" 
        FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `
    }

    // Verify tables were created
    const mediaCount = await prisma.media.count()
    const articleMediaCount = await prisma.articleMedia.count()

    console.log('✅ Database schema fixed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Database schema fixed - missing tables created',
      tables: {
        media: {
          created: !mediaExists,
          records: mediaCount
        },
        articleMedia: {
          created: !articleMediaExists,
          records: articleMediaCount
        }
      },
      status: 'schema_fixed'
    })

  } catch (error) {
    console.error('❌ Database fix failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix database schema',
      message: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'You may need to run "npx prisma db push" locally and then redeploy'
    }, { status: 500 })
  }
}
