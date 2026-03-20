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

// POST - Preračunavanje BRJ rang liste
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { competitionId, recalculateGlobal } = body

    if (competitionId) {
      // Recalculate specific competition rankings
      const result = await recalculateCompetitionRankings(competitionId)
      return NextResponse.json(result)
    }

    if (recalculateGlobal) {
      // Full BRJ recalculation from all historical matches
      const result = await recalculateAllBRJ()
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { message: 'Potrebno je navesti competitionId ili recalculateGlobal: true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Recalculation error:', error)
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

/**
 * Auto-fix: split "final" rounds that contain both the championship match
 * and the 3rd place match into two separate rounds.
 */
async function autoFixFinalRounds(competitionId: number) {
  const finalRounds = await prisma.round.findMany({
    where: { competitionId, roundType: 'final' },
    include: { matches: true },
  })

  for (const round of finalRounds) {
    if (round.matches.length <= 1) continue

    const semiRound = await prisma.round.findFirst({
      where: { competitionId, roundType: 'semifinal' },
      include: { matches: { where: { status: 'completed', result: { not: null } } } },
    })
    if (!semiRound || semiRound.matches.length === 0) continue

    const semifinalWinners = new Set<number>()
    for (const m of semiRound.matches) {
      if (m.result === 'home_win') semifinalWinners.add(m.homeCompetitorId)
      if (m.result === 'away_win') semifinalWinners.add(m.awayCompetitorId)
    }

    const thirdPlaceMatchIds: number[] = []
    for (const m of round.matches) {
      const bothFinalists = semifinalWinners.has(m.homeCompetitorId) && semifinalWinners.has(m.awayCompetitorId)
      if (!bothFinalists) thirdPlaceMatchIds.push(m.id)
    }
    if (thirdPlaceMatchIds.length === 0) continue

    const origNumber = round.roundNumber
    await prisma.round.update({
      where: { id: round.id },
      data: { roundNumber: origNumber + 1 },
    })

    const thirdPlaceRound = await prisma.round.create({
      data: {
        competitionId,
        roundNumber: origNumber,
        name: 'Meč za 3. mjesto',
        roundType: 'third_place',
        pointMultiplier: round.pointMultiplier,
      },
    })

    await prisma.match.updateMany({
      where: { id: { in: thirdPlaceMatchIds } },
      data: { roundId: thirdPlaceRound.id },
    })
  }
}

// Recalculate rankings for a specific competition - BRJ sustav
async function recalculateCompetitionRankings(competitionId: number) {
  await autoFixFinalRounds(competitionId)

  const matches = await prisma.match.findMany({
    where: {
      competitionId,
      status: 'completed',
      result: { not: null },
    },
    include: {
      round: { select: { pointMultiplier: true, groupNumber: true, roundType: true } },
    },
    orderBy: { matchDate: 'asc' },
  })

  const rankings = await prisma.ranking.findMany({
    where: { competitionId },
  })

  const competitorStats: Map<number, { 
    points: number; 
    weightedPoints: number;
    wins: number; 
    losses: number; 
    eggsBroken: number; 
    eggsLost: number 
  }> = new Map()

  for (const ranking of rankings) {
    competitorStats.set(ranking.competitorId, {
      points: 0,
      weightedPoints: 0,
      wins: 0,
      losses: 0,
      eggsBroken: 0,
      eggsLost: 0,
    })
  }

  for (const match of matches) {
    if (!match.result) continue

    const multiplier = match.round?.pointMultiplier || 1
    const roundType = match.round?.roundType || ''
    const isFinale = roundType === 'final'
    const homeStats = competitorStats.get(match.homeCompetitorId)
    const awayStats = competitorStats.get(match.awayCompetitorId)

    if (homeStats) {
      homeStats.points += match.homeEggsBroken
      homeStats.eggsBroken += match.homeEggsBroken
      homeStats.eggsLost += match.awayEggsBroken
      if (isFinale) homeStats.weightedPoints += FINALIST_BONUS

      if (match.result === 'home_win') {
        homeStats.wins += 1
        homeStats.weightedPoints += match.homeEggsBroken * multiplier + WIN_BONUS
      } else if (match.result === 'away_win') {
        homeStats.losses += 1
        homeStats.weightedPoints += match.homeEggsBroken * multiplier - LOSS_PENALTY
      }
    }

    if (awayStats) {
      awayStats.points += match.awayEggsBroken
      awayStats.eggsBroken += match.awayEggsBroken
      awayStats.eggsLost += match.homeEggsBroken
      if (isFinale) awayStats.weightedPoints += FINALIST_BONUS

      if (match.result === 'away_win') {
        awayStats.wins += 1
        awayStats.weightedPoints += match.awayEggsBroken * multiplier + WIN_BONUS
      } else if (match.result === 'home_win') {
        awayStats.losses += 1
        awayStats.weightedPoints += match.awayEggsBroken * multiplier - LOSS_PENALTY
      }
    }
  }

  for (const ranking of rankings) {
    const stats = competitorStats.get(ranking.competitorId)
    if (stats) {
      await prisma.ranking.update({
        where: { id: ranking.id },
        data: {
          points: stats.points,
          weightedPoints: stats.weightedPoints,
          wins: stats.wins,
          losses: stats.losses,
          eggsBroken: stats.eggsBroken,
          eggsLost: stats.eggsLost,
        },
      })
    }
  }

  const updatedRankings = await prisma.ranking.findMany({
    where: { competitionId },
    orderBy: [
      { wins: 'desc' },
      { weightedPoints: 'desc' },
      { eggsBroken: 'desc' },
      { eggsLost: 'asc' },
    ],
  })

  for (let i = 0; i < updatedRankings.length; i++) {
    await prisma.ranking.update({
      where: { id: updatedRankings[i].id },
      data: { position: i + 1 },
    })
  }

  return {
    message: 'BRJ rang lista uspješno preračunata',
    competitionId,
    matchesProcessed: matches.length,
    competitorsUpdated: rankings.length,
  }
}

// Recalculate all BRJ statistics from historical matches
async function recalculateAllBRJ() {
  const matches = await prisma.match.findMany({
    where: {
      status: 'completed',
      result: { not: null },
    },
    orderBy: [
      { matchDate: 'asc' },
      { createdAt: 'asc' },
    ],
    include: {
      homeCompetitor: { select: { id: true } },
      awayCompetitor: { select: { id: true } },
      round: { select: { pointMultiplier: true, roundType: true } },
    },
  })

  // Reset all competitor statistics
  await prisma.competitor.updateMany({
    data: {
      totalEggsBroken: 0,
      totalEggsLost: 0,
      totalWins: 0,
      totalLosses: 0,
    },
  })

  // Track BRJ for each competitor
  const statsMap: Map<number, { 
    eggsBroken: number; 
    eggsLost: number;
    wins: number; 
    losses: number 
  }> = new Map()

  // Get all competitors
  const competitors = await prisma.competitor.findMany({
    select: { id: true },
  })

  for (const c of competitors) {
    statsMap.set(c.id, { eggsBroken: 0, eggsLost: 0, wins: 0, losses: 0 })
  }

  // Process matches chronologically
  for (const match of matches) {
    if (!match.result) continue

    const homeStats = statsMap.get(match.homeCompetitorId) || { eggsBroken: 0, eggsLost: 0, wins: 0, losses: 0 }
    const awayStats = statsMap.get(match.awayCompetitorId) || { eggsBroken: 0, eggsLost: 0, wins: 0, losses: 0 }

    // Update eggs broken/lost
    homeStats.eggsBroken += match.homeEggsBroken
    homeStats.eggsLost += match.awayEggsBroken
    awayStats.eggsBroken += match.awayEggsBroken
    awayStats.eggsLost += match.homeEggsBroken

    // Update wins/losses
    if (match.result === 'home_win') {
      homeStats.wins++
      awayStats.losses++
    } else if (match.result === 'away_win') {
      homeStats.losses++
      awayStats.wins++
    }

    statsMap.set(match.homeCompetitorId, homeStats)
    statsMap.set(match.awayCompetitorId, awayStats)
  }

  // Update all competitors in database
  for (const c of competitors) {
    const stats = statsMap.get(c.id) || { eggsBroken: 0, eggsLost: 0, wins: 0, losses: 0 }

    await prisma.competitor.update({
      where: { id: c.id },
      data: {
        totalEggsBroken: stats.eggsBroken,
        totalEggsLost: stats.eggsLost,
        totalWins: stats.wins,
        totalLosses: stats.losses,
      },
    })
  }

  // Also recalculate all competition rankings
  const competitions = await prisma.competition.findMany({
    select: { id: true },
  })

  for (const comp of competitions) {
    await recalculateCompetitionRankings(comp.id)
  }

  return {
    message: 'Sve BRJ statistike uspješno preračunate',
    matchesProcessed: matches.length,
    competitorsUpdated: competitors.length,
    competitionsUpdated: competitions.length,
  }
}
