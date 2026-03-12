import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorInfo } from '@/lib/error-handler'

const exportData = {
  "categories": [
    {"name": "Poljoprivreda i Stočarstvo", "slug": "poljoprivreda-i-stocarstvo", "description": null, "createdAt": "2025-09-15T14:39:33.726Z", "updatedAt": "2025-09-15T14:39:33.726Z"},
    {"name": "Tradicija i Zanati", "slug": "tradicija-i-zanati", "description": null, "createdAt": "2025-09-15T14:39:33.726Z", "updatedAt": "2025-09-15T14:39:33.726Z"},
    {"name": "Ljudi i Priče", "slug": "ljudi-i-price", "description": null, "createdAt": "2025-09-15T14:39:33.726Z", "updatedAt": "2025-09-15T14:39:33.726Z"},
    {"name": "Priroda i Pejzaž", "slug": "priroda-i-pejzaz", "description": null, "createdAt": "2025-09-15T14:39:33.726Z", "updatedAt": "2025-09-15T14:39:33.726Z"},
    {"name": "Kulinarska Tradicija", "slug": "kulinarska-tradicija", "description": null, "createdAt": "2025-09-15T14:39:33.726Z", "updatedAt": "2025-09-15T14:39:33.726Z"},
    {"name": "Događaji i Festivali", "slug": "dogadjaji-i-festivali", "description": null, "createdAt": "2025-09-15T14:39:33.726Z", "updatedAt": "2025-09-15T14:39:33.726Z"}
  ],
  "articles": [
    {
      "title": "Vlašićkim ovčarima vratila se zima",
      "slug": "vlasickim-ovcarima-vratila-se-zima",
      "content": "Iako je kalendarski proljeće odavno zamijenilo zimu, sudeći prema ovim kadrovima koje smo jutros snimili na Vlašiću izgleda da se zima ponovno vraća vlašićkim ovčarima.Kako je jutros bilo na Vlašiću pogledajte u ovome video uratku. Autor: www.flash.ba | Srećko Stipović",
      "excerpt": "Iako je kalendarski proljeće odavno zamijenilo zimu, sudeći prema ovim kadrovima koje smo jutros snimili na Vlašiću izgleda da se zima ponovno vraća vlašićkim ovčarima.",
      "videoUrl": "https://www.youtube.com/watch?v=lEnQX3kGQQg",
      "videoType": "youtube",
      "coverImage": null,
      "isPublished": true,
      "isFeatured": true,
      "categoryId": 1,
      "createdAt": "2019-05-03T18:31:22.000Z",
      "updatedAt": "2025-09-21T17:07:11.167Z"
    },
    {
      "title": "Mađioničar sa buvljaka",
      "slug": "madijonicar-sa-buvljaka", 
      "content": "Ovaj mađioničar već godinama zabavlja djecu i odrasle na buvljaku. Njegovi trikovi uvijek izazivaju osmjeh i čuđenje publike.",
      "excerpt": "Mađioničar koji već godinama zabavlja na buvljaku svojimi nevjerojatnima trikovima.",
      "videoUrl": null,
      "videoType": null,
      "coverImage": null,
      "isPublished": true,
      "isFeatured": true,
      "categoryId": 3,
      "createdAt": "2019-04-15T12:22:15.000Z",
      "updatedAt": "2025-09-21T17:07:11.167Z"
    },
    {
      "title": "Praznik rada dočekujem sa socijalom od 100 KM",
      "slug": "praznik-rada-docekujem-sa-socijalom-od-100-km",
      "content": "Teška ekonomska situacija primorava mnoge da praznik rada dočekaju sa minimalnim prihodima. Priče o životnim borbama naših sugrađana.",
      "excerpt": "Kako se živi sa socijalnom pomoći od 100 KM u današnje vrijeme.",
      "videoUrl": null,
      "videoType": null,
      "coverImage": null,
      "isPublished": true,
      "isFeatured": true,
      "categoryId": 3,
      "createdAt": "2019-05-01T09:00:00.000Z",
      "updatedAt": "2025-09-21T17:07:11.167Z"
    }
  ]
}

export async function GET() {
  return NextResponse.json({ 
    message: "Import endpoint ready. Use POST to import sample WordPress content.",
    ready: true,
    sampleData: {
      categories: exportData.categories.length,
      articles: exportData.articles.length
    }
  })
}

export async function POST() {
  try {
    console.log('🚀 Importing WordPress content...')
    
    let imported = { categories: 0, articles: 0, errors: [] as string[] }
    
    // Import categories
    for (const cat of exportData.categories) {
      try {
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: { name: cat.name },
          create: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            createdAt: new Date(cat.createdAt),
            updatedAt: new Date(cat.updatedAt)
          }
        })
        imported.categories++
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        imported.errors.push(`Category ${cat.name}: ${errorInfo.message}`)
      }
    }
    
    // Import articles
    for (const article of exportData.articles) {
      try {
        await prisma.article.upsert({
          where: { slug: article.slug },
          update: {
            title: article.title,
            content: article.content,
            isPublished: article.isPublished,
            isFeatured: article.isFeatured
          },
          create: {
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            videoUrl: article.videoUrl,
            videoType: article.videoType,
            coverImage: article.coverImage,
            isPublished: article.isPublished,
            isFeatured: article.isFeatured,
            categoryId: article.categoryId,
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt)
          }
        })
        imported.articles++
      } catch (error) {
        const errorInfo = getErrorInfo(error)
        imported.errors.push(`Article ${article.title}: ${errorInfo.message}`)
      }
    }
    
    // Final check
    const final = {
      articles: await prisma.article.count(),
      published: await prisma.article.count({ where: { isPublished: true } }),
      featured: await prisma.article.count({ where: { isFeatured: true } })
    }
    
    return NextResponse.json({
      success: true,
      message: 'WordPress content imported successfully!',
      imported,
      final,
      ready: final.featured > 0
    })
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    return NextResponse.json({
      success: false,
      error: errorInfo.message
    }, { status: 500 })
  }
}
