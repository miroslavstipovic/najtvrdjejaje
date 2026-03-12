import { getAllCompetitions } from '@/lib/services/competitionService'
import Link from 'next/link'

export const metadata = {
  title: 'Turniri | Najtvrđe Jaje',
  description: 'Svi turniri i natjecanja u najtvrđem jajetu',
}

export const revalidate = 60

function getStatusBadge(status: string) {
  switch (status) {
    case 'upcoming':
      return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Predstojeći</span>
    case 'ongoing':
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">U toku</span>
    case 'completed':
      return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Završen</span>
    case 'cancelled':
      return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Otkazan</span>
    default:
      return null
  }
}

export default async function TurniriPage() {
  const competitions = await getAllCompetitions()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🏅 Turniri
          </h1>
          <p className="text-gray-600 text-lg">
            Sva natjecanja organizirana po Bergerovom sustavu
          </p>
        </div>

        {/* Competitions List */}
        {competitions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Trenutno nema zakazanih turnira.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {competitions.map((competition) => (
              <div
                key={competition.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {competition.name}
                        </h2>
                        {getStatusBadge(competition.status)}
                        {competition.isFeatured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            ⭐ Istaknuto
                          </span>
                        )}
                      </div>
                      {competition.location && (
                        <p className="text-gray-500 text-sm mb-2">
                          📍 {competition.location}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm">
                        📅 {new Date(competition.startDate).toLocaleDateString('hr-HR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {competition.endDate && (
                          <> - {new Date(competition.endDate).toLocaleDateString('hr-HR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}</>
                        )}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 text-right">
                      <p className="text-sm text-gray-500 mb-1">Broj mečeva</p>
                      <p className="text-3xl font-bold text-primary-600">
                        {competition._count.matches}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {competition.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {competition.description}
                    </p>
                  )}

                  {/* Tournament Type */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary-50 text-primary-700 px-3 py-1 rounded-lg text-sm font-medium">
                      {competition.tournamentType === 'berger' && '🔄 Bergerov sustav'}
                      {competition.tournamentType === 'knockout' && '🏆 Eliminacijski'}
                      {competition.tournamentType === 'round_robin' && '⚡ Krug'}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Link
                    href={`/turniri/${competition.slug}`}
                    className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                  >
                    Vidi detalje
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
