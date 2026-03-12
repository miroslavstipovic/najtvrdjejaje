import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * Get global ranking (all time)
 */
export const getGlobalRanking = cache(async () => {
  try {
    // Global ranking where competitionId is null
    const rankings = await prisma.ranking.findMany({
      where: {
        competitionId: null,
      },
      include: {
        competitor: true,
      },
      orderBy: {
        position: 'asc',
      },
    })

    // If no global rankings exist, create from BRJ (total eggs broken)
    if (rankings.length === 0) {
      const competitors = await prisma.competitor.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          totalEggsBroken: 'desc',
        },
      })

      return competitors.map((competitor, index) => ({
        id: 0,
        competitionId: null,
        competitorId: competitor.id,
        position: index + 1,
        points: 0,
        wins: competitor.totalWins,
        losses: competitor.totalLosses,
        eggsBroken: competitor.totalEggsBroken,
        eggsLost: competitor.totalEggsLost,
        weightedPoints: 0,
        updatedAt: new Date(),
        competitor,
        competition: null,
      }))
    }

    return rankings
  } catch (error) {
    console.error('Error fetching global ranking:', error)
    return []
  }
})

/**
 * Get ranking by competition
 */
export const getRankingByCompetition = cache(async (competitionId: number) => {
  try {
    return await prisma.ranking.findMany({
      where: {
        competitionId,
      },
      include: {
        competitor: true,
        competition: true,
      },
      orderBy: {
        position: 'asc',
      },
    })
  } catch (error) {
    console.error('Error fetching competition ranking:', error)
    return []
  }
})

/**
 * Get all competitions with their rankings
 */
export const getAllRankings = cache(async () => {
  try {
    const competitions = await prisma.competition.findMany({
      where: {
        isPublished: true,
      },
      include: {
        rankings: {
          include: {
            competitor: true,
          },
          orderBy: {
            position: 'asc',
          },
          take: 10, // Top 10 per competition
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return competitions
  } catch (error) {
    console.error('Error fetching all rankings:', error)
    return []
  }
})
