import { getGlobalRanking, getAllRankings } from '@/lib/services/rankingService'
import Link from 'next/link'

export const metadata = {
  title: 'Rang lista | Najtvrđe Jaje',
  description: 'Opća rang lista i rang liste po turnirima',
}

export const revalidate = 60

export default async function RangListaPage() {
  const globalRanking = await getGlobalRanking()
  const competitionsWithRankings = await getAllRankings()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            📊 Rang lista
          </h1>
          <p className="text-gray-600 text-lg">
            Opća rang lista i rezultati po turnirima
          </p>
        </div>

        {/* Global Ranking */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-lg mr-3">
              🏆 Opća rang lista
            </span>
          </h2>

          {globalRanking.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-500">Trenutno nema podataka za rang listu.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pozicija
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Natjecatelj
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BRJ bodovi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Razbijena jaja
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pobjede
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Porazi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Izgubljena jaja
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {globalRanking.map((ranking) => (
                      <tr
                        key={ranking.competitor.id}
                        className={`
                          hover:bg-gray-50 transition-colors
                          ${ranking.position === 1 ? 'bg-yellow-50' : ''}
                          ${ranking.position === 2 ? 'bg-gray-50' : ''}
                          ${ranking.position === 3 ? 'bg-orange-50' : ''}
                        `}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`
                              text-lg font-bold
                              ${ranking.position === 1 ? 'text-yellow-600' : ''}
                              ${ranking.position === 2 ? 'text-gray-600' : ''}
                              ${ranking.position === 3 ? 'text-orange-600' : ''}
                              ${ranking.position > 3 ? 'text-gray-900' : ''}
                            `}>
                              #{ranking.position}
                            </span>
                            {ranking.position === 1 && <span className="ml-2">🥇</span>}
                            {ranking.position === 2 && <span className="ml-2">🥈</span>}
                            {ranking.position === 3 && <span className="ml-2">🥉</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/natjecatelji/${ranking.competitor.slug}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {ranking.competitor.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-primary-600">
                            {ranking.weightedPoints || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {ranking.eggsBroken}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                          {ranking.wins}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                          {ranking.losses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                          {ranking.eggsLost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {ranking.competitor.city}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Competition Rankings */}
        {competitionsWithRankings.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📋 Rang liste po turnirima
            </h2>

            <div className="space-y-8">
              {competitionsWithRankings.map((competition) => (
                <div key={competition.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
                    <h3 className="text-xl font-bold text-gray-900">{competition.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(competition.startDate).toLocaleDateString('hr-HR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {competition.rankings.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Nema podataka o rang listi za ovaj turnir.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poz.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Natjecatelj</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BRJ Bodovi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P/I</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jaja razbijeno/izgubljeno</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {competition.rankings.map((ranking) => (
                            <tr key={ranking.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                #{ranking.position}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  href={`/natjecatelji/${ranking.competitor.slug}`}
                                  className="text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  {ranking.competitor.name}
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-lg font-semibold text-primary-600">
                                  {ranking.weightedPoints || ranking.points}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {ranking.wins}/{ranking.losses}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                {ranking.eggsBroken} / {ranking.eggsLost}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <Link
                      href={`/turniri/${competition.slug}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Vidi detalje turnira →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
