'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import map picker to avoid SSR issues
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center"><p className="text-gray-500">Učitavanje mape...</p></div>,
})

interface LocationFormProps {
  location?: {
    id: number
    name: string
    latitude: number
    longitude: number
    description: string | null
    youtubeUrl: string | null
    articleId: number | null
    iconUrl: string | null
  } | null
  onClose: () => void
  onSuccess: () => void
}

export default function LocationFormEnhanced({ location, onClose, onSuccess }: LocationFormProps) {
  const [name, setName] = useState(location?.name || '')
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || '')
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || '')
  const [description, setDescription] = useState(location?.description || '')
  const [iconUrl, setIconUrl] = useState(location?.iconUrl || '')
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const [iconUploadError, setIconUploadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  // New fields
  const [contentType, setContentType] = useState<'youtube' | 'article'>(
    location?.youtubeUrl ? 'youtube' : location?.articleId ? 'article' : 'youtube'
  )
  const [youtubeUrl, setYoutubeUrl] = useState(location?.youtubeUrl || '')
  const [articleId, setArticleId] = useState(location?.articleId?.toString() || '')
  const [articles, setArticles] = useState<any[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)

  // Fetch articles for selection
  useEffect(() => {
    const fetchArticles = async () => {
      const token = localStorage.getItem('adminToken')
      if (!token) return

      setLoadingArticles(true)
      try {
        const response = await fetch('/api/admin/articles?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          setArticles(data.articles || [])
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      } finally {
        setLoadingArticles(false)
      }
    }

    fetchArticles()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError('')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'VideoPortal/1.0'
          }
        }
      )

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
        if (results.length === 0) {
          setError('Nije pronađena nijedna lokacija. Pokušajte s drugim pojmom pretrage.')
        }
      } else {
        setError('Greška pri pretraživanju lokacija')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setError('Greška pri pretraživanju lokacija')
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result: any) => {
    setName(result.display_name)
    setLatitude(result.lat)
    setLongitude(result.lon)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleMapSelect = (lat: number, lng: number) => {
    setLatitude(lat.toString())
    setLongitude(lng.toString())
    setShowMapPicker(false)
  }

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setIconUploadError('Nevažeći tip fajla. Dozvoljeni su JPG, PNG, GIF, WebP i SVG.')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setIconUploadError('Fajl je prevelik. Maksimalna veličina je 2MB.')
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    setUploadingIcon(true)
    setIconUploadError('')

    try {
      const formData = new FormData()
      formData.append('icon', file)

      const response = await fetch('/api/admin/locations/upload-icon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setIconUrl(data.url)
        setIconUploadError('')
      } else {
        const data = await response.json()
        setIconUploadError(data.message || 'Upload nije uspio')
      }
    } catch (error) {
      console.error('Icon upload error:', error)
      setIconUploadError('Greška pri uploadu ikone')
    } finally {
      setUploadingIcon(false)
    }
  }

  const handleDeleteIcon = async () => {
    if (!iconUrl) return
    
    // Don't try to delete external URLs
    if (!iconUrl.includes('blob.vercel-storage.com') && 
        !iconUrl.includes('public.blob.vercel-storage.com') && 
        !iconUrl.startsWith('/uploads/')) {
      setIconUrl('')
      return
    }

    if (!confirm('Jeste li sigurni da želite obrisati ovu ikonu?')) {
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/locations/upload-icon?url=${encodeURIComponent(iconUrl)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setIconUrl('')
        setIconUploadError('')
      } else {
        const data = await response.json()
        console.error('Delete error:', data.message)
        // Still clear the URL even if delete fails (file might already be deleted)
        setIconUrl('')
      }
    } catch (error) {
      console.error('Icon delete error:', error)
      // Still clear the URL
      setIconUrl('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !latitude || !longitude) {
      setError('Naziv, geografska širina i dužina su obavezni')
      return
    }

    // Validate content link
    if (contentType === 'youtube' && !youtubeUrl.trim()) {
      setError('YouTube URL je obavezan')
      return
    }

    if (contentType === 'article' && !articleId) {
      setError('Odaberite članak')
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Geografska širina mora biti između -90 i 90')
      return
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Geografska dužina mora biti između -180 i 180')
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    setLoading(true)

    try {
      const url = location
        ? `/api/admin/locations/${location.id}`
        : '/api/admin/locations'
      
      const method = location ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          latitude: lat,
          longitude: lng,
          description: description.trim() || null,
          youtubeUrl: contentType === 'youtube' ? youtubeUrl.trim() : null,
          articleId: contentType === 'article' ? parseInt(articleId) : null,
          iconUrl: iconUrl.trim() || null,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.message || 'Greška pri spremanju lokacije')
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('Greška pri spremanju lokacije')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {location ? 'Uredi lokaciju' : 'Nova lokacija'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Address Search */}
          <div>
            <label className="label-field">Pretraži adresu</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field flex-1"
                placeholder="Npr. Sarajevo, Bosna i Hercegovina"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="btn-secondary whitespace-nowrap disabled:opacity-50"
              >
                {searching ? 'Pretraživanje...' : 'Pretraži'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 border border-gray-200 rounded-xl divide-y divide-gray-200 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">{result.display_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {result.lat}, {result.lon}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Picker Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowMapPicker(!showMapPicker)}
              className="btn-secondary w-full"
            >
              {showMapPicker ? '✕ Zatvori mapu' : '🗺️ Odaberi lokaciju na mapi'}
            </button>
          </div>

          {/* Map Picker */}
          {showMapPicker && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <LocationPicker
                initialLat={latitude ? parseFloat(latitude) : 43.8564}
                initialLng={longitude ? parseFloat(longitude) : 18.4131}
                onSelect={handleMapSelect}
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="label-field">Naziv lokacije *</label>
            <input
              type="text"
              id="name"
              className="input-field"
              placeholder="Npr. Sarajevo City Center"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="label-field">Geografska širina *</label>
              <input
                type="number"
                id="latitude"
                className="input-field"
                placeholder="43.8564"
                step="any"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">-90 do 90</p>
            </div>
            <div>
              <label htmlFor="longitude" className="label-field">Geografska dužina *</label>
              <input
                type="number"
                id="longitude"
                className="input-field"
                placeholder="18.4131"
                step="any"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">-180 do 180</p>
            </div>
          </div>

          {/* Content Type Selection */}
          <div>
            <label className="label-field">Povezani sadržaj *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setContentType('youtube')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  contentType === 'youtube'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📹 YouTube Video
              </button>
              <button
                type="button"
                onClick={() => setContentType('article')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  contentType === 'article'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 Članak
              </button>
            </div>
          </div>

          {/* Content Fields */}
          {contentType === 'youtube' ? (
            <div>
              <label htmlFor="youtubeUrl" className="label-field">YouTube URL *</label>
              <input
                type="url"
                id="youtubeUrl"
                className="input-field"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Unesite cijeli YouTube URL (npr. https://www.youtube.com/watch?v=dQw4w9WgXcQ)
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="articleId" className="label-field">Odaberi članak *</label>
              {loadingArticles ? (
                <div className="input-field flex items-center justify-center text-gray-500">
                  Učitavanje članaka...
                </div>
              ) : (
                <select
                  id="articleId"
                  className="input-field"
                  value={articleId}
                  onChange={(e) => setArticleId(e.target.value)}
                  required
                >
                  <option value="">-- Odaberite članak --</option>
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.title} ({article.category?.name})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Članak će biti prikazan na ovoj lokaciji na mapi
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="description" className="label-field">Opis (opcionalno)</label>
            <textarea
              id="description"
              className="input-field resize-none"
              rows={3}
              placeholder="Dodatne informacije o lokaciji..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Icon URL */}
          <div>
            <label className="label-field">Ikona za mapu (opcionalno)</label>
            
            {/* Upload Button */}
            <div className="mb-3">
              <input
                type="file"
                id="iconUpload"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleIconUpload}
                className="hidden"
                disabled={uploadingIcon}
              />
              <label
                htmlFor="iconUpload"
                className={`btn-secondary w-full cursor-pointer text-center ${uploadingIcon ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingIcon ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Upload u toku...
                  </span>
                ) : (
                  '📤 Upload ikone'
                )}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Prihvatljivi formati: JPG, PNG, GIF, WebP, SVG. Max: 2MB. Preporučena veličina: 40x40px
              </p>
            </div>

            {/* Upload Error */}
            {iconUploadError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                {iconUploadError}
              </div>
            )}

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ili</span>
              </div>
            </div>

            {/* Manual URL Input */}
            <div>
              <label htmlFor="iconUrl" className="label-field text-sm">Ili unesite URL ikone ručno</label>
              <input
                type="url"
                id="iconUrl"
                className="input-field"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
              />
            </div>

            {/* Icon Preview */}
            {iconUrl && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Pregled ikone:</p>
                    <img 
                      src={iconUrl} 
                      alt="Icon preview" 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML += '<div class="text-xs text-red-600">Greška pri učitavanju slike</div>';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteIcon}
                    className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                  >
                    🗑️ Obriši
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Odustani
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Spremanje...
                </span>
              ) : (
                location ? 'Spremi promjene' : 'Kreiraj lokaciju'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

