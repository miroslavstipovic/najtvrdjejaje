'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

interface Competitor {
  id: number
  name: string
  slug: string
  profileImage: string | null
  city: string | null
  country: string | null
}

interface GlobalRanking {
  position: number
  competitor: Competitor
  totalEggsBroken: number
  totalEggsLost: number
  eggsDifference: number
  wins: number
  losses: number
  totalMatches: number
  winRate: number
}

interface CompetitionRanking {
  id: number
  position: number
  points: number
  weightedPoints: number
  wins: number
  losses: number
  eggsBroken: number
  eggsLost: number
  eggsDifference: number
  competitor: Competitor
}

interface Competition {
  id: number
  name: string
  slug: string
  status: string
}

export default function AdminRankings() {
  const { isAuthenticated } = useAuth()
  const [globalRankings, setGlobalRankings] = useState<GlobalRanking[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null)
  const [competitionRankings, setCompetitionRankings] = useState<CompetitionRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [activeTab, setActiveTab] = useState<'global' | 'competition'>('global')

  useEffect(() => {
    if (isAuthenticated) {
      fetchGlobalRankings()
      fetchCompetitions()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (selectedCompetition) {
      fetchCompetitionRankings(selectedCompetition)
    }
  }, [selectedCompetition])

  const fetchGlobalRankings = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/rankings?type=global', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setGlobalRankings(data.rankings)
      }
    } catch (error) {
      console.error('Failed to fetch global rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitions = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/competitions?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitions(data.competitions)
        if (data.competitions.length > 0) {
          setSelectedCompetition(data.competitions[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error)
    }
  }

  const fetchCompetitionRankings = async (competitionId: number) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/rankings?competitionId=${competitionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCompetitionRankings(data.rankings)
      }
    } catch (error) {
      console.error('Failed to fetch competition rankings:', error)
    }
  }

  const handleRecalculateAll = async () => {
    if (!confirm('Jeste li sigurni da želite preračunati sve BRJ statistike? Ovo će resetirati sve statistike i preračunati ih iz povijesti mečeva.')) {
      return
    }

    const token = localStorage.getItem('adminToken')
    if (!token) return

    setRecalculating(true)

    try {
      const response = await fetch('/api/admin/rankings/recalculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recalculateGlobal: true }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchGlobalRankings()
      } else {
        const error = await response.json()
        alert(error.message || 'Preračunavanje nije uspjelo')
      }
    } catch (error) {
      console.error('Recalculate error:', error)
      alert('Preračunavanje nije uspjelo')
    } finally {
      setRecalculating(false)
    }
  }

  const handleRecalculateCompetition = async () => {
    if (!selectedCompetition) return

    const token = localStorage.getItem('adminToken')
    if (!token) return

    setRecalculating(true)

    try {
      const response = await fetch('/api/admin/rankings/recalculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ competitionId: selectedCompetition }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchCompetitionRankings(selectedCompetition)
      } else {
        const error = await response.json()
        alert(error.message || 'Preračunavanje nije uspjelo')
      }
    } catch (error) {
      console.error('Recalculate error:', error)
      alert('Preračunavanje nije uspjelo')
    } finally {
      setRecalculating(false)
    }
  }

  const handleUpdateRanking = async (rankingId: number, data: Partial<CompetitionRanking>) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/rankings/${rankingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok && selectedCompetition) {
        await fetchCompetitionRankings(selectedCompetition)
      }
    } catch (error) {
      console.error('Update ranking error:', error)
    }
  }

  return (
    <AdminLayout title="BRJ Rang liste" description="Pregled i upravljanje BRJ (Broj Razbijenih Jaja) rang listama">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'global'
                  ? 'bg-primary-600 text-white'
                  : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
              }`}
            >
              🥚 Globalna BRJ lista
            </button>
            <button
              onClick={() => setActiveTab('competition')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                activeTab === 'competition'
                  ? 'bg-primary-600 text-white'
                  : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
              }`}
            >
              🏆 Po turnirima
            </button>
          </div>

          {activeTab === 'global' ? (
            <button
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="btn-secondary"
            >
              {recalculating ? 'Preračunavanje...' : '🔄 Preračunaj sve BRJ'}
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <select
                value={selectedCompetition || ''}
                onChange={(e) => setSelectedCompetition(parseInt(e.target.value))}
                className="input-field w-48"
              >
                {competitions.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
              <button
                onClick={handleRecalculateCompetition}
                disabled={recalculating || !selectedCompetition}
                className="btn-secondary"
              >
                {recalculating ? '...' : '🔄'}
              </button>
            </div>
          )}
        </div>

        {/* Global Rankings - BRJ */}
        {activeTab === 'global' && (
          <div className="card overflow-hidden">
            <div className="p-4 bg-cream-50 border-b border-cream-200">
              <p className="text-sm text-gray-600">
                BRJ (Broj Razbijenih Jaja) - Globalna statistika svih natjecatelja
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-primary-900">#</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-primary-900">Natjecatelj</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">BRJ 🥚</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">Izgubljeno</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">+/-</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">P/I</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">Win %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {globalRankings.map((ranking, index) => (
                  <tr key={ranking.competitor.id} className={index < 3 ? 'bg-gold-50' : ''}>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        index === 0 ? 'text-2xl text-gold-600' :
                        index === 1 ? 'text-xl text-gray-500' :
                        index === 2 ? 'text-lg text-amber-700' :
                        'text-primary-900'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ranking.position}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {ranking.competitor.profileImage ? (
                          <Image
                            src={ranking.competitor.profileImage}
                            alt={ranking.competitor.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                            {ranking.competitor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-primary-900">{ranking.competitor.name}</div>
                          {ranking.competitor.city && (
                            <div className="text-sm text-gray-500">{ranking.competitor.city}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="font-bold text-lg text-gold-600">{ranking.totalEggsBroken}</span>
                    </td>
                    <td className="text-center px-4 py-4 text-gray-500">{ranking.totalEggsLost}</td>
                    <td className="text-center px-4 py-4">
                      <span className={`font-semibold ${
                        ranking.eggsDifference > 0 ? 'text-green-600' :
                        ranking.eggsDifference < 0 ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {ranking.eggsDifference > 0 ? '+' : ''}{ranking.eggsDifference}
                      </span>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="text-green-600 font-medium">{ranking.wins}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">{ranking.losses}</span>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className={`font-medium ${
                        ranking.winRate >= 60 ? 'text-green-600' :
                        ranking.winRate >= 40 ? 'text-gray-600' :
                        'text-red-600'
                      }`}>
                        {ranking.winRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {globalRankings.length === 0 && !loading && (
              <div className="p-12 text-center">
                <div className="text-5xl mb-6">🥚</div>
                <p className="text-gray-600">Nema podataka za BRJ rang listu</p>
              </div>
            )}
          </div>
        )}

        {/* Competition Rankings - BRJ s multiplikatorom */}
        {activeTab === 'competition' && (
          <div className="card overflow-hidden">
            <div className="p-4 bg-cream-50 border-b border-cream-200">
              <p className="text-sm text-gray-600">
                Bodovi = Broj razbijenih jaja × Multiplikator kruga (1× grupa, 2× osmina, 3× četvrt, 4× polu, 5× finale)
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-primary-900">#</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-primary-900">Natjecatelj</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">Bodovi</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">🥚 Razbijeno</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">P</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">I</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">+/-</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-primary-900">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {competitionRankings.map((ranking, index) => (
                  <tr key={ranking.id} className={index < 3 ? 'bg-gold-50' : ''}>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        index === 0 ? 'text-2xl text-gold-600' :
                        index === 1 ? 'text-xl text-gray-500' :
                        index === 2 ? 'text-lg text-amber-700' :
                        'text-primary-900'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ranking.position}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {ranking.competitor.profileImage ? (
                          <Image
                            src={ranking.competitor.profileImage}
                            alt={ranking.competitor.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                            {ranking.competitor.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-primary-900">{ranking.competitor.name}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-4">
                      <div>
                        <span className="font-bold text-lg text-primary-600">{ranking.weightedPoints}</span>
                        {ranking.weightedPoints !== ranking.points && (
                          <div className="text-xs text-gray-400" title="Bodovi prije množenja s multiplierom runde">({ranking.points} osnovnih)</div>
                        )}
                      </div>
                    </td>
                    <td className="text-center px-4 py-4">
                      <span className="font-semibold text-gold-600">{ranking.eggsBroken}</span>
                      <span className="text-gray-400 text-sm"> / {ranking.eggsLost}</span>
                    </td>
                    <td className="text-center px-4 py-4 text-green-600 font-medium">{ranking.wins}</td>
                    <td className="text-center px-4 py-4 text-red-600 font-medium">{ranking.losses}</td>
                    <td className="text-center px-4 py-4">
                      <span className={`font-medium ${
                        ranking.eggsBroken - ranking.eggsLost >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {ranking.eggsBroken - ranking.eggsLost >= 0 ? '+' : ''}{ranking.eggsBroken - ranking.eggsLost}
                      </span>
                    </td>
                    <td className="text-right px-6 py-4">
                      <button
                        onClick={() => {
                          const newPoints = prompt('Novi broj bodova:', ranking.weightedPoints.toString())
                          if (newPoints !== null) {
                            handleUpdateRanking(ranking.id, { weightedPoints: parseInt(newPoints) })
                          }
                        }}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      >
                        Uredi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {competitionRankings.length === 0 && (
              <div className="p-12 text-center">
                <div className="text-5xl mb-6">🥚</div>
                <p className="text-gray-600">Nema podataka za BRJ rang listu ovog turnira</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
