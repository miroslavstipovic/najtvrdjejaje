'use client'

import { useEffect, useState, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Competition {
  id: number
  name: string
  slug: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  coverImage: string | null
  status: string
  tournamentType: string
  numberOfGroups: number
  eggsPerCompetitor: number
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  _count: {
    rounds: number
    matches: number
    rankings: number
  }
}

interface Competitor {
  id: number
  name: string
  totalEggsBroken: number
  totalWins: number
  totalLosses: number
  profileImage: string | null
  city: string | null
  familyGroup: string | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'Svi statusi' },
  { value: 'upcoming', label: 'Nadolazeći' },
  { value: 'ongoing', label: 'U tijeku' },
  { value: 'completed', label: 'Završen' },
  { value: 'cancelled', label: 'Otkazan' },
]

const STATUS_BADGES: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Nadolazeći',
  ongoing: 'U tijeku',
  completed: 'Završen',
  cancelled: 'Otkazan',
}

export default function AdminCompetitions() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompetitions()
      fetchCompetitors()
    }
  }, [isAuthenticated, statusFilter])

  const fetchCompetitions = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      
      const response = await fetch(`/api/admin/competitions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitions(data.competitions)
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitors = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/competitors?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitors(data.competitors)
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error)
    }
  }

  const handleTogglePublished = async (id: number, isPublished: boolean) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitions/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished }),
      })

      if (response.ok) {
        setCompetitions(competitions.map(c => 
          c.id === id ? { ...c, isPublished } : c
        ))
      } else {
        const error = await response.json()
        alert(error.message || 'Ažuriranje nije uspjelo')
      }
    } catch (error) {
      console.error('Toggle published error:', error)
      alert('Ažuriranje nije uspjelo')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati turnir "${name}"? Ovo će obrisati sve mečeve i rang liste.`)) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        setCompetitions(competitions.filter(c => c.id !== id))
      } else {
        const error = await response.json()
        alert(error.message || 'Brisanje nije uspjelo')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Brisanje nije uspjelo')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <AdminLayout title="Turniri" description="Upravljanje turnirima i natjecanjima">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full sm:w-48"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingCompetition(null)
              setShowModal(true)
            }}
            className="btn-primary w-full sm:w-auto"
          >
            + Novi turnir
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-primary-600">{competitions.length}</div>
            <div className="text-sm text-gray-600">Ukupno turnira</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {competitions.filter(c => c.status === 'ongoing').length}
            </div>
            <div className="text-sm text-gray-600">U tijeku</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {competitions.filter(c => c.status === 'upcoming').length}
            </div>
            <div className="text-sm text-gray-600">Nadolazeći</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">
              {competitions.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Završeni</div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <div key={competition.id} className="card">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[competition.status]}`}>
                        {STATUS_LABELS[competition.status]}
                      </span>
                      {competition.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-700">
                          ⭐ Istaknuto
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-primary-900 mb-1">
                      {competition.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(competition.startDate)}
                      {competition.endDate && ` - ${formatDate(competition.endDate)}`}
                    </p>
                    {competition.location && (
                      <p className="text-sm text-gray-500 mt-1">
                        📍 {competition.location}
                      </p>
                    )}
                  </div>
                  {/* Toggle za publikaciju */}
                  <label className="flex items-center cursor-pointer" title={competition.isPublished ? 'Klikni za skrivanje' : 'Klikni za objavljivanje'}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={competition.isPublished}
                        onChange={() => handleTogglePublished(competition.id, !competition.isPublished)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${competition.isPublished ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${competition.isPublished ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className={`ml-2 text-xs font-medium ${competition.isPublished ? 'text-green-600' : 'text-gray-500'}`}>
                      {competition.isPublished ? 'Javno' : 'Skriveno'}
                    </span>
                  </label>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-cream-200 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{competition._count.rankings}</div>
                    <div className="text-xs text-gray-500">Natjecatelja</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{competition.numberOfGroups || '-'}</div>
                    <div className="text-xs text-gray-500">Grupa</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary-600">{competition._count.matches}</div>
                    <div className="text-xs text-gray-500">Mečeva</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/competitions/${competition.id}`}
                    className="flex-1 px-4 py-2 text-center text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    Detalji
                  </Link>
                  <button
                    onClick={() => {
                      setEditingCompetition(competition)
                      setShowModal(true)
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    Uredi
                  </button>
                  {competition._count.matches === 0 && (
                    <button
                      onClick={() => handleDelete(competition.id, competition.name)}
                      className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors"
                    >
                      Obriši
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {competitions.length === 0 && !loading && (
            <div className="col-span-full card p-12 text-center">
              <div className="text-5xl mb-6">🏆</div>
              <p className="text-gray-600 text-lg mb-6">Nema pronađenih turnira.</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex"
              >
                Kreiraj prvi turnir
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <CompetitionModal
            competition={editingCompetition}
            competitors={competitors}
            onClose={() => {
              setShowModal(false)
              setEditingCompetition(null)
            }}
            onSuccess={(saved) => {
              if (editingCompetition) {
                setCompetitions(competitions.map(c => c.id === saved.id ? saved : c))
                setShowModal(false)
                setEditingCompetition(null)
              } else {
                // Redirect to new competition details
                router.push(`/admin/competitions/${saved.id}`)
              }
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
}

interface CompetitionModalProps {
  competition: Competition | null
  competitors: Competitor[]
  onClose: () => void
  onSuccess: (competition: Competition) => void
}

function CompetitionModal({ competition, competitors, onClose, onSuccess }: CompetitionModalProps) {
  const [formData, setFormData] = useState({
    name: competition?.name || '',
    description: competition?.description || '',
    startDate: competition?.startDate ? competition.startDate.split('T')[0] : '',
    endDate: competition?.endDate ? competition.endDate.split('T')[0] : '',
    location: competition?.location || '',
    status: competition?.status || 'upcoming',
    numberOfGroups: competition?.numberOfGroups || 8,
    eggsPerCompetitor: competition?.eggsPerCompetitor || 30,
    isPublished: competition?.isPublished ?? false,
    isFeatured: competition?.isFeatured ?? false,
    isHistorical: false,
  })
  const [selectedCompetitors, setSelectedCompetitors] = useState<number[]>([])
  const [seedCompetitors, setSeedCompetitors] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'info' | 'competitors'>('info')
  
  // Ref za blokiranje višestrukih submitova (brži od state-a)
  const isSubmitting = useRef(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const toggleCompetitor = (id: number) => {
    setSelectedCompetitors(prev => {
      if (prev.includes(id)) {
        setSeedCompetitors(s => s.filter(sid => sid !== id))
        return prev.filter(c => c !== id)
      }
      return [...prev, id]
    })
  }

  const toggleSeed = (id: number) => {
    setSeedCompetitors(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id)
      if (prev.length >= formData.numberOfGroups) return prev
      return [...prev, id]
    })
  }

  const selectAllCompetitors = () => {
    setSelectedCompetitors(competitors.map(c => c.id))
  }

  const deselectAllCompetitors = () => {
    setSelectedCompetitors([])
    setSeedCompetitors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Blokiraj ako je već u tijeku submit
    if (isSubmitting.current || loading) return
    isSubmitting.current = true
    
    setLoading(true)
    setError('')

    const token = localStorage.getItem('adminToken')
    if (!token) {
      isSubmitting.current = false
      setLoading(false)
      return
    }

    try {
      const url = competition
        ? `/api/admin/competitions/${competition.id}`
        : '/api/admin/competitions'
      
      const method = competition ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
          endDate: formData.endDate || null,
          location: formData.location || null,
          numberOfGroups: parseInt(formData.numberOfGroups.toString()),
          eggsPerCompetitor: parseInt(formData.eggsPerCompetitor.toString()),
          competitorIds: !competition ? selectedCompetitors : undefined,
          seedIds: !competition ? seedCompetitors : undefined,
          generateSchedule: !competition && selectedCompetitors.length >= 2,
        }),
      })

      if (response.ok) {
        const saved = await response.json()
        onSuccess(saved)
        // Ne resetiraj isSubmitting jer se modal zatvara
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Spremanje nije uspjelo')
        isSubmitting.current = false
      }
    } catch (error) {
      setError('Spremanje nije uspjelo')
      isSubmitting.current = false
    } finally {
      setLoading(false)
    }
  }

  // Calculate competitors per group
  const competitorsPerGroup = selectedCompetitors.length > 0 && formData.numberOfGroups > 0
    ? Math.ceil(selectedCompetitors.length / formData.numberOfGroups)
    : 0

  // Calculate total matches in group phase
  const totalGroupMatches = selectedCompetitors.length > 0 && formData.numberOfGroups > 0
    ? (() => {
        const groups = Math.min(formData.numberOfGroups, Math.floor(selectedCompetitors.length / 2))
        const perGroup = Math.ceil(selectedCompetitors.length / groups)
        // Berger formula: n*(n-1)/2 matches per group
        return groups * (perGroup * (perGroup - 1) / 2)
      })()
    : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-primary-900 mb-6">
          {competition ? 'Uredi turnir' : 'Novi turnir 🥚🏆'}
        </h2>

        {/* Step indicator for new competition */}
        {!competition && (
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => setStep('info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                step === 'info' ? 'bg-primary-600 text-white' : 'bg-cream-100 text-gray-600'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">1</span>
              Informacije
            </button>
            <div className="h-0.5 w-8 bg-cream-200" />
            <button
              type="button"
              onClick={() => setStep('competitors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                step === 'competitors' ? 'bg-primary-600 text-white' : 'bg-cream-100 text-gray-600'
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">2</span>
              Natjecatelji ({selectedCompetitors.length})
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {(step === 'info' || competition) && (
            <div className="space-y-4">
              <div>
                <label className="label-field">Naziv turnira *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="npr. Uskrsni turnir 2026"
                  required
                />
              </div>

              <div>
                <label className="label-field">Opis</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="input-field"
                  placeholder="Opis turnira..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Datum početka *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label-field">Datum završetka</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Lokacija</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="npr. Sarajevo"
                  />
                </div>
                <div>
                  <label className="label-field">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="upcoming">Nadolazeći</option>
                    <option value="ongoing">U tijeku</option>
                    <option value="completed">Završen</option>
                    <option value="cancelled">Otkazan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Broj grupa</label>
                  <select
                    name="numberOfGroups"
                    value={formData.numberOfGroups}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {[2, 4, 6, 8, 10, 12, 16].map(n => (
                      <option key={n} value={n}>{n} grupa</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-field">Jaja po natjecatelju</label>
                  <input
                    type="number"
                    name="eggsPerCompetitor"
                    value={formData.eggsPerCompetitor}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              {/* Historical tournament option */}
              {!competition && (
                <div className="p-4 bg-gold-50 border border-gold-200 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isHistorical"
                      checked={formData.isHistorical}
                      onChange={(e) => {
                        handleChange(e)
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, status: 'completed' }))
                        }
                      }}
                      className="w-5 h-5 rounded text-primary-600"
                    />
                    <div>
                      <span className="font-medium text-primary-900">Povijesni turnir</span>
                      <p className="text-sm text-gray-600">
                        Unos završenog turnira iz prošlosti.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary-600"
                  />
                  <span className="text-sm">Objavljeno</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-primary-600"
                  />
                  <span className="text-sm">Istaknuto</span>
                </label>
              </div>

              {/* Next step button for new competition */}
              {!competition && (
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep('competitors')}
                    className="btn-primary"
                  >
                    Dalje: Odaberi natjecatelje →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Competitor Selection (only for new competitions) */}
          {step === 'competitors' && !competition && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-cream-50 rounded-xl">
                <h3 className="font-semibold text-primary-900 mb-2">Pregled turnira</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">{selectedCompetitors.length}</div>
                    <div className="text-xs text-gray-500">Natjecatelja</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {Math.min(formData.numberOfGroups, Math.max(1, Math.floor(selectedCompetitors.length / 2)))}
                    </div>
                    <div className="text-xs text-gray-500">Grupa</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gold-600">~{competitorsPerGroup}</div>
                    <div className="text-xs text-gray-500">Po grupi</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gold-600">~{Math.round(totalGroupMatches)}</div>
                    <div className="text-xs text-gray-500">Mečeva</div>
                  </div>
                </div>
              </div>

              {/* Seeds info */}
              {seedCompetitors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-amber-800">
                      Nositelji grupa: {seedCompetitors.length}/{formData.numberOfGroups}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSeedCompetitors([])}
                      className="text-xs text-amber-600 hover:text-amber-800"
                    >
                      Ukloni sve nositelje
                    </button>
                  </div>
                  <p className="text-xs text-amber-700">
                    Svaki nositelj bit će raspoređen u zasebnu grupu.
                  </p>
                </div>
              )}

              {/* Selection controls */}
              <div className="flex items-center justify-between">
                <label className="label-field mb-0">
                  Odaberi natjecatelje ({selectedCompetitors.length}/{competitors.length})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllCompetitors}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Odaberi sve
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAllCompetitors}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Poništi
                  </button>
                </div>
              </div>

              {/* Competitor list */}
              <div className="border border-cream-200 rounded-xl max-h-64 overflow-y-auto">
                {competitors.map(comp => {
                  const isSelected = selectedCompetitors.includes(comp.id)
                  const isSeed = seedCompetitors.includes(comp.id)
                  return (
                    <div
                      key={comp.id}
                      className={`flex items-center gap-3 p-3 border-b border-cream-100 last:border-b-0 ${
                        isSelected ? (isSeed ? 'bg-amber-50' : 'bg-primary-50') : 'hover:bg-cream-50'
                      }`}
                    >
                      <label className="cursor-pointer flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCompetitor(comp.id)}
                          className="w-5 h-5 rounded text-primary-600"
                        />
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{comp.name}</span>
                          {comp.city && <span className="text-sm text-gray-500">({comp.city})</span>}
                          {comp.familyGroup && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {comp.familyGroup}
                            </span>
                          )}
                          {isSeed && (
                            <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full font-semibold">
                              Nositelj
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm shrink-0">
                        <span className="text-gold-600 font-medium">🥚 {comp.totalEggsBroken}</span>
                        <span className="text-green-600">{comp.totalWins}W</span>
                        <span className="text-red-600">{comp.totalLosses}L</span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={() => toggleSeed(comp.id)}
                            title={isSeed ? 'Ukloni nositelja' : 'Postavi kao nositelja grupe'}
                            className={`ml-1 w-7 h-7 flex items-center justify-center rounded-full transition-colors text-base ${
                              isSeed
                                ? 'bg-amber-400 text-white hover:bg-amber-500'
                                : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'
                            }`}
                          >
                            ★
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {competitors.length === 0 && (
                  <p className="p-4 text-gray-500 text-center">Nema dostupnih natjecatelja</p>
                )}
              </div>

              {selectedCompetitors.length < 2 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  Potrebno je odabrati najmanje 2 natjecatelja za automatsko generiranje rasporeda.
                </div>
              )}

              {seedCompetitors.length > formData.numberOfGroups && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                  Previše nositelja ({seedCompetitors.length}) za {formData.numberOfGroups} grupa.
                </div>
              )}

              {/* Back button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  ← Natrag na informacije
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit buttons */}
          {(competition || step === 'competitors') && (
            <div className="flex gap-3 pt-6 mt-6 border-t border-cream-200">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary">
                Odustani
              </button>
              <button 
                type="submit" 
                disabled={loading || (!competition && selectedCompetitors.length < 2)} 
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Spremanje...' : (competition ? 'Ažuriraj' : `Kreiraj turnir s ${selectedCompetitors.length} natjecatelja`)}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
