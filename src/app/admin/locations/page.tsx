'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/AdminLayout'
import LocationFormEnhanced from '@/components/LocationFormEnhanced'
import Link from 'next/link'

interface Location {
  id: number
  name: string
  latitude: number
  longitude: number
  description: string | null
  youtubeUrl: string | null
  articleId: number | null
  iconUrl: string | null
  createdAt: string
  _count: {
    articles: number
  }
}

export default function AdminLocations() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchLocations()
    }
  }, [isAuthenticated])

  const fetchLocations = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/locations', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati lokaciju "${name}"? Članci povezani s ovom lokacijom neće biti obrisani, ali će izgubiti poveznicu s lokacijom.`)) {
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        setLocations(locations.filter(loc => loc.id !== id))
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to delete location')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete location')
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingLocation(null)
  }

  const handleFormSuccess = () => {
    fetchLocations()
    handleFormClose()
  }

  if (authLoading || loading) {
    return (
      <AdminLayout title="Lokacije" description="Upravljanje lokacijama">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Učitavanje...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Lokacije" description="Upravljanje lokacijama za članke">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sve lokacije</h2>
            <p className="text-gray-600 mt-1">
              {locations.length} {locations.length === 1 ? 'lokacija' : locations.length < 5 ? 'lokacije' : 'lokacija'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/dashboard"
              className="btn-secondary text-sm"
            >
              ← Natrag
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary text-sm"
            >
              + Nova lokacija
            </button>
          </div>
        </div>

        {/* Location Form Modal */}
        {showForm && (
          <LocationFormEnhanced
            location={editingLocation}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Locations Grid */}
        {locations.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-6">📍</div>
            <p className="text-gray-600 text-lg mb-6">Još nema kreiranih lokacija.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex"
            >
              Kreiraj prvu lokaciju
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {locations.map((location) => (
              <div key={location.id} className="card hover:shadow-md transition-shadow">
                <div className="p-5">
                  {/* Location Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {location.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                      location._count.articles > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {location._count.articles} {location._count.articles === 1 ? 'članak' : 'članaka'}
                    </span>
                  </div>

                  {/* Description */}
                  {location.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {location.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(location)}
                      className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => handleDelete(location.id, location.name)}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Obriši
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

