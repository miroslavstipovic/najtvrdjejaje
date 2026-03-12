import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const competitor = await prisma.competitor.findUnique({
      where: { slug },
      include: {
        homeMatches: {
          include: {
            awayCompetitor: {
              select: { id: true, name: true, slug: true }
            },
            competition: {
              select: { id: true, name: true, slug: true }
            },
          },
          orderBy: {
            matchDate: 'desc',
          },
        },
        awayMatches: {
          include: {
            homeCompetitor: {
              select: { id: true, name: true, slug: true }
            },
            competition: {
              select: { id: true, name: true, slug: true }
            },
          },
          orderBy: {
            matchDate: 'desc',
          },
        },
        rankings: {
          include: {
            competition: {
              select: { id: true, name: true, slug: true }
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Natjecatelj nije pronađen' },
        { status: 404 }
      )
    }

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return NextResponse.json(
      { error: 'Greška pri dohvaćanju natjecatelja' },
      { status: 500 }
    )
  }
}
