import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (error) {
    return null
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

// GET - Check if knockout phase can be generated
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const competitionId = parseInt(id)

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          where: { roundType: 'group' },
          include: {
            matches: true,
          },
        },
        rankings: {
          include: {
            competitor: {
              select: { id: true, name: true, slug: true, profileImage: true },
            },
          },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ message: 'Turnir nije pronađen' }, { status: 404 })
    }

    // Check if knockout phase already exists
    const knockoutRounds = await prisma.round.count({
      where: {
        competitionId,
        roundType: { not: 'group' },
      },
    })

    if (knockoutRounds > 0) {
      return NextResponse.json({
        canGenerate: false,
        reason: 'Eliminacijska faza već postoji',
        knockoutExists: true,
      })
    }

    // Get all group matches
    const groupMatches = competition.rounds.flatMap(r => r.matches)
    const totalGroupMatches = groupMatches.length
    const completedGroupMatches = groupMatches.filter(m => m.status === 'completed').length

    // Calculate group standings
    const groupStandings = await calculateGroupStandings(competitionId)

    // Check if all group matches are completed
    const allGroupMatchesCompleted = totalGroupMatches > 0 && completedGroupMatches === totalGroupMatches

    return NextResponse.json({
      canGenerate: allGroupMatchesCompleted,
      reason: allGroupMatchesCompleted 
        ? 'Grupna faza završena, spremno za eliminacije' 
        : `Preostalo ${totalGroupMatches - completedGroupMatches} mečeva u grupnoj fazi`,
      knockoutExists: false,
      groupStats: {
        totalMatches: totalGroupMatches,
        completedMatches: completedGroupMatches,
        pendingMatches: totalGroupMatches - completedGroupMatches,
      },
      groupStandings,
    })
  } catch (error) {
    console.error('Check knockout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Generate knockout phase from group winners
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const competitionId = parseInt(id)
    const body = await request.json().catch(() => ({}))
    const { forceGenerate = false } = body

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          where: { roundType: 'group' },
          include: {
            matches: true,
          },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ message: 'Turnir nije pronađen' }, { status: 404 })
    }

    // Check if knockout phase already exists
    const existingKnockout = await prisma.round.findFirst({
      where: {
        competitionId,
        roundType: { not: 'group' },
      },
    })

    if (existingKnockout) {
      return NextResponse.json(
        { message: 'Eliminacijska faza već postoji' },
        { status: 400 }
      )
    }

    // Get all group matches
    const groupMatches = competition.rounds.flatMap(r => r.matches)
    const allCompleted = groupMatches.every(m => m.status === 'completed')

    if (!allCompleted && !forceGenerate) {
      return NextResponse.json(
        { message: 'Nisu svi mečevi u grupnoj fazi završeni' },
        { status: 400 }
      )
    }

    // Calculate group standings and get winners
    const groupStandings = await calculateGroupStandings(competitionId)
    const numberOfGroups = Math.max(...groupStandings.map(s => s.groupNumber), 0)

    if (numberOfGroups < 2) {
      return NextResponse.json(
        { message: 'Potrebne su najmanje 2 grupe za eliminacijsku fazu' },
        { status: 400 }
      )
    }

    // Get winner of each group (first place)
    const groupWinners: { groupNumber: number; competitorId: number; competitorName: string }[] = []
    for (let g = 1; g <= numberOfGroups; g++) {
      const groupRankings = groupStandings
        .filter(s => s.groupNumber === g)
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins
          if (b.weightedPoints !== a.weightedPoints) return b.weightedPoints - a.weightedPoints
          if (b.eggsBroken !== a.eggsBroken) return b.eggsBroken - a.eggsBroken
          return a.eggsLost - b.eggsLost
        })

      if (groupRankings.length > 0) {
        groupWinners.push({
          groupNumber: g,
          competitorId: groupRankings[0].competitorId,
          competitorName: groupRankings[0].competitorName,
        })
      }
    }

    // Determine knockout structure based on number of winners
    const numWinners = groupWinners.length
    let knockoutStructure: { roundType: string; pointMultiplier: number; matchups: [number, number][] }[] = []

    if (numWinners === 8) {
      // Standard 8 groups -> Quarterfinals -> Semifinals -> Final
      // Matchups: G1 vs G8, G2 vs G7, G3 vs G6, G4 vs G5
      knockoutStructure = [
        {
          roundType: 'quarterfinal',
          pointMultiplier: 2,
          matchups: [[0, 7], [1, 6], [2, 5], [3, 4]] // Index in groupWinners
        }
      ]
    } else if (numWinners === 4) {
      // 4 groups -> Semifinals -> Final
      knockoutStructure = [
        {
          roundType: 'semifinal',
          pointMultiplier: 3,
          matchups: [[0, 3], [1, 2]]
        }
      ]
    } else if (numWinners === 2) {
      // 2 groups -> Final only
      knockoutStructure = [
        {
          roundType: 'final',
          pointMultiplier: 5,
          matchups: [[0, 1]]
        }
      ]
    } else if (numWinners === 16) {
      // 16 groups -> Round of 16 -> Quarterfinals -> Semifinals -> Final
      knockoutStructure = [
        {
          roundType: 'round_of_16',
          pointMultiplier: 2,
          matchups: [[0, 15], [1, 14], [2, 13], [3, 12], [4, 11], [5, 10], [6, 9], [7, 8]]
        }
      ]
    } else {
      // Custom number - create first round matchups
      const matchups: [number, number][] = []
      for (let i = 0; i < Math.floor(numWinners / 2); i++) {
        matchups.push([i, numWinners - 1 - i])
      }
      knockoutStructure = [
        {
          roundType: numWinners > 8 ? 'round_of_16' : 'quarterfinal',
          pointMultiplier: 2,
          matchups
        }
      ]
    }

    // Get max existing round number
    const maxRoundNumber = await prisma.round.aggregate({
      where: { competitionId },
      _max: { roundNumber: true },
    })
    let nextRoundNumber = (maxRoundNumber._max.roundNumber || 0) + 1

    // Create first knockout round
    const firstKnockout = knockoutStructure[0]
    const roundName = getRoundName(firstKnockout.roundType)

    const knockoutRound = await prisma.round.create({
      data: {
        competitionId,
        roundNumber: nextRoundNumber,
        name: roundName,
        roundType: firstKnockout.roundType as any,
        pointMultiplier: firstKnockout.pointMultiplier,
        groupNumber: null,
      },
    })

    // Create matches for first knockout round
    const matchesData = firstKnockout.matchups.map(([idx1, idx2]) => ({
      competitionId,
      roundId: knockoutRound.id,
      homeCompetitorId: groupWinners[idx1].competitorId,
      awayCompetitorId: groupWinners[idx2].competitorId,
      homeEggsBroken: 0,
      awayEggsBroken: 0,
      status: 'scheduled',
    }))

    await prisma.match.createMany({ data: matchesData })

    // Update competition status if needed
    if (competition.status === 'upcoming') {
      await prisma.competition.update({
        where: { id: competitionId },
        data: { status: 'ongoing' },
      })
    }

    // Fetch complete knockout round with matches
    const completeRound = await prisma.round.findUnique({
      where: { id: knockoutRound.id },
      include: {
        matches: {
          include: {
            homeCompetitor: { select: { id: true, name: true, slug: true, profileImage: true } },
            awayCompetitor: { select: { id: true, name: true, slug: true, profileImage: true } },
          },
        },
      },
    })

    return NextResponse.json({
      message: `Eliminacijska faza kreirana: ${roundName}`,
      round: completeRound,
      groupWinners,
    }, { status: 201 })
  } catch (error) {
    console.error('Generate knockout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate group standings
async function calculateGroupStandings(competitionId: number): Promise<GroupStanding[]> {
  const standings: GroupStanding[] = []

  // Get all group rounds with their matches
  const groupRounds = await prisma.round.findMany({
    where: {
      competitionId,
      roundType: 'group',
    },
    include: {
      matches: {
        where: { status: 'completed' },
        include: {
          homeCompetitor: { select: { id: true, name: true } },
          awayCompetitor: { select: { id: true, name: true } },
        },
      },
    },
  })

  // Group matches by group number
  const matchesByGroup: Map<number, typeof groupRounds[0]['matches']> = new Map()
  groupRounds.forEach(round => {
    const groupNum = round.groupNumber || 1
    const existing = matchesByGroup.get(groupNum) || []
    matchesByGroup.set(groupNum, [...existing, ...round.matches])
  })

  // Calculate standings for each group
  for (const [groupNumber, matches] of matchesByGroup.entries()) {
    const competitorStats: Map<number, GroupStanding> = new Map()

    matches.forEach(match => {
      // Initialize competitors if not exists
      if (!competitorStats.has(match.homeCompetitorId)) {
        competitorStats.set(match.homeCompetitorId, {
          groupNumber,
          competitorId: match.homeCompetitorId,
          competitorName: match.homeCompetitor.name,
          wins: 0,
          losses: 0,
          eggsBroken: 0,
          eggsLost: 0,
          weightedPoints: 0,
        })
      }
      if (!competitorStats.has(match.awayCompetitorId)) {
        competitorStats.set(match.awayCompetitorId, {
          groupNumber,
          competitorId: match.awayCompetitorId,
          competitorName: match.awayCompetitor.name,
          wins: 0,
          losses: 0,
          eggsBroken: 0,
          eggsLost: 0,
          weightedPoints: 0,
        })
      }

      const homeStats = competitorStats.get(match.homeCompetitorId)!
      const awayStats = competitorStats.get(match.awayCompetitorId)!

      // Update stats based on result
      homeStats.eggsBroken += match.homeEggsBroken
      homeStats.eggsLost += match.awayEggsBroken
      awayStats.eggsBroken += match.awayEggsBroken
      awayStats.eggsLost += match.homeEggsBroken

      if (match.result === 'home_win') {
        homeStats.wins++
        homeStats.weightedPoints += match.homeEggsBroken // 1x multiplier for group
        awayStats.losses++
        awayStats.weightedPoints += match.awayEggsBroken
      } else if (match.result === 'away_win') {
        awayStats.wins++
        awayStats.weightedPoints += match.awayEggsBroken
        homeStats.losses++
        homeStats.weightedPoints += match.homeEggsBroken
      }
    })

    standings.push(...competitorStats.values())
  }

  // Sort standings by group, then by performance
  return standings.sort((a, b) => {
    if (a.groupNumber !== b.groupNumber) return a.groupNumber - b.groupNumber
    if (b.weightedPoints !== a.weightedPoints) return b.weightedPoints - a.weightedPoints
    if (b.eggsBroken !== a.eggsBroken) return b.eggsBroken - a.eggsBroken
    return a.eggsLost - b.eggsLost
  })
}

function getRoundName(roundType: string): string {
  switch (roundType) {
    case 'round_of_16': return 'Osmina finala'
    case 'quarterfinal': return 'Četvrtfinale'
    case 'semifinal': return 'Polufinale'
    case 'third_place': return 'Utakmica za 3. mjesto'
    case 'final': return 'Finale'
    default: return 'Eliminacijski krug'
  }
}
