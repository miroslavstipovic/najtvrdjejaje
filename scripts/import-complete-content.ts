import { PrismaClient } from '../src/generated/prisma'
import { put } from '@vercel/blob'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { getErrorInfo } from './utils/error-handler'

const prisma = new PrismaClient()

interface ImageInfo {
  filename: string
  path: string
  size: number
  resolution: string
  isHighRes: boolean
}

// Define the specific category names as a union type
type CategoryName = 
  | 'Poljoprivreda i Stočarstvo'
  | 'Tradicija i Zanati' 
  | 'Ljudi i Priče'
  | 'Priroda i Pejzaž'
  | 'Kulinarska Tradicija'
  | 'Tehnologija i Inovacije'
  | 'Događaji i Festivali'

// Define the categories type with proper typing
type Categories = Record<CategoryName, string[]>

interface ArticleData {
  title: string
  slug: string
  content: string
  excerpt: string
  videoUrl?: string
  videoType?: string
  categoryName: CategoryName
  images: ImageInfo[]
  isFeatured?: boolean
}

// Template interface for article creation
interface ArticleTemplate {
  title: string
  content: string
  excerpt: string
  videoUrl?: string
  categoryName: CategoryName
  isFeatured?: boolean
}

async function getImageInfo(filePath: string): Promise<ImageInfo | null> {
  try {
    const stats = await fs.stat(filePath)
    const filename = path.basename(filePath)
    
    // Determine if it's high resolution based on filename patterns
    const isHighRes = filename.includes('1024x') || 
                     filename.includes('1920x') || 
                     filename.includes('_large') ||
                     !filename.includes('150x150') &&
                     !filename.includes('300x') &&
                     !filename.includes('thumb')
    
    // Extract resolution from filename if available
    const resolutionMatch = filename.match(/(\d+)x(\d+)/)
    const resolution = resolutionMatch ? `${resolutionMatch[1]}x${resolutionMatch[2]}` : 'unknown'
    
    return {
      filename,
      path: filePath,
      size: stats.size,
      resolution,
      isHighRes
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.log(`⚠️ Failed to get image info for ${filePath}: ${errorInfo.message}`)
    return null
  }
}

async function analyzeImages(): Promise<ImageInfo[]> {
  console.log('📸 Analyzing images in pictures folder...')
  
  const picturesDir = path.join(process.cwd(), 'pictures')
  const images: ImageInfo[] = []
  
  try {
    const files = await fs.readdir(picturesDir)
    
    for (const file of files) {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
        const filePath = path.join(picturesDir, file)
        const imageInfo = await getImageInfo(filePath)
        if (imageInfo) {
          images.push(imageInfo)
        }
      }
    }
    
    // Sort by high resolution first, then by size
    images.sort((a, b) => {
      if (a.isHighRes && !b.isHighRes) return -1
      if (!a.isHighRes && b.isHighRes) return 1
      return b.size - a.size
    })
    
    console.log(`✅ Found ${images.length} images (${images.filter(i => i.isHighRes).length} high-res)`)
    return images
    
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.log(`⚠️ Pictures folder not found: ${errorInfo.message}`)
    return []
  }
}

async function uploadImageToBlob(imageInfo: ImageInfo): Promise<string | null> {
  try {
    const fileBuffer = await fs.readFile(imageInfo.path)
    const fileExtension = path.extname(imageInfo.filename)
    const uniqueFilename = `imported-hq/${uuidv4()}${fileExtension}`
    
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(uniqueFilename, fileBuffer, {
        access: 'public',
      })
      return blob.url
    } else {
      // Fallback to local storage for development
      const publicPath = path.join(process.cwd(), 'public', 'uploads', 'imported-hq')
      await fs.mkdir(publicPath, { recursive: true })
      const localFilename = `${uuidv4()}${fileExtension}`
      const localPath = path.join(publicPath, localFilename)
      await fs.copyFile(imageInfo.path, localPath)
      return `/uploads/imported-hq/${localFilename}`
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error(`Failed to upload ${imageInfo.filename}:`, errorInfo.message)
    return null
  }
}

