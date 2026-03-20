'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { useAuth } from '@/hooks/useAuth'

interface Competitor {
  id: number
  name: string
  slug: string
  totalEggsBroken: number
  profileImage: string | null
  familyGroup: string | null
}

interface Match {
  id: number
  homeCompetitorId: number
  awayCompetitorId: number
  homeEggsBroken: number
  awayEggsBroken: number
  result: string | null
  status: string
  matchDate: string | null
  homeCompetitor: { id: number; name: string; slug: string; totalEggsBroken: number }
  awayCompetitor: { id: number; name: string; slug: string; totalEggsBroken: number }
  round: { id: number; name: string; roundNumber: number; roundType: string; pointMultiplier: number; groupNumber: number | null } | null
}

interface Round {
  id: number
  name: string
  roundNumber: number
  roundType: string
  pointMultiplier: number
  groupNumber: number | null
  matches: Match[]
}

interface Ranking {
  id: number
  position: number
  points: number
  weightedPoints: number
  wins: number
  losses: number
  eggsBroken: number
  eggsLost: number
  competitor: Competitor
}

interface Competition {
  id: number
  name: string
  slug: string
  description: string | null
  startDate: string
  endDate: string | null
  location: string | null
  status: string
  tournamentType: string
  eggsPerCompetitor: number
  numberOfGroups: number
  isPublished: boolean
  rounds: Round[]
  rankings: Ranking[]
  matches: Match[]
  _count: {
    rounds: number
    matches: number
    rankings: number
  }
}

interface GroupStanding {
  groupNumber: number
  competitorId: number
  competitorName: string
  wins: number
  losses: number
  eggsBroken: number
  eggsLost: number
  weightedPoints: number
}

interface KnockoutStatus {
  canGenerate: boolean
  reason: string
  knockoutExists: boolean
  groupStats?: {
    totalMatches: number
    completedMatches: number
    pendingMatches: number
  }
  groupStandings?: GroupStanding[]
}

