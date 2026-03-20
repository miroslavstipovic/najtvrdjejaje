import { getCompetitionBySlug, getAllCompetitions } from '@/lib/services/competitionService'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const competitions = await getAllCompetitions()
  return competitions.map((competition) => ({
    slug: competition.slug,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const competition = await getCompetitionBySlug(slug)
  
  if (!competition) {
    return { title: 'Turnir nije pronađen' }
  }
  
  return {
    title: `${competition.name} | Najtvrđe Jaje`,
    description: competition.description || `Detalji turnira ${competition.name}`,
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'upcoming':
      return <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">Predstojeći</span>
    case 'ongoing':
      return <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">U toku</span>
    case 'completed':
      return <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">Završen</span>
    case 'cancelled':
      return <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">Otkazan</span>
    default:
      return null
  }
}

function getRoundTypeName(roundType: string, roundName?: string) {
  switch (roundType) {
    case 'group':
      return 'Grupna faza'
    case 'knockout':
      return roundName || 'Eliminacijski krug'
    case 'round_of_16':
      return 'Osmina finala'
    case 'quarterfinal':
      return 'Četvrtfinale'
    case 'semifinal':
      return 'Polufinale'
    case 'third_place':
      return 'Utakmica za 3. mjesto'
    case 'final':
      return 'Finale'
    default:
      return roundType
  }
}

export default async function TurnirPage({ params }: PageProps) {
  const { slug } = await params
  const competition = await getCompetitionBySlug(slug)
  
  if (!competition || !competition.isPublished) {
    notFound()
  }

  // Grupiraj runde po tipu i broju grupe
  const groupRounds = competition.rounds.filter(r => r.roundType === 'group')
  const knockoutRounds = competition.rounds.filter(r => r.roundType !== 'group')

  // Grupiraj po grupama
  const groups: { [key: number]: typeof groupRounds } = {}
  groupRounds.forEach(round => {
    const groupNum = round.groupNumber || 0
    if (!groups[groupNum]) {
      groups[groupNum] = []
    }
    groups[groupNum].push(round)
  })

  // Izračunaj rang liste po grupama
  const groupStandings: { [key: number]: any[] } = {}
  Object.keys(groups).forEach(groupNumStr => {
    const groupNum = parseInt(groupNumStr)
    const groupMatches = groups[groupNum].flatMap(r => r.matches)
    
    // Pronađi sve natjecatelje u grupi
    const competitorStats: { [id: number]: { 
      competitor: any, 
      wins: number, 
      losses: number, 
      eggsBroken: number, 
      eggsLost: number,
      points: number 
    }} = {}
    
    groupMatches.forEach(match => {
      // Home competitor
      if (!competitorStats[match.homeCompetitorId]) {
        competitorStats[match.homeCompetitorId] = {
          competitor: match.homeCompetitor,
          wins: 0, losses: 0, eggsBroken: 0, eggsLost: 0, points: 0
        }
      }
      // Away competitor
      if (!competitorStats[match.awayCompetitorId]) {
        competitorStats[match.awayCompetitorId] = {
          competitor: match.awayCompetitor,
          wins: 0, losses: 0, eggsBroken: 0, eggsLost: 0, points: 0
        }
      }
      
      if (match.status === 'completed') {
        competitorStats[match.homeCompetitorId].eggsBroken += match.homeEggsBroken || 0
        competitorStats[match.homeCompetitorId].eggsLost += match.awayEggsBroken || 0
        competitorStats[match.awayCompetitorId].eggsBroken += match.awayEggsBroken || 0
        competitorStats[match.awayCompetitorId].eggsLost += match.homeEggsBroken || 0
        
        if (match.result === 'home_win') {
          competitorStats[match.homeCompetitorId].wins++
          competitorStats[match.homeCompetitorId].points += match.homeEggsBroken || 0
          competitorStats[match.awayCompetitorId].losses++
        } else if (match.result === 'away_win') {
          competitorStats[match.awayCompetitorId].wins++
          competitorStats[match.awayCompetitorId].points += match.awayEggsBroken || 0
          competitorStats[match.homeCompetitorId].losses++
        }
      }
    })
    
    // Sortiraj po bodovima (razbijena jaja)
    groupStandings[groupNum] = Object.values(competitorStats)
      .sort((a, b) => b.points - a.points || b.eggsBroken - a.eggsBroken)
  })

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/turniri" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Natrag na turnire
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {getStatusBadge(competition.status)}
                {competition.isFeatured && (
                  <span className="bg-gold-100 text-gold-800 text-sm font-medium px-3 py-1 rounded-full">
                    ⭐ Istaknuto
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-2">
                {competition.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span>
                  📅 {new Date(competition.startDate).toLocaleDateString('hr-HR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {competition.location && (
                  <span>📍 {competition.location}</span>
                )}
              </div>
              {competition.description && (
                <p className="mt-4 text-gray-600">{competition.description}</p>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">
                  {competition.rankings.length}
                </div>
                <div className="text-sm text-gray-500">Natjecatelja</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">
                  {Object.keys(groups).length}
                </div>
                <div className="text-sm text-gray-500">Grupa</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">
                  {competition._count.matches}
                </div>
                <div className="text-sm text-gray-500">Mečeva</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grupna faza */}
        {Object.keys(groups).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              🏆 Grupna faza
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(groups).map(groupNumStr => {
                const groupNum = parseInt(groupNumStr)
                const standings = groupStandings[groupNum] || []
                const groupMatches = groups[groupNum].flatMap(r => r.matches)
                
                return (
                  <div key={groupNum} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="bg-primary-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-gold-200">Grupa {groupNum > 0 && groupNum <= 26 ? String.fromCharCode(64 + groupNum) : groupNum}</h3>
                    </div>
                    
                    {/* Tablica grupe */}
                    <div className="p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Natjecatelj</th>
                            <th className="text-center py-2 px-1 text-green-600" title="Pobjede">Pob.</th>
                            <th className="text-center py-2 px-1 text-red-600" title="Porazi">Por.</th>
                            <th className="text-center py-2 px-1 text-primary-600" title="Broj Razbijenih Jaja">BRJ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((stat, index) => (
                            <tr 
                              key={stat.competitor.id} 
                              className={`border-b border-gray-100 ${index === 0 ? 'bg-green-50' : ''}`}
                            >
                              <td className="py-2 px-2 font-medium">{index + 1}</td>
                              <td className="py-2 px-2">{stat.competitor.name}</td>
                              <td className="text-center py-2 px-1 text-green-600 font-medium">{stat.wins}</td>
                              <td className="text-center py-2 px-1 text-red-600 font-medium">{stat.losses}</td>
                              <td className="text-center py-2 px-1 font-bold text-primary-600">{stat.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mečevi grupe */}
                    <div className="border-t border-gray-200 p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Mečevi</h4>
                      <div className="space-y-2">
                        {groupMatches.map(match => (
                          <div 
                            key={match.id} 
                            className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                              match.status === 'completed' ? 'bg-gray-50' : 'bg-cream-50'
                            }`}
                          >
                            <div className="flex-1 text-right">
                              <span className={match.result === 'home_win' ? 'font-bold text-green-700' : ''}>
                                {match.homeCompetitor.name}
                              </span>
                            </div>
                            <div className="px-4 min-w-[80px] text-center">
                              {match.status === 'completed' ? (
                                <span className="font-bold">
                                  {match.homeEggsBroken} : {match.awayEggsBroken}
                                </span>
                              ) : (
                                <span className="text-gray-400">vs</span>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <span className={match.result === 'away_win' ? 'font-bold text-green-700' : ''}>
                                {match.awayCompetitor.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Eliminacijska faza */}
        {knockoutRounds.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              ⚔️ Eliminacijska faza
            </h2>
            
            <div className="space-y-6">
              {(() => {
                const knockoutByType = knockoutRounds.reduce((acc, round) => {
                  const key = round.roundType === 'knockout' ? `knockout_${round.roundNumber}` : round.roundType
                  if (!acc[key]) acc[key] = []
                  acc[key].push(round)
                  return acc
                }, {} as Record<string, typeof knockoutRounds>)
                
                const orderedKeys = Object.keys(knockoutByType).sort((a, b) => {
                  const order = ['knockout', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final']
                  const typeA = a.startsWith('knockout_') ? 'knockout' : a
                  const typeB = b.startsWith('knockout_') ? 'knockout' : b
                  const idxA = order.indexOf(typeA)
                  const idxB = order.indexOf(typeB)
                  if (idxA !== idxB) return idxA - idxB
                  const numA = knockoutByType[a][0]?.roundNumber || 0
                  const numB = knockoutByType[b][0]?.roundNumber || 0
                  return numA - numB
                })
                
                return orderedKeys.map(key => {
                  const rounds = knockoutByType[key]
                  const allMatches = rounds.flatMap(r => r.matches)
                  const roundType = rounds[0].roundType
                  const roundName = rounds[0].name
                
                return (
                  <div key={key} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className={`px-6 py-4 ${
                      roundType === 'final' ? 'bg-gold-500 text-white' : 'bg-primary-100 text-primary-900'
                    }`}>
                      <h3 className="text-lg font-bold">{getRoundTypeName(roundType, roundName)}</h3>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allMatches.map(match => (
                        <div 
                          key={match.id}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                            match.status === 'completed' 
                              ? 'border-gray-200 bg-gray-50' 
                              : 'border-primary-200 bg-primary-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className={`font-medium ${match.result === 'home_win' ? 'text-green-700 font-bold' : ''}`}>
                              {match.homeCompetitor.name}
                            </div>
                          </div>
                          
                          <div className="px-4 text-center">
                            {match.status === 'completed' ? (
                              <div className="text-xl font-bold">
                                {match.homeEggsBroken} : {match.awayEggsBroken}
                              </div>
                            ) : (
                              <div className="text-gray-400 font-medium">vs</div>
                            )}
                          </div>
                          
                          <div className="flex-1 text-right">
                            <div className={`font-medium ${match.result === 'away_win' ? 'text-green-700 font-bold' : ''}`}>
                              {match.awayCompetitor.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
                })
              })()}
            </div>
          </div>
        )}

        {/* Ukupna rang lista */}
        {competition.rankings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              📊 Ukupna rang lista turnira
            </h2>
            
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Poz.</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Natjecatelj</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">I</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">BRJ</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Bodovi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {competition.rankings
                      .sort((a, b) => (a.position || 999) - (b.position || 999))
                      .map((ranking, index) => (
                      <tr 
                        key={ranking.id}
                        className={`
                          hover:bg-gray-50
                          ${index === 0 ? 'bg-yellow-50' : ''}
                          ${index === 1 ? 'bg-gray-50' : ''}
                          ${index === 2 ? 'bg-orange-50' : ''}
                        `}
                      >
                        <td className="px-6 py-4">
                          <span className={`font-bold ${
                            index === 0 ? 'text-yellow-600' : 
                            index === 1 ? 'text-gray-600' : 
                            index === 2 ? 'text-orange-600' : ''
                          }`}>
                            #{index + 1}
                            {index === 0 && ' 🥇'}
                            {index === 1 && ' 🥈'}
                            {index === 2 && ' 🥉'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{ranking.competitor.name}</td>
                        <td className="px-6 py-4 text-center text-green-600 font-medium">{ranking.wins}</td>
                        <td className="px-6 py-4 text-center text-red-600 font-medium">{ranking.losses}</td>
                        <td className="px-6 py-4 text-center">{ranking.eggsBroken}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-primary-600">
                            {ranking.weightedPoints || ranking.points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