function createArticlesData(images: ImageInfo[]): ArticleData[] {
  // Group images by theme/category based on filename patterns
  const articles: ArticleData[] = []
  
  // Define categories and their keywords with proper typing
  const categories: Categories = {
    'Poljoprivreda i Stočarstvo': ['ovan', 'ovca', 'krava', 'traktor', 'polje', 'žito', 'kukuruz', 'farma', 'stoka'],
    'Tradicija i Zanati': ['majstor', 'zanat', 'tradicionalno', 'staro', 'drveni', 'ručni', 'nasljeđe'],
    'Ljudi i Priče': ['čovjek', 'žena', 'deda', 'baka', 'portret', 'lice', 'ljudi'],
    'Priroda i Pejzaž': ['planina', 'rijeka', 'šuma', 'pejzaž', 'priroda', 'nebo', 'drvo'],
    'Kulinarska Tradicija': ['hrana', 'jelo', 'kuhinja', 'tradicionalno', 'domaće'],
    'Tehnologija i Inovacije': ['mašina', 'tehnologija', 'moderno', 'inovacija'],
    'Događaji i Festivali': ['festival', 'događaj', 'proslava', 'sajam', 'okupljanje']
  }
  
  // Sample articles with real content
  const articleTemplates: ArticleTemplate[] = [
    {
      title: 'Tradicionalno uzgajanje ovaca na bosanskim planinama',
      content: `Uzgajanje ovaca predstavlja jednu od najstarijih poljoprivrednih djelatnosti u Bosni i Hercegovini. Na planinama centralne Bosne, pastiri čuvaju tradiciju staru nekoliko stoljeća.

Ovčarstvo u BiH karakterizira:
• Tradicionalni načini čuvanja stada
• Sezonsko prebacivanje na planinske pašnjake
• Proizvodnja kvalitetnog ovčjeg sira i mlijeka
• Očuvanje autohtonih pasmina ovaca

Planinski pašnjaci pružaju idealnu hranu za ovce, što rezultuje visokokvalitetnim proizvodima. Ovčji sir s bosanskih planina poznat je po svojem autentičnom ukusu i nutritivnim vrijednostima.

Mladi pastiri nastavljaju tradiciju svojih predaka, kombinirajući stare tehnike s modernim pristupima u uzgoju. Ova djelatnost ne samo da čuva tradiciju, već predstavlja i važan ekonomski faktor za ruralne zajednice.`,
      excerpt: 'Tradicija ovčarstva na bosanskim planinama opstaje kroz generacije',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      categoryName: 'Poljoprivreda i Stočarstvo',
      isFeatured: true
    },
    {
      title: 'Majstori tradicionalnih zanata čuvaju bosansko nasljeđe',
      content: `U malim radionicama širom Bosne i Hercegovine, majstori tradicionalnih zanata nastavljaju čuvati vještine koje se prenose s koljena na koljeno.

Tradicionalni zanati koji se još uvijek prakticiraju:
• Izrada drvenih predmeta i namještaja
• Tkanje tradicionalnih ćilima i pokrivača
• Kovačka vještina i izrada alata
• Lončarstvo i keramika
• Izrada tradicionalne obuće - opanaka

Ovi majstori ne samo da čuvaju stare tehnike, već ih prilagođavaju modernim potrebama. Njihovi proizvodi postaju sve traženiji, kako u zemlji tako i u inozemstvu.

"Svaki predmet koji napravim nosi dio moje duše i tradicije mojih predaka", kaže jedan od majstora.

Mlađe generacije pokazuju sve veći interes za učenje ovih zanata, što daje nadu da će tradicija opstati i u budućnosti.`,
      excerpt: 'Majstori tradicionalnih zanata čuvaju bosansko kulturno nasljeđe',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      categoryName: 'Tradicija i Zanati'
    },
    {
      title: 'Priče o ljudima koji mijenjaju svoju zajednicu',
      content: `Kroz Bosnu i Hercegovinu, obični ljudi čine izvanredne stvari za svoje zajednice. Njihove priče inspiriraju i pokazuju da jedna osoba može napraviti veliku razliku.

Primjeri pozitivnih promjena:
• Pokretanje lokalnih inicijativa za čišću životnu sredinu
• Organiziranje humanitarnih akcija za potrebite
• Obnavljanje kulturnih spomenika vlastitim sredstvima
• Pokretanje malih biznisa koji zapošljavaju lokalno stanovništvo
• Čuvanje i promocija lokalne tradicije

Ove priče pokazuju da uspjeh nije samo u velikim gestovima, već u svakodnevnim djelima koja čine zajednicu boljim mjestom za život.

"Počeo sam s malom idejom, a danas imamo projekt koji pomaže cijelom selu", priča jedan od lokalnih aktivista.

Ovakvi primjeri motiviraju druge da se uključe u pozitivne promjene u svojim zajednicama.`,
      excerpt: 'Inspirativne priče o ljudima koji mijenjaju svoje zajednice',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      categoryName: 'Ljudi i Priče'
    },
    {
      title: 'Netaknuta priroda bosanskih planina',
      content: `Bosanske planine kriju neke od najljepših prirodnih ljepota Europe. Od gustih šuma do kristalno čistih rijeka, ova priroda pruža utočište za brojne biljne i životinjske vrste.

Prirodne ljepote BiH:
• Nacionalni parkovi s bogatom florom i faunom
• Planinski vrhovi s spektakularnim pogledima
• Čiste planinske rijeke i jezera
• Stare šume s autohtonim vrstama drveća
• Tradicionalni planinski putevi i staze

Ova priroda nije samo lijepa za gledanje - ona je dom mnogim ugroženim vrstama i predstavlja važan ekosistem za cijelu regiju.

Lokalne zajednice sve više prepoznaju vrijednost očuvanja prirode, kako za buduće generacije tako i za razvoj održivog turizma.

Planinski turizam postaje sve popularniji, omogućavajući posjetiteljima da dožive autentičnu bosansku prirodu.`,
      excerpt: 'Otkrijte netaknutu ljepotu bosanskih planina i njihovu prirodu',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      categoryName: 'Priroda i Pejzaž'
    },
    {
      title: 'Tradicionalna bosanska kuhinja kroz generacije',
      content: `Bosanska kuhinja predstavlja spoj različitih kulinarskih tradicija koje su se stoljećima razvijale na ovim prostorima. Tradicionalni recepti čuvaju se i prenose kroz generacije.

Karakteristike bosanske kuhinje:
• Spoj orijentalnih i mediteranskih utjecaja
• Korištenje lokalnih, sezonskih sastojaka
• Tradicionalni načini pripreme i čuvanja hrane
• Jela koja okupljaju porodicu i prijatelje
• Recepti koji se prenose usmeno kroz generacije

Najpoznatija jela kao što su ćevapi, burek, bosanski lonac i baklava postala su prepoznatljiva daleko izvan granica BiH.

"Svaki obrok je prilika da se okupimo i podijelimo priče", kaže jedna od čuvarica tradicionalnih recepata.

Mlađe generacije sve više pokazuju interes za učenje tradicionalne kuhinje, što osigurava opstanak ove bogate kulinarske tradicije.`,
      excerpt: 'Tradicija bosanske kuhinje čuva se kroz generacije',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      categoryName: 'Kulinarska Tradicija'
    }
  ]
  
  // Assign images to articles based on filename matching
  const usedImages = new Set<string>()
  
  for (const template of articleTemplates) {
    const categoryKeywords = categories[template.categoryName] || []
    const matchingImages: ImageInfo[] = []
    
    // Find images that match category keywords
    for (const image of images) {
      if (usedImages.has(image.filename)) continue
      
      const filename = image.filename.toLowerCase()
      const matches = categoryKeywords.some(keyword => 
        filename.includes(keyword.toLowerCase())
      )
      
      if (matches && matchingImages.length < 4) {
        matchingImages.push(image)
        usedImages.add(image.filename)
      }
    }
    
    // If no specific matches, add some high-res images
    if (matchingImages.length === 0) {
      const availableHighRes = images.filter(img => 
        img.isHighRes && !usedImages.has(img.filename)
      ).slice(0, 2)
      
      availableHighRes.forEach(img => {
        matchingImages.push(img)
        usedImages.add(img.filename)
      })
    }
    
    articles.push({
      ...template,
      slug: template.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100),
      images: matchingImages
    })
  }
  
  return articles
}

