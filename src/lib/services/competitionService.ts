import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Get all published competitions
 */
export const getAllCompetitions = cache(async () => {
  try {
    return await prisma.competition.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return []
  }
})

/**
 * Get competition by slug
 */
export const getCompetitionBySlug = cache(async (slug: string) => {
  try {
    return await prisma.competition.findUnique({
      where: { slug },
      include: {
        rounds: {
          include: {
            matches: {
              include: {
                homeCompetitor: true,
                awayCompetitor: true,
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
          orderBy: [
            { groupNumber: 'asc' },
            { roundNumber: 'asc' },
          ],
        },
        rankings: {
          include: {
            competitor: true,
          },
          orderBy: [
            { position: 'asc' },
            { wins: 'desc' },
            { weightedPoints: 'desc' },
          ],
        },
        _count: {
          select: {
            matches: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching competition:', error)
    return null
  }
})

/**
 * Get featured competition
 */
export const getFeaturedCompetition = cache(async () => {
  try {
    return await prisma.competition.findFirst({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            matches: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching featured competition:', error)
    return null
  }
})

/**
 * Get ongoing competitions
 */
export const getOngoingCompetitions = cache(async () => {
  try {
    return await prisma.competition.findMany({
      where: {
        isPublished: true,
        status: 'ongoing',
      },
      orderBy: {
        startDate: 'desc',
      },
    })
  } catch (error) {
    console.error('Error fetching ongoing competitions:', error)
    return []
  }
})
