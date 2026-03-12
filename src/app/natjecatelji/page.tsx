import { getAllCompetitors } from '@/lib/services/competitorService'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Natjecatelji | Najtvrđe Jaje',
  description: 'Lista svih natjecatelja sa statistikama i BRJ (Broj razbijenih jaja)',
}

export const revalidate = 60

export default async function NatjecateljiPage() {
  const competitors = await getAllCompetitors()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🏆 Natjecatelji
          </h1>
          <p className="text-gray-600 text-lg">
            Svi aktivni natjecatelji sortirani po broju razbijenih jaja (BRJ)
          </p>
        </div>

        {/* Competitors Grid */}
        {competitors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Trenutno nema registriranih natjecatelja.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((competitor, index) => (
              <div
                key={competitor.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
              >
                {/* Profile Header with Image */}
                <div className="flex items-center gap-4 p-5 border-b border-gray-100">
                  {/* Profile Image */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-gold-200 to-gold-400 border-2 border-white shadow-md">
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
                    {/* Rank Badge */}
                    <div className={`
                      absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow
                      ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                        index === 1 ? 'bg-gray-300 text-gray-700' : 
                        index === 2 ? 'bg-orange-400 text-orange-900' : 
                        'bg-primary-100 text-primary-700'}
                    `}>
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Name and Location */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate">
                      {competitor.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      📍 {competitor.city || 'Nepoznato'}, {competitor.country || 'BiH'}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Bio */}
                  {competitor.bio ? (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                      {competitor.bio}
                    </p>
                  ) : (
                    <div className="min-h-[40px] mb-4" />
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">BRJ (Razbijena jaja)</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {competitor.totalEggsBroken}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Učinak (P/I)</p>
                      <p className="text-xl font-bold text-gray-900">
                        <span className="text-green-600">{competitor.totalWins}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-500">{competitor.totalLosses}</span>
                      </p>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Postotak pobjeda</span>
                      <span className="font-semibold text-gray-900">
                        {(competitor.totalWins + competitor.totalLosses) > 0 
                          ? ((competitor.totalWins / (competitor.totalWins + competitor.totalLosses)) * 100).toFixed(1) 
                          : '0.0'}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full transition-all"
                        style={{
                          width: `${(competitor.totalWins + competitor.totalLosses) > 0 
                            ? (competitor.totalWins / (competitor.totalWins + competitor.totalLosses)) * 100 
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Link
                    href={`/natjecatelji/${competitor.slug}`}
                    className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-auto"
                  >
                    Vidi profil
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
