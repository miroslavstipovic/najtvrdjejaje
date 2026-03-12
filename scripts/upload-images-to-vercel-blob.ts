import { put } from '@vercel/blob'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })
config({ path: '.env' })

interface ImageUploadResult {
  originalPath: string
  blobUrl: string
  filename: string
  size: number
  success: boolean
  error?: string
}

async function uploadImagesToVercelBlob(): Promise<ImageUploadResult[]> {
  console.log('🚀 Starting image upload to Vercel Blob...')
  
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required')
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'media')
  const results: ImageUploadResult[] = []
  
  try {
    // Check if uploads directory exists
    await fs.access(uploadsDir)
    console.log(`📁 Found uploads directory: ${uploadsDir}`)
  } catch (error) {
    console.error('❌ Uploads directory not found:', uploadsDir)
    throw error
  }

  try {
    // Get all image files
    const files = await fs.readdir(uploadsDir)
    const imageFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )
    
    console.log(`📷 Found ${imageFiles.length} image files to upload`)

    let uploaded = 0
    let failed = 0

    for (const filename of imageFiles) {
      const localPath = path.join(uploadsDir, filename)
      
      try {
        console.log(`⬆️  Uploading ${filename}...`)
        
        // Read file
        const fileBuffer = await fs.readFile(localPath)
        const fileExtension = path.extname(filename)
        const uniqueFilename = `media/${uuidv4()}${fileExtension}`
        
        // Upload to Vercel Blob
        const blob = await put(uniqueFilename, fileBuffer, {
          access: 'public',
        })
        
        const stats = await fs.stat(localPath)
        
        results.push({
          originalPath: `/uploads/media/${filename}`,
          blobUrl: blob.url,
          filename: uniqueFilename,
          size: stats.size,
          success: true
        })
        
        uploaded++
        console.log(`✅ Uploaded: ${filename} -> ${blob.url}`)
        
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error)
        
        results.push({
          originalPath: `/uploads/media/${filename}`,
          blobUrl: '',
          filename,
          size: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        failed++
      }
    }

    console.log(`\n🎉 Upload completed!`)
    console.log(`  ✅ Successfully uploaded: ${uploaded}`)
    console.log(`  ❌ Failed uploads: ${failed}`)
    console.log(`  📊 Total processed: ${imageFiles.length}`)

    // Save mapping file for import
    const mappingPath = path.join(process.cwd(), 'image-url-mapping.json')
    const mapping: Record<string, string> = {}
    
    results.forEach(result => {
      if (result.success) {
        mapping[result.originalPath] = result.blobUrl
      }
    })
    
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2))
    console.log(`\n💾 URL mapping saved to: ${mappingPath}`)
    console.log(`🔗 Mapped ${Object.keys(mapping).length} image URLs`)

    return results

  } catch (error) {
    console.error('❌ Upload process failed:', error)
    throw error
  }
}

if (require.main === module) {
  uploadImagesToVercelBlob()
    .then((results) => {
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      console.log('\n✅ Image upload script completed')
      console.log(`📊 Final results: ${successful} successful, ${failed} failed`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Image upload script failed:', error)
      process.exit(1)
    })
}

export { uploadImagesToVercelBlob }
