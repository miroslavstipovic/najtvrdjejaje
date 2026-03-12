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

const ROUND_PROGRESSION: Record<string, { next: string; pointMultiplier: number } | null> = {
  'round_of_16': { next: 'quarterfinal', pointMultiplier: 3 },
  'quarterfinal': { next: 'semifinal', pointMultiplier: 4 },
  'semifinal': { next: 'final', pointMultiplier: 5 }, // Also creates 3rd place match
  'third_place': null,
  'final': null,
}

// POST - Generate next knockout round from current winners
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

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    })

    if (!competition) {
      return NextResponse.json({ message: 'Turnir nije pronađen' }, { status: 404 })
    }

    // Get all knockout rounds ordered by round number
    const knockoutRounds = await prisma.round.findMany({
      where: {
        competitionId,
        roundType: { not: 'group' },
      },
      orderBy: { roundNumber: 'desc' },
      include: {
        matches: {
          include: {
            homeCompetitor: { select: { id: true, name: true, slug: true, profileImage: true } },
            awayCompetitor: { select: { id: true, name: true, slug: true, profileImage: true } },
          },
        },
      },
    })

    if (knockoutRounds.length === 0) {
      return NextResponse.json(
        { message: 'Eliminacijska faza još nije kreirana' },
        { status: 400 }
      )
    }

    // Get the latest knockout round
    const currentRound = knockoutRounds[0]
    const currentRoundType = currentRound.roundType

    // Check if current round is completed
    const allMatchesCompleted = currentRound.matches.every(m => m.status === 'completed')
    if (!allMatchesCompleted) {
      const pendingMatches = currentRound.matches.filter(m => m.status !== 'completed').length
      return NextResponse.json(
        { message: `Preostalo ${pendingMatches} mečeva u trenutnom krugu` },
        { status: 400 }
      )
    }

    // Check if there's a next round
    const progression = ROUND_PROGRESSION[currentRoundType]
    if (!progression) {
      return NextResponse.json(
        { message: 'Turnir je završen - finale je odigrano' },
        { status: 400 }
      )
    }

    // Check if next round already exists
    const existingNextRound = await prisma.round.findFirst({
      where: {
        competitionId,
        roundType: progression.next as any,
      },
    })

    if (existingNextRound) {
      return NextResponse.json(
        { message: `${getRoundName(progression.next)} već postoji` },
        { status: 400 }
      )
    }

    // Get winners from current round
    const winners: number[] = []
    const losers: number[] = [] // For 3rd place match in semifinals

    currentRound.matches.forEach(match => {
      if (match.result === 'home_win') {
        winners.push(match.homeCompetitorId)
        losers.push(match.awayCompetitorId)
      } else if (match.result === 'away_win') {
        winners.push(match.awayCompetitorId)
        losers.push(match.homeCompetitorId)
      }
    })

    if (winners.length === 0) {
      return NextResponse.json(
        { message: 'Nema pobjednika u trenutnom krugu' },
        { status: 400 }
      )
    }

    // Get max existing round number
    const maxRoundNumber = await prisma.round.aggregate({
      where: { competitionId },
      _max: { roundNumber: true },
    })
    let nextRoundNumber = (maxRoundNumber._max.roundNumber || 0) + 1

    const createdRounds = []

    // Create next round
    const nextRound = await prisma.round.create({
      data: {
        competitionId,
        roundNumber: nextRoundNumber,
        name: getRoundName(progression.next),
        roundType: progression.next as any,
        pointMultiplier: progression.pointMultiplier,
        groupNumber: null,
      },
    })
    nextRoundNumber++

    // Create matches for next round (pair winners)
    const matchesData = []
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        matchesData.push({
          competitionId,
          roundId: nextRound.id,
          homeCompetitorId: winners[i],
          awayCompetitorId: winners[i + 1],
          homeEggsBroken: 0,
          awayEggsBroken: 0,
          status: 'scheduled',
        })
      }
    }

    await prisma.match.createMany({ data: matchesData })
    createdRounds.push(nextRound)

    // If semifinals, also create 3rd place match
    if (currentRoundType === 'semifinal' && losers.length === 2) {
      const thirdPlaceRound = await prisma.round.create({
        data: {
          competitionId,
          roundNumber: nextRoundNumber,
          name: 'Utakmica za 3. mjesto',
          roundType: 'third_place',
          pointMultiplier: 4,
          groupNumber: null,
        },
      })

      await prisma.match.create({
        data: {
          competitionId,
          roundId: thirdPlaceRound.id,
          homeCompetitorId: losers[0],
          awayCompetitorId: losers[1],
          homeEggsBroken: 0,
          awayEggsBroken: 0,
          status: 'scheduled',
        },
      })

      createdRounds.push(thirdPlaceRound)
    }

    // Fetch complete rounds with matches
    const completeRounds = await prisma.round.findMany({
      where: { id: { in: createdRounds.map(r => r.id) } },
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
      message: `${createdRounds.map(r => getRoundName(r.roundType)).join(' i ')} kreirano`,
      rounds: completeRounds,
      winners: winners.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Advance knockout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
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
