import { PrismaClient } from '../src/generated/prisma'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface PictureGroup {
  baseName: string
  files: Array<{
    filename: string
    path: string
    width?: number
    height?: number
    size: number
    isOriginal: boolean
  }>
}

interface ArticleMatch {
  articleId: number
  title: string
  currentImage?: string
  suggestedImages: Array<{
    filename: string
    confidence: number
    reason: string
  }>
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  } catch (error) {
    return 0
  }
}

function extractDimensions(filename: string): { width?: number, height?: number } {
  const match = filename.match(/-(\d+)x(\d+)/)
  if (match) {
    return {
      width: parseInt(match[1]),
      height: parseInt(match[2])
    }
  }
  return {}
}

function getBaseName(filename: string): string {
  // Remove size suffixes like -1024x576, -150x150, etc.
  let baseName = filename.replace(/-\d+x\d+/g, '')
  // Remove (1), (2) suffixes
  baseName = baseName.replace(/\s*\(\d+\)/g, '')
  // Remove file extension
  baseName = baseName.replace(/\.(jpg|jpeg|png|gif)$/i, '')
  return baseName
}

function calculateMatchConfidence(articleTitle: string, imageName: string): { confidence: number, reason: string } {
  const titleLower = articleTitle.toLowerCase()
  const imageNameLower = imageName.toLowerCase()
  
  // Direct name matching
  if (titleLower.includes(imageNameLower) || imageNameLower.includes(titleLower)) {
    return { confidence: 95, reason: 'Direct name match in title' }
  }
  
  // Name-based matching (check for personal names)
  const commonNames = ['brko', 'emin', 'ilija', 'jozo', 'marko', 'jackye', 'suljo', 'ramo', 'ivo', 'mustafa', 'asim', 'zdravko', 'dominko', 'nedo', 'vlado', 'blaženka']
  for (const name of commonNames) {
    if (titleLower.includes(name) && imageNameLower.includes(name)) {
      return { confidence: 90, reason: `Name match: ${name}` }
    }
  }
  
  // Topic-based matching
  const topicMatches = [
    { keywords: ['dernek', 'sajam', 'stoka', 'turbet'], images: ['der', 'dernek'] },
    { keywords: ['kuca', 'kuća', 'dom', 'građenja'], images: ['kuca'] },
    { keywords: ['krevet', 'spavanje', 'noć'], images: ['krevet'] },
    { keywords: ['bager', 'mašina', 'kopanje'], images: ['bager'] },
    { keywords: ['mago', 'mađioničar', 'magician'], images: ['mago'] },
    { keywords: ['kaktus', 'cvijeće', 'biljke'], images: ['kaktus'] },
    { keywords: ['oldtimer', 'automobil', 'auto'], images: ['auto', 'car'] }
  ]
  
  for (const topic of topicMatches) {
    const titleHasKeyword = topic.keywords.some(keyword => titleLower.includes(keyword))
    const imageMatchesTopic = topic.images.some(img => imageNameLower.includes(img))
    
    if (titleHasKeyword && imageMatchesTopic) {
      return { confidence: 85, reason: `Topic match: ${topic.keywords.find(k => titleLower.includes(k))}` }
    }
  }
  
  // Keyword matching
  const titleWords = titleLower.split(/\s+/)
  const imageWords = imageNameLower.replace(/[-_]/g, ' ').split(/\s+/)
  
  let matchingWords = 0
  let totalWords = Math.max(titleWords.length, imageWords.length)
  
  for (const titleWord of titleWords) {
    if (titleWord.length > 2) { // Lowered from 3 to catch more words
      for (const imageWord of imageWords) {
        if (imageWord.length > 2 && (
          titleWord.includes(imageWord) || 
          imageWord.includes(titleWord) ||
          levenshteinDistance(titleWord, imageWord) <= 1 // Stricter similarity
        )) {
          matchingWords++
          break
        }
      }
    }
  }
  
  const keywordConfidence = (matchingWords / totalWords) * 70
  
  // Special patterns for common names
  if (imageNameLower.includes('naslovna')) {
    return { confidence: Math.max(keywordConfidence, 40) + 15, reason: 'Contains "naslovna" (header image)' }
  }
  
  if (imageNameLower.match(/\d{2,3}/)) {
    return { confidence: Math.max(keywordConfidence, 30) + 10, reason: 'Contains article number' }
  }
  
  // Facial/portrait images often match person-related articles
  if (imageNameLower.includes('face') || imageNameLower.includes('portrait')) {
    return { confidence: Math.max(keywordConfidence, 35) + 5, reason: 'Portrait/face image' }
  }
  
  return { confidence: Math.max(keywordConfidence, 15), reason: 'Keyword similarity' }
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

async function groupPicturesByBaseName(): Promise<PictureGroup[]> {
  console.log('📁 Analyzing pictures directory...')
  
  const picturesDir = path.join(process.cwd(), 'pictures')
  const files = await fs.readdir(picturesDir)
  const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
  
  console.log(`📊 Found ${imageFiles.length} image files`)
  
  const groups: { [baseName: string]: PictureGroup } = {}
  
  for (const filename of imageFiles) {
    const filePath = path.join(picturesDir, filename)
    const baseName = getBaseName(filename)
    const dimensions = extractDimensions(filename)
    const size = await getFileSize(filePath)
    const isOriginal = !filename.match(/-\d+x\d+/) && !filename.match(/\(\d+\)/)
    
    if (!groups[baseName]) {
      groups[baseName] = {
        baseName,
        files: []
      }
    }
    
    groups[baseName].files.push({
      filename,
      path: filePath,
      width: dimensions.width,
      height: dimensions.height,
      size,
      isOriginal
    })
  }
  
  // Sort files by priority (original first, then by dimensions)
  Object.values(groups).forEach(group => {
    group.files.sort((a, b) => {
      if (a.isOriginal && !b.isOriginal) return -1
      if (!a.isOriginal && b.isOriginal) return 1
      
      const aPixels = (a.width || 0) * (a.height || 0)
      const bPixels = (b.width || 0) * (b.height || 0)
      
      return bPixels - aPixels // Higher resolution first
    })
  })
  
  return Object.values(groups)
}

async function matchPicturesToArticles(): Promise<ArticleMatch[]> {
  console.log('🔍 Matching pictures to articles...')
  
  const articles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      coverImage: true,
      content: true
    },
    orderBy: { id: 'asc' }
  })
  
  const pictureGroups = await groupPicturesByBaseName()
  console.log(`🖼️ Found ${pictureGroups.length} unique image groups`)
  
  const matches: ArticleMatch[] = []
  
  for (const article of articles) {
    const articleMatch: ArticleMatch = {
      articleId: article.id,
      title: article.title,
      currentImage: article.coverImage || undefined,
      suggestedImages: []
    }
    
    // Find best matches for this article
    for (const group of pictureGroups) {
      const { confidence, reason } = calculateMatchConfidence(article.title, group.baseName)
      
      if (confidence > 15) { // Only consider reasonable matches
        const bestFile = group.files[0] // Already sorted by priority
        articleMatch.suggestedImages.push({
          filename: bestFile.filename,
          confidence,
          reason
        })
      }
    }
    
    // Sort suggestions by confidence
    articleMatch.suggestedImages.sort((a, b) => b.confidence - a.confidence)
    articleMatch.suggestedImages = articleMatch.suggestedImages.slice(0, 3) // Keep top 3
    
    matches.push(articleMatch)
  }
  
  return matches
}

