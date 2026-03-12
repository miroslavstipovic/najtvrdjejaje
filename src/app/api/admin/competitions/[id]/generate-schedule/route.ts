import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { divideIntoGroups, generateBergerSchedule } from '@/lib/groupDistribution'

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

const ROUND_MULTIPLIERS: Record<string, number> = {
  'group': 1,
  'round_of_16': 2,
  'quarterfinal': 3,
  'semifinal': 4,
  'third_place': 4,
  'final': 5,
}

// POST - Generiranje rasporeda za turnir (grupna faza + knockout opcija)
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

    if (isNaN(competitionId)) {
      return NextResponse.json(
        { message: 'Invalid competition ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      competitorIds, 
      seedIds,
      clearExisting,
      mode = 'group',
      numberOfGroups,
      groupAssignments,
    } = body

    if (!competitorIds || competitorIds.length < 2) {
      return NextResponse.json(
        { message: 'Potrebna su najmanje 2 natjecatelja' },
        { status: 400 }
      )
    }

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { rounds: true },
    })

    if (!competition) {
      return NextResponse.json(
        { message: 'Turnir nije pronađen' },
        { status: 404 }
      )
    }

    // Verify all competitors exist
    const existingCompetitors = await prisma.competitor.findMany({
      where: { id: { in: competitorIds } },
      select: { id: true },
    })

    if (existingCompetitors.length !== competitorIds.length) {
      return NextResponse.json(
        { message: 'Neki natjecatelji nisu pronađeni' },
        { status: 400 }
      )
    }

    // Clear existing rounds and matches if requested
    if (clearExisting && competition.rounds.length > 0) {
      await prisma.match.deleteMany({
        where: { competitionId },
      })
      await prisma.round.deleteMany({
        where: { competitionId },
      })
      await prisma.ranking.deleteMany({
        where: { competitionId },
      })
    }

    const numGroups = numberOfGroups || competition.numberOfGroups
    let totalRoundsCreated = 0
    let totalMatchesCreated = 0

    if (mode === 'group' || mode === 'full') {
      let groups: number[][]
      
      if (groupAssignments) {
        groups = Object.values(groupAssignments)
      } else {
        // Fetch family groups for all competitors
        const competitorsWithFamily = await prisma.competitor.findMany({
          where: { id: { in: competitorIds } },
          select: { id: true, familyGroup: true },
        })
        const familyGroupsMap = new Map<number, string>()
        for (const c of competitorsWithFamily) {
          if (c.familyGroup) familyGroupsMap.set(c.id, c.familyGroup)
        }

        const { groups: distributedGroups, error: groupError } = divideIntoGroups({
          competitorIds,
          numberOfGroups: Math.min(numGroups, competitorIds.length),
          seedIds: seedIds || [],
          familyGroups: familyGroupsMap,
        })

        if (groupError) {
          return NextResponse.json({ message: groupError }, { status: 400 })
        }

        groups = distributedGroups
      }

      // Generiraj raspored za svaku grupu
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        const groupCompetitors = groups[groupIndex]
        const groupNumber = groupIndex + 1

        if (groupCompetitors.length < 2) {
          continue // Skip groups with less than 2 competitors
        }

        // Generiraj Berger raspored za ovu grupu
        const groupSchedule = generateBergerSchedule(groupCompetitors)
        const numRoundsInGroup = Math.max(...groupSchedule.map(m => m.round), 0)

        // Kreiraj kola za ovu grupu
        for (let roundNum = 1; roundNum <= numRoundsInGroup; roundNum++) {
          const round = await prisma.round.create({
            data: {
              competitionId,
              roundNumber: totalRoundsCreated + roundNum,
              name: `Grupa ${String.fromCharCode(64 + groupNumber)} - ${roundNum}. kolo`,
              roundType: 'group',
              pointMultiplier: ROUND_MULTIPLIERS['group'],
              groupNumber,
            },
          })

          // Kreiraj mečeve za ovo kolo
          const roundMatches = groupSchedule.filter(m => m.round === roundNum)
          await prisma.match.createMany({
            data: roundMatches.map(m => ({
              competitionId,
              roundId: round.id,
              homeCompetitorId: m.home,
              awayCompetitorId: m.away,
              status: 'scheduled',
            })),
          })

          totalMatchesCreated += roundMatches.length
        }

        totalRoundsCreated += numRoundsInGroup

        // Kreiraj početne rankinge za natjecatelje u grupi
        await prisma.ranking.createMany({
          data: groupCompetitors.map((competitorId: number, index: number) => ({
            competitionId,
            competitorId,
            position: index + 1,
            points: 0,
            weightedPoints: 0,
            wins: 0,
            losses: 0,
            eggsBroken: 0,
            eggsLost: 0,
          })),
          skipDuplicates: true,
        })
      }
    }

    // TODO: Implementirati knockout fazu ako je mode === 'knockout' ili mode === 'full'
    // Knockout faza se obično generira nakon što su poznati pobjednici grupa

    // Fetch updated competition
    const updatedCompetition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: [{ groupNumber: 'asc' }, { roundNumber: 'asc' }],
          include: {
            matches: {
              include: {
                homeCompetitor: { select: { id: true, name: true, slug: true, profileImage: true } },
                awayCompetitor: { select: { id: true, name: true, slug: true, profileImage: true } },
              },
            },
          },
        },
        rankings: {
          orderBy: { position: 'asc' },
          include: {
            competitor: { select: { id: true, name: true, slug: true, profileImage: true } },
          },
        },
        _count: {
          select: {
            rounds: true,
            matches: true,
            rankings: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Raspored uspješno generiran: ${totalRoundsCreated} kola, ${totalMatchesCreated} mečeva u ${Math.min(numGroups, competitorIds.length)} grupa`,
      competition: updatedCompetition,
    })
  } catch (error) {
    console.error('Schedule generation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Generiranje knockout faze (nakon grupne)
export async function PUT(
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

    if (isNaN(competitionId)) {
      return NextResponse.json(
        { message: 'Invalid competition ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      knockoutType, // 'round_of_16', 'quarterfinal', 'semifinal', 'final'
      matches, // array of { homeCompetitorId, awayCompetitorId }
    } = body

    if (!knockoutType || !matches || matches.length === 0) {
      return NextResponse.json(
        { message: 'Potreban je tip eliminacijske faze i mečevi' },
        { status: 400 }
      )
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { rounds: { orderBy: { roundNumber: 'desc' }, take: 1 } },
    })

    if (!competition) {
      return NextResponse.json(
        { message: 'Turnir nije pronađen' },
        { status: 404 }
      )
    }

    // Get next round number
    const lastRoundNumber = competition.rounds[0]?.roundNumber || 0
    const nextRoundNumber = lastRoundNumber + 1

    // Get round name based on type
    const roundNames: Record<string, string> = {
      'round_of_16': 'Osmina finala',
      'quarterfinal': 'Četvrtfinale',
      'semifinal': 'Polufinale',
      'third_place': 'Utakmica za 3. mjesto',
      'final': 'Finale',
    }

    // Create knockout round
    const round = await prisma.round.create({
      data: {
        competitionId,
        roundNumber: nextRoundNumber,
        name: roundNames[knockoutType] || knockoutType,
        roundType: knockoutType,
        pointMultiplier: ROUND_MULTIPLIERS[knockoutType] || 1,
        groupNumber: null, // No group for knockout
      },
    })

    // Create matches
    await prisma.match.createMany({
      data: matches.map((m: { homeCompetitorId: number; awayCompetitorId: number }) => ({
        competitionId,
        roundId: round.id,
        homeCompetitorId: m.homeCompetitorId,
        awayCompetitorId: m.awayCompetitorId,
        status: 'scheduled',
      })),
    })

    return NextResponse.json({
      message: `${roundNames[knockoutType] || knockoutType} uspješno kreirano s ${matches.length} mečeva`,
      round,
    })
  } catch (error) {
    console.error('Knockout generation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