export default function CompetitionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [allCompetitors, setAllCompetitors] = useState<Competitor[]>([])
  const [knockoutStatus, setKnockoutStatus] = useState<KnockoutStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout' | 'rankings' | 'quick-entry'>('groups')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)

  const competitionId = params.id as string

  useEffect(() => {
    if (isAuthenticated && competitionId) {
      fetchCompetition()
      fetchAllCompetitors()
      fetchKnockoutStatus()
    }
  }, [isAuthenticated, competitionId])

  const fetchCompetition = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCompetition(data)
      } else {
        router.push('/admin/competitions')
      }
    } catch (error) {
      console.error('Failed to fetch competition:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllCompetitors = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/competitors?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAllCompetitors(data.competitors)
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error)
    }
  }

  const fetchKnockoutStatus = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/generate-knockout`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setKnockoutStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch knockout status:', error)
    }
  }

  const handleGenerateSchedule = async (competitorIds: number[], numberOfGroups: number, seedIds?: number[]) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/generate-schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitorIds,
          seedIds: seedIds || [],
          clearExisting: competition?._count?.rounds ? competition._count.rounds > 0 : false,
          mode: 'group',
          numberOfGroups,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCompetition(data.competition)
        setShowGenerateModal(false)
        fetchKnockoutStatus()
        alert(data.message)
      } else {
        const error = await response.json()
        alert(error.message || 'Generiranje rasporeda nije uspjelo')
      }
    } catch (error) {
      console.error('Generate schedule error:', error)
      alert('Generiranje rasporeda nije uspjelo')
    }
  }

  const handleGenerateKnockout = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    if (!confirm('Generiraj eliminacijsku fazu iz pobjednika grupa?')) return

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/generate-knockout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchCompetition()
        await fetchKnockoutStatus()
        setActiveTab('knockout')
        alert(data.message)
      } else {
        const error = await response.json()
        alert(error.message || 'Generiranje eliminacija nije uspjelo')
      }
    } catch (error) {
      console.error('Generate knockout error:', error)
      alert('Generiranje eliminacija nije uspjelo')
    }
  }

  const handleAdvanceKnockout = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    if (!confirm('Generiraj sljedeći krug eliminacija?')) return

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/advance-knockout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchCompetition()
        await fetchKnockoutStatus()
        alert(data.message)
      } else {
        const error = await response.json()
        alert(error.message || 'Napredovanje nije uspjelo')
      }
    } catch (error) {
      console.error('Advance knockout error:', error)
      alert('Napredovanje nije uspjelo')
    }
  }

  const handleUpdateMatch = async (matchId: number, data: any) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch(`/api/admin/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchCompetition()
        await fetchKnockoutStatus()
        setShowMatchModal(false)
        setEditingMatch(null)
      } else {
        const error = await response.json()
        alert(error.message || 'Ažuriranje meča nije uspjelo')
      }
    } catch (error) {
      console.error('Update match error:', error)
      alert('Ažuriranje meča nije uspjelo')
    }
  }

  const handleQuickEntry = async (matchResults: { id: number; homeEggsBroken: number; awayEggsBroken: number }[]) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      for (const result of matchResults) {
        await fetch(`/api/admin/matches/${result.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            homeEggsBroken: result.homeEggsBroken,
            awayEggsBroken: result.awayEggsBroken,
            status: 'completed',
          }),
        })
      }
      await fetchCompetition()
      await fetchKnockoutStatus()
      alert('Rezultati uspješno spremljeni!')
    } catch (error) {
      console.error('Quick entry error:', error)
      alert('Spremanje rezultata nije uspjelo')
    }
  }

  const handleRecalculateRankings = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    try {
      const response = await fetch('/api/admin/rankings/recalculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ competitionId: parseInt(competitionId) }),
      })

      if (response.ok) {
        await fetchCompetition()
        alert('BRJ rang lista uspješno preračunata!')
      } else {
        const error = await response.json()
        alert(error.message || 'Preračunavanje nije uspjelo')
      }
    } catch (error) {
      console.error('Recalculate error:', error)
      alert('Preračunavanje nije uspjelo')
    }
  }

  if (loading || !competition) {
    return (
      <AdminLayout title="Učitavanje..." description="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  // Separate group rounds and knockout rounds
  const groupRounds = competition.rounds.filter(r => r.roundType === 'group')
  const knockoutRounds = competition.rounds.filter(r => r.roundType !== 'group')

  // Group rounds by group number
  const groupedRounds = groupRounds.reduce((acc, round) => {
    const key = `Grupa ${String.fromCharCode(64 + (round.groupNumber || 0))}`
    if (!acc[key]) acc[key] = []
    acc[key].push(round)
    return acc
  }, {} as Record<string, Round[]>)

  // Calculate group progress
  const groupProgress = Object.entries(groupedRounds).map(([groupName, rounds]) => {
    const allMatches = rounds.flatMap(r => r.matches)
    const completed = allMatches.filter(m => m.status === 'completed').length
    return {
      name: groupName,
      total: allMatches.length,
      completed,
      percentage: allMatches.length > 0 ? Math.round((completed / allMatches.length) * 100) : 0,
    }
  })

  const totalGroupMatches = groupProgress.reduce((sum, g) => sum + g.total, 0)
  const completedGroupMatches = groupProgress.reduce((sum, g) => sum + g.completed, 0)
  const groupPhaseComplete = totalGroupMatches > 0 && completedGroupMatches === totalGroupMatches

  // Get current knockout round
  const currentKnockoutRound = knockoutRounds.length > 0 
    ? knockoutRounds.sort((a, b) => b.roundNumber - a.roundNumber)[0]
    : null
  const allKnockoutMatchesComplete = currentKnockoutRound?.matches.every(m => m.status === 'completed') ?? false

  return (
    <AdminLayout title={competition.name} description="Detalji turnira">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-primary-900">{competition.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  competition.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                  competition.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  competition.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {competition.status === 'ongoing' ? 'U tijeku' :
                   competition.status === 'completed' ? 'Završen' :
                   competition.status === 'upcoming' ? 'Nadolazeći' : 'Otkazan'}
                </span>
              </div>
              <p className="text-gray-600">
                {formatDate(competition.startDate)}
                {competition.endDate && ` - ${formatDate(competition.endDate)}`}
                {competition.location && ` • 📍 ${competition.location}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                🥚 {competition.eggsPerCompetitor} jaja po natjecatelju • {competition.numberOfGroups} grupa
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {competition.rounds.length === 0 && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="btn-primary"
                >
                  🥚 Generiraj grupe
                </button>
              )}
              <button
                onClick={handleRecalculateRankings}
                className="btn-secondary"
              >
                📊 Preračunaj BRJ
              </button>
            </div>
          </div>

          {/* Tournament Progress */}
          {competition.rounds.length > 0 && (
            <div className="mt-6 pt-6 border-t border-cream-200">
              <h3 className="font-semibold text-primary-900 mb-4">Napredak turnira</h3>
              
              {/* Group Phase Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Grupna faza</span>
                  <span className="text-sm text-gray-500">{completedGroupMatches}/{totalGroupMatches} mečeva</span>
                </div>
                <div className="w-full bg-cream-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all ${groupPhaseComplete ? 'bg-green-500' : 'bg-primary-500'}`}
                    style={{ width: `${totalGroupMatches > 0 ? (completedGroupMatches / totalGroupMatches) * 100 : 0}%` }}
                  />
                </div>
                {groupPhaseComplete && !knockoutStatus?.knockoutExists && (
                  <div className="mt-3">
                    <button
                      onClick={handleGenerateKnockout}
                      className="btn-primary text-sm"
                    >
                      🏆 Generiraj eliminacijsku fazu
                    </button>
                  </div>
                )}
              </div>

              {/* Knockout Phase Progress */}
              {knockoutRounds.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Eliminacijska faza</span>
                    <span className="text-sm text-gray-500">
                      {currentKnockoutRound?.name || 'Nije započeta'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {knockoutRounds.map(round => (
                      <div 
                        key={round.id}
                        className={`flex-1 p-2 rounded-lg text-center text-xs font-medium ${
                          round.matches.every(m => m.status === 'completed')
                            ? 'bg-green-100 text-green-700'
                            : round.matches.some(m => m.status === 'completed')
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-cream-100 text-gray-500'
                        }`}
                      >
                        {getRoundShortName(round.roundType)}
                      </div>
                    ))}
                  </div>
                  {allKnockoutMatchesComplete && currentKnockoutRound?.roundType !== 'final' && (
                    <div className="mt-3">
                      <button
                        onClick={handleAdvanceKnockout}
                        className="btn-primary text-sm"
                      >
                        ➡️ Generiraj sljedeći krug
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-cream-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{competition._count?.rankings ?? 0}</div>
              <div className="text-sm text-gray-500">Natjecatelja</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{Object.keys(groupedRounds).length}</div>
              <div className="text-sm text-gray-500">Grupa</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{knockoutRounds.length}</div>
              <div className="text-sm text-gray-500">Elim. krugova</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {(competition.matches || []).filter(m => m.status === 'completed').length}/{competition._count?.matches ?? 0}
              </div>
              <div className="text-sm text-gray-500">Odigrani mečevi</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-primary-600 text-white'
                : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
            }`}
          >
            Grupna faza ({Object.keys(groupedRounds).length})
          </button>
          {knockoutRounds.length > 0 && (
            <button
              onClick={() => setActiveTab('knockout')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                activeTab === 'knockout'
                  ? 'bg-primary-600 text-white'
                  : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
              }`}
            >
              Eliminacije 🏆
            </button>
          )}
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'rankings'
                ? 'bg-primary-600 text-white'
                : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
            }`}
          >
            BRJ Rang lista
          </button>
          <button
            onClick={() => setActiveTab('quick-entry')}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === 'quick-entry'
                ? 'bg-primary-600 text-white'
                : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
            }`}
          >
            Brzi unos
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            {groupRounds.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-4">🥚</div>
                <p className="text-gray-600 mb-4">Raspored još nije generiran.</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="btn-primary"
                >
                  Generiraj raspored po grupama
                </button>
              </div>
            ) : (
              <>
                {/* Group Progress Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {groupProgress.map((group) => (
                    <div key={group.name} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-primary-900">{group.name}</span>
                        <span className={`text-sm ${group.percentage === 100 ? 'text-green-600' : 'text-gray-500'}`}>
                          {group.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-cream-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${group.percentage === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {group.completed}/{group.total} mečeva
                      </div>
                    </div>
                  ))}
                </div>

                {/* Group Standings from API */}
                {knockoutStatus?.groupStandings && knockoutStatus.groupStandings.length > 0 && (
                  <div className="card">
                    <div className="p-4 bg-primary-600 text-white">
                      <h3 className="font-semibold">Poredak po grupama</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-cream-200">
                      {Array.from(new Set(knockoutStatus.groupStandings.map(s => s.groupNumber))).map(groupNum => {
                        const groupStandings = knockoutStatus.groupStandings!
                          .filter(s => s.groupNumber === groupNum)
                          .sort((a, b) => b.wins - a.wins || b.weightedPoints - a.weightedPoints || b.eggsBroken - a.eggsBroken)
                        
                        return (
                          <div key={groupNum} className="bg-white p-4">
                            <h4 className="font-semibold text-primary-900 mb-3">Grupa {String.fromCharCode(64 + groupNum)}</h4>
                            {/* Header s objašnjenjem kolona */}
                            <div className="flex items-center px-2 pb-2 mb-2 border-b border-cream-200 text-xs text-gray-500">
                              <span className="flex-1">Natjecatelj</span>
                              <span className="w-10 text-center text-gold-600" title="Broj Razbijenih Jaja">BRJ</span>
                              <span className="w-8 text-center text-green-600" title="Pobjede">Pob.</span>
                              <span className="w-8 text-center text-red-600" title="Porazi">Por.</span>
                            </div>
                            <div className="space-y-2">
                              {groupStandings.map((standing, idx) => (
                                <div 
                                  key={standing.competitorId}
                                  className={`flex items-center px-2 py-2 rounded ${idx === 0 ? 'bg-green-50' : ''}`}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                      idx === 0 ? 'bg-green-500 text-white' : 'bg-cream-200 text-gray-600'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className="text-sm font-medium truncate max-w-[100px]">
                                      {standing.competitorName}
                                    </span>
                                  </div>
                                  <span className="w-10 text-center text-xs text-gold-600 font-bold">{standing.weightedPoints}</span>
                                  <span className="w-8 text-center text-xs text-green-600">{standing.wins}</span>
                                  <span className="w-8 text-center text-xs text-red-600">{standing.losses}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Group Matches */}
                {Object.entries(groupedRounds).map(([groupName, rounds]) => (
                  <div key={groupName} className="card">
                    <div className="p-4 bg-primary-600 text-white flex items-center justify-between">
                      <h3 className="font-semibold">{groupName}</h3>
                      <span className="text-sm opacity-80">
                        {rounds.flatMap(r => r.matches).filter(m => m.status === 'completed').length}/
                        {rounds.flatMap(r => r.matches).length} mečeva
                      </span>
                    </div>
                    {rounds.map((round) => (
                      <div key={round.id}>
                        <div className="p-3 bg-cream-50 border-b border-cream-200">
                          <span className="text-sm font-medium text-gray-700">{round.name}</span>
                        </div>
                        <div className="divide-y divide-cream-100">
                          {round.matches.map((match) => (
                            <MatchRow
                              key={match.id}
                              match={match}
                              onClick={() => {
                                setEditingMatch(match)
                                setShowMatchModal(true)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'knockout' && (
          <div className="space-y-6">
            {knockoutRounds.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-4">🏆</div>
                <p className="text-gray-600 mb-4">
                  {groupPhaseComplete 
                    ? 'Grupna faza završena. Spremno za eliminacije!'
                    : `Završite grupnu fazu prvo (${completedGroupMatches}/${totalGroupMatches} mečeva)`}
                </p>
                {groupPhaseComplete && (
                  <button
                    onClick={handleGenerateKnockout}
                    className="btn-primary"
                  >
                    Generiraj eliminacijsku fazu
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Bracket View */}
                <div className="card p-6">
                  <h3 className="font-semibold text-primary-900 mb-6">Eliminacijska tablica</h3>
                  <div className="flex gap-8 overflow-x-auto pb-4">
                    {knockoutRounds
                      .sort((a, b) => a.roundNumber - b.roundNumber)
                      .map((round) => (
                        <div key={round.id} className="min-w-[280px]">
                          <div className="text-center mb-4">
                            <span className="text-sm font-semibold text-primary-900">{round.name}</span>
                            <span className="text-xs text-gray-500 block">×{round.pointMultiplier} bodova</span>
                          </div>
                          <div className="space-y-4">
                            {round.matches.map((match) => (
                              <div 
                                key={match.id}
                                className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                                  match.status === 'completed' ? 'border-green-300' : 'border-cream-200'
                                }`}
                                onClick={() => {
                                  setEditingMatch(match)
                                  setShowMatchModal(true)
                                }}
                              >
                                <div className={`p-3 flex items-center justify-between ${
                                  match.result === 'home_win' ? 'bg-green-50' : 'bg-white'
                                }`}>
                                  <span className="font-medium text-sm">{match.homeCompetitor.name}</span>
                                  <span className={`font-bold ${match.result === 'home_win' ? 'text-green-600' : ''}`}>
                                    {match.status === 'completed' ? match.homeEggsBroken : '-'}
                                  </span>
                                </div>
                                <div className="border-t border-cream-200" />
                                <div className={`p-3 flex items-center justify-between ${
                                  match.result === 'away_win' ? 'bg-green-50' : 'bg-white'
                                }`}>
                                  <span className="font-medium text-sm">{match.awayCompetitor.name}</span>
                                  <span className={`font-bold ${match.result === 'away_win' ? 'text-green-600' : ''}`}>
                                    {match.status === 'completed' ? match.awayEggsBroken : '-'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Advance Button */}
                {allKnockoutMatchesComplete && currentKnockoutRound?.roundType !== 'final' && (
                  <div className="card p-6 text-center bg-gold-50">
                    <p className="text-gold-800 mb-4">
                      Svi mečevi u {currentKnockoutRound?.name} su završeni!
                    </p>
                    <button
                      onClick={handleAdvanceKnockout}
                      className="btn-primary"
                    >
                      ➡️ Generiraj sljedeći krug
                    </button>
                  </div>
                )}

                {/* Final Winner */}
                {currentKnockoutRound?.roundType === 'final' && allKnockoutMatchesComplete && (
                  <div className="card p-8 text-center bg-gradient-to-b from-gold-100 to-gold-50">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold text-primary-900 mb-2">Pobjednik turnira!</h2>
                    {currentKnockoutRound.matches[0] && (
                      <p className="text-xl text-gold-700 font-semibold">
                        {currentKnockoutRound.matches[0].result === 'home_win'
                          ? currentKnockoutRound.matches[0].homeCompetitor.name
                          : currentKnockoutRound.matches[0].awayCompetitor.name}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'rankings' && (
          <RankingsTab 
            rankings={competition.rankings}
            onRecalculate={handleRecalculateRankings}
          />
        )}

        {activeTab === 'quick-entry' && (
          <QuickEntryTab
            rounds={competition.rounds}
            onSave={handleQuickEntry}
          />
        )}

        {/* Generate Schedule Modal */}
        {showGenerateModal && (
          <GenerateScheduleModal
            competitors={allCompetitors}
            existingCompetitors={competition.rankings.map(r => r.competitor.id)}
            defaultGroups={competition.numberOfGroups}
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleGenerateSchedule}
          />
        )}

        {/* Edit Match Modal */}
        {showMatchModal && editingMatch && (
          <MatchModal
            match={editingMatch}
            onClose={() => {
              setShowMatchModal(false)
              setEditingMatch(null)
            }}
            onSave={(data) => handleUpdateMatch(editingMatch.id, data)}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// Helper function
function getRoundShortName(roundType: string): string {
  switch (roundType) {
    case 'round_of_16': return '1/8'
    case 'quarterfinal': return '1/4'
    case 'semifinal': return '1/2'
    case 'third_place': return '3.'
    case 'final': return 'F'
    default: return roundType
  }
}

// Match Row Component
function MatchRow({ match, onClick }: { match: Match; onClick: () => void }) {
  return (
    <div
      className="p-4 flex items-center justify-between hover:bg-cream-50 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="text-right flex-1">
          <span className={`font-medium ${match.result === 'home_win' ? 'text-green-600' : 'text-primary-900'}`}>
            {match.homeCompetitor.name}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-[100px] justify-center">
          {match.status === 'completed' ? (
            <span className="font-bold text-lg">
              <span className={match.result === 'home_win' ? 'text-green-600' : ''}>
                {match.homeEggsBroken}
              </span>
              <span className="mx-2 text-gray-400">:</span>
              <span className={match.result === 'away_win' ? 'text-green-600' : ''}>
                {match.awayEggsBroken}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">vs</span>
          )}
        </div>
        <div className="flex-1">
          <span className={`font-medium ${match.result === 'away_win' ? 'text-green-600' : 'text-primary-900'}`}>
            {match.awayCompetitor.name}
          </span>
        </div>
      </div>
      <div className="ml-4">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          match.status === 'completed' ? 'bg-green-100 text-green-700' :
          match.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {match.status === 'completed' ? '✓' : '○'}
        </span>
      </div>
    </div>
  )
}

// Rankings Tab Component
function RankingsTab({ rankings, onRecalculate }: { rankings: Ranking[]; onRecalculate: () => void }) {
  const sortedRankings = [...rankings].sort((a, b) => (a.position || 999) - (b.position || 999) || b.wins - a.wins || b.weightedPoints - a.weightedPoints)

  return (
    <div className="card overflow-hidden">
      <div className="p-4 bg-cream-50 border-b border-cream-200 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          BRJ bodovi = Broj razbijenih jaja × Multiplikator kruga
        </p>
        <button onClick={onRecalculate} className="btn-secondary text-sm">
          🔄 Preračunaj
        </button>
      </div>
      <table className="w-full">
        <thead className="bg-cream-50 border-b border-cream-200">
          <tr>
            <th className="text-left px-6 py-4 text-sm font-semibold text-primary-900">#</th>
            <th className="text-left px-4 py-4 text-sm font-semibold text-primary-900">Natjecatelj</th>
            <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">BRJ</th>
            <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">🥚</th>
            <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">P</th>
            <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">I</th>
            <th className="text-center px-4 py-4 text-sm font-semibold text-primary-900">+/-</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-100">
          {sortedRankings.map((ranking, index) => (
            <tr key={ranking.id} className={index < 3 ? 'bg-gold-50' : ''}>
              <td className="px-6 py-4">
                <span className={`font-bold ${
                  index === 0 ? 'text-2xl text-gold-600' :
                  index === 1 ? 'text-xl text-gray-500' :
                  index === 2 ? 'text-lg text-amber-700' :
                  'text-primary-900'
                }`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </span>
              </td>
              <td className="px-4 py-4 font-medium text-primary-900">{ranking.competitor.name}</td>
              <td className="text-center px-4 py-4">
                <span className="font-bold text-lg text-primary-600">{ranking.weightedPoints}</span>
              </td>
              <td className="text-center px-4 py-4">
                <span className="font-semibold text-gold-600">{ranking.eggsBroken}</span>
                <span className="text-gray-400 text-sm"> / {ranking.eggsLost}</span>
              </td>
              <td className="text-center px-4 py-4 text-green-600 font-medium">{ranking.wins}</td>
              <td className="text-center px-4 py-4 text-red-600 font-medium">{ranking.losses}</td>
              <td className="text-center px-4 py-4">
                <span className={ranking.eggsBroken - ranking.eggsLost >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {ranking.eggsBroken - ranking.eggsLost >= 0 ? '+' : ''}{ranking.eggsBroken - ranking.eggsLost}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rankings.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-500">Nema podataka za BRJ rang listu</p>
        </div>
      )}
    </div>
  )
}

// Quick Entry Tab Component
function QuickEntryTab({
  rounds,
  onSave,
}: {
  rounds: Round[]
  onSave: (results: { id: number; homeEggsBroken: number; awayEggsBroken: number }[]) => void
}) {
  const [selectedRound, setSelectedRound] = useState<number>(rounds[0]?.id || 0)
  const [results, setResults] = useState<Record<number, { home: string; away: string }>>({})

  const currentRound = rounds.find(r => r.id === selectedRound)
  const pendingMatches = currentRound?.matches.filter(m => m.status !== 'completed') || []

  const handleSave = () => {
    const matchResults = Object.entries(results)
      .filter(([_, scores]) => scores.home !== '' && scores.away !== '')
      .map(([id, scores]) => ({
        id: parseInt(id),
        homeEggsBroken: parseInt(scores.home),
        awayEggsBroken: parseInt(scores.away),
      }))

    if (matchResults.length === 0) {
      alert('Unesite barem jedan rezultat')
      return
    }

    onSave(matchResults)
    setResults({})
  }

  return (
    <div className="card p-6">
      <div className="mb-6">
        <label className="label-field">Odaberi kolo</label>
        <select
          value={selectedRound}
          onChange={(e) => {
            setSelectedRound(parseInt(e.target.value))
            setResults({})
          }}
          className="input-field w-full sm:w-64"
        >
          {rounds.map(round => (
            <option key={round.id} value={round.id}>
              {round.name} (×{round.pointMultiplier})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Unesite broj razbijenih jaja za svakog natjecatelja
        </p>
      </div>

      {pendingMatches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">✓ Svi mečevi u ovom kolu su završeni</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pendingMatches.map(match => (
              <div key={match.id} className="flex items-center gap-4 p-4 bg-cream-50 rounded-xl">
                <div className="flex-1 text-right font-medium">{match.homeCompetitor.name}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={results[match.id]?.home || ''}
                    onChange={(e) => setResults({
                      ...results,
                      [match.id]: { ...results[match.id], home: e.target.value, away: results[match.id]?.away || '' }
                    })}
                    className="w-16 text-center input-field py-2"
                    placeholder="🥚"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="number"
                    min="0"
                    value={results[match.id]?.away || ''}
                    onChange={(e) => setResults({
                      ...results,
                      [match.id]: { ...results[match.id], away: e.target.value, home: results[match.id]?.home || '' }
                    })}
                    className="w-16 text-center input-field py-2"
                    placeholder="🥚"
                  />
                </div>
                <div className="flex-1 font-medium">{match.awayCompetitor.name}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="btn-primary">
              Spremi sve rezultate
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Generate Schedule Modal
function GenerateScheduleModal({
  competitors,
  existingCompetitors,
  defaultGroups,
  onClose,
  onGenerate,
}: {
  competitors: Competitor[]
  existingCompetitors: number[]
  defaultGroups: number
  onClose: () => void
  onGenerate: (ids: number[], groups: number, seedIds?: number[]) => void
}) {
  const [selected, setSelected] = useState<number[]>(existingCompetitors)
  const [seedIds, setSeedIds] = useState<number[]>([])
  const [numberOfGroups, setNumberOfGroups] = useState(defaultGroups)

  const toggleCompetitor = (id: number) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        setSeedIds(s => s.filter(sid => sid !== id))
        return prev.filter(c => c !== id)
      }
      return [...prev, id]
    })
  }

  const toggleSeed = (id: number) => {
    setSeedIds(prev => {
      if (prev.includes(id)) return prev.filter(sid => sid !== id)
      if (prev.length >= numberOfGroups) return prev
      return [...prev, id]
    })
  }

  const competitorsPerGroup = selected.length > 0 ? Math.ceil(selected.length / numberOfGroups) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-primary-900 mb-4">Generiraj raspored po grupama</h2>
        
        {existingCompetitors.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            Postojeći raspored će biti obrisan i zamijenjen novim.
          </div>
        )}

        <div className="mb-4">
          <label className="label-field">Broj grupa</label>
          <select
            value={numberOfGroups}
            onChange={(e) => setNumberOfGroups(parseInt(e.target.value))}
            className="input-field"
          >
            {[2, 4, 6, 8, 10, 12].map(n => (
              <option key={n} value={n}>{n} grupa</option>
            ))}
          </select>
          {selected.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ~{competitorsPerGroup} natjecatelja po grupi
            </p>
          )}
        </div>

        {/* Seeds info */}
        {seedIds.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-amber-800">
                Nositelji grupa: {seedIds.length}/{numberOfGroups}
              </span>
              <button
                type="button"
                onClick={() => setSeedIds([])}
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Ukloni sve nositelje
              </button>
            </div>
            <p className="text-xs text-amber-700">
              Svaki nositelj bit će raspoređen u zasebnu grupu. Članovi iste obitelji neće biti u istoj grupi.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">
            Odaberi natjecatelje ({selected.length} odabrano, potrebno min. 2)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(competitors.map(c => c.id))}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Odaberi sve
            </button>
            {selected.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => { setSelected([]); setSeedIds([]) }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Poništi
                </button>
              </>
            )}
          </div>
        </div>

        <div className="border border-cream-200 rounded-xl max-h-64 overflow-y-auto mb-4">
          {competitors.map(comp => {
            const isSelected = selected.includes(comp.id)
            const isSeed = seedIds.includes(comp.id)
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
                  <span className="text-gold-600">🥚 {comp.totalEggsBroken}</span>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => toggleSeed(comp.id)}
                      title={isSeed ? 'Ukloni nositelja' : 'Postavi kao nositelja grupe'}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors text-base ${
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
        </div>

        {seedIds.length > numberOfGroups && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            Previše nositelja ({seedIds.length}) za {numberOfGroups} grupa.
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">Odustani</button>
          <button
            onClick={() => onGenerate(selected, numberOfGroups, seedIds)}
            disabled={selected.length < 2 || seedIds.length > numberOfGroups}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            Generiraj
          </button>
        </div>
      </div>
    </div>
  )
}

// Match Modal
function MatchModal({
  match,
  onClose,
  onSave,
}: {
  match: Match
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [homeEggsBroken, setHomeEggsBroken] = useState(match.homeEggsBroken.toString())
  const [awayEggsBroken, setAwayEggsBroken] = useState(match.awayEggsBroken.toString())
  const [status, setStatus] = useState(match.status)
  const [matchDate, setMatchDate] = useState(
    match.matchDate ? new Date(match.matchDate).toISOString().slice(0, 16) : ''
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      homeEggsBroken: parseInt(homeEggsBroken),
      awayEggsBroken: parseInt(awayEggsBroken),
      status,
      matchDate: matchDate || null,
    })
    setLoading(false)
  }

  const multiplier = match.round?.pointMultiplier || 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-primary-900 mb-6">Uredi meč 🥚</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center p-4 bg-cream-50 rounded-xl mb-4">
            <div className="font-medium text-primary-900 mb-2">
              {match.homeCompetitor.name} vs {match.awayCompetitor.name}
            </div>
            {match.round && (
              <div className="text-sm text-gray-500">
                {match.round.name} • ×{multiplier} bodova
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 text-center">
            Unesite broj razbijenih jaja protivniku
          </p>

          <div className="flex items-center gap-4 justify-center">
            <div className="text-center">
              <label className="block text-sm text-gray-600 mb-1">{match.homeCompetitor.name}</label>
              <input
                type="number"
                min="0"
                value={homeEggsBroken}
                onChange={(e) => setHomeEggsBroken(e.target.value)}
                className="w-20 text-center input-field text-lg font-bold"
                placeholder="🥚"
              />
              {parseInt(homeEggsBroken) > 0 && (
                <div className="text-xs text-gold-600 mt-1">
                  = {parseInt(homeEggsBroken) * multiplier} bodova
                </div>
              )}
            </div>
            <span className="text-2xl text-gray-400 mt-6">:</span>
            <div className="text-center">
              <label className="block text-sm text-gray-600 mb-1">{match.awayCompetitor.name}</label>
              <input
                type="number"
                min="0"
                value={awayEggsBroken}
                onChange={(e) => setAwayEggsBroken(e.target.value)}
                className="w-20 text-center input-field text-lg font-bold"
                placeholder="🥚"
              />
              {parseInt(awayEggsBroken) > 0 && (
                <div className="text-xs text-gold-600 mt-1">
                  = {parseInt(awayEggsBroken) * multiplier} bodova
                </div>
              )}
            </div>
          </div>

          {parseInt(homeEggsBroken) > 0 && parseInt(awayEggsBroken) > 0 && (
            <div className="text-center text-sm">
              {parseInt(homeEggsBroken) > parseInt(awayEggsBroken) ? (
                <span className="text-green-600 font-medium">🏆 Pobjednik: {match.homeCompetitor.name}</span>
              ) : parseInt(awayEggsBroken) > parseInt(homeEggsBroken) ? (
                <span className="text-green-600 font-medium">🏆 Pobjednik: {match.awayCompetitor.name}</span>
              ) : (
                <span className="text-yellow-600 font-medium">⚠️ Izjednačeno - potrebno odlučiti</span>
              )}
            </div>
          )}

          <div>
            <label className="label-field">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field"
            >
              <option value="scheduled">Zakazan</option>
              <option value="ongoing">U tijeku</option>
              <option value="completed">Završen</option>
              <option value="cancelled">Otkazan</option>
            </select>
          </div>

          <div>
            <label className="label-field">Datum i vrijeme</label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Odustani
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Spremanje...' : 'Spremi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
