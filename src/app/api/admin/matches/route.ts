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

// GET - Lista mečeva (s filterima)
export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')
    const roundId = searchParams.get('roundId')
    const competitorId = searchParams.get('competitorId')
    const status = searchParams.get('status')
    const groupNumber = searchParams.get('groupNumber')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}

    if (competitionId) where.competitionId = parseInt(competitionId)
    if (roundId) where.roundId = parseInt(roundId)
    if (status) where.status = status
    if (groupNumber) {
      where.round = { groupNumber: parseInt(groupNumber) }
    }
    if (competitorId) {
      const id = parseInt(competitorId)
      where.OR = [
        { homeCompetitorId: id },
        { awayCompetitorId: id },
      ]
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: [
          { round: { groupNumber: 'asc' } },
          { round: { roundNumber: 'asc' } },
          { matchDate: 'asc' },
          { id: 'asc' },
        ],
        skip,
        take: limit,
        include: {
          homeCompetitor: { 
            select: { 
              id: true, 
              name: true, 
              slug: true, 
              totalEggsBroken: true,
              profileImage: true,
            } 
          },
          awayCompetitor: { 
            select: { 
              id: true, 
              name: true, 
              slug: true, 
              totalEggsBroken: true,
              profileImage: true,
            } 
          },
          competition: { select: { id: true, name: true, slug: true } },
          round: { 
            select: { 
              id: true, 
              name: true, 
              roundNumber: true, 
              roundType: true, 
              pointMultiplier: true,
              groupNumber: true,
            } 
          },
        },
      }),
      prisma.match.count({ where }),
    ])

    return NextResponse.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Matches fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Ručno dodavanje meča
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      competitionId,
      roundId,
      homeCompetitorId,
      awayCompetitorId,
      homeEggsBroken,
      awayEggsBroken,
      matchDate,
      location,
      videoUrl,
      description,
      status,
    } = body

    if (!homeCompetitorId || !awayCompetitorId) {
      return NextResponse.json(
        { message: 'Oba natjecatelja su obavezna' },
        { status: 400 }
      )
    }

    if (homeCompetitorId === awayCompetitorId) {
      return NextResponse.json(
        { message: 'Natjecatelj ne može igrati sam protiv sebe' },
        { status: 400 }
      )
    }

    // Verify competitors exist
    const [homeCompetitor, awayCompetitor] = await Promise.all([
      prisma.competitor.findUnique({ where: { id: homeCompetitorId } }),
      prisma.competitor.findUnique({ where: { id: awayCompetitorId } }),
    ])

    if (!homeCompetitor || !awayCompetitor) {
      return NextResponse.json(
        { message: 'Jedan ili oba natjecatelja nisu pronađeni' },
        { status: 400 }
      )
    }

    // Verify competition exists if provided
    if (competitionId) {
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
      })
      if (!competition) {
        return NextResponse.json(
          { message: 'Turnir nije pronađen' },
          { status: 400 }
        )
      }
    }

    // Get round with multiplier if provided
    let round = null
    if (roundId) {
      round = await prisma.round.findUnique({
        where: { id: roundId },
      })
      if (!round) {
        return NextResponse.json(
          { message: 'Kolo nije pronađeno' },
          { status: 400 }
        )
      }
    }

    // Determine result - pobjednik je onaj tko razbije više jaja (nema neriješenog)
    let result = null
    const homeEggs = homeEggsBroken ?? 0
    const awayEggs = awayEggsBroken ?? 0
    
    if (homeEggs > awayEggs) {
      result = 'home_win'
    } else if (awayEggs > homeEggs) {
      result = 'away_win'
    }
    // Ako su jednaki, result ostaje null - trebat će odlučiti na drugi način

    const match = await prisma.match.create({
      data: {
        competitionId: competitionId || null,
        roundId: roundId || null,
        homeCompetitorId,
        awayCompetitorId,
        homeEggsBroken: homeEggs,
        awayEggsBroken: awayEggs,
        result,
        matchDate: matchDate ? new Date(matchDate) : null,
        location: location || null,
        videoUrl: videoUrl || null,
        description: description || null,
        status: status || 'scheduled',
      },
      include: {
        homeCompetitor: { 
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            totalEggsBroken: true 
          } 
        },
        awayCompetitor: { 
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            totalEggsBroken: true 
          } 
        },
        competition: { select: { id: true, name: true, slug: true } },
        round: { 
          select: { 
            id: true, 
            name: true, 
            roundNumber: true,
            roundType: true,
            pointMultiplier: true,
            groupNumber: true,
          } 
        },
      },
    })

    if (status === 'completed' && result) {
      const multiplier = round?.pointMultiplier || 1
      const roundType = round?.roundType || ''
      await updateCompetitorBRJ(
        homeCompetitorId, 
        awayCompetitorId, 
        homeEggs, 
        awayEggs, 
        result, 
        competitionId,
        multiplier,
        roundType
      )
    }

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error('Match creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Scoring constants
const WIN_BONUS = 25
const LOSS_PENALTY = 5
const FINALIST_BONUS = 75

async function updateCompetitorBRJ(
  homeId: number,
  awayId: number,
  homeEggsBroken: number,
  awayEggsBroken: number,
  result: string,
  competitionId: number | null,
  multiplier: number = 1,
  roundType: string = ''
) {
  const homeUpdate: any = {
    totalEggsBroken: { increment: homeEggsBroken },
    totalEggsLost: { increment: awayEggsBroken },
  }
  const awayUpdate: any = {
    totalEggsBroken: { increment: awayEggsBroken },
    totalEggsLost: { increment: homeEggsBroken },
  }

  if (result === 'home_win') {
    homeUpdate.totalWins = { increment: 1 }
    awayUpdate.totalLosses = { increment: 1 }
  } else if (result === 'away_win') {
    homeUpdate.totalLosses = { increment: 1 }
    awayUpdate.totalWins = { increment: 1 }
  }

  await Promise.all([
    prisma.competitor.update({ where: { id: homeId }, data: homeUpdate }),
    prisma.competitor.update({ where: { id: awayId }, data: awayUpdate }),
  ])

  if (competitionId) {
    await updateCompetitionRankings(
      competitionId, homeId, awayId, homeEggsBroken, awayEggsBroken, result, multiplier, roundType
    )
  }
}

async function updateCompetitionRankings(
  competitionId: number,
  homeId: number,
  awayId: number,
  homeEggsBroken: number,
  awayEggsBroken: number,
  result: string,
  multiplier: number = 1,
  roundType: string = ''
) {
  const finalistBonus = roundType === 'final' ? FINALIST_BONUS : 0
  const homeWeightedPoints = homeEggsBroken * multiplier + (result === 'home_win' ? WIN_BONUS : -LOSS_PENALTY) + finalistBonus
  const awayWeightedPoints = awayEggsBroken * multiplier + (result === 'away_win' ? WIN_BONUS : -LOSS_PENALTY) + finalistBonus

  // Update or create home ranking
  await prisma.ranking.upsert({
    where: {
      competitionId_competitorId: {
        competitionId,
        competitorId: homeId,
      },
    },
    update: {
      points: { increment: homeEggsBroken },
      weightedPoints: { increment: homeWeightedPoints },
      wins: result === 'home_win' ? { increment: 1 } : undefined,
      losses: result === 'away_win' ? { increment: 1 } : undefined,
      eggsBroken: { increment: homeEggsBroken },
      eggsLost: { increment: awayEggsBroken },
    },
    create: {
      competitionId,
      competitorId: homeId,
      position: 0,
      points: homeEggsBroken,
      weightedPoints: homeWeightedPoints,
      wins: result === 'home_win' ? 1 : 0,
      losses: result === 'away_win' ? 1 : 0,
      eggsBroken: homeEggsBroken,
      eggsLost: awayEggsBroken,
    },
  })

  // Update or create away ranking
  await prisma.ranking.upsert({
    where: {
      competitionId_competitorId: {
        competitionId,
        competitorId: awayId,
      },
    },
    update: {
      points: { increment: awayEggsBroken },
      weightedPoints: { increment: awayWeightedPoints },
      wins: result === 'away_win' ? { increment: 1 } : undefined,
      losses: result === 'home_win' ? { increment: 1 } : undefined,
      eggsBroken: { increment: awayEggsBroken },
      eggsLost: { increment: homeEggsBroken },
    },
    create: {
      competitionId,
      competitorId: awayId,
      position: 0,
      points: awayEggsBroken,
      weightedPoints: awayWeightedPoints,
      wins: result === 'away_win' ? 1 : 0,
      losses: result === 'home_win' ? 1 : 0,
      eggsBroken: awayEggsBroken,
      eggsLost: homeEggsBroken,
    },
  })

  // Recalculate positions - sorted by weightedPoints (BRJ with multiplier)
  await recalculateRankingPositions(competitionId)
}

// Helper to recalculate ranking positions
async function recalculateRankingPositions(competitionId: number) {
    const rankings = await prisma.ranking.findMany({
      where: { competitionId },
      orderBy: [
        { weightedPoints: 'desc' },
        { wins: 'desc' },
        { eggsBroken: 'desc' },
        { eggsLost: 'asc' },
      ],
    })

  for (let i = 0; i < rankings.length; i++) {
    await prisma.ranking.update({
      where: { id: rankings[i].id },
      data: { position: i + 1 },
    })
  }
}

// Export helper functions for use in other routes
export { updateCompetitorBRJ, updateCompetitionRankings, recalculateRankingPositions }
