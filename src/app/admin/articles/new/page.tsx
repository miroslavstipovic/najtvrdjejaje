'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import MediaLibrary from '@/components/MediaLibrary'

interface Category {
  id: number
  name: string
}

export default function NewArticle() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoType, setVideoType] = useState('youtube')
  const [coverImage, setCoverImage] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  
  // Media management state
  const [selectedMedia, setSelectedMedia] = useState<any[]>([])
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin')
      return
    }

    fetchCategories(token)
  }, [router])

  const fetchCategories = async (token: string) => {
    try {
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        localStorage.removeItem('adminToken')
        router.push('/admin')
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!title || !content || !categoryId) {
      setError('Naslov, sadržaj i kategorija su obavezni')
      setLoading(false)
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const requestData = {
        title,
        content,
        excerpt: excerpt || null,
        categoryId: parseInt(categoryId),
        videoUrl: videoUrl || null,
        videoType: videoType || null,
        coverImage: coverImage || null,
        isPublished,
        isFeatured,
      }
      
      console.log('Creating article with data:', requestData)
      
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const articleData = await response.json()
        console.log('Article created successfully:', articleData)
        
        // Save article media if any selected
        if (selectedMedia.length > 0) {
          console.log('Saving media for article:', articleData.id, selectedMedia.map(m => m.id))
          try {
            const mediaResponse = await fetch(`/api/admin/articles/${articleData.id}/media`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ mediaIds: selectedMedia.map(media => media.id) }),
            })
            
            if (!mediaResponse.ok) {
              const mediaError = await mediaResponse.json()
              console.error('Media save error:', mediaError)
            } else {
              console.log('Media saved successfully')
            }
          } catch (error) {
            console.error('Failed to save article media:', error)
          }
        }
        
        router.push('/admin/articles')
      } else {
        const errorData = await response.json()
        console.error('Article creation failed:', errorData)
        setError(errorData.message || 'Kreiranje članka nije uspjelo')
      }
    } catch (error) {
      console.error('Catch block error:', error)
      setError('Kreiranje članka nije uspjelo: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const detectVideoType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setVideoType('youtube')
    } else if (url.includes('vimeo.com')) {
      setVideoType('vimeo')
    } else {
      setVideoType('upload')
    }
  }

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url)
    if (url) {
      detectVideoType(url)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kreiraj novi članak</h1>
            <p className="text-gray-600">Dodaj novi članak na portal</p>
          </div>
          <div>
            <Link 
              href="/admin/articles"
              className="text-gray-500 hover:text-primary-600"
            >
              ← Natrag na članke
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Naslov *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Unesite naslov članka"
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Sažetak
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Kratki opis članka (neobavezno)"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Sadržaj *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ovdje napišite sadržaj članka..."
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategorija *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Odaberite kategoriju</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Video URL */}
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://youtube.com/watch?v=..."
              />
              {videoUrl && (
                <p className="text-sm text-gray-500 mt-1">
                  Detektiran tip: <span className="font-medium">{videoType}</span>
                </p>
              )}
            </div>

            {/* Cover Image Upload */}
            <div>
              <ImageUpload
                onImageUpload={setCoverImage}
                currentImage={coverImage}
                label="Naslovna slika"
                maxSize={5}
              />
            </div>

            {/* Media Gallery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Gallery
              </label>
              <div className="space-y-4">
                {/* Selected Media Preview */}
                {selectedMedia.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedMedia.map((media, index) => (
                      <div key={media.id} className="relative">
                        <img
                          src={media.url}
                          alt={media.originalName}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMedia(selectedMedia.filter((_, i) => i !== index))
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {media.originalName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Media Button */}
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {selectedMedia.length > 0 ? 'Manage Photos' : 'Add Photos'}
                </button>
                
                <p className="text-sm text-gray-500">
                  Photos will be displayed in a gallery at the end of the article.
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  id="isPublished"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                  Objavi odmah
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="isFeatured"
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                  Istakni na početnoj stranici
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/articles"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Odustani
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kreiranje...' : 'Kreiraj članak'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Media Library Modal */}
      <MediaLibrary
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(media) => setSelectedMedia(media)}
        multiple={true}
        selectedMedia={selectedMedia}
      />
    </div>
  )
}
