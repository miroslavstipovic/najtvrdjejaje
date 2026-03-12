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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đ]/g, 'd')
    .replace(/[ž]/g, 'z')
    .replace(/[č]/g, 'c')
    .replace(/[ć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// GET - Lista turnira
export async function GET(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const [competitions, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              rounds: true,
              matches: true,
              rankings: true,
            },
          },
        },
      }),
      prisma.competition.count({ where }),
    ])

    return NextResponse.json({
      competitions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Competitions fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Kreiranje novog turnira s automatskim generiranjem grupa
export async function POST(request: NextRequest) {
  const decodedToken = verifyAdminToken(request)
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      coverImage,
      status,
      tournamentType,
      matchFormat,
      prizeInfo,
      isPublished,
      isFeatured,
      isHistorical,
      competitorIds,
      seedIds,
      numberOfGroups = 8,
      eggsPerCompetitor = 30,
      generateSchedule = true,
    } = body

    if (!name) {
      return NextResponse.json(
        { message: 'Naziv turnira je obavezan' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { message: 'Datum početka je obavezan' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let baseSlug = generateSlug(name)
    let slug = baseSlug
    let counter = 1

    while (await prisma.competition.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Verify all competitors exist if provided
    if (competitorIds && competitorIds.length > 0) {
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
    }

    // Determine status for historical tournaments
    const competitionStatus = isHistorical ? 'completed' : (status || 'upcoming')

    // Calculate actual number of groups based on competitors
    const actualNumberOfGroups = competitorIds && competitorIds.length > 0 
      ? Math.min(numberOfGroups, Math.floor(competitorIds.length / 2))
      : numberOfGroups

    // Create competition
    const competition = await prisma.competition.create({
      data: {
        name,
        slug,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        coverImage: coverImage || null,
        status: competitionStatus,
        tournamentType: tournamentType || 'group_knockout',
        matchFormat: matchFormat || null,
        prizeInfo: prizeInfo || null,
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        eggsPerCompetitor,
        numberOfGroups: actualNumberOfGroups,
      },
    })

    let totalRoundsCreated = 0
    let totalMatchesCreated = 0

    // If competitor IDs provided and generateSchedule is true, create groups and matches
    if (competitorIds && competitorIds.length >= 2 && generateSchedule) {
      // Fetch family groups for all competitors
      const competitorsWithFamily = await prisma.competitor.findMany({
        where: { id: { in: competitorIds } },
        select: { id: true, familyGroup: true },
      })
      const familyGroups = new Map<number, string>()
      for (const c of competitorsWithFamily) {
        if (c.familyGroup) familyGroups.set(c.id, c.familyGroup)
      }

      // Divide competitors into groups with seed and family constraints
      const { groups, error: groupError } = divideIntoGroups({
        competitorIds,
        numberOfGroups: actualNumberOfGroups,
        seedIds: seedIds || [],
        familyGroups,
      })

      if (groupError) {
        await prisma.competition.delete({ where: { id: competition.id } })
        return NextResponse.json({ message: groupError }, { status: 400 })
      }

      // Generate schedule for each group
      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        const groupCompetitors = groups[groupIndex]
        const groupNumber = groupIndex + 1

        if (groupCompetitors.length < 2) {
          // If group has only 1 competitor, they automatically advance
          // Create ranking entry but no matches
          await prisma.ranking.create({
            data: {
              competitionId: competition.id,
              competitorId: groupCompetitors[0],
              position: 1,
              points: 0,
              weightedPoints: 0,
              wins: 0,
              losses: 0,
              eggsBroken: 0,
              eggsLost: 0,
            },
          })
          continue
        }

        // Generate Berger schedule for this group
        const groupSchedule = generateBergerSchedule(groupCompetitors)
        const numRoundsInGroup = Math.max(...groupSchedule.map(m => m.round), 0)

        // Create rounds for this group
        for (let roundNum = 1; roundNum <= numRoundsInGroup; roundNum++) {
          const round = await prisma.round.create({
            data: {
              competitionId: competition.id,
              roundNumber: totalRoundsCreated + roundNum,
              name: `Grupa ${String.fromCharCode(64 + groupNumber)} - ${roundNum}. kolo`,
              roundType: 'group',
              pointMultiplier: 1,
              groupNumber,
            },
          })

          // Create matches for this round
          const roundMatches = groupSchedule.filter(m => m.round === roundNum)
          await prisma.match.createMany({
            data: roundMatches.map(m => ({
              competitionId: competition.id,
              roundId: round.id,
              homeCompetitorId: m.home,
              awayCompetitorId: m.away,
              homeEggsBroken: 0,
              awayEggsBroken: 0,
              status: 'scheduled',
            })),
          })

          totalMatchesCreated += roundMatches.length
        }

        totalRoundsCreated += numRoundsInGroup

        // Create initial rankings for competitors in this group
        await prisma.ranking.createMany({
          data: groupCompetitors.map((competitorId: number) => ({
            competitionId: competition.id,
            competitorId,
            position: 0,
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
    } else if (competitorIds && competitorIds.length > 0) {
      // Just create rankings without matches
      await prisma.ranking.createMany({
        data: competitorIds.map((competitorId: number, index: number) => ({
          competitionId: competition.id,
          competitorId,
          position: index + 1,
          points: 0,
          weightedPoints: 0,
          wins: 0,
          losses: 0,
          eggsBroken: 0,
          eggsLost: 0,
        })),
      })
    }

    // Fetch complete competition with all relations
    const completeCompetition = await prisma.competition.findUnique({
      where: { id: competition.id },
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
      ...completeCompetition,
      message: generateSchedule && competitorIds?.length >= 2
        ? `Turnir kreiran s ${totalRoundsCreated} kola i ${totalMatchesCreated} mečeva u ${actualNumberOfGroups} grupa`
        : 'Turnir kreiran',
    }, { status: 201 })
  } catch (error) {
    console.error('Competition creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
