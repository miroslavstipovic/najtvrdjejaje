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

// GET - Dohvat rang liste (BRJ - Broj Razbijenih Jaja)
export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')
    const type = searchParams.get('type') // 'competition' or 'global'
    const groupNumber = searchParams.get('groupNumber') // za filtriranje po grupi

    if (type === 'global' || !competitionId) {
      // Return global BRJ ranking (all competitors sorted by total eggs broken)
      const competitors = await prisma.competitor.findMany({
        where: { isActive: true },
        orderBy: { totalEggsBroken: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          profileImage: true,
          totalEggsBroken: true,
          totalEggsLost: true,
          totalWins: true,
          totalLosses: true,
          city: true,
          country: true,
          _count: {
            select: {
              homeMatches: { where: { status: 'completed' } },
              awayMatches: { where: { status: 'completed' } },
            },
          },
        },
      })

      // Calculate total matches and win rate for each competitor
      const globalRankings = competitors.map((c, index) => ({
        position: index + 1,
        competitor: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          profileImage: c.profileImage,
          city: c.city,
          country: c.country,
        },
        totalEggsBroken: c.totalEggsBroken,
        totalEggsLost: c.totalEggsLost,
        eggsDifference: c.totalEggsBroken - c.totalEggsLost,
        wins: c.totalWins,
        losses: c.totalLosses,
        totalMatches: c._count.homeMatches + c._count.awayMatches,
        winRate: c.totalWins + c.totalLosses > 0
          ? Math.round((c.totalWins / (c.totalWins + c.totalLosses)) * 100)
          : 0,
      }))

      return NextResponse.json({
        type: 'global',
        rankings: globalRankings,
      })
    }

    // Return competition-specific rankings
    const whereClause: any = { competitionId: parseInt(competitionId) }

    // Ako tražimo po grupi, trebamo dohvatiti natjecatelje iz te grupe
    // To radimo preko mečeva u toj grupi
    if (groupNumber) {
      const groupMatches = await prisma.match.findMany({
        where: {
          competitionId: parseInt(competitionId),
          round: { groupNumber: parseInt(groupNumber) },
        },
        select: {
          homeCompetitorId: true,
          awayCompetitorId: true,
        },
      })

      const competitorIds = new Set<number>()
      groupMatches.forEach(m => {
        competitorIds.add(m.homeCompetitorId)
        competitorIds.add(m.awayCompetitorId)
      })

      whereClause.competitorId = { in: Array.from(competitorIds) }
    }

    const rankings = await prisma.ranking.findMany({
      where: whereClause,
      orderBy: [
        { position: 'asc' },
        { weightedPoints: 'desc' },
        { wins: 'desc' },
        { eggsBroken: 'desc' },
      ],
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            slug: true,
            profileImage: true,
            totalEggsBroken: true,
            city: true,
            country: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    // Recalculate positions for this view
    const rankedResults = rankings.map((r, index) => ({
      ...r,
      position: index + 1,
      eggsDifference: r.eggsBroken - r.eggsLost,
    }))

    return NextResponse.json({
      type: 'competition',
      competitionId: parseInt(competitionId),
      groupNumber: groupNumber ? parseInt(groupNumber) : null,
      rankings: rankedResults,
    })
  } catch (error) {
    console.error('Rankings fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Kreiranje rang unosa (za ručno dodavanje natjecatelja u rang listu turnira)
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      competitionId, 
      competitorId, 
      position, 
      points, 
      weightedPoints,
      wins, 
      losses, 
      eggsBroken, 
      eggsLost 
    } = body

    if (!competitorId) {
      return NextResponse.json(
        { message: 'ID natjecatelja je obavezan' },
        { status: 400 }
      )
    }

    // Check if competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
    })

    if (!competitor) {
      return NextResponse.json(
        { message: 'Natjecatelj nije pronađen' },
        { status: 400 }
      )
    }

    // Check if competition exists (if provided)
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

    // Create or update ranking
    const ranking = await prisma.ranking.upsert({
      where: {
        competitionId_competitorId: {
          competitionId: competitionId || 0,
          competitorId,
        },
      },
      update: {
        position: position ?? 0,
        points: points ?? 0,
        weightedPoints: weightedPoints ?? 0,
        wins: wins ?? 0,
        losses: losses ?? 0,
        eggsBroken: eggsBroken ?? 0,
        eggsLost: eggsLost ?? 0,
      },
      create: {
        competitionId: competitionId || null,
        competitorId,
        position: position ?? 0,
        points: points ?? 0,
        weightedPoints: weightedPoints ?? 0,
        wins: wins ?? 0,
        losses: losses ?? 0,
        eggsBroken: eggsBroken ?? 0,
        eggsLost: eggsLost ?? 0,
      },
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
            slug: true,
            profileImage: true,
          },
        },
        competition: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(ranking, { status: 201 })
  } catch (error) {
    console.error('Ranking creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
