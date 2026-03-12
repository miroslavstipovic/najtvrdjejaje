import { PrismaClient } from '../src/generated/prisma'
import { put } from '@vercel/blob'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { getErrorInfo } from './utils/error-handler'

const prisma = new PrismaClient()

interface WordPressPost {
  ID: number
  post_title: string
  post_name: string
  post_content: string
  post_excerpt: string
  post_date: string
  post_modified: string
  post_status: string
  categories?: string
}

interface WordPressCategory {
  term_id: number
  name: string
  slug: string
  description: string
}

async function importWordPressToPostgres() {
  try {
    console.log('🚀 Starting WordPress to PostgreSQL import...')
    
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

    // Step 2: Import categories from WordPress backup
    console.log('📂 Importing categories...')
    
    // Mock WordPress categories (you can replace this with actual data extraction)
    const wpCategories: WordPressCategory[] = [
      { term_id: 1, name: 'Priče iz BiH', slug: 'price-iz-bih', description: 'Lokalne priče iz Bosne i Hercegovine' },
      { term_id: 2, name: 'Poljoprivreda', slug: 'poljoprivreda', description: 'Poljoprivredne priče i savjeti' },
      { term_id: 3, name: 'Tradicija', slug: 'tradicija', description: 'Tradicionalni zanati i običaji' },
      { term_id: 4, name: 'Ljudi', slug: 'ljudi', description: 'Priče o ljudima' },
      { term_id: 5, name: 'Priroda', slug: 'priroda', description: 'Priroda i životinje' },
      { term_id: 6, name: 'Tehnologija', slug: 'tehnologija', description: 'Tehnološke inovacije' }
    ]

    const categoryMap = new Map<number, number>()
    
    for (const wpCat of wpCategories) {
      const category = await prisma.category.upsert({
        where: { slug: wpCat.slug },
        update: {},
        create: {
          name: wpCat.name,
          slug: wpCat.slug,
          description: wpCat.description
        }
      })
      categoryMap.set(wpCat.term_id, category.id)
      console.log(`✅ Category: ${wpCat.name}`)
    }

    // Step 3: Import pictures from source folder
    console.log('🖼️ Importing pictures from source folder...')
    
    const picturesDir = path.join(process.cwd(), 'pictures')
    let uploadedMedia: any[] = []
    
    try {
      const files = await fs.readdir(picturesDir)
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
      ).slice(0, 50) // Limit to first 50 images for initial import
      
      console.log(`📸 Found ${imageFiles.length} images to import`)
      
      for (const file of imageFiles) {
        try {
          const filePath = path.join(picturesDir, file)
          const fileBuffer = await fs.readFile(filePath)
          const stats = await fs.stat(filePath)
          
          // Generate unique filename for Vercel Blob
          const fileExtension = path.extname(file)
          const uniqueFilename = `imported/${uuidv4()}${fileExtension}`
          
          let fileUrl: string
          
          // Try to upload to Vercel Blob, fallback to local
          try {
            if (process.env.BLOB_READ_WRITE_TOKEN) {
              const blob = await put(uniqueFilename, fileBuffer, {
                access: 'public',
              })
              fileUrl = blob.url
              console.log(`📤 Uploaded to Vercel Blob: ${file}`)
            } else {
              // Fallback: copy to public directory
              const publicPath = path.join(process.cwd(), 'public', 'uploads', 'imported')
              await fs.mkdir(publicPath, { recursive: true })
              const localPath = path.join(publicPath, `${uuidv4()}${fileExtension}`)
              await fs.copyFile(filePath, localPath)
              fileUrl = `/uploads/imported/${path.basename(localPath)}`
              console.log(`💾 Saved locally: ${file}`)
            }
          } catch (uploadError) {
            console.log(`⚠️ Upload failed for ${file}, skipping...`)
            continue
          }
          
          // Save to database
          const media = await prisma.media.create({
            data: {
              filename: uniqueFilename,
              originalName: file,
              url: fileUrl,
              type: 'image',
              mimeType: `image/${fileExtension.substring(1)}`,
              size: stats.size
            }
          })
          
          uploadedMedia.push(media)
          
        } catch (error) {
          const errorInfo = getErrorInfo(error)
          console.log(`⚠️ Error processing ${file}:`, errorInfo.message)
        }
      }
      
      console.log(`✅ Imported ${uploadedMedia.length} images`)
      
    } catch (error) {
      console.log('⚠️ Pictures folder not found or empty, continuing without images...')
    }

    // Step 4: Create sample articles with YouTube videos
    console.log('📄 Creating sample articles with YouTube videos...')
    
    const sampleArticles = [
      {
        title: 'Zašto je za jednu noć "Đurđevdanski dernek u Turbetu" na YouTube pogledalo 70 tisuća ljudi',
        slug: 'djurdjevdanski-dernek-turbet-youtube',
        content: `Đurđevdanski dernek u Turbetu postao je pravi hit na YouTube platformi, privukavši pažnju desetaka tisuća gledalaca iz cijelog svijeta.

Ovaj tradicionalni događaj, koji se održava svake godine u malom selu Turbet, ove godine je zabilježio rekordnu gledanost na internetu. Video snimka derneka, koja prikazuje autentične bosanske tradicije, muziku i ples, postala je viralna preko noći.

Što čini ovaj dernek tako posebnim?

• Autentična bosanska muzika i ples
• Tradicionalna hrana i piće
• Gostoprimstvo lokalnog stanovništva
• Prekrasna priroda oko Turbeta
• Atmosfera koja spaja generacije

Lokalni organizatori su iznenađeni ovim uspjehom na društvenim mrežama. "Nikad nismo očekivali da će naš mali dernek privući toliku pažnju", kaže jedan od organizatora.

Video je podijeljen tisuće puta na različitim platformama, a komentari gledalaca iz cijelog svijeta svjedoče o tome koliko je bosanska tradicija cijenjena i voljena.`,
        excerpt: 'Tradicionalni Đurđevdanski dernek u Turbetu postao je internet senzacija',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoType: 'youtube',
        categoryId: 1,
        isFeatured: true
      },
      {
        title: 'Švicarski otpad Lucius iz Viteza pretvara u novac',
        slug: 'svicarski-otpad-lucius-vitez',
        content: `Lucius iz Viteza pronašao je inovativan način kako švicarski otpad pretvoriti u profitabilan biznis, pokazujući da se recikliranje može isplatiti.

Njegova priča počinje kada je radio u Švicarskoj i primijetio koliko se kvalitetnih materijala baca u otpad. Odlučio je pokrenuti biznis koji će te materijale dovesti u BiH i dati im novi život.

Kako funkcionira ovaj biznis?

• Sakupljanje kvalitetnog otpada u Švicarskoj
• Transport u Bosnu i Hercegovinu
• Sortiranje i priprema materijala
• Prodaja lokalnim proizvođačima
• Stvaranje radnih mjesta

"Ono što Švicarci bacaju, nama može biti zlato vrijedno", objašnjava Lucius svoj pristup.

Ovaj projekt ne samo da donosi profit, već i pomaže životnoj sredini smanjenjem otpada i omogućava pristupačne sirovine lokalnim proizvođačima.`,
        excerpt: 'Inovativan pristup recikliranju koji spaja Švicarsku i BiH',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoType: 'youtube',
        categoryId: 2
      },
      {
        title: 'Bosanac iz Amerike pomaže zemljake u BiH',
        slug: 'bosanac-amerika-pomaze-zemljake',
        content: `Priča o Bosancu koji je u Americi ostvario američki san, ali nije zaboravio svoje korijene i aktivno pomaže zemljacima u Bosni i Hercegovini.

Nakon što je emigrirao u Ameriku devedesetih godina, ovaj uspješni biznismen nikada nije zaboravio odakle dolazi. Danas vodi uspješnu kompaniju, ali značajan dio svojih prihoda ulaže u humanitarne projekte u BiH.

Njegovi projekti uključuju:

• Obnovu škola u ruralnim područjima
• Stipendije za mlade talente
• Podršku poljoprivrednicima
• Medicinska oprema za bolnice
• Infrastrukturne projekte

"Amerika mi je dala priliku, ali BiH mi je dala identitet", kaže ovaj uspješni biznismen.

Kroz svoju fondaciju, do sada je pomogao stotinama porodica i realizovao brojne projekte koji mijenjaju živote ljudi u njegovom rodnom kraju.

Video prikazuje njegove najnovije projekte i svjedočanstva onih kojima je pomogao.`,
        excerpt: 'Uspješan biznismen iz Amerike ne zaboravlja svoje korijene',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoType: 'youtube',
        categoryId: 4
      }
    ]

    const createdArticles = []
    
    for (const articleData of sampleArticles) {
      // Clean content from any existing hardcoded images
      let cleanContent = articleData.content
      cleanContent = cleanContent.replace(/<img[^>]*>/gi, '')
      cleanContent = cleanContent.replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
      cleanContent = cleanContent.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, '')
      
      const article = await prisma.article.create({
        data: {
          title: articleData.title,
          slug: articleData.slug,
          content: cleanContent,
          excerpt: articleData.excerpt,
          videoUrl: articleData.videoUrl,
          videoType: articleData.videoType,
          categoryId: categoryMap.get(articleData.categoryId) || 1,
          isPublished: true,
          isFeatured: articleData.isFeatured || false
        }
      })
      
      // Assign some random images to articles
      if (uploadedMedia.length > 0) {
        const randomImages = uploadedMedia
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 4) + 1) // 1-4 images per article
        
        for (let i = 0; i < randomImages.length; i++) {
          await prisma.articleMedia.create({
            data: {
              articleId: article.id,
              mediaId: randomImages[i].id,
              order: i
            }
          })
        }
        
        console.log(`✅ Article "${article.title}" created with ${randomImages.length} images`)
      } else {
        console.log(`✅ Article "${article.title}" created`)
      }
      
      createdArticles.push(article)
    }

    // Step 5: Create site settings
    console.log('⚙️ Setting up site configuration...')
    
    const siteSettings = [
      { key: 'site_name', value: 'Flash.ba Video Portal' },
      { key: 'site_description', value: 'Vaša destinacija za video priče i vijesti' },
      { key: 'contact_email', value: 'contact@flash.ba' },
      { key: 'about_content', value: 'Flash.ba je portal posvećen pričama iz Bosne i Hercegovine. Kroz video sadržaje prikazujemo autentične priče o ljudima, tradiciji, prirodi i svakodnevnom životu.' }
    ]

    for (const setting of siteSettings) {
      await prisma.siteSettings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      })
    }

    console.log('🎉 Import completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`👤 Admin users: 1`)
    console.log(`📂 Categories: ${wpCategories.length}`)
    console.log(`📄 Articles: ${createdArticles.length}`)
    console.log(`🖼️ Media files: ${uploadedMedia.length}`)
    console.log(`⚙️ Site settings: ${siteSettings.length}`)
    
    console.log('\n🔑 Login credentials:')
    console.log('📧 Email: admin@flash.ba')
    console.log('🔒 Password: admin123')
    
    console.log('\n🌐 Next steps:')
    console.log('1. Deploy to Vercel via GitHub')
    console.log('2. Configure environment variables on Vercel')
    console.log('3. Set up Vercel Blob storage')
    console.log('4. Test the production deployment')

  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importWordPressToPostgres()
