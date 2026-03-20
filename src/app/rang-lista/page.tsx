import { getGlobalRanking, getAllRankings } from '@/lib/services/rankingService'
import Link from 'next/link'

export const metadata = {
  title: 'Rang lista | Najtvrđe Jaje',
  description: 'Opća rang lista i rang liste po turnirima',
}

export const revalidate = 60

function PositionBadge({ position }: { position: number }) {
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null
  const colorClass =
    position === 1
      ? 'text-yellow-600'
      : position === 2
        ? 'text-gray-500'
        : position === 3
          ? 'text-orange-600'
          : 'text-gray-900'

  return (
    <span className={`font-bold ${colorClass}`}>
      #{position}
      {medal && <span className="ml-1">{medal}</span>}
    </span>
  )
}

function RowBg({ position }: { position: number }) {
  if (position === 1) return 'bg-yellow-50'
  if (position === 2) return 'bg-gray-50/60'
  if (position === 3) return 'bg-orange-50'
  return ''
}

export default async function RangListaPage() {
  const globalRanking = await getGlobalRanking()
  const competitionsWithRankings = await getAllRankings()

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="container-custom px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            📊 Rang lista
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Opća rang lista i rezultati po turnirima
          </p>
        </div>

        {/* Global Ranking */}
        <div className="mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <span className="bg-primary-100 text-primary-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
              🏆 Opća rang lista
            </span>
          </h2>

          {globalRanking.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 text-center">
              <p className="text-gray-500">Trenutno nema podataka za rang listu.</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card layout */}
              <div className="space-y-3 lg:hidden">
                {globalRanking.map((ranking) => (
                  <div
                    key={ranking.competitor.id}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${RowBg({ position: ranking.position })}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <PositionBadge position={ranking.position} />
                        <Link
                          href={`/natjecatelji/${ranking.competitor.slug}`}
                          className="text-primary-600 hover:text-primary-700 font-semibold text-base"
                        >
                          {ranking.competitor.name}
                        </Link>
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        {ranking.weightedPoints || 0}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Razbijena jaja</span>
                        <span className="font-medium text-gray-900">{ranking.eggsBroken}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Izgubljena</span>
                        <span className="font-medium text-gray-600">{ranking.eggsLost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pobjede</span>
                        <span className="font-medium text-green-600">{ranking.wins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Porazi</span>
                        <span className="font-medium text-red-600">{ranking.losses}</span>
                      </div>
                    </div>
                    {ranking.competitor.city && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                        📍 {ranking.competitor.city}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pozicija
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Natjecatelj
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        BRJ bodovi
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Razbijena jaja
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pobjede
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Porazi
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Izgubljena jaja
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {globalRanking.map((ranking) => (
                      <tr
                        key={ranking.competitor.id}
                        className={`hover:bg-gray-50 transition-colors ${RowBg({ position: ranking.position })}`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <PositionBadge position={ranking.position} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Link
                            href={`/natjecatelji/${ranking.competitor.slug}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {ranking.competitor.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-primary-600">
                            {ranking.weightedPoints || 0}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900">
                          {ranking.eggsBroken}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-green-600 font-medium">
                          {ranking.wins}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-red-600 font-medium">
                          {ranking.losses}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 font-medium">
                          {ranking.eggsLost}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-500">
                          {ranking.competitor.city}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Competition Rankings */}
        {competitionsWithRankings.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              📋 Rang liste po turnirima
            </h2>

            <div className="space-y-6 sm:space-y-8">
              {competitionsWithRankings.map((competition) => (
                <div key={competition.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-primary-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-primary-100">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{competition.name}</h3>
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
                    <>
                      {/* Mobile: Card layout */}
                      <div className="divide-y divide-gray-100 sm:hidden">
                        {competition.rankings.map((ranking) => (
                          <div key={ranking.id} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-gray-900 text-sm w-7">
                                  #{ranking.position}
                                </span>
                                <Link
                                  href={`/natjecatelji/${ranking.competitor.slug}`}
                                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                >
                                  {ranking.competitor.name}
                                </Link>
                              </div>
                              <span className="font-bold text-primary-600">
                                {ranking.weightedPoints || ranking.points}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 ml-9 text-xs text-gray-500">
                              <span>
                                <span className="text-green-600 font-medium">{ranking.wins}W</span>
                                {' / '}
                                <span className="text-red-600 font-medium">{ranking.losses}L</span>
                              </span>
                              <span>🥚 {ranking.eggsBroken}/{ranking.eggsLost}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: Table layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poz.</th>
                              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Natjecatelj</th>
                              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BRJ Bodovi</th>
                              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P/I</th>
                              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jaja razbijeno/izgubljeno</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {competition.rankings.map((ranking) => (
                              <tr key={ranking.id} className="hover:bg-gray-50">
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                  #{ranking.position}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <Link
                                    href={`/natjecatelji/${ranking.competitor.slug}`}
                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                  >
                                    {ranking.competitor.name}
                                  </Link>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <span className="text-lg font-semibold text-primary-600">
                                    {ranking.weightedPoints || ranking.points}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">
                                  {ranking.wins}/{ranking.losses}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">
                                  {ranking.eggsBroken} / {ranking.eggsLost}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
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
