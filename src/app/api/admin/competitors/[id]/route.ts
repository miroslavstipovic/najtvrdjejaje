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

// GET - Dohvat pojedinačnog natjecatelja
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
    const competitorId = parseInt(id)

    if (isNaN(competitorId)) {
      return NextResponse.json(
        { message: 'Invalid competitor ID' },
        { status: 400 }
      )
    }

    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        homeMatches: {
          include: {
            awayCompetitor: { select: { id: true, name: true, slug: true } },
            competition: { select: { id: true, name: true, slug: true } },
            round: { select: { id: true, name: true, roundNumber: true } },
          },
          orderBy: { matchDate: 'desc' },
          take: 10,
        },
        awayMatches: {
          include: {
            homeCompetitor: { select: { id: true, name: true, slug: true } },
            competition: { select: { id: true, name: true, slug: true } },
            round: { select: { id: true, name: true, roundNumber: true } },
          },
          orderBy: { matchDate: 'desc' },
          take: 10,
        },
        rankings: {
          include: {
            competition: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            rankings: true,
          },
        },
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { message: 'Natjecatelj nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Competitor fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Ažuriranje natjecatelja
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
    const competitorId = parseInt(id)

    if (isNaN(competitorId)) {
      return NextResponse.json(
        { message: 'Invalid competitor ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      city,
      country,
      profileImage,
      bio,
      isActive,
      familyGroup,
      totalWins,
      totalLosses,
      totalEggsBroken,
      totalEggsLost,
    } = body

    // Check if competitor exists
    const existingCompetitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
    })

    if (!existingCompetitor) {
      return NextResponse.json(
        { message: 'Natjecatelj nije pronađen' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) {
      updateData.name = name
      // Update slug if name changed
      if (name !== existingCompetitor.name) {
        let baseSlug = generateSlug(name)
        let slug = baseSlug
        let counter = 1

        while (true) {
          const existing = await prisma.competitor.findUnique({ where: { slug } })
          if (!existing || existing.id === competitorId) break
          slug = `${baseSlug}-${counter}`
          counter++
        }
        updateData.slug = slug
      }
    }

    if (email !== undefined) {
      if (email && email !== existingCompetitor.email) {
        const existingEmail = await prisma.competitor.findUnique({
          where: { email },
        })
        if (existingEmail && existingEmail.id !== competitorId) {
          return NextResponse.json(
            { message: 'Email adresa je već u upotrebi' },
            { status: 400 }
          )
        }
      }
      updateData.email = email || null
    }

    if (phone !== undefined) updateData.phone = phone || null
    if (city !== undefined) updateData.city = city || null
    if (country !== undefined) updateData.country = country || 'Bosna i Hercegovina'
    if (profileImage !== undefined) updateData.profileImage = profileImage || null
    if (bio !== undefined) updateData.bio = bio || null
    if (familyGroup !== undefined) updateData.familyGroup = familyGroup || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (totalWins !== undefined) updateData.totalWins = parseInt(totalWins)
    if (totalLosses !== undefined) updateData.totalLosses = parseInt(totalLosses)
    // BRJ statistika - ručna promjena
    if (totalEggsBroken !== undefined) updateData.totalEggsBroken = parseInt(totalEggsBroken)
    if (totalEggsLost !== undefined) updateData.totalEggsLost = parseInt(totalEggsLost)

    const competitor = await prisma.competitor.update({
      where: { id: competitorId },
      data: updateData,
      include: {
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
            rankings: true,
          },
        },
      },
    })

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Competitor update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Brisanje natjecatelja
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
    const competitorId = parseInt(id)

    if (isNaN(competitorId)) {
      return NextResponse.json(
        { message: 'Invalid competitor ID' },
        { status: 400 }
      )
    }

    // Check if competitor has matches
    const matchCount = await prisma.match.count({
      where: {
        OR: [
          { homeCompetitorId: competitorId },
          { awayCompetitorId: competitorId },
        ],
      },
    })

    if (matchCount > 0) {
      return NextResponse.json(
        {
          message: `Nije moguće obrisati natjecatelja koji ima ${matchCount} mečeva. Prvo obrišite mečeve.`,
        },
        { status: 400 }
      )
    }

    // Delete related rankings first
    await prisma.ranking.deleteMany({
      where: { competitorId },
    })

    // Delete competitor
    await prisma.competitor.delete({
      where: { id: competitorId },
    })

    return NextResponse.json({ message: 'Natjecatelj uspješno obrisan' })
  } catch (error) {
    console.error('Competitor delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
