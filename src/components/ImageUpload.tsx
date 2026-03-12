'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  currentImage?: string
  label?: string
  maxSize?: number // in MB
  accept?: string
  targetSizeKB?: number // Target size for compression in KB
}

/**
 * Compress an image file to target size
 * @param file Original image file
 * @param targetSizeKB Target size in KB (default 500KB)
 * @returns Compressed file
 */
async function compressImage(file: File, targetSizeKB: number = 500): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Calculate dimensions to maintain aspect ratio
        let width = img.width
        let height = img.height
        const maxDimension = 1920 // Max dimension for large images
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Try different quality levels to reach target size
        let quality = 0.9
        let compressedBlob: Blob | null = null
        
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'))
                return
              }
              
              const sizeKB = blob.size / 1024
              
              // If we're at target size or quality is too low, use this version
              if (sizeKB <= targetSizeKB || q <= 0.5) {
                // Convert blob to file
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.\w+$/, '.jpg'), // Always save as JPG for better compression
                  { type: 'image/jpeg' }
                )
                resolve(compressedFile)
              } else {
                // Try lower quality
                tryCompress(q - 0.1)
              }
            },
            'image/jpeg',
            q
          )
        }
        
        tryCompress(quality)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
  })
}

export default function ImageUpload({ 
  onImageUpload, 
  currentImage, 
  label = 'Upload Image',
  maxSize = 5,
  accept = 'image/*',
  targetSizeKB = 500
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState('')
  const [compressionInfo, setCompressionInfo] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    setError('')
    setCompressionInfo('')
    setUploading(true)

    try {
      const originalSizeKB = file.size / 1024
      
      // Compress the image before uploading
      setCompressionInfo('Compressing image...')
      const compressedFile = await compressImage(file, targetSizeKB)
      const compressedSizeKB = compressedFile.size / 1024
      
      setCompressionInfo(`Compressed: ${originalSizeKB.toFixed(0)}KB → ${compressedSizeKB.toFixed(0)}KB`)
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile)
      setPreview(previewUrl)

      // Upload compressed file
      const formData = new FormData()
      formData.append('image', compressedFile)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onImageUpload(data.imageUrl)
        
        // Clean up preview URL
        URL.revokeObjectURL(previewUrl)
        setPreview(data.imageUrl)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Upload failed')
        setPreview(currentImage || null)
        setCompressionInfo('')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Upload failed. Please try again.')
      setPreview(currentImage || null)
      setCompressionInfo('')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreview(null)
    setError('')
    setCompressionInfo('')
    onImageUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {/* Preview Area */}
      {preview ? (
        <div className="relative">
          <div className="relative w-full max-w-md">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={openFileSelector}
              disabled={uploading}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Change Image'}
            </button>
            <p className="text-xs text-gray-500">
              Max {maxSize}MB • Auto-compressed to ~{targetSizeKB}KB • JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>
      ) : (
        /* Upload Area */
        <div 
          onClick={openFileSelector}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors
            ${uploading ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-primary-400 hover:bg-gray-50'}
          `}
        >
          <div className="flex flex-col items-center space-y-3">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, WebP up to {maxSize}MB (auto-compressed to ~{targetSizeKB}KB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="image-file-input"
        name="imageFile"
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Compression Info */}
      {compressionInfo && !error && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {compressionInfo}
        </div>
      )}

      {/* URL Input Alternative */}
      <div className="pt-4 border-t border-gray-200">
        <label htmlFor="image-url-input" className="block text-sm font-medium text-gray-700 mb-2">
          Or enter image URL:
        </label>
        <div className="flex gap-2">
          <input
            id="image-url-input"
            name="imageUrl"
            type="url"
            placeholder="https://example.com/image.jpg"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            onBlur={(e) => {
              if (e.target.value.trim()) {
                setPreview(e.target.value.trim())
                onImageUpload(e.target.value.trim())
                setError('')
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector('input[type="url"]') as HTMLInputElement
              if (input && input.value.trim()) {
                setPreview(input.value.trim())
                onImageUpload(input.value.trim())
                setError('')
              }
            }}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Use URL
          </button>
        </div>
      </div>
    </div>
  )
}
