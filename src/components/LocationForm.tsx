'use client'

import { useState, useEffect } from 'react'

interface LocationFormProps {
  location?: {
    id: number
    name: string
    latitude: number
    longitude: number
    description: string | null
  } | null
  onClose: () => void
  onSuccess: () => void
}

export default function LocationForm({ location, onClose, onSuccess }: LocationFormProps) {
  const [name, setName] = useState(location?.name || '')
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || '')
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || '')
  const [description, setDescription] = useState(location?.description || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError('')

    try {
      // Use Nominatim (OpenStreetMap's free geocoding service)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !latitude || !longitude) {
      setError('Naziv, geografska širina i dužina su obavezni')
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
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
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
            <p className="text-xs text-gray-500 mt-1">
              Pretražite adresu i odaberite rezultat ili unesite koordinate ručno ispod
            </p>

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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

