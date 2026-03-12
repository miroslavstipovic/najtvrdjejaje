'use client'

import { useState, useEffect } from 'react'

/**
 * Compress an image file before upload
 */
async function compressImage(file: File, targetSizeKB: number = 800): Promise<File> {
  // Skip compression for GIFs (they lose animation)
  if (file.type === 'image/gif') {
    return file
  }

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
          resolve(file) // Return original if can't compress
          return
        }
        
        // Calculate dimensions (max 2048px)
        let width = img.width
        let height = img.height
        const maxDimension = 2048
        
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
        ctx.drawImage(img, 0, 0, width, height)
        
        // Try different quality levels
        let quality = 0.85
        
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file)
                return
              }
              
              const sizeKB = blob.size / 1024
              
              if (sizeKB <= targetSizeKB || q <= 0.5) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.\w+$/, '.jpg'),
                  { type: 'image/jpeg' }
                )
                console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${sizeKB.toFixed(0)}KB`)
                resolve(compressedFile)
              } else {
                tryCompress(q - 0.1)
              }
            },
            'image/jpeg',
            q
          )
        }
        
        tryCompress(quality)
      }
      
      img.onerror = () => resolve(file)
    }
    
    reader.onerror = () => resolve(file)
  })
}

interface Media {
  id: number
  filename: string
  originalName: string
  url: string
  type: string
  mimeType: string
  size: number
  createdAt: string
  _count: {
    articles: number
  }
}

interface MediaLibraryProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: Media[]) => void
  multiple?: boolean
  selectedMedia?: Media[]
}

export default function MediaLibrary({ 
  isOpen, 
  onClose, 
  onSelect, 
  multiple = false,
  selectedMedia = []
}: MediaLibraryProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Media[]>(selectedMedia)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen, page])

  useEffect(() => {
    setSelectedItems(selectedMedia)
  }, [selectedMedia])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/media?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMedia(data.media)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const token = localStorage.getItem('adminToken')

    try {
      for (const file of Array.from(files)) {
        // Compress image before upload
        let fileToUpload = file
        if (file.type.startsWith('image/')) {
          try {
            fileToUpload = await compressImage(file, 800)
          } catch (err) {
            console.warn('Compression failed, uploading original:', err)
          }
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)

        const response = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          alert(`Failed to upload ${file.name}: ${error.message}`)
        }
      }

      // Refresh media list
      fetchMedia()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const toggleSelection = (mediaItem: Media) => {
    if (multiple) {
      const isSelected = selectedItems.some(item => item.id === mediaItem.id)
      if (isSelected) {
        setSelectedItems(selectedItems.filter(item => item.id !== mediaItem.id))
      } else {
        setSelectedItems([...selectedItems, mediaItem])
      }
    } else {
      setSelectedItems([mediaItem])
    }
  }

  const handleSelect = () => {
    onSelect(selectedItems)
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Biblioteka medija</h2>
          <div className="flex items-center space-x-4">
            <label className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md cursor-pointer">
              {uploading ? 'Prenošenje...' : 'Prenesi fajlove'}
              <input
                id="media-library-upload"
                name="mediaFiles"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Media Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                {media.map((mediaItem) => {
                  const isSelected = selectedItems.some(item => item.id === mediaItem.id)
                  return (
                    <div
                      key={mediaItem.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected 
                          ? 'border-primary-500 ring-2 ring-primary-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSelection(mediaItem)}
                    >
                      <div className="aspect-square">
                        {mediaItem.type === 'image' ? (
                          <img
                            src={mediaItem.url}
                            alt={mediaItem.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      
                      {/* File info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs">
                        <div className="truncate" title={mediaItem.originalName}>
                          {mediaItem.originalName}
                        </div>
                        <div className="text-gray-300">
                          {formatFileSize(mediaItem.size)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedItems.length > 0 && (
              <span>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Otkaži
            </button>
            <button
              onClick={handleSelect}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              Odaberi {selectedItems.length > 0 && `(${selectedItems.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
