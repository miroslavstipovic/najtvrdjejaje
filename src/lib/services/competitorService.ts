import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Get all active competitors with rankings
 */
export const getAllCompetitors = cache(async () => {
  try {
    return await prisma.competitor.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        totalEggsBroken: 'desc',
      },
    })
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return []
  }
})

/**
 * Get competitor by slug
 */
export const getCompetitorBySlug = cache(async (slug: string) => {
  try {
    return await prisma.competitor.findUnique({
      where: { slug },
      include: {
        homeMatches: {
          include: {
            awayCompetitor: true,
            competition: true,
          },
          orderBy: {
            matchDate: 'desc',
          },
        },
        awayMatches: {
          include: {
            homeCompetitor: true,
            competition: true,
          },
          orderBy: {
            matchDate: 'desc',
          },
        },
        rankings: {
          include: {
            competition: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return null
  }
})

/**
 * Get competitor statistics
 */
export const getCompetitorStats = cache(async (competitorId: number) => {
  try {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true,
          },
        },
      },
    })

    if (!competitor) return null

    const totalMatches = competitor._count.homeMatches + competitor._count.awayMatches

    return {
      totalMatches,
      wins: competitor.totalWins,
      losses: competitor.totalLosses,
      totalEggsBroken: competitor.totalEggsBroken,
      totalEggsLost: competitor.totalEggsLost,
      winRate: totalMatches > 0 ? (competitor.totalWins / totalMatches) * 100 : 0,
    }
  } catch (error) {
    console.error('Error fetching competitor stats:', error)
    return null
  }
})
