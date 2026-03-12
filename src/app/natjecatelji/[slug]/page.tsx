'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Match {
  id: number
  homeEggsBroken: number
  awayEggsBroken: number
  result: string | null
  matchDate: string | null
  status: string
  homeCompetitor?: { id: number; name: string; slug: string }
  awayCompetitor?: { id: number; name: string; slug: string }
  competition?: { id: number; name: string; slug: string } | null
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
  competition: { id: number; name: string; slug: string } | null
}

interface Competitor {
  id: number
  name: string
  slug: string
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  profileImage: string | null
  bio: string | null
  isActive: boolean
  totalWins: number
  totalLosses: number
  totalEggsBroken: number
  totalEggsLost: number
  createdAt: string
  homeMatches: Match[]
  awayMatches: Match[]
  rankings: Ranking[]
}

export default function CompetitorProfilePage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [competitor, setCompetitor] = useState<Competitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompetitor = async () => {
      try {
        const response = await fetch(`/api/competitors/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Natjecatelj nije pronađen')
          } else {
            setError('Greška pri učitavanju podataka')
          }
          return
        }
        const data = await response.json()
        setCompetitor(data)
      } catch (err) {
        setError('Greška pri učitavanju podataka')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCompetitor()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !competitor) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Natjecatelj nije pronađen'}
            </h1>
            <Link
              href="/natjecatelji"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              ← Natrag na natjecatelje
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Combine and sort all matches by date
  const allMatches = [
    ...competitor.homeMatches.map(m => ({ ...m, isHome: true })),
    ...competitor.awayMatches.map(m => ({ ...m, isHome: false })),
  ].sort((a, b) => {
    if (!a.matchDate && !b.matchDate) return 0
    if (!a.matchDate) return 1
    if (!b.matchDate) return -1
    return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
  })

  const totalMatches = competitor.totalWins + competitor.totalLosses
  const winRate = totalMatches > 0 ? (competitor.totalWins / totalMatches) * 100 : 0
  const eggEfficiency = competitor.totalEggsLost > 0 
    ? (competitor.totalEggsBroken / competitor.totalEggsLost).toFixed(2) 
    : competitor.totalEggsBroken > 0 ? '∞' : '0.00'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Back Button */}
        <Link
          href="/natjecatelji"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Natrag na natjecatelje
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 h-32 sm:h-40"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end -mt-16 sm:-mt-20">
              {/* Profile Image */}
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
                {competitor.profileImage ? (
                  <Image
                    src={competitor.profileImage}
                    alt={competitor.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold-200 to-gold-400 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl">🥚</span>
                  </div>
                )}
              </div>
              
              {/* Name and Location */}
              <div className="mt-4 sm:mt-0 sm:ml-6 sm:pb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {competitor.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  📍 {competitor.city || 'Nepoznato'}, {competitor.country || 'Bosna i Hercegovina'}
                </p>
                {!competitor.isActive && (
                  <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                    Neaktivan
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {competitor.bio && (
              <div className="mt-6 p-4 bg-cream-50 rounded-xl border border-gold-200">
                <p className="text-gray-700">{competitor.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary-600">
              {competitor.totalEggsBroken}
            </div>
            <div className="text-sm text-gray-500 mt-1">BRJ (Razbijena jaja)</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-green-600">
              {competitor.totalWins}
            </div>
            <div className="text-sm text-gray-500 mt-1">Pobjeda</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-red-500">
              {competitor.totalLosses}
            </div>
            <div className="text-sm text-gray-500 mt-1">Poraza</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-gold-600">
              {winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Postotak pobjeda</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Detaljna statistika</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Ukupno mečeva</div>
              <div className="text-2xl font-bold text-gray-900">{totalMatches}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Razbijena protivnička jaja</div>
              <div className="text-2xl font-bold text-primary-600">{competitor.totalEggsBroken}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Izgubljena vlastita jaja</div>
              <div className="text-2xl font-bold text-red-500">{competitor.totalEggsLost}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Učinkovitost (omjer)</div>
              <div className="text-2xl font-bold text-gold-600">{eggEfficiency}</div>
            </div>
          </div>
        </div>

        {/* Tournament Rankings */}
        {competitor.rankings.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Rezultati po turnirima</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Turnir</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Plasman</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Bodovi</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">P/I</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">BRJ</th>
                  </tr>
                </thead>
                <tbody>
                  {competitor.rankings.map((ranking) => (
                    <tr key={ranking.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {ranking.competition ? (
                          <Link
                            href={`/turniri/${ranking.competition.slug}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {ranking.competition.name}
                          </Link>
                        ) : (
                          <span className="text-gray-500">Opća rang lista</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full font-bold
                          ${ranking.position === 1 ? 'bg-yellow-100 text-yellow-700' :
                            ranking.position === 2 ? 'bg-gray-100 text-gray-700' :
                            ranking.position === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-600'}
                        `}>
                          {ranking.position}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-primary-600">
                        {ranking.weightedPoints}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-green-600">{ranking.wins}</span>
                        {' / '}
                        <span className="text-red-500">{ranking.losses}</span>
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-gold-600">
                        {ranking.eggsBroken}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Match History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Povijest mečeva</h2>
          
          {allMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nema odigranih mečeva</p>
          ) : (
            <div className="space-y-3">
              {allMatches.slice(0, 20).map((match) => {
                const isHome = 'isHome' in match && match.isHome
                const opponent = isHome ? match.awayCompetitor : match.homeCompetitor
                const competitorScore = isHome ? match.homeEggsBroken : match.awayEggsBroken
                const opponentScore = isHome ? match.awayEggsBroken : match.homeEggsBroken
                
                const isWin = (isHome && match.result === 'home_win') || (!isHome && match.result === 'away_win')
                const isLoss = (isHome && match.result === 'away_win') || (!isHome && match.result === 'home_win')
                
                return (
                  <div
                    key={`${match.id}-${isHome ? 'home' : 'away'}`}
                    className={`
                      flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border
                      ${match.status === 'completed' 
                        ? isWin ? 'bg-green-50 border-green-200' 
                          : isLoss ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50 border-gray-200'
                        : 'bg-gray-50 border-gray-200'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Result Icon */}
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                        ${match.status === 'completed'
                          ? isWin ? 'bg-green-200 text-green-700' 
                            : isLoss ? 'bg-red-200 text-red-700'
                            : 'bg-gray-200 text-gray-600'
                          : 'bg-gray-200 text-gray-600'}
                      `}>
                        {match.status === 'completed' 
                          ? (isWin ? 'W' : isLoss ? 'L' : '?')
                          : '⏳'}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          vs {opponent?.name || 'Nepoznat'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {match.competition?.name || 'Prijateljski meč'}
                          {match.matchDate && (
                            <> • {new Date(match.matchDate).toLocaleDateString('hr-HR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="mt-3 sm:mt-0 text-right">
                      {match.status === 'completed' ? (
                        <div className="text-xl font-bold">
                          <span className={isWin ? 'text-green-600' : isLoss ? 'text-red-500' : 'text-gray-700'}>
                            {competitorScore}
                          </span>
                          <span className="text-gray-400 mx-2">:</span>
                          <span className={isLoss ? 'text-green-600' : isWin ? 'text-red-500' : 'text-gray-700'}>
                            {opponentScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                          {match.status === 'scheduled' ? 'Zakazano' : 
                           match.status === 'in_progress' ? 'U tijeku' : 
                           match.status === 'cancelled' ? 'Otkazano' : match.status}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {allMatches.length > 20 && (
                <p className="text-center text-gray-500 text-sm pt-4">
                  Prikazano prvih 20 mečeva od ukupno {allMatches.length}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Member Since */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          Član od {new Date(competitor.createdAt).toLocaleDateString('hr-HR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  )
}
