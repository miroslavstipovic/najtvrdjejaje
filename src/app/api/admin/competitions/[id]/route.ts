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

// Helper function to generate slug
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

// GET - Dohvat pojedinačnog turnira s detaljima
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

    if (isNaN(competitionId)) {
      return NextResponse.json(
        { message: 'Invalid competition ID' },
        { status: 400 }
      )
    }

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            matches: {
              include: {
                homeCompetitor: { select: { id: true, name: true, slug: true, totalEggsBroken: true } },
                awayCompetitor: { select: { id: true, name: true, slug: true, totalEggsBroken: true } },
              },
              orderBy: { id: 'asc' },
            },
          },
        },
        rankings: {
          orderBy: { position: 'asc' },
          include: {
            competitor: { select: { id: true, name: true, slug: true, totalEggsBroken: true, profileImage: true } },
          },
        },
        matches: {
          include: {
            homeCompetitor: { select: { id: true, name: true, slug: true } },
            awayCompetitor: { select: { id: true, name: true, slug: true } },
            round: { select: { id: true, name: true, roundNumber: true } },
          },
          orderBy: [{ round: { roundNumber: 'asc' } }, { id: 'asc' }],
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

    if (!competition) {
      return NextResponse.json(
        { message: 'Turnir nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Competition fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Ažuriranje turnira
export async function PATCH(
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
    } = body

    // Check if competition exists
    const existingCompetition = await prisma.competition.findUnique({
      where: { id: competitionId },
    })

    if (!existingCompetition) {
      return NextResponse.json(
        { message: 'Turnir nije pronađen' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) {
      updateData.name = name
      // Update slug if name changed
      if (name !== existingCompetition.name) {
        let baseSlug = generateSlug(name)
        let slug = baseSlug
        let counter = 1

        while (true) {
          const existing = await prisma.competition.findUnique({ where: { slug } })
          if (!existing || existing.id === competitionId) break
          slug = `${baseSlug}-${counter}`
          counter++
        }
        updateData.slug = slug
      }
    }

    if (description !== undefined) updateData.description = description || null
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (location !== undefined) updateData.location = location || null
    if (coverImage !== undefined) updateData.coverImage = coverImage || null
    if (status !== undefined) updateData.status = status
    if (tournamentType !== undefined) updateData.tournamentType = tournamentType
    if (matchFormat !== undefined) updateData.matchFormat = matchFormat || null
    if (prizeInfo !== undefined) updateData.prizeInfo = prizeInfo || null
    if (isPublished !== undefined) updateData.isPublished = isPublished
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured

    const competition = await prisma.competition.update({
      where: { id: competitionId },
      data: updateData,
      include: {
        _count: {
          select: {
            rounds: true,
            matches: true,
            rankings: true,
          },
        },
      },
    })

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Competition update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Brisanje turnira
export async function DELETE(
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

    // Delete will cascade to rounds, matches, and rankings due to onDelete: Cascade
    await prisma.competition.delete({
      where: { id: competitionId },
    })

    return NextResponse.json({ message: 'Turnir uspješno obrisan' })
  } catch (error) {
    console.error('Competition delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
