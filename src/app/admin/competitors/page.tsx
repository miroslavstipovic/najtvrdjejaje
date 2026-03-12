'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

interface Competitor {
  id: number
  name: string
  slug: string
  email: string | null
  phone: string | null
  city: string | null
  country: string
  profileImage: string | null
  bio: string | null
  familyGroup: string | null
  totalEggsBroken: number
  totalEggsLost: number
  totalWins: number
  totalLosses: number
  isActive: boolean
  createdAt: string
  _count: {
    homeMatches: number
    awayMatches: number
    rankings: number
  }
}

export default function AdminCompetitors() {
  const { isAuthenticated } = useAuth()
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompetitors()
    }
  }, [isAuthenticated])

  const fetchCompetitors = async (searchQuery = '') => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      
      const response = await fetch(`/api/admin/competitors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitors(data.competitors)
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCompetitors(search)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati natjecatelja "${name}"?`)) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setCompetitors(competitors.filter(c => c.id !== id))
      } else {
        const error = await response.json()
        alert(error.message || 'Brisanje nije uspjelo')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Brisanje nije uspjelo')
    }
  }

  const toggleActive = async (competitor: Competitor) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitors/${competitor.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !competitor.isActive }),
      })

      if (response.ok) {
        const updated = await response.json()
        setCompetitors(competitors.map(c => c.id === competitor.id ? updated : c))
      }
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  // Izračunaj ukupan broj razbijenih jaja
  const totalEggsAllCompetitors = competitors.reduce((sum, c) => sum + c.totalEggsBroken, 0)
  // Najviši BRJ
  const highestBRJ = competitors.length > 0 ? Math.max(...competitors.map(c => c.totalEggsBroken)) : 0

  return (
    <AdminLayout title="Natjecatelji" description="Upravljanje natjecateljima">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži natjecatelje..."
              className="input-field flex-1 sm:w-64"
            />
            <button type="submit" className="btn-secondary">
              Traži
            </button>
          </form>
          <button
            onClick={() => {
              setEditingCompetitor(null)
              setShowModal(true)
            }}
            className="btn-primary w-full sm:w-auto"
          >
            + Novi natjecatelj
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{competitors.length}</div>
            <div className="text-sm text-gray-600">Ukupno natjecatelja</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {competitors.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Aktivni</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-gold-600">
              {highestBRJ}
            </div>
            <div className="text-sm text-gray-600">Najviši BRJ</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-primary-800">
              {totalEggsAllCompetitors}
            </div>
            <div className="text-sm text-gray-600">Ukupno razbijenih 🥚</div>
          </div>
        </div>

        {/* Competitors Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-primary-900">Natjecatelj</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">BRJ 🥚</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">P/I</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">Razlika</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-primary-900">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {competitors.map((competitor) => (
                  <tr key={competitor.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {competitor.profileImage ? (
                          <Image
                            src={competitor.profileImage}
                            alt={competitor.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                            {competitor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-primary-900">
                            {competitor.name}
                            {competitor.familyGroup && (
                              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-normal">
                                {competitor.familyGroup}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {competitor.city && `${competitor.city}, `}{competitor.country}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="font-bold text-gold-600 text-lg">{competitor.totalEggsBroken}</span>
                      <span className="text-gray-400 text-sm ml-1">/ {competitor.totalEggsLost}</span>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="text-green-600 font-medium">{competitor.totalWins}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">{competitor.totalLosses}</span>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className={`font-semibold ${
                        competitor.totalEggsBroken - competitor.totalEggsLost > 0 
                          ? 'text-green-600' 
                          : competitor.totalEggsBroken - competitor.totalEggsLost < 0 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                      }`}>
                        {competitor.totalEggsBroken - competitor.totalEggsLost > 0 ? '+' : ''}
                        {competitor.totalEggsBroken - competitor.totalEggsLost}
                      </span>
                    </td>
                    <td className="text-center px-4 py-4">
                      <button
                        onClick={() => toggleActive(competitor)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          competitor.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {competitor.isActive ? 'Aktivan' : 'Neaktivan'}
                      </button>
                    </td>
                    <td className="text-right px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCompetitor(competitor)
                            setShowModal(true)
                          }}
                          className="px-3 py-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          Uredi
                        </button>
                        {competitor._count.homeMatches + competitor._count.awayMatches === 0 && (
                          <button
                            onClick={() => handleDelete(competitor.id, competitor.name)}
                            className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            Obriši
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {competitors.length === 0 && !loading && (
            <div className="p-12 text-center">
              <div className="text-5xl mb-6">🥚</div>
              <p className="text-gray-600 text-lg mb-6">Nema pronađenih natjecatelja.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex"
              >
                Dodaj prvog natjecatelja
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <CompetitorModal
            competitor={editingCompetitor}
            onClose={() => {
              setShowModal(false)
              setEditingCompetitor(null)
            }}
            onSuccess={(saved) => {
              if (editingCompetitor) {
                setCompetitors(competitors.map(c => c.id === saved.id ? saved : c))
              } else {
                setCompetitors([...competitors, saved])
              }
              setShowModal(false)
              setEditingCompetitor(null)
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
}

interface CompetitorModalProps {
  competitor: Competitor | null
  onClose: () => void
  onSuccess: (competitor: Competitor) => void
}

function CompetitorModal({ competitor, onClose, onSuccess }: CompetitorModalProps) {
  const [formData, setFormData] = useState({
    name: competitor?.name || '',
    email: competitor?.email || '',
    phone: competitor?.phone || '',
    city: competitor?.city || '',
    country: competitor?.country || 'Bosna i Hercegovina',
    profileImage: competitor?.profileImage || '',
    bio: competitor?.bio || '',
    familyGroup: competitor?.familyGroup || '',
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadInfo, setUploadInfo] = useState<{ originalSize: number; compressedSize: number; compressionPercent: number } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    setUploading(true)
    setError('')
    setUploadInfo(null)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/admin/competitors/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, profileImage: data.url }))
        if (data.originalSize && data.compressedSize) {
          setUploadInfo({
            originalSize: data.originalSize,
            compressedSize: data.compressedSize,
            compressionPercent: data.compressionPercent || Math.round((1 - data.compressedSize / data.originalSize) * 100),
          })
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Upload slike nije uspio')
      }
    } catch (err) {
      setError('Upload slike nije uspio')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setFormData(prev => ({ ...prev, profileImage: '' }))
    setUploadInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const url = competitor
        ? `/api/admin/competitors/${competitor.id}`
        : '/api/admin/competitors'
      
      const method = competitor ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          phone: formData.phone || null,
          city: formData.city || null,
          profileImage: formData.profileImage || null,
          bio: formData.bio || null,
          familyGroup: formData.familyGroup || null,
        }),
      })

      if (response.ok) {
        const saved = await response.json()
        onSuccess(saved)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Spremanje nije uspjelo')
      }
    } catch (error) {
      setError('Spremanje nije uspjelo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-primary-900 mb-6">
          {competitor ? 'Uredi natjecatelja' : 'Novi natjecatelj'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Ime i prezime *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="npr. Marko Marković"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="label-field">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+387 61 123 456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Grad</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input-field"
                placeholder="npr. Sarajevo"
              />
            </div>
            <div>
              <label className="label-field">Država</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Bosna i Hercegovina">Bosna i Hercegovina</option>
                <option value="Hrvatska">Hrvatska</option>
                <option value="Srbija">Srbija</option>
                <option value="Crna Gora">Crna Gora</option>
                <option value="Slovenija">Slovenija</option>
                <option value="Makedonija">Makedonija</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Slika profila</label>
            <div className="space-y-3">
              {/* Image Preview */}
              {formData.profileImage && (
                <div className="relative inline-block">
                  <Image
                    src={formData.profileImage}
                    alt="Preview"
                    width={120}
                    height={120}
                    className="w-30 h-30 rounded-full object-cover border-4 border-cream-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Upload Input */}
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    uploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}>
                    {uploading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        📷 {formData.profileImage ? 'Zamijeni sliku' : 'Odaberi sliku'}
                      </>
                    )}
                  </span>
                </label>
              </div>

              {/* Compression Info */}
              {uploadInfo && (
                <div className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  ✓ Slika komprimirana: {(uploadInfo.originalSize / 1024).toFixed(0)}KB → {(uploadInfo.compressedSize / 1024).toFixed(0)}KB ({uploadInfo.compressionPercent}% manje)
                </div>
              )}

              <p className="text-xs text-gray-500">
                PNG, JPEG ili WebP. Max 10MB. Slika će biti automatski komprimirana na 400x400px.
              </p>
            </div>
          </div>

          <div>
            <label className="label-field">Obitelj</label>
            <input
              type="text"
              name="familyGroup"
              value={formData.familyGroup}
              onChange={handleChange}
              className="input-field"
              placeholder="npr. Marković (za razdvajanje u grupama)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Natjecatelji s istim nazivom obitelji neće biti u istoj grupi na turniru.
            </p>
          </div>

          <div>
            <label className="label-field">Biografija</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="input-field"
              placeholder="Kratki opis natjecatelja..."
            />
          </div>

          {/* Prikaz BRJ statistike za postojeće natjecatelje */}
          {competitor && (
            <div className="bg-cream-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-primary-900 mb-3">BRJ Statistika</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gold-600">{competitor.totalEggsBroken}</div>
                  <div className="text-xs text-gray-600">Razbijenih jaja</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-500">{competitor.totalEggsLost}</div>
                  <div className="text-xs text-gray-600">Izgubljenih jaja</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{competitor.totalWins}</div>
                  <div className="text-xs text-gray-600">Pobjeda</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{competitor.totalLosses}</div>
                  <div className="text-xs text-gray-600">Poraza</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Statistika se automatski ažurira na temelju rezultata mečeva.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Odustani
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Spremanje...' : (competitor ? 'Ažuriraj' : 'Kreiraj')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
