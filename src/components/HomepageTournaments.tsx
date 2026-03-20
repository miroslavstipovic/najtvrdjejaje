import Link from 'next/link'

interface TournamentRanking {
  position: number
  wins: number
  losses: number
  eggsBroken: number
  weightedPoints: number
  competitor: {
    id: number
    name: string
    slug: string
    profileImage: string | null
  }
}

interface Competition {
  id: number
  name: string
  slug: string
  description: string | null
  startDate: Date
  endDate: Date | null
  location: string | null
  status: string
  tournamentType: string
  coverImage: string | null
  numberOfGroups: number
  _count: {
    matches: number
    rankings: number
  }
  rankings: TournamentRanking[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Završen', color: 'bg-green-100 text-green-800' },
  ongoing: { label: 'U tijeku', color: 'bg-yellow-100 text-yellow-800' },
  upcoming: { label: 'Nadolazeći', color: 'bg-blue-100 text-blue-800' },
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉']

export default function HomepageTournaments({ competitions }: { competitions: Competition[] }) {
  if (!competitions || competitions.length === 0) return null

  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-primary-50/30 to-cream-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl md:text-3xl">🏆</span>
            <h2 className="text-xl md:text-2xl font-bold text-primary-800">Turniri</h2>
          </div>
          <Link
            href="/turniri"
            className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1"
          >
            Svi turniri
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {competitions.map((comp) => {
            const statusInfo = STATUS_LABELS[comp.status] || STATUS_LABELS.upcoming
            const dateStr = new Date(comp.startDate).toLocaleDateString('hr-HR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })

            return (
              <Link
                key={comp.id}
                href={`/turniri/${comp.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gold-300 transition-all duration-300 overflow-hidden"
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-lg text-primary-800 group-hover:text-primary-600 transition-colors">
                      {comp.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {dateStr}
                    </span>
                    {comp.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {comp.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {comp._count.rankings} natjecatelja
                    </span>
                  </div>

                  {comp.rankings.length > 0 && comp.status === 'completed' && (
                    <div className="space-y-2 pt-3 border-t border-gray-100">
                      {comp.rankings.map((r, i) => (
                        <div
                          key={r.competitor.id}
                          className={`flex items-center justify-between py-1.5 px-3 rounded-lg ${
                            i === 0 ? 'bg-gold-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{MEDAL_ICONS[i] || `#${r.position}`}</span>
                            <span className="font-semibold text-sm text-primary-800">
                              {r.competitor.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="font-medium">{r.wins}P / {r.losses}I</span>
                            <span className="text-primary-600 font-bold">{r.weightedPoints} bod.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {comp.status === 'upcoming' && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500 italic">
                        Turnir uskoro počinje &mdash; {comp._count.rankings > 0 ? `${comp._count.rankings} prijavljenih` : 'prijave u tijeku'}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