async function copyImageToPublic(sourcePath: string, filename: string): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'media')
  
  // Ensure directory exists
  await fs.mkdir(publicDir, { recursive: true })
  
  // Generate unique filename to avoid conflicts
  const ext = path.extname(filename)
  const nameWithoutExt = path.basename(filename, ext)
  const uniqueFilename = `${nameWithoutExt}-${Date.now()}${ext}`
  
  const destinationPath = path.join(publicDir, uniqueFilename)
  const publicUrl = `/uploads/media/${uniqueFilename}`
  
  await fs.copyFile(sourcePath, destinationPath)
  
  return publicUrl
}

async function createMediaRecord(filename: string, originalName: string, url: string, size: number): Promise<number> {
  const media = await prisma.media.create({
    data: {
      filename,
      originalName,
      url,
      type: 'image',
      mimeType: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
      size
    }
  })
  
  return media.id
}

async function importPictures() {
  console.log('🚀 Starting picture import process...')
  
  try {
    const matches = await matchPicturesToArticles()
    
    console.log('📊 Import Statistics:')
    const withCurrentImages = matches.filter(m => m.currentImage)
    const withoutImages = matches.filter(m => !m.currentImage)
    const withSuggestions = matches.filter(m => m.suggestedImages.length > 0)
    
    console.log(`  - Articles with current images: ${withCurrentImages.length}`)
    console.log(`  - Articles without images: ${withoutImages.length}`)
    console.log(`  - Articles with suggested matches: ${withSuggestions.length}`)
    console.log()
    
    // Show some high-confidence matches
    console.log('🎯 High-confidence matches (>70% confidence):')
    const highConfidenceMatches = matches.filter(m => 
      m.suggestedImages.length > 0 && m.suggestedImages[0].confidence > 70
    )
    
    // Also show medium confidence matches for analysis
    console.log('📊 Medium-confidence matches (40-70% confidence):')
    const mediumConfidenceMatches = matches.filter(m => 
      m.suggestedImages.length > 0 && 
      m.suggestedImages[0].confidence >= 40 && 
      m.suggestedImages[0].confidence <= 70
    )
    
    highConfidenceMatches.slice(0, 10).forEach(match => {
      const best = match.suggestedImages[0]
      console.log(`  ${match.articleId}: ${match.title.substring(0, 50)}...`)
      console.log(`    -> ${best.filename} (${best.confidence}% - ${best.reason})`)
    })
    
    if (highConfidenceMatches.length > 10) {
      console.log(`    ... and ${highConfidenceMatches.length - 10} more high-confidence matches`)
    }
    
    mediumConfidenceMatches.slice(0, 15).forEach(match => {
      const best = match.suggestedImages[0]
      console.log(`  ${match.articleId}: ${match.title.substring(0, 50)}...`)
      console.log(`    -> ${best.filename} (${best.confidence}% - ${best.reason})`)
    })
    
    if (mediumConfidenceMatches.length > 15) {
      console.log(`    ... and ${mediumConfidenceMatches.length - 15} more medium-confidence matches`)
    }
    
    // Show available image groups for manual inspection
    console.log()
    console.log('🖼️ Available image groups (first 20):')
    const pictureGroups = await groupPicturesByBaseName()
    pictureGroups.slice(0, 20).forEach(group => {
      const bestFile = group.files[0]
      console.log(`  ${group.baseName} -> ${bestFile.filename} (${bestFile.isOriginal ? 'original' : `${bestFile.width}x${bestFile.height}`})`)
    })
    
    if (pictureGroups.length > 20) {
      console.log(`    ... and ${pictureGroups.length - 20} more image groups`)
    }
    
    // Show some articles without matches for manual review
    console.log()
    console.log('❌ Sample articles without any suggested matches:')
    const noMatches = matches.filter(m => m.suggestedImages.length === 0)
    noMatches.slice(0, 10).forEach(match => {
      console.log(`  ${match.articleId}: ${match.title.substring(0, 60)}...`)
    })
    
    if (noMatches.length > 10) {
      console.log(`    ... and ${noMatches.length - 10} more articles without matches`)
    }
    
    // Ask for confirmation before proceeding with actual import
    console.log()
    console.log('🔄 This was a preview. To actually import the images, set CONFIRM_IMPORT=true')
    
    if (process.env.CONFIRM_IMPORT === 'true') {
      console.log('✅ CONFIRM_IMPORT=true detected. Starting actual import...')
      
      let imported = 0
      let updated = 0
      
      for (const match of highConfidenceMatches) {
        try {
          const best = match.suggestedImages[0]
          const sourcePath = path.join(process.cwd(), 'pictures', best.filename)
          
          // Copy image to public directory
          const publicUrl = await copyImageToPublic(sourcePath, best.filename)
          
          // Create media record
          const size = await getFileSize(sourcePath)
          const mediaId = await createMediaRecord(best.filename, best.filename, publicUrl, size)
          
          // Update article
          await prisma.article.update({
            where: { id: match.articleId },
            data: { coverImage: publicUrl }
          })
          
          // Create article-media relationship
          await prisma.articleMedia.create({
            data: {
              articleId: match.articleId,
              mediaId,
              order: 0
            }
          })
          
          if (match.currentImage) {
            updated++
            console.log(`✅ Updated article ${match.articleId}: ${publicUrl}`)
          } else {
            imported++
            console.log(`✅ Added image to article ${match.articleId}: ${publicUrl}`)
          }
          
        } catch (error) {
          console.error(`❌ Failed to import image for article ${match.articleId}:`, error)
        }
      }
      
      console.log()
      console.log('🎉 Import completed!')
      console.log(`  - New images added: ${imported}`)
      console.log(`  - Existing images updated: ${updated}`)
      
    } else {
      console.log('💡 To perform the actual import, run:')
      console.log('   CONFIRM_IMPORT=true pnpm run import:pictures')
    }
    
  } catch (error) {
    console.error('💥 Error during import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Export for potential reuse
export { importPictures, matchPicturesToArticles, groupPicturesByBaseName }

// Run the script if called directly
if (require.main === module) {
  importPictures()
    .then(() => {
      console.log('✅ Picture import script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Picture import script failed:', error)
      process.exit(1)
    })
}
