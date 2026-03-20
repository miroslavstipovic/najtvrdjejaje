import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Get all active competitors with their global ranking data
 */
export const getAllCompetitors = cache(async () => {
  try {
    const competitors = await prisma.competitor.findMany({
      where: {
        isActive: true,
      },
      include: {
        rankings: {
          where: { competitionId: null },
          select: {
            position: true,
            weightedPoints: true,
            wins: true,
            losses: true,
            eggsBroken: true,
            eggsLost: true,
          },
          take: 1,
        },
      },
    })

    return competitors
      .map((c) => {
        const globalRank = c.rankings[0] || null
        return {
          ...c,
          globalPosition: globalRank?.position ?? null,
          globalWeightedPoints: globalRank?.weightedPoints ?? 0,
        }
      })
      .sort((a, b) => {
        if (a.globalPosition === null && b.globalPosition === null) return 0
        if (a.globalPosition === null) return 1
        if (b.globalPosition === null) return -1
        return a.globalPosition - b.globalPosition
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
