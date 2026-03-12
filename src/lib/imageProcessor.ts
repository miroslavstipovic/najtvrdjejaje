/**
 * Server-side Image Processing Utility
 * 
 * Handles automatic resizing and compression using Sharp library
 * 
 * Compression settings:
 * - Images over 1MB: 80% quality
 * - Images under 1MB: 85% quality
 */

import sharp from 'sharp'

// Size threshold for compression (1MB in bytes)
const SIZE_THRESHOLD = 1024 * 1024

// Quality settings
const QUALITY_HIGH = 85
const QUALITY_COMPRESSED = 80

// Dimension settings
export const IMAGE_DIMENSIONS = {
  logo: { width: 600, height: 200 },
  favicon: { width: 128, height: 128 },
  content: { width: 1920, height: 1920 },
  thumbnail: { width: 400, height: 400 },
  avatar: { width: 400, height: 400 },
  cover: { width: 1200, height: 800 },
}

export type ImageProcessType = keyof typeof IMAGE_DIMENSIONS

/**
 * Determine quality based on original file size
 * @param originalSize - Original file size in bytes
 * @returns Quality percentage (80 or 85)
 */
const getQuality = (originalSize: number): number => {
  return originalSize > SIZE_THRESHOLD ? QUALITY_COMPRESSED : QUALITY_HIGH
}

/**
 * Process logo image
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @returns Processed image buffer
 */
export const processLogoImage = async (buffer: Buffer, originalSize: number): Promise<Buffer> => {
  const quality = getQuality(originalSize)
  const dimensions = IMAGE_DIMENSIONS.logo
  
  const processedImage = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ quality, progressive: true }) // Keep PNG for logos (supports transparency)
    .toBuffer()
  
  console.log(`🗜️ Logo processed: ${formatBytes(originalSize)} → ${formatBytes(processedImage.length)}`)
  
  return processedImage
}

/**
 * Process favicon image
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @returns Processed image buffer
 */
export const processFaviconImage = async (buffer: Buffer, originalSize: number): Promise<Buffer> => {
  const quality = 90 // Higher quality for small icons
  const dimensions = IMAGE_DIMENSIONS.favicon
  
  const processedImage = await sharp(buffer)
    .rotate()
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'cover',
      withoutEnlargement: false, // Allow upscaling for favicons
    })
    .png({ quality }) // PNG for favicons
    .toBuffer()
  
  console.log(`🗜️ Favicon processed: ${formatBytes(originalSize)} → ${formatBytes(processedImage.length)}`)
  
  return processedImage
}

/**
 * Process content/article image
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @returns Processed image buffer
 */
export const processContentImage = async (buffer: Buffer, originalSize: number): Promise<Buffer> => {
  const quality = getQuality(originalSize)
  const dimensions = IMAGE_DIMENSIONS.content
  
  const processedImage = await sharp(buffer)
    .rotate()
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true })
    .toBuffer()
  
  console.log(`🗜️ Content image processed: ${formatBytes(originalSize)} → ${formatBytes(processedImage.length)}`)
  
  return processedImage
}

/**
 * Process thumbnail image
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @returns Processed image buffer
 */
export const processThumbnailImage = async (buffer: Buffer, originalSize: number): Promise<Buffer> => {
  const quality = QUALITY_COMPRESSED
  const dimensions = IMAGE_DIMENSIONS.thumbnail
  
  const processedImage = await sharp(buffer)
    .rotate()
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'cover',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true })
    .toBuffer()
  
  console.log(`🗜️ Thumbnail processed: ${formatBytes(originalSize)} → ${formatBytes(processedImage.length)}`)
  
  return processedImage
}

/**
 * Process avatar/profile image
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @returns Processed image buffer
 */
export const processAvatarImage = async (buffer: Buffer, originalSize: number): Promise<Buffer> => {
  const quality = getQuality(originalSize)
  const dimensions = IMAGE_DIMENSIONS.avatar
  
  const processedImage = await sharp(buffer)
    .rotate()
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'cover',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true })
    .toBuffer()
  
  console.log(`🗜️ Avatar processed: ${formatBytes(originalSize)} → ${formatBytes(processedImage.length)}`)
  
  return processedImage
}

/**
 * Process cover image
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @returns Processed image buffer
 */
export const processCoverImage = async (buffer: Buffer, originalSize: number): Promise<Buffer> => {
  const quality = getQuality(originalSize)
  const dimensions = IMAGE_DIMENSIONS.cover
  
  const processedImage = await sharp(buffer)
    .rotate()
    .resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true })
    .toBuffer()
  
  console.log(`🗜️ Cover image processed: ${formatBytes(originalSize)} → ${formatBytes(processedImage.length)}`)
  
  return processedImage
}

/**
 * Generic image processor
 * @param buffer - Original image buffer
 * @param originalSize - Original file size in bytes
 * @param type - Type of image to process
 * @returns Processed image buffer
 */
export const processImage = async (
  buffer: Buffer,
  originalSize: number,
  type: ImageProcessType
): Promise<Buffer> => {
  switch (type) {
    case 'logo':
      return processLogoImage(buffer, originalSize)
    case 'favicon':
      return processFaviconImage(buffer, originalSize)
    case 'content':
      return processContentImage(buffer, originalSize)
    case 'thumbnail':
      return processThumbnailImage(buffer, originalSize)
    case 'avatar':
      return processAvatarImage(buffer, originalSize)
    case 'cover':
      return processCoverImage(buffer, originalSize)
    default:
      return processContentImage(buffer, originalSize)
  }
}

/**
 * Get image info/metadata
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export const getImageInfo = async (buffer: Buffer) => {
  const metadata = await sharp(buffer).metadata()
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    size: buffer.length,
  }
}

/**
 * Format bytes to human readable string
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export { SIZE_THRESHOLD, QUALITY_HIGH, QUALITY_COMPRESSED }
