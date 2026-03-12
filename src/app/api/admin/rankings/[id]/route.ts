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

// GET - Dohvat pojedinačnog rankinga
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
    const rankingId = parseInt(id)

    if (isNaN(rankingId)) {
      return NextResponse.json(
        { message: 'Invalid ranking ID' },
        { status: 400 }
      )
    }

    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      include: {
        competitor: true,
        competition: true,
      },
    })

    if (!ranking) {
      return NextResponse.json(
        { message: 'Rang nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(ranking)
  } catch (error) {
    console.error('Ranking fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Ručna korekcija pozicije/bodova
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
    const rankingId = parseInt(id)

    if (isNaN(rankingId)) {
      return NextResponse.json(
        { message: 'Invalid ranking ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { position, points, wins, losses, draws, eggsBroken, eggsLost } = body

    // Check if ranking exists
    const existingRanking = await prisma.ranking.findUnique({
      where: { id: rankingId },
    })

    if (!existingRanking) {
      return NextResponse.json(
        { message: 'Rang nije pronađen' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (position !== undefined) updateData.position = position
    if (points !== undefined) updateData.points = points
    if (wins !== undefined) updateData.wins = wins
    if (losses !== undefined) updateData.losses = losses
    if (draws !== undefined) updateData.draws = draws
    if (eggsBroken !== undefined) updateData.eggsBroken = eggsBroken
    if (eggsLost !== undefined) updateData.eggsLost = eggsLost

    const ranking = await prisma.ranking.update({
      where: { id: rankingId },
      data: updateData,
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

    return NextResponse.json(ranking)
  } catch (error) {
    console.error('Ranking update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Brisanje rankinga
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
    const rankingId = parseInt(id)

    if (isNaN(rankingId)) {
      return NextResponse.json(
        { message: 'Invalid ranking ID' },
        { status: 400 }
      )
    }

    await prisma.ranking.delete({
      where: { id: rankingId },
    })

    return NextResponse.json({ message: 'Rang uspješno obrisan' })
  } catch (error) {
    console.error('Ranking delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