async function importCompleteContent() {
  try {
    console.log('🚀 Starting complete content import for PostgreSQL...')
    
    // Step 1: Setup admin user
    console.log('👤 Setting up admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    await prisma.admin.upsert({
      where: { email: 'admin@flash.ba' },
      update: {},
      create: {
        email: 'admin@flash.ba',
        password: hashedPassword,
        name: 'Flash.ba Admin'
      }
    })
    console.log('✅ Admin user ready')

    // Step 2: Create categories
    console.log('📂 Creating categories...')
    const categoryNames = [
      'Poljoprivreda i Stočarstvo',
      'Tradicija i Zanati', 
      'Ljudi i Priče',
      'Priroda i Pejzaž',
      'Kulinarska Tradicija',
      'Tehnologija i Inovacije',
      'Događaji i Festivali'
    ]
    
    const categoryMap = new Map<string, number>()
    
    for (const name of categoryNames) {
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
      
      const category = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          description: `Članci o ${name.toLowerCase()}`
        }
      })
      
      categoryMap.set(name, category.id)
      console.log(`✅ Category: ${name}`)
    }

    // Step 3: Analyze and prepare images
    const images = await analyzeImages()
    
    // Step 4: Create articles with matched images
    const articlesData = createArticlesData(images)
    console.log(`📄 Prepared ${articlesData.length} articles`)
    
    // Step 5: Import articles with images
    for (const articleData of articlesData) {
      console.log(`\n📝 Processing: ${articleData.title}`)
      
      // Create article
      const article = await prisma.article.create({
        data: {
          title: articleData.title,
          slug: articleData.slug,
          content: articleData.content,
          excerpt: articleData.excerpt,
          videoUrl: articleData.videoUrl,
          videoType: articleData.videoType || 'youtube',
          categoryId: categoryMap.get(articleData.categoryName)!,
          isPublished: true,
          isFeatured: articleData.isFeatured || false
        }
      })
      
      // Upload and associate images
      let uploadedCount = 0
      for (let i = 0; i < articleData.images.length; i++) {
        const imageInfo = articleData.images[i]
        console.log(`  📸 Uploading: ${imageInfo.filename} (${imageInfo.resolution})`)
        
        const imageUrl = await uploadImageToBlob(imageInfo)
        if (imageUrl) {
          const media = await prisma.media.create({
            data: {
              filename: `imported-${uuidv4()}${path.extname(imageInfo.filename)}`,
              originalName: imageInfo.filename,
              url: imageUrl,
              type: 'image',
              mimeType: `image/${path.extname(imageInfo.filename).substring(1)}`,
              size: imageInfo.size
            }
          })
          
          await prisma.articleMedia.create({
            data: {
              articleId: article.id,
              mediaId: media.id,
              order: i
            }
          })
          
          uploadedCount++
        }
      }
      
      console.log(`✅ Article created with ${uploadedCount} high-res images`)
    }

    // Step 6: Create site settings
    console.log('\n⚙️ Setting up site configuration...')
    const siteSettings = [
      { key: 'site_name', value: 'Flash.ba - Video Priče' },
      { key: 'site_description', value: 'Autentične video priče iz Bosne i Hercegovine' },
      { key: 'contact_email', value: 'contact@flash.ba' },
      { key: 'about_content', value: 'Flash.ba donosi autentične priče iz Bosne i Hercegovine kroz video sadržaje i fotografije visoke rezolucije.' }
    ]

    for (const setting of siteSettings) {
      await prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      })
    }

    // Final summary
    const finalStats = {
      articles: await prisma.article.count(),
      categories: await prisma.category.count(),
      media: await prisma.media.count(),
      articleMedia: await prisma.articleMedia.count()
    }

    console.log('\n🎉 Import completed successfully!')
    console.log('\n📊 Final Statistics:')
    console.log(`📄 Articles: ${finalStats.articles}`)
    console.log(`📂 Categories: ${finalStats.categories}`)
    console.log(`🖼️ Media files: ${finalStats.media}`)
    console.log(`🔗 Article-Media relations: ${finalStats.articleMedia}`)
    
    console.log('\n🔑 Login credentials:')
    console.log('📧 Email: admin@flash.ba')
    console.log('🔒 Password: admin123')
    
    console.log('\n🌐 Ready for Vercel deployment!')

  } catch (error) {
    const errorInfo = getErrorInfo(error)
    console.error('❌ Import failed:', errorInfo.message)
    if (errorInfo.stack) {
      console.error('Stack trace:', errorInfo.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importCompleteContent()
