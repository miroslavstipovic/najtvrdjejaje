import imageCompression from 'browser-image-compression'

/**
 * Image compression settings
 */
export const IMAGE_SETTINGS = {
  // Logo settings
  logo: {
    maxSizeMB: 0.5,          // Max 500KB
    maxWidthOrHeight: 600,   // Max 600px width/height
    quality: 0.85,           // 85% quality
  },
  // Favicon settings
  favicon: {
    maxSizeMB: 0.1,          // Max 100KB
    maxWidthOrHeight: 128,   // Max 128px
    quality: 0.9,            // 90% quality
  },
  // Article/Content images
  content: {
    maxSizeMB: 1,            // Max 1MB
    maxWidthOrHeight: 1920,  // Max 1920px (Full HD)
    quality: 0.85,           // 85% quality
  },
  // Thumbnail images
  thumbnail: {
    maxSizeMB: 0.3,          // Max 300KB
    maxWidthOrHeight: 400,   // Max 400px
    quality: 0.8,            // 80% quality
  },
  // Profile/Avatar images
  avatar: {
    maxSizeMB: 0.3,          // Max 300KB
    maxWidthOrHeight: 400,   // Max 400px
    quality: 0.85,           // 85% quality
  },
  // Cover images
  cover: {
    maxSizeMB: 0.8,          // Max 800KB
    maxWidthOrHeight: 1200,  // Max 1200px
    quality: 0.85,           // 85% quality
  },
}

export type ImageType = keyof typeof IMAGE_SETTINGS

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param type - Type of image (logo, favicon, content, thumbnail, avatar, cover)
 * @returns Compressed image file
 */
export const compressImage = async (
  file: File,
  type: ImageType = 'content'
): Promise<File> => {
  const settings = IMAGE_SETTINGS[type]
  
  try {
    // Skip compression if file is already small enough
    if (file.size <= settings.maxSizeMB * 1024 * 1024) {
      console.log(`✅ Image already optimized (${(file.size / 1024).toFixed(1)}KB)`)
      return file
    }

    const options = {
      maxSizeMB: settings.maxSizeMB,
      maxWidthOrHeight: settings.maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      initialQuality: settings.quality,
    }

    console.log(`🗜️ Compressing ${type} image: ${(file.size / 1024).toFixed(1)}KB → max ${settings.maxSizeMB * 1024}KB`)
    
    const compressedFile = await imageCompression(file, options)
    
    console.log(`✅ Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`)
    
    return compressedFile
  } catch (error) {
    console.error('❌ Image compression error:', error)
    // Return original file if compression fails
    return file
  }
}

/**
 * Compress an image and create a preview URL
 * @param file - The image file to compress
 * @param type - Type of image
 * @returns Compressed file and preview URL
 */
export const compressImageWithPreview = async (
  file: File,
  type: ImageType = 'content'
): Promise<{ compressedFile: File; previewUrl: string }> => {
  const compressedFile = await compressImage(file, type)
  const previewUrl = URL.createObjectURL(compressedFile)
  
  return {
    compressedFile,
    previewUrl,
  }
}

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns Human readable size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Check if file is an image
 * @param file - File to check
 * @returns True if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * Get image dimensions
 * @param file - Image file
 * @returns Promise with width and height
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
