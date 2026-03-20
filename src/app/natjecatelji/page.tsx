import { getAllCompetitors } from '@/lib/services/competitorService'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Natjecatelji | Najtvrđe Jaje',
  description: 'Lista svih natjecatelja sa statistikama i BRJ bodovima',
}

export const revalidate = 60

export default async function NatjecateljiPage() {
  const competitors = await getAllCompetitors()

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="container-custom px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            🏆 Natjecatelji
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Svi aktivni natjecatelji sortirani po BRJ bodovima
          </p>
        </div>

        {/* Competitors Grid */}
        {competitors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Trenutno nema registriranih natjecatelja.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {competitors.map((competitor) => {
              const pos = competitor.globalPosition
              return (
                <div
                  key={competitor.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
                >
                  {/* Profile Header with Image */}
                  <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 border-b border-gray-100">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-br from-gold-200 to-gold-400 border-2 border-white shadow-md">
                        {competitor.profileImage ? (
                          <Image
                            src={competitor.profileImage}
                            alt={competitor.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🥚
                          </div>
                        )}
                      </div>
                      {pos && (
                        <div className={`
                          absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow
                          ${pos === 1 ? 'bg-yellow-400 text-yellow-900' :
                            pos === 2 ? 'bg-gray-300 text-gray-700' :
                            pos === 3 ? 'bg-orange-400 text-orange-900' :
                            'bg-primary-100 text-primary-700'}
                        `}>
                          {pos}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                        {competitor.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        📍 {competitor.city || 'Nepoznato'}, {competitor.country || 'BiH'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {competitor.bio ? (
                      <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-2 min-h-[40px]">
                        {competitor.bio}
                      </p>
                    ) : (
                      <div className="min-h-[40px] mb-3 sm:mb-4" />
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="bg-primary-50 rounded-lg p-2.5 sm:p-3 text-center">
                        <p className="text-xs text-gray-500 mb-0.5">BRJ bodovi</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary-600">
                          {competitor.globalWeightedPoints}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 text-center">
                        <p className="text-xs text-gray-500 mb-0.5">Učinak (P/I)</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">
                          <span className="text-green-600">{competitor.totalWins}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-500">{competitor.totalLosses}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 text-center">
                        <p className="text-xs text-gray-500 mb-0.5">Razbijena jaja</p>
                        <p className="text-lg font-bold text-gray-900">
                          {competitor.totalEggsBroken}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 text-center">
                        <p className="text-xs text-gray-500 mb-0.5">Izgubljena jaja</p>
                        <p className="text-lg font-bold text-gray-600">
                          {competitor.totalEggsLost}
                        </p>
                      </div>
                    </div>

                    {/* Win Rate */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Postotak pobjeda</span>
                        <span className="font-semibold text-gray-900">
                          {(competitor.totalWins + competitor.totalLosses) > 0
                            ? ((competitor.totalWins / (competitor.totalWins + competitor.totalLosses)) * 100).toFixed(1)
                            : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(competitor.totalWins + competitor.totalLosses) > 0
                              ? (competitor.totalWins / (competitor.totalWins + competitor.totalLosses)) * 100
                              : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/natjecatelji/${competitor.slug}`}
                      className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-auto"
                    >
                      Vidi profil
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
